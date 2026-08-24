/**
 * Auto panel layout + interactive coverage editing, all in wall-mm space.
 * The "auto maps the best panel grid" behaviour: as soon as the wall is
 * confirmed, suggestCoverage fills it with the largest whole/half-panel
 * grid that fits, centred — so the user sees a finished wall immediately
 * and only adjusts if they want less/more.
 */

import type { PanelOrientation, PanelSpec } from "@/config/panels";
import type { Rect } from "./types";
import { snapCoverageToPanels, type CoverageResult } from "./coverage";

export function panelStep(panel: PanelSpec, orientation: PanelOrientation) {
  return orientation === "horizontal"
    ? { x: panel.widthMm, y: panel.heightMm }
    : { x: panel.heightMm, y: panel.widthMm };
}

/** Largest half-panel multiple of `step` that fits `available`, min half a panel. */
function maxFit(available: number, step: number): number {
  return Math.max(0.5, Math.floor((available / step) * 2) / 2);
}

/**
 * Fills the wall with the biggest whole/half-panel grid that fits,
 * horizontally centred and anchored to the floor (feature walls are
 * usually panelled full-height or from the floor up).
 */
export function suggestCoverage(
  wallWidthMm: number,
  wallHeightMm: number,
  panel: PanelSpec,
  orientation: PanelOrientation,
): CoverageResult {
  const step = panelStep(panel, orientation);
  const across = maxFit(wallWidthMm, step.x);
  const high = maxFit(wallHeightMm, step.y);
  const width = across * step.x;
  const height = high * step.y;

  const rect: Rect = {
    x: (wallWidthMm - width) / 2,
    y: wallHeightMm - height,
    width,
    height,
  };
  return snapCoverageToPanels(rect, panel, orientation);
}

/** Clamps a coverage rect's origin so it stays within the wall (size unchanged). */
export function clampCoverageToWall(rect: Rect, wallWidthMm: number, wallHeightMm: number): Rect {
  const x = Math.min(Math.max(rect.x, 0), Math.max(0, wallWidthMm - rect.width));
  const y = Math.min(Math.max(rect.y, 0), Math.max(0, wallHeightMm - rect.height));
  return { ...rect, x, y };
}

/** Moves a coverage rect by a wall-mm delta, kept inside the wall. */
export function moveCoverage(
  rect: Rect,
  deltaXMm: number,
  deltaYMm: number,
  wallWidthMm: number,
  wallHeightMm: number,
): Rect {
  return clampCoverageToWall(
    { ...rect, x: rect.x + deltaXMm, y: rect.y + deltaYMm },
    wallWidthMm,
    wallHeightMm,
  );
}

export type CoverageHandle = "tl" | "tr" | "br" | "bl";

/**
 * Resizes a coverage rect by dragging one of its corners to `pointMm`,
 * snapped to whole/half panels and kept inside the wall. The opposite
 * corner stays fixed — the natural touch behaviour.
 */
export function resizeCoverage(
  rect: Rect,
  handle: CoverageHandle,
  pointMm: { x: number; y: number },
  panel: PanelSpec,
  orientation: PanelOrientation,
  wallWidthMm: number,
  wallHeightMm: number,
): CoverageResult {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  // The corner opposite the dragged handle anchors the resize.
  const anchor = {
    tl: { x: right, y: bottom },
    tr: { x: rect.x, y: bottom },
    br: { x: rect.x, y: rect.y },
    bl: { x: right, y: rect.y },
  }[handle];

  const px = Math.min(Math.max(pointMm.x, 0), wallWidthMm);
  const py = Math.min(Math.max(pointMm.y, 0), wallHeightMm);

  const raw: Rect = {
    x: Math.min(anchor.x, px),
    y: Math.min(anchor.y, py),
    width: Math.abs(px - anchor.x),
    height: Math.abs(py - anchor.y),
  };

  const snapped = snapCoverageToPanels(raw, panel, orientation);

  // Snapping only grows/shrinks width/height; re-pin the anchor corner so
  // the fixed corner really stays fixed, then keep it on the wall.
  const rectMm: Rect = {
    x: px < anchor.x ? anchor.x - snapped.rectMm.width : anchor.x,
    y: py < anchor.y ? anchor.y - snapped.rectMm.height : anchor.y,
    width: snapped.rectMm.width,
    height: snapped.rectMm.height,
  };
  const clamped = clampCoverageToWall(rectMm, wallWidthMm, wallHeightMm);
  return { ...snapped, rectMm: clamped };
}
