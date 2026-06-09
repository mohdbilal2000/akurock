export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-wf-page="64ad4116e38ed7d405f77d2f" data-wf-site="64ad4116e38ed7d405f77d26" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
