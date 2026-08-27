# DARFUS ERP — Stage B / B1 Transfers Final Closure Report

**Control:** `DARFUS-B1-TRANSFERS-PRELIVE-APPLY-AND-FINAL-CLOSURE`  
**Local Main DB:** `darfus_erp`  
**Backend:** `http://localhost:8000`  
**Scope:** One authorized Transfer only; no second Create, no retry, no B2.

## 1. Executive Summary

تم التحقق من موقع الوجهة، إنشاء Backup صالح، تنفيذ migration المحددة بعد Disposable Clone rehearsal، provision للصلاحيات الست فقط، ثم تحديث backend مرة واحدة. بعد ذلك نُفذ Transfer واحد فقط من واجهة `/ar/inventory/transfers` عبر دورة:

`CREATE → APPROVE → DISPATCH → RECEIVE`

نجحت الدورة على نفس الـTransfer. الـAsset نفسه انتقل إلى فرع/موقع الوجهة، وبقي الـBarcode والـcost والـvaluation والـprice والـorigin دون تغيير. لم يحدث أي Journal أو Cash أو Product quantity mutation. لا يوجد Transfer ثانٍ.

**النتيجة:** `PASS_STAGE_B_B1_TRANSFERS_FINAL_CLOSURE`.

## 2. Destination Location Verification

| Item | Actual | Result |
|---|---|---|
| Destination branch | `BRA-1787464306683` / Branch-1 | PASS |
| Destination location | `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` / `مخزن-7` / `HOUSE-7` | PASS |
| Active / branch match | `true` / `branch_id = BRA-1787464306683` | PASS |
| Source branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` / Branch-2 | PASS |
| Source location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151` / `QA-G2C-RECEIVE-LOC-01` | PASS |
| Test Asset / Barcode | `AST-PUR-1787083585731-1-1-plz5` / `GWRNG21000001` | PASS |

## 3. Backup

| Evidence | Actual |
|---|---|
| Path | `backend/acceptance-artifacts/transfers/DARFUS-B1-PRELIVE-APPLY-20260823/darfus_erp_pre_apply_v2.dump` |
| Size | `717627` bytes; non-empty |
| SHA-256 | `F2E44082DF5F5185A4DD220D6E42B7F7A467FC46D5F19415784A932D98043A29` |
| Format / restore list | Custom format; `pg_restore --list` PASS, 1183 TOC entries |

## 4. Migration Rehearsal / Apply

Migration: `backend/migrations/20260823010000-transfer-active-status-index.js`.

- Disposable clone `darfus_erp_b1_rehearsal_20260823` was restored from the fresh backup, migrated, verified, and dropped.
- Clone `SequelizeMeta`: `88 → 89`; official `SequelizeMeta`: `88 → 89`.
- Verified official index predicate: `PENDING`, `APPROVED`, `IN_TRANSIT`.
- Catalog comparison found zero table/column/constraint-name/index-name differences outside the intended index.

`MIGRATION_REHEARSAL = PASS`  
`MIGRATION_APPLIED = YES_ONCE`  
`UNRELATED_SCHEMA_CHANGE = 0`

## 5. Permission Provisioning

Only these six permissions were provisioned using the existing Sequelize models:

`inventory.transfer.read`, `inventory.transfer.create`, `inventory.transfer.approve`, `inventory.transfer.dispatch`, `inventory.transfer.receive`, `inventory.transfer.cancel`.

They were explicitly linked to the existing `admin`, `owner`, and `manager` roles for the official company. No roles were created, no unrelated permission catalog was seeded, and no permission was weakened. The pre-write check confirmed `current_database() = darfus_erp` and `activeBusinessWrites = 0`.

## 6. Runtime Freshness

| Check | Result |
|---|---|
| Backend restart | Exactly one `docker compose restart backend` |
| Backend start before / after | `2026-08-23T05:38:49.246141173Z` / `2026-08-23T06:29:29.563669348Z` |
| Latest B1 source modification | `2026-08-23T06:12:23.1714480Z` |
| `GET /api/v1/health` | `200` |
| `GET /api/v1/health/db` | `200` |
| `GET /api/v1/health/redis` | `200` |
| PostgreSQL / Redis restart | None |
| `current_database()` | `darfus_erp` |

## 7. Real Transfer Lifecycle

Browser path: `/ar/inventory/transfers`, authenticated, canonical Transfers UI. Synthetic note only: `B1 synthetic transfer pre-live proof`.

| Step | HTTP evidence | Idempotency request row | Result |
|---|---:|---:|---|
| Create | `201` | `81` / `transfer.create` | PASS |
| Approve | `200` | `82` / `transfer.approve` | PASS |
| Dispatch | `200` | `83` / `transfer.dispatch` | PASS |
| Receive | `200` | `84` / `transfer.receive` | PASS |

