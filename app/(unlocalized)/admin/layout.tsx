import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - stonearts®",
  description: "Admin panel for managing products, orders, and content",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link href="/admin/admin.css" rel="stylesheet" type="text/css" />
      <link href="https://fonts.googleapis.com" rel="preconnect" />
      <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
      <style dangerouslySetInnerHTML={{ __html: 'body { margin: 0; padding: 0; }' }} />
      {children}
    </>
  );
}
