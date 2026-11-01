import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const E = require("../engine.js");

const RJ = "08";
const base = {
  docType: "tax",
  market: "domestic",
  sellerStateCode: RJ,
  posStateCode: RJ,
  rateIncludesTax: false,
  items: [{ desc: "StoneSkin sheet", hsn: "68029900", qty: 352, unit: "SQF", rate: 90, discount: 0, gstRate: 18 }],
};
const inv = (over: Record<string, unknown> = {}) => ({ ...base, ...over });

describe("GSTIN", () => {
  it("accepts the two real GSTINs on the first bill", () => {
    expect(E.validateGstin("08BSFPA0657M1ZO").ok).toBe(true);
    expect(E.validateGstin("08ACPFS4093L1ZB").ok).toBe(true);
  });
  it("catches a one-character typo through the check character", () => {
    expect(E.validateGstin("08BSFPA0657M1ZP")).toMatchObject({ ok: false, reason: "checksum" });
    expect(E.validateGstin("08BSFPA0567M1ZO").ok).toBe(false);
  });
  it("rejects bad format and unknown or retired state codes", () => {
    expect(E.validateGstin("08BSFPA0657M1Z").reason).toBe("format");
    expect(E.validateGstin("99BSFPA0657M1ZO").reason).toBe("state");
    expect(E.validateGstin("").reason).toBe("empty");
  });
  it("reads state and PAN out of a valid GSTIN, case-insensitively", () => {
    expect(E.validateGstin(" 08bsfpa0657m1zo ")).toMatchObject({ stateCode: "08", pan: "BSFPA0657M" });
  });
});

describe("invoice number and financial year", () => {
  it("enforces the 16-character, letters/digits/-/ rule", () => {
    expect(E.validateInvoiceNumber("SAI/26-27/001")).toBe("");
    expect(E.validateInvoiceNumber("SAI/EX/26-27/0001")).toBe("too_long");
    expect(E.validateInvoiceNumber("SAI 26-27 001")).toBe("characters");
    expect(E.validateInvoiceNumber("")).toBe("empty");
  });
  it("turns over on 1 April, not 1 January", () => {
    expect(E.financialYear("2026-10-09")).toBe("26-27");
    expect(E.financialYear("2027-03-31")).toBe("26-27");
    expect(E.financialYear("2027-04-01")).toBe("27-28");
    expect(E.financialYear("2099-12-01")).toBe("99-00");
  });
});

describe("which tax applies", () => {
  it("same state: CGST + SGST", () => {
    expect(E.taxHeads(inv()).heads).toEqual(["CGST", "SGST"]);
  });
  it("different state: IGST", () => {
    expect(E.taxHeads(inv({ posStateCode: "07" })).heads).toEqual(["IGST"]);
  });
  it("within a UT without a legislature: CGST + UTGST", () => {
    for (const ut of ["04", "26", "31", "35", "38"])
      expect(E.taxHeads(inv({ sellerStateCode: ut, posStateCode: ut })).heads).toEqual(["CGST", "UTGST"]);
  });
  it("Delhi, Puducherry and J&K have legislatures, so SGST", () => {
    for (const s of ["07", "34", "01"])
      expect(E.taxHeads(inv({ sellerStateCode: s, posStateCode: s })).heads).toEqual(["CGST", "SGST"]);
  });
  it("export: IGST if paid, nothing under LUT", () => {
    expect(E.taxHeads(inv({ market: "export", exportMode: "igst" })).heads).toEqual(["IGST"]);
    expect(E.taxHeads(inv({ market: "export", exportMode: "lut" })).heads).toEqual([]);
  });
  it("bill of supply charges no tax", () => {
    expect(E.taxHeads(inv({ docType: "bos" })).heads).toEqual([]);
  });
  it("refuses to guess when a state is missing", () => {
    expect(E.taxHeads(inv({ posStateCode: "" })).nature).toBe("unknown");
  });
});

