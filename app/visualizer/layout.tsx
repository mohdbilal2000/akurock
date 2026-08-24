import type { Metadata } from "next";
import "./tailwind.css";

export const metadata: Metadata = {
  title: "Wall Visualizer | Akurock by stonearts®",
  description:
    "Upload a photo of your wall and see it in real Akurock panels — exact panel count and price, instantly.",
};

/**
 * Nested layouts must NOT render <html>/<body> — only the root layout
 * (app/layout.tsx) does. Emitting a second pair here nested the whole tool
 * inside the root <body>, which browsers discard along with the classes on it.
 */
export default function VisualizerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-neutral-50 text-neutral-900">{children}</div>;
}
