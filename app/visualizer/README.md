# Akurock Wall Visualizer — Phase 1 (Geometry MVP)

Route: `/visualizer`. Self-contained — its own layout/html/body and its own
Tailwind CSS bundle, so it doesn't touch the Webflow-based rest of the site
(see `app/visualizer/tailwind.css` for why that's safe with the App Router).

## What Phase 1 does

1. Upload a wall photo (file picker or `capture="environment"` camera), or
   pick a preset room.
2. Click the wall's 4 corners.
3. Confirm the wall height (default 2.5 m) — this is the one real-world
   reference the whole scale model hangs off.
4. Pick a finish and drag a coverage rectangle.
5. See the composited result with a live panel count / m² / price
   calculator, and add it to the cart (stub).

Everything here is **deterministic geometry** — a 4-point homography
(`lib/geometry/homography.ts`), panel-snapping (`lib/geometry/coverage.ts`)
and a Lab* luminance transfer (`lib/geometry/luminance.ts`) — rendered with
a single WebGL fragment-shader warp (`lib/render/compositor.ts`). No model
inference, no network calls. Panel counts and prices coming out of this are
trustworthy for ordering.

## Structure

- `lib/geometry/` — pure functions, unit-tested with Vitest (`npm test`).
  No DOM/WebGL dependency; safe to run in CI.
- `lib/render/` — the WebGL compositor and its shaders. Browser-only.
- `components/visualizer/` — the UI, one component per interaction step.
- `config/panels.ts` / `config/prices.ts` — physical panel spec, finishes,
  and pricing (currently €220/panel flat across all 6 finishes, per
  `public/data/mock-cms-data.json`).

## Extension points (Phase 2 / Phase 3)

`lib/render/extensionPoints.ts` declares two typed stubs with no
implementation — the seams the later phases plug into without touching
geometry or pricing:

- `detectWall(image, tapPoint): Promise<WallPlaneDetection>` — Phase 2's
  SAM 2 tap-to-select + Depth Anything v2 plane fit. Replaces the manual
  4-corner click in `components/visualizer/CornerPicker.tsx`; call sites
  should fall back to manual picking if this throws or is unavailable.
- `relight(composite, wallMask, swatch): Promise<Blob>` — Phase 3's
  `gemini-3.1-flash-image` photoreal pass. The instant composite this route
  already produces stays authoritative for panel count regardless of what
  relight returns — run the slat-edge-count guardrail from the build spec
  before trusting a relit render enough to show it as the default.

## Not done in Phase 1 (by design)

- Automatic wall detection (manual corners only).
- Photoreal relight / the "Photoreal" toggle.
- Cart integration beyond the `/api/cart` stub, OG share images, QR
  landing, PostHog events.
