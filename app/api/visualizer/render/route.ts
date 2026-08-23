import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';
import { renderPanel, selectProvider } from '@/lib/visualizer/image-provider';
import type { RenderRequest, SceneAnalysis } from '@/lib/visualizer/types';

// Inpainting is the slow stage — several seconds on every provider.
export const maxDuration = 120;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isDataUrl(value: unknown, cap = MAX_IMAGE_BYTES): value is string {
  if (typeof value !== 'string') return false;
  const match = /^data:image\/(png|jpeg|webp);base64,([\s\S]+)$/.exec(value);
  if (!match) return false;
  return (match[2].length * 3) / 4 <= cap;
}

export async function POST(request: NextRequest) {
  try {
    // The most expensive endpoint on the site — one call is one paid image
    // generation, so this limit is the abuse ceiling, not a fairness knob.
    const ip = getClientIP(request.headers);
    const { success } = rateLimit(`viz-render:${ip}`, {
      maxRequests: 6,
      windowMs: 60_000,
    });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many renders. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (!selectProvider()) {
      return NextResponse.json(
        { error: 'The visualizer is not configured on this server.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    if (
      !isDataUrl(body?.roomImage) ||
      !isDataUrl(body?.controlImage) ||
      !isDataUrl(body?.maskImage)
    ) {
      return NextResponse.json(
        { error: 'The render request was incomplete. Please try again.' },
        { status: 400 }
      );
    }

    const stone = typeof body?.stone === 'string' ? body.stone : '';
    // The stone name goes into the model prompt, so it is restricted to the
    // shape of a product name rather than passed through as free text.
    if (!/^[A-Za-z][A-Za-z0-9 -]{0,30}$/.test(stone)) {
      return NextResponse.json(
        { error: 'Unknown stone selection.' },
        { status: 400 }
      );
    }

    const analysis = body?.analysis as SceneAnalysis | undefined;
    if (!analysis?.wall?.corners || !analysis?.lighting) {
      return NextResponse.json(
        { error: 'Please analyse the room photo before rendering.' },
        { status: 400 }
      );
    }

    const req: RenderRequest = {
      roomImage: body.roomImage,
      controlImage: body.controlImage,
      maskImage: body.maskImage,
      stone,
      analysis,
    };

    const result = await renderPanel(req);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Visualizer render failed:', error);
    return NextResponse.json(
      { error: 'Could not render the panel. Please try again.' },
      { status: 500 }
    );
  }
}
