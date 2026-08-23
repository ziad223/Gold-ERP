# DARFUS ERP — Phase 03A-R3B-R2 True First-Run Browser Retry Report

Control ID: `DARFUS-PHASE-03A-R3B-R2-TRUE-FIRST-RUN-BROWSER-RETRY-FULLY-ISOLATED-RUNTIME`

Mode: `CONTROLLED_DISPOSABLE_ACCEPTANCE_WITH_FULL_RUNTIME_ISOLATION`

Date: `2026-08-18`

## 1. Executive Summary

تم تنفيذ R3B-R2 باستخدام نسخة runtime مؤقتة خارج المشروع الأصلي، مع Frontend Next فعلي وBackend منفصل متصلين بقاعدة Disposable فقط. لم يتم تشغيل أو إعادة تشغيل `localhost:3000` أو `localhost:8000`، ولم تحدث أي كتابة على `darfus_erp`.

النتائج الأساسية:

- النسخة المؤقتة كانت خارج `I:\WORK\jewellery-erp-master`، وبها `.next` جديد أنشأه Frontend المعزول فقط.
- Backend المعزول على `8121` أعاد `health=200` و`setup/status=200 SETUP_REQUIRED`، واتصل بقاعدة `darfus_first_run_r3b_20260818_104917`.
- Frontend Next المعزول على `3301` أثبت من client chunk أن `NEXT_PUBLIC_API_URL=http://localhost:8121/api/v1`، ولم يحمل `http://localhost:8000/api/v1`.
- Browser hydration نجحت، وظهر First-Run form، ووصل Browser فعليًا إلى `GET /api/v1/setup/status` على Backend الـDisposable.
- POST الأول والثاني رُفضا `422` بسبب بيانات اختبار غير صحيحة. بعد فتح صفحة جديدة بمفتاح idempotency جديد وإرسال بيانات صحيحة، وصل Browser فعليًا إلى `POST /api/v1/setup/bootstrap`، لكن Backend أعاد `409`.
- بعد الـ409 بقيت قاعدة Disposable Fresh: لا Company/User/Branch، ولا setup marker، ولا roles/accounts/financial mappings، ولا Master Data أو business transaction rows.
- لم يتم تجاوز الـ409، ولم يتم إرسال POST إضافي، ولم يتم تغيير Business Logic أو المصدر.

الـGate النهائي هو `BLOCKED_PHASE_03A_R3B_R2_SETUP_BOOTSTRAP`.

## 2. Preconditions

تمت قراءة مدخلات R3B-R2 المطلوبة:

| Input | Result |
|---|---|
| `docs/DARFUS_PHASE_03A_R3A_FIRST_RUN_BROWSER_PATH_FORENSIC_ACCEPTANCE_CRITERIA_CORRECTION_REPORT.md` | `READ_COMPLETE` |
| `docs/DARFUS_PHASE_03A_R3B_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE_DISPOSABLE_POSTGRES_REPORT.md` | `READ_COMPLETE` |
| `docs/DARFUS_PHASE_03A_R3B_R1_DISPOSABLE_FRONTEND_RUNTIME_ISOLATION_FORENSIC_REPORT.md` | `READ_COMPLETE` |
| R3B-R2 instruction | `READ_COMPLETE` |
| R3B-R1 prerequisites | satisfied |

R3B-R1 conclusions were accepted without reopening:

```text
PRODUCT_FIRST_RUN_INTEGRATION_GAP = NO
PRODUCT_SOURCE_PATCH_REQUIRED = NO
ACCEPTANCE_RUNTIME_CHANGE_REQUIRED = YES
EXISTING_DISPOSABLE_DB_SAFE_TO_REUSE = YES
DISPOSABLE_BACKEND_8121_CONFIGURATION_WAS_CORRECT = YES
```

## 3. Main Project Protection Baseline Before

The original project was inspected read-only before creating the runtime copy.