Transfer ID: `TR-1787466866680-1por1u`  
Item ID: `TRI-TR-1787466866680-1por1u-AST-PUR-1787083585731-1-1-plz5`  
Asset count: exactly one  
Second Create: `0`  
Automatic retry: `NO`

The browser showed `PENDING`, `APPROVED`, `IN_TRANSIT`, and finally `RECEIVED`, with the expected action button at each stage. No failed or ambiguous mutation occurred.

## 8. Asset / Branch / Location / Barcode Proof

| Assertion | Result |
|---|---|
| Final Transfer / item status | `received` / `RECEIVED` |
| Asset identity / profile | unchanged: `AST-PUR-1787083585731-1-1-plz5` / `GOLD_BY_WEIGHT_JEWELLERY` |
| Final Asset status | `AVAILABLE` |
| Final Asset branch / location | `BRA-1787464306683` / `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` |
| Barcode / active barcode rows | `GWRNG21000001` unchanged / `1` |
| RFID | unchanged / none present |
| New Asset rows | `0` |
| Product quantity authority used | `NO` |

Transfer-scoped evidence contains exactly three expected Asset events (`TRANSFER_REQUEST`, `TRANSFER_OUT`, `TRANSFER_IN`) and three expected movements (`TRANSFER_REQUEST`, `TRANSFER_OUT`, `TRANSFER_IN`).

## 9. Idempotency

| Scope | Key | Stored status | Status code |
|---|---|---|---:|
| `transfer.create` | `e0a1b9d6-a421-4311-a22d-fc3ec1e7823b` | `succeeded` | `201` |
| `transfer.approve` | `d77d4bfa-dd06-41f4-9f3d-9e1881d75263` | `succeeded` | `200` |
| `transfer.dispatch` | `83ca0e34-fa47-48d5-8542-f43fcc4d84f0` | `succeeded` | `200` |
| `transfer.receive` | `99018880-d1ae-4361-bde7-3454306c3620` | `succeeded` | `200` |

Read-only canonical idempotency resolution using the exact normalized bodies proved:

- Create exact body + same key → `replay`, status `201`, same Transfer ID, no business delta.
- Create changed notes + same key → different canonical hash, `conflict`, status `409`.
- Receive exact normalized body (`status=received`, `cancelReason=null`) + same key → `replay`, status `200`.

No replay request was used to create a second business effect.

## 10. Financial Immutability

Pre/post comparison used the fresh backup clone and official post-transfer read-only snapshot:

| Entity / invariant | Pre | Post | Result |
|---|---:|---:|---|
| `journal_entries` | 17 | 17 | delta 0 / PASS |
| `journal_lines` | 48 | 48 | delta 0 / PASS |
| `cash_transactions` | 3 | 3 | delta 0 / PASS |
| `assets` | 14 | 14 | delta 0 / PASS |
| `asset_origins` | 14 | 14 | delta 0 / PASS |
| `asset_purchase_cost_revisions` | 14 | 14 | delta 0 / PASS |
| `asset_current_valuations` | 14 | 14 | delta 0 / PASS |
| `asset_barcode_history` | 14 | 14 | delta 0 / PASS |
| `products` | 0 | 0 | delta 0 / PASS |
| Product quantity aggregates | all zero | all zero | unchanged |
| Test Asset `price` | `0.00000000` | `0.00000000` | unchanged |
| Test Asset `cost` | `2244.15431955` | `2244.15431955` | unchanged |
| Test Asset `final_purchase_cost` | `2244.1500` | `2244.1500` | unchanged |

`JOURNAL_DELTA = 0`  
`VAT_MUTATION = 0`  
`SUPPLIER_AP_DELTA = 0`  
`CUSTOMER_AR_DELTA = 0`  
`CASH_DELTA = 0`

## 11. Integrity

| Check | Result |
|---|---|
| Header/item Asset parity | PASS |
| Branch parity | PASS |
| Location parity | PASS |
| Received Asset destination parity | PASS |
| Orphan `transfer_items` | `0` |
| Duplicate active Asset transfer | `0` |
| Duplicate Transfer movement for same Asset/action | `0` |
| Duplicate Transfer event for same Asset/action | `0` |
| Transfer rows | `0 → 1`, expected |
| Transfer item rows | `0 → 1`, expected |
| Transfer movement rows | `14 → 17`, `+3` expected |
| Transfer event rows | `17 → 20`, `+3` expected |
| Transfer idempotency rows | `0 → 4`, `+4` expected |
| Journal/cash/product business delta | `0` |

## 12. UI / RBAC

