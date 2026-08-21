import { describe, expect, it } from "vitest";
import { applyHomography, computeHomography, invertMat3 } from "../homography";

describe("computeHomography", () => {
  it("recovers an identity mapping", () => {
    const src = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const H = computeHomography(src, src);
    for (const p of src) {
      const mapped = applyHomography(H, p);
      expect(mapped.x).toBeCloseTo(p.x, 6);
      expect(mapped.y).toBeCloseTo(p.y, 6);
    }
  });

  it("maps a unit square to an arbitrary quad (perspective, not just affine)", () => {
    const src = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const dst = [
      { x: 100, y: 120 },
      { x: 500, y: 90 },
      { x: 480, y: 400 },
      { x: 80, y: 420 },
    ];
    const H = computeHomography(src, dst);
    src.forEach((p, i) => {
      const mapped = applyHomography(H, p);
      expect(mapped.x).toBeCloseTo(dst[i].x, 6);
      expect(mapped.y).toBeCloseTo(dst[i].y, 6);
    });
  });

  it("round-trips through the inverse matrix", () => {
    const src = [
      { x: 0, y: 0 },
      { x: 2400, y: 0 },
      { x: 2400, y: 2500 },
      { x: 0, y: 2500 },
    ];
    const dst = [
      { x: 120, y: 80 },
      { x: 700, y: 140 },
      { x: 660, y: 620 },
      { x: 90, y: 560 },
    ];
    const H = computeHomography(src, dst);
    const Hinv = invertMat3(H);

    const midWall = { x: 1200, y: 1250 };
    const imagePoint = applyHomography(H, midWall);
    const backToWall = applyHomography(Hinv, imagePoint);

    expect(backToWall.x).toBeCloseTo(midWall.x, 4);
    expect(backToWall.y).toBeCloseTo(midWall.y, 4);
  });

  it("throws on degenerate (collinear) points", () => {
    const src = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ];
    const dst = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ];
    expect(() => computeHomography(src, dst)).toThrow();
  });

  it("throws when given anything other than 4 points", () => {
    expect(() =>
      computeHomography(
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
      ),
    ).toThrow();
  });
});

describe("invertMat3", () => {
  it("inverts the identity to itself", () => {
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1] as const;
    invertMat3(I).forEach((v, i) => expect(v).toBeCloseTo(I[i], 10));
  });

  it("throws on a singular matrix", () => {
    const singular = [1, 2, 3, 2, 4, 6, 1, 1, 1] as const;
    expect(() => invertMat3(singular)).toThrow();
  });
});
