# DARFUS ERP — PHASE 03A-R3B-R4

## MINIMUM SAFE FRESH-INSTALL V1 → V2 FIRST-RUN FOUNDATION FIX

**Control ID:** `DARFUS-PHASE-03A-R3B-R4-MINIMUM-SAFE-FRESH-INSTALL-V1-V2-FIRST-RUN-FOUNDATION-FIX`  
**Mode:** `MINIMUM_SAFE_SOURCE_FIX_AND_FOCUSED_TESTS`  
**Official DB:** `darfus_erp` — read-only  
**Disposable DB:** `darfus_first_run_r3b_20260818_104917`

## 1. Executive Summary

تم تنفيذ الحد الأدنى من إصلاح Fresh-Install المثبت في R3B-R3. التعديل يجعل Inventory Master Data Bootstrap يهيئ V1 canonical foundation داخل نفس First-Run transaction عندما تكون الشركة الجديدة عند baseline صفري، ثم يعيد استخدام V2 reconciliation القائم للوصول إلى `659/39/5/20`, `barcode_sequences=0`, و`READY`.

الـsource fix نجح في focused unit/contract tests، والـreal PostgreSQL Disposable flow وصل فعليًا إلى النتيجة الصحيحة. لكن أمر PostgreSQL integration خرج `FAIL` بعد نجاح الـflow بسبب assertion test ناقص كان يتوقع فئات V2 فقط، بينما النتيجة النهائية تحتوي V1+V2. تم تصحيح assertion، لكن إعادة mutation على نفس الـDisposable ممنوعة صراحةً لأنها لم تعد fresh ولا يجوز reset/clean. لذلك Gate هذا التقرير محجوب حتى إعادة الاختبار على Disposable fresh معتمدة.

لم تحدث أي كتابة على `darfus_erp`، ولم تُنشأ migration، ولم يُشغّل build أو Browser acceptance أو runtime main restart.

## 2. Preconditions

تمت قراءة الملفات المطلوبة كاملة قبل التعديل:

| Input | Result |
|---|---|
| `DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md` | Complete |
| `DARFUS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_REPORT.md` | Complete |
| `DARFUS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION_REPORT.md` | Complete |
| `DARFUS_PHASE_03A_R3A_FIRST_RUN_BROWSER_PATH_FORENSIC_ACCEPTANCE_CRITERIA_CORRECTION_REPORT.md` | Complete |
| `DARFUS_PHASE_03A_R3B_R2_TRUE_FIRST_RUN_BROWSER_RETRY_FULLY_ISOLATED_RUNTIME_REPORT.md` | Complete |
| `DARFUS_PHASE_03A_R3B_R3_SETUP_BOOTSTRAP_409_ROOT_CAUSE_FORENSIC_REPORT.md` | Complete; required gate matched |

R3 preconditions matched:

```text
GATE = PASS_PHASE_03A_R3B_R3_SETUP_BOOTSTRAP_409_ROOT_CAUSE_DEFINED
EXACT_FAILING_STAGE = K. INVENTORY_MASTER_BOOTSTRAP
PRODUCT_FIRST_RUN_FRESH_INSTALL_BUG = YES
PRODUCT_SOURCE_PATCH_REQUIRED = YES
MIGRATION_REQUIRED_FOR_FIX = NO
```

## 3. Proven R3 Root Cause

The previous 409 was proven at `backend/src/services/inventory-master-data-bootstrap.service.js:168`:

```text
new company baseline = 0 / 0 / 0 / 0 / 0
V2 required baseline = 502 / 39 / 5 / 20 / 0
baselineMatches(before) = false
ConflictError("INVENTORY_MASTER_DATA_BASELINE_DRIFT")
HTTP = 409, public errorCode = STATE_CONFLICT
```

R4 addresses only this orchestration gap.

## 4. Official Backup Reverification

```text
FILE = backups/official/darfus_erp_POST_R2_FULL_20260818_095351.dump
SIZE = 646071 bytes
SHA256 = 844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1
BACKUP_SHA256_MATCH = YES
PG_RESTORE_LIST = PASS
```

