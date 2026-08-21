/**
 * Luminance transfer: lift the L* channel out of the original wall photo and
 * turn it into a per-pixel multiplier (mean-normalised to ~1.0) that gets
 * multiplied into the tiled panel texture at render time. This is what keeps
 * real shadows and light falloff from the source photo instead of pasting a
 * flatly-lit texture over a wall that clearly wasn't lit flatly.
 *
 * Pure pixel-buffer math so it can run outside the DOM (Vitest) — callers
 * pass in `{width, height, data}` rather than a browser ImageData.
 */

export interface PixelBuffer {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, length === width*height*4. */
  data: Uint8ClampedArray;
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** CIE L* (0-100) for a single sRGB pixel. */
export function rgbToLabL(r: number, g: number, b: number): number {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  // sRGB -> XYZ (D65), Y channel only — that's all L* needs.
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;

  const yn = y / 1.0; // Yn = 1 for D65 white
  const fy = yn > 0.008856 ? Math.cbrt(yn) : 7.787 * yn + 16 / 116;
  return Math.max(0, Math.min(100, 116 * fy - 16));
}

export interface LuminanceMask {
  width: number;
  height: number;
  /** Multiplier per pixel, mean-normalised so the average is ~1.0. */
  values: Float32Array;
  meanL: number;
}

/**
 * Computes a mean-normalised luminance multiplier for every pixel in
 * `pixels`, clamped to [minMultiplier, maxMultiplier] so deep shadows or
 * blown highlights in the source photo don't crush the panel texture to
 * black/white.
 */
export function computeNormalizedLuminanceMask(
  pixels: PixelBuffer,
  opts: { minMultiplier?: number; maxMultiplier?: number } = {},
): LuminanceMask {
  const { minMultiplier = 0.4, maxMultiplier = 1.8 } = opts;
  const { width, height, data } = pixels;
  const count = width * height;
  const ls = new Float32Array(count);

  let sum = 0;
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const l = rgbToLabL(data[o], data[o + 1], data[o + 2]);
    ls[i] = l;
    sum += l;
  }
  const meanL = count > 0 ? sum / count : 50;
  const safeMean = meanL < 1e-6 ? 1e-6 : meanL;

  const values = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const m = ls[i] / safeMean;
    values[i] = Math.max(minMultiplier, Math.min(maxMultiplier, m));
  }

  return { width, height, values, meanL };
}

/** Packs a luminance multiplier (expected range ~[0,2]) into a byte for a LUMINANCE texture. */
export function encodeMultiplierByte(multiplier: number): number {
  return Math.max(0, Math.min(255, Math.round((multiplier / 2) * 255)));
}

/** Inverse of encodeMultiplierByte — what the fragment shader does after texture() normalises to [0,1]. */
export function decodeMultiplierByte(normalizedByte: number): number {
  return normalizedByte * 2;
}
