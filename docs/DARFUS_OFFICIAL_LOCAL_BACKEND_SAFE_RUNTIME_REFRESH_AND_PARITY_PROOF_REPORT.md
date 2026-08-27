# DARFUS ERP — Official Local Backend Safe Runtime Refresh + Parity Proof

## 1. Executive Summary

تم تنفيذ refresh واحد فقط لـ`darfus-backend` على البيئة المحلية. تغيّر وقت بدء العملية إلى وقت بعد إصلاح NaN، وبقيت Postgres وRedis دون restart. Health وDB health وRedis health كلها `200`، و`current_database()` بقي `darfus_erp`، ولم يحدث Receive أو business DB delta.

لكن شرط الـControl الصارم لم يكتمل: Node PID قبل وبعد refresh بقي `40` داخل نفس container PID namespace. لذلك لا يمكن إعلان `EXECUTING_MODULE_PARITY = PASS` ولا إغلاق RUNTIME-PARITY-001. تم التوقف دون Auth/Company/Branch أو Preview، ودون أي محاولة refresh ثانية.

## 2. Owner Authorization

التفويض المرفق أجاز backend refresh واحدًا، proof للهوية والـhashes والـhealth والـDB target، ومنع Receive وAttempt 3 وتغيير المصدر والمigration/seed/reset/cleanup. نُفذ فقط refresh backend واحد. لم يتم استخدام login أو إنشاء token.

## 3. Prior Root Cause

السبب السابق المثبت كان `OFFICIAL_RUNTIME_STALE_OR_SOURCE_DRIFT`: العملية القديمة بدأت قبل إصلاح NaN، رغم أن ملفات bind mount الحالية كانت صحيحة. الإصلاح الحالي موجود في `resolveReceiptEvidenceOrdinal`، والroute يمرر `pieceIndex: qtyIndex`.

## 4. Scope / Safety

| Control | Result |
|---|---|
| Official backend | `http://localhost:8000` |
| Official DB | `darfus_erp` |
| Backend refresh | 1 |
| Postgres/Redis restart | 0 / 0 |
| Receive requests | 0 |
| Official Attempt 3 | NO |
| Source change | NO |
| DB reset/cleanup/seed | NO |
| Production contact | NO |

## 5. Pre-Refresh DB Baseline

`SELECT current_database()` returned `darfus_erp`. Counts before refresh:

| Entity | Count |
|---|---:|
| purchase_orders | 13 |
| purchase_order_items | 13 |
| assets | 13 |
| LOOSE_PEARL assets | 0 |
| asset_components | 10 |
| asset_pearl_component_details | 1 |
| asset_origins | 13 |
| asset_purchase_cost_revisions | 13 |
| asset_current_valuations | 13 |
| inventory_asset_movements | 13 |
| asset_barcode_history | 13 |
| purchase_order_item_asset_links | 13 |
| journal_entries | 16 |
| journal_lines | 45 |
| idempotency_requests | 17 |
| cash_transactions | 3 |

The only unbalanced posted journal was `JE-1787090870905`.

## 6. Pre-Refresh Runtime Identity

Container: `darfus-backend`; ID `a80d9631b094a5ae96c8dcfffd6091fa6e22bda8012510f8d95e6773f0627354`; image ID `sha256:8fc7e3b98c6ec9e628c72780e83e8f0eb5f99a95a11fa8f276888180ffa83c1b`; Node PID `40`; Node `v20.20.2`; npm `10.8.2`; command `node src/server.js`; port `8000`; process start `2026-08-22T17:21:09.922073003Z`.

## 7. Source Delivery Mode

`SOURCE_DELIVERY_MODE = HOST_BACKEND_BIND_MOUNT_TO_APP`. Compose maps the host `backend` directory to `/app`; the backend uses plain `npm start` and has no watcher.

## 8. Pre-Refresh Source Hashes

| File | Host SHA-256 | `/app` SHA-256 | Result |
|---|---|---|---|
| inventory-v2-runtime.service.js | `6932876D0BE62929BA0C300771996188A6FA130711619311213F509FA520C157` | same | PASS |
| erp.routes.js | `8E53712B0B1CF5B384ADB66E50899C0E39E51820791A9E4621B15AA4F42BE34B` | same | PASS |
| package.json | `231A19D0A81C2579F4D1B8E4D676A7085BA6811516630B811627B58A5CB3A86B` | same | PASS |
| package-lock.json | `A2E65BF8D4EBBFF9CE559532130DC896433A931C5B6515102FC48149FE602551` | same | PASS |