```text
MAIN_PROJECT = I:\WORK\jewellery-erp-master
CURRENT_BRANCH = main
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
STATUS_LINES = 343
TRACKED_MODIFIED_COUNT = 88
UNTRACKED_COUNT = 733
STASH_COUNT = 11
```

Pre-existing protected-state observations:

- `next-env.d.ts` was already modified in the worktree and retained its Owner-accepted generated drift; it was not edited by R3B-R2.
- `AGENTS.md` was already untracked at baseline; it was not edited by R3B-R2.
- The original project had no R3B-R2 runtime copy or generated `.next` from this control before the copy was created.

Sensitive/config file hashes were captured without printing env contents:

| File | SHA-256 |
|---|---|
| `package.json` | `F9DB91B73D622BD366D678F4A49863527AADF8AB8CDC52D858A6877A5157563A` |
| `package-lock.json` | `D5E65131FBE7944597F77759C13319B22007D04D476C73F6F139804090C61E99` |
| `next.config.ts` | `B31A7B6C8B35DC2FFFBAB53CD4FC1538E7F0914025777FC778D5ADB571D56213` |
| `next-env.d.ts` | `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B186264B9AAAF240CC` |
| `.env` | `09C446E1F1D17848B927A2BFAB01406504F23AA5E7885DFF89D520AF8B782631` |
| `backend/package.json` | `231A19D0A81C2579F4D1B8E4D676A7085BA6811516630B811627B58A5CB3A86B` |

## 4. Official Backup Reverification

Backup:

```text
I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_R2_FULL_20260818_095351.dump
```

| Check | Result |
|---|---|
| Size | `646071` bytes |
| Required SHA-256 | `844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1` |
| Calculated SHA-256 | exact match |
| `pg_restore -l` | exit `0` |
| New backup created | `NO` |

## 5. Official DB Baseline Before

Read-only query against `darfus_erp` returned:

```text
darfus_erp|postgres
SequelizeMeta|83
companies|1
branches|1
users|1
profile_master_data|659
pearl_size_master_data|39
barcode_inventory_codes|5
barcode_item_codes|20
barcode_sequences|0
inventory_master_data_bootstrap_states|1
audit_logs|23
suppliers|0
inventory_locations|0
settings|0
purchase_orders|0
assets|0
inventory_asset_movements|0
payments|0
journal_entries|0
journal_lines|0
idempotency_requests|0
INVENTORY_REFERENCE_MASTER_DATA|2|READY|d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
```

The baseline matched the required R3B-R2 values. No unexplained official drift was found.

## 6. Disposable Freshness Reverification

Read-only identity and counts before the controlled Browser run:

```text
darfus_first_run_r3b_20260818_104917|postgres
SequelizeMeta|83
companies|0
branches|0
users|0
profile_master_data|0
pearl_size_master_data|0
barcode_inventory_codes|0
barcode_item_codes|0
barcode_sequences|0
inventory_master_data_bootstrap_states|0
purchase_orders|0
assets|0
inventory_asset_movements|0
payments|0
journal_entries|0
journal_lines|0
idempotency_requests|0
first_run_setup_states|0
```

Direct Backend status before mutation:

```text
GET http://localhost:8121/api/v1/setup/status
HTTP 200
{"success":true,"data":{"state":"SETUP_REQUIRED","action":"SETUP"}}
```

## 7. Temporary Runtime Copy Creation

The temporary copy was created outside the original project:

```text
TEMP_RUNTIME_ROOT = I:\WORK\_darfus_r3b_r2_runtime_20260818_112608
TEMP_RUNTIME_IS_OUTSIDE_MAIN_PROJECT = YES
```

Copy strategy:

- source/config copied for runtime;
- `.git`, `.next`, `node_modules`, backups, docs, generated reports/logs, and env files were excluded;
- no file in the original project was normalized or cleaned;
- the temporary copy had no `.next` before the isolated Frontend started.

## 8. Dependency Isolation

Dependency method: lockfile-respecting install inside the temporary copy.

```text
Frontend/root: npm ci --ignore-scripts → 445 packages added
Backend:       npm ci --ignore-scripts → 320 packages added
```

