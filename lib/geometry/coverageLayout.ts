/**
 * Auto panel layout + interactive coverage editing, all in wall-mm space.
 * As soon as the wall is measured, suggestFeatureWall lays out a run of
 * whole panels on it — so the user sees a finished wall immediately and
 * only adjusts if they want more or less of it.
 */

import type { PanelOrientation, PanelSpec } from "@/config/panels";
import type { Rect } from "./types";
import { snapCoverageToPanels, type CoverageResult } from "./coverage";

export function panelStep(panel: PanelSpec, orientation: PanelOrientation) {
  return orientation === "horizontal"
    ? { x: panel.widthMm, y: panel.heightMm }
    : { x: panel.heightMm, y: panel.widthMm };
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

/**
 * Proportion of the wall a feature panel run should take. Panelling a wall
 * corner-to-corner reads as cladding; leaving a reveal of bare wall each
 * side reads as a designed feature — and it is what people actually order,
 * so it is also the honest default for the price shown under it.
 */
export const FEATURE_WALL_WIDTH_RATIO = 0.62;

/** Bare wall to leave beside the panels, as a share of the wall width. */
const MIN_REVEAL_RATIO = 0.08;

/**
 * The layout the tool opens on: a whole number of real panels, centred on
 * the wall and standing on the floor.
 *
 * Two rules make it "true to the product" rather than a pretty rectangle:
 *
 * 1. Width is a whole panel count. Half panels mean a rip cut down the
 *    length of a slat panel, which is not how these are installed, so the
 *    suggestion never proposes one (dragging the handles still can).
 * 2. Height never exceeds the panel's own length, because a taller run
 *    needs a horizontal butt joint the renderer would have to draw and the
 *    installer would have to justify. On a normal 2.4-2.6m ceiling that is
 *    a full-height wall; on a 3.5m atrium it is a 2.4m run off the floor.
 */
export function suggestFeatureWall(
  wallWidthMm: number,
  wallHeightMm: number,
  panel: PanelSpec,
  orientation: PanelOrientation,
): CoverageResult {
  const step = panelStep(panel, orientation);

  // A panel's own length: the longest run that needs no butt joint. It
  // bounds the height only — across the wall, panels simply sit side by
  // side and the count is whatever the wall takes.
  const maxRunMm = panel.widthMm;

  const reveal = Math.max(step.x, wallWidthMm * MIN_REVEAL_RATIO);
  const maxAcross = Math.max(1, Math.floor((wallWidthMm - reveal) / step.x));
  const targetAcross = Math.round((wallWidthMm * FEATURE_WALL_WIDTH_RATIO) / step.x);
  const across = Math.min(Math.max(1, targetAcross), maxAcross);

  const usableHeightMm = Math.min(wallHeightMm, maxRunMm);
  const high = Math.max(1, Math.round(usableHeightMm / step.y));
  // Rounding up must never push the run past the ceiling.
  const highFitted = high * step.y > wallHeightMm ? Math.max(1, high - 1) : high;

  const width = Math.min(across * step.x, wallWidthMm);
  // A wall lower than a panel is long gets full-height panels cut down on
  // site: the drawn height is the wall, the count is still whole panels.
  // Snapping the drawing to a 2400 multiple instead would paint panels
  // through the ceiling.
  const height = Math.min(highFitted * step.y, wallHeightMm);

  const rectMm: Rect = {
    x: (wallWidthMm - width) / 2,
    y: wallHeightMm - height,
    width,
    height,
  };

  return {
    rectMm,
    panelsAcross: across,
    panelsHigh: highFitted,
    panelCount: across * highFitted,
    areaM2: (width * height) / 1_000_000,
  };
}

/**
 * Re-widths a panel run to a whole number of panels, keeping it centred
 * where it already sits and inside the wall. This is what the "narrower /
 * wider" control edits — one panel at a time, because a panel is the unit
 * the customer actually buys.
 */
export function setPanelsAcross(
  rect: Rect,
  panelsAcross: number,
  panel: PanelSpec,
  orientation: PanelOrientation,
  wallWidthMm: number,
): Rect {
  const step = panelStep(panel, orientation);
  const maxAcross = Math.max(1, Math.floor(wallWidthMm / step.x));
  const across = Math.min(Math.max(1, Math.round(panelsAcross)), maxAcross);
  const width = across * step.x;
  const centre = rect.x + rect.width / 2;

  return {
    ...rect,
    width,
    x: Math.min(Math.max(centre - width / 2, 0), Math.max(0, wallWidthMm - width)),
  };
}
