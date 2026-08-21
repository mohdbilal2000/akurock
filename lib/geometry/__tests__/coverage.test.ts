import { describe, expect, it } from "vitest";
import { rectFromDragPoints, snapCoverageToPanels } from "../coverage";
import { PANEL } from "@/config/panels";

describe("snapCoverageToPanels", () => {
  it("snaps an exact 3-panel-wide, 1-panel-high horizontal run", () => {
    const result = snapCoverageToPanels(
      { x: 0, y: 0, width: 3 * PANEL.widthMm, height: PANEL.heightMm },
      PANEL,
      "horizontal",
    );
    expect(result.panelsAcross).toBe(3);
    expect(result.panelsHigh).toBe(1);
    expect(result.panelCount).toBe(3);
    expect(result.rectMm.width).toBe(3 * PANEL.widthMm);
    expect(result.areaM2).toBeCloseTo((3 * PANEL.widthMm * PANEL.heightMm) / 1_000_000, 6);
  });

  it("snaps a slightly-off drag down to the nearest half panel", () => {
    // 2.3 panels wide -> snaps to 2.5; 0.9 panels high -> snaps to 1.0
    const result = snapCoverageToPanels(
      { x: 0, y: 0, width: 2.3 * PANEL.widthMm, height: 0.9 * PANEL.heightMm },
      PANEL,
      "horizontal",
    );
    expect(result.panelsAcross).toBe(2.5);
    expect(result.panelsHigh).toBe(1);
    expect(result.panelCount).toBe(2.5);
  });

  it("never snaps below half a panel even for a tiny drag", () => {
    const result = snapCoverageToPanels({ x: 0, y: 0, width: 10, height: 10 }, PANEL, "horizontal");
    expect(result.panelsAcross).toBe(0.5);
    expect(result.panelsHigh).toBe(0.5);
  });

  it("swaps the long edge to Y when orientation is vertical", () => {
    const result = snapCoverageToPanels(
      { x: 0, y: 0, width: PANEL.heightMm, height: PANEL.widthMm },
      PANEL,
      "vertical",
    );
    expect(result.panelsAcross).toBe(1);
    expect(result.panelsHigh).toBe(1);
    expect(result.panelCount).toBe(1);
  });

  it("preserves the rect origin", () => {
    const result = snapCoverageToPanels(
      { x: 350, y: 900, width: PANEL.widthMm, height: PANEL.heightMm },
      PANEL,
      "horizontal",
    );
    expect(result.rectMm.x).toBe(350);
    expect(result.rectMm.y).toBe(900);
  });
});

describe("rectFromDragPoints", () => {
  it("normalises regardless of drag direction", () => {
    const a = rectFromDragPoints({ x: 500, y: 800 }, { x: 100, y: 200 });
    const b = rectFromDragPoints({ x: 100, y: 200 }, { x: 500, y: 800 });
    expect(a).toEqual(b);
    expect(a).toEqual({ x: 100, y: 200, width: 400, height: 600 });
  });
});
