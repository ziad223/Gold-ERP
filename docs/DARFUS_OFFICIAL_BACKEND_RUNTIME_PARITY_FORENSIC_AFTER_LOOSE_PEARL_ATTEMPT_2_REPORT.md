# DARFUS ERP — Official Backend Runtime Parity Forensic Report

## 1. Executive Summary

تم تنفيذ هذا الـControl كفحص قراءة فقط. `localhost:8000` يعمل، وDB health وRedis health أعادا `200`، و`SELECT current_database()` أثبت `darfus_erp`. لم يحدث Receive جديد، ولم تحدث كتابة أعمال أو إعادة تشغيل.

النتيجة الحاسمة: ملفات المصدر الحالية داخل الـhost وداخل `/app` متطابقة بالـSHA-256، لكن عملية Node الرسمية بدأت قبل إصلاح NaN بنحو ساعتين، وتعمل كـ`node src/server.js` بلا watcher. سجل Attempt 2 ما زال يشير إلى تخطيط الأسطر القديم عند `persistReceiptEvidence`، عند نفس نقطة فشل ordinal/SQL التاريخية. لذلك ثبت `OFFICIAL_RUNTIME_STALE_OR_SOURCE_DRIFT` بدرجة ثقة عالية. لا أعتبر ذلك Product Rule defect.

سبب SQL التفصيلي لـAttempt 2 غير مكشوف لأن error middleware يحول أخطاء Sequelize إلى رسالة عامة، مع إبقاء stack فقط. الدليل التاريخي السابق يربط نفس الحد الفاصل بخطأ `nan`، لكنه لا يُستخدم كادعاء لقراءة SQL جديد.

## 2. Scope / Read-Only Proof

| Item | Result |
|---|---|
| Official DB | `darfus_erp` |
| Official backend | `http://localhost:8000` |
| Production | Not contacted |
| Source change | 0 |
| DB mutation | 0 |
| Restart/recreate | 0 |
| Receive Attempt 3 | Not run |
| Read-only queries | Allowed and executed |

## 3. Prior Attempt State

| Endpoint | Status | Evidence |
|---|---:|---|
| `/api/v1/health` | 200 | service UP; uptime 12375.457 seconds at observation |
| `/api/v1/health/db` | 200 | PostgreSQL connected successfully |
| `/api/v1/health/redis` | 200 | Redis connected |

Official container: `darfus-backend`, image `jewellery-erp-master-backend:latest`, restart count `0`, PID chain `tini -> npm start -> node src/server.js`.

## 4. Official Backend Identity

Read-only PostgreSQL query returned `current_database = darfus_erp`. The backend health response also confirmed DB connectivity. No write was issued.

## 5. Docker/Mount/Image Authority

Attempt 2 request ID: `f757c8d1-1553-42e9-87e2-01f653f37611`.

Sequence in Docker console:

1. Loose Pearl profile preview: `200`.
2. Shared receive preview: `200`.
3. `POST /api/v1/purchase-orders/receive`: `500`.
4. Stack: Sequelize `Query.run` → `persistReceiptEvidence` at `/app/src/services/inventory-v2-runtime.service.js:353:3` → route `/app/src/routes/erp.routes.js:8736:13`.

No retry, no third attempt, and no additional business request were executed.

## 6. Host Source Hashes

The container uses a bind mount from `I:\WORK\jewellery-erp-master\backend` to `/app`. The image was created at `2026-08-22T17:20:59.540371834Z`; the container started at `2026-08-22T17:21:09.922073003Z`. The current NaN fix file mtime is `2026-08-22T19:47:43.9151394Z` and the route file mtime is `2026-08-22T19:47:43.9256564Z`.

Thus the running process predates the fix. The image is also older than the fix, but the bind mount makes the current `/app` files the filesystem view; it does not reload modules already held in memory.

## 7. Official Runtime Source Hashes