`pg_restore -l` was run in a disposable read-only container against a read-only bind mount. No database restore occurred.

## 5. Official DB Baseline Before

The R3 verified before-state was rechecked as read-only:

| Entity | Before |
|---|---:|
| Database | `darfus_erp` |
| SequelizeMeta | 83 |
| Companies / Branches / Users | 1 / 1 / 1 |
| Profile master data | 659 |
| Pearl sizes | 39 |
| Barcode inventory / item | 5 / 20 |
| Barcode sequences | 0 |
| Inventory bootstrap states | 1, `READY`, version 2 |
| Audit logs | 23 |
| Idempotency requests | 0 |

Official database remained outside every mutation command.

## 6. Source Design Decision

The chosen boundary is `initializeV1Foundation()` inside `inventory-master-data-bootstrap.service.js`, called by `runBootstrap()` after company existence/state checks and before the existing V2 state creation/delta reconciliation.

| Baseline state | Behavior |
|---|---|
| Exact V1 `502/39/5/20/0` | Verify identity/canonical values, keep rows, continue V2 |
| Absolute zero `0/0/0/0/0` | Insert canonical V1, verify exact V1, continue V2 |
| Partial/conflicting | Throw `INVENTORY_MASTER_DATA_BASELINE_DRIFT`; no repair |
| Existing V2 `READY` | Existing replay branch runs first; no V1 reinsertion or V2 rewrite |

The implementation reuses the existing V1 profile snapshot, Pearl `INITIAL_VALUES`, and barcode defaults. It does not duplicate a new business dataset.

## 7. Files Changed

Intentional R4 changes:

| File | Change |
|---|---|
| `backend/src/services/inventory-master-data-bootstrap.service.js` | V1 zero-baseline foundation, canonical barcode insertion, V1 verification, V2 integration |
| `backend/tests/inventory-master-data-bootstrap-r4.test.cjs` | New five-case focused unit test file |
| `tests/first-run-postgres.integration.test.cjs` | Added V1/V2 counts, state, category, and rollback assertions; corrected final category expectation after observed V1+V2 result |
| `docs/DARFUS_PHASE_03A_R3B_R4_MINIMUM_SAFE_FRESH_INSTALL_V1_V2_FIRST_RUN_FOUNDATION_FIX_REPORT.md` | This report |

The source file and the pre-existing R2 migration/test files were already untracked worktree content before R4. No unrelated untracked files were cleaned or adopted.

## 8. V1 Foundation Implementation

The new zero path inserts:

- all `manifest.V1_PROFILE_MASTER_DATA_ROWS` through `profile-master-data.service.js`;
- all `pearlSizeMasterData.INITIAL_VALUES` through `seedInitial()`;
- all canonical `DEFAULT_BARCODE_INVENTORY_CODES` and `DEFAULT_BARCODE_ITEM_CODES` with company-scoped IDs and `ON CONFLICT DO NOTHING`.

After insertion it calls the existing V1 identity and canonical verification functions. No barcode sequence row is created or consumed.

## 9. Fresh-Zero Detection

`baselineIsEmpty()` requires all five values to be zero:

```text
profile = 0
pearl = 0
barcode inventory = 0
barcode item = 0
barcode sequences = 0
```

If any value is nonzero but the exact V1 baseline does not match, the service fails closed. There is no partial repair path.

## 10. Partial/Conflict Fail-Closed Behavior

The existing `baselineMatches()`, `verifyV1BaselineIdentity()`, and `verifyCanonicalBaseline()` were not weakened or bypassed. Partial baseline tests passed with unchanged state after rejection. Disabled/conflicting rows are not silently reactivated, overwritten, deleted, or replaced.

## 11. Transaction Boundary

The V1 foundation receives the existing `transaction` object from `runBootstrap()`. The transaction remains shared across:

```text
Company → User/Role → Branch → Financial readiness → V1 → V2 → Audit → READY marker
```

