"use client";
import { useVisualizerStrings } from "./useVisualizerStrings";

import type { PanelOrientation } from "@/config/panels";
import { MAX_WALL_HEIGHT_MM, MIN_WALL_HEIGHT_MM } from "@/config/panels";

interface ControlsProps {
  wallHeightMm: number;
  onWallHeightChange: (mm: number) => void;
  wallWidthMm: number;
  onWallWidthChange: (mm: number) => void;
  orientation: PanelOrientation;
  onOrientationChange: (orientation: PanelOrientation) => void;
}

/** Wall-height reference + panel orientation — the two knobs that make scale and layout correct. */
export function Controls({
  wallHeightMm,
  onWallHeightChange,
  wallWidthMm,
  onWallWidthChange,
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

      <div className="flex items-center justify-between gap-3 text-sm">
        <label htmlFor="wall-width" className="font-medium text-ink/70">
          {t.wallWidth}
        </label>
        <span className="flex items-center gap-1.5 text-ink/60">
          <input
            id="wall-width"
            type="number"
            inputMode="decimal"
            min={0.6}
            max={15}
            step={0.05}
            // Keyed on the current value so a new measurement or height
            // change shows through, while typing stays uncontrolled.
            key={Math.round(wallWidthMm / 10)}
            defaultValue={(wallWidthMm / 1000).toFixed(2)}
            // Applied when the field is left or Enter is pressed — not per
            // keystroke, which would re-layout the wall at "3" on the way
            // to "3.5".
            onBlur={(e) => {
              const metres = Number(e.target.value);
              if (metres >= 0.6 && metres <= 15 && Math.abs(metres * 1000 - wallWidthMm) > 5) {
                onWallWidthChange(metres * 1000);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-20 rounded-md border border-line px-2 py-1 text-right text-ink"
          />
          m
        </span>
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