| File | Host SHA-256 | `/app` SHA-256 | Filesystem result |
|---|---|---|---|
| `backend/src/services/inventory-v2-runtime.service.js` | `6932876D0BE62929BA0C300771996188A6FA130711619311213F509FA520C157` | same | PASS |
| `backend/src/routes/erp.routes.js` | `8E53712B0B1CF5B384ADB66E50899C0E39E51820791A9E4621B15AA4F42BE34B` | same | PASS |
| `backend/package.json` | `231A19D0A81C2579F4D1B8E4D676A7085BA6811516630B811627B58A5CB3A86B` | same | PASS |
| `backend/package-lock.json` | `A2E65BF8D4EBBFF9CE559532130DC896433A931C5B6515102FC48149FE602551` | same | PASS |

This is filesystem parity only. It is not proof of in-memory module freshness.

## 8. Source Hash Parity

Filesystem hash parity is `PASS`. Executing-module parity is `FAIL_OR_STALE`, because the running process predates the fix and the Attempt 2 stack retains the old line layout. For the stale-runtime gate, `SOURCE_HASH_PARITY` means the accepted source versus the executing process and is recorded as `FAIL_EXECUTING_MODULE`; the underlying mounted-file comparison remains a separate PASS.

## 9. NaN Fix Runtime Presence

The current source contains `resolveReceiptEvidenceOrdinal` at lines `348–360`. It accepts a finite non-negative safe integer from `piece.pieceIndex` or the passed `pieceIndex`, derives `ordinal = zeroBased + 1`, and rejects invalid metadata before SQL.

The current filesystem route passes `pieceIndex: qtyIndex` at line `8736`. However, Attempt 2 executed the old line layout where `persistReceiptEvidence` reached the query at line `353`. Combined with process start-before-fix and no watcher, runtime execution of the fix is **not proven and is stale**.

## 10. Route Plumbing Parity

Current source plumbing is correct: `pieceIndex: qtyIndex` is passed to `persistReceiptEvidence`. The official stack confirms the same route call site, while the service line layout indicates the already-running module is older. No route or business rule was changed in this Control.

## 11. Process Start-Time Evidence

`npm start` is a plain Node process, not `nodemon` or another watcher. The container uptime exceeded the source fix time. The clone proof used the current worktree backend and a separate clone DB/port, and its receive path returned `201`; that behavior is differential evidence supporting runtime freshness divergence, not a business-rule change.

## 12. Image/Build Parity

The image predates the fix, while the bind mount exposes the current files. No image extraction or container recreation was performed. The image is not treated as proof that the current fix was loaded.

## 13. Environment Parity

Official non-secret runtime facts: Node `v20.20.2`, npm `10.8.2`, `NODE_ENV=development`, DB name `darfus_erp`, DB host `postgres`, Redis host `redis`, port `8000`. The prior clone report proves clone DB identity, port `18013`, current-worktree source, and official port untouched. It did not retain a complete clone Node/package manifest; full environment equality is therefore not claimed.

## 14. Node/Package Runtime Parity

Official Node/npm and package hashes were captured. The prior clone report did not retain a full Node/package manifest, so only partial parity is claimed.

## 15. Request-ID Log Forensic

The request-ID window is preserved in artifact `13-request-id-log-window.txt` and shows the two successful previews followed by Attempt 2 HTTP 500 and the stack boundary.

## 16. Secondary Log Sinks

`error.middleware.js` classifies Sequelize database/connection failures and deliberately returns HTTP 500 with code `INTERNAL_SERVER_ERROR` and message `An unexpected server error occurred.` The logger records the generic `errorMessage` and stack. The application logger has a Winston Console transport only; Docker’s `json-file` log is the available secondary sink. No application file, PM2, or other sink exposed the low-level SQL text.

## 17. Error Handler Forensic

The exact Attempt 2 SQL exception is `NOT_EXPOSED`. The proven low-level boundary is Sequelize `Query.run` during `persistReceiptEvidence`. Previous preserved official evidence recorded `column "nan" does not exist` in `purchase_order_item_asset_links`; this is historical corroboration of the same pre-fix failure family, not a new database mutation or a newly captured SQL message.

## 18. Attempt-2 Idempotency State

Before/after official `idempotency_requests` count remained `17`. A read-only lookup for the redacted Attempt 2 key returned `0` matching rows. No committed idempotency reservation was left by the failed transaction. No replay or conflict request was executed in this Control.

