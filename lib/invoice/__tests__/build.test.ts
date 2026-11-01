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
});