No install, update, or package write occurred in the original project. No global package change was made. No `npm audit fix` was run.

## 9. Disposable Backend Start/Identity

The Backend was started from the temporary copy only, using process-local values:

```text
URL = http://localhost:8121
DB_HOST = 127.0.0.1
DB_PORT = 5433
DB_NAME = darfus_first_run_r3b_20260818_104917
DB_USER = postgres
DB_SSL = false
NODE_ENV = test
FIRST_RUN_SETUP_TOKEN_PRESENT = YES (value not reported)
REDIS_URL = not configured; queue remained in-memory
```

Runtime proof:

```text
GET /api/v1/health        → 200
GET /api/v1/setup/status  → 200 SETUP_REQUIRED
current_database()        → darfus_first_run_r3b_20260818_104917
```

The Backend process was stopped after evidence capture. Main `:8000` was not restarted.

## 10. Disposable Frontend Start

The Frontend was a real Next process started from `TEMP_RUNTIME_ROOT`, not a proxy and not the main Frontend:

```text
Next.js = 16.2.9
Mode = development / webpack
URL = http://localhost:3301
DISPOSABLE_FRONTEND_IS_ACTUAL_NEXT_PROCESS = YES
MAIN_FRONTEND_BUNDLE_REUSED = NO
```

The process-local values were:

```text
NEXT_PUBLIC_API_URL = http://localhost:8121/api/v1
NEXT_PUBLIC_API_ORIGIN = http://localhost:8121
NEXT_PUBLIC_DATA_SOURCE = api
```

No persistent env file was created or modified.

## 11. Compiled Browser API Base Proof

After requesting `/ar/setup`, the temporary `.next` was generated under:

```text
I:\WORK\_darfus_r3b_r2_runtime_20260818_112608\.next
```

The actual client chunk `/ _next/static/chunks/app/[locale]/setup/page.js` was fetched from the isolated Frontend and contained:

```text
http://localhost:8121/api/v1
```

The same client chunk did not contain:

```text
http://localhost:8000/api/v1
```

Therefore:

```text
NEXT_PUBLIC_API_URL_EFFECTIVE = http://localhost:8121/api/v1
NEXT_PUBLIC_DATA_SOURCE_EFFECTIVE = api
BROWSER_API_BASE_TO_DISPOSABLE_BACKEND = PASS
TEMP_NEXT_DIR_ISOLATED = YES
```

## 12. Real Browser Setup Status GET

Real Browser URL:

```text
http://localhost:3301/ar/setup
```

The Browser loaded the page, hydrated the client, and the Backend terminal recorded:

```text
GET /api/v1/setup/status 200
```

The direct Disposable response was `SETUP_REQUIRED`. The request was served by the isolated Backend on `8121`; no `:8000` bundle/base was involved.

```text
REAL_BROWSER_SETUP_STATUS_GET = PASS
SETUP_STATUS_HTTP_STATUS = 200
SETUP_STATUS_STATE = SETUP_REQUIRED
```

## 13. First-Run Form Proof

Browser DOM after hydration:

```text
form "First-time setup"
textbox "Setup authorization"
textbox "First name"
textbox "Last name"
textbox "Email"
textbox "Company name"
textbox "Password"
textbox "Confirm password"
textbox "Workspace"
textbox "First Branch"
textbox "Branch code"
textbox "Currency"
button "Create first workspace"
```

```text
REAL_BROWSER_SETUP_FORM = PASS
```

Browser console contained only React DevTools information and `[HMR] connected`; no fatal, hydration, chunk, CORS, or network exception was observed.

## 14. Browser Setup POST

Controlled Browser submissions produced:

| Attempt | Browser result | Evidence |
|---:|---|---|
| 1 | `422` | Password policy rejected account-identity text |
| 2 | `422` | Workspace format rejected because it contained spaces |
| 3 | `409` | Same page idempotency key was not reused for a changed request body |
| 4, clean page/new key | `409` | Valid disposable values reached the Backend but bootstrap failed |

