# DARFUS ERP — Loose Diamond Backend Decimal Runtime Fix + Preview Rerun

Control ID: `DARFUS-LOOSE-DIAMOND-DECIMAL-RUNTIME-FIX-PREVIEW-RERUN`

## 1. Executive Summary

تم تنفيذ إصلاح Backend واحد محدود لعطل runtime مثبت في مقارنة `stoneCostCanonical` مع `purchasePricePreTax`. كان الكود يستدعي `Decimal.neq()`، بينما نسخة Decimal المستخدمة فعليًا في Backend لا توفر هذه الدالة. استُبدلت المقارنة فقط بـ `!Decimal.eq()`، مع إبقاء قاعدة العمل، والدقة، والتحقق fail-closed كما هي.

نجحت اختبارات القيم المتساوية والمختلفة ودقة Decimal، ونجحت معاينة Loose Diamond في AR وEN، بما في ذلك Shared Receive Preview، ثم فُتحت شاشة التأكيد للقراءة فقط وأُلغيت قبل Receive. لم يُنفذ `POST /api/v1/purchase-orders/receive`، ولم تتغير بيانات الأعمال في `darfus_erp`.

## 2. Decimal Package / Version / Supported API

| Evidence | Result |
|---|---|
| Backend package | `decimal.js` |
| Backend runtime version | `10.6.0` |
| Backend package declaration | `^10.6.0` |
| Supported equality APIs | `eq`, `equals` |
| `neq` | `undefined` / unsupported |
| Narrow `.neq(` search | No remaining occurrence in the target service; no mass replacement performed |

The root frontend package declares `decimal.js` `10.5.0`; the affected code is Backend and the running Backend dependency was verified as `10.6.0`.

## 3. Exact Runtime Root Cause

Before the correction, the exact payload path with both aliases present and equal (`purchasePricePreTax=5000`, `stoneCostCanonical=5000`) reached:

`inventory-v2-runtime.service.js → looseProfileFinanceService.calculatePurchase()`

The failing expression was:

`new Decimal(String(legacyStoneCost)).neq(new Decimal(String(explicitPurchase)))`

The runtime exception was `TypeError: ...neq is not a function`, producing HTTP 500 from Shared Receive Preview. The business rule itself is preserved: when both values are supplied, `stoneCostCanonical` must equal `purchasePricePreTax`.

`ROOT_CAUSE = UNSUPPORTED_DECIMAL_METHOD_IN_LOOSE_DIAMOND_COST_ALIAS_EQUALITY_CHECK`

## 4. Source Correction

Changed only the affected comparison in:

- `backend/src/services/loose-profile-finance.service.js`

Correction:

```js
!new Decimal(String(legacyStoneCost)).eq(new Decimal(String(explicitPurchase)))
```

No rounding, precision, validation, tax, pricing, or profile rules changed.

`BUSINESS_LOGIC_CHANGED = NO`

`RUNTIME_API_COMPATIBILITY_FIXED = YES`

## 5. Equal-Value Regression

The focused test executes the affected finance/runtime path with:

- `purchasePricePreTax = 5000`
- `stoneCostCanonical = 5000`

Result: no exception, alias equality accepted, normalized purchase base = `5000.00000000`.

`STONE_COST_EQUAL_VALUES = PASS`

## 6. Different-Value Regression

With `purchasePricePreTax = 5000` and `stoneCostCanonical = 5001`, the canonical mismatch error is raised:

`LOOSE_DIAMOND_PURCHASE_PRICE_STONE_COST_MISMATCH`

The focused profile/route regression confirms invalid input is a client validation response (422), not an unexpected 500.

`STONE_COST_DIFFERENT_VALUES = CLEAN_VALIDATION_FAIL`

`STONE_COST_DIFFERENT_VALUES_HTTP = 422 in the route regression; direct service test asserts the canonical validation error`

## 7. Decimal Precision Regression

- `5000.00` and `5000` are accepted as equal Decimal values.
- `5000.00000000` and `5000.00000001` remain rejected.
- No JavaScript floating-point comparison or `Number` conversion was introduced in the equality guard.

`DECIMAL_PRECISION_REGRESSION = PASS`

## 8. Files Changed

Intentional files for this control:

- `backend/src/services/loose-profile-finance.service.js`
- `backend/tests/loose-diamond-minimum-safe-implementation.test.cjs`
- `docs/DARFUS_LOOSE_DIAMOND_DECIMAL_RUNTIME_FIX_PREVIEW_RERUN_REPORT.md`

