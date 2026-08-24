import { describe, expect, it } from "vitest";
import {
  clampCoverageToWall,
  moveCoverage,
  panelStep,
  resizeCoverage,
  suggestCoverage,
} from "../coverageLayout";
import { PANEL } from "@/config/panels";

// Vertical orientation: panel footprint is 600mm wide x 2400mm tall.
const WALL_W = 4000;
const WALL_H = 2500;

describe("suggestCoverage", () => {
  it("fills a 4m x 2.5m wall with the largest fitting vertical-panel grid", () => {
    const result = suggestCoverage(WALL_W, WALL_H, PANEL, "vertical");
    // 4000/600 = 6.66 -> 6.5 across; 2500/2400 = 1.04 -> 1 high
    expect(result.panelsAcross).toBe(6.5);
    expect(result.panelsHigh).toBe(1);
    expect(result.rectMm.width).toBe(6.5 * 600);
    expect(result.rectMm.height).toBe(2400);
  });

  it("centres horizontally and anchors to the floor", () => {
    const result = suggestCoverage(WALL_W, WALL_H, PANEL, "vertical");
    expect(result.rectMm.x).toBeCloseTo((WALL_W - result.rectMm.width) / 2, 6);
    expect(result.rectMm.y).toBeCloseTo(WALL_H - result.rectMm.height, 6);
  });

  it("never suggests less than half a panel on a tiny wall", () => {
    const result = suggestCoverage(200, 200, PANEL, "vertical");
    expect(result.panelsAcross).toBe(0.5);
    expect(result.panelsHigh).toBe(0.5);
  });

  it("respects orientation", () => {
    const result = suggestCoverage(WALL_W, WALL_H, PANEL, "horizontal");
    // 4000/2400 = 1.66 -> 1.5 across; 2500/600 = 4.16 -> 4 high
    expect(result.panelsAcross).toBe(1.5);
    expect(result.panelsHigh).toBe(4);
  });
});

describe("moveCoverage / clampCoverageToWall", () => {
  const rect = { x: 1000, y: 100, width: 1200, height: 2400 };

  it("moves freely inside the wall", () => {
    const moved = moveCoverage(rect, 200, -50, WALL_W, WALL_H);
    expect(moved.x).toBe(1200);
    expect(moved.y).toBe(50);
    expect(moved.width).toBe(rect.width);
  });

  it("clamps at the wall edges", () => {
    const moved = moveCoverage(rect, -5000, 5000, WALL_W, WALL_H);
    expect(moved.x).toBe(0);
    expect(moved.y).toBe(WALL_H - rect.height);
  });

  it("clamps an oversized rect to origin 0", () => {
    const clamped = clampCoverageToWall({ x: 50, y: 50, width: 9000, height: 9000 }, WALL_W, WALL_H);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
  });
});

describe("resizeCoverage", () => {
  const step = panelStep(PANEL, "vertical"); // 600 x 2400
  const rect = { x: 600, y: 100, width: 3 * step.x, height: step.y };

  it("dragging the BR handle keeps TL fixed and snaps the size", () => {
    const result = resizeCoverage(
      rect,
      "br",
      { x: rect.x + 2.2 * step.x, y: rect.y + step.y },
      PANEL,
      "vertical",
      WALL_W,
      WALL_H,
    );
    expect(result.rectMm.x).toBe(rect.x);
    expect(result.rectMm.y).toBe(rect.y);
    expect(result.panelsAcross).toBe(2); // 2.2 snaps to 2
    expect(result.panelsHigh).toBe(1);
  });

  it("dragging the TL handle keeps BR fixed", () => {
    const result = resizeCoverage(
      rect,
      "tl",
      { x: rect.x + step.x, y: rect.y },
      PANEL,
      "vertical",
      WALL_W,
      WALL_H,
    );
    const right = result.rectMm.x + result.rectMm.width;
    expect(right).toBeCloseTo(rect.x + rect.width, 6);
    expect(result.panelsAcross).toBe(2);
  });

  it("never shrinks below half a panel", () => {
    const result = resizeCoverage(
      rect,
      "br",
      { x: rect.x + 10, y: rect.y + 10 },
      PANEL,
      "vertical",
      WALL_W,
      WALL_H,
    );
    expect(result.panelsAcross).toBe(0.5);
    expect(result.panelsHigh).toBe(0.5);
  });

  it("stays inside the wall even when dragged past the edge", () => {
    const result = resizeCoverage(
      rect,
      "br",
      { x: WALL_W + 500, y: WALL_H + 500 },
      PANEL,
      "vertical",
      WALL_W,
      WALL_H,
    );
    const r = result.rectMm;
    expect(r.x + r.width).toBeLessThanOrEqual(WALL_W + 1e-6);
    expect(r.y + r.height).toBeLessThanOrEqual(WALL_H + 1e-6);
  });
});

describe("suggestCoverage width cap", () => {
  it("does not auto-fill an implausibly wide inferred wall", () => {
    // A loose corner pick on a room photo can imply a wall this wide.
    const result = suggestCoverage(8000, 1880, PANEL, "vertical");
    expect(result.rectMm.width).toBeLessThanOrEqual(4000);
    // 4000/600 -> 6.5 across, 1880/2400 -> 0.5 high => 3.25 panels, not ~10.
    expect(result.panelCount).toBeLessThan(4);
  });

  it("still fills a wall narrower than the cap completely", () => {
    const result = suggestCoverage(3000, 2500, PANEL, "vertical");
    expect(result.panelsAcross).toBe(5); // 3000/600 = 5 exactly
    expect(result.rectMm.width).toBe(3000);
  });

  it("stays centred on the real wall after capping", () => {
    const result = suggestCoverage(8000, 2500, PANEL, "vertical");
    expect(result.rectMm.x).toBeCloseTo((8000 - result.rectMm.width) / 2, 6);
  });

  it("honours an explicit cap", () => {
    const result = suggestCoverage(8000, 2500, PANEL, "vertical", 1200);
    expect(result.rectMm.width).toBeLessThanOrEqual(1200);
  });
});
