/**
 * Real-world size of the detected wall, from a metric depth map.
 *
 * The depth model gives metres-from-camera per pixel. Back-projecting the
 * visible wall pixels gives a 3D point cloud; a plane fitted through it is
 * the wall; and the four wall corners, cast as rays onto that plane, give
 * its width and height in metres — including the parts hidden behind
 * furniture, which the plane extends through.
 *
 * Pure maths, no DOM and no model: unit-tested with synthetic walls.
 */

import type { Point } from "@/lib/geometry/types";

export interface WallScaleInput {
  /** Metric depth (metres), row-major, depthWidth × depthHeight, covering the whole image. */
  depth: Float32Array;
  depthWidth: number;
  depthHeight: number;
  /** 0-1 "this cell is the chosen wall", any resolution, covering the whole image. */
  wallProb: Float32Array;
  wallProbWidth: number;
  wallProbHeight: number;
  /** Wall corners in image pixels: TL, TR, BR, BL. */
  corners: readonly [Point, Point, Point, Point];
  imageWidth: number;
  imageHeight: number;
  /** Focal length in image pixels (square pixels, principal point at centre). */
  focalPx: number;
}

export interface WallScale {
  widthMm: number;
  heightMm: number;
  /** Share of wall points within tolerance of the fitted plane. */
  inlierRatio: number;
  /** Distance from the camera to the wall along the optical axis, metres. */
  distanceM: number;
}

/**
 * Focal length for a photo with no usable EXIF: a phone's main camera is
 * ~26 mm in 35 mm terms, and the 36 mm film width maps to the photo's long
 * side whichever way the phone was held.
 */
export function defaultFocalPx(imageWidth: number, imageHeight: number, focal35mm = 26): number {
  return (focal35mm / 36) * Math.max(imageWidth, imageHeight);
}

type Vec3 = [number, number, number];

/** Least-squares plane z = a·x + b·y + c through weighted points. */
function fitPlane(points: Float32Array, count: number, keep: Uint8Array | null): [number, number, number] | null {
  let sxx = 0, sxy = 0, sx = 0, syy = 0, sy = 0, n = 0, sxz = 0, syz = 0, sz = 0;
  for (let i = 0; i < count; i++) {
    if (keep && !keep[i]) continue;
    const x = points[i * 3], y = points[i * 3 + 1], z = points[i * 3 + 2];
    sxx += x * x; sxy += x * y; sx += x; syy += y * y; sy += y; n++;
    sxz += x * z; syz += y * z; sz += z;
  }
  if (n < 30) return null;
  // Solve the 3×3 normal equations by Cramer's rule.
  const det = sxx * (syy * n - sy * sy) - sxy * (sxy * n - sy * sx) + sx * (sxy * sy - syy * sx);
  if (Math.abs(det) < 1e-9) return null;
  const a = (sxz * (syy * n - sy * sy) - sxy * (syz * n - sy * sz) + sx * (syz * sy - syy * sz)) / det;
  const b = (sxx * (syz * n - sz * sy) - sxz * (sxy * n - sy * sx) + sx * (sxy * sz - syz * sx)) / det;
  const c = (sxx * (syy * sz - sy * syz) - sxy * (sxy * sz - syz * sx) + sxz * (sxy * sy - syy * sx)) / det;
  return [a, b, c];
}

export function measureWall(input: WallScaleInput): WallScale | null {
  const { depth, depthWidth, depthHeight, wallProb, wallProbWidth, wallProbHeight, corners, imageWidth, imageHeight, focalPx } = input;
  const cx = imageWidth / 2, cy = imageHeight / 2;

  // Back-project every 2nd depth cell that is confidently wall.
  const stride = 2;
  const points = new Float32Array(Math.ceil(depthWidth / stride) * Math.ceil(depthHeight / stride) * 3);
  let count = 0;
  for (let v = 0; v < depthHeight; v += stride) {
    const py = Math.min(wallProbHeight - 1, Math.floor(((v + 0.5) / depthHeight) * wallProbHeight));
    for (let u = 0; u < depthWidth; u += stride) {
      const px = Math.min(wallProbWidth - 1, Math.floor(((u + 0.5) / depthWidth) * wallProbWidth));
      if (wallProb[py * wallProbWidth + px] < 0.7) continue;
      const z = depth[v * depthWidth + u];
      if (!(z > 0.2 && z < 19.5)) continue;
      const imageX = ((u + 0.5) / depthWidth) * imageWidth, imageY = ((v + 0.5) / depthHeight) * imageHeight;
      points[count * 3] = ((imageX - cx) / focalPx) * z;
      points[count * 3 + 1] = ((imageY - cy) / focalPx) * z;
      points[count * 3 + 2] = z;
      count++;
    }
  }
  if (count < 60) return null;

  // Fit, then refit twice on the points that agree with the plane: depth
  // near furniture edges and in deep shadow is where the outliers live.
  let plane = fitPlane(points, count, null);
  if (!plane) return null;
  const keep = new Uint8Array(count);
  let inliers = 0;
  for (let pass = 0; pass < 3; pass++) {
    inliers = 0;
    for (let i = 0; i < count; i++) {
      const z = points[i * 3 + 2];
      const residual = Math.abs(plane[0] * points[i * 3] + plane[1] * points[i * 3 + 1] + plane[2] - z);
      // 4 % of the distance: depth noise grows with range.
      keep[i] = residual < 0.04 * z ? 1 : 0;
      inliers += keep[i];
    }
    if (pass === 2) break;
    const refit = fitPlane(points, count, keep);
    if (!refit) break;
    plane = refit;
  }
  const inlierRatio = inliers / count;
  const [a, b, c] = plane;

  // Each corner is a ray from the camera; where it meets the plane is the
  // corner in metres.
  const world: Vec3[] = [];
  for (const corner of corners) {
    const dx = (corner.x - cx) / focalPx, dy = (corner.y - cy) / focalPx;
    const denom = 1 - a * dx - b * dy;
    if (denom < 0.05) return null; // ray (nearly) parallel to the wall
    const z = c / denom;
    if (!(z > 0.2 && z < 40)) return null;
    world.push([dx * z, dy * z, z]);
  }
  const dist = (p: Vec3, q: Vec3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const [tl, tr, br, bl] = world;
  const widthM = (dist(tl, tr) + dist(bl, br)) / 2;
  const heightM = (dist(tl, bl) + dist(tr, br)) / 2;
  if (!Number.isFinite(widthM) || !Number.isFinite(heightM)) return null;

  return {
    widthMm: widthM * 1000,
    heightMm: heightM * 1000,
    inlierRatio,
    distanceM: c,
  };
}

/**
 * Whether the measured *shape* (width ÷ height) should replace the one read
 * off the corners' on-screen outline.
 *
 * Only the shape is used, never the absolute metres. A single photo cannot
 * tell a small wall close up from a large one far away without knowing the
 * lens, and the depth model's scale was off by 2× on test rooms — so the
 * height stays the visitor's to set. The shape, though, is independent of
 * that scale error, and it is what corrects a wall photographed at an
 * angle, which looks narrower on screen than it is.
 */
export function isUsableShape(scale: WallScale, outlineAspect: number): boolean {
  const aspect = scale.widthMm / scale.heightMm;
  if (!Number.isFinite(aspect) || scale.inlierRatio < 0.8) return false;
  // Foreshortening only ever makes a wall look narrower, and a correction
  // beyond 1.8× means a wall too oblique for any of this to be reliable.
  const ratio = aspect / outlineAspect;
  return ratio >= 0.85 && ratio <= 1.8;
}
