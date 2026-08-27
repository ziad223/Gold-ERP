# DARFUS ERP — Batch B1 Employee Identity + Attribution Foundation Report

**Control ID:** `DARFUS-CLIENT-B1-EMPLOYEE-IDENTITY-ATTRIBUTION-FOUNDATION-01`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Official DB:** `darfus_erp`  
**Mode:** `MINIMUM_SAFE_IMPLEMENTATION_WITH_FOCUSED_TESTS_AND_RUNTIME_PROOF`

## ملخص عربي

تم تنفيذ الحد الأدنى من B1 الخاص بعقد إسناد الموظف وتدقيق دورة حياة Employee. تم الحفاظ على User/Auth/RBAC كسلطة التفويض، وEmployee كهوية المشغّل، وCompany/Branch كسلطة خادمية. نجحت اختبارات B1 المركزة و`typecheck`، ولم تحدث أي كتابة على `darfus_erp` ولم تُنشأ migration.

لم يتم تشغيل mutation runtime لأن هذا Batch لا يملك target disposable مُعتمدًا يمكن إثباته آمنًا. لذلك لا أعتبر B1 مغلقًا نهائيًا: الـGate متوقف عند إثبات runtime المعزول، ولا يوجد بدء تلقائي لأي Batch لاحق.

## 1. Current Authority and Boundary

Batch A was supplied as explicitly approved and frozen:

| Decision | Frozen value |
|---|---|
| D01 Employee security | `USER_RBAC_PLUS_EMPLOYEE_OPERATOR` |
| D02 Earrings code | `ERG` |
| D03 Necklace code | `NCK` |
| D04 Item revision | `CURRENT_HISTORY_FIRST` |
| D05 CGP rollback | `TRANSACTION_ROLLBACK_BEFORE_COMMIT_AND_COMPENSATION_AFTER_DURABLE_COMMIT` |
| D06 CGP invoice | `READ_ONLY_PROJECTION_OVER_CURRENT_CGP` |

Only B1 employee identity and attribution scope was used. No Barcode, CGP, Invoice, CRM, Payroll, Attendance, Inventory, Accounting redesign, shared-account model, or new permission model was started.

The pre-edit boundary is recorded in:

`docs/client-requirements/DARFUS_CLIENT_B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION_01_CHANGE_BOUNDARY.md`

## 2. Proven B1 Design Contract

| Concern | Proven authority |
|---|---|
| Employee identity owner | `Employee` model, scoped by `companyId`; Employee authorization service owns code/branch/readiness checks |
| Technical identity | Authenticated `User` / technical session |
| Authorization | Existing User/Auth/RBAC and permission services; unchanged |
| Operator identity | Employee identity selected/verified through the existing operator session |
| Stable identifier | Employee `id`; create route accepts a caller id only within the existing model contract and generated ids remain stable after creation |
| Employee Code | `employeeCode` plus normalized value; server normalization and duplicate rejection |
| Uniqueness | DB unique partial constraint on `(company_id, employee_code_normalized)` plus service/route validation |
| Branch scope | Server-authorized Company/Branch context and explicit Employee Branch Access; employee creation does not infer Branch |
| Role vs permission | Employee organizational role/system role is separate from RBAC permissions and direct grants/denials |
| Verification | Existing Employee Code/PIN verification and operator session; verification does not grant technical RBAC |
| Attribution | `technicalUserId`, `employeeId`, code/name snapshots, company/branch, operator session, operation/reference and event time |
| Audit authority | Existing dual actor audit service and hash-chain audit log; no second audit owner introduced |
| Circular dependency | `NO` |
| Duplicate Employee master | `NO` |

## 3. Pre-change / Official DB Read-only Baseline

The official target was verified with `SELECT current_database(), current_user` before the read-only baseline and again during post-change evidence collection:

| Entity | Count after read-only verification | Expected B1 interpretation |
|---|---:|---|
| `employees` | 0 | Empty official master; not a defect by itself |
| `employee_code_history` | 0 | No employee code changes exist |
| `employee_branch_access` | 0 | No employee has branch access |
| `employee_operational_sessions` | 0 | No active operator sessions |
| `employee_verification_attempts` | 0 | No verification attempts |
| `users` | 1 | Existing technical user authority |
| `branches` | 2 | Branch master exists |
| `audit_logs` | 136 | Existing audit history preserved |
| duplicate normalized Employee Codes | 0 | No duplicate rows observed |
| null/blank normalized Employee Codes | 0 | Vacuous because Employee count is zero |

