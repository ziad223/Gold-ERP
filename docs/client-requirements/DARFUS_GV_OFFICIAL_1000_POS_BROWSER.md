# Gift Voucher Official AED 1000 — POS Browser Evidence

The internal Arabic POS browser completed the authorized flow on `http://localhost:3000/ar/pos`:

1. Selected customer `CUS-0003` (احمد نجم) and the exact pre-approved asset barcode `GPRNG21000002`.
2. Selected Split payment, entered the new voucher code, and validated it successfully.
3. UI showed the voucher as active and fully applicable for AED 1,000.00.
4. Entered the exact remaining Card amount AED 2,040.6505.
5. UI showed total paid AED 3,040.6505 / AED 3,040.6505 and enabled the checkout action.
6. Clicked the checkout action exactly once.

The resulting UI displayed success and invoice identifier `INV-ID-1787857084030-yztnis`. Backend log evidence recorded `POST /api/v1/pos/checkout 201` with request ID `b8fc94c0-53c3-4902-a333-0b93a0b7bbbc`.

No print/reprint action was used for acceptance. No application console error was observed; one post-click diagnostic probe attempted an unavailable page-performance object and was not an application failure.

Result: `REAL_BROWSER_CHECKOUT = PASS`; `NETWORK_EVIDENCE = PASS`.
