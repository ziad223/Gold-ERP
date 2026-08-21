# DARFUS ERP — Loose Diamond First Controlled UI Receive Acceptance Report

## 1. Executive Summary

تمت مراجعة runtime المحلي على `localhost:3000` و`localhost:8000` مع Company/Branch context مصادق عليه. نجح تحميل AR وEN ونجح Profile Preview في AR، لكن Shared Receive Preview فشل في runtime الحالي، لذلك تم تفعيل hard stop قبل backup وقبل أي Receive. لم يتم إنشاء PO أو Asset أو Barcode أو Movement أو Journal أو Payment.

السبب المثبت من مقارنة runtime بالمصدر هو أن الـfrontend المبني حاليًا كان يرسل عنصر Loose Diamond بدون `perPiece[]`، بينما Supplier V2 يفرض `perPiece.length = quantity`. أُضيف minimum safe source correction في نفس الصفحة، لكن runtime الحالي هو `next start` مبني قبل التصحيح، ولم يُشغّل build بسبب قيد الحماية الحالي على `next-env.d.ts`/build. لذلك لا يجوز اعتبار القبول ناجحًا.

## 2. Runtime Health

| Check | Actual | Evidence | Status |
|---|---|---|---|
| Frontend | `localhost:3000` reachable | Browser AR/EN DOM snapshots | PASS |
| Backend | Docker `darfus-backend` up | `docker compose ps` | PASS |
| `GET /api/v1/health` | 200 | `status=UP` | PASS |
| `GET /api/v1/health/db` | 200 | PostgreSQL connected | PASS |
| `GET /api/v1/health/redis` | 200 | Redis connected | PASS |
| Database target | `darfus_erp` | `SELECT current_database()` | PASS |

## 3. Authenticated Company/Branch Context

| Item | Actual | Status |
|---|---|---|
| Authenticated session | Existing session loaded without credential output | PASS |
| Company | Gold ERP | PASS |
| Branch | Branch-1 | PASS |
| Loose Diamond contract | Supplier, Location, tax treatment and master selectors loaded | PASS |
| Contract endpoint | Authenticated route loaded successfully in AR/EN | PASS |

## 4. AR Runtime Review

`/ar/inventory/loose-diamond` loaded under the authenticated context. The synthetic input was entered: Diamond, Natural Diamond, F/G, VS1, Excellent, Round, Australia, 1.25 CT, purchase 5000 AED, current value 6200 AED, selling price 8000 AED, STANDARD_VAT. Profile Preview reached READY. The current built page then showed `Shared Preview: غير جاهزة` and `An unexpected server error occurred.`

## 5. EN Runtime Review

`/en/inventory/loose-diamond` loaded successfully with the same server-backed selectors and no relevant console warning/error in the captured browser log. No Receive was attempted. It was not advanced to a final preview because the shared-preview gate had already failed in the same current build.

## 6. DB Baseline

Read-only snapshot before any possible mutation:

| Entity | Count |
|---|---:|
| purchase_orders | 9 |
| purchase_order_items | 9 |
| assets | 9 |
| asset_components | 6 |
| asset_diamond_component_details | 6 |
| asset_barcode_history | 9 |
| asset_rfid_assignments | 2 |
| asset_origins | 9 |
| asset_purchase_cost_revisions | 9 |
| asset_current_valuations | 9 |
| inventory_asset_movements | 9 |
| journal_entries | 12 |
| journal_lines | 33 |
| cash_transactions | 3 |
| audit_logs | 63 |
| idempotency_requests | 12 |
| profile_master_data | 660 |
| LOOSE_DIAMOND assets | 0 |
| unbalanced posted journals | 1 |

Migration metadata was observed read-only at 87; latest migration is `20260821010000-loose-diamond-master-data-and-multicolor.js`.

## 7. Pre-Receive Backup

`PRE_RECEIVE_BACKUP = NOT_RUN_HARD_STOP`.

The required fresh backup was intentionally not created because the pre-receive Shared Preview gate failed. No Receive POST was allowed.

## 8. Controlled Synthetic Input

The values were synthetic QA values only. No RFID, certificate, image, attachment, payment, or second stone was used.

## 9. Profile Preview

`PROFILE_PREVIEW = READY` in AR. Observed server-derived values were purchase base `5000.00`, purchase VAT `700.00`, purchase total `5700.00`, consistent with the current server preview output of a 14% configured VAT rate. No frontend VAT was manually calculated.

