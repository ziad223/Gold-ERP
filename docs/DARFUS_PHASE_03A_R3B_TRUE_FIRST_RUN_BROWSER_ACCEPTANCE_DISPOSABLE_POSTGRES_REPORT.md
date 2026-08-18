# DARFUS ERP — Phase 03A-R3B True First-Run Browser Acceptance Report

Control ID: `DARFUS-PHASE-03A-R3B-TRUE-FIRST-RUN-BROWSER-ACCEPTANCE-DISPOSABLE-POSTGRES`

Mode: `CONTROLLED_DISPOSABLE_ACCEPTANCE`

Official DB: `darfus_erp` — READ-ONLY

## 1. Executive Summary

تم إنشاء Disposable PostgreSQL target جديد وتطبيق سلسلة الـ83 migration عليه فقط. تم إثبات أن الهدف هو قاعدة جديدة باسم:

`darfus_first_run_r3b_20260818_104917`

وبدأت بحالة fresh صحيحة: `SequelizeMeta=83`، ولا توجد Company/User/Branch أو Inventory Master Data أو business transactions. Backend معزول على `http://localhost:8121` أعاد `GET /api/v1/setup/status = SETUP_REQUIRED`.

تم تشغيل real Browser على isolated frontend URL `http://localhost:3001` عبر runtime proxy مؤقت يرسل صفحات/assets من `localhost:3000` و`/api/v1` إلى Backend Disposable. Browser حمّل صفحة `/ar/setup` وassets، لكنه بقي في حالة `Preparing setup…` ولم يعرض First-Run form، ولم يرسل `GET /api/v1/setup/status` أو `POST /api/v1/setup/bootstrap` عبر الـisolated path. Backend logs أثبتت عدم وجود setup POST أو استدعاء orchestrator.

لذلك لا يجوز اعتبار First-Run Browser/Network/Backend acceptance ناجحًا، ولا يجوز تعويضه بـdirect POST. الـDisposable DB محفوظة ولم تُحذف تلقائيًا، والـOfficial DB بقيت unchanged بالكامل.

## 2. Preconditions

تمت قراءة تقارير R1/R1A/R2/B2/R3/R3A وجميع authority inputs المطلوبة كاملة.

| Gate / Authority | Result |
|---|---|
| R3A gate | `PASS_PHASE_03A_R3A_FIRST_RUN_PATH_AND_ACCEPTANCE_CRITERIA_DEFINED` |
| Real product First-Run gap | `NO` بحسب R3A source trace |
| READY replay button | `NO` required |
| First-Run source integration change | `NO` |
| Acceptance source change | `NO_PRODUCT_SOURCE_CHANGE` |
| Safe target | Dedicated disposable PostgreSQL DB |
| Official DB | `darfus_erp`, read-only |

## 3. Official Safety Backup Reverification

Backup file:

`I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_R2_FULL_20260818_095351.dump`

| Check | Result |
|---|---|
| File size | `646071` bytes |
| Required SHA-256 | `844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1` |
| Calculated SHA-256 | same exact hash |
| `pg_restore -l` | PASS, exit code 0 |
| Official backup mutation | none |

## 4. Official DB Baseline Before

Read-only query against `darfus_erp` returned:

```text
identity|darfus_erp|postgres
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
bootstrap|INVENTORY_REFERENCE_MASTER_DATA|2|READY|d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
```

The baseline matched the required post-R2 values. No unexplained official drift was found.

## 5. Disposable DB Creation

The new database was created on the local PostgreSQL service only:

```text
DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
```

It was not cloned from the official READY database and no official rows were copied.

## 6. Disposable Target Identity Proof

Immediately after creation:

```text
current_database = darfus_first_run_r3b_20260818_104917
current_user = postgres
server = PostgreSQL 16.15
```

`current_database != darfus_erp` was proven.

## 7. Migration Target Proof

Migration process was executed from `backend` with command-local environment values only:

```text
DB_HOST = 127.0.0.1
DB_PORT = 5433
DB_NAME = darfus_first_run_r3b_20260818_104917
DB_USER = postgres
DB_SSL = false
```

The non-secret resolver output confirmed the exact target before migration. No `DATABASE_URL` override was used. The project source contained 83 migration files and the chain completed through:

