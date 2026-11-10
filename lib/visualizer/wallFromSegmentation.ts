/**
 * Pure geometry that turns a semantic segmentation of a room photo into the
 * wall the visualizer panels: which wall, its four corners, and a soft mask
 * of where bare wall is actually visible (so panels go behind the sofa
 * instead of over it).
 *
 * Nothing here touches the DOM or the model — it takes label/probability
 * grids and returns numbers, so it is unit-testable and identical whether
 * the grid came from the browser or a server.
 */

import type { Point } from "@/lib/geometry/types";

/** ADE20K ids the logic cares about (SegFormer's id2label). */
export const ADE = { wall: 0, floor: 3, ceiling: 5, rug: 28 } as const;

export interface LabelGrid {
  width: number;
  height: number;
  /** Class id per cell, row-major. */
  labels: Uint8Array;
}

/** Boolean grid: 1 where the chosen wall component is. */
export interface Component {
  mask: Uint8Array;
  area: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * The single wall to panel: the largest connected wall region, weighted
 * towards the centre of the frame — or the one under an explicit tap.
 * A room photo usually shows two or three walls; panelling their union
 * would bend the slats around a corner.
 */
export function pickWallComponent(grid: LabelGrid, tap?: Point | null): Component | null {
  const { width, height, labels } = grid;
  const ids = new Int32Array(width * height).fill(-1);
  const stack = new Int32Array(width * height);
  const found: (Component & { score: number; id: number })[] = [];

  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== ADE.wall || ids[start] !== -1) continue;
    const id = found.length;
    let top = 0;
    stack[top++] = start;
    ids[start] = id;
    let area = 0, sumX = 0, sumY = 0, minX = width, maxX = 0, minY = height, maxY = 0;
    while (top > 0) {
      const cell = stack[--top];
      const x = cell % width, y = (cell - x) / width;
      area++; sumX += x; sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && labels[cell - 1] === ADE.wall && ids[cell - 1] === -1) { ids[cell - 1] = id; stack[top++] = cell - 1; }
      if (x < width - 1 && labels[cell + 1] === ADE.wall && ids[cell + 1] === -1) { ids[cell + 1] = id; stack[top++] = cell + 1; }
      if (y > 0 && labels[cell - width] === ADE.wall && ids[cell - width] === -1) { ids[cell - width] = id; stack[top++] = cell - width; }
      if (y < height - 1 && labels[cell + width] === ADE.wall && ids[cell + width] === -1) { ids[cell + width] = id; stack[top++] = cell + width; }
    }
    const offset = Math.hypot(sumX / area - width / 2, sumY / area - height / 2);
    const centrality = 1 / (1 + offset / (0.5 * Math.hypot(width, height)));
    found.push({ id, mask: new Uint8Array(0), area, minX, maxX, minY, maxY, score: area * centrality });
  }
  if (found.length === 0) return null;

  let chosen = found.reduce((a, b) => (b.score > a.score ? b : a));
  if (tap) {
    const tx = Math.min(width - 1, Math.max(0, Math.round(tap.x)));
    const ty = Math.min(height - 1, Math.max(0, Math.round(tap.y)));
    const tapped = ids[ty * width + tx];
    if (tapped >= 0) chosen = found[tapped];
  }
  if (chosen.area < 0.03 * width * height) return null;

  const mask = new Uint8Array(width * height);
  for (let i = 0; i < ids.length; i++) if (ids[i] === chosen.id) mask[i] = 1;
  return { mask, area: chosen.area, minX: chosen.minX, maxX: chosen.maxX, minY: chosen.minY, maxY: chosen.maxY };
}

/** Andrew's monotone chain. Returns the hull clockwise on screen (y down). */
export function convexHull(points: Point[]): Point[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function lineIntersection(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const dax = a2.x - a1.x, day = a2.y - a1.y, dbx = b2.x - b1.x, dby = b2.y - b1.y;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom;
  return { x: a1.x + t * dax, y: a1.y + t * day };
}

function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
}

/**
 * Smallest quadrilateral that still contains a convex polygon: repeatedly
 * delete the edge whose removal (extending its two neighbours until they
 * meet) adds the least area. Unlike a bounding box this keeps perspective —
 * a wall that recedes stays a trapezoid.
 */
