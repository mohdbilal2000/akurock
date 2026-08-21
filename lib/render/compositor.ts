import type { Mat3, Rect } from "@/lib/geometry/types";
import {
  computeNormalizedLuminanceMask,
  encodeMultiplierByte,
} from "@/lib/geometry/luminance";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

export interface CompositorParams {
  photo: TexImageSource;
  photoWidth: number;
  photoHeight: number;
  panelTexture: TexImageSource;
  /** Image px -> wall mm, from lib/geometry/wallPlane's imageToWall. */
  imageToWallMm: Mat3;
  coverageMm: Rect;
  /** Effective panel footprint in wall mm, already oriented (see config/panels.ts). */
  panelSizeMm: { width: number; height: number };
  edgeWidthMm?: number;
}

/** Row-major [a,b,c,d,e,f,g,h,i] -> column-major Float32Array for uniformMatrix3fv. */
function toColumnMajor(m: Mat3): Float32Array {
  const [a, b, c, d, e, f, g, h, i] = m;
  return new Float32Array([a, d, g, b, e, h, c, f, i]);
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

function createTexture(
  gl: WebGLRenderingContext,
  image: TexImageSource,
  format: number,
): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
  // Tiling is done manually in the shader via mod(), so hardware REPEAT is
  // never needed — and WebGL1 can't do REPEAT on non-power-of-two images
  // (which every real photo/texture here is) without rendering black.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

/**
 * Owns a single WebGL program that composites the panel texture onto a room
 * photo using a projective (homography) warp, done per-pixel in the
 * fragment shader — see lib/render/shaders.ts for the "why".
 */
export class WallCompositor {
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly uniforms: Record<string, WebGLUniformLocation | null>;

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

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = {};
    for (const name of [
      "uPhotoTex",
      "uPanelTex",
      "uLumTex",
      "uImageSize",
      "uImageToWallMm",
      "uCoverageMm",
      "uPanelSizeMm",
      "uEdgeWidthMm",
    ]) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  /** Draws the current photo + tiled panel texture using the given wall geometry. */
  render(params: CompositorParams): void {
    const { gl } = this;
    const { photoWidth, photoHeight } = params;

    this.canvas.width = photoWidth;
    this.canvas.height = photoHeight;
    gl.viewport(0, 0, photoWidth, photoHeight);
    gl.useProgram(this.program);

    const photoTex = createTexture(gl, params.photo, gl.RGBA);
    const panelTex = createTexture(gl, params.panelTexture, gl.RGBA);
    const lumTex = this.buildLuminanceTexture(params.photo, photoWidth, photoHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, photoTex);
    gl.uniform1i(this.uniforms.uPhotoTex, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, panelTex);
    gl.uniform1i(this.uniforms.uPanelTex, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, lumTex);
    gl.uniform1i(this.uniforms.uLumTex, 2);

    gl.uniform2f(this.uniforms.uImageSize, photoWidth, photoHeight);
    gl.uniformMatrix3fv(this.uniforms.uImageToWallMm, false, toColumnMajor(params.imageToWallMm));
    gl.uniform4f(
      this.uniforms.uCoverageMm,
      params.coverageMm.x,
      params.coverageMm.y,
      params.coverageMm.width,
      params.coverageMm.height,
    );
    gl.uniform2f(this.uniforms.uPanelSizeMm, params.panelSizeMm.width, params.panelSizeMm.height);
    gl.uniform1f(this.uniforms.uEdgeWidthMm, params.edgeWidthMm ?? 4);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.deleteTexture(photoTex);
    gl.deleteTexture(panelTex);
    gl.deleteTexture(lumTex);
  }

  /** Computes the mean-normalised L* mask (lib/geometry/luminance) and uploads it as a LUMINANCE texture. */
  private buildLuminanceTexture(
    photo: TexImageSource,
    width: number,
    height: number,
  ): WebGLTexture {
    const { gl } = this;
    const scratch = document.createElement("canvas");
    scratch.width = width;
    scratch.height = height;
    const ctx = scratch.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable for luminance sampling");
    ctx.drawImage(photo as CanvasImageSource, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    const mask = computeNormalizedLuminanceMask({
      width,
      height,
      data: imageData.data,
    });

    const bytes = new Uint8Array(width * height);
    for (let i = 0; i < mask.values.length; i++) {
      bytes[i] = encodeMultiplierByte(mask.values[i]);
    }

    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create luminance texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
  }
}
