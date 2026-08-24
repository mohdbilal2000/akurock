import type { Mat3, Rect } from "@/lib/geometry/types";
import { applyHomography } from "@/lib/geometry/homography";
import {
  computeNormalizedLuminanceMask,
  encodeMultiplierByte,
} from "@/lib/geometry/luminance";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

export interface RenderOptions {
  /** Which cached stone texture to use (see setStoneTexture). */
  stoneSlug: string;
  /** Image px -> wall mm, from lib/geometry/wallPlane's imageToWall. */
  imageToWallMm: Mat3;
  coverageMm: Rect;
  wallWidthMm: number;
  wallHeightMm: number;
  slatsVertical: boolean;
  /** Groove (felt) colour as a CSS hex like "#b9b8bc". */
  feltHex: string;
  slatPitchMm: number;
  slatWidthMm: number;
  panelLengthMm: number;
  /** Physical mm the stone texture image spans (e.g. 600 x 2400). */
  stoneScaleMm: { width: number; height: number };
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.15, 0.15, 0.15];
  const v = parseInt(m[1], 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

/** Row-major [a..i] -> column-major Float32Array for uniformMatrix3fv. */
function toColumnMajor(m: Mat3): Float32Array {
  const [a, b, c, d, e, f, g, h, i] = m;
  return new Float32Array([a, d, g, b, e, h, c, f, i]);
}

const UNIFORM_NAMES = [
  "uPhotoTex",
  "uStoneTex",
  "uLumTex",
  "uImageSize",
  "uImageToWallMm",
  "uCoverageMm",
  "uWallSizeMm",
  "uSlatPitchMm",
  "uSlatWidthMm",
  "uPanelLenMm",
  "uSlatsVertical",
  "uFeltColor",
  "uStoneScaleMm",
  "uAAmm",
] as const;

/**
 * Owns one WebGL program compositing procedural slat panels onto a room
 * photo via a per-pixel homography warp (lib/render/shaders.ts). The photo,
 * its luminance mask, and each finish's stone texture are uploaded once and
 * cached, so render() is a single cheap draw call — fast enough to run on
 * every pointermove while the user drags handles.
 */
export class WallCompositor {
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly uniforms = new Map<string, WebGLUniformLocation | null>();
  private readonly stoneTextures = new Map<string, WebGLTexture>();
  private photoTexture: WebGLTexture | null = null;
  private lumTexture: WebGLTexture | null = null;
  private photoWidth = 0;
  private photoHeight = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL is not available in this browser");
    this.gl = gl;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create WebGL program");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }
    this.program = program;
    gl.useProgram(program);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    for (const name of UNIFORM_NAMES) {
      this.uniforms.set(name, gl.getUniformLocation(program, name));
    }
  }

  private uploadTexture(image: TexImageSource): WebGLTexture {
    const { gl } = this;
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // Tiling is done via fract() in the shader; WebGL1 can't REPEAT on
    // non-power-of-two images anyway (renders black), so clamp.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  /**
   * Uploads the room photo and computes+uploads its Lab* luminance mask.
   * Call once per photo — every subsequent render() reuses both textures.
   */
  setPhoto(photo: TexImageSource & CanvasImageSource, width: number, height: number): void {
    const { gl } = this;
    if (this.photoTexture) gl.deleteTexture(this.photoTexture);
    if (this.lumTexture) gl.deleteTexture(this.lumTexture);

    this.photoWidth = width;
    this.photoHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.photoTexture = this.uploadTexture(photo);

    const scratch = document.createElement("canvas");
    scratch.width = width;
    scratch.height = height;
    const ctx = scratch.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D context unavailable for luminance sampling");
    ctx.drawImage(photo, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    const mask = computeNormalizedLuminanceMask({ width, height, data: imageData.data });
    const bytes = new Uint8Array(width * height);
    for (let i = 0; i < mask.values.length; i++) {
      bytes[i] = encodeMultiplierByte(mask.values[i]);
    }

    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create luminance texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.lumTexture = tex;
  }

  /** Uploads and caches one finish's stone texture under its slug. */
  setStoneTexture(slug: string, image: TexImageSource): void {
    if (this.stoneTextures.has(slug)) return;
    this.stoneTextures.set(slug, this.uploadTexture(image));
  }

  hasStoneTexture(slug: string): boolean {
    return this.stoneTextures.has(slug);
  }

  hasPhoto(): boolean {
    return this.photoTexture !== null;
  }

  /**
   * One draw call using the cached textures. Throws if setPhoto or the
   * requested stone texture hasn't been loaded yet.
   */
  render(opts: RenderOptions): void {
    const { gl } = this;
    const stoneTex = this.stoneTextures.get(opts.stoneSlug);
    if (!this.photoTexture || !this.lumTexture) throw new Error("render() before setPhoto()");
    if (!stoneTex) throw new Error(`Stone texture "${opts.stoneSlug}" not loaded`);

    gl.viewport(0, 0, this.photoWidth, this.photoHeight);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.photoTexture);
    gl.uniform1i(this.uniforms.get("uPhotoTex")!, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, stoneTex);
    gl.uniform1i(this.uniforms.get("uStoneTex")!, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.lumTexture);
    gl.uniform1i(this.uniforms.get("uLumTex")!, 2);

    gl.uniform2f(this.uniforms.get("uImageSize")!, this.photoWidth, this.photoHeight);
    gl.uniformMatrix3fv(this.uniforms.get("uImageToWallMm")!, false, toColumnMajor(opts.imageToWallMm));
    gl.uniform4f(
      this.uniforms.get("uCoverageMm")!,
      opts.coverageMm.x,
      opts.coverageMm.y,
      opts.coverageMm.width,
      opts.coverageMm.height,
    );
    gl.uniform2f(this.uniforms.get("uWallSizeMm")!, opts.wallWidthMm, opts.wallHeightMm);
    gl.uniform1f(this.uniforms.get("uSlatPitchMm")!, opts.slatPitchMm);
    gl.uniform1f(this.uniforms.get("uSlatWidthMm")!, opts.slatWidthMm);
    gl.uniform1f(this.uniforms.get("uPanelLenMm")!, opts.panelLengthMm);
    gl.uniform1f(this.uniforms.get("uSlatsVertical")!, opts.slatsVertical ? 1 : 0);
    const [r, g, b] = hexToRgb(opts.feltHex);
    gl.uniform3f(this.uniforms.get("uFeltColor")!, r, g, b);
    gl.uniform2f(this.uniforms.get("uStoneScaleMm")!, opts.stoneScaleMm.width, opts.stoneScaleMm.height);
    gl.uniform1f(this.uniforms.get("uAAmm")!, estimateAAmm(opts, this.photoWidth, this.photoHeight));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose(): void {
    const { gl } = this;
    if (this.photoTexture) gl.deleteTexture(this.photoTexture);
    if (this.lumTexture) gl.deleteTexture(this.lumTexture);
    for (const tex of this.stoneTextures.values()) gl.deleteTexture(tex);
    this.stoneTextures.clear();
    gl.deleteProgram(this.program);
  }
}

/**
 * Approximates how many wall-mm one screen pixel spans at the coverage
 * centre — the smoothing width the shader needs for clean antialiased
 * slat edges without derivative extensions.
 */
export function estimateAAmm(
  opts: Pick<RenderOptions, "imageToWallMm" | "coverageMm">,
  photoWidth: number,
  photoHeight: number,
): number {
  // Find the image-space point that maps near the coverage centre by
  // sampling the inverse direction: probe pixel steps at the photo centre.
  void opts.coverageMm;
  const cx = photoWidth / 2;
  const cy = photoHeight / 2;
  const p0 = applyHomography(opts.imageToWallMm, { x: cx, y: cy });
  const p1 = applyHomography(opts.imageToWallMm, { x: cx + 1, y: cy + 1 });
  const mmPerPx = Math.hypot(p1.x - p0.x, p1.y - p0.y) / Math.SQRT2;
  return Math.min(20, Math.max(0.4, mmPerPx * 0.75));
}