No nested independent commit or startup provisioning was introduced. The unit rollback test passed, and the real PostgreSQL rollback attempt left Company/User/Branch and all V1/V2 rows at zero after the injected audit failure.

## 12. V2 Integration

After V1 verification, the existing V2 state creation, manifest hash, 157-row reconciliation, exact delta check, audit, and READY update continue unchanged. V2 remains responsible for the eight approved category counts and does not become a second business workflow.

## 13. Existing READY Compatibility

The `state?.state === STATES.READY` branch remains before V1 initialization. It verifies current V2 result and returns `replayed: true` with zero changes. Focused replay test passed with unchanged in-memory state and zero sequences.

## 14. Barcode Sequence Safety

The foundation only inserts barcode taxonomy rows. It does not insert or allocate `barcode_sequences`, assets, or physical barcode identities.

```text
BARCODE_SEQUENCE_CONSUMPTION = 0
ASSET_CREATION = 0
PHYSICAL_BARCODE_ALLOCATION = 0
```

## 15. Audit Behavior

The existing Inventory V2 audit call remains in the same transaction. The Disposable successful run produced only the expected setup/reference audit rows; no Official audit row changed. The V1 foundation itself does not add a separate business transaction audit event.

## 16. Focused Test Changes

The new focused file covers:

1. zero baseline initializes V1 exact counts;
2. exact V1 is kept without reinsertion;
3. partial baseline fails closed without destructive repair;
4. V2 READY replay is idempotent;
5. injected failure after V1 is rolled back by test transaction mechanics.

The real PostgreSQL integration test now asserts rollback zero rows, final `659/39/5/20/0`, V2 READY state/hash, and all final category counts.

## 17. Focused Test Results

```text
node --test backend/tests/inventory-master-data-bootstrap-r4.test.cjs \
  backend/tests/inventory-master-data-bootstrap-r2.test.cjs \
  tests/first-run-bootstrap.test.cjs

17 tests / 17 passed / 0 failed
```

The first real PostgreSQL integration execution reached the successful final state but exited with one assertion failure because the newly added category expectation listed only V2 categories. The assertion was corrected to the observed final V1+V2 map. It was not rerun because the Disposable is now populated and R4 explicitly forbids reset/clean/reuse for another mutation proof.

## 18. PostgreSQL Zero-Baseline Test

Pre-mutation read-only gate passed:

```text
current_database = darfus_first_run_r3b_20260818_104917
companies = 0
branches = 0
users = 0
profile/pearl/barcode inventory/barcode item = 0/0/0/0
barcode sequences = 0
inventory bootstrap state = 0
first-run state = 0
```

The actual first-run integration then produced:

```text
Company/User/Branch = 1/1/1
profile/pearl/barcode inventory/barcode item = 659/39/5/20
barcode sequences = 0
inventory bootstrap state = READY, version 2
manifest hash = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
```

The test process later exited on the category-map assertion described above. Therefore the strict R4 token remains:

```text
ZERO_BASELINE_POSTGRES_TEST = BLOCKED_REQUIRES_FRESH_RERUN_AFTER_CORRECTED_ASSERTION
```

No reset, clean, or second mutation was performed.

## 19. Final Canonical Counts

Read-only post-run query on the Disposable returned:

| Entity | Actual |
|---|---:|
| Profile master data | 659 |
| Pearl sizes | 39 |
| Barcode inventory codes | 5 |
| Barcode item codes | 20 |
| Barcode sequences | 0 |
| Inventory bootstrap states | 1 |

State:

```text
dataset = INVENTORY_REFERENCE_MASTER_DATA
version = 2
state = READY
manifest_hash = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
```

Final category counts matched the V1+V2 canonical set, including the required V2 counts: Certificate Authority 16, Diamond Tone 14, Diamond Tone Level 9, Diamond Saturation 10, Diamond Position 7, Diamond Setting 47, Gemstone Position 7, Gemstone Setting 47. `GEMSTONE_TREATMENT` remained absent/zero. `Gübelin` is present through the canonical authority; `WT`, `WCH`, `ERR`, and `NLC` are absent from the resulting taxonomy.

