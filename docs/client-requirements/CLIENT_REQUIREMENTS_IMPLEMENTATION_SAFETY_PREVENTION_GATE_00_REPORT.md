# DARFUS ERP — Client Requirements Implementation Safety & Prevention Gate 00

Control ID: `DARFUS-CLIENT-IMPLEMENTATION-SAFETY-PREVENTION-GATE-00`  
Project: `I:\WORK\jewellery-erp-master`  
Official DB: `darfus_erp`  
Mode: `GOVERNANCE_ONLY / NO_CLIENT_FEATURE_IMPLEMENTATION`

## Executive Summary

تم تثبيت طريقة تنفيذ موحّدة قبل أي Client Requirement batch. تمت مراجعة حالة التدقيق السابق ومصفوفة المتطلبات ذات الـ191 صفًا، وتثبيت حدود التغيير، مستويات الإثبات، سياسة قاعدة البيانات الرسمية، قواعد الأمان، منع الضرر الخفي، وآلية التعامل مع الفشل. لم يتم تعديل الكود أو الاختبارات أو قاعدة البيانات أو migrations، ولم يبدأ Batch A أو أي Batch آخر.

`GATE = PASS_CLIENT_IMPLEMENTATION_SAFETY_PREVENTION_GATE_00`

هذا Gate يثبت منهج التنفيذ فقط، ولا يعني أن Product Exact Parity مكتمل.

## Current Accepted State

| Control | State | Evidence |
|---|---|---|
| Inventory Count | `CLOSED` | Previous accepted state; no direct regression was investigated or introduced here. |
| Client Requirements Exact Parity Audit | `PASS` | Existing report and four audit artifacts are present. |
| Atomic requirements | `191` | Matrix row count verified read-only. |
| Product exact parity | `NOT_COMPLETE` | Matrix contains gaps/conflicts; no implementation has started. |
| Implementation | `NOT_STARTED` | No client feature code was changed in this control. |
| Official DB | `darfus_erp` | Remains read-only. |

## Authority Order Frozen

1. The five client DOCX files are the Business Requirements Authority.
2. Frozen Owner/Product Decisions are the Architecture/System Authority.
3. Current Source + DB + Runtime are Implementation Reality.
4. Previous reports/tests are supporting evidence only.

No report, stale test, UI label or historical acceptance result can override the first two authorities.

## Lessons Freeze

| ID | Frozen prevention rule | Required behavior in every future batch |
|---|---|---|
| L1 | Simple Cause First | Check context, headers, current runtime, helper, config and stale test before redesign. |
| L2 | Prove Before Theory | Require Network + Source + DB facts before declaring root cause; distinguish request/item/row/event counts. |
| L3 | Smallest Safe Fix | UI defect stays UI-only; context defect stays context/runtime; projection gap stays projection; business change requires proof/approval. |
| L4 | Expected ≠ Observed | Configured, displayed, requested and expected states are not persistence/execution proof. |
| L5 | Transitional ≠ Final | Draft/Pending/Processing/Retry/Settlement/Sync cannot be presented as final customer truth without an explicit mapping. |
| L6 | No Recovery Without Dead-End | Prove a real operational dead-end before adding Cancel, Abandon, Force Close, Cleanup, Retry or Admin Repair. |
| L7 | Residue ≠ Product Defect | Separate harmless local/test residue from a real operational blocker; never clean history to make counts look better. |
| L8 | Tests Protect Accepted Behavior | Replace stale implementation-marker assertions with semantic behavior assertions; do not change product code to satisfy obsolete tests. |
| L9 | Runtime Parity First | After source changes, prove current source, fresh serving process, correct DB identity and correct auth/company/branch context before acceptance. |
| L10 | Unsafe Mutation Is Never Auto-Replayed | Critical POST/PUT/PATCH requires a controlled attempt, idempotency where supported, and no automatic unsafe retry. |

## Change Boundary Contract

Before editing any future batch, the owner-facing pre-change record must contain:

```text
TARGET_REQUIREMENT_IDS = exact matrix IDs only
EXACT_GAP = evidence-backed gap, not a symptom label
ROOT_CAUSE = proven after Simple Cause First checks
FILES_EXPECTED_TO_CHANGE = explicit allow-list
FILES_FORBIDDEN_TO_CHANGE = explicit deny-list
DB_SCHEMA_CHANGE_EXPECTED = YES/NO/UNKNOWN
BUSINESS_LOGIC_CHANGE_EXPECTED = YES/NO
ACCOUNTING_IMPACT = NONE or named authority/path
INVENTORY_IMPACT = NONE or Asset/Barcode/Status/Movement/Event scope
SECURITY_IMPACT = NONE or named User/RBAC/Company/Branch/Employee scope
IDEMPOTENCY_IMPACT = NONE or named key/hash/replay/concurrency scope
```

If actual work exceeds this boundary: `STOP → REVIEW → NO AUTOMATIC WIDENING`.

## Required Execution Pipeline

Every implementation batch must execute in this order:

1. Read the exact client requirement completely.
2. Read the current source.
3. Prove the exact gap.
4. Check the simplest plausible cause first.
5. Map dependencies and impact.
6. Obtain Owner decision where architecture/business choice exists.
7. Define the minimum safe change.
8. Define backup/rehearsal plan for migration or risky persistent mutation.
9. Implement only the declared smallest change.
10. Run focused tests.
11. Run typecheck/build as relevant.
12. Use a disposable/approved runtime target for mutation or risky proof.
13. Run real AR/EN browser/network proof when UI/workflow is affected.
14. Prove the backend/API contract.
15. Reconcile the DB/source-of-truth.
16. Run inventory integrity proof if Asset/Barcode/Movement is affected.
17. Run accounting balance/reconciliation if financial authority is affected.
18. Run idempotency/concurrency proof if a command/replay path is affected.
19. Run Security/RBAC/Company/Branch proof if scope or permissions are affected.
20. Run regression only for impacted shared authorities.
21. Compare before/after deltas.
22. Add a prevention lesson/test only for a new proven defect class.
23. Apply the PASS/BLOCK gate.
24. Stop for Owner review; no automatic next batch.

## Proof Levels Frozen

| Change class | Minimum proof |
|---|---|
| UI-only | Source diff, focused UI tests, typecheck, real AR/EN browser when applicable, network proof, no unexpected mutation. |
| Read-model/projection | Source mapping, API response, DB/source reconciliation, no duplicate authority, browser display, read-only semantics. |
| Backend business logic | Focused unit/integration tests, transaction proof, idempotency/concurrency, scope/RBAC, runtime API proof. |
| Inventory | Asset identity, Barcode identity, status, branch/location, movements/events, exactly-once behavior. |
| Accounting/financial | Balanced journal, debit=credit, unique source reference, no orphan/duplicate lines, tax snapshot, treasury/payable/receivable reconciliation. |
| Migration | Verified backup, disposable up/second-run/rollback rehearsal, fresh-DB rehearsal where relevant, existing-data compatibility, Owner approval before official promotion. |

## Official DB and Mutation Policy

`darfus_erp = READ_ONLY` for forensic, design, test and ordinary acceptance work.

Persistent mutation is permitted only under a separately named Owner-approved gate that identifies the exact target, baseline, backup, rehearsal and migration sequence. No direct SQL business repair, history deletion, cleanup, truncate, reset, broad reindex or unapproved heavy operation is permitted.

Before any approved mutation proof:

```text
resolve SELECT current_database()
verify exact approved target
verify baseline
verify active business-write guard immediately before apply
perform only the declared mutation
capture before/after delta
```

## Security Freeze

The following remain non-negotiable:

- User/Auth/RBAC and fail-closed permission checks.
- Company and Branch server authority.
- Employee operator attribution from verified server context.
- UI visibility is never permission authority.
- No hardcoded/fallback financial authority.
- No shared-account change without explicit security Owner decision.

## Closed Authority Protection

Do not reopen or rewrite these to match client wording alone:

- Asset identity and one physical piece/Asset authority.
- Barcode identity/history authority.
- Inventory Count, currently closed.
- CGP `DRAFT → VALIDATED → POSTED` and approval-free governance.
- Gold Center and Tax Engine authority.
- Accounting double-entry.
- Company/Branch fail-closed context.
- Idempotency.

If a client requirement conflicts, record `CONFLICT_REGISTER`, obtain `OWNER_DECISION`, and prefer a safe adapter/projection where that preserves authority.

## Failure Handling

When any proof fails:

1. Stop the current gate.
2. Classify the failure as environment, context, runtime, stale test, UI, backend, DB/schema or business logic.
3. Prove the root cause.
4. Fix only that class after approval/boundary check.
5. Re-run the smallest failed proof.
6. Complete the original gate only after the rerun passes.

No new module starts while a P0/P1 introduced by the current batch remains unresolved. No unsafe mutation is retried automatically.

## No Hidden Damage Rule

Every affected batch must record:

```text
EXPECTED_DB_DELTA = explicit
ACTUAL_DB_DELTA = observed
UNEXPECTED_DB_DELTA = 0
UNEXPECTED_ASSET_DELTA = 0
UNEXPECTED_MOVEMENT_DELTA = 0
UNEXPECTED_JOURNAL_DELTA = 0
UNEXPECTED_PERMISSION_DELTA = 0
```

Owner or concurrent activity must be attributed explicitly. Unknown deltas block the gate; they are never guessed away.

## Severity and Stop Rule

- `P0`: security breach or destructive/unrecoverable financial/inventory/data corruption.
- `P1`: blocking business-integrity defect.
- `P2`: non-blocking product/UX/operational defect.
- `P3`: evidence, documentation, cosmetic or advisory issue.

No future gate can PASS with `P0 > 0` or a blocking `P1 > 0`. P2/P3 require a documented disposition.

## Prevention Register Contract

Every new proven defect class must add a prevention record containing:

```text
LESSON_ID
ROOT_CAUSE
WHAT_ALLOWED_IT_TO_HAPPEN
MINIMUM_FIX
PREVENTION_GATE
TEST_TO_PREVENT_REGRESSION
MODULES_AFFECTED
```

Duplicate known defect classes do not receive duplicate lessons; they reference the existing prevention rule.

## Reporting Quality Contract

Every future report must distinguish, separately:

- request count;
- item count;
- result/row count;
- business event count;
- DB write count;
- idempotent replay count.

Every PASS claim must state exact evidence and its boundary. A successful UI click, route existence or request dispatch is not persistence proof.

## Frozen Next Order

No batch starts automatically. The approved proposal order is:

`A Owner/Architecture Decisions → B Employee Identity + Attribution → C Barcode Exact Parity → D1 Invoice Projection Foundation → E CGP Invoice Projection → D2 Final Invoice Search & Print → F–K CRM → L Attendance + Leave → M Payroll + Accounting → N KPI / Performance → O Final Client Parity`.

The order does not override Owner decisions or permit implementation without a new batch gate.

## Current Control Boundary

```text
TARGET_REQUIREMENT_IDS = NONE; Control 00 is governance-only
EXACT_GAP = No client feature is being implemented in Control 00
ROOT_CAUSE = Not applicable; prevention method is being frozen
FILES_EXPECTED_TO_CHANGE = docs/client-requirements/CLIENT_REQUIREMENTS_IMPLEMENTATION_SAFETY_PREVENTION_GATE_00_REPORT.md
FILES_FORBIDDEN_TO_CHANGE = all source, test, migration, config, DB, security and runtime files
DB_SCHEMA_CHANGE_EXPECTED = NO
BUSINESS_LOGIC_CHANGE_EXPECTED = NO
ACCOUNTING_IMPACT = NONE
INVENTORY_IMPACT = NONE
SECURITY_IMPACT = POLICY FREEZE ONLY; NO SECURITY CHANGE
IDEMPOTENCY_IMPACT = POLICY FREEZE ONLY; NO IDEMPOTENCY CHANGE
```

## Evidence and Change Accounting

- Existing parity matrix verified at 191 rows.
- Existing four parity audit artifacts were present before this report was created.
- Docker services were observed read-only: backend on 8000, Redis healthy on 6379, PostgreSQL healthy on host 5433.
- No source/test file was edited by Control 00.
- The current worktree contains unrelated pre-existing dirty changes; no cleanup/reset/restore/stash was performed.
- No business API mutation was issued.
- No official DB backup, migration, seed, SQL write or runtime business mutation was issued.

## Gate

```text
LESSONS_REVIEWED = YES
SAFETY_BOUNDARY_FROZEN = YES
EXECUTION_PIPELINE_FROZEN = YES
DB_POLICY_FROZEN = YES
SECURITY_POLICY_FROZEN = YES
FAILURE_HANDLING_FROZEN = YES
NO_HIDDEN_DAMAGE_RULE_FROZEN = YES
PREVENTION_PROCESS_FROZEN = YES

SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
DB_WRITES = 0
MIGRATIONS = 0
BUSINESS_FEATURES_IMPLEMENTED = 0
OWNER_DECISIONS_ASSUMED = 0
INVENTORY_COUNT_REOPENED = NO

GATE = PASS_CLIENT_IMPLEMENTATION_SAFETY_PREVENTION_GATE_00
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Batch Completion Contract

```text
TARGET_REQUIREMENTS = NONE; GOVERNANCE ONLY
IMPLEMENTED = SAFETY/PREVENTION POLICY DOCUMENTATION ONLY
NOT_IMPLEMENTED = ALL CLIENT FEATURES
OWNER_DECISIONS = NONE ASSUMED; REQUIRED DECISIONS REMAIN OPEN
SOURCE_FILES_CHANGED = 0
MIGRATIONS = 0
OFFICIAL_DB_MUTATIONS = 0
FOCUSED_TESTS = NOT_APPLICABLE; READ-ONLY GOVERNANCE CONTROL
TYPECHECK = NOT_APPLICABLE; NO CODE CHANGE
BUILD = NOT_RUN; NO CODE CHANGE
RUNTIME = READ-ONLY SERVICE OBSERVATION ONLY
DB_INTEGRITY = NO-MUTATION BASELINE PRESERVED
INVENTORY_INTEGRITY = NOT_AFFECTED
ACCOUNTING_INTEGRITY = NOT_AFFECTED
SECURITY_INTEGRITY = PRESERVED; NO AUTHORITY CHANGE
NEW_LESSONS = L1-L10 FROZEN; NO NEW DEFECT CLASS
P0 = 0
P1 = 0
P2 = 0
P3 = 0
GATE = PASS_CLIENT_IMPLEMENTATION_SAFETY_PREVENTION_GATE_00
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No Client feature implementation, Owner decision, DB mutation, security change, migration, seed, backup, automatic Batch A or production action was started. Wait for Owner review/approval.