describe("domestic amounts", () => {
  it("rate excludes GST: 352 x 90 + 18% = 37,382 after round-off", () => {
    const r = E.computeInvoice(inv());
    expect(r.totals.taxable).toBe(31680);
    expect(r.totals.tax.CGST).toBe(2851.2);
    expect(r.totals.tax.SGST).toBe(2851.2);
    expect(r.exactTotal).toBe(37382.4);
    expect(r.roundOff).toBe(-0.4);
    expect(r.payable).toBe(37382);
    expect(r.words).toBe("Rupees thirty-seven thousand three hundred and eighty-two only");
  });
  it("rate includes GST: 352 x 90 stays 31,680 with the tax inside", () => {
    const r = E.computeInvoice(inv({ rateIncludesTax: true }));
    expect(r.totals.taxable).toBe(26847.46);
    expect(r.totals.tax.CGST).toBe(2416.27);
    expect(r.totals.tax.SGST).toBe(2416.27);
    expect(r.payable).toBe(31680);
    expect(r.roundOff).toBe(0);
  });
  it("inter-state uses one IGST figure equal to both halves", () => {
    const r = E.computeInvoice(inv({ posStateCode: "27" }));
    expect(r.totals.tax.IGST).toBe(5702.4);
    expect(r.totals.tax.CGST + r.totals.tax.SGST).toBe(0);
    expect(r.payable).toBe(37382);
  });
  it("bill of supply: exactly qty x rate, no tax, no hidden rounding", () => {
    const r = E.computeInvoice(inv({ docType: "bos" }));
    expect(r.totals.taxTotal).toBe(0);
    expect(r.payable).toBe(31680);
    expect(r.taxWords).toBe("");
  });
  it("printed columns always add up to the printed total", () => {
    // Awkward numbers on purpose: odd paise, inclusive and exclusive, 3 lines.
    const items = [
      { desc: "a", hsn: "6802", qty: 3.5, rate: 101.33, discount: 7.1, gstRate: 18 },
      { desc: "b", hsn: "9965", qty: 1, rate: 1999.99, discount: 0, gstRate: 5 },
      { desc: "c", hsn: "6802", qty: 17, rate: 0.37, discount: 0, gstRate: 18 },
    ];
    for (const incl of [false, true]) for (const pos of ["08", "07"]) {
      const r = E.computeInvoice(inv({ items, rateIncludesTax: incl, posStateCode: pos }));
      const sumTaxable = r.lines.reduce((s: number, l: { taxable: number }) => s + l.taxable, 0);
      const sumTax = r.lines.reduce((s: number, l: { taxTotal: number }) => s + l.taxTotal, 0);
      expect(E.round2(sumTaxable)).toBe(r.totals.taxable);
      expect(E.round2(sumTax)).toBe(r.totals.taxTotal);
      expect(E.round2(r.totals.taxable + r.totals.taxTotal + r.roundOff)).toBe(r.payable);
      expect(Math.abs(r.roundOff)).toBeLessThanOrEqual(0.5);
      const hsnTax = r.hsnSummary.reduce((s: number, h: { taxTotal: number }) => s + h.taxTotal, 0);
      expect(E.round2(hsnTax)).toBe(r.totals.taxTotal);
    }
  });
  it("CGST and SGST always print as the same figure", () => {
    const r = E.computeInvoice(inv({ items: [{ desc: "x", hsn: "6802", qty: 1, rate: 100.05, gstRate: 18 }] }));
    expect(r.totals.tax.CGST).toBe(r.totals.tax.SGST);
  });
  it("applies the discount before tax", () => {
    const r = E.computeInvoice(inv({ items: [{ desc: "x", hsn: "6802", qty: 10, rate: 100, discount: 100, gstRate: 18 }] }));
    expect(r.totals.taxable).toBe(900);
    expect(r.totals.taxTotal).toBe(162);
    expect(r.payable).toBe(1062);
  });
  it("groups the HSN summary by code and rate", () => {
    const r = E.computeInvoice(inv({ items: [
      { desc: "a", hsn: "6802", qty: 1, rate: 100, gstRate: 18 },
      { desc: "b", hsn: "6802", qty: 1, rate: 50, gstRate: 18 },
      { desc: "c", hsn: "9965", qty: 1, rate: 10, gstRate: 5 },
    ] }));
    expect(r.hsnSummary).toHaveLength(2);
    expect(r.hsnSummary.find((h: { hsn: string }) => h.hsn === "6802").taxable).toBe(150);
  });
});

