"use client";

import { forwardRef, useEffect, useRef } from "react";
import type { Mat3, Rect } from "@/lib/geometry/types";
import { WallCompositor } from "@/lib/render/compositor";

interface CompositorCanvasProps {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  imageToWallMm: Mat3;
  coverageMm: Rect;
  panelSizeMm: { width: number; height: number };
  textureUrl: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Renders the instant composite (photo + warped panel texture) onto a canvas. */
export const CompositorCanvas = forwardRef<HTMLCanvasElement, CompositorCanvasProps>(
  function CompositorCanvas(
    { imageUrl, naturalWidth, naturalHeight, imageToWallMm, coverageMm, panelSizeMm, textureUrl },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLCanvasElement>(null);
    const compositorRef = useRef<WallCompositor | null>(null);

    useEffect(() => {
      const canvas = localRef.current;
      if (!canvas) return;
      let cancelled = false;

      (async () => {
        try {
          const [photo, panel] = await Promise.all([loadImage(imageUrl), loadImage(textureUrl)]);
          if (cancelled) return;

          compositorRef.current ??= new WallCompositor(canvas);
          compositorRef.current.render({
            photo,
            photoWidth: naturalWidth,
            photoHeight: naturalHeight,
            panelTexture: panel,
            imageToWallMm,
            coverageMm,
            panelSizeMm,
          });
        } catch (err) {
          console.error("Visualizer render failed", err);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [imageUrl, naturalWidth, naturalHeight, imageToWallMm, coverageMm, panelSizeMm, textureUrl]);

    return (
      <canvas
        ref={(node) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className="w-full max-w-2xl rounded-xl border border-neutral-200"
      />
    );
  },
);