## 10. Shared Preview

`SHARED_PREVIEW = FAIL` in the current built runtime. The UI displayed the server error and never produced the shared tax summary or final prepared request.

## 11. Preview Parity

`PREVIEW_SHARED_PARITY = NOT PROVABLE` and therefore `NO RECEIVE`. The final acceptance requires profile base = shared tax base = prepared unit cost = per-piece purchase cost; the shared preview did not reach READY.

## 12. Exact Prepared Request

No authoritative final request was available in the current runtime because the shared preview did not complete. The source correction now prepares one frozen request with:

- `inventoryV2: true`
- `profile: LOOSE_DIAMOND`
- `quantity: 1`
- `perPiece.length: 1`
- `DD / LOS / 00`
- pre-tax purchase base mapping
- `taxIncluded: false` and server/tax-treatment-derived `applyVat`
- exact request/key/fingerprint retention

This source behavior is not yet runtime-proven in the current build.

## 13. Confirmation

No confirmation screen was opened. The current runtime showed Receive disabled. This is compliant with the hard stop; no confirmation bypass was used.

## 14. Original UI Receive

`ORIGINAL_UI_RECEIVE = NOT_EXECUTED`. `POST /api/v1/purchase-orders/receive` was not called. `SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 0`.

## 15–25. Persistence and Financial Proof

Not run because the pre-receive gate failed. Consequently there is no new PO, PO item, Asset, Barcode, cost revision, current valuation, origin, movement, tax snapshot, payable, journal, replay, or conflict request to verify.

Expected proofs remain pending and were not inferred.

## 26. Exact Idempotency Replay

Not run. No key was sent to the Receive endpoint.

## 27. Same-Key Conflict

Not run. No business idempotency key was sent to the Receive endpoint.

## 28. Final DB Deltas

No Receive was attempted; no acceptance business delta was introduced by this control. The read-only baseline is the only DB snapshot used here.

## 29. Master Data No-Mutation

No master-data insert/update/delete, supplier change, location change, tax-setting change, barcode-master change, seed, or migration execution was performed in this control.

## 30. AR Asset Details

Not applicable: no new Asset exists from this control.

## 31. EN Asset Details

Not applicable: no new Asset exists from this control.

## 32. Network / Backend Logs

Observed read-only calls were health, contract, profile preview, and shared receive-preview. No final Receive call was observed or initiated. Browser logs contained no relevant console error beyond the UI-reported server-preview failure.

## 33. Focused Tests

`node --test backend/tests/loose-diamond-minimum-safe-implementation.test.cjs` — **6/6 PASS**.

The tests cover master-data authority, CT/multi-color preview, validation, Supplier V2 pre-tax normalization, shared-preview tax semantics, and DD/LOS/00 barcode authority.

## 34. Regression / Typecheck

`npm run typecheck` — **PASS**.

No broad regression suite was run after the runtime hard stop. No migration was created or executed in this control.

## 35. Existing Unrelated Financial P0

Preserved unchanged. Read-only evidence for `JE-1787090870905`: debit `2133.21000000`, credit `2133.22000000`, difference `-0.01000000`. No correction or cleanup was performed.

## 36. Files Changed If Runtime Fix Was Needed

This control made one narrow source correction in:

`app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx`

Correction scope: canonical `perPiece[]` payload, retained exact request/key/fingerprint, final confirmation gate, and post-success replay/conflict controls in the same canonical page. No backend, migration, config, DB, or production files were intentionally changed by this control. The worktree already contained extensive pre-existing user changes; they were not cleaned, reset, or claimed.

## 37. P0 / P1

| ID | Finding | Classification | Priority | Evidence | Impact |
|---|---|---|---|---|---|
| LD-ACCEPT-001 | Current built frontend sends/uses a non-canonical Loose Diamond shared-preview shape without `perPiece[]`; V2 requires it. | PRODUCT_DEFECT / RUNTIME_BUILD_DRIFT | P1 | UI shared-preview error; backend `requireV2ReceiptPieces()` requires `perPiece` and exact length. | Blocks the first controlled Receive and all financial/idempotency proof. |
| LD-ACCEPT-002 | Source correction is not served by the current `next start` build. | ENVIRONMENT_CONFIG / ACCEPTANCE_GAP | P1 | Browser still shows old read-only text and disabled button after source correction; build is currently protected by the active no-build guard. | Prevents runtime proof of the correction. |

