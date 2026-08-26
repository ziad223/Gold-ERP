# DARFUS ERP — B1R Disposable Runtime Proof Report

**Control ID:** `DARFUS-CLIENT-B1R-EMPLOYEE-DISPOSABLE-RUNTIME-PROOF-01`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Official DB:** `darfus_erp`  
**Mode:** `ISOLATED_RUNTIME_ACCEPTANCE_ONLY`

## ملخص عربي

تم إنشاء Disposable DB جديد من snapshot قراءة فقط لـ`darfus_erp`، وتشغيل Backend مؤقت على `8001` مع Redis منفصل على `6380`. تم تنفيذ بيانات Employee اصطناعية فقط داخل الـclone. نجحت اختبارات B1R المطلوبة، وثبت أن User/RBAC يظل سلطة التفويض وأن Employee verification لا تمنح صلاحية Employee غير ممنوحة. لم تحدث أي كتابة على `darfus_erp`، ولم يتم تعديل source أو migration أو production.

تم إيقاف الـtemporary backend وRedis بعد جمع الأدلة، مع إبقاء Disposable DB محفوظة للمراجعة. النتيجة: **B1R PASS** وإغلاق B1 مسموح، مع بقاء جميع Batches اللاحقة متوقفة تلقائيًا.

## 1. Fast Triage Gate

| Check | Evidence |
|---|---|
| Current branch | `main` |
| Current HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Worktree | Pre-existing dirty worktree; 636 status entries at B1R start; no cleanup/reset/restore/stash |
| B1 source files | Present |
| B1 test file | Present |
| Backend container | `darfus-backend` Up on `8000` |
| PostgreSQL container | `darfus-postgres` Up/healthy, host `5433` |
| Main Redis container | `darfus-redis` Up/healthy, host `6379` |
| Official DB | `darfus_erp` |
| Official Employee count | `0` |
| Official Audit count | `136` |

Source parity was confirmed before clone creation. The inspected source contained:

- `buildAttributionContract`;
- technical user, Employee, code snapshot, company, branch and operator-session fields;
- `sourceOperation`, `sourceReference`, `occurredAt`;
- `employees.create`, `employees.update`, `employees.deactivate`, `employees.reactivate`;
- existing `attachAuditActor`.

`GATE = SOURCE_PARITY_PASS`.

## 2. Official DB Read-only Baseline

The initial read-only baseline was obtained with `current_database() = darfus_erp` and `current_user = postgres`:

| Entity | Official pre-count |
|---|---:|
| `employees` | 0 |
| `employee_code_history` | 0 |
| `employee_branch_access` | 0 |
| `employee_operational_sessions` | 0 |
| `employee_verification_attempts` | 0 |
| `audit_logs` | 136 |
| `users` | 1 |
| `branches` | 2 |
| `permissions` | 150 |
| `assets` | 18 |
| `inventory_asset_movements` | 62 |
| `journal_entries` | 25 |

No write statement was issued against this database.

## 3. Disposable Target and Clone Reconciliation

The preferred database name was free. The actual target was:

```text
DISPOSABLE_DATABASE = darfus_b1_employee_runtime_20260825_01
```

Clone method:

1. `pg_dump -Fc --no-owner --no-privileges darfus_erp` executed inside `darfus-postgres`.
2. Dump size: `1,384,279` bytes.
3. Dump SHA-256: `f831765b01df80897474c920b58640a15f63292816b11163268f565c6ea83c11`.
4. New database created with `createdb`; no existing database was dropped or reused.
5. Dump restored with `pg_restore --no-owner --no-privileges`.

Disposable pre-mutation baseline, reconciled to the official snapshot:

| Entity | Clone pre-count | Official source snapshot |
|---|---:|---:|
| `employees` | 0 | 0 |
| `employee_code_history` | 0 | 0 |
| `employee_branch_access` | 0 | 0 |
| `employee_operational_sessions` | 0 | 0 |
| `employee_verification_attempts` | 0 | 0 |
| `audit_logs` | 136 | 136 |
| `users` | 1 | 1 |
| `branches` | 2 | 2 |
| `permissions` | 150 | 150 |
| `assets` | 18 | 18 |
| `inventory_asset_movements` | 62 | 62 |
| `journal_entries` | 25 | 25 |

`CLONE_BASELINE_RECONCILED = YES`.

## 4. Migration State

No migration was created or executed by B1R. `public.SequelizeMeta` count was `91` on both official and clone before runtime mutations.

```text
MIGRATION_ACTION = NONE
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
UNEXPECTED_SCHEMA_DRIFT = 0
```

## 5. Temporary Runtime Isolation

| Item | Value |
|---|---|
| Temporary backend | Local Node process using current worktree source |
| Temporary port | `8001` |
| Temporary DB | `darfus_b1_employee_runtime_20260825_01` |
| Official DB comparison | `TEMP_BACKEND_DB != darfus_erp` |
| Temporary Redis | Dedicated container `darfus-b1r-redis` |
| Temporary Redis port | `6380` → container `6379` |
| Persistent `.env` | Not modified |
| Main backend `8000` | Not restarted or repointed |
| Main Redis `6379` | Not used by temporary backend |
| Temporary runtime after proof | Stopped; DB preserved |

The first process start attempt failed before listening because the local process did not inherit the backend credential file path. It produced no DB write. The second start used only ephemeral process environment overrides and connected successfully.

The dedicated Redis was reachable with `PONG`; its observed keys were isolated to the dedicated container. It was stopped after proof; it was not shared with the main runtime.

```text
RUNTIME_SOURCE_PARITY = PASS
RUNTIME_DB_TARGET_PARITY = PASS
RUNTIME_REDIS_PARITY = PASS
```

## 6. Health and Context Proof

Before the first Employee business POST to the temporary backend:

| Request | Result |
|---|---|
| `GET http://127.0.0.1:8001/api/v1/health` | 200, `UP` |
| `GET http://127.0.0.1:8001/api/v1/health/db` | 200, PostgreSQL connected |
| `GET http://127.0.0.1:8001/api/v1/health/redis` | 200, Redis connected |
| Direct `SELECT current_database()` through clone connection | `darfus_b1_employee_runtime_20260825_01` |
| Login | 200 using cloned local development account; credential not recorded |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Technical user | `USR-2c71b1b5-477b-4f00-a097-de0488339b41` |
| Branch A | `BRA-1787464306683` (`Branch-1`) |

No token or password value is included in this report.

## 7. Synthetic Runtime Scenarios

Only synthetic names/codes were used:

- `B1 Runtime Employee A`, code `B1EMP-A-001`;
- `B1 Runtime Employee B`, code `B1EMP-B-002`;
- PIN values were synthetic and are not recorded.

### Scenario request and DB evidence

| Scenario | Requests | HTTP | Employee delta | Audit delta | Other deltas | Result |
|---|---:|---:|---:|---:|---|---|
| Create Employee A | 1 | 201 | +1 | +2 | credential audit +1 | PASS |
| Assign A to Branch A | 1 | 200 | 0 | +1 | branch access +1 | PASS |
| Create Employee B | 1 | 201 | +1 | +2 | credential audit +1 | PASS |
| Duplicate A code | 1 | 409 | 0 | 0 | no partial rows | PASS |
| Wrong company read | 1 | 403 | 0 | 0 | no mutation | PASS |
| Wrong branch read | 1 | 403 | 0 | 0 | no mutation | PASS |
| Update A notes | 1 | 200 | 0 | +1 | same Employee id | PASS |
| Deactivate A | 1 | 200 | 0 | +1 | same Employee id | PASS |
| Reactivate A | 1 | 200 | 0 | +1 | same Employee id | PASS |
| Verify A without requested permission | 1 | 200 | 0 | +1 | session +1, attempt +1 | PASS |
| Operator current read | 1 | 200 | 0 | 0 | read-only | PASS |
| Verify A with ungranted permission | 1 | 403 | 0 | 0 | attempt +1, no session | PASS |
| Audit chain verify | 1 | 200 | 0 | 0 | read-only | PASS |

