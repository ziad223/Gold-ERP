# DARFUS ERP — PHASE 03A-R3B-R3

## SETUP BOOTSTRAP 409 ROOT-CAUSE FORENSIC

**Control ID:** `DARFUS-PHASE-03A-R3B-R3-SETUP-BOOTSTRAP-409-ROOT-CAUSE-FORENSIC`  
**Mode:** `READ_ONLY_409_ROOT_CAUSE_FORENSIC`  
**Official DB:** `darfus_erp` — read-only  
**Disposable DB:** `darfus_first_run_r3b_20260818_104917` — read-only during this control  
**Previous isolated runtime:** `I:\WORK\_darfus_r3b_r2_runtime_20260818_112608`  
**Previous runtime:** Backend `http://localhost:8121`, Frontend `http://localhost:3301`

## 1. Executive Summary

تم تنفيذ forensic read-only للـHTTP 409 الأخير من R3B-R2. لم يتم إرسال POST جديد، ولم تحدث أي كتابة على `darfus_erp` أو قاعدة الـDisposable، ولم يتغير source أو test أو migration أو configuration.

السبب الدقيق مثبت: الطلب النهائي الصحيح وصل إلى `bootstrapFirstRun`، وتجاوز token وpayload وidempotency-key validation، ثم فشل داخل مرحلة `K. INVENTORY_MASTER_BOOTSTRAP`. الخدمة `inventory-master-data-bootstrap.service.js` تقرأ baseline scoped إلى الشركة الجديدة، وتتطلب مسبقًا `502` profile rows و`39` pearl rows و`5` inventory barcode codes و`20` item codes مع `0` sequences. قاعدة الـDisposable migration-only كانت صفرية، والشركة لم تُنشأ إلا داخل نفس transaction قبل استدعاء V2. لذلك تحقق الشرط `!baselineMatches(before)` وأُلقي `ConflictError("INVENTORY_MASTER_DATA_BASELINE_DRIFT")`، الذي يظهر خارجيًا كـHTTP `409` و`STATE_CONFLICT`. بعدها rollback أزال كل الصفوف المنشأة.

هذا **Product Fresh-Install orchestration bug** وليس test-data أو config أو Browser harness issue. الحد الأدنى الآمن التالي هو تصميم/اعتماد مسار atomic يوفّر V1 baseline قبل V2 داخل First Run أو يجعل bootstrap يدعم zero baseline، ثم إضافة تغطية true-zero PostgreSQL/browser. لم يُنفذ أي إصلاح في هذا control.

## 2. Preconditions

تمت قراءة الملفات الأربعة المطلوبة كاملة، لا Summary فقط:

| Input | Read result | Evidence |
|---|---|---|
| R3A report | Complete | 28,113 chars / 500 lines / SHA-256 recorded during control |
| R3B report | Complete | 18,870 chars / 585 lines |
| R3B-R1 report | Complete | 26,662 chars / 569 lines |
| R3B-R2 report | Complete | 25,063 chars / 812 lines |

تم الالتزام بـR3B-R3: source/log/DB/test evidence فقط، دون retry أو Browser action أو mutation.

## 3. Frozen R3B-R2 Facts

من R3B-R2، وأُعيدت مطابقة الحالة الحالية حيث أمكن:

- Browser `GET /api/v1/setup/status` على Backend الـDisposable: `200 SETUP_REQUIRED`.
- Browser form hydration وAPI base إلى `http://localhost:8121/api/v1`: PASS.
- Attempt 1 و2: `422` payload failures منفصلة.
- Attempt 3: `409` بعد changed body مع same page key، منفصل عن المحاولة النهائية.
- Attempt 4: صفحة جديدة، key جديد، payload صحيح، `POST /api/v1/setup/bootstrap -> 409`.
- `bootstrapFirstRun` استُدعي؛ لا توجد rows بعد الفشل؛ transaction لم تُثبت.
- Main frontend/backend لم يُعاد تشغيلهما؛ `3000` و`8000` بقيا runtime الأساسي.
- `8121` و`3301` متوقفان حاليًا؛ لا توجد إعادة تشغيل في R3.

