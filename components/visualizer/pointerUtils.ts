import type { Point } from "@/lib/geometry/types";

/** Fraction (0-1, 0-1) of a pointer event within an element's rendered box. */
export function fractionalPoint(el: HTMLElement, clientX: number, clientY: number): Point {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.width > 0 ? (clientX - rect.left) / rect.width : 0,
    y: rect.height > 0 ? (clientY - rect.top) / rect.height : 0,
  };
}

/** Converts a 0-1 fractional point (relative to the displayed image) into natural-pixel image space. */
export function toNaturalPoint(fraction: Point, naturalWidth: number, naturalHeight: number): Point {
  return {
    x: clamp(fraction.x, 0, 1) * naturalWidth,
    y: clamp(fraction.y, 0, 1) * naturalHeight,
  };
}

/** Converts a natural-pixel image point back to a 0-1 fraction, for drawing overlays. */
export function toFraction(point: Point, naturalWidth: number, naturalHeight: number): Point {
  return {
    x: naturalWidth > 0 ? point.x / naturalWidth : 0,
    y: naturalHeight > 0 ? point.y / naturalHeight : 0,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