`20260818010000-create-inventory-master-data-bootstrap-state.js`

No unknown migration was discovered or applied.

## 8. Disposable Schema/Migration State

After migration:

```text
DISPOSABLE_SEQUELIZE_META = 83
LATEST_MIGRATION = 20260818010000-create-inventory-master-data-bootstrap-state.js
```

Migration writes were limited to the new Disposable DB. No official migration was executed.

## 9. Disposable Fresh Baseline

Read-only query before First-Run returned:

```text
identity|darfus_first_run_r3b_20260818_104917|postgres
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
SETUP_STATE_MARKER_ROWS=0
```

This proves a true fresh setup state and not a reused READY target.

## 10. Disposable Runtime Isolation

| Runtime | URL / Port | Target |
|---|---|---|
| Main frontend | `http://localhost:3000` | Existing main runtime; not repointed |
| Disposable frontend access | `http://localhost:3001` | Temporary proxy; web/assets → 3000, `/api/v1` → 8121 |
| Disposable backend | `http://localhost:8121` | Disposable DB only |
| Official backend | `http://localhost:8000` | Not repointed or restarted |
| Disposable DB | `darfus_first_run_r3b_20260818_104917` | Exact verified target |

No Next build or Next dev process was started. No persistent `.env`, `.env.local`, compose file, or config file was modified. The proxy and backend were temporary foreground runtime sessions and were stopped after the blocked attempt.

## 11. Setup Token/Security Proof

The disposable backend inherited the existing `FIRST_RUN_SETUP_TOKEN` from the local backend environment through a process-local variable.

```text
FIRST_RUN_SETUP_TOKEN_PRESENT = YES
FIRST_RUN_SETUP_TOKEN_VALUE = NOT_REPORTED
```

The token contract was not disabled or changed. No token, password, cookie, or authorization value was written to the report.

## 12. Browser SETUP_REQUIRED Proof

Direct read-only request to the Disposable backend:

```text
GET http://localhost:8121/api/v1/setup/status
HTTP 200
{"success":true,"data":{"state":"SETUP_REQUIRED","action":"SETUP"}}
```

The real Browser opened:

`http://localhost:3001/ar/setup`

It loaded HTML and frontend assets, but the visible DOM remained:

```text
- main:
  - text: Preparing setup…
```

The required First-Run form (`First-time setup`, fields, and `Create first workspace`) was not visible.

Result: `REAL_BROWSER_SETUP_FORM = FAIL`.

## 13. Browser Form Submission

No form was visible, therefore no form submission was performed. No fake company, user, branch, or password data was submitted.

This is an acceptance/runtime blocker. It is not evidence that the source orchestrator is missing; R3A source evidence already proved that integration exists.

## 14. Network POST Evidence

Required request:

`POST /api/v1/setup/bootstrap`

Actual result:

```text
REAL_BROWSER_SETUP_POST = FAIL_NOT_OBSERVED
SETUP_POST_HTTP_STATUS = NOT_SENT
IDEMPOTENCY_HEADER = NOT_SENT
SETUP_TOKEN_HEADER = NOT_SENT
```

The isolated proxy logged frontend HTML/assets and HMR requests, but no `/api/v1/setup/status` or `/api/v1/setup/bootstrap` request from the Browser. The disposable backend log showed only health/status GET requests generated by direct runtime checks and no setup POST.

No direct POST was used as a substitute because that would not satisfy the required real-browser proof.

## 15. Backend Orchestrator Evidence

Backend runtime itself was healthy:

```text
GET http://localhost:8121/api/v1/health → 200
GET http://localhost:8121/api/v1/setup/status → 200 SETUP_REQUIRED
```

Backend logs confirmed database connection to the Disposable target and a clean shutdown. No `bootstrapFirstRun` request occurred, so the following runtime chain was not executed in R3B:

`SETUP_IN_PROGRESS → Company → User → Branch → COA → Financial Mappings → Inventory Bootstrap → READY`.

The source call graph remains proven by R3A; this R3B control did not count source-only evidence as Browser runtime evidence.

## 16. Company/User/Branch Result

Disposable DB after the blocked Browser attempt:

```text
companies = 0
branches = 0
users = 0
```

No First-Run business setup rows were created.

