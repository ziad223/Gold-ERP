# Phase 32.6-Fix D — Granular Permissions, Audit, Notifications, Reports, Customer Statement & Reservation UI

## Scope

Phase 32.6-Fix D extends the already approved reservation workflow after Fix A/B/C/Post-C. It does not re-implement reservation completion, refunds, amendments, expiry, renewal, POS deposit creation, or reservation payment accounting.

## Added

- Granular reservation permission keys:
  - `reservations.view`
  - `reservations.view_all`
  - `reservations.view_branch`
  - `reservations.view_own`
  - `reservations.create`
  - `reservations.record_payment`
  - `reservations.view_payments`
  - `reservations.view_receipts`
  - `reservations.complete_sale`
  - `reservations.cancel`
  - `reservations.amend_items`
  - `reservations.reprice_items`
  - `reservations.extend_expiry`
  - `reservations.renew`
  - `reservations.view_renewal_transfers`
  - `reservations.refund_request`
  - `reservations.refund_approve`
  - `reservations.refund_reject`
  - `reservations.refund_execute`
  - `reservations.refund_method_override`
  - `reservations.audit_view`
  - `reservations.reports_view`
  - `reservations.reports_export`
  - `reservations.statement_view`
  - `reservations.configure_account`
- Transitional route compatibility keeps legacy `sales.*`, `approvals.manage`, `treasury.update`, `reports.*`, `audit.view`, and `customers.view` fallbacks where required so existing users are not locked out before the final permission matrix is assigned.
- Reservation row visibility foundation:
  - all-company visibility via `reservations.view_all`
  - branch visibility via `reservations.view_branch`
  - own visibility via `reservations.view_own` using recorded creator/updater names where available
- Reservation audit timeline endpoint:
  - `GET /reservations/:id/audit-timeline`
  - read-only
  - returns reservation-prefixed audit events with before/after evidence
- Reservation notification metadata:
  - nullable `source_type`
  - nullable `source_id`
  - nullable `event_key`
  - unique event key protection for deduplicated reservation notifications
- Reservation notification events for:
  - create
  - payment posted
  - fully paid
  - completed
  - cancelled
  - refund requested/approved/rejected/executed
  - amended
  - expiry extended
  - expired
  - renewal requested
  - renewed
  - **approaching expiry** (proactive notification before actual expiry)
- Approaching-expiry reservation notifications:
  - `processApproachingExpiryNotifications` finds reservations expiring within a configurable window (default 3 days)
  - emits a deduplicated `approaching_expiry` notification per reservation per calendar day
  - integrated into the reservation expiry scheduler tick
- Reservation reports:
  - `GET /reports/reservations/summary`
  - `GET /reports/reservations/payments`
  - `GET /reports/reservations/reconciliation`
- GL vs reservation subledger reconciliation:
  - the reconciliation report now includes a `glReconciliation` section
  - reads the configured `reservationAdvancesAccountId` setting
  - computes the GL balance from posted journal lines against the advances account
  - compares GL balance to the operational subledger balance (payments − refunds ± transfers)
  - reports difference and `reconciled` flag (true when difference < 0.01)
  - gracefully skips when the advances account is not configured
- Customer statement-v2 now includes a separate `reservationAdvances` section named `دفعات الحجوزات`.
  - The section is explicitly separate from AR.
  - Reservation payments do not become customer debt.
  - AR running balance remains based on the approved statement-v2 source documents.
- Reservation UI improvements:
  - granular permission-aware action buttons
  - later payment action using the dedicated reservation payment endpoint
  - centralized reservation status labels
  - audit timeline display
  - reservation report links
  - existing completion/refund/amendment/expiry/renewal flows preserved

## Accounting Safety

Fix D does not change posting service behavior, sales posting, VAT, COGS, inventory movement, reservation advance payment posting, final sale settlement, refund posting, or POS reservation creation.

Reservation report and statement additions are read-only. The GL reconciliation is a read-only cross-check that never mutates journal entries, account balances, or reservation records.

## Deferred

