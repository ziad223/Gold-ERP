# DARFUS ERP — Stage B / B3 Inventory Count Final Closure Report

## 1. ملخص تنفيذي

تم تنفيذ أساس B3 الأدنى بأمان، وتطبيق migration الصلاحيات على قاعدة `darfus_erp` بعد نسخة احتياطية موثقة وrehearsal ناجح على disposable clone. نجحت اختبارات Count المركزة واختبارات B1/B2/Unified Inventory والـtypecheck. بعد Owner Confirmation تم تنفيذ Count واحد فقط عبر المسار canonical، ثم Scan واحد وComplete وClose على نفس Count.

ما نجح:

- قاعدة الهدف مؤكدة: `darfus_erp`.
- migration B3 فقط: 90 → 91.
- أربع صلاحيات Count و12 role links.
- Asset/Barcode/Movement/Journal/Cash counts لم تتغير بعد migration.
- 56/56 focused and relevant regression tests، و`npm run typecheck`.
- Backend أعيد تشغيله مرة واحدة فقط؛ PostgreSQL وRedis لم يعادا تشغيلهما.

ما فشل/حُجب:

- Browser proof وone-real-count اكتمل بعد refresh آمن للـfrontend.
- Count ID الوحيد هو `COUNT-20260823075745-dde82bfe`، مع HTTP create=201 وstart/scan/complete/close=200.

الخطر على قاعدة البيانات الرسمية: تم تنفيذ Count business mutation واحدة مصرح بها فقط؛ لا توجد business mutations إضافية أو غير مقصودة، ولم يحدث أي Asset/Inventory/Financial mutation. لا يوجد خطر مالي مثبت من B3.

## 2. Current Reality Summary

قبل التطبيق: `current_database() = darfus_erp`، migrations = 90، `stock_audits = 0`، `stock_audit_items = 0`، assets = 14، locations = 4، idempotency rows = 24، Count permissions = 0.

الموقع المرشح الواقعي الذي تم إثباته قراءة فقط:

| Branch | DB Location | Active | Eligible Assets | Asset barcode |
|---|---|---:|---:|---|
| `BRA-1787464306683` | `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` / `HOUSE-7` / `مخزن-7` | YES | 1 | `GWRNG21000001` |

Asset المتوقع: `AST-PUR-1787083585731-1-1-plz5`، operational status `AVAILABLE`، branch/location مطابقان للموقع، inventory profile `GOLD_BY_WEIGHT_JEWELLERY`، barcode غير فارغ، RFID غير موجود.

## 3. Canonical Count Authority

| Concern | Authority |
|---|---|
| UI | `Inventory → Inventory Count` عبر `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx` |
| API | `/api/v1/inventory-v2/audits` و`/:id/start`, `/:id/observe`, `/:id/complete`, `/:id/close` |
| DB model | `StockAudit` / `StockAuditItem` |
| State machine | `draft → in-progress → completed → closed` |
| Expected set | server-resolved Company + Branch + active DB Location، مع استبعاد SOLD/MELTED/MISSING |
| Observation | Asset ID أو unique Barcode/RFID، داخل expected set فقط |
| Variance | Evidence only؛ لا تغيير Asset/Product/Movement/Accounting |
| Identity | Asset هو physical authority، والBarcode هو identity المرتبط به |
| Workflow | مسار Count واحد؛ legacy mutation routes ترجع 410 |

## 4. Confirmed Gaps

1. **P2 / UI_OBSERVABILITY:** بعد Close، response/UI يعرض totals = 0 لأن close response لا يحمل items، بينما DB يحفظ صف MATCHED الصحيح. لا يغير الحالة أو الدليل، ولا يحجب Count closure، ولم يُصلح في هذا الـbatch.
2. لا يوجد defect مالي أو Asset/Barcode authority مثبت في B3.

## 5. Source Changes

التغييرات المقصودة في B3 فقط:

- `backend/src/services/inventory-count-policy.service.js`: strict Count payload/location/Asset policy.
- `backend/src/services/inventory-audit-canonical.service.js`: expected set exact-location، unknown/out-of-scope rejection، duplicate scan replay، no unexpected rows.
- `backend/src/routes/erp.routes.js`: canonical Count routes، central idempotency، count-specific permissions، legacy mutation 410 guards.
- `backend/src/bootstrap/permission-baseline-v1.js`: Count permission catalog.
- `backend/migrations/20260823030000-inventory-count-authority-foundation.js`: permissions وrole links فقط؛ بلا schema/Asset/Product/Journal changes.
- `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`: DB-location، barcode-first Count، totals، zero-variance completion، بلا Asset resolution actions.
- `components/layout/sidebar.tsx`, `messages/ar.json`, `messages/en.json`: discoverability/labels.
- `backend/tests/stage-b-b3-inventory-count.test.cjs`: focused contract tests.

الـworktree كان dirty قبل B3 (HEAD `1657b0e9ba580faef69be48f04637835c201b521`؛ current status entries 566 = 101 tracked + 465 untracked). لم يتم cleanup/reset/stash أو أخذ ملكية drift السابق.

## 6. Migration / RBAC

تم إنشاء backup جديد:

`backend/acceptance-artifacts/inventory-count/DARFUS-B3-PRELIVE-APPLY-20260823/darfus_erp_pre_b3.dump`

حجمه `723853` bytes، Custom-format، و`pg_restore --list` نجح مع TOC entries = 1185.

تمت استعادة الـbackup إلى `darfus_erp_b3_rehearsal_20260823`، وتطبيق migration B3 فقط، وإثبات 90→91، 4 permissions، 12 links، وعدم إنشاء Count/Asset/Journal. ثم تم حذف الـclone والتحقق من عدم وجوده.

على الرسمي تم تطبيق migration مرة واحدة فقط:

- `SequelizeMeta`: 90 → 91.
- `inventory.count.read/create/scan/complete`: 4 rows.
- role links: 12.
- Count/Count Items: 0/0.

## 7. Focused Tests

PASS: `backend/tests/stage-b-b3-inventory-count.test.cjs` — 23/23.

PASS: combined B1/B2/Unified Inventory relevant regression set — 56/56:

```text
backend/tests/stage-b-b3-inventory-count.test.cjs
backend/tests/stage-b-b2-workshop.test.cjs
backend/tests/transfer-b1-policy.test.cjs
tests/unified-inventory-ux-final-closure.test.cjs
tests/unified-inventory-intake-ux-02-r3.test.cjs
```

PASS: `npm run typecheck`.

PASS: `node --check` للـpolicy، canonical service، routes، migration.

## 8. Runtime Freshness

Backend:

- backend restart: مرة واحدة بعد source/schema state النهائي.
- PostgreSQL restart: لا.
- Redis restart: لا.
- `GET /api/v1/health`: 200.
- `GET /api/v1/health/db`: 200.
- `GET /api/v1/health/redis`: 200.
- `GET /api/v1/health/gold`: 200، `HEALTHY`، `GOLDAPI_IO`، AED، fresh=true/stale=false.
- backend process start بعد source modification: نعم.

Frontend:

- `localhost:3000`: READY بعد refresh آمن.
- Build Error بعد refresh: 0.
- runtime process start أحدث من آخر source mtime، ولا يوجد frontend owner منافس.

## 9. One Real Count

تم تنفيذ المسار مرة واحدة فقط:

```text
POST create   = 201
POST start    = 200
POST scan     = 200
POST complete = 200
POST close    = 200
COUNT_ID      = COUNT-20260823075745-dde82bfe
FINAL STATUS  = closed
```

لم تتم أي retry أو second Count.

Request IDs من backend logs:

| Action | HTTP | Request ID |
|---|---:|---|
| Create | 201 | `89f9c47e-2e2c-4951-b030-5020ba009ae9` |
| Start | 200 | `4e373052-74d6-4019-b6d8-ac9c1248cb20` |
| Scan | 200 | `76ec54f0-b0ec-4d14-a357-bc892320caa5` |
| Complete | 200 | `dea97ba0-ba7d-488d-88cc-5a0e56ca54db` |
| Close | 200 | `10caed53-48cf-4018-a35d-876c5b9a43d6` |

