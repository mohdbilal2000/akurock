import { describe, expect, it } from "vitest";
import { defaultWallQuad, maskToQuad, suggestWallCorners } from "../autoWall";
import type { PixelBuffer } from "../luminance";

function buffer(width: number, height: number, fill = 128): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill;
    data[i * 4 + 1] = fill;
    data[i * 4 + 2] = fill;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

function setPixel(buf: PixelBuffer, x: number, y: number, v: number) {
  const o = (y * buf.width + x) * 4;
  buf.data[o] = v;
  buf.data[o + 1] = v;
  buf.data[o + 2] = v;
}

/** Draws a bright axis-aligned rectangle border on a mid-grey background. */
function drawRectBorder(buf: PixelBuffer, x0: number, y0: number, x1: number, y1: number) {
  for (let x = x0; x <= x1; x++) {
    setPixel(buf, x, y0, 255);
    setPixel(buf, x, y1, 255);
  }
  for (let y = y0; y <= y1; y++) {
    setPixel(buf, x0, y, 255);
    setPixel(buf, x1, y, 255);
  }
}

describe("suggestWallCorners", () => {
  it("locks onto a strong rectangular boundary around the seed", () => {
    const buf = buffer(120, 100);
    drawRectBorder(buf, 20, 15, 100, 80);
    const result = suggestWallCorners(buf, { x: 60, y: 48 });

    expect(result.confidence).toBe(1);
    const [tl, tr, br, bl] = result.corners;
    expect(tl.x).toBeGreaterThanOrEqual(19);
    expect(tl.x).toBeLessThanOrEqual(21);
    expect(tr.x).toBeGreaterThanOrEqual(99);
    expect(tr.x).toBeLessThanOrEqual(101);
    expect(tl.y).toBeGreaterThanOrEqual(14);
    expect(tl.y).toBeLessThanOrEqual(16);
    expect(bl.y).toBeGreaterThanOrEqual(79);
    expect(bl.y).toBeLessThanOrEqual(81);
    // Quad is consistent: TL/TR share y, TL/BL share x, etc.
    expect(tl.y).toBe(tr.y);
    expect(bl.y).toBe(br.y);
    expect(tl.x).toBe(bl.x);
    expect(tr.x).toBe(br.x);
  });

  it("falls back to an inset rectangle with low confidence on a featureless image", () => {
    const buf = buffer(100, 100);
    const result = suggestWallCorners(buf);

    expect(result.confidence).toBe(0);
    const [tl, , br] = result.corners;
    expect(tl.x).toBeGreaterThan(0);
    expect(tl.y).toBeGreaterThan(0);
    expect(br.x).toBeLessThan(100);
    expect(br.y).toBeLessThan(100);
    expect(br.x).toBeGreaterThan(tl.x);
    expect(br.y).toBeGreaterThan(tl.y);
  });

  it("only picks edges on the correct side of the seed", () => {
    const buf = buffer(120, 100);
    // Single strong vertical line at x=30; seed to its right.
    for (let y = 0; y < 100; y++) setPixel(buf, 30, y, 255);
    const result = suggestWallCorners(buf, { x: 80, y: 50 });
    const [tl] = result.corners;
    // The line at 30 must be used as the LEFT boundary, not the right.
    expect(tl.x).toBeGreaterThanOrEqual(29);
    expect(tl.x).toBeLessThanOrEqual(31);
    expect(result.corners[1].x).toBeGreaterThan(80);
  });
});

describe("maskToQuad", () => {
  it("extracts the quad of a filled rectangle containing the seed", () => {
    const buf = buffer(100, 80, 0);
    for (let y = 20; y <= 60; y++) {
      for (let x = 10; x <= 70; x++) setPixel(buf, x, y, 255);
    }
    const quad = maskToQuad(buf, { x: 40, y: 40 });
    expect(quad).not.toBeNull();
    const [tl, tr, br, bl] = quad!;
    expect(tl).toEqual({ x: 10, y: 20 });
    expect(tr).toEqual({ x: 70, y: 20 });
    expect(br).toEqual({ x: 70, y: 60 });
    expect(bl).toEqual({ x: 10, y: 60 });
  });

  it("ignores disconnected regions", () => {
    const buf = buffer(100, 80, 0);
    // Region A (contains seed) and region B (far away, larger).
    for (let y = 10; y <= 30; y++) for (let x = 10; x <= 30; x++) setPixel(buf, x, y, 255);
    for (let y = 50; y <= 75; y++) for (let x = 50; x <= 95; x++) setPixel(buf, x, y, 255);
    const quad = maskToQuad(buf, { x: 20, y: 20 });
    const [, , br] = quad!;
    expect(br.x).toBeLessThanOrEqual(30);
    expect(br.y).toBeLessThanOrEqual(30);
  });

  it("returns null when the seed misses the mask or the region is tiny", () => {
    const buf = buffer(50, 50, 0);
    setPixel(buf, 25, 25, 255);
    expect(maskToQuad(buf, { x: 5, y: 5 })).toBeNull();
    expect(maskToQuad(buf, { x: 25, y: 25 })).toBeNull(); // 1px region → degenerate
    expect(maskToQuad(buf, { x: -3, y: 10 })).toBeNull();
  });
});

describe("suggestWallCorners plausibility guard", () => {
  /** Photo whose strongest horizontal edges form a thin band (a headboard). */
  function bandPhoto(width: number, height: number) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        const inBand = y > height * 0.33 && y < height * 0.42;
        const v = inBand ? 10 : 200;
        data[o] = data[o + 1] = data[o + 2] = v;
        data[o + 3] = 255;
      }
    }
    return { width, height, data };
  }

  it("rejects a band too short to be a wall and falls back", () => {
    const res = suggestWallCorners(bandPhoto(400, 400));
    const h = res.corners[2].y - res.corners[0].y;
    expect(h).toBeGreaterThanOrEqual(400 * 0.3);
  });

  it("reports low confidence when it falls back", () => {
    const res = suggestWallCorners(bandPhoto(400, 400));
    expect(res.confidence).toBeLessThan(0.5);
  });

  it("never returns a quad narrower than the minimum fraction", () => {
    const res = suggestWallCorners(bandPhoto(300, 500));
    const w = res.corners[1].x - res.corners[0].x;
    expect(w).toBeGreaterThanOrEqual(300 * 0.35);
  });
});

describe("defaultWallQuad", () => {
  it("returns TL, TR, BR, BL inside the image", () => {
    const q = defaultWallQuad(1000, 800);
    expect(q).toHaveLength(4);
    expect(q[0].x).toBeLessThan(q[1].x);
    expect(q[0].y).toBeLessThan(q[2].y);
    for (const p of q) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1000);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(800);
    }
  });
});
