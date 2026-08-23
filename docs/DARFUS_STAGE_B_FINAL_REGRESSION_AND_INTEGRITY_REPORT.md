# DARFUS ERP — Stage B Final Regression and Integrity Report

Control ID: `DARFUS-STAGE-B-FINAL-REGRESSION-AND-INTEGRITY-GATE`

## 1. Executive Summary

تم تنفيذ بوابة Stage B كفحص Read-Only فقط. لم يتم إنشاء Transfer أو Workshop أو Count جديد، ولم يتم تنفيذ Lifecycle mutation أو Receive أو POS checkout. سلاسل B1 وB2 وCount المغلق في B3 سليمة، واختبارات Stage B المركزة نجحت `75/75`، و`typecheck` و`node --check` نجحا.

سلامة الهوية والتكامل المالي الحاليين سليمة: لا orphan rows، لا ازدواج Barcode نشط، لا تعارضات حالات بين Transfer/Workshop/Asset، ولا دلتا مالية من عمليات Stage B وفق الأدلة المقبولة السابقة. يوجد Journal قديم غير متوازن معروف (`JE-1787090870905`) وتم تركه دون تعديل كما يطلب الـControl.

الـGate النهائي لا يُغلق كـPASS بسبب ملاحظتي قراءة واجهة P2 ظهرتا في الفحص الحالي: شاشة Inventory Count لا تعرض Count المغلق في سطح القراءة الحالي، وAsset Details يعرض رموز أحداث داخلية في Timeline. هذه الملاحظات لا تمس DB أو سلطة Asset أو سلامة العمليات، ولم يتم إصلاحها في هذا Control.

## 2. B1 Regression

| Check | Actual | Evidence | Status |
|---|---|---|---|
| Transfer chain | Transfer `TR-1787466866680-1por1u` موجود، status `received`، وله item واحد status `RECEIVED` | Read-only DB query؛ B1 closure report | PASS |
| Asset identity | `AST-PUR-1787083585731-1-1-plz5` محفوظ في الوجهة `BRA-1787464306683` / `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` | Current `assets`, `transfer_items` | PASS |
| Barcode identity | `GWRNG21000001` مطابق لنفس Asset | Current DB and browser smoke | PASS |
| Active Transfer duplication | `0` | Read-only grouped query | PASS |
| Orphan transfer items | `0` | Read-only join query | PASS |
| Product quantity / financial effect | No Stage B Transfer journal or Product quantity mutation | B1 report delta proof; current source/tests | PASS |
| Focused regression | B1 tests included in `75/75 PASS` | Node test output | PASS |

B1 remains `CLOSED`.

## 3. B2 Regression

| Check | Actual | Evidence | Status |
|---|---|---|---|
| Workshop chain | Order `IMWORK-9468c91a471f48b79d8e06ac59` status `RETURNED`; one item status `RETURNED` | Current DB query | PASS |
| Asset status | Same Asset is `AVAILABLE` | Current `assets` and workshop item | PASS |
| Barcode | `GWRNG21000001` unchanged | Current DB and browser smoke | PASS |
| Custody location | Workshop and return location are DB location `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` | Current `inventory_workshop_orders` | PASS |
| Active Workshop duplication | `0` | Read-only grouped query | PASS |
| Orphan Workshop items | `0` | Read-only join query | PASS |
| Financial effect | B2 journal/cash deltas were `0` in accepted closure evidence | B2 closure report; current journal source types contain no Workshop entry | PASS |
| Focused regression | B2 tests included in `75/75 PASS` | Node test output | PASS |

B2 remains `CLOSED`.

## 4. B3 Regression

| Check | Actual | Evidence | Status |
|---|---|---|---|
| Accepted Count | `IMAUD-118724729e2b43999a4c647563` / `COUNT-20260823075745-dde82bfe` | Current `stock_audits` | PASS |
| Final status | `closed` | Current DB | PASS |
| Expected / counted / variance | One item, one `MATCHED`, zero missing; expected-counted = `0` | Current `stock_audits` + `stock_audit_items` | PASS |
| Duplicate scan rows | `0` per audit/Asset | Read-only grouped query | PASS |
| Orphan audit items | `0` | Read-only join query | PASS |
| Asset/Product/financial mutation | No count-driven mutation in accepted evidence; Count implementation is observation-only | B3 report and focused tests | PASS |
| Focused regression | B3 tests included in `75/75 PASS` | Node test output | PASS |

