"use client";

import { FINISHES, type Finish } from "@/config/panels";

interface FinishPickerProps {
  selected: Finish;
  onSelect: (finish: Finish) => void;
}

/** Horizontal strip of real swatch photos — spec explicitly wants photos, not names/swatCH chips. */
export function FinishPicker({ selected, onSelect }: FinishPickerProps) {
  return (
    // shrink-0 matters: this strip lives in a flex-col sheet that can overflow,
    // and without it flex collapses the row to its padding and the swatches
    // vanish rather than the sheet scrolling.
    <div className="-mx-4 flex shrink-0 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {FINISHES.map((finish) => {
        const isActive = finish.slug === selected.slug;
        return (
          <button
            key={finish.slug}
            type="button"
            onClick={() => onSelect(finish)}
            className="flex shrink-0 snap-start flex-col items-center gap-1.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finish.swatchUrl}
              alt={finish.name}
              className={`h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-offset-2 transition ${
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
