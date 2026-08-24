"use client";

import { useMemo, useRef, useState } from "react";
import { snapCoverageToPanels, rectFromDragPoints } from "@/lib/geometry/coverage";
import { suggestCoverage } from "@/lib/geometry/coverageLayout";
import { buildWallPlane, type WallCorners } from "@/lib/geometry/wallPlane";
import { applyHomography } from "@/lib/geometry/homography";
import { suggestWallCorners } from "@/lib/geometry/autoWall";
import type { Point, Rect } from "@/lib/geometry/types";
import { DEFAULT_WALL_HEIGHT_MM, FINISHES, PANEL, type Finish, type PanelOrientation } from "@/config/panels";
import { pricePerPanel } from "@/config/prices";
import { ImageSource } from "./ImageSource";
import { CornerPicker } from "./CornerPicker";
import { CoverageDragger } from "./CoverageDragger";
import { CompositorCanvas } from "./CompositorCanvas";
import { FinishPicker } from "./FinishPicker";
import { Controls } from "./Controls";
import { Calculator } from "./Calculator";
import { Toolbar } from "./Toolbar";

type Step = "upload" | "corners" | "main";

interface LoadedImage {
  url: string;
  naturalWidth: number;
  naturalHeight: number;
}

function loadImageDims(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

export function Visualizer() {
  const [step, setStep] = useState<Step>("upload");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [corners, setCorners] = useState<Point[]>([]);
  const [wallHeightMm, setWallHeightMm] = useState(DEFAULT_WALL_HEIGHT_MM);
  const [orientation, setOrientation] = useState<PanelOrientation>("vertical");
  const [finish, setFinish] = useState<Finish>(FINISHES[0]);
  const [rawCoverageMm, setRawCoverageMm] = useState<Rect | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isAdjustingCoverage, setIsAdjustingCoverage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const coverage = useMemo(() => {
    if (!rawCoverageMm) return null;
    return snapCoverageToPanels(rawCoverageMm, PANEL, orientation);
  }, [rawCoverageMm, orientation]);

  const priceEur = coverage ? coverage.panelCount * pricePerPanel(finish.slug) : 0;

  async function handleImageSelected(url: string) {
    const loaded = await loadImageDims(url);
    setImage(loaded);
    setCorners([]);
    setRawCoverageMm(null);
    setStep("corners");
  }

  async function handleAutoDetect() {
    if (!image) return;
    setIsAutoDetecting(true);
    try {
      // Load image and extract pixel data
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = image.url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);

      // Call auto-detect with pixel buffer
      const result = suggestWallCorners({ width: image.naturalWidth, height: image.naturalHeight, data: imageData.data });
      if (result) {
        setCorners([result.corners[0], result.corners[1], result.corners[2], result.corners[3]]);
      }
    } catch (e) {
      console.error("Auto-detect failed:", e);
    } finally {
      setIsAutoDetecting(false);
    }
  }

  function handleCornersConfirmed() {
    if (corners.length !== 4 || !wallPlane) return;

    // Auto-fill coverage to best-fit panel grid
    const suggested = suggestCoverage(
      wallPlane.wallWidthMm,
      wallHeightMm,
      PANEL,
      orientation,
    );
    setRawCoverageMm(suggested.rectMm);
    setStep("main");
  }

  function handleCoverageDrag(startNatural: Point, endNatural: Point) {
    if (!wallPlane) return;
    const startMm = applyHomography(wallPlane.imageToWall, startNatural);
    const endMm = applyHomography(wallPlane.imageToWall, endNatural);
    setRawCoverageMm(rectFromDragPoints(startMm, endMm));
  }

  function handleReset() {
    setStep("upload");
    setImage(null);
    setCorners([]);
    setRawCoverageMm(null);
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-neutral-50 md:items-center">
      {step === "upload" && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 overflow-y-auto px-4 py-10">
          <header className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Akurock Wall Visualizer</h1>
            <p className="mt-1 text-sm text-neutral-500">
              See your wall in real Akurock panels — exact panel count, instantly.
            </p>
          </header>
          <ImageSource onImageSelected={handleImageSelected} />
        </div>
      )}

      {step === "corners" && image && (
        <div className="flex w-full flex-col gap-4 overflow-y-auto px-4 py-6 md:max-w-3xl md:gap-6 md:py-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-neutral-900">Tap the 4 wall corners</h2>
            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={isAutoDetecting}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-900 hover:bg-orange-100 disabled:opacity-50"
            >
              {isAutoDetecting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Detecting…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Auto-detect
                </>
              )}
            </button>
          </div>
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
              onClick={handleReset}
              className="flex-1 rounded-lg border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              Start over
            </button>
            <button
              type="button"
              disabled={corners.length !== 4}
              onClick={handleCornersConfirmed}
              className="flex-1 rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              Confirm corners
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
                Adjust corners
              </button>
              <button
                type="button"
                onClick={() => setIsAdjustingCoverage(!isAdjustingCoverage)}
                className={`rounded-lg px-3 py-2 text-xs font-medium backdrop-blur transition ${
                  isAdjustingCoverage
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-black/50 text-white hover:bg-black/60"
                }`}
              >
                {isAdjustingCoverage ? "Done adjusting" : "Adjust coverage"}
              </button>
            </div>
          </div>

          {/* Bottom sheet on mobile, right panel on desktop */}
          <div className="flex max-h-[55dvh] shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain border-t border-neutral-200 bg-white px-4 py-5 [&>*]:shrink-0 md:max-h-full md:w-80 md:shrink md:border-l md:border-t-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">Finish</h3>
            </div>
            <FinishPicker selected={finish} onSelect={setFinish} />

            <hr className="my-2" />

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
                onReset={handleReset}
              />
              <button
                type="button"
                onClick={() => setStep("corners")}
                className="text-xs font-medium text-neutral-500 underline hover:text-neutral-700"
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
