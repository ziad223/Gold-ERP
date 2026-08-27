# Gift Voucher Mapping — Clone Idempotency and Rollback

## Idempotency

The canonical hash implementation was used with scope `gift_voucher.issue`. The first command created one Voucher and one succeeded idempotency row. Exact replay with the same body/key returned the same Voucher and HTTP-equivalent `201` response without any new Voucher, Journal, JournalLine, CashTransaction, or idempotency row.

`CLONE_ISSUE_IDEMPOTENCY = PASS`.

Changing face value from `3235.53` to `3235.54` produced a different SHA-256 request hash and the existing-key conflict result `409`.

`CONFLICTING_REPLAY = PASS`.

## Atomic rollback

A controlled clone transaction claimed a new idempotency key, resolved both accounts, then aborted before business persistence. Before/after counts were unchanged: Voucher 1, Journal 30, JournalLines 83, CashTransactions 12, Idempotency 106.

`CLONE_ATOMIC_ROLLBACK = PASS`.

