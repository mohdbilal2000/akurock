import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';
import { analyseScene } from '@/lib/visualizer/scene-analysis';
import { maskConvention } from '@/lib/visualizer/image-provider';

// Vision on a room photo takes a few seconds; the default serverless timeout
// is too tight for it.
export const maxDuration = 60;

/** Room photos are resized client-side; anything past this is not a photo. */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMime = (typeof ALLOWED)[number];

export async function POST(request: NextRequest) {
  try {
    // Each analyse call is a paid vision request, so the limit is per-IP and
    // deliberately tight — this endpoint is the expensive one to abuse.
    const ip = getClientIP(request.headers);
    const { success } = rateLimit(`viz-analyze:${ip}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'The visualizer is not configured on this server.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const image = typeof body?.image === 'string' ? body.image : '';

    const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(image);
    if (!match) {
      return NextResponse.json(
        { error: 'Please send the photo as a base64 data URL.' },
        { status: 400 }
      );
    }

    const [, mime, data] = match;
    if (!ALLOWED.includes(mime as AllowedMime)) {
      return NextResponse.json(
        { error: 'Please use a JPEG, PNG or WebP photo.' },
        { status: 400 }
      );
    }

    // base64 inflates by 4/3; compare decoded size against the cap.
    if ((data.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'That photo is too large. Please use one under 6 MB.' },
        { status: 413 }
      );
    }

    const locale = ['de', 'en', 'es'].includes(body?.locale) ? body.locale : 'de';
    const analysis = await analyseScene(data, mime as AllowedMime, locale);
    // The browser draws the mask, so it needs the render provider's convention
    // back with the analysis — see MaskConvention in lib/visualizer.
    return NextResponse.json({ analysis, maskConvention: maskConvention() });
  } catch (error) {
    console.error('Visualizer scene analysis failed:', error);
    return NextResponse.json(
      { error: 'Could not read that room photo. Please try another.' },
      { status: 500 }
    );
  }
}