The worktree contained extensive pre-existing changes and untracked artifacts. They were not cleaned, reset, stashed, or included as part of this control. Frontend product source files were not changed.

## 9. Focused Tests

Command:

`node --test backend/tests/loose-diamond-minimum-safe-implementation.test.cjs`

Result: **9/9 PASS**.

Coverage includes equal aliases, different aliases, Decimal precision, V2 normalization, one-time VAT, and barcode authority.

## 10. Relevant Regression

Passed:

- `node --test tests/diamond-negative-shared-preview.test.cjs` — 3/3
- `node --test backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs` — 5/5
- `node --test backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs` — 4/4
- `node --test backend/tests/phase-03b-g2c-receive-tax-location.test.cjs` — 4/4

No unrelated broad suite was run.

## 11. Typecheck

`npm run typecheck` — **PASS**.

## 12. Backend Restart

The normal Backend container was stopped and the corrected source was served through a single isolated Compose Backend process using:

`docker compose run -d --rm --no-deps --service-ports backend node src/server.js`

This avoided the Compose command that runs migrations. No migration or seed command was run in this control. The process served `localhost:8000` and was connected to the verified `darfus_erp` database for read-only preview calls.

`BACKEND_RESTART = PASS`

## 13. Backend/DB/Redis Health

| Check | Result |
|---|---|
| `GET /api/v1/health` | 200 |
| `GET /api/v1/health/db` | 200 |
| `GET /api/v1/health/redis` | 200 |
| Runtime DB | `darfus_erp` |
| Redis connection | Connected |
| Gold scheduler | Registered; no Gold mutation performed |

`BACKEND_HEALTH = PASS`

`DB_HEALTH = PASS`

`REDIS_HEALTH = PASS`

## 14. DB Baseline

Read-only baseline before and after browser proof:

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 9 | 9 | 0 |
| purchase_order_items | 9 | 9 | 0 |
| assets | 9 | 9 | 0 |
| asset_barcode_history | 9 | 9 | 0 |
| asset_origins | 9 | 9 | 0 |
| asset_purchase_cost_revisions | 9 | 9 | 0 |
| asset_current_valuations | 9 | 9 | 0 |
| inventory_asset_movements | 9 | 9 | 0 |
| journal_entries | 12 | 12 | 0 |
| journal_lines | 33 | 33 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 12 | 12 | 0 |
| LOOSE_DIAMOND assets | 0 | 0 | 0 |

`DB_BUSINESS_WRITES = 0`

## 15. Authenticated Company/Branch Context

The existing authenticated browser session was reused without displaying credentials.

- `AUTHENTICATED_SESSION = PASS`
- Company context: `Gold ERP`
- Branch context: `Branch-1`
- `COMPANY_CONTEXT = PASS`
- `BRANCH_CONTEXT = PASS`
- Authenticated contract route remained accessible; browser cache returned 304 for the already-loaded contract, with no contract failure.

`CONTRACT_HTTP = 304 (authenticated cache-valid response; preview routes returned 200)`

## 16. AR Profile Preview

Synthetic values only; no Receive was submitted.

| Value | Result |
|---|---:|
| Profile | LOOSE_DIAMOND |
| Purchase base pre-tax | 5,000.00 AED |
| Configured VAT rate | 14% |
| Purchase VAT | 700.00 AED |
| Purchase total | 5,700.00 AED |
| Current Diamond value pre-tax | 6,200.00 AED |
| Current VAT | 868.00 AED |
| Current valuation total | 7,068.00 AED |
| Minimum selling price | 8,000.00 AED |
| Expected profit | 932.00000000 AED |
| Profit margin | 13.18619129% |

Backend route: `POST /api/v1/inventory-v2/loose-diamond/preview = 200`.

`PROFILE_PREVIEW_AR = READY`

## 17. AR Shared Preview

Backend route: `POST /api/v1/inventory-v2/receive-preview = 200`.

Runtime shape:

- `inventoryV2 = true`
- `profile = LOOSE_DIAMOND`
- `quantity = 1`
- `perPiece.length = 1`
- `items[0].unitCost = 5000.00000000`
- `items[0].purchaseCost = 5000.00000000`
- `taxIncluded = false`
- server/treatment-derived VAT application

`SHARED_PREVIEW_AR = READY`

