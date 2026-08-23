import Anthropic from '@anthropic-ai/sdk';
import type { SceneAnalysis } from './types';

/**
 * Stage 1 of the visualizer pipeline: read the room photo.
 *
 * This replaces two things the old visualizer got wrong. It found the wall by
 * making the visitor drag four corner handles — most never did, so the panel
 * sat in the photo at the wrong angle. And it guessed the light by averaging
 * the photo's luminance, which is why a cool grey panel ended up in a warm
 * beige bedroom. Claude reads both directly, plus the occluders the old
 * renderer had no concept of at all.
 */

const SCENE_TOOL: Anthropic.Tool = {
  name: 'report_scene',
  description:
    'Report the wall plane, lighting and occluding objects for a room photo.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      rejectionReason: {
        type: ['string', 'null'],
        description:
          'If there is no flat, unobstructed wall suitable for mounting a panel, explain why in one short sentence for the visitor. Otherwise null.',
      },
      wall: {
        type: 'object',
        additionalProperties: false,
        properties: {
          corners: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            description:
              'The largest usable flat wall region, as four points ordered top-left, top-right, bottom-right, bottom-left. Normalised 0..1 from the photo top-left. Follow the wall\'s real perspective — these should NOT form an axis-aligned rectangle unless the wall is exactly face-on.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
              },
              required: ['x', 'y'],
            },
          },
          confidence: { type: 'number' },
          estimatedWidthMeters: {
            type: 'number',
            description:
              'Real-world width of that wall region in metres, judged from furniture of known size (a double bed is ~1.6 m wide, an interior door ~0.8 m).',
          },
        },
        required: ['corners', 'confidence', 'estimatedWidthMeters'],
      },
      lighting: {
        type: 'object',
        additionalProperties: false,
        properties: {
          keyDirectionDegrees: {
            type: 'number',
            description:
              'Direction the dominant light comes from, degrees clockwise from straight above (0 = top, 90 = right, 180 = below, 270 = left). Read it from the shadows under furniture.',
          },
          contrast: {
            type: 'number',
            description:
              '0 for flat overcast fill with soft edges, 1 for a hard single source casting deep shadows.',
          },
          colorTemperatureKelvin: {
            type: 'number',
            description:
              'White balance of the room: ~2700 for warm tungsten, ~5500 for neutral daylight, ~7000 for cool blue shade.',
          },
        },
        required: [
          'keyDirectionDegrees',
          'contrast',
          'colorTemperatureKelvin',
        ],
      },
      occluders: {
        type: 'array',
        description:
          'Objects standing in front of the wall that a wall-mounted panel must appear BEHIND — headboards, beds, plants, lamps, shelves. Empty if the wall is clear.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string' },
            box: {
              type: 'object',
              additionalProperties: false,
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
              },
              required: ['x', 'y', 'width', 'height'],
            },
          },
          required: ['label', 'box'],
        },
      },
    },
    required: ['rejectionReason', 'wall', 'lighting', 'occluders'],
  },
};

const SYSTEM = `You are the scene-understanding stage of an interior visualizer for Akurock, which sells acoustic stone slat wall panels.

A visitor uploads a photo of their room. You locate the wall they would mount a panel on, and describe the light well enough that a downstream image model can composite a panel into the photo convincingly.

Be strict about the wall. Reject photos with no usable flat wall (exteriors, close-ups of objects, photos where every wall is hidden behind furniture), and say so in rejectionReason rather than guessing corners. A confident wrong wall is worse than an honest refusal.

Report the wall in the photo's true perspective. If the wall recedes from the camera, the far edge is shorter than the near edge and your four corners must reflect that.`;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Narrow the model's tool input to SceneAnalysis, clamping to sane ranges. */
function coerce(input: unknown): SceneAnalysis {
  if (!isRecord(input)) throw new Error('Scene analysis returned no object.');

  const wall = isRecord(input.wall) ? input.wall : {};
  const lighting = isRecord(input.lighting) ? input.lighting : {};

  const rawCorners = Array.isArray(wall.corners) ? wall.corners : [];
  if (rawCorners.length !== 4) {
    throw new Error('Scene analysis did not return four wall corners.');
  }
  const corners = rawCorners.map((c) => ({
    x: clamp(isRecord(c) ? Number(c.x) : NaN, 0, 1),
    y: clamp(isRecord(c) ? Number(c.y) : NaN, 0, 1),
  })) as SceneAnalysis['wall']['corners'];

  return {
    rejectionReason:
      typeof input.rejectionReason === 'string' && input.rejectionReason.trim()
        ? input.rejectionReason.trim()
        : null,
    wall: {
      corners,
      confidence: clamp(Number(wall.confidence), 0, 1),
      // A room wall narrower than 0.5 m or wider than 20 m is a misread.
      estimatedWidthMeters: clamp(Number(wall.estimatedWidthMeters), 0.5, 20),
    },
    lighting: {
      keyDirectionDegrees:
        ((Number(lighting.keyDirectionDegrees) % 360) + 360) % 360 || 0,
      contrast: clamp(Number(lighting.contrast), 0, 1),
      colorTemperatureKelvin: clamp(
        Number(lighting.colorTemperatureKelvin),
        1500,
        12000
      ),
    },
    occluders: (Array.isArray(input.occluders) ? input.occluders : [])
      .filter(isRecord)
      .map((o) => ({
        label: String(o.label ?? 'object'),
        box: {
          x: clamp(isRecord(o.box) ? Number(o.box.x) : NaN, 0, 1),
          y: clamp(isRecord(o.box) ? Number(o.box.y) : NaN, 0, 1),
          width: clamp(isRecord(o.box) ? Number(o.box.width) : NaN, 0, 1),
          height: clamp(isRecord(o.box) ? Number(o.box.height) : NaN, 0, 1),
        },
      })),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export async function analyseScene(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<SceneAnalysis> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    tools: [SCENE_TOOL],
    tool_choice: { type: 'tool', name: 'report_scene' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: 'Locate the wall for an acoustic panel and describe the light.',
          },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Scene analysis was declined for this image.');
  }

  const call = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
  );
  if (!call) throw new Error('Scene analysis returned no result.');

  return coerce(call.input);
}
