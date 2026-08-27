# DARFUS ERP - Gift Voucher Full Redemption Authority

Control: `DARFUS-GIFT-VOUCHER-FULL-REDEMPTION-CONTRACT-CORRECTION-01`

This is a contract and documentation correction only. It does not implement Gift
Voucher issue, activation, redemption, payment, accounting, printing, or invoice
projection. The official database remains read-only.

## Authority order

1. Gift Voucher client document (`6- Gift Voucher Invoice.docx`) for specialized
   Gift Voucher business meaning.
2. Deposit client document only where the Gift Voucher document is silent.
3. Sales Invoice client document only where both specialized documents are silent.
4. Sales Module and Payment Engine for shared framework behavior.
5. Existing D2F owner-approved Gift Voucher policy artifacts.
6. Current source, schema, and runtime as implementation reality.

The specialized Gift Voucher contract overrides generic partial-payment behavior.
Generic partial allocation for unrelated payment methods remains outside this
contract and is not changed here.

## Frozen specialized contract

| Contract item | Frozen authority | Boundary in this control |
|---|---|---|
| Redemption mode | `FULL_REDEMPTION_ONLY` | A voucher must be consumed for its full remaining face value in one eligible redemption. |
| Partial allocation | `NO` | A Gift Voucher adapter must reject a partial amount before allocation. |
| Residual balance | `NO` | Successful redemption leaves zero voucher balance; a residual balance is not a valid outcome. |
| Multi-transaction consumption | `NO` | One voucher cannot be spread across multiple redemptions. |
| Redemption cardinality | `ONE_TIME` | One successful redemption is the only consumption event. |
| Code identity | Globally unique, immutable, never reused | This is a later schema/runtime requirement only; no migration is created here. |
| Issuance vs activation | Separate lifecycle events | Issuance does not imply activation. |
| Customer at issuance | Optional | Anonymous issuance is allowed where the client contract permits it. |
| Face value | Fixed at issuance | Redemption cannot redefine the face value. |
| Currency | Server/company authority | Frontend-supplied currency cannot become financial authority. |
| Branch eligibility | Canonical server-side branch policy | A client branch value cannot bypass eligibility. |
| Payment authority | Central Payment Engine with a strict Gift Voucher adapter | No second Voucher-specific payment allocator is authorized. |
| Atomicity | Reject before mutation where possible; otherwise transaction rollback | No partial voucher/accounting/payment state is accepted. |
| Concurrency | Serialized/guarded one-time consumption | Concurrent requests cannot double-consume a voucher. |
| Idempotency | Existing canonical idempotency authority | Same request replays safely; changed payload conflicts according to the existing contract. |
| Purchased issue accounting | Dr resolved treasury; Cr resolved Gift Voucher Liability | No issue revenue and no Output VAT. Semantic account-role resolution is required. |
| Purchased redemption accounting | Sales Invoice and Tax Engine own revenue/VAT; Payment Engine allocates liability | Voucher service does not create a second sale, revenue line, or VAT calculation. |
| Non-purchased classes | Separate owner policy required; fail closed | Promotional, loyalty, compensation, corporate, and manual funding/tax behavior is not inferred. |
| Expiry/cancel/breakage/refund/write-off | Separate approved policies required; fail closed | No automatic financial event is inferred. |
| Print/reprint | Same voucher identity; reprint is not a new voucher | No second code or voucher event is created by reprint. |
| Projection | Read-only adapter/projection only | It cannot become a second posting or lifecycle authority. |
| Security | Existing User/Auth/RBAC, company, branch, and audit controls remain authoritative | No UI or legacy helper bypass is permitted. |

## Explicit non-authorities

- Generic Payment Engine partial-payment capability for non-Gift-Voucher methods
  is not a Gift Voucher permission.
- The disabled legacy issue/redeem routes are not runtime authority.
- `postVoucherIssueEntry` and `postVoucherRedeemEntry` in the Posting Service are
  retained legacy helpers, not proof of an active workflow. Their literal account
  references are not approved business authority.
- Presence of a `balance` column does not authorize partial redemption.
- An inactive UI amount field does not authorize partial redemption.

## Current safety state

The current write routes return the stable fail-closed error
`GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` before business mutation. The Gift
Voucher projection is registered as `SUPPORTED_LATER` with no adapter/detail/print
capability. This control preserves that safety state and does not claim runtime
implementation closure.

`FULL_REDEMPTION_CONTRACT_CORRECTION = CLOSED`
`GIFT_VOUCHER_FINANCIAL_WORKFLOW = NOT_IMPLEMENTED_BY_THIS_CONTROL`
`OFFICIAL_DB_WRITES = 0`

