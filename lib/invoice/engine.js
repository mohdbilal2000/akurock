/**
 * Invoice engine: every number and every GST rule the invoice sheet prints.
 *
 * Plain ES2017, no imports, so the same file runs in Vitest and is inlined
 * verbatim into the standalone sheet (scripts/build-invoice.mjs). The sheet
 * never does its own arithmetic: it collects fields, calls computeInvoice and
 * checkInvoice, and renders what comes back.
 *
 * Money is handled in paise-rounded steps (round2) at the exact points a
 * printed figure is produced, so every printed column adds up to the printed
 * total and the only rounding the reader sees is the explicit round-off line.
 */
(function (root, factory) {
  var engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  else root.InvoiceEngine = engine;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // GST state codes as used in GSTINs and on the GST portal. 25 (Daman & Diu)
  // and 28 (old Andhra Pradesh) are retired: their GSTINs now begin 26 and 37.
  var STATES = {
    "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka",
    "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
    "97": "Other Territory"
  };

  // Union territories without a legislature levy UTGST in place of SGST.
  // Delhi (07), Puducherry (34) and J&K (01) have legislatures: SGST.
  var UT_WITHOUT_LEGISLATURE = { "04": 1, "26": 1, "31": 1, "35": 1, "38": 1, "97": 1 };

  // Rates in force after the September 2025 rationalisation. Any other rate
  // can still be typed; checkInvoice warns rather than refuses, because a
  // product-specific notified rate must stay possible.
  var GST_RATES = [0, 0.25, 3, 5, 18, 40];

  var CURRENCIES = {
    INR: { symbol: "₹", major: ["Rupee", "Rupees"], minor: ["paisa", "paise"], indian: true },
    USD: { symbol: "US$", major: ["US Dollar", "US Dollars"], minor: ["cent", "cents"] },
    EUR: { symbol: "€", major: ["Euro", "Euros"], minor: ["cent", "cents"] },
    GBP: { symbol: "£", major: ["Pound Sterling", "Pounds Sterling"], minor: ["penny", "pence"] },
    AED: { symbol: "AED", major: ["UAE Dirham", "UAE Dirhams"], minor: ["fils", "fils"] },
    SAR: { symbol: "SAR", major: ["Saudi Riyal", "Saudi Riyals"], minor: ["halala", "halalas"] },
    QAR: { symbol: "QAR", major: ["Qatari Riyal", "Qatari Riyals"], minor: ["dirham", "dirhams"] },
    AUD: { symbol: "A$", major: ["Australian Dollar", "Australian Dollars"], minor: ["cent", "cents"] },
    CAD: { symbol: "C$", major: ["Canadian Dollar", "Canadian Dollars"], minor: ["cent", "cents"] },
    NZD: { symbol: "NZ$", major: ["New Zealand Dollar", "New Zealand Dollars"], minor: ["cent", "cents"] },
    SGD: { symbol: "S$", major: ["Singapore Dollar", "Singapore Dollars"], minor: ["cent", "cents"] },
    CHF: { symbol: "CHF", major: ["Swiss Franc", "Swiss Francs"], minor: ["centime", "centimes"] }
  };

  function round2(n) {
    // Nudge by EPSILON so 2.675 rounds to 2.68 as a person would, not 2.67.
    return Math.round((n + (n >= 0 ? 1 : -1) * Number.EPSILON) * 100) / 100;
  }

  function num(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    var n = parseFloat(String(v == null ? "" : v).replace(/,/g, ""));
    return isFinite(n) ? n : 0;
  }

  /* ---------------- identifiers ---------------- */

  var GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function gstinCheckChar(first14) {
    var total = 0;
    for (var i = 0; i < 14; i++) {
      var v = GSTIN_CHARS.indexOf(first14.charAt(i)) * (i % 2 === 0 ? 1 : 2);
      total += Math.floor(v / 36) + (v % 36);
    }
    return GSTIN_CHARS.charAt((36 - (total % 36)) % 36);
  }

  /** {ok, reason} — format, known state code, and the check character. */
  function validateGstin(raw) {
    var g = String(raw || "").trim().toUpperCase();
    if (!g) return { ok: false, reason: "empty" };
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false, reason: "format" };
    if (!STATES[g.slice(0, 2)]) return { ok: false, reason: "state" };
    if (gstinCheckChar(g.slice(0, 14)) !== g.charAt(14)) return { ok: false, reason: "checksum" };
    return { ok: true, gstin: g, stateCode: g.slice(0, 2), pan: g.slice(2, 12) };
  }

  /** Indian financial year label for a yyyy-mm-dd date: 2026-10-09 -> "26-27". */
  function financialYear(dateStr) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
    if (!m) return "";
    var y = +m[1], start = +m[2] >= 4 ? y : y - 1;
    return String(start % 100).padStart(2, "0") + "-" + String((start + 1) % 100).padStart(2, "0");
  }

  /** Rule 46(b): up to 16 characters, letters, digits, "-" and "/" only. */
  function validateInvoiceNumber(no) {
    var s = String(no || "").trim();
    if (!s) return "empty";
    if (s.length > 16) return "too_long";
    if (!/^[A-Za-z0-9\/-]+$/.test(s)) return "characters";
    return "";
  }

  /* ---------------- tax structure ---------------- */

  /**
   * Which tax heads apply. Exports are inter-state supplies by law (IGST Act
   * s.7(5)), whether or not IGST is actually charged.
   */
  function taxHeads(inv) {
    if (inv.docType === "bos") return { nature: "none", heads: [] };
    if (inv.market === "export") {
      return inv.exportMode === "lut"
        ? { nature: "export-lut", heads: [] }
        : { nature: "export-igst", heads: ["IGST"] };
    }
    var seller = String(inv.sellerStateCode || ""), pos = String(inv.posStateCode || "");
    if (!seller || !pos) return { nature: "unknown", heads: [] };
    if (seller !== pos) return { nature: "inter", heads: ["IGST"] };
    return { nature: "intra", heads: UT_WITHOUT_LEGISLATURE[pos] ? ["CGST", "UTGST"] : ["CGST", "SGST"] };
  }

  /* ---------------- computation ---------------- */

  /**
   * inv = {
   *   docType: "tax" | "bos" | "proforma", market: "domestic" | "export",
   *   exportMode: "lut" | "igst", sellerStateCode, posStateCode,
   *   rateIncludesTax: bool (domestic only), currency, fxRate (INR per unit),
   *   items: [{ desc, hsn, qty, unit, rate, discount, gstRate }]
   * }
   */
  function computeInvoice(inv) {
    var structure = taxHeads(inv);
    var heads = structure.heads;
    var charges = heads.length > 0;
    var isExport = inv.market === "export";
    var currency = isExport ? (inv.currency || "USD") : "INR";
    var fx = isExport ? num(inv.fxRate) : 1;
    var inclusive = !isExport && charges && !!inv.rateIncludesTax;
    var split = heads.length === 2;

    var lines = [];
    var hsnMap = {};
    var t = { gross: 0, discount: 0, taxable: 0, tax: { CGST: 0, SGST: 0, UTGST: 0, IGST: 0 }, taxTotal: 0, taxableInr: 0 };

    (inv.items || []).forEach(function (it, i) {
      var qty = num(it.qty), rate = num(it.rate), disc = Math.max(0, num(it.discount));
      var gstRate = charges ? Math.max(0, num(it.gstRate)) : 0;
      var gross = round2(qty * rate);
      var net = round2(Math.max(0, gross - disc));

      // Tax is always computed in rupees. For an export the line is priced in
      // foreign currency and converted at the notified rate first.
      var taxable, taxableInr, a = { CGST: 0, SGST: 0, UTGST: 0, IGST: 0 };
      if (inclusive && gstRate > 0) {
        taxable = round2(net / (1 + gstRate / 100));
      } else {
        taxable = net;
      }
      taxableInr = isExport ? round2(taxable * fx) : taxable;

      if (charges && gstRate > 0) {
        if (split) {
          // Each half is computed on the same base and rounded on its own, so
          // CGST and SGST always print as the same figure.
          var half = round2(taxableInr * gstRate / 200);
          a[heads[0]] = half;
          a[heads[1]] = half;
        } else {
          a.IGST = round2(taxableInr * gstRate / 100);
        }
      }
      var lineTax = round2(a.CGST + a.SGST + a.UTGST + a.IGST);
      var lineTotal = isExport ? taxable : round2(taxable + lineTax);

      lines.push({
        index: i + 1, desc: it.desc || "", hsn: String(it.hsn || "").trim(), qty: qty, unit: it.unit || "",
        rate: rate, gross: gross, discount: round2(gross - net), taxable: taxable, taxableInr: taxableInr,
        gstRate: gstRate, tax: a, taxTotal: lineTax, total: lineTotal
      });

      t.gross = round2(t.gross + gross);
      t.discount = round2(t.discount + (gross - net));
      t.taxable = round2(t.taxable + taxable);
      t.taxableInr = round2(t.taxableInr + taxableInr);
      ["CGST", "SGST", "UTGST", "IGST"].forEach(function (h) { t.tax[h] = round2(t.tax[h] + a[h]); });
      t.taxTotal = round2(t.taxTotal + lineTax);

      var key = (it.hsn || "").trim() + "|" + gstRate;
      if (!hsnMap[key]) hsnMap[key] = { hsn: (it.hsn || "").trim(), gstRate: gstRate, taxable: 0, tax: { CGST: 0, SGST: 0, UTGST: 0, IGST: 0 }, taxTotal: 0 };
      var h = hsnMap[key];
      h.taxable = round2(h.taxable + taxableInr);
      ["CGST", "SGST", "UTGST", "IGST"].forEach(function (k) { h.tax[k] = round2(h.tax[k] + a[k]); });
      h.taxTotal = round2(h.taxTotal + lineTax);
    });

    var result = {
      structure: structure, heads: heads, chargesTax: charges, currency: currency, fxRate: fx,
      inclusive: inclusive, lines: lines, totals: t,
      hsnSummary: Object.keys(hsnMap).map(function (k) { return hsnMap[k]; })
    };

    if (isExport) {
      // The foreign buyer pays the invoice value in their currency. IGST on an
      // export (when paid) is the exporter's, refunded under Rule 96; it is
      // shown in rupees for the GST return, not added to the buyer's bill.
      result.payable = t.taxable;
      result.roundOff = 0;
      result.inr = { taxable: t.taxableInr, igst: t.tax.IGST, total: round2(t.taxableInr + t.tax.IGST) };
      result.words = amountInWords(t.taxable, currency);
      result.taxWords = t.tax.IGST ? amountInWords(t.tax.IGST, "INR") : "";
    } else {
      var exact = round2(t.taxable + t.taxTotal);
      var rounded = Math.round(exact);
      result.payable = rounded;
      result.roundOff = round2(rounded - exact);
      result.exactTotal = exact;
      result.words = amountInWords(rounded, "INR");
      result.taxWords = charges ? amountInWords(t.taxTotal, "INR") : "";
    }
    return result;
  }

  /* ---------------- amount in words ---------------- */

  var ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
    "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""); }
  function three(n) {
    var h = Math.floor(n / 100), r = n % 100, out = h ? ONES[h] + " hundred" : "";
    if (r) out += (out ? " and " : "") + two(r);
    return out;
  }

  function indianWords(n) {
    if (n === 0) return "zero";
    var parts = [], crore = Math.floor(n / 1e7);
    n %= 1e7;
    if (crore) parts.push((crore > 999 ? indianWords(crore) : three(crore)) + " crore");
    var lakh = Math.floor(n / 1e5); n %= 1e5;
    if (lakh) parts.push(two(lakh) + " lakh");
    var th = Math.floor(n / 1e3); n %= 1e3;
    if (th) parts.push(two(th) + " thousand");
    if (n) parts.push((parts.length && n < 100 ? "and " : "") + three(n));
    return parts.join(" ");
  }

  function westernWords(n) {
    if (n === 0) return "zero";
    var scales = ["", " thousand", " million", " billion"], parts = [], i = 0;
    while (n > 0 && i < scales.length) {
      var chunk = n % 1000;
      if (chunk) parts.unshift(((i === 0 && parts.length === 0 && n >= 1000 && chunk < 100) ? "and " : "") + three(chunk) + scales[i]);
      n = Math.floor(n / 1000); i++;
    }
    return parts.join(" ");
  }

  function amountInWords(amount, currency) {
    var cur = CURRENCIES[currency] || CURRENCIES.INR;
    var cents = Math.round(Math.abs(num(amount)) * 100);
    var major = Math.floor(cents / 100), minor = cents % 100;
    var words = cur.indian ? indianWords(major) : westernWords(major);
    var text = (cur.indian ? "Rupees " + words : words + " " + cur.major[major === 1 ? 0 : 1]);
    if (minor) text += " and " + two(minor) + " " + cur.minor[minor === 1 ? 0 : 1];
    text += " only";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /* ---------------- compliance checks ---------------- */

  /**
   * errors: the document is wrong or not a valid instance of its type.
   * warnings: legal but worth a second look before it goes out.
   */
  function checkInvoice(inv, res) {
    var errors = [], warnings = [];
    var isTaxDoc = inv.docType === "tax";
    var isExport = inv.market === "export";
    var s = inv.seller || {}, c = inv.customer || {};

    if (!String(s.legalName || "").trim()) errors.push("Your firm's legal name is missing.");
    if (!String(s.address || "").trim()) errors.push("Your firm's address is missing.");
    if (inv.docType !== "proforma") {
      var sg = validateGstin(s.gstin);
      if (!sg.ok) errors.push(sg.reason === "empty" ? "Your GSTIN is missing." : "Your GSTIN is not valid (" + gstinReason(sg.reason) + ").");
    }

    var noIssue = validateInvoiceNumber(inv.number);
    if (noIssue === "empty") errors.push("Invoice number is missing.");
    if (noIssue === "too_long") errors.push("Invoice number is longer than 16 characters (GST limit).");
    if (noIssue === "characters") errors.push("Invoice number may only use letters, digits, \"-\" and \"/\".");
    if (!inv.date) errors.push("Invoice date is missing.");

    if (!String(c.name || "").trim()) errors.push("Customer name is missing.");
    if (!String(c.address || "").trim()) errors.push("Customer address is missing.");

    if (isExport) {
      if (!String(c.country || "").trim()) errors.push("Customer country is missing.");
      if (!(num(inv.fxRate) > 0)) errors.push("Exchange rate (" + (inv.currency || "") + " to INR) is missing.");
      if (!String(s.iec || "").trim()) warnings.push("Your IEC (Import Export Code) is not filled in; customs needs it on an export of goods.");
      if (inv.exportMode === "lut" && !String(inv.lutArn || "").trim()) warnings.push("LUT ARN is empty. Exporting without IGST needs a Letter of Undertaking filed for this financial year.");
      if (!String(s.swift || "").trim()) warnings.push("SWIFT code is empty; an overseas buyer needs it to pay you.");
    } else {
      if (!inv.posStateCode) errors.push("Place of supply (customer's state) is missing.");
      var cgRaw = String(c.gstin || "").trim();
      if (cgRaw) {
        var cg = validateGstin(cgRaw);
        if (!cg.ok) errors.push("Customer GSTIN is not valid (" + gstinReason(cg.reason) + ").");
        else if (inv.posStateCode && cg.stateCode !== inv.posStateCode && !inv.shipToDifferent)
          warnings.push("Customer GSTIN is registered in " + STATES[cg.stateCode] + " but place of supply is " + (STATES[inv.posStateCode] || inv.posStateCode) + ".");
      }
      if (isTaxDoc && !cgRaw && res && res.payable > 50000)
        warnings.push("Unregistered customer over ₹50,000: the delivery address and state must be on the invoice.");
      if (res && res.totals && res.totals.taxable + res.totals.taxTotal > 50000 && !String(inv.ewayBill || "").trim() && inv.docType !== "proforma")
        warnings.push("Goods worth more than ₹50,000 usually need an e-way bill before they move (some states set a higher intra-state limit).");
    }

    if (!inv.items || !inv.items.length) errors.push("Add at least one item.");
    (inv.items || []).forEach(function (it, i) {
      var n = i + 1;
      if (!String(it.desc || "").trim()) errors.push("Item " + n + ": description is missing.");
      if (!(num(it.qty) > 0)) errors.push("Item " + n + ": quantity must be more than zero.");
      if (num(it.rate) < 0) errors.push("Item " + n + ": rate cannot be negative.");
      if (num(it.discount) > round2(num(it.qty) * num(it.rate))) errors.push("Item " + n + ": discount is larger than the line amount.");
      var hsn = String(it.hsn || "").trim();
      if (inv.docType !== "proforma") {
        if (!hsn) errors.push("Item " + n + ": HSN/SAC code is missing.");
        else if (!/^\d{4,8}$/.test(hsn)) errors.push("Item " + n + ": HSN/SAC must be 4 to 8 digits.");
        else if (isExport && hsn.length < 8) warnings.push("Item " + n + ": exports normally quote the 8-digit ITC-HS code.");
      }
      if (res && res.chargesTax && GST_RATES.indexOf(num(it.gstRate)) === -1)
        warnings.push("Item " + n + ": " + num(it.gstRate) + "% is not a standard GST rate (0, 0.25, 3, 5, 18, 40). Check it.");
    });

    if (res && res.chargesTax && res.structure.nature === "unknown") errors.push("Cannot tell same-state from inter-state: fill in your GSTIN and the place of supply.");
    if (inv.docType === "bos")
      warnings.push("A bill of supply is only correct for a composition dealer or for exempt goods. A regular GST dealer selling taxable goods must issue a tax invoice.");
    if (inv.docType === "proforma")
      warnings.push("A proforma invoice is a quotation. It is not a tax invoice and cannot be used to claim input tax credit.");

    return { errors: errors, warnings: warnings };
  }

  function gstinReason(r) {
    return { format: "wrong format", state: "unknown state code", checksum: "last character does not match, likely a typo" }[r] || r;
  }

  return {
    STATES: STATES, UT_WITHOUT_LEGISLATURE: UT_WITHOUT_LEGISLATURE, GST_RATES: GST_RATES, CURRENCIES: CURRENCIES,
    round2: round2, validateGstin: validateGstin, gstinCheckChar: gstinCheckChar, financialYear: financialYear,
    validateInvoiceNumber: validateInvoiceNumber, taxHeads: taxHeads, computeInvoice: computeInvoice,
    amountInWords: amountInWords, checkInvoice: checkInvoice
  };
});