## 19. DB Zero-Delta Reconfirmation

| Entity | Current count | Pre-Attempt-2 baseline | Delta |
|---|---:|---:|---:|
| purchase_orders | 13 | 13 | 0 |
| purchase_order_items | 13 | 13 | 0 |
| assets | 13 | 13 | 0 |
| asset_components | 10 | 10 | 0 |
| asset_pearl_component_details | 1 | 1 | 0 |
| asset_origins | 13 | 13 | 0 |
| asset_purchase_cost_revisions | 13 | 13 | 0 |
| asset_current_valuations | 13 | 13 | 0 |
| inventory_asset_movements | 13 | 13 | 0 |
| asset_barcode_history | 13 | 13 | 0 |
| purchase_order_item_asset_links | 13 | 13 | 0 |
| journal_entries | 16 | 16 | 0 |
| journal_lines | 45 | 45 | 0 |
| idempotency_requests | 17 | 17 | 0 |
| cash_transactions | 3 | 3 | 0 |

`BUSINESS_DELTA = 0`. The only unbalanced posted journal remains the pre-existing `JE-1787090870905` (debit `2133.21000000`, credit `2133.22000000`, difference `-0.01000000`). It was not modified.

## 20. Clone vs Official Differential

The previous disposable clone used `darfus_erp_loose_pearl_auth_runtime_20260822_02` on port `18013`, current worktree source, and passed the controlled receive with `201` and ordinal `1`. Official port `8000` Attempt 2 returned `500` at the stale stack boundary. The differential is classified as runtime/process freshness divergence; no product-rule divergence is proven.

## 21. First Proven Runtime Difference

The first proven runtime difference is not the mounted file content; it is the executing module’s freshness: the process began before the fix, has no watcher, and reported the pre-fix service line layout. This is the first point where official execution diverged from the accepted current-worktree clone behavior.

## 22. Root Cause Classification

`ROOT_CAUSE_CLASS = OFFICIAL_RUNTIME_STALE_OR_SOURCE_DRIFT`.

Confidence: **HIGH**. Evidence is the start-before-fix timestamp, no watcher, current filesystem hash parity, old stack line layout, and prior clone success on the current worktree. DB connectivity and Redis health are good, so environment connectivity is not the primary cause. Product defect is not established by this read-only control.

## 23. Next Safe Control

The minimum safe next control is `OFFICIAL_LOCAL_BACKEND_SAFE_RUNTIME_REFRESH_AND_PARITY_PROOF`. It requires explicit authorization and is not executed here.

## 24. Problem Prevention Update

The prevention lesson `RUNTIME-PARITY-001` was recorded as an artifact only. No handoff, source, config, or prevention register was modified.

## 25. P0/P1/P2

P0 = 0. P1 = 2 (stale runtime acceptance blocker and pre-existing financial baseline exception). P2 = 1 (low-level exception visibility). P3 = 1 (incomplete retained clone manifest). P4 = 0.

## 26. Strengths

- The official DB was reached and identified without mutation.
- The current source has a fail-closed finite ordinal guard and route-level `qtyIndex` plumbing.
- The attempted receive rolled back: no partial PO/Asset/Movement/Journal/idempotency delta.
- The error stack and request ID are retained even though SQL detail is masked.
- The clone proof demonstrated the accepted source behavior independently without touching the official port.

## 27. Weaknesses / Risks

| Finding | Category | Severity | Impact |
|---|---|---|---|
| Official process can remain pre-fix while bind-mounted files look fixed | Environment/runtime | P1 acceptance blocker | Official receive acceptance cannot be trusted until safe refresh and parity proof |
| Database exception detail is masked | Observability | P2 | Exact current SQL cause cannot be independently proven from logs |
| Clone environment manifest was incomplete | Evidence | P3 | Full dependency/environment parity cannot be claimed |
| Historical unbalanced journal remains | Financial baseline | P1 historical exception | It predates this Control and was preserved; it remains a separate remediation decision |

## 28. Confirmed Issues / Priority

