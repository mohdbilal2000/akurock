"use client";
import { useVisualizerStrings } from "./useVisualizerStrings";

import { useState } from "react";
import type { Finish, PanelOrientation } from "@/config/panels";

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  finish: Finish;
  orientation: PanelOrientation;
  panelCount: number;
  areaM2: number;
  priceEur: number;
  onReset: () => void;
}

export function Toolbar({ canvasRef, finish, orientation, panelCount, areaM2, priceEur, onReset }: ToolbarProps) {
  const t = useVisualizerStrings();
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "error">("idle");

  function handleSavePng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `akurock-${finish.slug}-visualizer.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

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
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleSavePng}
        className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-neutral-500"
      >
        {t.saveImage}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-neutral-500"
      >
        {t.newPhoto}
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={cartState === "adding"}
        className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
      >
        {cartState === "added" ? t.added : cartState === "adding" ? t.adding : t.addToCart}
      </button>
      {cartState === "error" && <p className="w-full text-center text-sm text-red-600">Couldn&apos;t add to cart, try again.</p>}
    </div>
  );
}
