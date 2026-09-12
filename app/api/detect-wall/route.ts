/**
 * Same-origin proxy to the Python wall-detection service
 * (services/wall-ai). Keeps WALL_AI_URL and its shared secret server-side,
 * and turns "not configured" into a clean 503 the client answers by falling
 * back to manual corner picking.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Inference is CPU-bound and can take a few seconds on a cold service.
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = Number(process.env.WALL_AI_TIMEOUT_MS ?? 45_000);

export async function POST(request: Request) {
  const serviceUrl = normaliseServiceUrl(process.env.WALL_AI_URL);
  if (!serviceUrl) {
    return NextResponse.json(
      { error: "wall detection is not configured", code: "not_configured" },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const photo = form.get("photo");
  if (!(photo instanceof Blob)) {
    return NextResponse.json({ error: "photo is required" }, { status: 400 });
  }
  if (photo.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "photo too large" }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("photo", photo, "photo.jpg");
  for (const key of ["tap_x", "tap_y"]) {
    const value = form.get(key);
    if (typeof value === "string") upstream.append(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${serviceUrl}/detect`, {
      method: "POST",
      body: upstream,
      signal: controller.signal,
      headers: process.env.WALL_AI_API_KEY ? { "X-API-Key": process.env.WALL_AI_API_KEY } : undefined,
    });

    const payload = await response.text();
    return new NextResponse(payload, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "wall detection timed out" : "wall detection unavailable" },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Render's `fromService` wiring hands over a bare "host:port" (see
 * render.yaml), while a local .env usually holds a full URL. Accept either
 * rather than failing with a confusing "Invalid URL" at request time.
 */
function normaliseServiceUrl(raw: string | undefined): string | null {
  const value = raw?.trim().replace(/\/$/, "");
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `http://${value}`;
}
