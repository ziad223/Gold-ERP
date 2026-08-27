# Gift Voucher Official AED 1000 — Accounting, Tax, Treasury

Sale journal `JE-1787857084088` is posted and balanced at AED 4,912.39600000 on both debit and credit. Its canonical lines include:

- Debit bank/payment settlement AED 2,040.6505.
- Debit Gift Voucher Liability account 2400 AED 1,000.0000.
- Credit sales revenue AED 2,667.2373.
- Credit VAT AED 373.4132.
- Debit COGS AED 1,871.7455 and credit inventory AED 1,871.7455.

The sale invoice is AED 2,667.23734480 base + AED 373.41320000 VAT = AED 3,040.65050000 total. VAT is 14%, sourced from the company Tax Center. The issue journal contains no revenue or VAT. There is no duplicate sale revenue or VAT and no separate cash receipt for the voucher leg.

Treasury evidence consists of the issue receipt AED 1,000 and the sale's remaining Card receipt AED 2,040.6505; the voucher liability settlement is represented in the sale journal, not a second treasury receipt.

Results: `SALE_JOURNAL_BALANCED = PASS`; `SALE_TAX = PASS`; `DOUBLE_VAT = NO`; `TREASURY_RECONCILIATION = PASS`; `GV_LIABILITY_SETTLEMENT = 1000.00`.
