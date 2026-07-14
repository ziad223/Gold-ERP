# Phase 33C — Gold Purchase Permissions, Submission and Maker–Checker

Status: VERIFIED CLOSED (manual browser QA remains required)

Starting HEAD: `c83985f7e7689a9a9f844e0d2c438d5ea9bab1`  
Application commit: `be14c304472c86e776be41646d4d7aeb5dfca059`  
Verifier commit: `007435c991abeb8f0bed5b35b48439188db8f15d`

## Contract

Phase 33C adds approval governance to the separate Phase 33B CGP and IGP draft aggregates. It does not post, receive, settle, value inventory, create assets/barcodes, move stock, mutate treasury, or create accounting journals.

The active workflow is:

`draft → validated → submitted → approved`

or:

`submitted → rejected → draft`

Approved documents are immutable in place. A change requires the explicit revision command, which creates a new draft, increments `revisionNumber`, links `supersedesDocumentId`, and preserves `rootDocumentId`. The approved source remains unchanged.

## Permissions and scope

The exact dedicated permission set is:

- CGP: `gold_purchase.cgp.view`, `view_all`, `view_branch`, `view_own`, `create`, `update_draft`, `validate`, `submit`, `approve`, `reject`, `void`.
- IGP: `gold_purchase.igp.view`, `view_all`, `view_branch`, `view_own`, `create`, `update_draft`, `validate`, `submit`, `approve`, `reject`, `void`.

Dedicated access requires the module `view` permission. Scope precedence is `view_all > view_branch > view_own`; mutation permissions do not widen visibility. Approval/rejection also require `view_all` or `view_branch`; `view_own` alone cannot authorize review.

The Phase 33B Sales/Supplier permissions remain transitional fallbacks only for create/read/update/validate/void. They cannot submit, approve, reject, or create an approved-document revision. New permissions are assigned automatically only to existing trusted administrator roles by the migration; other role assignments remain an administrator decision.

## Maker–checker and snapshot integrity

- Creator and submitter cannot approve or reject their own submission.
- Submit, approve, reject, and revision commands require `Idempotency-Key` and an exact optimistic version.
- Submission writes a canonical JSONB business snapshot and SHA-256 hash before changing the document to `submitted`.
- Approval/rejection locks the document and request, requires a pending request, verifies the exact snapshot hash, and produces one terminal result under concurrency.
- Rejection requires a reason, preserves the immutable rejected request/snapshot, records last-rejection metadata, and returns the document to editable `draft`.
- One pending approval per document is enforced by a partial unique index.

## API

- `POST /api/v1/gold-purchases/{cgp|igp}/drafts/:id/submit`
- `POST /api/v1/gold-purchases/{cgp|igp}/drafts/:id/approve`
- `POST /api/v1/gold-purchases/{cgp|igp}/drafts/:id/reject`
- `POST /api/v1/gold-purchases/{cgp|igp}/drafts/:id/revisions`
- `GET /api/v1/gold-purchases/approvals`
- `GET /api/v1/gold-purchases/approvals/:id`

The approval queue supports aggregate, status, branch, requester, date, document number, customer, supplier, and pagination filters. Visible aggregate types and rows are derived from the reviewer's dedicated permissions and authenticated scope.

## Frontend

- Existing CGP and IGP draft workspaces use dedicated permissions when configured and preserve the draft-only transitional fallback.
- Validated documents expose Submit only to dedicated submitters.
- Submitted and approved documents suppress mutation actions and display immutable-state guidance.
- Approved documents expose Create Revision to dedicated creators.
- `/approvals` includes the live scoped Gold Purchase queue, snapshot/hash summary, self-review suppression, approve, and mandatory-reason reject actions.
- `/settings/users` groups and labels the CGP and IGP permission sets in Arabic and English.

## Migration and safety

Migration: `20260714010000-gold-purchase-approval-governance.js` (additive only).