## 4. Official DB Protection

التحقق الحالي read-only من PostgreSQL أعاد:

```text
current_database = darfus_erp
SequelizeMeta = 83
companies = 1
branches = 1
users = 1
profile_master_data = 659
pearl_size_master_data = 39
barcode_inventory_codes = 5
barcode_item_codes = 20
barcode_sequences = 0
first_run_setup_states = 1, state=READY
inventory_master_data_bootstrap_states = 1, state=READY, current_version=2
```

Official DB لم يُستخدم لأي POST أو setup أو seed أو migration. الـbackup الموجود مسبقًا من R3B-R2 بقي كما هو: `backups/official/darfus_erp_POST_R2_FULL_20260818_095351.dump`, size `646071` bytes، SHA-256 `844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1`. لم يُنشأ backup جديد في R3.

## 5. Disposable Fresh-State Reverification

الاستعلام كان SELECT فقط على قاعدة محددة بالاسم:

```text
current_database = darfus_first_run_r3b_20260818_104917
SequelizeMeta = 83
companies = 0
branches = 0
users = 0
roles = 0
accounts = 0
system_account_roles = 0
branch_financial_mappings = 0
first_run_setup_states = 0
profile_master_data = 0
pearl_size_master_data = 0
barcode_inventory_codes = 0
barcode_item_codes = 0
barcode_sequences = 0
inventory_master_data_bootstrap_states = 0
audit_logs = 0
idempotency_requests = 0
```

النتيجة مطابقة للـrollback المتوقع؛ لا توجد writes غير مفسرة ولا Disposable drift.

## 6. 409 Candidate Inventory

تم فحص المسارات المرتبطة بالـsetup وstate وfinancial وinventory والـerror middleware.

| Candidate | Source evidence | Can map to 409? | Relevance to final attempt |
|---|---|---:|---|
| READY marker, same key and changed payload | `first-run-bootstrap.service.js:94-97` | Yes | No: no marker existed on fresh DB and final key/page was new |
| READY marker, different key | `:97` | Yes | No: marker count remained zero after rollback |
| `SETUP_IN_PROGRESS` marker | `:99` | Yes | No marker and no concurrent request |
| Configuration conflict | `:104`, resolver `first-run-setup-state.service.js:36` | Yes | No: fresh company count was zero |
| Recovery required / already complete | `:105-106` | Yes | No: pre-POST status was `SETUP_REQUIRED` |
| Inventory V2 state/version conflict | `inventory-master-data-bootstrap.service.js:156`, `:162`, `:166` | Yes | State row was zero; not selected |
| Inventory baseline drift | inventory service `:167-168` | Yes | **Selected and proven** |
| Inventory baseline key/canonical mismatch | `:77-78`, `:135-138` | Yes | Not reached; count guard failed first |
| Inventory duplicate/delta/manifest conflicts | `:37`, `:42-44`, `:104`, `:148`, `:186` | Yes | Not reached |
| `ConflictError` | `utils/errors.js:37-40` | Yes, status 409 | Actual class for selected failure |
| Sequelize unique constraint | `error.middleware.js:39-43` | Yes | No evidence; fresh input was unique and selected service guard precedes it |
| Sequelize foreign-key constraint | `error.middleware.js:49-53` | Yes | No evidence; not the observed source |
| Financial readiness | `financial-bootstrap.service.js:17-18`, first-run `:77` | No, explicit 422 | Not the final 409 candidate |
| Token failure | first-run `:55-60` | No, 403 | Not final |
| Payload validation | first-run `:30-50` | No, 422 | Not final |
| Role assignment missing | first-run `:118-119` | No, explicit 422 | Not final |

## 7. Controller / Error Mapping

المسار:

```text
setup.controller.bootstrap:17-29
  -> bootstrapFirstRun({ body, X-First-Run-Setup-Token, Idempotency-Key })
  -> catch(next(error))
  -> error.middleware.js:25-77
  -> canonicalErrorPayload(...)
  -> HTTP response
```

`ConflictError` يضبط `statusCode=409` و`errorCode=STATE_CONFLICT`. لذلك الرسالة الداخلية للـselected error هي `INVENTORY_MASTER_DATA_BASELINE_DRIFT`، بينما public stable code هو `STATE_CONFLICT`. الـmiddleware لا يضع stack trace أو تفاصيل DB في response؛ يسجل request id/method/path/status/errorCode/errorName فقط في `error.middleware.js:61-68`. R3B-R2 browser UI عرض safe generic message، وterminal evidence أظهر `POST ... 409 ... outcome=completed` دون exact semantic message. المصدر الحالي يكشف السبب دون retry.

## 8. First-Run Guard Trace

| Order | Guard | Condition | Error / HTTP |
|---:|---|---|---|
| 1 | Setup token | missing/wrong token | `FIRST_RUN_TOKEN_REQUIRED` / `FIRST_RUN_TOKEN_INVALID`, 403 |
| 2 | Idempotency header | missing or length <16 | `FIRST_RUN_IDEMPOTENCY_CONFLICT`, 400 |
| 3 | Payload | email/text/password/workspace/branchCode/currency invalid | `ValidationError` / `VALIDATION_FAILED`, 422 |
| 4 | Advisory lock | transaction-scoped `pg_advisory_xact_lock(736287401)` | blocking lock; no direct 409 throw |
| 5 | Existing marker READY | same key+same hash replay, same key changed hash, or different key | replay 200; `FIRST_RUN_IDEMPOTENCY_CONFLICT` or `FIRST_RUN_ALREADY_COMPLETE`, 409 |
| 6 | Marker IN_PROGRESS | durable marker is in progress | `FIRST_RUN_IN_PROGRESS`, 409 |
| 7 | Resolved state | configuration/recovery/not setup-required | `FIRST_RUN_CONFIGURATION_CONFLICT`, `FIRST_RUN_RECOVERY_REQUIRED`, or `FIRST_RUN_ALREADY_COMPLETE`, 409 |
| 8 | Duplicate user email | existing email | `ValidationError`, 422 |
| 9 | Company/roles/user/branch | ORM/database failure or missing assigned role | DB mapping may be 409; missing role explicit 422 |
| 10 | Financial readiness | mapping/account catalog not READY | `FIRST_RUN_FINANCIAL_MAPPING_INCOMPLETE` / `FINANCIAL_READINESS_REQUIRED`, 422 |
| 11 | Inventory bootstrap | V2 manifest/baseline/state guards | `ConflictError`, 409; **selected at baseline guard** |
| 12 | Final counts | count mismatch | `FIRST_RUN_FINANCIAL_MAPPING_INCOMPLETE`, 422 |
| 13 | Audit/READY marker | audit or marker update failure | transaction rollback; exact status depends on thrown error |

The call at `first-run-bootstrap.service.js:128` is inside the outer transaction. A rejected `ConflictError` propagates to Sequelize transaction rollback; company, role, user, branch, financial rows, marker, and any earlier inventory writes are not committed.

## 9. Idempotency Forensic

The First-Run path uses the request `Idempotency-Key` by hashing it at `first-run-bootstrap.service.js:87`, stores the hash and payload hash only in `first_run_setup_states`, and stores the result when the marker becomes READY. It does **not** call the general `idempotency.service.js` or write `idempotency_requests`.

- 422 requests fail before transaction/marker creation; they do not poison durable First-Run state.
- Attempt 3's changed-body/same-page-key 409 is consistent with the service's fail-closed idempotency contract, but it is not the final clean attempt.
- Attempt 4 used a new page/new key and the Disposable had no marker before it; stale-key conflict is ruled out for Attempt 4.
- `idempotency_requests=0` is expected for this First-Run implementation.

