import type { Metadata } from "next";
import "./tailwind.css";

export const metadata: Metadata = {
  title: "Wall Visualizer | Akurock by stonearts®",
  description:
    "Upload a photo of your wall and see it in real Akurock panels — exact panel count and price, instantly.",
};

export default function VisualizerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
