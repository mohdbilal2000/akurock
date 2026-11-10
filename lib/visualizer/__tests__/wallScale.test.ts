import { describe, expect, it } from "vitest";
import { defaultFocalPx, isUsableShape, measureWall } from "../wallScale";

/**
 * Renders a synthetic room: a wall W×H metres, at `distance` metres, yawed
 * by `yawDeg`, seen by a pinhole camera — returning exactly what the two
 * models would hand measureWall (depth map, wall mask, corners).
 */
function syntheticWall(opts: { widthM: number; heightM: number; distance: number; yawDeg: number; occluder?: boolean; noise?: number }) {
  const imageWidth = 1600, imageHeight = 1200, focalPx = defaultFocalPx(imageWidth, imageHeight);
  const cx = imageWidth / 2, cy = imageHeight / 2;
  const yaw = (opts.yawDeg * Math.PI) / 180;
  // Wall frame: origin at wall centre, u along the wall, v down.
  const origin = [0, 0, opts.distance];
  const uAxis = [Math.cos(yaw), 0, Math.sin(yaw)];
  const normal = [-Math.sin(yaw), 0, Math.cos(yaw)];
  const project = (u: number, v: number) => {
    const X = origin[0] + u * uAxis[0], Y = v, Z = origin[2] + u * uAxis[2];
    return { x: cx + (focalPx * X) / Z, y: cy + (focalPx * Y) / Z };
  };
  const hw = opts.widthM / 2, hh = opts.heightM / 2;
  const corners = [project(-hw, -hh), project(hw, -hh), project(hw, hh), project(-hw, hh)] as const;

  const size = 128;
  const depth = new Float32Array(size * size), wallProb = new Float32Array(size * size);
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const dx = (((i + 0.5) / size) * imageWidth - cx) / focalPx, dy = (((j + 0.5) / size) * imageHeight - cy) / focalPx;
    // Ray (dx, dy, 1)·t meets the wall plane n·(P - origin) = 0.
    const t = (normal[2] * origin[2]) / (normal[0] * dx + normal[2]);
    const X = dx * t, Z = t;
    const u = (X - origin[0]) * uAxis[0] + (Z - origin[2]) * uAxis[2], v = dy * t;
    const onWall = Math.abs(u) <= hw && Math.abs(v) <= hh;
    // A sofa: lower-middle of the wall, 0.9 m in front of it.
    const sofa = opts.occluder && onWall && Math.abs(u) < hw * 0.6 && v > hh * 0.2;
    depth[j * size + i] = (sofa ? t - 0.9 : onWall ? t : t * 0.6) * (1 + (opts.noise ?? 0) * random());
    wallProb[j * size + i] = onWall && !sofa ? 1 : 0;
  }
  return { depth, depthWidth: size, depthHeight: size, wallProb, wallProbWidth: size, wallProbHeight: size, corners, imageWidth, imageHeight, focalPx };
}

describe("measureWall", () => {
  it("recovers a frontal wall's size", () => {
    const scale = measureWall(syntheticWall({ widthM: 4.2, heightM: 2.6, distance: 3.5, yawDeg: 0 }))!;
    expect(scale.widthMm).toBeGreaterThan(4200 * 0.98);
    expect(scale.widthMm).toBeLessThan(4200 * 1.02);
    expect(scale.heightMm).toBeGreaterThan(2600 * 0.98);
    expect(scale.heightMm).toBeLessThan(2600 * 1.02);
    expect(isUsableShape(scale, 4.2 / 2.6)).toBe(true);
  });

  it("recovers a wall seen at an angle, behind a sofa, with noisy depth", () => {
    const scale = measureWall(syntheticWall({ widthM: 3.6, heightM: 2.5, distance: 4, yawDeg: 28, occluder: true, noise: 0.015 }))!;
    expect(Math.abs(scale.widthMm - 3600) / 3600).toBeLessThan(0.04);
    expect(Math.abs(scale.heightMm - 2500) / 2500).toBeLessThan(0.04);
    expect(scale.inlierRatio).toBeGreaterThan(0.9);
  });

  it("returns null when there is too little wall to measure", () => {
    const input = syntheticWall({ widthM: 4, heightM: 2.5, distance: 3.5, yawDeg: 0 });
    input.wallProb.fill(0);
    expect(measureWall(input)).toBeNull();
  });

  it("uses the shape only when the plane is solid and the correction is sane", () => {
    // A wall at 35° looks ~18 % narrower on screen; the measured shape is wider.
    expect(isUsableShape({ widthMm: 3600, heightMm: 2500, inlierRatio: 0.95, distanceM: 4 }, (3600 * 0.82) / 2500)).toBe(true);
    // Uniformly wrong scale (2× too big) does not matter: same shape.
    expect(isUsableShape({ widthMm: 7200, heightMm: 5000, inlierRatio: 0.95, distanceM: 8 }, 3600 / 2500)).toBe(true);
    expect(isUsableShape({ widthMm: 3600, heightMm: 2500, inlierRatio: 0.5, distanceM: 4 }, 1.44)).toBe(false);
    expect(isUsableShape({ widthMm: 9000, heightMm: 2500, inlierRatio: 0.95, distanceM: 4 }, 1.44)).toBe(false);
  });
});
