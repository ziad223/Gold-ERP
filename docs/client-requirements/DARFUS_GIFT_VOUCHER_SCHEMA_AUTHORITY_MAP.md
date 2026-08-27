# DARFUS Gift Voucher Schema Authority Map

Control: `DARFUS-GIFT-VOUCHER-SCHEMA-MINIMUM-SAFE-IMPLEMENTATION-01`

## Authority order

1. `6- Gift Voucher Invoice.docx` is the specialized business authority.
2. The frozen Full Redemption artifacts define the accepted specialized contract.
3. Existing sales, tax, accounting, payment, RBAC, company and branch authorities
   remain the platform authority.
4. Current source and the official `darfus_erp` schema are implementation reality.

## Current verified baseline

| Concern | Current reality | Gap / disposition |
|---|---|---|
| Voucher rows | `gift_vouchers = 0` on `darfus_erp` | Safe empty-table migration precondition is presently true; no official migration is authorized. |
| Identity | `code` is non-unique and company-scoped only in reads | Replace with immutable globally unique `voucher_code` and `voucher_number`. |
| Value | `value` and mutable residual `balance` columns | Replace active authority with immutable `face_value`; no residual-balance workflow. |
| Lifecycle | `active/redeemed/expired`; issue and activation are not distinct | Add `issued`, `active`, `distributed`, `redeemed` lifecycle storage; only purchased issue/activation/redemption commands are enabled. |
| Currency | No persisted currency | Persist server/company resolved currency at issue. |
| Branch eligibility | Free-text `branch` | Persist issue branch and a normalized eligibility mode plus branch FK relation. |
| Financial mapping | No `GIFT_VOUCHER_LIABILITY` semantic role mapping exists | Add an optional semantic role definition; command fails closed unless one valid branch mapping resolves. |
| POS settlement | Generic split treats unknown methods as treasury payment | Strict adapter owns only `gift_voucher` split legs and replaces their amount from the locked voucher face value. |
| Tax/revenue | Current invoice posting is the authority | Voucher redemption supplies only the debit liability leg; it never creates revenue or VAT independently. |
| Audit/print | Generic audit exists; no voucher print event | Add append-only print-event storage and audit events without changing voucher identity. |

## Frozen implementation boundaries

- `PURCHASED` is the sole fund source with active financial commands.
- `PROMOTIONAL`, `LOYALTY`, `COMPENSATION`, `CORPORATE`, and `MANUAL` are
  storable only and must fail closed in all issue, activation and settlement
  commands in this control.
- `FULL_REDEMPTION_ONLY` means each voucher split leg must equal the locked
  face value. A voucher may be used with ordinary payment legs only when the
  invoice total is at least the total of all voucher face values.
- Generic payment behavior outside Gift Voucher is unchanged.
- The generic invoice projection remains untouched; it does not become a
  Gift Voucher posting authority.

## Exact candidate files before implementation

| File | Intended responsibility |
|---|---|
| `backend/migrations/20260827010000-gift-voucher-purchased-foundation.js` | Empty-table-safe schema foundation and reversible clone rehearsal. |
| `backend/src/models/giftVoucher.model.js` | New durable voucher authority. |
| `backend/src/models/giftVoucherBranchEligibility.model.js` | Selected-branch eligibility relation. |
| `backend/src/models/giftVoucherPrintEvent.model.js` | Print/reprint audit evidence. |
| `backend/src/models/payment.model.js`, `backend/src/models/index.js` | Payment linkage and associations. |
| `backend/src/services/gift-voucher.service.js` | Lifecycle and strict POS settlement adapter. |
| `backend/src/services/financial-account-catalog.service.js` | Optional semantic liability role only. |
| `backend/src/services/posting.service.js` | Invoice posting consumes a supplied semantic voucher-liability debit leg. |
| `backend/src/routes/erp.routes.js` | Canonical issue/activation/read routes and the POS transaction integration. |
| `app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx`, `hooks/use-gift-vouchers.ts`, `app/[locale]/(dashboard)/pos/page.tsx`, `lib/types.ts` | Minimal issue/activate/list/print and POS voucher-code entry without client financial authority. |
| `backend/tests/gift-voucher-schema-minimum-safe-implementation.test.cjs` | Focused contract, schema and regression protection. |

`OFFICIAL_DATABASE_WRITE_AUTHORIZATION = NO`
`DISPOSABLE_CLONE_REQUIRED_FOR_MIGRATION_AND_RUNTIME = YES`
