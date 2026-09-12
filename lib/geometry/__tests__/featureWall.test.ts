import { describe, expect, it } from "vitest";
import { suggestFeatureWall, FEATURE_WALL_WIDTH_RATIO } from "../coverageLayout";
import { PANEL } from "@/config/panels";

/**
 * The layout the tool opens on, straight after the photo. These assertions
 * are the promise made to the customer: what is drawn is a whole number of
 * real panels, it fits the wall that was measured, and the price under it
 * is for panels that can actually be installed that way.
 */
describe("suggestFeatureWall", () => {
  it("uses whole panels only — never a rip cut down a slat panel", () => {
    for (const wallWidthMm of [2000, 2600, 3400, 4100, 5200, 6000]) {
      const layout = suggestFeatureWall(wallWidthMm, 2500, PANEL, "vertical");
      expect(Number.isInteger(layout.panelsAcross)).toBe(true);
      expect(Number.isInteger(layout.panelsHigh)).toBe(true);
      expect(layout.panelCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("leaves bare wall each side instead of cladding corner to corner", () => {
    const wallWidthMm = 4200;
    const layout = suggestFeatureWall(wallWidthMm, 2500, PANEL, "vertical");

    expect(layout.rectMm.width).toBeLessThan(wallWidthMm);
    expect(layout.rectMm.width / wallWidthMm).toBeGreaterThan(0.4);
    expect(layout.rectMm.width / wallWidthMm).toBeLessThanOrEqual(FEATURE_WALL_WIDTH_RATIO + 0.12);
  });

  it("centres the run and stands it on the floor", () => {
    const layout = suggestFeatureWall(4000, 2500, PANEL, "vertical");
    const leftGap = layout.rectMm.x;
    const rightGap = 4000 - (layout.rectMm.x + layout.rectMm.width);

    expect(leftGap).toBeCloseTo(rightGap, 6);
    expect(layout.rectMm.y + layout.rectMm.height).toBeCloseTo(2500, 6);
  });

  it("never proposes a run taller than a single panel is long", () => {
    // A 3.6m atrium wall: a 2.4m run off the floor, not a joined 3.6m one.
    const layout = suggestFeatureWall(4000, 3600, PANEL, "vertical");
    expect(layout.rectMm.height).toBeLessThanOrEqual(PANEL.widthMm);
    expect(layout.rectMm.height).toBe(2400);
  });

  it("keeps the panels inside a low wall", () => {
    const layout = suggestFeatureWall(3000, 2100, PANEL, "vertical");
    expect(layout.rectMm.height).toBeLessThanOrEqual(2100);
    expect(layout.rectMm.y).toBeGreaterThanOrEqual(0);
  });

  it("fits at least one panel on a wall narrower than the target", () => {
    const layout = suggestFeatureWall(900, 2400, PANEL, "vertical");
    expect(layout.panelsAcross).toBe(1);
    expect(layout.rectMm.width).toBeLessThanOrEqual(900);
  });

  it("stacks courses when the panels run horizontally", () => {
    const layout = suggestFeatureWall(4000, 2500, PANEL, "horizontal");
    // Horizontal panels are 2400 long x 600 high: courses stack up the wall.
    expect(layout.rectMm.height % PANEL.heightMm).toBeCloseTo(0, 6);
    expect(layout.rectMm.height).toBeLessThanOrEqual(2500);
    expect(layout.rectMm.width % PANEL.widthMm).toBeCloseTo(0, 6);
  });

  it("never overhangs the wall it was measured on", () => {
    for (const [w, h] of [[1800, 2200], [3000, 2400], [5000, 2700], [8000, 3200]] as const) {
      const { rectMm } = suggestFeatureWall(w, h, PANEL, "vertical");
      expect(rectMm.x).toBeGreaterThanOrEqual(0);
      expect(rectMm.y).toBeGreaterThanOrEqual(0);
      expect(rectMm.x + rectMm.width).toBeLessThanOrEqual(w + 1e-6);
      expect(rectMm.y + rectMm.height).toBeLessThanOrEqual(h + 1e-6);
    }
  });
});
