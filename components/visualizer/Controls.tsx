"use client";

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
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <label htmlFor="wall-height" className="font-medium text-neutral-700">
            Wall height
          </label>
          <span className="text-neutral-500">{(wallHeightMm / 1000).toFixed(2)} m</span>
        </div>
        <input
          id="wall-height"
          type="range"
          min={MIN_WALL_HEIGHT_MM}
          max={MAX_WALL_HEIGHT_MM}
          step={10}
          value={wallHeightMm}
          onChange={(e) => onWallHeightChange(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <p className="mt-1 text-xs text-neutral-400">
          This is the single reference that makes slat width and panel count physically correct.
        </p>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-neutral-700">Panel orientation</span>
        <div className="flex gap-2">
          {(["horizontal", "vertical"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onOrientationChange(o)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                orientation === o
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