`FILESYSTEM_HASH_PARITY_BEFORE = PASS`.

## 9. NaN Fix Filesystem Proof

`resolveReceiptEvidenceOrdinal` exists at service lines `348–360`. It validates finite safe integer input, derives a positive ordinal, and fails closed before SQL. The route contains `pieceIndex: qtyIndex` at line `8736`. No source edit occurred.

## 10. Runtime Refresh Method

`RUNTIME_REFRESH_METHOD = docker compose restart backend`.

This was the minimum backend-only reload under the existing bind-mount/plain-Node architecture. Postgres and Redis were not restarted. The existing container startup command invoked its migration preflight; Docker logs explicitly reported: `No migrations were executed, database schema was already up to date.` No migration file was created or changed.

## 11. Refresh Execution

The command exited `0` and ran exactly once. The container ID remained the same, as expected for restart. No browser action, login, Preview, Confirm, Receive, replay, or conflict request was run.

## 12. New Process Freshness

The new container/process start was `2026-08-22T21:12:47.891857024Z`, after the accepted fix mtime `2026-08-22T19:47:43.9151394Z`. Process start time therefore changed and is fresh. However, Node PID remained `40` before and after because the container PID namespace reused it.

Under the explicit Control rule requiring `new Node PID != old Node PID`, the strict criterion is **FAIL**. The process identity by start time changed, but the required PID proof did not.

## 13. Post-Refresh Source Hashes

Host and `/app` hashes remained identical after refresh. `FILESYSTEM_HASH_PARITY_AFTER = PASS`; no source drift occurred.

## 14. Executing Module Parity

The new process started after the accepted source fix and the mounted files still contain the fix. Nevertheless, the Control requires the PID/process identity condition, and the PID was reused. Therefore:

`EXECUTING_MODULE_PARITY = BLOCKED_STRICT_PID_REQUIREMENT`.

No behavioral receive-path smoke was run to avoid crossing the stop condition.

## 15. Backend Health

| Endpoint | Status |
|---|---:|
| `/api/v1/health` | 200 |
| `/api/v1/health/db` | 200 |
| `/api/v1/health/redis` | 200 |

## 16. DB Target

Post-refresh read-only `SELECT current_database()` returned `darfus_erp`. `OFFICIAL_DB_TARGET_AFTER_REFRESH = PASS`.

## 17. Redis

Redis was healthy before and after the backend refresh and was never restarted. `/api/v1/health/redis` returned `200`.

## 18. Auth / Company / Branch Readiness

Not run. The Control requires stopping when the strict refresh identity criterion fails. No login, password, token, or context-changing request was issued.

## 19. Preview Readiness

Not run. Profile Preview and Shared Preview were intentionally not called after the stop boundary. No Confirm action was performed.

## 20. No-Receive Proof

`RECEIVE_REQUEST_COUNT_THIS_CONTROL = 0`. No `POST /api/v1/purchase-orders/receive`, no supplier receive adapter, no replay, and no changed-payload conflict request were issued.

## 21. DB Zero-Write Reconciliation

Post-refresh counts remained exactly equal to the baseline: 13 PO, 13 PO items, 13 assets, 0 Loose Pearl assets, 10 components, 1 Pearl component detail, 13 origins, 13 cost revisions, 13 valuations, 13 movements, 13 barcode histories, 13 receipt links, 16 journals, 45 journal lines, 17 idempotency rows, and 3 cash transactions.

`DB_WRITES_THIS_CONTROL = 0` for business data and `OFFICIAL_DB_BUSINESS_DELTA = 0`.

## 22. Historical Accounting Exception Recheck

The only unbalanced posted journal remained `JE-1787090870905`, debit `2133.21000000`, credit `2133.22000000`, difference `-0.01000000`. `ALL_OTHER_UNBALANCED_POSTED_JOURNALS = 0`. No remediation was attempted.

## 23. RUNTIME-PARITY-001 Closure

`RUNTIME-PARITY-001 = BLOCKED_STRICT_PID_REQUISITE`. The source hashes and post-fix start time passed, but the exact PID identity requirement did not. The prevention gate is not closed under this Control.

## 24. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| P0 | 0 | No data loss or business DB corruption |
| P1 | 1 | Strict runtime identity/parity gate not closed |
| P2 | 0 | No new product defect established |

## 25. Gate

`GATE = BLOCKED_OFFICIAL_LOCAL_BACKEND_RUNTIME_REFRESH_OR_PARITY`.