- Applied migration count: 38 (including the one-time HF1 self-review permission migration).
- Backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase33c_20260714-004524.dump`.
- Backup size: 383,582 bytes; PostgreSQL custom archive, validated with `pg_restore --list`.
- Local target only: `darfus_erp@localhost:5433`, development environment.
- No legacy business-data backfill or destructive reset was performed.

## Verification evidence

- Typecheck: PASS.
- Lint: PASS with 20 pre-existing warnings and no Phase 33C warning.
- Production build: PASS.
- `git diff --check`: PASS.
- Static verifier suite: 47/47 PASS at verifier commit HEAD.
- Gated real HTTP verifier: PASS, `LIVE TESTS EXECUTED`, `COMPLETE ZERO-POSTING MATRIX PASSED`, and `No persistent test pollution detected`.
- Behavioral coverage: 22/22 catalog keys; CGP and IGP submission/approval/rejection; exact permission denials; self-review and own-only review denial; branch, own, and company-wide scope; duplicate pending request; stale/invalid transitions; snapshot tamper rejection; immutable submitted/approved records; rejection/resubmission history; revision idempotency; concurrent terminal review; audit actions.
- Complete zero-posting proof: all required namespace-scoped before/after/final counts are `0/0/0`: assets, stock movements, journal entries and journal lines, cash transactions/Treasury, supplier payments, customer payments/settlements, CGP/IGP pools, purchase orders, Gold Center, barcode business records and sequence consumption, posting/receipt notifications, and accounting posting links.
- Cleanup: exact `T33C-*` fixtures removed; zero approval, document/item, audit, idempotency, role, user, customer, supplier, branch, or company pollution.

## Deferred and blocked work

Phase 33D must not begin until accountant/client decisions approve final price basis, VAT/RCM/tax, valuation, account categories, customer settlement, supplier payable/payment, return, and reversal treatment. Posting, receipt, assets, barcode allocation, inventory movement, treasury, Gold Center changes, withdrawals, Liquidity Transfer, and transformations remain out of Phase 33C.

MANUAL UI QA REQUIRED

Manual scope includes permission labels, CGP/IGP scope, button visibility, submitted/approved read-only states, approval queue/filter states, snapshot summary, self-review hiding, approve/reject dialogs, rejection return-to-draft, revision chain, Arabic RTL, English LTR, and responsive layout.

## HF1 — Controlled self-review closure

`gold_purchase.cgp.self_approve` and `gold_purchase.igp.self_approve` bring the catalog to 24 permissions. Persisted `Role.isAdmin` is the canonical trusted all-permissions mechanism; ordinary non-isAdmin roles do not receive either key automatically. Missing override returns exact `403 SELF_APPROVAL_FORBIDDEN`; controlled self-review remains explicit, scope-bound, idempotent, snapshot/version checked, reason-required, and audited.

Migration `20260714020000-gold-purchase-self-approval-permissions.js` was applied once. The failed zero-byte HF1 dump remains incident evidence. Valid pre-HF1 backup: `backend/backups/darfus_erp_phase33c_20260714-004524.dump`. Valid post-migration backup: `backend/backups/darfus_erp_post_hf1_migration_2026-07-14T00-20-59-656Z.dump`, SHA-256 `953CC2E5B5CD48AAD95AFA0F1A35E3430603DA3587B85FAE2BC5CA744D9AFC0B`. No rollback or migration rerun occurred. MANUAL UI QA REQUIRED; Phase 33D remains blocked.

## HF1 — Complete zero-posting persistence evidence

`scripts/verify-gold-purchase-approval-workflow.js` now queries every applicable persisted area directly using the unique HF1 company/branch/customer/supplier/document namespace. Supplier payment persistence is shared `CashTransaction` (`cash_transactions`) with `type=cash_out`, `category=supplier_purchase`, and purchase-order reference. Treasury is persisted through `CashTransaction`; there is no separate Treasury table. Customer payment/settlement evidence directly covers `Payment` (`payments`), `CustomerCreditTransaction` (`customer_credit_transactions`), and the separate reservation payment, application, transfer, refund, and refund-allocation ledgers.

Gold Center has no separate movement ledger: price/fixing activity is persisted in `GoldPrice` (`gold_prices`) and `GoldFixing` (`gold_fixings`), while customer/inventory gold pools and stock movements are independently checked. Accounting posting links are persisted through `JournalEntry.sourceType/sourceId`, `CashTransaction.journalEntryId`, and `CustomerCreditTransaction.journalEntryId`; no separate posting-link table exists. Each applicable table was verified at fixture baseline, after CGP/IGP submit/review/reject/resubmit/revision/concurrency actions, and after `finally` cleanup: every count was zero. The gated verifier prints the complete 16-row matrix and fails on a missing mapping, skipped table, nonzero count, or cleanup residue.
