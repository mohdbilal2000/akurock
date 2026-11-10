"use client";

import { useState } from "react";
import type { Finish, PanelOrientation } from "@/config/panels";
import { formatEur } from "@/config/prices";
import { WHATSAPP_NUMBER } from "@/config/contact";
import { useVisualizerStrings } from "./useVisualizerStrings";

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  finish: Finish;
  orientation: PanelOrientation;
  panelCount: number;
  areaM2: number;
  priceEur: number;
  wallWidthMm: number;
  wallHeightMm: number;
  onReset: () => void;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

export function Toolbar({
  canvasRef,
  finish,
  orientation,
  panelCount,
  areaM2,
  priceEur,
  wallWidthMm,
  wallHeightMm,
  onReset,
}: ToolbarProps) {
  const t = useVisualizerStrings();
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "error">("idle");

  const fileName = `akurock-${finish.slug}-visualizer.jpg`;

  function download(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /**
   * Share sheet where the device has one (phones: straight into WhatsApp,
   * Mail, Photos…), plain download everywhere else.
   */
  async function handleShareImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `Akurock ${finish.name}` });
        return;
      } catch (err) {
        // The visitor closed the sheet: that is not a reason to download.
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    download(blob);
  }

  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(
      t.whatsappMessage
        .replace("{finish}", finish.name)
        .replace("{panels}", String(panelCount))
        .replace("{area}", areaM2.toFixed(1))
        .replace("{orientation}", orientation === "horizontal" ? t.horizontal : t.vertical)
        .replace("{wall}", `${(wallWidthMm / 1000).toFixed(2)} × ${(wallHeightMm / 1000).toFixed(2)}`)
        .replace("{price}", formatEur(priceEur)),
    );

  async function handleAddToCart() {
    setCartState("adding");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "visualizer",
          finish: finish.slug,
          orientation,
          panelCount,
          areaM2,
          priceEur,
        }),
      });
      setCartState(res.ok ? "added" : "error");
    } catch {
      setCartState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#178f47]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41A11.8 11.8 0 0 0 12.05 0Zm0 21.79a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.34Z" />
        </svg>
        {t.whatsappQuote}
      </a>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={cartState === "adding"}
          className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/85 disabled:opacity-60"
        >
          {cartState === "added" ? t.added : cartState === "adding" ? t.adding : t.addToCart}
        </button>
        <button
          type="button"
          onClick={handleShareImage}
          className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40"
        >
          {t.shareImage}
        </button>
      </div>
      {cartState === "error" && <p className="text-center text-sm text-red-600">{t.cartError}</p>}
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-ink/55 underline hover:text-ink"
      >
        {t.newPhoto}
      </button>
    </div>
  );
}
