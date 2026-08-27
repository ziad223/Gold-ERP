# Gift Voucher Official Retry 01 — Accounting, Tax, Treasury

No financial transaction was persisted because the issue endpoint rejected the
request before the financial resolver could produce the required mapping.

| Proof | Result |
|---|---|
| Voucher issue Debit/Credit | NOT RUN; no issue journal |
| Voucher issue Revenue | 0 new rows |
| Voucher issue output VAT | 0 new rows |
| Treasury receipt/liability | NOT RUN; no voucher |
| Sale journal | NOT RUN; no checkout |
| Sale VAT | NOT RUN; no checkout |
| Double VAT | no new transaction |
| Existing historical journal exception | unchanged |

The blocking evidence is `FINANCIAL_MAPPING_REQUIRED` HTTP 422, not an
accounting balance mismatch. A future repair requires a separate approved
configuration/master-data or implementation decision; it was not attempted.

