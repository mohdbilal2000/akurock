"use client";

import { useRef, useState } from "react";
import type { Point } from "@/lib/geometry/types";
import { fractionalPoint, toNaturalPoint } from "./pointerUtils";
import { Magnifier } from "./Magnifier";

const LABELS = ["top-left", "top-right", "bottom-right", "bottom-left"];

interface CornerPickerProps {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  corners: Point[];
  onCornersChange: (corners: Point[]) => void;
}

/**
 * Lets the user click the wall's 4 corners (top-left, top-right,
 * bottom-right, bottom-left) on the uploaded photo, and drag any of them
 * afterwards to fine-tune. Points are reported in natural image-pixel
 * space — what lib/geometry/wallPlane expects.
 */
export function CornerPicker({
  imageUrl,
  naturalWidth,
  naturalHeight,
  corners,
  onCornersChange,
}: CornerPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pointerPercent, setPointerPercent] = useState({ x: 0, y: 0 });

  function handleContainerClick(e: React.MouseEvent) {
    if (corners.length >= 4 || !containerRef.current) return;
    const fraction = fractionalPoint(containerRef.current, e.clientX, e.clientY);
    const point = toNaturalPoint(fraction, naturalWidth, naturalHeight);
    onCornersChange([...corners, point]);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!containerRef.current) return;
    const fraction = fractionalPoint(containerRef.current, e.clientX, e.clientY);
    setPointerPercent({ x: fraction.x * 100, y: fraction.y * 100 });

    if (dragIndex === null) return;
    const point = toNaturalPoint(fraction, naturalWidth, naturalHeight);
    const next = [...corners];
    next[dragIndex] = point;
    onCornersChange(next);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl touch-none select-none overflow-hidden rounded-xl border border-neutral-200"
        onClick={handleContainerClick}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragIndex(null)}
        onPointerLeave={() => setDragIndex(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Your wall" className="block h-auto w-full" draggable={false} />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
          preserveAspectRatio="none"
        >
          {corners.length === 4 && (
            <polygon
              points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="rgba(242,70,22,0.15)"
              stroke="#f24616"
              strokeWidth={naturalWidth / 250}
            />
          )}
          {corners.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={naturalWidth / 120}
              fill="#f24616"
              stroke="white"
              strokeWidth={naturalWidth / 400}
              className="pointer-events-auto cursor-grab"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragIndex(i);
              }}
            />
          ))}
        </svg>
      </div>

      {dragIndex !== null && (
        <Magnifier
          imageUrl={imageUrl}
          naturalWidth={naturalWidth}
          naturalHeight={naturalHeight}
          pointerX={pointerPercent.x}
          pointerY={pointerPercent.y}
        />
      )}

      <p className="text-sm text-neutral-500">
        {corners.length < 4
          ? `Click the wall's ${LABELS[corners.length]} corner (${corners.length}/4).`
          : "Drag any corner to fine-tune, then confirm."}
      </p>
    </div>
  );
}