## 20. Duplicate/Idempotency Proof

Focused V2 READY replay passed with unchanged state and no sequence consumption. The real PostgreSQL integration also reached its replay and conflicting-replay assertions before the later category assertion failure. The final Disposable query shows one bootstrap state and zero idempotency request rows; no duplicate master rows were observed.

## 21. Rollback Proof

The focused rollback test passed. In the real PostgreSQL integration, the injected audit failure after the new V1/V2 path was followed by zero Company/User/Branch, zero V1 rows, zero V2 rows, zero bootstrap state, and `SETUP_REQUIRED` before the concurrency success path. This proves the V1 inserts share the First-Run rollback boundary.

## 22. Official DB Baseline After

Read-only post-control query returned the same protected baseline:

```text
darfus_erp
companies=1 branches=1 users=1
profile=659 pearl=39 barcode_inventory=5 barcode_item=20 sequences=0
inventory_bootstrap_states=1 READY v2
audit_logs=23
idempotency_requests=0
```

## 23. Official DB Reconciliation

| Area | Before | After | Result |
|---|---:|---:|---|
| Companies / Branches / Users | 1 / 1 / 1 | 1 / 1 / 1 | unchanged |
| Profile / Pearl | 659 / 39 | 659 / 39 | unchanged |
| Barcode inventory / item | 5 / 20 | 5 / 20 | unchanged |
| Barcode sequences | 0 | 0 | unchanged |
| Inventory bootstrap state | 1 READY v2 | 1 READY v2 | unchanged |
| Audit logs | 23 | 23 | unchanged |
| Idempotency requests | 0 | 0 | unchanged |
| Official business rows | unchanged | unchanged | no mutation |

```text
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
```

## 24. Main Runtime Protection

No `localhost:3000` or `localhost:8000` process was restarted, rebuilt, repointed, or replaced. Main listeners remained present. Disposable `8121`/`3301` remained stopped. No Browser acceptance was run.

```text
MAIN_RUNTIME_RESTARTED = NO
BUILD_RUN = NO
FINAL_BROWSER_ACCEPTANCE = NOT_RUN
```

## 25. Git Safety

No `reset`, `clean`, `restore`, `checkout`, `stash`, `add`, `commit`, or `push` was run. `AGENTS.md` and `next-env.d.ts` were not edited.

R4 worktree evidence:

```text
branch = main
HEAD = 1657b0e9ba580faef69be48f04637835c201b521
status lines after R4 edits = 347
tracked modified = 89
untracked = 736
stash count = 11
```

The increase from the R3 baseline is attributable to the intentional R4 integration-test edit, new R4 test, and this report. Existing untracked source/migration/R2-test files remain pre-existing worktree content.

## 26. Migration/Build Confirmation

```text
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED_TO_OFFICIAL = 0
BUILD_RUN = NO
```

No schema change was required. No startup seed or automatic runtime mutation was introduced.

## 27. Remaining Out-of-Scope

Not started:

- R3B-R5 Browser final acceptance;
- Phase 03A closure;
- Phase 03B;
- Supplier, Location, VAT, GBW, GBP, Diamond, Gem Stone, Pearl work;
- production configuration or Official DB provisioning;
- migrations, build, deploy, or main runtime restart.

## 28. R4 Gate

The source fix and focused tests pass. The Disposable runtime proof reached the correct final state, but the required PostgreSQL test command exited nonzero on a test assertion that was corrected afterward. R4 forbids resetting or cleaning the now-populated Disposable, so the corrected integration test cannot be honestly marked rerun/pass in this control.

```text
GATE = BLOCKED_PHASE_03A_R3B_R4_FIX_OR_TEST_FAILURE
```

This is a verification gate block, not evidence of a source/business-rule failure. It must be closed only by a fresh Owner-approved Disposable PostgreSQL run with the corrected assertion.

## 29. Exact Final Browser Acceptance Scope

