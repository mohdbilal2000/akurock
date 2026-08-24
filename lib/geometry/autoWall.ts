/**
 * Client-side automatic wall-corner suggestion — no ML, no network.
 *
 * Strategy: on a downscaled grayscale image, find the strongest
 * near-vertical edge lines left and right of a seed point (wall boundaries,
 * door/window frames, room corners) and the strongest near-horizontal edge
 * lines above and below it (ceiling line, floor/skirting line). Those four
 * lines bound the wall quad. Phone photos of a wall are near-frontal, so an
 * axis-aligned rectangle is a good first suggestion — the user fine-tunes
 * with the corner handles, and the SAM-2 route (app/api/detect-wall)
 * replaces this wholesale when configured.
 *
 * Pure pixel-buffer math (no DOM) so it is unit-testable in Vitest.
 */

import type { PixelBuffer } from "./luminance";
import type { Point } from "./types";

export interface AutoWallResult {
  /** Corners in the buffer's pixel space: TL, TR, BR, BL. */
  corners: [Point, Point, Point, Point];
  /** 0-1: how strong the supporting edges were vs. the fallback guess. */
  confidence: number;
}

/** Luma-weighted grayscale. */
function toGray(pixels: PixelBuffer): Float32Array {
  const { width, height, data } = pixels;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return gray;
}

interface EdgeProfiles {
  /** Per-column sum of |horizontal gradient| — peaks at vertical edges. */
  columnScore: Float32Array;
  /** Per-row sum of |vertical gradient| — peaks at horizontal edges. */
  rowScore: Float32Array;
}

/** 3x3 Sobel, accumulated into per-column and per-row edge profiles. */
export function computeEdgeProfiles(pixels: PixelBuffer): EdgeProfiles {
  const { width, height } = pixels;
  const gray = toGray(pixels);
  const columnScore = new Float32Array(width);
  const rowScore = new Float32Array(height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tl = gray[(y - 1) * width + (x - 1)];
      const t = gray[(y - 1) * width + x];
      const tr = gray[(y - 1) * width + (x + 1)];
      const l = gray[y * width + (x - 1)];
      const r = gray[y * width + (x + 1)];
      const bl = gray[(y + 1) * width + (x - 1)];
      const b = gray[(y + 1) * width + x];
      const br = gray[(y + 1) * width + (x + 1)];

      const gx = tr + 2 * r + br - (tl + 2 * l + bl);
      const gy = bl + 2 * b + br - (tl + 2 * t + tr);
      const ax = Math.abs(gx);
      const ay = Math.abs(gy);

      // Attribute each pixel's energy to the dominant direction only, so a
      // textured area doesn't light up both profiles equally.
      if (ax > ay * 1.5) columnScore[x] += ax;
      else if (ay > ax * 1.5) rowScore[y] += ay;
    }
  }

  return { columnScore, rowScore };
}

/**
 * Finds the strongest profile index within [from, to) (exclusive of the
 * seed side), requiring it to beat `minRatio` × the profile mean to count
 * as a real edge. Returns -1 when nothing convincing is found.
 */
function strongestEdge(profile: Float32Array, from: number, to: number, minRatio: number): number {
  let mean = 0;
  for (let i = 0; i < profile.length; i++) mean += profile[i];
  mean /= profile.length || 1;

  let bestIdx = -1;
  let bestVal = 0;
  const lo = Math.max(0, Math.floor(from));
  const hi = Math.min(profile.length, Math.ceil(to));
  for (let i = lo; i < hi; i++) {
    if (profile[i] > bestVal) {
      bestVal = profile[i];
      bestIdx = i;
    }
  }
  if (bestIdx < 0 || bestVal < mean * minRatio) return -1;
  return bestIdx;
}

/** Inset used for any wall boundary the detector can't find. */
const DEFAULT_QUAD = { left: 0.06, right: 0.94, top: 0.08, bottom: 0.88 } as const;

/**
 * A detected wall must span at least this fraction of the photo on each
 * axis. Below that it is furniture, not a wall.
 */
const MIN_WALL_FRACTION = { x: 0.35, y: 0.3 } as const;

/**
 * The quad to start every photo on, so the user nudges four handles that are
 * already roughly right instead of cold-tapping four corners.
 */
export function defaultWallQuad(width: number, height: number): [Point, Point, Point, Point] {
  const x0 = width * DEFAULT_QUAD.left;
  const x1 = width * DEFAULT_QUAD.right;
  const y0 = height * DEFAULT_QUAD.top;
  const y1 = height * DEFAULT_QUAD.bottom;
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
}

