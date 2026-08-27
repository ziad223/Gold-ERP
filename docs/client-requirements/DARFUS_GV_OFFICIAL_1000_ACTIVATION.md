# Gift Voucher Official AED 1000 — Activation

The issued voucher was activated exactly once through the canonical activation endpoint.

- HTTP: 200
- Request ID: `3e9f2a9a-28ae-4a43-92ee-c0b2a3ad428a`
- Activation idempotency key: `357f43d2-e5ad-44da-a1ae-a91bf5094030`
- State transition: `issued → active`
- DB `activated_at` populated; immutable voucher identity unchanged.

Read-only pre-checkout state showed active, AED, face value AED 1,000.0000, unused, and eligible for Branch-1.

Result: `VOUCHER_ACTIVATION = PASS`; `PRE_CHECKOUT_VOUCHER_STATE = PASS`.
