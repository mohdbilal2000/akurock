"use client";

import { useRef, useState } from "react";
import type { Point } from "@/lib/geometry/types";
import { fractionalPoint, toNaturalPoint } from "./pointerUtils";

interface CoverageDraggerProps {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  wallCorners: readonly Point[];
  onDragComplete: (startNatural: Point, endNatural: Point) => void;
}

/**
 * User drags a rectangle over the photo to mark what gets covered. The
 * two corners of that drag are reported in natural image-pixel space; the
 * caller inverts them through the wall homography to get wall-mm space,
 * then snaps to whole/half panels (lib/geometry/coverage).
 */
export function CoverageDragger({
  imageUrl,
  naturalWidth,
  naturalHeight,
  wallCorners,
  onDragComplete,
}: CoverageDraggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [current, setCurrent] = useState<Point | null>(null);

  function pointerFraction(e: React.PointerEvent): Point {
    return fractionalPoint(containerRef.current!, e.clientX, e.clientY);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!containerRef.current) return;
    const f = pointerFraction(e);
    setStart(f);
    setCurrent(f);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!start) return;
    setCurrent(pointerFraction(e));
  }

  function handlePointerUp() {
    if (!start || !current) return;
    const startNatural = toNaturalPoint(start, naturalWidth, naturalHeight);
    const endNatural = toNaturalPoint(current, naturalWidth, naturalHeight);
    onDragComplete(startNatural, endNatural);
    setStart(null);
    setCurrent(null);
  }

  const previewStyle =
    start && current
      ? {
          left: `${Math.min(start.x, current.x) * 100}%`,
          top: `${Math.min(start.y, current.y) * 100}%`,
          width: `${Math.abs(start.x - current.x) * 100}%`,
          height: `${Math.abs(start.y - current.y) * 100}%`,
        }
      : undefined;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl touch-none select-none overflow-hidden rounded-xl border border-neutral-200"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Your wall" className="block h-auto w-full" draggable={false} />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
          preserveAspectRatio="none"
        >
          <polygon
            points={wallCorners.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#f24616"
            strokeDasharray={naturalWidth / 150}
            strokeWidth={naturalWidth / 400}
          />
        </svg>
        {previewStyle && (
          <div
            className="pointer-events-none absolute border-2 border-orange-500 bg-orange-500/20"
            style={previewStyle}
          />
        )}
      </div>
      <p className="text-sm text-neutral-500">Drag a rectangle over the area to cover with panels.</p>
    </div>
  );
}