describe("exports", () => {
  const exp = (over: Record<string, unknown> = {}) =>
    inv({ market: "export", exportMode: "lut", currency: "USD", fxRate: 83.5, items: [{ desc: "StoneSkin", hsn: "68029900", qty: 100, rate: 12.5, gstRate: 18 }], ...over });

  it("under LUT: no tax, buyer pays the foreign-currency value", () => {
    const r = E.computeInvoice(exp());
    expect(r.totals.taxTotal).toBe(0);
    expect(r.payable).toBe(1250);
    expect(r.inr.taxable).toBe(104375);
    expect(r.words).toBe("One thousand two hundred and fifty US Dollars only");
  });
  it("with IGST: tax is computed in rupees and not added to the buyer's bill", () => {
    const r = E.computeInvoice(exp({ exportMode: "igst" }));
    expect(r.inr.igst).toBe(18787.5);
    expect(r.payable).toBe(1250);
    expect(r.inr.total).toBe(123162.5);
  });
  it("ignores 'rate includes GST' on an export", () => {
    expect(E.computeInvoice(exp({ exportMode: "igst", rateIncludesTax: true })).totals.taxable).toBe(1250);
  });
  it("never rounds a foreign-currency invoice to the unit", () => {
    const r = E.computeInvoice(exp({ items: [{ desc: "x", hsn: "68029900", qty: 3, rate: 10.33, gstRate: 18 }] }));
    expect(r.payable).toBe(30.99);
    expect(r.roundOff).toBe(0);
    expect(r.words).toBe("Thirty US Dollars and ninety-nine cents only");
  });
});

describe("amount in words", () => {
  it("Indian system for rupees", () => {
    expect(E.amountInWords(31680, "INR")).toBe("Rupees thirty-one thousand six hundred and eighty only");
    expect(E.amountInWords(12345678.5, "INR")).toBe("Rupees one crore twenty-three lakh forty-five thousand six hundred and seventy-eight and fifty paise only");
    expect(E.amountInWords(100005, "INR")).toBe("Rupees one lakh and five only");
    expect(E.amountInWords(0.01, "INR")).toBe("Rupees zero and one paisa only");
  });
  it("international system and singulars for other currencies", () => {
    expect(E.amountInWords(1, "USD")).toBe("One US Dollar only");
    expect(E.amountInWords(1234567.01, "EUR")).toBe("One million two hundred and thirty-four thousand five hundred and sixty-seven Euros and one cent only");
    expect(E.amountInWords(2005, "GBP")).toBe("Two thousand and five Pounds Sterling only");
  });
});

describe("compliance checks", () => {
  const full = (over: Record<string, unknown> = {}) => ({
    ...base,
    number: "SAI/26-27/001", date: "2026-10-09",
    seller: { legalName: "Stone Art Installation", address: "Jaipur", gstin: "08BSFPA0657M1ZO", iec: "", swift: "SBININBB851" },
    customer: { name: "Shree Balaji Plylam", address: "Jaipur", gstin: "08ACPFS4093L1ZB", country: "India" },
    ...over,
  });
  const run = (o: Record<string, unknown>) => E.checkInvoice(o, E.computeInvoice(o));

  it("passes the real first bill with no errors", () => {
    expect(run(full({ rateIncludesTax: true, ewayBill: "" })).errors).toEqual([]);
  });
  it("flags a mistyped GSTIN as an error", () => {
    const res = run(full({ seller: { legalName: "a", address: "b", gstin: "08BSFPA0657M1ZP" } }));
    expect(res.errors.join(" ")).toMatch(/Your GSTIN is not valid/);
  });
  it("flags a customer GSTIN from another state than the place of supply", () => {
    expect(run(full({ posStateCode: "27" })).warnings.join(" ")).toMatch(/registered in Rajasthan/);
  });
  it("requires HSN on tax invoices and bills of supply, not on proformas", () => {
    const items = [{ desc: "x", hsn: "", qty: 1, rate: 1, gstRate: 18 }];
    expect(run(full({ items })).errors.join(" ")).toMatch(/HSN/);
    expect(run(full({ items, docType: "bos" })).errors.join(" ")).toMatch(/HSN/);
    expect(run(full({ items, docType: "proforma" })).errors.join(" ")).not.toMatch(/HSN/);
  });
  it("warns about the e-way bill above Rs.50,000", () => {
    const big = [{ desc: "x", hsn: "6802", qty: 600, rate: 90, gstRate: 18 }]; // 63,720
    expect(run(full()).warnings.join(" ")).not.toMatch(/e-way bill/); // 37,382
    expect(run(full({ items: big })).warnings.join(" ")).toMatch(/e-way bill/);
    expect(run(full({ items: big, ewayBill: "123456789012" })).warnings.join(" ")).not.toMatch(/e-way bill/);
  });
  it("export: country and exchange rate are required, LUT ARN and IEC are flagged", () => {
    const res = run(full({ market: "export", exportMode: "lut", currency: "USD", fxRate: 0, customer: { name: "a", address: "b", country: "" } }));
    expect(res.errors.join(" ")).toMatch(/country/);
    expect(res.errors.join(" ")).toMatch(/Exchange rate/);
    expect(res.warnings.join(" ")).toMatch(/LUT ARN/);
    expect(res.warnings.join(" ")).toMatch(/IEC/);
  });
  it("says plainly what a bill of supply and a proforma are not", () => {
    expect(run(full({ docType: "bos" })).warnings.join(" ")).toMatch(/composition dealer/);
    expect(run(full({ docType: "proforma" })).warnings.join(" ")).toMatch(/not a tax invoice/);
  });
  it("warns on a non-standard GST rate", () => {
    const items = [{ desc: "x", hsn: "6802", qty: 1, rate: 1, gstRate: 12 }];
    expect(run(full({ items })).warnings.join(" ")).toMatch(/not a standard GST rate/);
  });
});