There were no automatic retries. Technical login requests were separate context setup requests and were not counted as Employee business scenarios.

### Final clone state

| Entity | Pre | Post | Expected delta |
|---|---:|---:|---:|
| `employees` | 0 | 2 | +2 |
| `employee_code_history` | 0 | 0 | 0 |
| `employee_branch_access` | 0 | 1 | +1 |
| `employee_operational_sessions` | 0 | 1 | +1 |
| `employee_verification_attempts` | 0 | 2 | +2 |
| `audit_logs` | 136 | 145 | +9 expected |
| `permissions` | 150 | 150 | 0 |
| `assets` | 18 | 18 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |

The two credential audit rows, one Branch Access audit row, four Employee lifecycle audit rows, and one successful verification audit explain the nine expected audit rows. The denied verification created one verification-attempt row but no session or audit row.

## 8. Identity and Uniqueness Proof

Final synthetic Employee rows:

| Employee | Stable ID | Code | Normalized code | Status | Branch |
|---|---|---|---|---|---|
| A | `EMP-1787690814128-wahy` | `B1EMP-A-001` | `B1EMP-A-001` | `present` | `BRA-1787464306683` |
| B | `EMP-1787690814631-frkc` | `B1EMP-B-002` | `B1EMP-B-002` | `inactive` | none |

The duplicate `B1EMP-A-001` request returned HTTP 409 and did not create a third Employee, code-history row, branch row, or audit row.

```text
EMPLOYEE_A_CREATE = PASS
EMPLOYEE_B_CREATE = PASS
DUPLICATE_CODE_REJECTION = PASS
UNEXPECTED_DUPLICATE_EMPLOYEE_ROWS = 0
UNEXPECTED_PARTIAL_STATE = 0
```

## 9. Lifecycle and Attribution Reconciliation

The four B1 lifecycle records were present exactly once:

- `employee.created`;
- `employee.updated`;
- `employee.deactivated`;
- `employee.reactivated`.

Each lifecycle record contained a technical user id, matching `requested_operation`, `source_document` equal to the Employee id, event date mapped from the B1 `occurredAt` contract, and authorization result `allowed`.

These lifecycle mutations were performed by the technical admin account, without an active Employee operator session; therefore their Employee actor fields are null by design rather than guessed. The successful operator verification separately proved Employee actor identity:

| Field | Verification/session evidence |
|---|---|
| `technicalUserId` | `USR-2c71b1b5-477b-4f00-a097-de0488339b41` |
| `employeeId` | `EMP-1787690814128-wahy` |
| `employeeCodeSnapshot` | `B1EMP-A-001` |
| `employeeNameSnapshot` | `B1 Runtime Employee A` |
| `companyId` | clone company id |
| `branchId` | `BRA-1787464306683` |
| `operatorSessionId` | present in `employee_operational_sessions` |
| `sourceOperation` | verification attempt `b1r.permission.proof` |
| `sourceReference` | canonical Employee/source record relation |
| `occurredAt` | audit/session timestamps |

The audit chain was checked through the read-only endpoint:

```text
GET /api/v1/audit-logs/verify = 200
valid = true
total = 145
```

```text
ATTRIBUTION_RECONCILIATION = PASS
UNEXPECTED_DUPLICATE_AUDIT_ROWS = 0
```

## 10. Security Proof

