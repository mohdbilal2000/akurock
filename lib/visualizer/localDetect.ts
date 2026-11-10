/**
 * Wall detection that runs entirely in the visitor's browser.
 *
 * A semantic-segmentation network (UperNet + ConvNeXt-Tiny, ADE20K classes,
 * MIT-licensed — see public/models/wall/NOTICE.md) is
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
import { defaultFocalPx, isUsableShape, measureWall, type WallScale } from "./wallScale";

const ORT_SCRIPT = "/vendor/ort/ort.wasm.min.js";
const ORT_WASM_DIR = "/vendor/ort/";
const MODEL_URL = "/models/wall/seg-upernet-convnext-t-q8.onnx";
const MODEL_INPUT = 512;
const NUM_CLASSES = 150;
/** Long side of the mask handed to the renderer. */
const MASK_SIDE = 768;

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

const DEPTH_MODEL_URL = "/models/wall/depth-metric-indoor-s-q8.onnx";
const DEPTH_INPUT = 518;

/* eslint-disable @typescript-eslint/no-explicit-any */
let sessionPromise: Promise<any> | null = null;
let depthSessionPromise: Promise<any> | null = null;

/** The wall-probability grid behind each detection, for the depth pass. */
const wallGrids = new WeakMap<WallDetection, { prob: Float32Array; width: number; height: number }>();

/** ImageNet-normalised NCHW tensor data of the image stretched to size². */
function toTensorData(image: HTMLImageElement, size: number): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new WallDetectionUnavailable("2D canvas unavailable");
  ctx.drawImage(image, 0, 0, size, size);
  const rgba = ctx.getImageData(0, 0, size, size).data;
  const plane = size * size;
  const data = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) data[c * plane + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  }
  return data;
}

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
    // Several threads where the page is cross-origin isolated (see the
    // /visualizer headers in next.config.ts); one thread everywhere else.
    const cores = navigator.hardwareConcurrency || 2;
    ort.env.wasm.numThreads = window.crossOriginIsolated ? Math.max(1, Math.min(4, cores - 1)) : 1;
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

  const tensorData = toTensorData(image, MODEL_INPUT);

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

  const detection: WallDetection = {
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
  wallGrids.set(detection, { prob: chosenProb, width: gridW, height: gridH });
  return detection;
}

/**
 * Works out the detected wall's true proportions (width ÷ height) with a
 * depth model, also run on-device. Slower than detection and only refines
 * the layout, so the caller shows the wall first and applies this when it
 * arrives. Resolves to null when the result should not be used. Only the
 * ratio of the returned sizes is meaningful — see isUsableShape.
 */
export async function measureWallLocally(
  image: HTMLImageElement,
  detection: WallDetection,
): Promise<WallScale | null> {
  const grid = wallGrids.get(detection);
  if (!grid) return null;
  try {
    const { ort } = (await warmUpLocalDetection()) as { ort: any };
    depthSessionPromise ??= ort.InferenceSession.create(DEPTH_MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    const session = await depthSessionPromise;
    const input = new ort.Tensor("float32", toTensorData(image, DEPTH_INPUT), [1, 3, DEPTH_INPUT, DEPTH_INPUT]);
    const output = await session.run({ [session.inputNames[0]]: input });
    const result = output[session.outputNames[0]];
    const dims = result.dims as number[];
    const scale = measureWall({
      depth: result.data as Float32Array,
      depthWidth: dims[dims.length - 1],
      depthHeight: dims[dims.length - 2],
      wallProb: grid.prob,
      wallProbWidth: grid.width,
      wallProbHeight: grid.height,
      corners: detection.corners,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      focalPx: defaultFocalPx(image.naturalWidth, image.naturalHeight),
    });
    if (!scale) return null;
    const [tl, tr, br, bl] = detection.corners;
    const outlineAspect =
      (Math.hypot(tr.x - tl.x, tr.y - tl.y) + Math.hypot(br.x - bl.x, br.y - bl.y)) /
      Math.max(1e-6, Math.hypot(bl.x - tl.x, bl.y - tl.y) + Math.hypot(br.x - tr.x, br.y - tr.y));
    return isUsableShape(scale, outlineAspect) ? scale : null;
  } catch {
    depthSessionPromise = null;
    return null;
  }
}
