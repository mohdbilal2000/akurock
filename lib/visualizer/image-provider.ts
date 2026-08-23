import type { RenderRequest, RenderResult } from './types';

/**
 * Stage 3: the inpainting call.
 *
 * Three providers are supported and picked by whichever key is configured, so
 * the site is not married to one vendor's pricing or availability:
 *
 *   GEMINI_API_KEY  → Gemini image editing (instruction-driven, no mask)
 *   OPENAI_API_KEY  → gpt-image-1 /images/edits (mask: transparent = repaint)
 *   FAL_KEY         → FLUX Fill via fal.run   (mask: white = repaint)
 *
 * Set VISUALIZER_IMAGE_PROVIDER to force one when several keys are present.
 *
 * NOTE: these are third-party request shapes. They are the documented shapes at
 * time of writing, but each vendor moves fast — if a provider starts returning
 * 400s, re-check its current API reference before assuming the pipeline broke.
 */

export type ProviderName = 'gemini' | 'openai' | 'fal';

/**
 * How each provider reads the mask. The browser draws the mask, so it has to
 * know which convention to use — there is no image decoder on this server to
 * convert between them, and shipping one just to invert a bitmap is not worth
 * the cold-start cost.
 *
 *   'alpha-hole'  — repaint where the mask is TRANSPARENT (gpt-image-1)
 *   'white-paint' — repaint where the mask is WHITE (FLUX Fill)
 *   'none'        — provider takes no mask and works from the instruction
 */
export type MaskConvention = 'alpha-hole' | 'white-paint' | 'none';

const MASK_CONVENTIONS: Record<ProviderName, MaskConvention> = {
  gemini: 'none',
  openai: 'alpha-hole',
  fal: 'white-paint',
};

export function maskConvention(): MaskConvention | null {
  const provider = selectProvider();
  return provider ? MASK_CONVENTIONS[provider] : null;
}

export function selectProvider(): ProviderName | null {
  const forced = process.env.VISUALIZER_IMAGE_PROVIDER as ProviderName | undefined;
  if (forced) return forced;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.FAL_KEY) return 'fal';
  return null;
}

/** Split a data URL into its mime type and base64 payload. */
function splitDataUrl(dataUrl: string): { mime: string; data: string } {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error('Expected a base64 data URL.');
  return { mime: match[1], data: match[2] };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const { mime, data } = splitDataUrl(dataUrl);
  const bytes = Buffer.from(data, 'base64');
  return new Blob([new Uint8Array(bytes)], { type: mime });
}

/**
 * The instruction every provider gets. It is deliberately specific about what
 * must NOT change: the failure mode of instruction-driven editing is a model
 * that "improves" the whole room, which would show the customer a house that
 * is not theirs.
 */
function buildPrompt(req: RenderRequest): string {
  const { analysis, stone } = req;
  const warmth =
    analysis.lighting.colorTemperatureKelvin < 3500
      ? 'warm tungsten'
      : analysis.lighting.colorTemperatureKelvin > 6000
        ? 'cool daylight'
        : 'neutral daylight';
  const occluders = analysis.occluders.map((o) => o.label).join(', ');

  return [
    `Composite an Akurock "${stone}" acoustic stone slat wall panel onto the wall in this room photograph.`,
    '',
    'The second image is a geometry reference showing exactly where the panel sits and how its slats are spaced and foreshortened. Match that placement, slat count and perspective precisely — do not redesign the product, change the slat pitch, or add slats.',
    '',
    'Render it as a real object in this room:',
    `- Light it as ${warmth} light arriving from ${Math.round(analysis.lighting.keyDirectionDegrees)} degrees clockwise from vertical, with ${analysis.lighting.contrast > 0.6 ? 'crisp, well-defined' : 'soft, diffuse'} shadows.`,
    '- The slats stand about 23 mm off the wall: cast real shadows into the gaps between them and a soft contact shadow onto the wall around the panel.',
    '- Match the photograph\'s white balance, exposure, grain and depth of field. The panel must look photographed, not pasted.',
    occluders
      ? `- ${occluders} stand in front of this wall. The panel goes BEHIND them; do not paint over them.`
      : '',
    '',
    'Change nothing else. Keep the room, its furniture, its colours and the camera framing exactly as they are.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function renderWithGemini(req: RenderRequest): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set.');

  const room = splitDataUrl(req.roomImage);
  const control = splitDataUrl(req.controlImage);

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildPrompt(req) },
              { inline_data: { mime_type: room.mime, data: room.data } },
              { inline_data: { mime_type: control.mime, data: control.data } },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini returned ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part?.inline_data ?? part?.inlineData;
    if (inline?.data) {
      const mime = inline.mime_type ?? inline.mimeType ?? 'image/png';
      return `data:${mime};base64,${inline.data}`;
    }
  }
  throw new Error('Gemini returned no image.');
}

async function renderWithOpenAI(req: RenderRequest): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set.');

  // gpt-image-1 repaints where the mask is TRANSPARENT. The browser already
  // drew it that way — it asks for the convention before building the mask.
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', buildPrompt(req));
  form.append('image', dataUrlToBlob(req.roomImage), 'room.png');
  form.append('mask', dataUrlToBlob(req.maskImage), 'mask.png');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`OpenAI returned ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI returned no image.');
  return `data:image/png;base64,${b64}`;
}

async function renderWithFal(req: RenderRequest): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY is not set.');

  const res = await fetch('https://fal.run/fal-ai/flux-pro/v1/fill', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Key ${key}` },
    body: JSON.stringify({
      image_url: req.roomImage,
      mask_url: req.maskImage,
      prompt: buildPrompt(req),
    }),
  });

  if (!res.ok) {
    throw new Error(`fal returned ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const url = json?.images?.[0]?.url;
  if (!url) throw new Error('fal returned no image.');

  // fal hands back a hosted URL; inline it so the browser never depends on
  // fal's CDN staying up (and so "save image" keeps working offline).
  if (url.startsWith('data:')) return url;
  const img = await fetch(url);
  if (!img.ok) throw new Error(`Could not fetch fal result: ${img.status}`);
  const buf = Buffer.from(await img.arrayBuffer());
  const mime = img.headers.get('content-type') ?? 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

export async function renderPanel(req: RenderRequest): Promise<RenderResult> {
  const provider = selectProvider();
  if (!provider) {
    throw new Error(
      'No image provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY or FAL_KEY.'
    );
  }

  const started = Date.now();
  const image =
    provider === 'gemini'
      ? await renderWithGemini(req)
      : provider === 'openai'
        ? await renderWithOpenAI(req)
        : await renderWithFal(req);

  return { image, provider, millis: Date.now() - started };
}
