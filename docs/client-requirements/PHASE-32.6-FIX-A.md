# Phase 32.6-Fix A — Reservation Core Data Model & Atomic Advances Accounting Foundation

## Scope

Implemented the minimum safe reservation foundation before final sale completion, refunds, expiry, renewal, post-creation item changes, reports, customer statements, notifications, or full reservation UI.

This phase adds backend-safe reservation creation, multi-item schema support, immutable reservation payment ledger records, and customer reservation advances accounting.

## Schema

- Extended `reservations` additively with `branch_id`, `currency`, totals, `fully_paid_at`, `final_invoice_id`, `workflow_version`, `is_legacy`, `version`, `created_by`, and `updated_by`.
- Added statuses `partially_paid` and `fully_paid`.
- Added `reservation_items` for asset-backed multi-item reservation foundation.
- Added `reservation_payments` for immutable posted reservation receipts/payments.

No existing reservation columns were removed. No historical reservation `deposit` values were converted into payments. No historical journals or receipts were fabricated.

## Legacy Compatibility

Existing reservation rows remain readable as legacy rows:

- `workflow_version = 1`
- `is_legacy = true`
- existing `asset_id`, `asset_name`, `deposit`, `expires_at`, and status fields remain intact

New reservation payments are blocked for legacy rows until a later explicit migration/compatibility policy is approved.

## Atomic Reservation Creation

Dedicated reservation creation now uses a reservation service instead of generic CRUD.

The backend service validates customer and branch context, normalizes legacy single-asset payloads into the new item structure, locks requested assets, rejects sold/reserved/unavailable/cross-branch/duplicate assets, calculates totals server-side, creates reservation master and item rows, marks assets `reserved`, optionally posts an initial payment inside the same transaction, writes audit events, and uses idempotency keys.

If any step fails, the transaction rolls back: no reservation, item, asset status change, payment, receipt, or journal remains.

## Reservation Payments

`reservation_payments` records are immutable operational receipts.

Supported now:

- initial payment during atomic reservation creation
- backend payment service foundation for additional payments
- `posted` payment status
- reserved future statuses: `reversed`, `refunded`

Payments validate amount > 0, amount <= remaining balance, new-workflow reservation status, configured advances account, and idempotency key.

Server-side status calculation:

- paid total = 0: `active`
- 0 < paid total < agreed total: `partially_paid`
- paid total = agreed total: `fully_paid`

Fully paid does not create a sales invoice, does not mark assets sold, and does not post sales/VAT/COGS/inventory movement in this phase.

## Accounting

Each reservation payment journal uses source type `reservation_payment`.

Journal lines:

- Debit selected Cash/Bank account
- Credit configured Customer Reservation Advances account

The configured account is read from `reservationAdvancesAccountId`.

Requirements:

- active posting account
- liability classification
- credit nature

There is no fallback to account `2300`. Account `2300` may be used only if company settings explicitly point `reservationAdvancesAccountId` to that account.

Reservation payments do not post to sales revenue, VAT output, accounts receivable, COGS, inventory, customer-credit income, or deposit income.

Reservation creation without payment does not require the advances-account setting. Creation with initial payment, and additional payment posting, require it.

## Generic CRUD Restrictions

Generic `setupCrud("reservations")` was removed for reservations.

Dedicated routes now provide safe list/detail reads, atomic creation, atomic payment foundation, and notes-only limited PATCH.

Generic full replacement and delete are disabled. Generic PATCH cannot change customer, item, price, total, paid, remaining, deposit, status, asset state, or invoice link.

Temporary permission mapping uses existing `sales.*` permissions. Granular reservation permissions remain deferred.

## Frontend Safety

The existing `/sales/reservations` page remains single-asset visually.

Changed safety behavior:

- creation calls the dedicated reservation endpoint
- sends a stable idempotency key
- sends optional initial payment only through the atomic reservation payload
- no separate asset PATCH after reservation creation
- no frontend-created deposit invoice
- no VAT/tax/subtotal metadata submitted for reservation payments
- API-side cancellation/release is disabled until a dedicated workflow exists

Full multi-item UI, add-payment UI, payment history, refund UI, renewal UI, expiry UI, reports, and customer-statement sections remain deferred.

## Audit Events

Added reservation event taxonomy through existing audit infrastructure:

- `reservation.created`
- `reservation.item_reserved`
- `reservation.payment_posted`
- `reservation.fully_paid`

No secrets or payment credentials are logged.

## Verification

Added `scripts/verify-reservation-core-accounting-foundation.js`.

Package script:

`npm run verify:reservation-core-accounting-foundation`

The verifier includes static source assertions, schema/migration assertions, route and permission assertions, accounting source-type assertions, frontend safety assertions, and optional gated local live integration tests.

Live mode requires `VERIFY_RESERVATION_CORE_LIVE=true`, `VERIFY_DATABASE_NAME=darfus_erp`, local DB host only, non-production `NODE_ENV`, and destructive reset variables unset.

Live tests run isolated records inside a transaction and roll back.

## Deferred Scope

Not implemented in Fix A:

- No final sale completion
- No refunds
- No expiry scheduler
- final sale completion
- reservation-to-invoice settlement
- refunds
- automatic expiry scheduler
- renewal
- post-creation add/remove/replace item operations
- reservation reports
- customer-statement reservation section
- notification workflows
- full granular reservation permissions
- full multi-item UI

Next phase:

**Phase 32.6-Fix B — Multiple Payments, Final Completion & Refund Settlement**