```text
FINAL_VALID_ATTEMPT_IDEMPOTENCY_CONFLICT = NO
```

## 10. Setup Token Forensic

`verifyAuthorization` is called before idempotency/payload processing at `first-run-bootstrap.service.js:83`. Wrong/missing token is 403, not 409. R3B-R2 evidence shows the final request reached the transactional 409 path through the correct isolated runtime; therefore the token boundary passed.

```text
FINAL_VALID_ATTEMPT_TOKEN_FAILURE = NO
```

No token value is printed.

## 11. Payload Forensic

Canonical fields from `validatePayload` are:

`firstName`, `lastName`, `email`, `password`, `passwordConfirmation`, `companyName`, `workspace`, `branchName`, `branchCode`, `currency`.

Rules are: trimmed non-empty bounded text; lower-cased email/workspace; password confirmation equality and password policy; workspace regex `^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$`; branch code `^[A-Z0-9-]{2,40}$`; currency `^[A-Z]{3}$`. R3B-R2 Attempt 1/2 failed these rules independently. Attempt 4 was a clean page/new key with valid disposable values and returned 409, so payload validation is not the final cause.

```text
FINAL_VALID_ATTEMPT_PAYLOAD_VALIDATION_FAILURE = NO
```

## 12. Setup State Forensic

`resolveSetupState` returns:

- `SETUP_REQUIRED` only when company count is zero, active super-admin count is zero, and no marker exists (`first-run-setup-state.service.js:36-39`).
- `CONFIGURATION_CONFLICT` when company count >1.
- `SETUP_IN_PROGRESS` when marker is in progress.
- `RECOVERY_REQUIRED` for partial company/admin/branch/financial/marker states.
- `READY` only after active branch, financial readiness, and READY marker.

Before Attempt 4, Browser GET was `200 SETUP_REQUIRED`. After the failed transaction, marker/company/user/branch counts were all zero. This rules out a persisted state transition and does not support a state-race explanation.

## 13. Concurrency / Advisory Lock Forensic

The code uses blocking PostgreSQL `pg_advisory_xact_lock(736287401)` at `first-run-bootstrap.service.js:92`; it is not a try-lock and has no 409 branch. The durable marker protects a second request after the lock. R3B-R2 shows sequential attempts, not overlapping POSTs; Attempt 4 was one clean page/new-key request. No HMR/double-submit pair or simultaneous POST was observed.

```text
CONCURRENT_FIRST_RUN_REQUEST_CONFLICT = NO
```

## 14. Company/User/Branch Conflict Review

- Company `workspace` is unique in `company.model.js` and the initial schema migration.
- User `email` is unique and validated; First Run also explicitly checks duplicate email at `first-run-bootstrap.service.js:109-110` and returns 422.
- Branch is created with normalized uppercase `branchCode`; no evidence in the final attempt of an existing row or duplicate value because the transaction began with zero companies/branches and the new branch is scoped to the new company.
- ORM unique/FK failures could be converted to 409 by the global middleware, but no such DB error appears in the R3B-R2 evidence and the earlier, deterministic inventory guard is proven from the current source/baseline.

## 15. Role Bootstrap Review

`ensureRolesForCompany` is called after company creation (`first-run-bootstrap.service.js:112`); `assignUserRole` is called after user creation (`:118`). Missing role returns `FIRST_RUN_ROLE_BASELINE_INCOMPLETE`, 422 (`:119`). The fake unit test stubs these dependencies; the real path is not shown to fail before Inventory. No role conflict is required to explain the observed 409.

## 16. Financial Bootstrap Review

`ensureFinancialReadiness` calls `financialBootstrapService.reconcile` (`first-run-bootstrap.service.js:63-70`) and then evaluates readiness. The financial service can create the posting catalog, account-role rows, and branch mappings for the newly created company/branch inside the same transaction (`financial-bootstrap.service.js:97-200`). Missing or incompatible financial rows throw `FINANCIAL_READINESS_REQUIRED` at 422, and First Run maps non-READY readiness to 422 at `first-run-bootstrap.service.js:77`.

