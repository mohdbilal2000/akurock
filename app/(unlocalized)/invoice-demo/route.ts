/**
 * Public, password-free copy of the invoice sheet for trying it out.
 *
 * Same file as /admin/invoice, with three changes made on the way out:
 * the firm and bank details are replaced with obvious dummies (this URL is
 * public, the real account number is not), browser storage uses separate
 * keys so nothing typed here can overwrite the admin's saved details or
 * invoice numbering, and a banner marks every page as a demo.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const DEMO_SELLER = `var SELLER_DEFAULTS = {
    s_legal: "Demo Firm Pvt Ltd",
    s_addr: "12 Sample Road, Jaipur, Rajasthan — 302001",
    s_gstin: "08AAACD1234E1Z9", s_contact: "", s_iec: "",
    bk_name: "Demo Firm Pvt Ltd", bk_acc: "000000000000", bk_ifsc: "SBIN0000000",
    bk_swift: "SBININBB000",
    bk_bank: "Demo Bank, Jaipur", bk_upi: "",
    prefix: "DEMO"
  };`;

const BANNER =
  '<div style="background:#f24616;color:#fff;text-align:center;padding:8px 12px;font:700 12px/1.4 Arial,sans-serif" class="no-print">' +
  "DEMO — dummy firm and bank details. Nothing here is a real invoice.</div>";

export async function GET() {
  let html = await readFile(path.join(process.cwd(), "invoices", "akurock-tax-invoice.html"), "utf8");
  html = html
    .replace(/var SELLER_DEFAULTS = \{[\s\S]*?\n  \};/, DEMO_SELLER)
    .replace(/"akurock-invoice-/g, '"akurock-invoice-demo-')
    .replace("<body>", "<body>" + BANNER)
    .replace("<title>Invoices — Stone Art Installation</title>", "<title>Invoice demo</title>");
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
