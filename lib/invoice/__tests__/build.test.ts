import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildInvoiceHtml } from "../../../scripts/build-invoice.mjs";

describe("built invoice sheet", () => {
  it("matches template + engine (run `npm run invoice:build` after editing either)", () => {
    const built = readFileSync(path.resolve(__dirname, "../../../invoices/akurock-tax-invoice.html"), "utf8");
    expect(built === buildInvoiceHtml()).toBe(true);
  });
});