## 10. Expected / Counted / Variance Proof

| Measure | Result |
|---|---:|
| Expected count | 1 |
| Counted count | 1 |
| Missing | 0 |
| Unexpected | 0 |
| Variance | 0 |
| Final Count status | closed |

Browser وDB proof يثبتان exact expected set وzero variance قبل completion، ثم حفظ الحالة `closed`.

## 11. Asset / Barcode / Location Proof

القراءة الحالية قبل/بعد migration:

- Asset rows = 14 قبل وبعد.
- Selected Asset = `AST-PUR-1787083585731-1-1-plz5`.
- Barcode = `GWRNG21000001`.
- Branch = `BRA-1787464306683`.
- Location = `LOC-2ca3af2d-e01a-454c-a625-4951d0925927`.
- Status = `AVAILABLE`.
- `asset_barcode_history` = 14.
- `inventory_asset_movements` = 19.
- `asset_events` = 22.
- `asset_purchase_cost_revisions` = 14.
- `asset_current_valuations` = 14.
- `asset_origins` = 14.

تم إنشاء Count/Count Item فقط. لم يتم إنشاء/تعديل Asset أو Barcode أو Movement أو Origin أو Cost Revision أو Current Valuation.

## 12. Idempotency / Concurrency

Static proof PASS: كل mutation canonical يستخدم central `idempotencyService.hashRequest/claim/succeed/resolveExisting`، مع scopes منفصلة `inventory-count.create/start/scan/complete/close`.

Focused proof PASS: duplicate exact payload يعامل replay، changed payload مع نفس key يمر إلى conflict path، وduplicate scan يحدث expected row بدل إنشاء row ثانية.

Live proof: خمس idempotency rows منفصلة، كلها `succeeded` وبـstatus codes 201/200/200/200/200، ولا توجد duplicate Count rows. Exact replay/changed-key behavior مثبت بالاختبارات المركزة؛ لم تتم إعادة إرسال POST بعد النجاح حتى لا تتحول الإثباتات إلى retry غير مصرح.

## 13. Financial Immutability

After migration / before live Count:

- journal_entries = 17.
- journal_lines = 48.
- cash_transactions = 3.
- Product quantity mutation = 0 observed.
- Asset rows delta = 0.
- Movement delta = 0.
- Journal delta = 0.
- Cash delta = 0.
- Historical cost/current valuation/Asset price change = 0 observed.

الـCount canonical completion لا يستدعي Asset transition ولا inventory adjustment ولا journal posting، ومثبت ذلك في الخدمة والاختبارات.

## 14. DB Integrity

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| stock_audits | 0 | 1 | +1 authorized Count |
| stock_audit_items | 0 | 1 | +1 authorized matched item |
| assets | 14 | 14 | 0 |
| asset_barcode_history | 14 | 14 | 0 |
| inventory_asset_movements | 19 | 19 | 0 |
| asset_events | 22 | 22 | 0 |
| journal_entries | 17 | 17 | 0 |
| journal_lines | 48 | 48 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 24 | 29 | +5 authorized Count actions |

RBAC migration rows are the only intended official writes; there are no unintended business rows.

## 15. UI / RBAC

Static UI/RBAC proof PASS:

- location selector is DB-backed.
- Barcode-first input.
- Expected/Counted/Missing/Variance shown.
- no automatic “mark missing as lost” or branch update.
- permissions are `inventory.count.read/create/scan/complete`.
- old mutation entry points return 410.
- AR/EN labels exist in source.

Real Browser proof PASS للمسار AR: اختيار الموقع، Start، Scan، Complete، Close؛ console لا يحتوي إلا HMR/React informational logs.
- EN route readiness السابقة PASS؛ لم يُنشأ Count ثانٍ في EN.
- ملاحظة P2: بعد Close يعرض UI totals = 0 في response presentation، لكن DB proof يحفظ expected item/result MATCHED؛ لا يؤثر على الحالة أو الدليل.

