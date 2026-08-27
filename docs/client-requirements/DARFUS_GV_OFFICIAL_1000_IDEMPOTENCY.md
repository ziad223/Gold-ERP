# Gift Voucher Official AED 1000 — Idempotency

Issue replay with the exact original issue key returned the original Voucher, Journal, and Treasury transaction with no duplicates. Activation has one succeeded idempotency row.

Checkout:

- Original browser checkout: HTTP 201, request ID `b8fc94c0-53c3-4902-a333-0b93a0b7bbbc`.
- Stored key: `4d5cb993-93e5-4773-a0be-dc4631911a47`.
- Stored scope: `pos.checkout`.
- Stored hash: `e5eac9fab445d99cba36702620ee5e587f8a74599f40733e153f580006303b00`.
- The original request body was reconstructed from the production builder and verified locally against the stored canonical hash before replay. The important server-authoritative detail is `items[0].cost = 0` in the browser request; the server derived and persisted the asset cost AED 1,871.74550512.
- Exact replay: HTTP 201, request ID `ade7f5ed-fc45-450d-a1da-287b04217ecb`, same invoice `INV-2026-000005`, same invoice number, same total, no new idempotency row and no duplicate business rows.

The real idempotency implementation hashes stable `{scope, params, body}` after removing only body idempotency-key fields. The successful replay matched the persisted hash and key.

Result: `ISSUE_IDEMPOTENCY = PASS`; `CHECKOUT_IDEMPOTENCY = PASS`.
