"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { snapCoverageToPanels, rectFromDragPoints } from "@/lib/geometry/coverage";
import { suggestFeatureWall, setPanelsAcross, panelStep } from "@/lib/geometry/coverageLayout";
import { buildWallPlane, type WallCorners } from "@/lib/geometry/wallPlane";
import { applyHomography } from "@/lib/geometry/homography";
import { defaultWallQuad, suggestWallCorners } from "@/lib/geometry/autoWall";
import {
  detectWall,
  MIN_AUTO_CONFIDENCE,
  type WallDetection,
} from "@/lib/visualizer/detectWall";
import type { Point, Rect } from "@/lib/geometry/types";
import {
  DEFAULT_WALL_HEIGHT_MM,
  MAX_WALL_HEIGHT_MM,
  MIN_WALL_HEIGHT_MM,
  FINISHES,
  PANEL,
  type Finish,
  type PanelOrientation,
} from "@/config/panels";
import { pricePerPanel } from "@/config/prices";
import { ImageSource } from "./ImageSource";
import { CornerPicker } from "./CornerPicker";
import { CoverageDragger } from "./CoverageDragger";
import { CompositorCanvas } from "./CompositorCanvas";
import { FinishPicker } from "./FinishPicker";
import { Controls } from "./Controls";
import { Calculator } from "./Calculator";
import { Toolbar } from "./Toolbar";
import { useVisualizerStrings } from "./useVisualizerStrings";

type Step = "upload" | "detecting" | "corners" | "main";

interface LoadedImage {
  url: string;
  naturalWidth: number;
  naturalHeight: number;
  /** The decoded element, kept so the on-device fallback can read its
   * pixels without decoding the photo a second time. */
  element: HTMLImageElement;
}

function loadImageDims(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, element: img });
    img.onerror = reject;
    img.src = url;
  });
}

