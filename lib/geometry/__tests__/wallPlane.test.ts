import { describe, expect, it } from "vitest";
import { applyHomography } from "../homography";
import { buildWallPlane } from "../wallPlane";

describe("buildWallPlane", () => {
  it("derives a plausible wall width for a fronto-parallel rectangle", () => {
    // A perfectly frontal photo: wall appears as a 800x400px rectangle.
    // Real wall height is 2500mm, so 1px == 6.25mm, and an 800px-wide
    // rectangle should read back as 5000mm wide.
    const plane = buildWallPlane(
      [
        { x: 100, y: 100 },
        { x: 900, y: 100 },
        { x: 900, y: 500 },
        { x: 100, y: 500 },
      ],
      2500,
    );
    expect(plane.wallWidthMm).toBeCloseTo(5000, 6);
  });

  it("round-trips wall-space corners through wallToImage", () => {
    const corners = [
      { x: 120, y: 80 },
      { x: 700, y: 140 },
      { x: 660, y: 620 },
      { x: 90, y: 560 },
    ] as const;
    const plane = buildWallPlane(corners, 2500);

    const wallCorners = [
      { x: 0, y: 0 },
      { x: plane.wallWidthMm, y: 0 },
      { x: plane.wallWidthMm, y: plane.wallHeightMm },
      { x: 0, y: plane.wallHeightMm },
    ];
    wallCorners.forEach((wc, i) => {
      const mapped = applyHomography(plane.wallToImage, wc);
      expect(mapped.x).toBeCloseTo(corners[i].x, 4);
      expect(mapped.y).toBeCloseTo(corners[i].y, 4);
    });
  });

  it("imageToWall is the inverse of wallToImage", () => {
    const plane = buildWallPlane(
      [
        { x: 50, y: 60 },
        { x: 620, y: 40 },
        { x: 640, y: 480 },
        { x: 30, y: 500 },
      ],
      2500,
    );
    const midImage = { x: 330, y: 260 };
    const wallPoint = applyHomography(plane.imageToWall, midImage);
    const backToImage = applyHomography(plane.wallToImage, wallPoint);
    expect(backToImage.x).toBeCloseTo(midImage.x, 3);
    expect(backToImage.y).toBeCloseTo(midImage.y, 3);
  });
});
