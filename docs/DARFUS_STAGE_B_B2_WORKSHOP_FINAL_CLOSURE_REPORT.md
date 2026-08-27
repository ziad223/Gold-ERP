# DARFUS ERP — Stage B / B2 Workshop Final Closure Report

## 1. Executive Summary

تم تنفيذ الحد الأدنى الآمن لمسار Workshop على `darfus_erp`، ثم تنفيذ تدفق واحد فقط من المتصفح على Asset اصطناعي موجود مسبقًا: إرسال إلى Workshop ثم إكمال وإرجاع على نفس السجل. نجح الإرسال HTTP `201` والإرجاع HTTP `200`. لم يتم إنشاء Asset أو Product أو قيد مالي جديد، ولم تتغير تكلفة الشراء أو التقييم الحالي أو السعر.

تمت مراجعة المسار العربي والإنجليزي، وإثبات أن المسار يستخدم Asset وBarcode وDB Location ضمن Company/Branch الحاليين. تم تطبيق migration واحدة فقط بعد Backup موثق وDisposable Clone rehearsal، ثم إعادة تشغيل Backend واحدة فقط. لم تتم إعادة تشغيل PostgreSQL أو Redis، ولم يبدأ B3.

ملاحظة الدقة: لم يتم إرسال طلب HTTP إضافي لإعادة تشغيل نفس المفتاح بعد نجاح التدفق، حتى لا يتحول إثبات replay إلى عملية شبكة إضافية غير لازمة. تم إثبات replay/conflict من خلال hash الفعلي للخدمة المركزية، صفوف `idempotency_requests` الناتجة، واختبار route/service؛ ولا توجد عملية Workshop ثانية.

## 2. Current Reality and Frozen Authority

- السلطة الفيزيائية: Asset واحد لكل قطعة؛ Product.quantity ليس سلطة مخزون serialized.
- Workshop هو custody/state transition لنفس Asset، وليس إنشاء مخزون جديد.
- الموقع يجب أن يكون DB-backed، active، داخل Company وBranch المصرح بهما.
- المسار القانوني: `AVAILABLE → WORKSHOP → AVAILABLE`.
- المسار المالي: لا يوجد posting لـWorkshop؛ الشراء والتكلفة والتقييم تبقى كما هي.
- لا يوجد Workshop client document مستقل في `I:\WORK\client-requirements`؛ لذلك لم تُخترع قواعد تكلفة أو محاسبة أو status إضافية.

## 3. Confirmed Gaps and Minimum Safe Closure

| Gap | Evidence before change | Minimum safe result |
|---|---|---|
| لا توجد سلطة موقع Workshop/Return صريحة | جدول Workshop القديم كان يملك `from_location_id` فقط | إضافة `workshop_location_id` و`return_location_id` كـFK إلى `inventory_locations` |
| المسار القديم استخدم صلاحية عامة ولم يثبت idempotency المركزي | route القديم كان يعتمد على event lookup | صلاحيات Workshop مخصصة + `idempotencyService.claim/succeed/resolveExisting` |
| لا توجد واجهة canonical | لا يوجد route/sidebar لـWorkshop | `/en/inventory/workshop` و`/ar/inventory/workshop` ومسار Sidebar واحد |
| لا يوجد إثبات branch/location على كل خطوة | transition لم يكن يحمل موقع Workshop صريحًا | server-resolved Company/Branch وDB Location في الإرسال والإرجاع |

## 4. Source Changes

التغييرات المقصودة في هذا الـBatch فقط:

- `backend/src/services/workshop-policy.service.js`: normalizers وscope/lifecycle policy وpermissions.
- `backend/src/routes/erp.routes.js:5858-5966`: GET register، POST send، POST return، Asset-only transitions، central idempotency.
- `backend/src/bootstrap/permission-baseline-v1.js:14-24`: Workshop permission baseline.
- `backend/migrations/20260823020000-workshop-authority-foundation.js`: location FKs وpermission rows/role links.
- `app/[locale]/(dashboard)/inventory/workshop/page.tsx`: canonical AR/EN UI.
- `components/layout/sidebar.tsx`: رابط Workshop واحد فقط.
- `messages/ar.json` و`messages/en.json`: labels.
- `backend/tests/stage-b-b2-workshop.test.cjs`: focused source/policy/contract tests.

لم يتم تعديل `next-env.d.ts`، ولم يتم تنفيذ Git reset/restore/clean/stash.

## 5. Migration, Backup, and Runtime Freshness

- Official target verified before apply: `darfus_erp`, migrations `89`, Workshop business rows `0`.
- Backup: `backend/acceptance-artifacts/workshop/DARFUS-B2-PRELIVE-APPLY-20260823/darfus_erp_pre_apply.dump`.
- Backup size: `720814` bytes; SHA-256: `EB5B0F720DE472F24BCB757C1C55C4CFEF8EB24DED8910DBBE6E47DD59F30B0F`.
- Disposable rehearsal: `darfus_erp_b2_rehearsal_20260823`, restored at migration 89, migrated to 90, intended schema diff only, then dropped and verified absent.
- Official migration: `89 → 90`, applied once after rehearsal.
- Official post-apply: `current_database=darfus_erp`, migrations `90`, intended Workshop columns present, four Workshop permissions present, 12 role links present.
- Backend restart: `1`.
- PostgreSQL restarts: `0`.
- Redis restarts: `0`.
- Runtime: `/api/v1/health=200`, `/api/v1/health/db=200`, `/api/v1/health/redis=200`, `/api/v1/health/gold=200`.
- Gold health remained `HEALTHY`, provider `GOLDAPI_IO`, currency `AED`, fresh at observation time.

## 6. Workshop API and UI Authority

- Read: `GET /api/v1/inventory-v2/workshop-orders`.
- Send: `POST /api/v1/inventory-v2/workshop-orders`.
- Complete: `POST /api/v1/inventory-v2/workshop-orders/:id/return`.
- UI entry: Inventory Sidebar → Workshop; no Supplier receive shortcut and no duplicate Workshop workflow.
- Send accepts Asset IDs only; unknown fields are rejected; `workshopLocationId` is required and server-validated.
- Complete accepts `returnLocationId`; return location is server-validated.
- `inventory.workshop.cancel` is provisioned in the permission catalog but not exposed as a route because the current state machine has no draft/pre-send state. This is not blocking the implemented atomic `SENT → RETURNED` workflow and no cancellation status was invented.

## 7. One Real Browser Workshop Flow

Synthetic existing Asset used (no new fixture):

- Asset ID: `AST-PUR-1787083585731-1-1-plz5`
- Barcode: `GWRNG21000001`
- Profile: `GOLD_BY_WEIGHT_JEWELLERY`
- Branch: `BRA-1787464306683` / `Branch-1`
- DB location: `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` / `مخزن-7 (HOUSE-7)`
- Provider/notes: synthetic non-financial text only.

Observed browser evidence:

1. English page loaded and showed only the existing available Asset and DB-backed location.
2. `Send to Workshop` was enabled only after Asset and location selection.
3. One click produced UI success `Asset sent to Workshop.`.
4. Same row showed `In Workshop` and `Complete & Return`.
5. Same location was selected as return location.
6. One click on `Complete & Return` produced UI success `Workshop work completed and Asset returned.`.
7. Arabic page loaded and showed the same returned row as `تمت الإعادة` with Arabic labels.
8. Browser console contained no application error; only React DevTools/HMR informational messages.

Runtime response evidence persisted by the central idempotency table:

| Operation | HTTP | Idempotency row | Key | Workshop ID |
|---|---:|---:|---|---|
| Send | 201 | 85 | `06923b11-dc0f-4b8d-872e-6d587af9ab44` | `IMWORK-9468c91a471f48b79d8e06ac59` |
| Complete/Return | 200 | 86 | `73f4e029-5b1f-45c7-b4f3-fad5fad257c7` | same |

## 8. Asset, Barcode, Branch, Location, Movement, and Audit Proof

Final database state for the same Workshop ID:

- Workshop order: `RETURNED`.
- Workshop item: `RETURNED`.
- Asset operational status: `AVAILABLE`.
- Asset branch: unchanged `Branch-1`.
- Asset location: unchanged/returned to `LOC-2ca3af2d-e01a-454c-a625-4951d0925927`.
- Barcode: unchanged `GWRNG21000001`.
- RFID: `N/A` for this Asset.
- One `WORKSHOP_OUT` movement and one `WORKSHOP_IN` movement, both sourced by the same Workshop ID.
- One `WORKSHOP_SENT` event and one `WORKSHOP_RETURNED` event, with the two operation idempotency keys.
- Duplicate active Workshop custody: `0`.

## 9. Idempotency and Concurrency Proof

The actual central algorithm was traced in `backend/src/services/idempotency.service.js`: stable sorted serialization of `{scope, params, body}` followed by SHA-256, excluding the idempotency key from the body hash; unique `(company_id, scope, key)` protection; succeeded response replay; changed hash conflict.

For the exact normalized send body, the computed hash was:

`def9fae4ff22c089f7a663f1e411b369af81deb01fbe6361fd008ecf38bfe436`

which equals idempotency row 85. A changed provider payload produced a different hash:

`4d585a1645cf85b67a1d48783ebd03a642335807d7aeef13d9a5f1046173449b`.

For complete, the computed hash equals row 86:

`f76e4a23dacf19613e6e949ea833e5b8c409bd17958f1534b9720b228fc7deeb`.

The focused test also proves exact hash equality and changed-payload inequality. No second Workshop business job was created. A second live HTTP replay was intentionally not reissued after the successful flow; the persisted succeeded response and hash are the replay record used for this closure.

## 10. Financial and Inventory Delta Proof

Before the flow: Workshop orders `0`, items `0`, movements `17`, journal entries `17`, cash transactions `3`, Assets `14`, Products `0`, barcode-history rows `14`.

After the flow: Workshop orders `1`, items `1`, movements `19`, journal entries `17`, cash transactions `3`, Assets `14`, Products `0`, barcode-history rows `14`.

Therefore:

- New Asset rows: `0`.
- Product quantity mutation: `0` (Products remained `0`; no Product branch exists in the route).
- Journal delta: `0`.
- Cash/AP/AR/VAT posting: `0`.
- Historical purchase cost change: `0`.
- Current valuation change: `0`.
- Asset price change: `0`.
- Financial/business duplication: `0`.
- The only expected business delta was one Workshop order/item and two custody movements/events for the same Asset.

## 11. Focused Tests and Regression

- `node --test backend/tests/stage-b-b2-workshop.test.cjs`: `8/8 PASS`.
- `npm run typecheck`: exit `0`.
- Targeted tracked-file whitespace check: pass.
- Untracked B2 files trailing-whitespace check: pass.
- Route/static checks cover Asset-only behavior, DB location requirement, branch/company scope, lifecycle, permission mapping, central idempotency, migration schema, and canonical AR/EN UI.

## 12. Risk / Priority Matrix

| ID | Finding | Classification | Priority | Status |
|---|---|---|---|---|
| B2-001 | No separate cancel route for a non-existent draft state | DESIGN_LIMITATION / NO_ISSUE | P4 | Not blocking current atomic send/return state machine |
| B2-002 | Live exact replay was not reissued over HTTP after success | ACCEPTANCE_GAP | P2 | Hash, stored response, unique key, and focused tests prove deterministic replay path; no duplicate job exists |

P0 count: `0`.
P1 count: `0`.
P2 blocking count: `0`.

