# DARFUS ERP - Effective Gift Voucher Business Rules

These are the effective specialized rules after the Full Redemption contract
correction. They are design authority, not a runtime implementation.

| # | Rule | Effective meaning | Runtime state |
|---:|---|---|---|
| 1 | Instrument nature | A Gift Voucher is a prepaid stored monetary instrument for a later eligible Sales Invoice. | Workflow disabled. |
| 2 | Fixed value | Face value is fixed when issued. | Model has value/balance; enforcement not closed. |
| 3 | Full redemption | `FULL_REDEMPTION_ONLY`. | Contract frozen; runtime not enabled. |
| 4 | No partial | No partial amount, no partial allocation, no residual balance. | Contract frozen; active route fail-closed. |
| 5 | One time | One successful eligible redemption consumes the voucher once. | Contract frozen; concurrency implementation later. |
| 6 | Identity | Voucher number/code identifies the same voucher for its lifetime. | Current code is not proven globally unique in schema. |
| 7 | Code safety | Code must be globally unique, immutable, and never reused. | Requirement recorded; no migration here. |
| 8 | Customer | Customer may be absent at issuance where anonymous issuance is allowed. | Current customer columns are nullable. |
| 9 | Issuance | Issuance creates the lifecycle origin. | Write route disabled. |
| 10 | Activation | Activation is separate from issuance. | No active activation route. |
| 11 | Distribution | Distribution is separate and does not change identity or value. | No active distribution route. |
| 12 | Currency | Server/company currency is authoritative. | Current schema/runtime proof is incomplete. |
| 13 | Branch | Eligibility and scope are server-controlled. | Current branch field is not a proven FK. |
| 14 | Payment allocation | The central Payment Engine allocates the full voucher value through a strict adapter. | Adapter not implemented in this control. |
| 15 | Purchased issue | Real money issue: Dr resolved treasury, Cr resolved Gift Voucher Liability. | No Output VAT and no Sales Revenue at issue. |
| 16 | Purchased redemption | Actual Sales Invoice owns taxable base, revenue, and Output VAT. | Voucher service must not calculate a second tax/revenue event. |
| 17 | Non-purchased classes | Promotional/loyalty/compensation/corporate/manual treatment needs separate owner policy. | Fail closed. |
| 18 | Expiry | Expiry policy must be explicit before financial behavior. | Fail closed if unapproved. |
| 19 | Cancellation | Cancellation policy must be explicit and non-destructive. | Fail closed if unapproved. |
| 20 | Breakage | No automatic breakage revenue. | Fail closed if unapproved. |
| 21 | Refund/write-off | No automatic refund, reversal, or write-off. | Fail closed if unapproved. |
| 22 | Atomicity | Failed issue/redemption cannot leave a partial voucher, payment, liability, invoice, or journal state. | Later runtime proof required. |
| 23 | Idempotency | Existing canonical idempotency service is reused; duplicate business events are forbidden. | Later runtime proof required. |
| 24 | Print/reprint | Reprint presents the same voucher identity and never creates a new voucher. | Projection/print adapter not active. |
| 25 | Security | User/Auth/RBAC, company, branch, and audit controls remain authoritative. | Existing disabled routes preserve fail-closed behavior. |

`GENERIC_PAYMENT_PARTIALITY_IS_NOT_GIFT_VOUCHER_AUTHORITY = YES`
`NO_CLIENT_RULE_WAS_REINTERPRETED = YES`
`NO_RUNTIME_WORKFLOW_WAS_ENABLED = YES`