- Final role assignment matrix and staff-specific permission rollout.
- Notification recipient rules by role/branch/escalation.
- Export formatting beyond JSON-ready report endpoints.
- Full reservation report UI.
- Customer statement printable reservation section.
- Mobile reservation workflow polish.
- Physical printer validation.
- Any Phase after Fix D.

## Verification

Added verifier:

```bash
node scripts/verify-reservation-governance-reports-ui.js
```

Package script:

```bash
npm run verify:reservation-governance-reports-ui
```

Default mode is static and non-mutating. Optional local live mode is gated by:

```bash
VERIFY_RESERVATION_GOVERNANCE_LIVE=true
VERIFY_DATABASE_NAME=darfus_erp
```

Live mode verifies:
- All 25 reservation permissions exist in the database.
- Notification metadata columns (`source_type`, `source_id`, `event_key`) exist.
- Reservation audit timeline query is readable.
- Reservation payments table is readable.
- GL reconciliation query is executable against the configured advances account.
- Approaching-expiry notification method executes without errors (namespace-scoped, zero side effects).
- **Behavioral Permissions:** Tests 22 distinct permission gating scenarios via integration HTTP server requests, validating access boundaries (403 Forbidden, boundary limits).
- **API Smoke Testing:** Runs local HTTP queries on all 11 reports/timelines/statement routes and asserts 200 OK statuses and response shapes.
- **Reservation Numbering:** Confirmed database `id` represents the business-facing `reservationNumber` (acting as the sole human-readable business key). The API returns both `reservationId` and `reservationNumber` matching the database primary key (`id`), and `null` for legacy rows.
- **Configuration Missing (Option A):** Unifies all advances-account configuration failures under HTTP 200 containing `configured: false`, `reconciliationStatus: "configuration_missing"`, and `configurationIssue` (values: `missing_setting`, `account_not_found`, `inactive_account`, `wrong_company`, `invalid_posting_account`, `invalid_account_type`, `invalid_account_nature`) without leaking details.
- **Customer Statement Deferral:** Statement print/export of the reservationAdvances section is classified as `DEFERRED WITH EXPLICIT OWNER APPROVAL` (Phase 32.6-Fix D, AD-002).
- **Cleanup proof:** No persistent test pollution detected (all temp users, roles, company, and accounts deleted; server terminated).
# Phase 32.6-Fix D final verification integrity closure (2026-07-13)

The nine reservation report routes now share one JSON pagination contract: page `1`, limit `50`, maximum `100`, and metadata `{ total, page, limit, pages }`. Invalid non-positive, non-integer, and nonnumeric values return `422 VALIDATION_FAILED`; oversized limits are capped at `100`. Items use deterministic timestamp plus ID ordering, totals cover the complete authorized filtered set, and authorized exports are not truncated to a UI page.

The contract applies to Summary, Payments, Unsettled Advances, Completions, Cancellations/Refunds, Expiry, Amendments, Renewals, and Reconciliation. Company, authenticated branch, own scope, query narrowing, totals, counts, pages, and export rows use the same visibility boundary. Reconciliation paginates only its final authorized logical rows; company-wide unsupported diagnostics remain excluded from branch, own, and branch-filtered company-wide results.

Write-time reservation advances account validation applies equally to `reservations.configure_account` and `settings.update`: the account must exist, be active, be in the authenticated company, be a posting leaf, and be liability/credit. Invalid or mixed requests are atomic and create no success audit. Payload-aware amendment authorization separately enforces `reservations.amend_items` and `reservations.reprice_items`.

Real HTTP verification proved exact negative permission denials, positive Audit/Reports/Statement access, page 1/page 2 stability, empty results, invalid inputs, complete export, scope isolation, a deliberate GL mismatch, and a genuinely reconciled row (`expected=750`, `GL=750`, `difference=0`, `reconciled`, `investigationFlag=false`). Namespace cleanup returned zero persistent matches and restored `reservationAdvancesAccountId=ACC-2300`. Application commit: `6d12975`. Primary verifier commit: `669b194`; compatibility verifier alignment: `396e255`. Static verification: typecheck PASS, lint PASS with pre-existing warnings, build PASS, and 45/45 verifiers PASS.

MANUAL UI QA REQUIRED.
