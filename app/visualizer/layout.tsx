import type { Metadata } from "next";
import "./tailwind.css";

const PAGE_URL = "https://www.akurock.com/visualizer";
const TITLE = "Wall Visualizer — see Akurock stone acoustic panels on your own wall";
const DESCRIPTION =
  "Upload a photo of your room and see real Akurock natural stone acoustic panels on your wall in seconds — panel count, area and price included. Free, runs in your browser, your photo is never uploaded.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.akurock.com"),
  title: "Wall Visualizer | Akurock by stonearts®",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: PAGE_URL,
    siteName: "Akurock",
    images: [{ url: "/images/visualizer/room-living.webp", alt: "Akurock wall visualizer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/visualizer/room-living.webp"],
  },
  robots: { index: true, follow: true },
};

/**
 * Machine-readable description of the tool. Search and answer engines use
 * it to say what this page *does* ("a free tool that…") rather than guess
 * from a page that is mostly a canvas.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Akurock Wall Visualizer",
  url: PAGE_URL,
  description: DESCRIPTION,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript and WebGL",
  inLanguage: ["de", "en", "es"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  featureList: [
    "Automatic wall detection from a photo, on the visitor's device",
    "Panels rendered behind furniture with the room's own lighting",
    "Six natural stone finishes",
    "Panel count, area and price for the planned wall",
    "Before/after comparison and shareable image",
  ],
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <div className="min-h-screen bg-ground text-ink">{children}</div>
    </>
  );
}