No Browser acceptance is authorized or started by R4. The next separate control, only after Owner approval and a fresh safe target, is:

```text
R3B-R5_FINAL_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE
```

Expected scope: fresh Disposable → isolated Backend/Frontend → `SETUP_REQUIRED` → valid setup POST → Company/User/Branch → financial readiness → V1 → V2 → `659/39/5/20/0` → READY → login, while Official DB remains unchanged.

## 30. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3B-R4-MINIMUM-SAFE-FRESH-INSTALL-V1-V2-FIRST-RUN-FOUNDATION-FIX
PHASE = 03A-R3B-R4
MODE = MINIMUM_SAFE_SOURCE_FIX_AND_FOCUSED_TESTS
OFFICIAL_DB = darfus_erp
DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
PROVEN_PREVIOUS_ROOT_CAUSE = INVENTORY_MASTER_DATA_BASELINE_DRIFT_ON_ZERO_BASELINE
SOURCE_FIX_IMPLEMENTED = YES
V1_FOUNDATION_BOUNDARY = initializeV1Foundation() INSIDE runBootstrap() AND THE EXISTING FIRST-RUN SEQUELIZE TRANSACTION, BEFORE V2 STATE/DELTA
V1_ZERO_BASELINE_INITIALIZATION = PASS_IN_FOCUSED_TESTS_AND_REACHED_PASS_IN_REAL_DISPOSABLE_FLOW; STRICT_R4_RERUN_BLOCKED_BY_POSTCONDITION_ASSERTION_CORRECTION
V1_PROFILE_COUNT = 502
V1_PEARL_COUNT = 39
V1_BARCODE_INVENTORY_COUNT = 5
V1_BARCODE_ITEM_COUNT = 20
V1_BARCODE_SEQUENCE_COUNT = 0
V2_DELTA_COUNT = 157
FINAL_PROFILE_COUNT = 659
FINAL_PEARL_COUNT = 39
FINAL_BARCODE_INVENTORY_COUNT = 5
FINAL_BARCODE_ITEM_COUNT = 20
FINAL_BARCODE_SEQUENCE_COUNT = 0
BOOTSTRAP_VERSION = 2
BOOTSTRAP_STATE = READY
BOOTSTRAP_MANIFEST_HASH = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
PARTIAL_BASELINE_FAIL_CLOSED = PASS
V2_READY_REPLAY_IDEMPOTENCY = PASS
ROLLBACK_ATOMICITY = PASS
ZERO_BASELINE_POSTGRES_TEST = BLOCKED_REQUIRES_FRESH_RERUN_AFTER_CORRECTED_ASSERTION
FOCUSED_TESTS = 17/17 PASS (UNIT/CONTRACT); POSTGRES INTEGRATION REACHED FINAL STATE BUT EXITED ON ASSERTION BEFORE CORRECTION
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
MAIN_RUNTIME_RESTARTED = NO
SOURCE_FILES_CHANGED = backend/src/services/inventory-master-data-bootstrap.service.js (R4 additions to pre-existing untracked source)
TEST_FILES_CHANGED = backend/tests/inventory-master-data-bootstrap-r4.test.cjs; tests/first-run-postgres.integration.test.cjs
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED_TO_OFFICIAL = 0
BUILD_RUN = NO
PHASE_03A_FINAL_CLOSED = NO
GATE = BLOCKED_PHASE_03A_R3B_R4_FIX_OR_TEST_FAILURE
NEXT_RECOMMENDED_STEP = OWNER APPROVE A FRESH DISPOSABLE POSTGRESQL R4 RERUN USING THE CORRECTED FINAL CATEGORY ASSERTION; DO NOT RESET OR CLEAN THE CURRENT POPULATED DISPOSABLE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.** Do not start R3B-R5, Browser acceptance, Phase 03A closure, Phase 03B, Supplier/Location/VAT, GBW/GBP, Diamond/Gem/Pearl, reset, clean, drop, commit, or push. Wait for Owner Review.

