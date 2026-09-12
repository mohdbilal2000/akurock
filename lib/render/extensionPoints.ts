/**
 * The seam Phase 3 (photoreal relight) plugs into without touching the
 * geometry/pricing layer. See app/visualizer/README.md.
 *
 * Phase 2 — automatic wall detection — is no longer a stub: it ships as the
 * Python service in services/wall-ai, called through
 * lib/visualizer/detectWall.ts. Its WallPlaneDetection lives there.
 */

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
