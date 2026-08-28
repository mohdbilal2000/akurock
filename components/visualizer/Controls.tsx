"use client";
import { useVisualizerStrings } from "./useVisualizerStrings";

import type { PanelOrientation } from "@/config/panels";
import { MAX_WALL_HEIGHT_MM, MIN_WALL_HEIGHT_MM } from "@/config/panels";

interface ControlsProps {
  wallHeightMm: number;
  onWallHeightChange: (mm: number) => void;
  orientation: PanelOrientation;
  onOrientationChange: (orientation: PanelOrientation) => void;
}

/** Wall-height reference + panel orientation — the two knobs that make scale and layout correct. */
export function Controls({
  wallHeightMm,
  onWallHeightChange,
  orientation,
  onOrientationChange,
}: ControlsProps) {
  const t = useVisualizerStrings();
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <label htmlFor="wall-height" className="font-medium text-ink/70">
            {t.wallHeight}
          </label>
          <span className="text-ink/60">{(wallHeightMm / 1000).toFixed(2)} m</span>
        </div>
        <input
          id="wall-height"
          type="range"
          min={MIN_WALL_HEIGHT_MM}
          max={MAX_WALL_HEIGHT_MM}
          step={10}
          value={wallHeightMm}
          onChange={(e) => onWallHeightChange(Number(e.target.value))}
          className="w-full accent-[#f24616]"
        />
        <p className="mt-1 text-xs text-neutral-400">
          {t.wallHeightHelp}
        </p>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-ink/70">{t.orientationLabel}</span>
        <div className="flex gap-2">
          {(["horizontal", "vertical"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onOrientationChange(o)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                orientation === o
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink/70 hover:border-ink/40"
              }`}
            >
              {o === "horizontal" ? t.horizontal : t.vertical}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
