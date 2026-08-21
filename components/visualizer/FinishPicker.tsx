"use client";

import { FINISHES, type Finish } from "@/config/panels";

interface FinishPickerProps {
  selected: Finish;
  onSelect: (finish: Finish) => void;
}

/** Horizontal strip of real swatch photos — spec explicitly wants photos, not names/swatCH chips. */
export function FinishPicker({ selected, onSelect }: FinishPickerProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {FINISHES.map((finish) => {
        const isActive = finish.slug === selected.slug;
        return (
          <button
            key={finish.slug}
            type="button"
            onClick={() => onSelect(finish)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finish.swatchUrl}
              alt={finish.name}
              className={`h-14 w-14 rounded-full object-cover ring-2 ring-offset-2 transition ${
                isActive ? "ring-orange-500" : "ring-transparent hover:ring-neutral-300"
              }`}
            />
            <span className={`text-xs font-medium ${isActive ? "text-neutral-900" : "text-neutral-500"}`}>
              {finish.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