## 18. AR Preview Parity

| Field | Profile | Shared/Prepared | Result |
|---|---:|---:|---|
| Purchase base | 5,000.00 | 5,000.00 | PASS |
| VAT | 700.00 | 700.00 | PASS |
| Total | 5,700.00 | 5,700.00 | PASS |
| Current valuation | 6,200.00 pre-tax / 7,068.00 inclusive | Separate valuation object | PASS |

`PREVIEW_PARITY_AR = PASS`

`DOUBLE_VAT = NO`

## 19. EN Profile Preview

The equivalent synthetic data was entered on `/en/inventory/loose-diamond`. The server returned the same financial semantics and the UI showed:

- Profile Preview: READY
- Purchase base: AED 5,000.00
- Purchase VAT: AED 700.00
- Purchase total: AED 5,700.00
- Current VAT: AED 868.00
- Minimum selling price: AED 8,000.00

`PROFILE_PREVIEW_EN = READY`

## 20. EN Shared Preview

Backend route: `POST /api/v1/inventory-v2/receive-preview = 200`.

`SHARED_PREVIEW_EN = READY`

## 21. EN Preview Parity

The EN prepared request retained the same pre-tax unit/purchase costs, `taxIncluded=false`, `inventoryV2=true`, and one `perPiece` item as AR.

`PREVIEW_PARITY_EN = PASS`

## 22. Prepared Exact Request

The confirmation screen was opened in AR and EN for read-only inspection, then cancelled. The idempotency key is intentionally not printed.

| Prepared field | Runtime value | Result |
|---|---|---|
| profile | LOOSE_DIAMOND | PASS |
| inventoryV2 | true | PASS |
| quantity | 1 | PASS |
| perPiece | one item | PASS |
| inventoryCode / itemCode / karatCode | DD / LOS / 00 | PASS |
| carat | 1.25000000 CT | PASS |
| purchasePricePreTax | 5000.00000000 | PASS |
| items[0].unitCost | 5000.00000000 | PASS |
| items[0].purchaseCost | 5000.00000000 | PASS |
| perPiece[0].unitCost | 5000.00000000 | PASS |
| perPiece[0].purchaseCost | 5000.00000000 | PASS |
| taxIncluded | false | PASS |
| applyVat | true | PASS |
| currentDiamondValue | 6200.00000000 | PASS |
| colors | canonical F + G master references | PASS |
| RFID / attachments | absent | PASS |

`EXACT_REQUEST_RETAINED = YES`

`IDEMPOTENCY_KEY_RETAINED = YES`

`PREVIEW_FINGERPRINT_RETAINED = YES`

## 23. Runtime perPiece Proof

The confirmation payload displayed exactly one physical receive piece:

`RUNTIME_PER_PIECE_LENGTH = 1`

The payload preserved Asset-oriented V2 structure and did not expose Product quantity as physical authority.

## 24. Barcode DD/LOS/00 Preparation

The prepared request displayed server-backed barcode identity components:

`PREPARED_BARCODE_AUTHORITY = DD_LOS_00`

No barcode was allocated because Receive was not executed.

## 25. Network No-Receive Proof

Observed Backend logs after corrected restart:

- AR Profile Preview: HTTP 200
- AR Shared Receive Preview: HTTP 200
- EN Profile Preview: HTTP 200
- EN Shared Receive Preview: HTTP 200
- `POST /api/v1/purchase-orders/receive`: 0 occurrences
- Payment/mutation endpoints: 0 observed

The confirmation `Confirm Receive` button was never clicked. Both confirmation dialogs were cancelled.

`FINAL_RECEIVE_REQUESTS = 0`

## 26. DB No-Business-Mutation Proof

The after-baseline exactly matched the before-baseline in Section 14.

- PO delta: 0
- Asset delta: 0
- Barcode-history delta: 0
- Origin delta: 0
- Purchase-cost-revision delta: 0
- Current-valuation delta: 0
- Movement delta: 0
- Journal/journal-line delta: 0
- Cash transaction delta: 0
- Idempotency request delta: 0
- LOOSE_DIAMOND asset delta: 0

`DB_BUSINESS_WRITES = 0`

## 27. Remaining Risks

