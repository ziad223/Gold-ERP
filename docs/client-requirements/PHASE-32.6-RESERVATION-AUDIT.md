# Phase 32.6 — Reservation Audit

Current implementation, accounting and gap analysis against RE-001.

Date: 2026-07-10  
Starting HEAD: `2920ea8 docs: record reservation decisions and requirements delta`  
Phase type: read-only audit + documentation only.

## A. Executive Summary

The current system has a visible reservation screen and a minimal `reservations` table, but it does **not** implement the approved RE-001 reservation workflow.

Current reservation behavior is a legacy single-asset operational shortcut:

- Frontend page: `app/[locale]/(dashboard)/sales/reservations/page.tsx`.
- Backend route: generic CRUD from `setupCrud("reservations", models.Reservation, ...)` in `backend/src/routes/erp.routes.js`.
- Backend model: `backend/src/models/reservation.model.js`.
- DB table: `reservations` from `backend/migrations/20260616000000-init-db.js`.

Critical finding: the frontend creates a reservation row, then separately patches the asset status, and if a deposit is entered it creates a separate **deposit invoice**. These actions are not a single backend transaction and are not linked as a reservation payment ledger. This conflicts with RE-001, which requires reservation payments to be independent receipts/journals against a dedicated Customer Reservation Advances liability, with no sales invoice until final completion.

Highest-risk dependency: the core reservation data model and atomic accounting foundation are missing. The next phase should therefore be **Phase 32.6-Fix A — Reservation Core Data Model & Atomic Accounting Foundation**.

## B. Safety Confirmation

- Working tree was clean at pre-flight.
- Short HEAD was `2920ea8`.
- 11 stashes were listed and not touched.
- Requirement-source directory `H:\WORK\client-requirements` was not modified.
- No frontend/backend code was modified.
- No migration, seed, reset, or destructive command was run.
- Optional local DB inspection was SELECT-only after proving:
  - `backend/.env`: `NODE_ENV=development`
  - `DB_HOST=localhost`
  - `DB_PORT=5433`
  - `DB_NAME=darfus_erp`
  - destructive reset variables were unset.

## C. Current Architecture

| Layer | File | Symbol/Route | Purpose | Active? | Evidence |
|---|---|---|---|---|---|
| Frontend page | `app/[locale]/(dashboard)/sales/reservations/page.tsx` | `ReservationsPage` | Visible reservations UI | Yes | Page title "Asset Reservations & Deposits"; linked from `app/[locale]/(dashboard)/sales/page.tsx`. |
| Frontend data read | `hooks/use-core-erp-data.ts` | `useApiItems("reservations", "/reservations")` | Reads reservations via generic API | Yes | Reservation query key + `/reservations` URL. |
| Frontend mutation | `app/[locale]/(dashboard)/sales/reservations/page.tsx` | `apiClient("/reservations", POST)` | Creates reservation row | Yes | Lines around reservationMutation create `RES-${Date.now()}`. |
| Frontend mutation | same | `apiClient("/assets/:id", PATCH)` | Marks asset reserved/released separately | Yes | Separate PATCH after reservation POST. |
| Frontend mutation | same | `apiClient("/sales/invoices/draft", POST)` | Creates deposit invoice if deposit > 0 | Yes | Deposit invoice payload includes subtotal/total/tax from frontend. |
| Backend route | `backend/src/routes/erp.routes.js` | `setupCrud("reservations", models.Reservation, ...)` | Generic CRUD only | Yes | No dedicated reservation service/route exists. |
| Backend model | `backend/src/models/reservation.model.js` | `Reservation` | Single-asset reservation row | Yes | `assetId`, `customerId`, `deposit`, `expiresAt`, status enum. |
| Migration | `backend/migrations/20260616000000-init-db.js` | `createTable("reservations")` | Initial table | Yes | No item/payment/history/refund tables. |
| Audit | `backend/src/controllers/erp.controller.js` | `logAudit()` | Generic create/update/delete audit | Partial | Captures before/after for generic row changes only. |
| Notifications | `backend/src/services/notification.service.js` | `createNotification()` | Generic notification infrastructure | Partial | No reservation-specific expiry/refund notifications. |
| Accounting | `backend/src/services/posting.service.js` | `postDepositEntry()` | Reusable deposit liability posting | Partial/reusable | Dr Cash/Bank, Cr 2300, sourceType `deposit`; not reservation-specific. |