`current_database() = darfus_erp`, `current_user = postgres`. No INSERT/UPDATE/DELETE/TRUNCATE/seed/receive or business mutation was executed.

## 4. Exact B1 Gap Proven Before Edit

1. `command-actor-context.service.js` already exposed a reusable request actor, but there was no explicit stable cross-module attribution contract with company, source operation/reference, and event-time semantics.
2. Employee create/update audit records did not consistently use the existing dual technical-user/Employee actor wrapper; deactivate/reactivate had no transaction-contained audit record.
3. Focused semantic tests for the contract, idempotency-safe request actor determinism, and Employee lifecycle audit wiring were absent.

No schema gap was proven. No new Employee table, permission, account, or downstream duplicate authority was required.

## 5. Minimum Safe Implementation

### 5.1 Attribution contract

`backend/src/services/command-actor-context.service.js` now exposes `buildAttributionContract(req, options)` with:

- `technicalUserId`
- `employeeId`
- `employeeCodeSnapshot`
- `employeeNameSnapshot`
- `companyId`
- `branchId`
- `operatorSessionId`
- `sourceOperation`
- `sourceReference`
- `occurredAt`

The contract is deliberately separate from `fromRequest()`. `fromRequest()` remains deterministic and does not gain a time-varying field, preserving existing idempotency callers.

### 5.2 Employee lifecycle audit

`backend/src/routes/erp.routes.js` now uses the existing `commandActorContext.attachAuditActor()` and the new contract for:

- `employees.create`
- `employees.update`
- `employees.deactivate`
- `employees.reactivate`

Create/update/deactivate/reactivate audit writes retain the existing `AuditLog` authority. Operation is represented by the existing audit `action` and `requestedOperation`; the source Employee id is preserved through `sourceDocument`; event time is mapped to the existing audit `date` field. No second audit table or history owner was introduced.

Deactivate/reactivate now lock the Employee and update plus audit inside one transaction; audit is written before commit. Existing readiness/PIN/Branch/RBAC checks remain in place.

### 5.3 What was intentionally not changed

- No migration or model/schema change.
- No official DB provisioning or Employee creation.
- No shared Branch account.
- No RBAC or permission catalog change.
- No frontend change; no UI/browser acceptance was required for this backend-only contract.
- No downstream Invoice/CGP/POS/Inventory/Transfer/Accounting integration write path was redesigned.

## 6. Focused Tests

### B1 tests — PASS

Command:

```text
node --test backend/tests/employee-identity-attribution-foundation.test.cjs
```

Result: **4 passed, 0 failed**.

Covered:

- technical User and Employee operator identity remain separate;
- company/branch/session/source attribution fields are present;
- permissions/RBAC are not embedded in the Employee identity contract;
- no second identity field is introduced;
- `fromRequest()` remains deterministic and excludes `occurredAt`;
- Employee lifecycle routes use dual actor attribution and transaction-contained status writes/audits.

### Existing focused authorization tests — PASS

```text
node --test tests/employee-branch-authorization-contract.test.mjs
```

Result: **3 passed, 0 failed**.

### Syntax and typecheck — PASS

```text
node --check backend/src/services/command-actor-context.service.js
node --check backend/src/routes/erp.routes.js
npm run typecheck
```

All completed successfully. No frontend build was run because no frontend file changed and the project guardrail forbids unnecessary Next development/build activity at this stage.

### Existing verifier observations

Static-only execution results:

| Verifier | Result | Classification |
|---|---|---|
| `verify-single-level-employee-operator.js` | PASS | Existing static contract |
| `verify-employee-credential-setup-readiness.js` | PASS | Existing static contract |
| `verify-employee-permission-enforcement.js` | PASS | Existing static contract |
| `verify-auth-security-containment.js` | PASS | Existing security containment |
| `verify-simple-branch-account-access.js` | FAIL | Pre-existing stale migration-count expectation: 91 actual vs 48 expected |
| `verify-employee-permission-catalog-wiring.js` | FAIL | Pre-existing stale migration-count expectation: 91 actual vs 52 expected |
| `verify-simple-account-center.js` | FAIL | Pre-existing stale migration-count expectation: 91 actual vs 48 expected |

