/**
 * Wall detection that runs entirely in the visitor's browser.
 *
 * A small semantic-segmentation network (SegFormer, ADE20K classes) is
 * downloaded once from this site and run with ONNX Runtime's WebAssembly
 * backend. That means: no server to pay for or keep awake, the photo never
 * leaves the device, and it works for every visitor — which the hosted
 * service (lib/visualizer/detectWall.ts) only does when someone has
 * deployed it.
 *
 * The result has the same shape as the service's, so the renderer does not
 * care which one produced it.
 */

import type { Point } from "@/lib/geometry/types";
import { DEFAULT_WALL_HEIGHT_MM } from "@/config/panels";
import { WallDetectionUnavailable, type WallDetection } from "./detectWall";
import {
  ADE,
  boxBlur,
  guidedFilter,
  pickWallComponent,
  resampleBilinear,
  wallQuad,
} from "./wallFromSegmentation";

const ORT_SCRIPT = "/vendor/ort/ort.wasm.min.js";
const ORT_WASM_DIR = "/vendor/ort/";
const MODEL_URL = "/models/wall/seg-b2.onnx";
const MODEL_INPUT = 512;
const NUM_CLASSES = 150;
/** Long side of the mask handed to the renderer. */
const MASK_SIDE = 768;

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/* eslint-disable @typescript-eslint/no-explicit-any */
let sessionPromise: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.dataset.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/** Starts downloading the runtime and model. Safe to call early and often. */
export function warmUpLocalDetection(): Promise<unknown> {
  sessionPromise ??= (async () => {
    await loadScript(ORT_SCRIPT);
    const ort = (window as any).ort;
    if (!ort) throw new Error("onnxruntime-web did not initialise");
    ort.env.wasm.wasmPaths = ORT_WASM_DIR;
    // One thread: multi-threading needs cross-origin isolation headers that
    // would break the rest of the site's third-party embeds.
    ort.env.wasm.numThreads = 1;
    const session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    return { ort, session };
  })();
  sessionPromise.catch(() => { sessionPromise = null; });
  return sessionPromise;
}

interface DetectOptions {
  /** Image-space tap choosing which wall the user means. */
  tap?: Point;
}

