import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - stonearts\u00ae",
};

export default function UnlocalizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