## 16. P0/P1/P2

| Priority | Finding | Classification | Persistent DB risk |
|---|---|---|---|
| P0 | None | — | None observed |
| P1 | None | — | None |
| P2 | Post-Close UI totals presentation resets to 0 while DB evidence remains correct | UI_OBSERVABILITY | No data/financial risk; non-blocking |

## 17. Gate

`GATE = PASS_STAGE_B_B3_INVENTORY_COUNT_FINAL_CLOSURE`

`B3_STATUS = CLOSED`

`B3` is closed: one authorized Count completed and closed with exact expected/count evidence. The post-close totals presentation issue is non-blocking and recorded as P2; no retry/second Count/cleanup was performed.

`STAGE_B_STATUS = B1_CLOSED_B2_CLOSED_B3_CLOSED_B4_NOT_STARTED`

## 18. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-B-B3-INVENTORY-COUNT-MINIMUM-SAFE-IMPLEMENTATION-AND-CLOSURE
LOCAL_MAIN_DB = darfus_erp
COUNT_UI_AUTHORITY = Inventory Count canonical UI; one AR browser flow completed
COUNT_API_AUTHORITY = /api/v1/inventory-v2/audits canonical route set
COUNT_DB_MODEL = StockAudit / StockAuditItem
COUNT_STATE_MACHINE = draft -> in-progress -> completed -> closed
EXPECTED_SET_AUTHORITY = Company + Branch + active DB Location; exclude SOLD/MELTED/MISSING
VARIANCE_AUTHORITY = evidence only; no Asset/Product/Financial mutation
FINANCIAL_POLICY = no financial posting or Asset/Product quantity mutation from Count
COUNT_BRANCH = BRA-1787464306683
COUNT_LOCATION = LOC-2ca3af2d-e01a-454c-a625-4951d0925927 / HOUSE-7 / مخزن-7
EXPECTED_ASSET_COUNT = 1
COUNTED_ASSET_COUNT = 1
VARIANCE_COUNT = 0
SOURCE_CHANGES = B3 policy/service/routes/UI/RBAC/test changes; pre-existing worktree drift preserved
MIGRATION = 20260823030000-inventory-count-authority-foundation.js; official 90 -> 91
PERMISSIONS = 4 Count permissions; 12 admin/owner/manager role links
FOCUSED_B3_TESTS = PASS 23/23
RELEVANT_REGRESSION = PASS 56/56
TYPECHECK = PASS
BACKEND_RUNTIME_FRESH = PASS; restart once; health/db/redis/gold 200/UP
COUNT_CREATE_HTTP = 201
COUNT_SCAN_HTTP = 200
COUNT_COMPLETE_HTTP = 200
COUNT_CLOSE_HTTP = 200
COUNT_ID = COUNT-20260823075745-dde82bfe
FINAL_COUNT_STATUS = closed
DUPLICATE_SCAN_ROWS = 0
ASSET_ROWS_DELTA = 0
BARCODE_UNCHANGED = YES
RFID_UNCHANGED = YES
IDEMPOTENCY_EXACT_REPLAY = STATIC_TEST_PASS; live succeeded rows preserved
IDEMPOTENCY_CHANGED_PAYLOAD = STATIC_TEST_PASS; no retry sent
JOURNAL_DELTA = 0
CASH_DELTA = 0
HISTORICAL_COST_CHANGE = 0
CURRENT_VALUATION_CHANGE = 0
ASSET_PRICE_CHANGE = 0
PRODUCT_QUANTITY_MUTATION = 0_OBSERVED
P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
GATE = PASS_STAGE_B_B3_INVENTORY_COUNT_FINAL_CLOSURE
B3_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_CLOSED_B3; B4 remains manual/explicit only
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — لا تبدأ B4، ولا تنفّذ Count ثانية أو cleanup أو deployment قبل Owner review.**
