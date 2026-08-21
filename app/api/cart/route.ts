import { NextResponse } from "next/server";

/**
 * Stub for the visualizer's "Add to cart" button. Phase 4 wires this into
 * the existing /quotation cart flow (app/(localized)/[locale]/quotation);
 * for now it just validates the payload shape and echoes it back so the UI
 * has a real request/response cycle to build against.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).finish !== "string" ||
    typeof (body as Record<string, unknown>).panelCount !== "number"
  ) {
    return NextResponse.json({ error: "Expected { finish, panelCount, ... }" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, received: body }, { status: 200 });
}
