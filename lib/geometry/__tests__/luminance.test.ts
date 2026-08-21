import { describe, expect, it } from "vitest";
import {
  computeNormalizedLuminanceMask,
  decodeMultiplierByte,
  encodeMultiplierByte,
  rgbToLabL,
} from "../luminance";
import type { PixelBuffer } from "../luminance";

function solid(width: number, height: number, r: number, g: number, b: number): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe("rgbToLabL", () => {
  it("black is L=0, white is L=100", () => {
    expect(rgbToLabL(0, 0, 0)).toBeCloseTo(0, 3);
    expect(rgbToLabL(255, 255, 255)).toBeCloseTo(100, 1);
  });

  it("is monotonic with brightness", () => {
    const dark = rgbToLabL(40, 40, 40);
    const mid = rgbToLabL(120, 120, 120);
    const bright = rgbToLabL(220, 220, 220);
    expect(dark).toBeLessThan(mid);
    expect(mid).toBeLessThan(bright);
  });
});

describe("computeNormalizedLuminanceMask", () => {
  it("a flat-lit photo normalises to ~1.0 everywhere", () => {
    const mask = computeNormalizedLuminanceMask(solid(4, 4, 180, 180, 180));
    for (const v of mask.values) {
      expect(v).toBeCloseTo(1, 5);
    }
  });

  it("darker-than-average pixels get a multiplier below 1, brighter ones above", () => {
    const width = 2;
    const height = 1;
    const data = new Uint8ClampedArray(width * height * 4);
    // pixel 0: dark, pixel 1: bright
    data.set([20, 20, 20, 255], 0);
    data.set([230, 230, 230, 255], 4);
    const mask = computeNormalizedLuminanceMask({ width, height, data });
    expect(mask.values[0]).toBeLessThan(1);
    expect(mask.values[1]).toBeGreaterThan(1);
  });

  it("clamps extreme multipliers to the configured range", () => {
    const width = 2;
    const height = 1;
    const data = new Uint8ClampedArray(width * height * 4);
    data.set([0, 0, 0, 255], 0);
    data.set([255, 255, 255, 255], 4);
    const mask = computeNormalizedLuminanceMask(
      { width, height, data },
      { minMultiplier: 0.5, maxMultiplier: 1.5 },
    );
    expect(mask.values[0]).toBeGreaterThanOrEqual(0.5);
    expect(mask.values[1]).toBeLessThanOrEqual(1.5);
  });
});

describe("multiplier byte encode/decode", () => {
  it("round-trips within texture precision", () => {
    for (const m of [0, 0.5, 1, 1.5, 2]) {
      const byte = encodeMultiplierByte(m);
      const normalized = byte / 255;
      expect(decodeMultiplierByte(normalized)).toBeCloseTo(m, 1);
    }
  });

  it("clamps out-of-range multipliers into byte bounds", () => {
    expect(encodeMultiplierByte(-5)).toBe(0);
    expect(encodeMultiplierByte(50)).toBe(255);
  });
});