The three failures are source-verifier contract drift around migration inventory, not a B1 assertion failure and not caused by the B1 files. They were not rewritten in this Batch.

## 7. Runtime / Browser / API Proof

`RUNTIME_PROOF = BLOCKED_B1_NO_APPROVED_DISPOSABLE_TARGET`.

The running local services were observed read-only:

- `darfus-backend` up on `:8000`;
- `darfus-redis` healthy on `:6379`;
- `darfus-postgres` healthy on host `:5433`.

The PostgreSQL instance contains historical rehearsal databases, but none was identified by this Batch as an Owner-approved disposable mutation target. The official `darfus_erp` target is explicitly read-only. Creating a new clone or mutating an existing historical clone would exceed this Batch’s authority, so no Employee mutation runtime, API POST, or browser mutation was run.

Browser proof is `NOT_REQUIRED_FOR_THIS_CHANGE`: no Employee frontend file changed. A real browser acceptance is therefore not used to claim B1 runtime closure.

## 8. Security and Scope Proof

- Existing `authMiddleware` and route permission guards remain in place.
- Existing Employee authorization service remains the source of Employee code normalization, Branch access, readiness, PIN verification, and permission resolution.
- Employee organizational role is not treated as a technical permission.
- Verification does not create or elevate User/RBAC authority.
- Company and Branch are still server-derived/fail-closed.
- No hardcoded Branch or shared branch account was added.
- No `permissions` or `rolePermissions` fields were added to the Employee identity contract.

## 9. Downstream Integration Contract

The contract is prepared for downstream consumers without changing their business authorities:

| Consumer | B1 action | Result |
|---|---|---|
| Invoice / Invoice Search | Future attribution consumer | Existing invoice authority preserved; no implementation here |
| CGP | Future employee attribution/projection consumer | CGP DRAFT→VALIDATED→POSTED preserved |
| POS | Future operator attribution consumer | Sales operator policy and Asset authority preserved |
| Inventory / Transfers | Future operation/source attribution consumer | Asset/Barcode/Movement authority preserved |
| Accounting | Audit/reference consumer only | Double-entry authority untouched |
| Attendance / Payroll / KPI / Reports | Future Employee identity consumer | No modules started |
| Audit | Current B1 consumer | Existing dual actor/hash-chain audit retained |

No consumer was allowed to create a second Employee master or write across module boundaries.

## 10. Worktree / Source Drift

At evidence capture:

- `CURRENT_BRANCH = main`
- `CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521`
- `WORKTREE_ENTRIES = 635`
- `TRACKED_MODIFIED_OR_STAGED = 109`
- `UNTRACKED = 526`

The worktree contains substantial pre-existing drift. No reset, restore, clean, stash, or cleanup was performed. The B1-intended paths are:

1. `backend/src/services/command-actor-context.service.js`
2. `backend/src/routes/erp.routes.js`
3. `backend/tests/employee-identity-attribution-foundation.test.cjs`
4. `docs/client-requirements/DARFUS_CLIENT_B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION_01_CHANGE_BOUNDARY.md`
5. this report

The two backend source files were already dirty in the worktree and contain unrelated pre-existing changes. Only the B1 attribution symbols/routes described in this report are attributed to this control; unrelated drift remains untouched.

## 11. File and Mutation Ledger

| Item | Result |
|---|---|
| Product source files intentionally touched | 2 backend files |
| Test files intentionally touched | 1 focused B1 test |
| Documentation files created/updated | B1 boundary + this report |
| Migrations created | 0 |
| Official DB writes | 0 |
| Official DB business delta | 0 |
| Official permission delta | 0 |
| Seed/provisioning | 0 |
| Browser mutation | 0 |
| API business mutation | 0 |
| Production contact | 0 |

## 12. New Lesson / Prevention

`B1-L-001` — Employee lifecycle audit actor inconsistency.

- **Root cause:** Employee create/update used generic audit calls while deactivate/reactivate lacked transaction-contained audit records.
- **What allowed it:** The existing dual-actor helper was available but not enforced by a focused lifecycle contract.
- **Minimum fix:** Reuse the existing command actor and audit services; add the stable attribution helper and transaction-contained lifecycle audit writes.
- **Prevention gate:** Keep the B1 focused lifecycle static test and require every future Employee lifecycle route to declare operation/reference attribution.
- **Modules affected:** Employee identity/audit only.

