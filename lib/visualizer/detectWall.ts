/**
 * Client wrapper around the wall-detection service (services/wall-ai),
 * reached through the same-origin proxy at /api/detect-wall so the service
 * URL and its key never reach the browser.
 *
 * Every failure mode here is non-fatal by design: the visualizer falls back
 * to the on-device edge heuristic and manual corner handles, which is the
 * behaviour it had before this service existed.
 */

import type { Point } from "@/lib/geometry/types";

export interface WallDetection {
  /** Image-space corners, top-left / top-right / bottom-right / bottom-left. */
  corners: [Point, Point, Point, Point];
  wallWidthMm: number;
  wallHeightMm: number;
  /** 0-1. Below MIN_AUTO_CONFIDENCE the UI asks the user to check the wall. */
  confidence: number;
  /**
   * "depth-plane" means the wall was measured in metres from the photo;
   * "mask-bbox" means the outline is real but the size is an assumption.
   */
  source: "depth-plane" | "mask-bbox";
  imageWidth: number;
  imageHeight: number;
  /** PNG data URL, white = wall surface. Clips panels to the real wall. */
  wallMaskUrl: string | null;
  /** PNG data URL, white = stands in front of the wall (sofa, socket, art). */
  occluderMaskUrl: string | null;
  notes: string[];
  timingsMs: Record<string, number>;
}

/**
 * Below this the detection is shown but not trusted: the UI opens on the
 * adjust step instead of the finished render, so nobody orders panels off a
 * wall the model only half-found.
 */
export const MIN_AUTO_CONFIDENCE = 0.45;

export class WallDetectionUnavailable extends Error {}

interface DetectOptions {
  /** Optional tap telling the service which wall the user means. */
  tap?: Point;
  signal?: AbortSignal;
}

/**
 * The photo is sent as-is rather than downscaled in the browser first.
 * Re-encoding through a canvas strips EXIF, and EXIF's 35mm-equivalent
 * focal length is what lets the service use the real camera intrinsics
 * instead of assuming a field of view — which is worth more accuracy than
 * the upload costs in seconds. The service downscales on arrival.
 */
export async function detectWall(photo: Blob, options: DetectOptions = {}): Promise<WallDetection> {
  const body = new FormData();
  body.append("photo", photo, "photo.jpg");
  if (options.tap) {
    body.append("tap_x", String(Math.round(options.tap.x)));
    body.append("tap_y", String(Math.round(options.tap.y)));
  }

  let response: Response;
  try {
    response = await fetch("/api/detect-wall", { method: "POST", body, signal: options.signal });
  } catch (cause) {
    throw new WallDetectionUnavailable("wall detection service unreachable", { cause });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new WallDetectionUnavailable(`wall detection failed (${response.status}) ${detail}`.trim());
  }

  return parseDetection(await response.json());
}

/** Narrows the service's JSON to the shape the renderer relies on. */
export function parseDetection(raw: unknown): WallDetection {
  const data = raw as Record<string, unknown>;
  const corners = data.corners as { x: number; y: number }[] | undefined;

  if (!Array.isArray(corners) || corners.length !== 4 || !corners.every(isFinitePoint)) {
    throw new WallDetectionUnavailable("wall detection returned an unusable quad");
  }

  const wallHeightMm = Number(data.wall_height_mm);
  const wallWidthMm = Number(data.wall_width_mm);
  if (!Number.isFinite(wallHeightMm) || !Number.isFinite(wallWidthMm) || wallHeightMm <= 0 || wallWidthMm <= 0) {
    throw new WallDetectionUnavailable("wall detection returned an unusable wall size");
  }

  return {
    corners: corners.map((c) => ({ x: Number(c.x), y: Number(c.y) })) as [Point, Point, Point, Point],
    wallWidthMm,
    wallHeightMm,
    confidence: clamp01(Number(data.confidence)),
    source: data.source === "depth-plane" ? "depth-plane" : "mask-bbox",
    imageWidth: Number(data.image_width) || 0,
    imageHeight: Number(data.image_height) || 0,
    wallMaskUrl: typeof data.wall_mask_png === "string" ? data.wall_mask_png : null,
    occluderMaskUrl: typeof data.occluder_mask_png === "string" ? data.occluder_mask_png : null,
    notes: Array.isArray(data.notes) ? data.notes.map(String) : [],
    timingsMs: (data.timings_ms as Record<string, number>) ?? {},
  };
}

function isFinitePoint(p: unknown): boolean {
  const point = p as { x?: unknown; y?: unknown };
  return Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