The final clean Browser request was observed by the isolated Backend as:

```text
POST /api/v1/setup/bootstrap 409
```

The Browser UI displayed the safe generic error `Setup could not be completed. Review the form and authorization, then retry.` No secret value was reported.

```text
REAL_BROWSER_SETUP_POST = FAIL_409
SETUP_POST_HTTP_STATUS = 409
IDEMPOTENCY_HEADER = ACCEPTED_BY_SERVER_CONTRACT; VALUE_NOT_REPORTED
SETUP_TOKEN_HEADER = ACCEPTED_BY_SERVER_CONTRACT; VALUE_NOT_REPORTED
```

The `409` proves the request passed token/key/payload gates far enough to reach the bootstrap transaction boundary. The exact server error code was not emitted by the console transport, so it is not invented here.

## 15. Backend Orchestrator Proof

The canonical controller and service were reached by the final Browser POST. Source trace confirms the expected order:

```text
setup.controller.bootstrap
→ bootstrapFirstRun
→ token verification
→ idempotency key validation
→ payload validation
→ PostgreSQL transaction/advisory lock
→ FirstRunSetupState marker
→ Company/User/Branch
→ financial bootstrap
→ inventory master-data bootstrap
→ final validation
→ audit/READY/commit
```

Runtime result: the request returned `409` and the Disposable DB has no marker or created rows. Therefore completion of the orchestrator was not proven; the transaction was rolled back or rejected before commit.

```text
FIRST_RUN_ORCHESTRATOR = INVOKED_BY_BROWSER; FAILED_409; NO_COMMIT; ROLLBACK_EFFECT_OBSERVED
```

The exact `errorCode`/constraint causing the `409` is not available from the terminal formatter or Browser API surface. No Product fix is inferred.

## 16. Company/User/Branch Result

After the failed clean POST:

```text
companies = 0
branches = 0
users = 0
first_run_setup_states = 0
```

```text
COMPANY_COUNT_AFTER = 0
BRANCH_COUNT_AFTER = 0
USER_COUNT_AFTER = 0
```

No partial setup rows remained.

## 17. COA/Financial Readiness

After the failed POST:

```text
roles = 0
accounts = 0
system_account_roles = 0
branch_financial_mappings = 0
journal_entries = 0
journal_lines = 0
```

```text
COA_BOOTSTRAP = NOT_COMMITTED
FINANCIAL_READINESS = NOT_REACHED_OR_ROLLED_BACK
```

No setup foundation row was left behind.

## 18. Inventory Master Bootstrap

The inventory bootstrap did not commit:

```text
INVENTORY_MASTER_BOOTSTRAP = NOT_COMMITTED
profile_master_data = 0
pearl_size_master_data = 0
barcode_inventory_codes = 0
barcode_item_codes = 0
barcode_sequences = 0
inventory_master_data_bootstrap_states = 0
```

No barcode sequence was allocated.

## 19. Canonical Master Data Coverage

Because First-Run did not commit, the expected canonical category counts were not created in the Disposable:

| Category | Disposable after failed POST | Required after successful setup |
|---|---:|---:|
| `CERTIFICATE_AUTHORITY` | `0 / NOT_COMMITTED` | 16 |
| `DIAMOND_TONE` | `0 / NOT_COMMITTED` | 14 |
| `DIAMOND_TONE_LEVEL` | `0 / NOT_COMMITTED` | 9 |
| `DIAMOND_SATURATION` | `0 / NOT_COMMITTED` | 10 |
| `DIAMOND_POSITION` | `0 / NOT_COMMITTED` | 7 |
| `DIAMOND_SETTING` | `0 / NOT_COMMITTED` | 47 |
| `GEMSTONE_POSITION` | `0 / NOT_COMMITTED` | 7 |
| `GEMSTONE_SETTING` | `0 / NOT_COMMITTED` | 47 |
| `GEMSTONE_TREATMENT` | `0 / NOT_COMMITTED` | 0 |

