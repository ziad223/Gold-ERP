# Gift Voucher Atomicity, Concurrency, and Idempotency

## Results

- Partial redemption returned `422 GIFT_VOUCHER_FULL_VALUE_REQUIRED` and the before/after business counts were identical.
- Ineligible branch returned `422 GIFT_VOUCHER_BRANCH_INELIGIBLE` before Invoice creation.
- Issued-but-inactive and second redemption returned `409 GIFT_VOUCHER_NOT_REDEEMABLE`.
- Concurrent redemption of the same active voucher produced exactly one `201` and one rejection; the voucher row is locked before durable sale work.
- Same-key replay returned the original `201` result without duplicate business rows.
- Same key with changed payload returned `409`.
- Issue, activate, and print commands require idempotency keys.

The database contains `idempotency_requests` records for the tested scopes (`200=11`, `201=24` by status code in the cumulative clone). No token, cookie, password, or full idempotency key is recorded here.

## Transaction boundary

Voucher lock and validation occur before Invoice creation; the canonical POS transaction covers Invoice, Invoice Items, Asset transition, voucher Payment, journal, and voucher redemption completion. A failed posting rolled back without leaving an Invoice/Payment/Journal for that attempt.
