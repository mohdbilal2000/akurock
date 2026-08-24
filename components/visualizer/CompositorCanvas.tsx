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
  wallWidthMm?: number;
  wallHeightMm?: number;
  finishSlug?: string;
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
    { imageUrl, naturalWidth, naturalHeight, imageToWallMm, coverageMm, panelSizeMm, textureUrl, wallWidthMm = 4000, wallHeightMm = 2500, finishSlug = "whisper" },
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

          const compositor = (compositorRef.current ??= new WallCompositor(canvas));
          compositor.setPhoto(photo, naturalWidth, naturalHeight);
          compositor.setStoneTexture(finishSlug, panel);

          const isVertical = panelSizeMm.height > panelSizeMm.width;
          compositor.render({
            stoneSlug: finishSlug,
            imageToWallMm,
            coverageMm,
            wallWidthMm,
            wallHeightMm,
            slatsVertical: isVertical,
            feltHex: "#b9b8bc",
            slatPitchMm: 64,
            slatWidthMm: 42,
            panelLengthMm: 2400,
            stoneScaleMm: { width: 600, height: 2400 },
          });
        } catch (err) {
          console.error("Visualizer render failed", err);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [imageUrl, naturalWidth, naturalHeight, imageToWallMm, coverageMm, panelSizeMm, textureUrl, wallWidthMm, wallHeightMm, finishSlug]);

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