Canonical value checks were `NOT_EXECUTED_AFTER_SUCCESS`:

```text
Gübelin = NOT_CREATED_IN_DISPOSABLE
Gubelin canonical = NOT_CREATED_IN_DISPOSABLE
WT = NOT_CREATED_IN_DISPOSABLE
WCH = NOT_CREATED_IN_DISPOSABLE
ERR canonical = NOT_CREATED_IN_DISPOSABLE
NLC canonical = NOT_CREATED_IN_DISPOSABLE
```

## 20. Bootstrap V2 READY

Not reached. The Disposable marker table remained empty and no dataset was committed.

```text
BOOTSTRAP_STATE_ROWS = 0
BOOTSTRAP_DATASET = NOT_CREATED
BOOTSTRAP_VERSION = NOT_CREATED
BOOTSTRAP_STATE = NOT_CREATED
BOOTSTRAP_MANIFEST_HASH = NOT_CREATED
```

## 21. Browser READY State

The Browser remained on the First-Run form with a safe error alert after the final `409`.

```text
READY_BROWSER_STATE = FAIL_NOT_REACHED
```

No READY replay UI was added or used.

## 22. Login Proof

Not run. No disposable administrator was committed and no credentials were reused outside the Browser form.

```text
LOGIN_AFTER_SETUP = NOT_RUN
```

## 23. Idempotency/Conflict Proof

The Browser source contract sends a generated `Idempotency-Key` on `/setup/bootstrap`, and the final request reached the Backend with a valid key/token path. The first page’s changed-body retry produced a `409`, consistent with the service’s fail-closed idempotency/transaction rules. However, because the final successful setup never committed, a replay of a successful setup was not run.

```text
FIRST_RUN_IDEMPOTENCY = PARTIAL_FAIL_PROOF; INVALID_RETRY_CONFLICT_OBSERVED; SUCCESSFUL_REPLAY_NOT_RUN
```

No `idempotency_requests` row was created in the Disposable.

## 24. Rollback/Atomicity Evidence

The failed Browser POST left all setup and transaction tables at zero. This is direct rollback-effect evidence for the observed failure path:

```text
FIRST_RUN_ROLLBACK_ATOMICITY = SUPPORTED_WITH_EXPLICIT_LIMITATION
```

Limitation: no failure-injection scenario was run, and the exact `409` error code/constraint was not captured. No source change was made to create one.

## 25. Disposable Business-Mutation Check

After all Browser attempts:

```text
companies = 0
branches = 0
users = 0
purchase_orders = 0
assets = 0
inventory_asset_movements = 0
payments = 0
journal_entries = 0
journal_lines = 0
profile_master_data = 0
pearl_size_master_data = 0
barcode_sequences = 0
```

```text
DISPOSABLE_UNAUTHORIZED_BUSINESS_TRANSACTIONS = 0
```

No supplier, location, VAT, asset, POS, customer, or business inventory transaction was created.

## 26. Official DB Baseline After

The read-only official query after stopping the isolated processes returned the same values:

```text
darfus_erp|postgres
SequelizeMeta|83
companies|1
branches|1
users|1
profile_master_data|659
pearl_size_master_data|39
barcode_inventory_codes|5
barcode_item_codes|20
barcode_sequences|0
inventory_master_data_bootstrap_states|1
audit_logs|23
suppliers|0
inventory_locations|0
settings|0
purchase_orders|0
assets|0
inventory_asset_movements|0
payments|0
journal_entries|0
journal_lines|0
idempotency_requests|0
INVENTORY_REFERENCE_MASTER_DATA|2|READY|d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
```

## 27. Official DB Reconciliation

