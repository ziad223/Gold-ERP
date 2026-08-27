# DARFUS Gift Voucher Implementation Boundary

## In scope

- Purchased Voucher schema and immutable identity.
- Issuance, separate activation, read/list/detail, print/reprint event audit.
- Strict full-value Gift Voucher payment adapter inside canonical POS checkout.
- Exact Invoice/Payment/Voucher linkage, transaction, idempotency and
  concurrency controls.
- Focused tests and disposable clone migration/runtime proof.

## Explicitly out of scope

- Promotional, loyalty, compensation, corporate or manual funded vouchers.
- Partial redemption, residual value, reload/top-up, refund, cancellation,
  expiry income, breakage or write-off accounting.
- Generic Payment Engine redesign.
- Generic Gift Voucher invoice projection.
- Official database migration, configuration, fixture or business write.
- Changes to Tax Engine, sales valuation, existing inventory, current Asset
  identity, barcode identity, or generic payment methods.

## Required failure behavior

- Missing, ambiguous, inactive, cross-company or wrong-branch financial
  mappings fail before durable issue/redeem mutation.
- A non-purchased voucher, not-active voucher, duplicate code in the request,
  partial amount, voucher amount greater than invoice total, repeated voucher
  use, wrong company, wrong currency, or ineligible branch is rejected.
- A direct `/gift-vouchers/redeem` request remains fail-closed because a
  redemption requires an actual Sales Invoice settlement through POS.

## No ownership change

| Authority | Preserved owner |
|---|---|
| Invoice sale / tax / revenue / COGS | Canonical POS + existing Sales Invoice / Tax Engine / posting flow |
| Gift Voucher issue liability | Semantic role resolver + existing posting service |
| Voucher redemption allocation | Strict adapter inside the canonical POS transaction |
| Identity / branch / company / RBAC | Existing server-side controls |
| Idempotency | Existing canonical `idempotency.service` |