describe("other charges (freight etc.)", () => {
  // Khandelwal Packaging invoice 1037: five items 12,795 + freight 500, all
  // 18% intra-state, CGST 1,196.55 + SGST 1,196.55, round off -0.10 = 15,688.
  const khandelwal = inv({
    items: [
      { desc: "Paint Roller", hsn: "9603", qty: 1000, unit: "NOS", rate: 6.5, gstRate: 18 },
      { desc: "Self Adhesive Tape", hsn: "3919", qty: 1, unit: "BOX", rate: 3350, gstRate: 18 },
      { desc: "16 mm Pet Strip", hsn: "3920", qty: 1, unit: "ROLL", rate: 1760, gstRate: 18 },
      { desc: "Clip 3/4\"", hsn: "7326", qty: 5, unit: "KGS", rate: 85, gstRate: 18 },
      { desc: "Packing Machine (Plier)", hsn: "8207", qty: 2, unit: "NOS", rate: 380, gstRate: 18 },
    ],
    charges: [{ label: "Freight Charges", sac: "996521", amount: 500, gstRate: 18 }],
  });

  it("reproduces a real supplier's invoice to the paisa", () => {
    const r = E.computeInvoice(khandelwal);
    expect(r.totals.taxable).toBe(13295);
    expect(r.totals.tax.CGST).toBe(1196.55);
    expect(r.totals.tax.SGST).toBe(1196.55);
    expect(r.roundOff).toBe(-0.1);
    expect(r.payable).toBe(15688);
    expect(r.taxWords).toBe("Rupees two thousand three hundred and ninety-three and ten paise only");
    expect(r.hsnSummary.find((h: { hsn: string }) => h.hsn === "996521").taxTotal).toBe(90);
  });
  it("never treats a charge as GST-inclusive, even when item rates are", () => {
    const r = E.computeInvoice(inv({ rateIncludesTax: true, charges: [{ label: "Freight", sac: "996521", amount: 500, gstRate: 18 }] }));
    const freight = r.lines.find((l: { isCharge: boolean }) => l.isCharge);
    expect(freight.taxable).toBe(500);
    expect(freight.taxTotal).toBe(90);
    expect(r.payable).toBe(31680 + 590);
  });
  it("ignores blank charge rows and checks filled ones", () => {
    const blank = E.computeInvoice(inv({ charges: [{ label: "", sac: "", amount: "", gstRate: 18 }] }));
    expect(blank.lines).toHaveLength(1);
    const o = { ...khandelwal, number: "1037", date: "2026-10-29", posStateCode: "08",
      seller: { legalName: "x", address: "y", gstin: "08BSFPA0657M1ZO" }, customer: { name: "a", address: "b" },
      charges: [{ label: "", sac: "99", amount: 0, gstRate: 18 }] };
    const errs = E.checkInvoice(o, E.computeInvoice(o)).errors.join(" ");
    expect(errs).toMatch(/Charge 1: name is missing/);
    expect(errs).toMatch(/Charge 1: amount/);
    expect(errs).toMatch(/Charge 1: SAC/);
  });
});