export async function detectWallLocally(
  image: HTMLImageElement,
  options: DetectOptions = {},
): Promise<WallDetection> {
  const started = performance.now();
  let runtime: { ort: any; session: any };
  try {
    runtime = (await warmUpLocalDetection()) as { ort: any; session: any };
  } catch (cause) {
    throw new WallDetectionUnavailable("on-device wall detection could not start", { cause });
  }
  const { ort, session } = runtime;
  const loadedAt = performance.now();

  const imageWidth = image.naturalWidth, imageHeight = image.naturalHeight;

  // --- preprocess: stretch to 512², ImageNet-normalise, NCHW ---------------
  const inputCanvas = document.createElement("canvas");
  inputCanvas.width = MODEL_INPUT;
  inputCanvas.height = MODEL_INPUT;
  const inputCtx = inputCanvas.getContext("2d", { willReadFrequently: true });
  if (!inputCtx) throw new WallDetectionUnavailable("2D canvas unavailable");
  inputCtx.drawImage(image, 0, 0, MODEL_INPUT, MODEL_INPUT);
  const rgba = inputCtx.getImageData(0, 0, MODEL_INPUT, MODEL_INPUT).data;
  const plane = MODEL_INPUT * MODEL_INPUT;
  const tensorData = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) {
      tensorData[c * plane + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c];
    }
  }

  // --- inference -------------------------------------------------------------
  let logits: Float32Array, gridW: number, gridH: number;
  try {
    const input = new ort.Tensor("float32", tensorData, [1, 3, MODEL_INPUT, MODEL_INPUT]);
    const output = await session.run({ [session.inputNames[0]]: input });
    const result = output[session.outputNames[0]];
    logits = result.data as Float32Array;
    gridH = result.dims[2];
    gridW = result.dims[3];
  } catch (cause) {
    throw new WallDetectionUnavailable("on-device wall detection failed", { cause });
  }
  const inferredAt = performance.now();

  // --- labels + P(wall) per cell --------------------------------------------
  const cells = gridW * gridH;
  const labels = new Uint8Array(cells);
  const wallProb = new Float32Array(cells);
  for (let i = 0; i < cells; i++) {
    let best = 0, bestValue = -Infinity;
    for (let c = 0; c < NUM_CLASSES; c++) {
      const v = logits[c * cells + i];
      if (v > bestValue) { bestValue = v; best = c; }
    }
    let sum = 0;
    for (let c = 0; c < NUM_CLASSES; c++) sum += Math.exp(logits[c * cells + i] - bestValue);
    labels[i] = best;
    wallProb[i] = Math.exp(logits[ADE.wall * cells + i] - bestValue) / sum;
  }

  const grid = { width: gridW, height: gridH, labels };
  const tap = options.tap
    ? { x: (options.tap.x / imageWidth) * gridW, y: (options.tap.y / imageHeight) * gridH }
    : null;
  const wall = pickWallComponent(grid, tap);
  if (!wall) throw new WallDetectionUnavailable("no wall found in this photo");
  const quad = wallQuad(grid, wall);
  if (!quad) throw new WallDetectionUnavailable("the wall outline is not usable");

  const corners = quad.corners.map((p) => ({
    x: (p.x / gridW) * imageWidth,
    y: (p.y / gridH) * imageHeight,
  })) as [Point, Point, Point, Point];

  // --- soft "bare wall is visible here" mask --------------------------------
  // Only the chosen wall counts, so panels never spill onto a side wall.
  const chosenProb = new Float32Array(cells);
  const near = boxBlur(Float32Array.from(wall.mask), gridW, gridH, 2);
  for (let i = 0; i < cells; i++) chosenProb[i] = near[i] > 0.02 ? wallProb[i] : 0;

  const scale = MASK_SIDE / Math.max(imageWidth, imageHeight);
  const maskW = Math.max(2, Math.round(imageWidth * Math.min(1, scale)));
  const maskH = Math.max(2, Math.round(imageHeight * Math.min(1, scale)));
  const guideCanvas = document.createElement("canvas");
  guideCanvas.width = maskW;
  guideCanvas.height = maskH;
  const guideCtx = guideCanvas.getContext("2d", { willReadFrequently: true });
  if (!guideCtx) throw new WallDetectionUnavailable("2D canvas unavailable");
  guideCtx.drawImage(image, 0, 0, maskW, maskH);
  const guidePixels = guideCtx.getImageData(0, 0, maskW, maskH);
  const guide = new Float32Array(maskW * maskH);
  for (let i = 0; i < guide.length; i++) {
    guide[i] = (0.299 * guidePixels.data[i * 4] + 0.587 * guidePixels.data[i * 4 + 1] + 0.114 * guidePixels.data[i * 4 + 2]) / 255;
  }
  const coarse = resampleBilinear(chosenProb, gridW, gridH, maskW, maskH);
  // Push the upsampled probabilities towards 0/1 first: the guided filter
  // then only has to place the edge, not invent one out of a wide ramp
  // (which rendered as a smudge where panels met a headboard).
  for (let i = 0; i < coarse.length; i++) coarse[i] = Math.min(1, Math.max(0, (coarse[i] - 0.38) * 4.2));
  const crisp = guidedFilter(guide, coarse, maskW, maskH, Math.max(3, Math.round(maskW / 96)), 1e-3);
  // A wide blur of the same mask: how close a pixel is to something standing
  // in front of the wall. The shader uses it for the soft shadow furniture
  // throws onto the panels behind it.
  const soft = boxBlur(boxBlur(crisp, maskW, maskH, Math.round(maskW / 40)), maskW, maskH, Math.round(maskW / 40));

  const out = guideCtx.createImageData(maskW, maskH);
  for (let i = 0; i < crisp.length; i++) {
    out.data[i * 4] = Math.round(crisp[i] * 255);
    out.data[i * 4 + 1] = Math.round(soft[i] * 255);
    out.data[i * 4 + 2] = 0;
    out.data[i * 4 + 3] = 255;
  }
  guideCtx.putImageData(out, 0, 0);
  const wallMaskUrl = guideCanvas.toDataURL("image/png");

  const left = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const right = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);
  const top = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const bottom = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
  const aspect = (top + bottom) / Math.max(1e-6, left + right);

  return {
    corners,
    wallWidthMm: DEFAULT_WALL_HEIGHT_MM * aspect,
    wallHeightMm: DEFAULT_WALL_HEIGHT_MM,
    confidence: quad.confidence,
    source: "mask-bbox",
    imageWidth,
    imageHeight,
    wallMaskUrl,
    occluderMaskUrl: null,
    notes: ["on-device"],
    timingsMs: {
      load: Math.round(loadedAt - started),
      inference: Math.round(inferredAt - loadedAt),
      post: Math.round(performance.now() - inferredAt),
    },
  };
}
