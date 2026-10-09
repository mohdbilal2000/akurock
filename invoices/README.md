# AKUROCK — GST tax invoice

`akurock-tax-invoice.html` is a self-contained, fillable tax invoice. Open it
in any browser (phone or laptop), fill the fields, then **Print / Save PDF**.
No internet, no install, no account.

## First time

Fill your own details once — legal name, address, state, GSTIN, PAN, contact,
and the bank block — then press **Save my details**. The browser remembers
them for every future invoice on that device. Nothing is uploaded anywhere.

## Every invoice after that

1. **New invoice** clears the customer and item lines, keeps your details.
2. Type the invoice number (keep one unbroken series per financial year —
   GST requires consecutive numbering, so no gaps and no reuse).
3. Fill Bill To. If the delivery address differs, fill Ship To as well.
4. Add item lines: description, HSN, quantity, unit, rate. Enter the GST rate
   as the **CGST half** (9 for 18%, 6 for 12%) — the sheet mirrors it into
   SGST, or doubles it into IGST on an inter-state invoice.
5. **Print / Save PDF** → in the print dialog choose "Save as PDF", A4.

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