## D. Data Model

| Approved Concept | Existing Model/Table | Status | Gap | Risk |
|---|---|---|---|---|
| Reservation master | `reservations` | PARTIAL | Single asset, one deposit number, no total/paid/remaining/excess fields, no branchId/salesperson/currency/final invoice link. | High |
| Reservation items | none | MISSING | Cannot support multi-item reservation, current item set, item price snapshots, add/remove/replace history. | Critical |
| Reservation payments | none | MISSING | Existing `payments` require `invoice_id`; reservation payments are not modeled. | Critical |
| Reservation payment receipts | none | MISSING | No receipt number/source per reservation payment. | High |
| Item-change history | none | MISSING | No before/after item and price audit entity. | High |
| Extension history | none | MISSING | `expiresAt` is a single string. Old/new expiry values are not retained. | High |
| Cancellation | `reservations.status` | PARTIAL | Has `cancelled`, but no `Cancelled — Refund Pending` status, no cancellation reason/time/user. | High |
| Refund request/approval/execution | none | MISSING | No separate approval/execution, no reservation refund journal. | Critical |
| Reservation-to-invoice link | none | MISSING | Final sale cannot link back to reservation or prove settlement. | Critical |
| Old-to-new renewal link | none | MISSING | Expired reservation cannot be linked to successor. | High |
| Notification records | `notifications` | PARTIAL | Generic infrastructure exists; no reservation recipient rules/events. | Medium |
| Audit events | `audit_logs`, `asset_events` | PARTIAL | Generic audit exists; current API flow does not record a complete reservation business transaction. | High |

Local DB SELECT-only evidence:

- Existing reservation-related tables: `reservations` only.
- Current demo DB has 1 reservation row (`RES-0045`) with status `active`.
- `RES-0045` has 0 linked `payments` and 0 linked `journal_entries`.
- Reservation-related audit log count in SELECT inspection: 0.

## E. Reservation State Machine

Current model statuses are only:

`active`, `expired`, `completed`, `cancelled`

Required lifecycle needs:

`Draft`, `Active`, `Partially Paid`, `Fully Paid`, `Completed`, `Expired`, `Cancelled`, `Refund Pending`, `Refunded`, `Renewed/successor-linked`.

| From | Action | To | Current Implementation | Required Behavior | Gap |
|---|---|---|---|---|---|
| none | Create | active | Generic CRUD can create a row; UI then separately patches asset. | Backend atomic create with item locks, status Reserved, totals, audit. | Missing atomic service. |
| active | Payment | unchanged/implicit | No reservation payment route. UI creates deposit invoice. | Payment row/receipt/journal per reservation; status partial/fully paid. | Missing and conflicting. |
| active | Cancel | asset available only | UI PATCHes asset to available; reservation row is not necessarily moved to refund-pending. | Cancel reservation, release items, status Cancelled — Refund Pending, no refund journal. | Conflicting. |
| active | Complete sale | POS link | UI links to `/pos`; no reservation-bound completion route. | Authorized complete-sale flow creates final invoice and settles advances. | Missing. |
| active | Expire | unknown/manual | No scheduler found. | Exact expiry auto-cancel with notification and audit. | Missing. |
| cancelled/expired | Renew | none | No renewal route/model. | New reservation linked to previous; old remains closed. | Missing. |

## F. Multi-Item Behavior

Status: **CONFLICTING / NOT IMPLEMENTED**.

Evidence:

- `Reservation` type in `lib/types.ts` contains `assetId` and `assetName`, not an item collection.
- `backend/src/models/reservation.model.js` contains `assetId` and `assetName`, not `ReservationItem`.
- `app/[locale]/(dashboard)/sales/reservations/page.tsx` selects a single `assetId` in the modal.

Required add/remove/replace behavior is absent:

- No add-item route.
- No remove-item route.
- No replace-item route.
- No current item set.
- No per-item agreed price snapshots.
- No overpayment/excess recalculation.
- No before/after item-change audit.
- No item-level locking for reservation changes.

## G. Multiple Payments

Status: **CONFLICTING / NOT IMPLEMENTED**.

Current:

- Reservation table has a single `deposit` numeric field.
- UI accepts one `deposit` value at creation time.
- If `depositNum > 0`, UI creates a separate `deposit` invoice via `/sales/invoices/draft`.
- `Payment` model requires `invoiceId`, so it cannot represent a reservation payment without pretending the reservation is an invoice.

Required:

- Unlimited partial payments.
- Independent receipt per payment.
- Independent journal per payment.
- Server-side overpayment guard against current remaining amount.
- Immutability and reversal/refund-only correction.

Race risk:

- No reservation payment transaction or row lock exists, so concurrent payments cannot be made safe in the current model.

## H. Accounting Posting

| Event | Current Debit | Current Credit | Approved Debit | Approved Credit | Status |
|---|---|---|---|---|---|
| Reservation payment | No reservation-specific journal. UI may create deposit invoice. | No reservation-specific liability. | Cash/Bank | Customer Reservation Advances | CONFLICTING |
| Deposit invoice payment | Cash/Bank via `postDepositEntry()` | Account `2300` Customer Deposits | Not a reservation event unless adapted | New configured reservation advances account | PARTIAL reusable, not sufficient |
| Reservation cancellation | none | none | none | none | PARTIAL for no-journal cancellation, but no refund-pending workflow |
| Reservation refund | none | none | Customer Reservation Advances | Cash/Bank | MISSING |
| Final completion | POS/sales invoice can post sales/VAT/COGS | Sales/VAT/inventory via invoice logic | Apply advances, then sales/VAT/COGS/inventory | Settle advances + sales/VAT | MISSING |

Reusable component:

- `postingService.postDepositEntry()` already posts Dr Cash/Bank and Cr 2300 using `receivedAmount`, and this is now safe for actual received amount.

Why it is not sufficient:

- Approved account code for reservations is configuration pending and must not be assumed to be 2300.
- Current sourceType is `deposit`, not `reservation_payment`.
- Current entry links to an invoice ID, not reservation/payment/receipt IDs.
- No customer/reservation dimensions are stored on journal lines.
- `full-2300-reconciliation.service.js` categorizes `sourceType: "deposit"` as POS deposit-sale liability, not reservation advances.

## I. VAT

Status: **CONFLICTING** for the visible reservation UI.

Evidence:

- `app/[locale]/(dashboard)/sales/reservations/page.tsx` sends `tax: Math.round(depositNum * vatRate / 100...)` on the deposit invoice payload.
- `postDepositEntry()` does not post VAT, but the deposit invoice record can carry a tax value.

Approved behavior:

- Reservation agreed price is VAT-inclusive.
- VAT is not posted on partial reservation payments.
- Final sales invoice separates net sales and VAT.
- Duplicate VAT must be prevented.

Gap:

- Current reservation deposit path creates a deposit invoice with frontend-calculated tax metadata, which is not a trusted reservation payment model and risks confusing reporting/print/statement semantics.

## J. Customer Statements

Status: **NOT IMPLEMENTED** for RE-001.

Required separate statement section: `دفعات الحجوزات`.

Current:

- Customer statement V2/V3 and full 2300 diagnostics exist, but no reservation-payment source exists.
- Current reservation row has no linked payments/journals in local DB.
- Deposit invoice behavior appears through invoice/payment model, not a dedicated reservation section.

Gap:

- No reservation payment/refund rows can be shown separately.
- Remaining reservation balance is not modeled as operational balance independent from AR.
- Final settlement visibility is missing.

## K. Final Sale Completion

Status: **MISSING**.

Current:

- UI "Complete Sale" is a link to `/pos`.
- POS checkout validates available inventory and then marks assets sold.
- A reserved asset is not available for POS sale unless status-bypass logic is added elsewhere; the POS flow expects `asset.status === "available"` for assets.

Required atomic completion:

1. Lock reservation.
2. Confirm Fully Paid.
3. Confirm paid total equals current reservation total.
4. Confirm all current items are Reserved by this reservation.
5. Create final invoice.
6. Create invoice items from current reservation items.
7. Apply reservation payments.
8. Settle reservation-advance liability.
9. Post sales/VAT/COGS/inventory.
10. Mark items Sold.
11. Link invoice to reservation.
12. Close reservation.
13. Audit events.

No current route performs this sequence.

## L. Expiry and Cancellation

Status: **MISSING / PARTIAL**.

Current:

- `expiresAt` exists as string.
- Local dashboard provider has demo/local alert logic for reservations expiring today.
- No backend scheduler/job for exact expiry was found.
- No idempotent auto-cancel route/job.
- No `Cancelled — Refund Pending` status.
- UI cancel simply releases the asset in API mode and does not create a refund-pending reservation state.

Required:

- Exact datetime cancellation.
- Release all items.
- Preserve payments.
- No automatic refund journal.
- Notify authorized users.
- Audit transition.

## M. Refund Workflow

Status: **MISSING** for reservations.

Reusable but not sufficient:

- Customer credit refund route exists: `/customers/:id/credit/refund`.
- It is idempotent, transaction-based, and posts Dr 2300 / Cr Cash/Bank through the customer-credit ledger.

Reservation requirements differ:

- Refund request, approval, and execution are separate.
- Full refund only after cancellation/refund-pending.
- Different refund method needs additional approval.
- Refund must link to reservation payments.
- Reservation reaches Refunded only after financial execution.

No reservation refund model/route implements these rules.

## N. Renewal and Repricing

Status: **MISSING**.

Current:

- No extension route.
- No extension history table.
- No successor reservation link.
- No settlement transfer mechanism.

Required:

- Before expiry: update expiry with old/new history and permission.
- After expiry: create a new reservation linked to old; transfer valid prior payments via documented settlement; preserve history.

## O. Permissions

Current generic permission mapping:

- `reservations` resource maps to module `sales`.
- Generic CRUD uses `sales.view`, `sales.create`, `sales.update`, `sales.delete` candidates.
- Route-level auth for `/sales/reservations` page is only `sales.view` through the route guard.

| Required Capability | Existing Permission | Backend Enforced | Frontend Enforced | Gap |
|---|---|---:|---:|---|
| reservation.view | `sales.view` via generic CRUD | Yes | Route-level only | Too broad |
| reservation.create | `sales.create`/`sales.update` via generic CRUD | Yes | Button not explicitly gated | Too broad; no workflow permission |
| reservation.update/extend | `sales.update`/fallback candidates | Partial | No dedicated UI | Missing dedicated capability |
| reservation.item.add/remove/replace | none | No | No | Missing |
| reservation.payment.create | none | No | No true payment UI | Missing |
| reservation.payment.reverse | none | No | No | Missing |
| reservation.cancel | generic update/delete or asset PATCH | Partial | UI button | Missing refund-pending rules |
| reservation.complete | none | No | Link to POS | Missing |
| reservation.refund.request/approve/execute | none | No | No | Missing |
| reservation.notification.view | `notifications.view` | Generic only | Generic only | Missing recipient model |
| reservation.report.view | `reports.view` | Generic reports only | Generic reports only | Missing reports |

## P. Audit Trail

Status: **PARTIAL foundation, missing reservation-specific audit**.

Reusable:

- `auditService.record()` creates append-only hash-chained audit logs.
- `AuditLog` blocks update/destroy through ORM hooks.
- Generic CRUD logs create/update/delete through `ErpController`.
- `AssetEvent` can record inventory status changes.

Missing:

- Reservation payment receipt audit.
- Item add/remove/replace before/after values.
- Price change reason.
- Expiry change history.
- Auto-cancellation audit.
- Refund request/approval/execution audit.
- Final completion and invoice link audit.

Local DB SELECT-only found 0 reservation-related audit logs in current demo data.

## Q. Notifications

Status: **PARTIAL foundation, no reservation implementation**.

Reusable:

- `notificationService.createNotification()` creates notifications and emits realtime events.
- Notification list/unread/read-all routes exist.

Missing reservation notifications:

- Expiry warning.
- Automatic cancellation.
- Refund pending.
- Refund approved/executed.
- Fully paid/ready for completion.
- Item changed.
- Renewal created.
- Recipient/permission/branch filtering for reservation events.

## R. Reports

Status: **MISSING** for approved reservation reports.

No current report API/UI was found for:

- Total reservation payments received.
- Unsettled reservation advances.
- Amounts by customer.
- Amounts by branch.
- Amounts by treasury.
- Completed reservations converted to invoices.
- Cancelled reservations awaiting refund.
- Refunded amounts.
- Liability-to-reservation reconciliation.
- Collection/refund activity by employee.

Existing `/reports` is broader and does not supply these reservation-specific reports.

## S. Frontend and API

Frontend findings:

- Reservation list displays reserved assets, not reservation records.
- Single-item modal only.
- No payment history.
- No multiple payments.
- No remaining/excess amount.
- No refund workflow.
- No extension/renewal UI.
- No linked invoice display.
- No dedicated statement section.
- Frontend calculates deposit invoice tax in the reservation page.

API contract inventory:

| Method | Route | Permission | Transactional | Idempotent | Current Purpose | Gap |
|---|---|---|---:|---:|---|---|
| GET | `/reservations` | sales.view | n/a | n/a | Generic list | No details/items/payments |
| GET | `/reservations/:id` | sales.view | n/a | n/a | Generic get | No includes |
| POST | `/reservations` | sales.create/update candidate | No dedicated transaction | No | Generic row create | Missing validation/locks/accounting |
| PUT/PATCH | `/reservations/:id` | sales.update/adjust candidate | No dedicated transaction | No | Generic row update | Can change lifecycle fields without workflow |
| DELETE | `/reservations/:id` | sales.delete/update candidate | No dedicated transaction | No | Generic delete | Unsafe for financial reservation history |
| PATCH | `/assets/:id` | inventory.update/adjust candidate | Generic update only | No | Reserve/release asset from UI | Not atomic with reservation |
| POST | `/sales/invoices/draft` | sales.create | Has invoice posting behavior | Optional idempotency only if key sent | Deposit invoice side effect | Not a reservation payment contract |

## T. Concurrency and Idempotency

| Scenario | Current Risk | Classification |
|---|---|---|
| Two users reserve same item | Reservation create and asset PATCH are separate; no reservation lock. | UNSAFE |
| Two payments posted simultaneously | No reservation payment route/remaining lock. | UNSAFE |
| Payment and expiry at same time | No payment route or expiry scheduler. | UNKNOWN/UNSAFE |
| Completion and expiry at same time | No completion or expiry service. | MISSING |
| Refund execution twice | No reservation refund model; reusable credit refund has idempotency but not reservation-specific. | MISSING |
| Item replacement during completion | No item replacement or completion locks. | MISSING |
| Renewal during refund | No renewal/refund state machine. | MISSING |
| Duplicate final invoice requests | No reservation completion idempotency. | MISSING |
| Scheduler running multiple instances | No scheduler/distributed lock. | MISSING |

## U. Tests and Verifiers

Existing coverage:

- Deposit posting reconciliation verifier covers deposit invoice cash/liability correction, not reservation payments.
- Client scope and statement/2300 verifiers protect existing accounting diagnostics.
- No verifier exists for reservation creation, payment, expiry, refund, renewal, multi-item, or completion.

Recommended verifiers:

- `verify-reservation-foundation.js`
- `verify-reservation-payment-accounting.js`
- `verify-reservation-completion.js`
- `verify-reservation-expiry-refund.js`
- `verify-reservation-multi-item-changes.js`
- `verify-reservation-permissions-audit-reports.js`

Do not create these in this audit phase.

## V. Requirement-to-Implementation Matrix

