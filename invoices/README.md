# Invoices

Live at **/admin/invoice** (behind the admin password). The same page is the
single file `akurock-tax-invoice.html`, which also works offline and can be
opened straight from WhatsApp.

## Using it

1. **Customer is** — In India, or Overseas (export).
2. **Document** — Tax invoice, Bill of supply (no GST), or Proforma /
   quotation. For India, also choose whether the rates you type have GST
   added on top or already included. For export, choose Under LUT (no IGST)
   or With IGST paid, the currency and the exchange rate.
3. Fill in the customer and the items: description, HSN, quantity, unit,
   rate, discount, GST %.
4. Everything else is worked out: CGST + SGST or IGST (or CGST + UTGST),
   place of supply from the customer's GSTIN, round-off, totals, amount in
   words, the HSN summary, the export declaration, the value in rupees.
5. The box above the sheet lists anything missing or wrong. Red must be
   fixed; amber is worth a look. **Print / Save PDF** asks before printing a
   sheet that still has red items.

**Next no.** gives the next number in the series for the financial year
(SAI/26-27/001 for invoices, SAI/BS/… bills of supply, SAI/PI/… proformas).
Numbers you print are remembered on that device. **Save my details** keeps
your firm and bank details; the current invoice is kept as a draft.

## Measurement and sharing

- **Pieces × size**: under each description, type pieces and a size such as
  `8x4 ft`, `2440x1220 mm` or `1.2x0.6 m`. With the unit set to SQF or SQM
  the quantity is worked out (11 × 8x4 ft = 352 sq ft = 32.70 sq m). A size
  with no unit is never guessed.
- **Packing list per box**: box no., quantity per box and boxes; per box ×
  boxes fills the quantity (112 × 4 = 448).
- **Share link**: makes a WhatsApp-ready link that opens the document
  read-only for the customer, who can print or save it as PDF. The whole
  document is inside the link after `#`, which browsers never send to a
  server, so nothing is stored anywhere. The stamp is not included.

## Rules it follows

- Rule 46 tax invoice particulars; invoice number at most 16 characters,
  letters, digits, `-` and `/` only.
- GSTIN checked for format, state code and check character (catches typos).
- Same state → CGST + SGST; UT without a legislature → CGST + UTGST; other
  state → IGST; export → zero-rated under LUT, or IGST paid by the exporter
  (not charged to the foreign buyer), with the required declaration.
- GST rates offered: 0, 0.25, 3, 5, 18, 40 (post-September 2025 slabs).
- HSN required on tax invoices and bills of supply; 8-digit ITC-HS advised
  for exports; IEC, LUT ARN and SWIFT flagged when missing on exports.
- E-way bill reminder above ₹50,000; bill of supply only for composition
  dealers or exempt goods; proforma marked as not a tax invoice.
- Dates always print dd/mm/yyyy; foreign currency is never rounded to the
  unit; CGST and SGST always print as the same figure.

## Changing it

Edit `invoices/invoice.template.html` (layout) or `lib/invoice/engine.js`
(every calculation and rule), then `npm run invoice:build`. `npm test` runs
the engine tests and fails if the built file is out of date.
