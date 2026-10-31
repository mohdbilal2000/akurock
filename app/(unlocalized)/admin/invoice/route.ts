/**
 * Serves the GST invoice sheet (invoices/akurock-tax-invoice.html) inside the
 * admin area. The /admin prefix puts it behind the same Basic Auth gate as the
 * rest of the panel (see proxy.ts), so the firm's bank details are not public.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const html = await readFile(path.join(process.cwd(), "invoices", "akurock-tax-invoice.html"), "utf8");
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