| Requirement | Current System | Status | Evidence | Gap |
|---|---|---|---|---|
| Operational doc, not sale invoice | Table exists, but UI creates deposit invoice for payment | CONFLICTING | reservation page POST `/sales/invoices/draft` | Need reservation payment ledger |
| One/multiple items | Single `assetId` only | CONFLICTING | `Reservation.assetId`; model `assetId` | Need reservation_items |
| Item status Reserved | UI PATCHes asset separately | PARTIAL/UNSAFE | separate `/assets/:id` PATCH | Need atomic backend operation |
| Multiple payments | Single deposit field | MISSING | `deposit` column only | Need reservation_payments |
| Independent receipt/journal | none | MISSING | no payment route/table | Need receipt and journal link |
| No overpayment | none | MISSING | no server-side remaining calc | Need row lock/validation |
| Liability account | only deposit invoice 2300 reusable | PARTIAL | `postDepositEntry()` | Need configured reservation advance account |
| No AR/revenue/VAT before sale | reservation payment absent; deposit invoice carries tax metadata | CONFLICTING | UI sends tax | Need clean reservation payment model |
| Final completion | link to POS | MISSING/CONFLICTING | UI `/pos` link | Need complete-sale endpoint |
| Auto expiry | no job | MISSING | no scheduler route/service found | Need scheduler |
| Refund approval/execution split | none | MISSING | no reservation refund model | Need approval + execution |
| Renewal/repricing | none | MISSING | no old/new link | Need renewal model/route |
| Audit trail | generic only | PARTIAL | `auditService.record()` | Need reservation event taxonomy |
| Notifications | generic only | PARTIAL | `notificationService` | Need reservation triggers |
| Reports | none | MISSING | no report endpoints | Need report suite |

## W. P0/P1/P2/P3 Gap Register

### P0 — Accounting or Data Integrity

- Reservation payment is modeled as a deposit invoice side effect, not a reservation payment.
- Reservation create + asset reserve + deposit invoice are not atomic.
- No row locks/idempotency for reservation create/payment/completion.
- No overpayment race protection.
- No final advance settlement path.
- Frontend sends tax for reservation deposit invoice.
- Generic delete/update can alter reservation lifecycle without approved workflow semantics.

### P1 — Core Approved Workflow

- No multi-item reservation.
- No multiple payments.
- No Complete Sale route.
- No automatic expiry.
- No refund request/approval/execution split.
- No renewal/successor reservation.
- No item add/remove/replace.

### P2 — Governance and Operations

- No granular reservation permissions.
- Missing reservation-specific audit taxonomy.
- Missing notifications.
- Missing reservation reports.
- Missing customer-statement reservation section.

### P3 — UX and Enhancements

- UI lacks payment history, remaining/excess, details, linked invoice, renewal, refund states.
- Arabic/English page exists, but not all approved workflow states are represented.
- No loading/error detail per sub-operation beyond simple success/error messages.

## X. Recommended Implementation Sequence

1. **Phase 32.6-Fix A — Reservation Core Data Model & Atomic Accounting Foundation**
   - Add reservation master extensions, item/payment/receipt/history/refund/renewal models.
   - Add backend reservation service with transactions, locks, idempotency, and configured liability account.
   - Stop using deposit invoice as reservation payment.
   - Add server-side totals/remaining/excess invariants.

2. **Phase 32.6-Fix B — Multiple Payments, Final Completion & Refund Settlement**
   - Payment receipts and journals.
   - Final sale completion and advance settlement.
   - Refund request/approval/execution.

3. **Phase 32.6-Fix C — Multi-Item Changes, Expiry & Renewal**
   - Add/remove/replace items with audit.
   - Expiry scheduler.
   - Renewal/successor flow.

4. **Phase 32.6-Fix D — Permissions, Audit, Notifications, Reports & UI**
   - Granular permissions, audit event coverage, notifications, reports, and customer-facing UI.

## Y. Next Recommended Phase

**Phase 32.6-Fix A — Reservation Core Data Model & Atomic Accounting Foundation**

Rationale: the approved accounting and data-integrity foundation is missing. Building UI or reports first would preserve the current unsafe split between reservation rows, asset status patches, and deposit invoices.
## Z. Phase 32.6-Fix A Implementation Addendum

Fix A added the approved core foundation:

- Additive reservation master fields for branch, currency, totals, final-invoice placeholder, workflow version, legacy marker, optimistic version, and created/updated-by.
- `reservation_items` for asset-backed multi-item foundation with active-asset uniqueness protection.
- `reservation_payments` for immutable posted payment/receipt records with idempotency and journal linkage.
- Dedicated reservation service and routes replacing generic financial/inventory writes through `setupCrud`.
- Atomic reservation creation: customer/branch validation, deterministic asset locks, server-side totals, asset reservation, optional initial payment, audit events, and rollback on failure.
- Reservation payment posting foundation: amount validation, overpayment prevention, configured advances-account validation, source type `reservation_payment`, and balanced journal posting.
- Minimal frontend safety: no separate asset PATCH after reservation creation, no reservation deposit invoice, no frontend VAT/tax/subtotal metadata.

Legacy protection:

- Existing rows remain readable as legacy.
- Existing `deposit` values were not converted into new payment records.
- No historical receipts or journals were fabricated.

Still deferred:

- final sale completion and advance settlement
- refund approval/execution
- automatic expiry scheduler
- renewal/repricing
- post-creation add/remove/replace item workflows
- reports
- customer statement reservation section
- notifications
- granular reservation permissions
- full multi-item UI

## Z2. Phase 32.6-Fix B Implementation Addendum

Fix B (backend commit `7e1d390`, closed by `feat: close reservation completion refund
workflow`) resolves the previously-conflicting completion and refund gaps. Full detail:
`PHASE-32.6-FIX-B.md`.

Now implemented and verified live against local `darfus_erp`:

- **Final sale completion & advance settlement** — a fully-paid, non-legacy reservation
  completes atomically into one final sales invoice built from current active items. The agreed
  reservation price is **VAT-inclusive**: net and VAT are extracted from the gross total (no
  VAT added on top, no double taxation). Sales revenue, VAT output, and COGS/inventory post once
  each via the established `postInvoiceEntry` path; a separate settlement journal debits
  Customer Reservation Advances and credits AR, netting customer AR to zero. Posted payments are
  applied through immutable `reservation_payment_applications`.
- **Asset-backed inventory movement** — additive, forward-only migration
  `20260711021000-stock-movement-asset-reference.js` adds nullable `asset_id` (FK → assets) and
  index to `stock_movements` and relaxes `product_id` to nullable, so a serialized asset sale
  records exactly one inventory-out movement. Existing product-backed movements and the product
  FK are preserved; the migration created no business records.
- **Cancellation** — releases reserved assets to Available; paid reservations enter
  `cancelled_refund_pending`; no sales/refund accounting is posted; duplicate cancellation is
  idempotent.
- **Refunds** — full-only request → approval/rejection → execution, each separate. Execution
  posts Dr Customer Reservation Advances / Cr selected Cash/Bank only, links original payments
  via `reservation_refund_allocations`, and marks the reservation `refunded`. Method-difference
  requires override approval; duplicate/early execution is blocked; a forced posting failure
  rolls execution back completely.
- **Integrity** — completion, concurrency, idempotency, and both completion and refund rollback
  paths verified live: exit 0, **LIVE TESTS EXECUTED**, **No persistent test pollution
  detected**, before/after counts identical.
- **Frontend** — minimal permission-aware wiring on `/sales/reservations` (dedicated endpoints
  only, no generic PATCH, no trusted financial values, loading/confirmation guards, RTL/LTR).

Still deferred to Fix C / Fix D:

- automatic expiry scheduler and notifications
- renewal / successor reservations
- post-creation multi-item add/remove/replace and repricing
- reservation reports
- customer statement reservation section
- full granular reservation permission matrix
- full multi-item reservation UI

Next recommended phase: **Phase 32.6-Fix C — Multi-Item Changes, Automatic Expiry & Renewal**.

## Z3. Phase 32.6-Fix C Implementation Addendum

Fix C (commit `feat: add reservation amendments expiry and renewal`) closes the remaining
conflicting/partial reservation lifecycle gaps. Full detail: `PHASE-32.6-FIX-C.md`. Verified live
against local `darfus_erp` (**LIVE TESTS EXECUTED**, no persistent pollution).

