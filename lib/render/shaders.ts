/**
 * Single-pass fragment-shader warp: for every screen pixel (which lines up
 * 1:1 with the room photo), map it through the image->wall-mm homography;
 * inside the coverage rect, tile the panel texture in wall-mm space and
 * multiply in the photo's luminance mask; outside it, just show the photo.
 * This keeps the perspective warp exact (a true projective transform, not
 * an approximation) while staying a single draw call.
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
uniform sampler2D uPanelTex;
uniform sampler2D uLumTex;

uniform vec2 uImageSize;      // photo size in px
uniform mat3 uImageToWallMm;  // homography: image px -> wall mm
uniform vec4 uCoverageMm;     // x, y, width, height in wall mm
uniform vec2 uPanelSizeMm;    // effective panel footprint, oriented
uniform float uEdgeWidthMm;   // slat-edge shadow line thickness

void main() {
  vec4 photoColor = texture2D(uPhotoTex, vUv);

  vec2 imagePx = vUv * uImageSize;
  vec3 wallH = uImageToWallMm * vec3(imagePx, 1.0);
  vec2 wallMm = wallH.xy / wallH.z;

  bool inside =
    wallMm.x >= uCoverageMm.x &&
    wallMm.x <= uCoverageMm.x + uCoverageMm.z &&
    wallMm.y >= uCoverageMm.y &&
    wallMm.y <= uCoverageMm.y + uCoverageMm.w;

  if (!inside) {
    gl_FragColor = photoColor;
    return;
  }

  vec2 localMm = wallMm - uCoverageMm.xy;
  vec2 panelUv = mod(localMm, uPanelSizeMm) / uPanelSizeMm;
  vec4 panelColor = texture2D(uPanelTex, panelUv);

  float lumByte = texture2D(uLumTex, vUv).r;
  float lum = lumByte * 2.0; // see encodeMultiplierByte/decodeMultiplierByte

  vec3 shaded = panelColor.rgb * lum;

  // Cheap inner-shadow line at panel edges (real panels sit ~20mm proud).
  vec2 distToEdge = min(mod(localMm, uPanelSizeMm), uPanelSizeMm - mod(localMm, uPanelSizeMm));
  float edge = min(distToEdge.x, distToEdge.y);
  float edgeShade = smoothstep(0.0, uEdgeWidthMm, edge);
  shaded *= mix(0.72, 1.0, edgeShade);

  gl_FragColor = vec4(shaded, 1.0);
}
`;