Read-only source evidence therefore does not show an external financial seed prerequisite for the newly created company. The migration-only DB has schema and the service has an explicit reconcile path. The failing dependency is later in Inventory Master Data.

```text
DOES_A_BRAND_NEW_MIGRATED_DB_REQUIRE_ANY_EXPLICIT_FIRST_RUN_FOUNDATION_SEED_BEFORE_BOOTSTRAPFIRSTRUN = NO_FOR_FINANCIAL_BOOTSTRAP; YES_FOR_CURRENT_INVENTORY_V1_BASELINE
```

## 17. Inventory Master Bootstrap Review

`bootstrapFirstRun` conditionally invokes `bootstrapInventoryMasterData` at `first-run-bootstrap.service.js:126-128` when the real `InventoryMasterDataBootstrapState` model exists. The inventory service then:

1. validates the V2 manifest;
2. confirms company existence;
3. checks state/version conflicts;
4. reads company-scoped baseline counts at `inventory-master-data-bootstrap.service.js:167`;
5. requires exact baseline counts at `:65-70`;
6. verifies V1 identity and Pearl/barcode canonical contents;
7. only then creates V2 bootstrap state and inserts the 157-row delta.

On a new company in the R3B-R2 migration-only DB, all five baseline counts were zero. Therefore the first failing guard is line 168, before V1 identity, canonical checks, state creation, or V2 inserts.

## 18. V1 Baseline Critical Analysis

The manifest declares:

```text
V1 profile baseline = 502
Pearl baseline = 39
Inventory barcode baseline = 5
Item barcode baseline = 20
V2 delta = 157 profile rows
```

`baselineMatches` requires the four counts and zero barcode sequences. `verifyV1BaselineIdentity` requires the exact V1 key set. `verifyCanonicalBaseline` requires the exact Pearl values and approved barcode codes. This is an explicit **pre-provisioned V1 baseline before V2** contract.

```text
V1_BASELINE_REQUIRED_BEFORE_V2 = YES
FIRST_RUN_SUPPORTS_MIGRATION_ONLY_ZERO_MASTER_DATA = NO
```

## 19. Bootstrap Manifest/Version Analysis

The manifest identifies the V1 rows as `authoritySource: PHASE_03A_POST_03A_OFFICIAL_BASELINE` and stores the baseline counts in `inventory-master-data-manifest.js:85-95`. The V2 service is additive/reconciliation-oriented: it keeps matching rows, inserts missing R1 rows, and rejects state/version/manifest/baseline drift. A zero-row company is not treated as an empty dataset to initialize; it is treated as baseline drift.

## 20. Migration-vs-First-Run Foundation Analysis

The migrations create the master-data tables. The barcode migration provisions company-scoped default codes only by iterating existing companies (`20260710000000-barcode-inventory-foundation.js:145-198`). The Pearl migration explicitly states that initial values are seeded by a controlled service, not by the migration (`20260807010000-create-pearl-size-master-data.js:3-5`). The profile migration seeds source values only for companies returned by `SELECT id FROM companies` (`20260807120000-profile-master-data-and-loose-references.js:57-65`). A true migration-only database has no companies, so these migration loops create no company-scoped baseline rows.

The V2 manifest assumes the earlier Phase 03A baseline, while First Run creates a new company and immediately calls V2 without an explicit V1 baseline step. This proves:

```text
FIRST_RUN_IMPLEMENTATION_ASSUMED_PREEXISTING_03A_BASELINE = YES
```

## 21. Zero-Baseline Test Coverage