Read-only data note: there are two additional `in-progress` Count rows with no scans (`COUNT-20260823080154-1072c619` and `COUNT-20260823080206-38a95c8e`). They are not the accepted closed Count and were not modified or cleaned up. They are preserved acceptance residue, not a new Count execution in this Control.

The known B3 post-close totals presentation limitation remains non-blocking: DB evidence is correct, while the current UI does not expose the closed Count in the read surface tested below. This is recorded as P2 and not fixed here.

B3 business chain remains `CLOSED`; final UI-read gate has a P2 observation.

## 5. B4 Regression

| Check | Actual | Evidence | Status |
|---|---|---|---|
| Status authority | `assets.operational_status` with explicit runtime transition allowlist | `backend/src/services/inventory-v2-runtime.service.js` | PASS |
| Generic lifecycle writer | No generic lifecycle mutation contract was introduced; transitions are called by owning workflows | B4 focused tests; source search | PASS |
| Candidate Asset | `AST-PUR-1787434485744-1-1-9kp0` remains `AVAILABLE`, barcode `PLLOS00000001`, cost `100`, price `200`, with no active custody | Current DB query | PASS |
| Cross-module ownership | Transfer, Workshop, POS, Returns, Reservation, Manufacturing and CGP ownership remains explicit | B4 source/tests | PASS |
| Financial side effects | No B4 mutation occurred; journal/cash delta `0` | Current action log and B4 report | PASS |
| B4 mutation | No live B4 lifecycle mutation was run | Control guardrail | PASS (non-mutating acceptance) |
| Focused regression | B4 tests included in `75/75 PASS` | Node test output | PASS |

B4 is treated as `CLOSED_NON_MUTATING_ACCEPTANCE` under this final Control. No live destructive or high-risk status change was required or executed.

## 6. DB Integrity

| Check | Count / Actual | Status |
|---|---:|---|
| Current database | `darfus_erp` | PASS |
| Applied migration count | `91` | PASS |
| B1 migration | `20260823010000-transfer-active-status-index.js` present | PASS |
| B2 migration | `20260823020000-workshop-authority-foundation.js` present | PASS |
| B3 migration | `20260823030000-inventory-count-authority-foundation.js` present | PASS |
| B4 migration | Not required; no B4 migration present/created | PASS |
| Active Assets | `14` | PASS |
| Orphan active Barcode rows | `0` | PASS |
| More than one active Barcode per Asset | `0` | PASS |
| Barcode assigned to multiple Assets | `0` | PASS |
| Orphan Asset branch links | `0` | PASS |
| Orphan Asset location links | `0` | PASS |
| Location/branch mismatch | `0` | PASS |
| Orphan Transfer items | `0` | PASS |
| Orphan Workshop items | `0` | PASS |
| Orphan Stock Audit items | `0` | PASS |
| Duplicate Count scan row | `0` | PASS |
| Orphan movements/origins/cost revisions/valuations | `0` each | PASS |

All 14 current Assets are `AVAILABLE`. No DB write was issued by this final Control.

## 7. Cross-Module State Integrity

Read-only conflict query results:

| Conflict | Count |
|---|---:|
| `AVAILABLE` + active Workshop | `0` |
| `AVAILABLE` + active Transfer | `0` |
| `SOLD` + active Transfer | `0` |
| `SOLD` + active Workshop | `0` |
| `WORKSHOP` + active Transfer | `0` |
| `PENDING_TRANSFER` + active Workshop | `0` |
| Duplicate active Transfer custody | `0` |
| Duplicate active Workshop custody | `0` |
| Duplicate active Reservation custody | `0` |

`CROSS_MODULE_STATE_CONFLICTS = 0`.

## 8. Barcode / Asset Identity

The current read-only DB confirms one active Barcode row per current Asset (`14` active rows for `14` Assets), no duplicate active Barcode value, and no orphan active Barcode row. The accepted B1/B2/B3 Asset retains `GWRNG21000001` throughout purchase, Transfer, Workshop return, and Count evidence.

No Barcode was created, reassigned, reprinted, replaced, or retired in this Control. The current source and tests preserve Asset identity and exclude Product.quantity from serialized physical authority.

`MULTI_ACTIVE_BARCODE_VIOLATIONS = 0`.

## 9. Financial Immutability

Stage B accepted evidence reports zero journal/cash deltas for B1, B2, and B3, and B4 executed no mutation. Current DB has no journal entry with source type Transfer, Workshop, or Stock Audit. Current global journal state is:

- `journal_entries = 17`, `journal_lines = 48`, `cash_transactions = 3`.
- One known historical unbalanced journal remains: `JE-1787090870905` / `PO-1787090870807`, debit `2133.21000000`, credit `2133.22000000`.
- This is the documented historical local accounting exception and was not repaired or reclassified as a new Stage B regression.
- Current B1/B2/B3/B4 unexpected journal, VAT, AP, AR, cash, cost, valuation, and Asset.price deltas are `0`.

`UNINTENDED_JOURNAL_DELTA = 0` and `UNINTENDED_CASH_DELTA = 0` for Stage B actions.

## 10. Idempotency / Concurrency

Focused source/tests pass for:

- canonical exact replay hash equality;
- same key with changed payload conflict path;
- separate scopes for Transfer, Workshop, and Count;
- row locks and status guards;
- duplicate Count scan prevention;
- no generic lifecycle bypass.

No live POST replay was sent in this final Control, as required. No new business transaction was created.

`IDEMPOTENCY_GATE = PASS_STATIC_AND_FOCUSED_TESTS_NO_LIVE_REPLAY_REQUIRED`.

## 11. Permissions / Security

The DB permission catalog contains the required action-specific permissions for Transfer, Workshop, Count, and `inventory.returns.approve_restock`. Focused tests confirm company/branch/location fail-closed behavior, explicit ownership, no broad raw lifecycle bypass, and no re-enabled legacy mutation authority. No roles or permissions were modified in this Control.

`PERMISSION_SECURITY_GATE = PASS`.

## 12. Runtime Parity

| Surface | Evidence | Status |
|---|---|---|
| Backend health | `GET /api/v1/health = 200` | PASS |
| DB health | `GET /api/v1/health/db = 200` | PASS |
| Redis health | `GET /api/v1/health/redis = 200` | PASS |
| Backend target | Health DB and direct SQL both resolve to `darfus_erp` | PASS |
| Backend restart | Not performed in this Control; serving runtime already includes accepted source mtimes | PASS |
| Frontend port 3000 | One listener owner, PID `18080` | PASS |
| Frontend stale parallel owner | None observed | PASS |
| Next build/dev safety | No build command executed | PASS |

## 13. AR/EN Browser Smoke

Read-only navigation was performed for:

- `/ar/inventory/transfers`, `/en/inventory/transfers`;
- `/ar/inventory/workshop`, `/en/inventory/workshop`;
- `/ar/inventory/stock-audit`, `/en/inventory/stock-audit`;
- AR/EN Asset Details for `AST-PUR-1787083585731-1-1-plz5`.

All eight pages loaded successfully with no Build Error, no blocking console error, and no broken JS/CSS chunk observed. Transfer rows showed source/destination `Branch-2 → Branch-1`; Workshop showed `GWRNG21000001`, `مخزن-7`, and `Returned/تمت الإعادة`; Count showed the DB-backed Location selector; Asset Details showed lifecycle paths and ownership guidance in Arabic and English. No mutation button was clicked.

Two read-only UI gaps prevent a strict all-green browser gate:

1. The current Stock Audit page exposes the new Count form and location selector but does not show the already-closed Count row in its read surface. The closed Count remains verifiable directly in DB.
2. Asset Details translates old/new lifecycle states and lifecycle paths, but its immutable event timeline still displays internal event labels such as `WORKSHOP_RETURNED`, `WORKSHOP_SENT`, `TRANSFER_IN`, `TRANSFER_OUT`, `TRANSFER_REQUEST`, and `PURCHASE_RECEIVED` in both locales. No raw operational status token or generic lifecycle mutation control was exposed.

These are P2 UI observability/read-surface gaps. No correction was made in this Control.

`AR_BROWSER_SMOKE = PASS_WITH_P2_UI_OBSERVABILITY_GAPS`.
`EN_BROWSER_SMOKE = PASS_WITH_P2_UI_OBSERVABILITY_GAPS`.

## 14. P0/P1/P2

| Priority | Finding | Classification | Blocking |
|---|---|---|---|
| P0 | None observed | — | No |
| P1 | None observed; Asset/Barcode/financial authorities are intact | — | No |
| P2 | Closed Count is not displayed in current Count read surface | UI_OBSERVABILITY / ACCEPTANCE_GAP | No |
| P2 | Immutable Asset event timeline exposes internal event-code labels | UI_OBSERVABILITY / UX | No |
| P2 note | Two unclosed Count residue rows exist without scans; preserved, not cleaned | DB_STATE / ACCEPTANCE_RESIDUE | No |
| Known exception | Historical unbalanced `JE-1787090870905` remains unchanged | FINANCIAL / HISTORICAL_EXCEPTION | Not a new Stage B defect |