No new permission, account, schema, or downstream business authority was introduced.

## 13. Gate

Static implementation and focused tests are complete, but the required mutation runtime proof cannot be authorized safely without an exact disposable target. Therefore:

```text
TARGET_REQUIREMENTS = EMP-001, EMP-002, EMP-003, EMP-004, EMP-005, EMP-006,
                      EMP-007, EMP-031, EMP-032, EMP-034, EMP-035, EMP-037
IMPLEMENTED = B1 attribution contract + Employee lifecycle dual-audit/transaction guard
NOT_IMPLEMENTED = disposable runtime mutation proof; downstream feature integrations
OWNER_DECISIONS = none additional; disposable runtime target authorization required
SOURCE_FILES_CHANGED = 2 intentional B1 source paths; pre-existing drift preserved
TEST_FILES_CHANGED = 1
MIGRATIONS = 0
OFFICIAL_DB_MUTATIONS = 0
FOCUSED_TESTS = PASS
TYPECHECK = PASS
BUILD = NOT_REQUIRED
RUNTIME = BLOCKED_B1_NO_APPROVED_DISPOSABLE_TARGET
DB_INTEGRITY = PASS_READ_ONLY_ZERO_DELTA
INVENTORY_INTEGRITY = NOT_APPLICABLE
ACCOUNTING_INTEGRITY = NOT_APPLICABLE
SECURITY_INTEGRITY = PASS_STATIC_RBAC_PRESERVED
NEW_LESSONS = B1-L-001
P0 = 0
P1 = 0
P2 = 1 (runtime proof target unresolved; plus pre-existing stale verifier expectations)
P3 = 0
GATE = BLOCKED_B1_RUNTIME_PROOF_TARGET_UNRESOLVED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 14. Final Tokens

```text
CURRENT_BATCH = DARFUS-CLIENT-B1-EMPLOYEE-IDENTITY-ATTRIBUTION-FOUNDATION-01
MODE = MINIMUM_SAFE_IMPLEMENTATION_WITH_FOCUSED_TESTS_AND_RUNTIME_PROOF

WHO_OWNS_EMPLOYEE_IDENTITY = EMPLOYEE_MODEL_AND_EMPLOYEE_AUTHORIZATION_SERVICE
TECHNICAL_AUTHORITY = USER_AUTH_RBAC
EMPLOYEE_OPERATOR_AUTHORITY = VERIFIED_EMPLOYEE_OPERATOR_SESSION
COMPANY_BRANCH_AUTHORITY = SERVER_AUTHORITATIVE_FAIL_CLOSED
EMPLOYEE_CODE_UNIQUENESS = PASS_STATIC_DB_CONSTRAINT_AND_NORMALIZATION
ROLE_PERMISSION_SEPARATION = PASS
ATTRIBUTION_CONTRACT = IMPLEMENTED
EMPLOYEE_LIFECYCLE_DUAL_AUDIT = IMPLEMENTED
TRANSACTION_CONTAINED_LIFECYCLE_AUDIT = IMPLEMENTED
CIRCULAR_DEPENDENCY = NO
DUPLICATE_EMPLOYEE_AUTHORITY = NO

FOCUSED_TESTS = PASS (4 B1 + 3 existing branch-authorization tests)
TYPECHECK = PASS
BUILD = NOT_REQUIRED
RUNTIME_PROOF = BLOCKED_B1_NO_APPROVED_DISPOSABLE_TARGET
BROWSER_PROOF = NOT_REQUIRED_UI_UNCHANGED
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_READ_ONLY = YES
PERSISTENT_OFFICIAL_DB_WRITES = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
BUSINESS_DB_DELTA = 0
PERMISSION_DB_DELTA = 0
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1
P3_COUNT = 0
GATE = BLOCKED_B1_RUNTIME_PROOF_TARGET_UNRESOLVED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_AND_EXPLICIT_DISPOSABLE_RUNTIME_TARGET_AUTHORIZATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — لا يبدأ Batch C أو أي Batch لاحق، ولا يتم إنشاء Employee أو تشغيل mutation runtime، قبل مراجعة Owner وتحديد target disposable معتمد صراحةً.**
