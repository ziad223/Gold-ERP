# P4 — Draft / Post / Cancel — Discovery & Implementation Plan (P4.0)
> Discovery + design ONLY. No operational code changed in P4.0.
> Date: 2026-06-19.

## 1. Current flow map
Every invoice today is **created already-posted** in a single transaction. There is
**no draft state** anywhere.

```
POS sale:        use-pos.ts ──POST /pos/checkout──────────┐
Reservation→inv: reservations page ──POST /sales/invoices/draft (MISNAMED — posts!) ┤
Return:          ──POST /sales/returns─────────────────────┤
Exchange:        ──POST /sales/exchanges───────────────────┘
                         │ (all four, inside one DB transaction or sequentially)
                         ▼
        create Invoice (postedAt = now)  +  InvoiceItems
        + Asset.status = "sold"            (inventory deduct)
        + posting.service.postInvoiceEntry / postReturnEntry / postDepositEntry  (JE)
        + Installment schedule (installment sales)
        + customer.balance += remaining   (POS checkout only)
        + awardLoyaltyForSale             (sale/installment)
        + audit + notification + SSE
```

Read path: `setupCrud("invoices", …)` → `GET /invoices`. Reports/customer/branch
aggregations query `Invoice` directly.

## 2. Current invoice fields & meanings (`backend/src/models/invoice.model.js`)
| field | meaning today |
|---|---|
| `type` | sale / return / exchange / deposit / repair (ENUM) |
| **`status`** | **PAYMENT status**: paid / partial / due / returned / cancelled (ENUM). NOT a lifecycle. |
| `total`,`tax`,`vatRate`,`subtotal`,`discount`,`makingCharge`,`stoneValue`,`deposit` | money |
| `paymentMethod`,`paymentSplits`,`paidAmount`,`remainingAmount`,`downPayment` | payment |
| `installmentCount`,`installmentFrequency`,`guarantorName/Phone` | installment |
| `idempotencyKey` | dedup (used by checkout/returns/exchanges/draft route) |
| **`postedAt`** | timestamp string — **set on creation everywhere**; never used as a gate |
| **`cancelledAt`**, **`cancelReason`** | columns EXIST but are **never written or read** (dead scaffolding) |
| `relatedInvoiceId` | links returns/exchanges to original |

**No `postingStatus` / `lifecycleStatus` field exists.**

## 3. Endpoints related to invoices
| endpoint | what it really does | caller |
|---|---|---|
| `POST /pos/checkout` | create + **post** (full pipeline) | `use-pos.ts` |
| `POST /sales/invoices/draft` | **MISNOMER — creates + posts** (postedAt, sold, JE, installments, loyalty) | `sales/reservations/page.tsx` |
| `POST /sales/returns` | create + post return | returns page |
| `POST /sales/exchanges` | create + post exchange | exchanges page |
| `GET/PUT/PATCH/DELETE /invoices` | generic CRUD (`setupCrud`) | sales/customer pages |
| (none) | **no cancel/void endpoint exists** | — |

## 4. Where posting actually happens now
Inline in each of the 4 create routes:
- Inventory deduct: `Asset.update({status:"sold"})` (checkout ~405, draft ~4494).
- Journal: `postingService.postInvoiceEntry/postReturnEntry/postDepositEntry`.
- Payment/treasury: inside `/pos/checkout` (cash_in + payment); installment pay separate.
- Customer balance: `/pos/checkout` only (`customer.balance += remaining`).
- Loyalty: `awardLoyaltyForSale` (checkout + draft route).
- `postedAt` is stamped at create time in all 4.

## 5. Is there a valid draft endpoint?
**No.** `/sales/invoices/draft` is misnamed and posts immediately; it is live (reservations
use it), so it must **not** be repurposed. There is no real draft anywhere.

## 6. Do we need a migration? Proposed columns
**Yes — one additive migration** (in P4.1, not now):
- `posting_status` ENUM(`draft`,`posted`,`cancelled`) on `invoices`, **default `posted`**
  → all existing rows + the immediate-post paths stay `posted` (backward compatible).
- `postedAt`, `cancelledAt`, `cancelReason` **already exist** — reuse them (no new columns).
- No data backfill needed beyond the column default. Additive, non-destructive.

**Critical naming rule:** keep `status` = payment status. Introduce `posting_status` as a
**separate** lifecycle field. Never overload `status`.

