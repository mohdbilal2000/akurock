/**
 * Physical truth for Akurock wall panels. These numbers are what make the
 * homography scale, slat width and panel count believable — see
 * lib/geometry/coverage.ts. Sourced from public/detail_product_template.html
 * ("240 x 60 x 2.3 cm") and the legacy 2D tool's SLAT_RATIO/DEPTH_RATIO
 * (public/html/visualizer.html).
 */

export type PanelOrientation = "horizontal" | "vertical";

export interface PanelSpec {
  /** Long edge of the panel as manufactured, in millimetres. */
  widthMm: number;
  /** Short edge of the panel as manufactured, in millimetres. */
  heightMm: number;
  /** Panel depth off the wall, in millimetres. */
  depthMm: number;
  /** Repeat distance between slat centres, in millimetres. */
  slatPitchMm: number;
  /** Visible slat face width within one pitch, in millimetres. */
  slatWidthMm: number;
}

export const PANEL: PanelSpec = {
  widthMm: 2400,
  heightMm: 600,
  depthMm: 23,
  slatPitchMm: 64,
  slatWidthMm: 42,
};

/**
 * Physical footprint the face-*.webp stone textures span when tiled in
 * wall space. The images are ~1:4 (576x2225) — one 600x2400mm panel face.
 * Slats are drawn procedurally on top (lib/render/shaders.ts); these
 * textures only contribute stone grain.
 */
export const STONE_TEXTURE_SPAN_MM = { width: 600, height: 2400 } as const;

/** Classic Akurock mounting is vertical panels -> vertical slats. */
export const DEFAULT_ORIENTATION: PanelOrientation = "vertical";

export interface Finish {
  slug: string;
  name: string;
  /** Approximate flat colour, used as a loading/placeholder background. */
  felt: string;
  /** Seamless texture tile used on the wall (2k, tiled along the slat direction). */
  textureUrl: string;
  /** Real swatch photo shown in the finish picker strip. */
  swatchUrl: string;
}

export const FINISHES: Finish[] = [
  { slug: "whisper", name: "Whisper", felt: "#b9b8bc", textureUrl: "/images/visualizer/face-whisper.webp", swatchUrl: "/images/visualizer/swatch-whisper.webp" },
  { slug: "brush", name: "Brush", felt: "#cdcacc", textureUrl: "/images/visualizer/face-brush.webp", swatchUrl: "/images/visualizer/swatch-brush.webp" },
  { slug: "gaia", name: "Gaia", felt: "#131313", textureUrl: "/images/visualizer/face-gaia.webp", swatchUrl: "/images/visualizer/swatch-gaia.webp" },
  { slug: "yami", name: "Yami", felt: "#242628", textureUrl: "/images/visualizer/face-yami.webp", swatchUrl: "/images/visualizer/swatch-yami.webp" },
  { slug: "yuki", name: "Yuki", felt: "#cdcbce", textureUrl: "/images/visualizer/face-yuki.webp", swatchUrl: "/images/visualizer/swatch-yuki.webp" },
  { slug: "ligia", name: "Ligia", felt: "#191a1b", textureUrl: "/images/visualizer/face-ligia.webp", swatchUrl: "/images/visualizer/swatch-ligia.webp" },
];

export const PRESET_ROOMS = [
  { slug: "living", label: "Living room", url: "/images/visualizer/room-living.webp" },
  { slug: "bedroom", label: "Bedroom", url: "/images/visualizer/room-bedroom.webp" },
  { slug: "japandi", label: "Japandi", url: "/images/visualizer/room-japandi.webp" },
] as const;

export const DEFAULT_WALL_HEIGHT_MM = 2500;
export const MIN_WALL_HEIGHT_MM = 1800;
export const MAX_WALL_HEIGHT_MM = 4000;