| Area | Before | After | Result |
|---|---:|---:|---|
| `SequelizeMeta` | 83 | 83 | unchanged |
| Company/Branch/User | 1/1/1 | 1/1/1 | unchanged |
| Profile/Pearl master data | 659/39 | 659/39 | unchanged |
| Barcode inventory/item | 5/20 | 5/20 | unchanged |
| Barcode sequences | 0 | 0 | unchanged |
| Bootstrap state | 1 READY | 1 READY | unchanged |
| Audit logs | 23 | 23 | unchanged |
| Suppliers/Locations/Settings | 0/0/0 | 0/0/0 | unchanged |
| PO/Assets/Movements | 0/0/0 | 0/0/0 | unchanged |
| Payments/Journals/Lines | 0/0/0 | 0/0/0 | unchanged |
| Idempotency requests | 0 | 0 | unchanged |

```text
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
OFFICIAL_BASELINE_AFTER = PASS
```

## 28. Main Project Protection Baseline After

After the isolated processes were stopped, before creating this required report, main runtime ports were:

```text
3000 = still listening
8000 = still listening
8121 = stopped
3301 = stopped
```

Main project baseline remained:

```text
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
STATUS_LINES = 343
TRACKED_MODIFIED_COUNT = 88
UNTRACKED_COUNT = 733
STASH_COUNT = 11
```

Protected file hashes and mtimes matched the pre-run capture. `next-env.d.ts` remained the pre-existing Owner-accepted drift; it was not edited.

## 29. Main Project Before/After Reconciliation

| Check | Result |
|---|---|
| Original source changed by R3B-R2 | `NO` |
| Original tests changed by R3B-R2 | `NO` |
| Original migrations changed/created | `NO / 0` |
| Original config/env changed | `NO` |
| Original `next-env.d.ts` changed by R3B-R2 | `NO` |
| Original `.next` used by isolated Frontend | `NO` |
| Main frontend restarted | `NO` |
| Main backend restarted | `NO` |
| Build run | `NO` |

The only intentional original-project creation from this control is the report itself.

## 30. Process Shutdown

Only R3B-R2-owned processes were stopped:

```text
Disposable Backend :8121 = stopped
Disposable Frontend :3301 = stopped
Main Frontend :3000 = not stopped
Main Backend :8000 = not stopped
PostgreSQL = not stopped
Redis = not stopped
```

## 31. Temporary Runtime Cleanup Status

The runtime copy was retained for Owner review and evidence preservation:

```text
TEMP_RUNTIME_CLEANUP = DEFERRED_OWNER_DECISION
TEMP_RUNTIME_ROOT = I:\WORK\_darfus_r3b_r2_runtime_20260818_112608
```

No automatic deletion was performed.

## 32. Disposable DB Cleanup Status

The existing Disposable database was retained Fresh for Owner review or an explicitly approved future control:

```text
DISPOSABLE_DB_CLEANUP = DEFERRED_OWNER_DECISION
DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
```

No reset, drop, cleanup, or seed was performed.

## 33. Remaining Out-of-Scope Work

Not started:

- source patch or Product workaround;
- migration, seed, or master-data provisioning on the Official DB;
- Supplier/Location/VAT configuration;
- GBW, GBP, Diamond, Gem, or Pearl acceptance;
- Phase 03B;
- cleanup of the temporary runtime or Disposable DB;
- replay of successful First-Run, login, or post-READY acceptance.

## 34. Phase 03A Closure Matrix

| Area | Required | Actual R3B-R2 |
|---|---|---|
| Original project untouched | PASS | PASS |
| Official DB unchanged | PASS | PASS |
| Disposable DB identity | PASS | PASS |
| Disposable fresh state | PASS | PASS before and after rollback |
| Actual isolated Backend | PASS | PASS |
| Actual isolated Next Frontend | PASS | PASS |
| Main bundle not reused | PASS | PASS |
| Browser API base → Disposable Backend | PASS | PASS |
| Browser GET `/setup/status` | PASS | PASS, 200 SETUP_REQUIRED |
| First-Run form | PASS | PASS |
| Browser POST `/setup/bootstrap` | PASS | FAIL, 409 |
| Setup token boundary | PASS | request passed to 409 path; value redacted |
| Idempotency header | PASS | request passed to 409 path; value redacted |
| Backend orchestrator | PASS | invoked, not committed |
| Company/User/Branch | PASS | not created |
| COA/financial readiness | PASS | not committed |
| Inventory Master Bootstrap | PASS | not committed |
| 659/39/5/20 | PASS | not reached; Disposable remains zero |
| Barcode sequences 0 | PASS | PASS, remained zero |
| Bootstrap V2 READY | PASS | not reached |
| Canonical category coverage | PASS | not reached |
| READY Browser state | PASS | FAIL, form error remained |
| Official DB protection | PASS | PASS |
| Git/source safety | PASS | PASS |