| Test | Starting inventory state | Executes real First Run with model | Result |
|---|---|---:|---|
| `tests/first-run-bootstrap.test.cjs` | fake models; no inventory master-data model | No | Does not exercise zero-baseline Inventory guard |
| `tests/first-run-postgres.integration.test.cjs` | requires explicit `FIRST_RUN_PG_INTEGRATION_DB`; asserts zero Company/User/Branch, but does not provision or assert zero profile/Pearl/barcode rows | Yes when enabled | No proof that migration-only zero master data reaches/ passes Inventory V2 |
| `backend/tests/inventory-master-data-bootstrap-r2.test.cjs` | manifest/contract tests only | No end-to-end zero-company First Run | Tests V2 dataset contract, not zero-baseline orchestration |
| R3B-R2 Browser | true migration-only Disposable, all master-data rows zero | Yes | Reproduced the 409 and rollback |

```text
ZERO_BASELINE_FIRST_RUN_TEST_COVERAGE = GAP
```

The real browser run is the first direct evidence of the missing zero-baseline orchestration; existing tests did not close this case.

## 22. Existing Log/Error Artifact Review

R3B-R2 artifacts show:

```text
POST /api/v1/setup/bootstrap 409 773.607ms outcome=completed request_id=6ae70824-6491-4090-b64e-f26b4cc770ef
```

They also show `GET /setup/status -> 200 SETUP_REQUIRED`, correct Backend/DB identity, and all Disposable counts zero after failure. No existing log contains a contradictory database constraint, token error, financial error, or concurrency pair. The terminal formatter did not expose the semantic internal message, so the exact text is established by source plus DB baseline, not guessed from the log line.

## 23. Error Formatter Observability

The exact public response is formed by `error.middleware.js:61-77`: status, code, safe message, fields, details, and request ID. For a `ConflictError`, public code is `STATE_CONFLICT`; the middleware log contains `errorCode=STATE_CONFLICT` and `errorName=ConflictError`, but not the full `err.message`. The Browser then presents a generic setup error. Consequently:

```text
CAN_EXISTING_LOGGING_REVEAL_EXACT_409_WITHOUT_RETRY = NO
```

Source and read-only DB evidence are sufficient to prove the selected throw site without another request.

## 24. Exact Failing Stage

```text
EXACT_FAILING_STAGE = K. INVENTORY_MASTER_BOOTSTRAP
```

The final valid attempt passed the earlier boundaries and reached `bootstrapInventoryMasterData`; the baseline count guard is the first deterministically failing stage.

## 25. Exact 409 Root Cause

```text
EXACT_THROW_SITE = backend/src/services/inventory-master-data-bootstrap.service.js:runBootstrap:168
EXACT_ERROR_CLASS = ConflictError
EXACT_ERROR_CODE = STATE_CONFLICT (public errorCode); semantic message INVENTORY_MASTER_DATA_BASELINE_DRIFT
```

`runBootstrap` reads company-scoped counts for the newly created company. The expected V1 baseline is 502 profile rows, 39 Pearl rows, 5 inventory barcode codes, 20 item codes, and zero sequences. The actual counts are 0/0/0/0/0. `baselineMatches(before)` returns false and the service throws `new ConflictError("INVENTORY_MASTER_DATA_BASELINE_DRIFT")`. Because the call is inside the outer Sequelize transaction, the error causes rollback; the company/user/branch/financial/marker rows are not committed.

```text
EXACT_409_ROOT_CAUSE = PROVEN
```

## 26. Product Bug Decision

The required true-first-run input is a migration-only fresh DB with zero company-scoped master-data rows. Current First Run cannot complete that supported setup path because it assumes a pre-existing Phase 03A V1 baseline before invoking V2. This is an implementation/orchestration defect, not an invalid Browser or test payload.

```text
PRODUCT_FIRST_RUN_FRESH_INSTALL_BUG = YES
PRODUCT_SOURCE_PATCH_REQUIRED = YES
```

No patch was made here.

## 27. Configuration/Test-Data Decision

| Classification | Decision | Evidence |
|---|---|---|
| Test-data issue | `NO` | Disposable is intentionally migration-only and is the required zero-baseline case |
| Configuration issue | `NO` | token passed; financial service has in-transaction reconcile; no missing external setting explains line 168 |
| Harness issue | `NO` | actual isolated Next/Backend/DB and real Browser POST were proven in R3B-R2 |
| Product source issue | `YES` | V2 baseline guard is incompatible with First-Run zero-data orchestration |