## 17. COA/Financial Readiness Result

The COA/financial bootstrap service was not invoked by Browser because no setup POST occurred.

```text
COA_BOOTSTRAP = NOT_EXECUTED_BROWSER_PATH
FINANCIAL_READINESS = NOT_EXECUTED_BROWSER_PATH
```

No accounts, SystemAccountRoles, or BranchFinancialMappings were created by R3B.

## 18. Inventory Master Bootstrap Result

Inventory Master Data Bootstrap was not invoked by Browser.

```text
INVENTORY_MASTER_BOOTSTRAP = NOT_EXECUTED_BROWSER_PATH
PROFILE_MASTER_DATA = 0
PEARL_SIZE_MASTER_DATA = 0
BARCODE_INVENTORY_CODES = 0
BARCODE_ITEM_CODES = 0
BARCODE_SEQUENCES = 0
INVENTORY_MASTER_DATA_BOOTSTRAP_STATES = 0
```

The existing R2 official/replay evidence remains valid, but it is not substituted for the required fresh Browser proof.

## 19. Canonical Master Data Coverage

Because the Browser First-Run did not execute, no disposable canonical rows were created. Therefore all post-bootstrap coverage checks are `NOT_EXECUTED_BROWSER_PATH`:

| Category / value | Disposable result |
|---|---:|
| `CERTIFICATE_AUTHORITY` | 0 / not executed |
| `DIAMOND_TONE` | 0 / not executed |
| `DIAMOND_TONE_LEVEL` | 0 / not executed |
| `DIAMOND_SATURATION` | 0 / not executed |
| `DIAMOND_POSITION` | 0 / not executed |
| `DIAMOND_SETTING` | 0 / not executed |
| `GEMSTONE_POSITION` | 0 / not executed |
| `GEMSTONE_SETTING` | 0 / not executed |
| `GEMSTONE_TREATMENT` | 0 / not executed |
| `Gübelin` | not executed |
| `Gubelin` canonical | not executed |
| `WT`, `WCH`, `ERR`, `NLC` | not executed |

## 20. Bootstrap Version/State Result

The Disposable target correctly began without a bootstrap state row. No version 2 state was created because First-Run did not reach the service.

```text
BOOTSTRAP_STATE_ROWS = 0
BOOTSTRAP_DATASET = NOT_CREATED
BOOTSTRAP_VERSION = NOT_CREATED
BOOTSTRAP_STATE = NOT_CREATED
BOOTSTRAP_MANIFEST_HASH = NOT_CREATED
```

## 21. READY Browser Proof

Not reached. The Browser never left `Preparing setup…` and no setup POST occurred.

```text
READY_BROWSER_STATE = FAIL_NOT_REACHED
```

No replay button was expected or added.

## 22. Login Proof

Not run. No disposable administrator was created and no credentials were submitted.

```text
LOGIN_AFTER_SETUP = NOT_RUN
```

## 23. Idempotency/Conflict Proof

No Browser setup POST occurred, so Browser idempotency/conflict proof was not run. Existing R2/source/test evidence remains separate and was not relabeled as R3B Browser proof.

```text
FIRST_RUN_IDEMPOTENCY = NOT_RUN_BROWSER_PATH
```

## 24. Rollback/Atomicity Evidence

No failure injection or mutation was run in R3B because the real Browser did not reach the form. Existing source and test evidence supports atomicity:

- `bootstrapFirstRun` owns a Sequelize transaction.
- Inventory Bootstrap receives the same transaction.
- READY is written only after Inventory and final validations.
- Existing unit and PostgreSQL integration test sources cover rollback/idempotency; the real PostgreSQL test requires an explicit disposable target.

```text
FIRST_RUN_ROLLBACK_ATOMICITY = SUPPORTED_WITH_LIMITATION
```

Limitation: R3B did not execute a post-submit rollback scenario.

## 25. Disposable Business-Mutation Check

After the blocked attempt:

```text
DISPOSABLE_UNAUTHORIZED_BUSINESS_TRANSACTIONS = 0
purchase_orders = 0
assets = 0
inventory_asset_movements = 0
payments = 0
journal_entries = 0
journal_lines = 0
```

Only schema migrations were applied to the Disposable DB. No Company/User/Branch or reference-data bootstrap transaction was executed.