| ID | Issue | Classification | Priority | Evidence | Blocks current acceptance |
|---|---|---|---|---|---|
| RUNTIME-PARITY-001 | Official Node process stale relative to accepted NaN fix | ENVIRONMENT_CONFIG / ACCEPTANCE_GAP | P1 | start/fix times + old stack line + no watcher | YES |
| OBS-001 | Low-level SQL detail hidden by error middleware | OBSERVABILITY | P2 | middleware lines 54–70; generic 500 log | Partially |
| FIN-BASELINE-001 | Existing posted journal differs by 0.01 | FINANCIAL / DB_STATE | P1 historical | JE-1787090870905 unchanged | Not caused by this control |

## 29. What Was Not Done

No source edit, no migration, no seed, no DB mutation, no restart/recreate, no backup, no new Receive, no third Attempt, no retry, no cleanup, no production contact, and no business-rule change.

## 30. Required Next Control — Design Only

`OFFICIAL_LOCAL_BACKEND_SAFE_RUNTIME_REFRESH_AND_PARITY_PROOF` should, after explicit authorization, refresh the normal local backend safely, prove the exact process start is after the accepted fix, recapture runtime hashes and health, and rerun only the authorized read/acceptance gate. This report does not authorize that action and does not authorize another Receive.

## 31. Artifact Register

Artifacts are in:

`backend/acceptance-artifacts/runtime/DARFUS-OFFICIAL-BACKEND-RUNTIME-PARITY-FORENSIC-AFTER-LOOSE-PEARL-ATTEMPT-2/`

They contain no credentials, API keys, or idempotency secret value; the Attempt 2 key is redacted.

## 32. Evidence Limits

The filesystem hash comparison is PASS, but the running module’s freshness is FAIL/stale. The exact current SQL text is not exposed. The prior clone report proves source/DB scope but not a complete package/environment manifest. These limits are explicitly retained instead of being guessed away.

## 33. Gate Decision

`GATE = PASS_RUNTIME_PARITY_FORENSIC_OFFICIAL_RUNTIME_STALE_PROVEN`

This is a forensic gate only. It does **not** close Loose Pearl acceptance, does **not** authorize a runtime refresh, and does **not** authorize another Receive.

## 34. Final Tokens

