import type { Rect } from "./types";
import type { PanelOrientation, PanelSpec } from "@/config/panels";

export interface CoverageResult {
  /** Coverage rect snapped to whole/half panels, in wall millimetres. */
  rectMm: Rect;
  panelsAcross: number;
  panelsHigh: number;
  panelCount: number;
  areaM2: number;
}

/** Rounds a ratio to the nearest half, with a half-panel floor. */
function snapToHalf(ratio: number): number {
  return Math.max(0.5, Math.round(ratio * 2) / 2);
}

/**
 * Snaps a raw wall-space coverage rect (from the user's drag) to whole/half
 * panel multiples and derives the panel count, total footprint and area.
 * `panel` is oriented per `orientation`: horizontal lays the 2400mm edge
 * along X, vertical lays it along Y.
 */
export function snapCoverageToPanels(
  rawRectMm: Rect,
  panel: PanelSpec,
  orientation: PanelOrientation,
): CoverageResult {
  const panelStepXMm = orientation === "horizontal" ? panel.widthMm : panel.heightMm;
  const panelStepYMm = orientation === "horizontal" ? panel.heightMm : panel.widthMm;

  const panelsAcross = snapToHalf(rawRectMm.width / panelStepXMm);
  const panelsHigh = snapToHalf(rawRectMm.height / panelStepYMm);

  const width = panelsAcross * panelStepXMm;
  const height = panelsHigh * panelStepYMm;

  return {
    rectMm: { x: rawRectMm.x, y: rawRectMm.y, width, height },
    panelsAcross,
    panelsHigh,
    panelCount: panelsAcross * panelsHigh,
    areaM2: (width * height) / 1_000_000,
  };
}

/** Axis-aligned bounding rect (in wall mm) of two dragged corner points. */
export function rectFromDragPoints(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
}