- **Item amendments** — atomic add/remove/replace/reprice on active reservations via a dedicated
  endpoint. Prices are resolved server-side from asset records; the client submits asset ids only.
  Totals/paid/remaining/status are recomputed server-side; an amendment that would push total below
  paid, or leave zero active items, is rejected (no partial refund of an active reservation).
  Removed/replaced-out items are preserved as `released`; original payments are never edited. No
  sales/VAT/AR/COGS/inventory/cash/advance journal is posted. Immutable amendment master + detail
  capture before/after evidence; idempotent; full rollback on failure; concurrency-safe.
- **Expiry** — extension (later-only, before the trusted-time expiry, immutable history, no
  posting) and no-grace automatic expiry (`expires_at <= now()`, `FOR UPDATE SKIP LOCKED`, per-row
  transaction, reuses the cancellation release path) that releases assets, preserves payments,
  posts no refund/sale/journal, and moves paid → `cancelled_refund_pending` / unpaid → `cancelled`
  with `expired_by_system` metadata. A fully paid expired reservation is not auto-completed. A
  guarded, test-isolated `setInterval` scheduler drives it in production.
- **Renewal** — automatically expired reservations renew into a linked successor at current server
  prices. The eligible advance balance transfers via an immutable `reservation_payment_transfers`
  subledger with **no GL journal** (Advances liability, customer, branch, company, currency
  unchanged → zero net GL impact) and no cash/bank/revenue/VAT/AR/COGS/inventory movement. Higher/
  equal successor totals activate immediately; a lower total raises a distinct `renewal_excess`
  refund (Dr Advances / Cr Cash, approve → execute, full rollback safety) that gates activation.
  Original payments remain immutable; duplicate renewal/transfer and concurrent renewal-vs-refund
  double-use are prevented.
- **Integrity** — amendment/expiry/renewal, accounting, concurrency, idempotency, and rollback
  paths verified live with before/after counts identical and no persistent test pollution.

Still deferred to Fix D: full granular permission matrix, notification delivery, reservation
reports, customer-statement reservation section, full UI redesign, cross-company/branch/currency
renewal, partial active-reservation refunds.

Next recommended phase: **Phase 32.6-Fix D — Permissions, Audit, Notifications, Reports & Full UI**.

## Z4. Phase 32.6-Post-C Implementation Addendum

Post-C (commit `feat: wire POS reservation deposits and account configuration`) makes the
reservation deposit workflow operable end-to-end. Detail: `PHASE-32.6-POST-C-POS-RESERVATION.md`.

- **Accounting configuration** — the previously backend-only `reservationAdvancesAccountId` setting
  is now configurable from Accounting Settings (active credit-nature liability accounts only,
  backend re-validated), resolving the "Reservation advances account is not configured" gap. Errors
  are stable-coded and bilingual (422); no account code is hardcoded and there is no silent
  fallback.
- **Mandatory initial payment** — manual reservation creation now requires an initial payment > 0
  (and ≤ total) and a payment method; the earlier behavior allowing zero/absent initial payment is
  superseded. Internal Fix C renewal successors are exempt (funded by advance transfer). Later
  payments remain unlimited and unscheduled; no installment schedule was added.
- **POS deposit** — the POS `Deposit / عربون` action now opens a dedicated reservation dialog and
  creates a reservation via the reservation API (never a sales invoice), submitting only asset ids
  and operational fields. Missing configuration disables reservation confirmation while the normal
  sale path remains available.
- **Verified live** against local `darfus_erp` (**LIVE TESTS EXECUTED**, no persistent pollution,
  prior setting restored): missing/invalid account and missing/zero/negative/over-total/missing-
  method rejections; valid multi-item atomic creation with Dr Cash / Cr Advances only (no
  sales/VAT/AR/COGS/inventory or invoice); partial/fully-paid status; idempotency; rollback;
  unlimited later payments; overpayment rejection; intact internal renewal. No migration required.

Next recommended phase: **Phase 32.6-Fix D — Permissions, Audit, Notifications, Reports & Full UI**.