- The first controlled Loose Diamond Receive still requires a fresh pre-Receive backup and separate Owner authorization; this control intentionally did not create that backup.
- Existing unrelated financial P0 remains present: `JE-1787090870905` has a previously observed debit/credit difference of `-0.01000000`. It was not modified.
- An intentionally invalid browser attempt using Natural Diamond plus `Other` treatment returned 422; it was not a product defect and no data was written.
- Existing worktree drift, including Owner-accepted `next-env.d.ts` generated drift, was not changed.

## 28. Gate

All control criteria passed without a Receive or official DB mutation.

`GATE = READY_FOR_FIRST_CONTROLLED_LOOSE_DIAMOND_RECEIVE`

`LOOSE_DIAMOND_SHARED_PREVIEW_RUNTIME = PASS`

`FIRST_LOOSE_DIAMOND_RECEIVE_EXECUTED = NO`

`NEXT_RECOMMENDED_STEP = FRESH_PRE_RECEIVE_BACKUP_THEN_ONE_CONTROLLED_LOOSE_DIAMOND_UI_RECEIVE`

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-DECIMAL-RUNTIME-FIX-PREVIEW-RERUN
LOCAL_MAIN_DB = darfus_erp
DECIMAL_PACKAGE = decimal.js
DECIMAL_VERSION = 10.6.0 (Backend runtime)
NEQ_SUPPORTED = NO
SUPPORTED_EQUALITY_API = eq (equals also available)
ROOT_CAUSE = UNSUPPORTED_DECIMAL_METHOD_IN_LOOSE_DIAMOND_COST_ALIAS_EQUALITY_CHECK
SOURCE_FILE_CHANGED = backend/src/services/loose-profile-finance.service.js
BUSINESS_LOGIC_CHANGED = NO
RUNTIME_API_COMPATIBILITY_FIXED = YES
STONE_COST_EQUAL_VALUES = PASS
STONE_COST_DIFFERENT_VALUES = CLEAN_VALIDATION_FAIL
STONE_COST_DIFFERENT_VALUES_HTTP = 422 route validation / direct service canonical error
DECIMAL_PRECISION_REGRESSION = PASS
FOCUSED_TESTS = PASS
RELEVANT_REGRESSION = PASS
TYPECHECK = PASS
FRONTEND_PRODUCT_SOURCE_CHANGES = 0
FRONTEND_REBUILD = NO
BACKEND_RESTART = PASS
BACKEND_HEALTH = PASS
DB_HEALTH = PASS
REDIS_HEALTH = PASS
AUTHENTICATED_SESSION = PASS
COMPANY_CONTEXT = PASS
BRANCH_CONTEXT = PASS
CONTRACT_HTTP = 304 cache-valid authenticated response; preview contract paths passed
PROFILE_PREVIEW_AR = READY
SHARED_PREVIEW_AR = READY
SHARED_PREVIEW_HTTP_AR = 200
PREVIEW_PARITY_AR = PASS
PROFILE_PREVIEW_EN = READY
SHARED_PREVIEW_EN = READY
SHARED_PREVIEW_HTTP_EN = 200
PREVIEW_PARITY_EN = PASS
RUNTIME_PER_PIECE_LENGTH = 1
PROFILE_PURCHASE_BASE = 5000.00
PROFILE_PURCHASE_VAT = 700.00
PROFILE_PURCHASE_TOTAL = 5700.00
SHARED_PURCHASE_BASE = 5000.00
SHARED_PURCHASE_VAT = 700.00
SHARED_PURCHASE_TOTAL = 5700.00
DOUBLE_VAT = NO
PREPARED_UNIT_COST = 5000.00000000
PREPARED_PURCHASE_COST = 5000.00000000
PREPARED_BARCODE_AUTHORITY = DD_LOS_00
EXACT_REQUEST_RETAINED = YES
IDEMPOTENCY_KEY_RETAINED = YES
PREVIEW_FINGERPRINT_RETAINED = YES
FINAL_RECEIVE_REQUESTS = 0
DB_BUSINESS_WRITES = 0
LOOSE_DIAMOND_ASSET_COUNT_DELTA = 0
PRE_RECEIVE_BACKUP = DEFERRED_TO_FIRST_RECEIVE_CONTROL
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 0
GATE = READY_FOR_FIRST_CONTROLLED_LOOSE_DIAMOND_RECEIVE
FIRST_LOOSE_DIAMOND_RECEIVE_EXECUTED = NO
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Do not execute Receive, create the pre-Receive backup, start Gem Stone, or modify the unrelated historical journal in this control.
