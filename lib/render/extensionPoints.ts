/**
 * Typed stubs for the work Phase 1 deliberately does NOT do. Phase 1's
 * corner-picking and instant composite already produce a correct answer;
 * these are the seams where Phase 2 (auto wall detection) and Phase 3
 * (photoreal relight) plug in without touching the geometry/pricing layer.
 * See README.md "Extension points" for the full brief.
 */

export interface WallPlaneDetection {
  /** Image-space corners, top-left/top-right/bottom-right/bottom-left. */
  corners: readonly [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
  /** 0-1 confidence from the segmentation/plane-fit model. */
  confidence: number;
}

/**
 * Phase 2: SAM 2 tap-to-select + Depth Anything v2 plane fit, replacing the
 * manual 4-corner click with an automatic mask + RANSAC plane estimate.
 * Not implemented in Phase 1 — call sites should fall back to manual corner
 * picking when this throws or is unavailable.
 */
export declare function detectWall(image: HTMLImageElement, tapPoint: { x: number; y: number }): Promise<WallPlaneDetection>;

/**
 * Phase 3: sends the instant composite + original photo + finish swatch to
 * gemini-3.1-flash-image for a photoreal relight pass (shading, relief,
 * shadow realism). The instant composite's geometry (panel count, mm sizes)
 * stays authoritative for ordering regardless of what this returns — see
 * the guardrail check in the build spec (slat-edge count comparison).
 */
export declare function relight(
  composite: Blob,
  wallMask: Blob,
  swatch: Blob,
): Promise<Blob>;
