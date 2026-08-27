# Gift Voucher Official Acceptance — Redemption Proof

`NOT_RUN`.

The Purchased Voucher issue returned HTTP 403 before creating a Voucher. Therefore no activation, lookup of a created Voucher, POS Voucher settlement, or checkout was authorized after the failure. No second issue and no checkout were attempted.

| Required proof | Result |
|---|---|
| Voucher ACTIVE | NOT_PROVEN; no Voucher created |
| Full Voucher redemption | NOT_RUN |
| Sales Invoice | NOT_CREATED by this control |
| Voucher Payment | NOT_CREATED by this control |
| Asset SOLD | NO; Asset remained AVAILABLE |
| Checkout idempotency | NOT_RUN |