## 7. Proposed phased implementation

### P4.1 — DB / model foundation
- Additive migration: add `invoices.posting_status` ENUM default `posted`.
- Add `postingStatus` to `invoice.model.js`.
- All 4 existing create paths explicitly set `postingStatus:"posted"` (no behavior change).
- **Acceptance:** migration additive; existing invoices read as `posted`; POS/returns/
  exchanges/reservations unchanged; tsc/build pass; verify script confirms default.

### P4.2 — Draft create / edit / cancel (NEW endpoints, no posting side-effects)
- `POST /sales/invoices/drafts` (NEW path — note plural, avoids the misnamed route):
  create `postingStatus:"draft"`, **NO** inventory deduct / JE / payment / customer balance / loyalty.
- `PATCH /sales/invoices/:id` guarded to **draft only** (edit lines/customer/amounts).
- `POST /sales/invoices/:id/cancel`: draft only → `postingStatus:"cancelled"`,
  `cancelledAt`, `cancelReason`, audit. No accounting reversal, no inventory change.
- **Acceptance:** draft creates touch nothing financial/inventory; cancel only affects drafts;
  audit recorded; posting a cancelled/again-cancel is rejected.

### P4.3 — Post a draft
- `POST /sales/invoices/:id/post`: draft → posted. Runs the SAME pipeline as checkout
  (inventory, JE, payment/cash, customer balance, loyalty, postedAt, audit), **idempotent**,
  inside one transaction; rejects if already posted/cancelled.
- Extract the shared "post pipeline" into a helper so checkout and post-draft agree.
- **Acceptance:** posting a draft deducts inventory once, JE balanced once, no double post;
  re-post returns the posted invoice; cancelled drafts cannot be posted.

### P4.4 — POS integration (keep fast path)
- POS `/pos/checkout` stays **immediate-post** (create draft → post in the same transaction
  internally, OR unchanged). No UX regression. Optionally add a "Save as draft" action that
  hits P4.2.
- **Acceptance:** POS behaves exactly as today; optional draft action works; no double effects.

### P4.5 — Reports / customer filtering
- Exclude `posting_status IN ('draft','cancelled')` from: sales reports, customer/branch
  invoice counts, customer balance, dashboards. Audit each `Invoice.findAll/count`.
- **Acceptance:** drafts/cancelled never counted as sales; balances exclude drafts;
  numbers match pre-P4 for posted-only data.

## 8. Expected files to change (by phase)
- **P4.1:** `backend/migrations/<new>-invoice-posting-status.js`, `backend/src/models/invoice.model.js`, the 4 create routes (set `postingStatus:"posted"`).
- **P4.2/P4.3:** `backend/src/routes/erp.routes.js` (new draft/cancel/post routes + shared post helper), maybe `backend/src/services/sales.service.js`.
- **P4.4:** `features/sales/hooks/use-pos.ts`, `app/[locale]/(dashboard)/pos/page.tsx`.
- **P4.5:** report/customer/branch aggregation queries in `erp.routes.js`; sales/customer pages + reports pages; `lib/types.ts` (add `postingStatus`).
- i18n `messages/ar.json` + `en.json` (draft/cancel labels).

## 9. Risks (P4)
- **Break POS** if checkout pipeline is refactored carelessly → mitigate: extract a shared
  helper with identical behavior + verify; keep checkout immediate-post.
- **Double inventory deduct / double JE** if post-draft re-runs → mitigate: transactional
  + `postingStatus` guard + idempotency.
- **`status` vs `posting_status` confusion** → mitigate: strict separation, never overload.
- **Reports count drafts as sales** (current aggregations have NO status filter) → mitigate: P4.5.
- **customer.balance affected before post** → mitigate: drafts never touch balance/loyalty.
- **Cancel-after-post** must be a return/void, NOT a simple cancel → P4 cancel is **draft-only**;
  posted invoices keep using returns/exchanges (out of P4 scope).
- Dead `cancelledAt`/`cancelReason` columns get activated — verify no stale assumptions.

## 10. Recommendation
**Start with P4.1** (DB/model foundation) — it is the smallest, fully additive, zero-behavior-
change step (column default `posted`), and unblocks everything else. Each subsequent phase
keeps its own stop-gate. No step before P4.1 is required.