```text
PHASE_03A_FIRST_RUN_REAL_BROWSER = FAIL
PHASE_03A_FIRST_RUN_NETWORK = PARTIAL_PASS_GET_PASS_POST_409
PHASE_03A_FIRST_RUN_BACKEND = FAIL_BOOTSTRAP_409
PHASE_03A_FIRST_RUN_DISPOSABLE_DB = PASS_FRESH_ROLLBACK_ONLY
PHASE_03A_BOOTSTRAP_VERSIONING = NOT_REACHED
PHASE_03A_BOOTSTRAP_IDEMPOTENCY = PARTIAL_FAIL_PROOF
PHASE_03A_OFFICIAL_DB_PROTECTION = PASS
PHASE_03A_MAIN_PROJECT_PROTECTION = PASS
PHASE_03A_FINAL_CLOSED = NO
```

## 35. Gate

The required isolated Browser and GET proof passed. The required setup POST reached the correct Disposable Backend but returned `409`, so the core First-Run acceptance cannot close.

The exact error code/constraint behind the `409` was not exposed by the available terminal formatter or Browser evidence surface. No source patch or Business Rule change is justified. The minimum safe next action is a separate read-only root-cause investigation of the Disposable-only `bootstrap` 409, followed by an Owner-approved retry only after the cause is proven.

```text
GATE = BLOCKED_PHASE_03A_R3B_R2_SETUP_BOOTSTRAP
```

## 36. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3B-R2-TRUE-FIRST-RUN-BROWSER-RETRY-FULLY-ISOLATED-RUNTIME
PHASE = 03A-R3B-R2
MODE = CONTROLLED_DISPOSABLE_ACCEPTANCE_WITH_FULL_RUNTIME_ISOLATION

MAIN_PROJECT = I:\WORK\jewellery-erp-master
TEMP_RUNTIME_ROOT = I:\WORK\_darfus_r3b_r2_runtime_20260818_112608
TEMP_RUNTIME_IS_OUTSIDE_MAIN_PROJECT = YES
TEMP_NEXT_DIR_ISOLATED = YES

MAIN_FRONTEND = http://localhost:3000
MAIN_BACKEND = http://localhost:8000
MAIN_RUNTIME_RESTARTED = NO

OFFICIAL_DB = darfus_erp
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0

DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
DISPOSABLE_DB_IDENTITY = PASS
DISPOSABLE_DB_FRESH_BEFORE = PASS
DISPOSABLE_BACKEND_URL = http://localhost:8121
DISPOSABLE_BACKEND_DB_IDENTITY = darfus_first_run_r3b_20260818_104917
DISPOSABLE_FRONTEND_URL = http://localhost:3301
DISPOSABLE_FRONTEND_IS_ACTUAL_NEXT_PROCESS = YES
MAIN_FRONTEND_BUNDLE_REUSED = NO

NEXT_PUBLIC_API_URL_EFFECTIVE = http://localhost:8121/api/v1
NEXT_PUBLIC_DATA_SOURCE_EFFECTIVE = api
BROWSER_API_BASE_TO_DISPOSABLE_BACKEND = PASS

REAL_BROWSER_SETUP_STATUS_GET = PASS
SETUP_STATUS_HTTP_STATUS = 200
SETUP_STATUS_STATE = SETUP_REQUIRED
REAL_BROWSER_SETUP_FORM = PASS
REAL_BROWSER_SETUP_POST = FAIL_409
SETUP_POST_HTTP_STATUS = 409
IDEMPOTENCY_HEADER = ACCEPTED_BY_SERVER; VALUE_NOT_REPORTED
SETUP_TOKEN_HEADER = ACCEPTED_BY_SERVER; VALUE_NOT_REPORTED