No P0 was created. No business mutation occurred.

## 38. Gate

`GATE = BLOCKED_BEFORE_LOOSE_DIAMOND_FIRST_RECEIVE`.

The gate is blocked because `SHARED_PREVIEW = NOT_READY` in the actual runtime. The source correction must be served by an approved normal frontend rebuild/reload, then AR/EN preview parity, fresh backup, and the single controlled Receive gate must be rerun. This report does not authorize that next action.

## 39. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-FIRST-CONTROLLED-UI-RECEIVE-ACCEPTANCE
LOCAL_MAIN_DB = darfus_erp
AUTHENTICATED_SESSION = PASS
COMPANY_CONTEXT = PASS
BRANCH_CONTEXT = PASS
AR_ROUTE = PASS
EN_ROUTE = PASS
CONTRACT_HTTP = PASS_AUTHENTICATED
PRE_RECEIVE_BACKUP = NOT_RUN_HARD_STOP
PRE_RECEIVE_BACKUP_PATH = NONE
PRE_RECEIVE_BACKUP_SHA256 = NONE
CONTROLLED_STONE_NAME = Diamond
CONTROLLED_CARAT = 1.25
CONTROLLED_COLORS = F,G
CONTROLLED_PURCHASE_BASE = 5000.00
CONTROLLED_CURRENT_VALUE = 6200.00
CURRENT_CONFIGURED_VAT_RATE = 14% OBSERVED_FROM_SERVER_PREVIEW
PROFILE_PREVIEW = READY_AR
PROFILE_PURCHASE_BASE = 5000.00
PROFILE_PURCHASE_VAT = 700.00
PROFILE_PURCHASE_TOTAL = 5700.00
SHARED_PREVIEW = FAIL_CURRENT_BUILT_RUNTIME
PREVIEW_SHARED_PARITY = NOT_PROVABLE
PREPARED_RECEIVE_UNIT_COST = NOT_RUNTIME_PROVEN
PREPARED_PURCHASE_COST = NOT_RUNTIME_PROVEN
PREPARED_BARCODE_AUTHORITY = DD_LOS_00_SOURCE_ONLY
EXACT_REQUEST_CAPTURED_BEFORE_POST = NO_POST_OCCURRED
IDEMPOTENCY_KEY_CAPTURED_BEFORE_POST = NO_POST_OCCURRED
ORIGINAL_UI_RECEIVE = NOT_EXECUTED
SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 0
NEW_PO = 0
NEW_PO_ITEM = 0
NEW_ASSET = 0
NEW_BARCODE = 0
NEW_JOURNAL = 0
ONE_STONE_ONE_ASSET = NOT_RUN
NO_GOLD_FIELDS = PASS
BARCODE_DD_LOS_00 = SOURCE_PASS_RUNTIME_PENDING
MULTI_COLOR_PERSISTENCE = NOT_RUN
PURCHASE_COST_REVISION = NOT_RUN
CURRENT_VALUATION_TOTAL = NOT_RUN
HISTORICAL_CURRENT_SEPARATION = SOURCE_PASS_RUNTIME_PENDING
TAX_SNAPSHOT_PARITY = NOT_RUN
SUPPLIER_PAYABLE = NOT_RUN
PAYMENT_EXECUTED = NO
NEW_JOURNAL_BALANCE = NOT_RUN
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_REPLAY_SAME_PO = NA
IDEMPOTENCY_REPLAY_SAME_ASSET = NA
IDEMPOTENCY_CONFLICT = NOT_RUN
DUPLICATE_BUSINESS_ROWS = 0_FROM_THIS_CONTROL
AR_ASSET_DETAILS = NOT_RUN
EN_ASSET_DETAILS = NOT_RUN
MASTER_DATA_MUTATION = NO
RFID_ASSIGNED = NO
FOCUSED_TESTS = PASS_6_OF_6
REGRESSION_TESTS = NOT_RUN_AFTER_HARD_STOP
TYPECHECK = PASS
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 2_ACCEPTANCE_BLOCKERS
GATE = BLOCKED_BEFORE_LOOSE_DIAMOND_FIRST_RECEIVE
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — لا يوجد Receive أو Payment أو RFID أو cleanup أو DB correction في هذا التحكم.**
