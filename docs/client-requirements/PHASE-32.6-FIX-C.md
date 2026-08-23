# Phase 32.6-Fix C — Multi-Item Changes, Automatic Expiry & Renewal

## Scope

Built the remaining approved reservation lifecycle foundation on top of Fix A (core/atomic
advances) and Fix B (completion/refund settlement):

1. Item amendments on an active reservation — add, remove, replace, reprice.
2. Server-side total/paid/remaining/status recalculation with active-excess prevention.
3. Expiry extension before the exact expiry time.
4. Automatic expiry (no grace period) reusing the approved cancellation path.
5. Renewal after expiry — a linked successor reservation at current server prices.
6. Advance payment transfer from the expired source to its successor via an immutable subledger.
7. Renewal-excess refund (higher/equal/lower successor total handling).

**Not** in scope (deferred to Fix D): full granular permission matrix, notification delivery,
reservation report catalogue, customer-statement reservation section, full UI redesign,
cross-company/branch/currency renewal, partial active-reservation refunds, automatic financial
refund at expiry, automatic sale completion at expiry.

## Data Model (additive, forward-only)

Migration `20260712010000-reservation-lifecycle-amendments-expiry-renewal.js`:

- New tables: `reservation_amendments`, `reservation_amendment_items`,
  `reservation_expiry_extensions`, `reservation_renewals`, `reservation_payment_transfers`.
- New reservation columns: `expiry_processed_at`, `expired_at`, `expired_by_system`,
  `expiry_cancellation_reason`, `last_extended_at`, `last_extended_by`, `extension_count`,
  `predecessor_reservation_id`, `successor_reservation_id`, `renewed_at`, `renewed_by`,
  `renewal_status`.
- New reservation status enum values: `pending_renewal_settlement`, `renewed`.
- New reservation-payment status enum value: `transferred`; payment markers `source_transfer_id`,
  `origin`.
- Reservation refund typing: `refund_type` (`reservation_full` | `renewal_excess`), `renewal_id`.
- Partial unique indexes guarantee: at most one active renewal per source, at most one linked
  successor per source, and per-idempotency-key uniqueness on amendments/extensions/renewals.

No existing column is dropped, no data is mutated, and the migration created no business record.
`down()` is disabled (forward-only).

## Item Amendments

`POST /reservations/:id/amend-items` (permission `sales.approve`, Idempotency-Key required).

An atomic transaction locks the reservation, active items, and every affected asset in
deterministic order, then:

- Validates added/replacement assets are Available, same company/branch, not sold, not reserved
  elsewhere, and not duplicated; validates removed/repriced items are currently active.
- Resolves every price **server-side from the asset record** (VAT-inclusive agreed snapshot). The
  client never supplies prices.
- Computes the final active item set; rejects an empty result.
- Recomputes total server-side; **rejects any amendment that would leave total below paid**
  (partial refunds are not allowed while active).
- Releases removed/replaced-out items (assets → Available; old rows preserved as `released`),
  creates new active items for added/replaced-in assets (assets → Reserved), and refreshes
  repriced items to the current asset price.
- Recomputes remaining and status (a Fully Paid reservation may become Partially Paid when the
  total increases); records an immutable `reservation_amendments` master + `reservation_amendment_items`
  detail with before/after totals, paid, remaining, and status.
- Posts **no** sales/VAT/AR/COGS/inventory/cash/advance journal. Historical payments are never
  edited or deleted. On any failure the whole transaction rolls back. The idempotency key replays
  a stable result; concurrent amendments resolve to one consistent item set under the row lock.

## Expiry Extension

`POST /reservations/:id/extend-expiry` (permission `sales.approve`, Idempotency-Key required).

Compared against trusted database time under a row lock: rejects extending an already-expired
reservation, rejects a new expiry that is not strictly later than the current expiry, and rejects a
non-future expiry. Records immutable `reservation_expiry_extensions` history. No financial posting.

## Automatic Expiry

Reusable service operation `processDueExpirations()` (driven by a lightweight scheduler) selects
reservations whose exact `expires_at` has passed — **no grace period** — using
`... expires_at::timestamptz <= now() ... FOR UPDATE SKIP LOCKED`, so multiple API workers never
double-process. Each reservation is processed in its own transaction via `_expireOneReservation`,
which re-checks eligibility under the lock and reuses the shared `_releaseActiveReservationItems`
helper (the same release path as manual cancellation):

- Reserved assets return to Available; payments are unchanged.
- No refund, no sale invoice, and no financial journal is created by expiry.
- A paid reservation becomes `cancelled_refund_pending`; an unpaid reservation becomes `cancelled`.
- Expiry metadata (`expired_by_system`, `expired_at`, `expiry_processed_at`,
  `expiry_cancellation_reason`) and audit events record that cancellation was caused by automatic
  expiry. A fully paid expired reservation is **not** auto-completed as a sale.

### Scheduler

`backend/src/services/reservation-expiry-scheduler.js` runs a single `setInterval` tick
(configurable via `RESERVATION_EXPIRY_INTERVAL_MS`, default 60s) that delegates to the service.
It is started from `server.js` and is isolated (no-op) when `NODE_ENV=test`,
`DISABLE_RESERVATION_EXPIRY_SCHEDULER=true`, or the gated live verifier is running. The timer is
`unref`'d so it never keeps the process alive, and per-reservation failures are logged without
corrupting other reservations. Verification drives expiry deterministically through the
namespace-scoped service call rather than waiting on the timer.

## Renewal After Expiry

`POST /reservations/:id/renew` (permission `sales.approve`, Idempotency-Key required).

An expired reservation is never reopened. Renewal is eligible only for an **automatically expired**
(`expired_by_system = true`), non-completed, non-refunded source with no active successor and no
conflicting active full-refund request. The transaction:

- Recomputes the source **transferable balance** = posted payment value not already transferred or
  refunded (from the transfer and refund subledgers; original payment rows are never mutated).
- Validates successor assets (Available, same customer/company/branch/currency), resolves current
  server prices, creates the successor reservation + items (assets Reserved), links
  predecessor/successor, and records a `reservation_renewals` row with current-price evidence.
- Branches on transferable vs successor total:
  - **transferable ≤ successor total** — transfers the full eligible balance and activates the
    successor immediately (Active / Partially Paid / Fully Paid); remaining is the difference.
  - **transferable > successor total** — creates the successor in `pending_renewal_settlement`,
    computes the excess server-side, and raises a distinct `renewal_excess` refund. The successor
    is not activated until the excess refund executes.

### Payment Transfer Accounting

Transfer value moves from the source's available advance payments to **new** successor payment
rows (origin `reservation_transfer`, no new advance journal), recorded in the immutable
`reservation_payment_transfers` subledger. **No GL journal is posted for a transfer**: the
customer's configured Reservation Advances liability account, customer, branch, company, and
currency are all unchanged, so the net GL impact is zero. The subledger is the reconciliation
source of truth (source and successor reservation balances remain distinguishable). No cash, bank,
revenue, VAT, AR, COGS, or inventory line is produced, no final invoice is auto-created, and a
source payment can never be transferred beyond its unrefunded/untransferred balance.

### Renewal-Excess Refund

`POST /reservation-renewal-refunds/:id/approve` (`approvals.manage`) and
`POST /reservation-renewal-refunds/:id/execute` (`treasury.update`, Idempotency-Key required).

The server-derived excess is refunded through the established Fix B posting — **Dr Reservation
Advances / Cr selected Cash/Bank** — with no sales/VAT/AR/COGS/inventory line. Approval is separate
from execution; execution before approval and duplicate execution are rejected; a method that
differs from the original payment method requires override approval. On successful execution the
excess is allocated against the source's available payments (recording the refunded portion without
mutating payment rows), the exact successor total is transferred, and the successor is activated
(Fully Paid). A forced posting failure rolls the whole execution back: the successor stays pending,
no cash moves, and no transfer occurs. The ordinary Fix B full-refund workflow is filtered to
`reservation_full` refunds and is blocked while a renewal is in progress, so the two paths never
collide.

## Permissions

Reuses existing keys (no Fix D matrix): amend / extend / renew → `sales.approve`; renewal-excess
approval → `approvals.manage`; renewal-excess execution → `treasury.update`. The automatic-expiry
scheduler runs as a trusted system action. Backend enforcement is mandatory; frontend visibility is
not authorization.

## Audit Events

Amendment (`reservation.amendment_created`, `item_added`, `item_removed`, `item_replaced`,
`item_repriced`, `total_changed`, `status_recalculated`, `item_released`), expiry
(`reservation.expiry_extended`, `expired`, `expiry_cancelled`, `refund_pending`), and renewal
(`reservation.renewal_requested`, `successor_created`, `renewal_excess_refund_requested`,
`renewal_excess_refund_approved`, `renewal_excess_refund_executed`, `payment_transferred`,
`renewed`, `successor_activated`) events are written through the existing hash-chained audit
service with before/after evidence, identities, amounts, and reasons. No secrets are logged.

## Frontend Wiring

`app/[locale]/(dashboard)/sales/reservations/page.tsx` gains permission-aware Amend / Extend /
Renew actions and renewal-excess approve/execute buttons, plus amendment/extension/renewal history
and expiry/predecessor/successor detail fields. Amend and Renew use dedicated modals that submit
**only asset ids, reasons, dates, and refund methods** — never totals, prices, transfer amounts,
excess amounts, journal lines, or statuses. All dedicated endpoints use Idempotency-Key; no generic
PATCH is used for any Fix C transition; Arabic/English + RTL/LTR, loading, and confirmation states
are preserved.

## Verification

- Static: `scripts/verify-reservation-amendment-expiry-renewal.js` (files/schema, model
  registration, service contract, scheduler contract, routes/permissions, frontend contract,
  docs/package, scope guard). Prints `STATIC ONLY — LIVE DATA NOT VERIFIED` when ungated.
- Live (gated by `VERIFY_RESERVATION_LIFECYCLE_LIVE=true` + `VERIFY_DATABASE_NAME=darfus_erp`,
  local `darfus_erp@localhost:5433`): isolated `T32C-*` records exercise amendment (add/remove/
  replace/reprice/mixed, rejects, paid interactions, idempotency, rollback, concurrency), expiry
  (extend, reject-after-expiry, automatic expiry for paid/unpaid, no accounting, idempotent
  re-run, no auto-complete, payment/completion-after-expiry rejection), and renewal (equal/higher/
  lower totals, transfer subledger, no-GL-journal transfer, excess refund approve/execute, no
  cash-by-transfer, no auto-invoice, immutable originals, duplicate/rollback protection). The
  verifier drives expiry through a namespace-scoped service call, cleans only its namespace, and
  asserts before/after counts are identical — printing **LIVE TESTS EXECUTED** and **No persistent
  test pollution detected**.

## Deferred Scope (Fix D)

Full granular reservation permission matrix; audit administration UI; notification workflows and
delivery; reservation reports; customer-statement reservation section; full reservation UI
redesign; cross-company/branch/currency renewal; partial active-reservation refunds.

Next phase: **Phase 32.6-Post-C — POS Reservation Deposit & Accounting Configuration** (now
implemented; see `PHASE-32.6-POST-C-POS-RESERVATION.md`), then **Phase 32.6-Fix D — Permissions,
Audit, Notifications, Reports & Full UI**.
