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
  return (
    <>
      {/* Same Playfair Display the rest of the site loads, so the tool doesn't
          fall back to a system serif and read as a different product. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-ground text-ink">{children}</div>
    </>
  );
}