```text
CURRENT_CONTROL = DARFUS-OFFICIAL-BACKEND-RUNTIME-PARITY-FORENSIC-AFTER-LOOSE-PEARL-ATTEMPT-2
MODE = READ_ONLY_RUNTIME_FORENSIC
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_BACKEND = http://localhost:8000
PRODUCTION_CONTACTED = NO
OFFICIAL_DB_CURRENT_DATABASE = darfus_erp
OFFICIAL_HEALTH = 200
OFFICIAL_DB_HEALTH = 200
OFFICIAL_REDIS_HEALTH = 200
OFFICIAL_RUNTIME_IDENTITY = darfus-backend / PID 40 / node src/server.js / image sha256:8fc7e3b98c6ec9e628c72780e83e8f0eb5f99a95a11fa8f276888180ffa83c1b
SOURCE_DELIVERY_MODE = HOST_BACKEND_BIND_MOUNT_TO_APP
OFFICIAL_CONTAINER_OR_PROCESS_START = 2026-08-22T17:21:09.922073003Z
OFFICIAL_IMAGE_ID = sha256:8fc7e3b98c6ec9e628c72780e83e8f0eb5f99a95a11fa8f276888180ffa83c1b
HOST_INVENTORY_RUNTIME_HASH = 6932876D0BE62929BA0C300771996188A6FA130711619311213F509FA520C157
OFFICIAL_INVENTORY_RUNTIME_HASH = 6932876D0BE62929BA0C300771996188A6FA130711619311213F509FA520C157
HOST_ERP_ROUTES_HASH = 8E53712B0B1CF5B384ADB66E50899C0E39E51820791A9E4621B15AA4F42BE34B
OFFICIAL_ERP_ROUTES_HASH = 8E53712B0B1CF5B384ADB66E50899C0E39E51820791A9E4621B15AA4F42BE34B
SOURCE_HASH_PARITY = FAIL_EXECUTING_MODULE
FILESYSTEM_HASH_PARITY = PASS
EXECUTING_MODULE_PARITY = FAIL_OR_STALE
NAN_FIX_FILESYSTEM = PRESENT
OFFICIAL_RUNTIME_NAN_FIX_PRESENT = FILE_PRESENT_EXECUTION_NOT_PROVEN_STALE_PROCESS
ROUTE_QTYINDEX_FILESYSTEM = PRESENT
OFFICIAL_RUNTIME_ROUTE_PASSES_QTYINDEX = FILE_PRESENT_EXECUTION_NOT_PROVEN_STALE_PROCESS
IMAGE_CONTAINS_CURRENT_FIX = NOT_PROVEN_IMAGE_PRE_FIX_BIND_MOUNT_OVERRIDES
PROCESS_STARTED_BEFORE_FIX = YES
WATCHER_OR_HOT_RELOAD = NO
IMAGE_CREATED_BEFORE_FIX = YES
CLONE_RUNTIME_PROOF = PRIOR_PASS_CURRENT_WORKTREE_SOURCE
RELEVANT_ENV_PARITY = PARTIAL_NOT_FULLY_PROVEN
NODE_RUNTIME_PARITY = PARTIAL_NOT_FULLY_PROVEN
ATTEMPT_2_HTTP_STATUS = 500
ATTEMPT_2_REQUEST_ID = f757c8d1-1553-42e9-87e2-01f653f37611
LOW_LEVEL_EXCEPTION = SEQUELIZE_QUERY_RUN_AT_PERSIST_RECEIPT_EVIDENCE_SQL_DETAIL_NOT_EXPOSED
SECONDARY_LOG_SINK_CHECK = PASS_NO_ADDITIONAL_APP_FILE_SINK
WHY_LOW_LEVEL_ERROR_NOT_VISIBLE = ERROR_MIDDLEWARE_MASKS_DATABASE_FAILURE_MESSAGE_AND_CONSOLE_ONLY_SINK_RETAINS_STACK
IDEMPOTENCY_ROWS_BEFORE = 17
IDEMPOTENCY_ROWS_AFTER = 17
ATTEMPT_2_IDEMPOTENCY_STATE = NO_MATCHING_COMMITTED_ROW
ATTEMPT_2_IDEMPOTENCY_MATCHING_ROWS = 0
BUSINESS_DELTA = 0
ATTEMPT_2_PERSISTENT_BUSINESS_DELTA = 0
FINAL_RECEIVE_REQUESTS_CREATING_BUSINESS_DATA = 0
RECEIVE_ATTEMPT_3 = NO
OFFICIAL_ATTEMPT_3 = NO
RESTART_OR_RECREATE = NO
SOURCE_CHANGED_THIS_CONTROL = 0
SOURCE_CHANGE_THIS_CONTROL = NO
RESTART_THIS_CONTROL = NO
DB_MUTATION_THIS_CONTROL = 0
FIRST_PROVEN_RUNTIME_DIFFERENCE = IN_MEMORY_MODULE_STARTED_BEFORE_FIX_AND_REPORTED_PRE_FIX_LINE_LAYOUT
ROOT_CAUSE_CLASS = OFFICIAL_RUNTIME_STALE_OR_SOURCE_DRIFT
ROOT_CAUSE_CONFIDENCE = HIGH
P0_COUNT = 0
P1_COUNT = 2
P2_COUNT = 1
P3_COUNT = 1
P4_COUNT = 0
GATE = PASS_RUNTIME_PARITY_FORENSIC_OFFICIAL_RUNTIME_STALE_PROVEN
NEXT_RECOMMENDED_STEP = OFFICIAL_LOCAL_BACKEND_SAFE_RUNTIME_REFRESH_AND_PARITY_PROOF
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 35. STOP

FULL OFFICIAL BACKEND RUNTIME PARITY FORENSIC COMPLETE → OWNER REVIEW → EXPLICIT APPROVAL REQUIRED FOR ANY SAFE RUNTIME REFRESH → STOP
