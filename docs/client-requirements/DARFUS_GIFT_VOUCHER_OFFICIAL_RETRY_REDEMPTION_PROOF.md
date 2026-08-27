# Gift Voucher Official Retry 01 — Redemption Proof

Not run. Voucher issuance failed with HTTP 422 before persistence, so there was
no Voucher to activate or redeem.

`OFFICIAL_VOUCHER_ACTIVATION = NOT_RUN`
`PRE_REDEMPTION_VOUCHER_STATE = NOT_RUN`
`OFFICIAL_FULL_REDEMPTION_CHECKOUT = NOT_RUN`
`OFFICIAL_CHECKOUT_IDEMPOTENCY = NOT_RUN`
`OFFICIAL_VOUCHER_LIFECYCLE = NOT_APPLICABLE_NO_ISSUE`

The control stopped immediately after capturing the failure and read-only DB
delta. No additional business request was sent.

