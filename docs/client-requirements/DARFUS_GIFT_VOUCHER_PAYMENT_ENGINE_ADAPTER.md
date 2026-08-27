# Gift Voucher Payment Engine Adapter

## Authority

Purchased Gift Voucher is a payment adapter inside the existing canonical POS sale. It is not a second invoice or payment engine.

| Boundary | Current authority | Proof |
|---|---|---|
| Issue | Purchased face value; Dr existing treasury / Cr semantic Gift Voucher Liability | `gift-voucher.service.js`, issuance journal proof |
| Redeem | Canonical `executeCanonicalSale` and Sales Invoice Tax Engine | `erp.routes.js`, 201 clone receipts |
| Payment | `payments.gift_voucher_id` links one payment to one voucher | clone SQL: zero missing exact links |
| Cash | Only ordinary cash legs create cash transactions | voucher-only cash count `0`; mixed cash was present and expected |
| VAT/revenue | Existing Invoice posting remains authority | revenue credit and VAT liability lines present; journals balanced |

Direct `gift_voucher` payment without the split adapter is rejected. Partial face-value use is rejected. A voucher must be purchased, active, company-scoped, currency-compatible, branch-eligible, and consumed once for its exact face value.