## 13. Gate

Applicable implementation, migration rehearsal, runtime, UI, Asset identity, movement, financial delta, and deterministic idempotency proofs passed. No second Workshop business job was created. The only limitation is that the exact replay path was proven from the real persisted hash/response and central algorithm rather than by reissuing another HTTP request after the successful flow.

`GATE = PASS_STAGE_B_B2_WORKSHOP_FINAL_CLOSURE`

`B2_STATUS = CLOSED`

`STAGE_B_STATUS = B1_CLOSED_B2_CLOSED_B3_NOT_STARTED`

## 14. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-B-B2-WORKSHOP-MINIMUM-SAFE-IMPLEMENTATION-AND-CLOSURE
LOCAL_MAIN_DB = darfus_erp
WORKSHOP_UI_AUTHORITY = Inventory Sidebar -> Workshop, one canonical AR/EN UI
WORKSHOP_API_AUTHORITY = /inventory-v2/workshop-orders send + same-order return
WORKSHOP_DB_MODEL = inventory_workshop_orders + inventory_workshop_items + DB location FKs
WORKSHOP_STATE_MACHINE = AVAILABLE -> WORKSHOP -> AVAILABLE
WORKSHOP_FINANCIAL_POLICY = custody only; no journal/AP/AR/VAT/cash posting
TEST_ASSET_ID = AST-PUR-1787083585731-1-1-plz5
TEST_ASSET_BARCODE = GWRNG21000001
SOURCE_CHANGES = policy, routes, permission baseline, canonical UI, sidebar/i18n, focused tests
MIGRATION = 20260823020000-workshop-authority-foundation; 89->90; applied once after clone rehearsal
PERMISSIONS = 4 Workshop permissions; 12 admin/owner/manager role links
FOCUSED_B2_TESTS = 8/8 PASS
RELEVANT_REGRESSION = typecheck PASS; browser EN/AR PASS; health/db/redis/gold PASS
TYPECHECK = PASS
BACKEND_RUNTIME_FRESH = PASS; one backend restart
WORKSHOP_CREATE_OR_SEND_HTTP = 201
WORKSHOP_COMPLETE_OR_RETURN_HTTP = 200
WORKSHOP_JOB_ID = IMWORK-9468c91a471f48b79d8e06ac59
FINAL_WORKSHOP_STATUS = RETURNED
FINAL_ASSET_STATUS = AVAILABLE
FINAL_ASSET_BRANCH = BRA-1787464306683
FINAL_ASSET_LOCATION = LOC-2ca3af2d-e01a-454c-a625-4951d0925927
BARCODE_UNCHANGED = YES
RFID_UNCHANGED = N/A
IDEMPOTENCY_EXACT_REPLAY = PASS_DETERMINISTIC_HASH_AND_PERSISTED_SUCCEEDED_RESPONSE; LIVE_HTTP_REISSUE_NOT_RUN
IDEMPOTENCY_CHANGED_PAYLOAD = PASS_HASH_DIFFERENCE_AND_FOCUSED_CONTRACT_TEST
DUPLICATE_ACTIVE_WORKSHOP = 0
JOURNAL_DELTA = 0
CASH_DELTA = 0
HISTORICAL_COST_CHANGE = 0
CURRENT_VALUATION_CHANGE = 0
ASSET_PRICE_CHANGE = 0
PRODUCT_QUANTITY_MUTATION = 0
P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
GATE = PASS_STAGE_B_B2_WORKSHOP_FINAL_CLOSURE
B2_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = STAGE_B_B3_INVENTORY_COUNT_QUICK_CURRENT_REALITY_THEN_MINIMUM_SAFE_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 15. Stop

تم إغلاق B2 فقط. لم يبدأ B3، ولم يتم تنفيذ أي مسار Workshop إضافي أو Receive إضافي. التوصية التالية تحتاج Owner approval مستقل.
