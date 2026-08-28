/**
 * Single-pass fragment-shader composite: every screen pixel (1:1 with the
 * room photo) is mapped through the image→wall-mm homography; inside the
 * coverage rect the slat pattern is generated PROCEDURALLY from the real
 * panel spec (42mm slat / 64mm pitch / felt groove) — the stone texture
 * only supplies material grain. That keeps slat width and count physically
 * exact regardless of how the texture photos were composed, which is the
 * whole point of the deterministic layer.
 */

export const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  // aPosition is a clip-space quad [-1,1]; derive UV in [0,1] with Y flipped
  // to match how images are uploaded to WebGL textures (top-left origin).
  vUv = vec2((aPosition.x + 1.0) * 0.5, 1.0 - (aPosition.y + 1.0) * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPhotoTex;
uniform sampler2D uStoneTex;
uniform sampler2D uLumTex;

uniform vec2 uImageSize;      // photo size in px
uniform mat3 uImageToWallMm;  // homography: image px -> wall mm
uniform vec4 uCoverageMm;     // x, y, width, height in wall mm
uniform vec2 uWallSizeMm;     // full wall width/height in mm

uniform float uSlatPitchMm;   // 64
uniform float uSlatWidthMm;   // 42
uniform float uPanelLenMm;    // 2400 (panel length along the slat direction)
uniform float uSlatsVertical; // 1.0 = slats run vertically on the wall
uniform vec3  uFeltColor;     // groove (acoustic felt) colour per finish
uniform vec2  uStoneScaleMm;  // physical mm the stone texture spans
uniform float uAAmm;          // ~1 screen px expressed in wall mm (for smoothing)

float aa(float edge, float x) {
  return smoothstep(edge - uAAmm, edge + uAAmm, x);
}

void main() {
  vec4 photoColor = texture2D(uPhotoTex, vUv);

  vec2 imagePx = vUv * uImageSize;
  vec3 wallH = uImageToWallMm * vec3(imagePx, 1.0);
  vec2 wallMm = wallH.xy / wallH.z;

  // Signed distances to the coverage rect (positive = inside).
  float dLeft   = wallMm.x - uCoverageMm.x;
  float dRight  = uCoverageMm.x + uCoverageMm.z - wallMm.x;
  float dTop    = wallMm.y - uCoverageMm.y;
  float dBottom = uCoverageMm.y + uCoverageMm.w - wallMm.y;
  float dInside = min(min(dLeft, dRight), min(dTop, dBottom));

  // Soft contact shadow just outside the panels (they sit 23mm proud of
  // the wall), strongest below the bottom edge, fading over ~35mm.
  if (dInside < 0.0) {
    float dOut = -dInside;
    float below = clamp(-dBottom / max(dOut, 0.001), 0.0, 1.0);
    float weight = 0.45 + 0.55 * below;
    float shadow = (1.0 - smoothstep(0.0, 35.0, dOut)) * 0.22 * weight;
    // Only shade points that are on the wall plane's lower/side spill.
    gl_FragColor = vec4(photoColor.rgb * (1.0 - shadow), 1.0);
    return;
  }

  vec2 localMm = wallMm - uCoverageMm.xy;

  // Slat coordinate frame: 'across' runs perpendicular to the slats.
  float across = mix(localMm.y, localMm.x, uSlatsVertical);
  float along  = mix(localMm.x, localMm.y, uSlatsVertical);

  float grooveW = uSlatPitchMm - uSlatWidthMm;   // 22mm felt gap
  float grooveHalf = grooveW * 0.5;
  // Shift so mod()'s wrap point lands mid-groove: the pattern is then
  // [half groove | slat face | half groove] with no discontinuity at wrap.
  float q = mod(across + grooveHalf, uSlatPitchMm);
  float faceStart = grooveHalf;
  float faceEnd = grooveHalf + uSlatWidthMm;

  // 0 in the groove, 1 on the slat face, antialiased at both edges.
  float onFace = aa(faceStart, q) * (1.0 - aa(faceEnd, q));

  // Stone grain, sampled continuously in wall space at physical scale.
  vec2 stoneUv = fract(wallMm / uStoneScaleMm);
  vec3 stone = texture2D(uStoneTex, stoneUv).rgb;

  // Slat face relief. A 23mm-deep bar lit from the upper left reads as three
  // tones, not one: a bright leading edge, a broad diffuse face, and a
  // darker trailing edge where the neighbouring slat occludes it. Shading
  // the face as a single flat tone is what made this look like paint.
  float t = clamp((q - faceStart) / uSlatWidthMm, 0.0, 1.0);

  // Chamfer: the outer ~2.5mm of each face rolls over towards the groove.
  float chamfer = 2.5 / uSlatWidthMm;
  float lead  = 1.0 - smoothstep(0.0, chamfer, t);           // light-facing edge
  float trail = smoothstep(1.0 - chamfer, 1.0, t);           // shadowed edge

  // Broad cosine falloff across the face — a cylinder-ish body, brighter
  // toward the light side rather than uniformly flat.
  float body = 0.86 + 0.14 * cos((t - 0.32) * 3.14159);

  float faceShade = body + lead * 0.22 - trail * 0.30;

  // Ambient occlusion creeping in from both grooves.
  float ao = smoothstep(0.0, 0.16, min(t, 1.0 - t));
  faceShade *= mix(0.80, 1.0, ao);
  vec3 faceColor = stone * clamp(faceShade, 0.0, 1.6);

  // Groove: the felt sits 23mm back, so it is mostly ambient. Darkest at the
  // centre of the gap where least sky reaches, and it never picks up the
  // full face brightness.
  float distToFace = q < faceStart ? (faceStart - q) : max(q - faceEnd, 0.0);
  float depth = clamp(distToFace / max(grooveHalf, 0.001), 0.0, 1.0);
  float grooveLight = mix(0.52, 0.16, depth * depth);
  vec3 grooveColor = uFeltColor * grooveLight;

  // Cast shadow from the slat edge onto the felt just inside the groove.
  float edgeCast = 1.0 - smoothstep(0.0, grooveHalf * 0.9, distToFace);
  grooveColor *= mix(1.0, 0.75, edgeCast * step(faceEnd, q));

  vec3 panelColor = mix(grooveColor, faceColor, onFace);

  // Panel butt joints every panel length along the slat direction.
  float seam = mod(along, uPanelLenMm);
  float seamDist = min(seam, uPanelLenMm - seam);
  panelColor *= mix(0.8, 1.0, aa(2.0, seamDist));

  // Luminance transfer: keep the photo's real shadows and light falloff.
  float lum = texture2D(uLumTex, vUv).r * 2.0; // see encodeMultiplierByte
  panelColor *= lum;

  // Feather the outer edge over ~1.5px so the cut doesn't alias.
  float edgeAlpha = smoothstep(0.0, uAAmm * 1.5, dInside);
  vec3 outColor = mix(photoColor.rgb, panelColor, edgeAlpha);

  gl_FragColor = vec4(outColor, 1.0);
}
`;
