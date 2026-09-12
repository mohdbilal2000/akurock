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
  feltHex?: string;
  /** AI wall mask (PNG data URL) — clips panels to the real wall surface. */
  wallMaskUrl?: string | null;
  /** AI occluder mask — keeps furniture and fittings in front of the panels. */
  occluderMaskUrl?: string | null;
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
    {
      imageUrl,
      naturalWidth,
      naturalHeight,
      imageToWallMm,
      coverageMm,
      panelSizeMm,
      textureUrl,
      wallWidthMm = 4000,
      wallHeightMm = 2500,
      finishSlug = "whisper",
      feltHex = "#b9b8bc",
      wallMaskUrl = null,
      occluderMaskUrl = null,
    },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLCanvasElement>(null);
    const compositorRef = useRef<WallCompositor | null>(null);
    // Masks are decoded and uploaded once per photo, not once per render:
    // re-decoding two PNGs on every slider tick would drop the frame rate
    // exactly when the user is dragging.
    const loadedMasksRef = useRef<string>("");
    // setPhoto() re-reads every pixel of the photo to build its luminance
    // mask — seconds on a 12MP phone shot. It must happen once per photo,
    // not once per render, or dragging a slider janks the whole tool.
    const loadedPhotoRef = useRef<string>("");

    useEffect(() => {
      const canvas = localRef.current;
      if (!canvas) return;
      let cancelled = false;

      (async () => {
        try {
          const [photo, panel] = await Promise.all([loadImage(imageUrl), loadImage(textureUrl)]);
          if (cancelled) return;

          const compositor = (compositorRef.current ??= new WallCompositor(canvas));
          if (loadedPhotoRef.current !== imageUrl || !compositor.hasPhoto()) {
            compositor.setPhoto(photo, naturalWidth, naturalHeight);
            loadedPhotoRef.current = imageUrl;
          }
          compositor.setStoneTexture(finishSlug, panel);

          const maskKey = `${wallMaskUrl ?? ""}|${occluderMaskUrl ?? ""}`;
          if (loadedMasksRef.current !== maskKey) {
            const [wallMask, occluder] = await Promise.all([
              wallMaskUrl ? loadImage(wallMaskUrl) : Promise.resolve(null),
              occluderMaskUrl ? loadImage(occluderMaskUrl) : Promise.resolve(null),
            ]);
            if (cancelled) return;
            compositor.setMasks(wallMask, occluder);
            loadedMasksRef.current = maskKey;
          }

          const isVertical = panelSizeMm.height > panelSizeMm.width;
          compositor.render({
            stoneSlug: finishSlug,
            imageToWallMm,
            coverageMm,
            wallWidthMm,
            wallHeightMm,
            slatsVertical: isVertical,
            feltHex,
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
    }, [
      imageUrl,
      naturalWidth,
      naturalHeight,
      imageToWallMm,
      coverageMm,
      panelSizeMm,
      textureUrl,
      wallWidthMm,
      wallHeightMm,
      finishSlug,
      feltHex,
      wallMaskUrl,
      occluderMaskUrl,
    ]);

    return (
      <canvas
        ref={(node) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        // The canvas's intrinsic size is the photo's natural pixel size, so it
        // needs BOTH axes constrained: w/h-auto keeps the aspect while
        // max-h-full stops a tall photo from overflowing its pane and
        // covering the sheet below it.
        className="block h-full w-full object-contain"
      />
    );
  },
);
