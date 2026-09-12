# Akurock Wall Visualizer

Route: `/visualizer`. Self-contained — its own layout/html/body and its own
Tailwind CSS bundle, so it doesn't touch the Webflow-based rest of the site
(see `app/visualizer/tailwind.css` for why that's safe with the App Router).

## The flow

1. Upload a wall photo (file picker or `capture="environment"` camera), or
   pick a preset room.
2. **The wall is found, measured and rendered — no questions asked.** The
   photo goes to `services/wall-ai`, which returns the wall's corners, its
   real size in metres, and two masks; the panels are laid out and
   composited immediately.
3. Adjust if you want to: narrower/wider by whole panels, a different
   finish, horizontal/vertical, a different wall height, or drag the
   corners and the coverage rectangle directly.
4. Save the image or add the panels to the cart.

Steps 3 and 4 are the same tool as before. Step 2 is what changed: the old
flow made the customer tap four corners and type a wall height before
seeing anything.

## Two layers, and why they stay separate

**Deterministic geometry** decides what is true. A 4-point homography
(`lib/geometry/homography.ts`), panel snapping (`lib/geometry/coverage.ts`),
the feature-wall layout (`lib/geometry/coverageLayout.ts`) and a Lab*
luminance transfer (`lib/geometry/luminance.ts`), rendered by a single WebGL
fragment-shader warp (`lib/render/compositor.ts`). Panel counts and prices
come from here and are trustworthy for ordering.

**AI** decides what to point that geometry at — and nothing else. The
service returns corners, a measured wall size, and masks; if any of it is
missing, wrong-looking, or the service is down, the geometry layer still
produces a correct answer from manual corners. No model output ever lands
straight on a price.

### What the AI contributes

- **The wall**, segmented (SegFormer/ADE20K), so nobody taps corners.
- **Its size in metres**, from metric monocular depth (Depth Anything V2)
  and a RANSAC plane fit, so nobody types a wall height and the panel count
  is true to scale from the first frame.
- **Occlusion**: a mask of everything standing in front of the wall, fed to
  the shader so panels render *behind* the sofa, the radiator, the plug and
  its cable. This is the single biggest realism win — a composite that
  paints over the socket is the one that gets spotted as fake.

See `services/wall-ai/README.md` for models, deployment and fallbacks.

## The auto layout

`suggestFeatureWall` is the layout the tool opens on, and it is deliberately
**not** the whole wall:

- a whole number of real 600mm-wide panels (never a half panel — that's a
  rip cut down a slat panel, which isn't how these are installed),
- about 62% of the measured wall width, centred, with bare wall left each
  side so it reads as a feature rather than as cladding,
- standing on the floor, and never taller than a panel is long (2400mm), so
  the run needs no butt joint,
- on a wall lower than 2400mm the panels are simply cut to height — the
  drawing shows the wall's height, the count still bills whole panels.

Every one of those rules is asserted in
`lib/geometry/__tests__/featureWall.test.ts`.

## Structure

- `lib/geometry/` — pure functions, unit-tested with Vitest (`npm test`).
  No DOM/WebGL dependency; safe to run in CI.
- `lib/render/` — the WebGL compositor and its shaders. Browser-only.
- `lib/visualizer/detectWall.ts` — the detection client and its response
  validation (every field that could put a wrong wall on screen is checked).
- `app/api/detect-wall/` — server-side proxy holding the service URL and key.
- `components/visualizer/` — the UI, one component per interaction step.
- `services/wall-ai/` — the Python service (FastAPI + torch), with its own
  pytest suite that needs no model weights.
- `config/panels.ts` / `config/prices.ts` — physical panel spec, finishes,
  and pricing.

## Configuration

`WALL_AI_URL` and `WALL_AI_API_KEY` (see `.env.example`). With neither set,
the route returns 503 and the visualizer runs exactly as it did before the
service existed: on-device edge detection plus manual corner handles.

## Not done yet (by design)

- Photoreal relight (`lib/render/extensionPoints.ts` keeps the typed seam).
- OG share images, QR landing, PostHog events.
- Cart integration beyond the `/api/cart` stub.