## 28. Minimum Safe Fix or Retry Requirement

No retry requirement can solve the final clean attempt; changing the request or reusing a key would obscure the root cause.

**MINIMUM_SAFE_FIX (design only):** in a separately approved implementation control, add an explicit atomic V1 foundation step before V2 for the newly created company, or revise the Inventory bootstrap contract to initialize the V1 baseline from absolute zero and then reconcile the V2 delta. Preserve the existing baseline identity, Pearl values, barcode taxonomy, transaction boundary, and rollback semantics. Add a true-zero PostgreSQL test before Browser rerun.

Likely source areas are `first-run-bootstrap.service.js`, `inventory-master-data-bootstrap.service.js`, the baseline/manifest authority, and dedicated zero-baseline tests. No migration is proven necessary because the required tables already exist; do not create one automatically. Do not seed the Official DB in this diagnostic.

```text
MIGRATION_REQUIRED_FOR_FIX = NO (not required by the minimum safe source orchestration option; not an authorization to implement)
MINIMUM_SAFE_NEXT_ACTION = OWNER_APPROVE A SEPARATE SOURCE-DESIGN/FIX CONTROL FOR ATOMIC V1-THEN-V2 FIRST-RUN FOUNDATION, ADD ZERO-BASELINE TEST COVERAGE, THEN RERUN DISPOSABLE BROWSER PROOF
```

## 29. Disposable Reuse Decision

```text
EXISTING_DISPOSABLE_DB_SAFE_TO_REUSE = YES
```

It is unchanged, fresh, and contains only migration metadata plus zero business/master rows. Reuse means a later explicitly approved read-only or controlled disposable control; it does not authorize reset, seed, POST, or mutation in this batch.

## 30. Temporary Runtime Reuse Decision

```text
TEMP_RUNTIME_SAFE_TO_REUSE = YES
```

Conditions before any future approved use: source copy remains unchanged; its `.next` is the isolated build; compiled client points to `http://localhost:8121/api/v1`; no persistent env or secret leakage is present; no stale `8121`/`3301` process is running; exact DB identity must be reverified before any mutation. R3 itself did not start it.

## 31. Risk Classification

```text
RISK = P1
```

Impact: a valid first installation cannot complete setup from a fresh migration-only database, so the system is blocked before normal authenticated operation on that installation. The existing READY Official DB is not corrupted and operational data is not mutated. This is a fresh-install blocker, not a data-loss finding in this control.

## 32. Files Changed

Only the required forensic report was created:

```text
docs/DARFUS_PHASE_03A_R3B_R3_SETUP_BOOTSTRAP_409_ROOT_CAUSE_FORENSIC_REPORT.md
```

No product source, tests, migrations, `.env`, `next.config`, package files, or Business Logic were edited.

## 33. DB Mutation Proof

```text
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
DISPOSABLE_DB_WRITES_THIS_CONTROL = 0
SETUP_POSTS_THIS_CONTROL = 0
MIGRATIONS_APPLIED = 0
```

The only DB operations in this control were read-only `current_database()` and `SELECT COUNT`/state queries. No backup, reset, seed, setup, cleanup, or POST was performed.

## 34. Git Safety

Read-only baseline before creating this report:

```text
branch = main
HEAD = 1657b0e9ba580faef69be48f04637835c201b521
status lines = 344
tracked modified = 88
untracked = 734
stash count = 11
```

These are pre-existing worktree changes and historical artifacts. The owner-accepted generated `next-env.d.ts` drift was not edited or reverted. After report creation, the only new intentional path is this report; no cleanup/reset/restore/stash/add/commit operation was run.

## 35. Gate

The exact cause, failing stage, throw site, error class/code, rollback reason, Product bug decision, and minimum safe next action are proven from current source, existing R3B-R2 evidence, and read-only DB state.