/**
 * Suggests wall corners around `seed` (defaults to image centre). Falls
 * back to a sensible inset rectangle for any boundary it can't find, and
 * reports lower confidence accordingly.
 */
export function suggestWallCorners(pixels: PixelBuffer, seed?: Point): AutoWallResult {
  const { width, height } = pixels;
  const sx = seed?.x ?? width / 2;
  const sy = seed?.y ?? height / 2;
  const { columnScore, rowScore } = computeEdgeProfiles(pixels);

  const MIN_RATIO = 2.0;
  // Keep a small margin off the seed so texture right at the tap point
  // doesn't win, and off the frame border where Sobel is truncated.
  const margin = Math.max(2, Math.round(Math.min(width, height) * 0.02));

  const left = strongestEdge(columnScore, margin, sx - margin, MIN_RATIO);
  const right = strongestEdge(columnScore, sx + margin, width - margin, MIN_RATIO);
  const top = strongestEdge(rowScore, margin, sy - margin, MIN_RATIO);
  const bottom = strongestEdge(rowScore, sy + margin, height - margin, MIN_RATIO);

  let found = 0;
  let x0 = left >= 0 ? (found++, left) : width * DEFAULT_QUAD.left;
  let x1 = right >= 0 ? (found++, right) : width * DEFAULT_QUAD.right;
  let y0 = top >= 0 ? (found++, top) : height * DEFAULT_QUAD.top;
  let y1 = bottom >= 0 ? (found++, bottom) : height * DEFAULT_QUAD.bottom;

  // Plausibility guard. The strongest edges in a room photo are usually
  // furniture, not the wall boundary — a headboard or a curtain can win and
  // yield a thin band that is nowhere near a wall. Panelling that band gives
  // a hairline rectangle floating over the furniture. If either axis comes
  // out implausibly small, discard the detection on THAT axis and fall back
  // to the default inset, lowering confidence to match.
  if (x1 - x0 < width * MIN_WALL_FRACTION.x) {
    x0 = width * DEFAULT_QUAD.left;
    x1 = width * DEFAULT_QUAD.right;
    if (left >= 0) found--;
    if (right >= 0) found--;
  }
  if (y1 - y0 < height * MIN_WALL_FRACTION.y) {
    y0 = height * DEFAULT_QUAD.top;
    y1 = height * DEFAULT_QUAD.bottom;
    if (top >= 0) found--;
    if (bottom >= 0) found--;
  }

  return {
    corners: [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ],
    confidence: found / 4,
  };
}

/**
 * Extracts a quad from a segmentation mask (e.g. SAM-2 output): flood-fills
 * the thresholded region containing `seed`, then takes the four convex
 * extremes (min/max of x+y and x−y) as TL/BR/TR/BL. Returns null if the
 * seed lands outside the mask or the region is degenerate.
 */
export function maskToQuad(
  mask: PixelBuffer,
  seed: Point,
  threshold = 128,
): [Point, Point, Point, Point] | null {
  const { width, height, data } = mask;
  const sx = Math.round(seed.x);
  const sy = Math.round(seed.y);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return null;

  const isOn = (x: number, y: number) => data[(y * width + x) * 4] >= threshold;
  if (!isOn(sx, sy)) return null;

  const visited = new Uint8Array(width * height);
  const stack: number[] = [sy * width + sx];
  visited[sy * width + sx] = 1;

  let tl = { x: sx, y: sy }; // min x+y
  let br = { x: sx, y: sy }; // max x+y
  let tr = { x: sx, y: sy }; // max x−y
  let bl = { x: sx, y: sy }; // min x−y
  let count = 0;

  while (stack.length > 0) {
    const idx = stack.pop()!;
    const x = idx % width;
    const y = (idx / width) | 0;
    count++;

    if (x + y < tl.x + tl.y) tl = { x, y };
    if (x + y > br.x + br.y) br = { x, y };
    if (x - y > tr.x - tr.y) tr = { x, y };
    if (x - y < bl.x - bl.y) bl = { x, y };

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ] as const;
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (!visited[nIdx] && isOn(nx, ny)) {
        visited[nIdx] = 1;
        stack.push(nIdx);
      }
    }
  }

  // Degenerate region: too small, or extremes collapse onto a line.
  if (count < 16) return null;
  const quadWidth = Math.max(tr.x - tl.x, br.x - bl.x);
  const quadHeight = Math.max(bl.y - tl.y, br.y - tr.y);
  if (quadWidth < 4 || quadHeight < 4) return null;

  return [tl, tr, br, bl];
}