`OFFICIAL_RECEIVE_ALLOWED = NO` and `NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.

## 26. Final Tokens

```text
CURRENT_CONTROL = DARFUS-OFFICIAL-LOCAL-BACKEND-SAFE-RUNTIME-REFRESH-AND-PARITY-PROOF
LOCAL_MAIN_DB = darfus_erp
OFFICIAL_BACKEND = localhost:8000
PRIOR_ROOT_CAUSE = OFFICIAL_RUNTIME_STALE_OR_SOURCE_DRIFT
SOURCE_DELIVERY_MODE = HOST_BACKEND_BIND_MOUNT_TO_APP
PRE_REFRESH_CONTAINER_ID = a80d9631b094a5ae96c8dcfffd6091fa6e22bda8012510f8d95e6773f0627354
PRE_REFRESH_NODE_PID = 40
PRE_REFRESH_PROCESS_START = 2026-08-22T17:21:09.922073003Z
HOST_INVENTORY_RUNTIME_HASH = 6932876D0BE62929BA0C300771996188A6FA130711619311213F509FA520C157
PRE_REFRESH_APP_INVENTORY_RUNTIME_HASH = 6932876D0BE62929BA0C300771996188A6FA130711619311213F509FA520C157
HOST_ERP_ROUTES_HASH = 8E53712B0B1CF5B384ADB66E50899C0E39E51820791A9E4621B15AA4F42BE34B
PRE_REFRESH_APP_ERP_ROUTES_HASH = 8E53712B0B1CF5B384ADB66E50899C0E39E51820791A9E4621B15AA4F42BE34B
FILESYSTEM_HASH_PARITY_BEFORE = PASS
NAN_FIX_FILESYSTEM_PRESENT = YES
ROUTE_QTYINDEX_FILESYSTEM_PRESENT = YES
RUNTIME_REFRESH_METHOD = docker compose restart backend
RUNTIME_REFRESH_COUNT = 1
POST_REFRESH_CONTAINER_ID = a80d9631b094a5ae96c8dcfffd6091fa6e22bda8012510f8d95e6773f0627354
POST_REFRESH_NODE_PID = 40
POST_REFRESH_PROCESS_START = 2026-08-22T21:12:47.891857024Z
EXECUTING_PROCESS_REFRESHED = YES_BY_START_TIME_STRICT_PID_FAIL
PROCESS_STARTED_AFTER_ACCEPTED_FIX = YES
FILESYSTEM_HASH_PARITY_AFTER = PASS
EXECUTING_MODULE_PARITY = BLOCKED_STRICT_PID_REQUIREMENT
NAN_FIX_RUNTIME_READY = NOT_PROVEN_STRICT_GATE
ROUTE_QTYINDEX_RUNTIME_READY = NOT_PROVEN_STRICT_GATE
OFFICIAL_HEALTH = 200
OFFICIAL_DB_HEALTH = 200
OFFICIAL_REDIS_HEALTH = 200
OFFICIAL_DB_TARGET_AFTER_REFRESH = PASS
AUTH = NOT_RUN_STOP_BOUNDARY
SUPER_ADMIN = NOT_RUN_STOP_BOUNDARY
COMPANY_CONTEXT = NOT_RUN_STOP_BOUNDARY
BRANCH_CONTEXT = NOT_RUN_STOP_BOUNDARY
OPERATIONAL_READINESS = NOT_RUN_STOP_BOUNDARY
PROFILE_PREVIEW = NOT_RUN
SHARED_PREVIEW = NOT_RUN
RECEIVE_REQUEST_COUNT_THIS_CONTROL = 0
OFFICIAL_RECEIVE_EXECUTED = NO
DB_WRITES_THIS_CONTROL = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
FINAL_UNBALANCED_POSTED_IDS = [JE-1787090870905]
ALL_OTHER_UNBALANCED_POSTED_JOURNALS = 0
RUNTIME_PARITY_001 = BLOCKED_STRICT_PID_REQUISITE
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
GATE = BLOCKED_OFFICIAL_LOCAL_BACKEND_RUNTIME_REFRESH_OR_PARITY
LOOSE_PEARL_MODULE_STATUS = NOT_READY_FOR_OWNER_DECISION_ON_FINAL_OFFICIAL_ACCEPTANCE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_STRICT_PID_NAMESPACE_LIMITATION_NO_AUTOMATIC_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 27. STOP

توقف التنفيذ هنا. لا Receive، لا Official Attempt 3، لا refresh ثانٍ، لا source fix، لا migration جديدة، لا DB reset، لا Stage B، ولا Deployment. يلزم Owner review وتفويض صريح منفصل لأي خطوة لاحقة.