FIRST_RUN_ORCHESTRATOR = INVOKED; FAILED_409; ROLLED_BACK; NOT_COMMITTED
COMPANY_COUNT_AFTER = 0
BRANCH_COUNT_AFTER = 0
USER_COUNT_AFTER = 0
COA_BOOTSTRAP = NOT_COMMITTED
FINANCIAL_READINESS = NOT_REACHED_OR_ROLLED_BACK
INVENTORY_MASTER_BOOTSTRAP = NOT_COMMITTED

PROFILE_MASTER_DATA = 0
PEARL_SIZE_MASTER_DATA = 0
BARCODE_INVENTORY_CODES = 0
BARCODE_ITEM_CODES = 0
BARCODE_SEQUENCES = 0
BOOTSTRAP_STATE_ROWS = 0
BOOTSTRAP_DATASET = NOT_CREATED
BOOTSTRAP_VERSION = NOT_CREATED
BOOTSTRAP_STATE = NOT_CREATED
BOOTSTRAP_MANIFEST_HASH = NOT_CREATED

CERTIFICATE_AUTHORITY_COUNT = 0_NOT_COMMITTED
DIAMOND_TONE_COUNT = 0_NOT_COMMITTED
DIAMOND_TONE_LEVEL_COUNT = 0_NOT_COMMITTED
DIAMOND_SATURATION_COUNT = 0_NOT_COMMITTED
DIAMOND_POSITION_COUNT = 0_NOT_COMMITTED
DIAMOND_SETTING_COUNT = 0_NOT_COMMITTED
GEMSTONE_POSITION_COUNT = 0_NOT_COMMITTED
GEMSTONE_SETTING_COUNT = 0_NOT_COMMITTED
GEMSTONE_TREATMENT_COUNT = 0_NOT_COMMITTED

READY_BROWSER_STATE = FAIL_NOT_REACHED
LOGIN_AFTER_SETUP = NOT_RUN
FIRST_RUN_IDEMPOTENCY = PARTIAL_FAIL_PROOF
FIRST_RUN_ROLLBACK_ATOMICITY = SUPPORTED_WITH_EXPLICIT_LIMITATION

DISPOSABLE_UNAUTHORIZED_BUSINESS_TRANSACTIONS = 0
OFFICIAL_BASELINE_AFTER = PASS
NO_INTENTIONAL_MAIN_PROJECT_FILE_CHANGES = YES
SOURCE_CODE_CHANGED_IN_MAIN = NO
TEST_CODE_CHANGED_IN_MAIN = NO
MIGRATIONS_CREATED_IN_MAIN = 0
BUILD_RUN = NO

TEMP_RUNTIME_CLEANUP = DEFERRED_OWNER_DECISION
DISPOSABLE_DB_CLEANUP = DEFERRED_OWNER_DECISION

PHASE_03A_FIRST_RUN_REAL_BROWSER = FAIL
PHASE_03A_FIRST_RUN_NETWORK = PARTIAL_PASS_GET_PASS_POST_409
PHASE_03A_FIRST_RUN_BACKEND = FAIL_BOOTSTRAP_409
PHASE_03A_FIRST_RUN_DISPOSABLE_DB = PASS_FRESH_ROLLBACK_ONLY
PHASE_03A_OFFICIAL_DB_PROTECTION = PASS
PHASE_03A_MAIN_PROJECT_PROTECTION = PASS
PHASE_03A_FINAL_CLOSED = NO

GATE = BLOCKED_PHASE_03A_R3B_R2_SETUP_BOOTSTRAP
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_SETUP_BOOTSTRAP_409_ROOT_CAUSE; NO_AUTOMATIC_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No automatic retry, source patch, migration, seed, Official DB write, cleanup, Phase 03B, Supplier/Location/VAT work, or profile acceptance was started.
