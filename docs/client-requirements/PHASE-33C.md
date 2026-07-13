# Phase 33C — Gold Purchase Permissions, Submission and Maker–Checker

Status: IMPLEMENTED — VERIFIED (manual browser QA remains required)

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

- Applied migration count: 37 (36 prior + Phase 33C).
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
- Gated real HTTP verifier: PASS, `LIVE TESTS EXECUTED` and `No persistent test pollution detected`.
- Behavioral coverage: 22/22 catalog keys; CGP and IGP submission/approval/rejection; exact permission denials; self-review and own-only review denial; branch, own, and company-wide scope; duplicate pending request; stale/invalid transitions; snapshot tamper rejection; immutable submitted/approved records; rejection/resubmission history; revision idempotency; concurrent terminal review; audit actions.
- Zero-posting proof: zero Phase 33C assets, stock movements, journals, cash transactions, CGP/IGP legacy pools, purchase orders, and notifications.
- Cleanup: exact `T33C-*` fixtures removed; zero approval, document/item, audit, idempotency, role, user, customer, supplier, branch, or company pollution.

## Deferred and blocked work

Phase 33D must not begin until accountant/client decisions approve final price basis, VAT/RCM/tax, valuation, account categories, customer settlement, supplier payable/payment, return, and reversal treatment. Posting, receipt, assets, barcode allocation, inventory movement, treasury, Gold Center changes, withdrawals, Liquidity Transfer, and transformations remain out of Phase 33C.

MANUAL UI QA REQUIRED

Manual scope includes permission labels, CGP/IGP scope, button visibility, submitted/approved read-only states, approval queue/filter states, snapshot summary, self-review hiding, approve/reject dialogs, rejection return-to-draft, revision chain, Arabic RTL, English LTR, and responsive layout.
