# AKUROCK — GST tax invoice

`akurock-tax-invoice.html` is a self-contained, fillable tax invoice. Open it
in any browser (phone or laptop), fill the fields, then **Print / Save PDF**.
No internet, no install, no account.

## Already filled in

Stone Art Installation's particulars ship with the file: legal name, address,
Rajasthan — 08, GSTIN 08BSFPA0657M1ZO, PAN BSFPA0657M, and the SBI account.
The branch IFSC is **SBIN0031503** (State Bank of India, Malviya Nagar Ind.
Area, Jaipur 302017 — MICR 302002120), looked up from the RBI-sourced IFSC
directory and matched against the branch address on file. Note it is not the
same as SBIN0006912, which is the other Malviya Nagar branch in the same PIN
code. An IFSC identifies the branch, not the account, so check it once
against a cheque leaf.

The file opens on invoice **SAI/26-27/001**, the first number of the FY
2026-27 series. If Stone Art Installation has already issued invoices this
financial year, change it to the next number in the books — GST wants one
unbroken series, so no gaps and no reuse. Both PIN codes are 302020
(Mansarovar, post office S.F.S. Mansarovar), and both GSTINs pass the
check-character test.

Correct or add anything, then press **Save my details**; what you save on
that device wins over what ships in the file.

## Bill type

The toolbar has a **Bill type** switch. The file opens on **Bill without GST**:
the sheet is titled "Invoice", the tax columns, HSN summary, place of supply
and reverse-charge block are removed (not greyed out), and the total is
exactly rate × quantity — 352 sq ft × ₹90 = ₹31,680.00, no round-off.

Switch to **GST tax invoice** to get the full Rule 46 sheet. The typed rate is
then treated as the taxable rate and GST is added on top, so the same line
becomes ₹31,680 + 18% = ₹37,382.

A bill without GST is correct only for composition-scheme or exempt supplies.
For a regular GST dealer, selling plywood is still taxable: the tax is owed by
the firm out of the amount received, and a GST-registered buyer gets no input
credit. The red/amber box above the sheet says this, with the rupee figure,
every time the no-GST mode is on.

## Prices quoted with GST already inside

Trade rates here are usually quoted per sq ft *including* GST. A tax invoice
has to show the taxable value, so type the inclusive rate and press
**Rate incl. GST → convert** once: each rate is divided by 1 + the GST rate
in place. ₹90/sq ft becomes ₹76.27, and the grand total lands back on the
₹31,680 that was quoted.

## Every invoice after that

1. **New invoice** clears the customer and item lines, keeps your details.
2. Type the invoice number (keep one unbroken series per financial year —
   GST requires consecutive numbering, so no gaps and no reuse).
3. Fill Bill To. If the delivery address differs, fill Ship To as well.
4. Add item lines: description, HSN, quantity, unit, rate. Enter the GST rate
   as the **CGST half** (9 for 18%, 6 for 12%) — the sheet mirrors it into
   SGST, or doubles it into IGST on an inter-state invoice.
5. **Print / Save PDF** → in the print dialog choose "Save as PDF", A4.

## Draft mode

Tick **Draft mode** in the toolbar before sharing a bill for review. The
sheet then prints with a DRAFT watermark, a line saying it is not a valid
tax invoice, and every unfilled mandatory field shown in brackets, so nobody
can mistake a review copy for an issued invoice. Untick it once the real
details are in — the final invoice must never carry the watermark.

## The red checklist

The red box above the sheet lists every mandatory particular that is still
missing, from Rule 46 of the CGST Rules: supplier name, address, state and
GSTIN; invoice number and date; place of supply; recipient's name, address
and state; HSN; bank details. It also catches:

- a GSTIN that is not in the valid 15-character format,
- CGST+SGST selected when the two GSTINs are in different states (should be
  IGST), and the reverse,
- an unregistered recipient above ₹50,000 with no address,
- a consignment of ₹50,000 or more with no e-way bill number.

It turns green only when nothing is left. The box never prints.

## What is on the printed sheet

Everything a tax invoice must carry: "TAX INVOICE" heading and copy type
(Original for Recipient / Duplicate for Transporter / Triplicate for
Supplier), both parties with GSTINs, place of supply, reverse-charge
declaration, HSN per line, quantity with UQC, taxable value, tax split by
rate, round-off, grand total, amount in words, tax amount in words, the
HSN/SAC summary table, bank details, declaration and terms, and the
authorised-signatory block.

## Notes

- The amount in words uses the Indian system (crore / lakh / thousand).
- Dates print as dd/mm/yyyy regardless of the browser's locale.
- Everything is one file. To change the terms, the wordmark or the colours,
  edit the HTML directly.
- `sample-output.pdf` is the layout filled with one example line, for
  reference. 