| Proof | Evidence | Result |
|---|---|---|
| User/RBAC authority | Cloned technical admin retained 150 technical permissions; permission count unchanged | PASS |
| Employee role/permission separation | Employee A had no role assignment/direct grant; successful operator current returned effective permission count 0 | PASS |
| Verification does not grant permission | Verification with `employees.credentials.manage` returned 403 and `EMPLOYEE_PERMISSION_DENIED`; no session created by denied attempt | PASS |
| Company fail-closed | Wrong company header on safe GET returned 403 `COMPANY_SCOPE_INVALID` | PASS |
| Branch fail-closed | Wrong branch on safe inventory GET returned 403 | PASS |
| Shared account authority | No shared account or account model change; same technical User remained auth authority | PASS |
| Permission catalog | Clone pre/post count 150; no permission mutation | PASS |

## 11. Transaction and Exactly-Once Evidence

The source proof showed create/update/deactivate/reactivate use transaction boundaries and lifecycle audits are written before commit. Runtime reconciliation showed one Employee row per successful create, one lifecycle audit per lifecycle operation, no row or audit for duplicate-code rejection, no partial state after deactivation/reactivation, no asset/movement/journal delta, and no automatic retry.

```text
EMPLOYEE_A_UPDATE = PASS
EMPLOYEE_A_DEACTIVATE = PASS
EMPLOYEE_A_REACTIVATE = PASS
UNEXPECTED_DUPLICATE_EMPLOYEE_ROWS = 0
UNEXPECTED_DUPLICATE_AUDIT_ROWS = 0
UNEXPECTED_PARTIAL_STATE = 0
```

## 12. Future Integration Contract

No downstream implementation was changed. The B1 attribution contract can be consumed by POS, CGP, Invoice Search, Inventory, Transfers, Accounting, Attendance, Payroll, KPI, Reports, and Audit without a second Employee master. Existing frozen authorities remain intact.

```text
FUTURE_INTEGRATION_REQUIRES_EMPLOYEE_REBUILD = NO
DUPLICATE_EMPLOYEE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
```

## 13. Official DB Post-Test Zero-Delta Proof

After disposable mutations, a fresh direct connection returned `current_database() = darfus_erp`.

Official post-counts:

```text
employees = 0
employee_code_history = 0
employee_branch_access = 0
employee_operational_sessions = 0
employee_verification_attempts = 0
audit_logs = 136
permissions = 150
assets = 18
inventory_asset_movements = 62
journal_entries = 25
```

These matched the pre-mutation official snapshot used to create the clone. The temporary backend’s only DB target was the disposable name, and the main backend on `8000` was never repointed.

```text
OFFICIAL_DB_BUSINESS_WRITE_DELTA = 0
OFFICIAL_EMPLOYEE_DELTA = 0
OFFICIAL_EMPLOYEE_CODE_HISTORY_DELTA = 0
OFFICIAL_BRANCH_ACCESS_DELTA = 0
OFFICIAL_OPERATOR_SESSION_DELTA = 0
OFFICIAL_VERIFICATION_ATTEMPT_DELTA = 0
OFFICIAL_AUDIT_DELTA = 0
OFFICIAL_PERMISSION_DELTA = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
```

## 14. Stale Verifiers and Lessons

The three previously observed migration-count verifier failures remain unchanged and were not modified in B1R:

- `verify-simple-branch-account-access.js`: expects 48 migrations, source has 91;
- `verify-employee-permission-catalog-wiring.js`: expects 52, source has 91;
- `verify-simple-account-center.js`: expects 48, source has 91.

```text
STALE_VERIFIER_ISSUES = PRE_EXISTING_NOT_MODIFIED
```

No new defect class was found during B1R. The B1 lifecycle audit inconsistency was corrected and covered by the B1 test before this runtime proof.

## 15. Artifact and Mutation Ledger

| Item | Result |
|---|---|
| Source files changed in B1R | 0 |
| Test files changed in B1R | 0 |
| Report created | 1 |
| Official DB writes | 0 |
| Disposable DB created | 1 |
| Disposable DB preserved | YES |
| New migration | 0 |
| Production contact | 0 |
| Downstream feature work | 0 |
| Disposable synthetic Employee rows | 2, preserved for Owner review |

No automatic cleanup was performed on the disposable database. No historical database was dropped or modified.