export function enclosingQuad(hull: Point[]): Point[] | null {
  const poly = [...hull];
  if (poly.length < 4) return null;
  while (poly.length > 4) {
    const n = poly.length;
    let bestIndex = -1, bestArea = Infinity, bestPoint: Point | null = null;
    for (let i = 0; i < n; i++) {
      const prev = poly[(i - 1 + n) % n], a = poly[i], b = poly[(i + 1) % n], next = poly[(i + 2) % n];
      const meet = lineIntersection(prev, a, next, b);
      if (!meet) continue;
      // The meeting point must lie beyond the edge (outside the polygon),
      // otherwise the neighbours diverge and removing the edge is invalid.
      const beyondA = (meet.x - a.x) * (a.x - prev.x) + (meet.y - a.y) * (a.y - prev.y);
      const beyondB = (meet.x - b.x) * (b.x - next.x) + (meet.y - b.y) * (b.y - next.y);
      if (beyondA < 0 || beyondB < 0) continue;
      const added = triangleArea(a, b, meet);
      if (added < bestArea) { bestArea = added; bestIndex = i; bestPoint = meet; }
    }
    if (bestIndex < 0 || !bestPoint) {
      // Degenerate hull: drop the vertex that changes the outline least.
      let drop = 0, least = Infinity;
      for (let i = 0; i < n; i++) {
        const area = triangleArea(poly[(i - 1 + n) % n], poly[i], poly[(i + 1) % n]);
        if (area < least) { least = area; drop = i; }
      }
      poly.splice(drop, 1);
      continue;
    }
    const next = (bestIndex + 1) % n;
    poly[bestIndex] = bestPoint;
    poly.splice(next, 1);
  }
  return poly;
}

/** Sorts four points into TL, TR, BR, BL. */
export function orderCorners(quad: Point[]): [Point, Point, Point, Point] {
  const cx = quad.reduce((s, p) => s + p.x, 0) / 4;
  const cy = quad.reduce((s, p) => s + p.y, 0) / 4;
  const sorted = [...quad].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
  let start = 0;
  for (let i = 1; i < 4; i++) if (sorted[i].x + sorted[i].y < sorted[start].x + sorted[start].y) start = i;
  return [0, 1, 2, 3].map((i) => sorted[(start + i) % 4]) as [Point, Point, Point, Point];
}

/**
 * Row where the chosen wall meets the floor, or null if no floor is visible
 * under it. Furniture hides most of that junction, and where it does the
 * first floor cell in a column is the floor *in front of* the furniture —
 * lower in the frame. The junction is therefore the upper tail of the
 * per-column values, not their median.
 */
export function floorLineY(grid: LabelGrid, wall: Component): number | null {
  const { width, height, labels } = grid;
  const hits: number[] = [];
  for (let x = wall.minX; x <= wall.maxX; x++) {
    let lastWall = -1;
    for (let y = wall.minY; y <= wall.maxY; y++) if (wall.mask[y * width + x]) lastWall = y;
    if (lastWall < 0) continue;
    for (let y = lastWall + 1; y < height; y++) {
      const label = labels[y * width + x];
      if (label === ADE.floor || label === ADE.rug) { hits.push(y); break; }
    }
  }
  const columns = wall.maxX - wall.minX + 1;
  if (hits.length < Math.max(3, 0.08 * columns)) return null;
  hits.sort((a, b) => a - b);
  return hits[Math.floor(hits.length * 0.15)];
}

export interface WallQuad {
  /** Grid-space corners, TL / TR / BR / BL. */
  corners: [Point, Point, Point, Point];
  /** 0-1: how much the tool should trust this without asking. */
  confidence: number;
}

/**
 * Corners of the chosen wall. The outline comes from the visible wall; the
 * bottom edge is then pushed down to the floor line, because the panels
 * stand on the floor even where a bed hides it.
 */
