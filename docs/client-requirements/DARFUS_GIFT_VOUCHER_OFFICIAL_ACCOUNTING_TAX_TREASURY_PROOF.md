# Gift Voucher Official Acceptance — Accounting / Tax / Treasury

## Official result

No official Gift Voucher accounting transaction occurred because the single issue request was rejected with HTTP 403 before the idempotency/business transaction boundary.

| Assertion | Result |
|---|---|
| Voucher issue Dr Treasury / Cr Gift Voucher Liability | NOT_RUN; no issue |
| Issue Revenue = 0 | NOT_APPLICABLE; no issue |
| Issue Output VAT = 0 | NOT_APPLICABLE; no issue |
| Voucher settlement | NOT_RUN |
| Sales Invoice Revenue/VAT | NOT_RUN |
| Journal balance for this control | NOT_APPLICABLE; no new journal |
| Treasury effect for this control | NOT_APPLICABLE; no new cash transaction |
| Tax authority regression | NOT_RUN after failure |

Pre-existing counts remained unchanged: `journal_entries=29`, `journal_lines=81`, `cash_transactions=11`, `payments=3`.

