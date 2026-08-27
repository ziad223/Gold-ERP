# Gift Voucher Official AED 1000 — Issue Accounting

Issue journal `JE-1787844649646` has two lines:

- Debit `SYS-BANK`: AED 1,000.00000000.
- Credit account `2400` Gift Voucher Liability: AED 1,000.00000000.

The journal total debit and credit are both AED 1,000.00000000. No revenue line and no output-VAT line exists for issuance. The linked treasury transaction is the single AED 1,000 bank receipt with the issue idempotency key.

Result: `ISSUE_JOURNAL_BALANCED = PASS`; `ISSUE_REVENUE = 0`; `ISSUE_OUTPUT_VAT = 0`.