- Sidebar displayed `تحويلات الفروع` at `/ar/inventory/transfers`.
- Source selector loaded DB-backed Branch-2 locations; destination selector loaded `مخزن-7` from DB.
- Create/Approve/Dispatch ran under source branch context.
- Receive ran after switching to destination Branch-1 context; context status was `READY`.
- Source/destination and Asset identity were visible in the browser row.
- No second receive workflow was used.
- There is no third active branch in the official company; unrelated-branch runtime proof is `N/A`, while server fail-closed branch checks and focused tests are PASS.

## 13. Files / Artifacts

Implementation files from the B1 source batch include:

- `backend/src/services/transfer-policy.service.js`
- `backend/src/routes/transfer.routes.js`
- `backend/src/routes/index.js`
- `backend/src/routes/erp.routes.js`
- `backend/migrations/20260823010000-transfer-active-status-index.js`
- `backend/src/bootstrap/permission-baseline-v1.js`
- `backend/tests/transfer-b1-policy.test.cjs`
- `app/[locale]/(dashboard)/inventory/transfers/page.tsx`
- `components/layout/sidebar.tsx`
- `lib/types.ts`
- `messages/ar.json`
- `messages/en.json`

Evidence artifacts:

- `backend/acceptance-artifacts/transfers/DARFUS-B1-PRELIVE-APPLY-20260823/darfus_erp_pre_apply_v2.dump`
- `backend/acceptance-artifacts/transfers/DARFUS-B1-PRELIVE-APPLY-20260823/pre-apply-baseline.txt`
- `backend/acceptance-artifacts/transfers/DARFUS-B1-PRELIVE-APPLY-20260823/post-transfer-proof.txt`

## 14. Gate

`GATE = PASS_STAGE_B_B1_TRANSFERS_FINAL_CLOSURE`

`P0 = 0`  
`P1 = 0`  
`P2_BLOCKING = 0`  
`B1_STATUS = CLOSED`

## 15. Final Tokens

```text
CURRENT_CONTROL = DARFUS-B1-TRANSFERS-PRELIVE-APPLY-AND-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SOURCE_BRANCH = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
SOURCE_LOCATION = LOC-9a10f58e-4207-4512-8824-7a7b06159151
DESTINATION_BRANCH = BRA-1787464306683
DESTINATION_LOCATION = LOC-2ca3af2d-e01a-454c-a625-4951d0925927
TEST_ASSET_ID = AST-PUR-1787083585731-1-1-plz5
TEST_ASSET_BARCODE = GWRNG21000001
BACKUP = PASS_NONEMPTY_SHA256_AND_PG_RESTORE_LIST
MIGRATION_REHEARSAL = PASS_DISPOSABLE_CLONE
MIGRATION_APPLIED = YES_ONCE
ACTIVE_INDEX_PREDICATE = PENDING_APPROVED_IN_TRANSIT
TRANSFER_PERMISSIONS_PROVISIONED = YES_ONLY_SIX_CANONICAL_PERMISSIONS
BACKEND_RUNTIME_FRESH = PASS_ONE_BACKEND_RESTART
CREATE_HTTP = 201
APPROVE_HTTP = 200
DISPATCH_HTTP = 200
RECEIVE_HTTP = 200
TRANSFER_ID = TR-1787466866680-1por1u
FINAL_TRANSFER_STATUS = received
FINAL_ASSET_STATUS = AVAILABLE
FINAL_ASSET_BRANCH = BRA-1787464306683
FINAL_ASSET_LOCATION = LOC-2ca3af2d-e01a-454c-a625-4951d0925927
BARCODE_UNCHANGED = YES
IDEMPOTENCY_EXACT_REPLAY = PASS_CANONICAL_READ_ONLY_RESOLUTION
IDEMPOTENCY_CHANGED_PAYLOAD = PASS_409_CANONICAL_RESOLUTION
JOURNAL_DELTA = 0
CASH_DELTA = 0
HISTORICAL_COST_CHANGE = NO
CURRENT_VALUATION_CHANGE = NO
ASSET_PRICE_CHANGE = NO
PRODUCT_QUANTITY_MUTATION = 0
SECOND_TRANSFER_CREATE = 0
P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
GATE = PASS_STAGE_B_B1_TRANSFERS_FINAL_CLOSURE
B1_STATUS = CLOSED
STAGE_B_STATUS = B1_CLOSED_B2_NOT_STARTED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_EXPLICIT_B2_AUTHORIZATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

لا يبدأ B2 تلقائيًا، ولا يُنفذ Transfer آخر، ولا deployment أو Production contact في هذا Control.

**B1 TRANSFERS CLOSED → OWNER REVIEW → NEXT BATCH ONLY AFTER EXPLICIT APPROVAL**
