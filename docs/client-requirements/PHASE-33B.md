# Phase 33B — Gold Purchase Core Data and Draft Workflow

Status: **IMPLEMENTED — AUTOMATED VERIFICATION PASSED** (2026-07-13)

Phase 33B adds a non-accounting draft foundation for Customer Gold Purchase (CGP) and
Investment Gold Purchase (IGP). It does not start Phase 33C and creates no posting,
inventory, asset, barcode, payment, tax, treasury, pool, transformation, return, or
reversal effect.

## Implemented scope

- Separate CGP and IGP header/item aggregates and persistence boundaries.
- Separate company-scoped server draft numbers (`CGPD-*` and `IGPD-*`).
- Active workflow states are only `draft` and `validated`; editing a validated draft
  atomically returns it to draft and clears validation metadata.
- Soft void stores actor, timestamp, and reason. No hard-delete API exists.
- Optimistic integer versions protect update, validation, and void commands.
- Create, validate, and void use the existing idempotency architecture.
- Backend-authoritative decimal measurement formulas:
  - `netWeight = grossWeight - stoneWeight`
  - `pureGoldWeight = netWeight * purityFactor`
- IGP supports physical investment gold, serialized bullion, and bullion lots only.
  Pool, custom, and other non-physical investment types return `422 VALIDATION_FAILED`.
- List/detail APIs enforce authenticated company and branch scope. Query branch values
  may narrow but cannot replace the authenticated branch.
- Immutable audit events distinguish create, update, validate, and void for both aggregates.

## Persistence and precision

Migration `20260713010000-gold-purchase-draft-foundation.js` adds:

- `customer_gold_purchase_documents`
- `customer_gold_purchase_items`
- `investment_gold_purchase_documents`
- `investment_gold_purchase_items`

Weights use six decimals, purity/fineness six decimals, exchange rates eight decimals,
and proposed monetary/reference fields four decimals. Constraints and indexes cover
company-scoped draft numbers, company/branch/reference/date/status lookup, line numbers,
and company-scoped bullion serial/lot identity.

The local migration backup was:
`backend/backups/darfus_erp_development_2026-07-13T20-59-10-234Z.dump` (349.5 KB).
The migration was applied only to local `darfus_erp@localhost:5433`; no legacy backfill
or production access occurred.

## API and transitional permissions

Routes are mounted at `/api/v1/gold-purchases` with list, detail, create, patch,
validate, and void endpoints for `/cgp/drafts` and `/igp/drafts`. There are no post,
approve, receive, pay, delete, withdraw, transfer, transform, or close endpoints.

- CGP read: `sales.view`; mutation: existing `sales.create` boundary.
- IGP read: `suppliers.view`; create: `suppliers.create`; update/validate/void:
  `suppliers.update`.
- Voided-history access additionally requires the existing audit read permission.

Dedicated gold-purchase permissions and maker-checker rules remain an owner decision
before Phase 33C. These transitional permissions grant no posting authority.

## Frontend

- `/sales/customer-gold/drafts` provides the CGP list/form/detail workspace.
- `/suppliers/investment-gold` provides physical and bullion IGP draft workflows.
- Both support pagination, filters, multi-line editing, loading/empty/error states,
  validate and void actions, backend-calculated measurements, and Arabic RTL/English LTR.
- Pool/custom and every downstream action are absent from the UI.

## Verification

`scripts/verify-gold-purchase-draft-workflow.js` runs static checks by default and a
gated real-HTTP suite through `app.listen(0)`. Local live evidence passed for CGP,
physical IGP, serialized bullion, bullion lots, validation errors, permissions,
company/branch isolation, pagination/filters, idempotency, concurrency, audit, and
soft void. The verifier reported `LIVE TESTS EXECUTED` and `No persistent test pollution
detected`.

The zero-posting checks found zero namespace effects in assets, stock movements,
journals/lines, cash, customer/inventory gold pools, purchase orders, notifications,
and barcode sequences. Cleanup removed the exact `T33B-*` namespace.

Static verification: typecheck passed; lint passed with the 20 existing warnings and
no errors; build passed; all 46 verifier files passed.

Implementation evidence is split across application commit `917cae2`, verifier foundation
`6754797`, verifier coverage corrections `bb96818` and `8a2ca06`, and documentation commits.
The coverage corrections add explicit IGP update, permission, branch, quantity, duplicate-lot,
all advertised CGP/IGP filters, and independent IGP page assertions without changing application
behavior.

## Deferred decisions and work

- Phase 33C: dedicated permission keys, maker-checker, posting, asset/barcode creation,
  receipt, stock movement, and final legal numbering.
- Phase 33D: final value, tax/VAT/RCM, supplier/customer settlement, accounts, payment,
  treasury, return, and reversal policy — accountant/client approval required.
- Later phases: liquidity transfer, withdrawal, transformations, full attachments,
  documents, reports, and hardware integrations.

**MANUAL UI QA REQUIRED** for both locales, responsive layout, forms, details,
permissions, scope presentation, pagination, filters, validation transitions, and void.
