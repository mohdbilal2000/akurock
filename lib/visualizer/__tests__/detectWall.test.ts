import { describe, expect, it } from "vitest";
import { parseDetection, WallDetectionUnavailable } from "../detectWall";

const valid = {
  corners: [
    { x: 10, y: 20 },
    { x: 400, y: 25 },
    { x: 410, y: 500 },
    { x: 5, y: 495 },
  ],
  wall_width_mm: 3420.5,
  wall_height_mm: 2510.2,
  confidence: 0.82,
  source: "depth-plane",
  image_width: 1200,
  image_height: 900,
  wall_mask_png: "data:image/png;base64,AAA",
  occluder_mask_png: "data:image/png;base64,BBB",
  notes: ["no EXIF focal length"],
  timings_ms: { total_ms: 2100 },
};

/**
 * The service is a separate deployment that can be older, newer, or
 * misbehaving. Anything that would put a wrong wall — and therefore a wrong
 * price — on screen has to be rejected here, where the fallback to manual
 * corners is still available.
 */
describe("parseDetection", () => {
  it("maps a well-formed response onto the renderer's shape", () => {
    const detection = parseDetection(valid);

    expect(detection.corners).toHaveLength(4);
    expect(detection.corners[2]).toEqual({ x: 410, y: 500 });
    expect(detection.wallHeightMm).toBeCloseTo(2510.2);
    expect(detection.source).toBe("depth-plane");
    expect(detection.wallMaskUrl).toBe("data:image/png;base64,AAA");
    expect(detection.notes).toEqual(["no EXIF focal length"]);
  });

  it("rejects a quad that isn't four finite points", () => {
    expect(() => parseDetection({ ...valid, corners: valid.corners.slice(0, 3) })).toThrow(
      WallDetectionUnavailable,
    );
    expect(() =>
      parseDetection({ ...valid, corners: [...valid.corners.slice(0, 3), { x: "nope", y: 1 }] }),
    ).toThrow(WallDetectionUnavailable);
  });

  it("rejects a wall size that can't be true", () => {
    expect(() => parseDetection({ ...valid, wall_height_mm: 0 })).toThrow(WallDetectionUnavailable);
    expect(() => parseDetection({ ...valid, wall_width_mm: -1 })).toThrow(WallDetectionUnavailable);
    expect(() => parseDetection({ ...valid, wall_height_mm: null })).toThrow(WallDetectionUnavailable);
  });

  it("treats an unknown source as an estimate, not a measurement", () => {
    // Only "depth-plane" means metres were measured; anything else must not
    // be allowed to overwrite the user's wall height.
    expect(parseDetection({ ...valid, source: "something-new" }).source).toBe("mask-bbox");
  });

  it("clamps confidence and survives missing optional fields", () => {
    const detection = parseDetection({
      ...valid,
      confidence: 4,
      wall_mask_png: undefined,
      occluder_mask_png: undefined,
      notes: undefined,
      timings_ms: undefined,
    });

    expect(detection.confidence).toBe(1);
    expect(detection.wallMaskUrl).toBeNull();
    expect(detection.occluderMaskUrl).toBeNull();
    expect(detection.notes).toEqual([]);
    expect(parseDetection({ ...valid, confidence: "x" }).confidence).toBe(0);
  });
});