```text
GATE = PASS_PHASE_03A_R3B_R3_SETUP_BOOTSTRAP_409_ROOT_CAUSE_DEFINED
```

This gate does not close Phase 03A and does not authorize a retry or implementation.

## 36. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3B-R3-SETUP-BOOTSTRAP-409-ROOT-CAUSE-FORENSIC
PHASE = 03A-R3B-R3
MODE = READ_ONLY_409_ROOT_CAUSE_FORENSIC
OFFICIAL_DB = darfus_erp
DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
PREVIOUS_SETUP_POST_HTTP_STATUS = 409
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
DISPOSABLE_DB_WRITES_THIS_CONTROL = 0
SETUP_POSTS_THIS_CONTROL = 0
FINAL_VALID_ATTEMPT_TOKEN_FAILURE = NO
FINAL_VALID_ATTEMPT_PAYLOAD_VALIDATION_FAILURE = NO
FINAL_VALID_ATTEMPT_IDEMPOTENCY_CONFLICT = NO
CONCURRENT_FIRST_RUN_REQUEST_CONFLICT = NO
ZERO_BASELINE_FIRST_RUN_TEST_COVERAGE = GAP
FIRST_RUN_SUPPORTS_MIGRATION_ONLY_ZERO_MASTER_DATA = NO
V1_BASELINE_REQUIRED_BEFORE_V2 = YES
V1_BASELINE_SOURCE_ON_FRESH_INSTALL = PRE-PROVISIONED PHASE 03A V1 BASELINE EXPECTED; NOT CREATED BY MIGRATION-ONLY DB OR CURRENT FIRST-RUN ORCHESTRATION; MISSING FOUNDATION STEP
EXACT_FAILING_STAGE = K. INVENTORY_MASTER_BOOTSTRAP
EXACT_THROW_SITE = backend/src/services/inventory-master-data-bootstrap.service.js:runBootstrap:168
EXACT_ERROR_CLASS = ConflictError
EXACT_ERROR_CODE = STATE_CONFLICT (PUBLIC); INVENTORY_MASTER_DATA_BASELINE_DRIFT (SEMANTIC MESSAGE)
EXACT_409_ROOT_CAUSE = PROVEN: COMPANY-SCOPED V2 INVENTORY BOOTSTRAP REQUIRES PRE-EXISTING 502/39/5/20 V1 BASELINE, BUT MIGRATION-ONLY FIRST RUN HAS 0/0/0/0 AND ROLLS BACK AT baselineMatches()
PRODUCT_FIRST_RUN_FRESH_INSTALL_BUG = YES
TEST_DATA_ISSUE = NO
CONFIG_ISSUE = NO
HARNESS_ISSUE = NO
PRODUCT_SOURCE_PATCH_REQUIRED = YES
MIGRATION_REQUIRED_FOR_FIX = NO
MINIMUM_SAFE_NEXT_ACTION = OWNER-APPROVE SEPARATE ATOMIC V1-THEN-V2 FIRST-RUN FOUNDATION SOURCE FIX, ZERO-BASELINE TESTS, AND NEW DISPOSABLE BROWSER PROOF
EXISTING_DISPOSABLE_DB_SAFE_TO_REUSE = YES
TEMP_RUNTIME_SAFE_TO_REUSE = YES
SOURCE_CODE_CHANGED = NO
TEST_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO
GATE = PASS_PHASE_03A_R3B_R3_SETUP_BOOTSTRAP_409_ROOT_CAUSE_DEFINED
NEXT_RECOMMENDED_STEP = OWNER REVIEW OF PROVEN P1 FRESH-INSTALL ORCHESTRATION BUG; EXPLICITLY APPROVE OR REJECT A SEPARATE MINIMUM-SAFE FIX CONTROL; NO RETRY IN THIS CONTROL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.** No retry, source patch, migration, seed, Official DB write, Disposable mutation, reset, cleanup, Phase 03B, Supplier/Location/VAT work, or profile acceptance was started.

