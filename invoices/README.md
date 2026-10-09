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

## Bill type and how the rate is read

The file opens on a **GST tax invoice** with the rate shown as typed:
**₹90 per sq ft, GST included**. The taxable value is worked out from it, so
the line reads 352 sq ft × ₹90 = ₹31,680.00, of which ₹26,847.46 is taxable
and ₹4,832.54 is GST (CGST ₹2,416.27 + SGST ₹2,416.27). The columns add up
to the total to the paisa, with no round-off.

The **Rate** switch in the toolbar flips this: "excludes GST" treats the same
₹90 as the taxable rate and adds GST on top (₹31,680 + 18% = ₹37,382). On an
inter-state sale the same tax is shown as one IGST figure.

The **Bill type** switch has a second option, **Bill without GST**, which
drops every tax element and totals rate × quantity. It is correct only for
composition-scheme or exempt supplies. For a regular GST dealer the sale is
still taxable, so the sheet shows a standing warning with the rupee figure
whenever that mode is on.

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