`P0_COUNT = 0`.
`P1_COUNT = 0`.
`P2_BLOCKING_COUNT = 0`.

## 15. Gate

Functional B1/B2/B3/B4 integrity is intact, and no P0/P1 defect or financial/state corruption was introduced. However, the strict final browser/read-surface requirements are not fully satisfied because the current Count read page omits the closed Count and the Asset timeline exposes internal event-code labels.

`GATE = BLOCKED_STAGE_B_FINAL_P2_UI_OBSERVABILITY_GAPS`

`B1_STATUS = CLOSED`

`B2_STATUS = CLOSED`

`B3_STATUS = CLOSED_WITH_KNOWN_NONBLOCKING_UI_OBSERVABILITY_GAP`

`B4_STATUS = CLOSED_NON_MUTATING_ACCEPTANCE`

`STAGE_B_STATUS = FUNCTIONALLY_CLOSED_BUT_FINAL_GATE_BLOCKED_BY_P2_READ_SURFACE_GAPS`

No module was reopened for lack of a destructive B4 mutation. No fix was applied because this Control was a regression/integrity gate and the findings are non-blocking P2 UI observations.

## 16. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-B-FINAL-REGRESSION-AND-INTEGRITY-GATE
LOCAL_MAIN_DB = darfus_erp

B1_REGRESSION = PASS
B2_REGRESSION = PASS
B3_REGRESSION = PASS_DB_CHAIN_WITH_P2_READ_SURFACE_GAP
B4_REGRESSION = PASS_NON_MUTATING_ACCEPTANCE

ALL_STAGE_B_FOCUSED_TESTS = PASS_75_OF_75
TYPECHECK = PASS
NODE_CHECK_RELEVANT_CHANGED_FILES = PASS_10_FILES

BACKEND_RUNTIME_PARITY = PASS_HEALTH_DB_REDIS_200
FRONTEND_RUNTIME_PARITY = PASS_SINGLE_PORT_3000_OWNER_PID_18080
AR_BROWSER_SMOKE = PASS_WITH_P2_UI_OBSERVABILITY_GAPS
EN_BROWSER_SMOKE = PASS_WITH_P2_UI_OBSERVABILITY_GAPS

TRANSFER_INTEGRITY = PASS
WORKSHOP_INTEGRITY = PASS
COUNT_INTEGRITY = PASS_ACCEPTED_CLOSED_CHAIN_WITH_TWO_PRESERVED_IN_PROGRESS_RESIDUES
LIFECYCLE_OWNERSHIP_INTEGRITY = PASS
CROSS_MODULE_STATE_CONFLICTS = 0
MULTI_ACTIVE_BARCODE_VIOLATIONS = 0
ORPHAN_ROWS = 0

UNINTENDED_JOURNAL_DELTA = 0
UNINTENDED_CASH_DELTA = 0
UNINTENDED_COST_CHANGE = 0
UNINTENDED_VALUATION_CHANGE = 0

PERMISSION_SECURITY_GATE = PASS
IDEMPOTENCY_GATE = PASS_STATIC_AND_FOCUSED_TESTS

P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
P2_NONBLOCKING_COUNT = 2_PLUS_PRESERVED_COUNT_RESIDUE_NOTE

GATE = BLOCKED_STAGE_B_FINAL_P2_UI_OBSERVABILITY_GAPS
STAGE_B_STATUS = FUNCTIONALLY_CLOSED_BUT_FINAL_GATE_BLOCKED_BY_P2_READ_SURFACE_GAPS
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_SEPARATE_P2_UI_OBSERVABILITY_DECISION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

NO_NEW_TRANSFER = YES
NO_NEW_WORKSHOP = YES
NO_NEW_COUNT = YES
NO_LIFECYCLE_MUTATION = YES
NO_RECEIVE = YES
NO_POS_CHECKOUT = YES
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
ONLINE_PRODUCTION_CONTACTED = NO
```

توقف بعد هذا التقرير. لا يبدأ Stage C تلقائيًا، ولا تُجرى أي عملية تنظيف أو mutation قبل Owner review وقرار صريح.