## 16. Final Gate

All critical B1R conditions passed:

```text
DISPOSABLE_TARGET_CREATED = YES
CLONE_BASELINE_RECONCILED = YES
RUNTIME_SOURCE_PARITY = PASS
RUNTIME_DB_TARGET_PARITY = PASS
RUNTIME_REDIS_PARITY = PASS
EMPLOYEE_A_CREATE = PASS
EMPLOYEE_B_CREATE = PASS
DUPLICATE_CODE_REJECTION = PASS
COMPANY_BRANCH_FAIL_CLOSED = PASS
VERIFICATION_ALONE_GRANTS_PERMISSION = NO
EMPLOYEE_A_UPDATE = PASS
EMPLOYEE_A_DEACTIVATE = PASS
EMPLOYEE_A_REACTIVATE = PASS
ATTRIBUTION_RECONCILIATION = PASS
USER_RBAC_AUTHORITY_PRESERVED = PASS
EMPLOYEE_ROLE_PERMISSION_SEPARATION = PASS
NO_SHARED_ACCOUNT_AUTHORITY = PASS
UNEXPECTED_DUPLICATE_EMPLOYEE_ROWS = 0
UNEXPECTED_DUPLICATE_AUDIT_ROWS = 0
UNEXPECTED_PARTIAL_STATE = 0
FUTURE_INTEGRATION_REQUIRES_EMPLOYEE_REBUILD = NO
DUPLICATE_EMPLOYEE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
OFFICIAL_DB_BUSINESS_WRITE_DELTA = 0
OFFICIAL_PERMISSION_DELTA = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
P0 = 0
P1 = 0
```

```text
B1R_RUNTIME_PROOF = PASS
B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION = CLOSED
GATE = PASS_CLIENT_B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION
```

## 17. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-B1R-EMPLOYEE-DISPOSABLE-RUNTIME-PROOF-01
OFFICIAL_DATABASE = darfus_erp
DISPOSABLE_DATABASE = darfus_b1_employee_runtime_20260825_01
DISPOSABLE_DATABASE_CREATED = YES
DISPOSABLE_DATABASE_PRESERVED = YES
TEMP_BACKEND_PORT = 8001
TEMP_BACKEND_DB = darfus_b1_employee_runtime_20260825_01
TEMP_REDIS_TARGET = darfus-b1r-redis:6380 (stopped after proof)
RUNTIME_SOURCE_PARITY = PASS
RUNTIME_DB_TARGET_PARITY = PASS
RUNTIME_REDIS_PARITY = PASS
EMPLOYEE_A_CREATE = PASS
EMPLOYEE_B_CREATE = PASS
DUPLICATE_CODE_REJECTION = PASS
COMPANY_BRANCH_FAIL_CLOSED = PASS
EMPLOYEE_VERIFICATION_DOES_NOT_GRANT_PERMISSION = PASS
EMPLOYEE_A_UPDATE = PASS
EMPLOYEE_A_DEACTIVATE = PASS
EMPLOYEE_A_REACTIVATE = PASS
ATTRIBUTION_RECONCILIATION = PASS
USER_RBAC_AUTHORITY_PRESERVED = PASS
NO_SHARED_ACCOUNT_AUTHORITY = PASS
FUTURE_INTEGRATION_REQUIRES_EMPLOYEE_REBUILD = NO
DUPLICATE_EMPLOYEE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
OFFICIAL_DB_BUSINESS_WRITE_DELTA = 0
OFFICIAL_PERMISSION_DELTA = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
STALE_VERIFIER_ISSUES = PRE_EXISTING_NOT_MODIFIED
P0 = 0
P1 = 0
P2 = 0
P3 = 0
B1R_RUNTIME_PROOF = PASS
B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION = CLOSED
GATE = PASS_CLIENT_B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — لا يبدأ Batch C أو Payroll أو Attendance أو Leave أو KPI أو Invoice أو CGP أو CRM أو Production تلقائيًا.**
