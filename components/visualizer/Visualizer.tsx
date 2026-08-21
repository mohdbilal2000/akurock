"use client";

import { useMemo, useRef, useState } from "react";
import { snapCoverageToPanels, rectFromDragPoints } from "@/lib/geometry/coverage";
import { buildWallPlane, type WallCorners } from "@/lib/geometry/wallPlane";
import { applyHomography } from "@/lib/geometry/homography";
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

type Step = "upload" | "corners" | "coverage" | "result";

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
  const [orientation, setOrientation] = useState<PanelOrientation>("horizontal");
  const [finish, setFinish] = useState<Finish>(FINISHES[0]);
  const [rawCoverageMm, setRawCoverageMm] = useState<Rect | null>(null);
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

  function handleCoverageDrag(startNatural: Point, endNatural: Point) {
    if (!wallPlane) return;
    const startMm = applyHomography(wallPlane.imageToWall, startNatural);
    const endMm = applyHomography(wallPlane.imageToWall, endNatural);
    setRawCoverageMm(rectFromDragPoints(startMm, endMm));
    setStep("result");
  }

  function handleReset() {
    setStep("upload");
    setImage(null);
    setCorners([]);
    setRawCoverageMm(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Akurock Wall Visualizer</h1>
        <p className="mt-1 text-sm text-neutral-500">
          See your wall in real Akurock panels — exact panel count, instantly.
        </p>
      </header>

      {step === "upload" && <ImageSource onImageSelected={handleImageSelected} />}

      {step === "corners" && image && (
        <div className="flex flex-col items-center gap-4">
          <CornerPicker
            imageUrl={image.url}
            naturalWidth={image.naturalWidth}
            naturalHeight={image.naturalHeight}
            corners={corners}
            onCornersChange={setCorners}
          />
          <Controls
            wallHeightMm={wallHeightMm}
            onWallHeightChange={setWallHeightMm}
            orientation={orientation}
            onOrientationChange={setOrientation}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900"
            >
              Start over
            </button>
            <button
              type="button"
              disabled={corners.length !== 4}
              onClick={() => setStep("coverage")}
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Confirm corners
            </button>
          </div>
        </div>
      )}

      {step === "coverage" && image && wallPlane && (
        <div className="flex flex-col items-center gap-4">
          <FinishPicker selected={finish} onSelect={setFinish} />
          <CoverageDragger
            imageUrl={image.url}
            naturalWidth={image.naturalWidth}
            naturalHeight={image.naturalHeight}
            wallCorners={wallPlane.corners}
            onDragComplete={handleCoverageDrag}
          />
          <button
            type="button"
            onClick={() => setStep("corners")}
            className="text-sm font-medium text-neutral-500 underline"
          >
            Back to corners
          </button>
        </div>
      )}

      {step === "result" && image && wallPlane && coverage && (
        <div className="flex flex-col items-center gap-4">
          <FinishPicker selected={finish} onSelect={setFinish} />
          <CompositorCanvas
            ref={canvasRef}
            imageUrl={image.url}
            naturalWidth={image.naturalWidth}
            naturalHeight={image.naturalHeight}
            imageToWallMm={wallPlane.imageToWall}
            coverageMm={coverage.rectMm}
            panelSizeMm={panelSizeMm}
            textureUrl={finish.textureUrl}
          />
          <Calculator panelCount={coverage.panelCount} areaM2={coverage.areaM2} priceEur={priceEur} />
          <Controls
            wallHeightMm={wallHeightMm}
            onWallHeightChange={setWallHeightMm}
            orientation={orientation}
            onOrientationChange={setOrientation}
          />
          <button
            type="button"
            onClick={() => setStep("coverage")}
            className="text-sm font-medium text-neutral-500 underline"
          >
            Adjust coverage area
          </button>
          <Toolbar
            canvasRef={canvasRef}
            finish={finish}
            orientation={orientation}
            panelCount={coverage.panelCount}
            areaM2={coverage.areaM2}
            priceEur={priceEur}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