export function wallQuad(grid: LabelGrid, wall: Component): WallQuad | null {
  const { width, height } = grid;
  const boundary: Point[] = [];
  for (let y = wall.minY; y <= wall.maxY; y++) {
    let first = -1, last = -1;
    for (let x = wall.minX; x <= wall.maxX; x++) {
      if (wall.mask[y * width + x]) { if (first < 0) first = x; last = x; }
    }
    if (first >= 0) {
      // Cell corners rather than centres, so the hull hugs the outline.
      boundary.push({ x: first, y }, { x: last + 1, y }, { x: first, y: y + 1 }, { x: last + 1, y: y + 1 });
    }
  }
  const quad = enclosingQuad(convexHull(boundary));
  if (!quad) return null;
  const corners = orderCorners(quad);
  const [tl, tr] = corners;
  let [, , br, bl] = corners;

  const floorY = floorLineY(grid, wall);
  if (floorY !== null) {
    bl = slideToY(tl, bl, floorY);
    br = slideToY(tr, br, floorY);
  }

  const clampPoint = (p: Point): Point => ({
    x: Math.min(width, Math.max(0, p.x)),
    y: Math.min(height, Math.max(0, p.y)),
  });
  const result = [tl, tr, br, bl].map(clampPoint) as [Point, Point, Point, Point];

  const quadWidth = (Math.hypot(result[1].x - result[0].x, result[1].y - result[0].y) +
    Math.hypot(result[2].x - result[3].x, result[2].y - result[3].y)) / 2;
  const quadHeight = (Math.hypot(result[3].x - result[0].x, result[3].y - result[0].y) +
    Math.hypot(result[2].x - result[1].x, result[2].y - result[1].y)) / 2;
  if (quadWidth < 0.15 * width || quadHeight < 0.15 * height) return null;

  const areaScore = Math.min(1, wall.area / (0.12 * width * height));
  const floorScore = floorY !== null ? 1 : 0.7;
  return { corners: result, confidence: Math.round(areaScore * floorScore * 1000) / 1000 };
}

/** Moves `end` along the line start→end until it sits on row `y`. */
function slideToY(start: Point, end: Point, y: number): Point {
  const dy = end.y - start.y;
  if (Math.abs(dy) < 1e-6 || y <= end.y) return end;
  const t = (y - start.y) / dy;
  return { x: start.x + t * (end.x - start.x), y };
}

/** Bilinear resample of a single-channel grid. */
export function resampleBilinear(
  src: Float32Array, srcW: number, srcH: number, dstW: number, dstH: number,
): Float32Array {
  const out = new Float32Array(dstW * dstH);
  for (let y = 0; y < dstH; y++) {
    const fy = Math.min(srcH - 1, Math.max(0, ((y + 0.5) * srcH) / dstH - 0.5));
    const y0 = Math.floor(fy), y1 = Math.min(srcH - 1, y0 + 1), wy = fy - y0;
    for (let x = 0; x < dstW; x++) {
      const fx = Math.min(srcW - 1, Math.max(0, ((x + 0.5) * srcW) / dstW - 0.5));
      const x0 = Math.floor(fx), x1 = Math.min(srcW - 1, x0 + 1), wx = fx - x0;
      const top = src[y0 * srcW + x0] * (1 - wx) + src[y0 * srcW + x1] * wx;
      const bottom = src[y1 * srcW + x0] * (1 - wx) + src[y1 * srcW + x1] * wx;
      out[y * dstW + x] = top * (1 - wy) + bottom * wy;
    }
  }
  return out;
}

/** Mean over a (2r+1)² window, edges clamped. Two separable running sums. */
export function boxBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const window = 2 * radius + 1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += src[row + Math.min(width - 1, Math.max(0, i))];
    for (let x = 0; x < width; x++) {
      tmp[row + x] = sum / window;
      sum += src[row + Math.min(width - 1, x + radius + 1)] - src[row + Math.max(0, x - radius)];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += tmp[Math.min(height - 1, Math.max(0, i)) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / window;
      sum += tmp[Math.min(height - 1, y + radius + 1) * width + x] - tmp[Math.max(0, y - radius) * width + x];
    }
  }
  return out;
}

/**
 * Guided filter (He et al.): snaps a blurry, low-resolution mask onto the
 * real edges in the photo. The segmenter works at a quarter of its input
 * resolution, so its raw mask is soft by several pixels; the photo knows
 * exactly where the pillow ends. `guide` is 0-1 luminance.
 */
export function guidedFilter(
  guide: Float32Array, input: Float32Array, width: number, height: number, radius: number, eps: number,
): Float32Array {
  const n = guide.length;
  const gp = new Float32Array(n), gg = new Float32Array(n);
  for (let i = 0; i < n; i++) { gp[i] = guide[i] * input[i]; gg[i] = guide[i] * guide[i]; }
  const meanG = boxBlur(guide, width, height, radius);
  const meanP = boxBlur(input, width, height, radius);
  const meanGP = boxBlur(gp, width, height, radius);
  const meanGG = boxBlur(gg, width, height, radius);
  const a = new Float32Array(n), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const variance = meanGG[i] - meanG[i] * meanG[i];
    a[i] = (meanGP[i] - meanG[i] * meanP[i]) / (variance + eps);
    b[i] = meanP[i] - a[i] * meanG[i];
  }
  const meanA = boxBlur(a, width, height, radius), meanB = boxBlur(b, width, height, radius);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.min(1, Math.max(0, meanA[i] * guide[i] + meanB[i]));
  return out;
}
