import { describe, expect, it } from "vitest";
import {
  ADE,
  boxBlur,
  convexHull,
  enclosingQuad,
  floorLineY,
  guidedFilter,
  orderCorners,
  pickWallComponent,
  wallQuad,
} from "../wallFromSegmentation";

const OTHER = 7; // bed
function grid(width: number, height: number, paint: (x: number, y: number) => number) {
  const labels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) labels[y * width + x] = paint(x, y);
  return { width, height, labels };
}

describe("pickWallComponent", () => {
  const g = grid(40, 30, (x, y) => {
    if (x >= 10 && x < 34 && y >= 2 && y < 20) return ADE.wall; // big, central
    if (x < 6 && y >= 5 && y < 25) return ADE.wall; // side wall, 120 cells
    return y >= 24 ? ADE.floor : OTHER;
  });

  it("chooses the large central wall, not the union of all walls", () => {
    const wall = pickWallComponent(g)!;
    expect(wall.area).toBe(24 * 18);
    expect(wall.minX).toBe(10);
  });

  it("a tap overrides the automatic choice", () => {
    const wall = pickWallComponent(g, { x: 2, y: 10 })!;
    expect(wall.maxX).toBe(5);
  });

  it("returns null when there is no meaningful wall", () => {
    expect(pickWallComponent(grid(40, 30, () => OTHER))).toBeNull();
  });
});

describe("enclosingQuad", () => {
  it("keeps a trapezoid a trapezoid (perspective survives)", () => {
    const trapezoid = [{ x: 0, y: 0 }, { x: 10, y: 2 }, { x: 10, y: 8 }, { x: 0, y: 10 }];
    const noisy = [...trapezoid, { x: 5, y: 1.01 }, { x: 5, y: 8.99 }, { x: 9.99, y: 5 }];
    const quad = orderCorners(enclosingQuad(convexHull(noisy))!);
    quad.forEach((p, i) => {
      expect(p.x).toBeCloseTo(trapezoid[i].x, 0);
      expect(p.y).toBeCloseTo(trapezoid[i].y, 0);
    });
  });

  it("orders corners TL, TR, BR, BL", () => {
    const [tl, tr, br, bl] = orderCorners([{ x: 9, y: 9 }, { x: 0, y: 0 }, { x: 0, y: 9 }, { x: 9, y: 0 }]);
    expect([tl, tr, br, bl]).toEqual([{ x: 0, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 9 }, { x: 0, y: 9 }]);
  });
});

describe("wallQuad", () => {
  // Wall rows 2-19; a bed hides the wall's lower part between x=14..29;
  // floor starts at row 24 beside the bed and row 28 in front of it.
  const g = grid(40, 30, (x, y) => {
    const bed = x >= 14 && x < 30 && y >= 12 && y < 28;
    if (bed) return OTHER;
    if (x >= 6 && x < 36 && y >= 2 && y < 24) return ADE.wall;
    return y >= 24 ? ADE.floor : OTHER;
  });

  it("finds the wall-floor junction beside the furniture, not in front of it", () => {
    expect(floorLineY(g, pickWallComponent(g)!)).toBe(24);
  });

  it("returns the full wall rectangle down to the floor", () => {
    const quad = wallQuad(g, pickWallComponent(g)!)!;
    const [tl, tr, br, bl] = quad.corners;
    expect(tl.x).toBeCloseTo(6, 0);
    expect(tr.x).toBeCloseTo(36, 0);
    expect(tl.y).toBeCloseTo(2, 0);
    expect(bl.y).toBeCloseTo(24, 0);
    expect(br.y).toBeCloseTo(24, 0);
    expect(quad.confidence).toBeGreaterThan(0.45);
  });
});

describe("mask filters", () => {
  it("boxBlur preserves a constant field and total mass", () => {
    const flat = boxBlur(new Float32Array(100).fill(0.5), 10, 10, 2);
    expect(Math.min(...flat)).toBeCloseTo(0.5, 5);
    expect(Math.max(...flat)).toBeCloseTo(0.5, 5);
  });

  it("guidedFilter moves a blurry mask edge onto the photo's edge", () => {
    const w = 40, h = 8;
    const guide = new Float32Array(w * h), soft = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      guide[y * w + x] = x < 20 ? 0.2 : 0.8; // real edge at x=20
      soft[y * w + x] = Math.min(1, Math.max(0, (x - 12) / 16)); // ramp 12..28
    }
    const out = guidedFilter(guide, soft, w, h, 4, 1e-3);
    const row = 4 * w;
    // Just left of the edge is clearly lower than just right of it.
    expect(out[row + 21] - out[row + 18]).toBeGreaterThan(0.25);
    expect(soft[row + 21] - soft[row + 18]).toBeLessThan(0.2);
  });
});