## 26. Official DB Baseline After

The exact official read-only query after all Disposable work returned the same values as before:

```text
identity|darfus_erp|postgres
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
bootstrap|INVENTORY_REFERENCE_MASTER_DATA|2|READY|d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
```

## 27. Official DB Before/After Reconciliation

| Entity | Before | After | Result |
|---|---:|---:|---|
| `SequelizeMeta` | 83 | 83 | unchanged |
| Companies | 1 | 1 | unchanged |
| Branches | 1 | 1 | unchanged |
| Users | 1 | 1 | unchanged |
| Profile Master Data | 659 | 659 | unchanged |
| Pearl sizes | 39 | 39 | unchanged |
| Barcode inventory/item codes | 5 / 20 | 5 / 20 | unchanged |
| Barcode sequences | 0 | 0 | unchanged |
| Inventory bootstrap states | 1 READY | 1 READY | unchanged |
| Audit logs | 23 | 23 | unchanged |
| Suppliers / locations / settings | 0 / 0 / 0 | 0 / 0 / 0 | unchanged |
| PO/assets/movements/payments/journals/lines | all 0 | all 0 | unchanged |
| Idempotency requests | 0 | 0 | unchanged |

```text
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
```

## 28. Git/Source Safety

- No frontend, backend, test, migration, config, `.env`, secret, or `next-env.d.ts` file was edited.
- No build was run.
- No Next dev process was started.
- No `git reset`, `restore`, `clean`, `stash`, `checkout`, `commit`, `push`, or broad `git add` was run.
- The worktree had pre-existing modifications and untracked files; they were preserved and not claimed as R3B changes.
- This R3B report is the only intentional project output for this control.

## 29. Disposable Cleanup Status

The Disposable DB was not dropped automatically, as required by the prompt:

```text
DISPOSABLE_DB_CLEANUP = DEFERRED_OWNER_DECISION
DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
```

Temporary Backend and proxy sessions were stopped after the blocked Browser attempt. The Disposable DB remains available for Owner review or an explicitly approved retry.

## 30. Remaining Out-of-Scope Work

Not started:

- Phase 03B Owner Production Configuration;
- Supplier, Location, VAT, GBW, GBP, Diamond, Gem Stone, or Pearl workflows;
- READY replay UI;
- product source patch;
- test harness patch;
- official DB reset or provisioning;
- business inventory transactions;
- automatic Disposable DB deletion.

## 31. Phase 03A Closure Matrix

| Area | Required | Actual R3B result |
|---|---|---|
| Disposable DB identity | PASS | PASS |
| Fresh `SETUP_REQUIRED` DB | PASS | PASS |
| Real Browser setup form | PASS | FAIL — Preparing setup only |
| Real Browser POST `/setup/bootstrap` | PASS | FAIL — not sent |
| Setup token boundary | PASS | Available, not exercised by Browser |
| Idempotency header | PASS | Not sent |
| Backend orchestrator | PASS | Not invoked by Browser |
| Company/User/Branch | PASS | Not created |
| COA/financial mapping | PASS | Not invoked |
| Inventory Master Bootstrap | PASS | Not invoked |
| 659/39/5/20 reference rows | PASS | Not created in Disposable |
| Bootstrap V2 READY | PASS | Not reached |
| READY browser state | PASS | Not reached |
| Login after setup | PASS if executed | Not run |
| Atomicity/rollback evidence | PASS/supported | Supported with limitation |
| Official DB unchanged | PASS | PASS |
| Git/source safety | PASS | PASS |

## 32. Gate

The Disposable DB creation, migration target, fresh state, isolated Backend, and Official DB protection passed. The required real Browser First-Run form and Browser POST did not execute, so the core R3B acceptance cannot be closed.

```text
GATE = BLOCKED_PHASE_03A_R3B_BROWSER_FIRST_RUN
```

Root cause classification:

`ENVIRONMENT_CONFIG / ACCEPTANCE_RUNTIME_BLOCKER`

The source integration was already proven by R3A. No product defect was inferred, and no source patch was made.

## 33. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3B-TRUE-FIRST-RUN-BROWSER-ACCEPTANCE-DISPOSABLE-POSTGRES
PHASE = 03A-R3B
MODE = CONTROLLED_DISPOSABLE_ACCEPTANCE
OFFICIAL_DB = darfus_erp

DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
DISPOSABLE_DB_IDENTITY = PASS
DISPOSABLE_DB_IS_NOT_OFFICIAL = YES

SAFETY_BACKUP_SHA256_MATCH = YES
PG_RESTORE_LIST = PASS
OFFICIAL_BASELINE_BEFORE = PASS

DISPOSABLE_MIGRATIONS_APPLIED = 83
DISPOSABLE_SEQUELIZE_META = 83
DISPOSABLE_INITIAL_SETUP_STATE = SETUP_REQUIRED

DISPOSABLE_FRONTEND_URL = http://localhost:3001
DISPOSABLE_BACKEND_URL = http://localhost:8121

FIRST_RUN_SETUP_TOKEN_PRESENT = YES
REAL_BROWSER_SETUP_FORM = FAIL_PREPARING_SETUP_ONLY
REAL_BROWSER_SETUP_POST = FAIL_NOT_SENT
SETUP_POST_ENDPOINT = POST /api/v1/setup/bootstrap
SETUP_POST_HTTP_STATUS = NOT_SENT
IDEMPOTENCY_HEADER = NOT_SENT
SETUP_TOKEN_HEADER = NOT_SENT

FIRST_RUN_ORCHESTRATOR = NOT_INVOKED_BY_BROWSER
COMPANY_CREATED = 0
BRANCH_CREATED = 0
USER_CREATED = 0
COA_BOOTSTRAP = NOT_EXECUTED_BROWSER_PATH
FINANCIAL_READINESS = NOT_EXECUTED_BROWSER_PATH
INVENTORY_MASTER_BOOTSTRAP = NOT_EXECUTED_BROWSER_PATH

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

CERTIFICATE_AUTHORITY_COUNT = NOT_EXECUTED_BROWSER_PATH
DIAMOND_TONE_COUNT = NOT_EXECUTED_BROWSER_PATH
DIAMOND_TONE_LEVEL_COUNT = NOT_EXECUTED_BROWSER_PATH
DIAMOND_SATURATION_COUNT = NOT_EXECUTED_BROWSER_PATH
DIAMOND_POSITION_COUNT = NOT_EXECUTED_BROWSER_PATH
DIAMOND_SETTING_COUNT = NOT_EXECUTED_BROWSER_PATH
GEMSTONE_POSITION_COUNT = NOT_EXECUTED_BROWSER_PATH
GEMSTONE_SETTING_COUNT = NOT_EXECUTED_BROWSER_PATH
GEMSTONE_TREATMENT_COUNT = NOT_EXECUTED_BROWSER_PATH

READY_BROWSER_STATE = FAIL_NOT_REACHED
LOGIN_AFTER_SETUP = NOT_RUN
FIRST_RUN_IDEMPOTENCY = NOT_RUN_BROWSER_PATH
FIRST_RUN_ROLLBACK_ATOMICITY = SUPPORTED_WITH_LIMITATION

DISPOSABLE_UNAUTHORIZED_BUSINESS_TRANSACTIONS = 0
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
OFFICIAL_BASELINE_AFTER = PASS

SOURCE_CODE_CHANGED = NO
TEST_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
BUILD_RUN = NO

DISPOSABLE_DB_CLEANUP = DEFERRED_OWNER_DECISION

PHASE_03A_FIRST_RUN_REAL_BROWSER = FAIL
PHASE_03A_FIRST_RUN_NETWORK = FAIL
PHASE_03A_FIRST_RUN_BACKEND = NOT_INVOKED_BY_BROWSER
PHASE_03A_FIRST_RUN_DISPOSABLE_DB = PASS_FRESH_TARGET_ONLY
PHASE_03A_OFFICIAL_DB_PROTECTION = PASS
PHASE_03A_FINAL_CLOSED = NO

GATE = BLOCKED_PHASE_03A_R3B_BROWSER_FIRST_RUN
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_BROWSER_RUNTIME_ISOLATION_AND_EXPLICIT_APPROVED_R3B_RETRY; NO_SOURCE_PATCH_AUTOMATICALLY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No direct setup POST, source patch, Browser workaround, Official DB mutation, or Phase 03B was started automatically.
