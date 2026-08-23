# Phase 32.6-Fix B — Reservation Final Sale Completion & Refund Settlement

## Scope

Implemented the final sale completion, advance settlement, cancellation, and full-refund workflow on top of the Fix A reservation foundation (backend commit `7e1d39017ce5ec37dac5fd47e9c78edd7c450ab3` — `feat: add reservation completion refund settlement`), plus the closure work: a VAT-inclusive completion correction, an asset-backed stock movement schema, a gated local live verifier, and minimal permission-aware frontend wiring.

This phase does **not** implement multi-item post-creation changes, automatic expiry, renewal, partial refunds, reservation reports, customer statement sections, notifications, or the full granular permission matrix. Those remain deferred to Fix C / Fix D.

## Backend Implementation (commit 7e1d390)

`backend/src/services/reservation.service.js` provides dedicated transactional workflow methods:

- `completeSale` / `_completeSaleInTransaction`
- `cancelReservation`
- `requestRefund`, `approveRefund`, `rejectRefund`
- `executeRefund` / `_executeRefundInTransaction`

Supporting immutable ledgers were added in the foundation migration `20260711020000-reservation-completion-refund-foundation.js`:

- `reservation_payment_applications`
- `reservation_refunds`
- `reservation_refund_allocations`

plus reservation columns `completed_at`, `completed_by`, `cancelled_at`, `cancelled_by`, `cancellation_reason`, `refunded_at`, `refund_status`, and statuses `cancelled_refund_pending` and `refunded`.

## Closure Changes

### VAT-inclusive completion correction

The agreed reservation price is **VAT-inclusive**. The earlier completion path used the generic `salesService.computeTotals(...)`, which treated the agreed price as tax-exclusive and added VAT on top — double taxation.

The corrected path uses a local `vatInclusiveTotalsFromGross(grossTotal, vatRatePercent)`:

- `taxBase = round(total / (1 + rate/100))`
- `tax = round(total - taxBase)`
- `total` is unchanged (equals the agreed reservation total)

The invoice is persisted with `subtotal = taxBase`, `tax = tax`, `total = agreed total`. `postInvoiceEntry` consumes the stored `subtotal`/`tax`/`total` directly (it does not recompute VAT), so sales revenue, VAT output, and the AR debit each post exactly once with no second VAT layer.

Live evidence (asset price 105, VAT 5%): invoice `total = 105`, `tax = 5`, `subtotal = 100`.

### Asset-backed stock movement schema

Serialized assets have no `product_id`, and the live path proved `stock_movements` required `product_id NOT NULL`, so an individually tracked asset sale could not be represented safely.

New additive, forward-only migration `20260711021000-stock-movement-asset-reference.js`:

- adds nullable `asset_id` to `stock_movements` with FK → `assets(id)` (`ON DELETE SET NULL`)
- relaxes `product_id` to nullable (only when it was `NOT NULL`)
- adds index `stock_movements_asset_id_idx`
- `down()` is disabled (forward-only foundation)

Existing product-backed movements and the `product_id → products` FK are preserved. Model changes: `stockMovement.model.js` adds nullable `assetId`; `models/index.js` adds the `Asset ⇄ StockMovement` association.

During final sale completion, exactly one `type: "sale"` stock movement is created per sold asset (`referenceType: "reservation_final_sale"`, `referenceId = invoiceId`, `assetId` set, `productId: null`).

## Completion Architecture

For each fully-paid, new-workflow (non-legacy) reservation, inside one transaction:

1. Lock items, posted payments, and reserved assets.
2. Require `paid total == agreed total`; reject partial/unpaid.
3. Reject if payments were already applied (idempotency guard) or the total no longer matches (reprice guard).
4. Create the final `sale` invoice (VAT-inclusive totals, `status: paid`, `paymentMethod: reservation_advance`).
5. Per asset: create invoice item, mark asset + item `sold`, create the asset-linked stock movement, and record an `AssetEvent`.
6. Post the sale journal via `postInvoiceEntry` (AR debit path).
7. Post the advance-settlement journal via `postReservationAdvanceSettlementEntry`.
8. Record `reservation_payment_applications` linking each posted payment to the final invoice and settlement journal.
9. Mark the reservation `completed` with the final invoice link.

Any failure rolls back the entire transaction — no invoice, item, asset change, stock movement, journal, or application remains. Concurrency and idempotency are enforced: concurrent completes yield exactly one invoice; a repeated idempotency key replays a stable result; a different key on an already-completed reservation is rejected.

## Accounting Result

**Sale journal** (`source_type: invoice`):

- Dr Accounts Receivable (1300) — agreed (gross) total
- Cr Sales Revenue (4100) — net (taxBase)
- Cr VAT Output (2200) — extracted VAT
- Dr COGS (5000) / Cr Inventory (1200) — asset cost