export function Visualizer() {
  const t = useVisualizerStrings();
  const [step, setStep] = useState<Step>("upload");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [corners, setCorners] = useState<Point[]>([]);
  const [wallHeightMm, setWallHeightMm] = useState(DEFAULT_WALL_HEIGHT_MM);
  const [orientation, setOrientation] = useState<PanelOrientation>("vertical");
  const [finish, setFinish] = useState<Finish>(FINISHES[0]);
  /** null = "the auto layout still stands"; set only once the user edits. */
  const [rawCoverageMm, setRawCoverageMm] = useState<Rect | null>(null);
  const [detection, setDetection] = useState<WallDetection | null>(null);
  const [detectionNote, setDetectionNote] = useState<string | null>(null);
  const [isAdjustingCoverage, setIsAdjustingCoverage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionRunRef = useRef(0);

  useEffect(() => {
    // Object URLs from the file picker outlive the component otherwise.
    return () => {
      if (image?.url.startsWith("blob:")) URL.revokeObjectURL(image.url);
    };
  }, [image]);

  const wallPlane = useMemo(() => {
    if (corners.length !== 4) return null;
    return buildWallPlane(corners as unknown as WallCorners, wallHeightMm);
  }, [corners, wallHeightMm]);

  const panelSizeMm = useMemo(
    () =>
      orientation === "horizontal"
        ? { width: PANEL.widthMm, height: PANEL.heightMm }
        : { width: PANEL.heightMm, height: PANEL.widthMm },
    [orientation],
  );

  /**
   * The panels on the wall right now. Until the user edits anything this is
   * the auto layout, which means changing finish, orientation or wall height
   * re-derives a layout that is still whole panels — rather than stretching
   * whatever rectangle happened to be there.
   */
  const coverage = useMemo(() => {
    if (!wallPlane) return null;
    if (!rawCoverageMm) {
      return suggestFeatureWall(wallPlane.wallWidthMm, wallHeightMm, PANEL, orientation);
    }
    return snapCoverageToPanels(rawCoverageMm, PANEL, orientation);
  }, [wallPlane, rawCoverageMm, wallHeightMm, orientation]);

  const priceEur = coverage ? coverage.panelCount * pricePerPanel(finish.slug) : 0;

  async function handleImageSelected(url: string) {
    const loaded = await loadImageDims(url);
    setImage(loaded);
    setRawCoverageMm(null);
    setDetection(null);
    setDetectionNote(null);
    setWallHeightMm(DEFAULT_WALL_HEIGHT_MM);
    setStep("detecting");
    void runDetection(loaded);
  }

  /**
   * Photo -> finished wall, with no questions asked in between.
   *
   * The service measures the wall in metres, so its height replaces the
   * slider default and the panel count is true to scale straight away.
   * Anything less than a confident detection lands on the corner step
   * instead: a wrong wall quietly rendered is a wrong quote.
   */
  async function runDetection(loaded: LoadedImage, tap?: Point) {
    const run = ++detectionRunRef.current;

    try {
      const blob = await (await fetch(loaded.url)).blob();
      const result = await detectWall(blob, { tap });
      if (run !== detectionRunRef.current) return;

      setDetection(result);
      setCorners(result.corners);

      if (result.source === "depth-plane") {
        setWallHeightMm(
          Math.round(clamp(result.wallHeightMm, MIN_WALL_HEIGHT_MM, MAX_WALL_HEIGHT_MM)),
        );
      }

      const trustworthy = result.confidence >= MIN_AUTO_CONFIDENCE;
      setDetectionNote(
        trustworthy
          ? result.source === "depth-plane"
            ? null
            : t.estimatedNote
          : t.checkWallNote,
      );
      setStep(trustworthy ? "main" : "corners");
    } catch {
      if (run !== detectionRunRef.current) return;
      // No service, no network, or a photo it couldn't read: fall back to
      // the on-device edge heuristic and let the user finish the job.
      setDetection(null);
      setCorners(localWallGuess(loaded));
      setDetectionNote(t.detectionUnavailable);
      setStep("corners");
    }
  }

  function handleCornersConfirmed() {
    if (corners.length !== 4 || !wallPlane) return;
    setStep("main");
  }

  function handleCoverageDrag(startNatural: Point, endNatural: Point) {
    if (!wallPlane) return;
    const startMm = applyHomography(wallPlane.imageToWall, startNatural);
    const endMm = applyHomography(wallPlane.imageToWall, endNatural);
    setRawCoverageMm(rectFromDragPoints(startMm, endMm));
  }

  /** Narrower / wider, one whole panel at a time. */
  function handleWidthStep(delta: number) {
    if (!wallPlane || !coverage) return;
    const step = panelStep(PANEL, orientation);
    const current = Math.round(coverage.rectMm.width / step.x);
    setRawCoverageMm(
      setPanelsAcross(coverage.rectMm, current + delta, PANEL, orientation, wallPlane.wallWidthMm),
    );
  }

  /** Undo whatever the user dragged: back to the auto-fitted panel layout. */
  function handleResetLayout() {
    setIsAdjustingCoverage(false);
    setRawCoverageMm(null);
  }

  /** Discard the photo entirely and go back to the picker. */
  function handleNewPhoto() {
    detectionRunRef.current++;
    setStep("upload");
    setImage(null);
    setCorners([]);
    setRawCoverageMm(null);
    setDetection(null);
    setDetectionNote(null);
  }

  const panelsAcross = coverage ? Math.round(coverage.rectMm.width / panelStep(PANEL, orientation).x) : 0;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-ground md:items-center">
      {step === "upload" && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 overflow-y-auto px-4 py-10">
          <header className="text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{t.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{t.subtitle}</p>
          </header>
          <ImageSource onImageSelected={handleImageSelected} />
          <p className="text-center text-xs text-ink/40">{t.privacyNote}</p>
        </div>
      )}

      {step === "detecting" && image && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="block max-h-[45dvh] w-full object-cover" />
            <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-transparent via-white/25 to-transparent" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-ink">{t.analysing}</p>
            <p className="mt-1 max-w-sm text-sm text-ink/55">{t.analysingHint}</p>
          </div>
        </div>
      )}

      {step === "corners" && image && (
        <div className="flex w-full flex-col gap-4 overflow-y-auto px-4 py-6 md:max-w-3xl md:gap-6 md:py-10">
          <h2 className="font-display text-xl font-semibold text-ink">{t.cornerStepTitle}</h2>
          {detectionNote && (
            <p className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-ink">
              {detectionNote}
            </p>
          )}
          <CornerPicker
            imageUrl={image.url}
            naturalWidth={image.naturalWidth}
            naturalHeight={image.naturalHeight}
            corners={corners}
            onCornersChange={setCorners}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleNewPhoto}
              className="flex-1 rounded-lg border border-line px-5 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
            >
              {t.newPhoto}
            </button>
            {/* A cold service is the common reason detection failed, and it
                is warm by the time anyone reads the message. */}
            <button
              type="button"
              onClick={() => {
                setStep("detecting");
                void runDetection(image);
              }}
              className="flex-1 rounded-lg border border-line px-5 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
            >
              {t.retryDetection}
            </button>
            <button
              type="button"
              disabled={corners.length !== 4}
              onClick={handleCornersConfirmed}
              className="flex-1 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-40"
            >
              {t.looksRight}
            </button>
          </div>
        </div>
      )}

      {step === "main" && image && wallPlane && coverage && (
        <div className="flex h-full w-full min-h-0 flex-col overflow-hidden md:max-w-3xl md:flex-row">
          {/* Canvas area: full width on mobile, left half on desktop */}
          <div className="relative flex w-full min-h-0 flex-1 items-center justify-center overflow-hidden bg-neutral-900/5 md:h-full">
            {!isAdjustingCoverage && (
              <CompositorCanvas
                ref={canvasRef}
                imageUrl={image.url}
                naturalWidth={image.naturalWidth}
                naturalHeight={image.naturalHeight}
                imageToWallMm={wallPlane.imageToWall}
                coverageMm={coverage.rectMm}
                panelSizeMm={panelSizeMm}
                textureUrl={finish.textureUrl}
                wallWidthMm={wallPlane.wallWidthMm}
                wallHeightMm={wallHeightMm}
                finishSlug={finish.slug}
                feltHex={finish.felt}
                wallMaskUrl={detection?.wallMaskUrl ?? null}
                occluderMaskUrl={detection?.occluderMaskUrl ?? null}
              />
            )}

            {isAdjustingCoverage && (
              <CoverageDragger
                imageUrl={image.url}
                naturalWidth={image.naturalWidth}
                naturalHeight={image.naturalHeight}
                wallCorners={wallPlane.corners}
                onDragComplete={handleCoverageDrag}
              />
            )}

            {/* Control buttons on canvas overlay */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStep("corners")}
                className="rounded-lg bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/60"
              >
                {t.adjustCorners}
              </button>
              <button
                type="button"
                onClick={() => setIsAdjustingCoverage(!isAdjustingCoverage)}
                className={`rounded-lg px-3 py-2 text-xs font-medium backdrop-blur transition ${
                  isAdjustingCoverage
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-black/50 text-white hover:bg-black/60"
                }`}
              >
                {isAdjustingCoverage ? t.doneAdjusting : t.adjustCoverage}
              </button>
            </div>
          </div>

          {/* Bottom sheet on mobile, right panel on desktop */}
          <div className="flex max-h-[55dvh] shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain border-t border-line bg-white px-4 py-5 [&>*]:shrink-0 md:max-h-full md:w-80 md:shrink md:border-l md:border-t-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">{t.finishLabel}</h3>
              <WallReadout
                detection={detection}
                wallPlane={{ widthMm: wallPlane.wallWidthMm, heightMm: wallHeightMm }}
                measuredLabel={t.measuredNote}
                wallLabel={t.wallSize}
              />
            </div>
            <FinishPicker selected={finish} onSelect={setFinish} />

            {detectionNote && <p className="text-xs text-ink/55">{detectionNote}</p>}

            <hr className="my-2" />

            <PanelRunControl
              label={t.panelRun}
              unit={t.widePanels}
              panelsAcross={panelsAcross}
              onStep={handleWidthStep}
              narrowerLabel={t.narrower}
              widerLabel={t.wider}
            />

            <Controls
              wallHeightMm={wallHeightMm}
              onWallHeightChange={setWallHeightMm}
              orientation={orientation}
              onOrientationChange={setOrientation}
            />

            <hr className="my-2" />

            <Calculator panelCount={coverage.panelCount} areaM2={coverage.areaM2} priceEur={priceEur} />

            <div className="mt-auto flex flex-col gap-2">
              <Toolbar
                canvasRef={canvasRef}
                finish={finish}
                orientation={orientation}
                panelCount={coverage.panelCount}
                areaM2={coverage.areaM2}
                priceEur={priceEur}
                onReset={handleNewPhoto}
              />
              {rawCoverageMm && (
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="text-xs font-medium text-ink/60 underline hover:text-ink"
                >
                  {t.resetLayout}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Whole-panel width control — the edit people reach for first. */
function PanelRunControl({
  label,
  unit,
  panelsAcross,
  onStep,
  narrowerLabel,
  widerLabel,
}: {
  label: string;
  unit: string;
  panelsAcross: number;
  onStep: (delta: number) => void;
  narrowerLabel: string;
  widerLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
      <div>
        <div className="text-sm font-medium text-ink/70">{label}</div>
        <div className="text-xs text-ink/50">
          {panelsAcross} {unit}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={narrowerLabel}
          onClick={() => onStep(-1)}
          className="h-9 w-9 rounded-full border border-line text-lg font-semibold text-ink hover:border-ink/40"
        >
          −
        </button>
        <button
          type="button"
          aria-label={widerLabel}
          onClick={() => onStep(1)}
          className="h-9 w-9 rounded-full border border-line text-lg font-semibold text-ink hover:border-ink/40"
        >
          +
        </button>
      </div>
    </div>
  );
}

/** "Wall 3.42 × 2.51 m · measured from your photo" — the number everything
 * else in the panel hangs off, shown so it can be sanity-checked. */
function WallReadout({
  detection,
  wallPlane,
  measuredLabel,
  wallLabel,
}: {
  detection: WallDetection | null;
  wallPlane: { widthMm: number; heightMm: number };
  measuredLabel: string;
  wallLabel: string;
}) {
  const measured = detection?.source === "depth-plane";
  return (
    <span
      className="text-right text-[11px] leading-tight text-ink/45"
      title={measured ? measuredLabel : undefined}
    >
      {wallLabel} {(wallPlane.widthMm / 1000).toFixed(2)} × {(wallPlane.heightMm / 1000).toFixed(2)} m
      {measured && <span className="block text-accent/80">{measuredLabel}</span>}
    </span>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** On-device fallback: Sobel edge profiles, or a centred default quad. */
function localWallGuess(loaded: LoadedImage): Point[] {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = loaded.naturalWidth;
    canvas.height = loaded.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return defaultWallQuad(loaded.naturalWidth, loaded.naturalHeight);

    ctx.drawImage(loaded.element, 0, 0);
    const pixels = ctx.getImageData(0, 0, loaded.naturalWidth, loaded.naturalHeight);
    const guess = suggestWallCorners({
      width: loaded.naturalWidth,
      height: loaded.naturalHeight,
      data: pixels.data,
    });
    if (guess && guess.confidence >= 0.5) return [...guess.corners];
  } catch {
    // Tainted canvas or a decode that hasn't finished — the default quad is
    // still a usable starting point for the corner handles.
  }
  return defaultWallQuad(loaded.naturalWidth, loaded.naturalHeight);
}