describe("packing list", () => {
  it("totals boxes and weights, and a single-unit quantity", () => {
    const p = E.computePacking([
      { desc: "Holder", qty: 500, unit: "PCS", boxes: 14, grossKg: 17.5, netKg: 16 },
      { desc: "Bowls", qty: 954, unit: "PCS", boxes: 23, grossKg: 720, netKg: 700 },
      { desc: "Sticks", qty: 58, unit: "PCS", boxes: "", grossKg: "", netKg: "" },
    ]);
    expect(p.totals).toMatchObject({ qty: 1512, boxes: 37, grossKg: 737.5, netKg: 716, unit: "PCS", mixedUnits: false });
  });
  it("flags mixed units instead of adding pieces to kilograms", () => {
    expect(E.computePacking([{ qty: 1, unit: "PCS" }, { qty: 2, unit: "KGS" }]).totals.mixedUnits).toBe(true);
  });
  it("adds weights without floating-point drift", () => {
    const rows = Array.from({ length: 12 }, () => ({ qty: 448, unit: "PCS", boxes: 4, grossKg: 114.8 }));
    expect(E.computePacking(rows).totals.grossKg).toBe(1377.6);
  });
  it("refuses net weight above gross weight", () => {
    expect(E.checkPacking([{ grossKg: 10, netKg: 12 }]).errors[0]).toMatch(/net weight is more than gross/);
    expect(E.checkPacking([{ grossKg: 12, netKg: 10, boxes: 2 }]).errors).toEqual([]);
  });
});

describe("measurement", () => {
  it("reads sizes in every common unit and refuses a size with no unit", () => {
    expect(E.parseSize("8x4 ft")).toEqual({ length: 8, width: 4, unit: "ft" });
    expect(E.parseSize(" 2440 X 1220mm ")).toEqual({ length: 2440, width: 1220, unit: "mm" });
    expect(E.parseSize("1.2 × 0.6 m")).toEqual({ length: 1.2, width: 0.6, unit: "m" });
    expect(E.parseSize("8x4 feet").unit).toBe("ft");
    expect(E.parseSize("8x4")).toBeNull();
    expect(E.parseSize("8 by 4 ft")).toBeNull();
  });
  it("11 sheets of 8x4 ft = 352 sq ft = 32.70 sq m", () => {
    expect(E.areaQty(11, "8x4 ft", "SQF")).toBe(352);
    expect(E.areaQty(11, "8x4 ft", "SQM")).toBe(32.7);
  });
  it("metric sheets convert exactly", () => {
    expect(E.areaQty(10, "2440x1220 mm", "SQM")).toBe(29.77);
    expect(E.areaQty(1, "1x1 m", "SQF")).toBe(10.76);
    expect(E.areaQty(144, "12x12 in", "SQF")).toBe(144);
  });
  it("only fills area units, and only with pieces and a size", () => {
    expect(E.areaQty(11, "8x4 ft", "PCS")).toBeNull();
    expect(E.areaQty(0, "8x4 ft", "SQF")).toBeNull();
    expect(E.areaQty(11, "8x4", "SQF")).toBeNull();
  });
});

describe("packing list per-box quantities", () => {
  it("112 per box x 4 boxes = 448, as on the incense sheet", () => {
    const p = E.computePacking([{ desc: "Myrrh", perBox: 112, boxes: 4, unit: "PCS" }]);
    expect(p.lines[0].qty).toBe(448);
  });
  it("flags a per-box count that disagrees with the invoice quantity", () => {
    expect(E.checkPacking([{ perBox: 112, boxes: 4, qty: 450 }]).errors[0]).toMatch(/not the invoice quantity 450/);
    expect(E.checkPacking([{ perBox: 112, boxes: 4, qty: 448 }]).errors).toEqual([]);
  });
});
