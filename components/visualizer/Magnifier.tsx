"use client";

import { useEffect, useRef } from "react";

interface MagnifierProps {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  pointerX: number;
  pointerY: number;
  zoom?: number;
}

/**
 * Magnifying glass overlay that shows a zoomed view of the region around
 * the pointer when adjusting corner positions. Helps users fine-tune corners
 * precisely.
 */
export function Magnifier({
  imageUrl,
  naturalWidth,
  naturalHeight,
  pointerX,
  pointerY,
  zoom = 2.5,
}: MagnifierProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const SIZE = 120;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const srcX = (pointerX / 100) * naturalWidth - SIZE / 2 / zoom;
      const srcY = (pointerY / 100) * naturalHeight - SIZE / 2 / zoom;

      ctx.drawImage(
        img,
        srcX,
        srcY,
        SIZE / zoom,
        SIZE / zoom,
        0,
        0,
        SIZE,
        SIZE,
      );

      // Draw crosshair
      ctx.strokeStyle = "rgba(242, 70, 22, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(SIZE / 2 - 8, SIZE / 2);
      ctx.lineTo(SIZE / 2 + 8, SIZE / 2);
      ctx.moveTo(SIZE / 2, SIZE / 2 - 8);
      ctx.lineTo(SIZE / 2, SIZE / 2 + 8);
      ctx.stroke();
    };
    img.src = imageUrl;
  }, [imageUrl, naturalWidth, naturalHeight, pointerX, pointerY, zoom]);

  return (
    <div
      className="pointer-events-none fixed rounded-full border-2 border-orange-500 bg-white shadow-lg"
      style={{
        width: 120,
        height: 120,
        left: `${pointerX}%`,
        top: `${pointerY}%`,
        transform: "translate(-50%, -50%)",
        backdropFilter: "blur(2px)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full rounded-full"
        style={{ display: "block" }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-full border border-orange-300/30" />
    </div>
  );
}
