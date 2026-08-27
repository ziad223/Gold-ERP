# Gift Voucher Official Retry 01 — Issue Proof

## Single authorized attempt

| Field | Evidence |
|---|---|
| Endpoint | `POST /api/v1/gift-vouchers/issue` |
| Result | HTTP 422 |
| Error code | `FINANCIAL_MAPPING_REQUIRED` |
| Safe message | The required financial mapping is missing or ambiguous. |
| Request ID | `ded2e4a2-4e74-4abf-a3fa-dc59d5becc50` |
| Persistence | none observed |

Backend stack evidence identifies `financial-account-resolver.service.js` and
`gift-voucher.service.js:issuePurchasedVoucher` as the rejection boundary.
The request failed before the Voucher row and its treasury/liability journal
could be created.

`OFFICIAL_PURCHASED_VOUCHER_ISSUE = FAIL_BEFORE_PERSISTENCE_HTTP_422`
`OFFICIAL_ISSUE_IDEMPOTENCY = NOT_RUN`

No retry is authorized by this failure result. The exact idempotency request
was therefore not replayed, because there is no successful original result.

