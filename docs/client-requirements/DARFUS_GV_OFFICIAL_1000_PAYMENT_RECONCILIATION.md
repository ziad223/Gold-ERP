# Gift Voucher Official AED 1000 — Payment Reconciliation

Invoice `INV-2026-000005` has exactly two payment rows:

| Payment | Method | Amount | Evidence |
|---|---|---:|---|
| `PAY-1787857084078-jvgr` | card | AED 2,040.6505 | Branch-1 payment |
| `PAY-1787857084080-09cd` | gift_voucher | AED 1,000.0000 | linked to the new voucher |

Total payments equal AED 3,040.6505, exactly the invoice total. The voucher did not alter discount, taxable base, revenue, or VAT.

Result: `PAYMENT_RECONCILIATION = PASS`; `DISCOUNT_CHANGED_BY_VOUCHER = NO`.