**Advance settlement journal** (`source_type: reservation_settlement`, `source_id = reservation.id`):

- Dr Customer Reservation Advances — total
- Cr Accounts Receivable (1300) — total

Net AR after settlement is **zero**. Sales, VAT, COGS, and inventory post once each.

## Cancellation Behavior

Eligible reservations cancel and release their assets back to `available`. Posted payments are unchanged. No sales, VAT, COGS, inventory, or refund accounting is posted during cancellation. A paid reservation transitions to `cancelled_refund_pending`. Duplicate cancellation is idempotent and creates no additional accounting. Terminal reservations (`completed`, `refunded`) cannot be cancelled.

## Refund Workflow

- **Full refund only** (partial refund requests are rejected).
- **Request** posts no accounting.
- **Approval** is separate from **execution**; execution before approval is rejected.
- A refund method that differs from the original payment method requires explicit override approval before execution.
- **Execution** posts, via `postReservationRefundEntry` (`source_type: reservation_refund`):
  - Dr Customer Reservation Advances
  - Cr selected Cash/Bank (treasury account)
  - No sales/VAT/COGS/inventory/AR reversal.
- Refund allocations link the original reservation payments. The reservation becomes `refunded` only after successful execution. Duplicate execution is prevented (same key replays; different key rejected). A forced posting failure rolls the execution back completely (refund stays `approved`, no journal, no cash movement).

## Frontend Wiring

`app/[locale]/(dashboard)/sales/reservations/page.tsx` — minimal, permission-aware Fix B UI:

- Reservation list + detail modal (items, payments, refunds, completion/cancellation metadata).
- Dedicated endpoints only — `POST .../complete-sale`, `.../cancel`, `.../refunds`, `/reservation-refunds/:id/approve|reject|execute`. **No generic PATCH** for Fix B transitions.
- The client submits **no** trusted financial values (invoice total, VAT, net, COGS, settlement, refund amount, journal lines, reservation status, or asset status). Server-derived values only; completion posts an empty body.
- Idempotency keys on completion and refund execution.
- Permission gates: `sales.create` (complete), `sales.approve` (cancel / request refund), `approvals.manage` (approve / reject), `treasury.update` (execute).
- Action visibility: Complete only for `fully_paid` without a final invoice; Cancel hidden for terminal states; Refund request only for `cancelled_refund_pending` with paid > 0; Approve/Reject only for `requested`; Execute only for `approved` (with method-override satisfied).
- Loading/duplicate-submit guards (`isActionBusy` + per-mutation `isPending`), confirmation dialogs, error surfacing, Arabic/English + RTL/LTR, and a server-response final-invoice link.

## Verification

### Static

- `scripts/verify-reservation-completion-refund-settlement.js` (static mode) — file/schema, model, posting-contract, service-contract, routes/permissions, frontend-contract, docs/package, and scope-guard assertions. Prints `STATIC ONLY — LIVE DATA NOT VERIFIED` when ungated.
- `scripts/verify-reservation-core-accounting-foundation.js` — the Fix A stale-guard for deferred cancellation was replaced with durable guards confirming the Fix B cancellation UI is safe (dedicated endpoint, no generic PATCH, no direct status/asset mutation, no client-side refund accounting). All other Fix A safety assertions are preserved.

### Live (gated)

Gates: `VERIFY_RESERVATION_SETTLEMENT_LIVE=true`, `VERIFY_DATABASE_NAME=darfus_erp`, local `darfus_erp@localhost:5433`, `NODE_ENV=development`. The live verifier creates isolated `T32B-*` records, exercises the full workflow (completion, VAT-inclusive extraction, stock movement, AR settlement to zero, idempotency, concurrency, rollback, cancellation, refund request/approve/reject/execute, method override, legacy rejection, refund rollback), then cleans only its namespace and asserts before/after counts are identical.

Result: exit `0`, **LIVE TESTS EXECUTED**, **No persistent test pollution detected**. Database counts before and after the live run are identical.

## Deferred Scope (Fix C / Fix D)

Not implemented and explicitly **not** marked complete:

- Multi-item post-creation add/remove/replace changes and repricing UI
- Automatic expiry scheduler and renewal
- Partial refunds
- Reservation reports and customer-statement reservation section
- Notification workflows
- Full granular reservation permission matrix

Next phase:

**Phase 32.6-Fix C — Multi-Item Changes, Automatic Expiry & Renewal** — now implemented; see
`PHASE-32.6-FIX-C.md`. The subsequent phase is
**Phase 32.6-Fix D — Permissions, Audit, Notifications, Reports & Full UI**.
