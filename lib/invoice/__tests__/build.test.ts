import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildAppHtml, buildInvoiceHtml } from "../../../scripts/build-invoice.mjs";

describe("built invoice sheet", () => {
  it("matches template + engine (run `npm run invoice:build` after editing either)", () => {
    const built = readFileSync(path.resolve(__dirname, "../../../invoices/akurock-tax-invoice.html"), "utf8");
    expect(built === buildInvoiceHtml()).toBe(true);
  });
  it("the public app carries no real firm or bank details", () => {
    const app = buildAppHtml();
    for (const secret of ["37990375434", "08BSFPA0657M1ZO", "SBIN0031503", "AD081026005516D", "Tagore Lane"]) {
      expect(app.includes(secret)).toBe(false);
    }
  });
  it("the installable app is in sync too", () => {
    const app = readFileSync(path.resolve(__dirname, "../../../public/invoice-app/index.html"), "utf8");
    expect(app === buildAppHtml()).toBe(true);
  });

  it("vendor libraries are inlined without raw HTML that could break the page", () => {
    expect(buildAppHtml()).not.toContain("pdfobjectnewwindow");
  });

  it("the firm's password-protected app is in sync, pre-filled, and has no stamp in the file", () => {
    const page = readFileSync(path.resolve(__dirname, "../../../invoices/firm-app.html"), "utf8");
    expect(page === buildAppHtml("/invoices", { prefilled: true })).toBe(true);
    expect(page).toContain("37990375434");
    expect(page).toContain('var BUILTIN_STAMP = "";');
    expect(page).toContain('"/invoices/sw.js"');
  });
});
