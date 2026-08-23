/**
 * Shared types for the generative visualizer pipeline.
 *
 * The pipeline has three stages:
 *   1. ANALYSE  — Claude (vision) reads the room photo and returns the wall
 *                 plane, the light, and what occludes the wall.
 *   2. CONTROL  — the browser renders the panel geometry into that plane with
 *                 the existing three.js renderer. This is *not* the output; it
 *                 is a control signal that pins slat count, pitch and
 *                 perspective so the image model cannot invent a product that
 *                 Akurock does not sell.
 *   3. RENDER   — an image model repaints the masked wall region using the
 *                 photo + control render, producing real light transport,
 *                 contact shadows and occlusion.
 */

/** A point in normalised image space: 0..1 from the top-left of the photo. */
export interface Point {
  x: number;
  y: number;
}

/** Where the wall is, in the photo. Corners are ordered TL, TR, BR, BL. */
export interface WallPlane {
  corners: [Point, Point, Point, Point];
  /** Claude's confidence that this really is a flat, mountable wall. */
  confidence: number;
  /** Estimated real-world width of the quad in metres — sets the panel scale. */
  estimatedWidthMeters: number;
}

export interface SceneLighting {
  /**
   * Where the key light comes from, as seen by the camera. Degrees clockwise
   * from "directly above": 0 = from the top, 90 = from the right.
   */
  keyDirectionDegrees: number;
  /** 0 = flat overcast fill, 1 = hard single source with deep shadows. */
  contrast: number;
  /** Warm/cool cast of the room, in kelvin. Drives the panel's white balance. */
  colorTemperatureKelvin: number;
}

/**
 * Objects that sit *in front of* the wall (a bed, a plant, a lamp). The image
 * model needs these so the panel goes behind them instead of pasting over them
 * — the single biggest tell in the old renderer.
 */
export interface Occluder {
  label: string;
  /** Bounding box in normalised image space. */
  box: { x: number; y: number; width: number; height: number };
}

export interface SceneAnalysis {
  wall: WallPlane;
  lighting: SceneLighting;
  occluders: Occluder[];
  /** Set when the photo has no usable wall; the UI shows this instead. */
  rejectionReason: string | null;
}

export interface RenderRequest {
  /** The original room photo, as a data URL. */
  roomImage: string;
  /** The three.js geometry pass, as a data URL, matching the photo's size. */
  controlImage: string;
  /** White where the panel goes, black elsewhere; same size as the photo. */
  maskImage: string;
  /** Which Akurock stone was picked. */
  stone: string;
  analysis: SceneAnalysis;
}

export interface RenderResult {
  /** The finished composite, as a data URL. */
  image: string;
  provider: string;
  millis: number;
}
