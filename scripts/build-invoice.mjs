// Builds invoices/akurock-tax-invoice.html: the template with the invoice
// engine and the brand logo inlined, so the result is one file that works
// offline, opens from WhatsApp, and is what /admin/invoice serves.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function buildInvoiceHtml() {
  const template = readFileSync(path.join(root, "invoices/invoice.template.html"), "utf8");
  const engine = readFileSync(path.join(root, "lib/invoice/engine.js"), "utf8");
  const logo = readFileSync(path.join(root, "invoices/logo.svg.html"), "utf8").trim();
  return template.replace("/*@ENGINE@*/", () => engine).replace("/*@LOGO@*/", () => logo);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  writeFileSync(path.join(root, "invoices/akurock-tax-invoice.html"), buildInvoiceHtml());
  console.log("built invoices/akurock-tax-invoice.html");
}
