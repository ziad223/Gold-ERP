# Gift Voucher Official Acceptance — Issue Proof

## Result

The one authorized browser submission was attempted once and failed before business persistence.

| Evidence | Observed |
|---|---|
| Browser route | `http://localhost:3000/ar/sales/gift-vouchers` |
| API route | `POST /api/v1/gift-vouchers/issue` |
| HTTP result | `403` |
| Backend request ID | `cbf36216-8071-4b0c-a7b7-f68ac60e33dd` |
| Requested face value | `3235.53` |
| Payment method | cash |
| Eligibility | ALL_BRANCHES |
| Voucher created | NO |
| Issue journal | NO |
| Issue treasury transaction | NO |
| Issue audit row | NO new row observed |
| Issue idempotency row | NO new row observed |

The UI displayed the safe error: “Gift voucher issue/redeem financial workflows are disabled until liability accounting is approved.” No password, token, cookie, or reusable voucher code was recorded.

## Root-cause classification

`ENVIRONMENT_CONFIG / RUNTIME_PARITY_BLOCKER` (P1 for this acceptance). Current host source contains the active issue route and the official schema is present, but the running backend process started at `2026-08-27T08:43:11Z`, before the current backend source last-write time `2026-08-27T10:07:23Z`. The live process therefore served a stale fail-closed Gift Voucher guard. No runtime refresh was attempted in this control.

