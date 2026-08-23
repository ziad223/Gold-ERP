# DARFUS ERP — PHASE 03A-R3B-R4-R1

## FRESH DISPOSABLE POSTGRESQL VERIFICATION RERUN

**Control ID:** `DARFUS-PHASE-03A-R3B-R4-R1-FRESH-DISPOSABLE-POSTGRES-VERIFICATION-RERUN`  
**Mode:** `CONTROLLED_FRESH_DISPOSABLE_POSTGRES_VERIFICATION_ONLY`  
**Official DB:** `darfus_erp` — read-only  
**Previous Disposable:** `darfus_first_run_r3b_20260818_104917` — preserved  
**New Disposable:** `darfus_first_run_r4r1_20260818_143710`

## 1. Executive Summary

تم تنفيذ verification rerun على Disposable PostgreSQL جديدة فقط. لم يتم تعديل source أو tests أو migrations في R4-R1، ولم يتم تشغيل Browser أو Build أو R5 أو إعادة تشغيل الـmain runtime.

النتيجة الكاملة PASS:

- New DB identity صحيح وmigration count `83`.
- True zero baseline قبل First Run: PASS.
- Corrected PostgreSQL integration test: exit code `0`, `1/1 PASS`.
- V1 foundation: `502/39/5/20/0`.
- V2 delta: `157`.
- Final: `659/39/5/20/0`, Bootstrap V2 `READY`.
- Rollback، concurrency، idempotency/replay، conflicting replay، وcategory assertions: PASS.
- Official DB unchanged، writes `0`.

## 2. Preconditions

تمت قراءة التقريرين المطلوبين كاملين:

| Report | Result |
|---|---|
| `DARFUS_PHASE_03A_R3B_R3_SETUP_BOOTSTRAP_409_ROOT_CAUSE_FORENSIC_REPORT.md` | Complete, 27,689 chars / 481 lines |
| `DARFUS_PHASE_03A_R3B_R4_MINIMUM_SAFE_FRESH_INSTALL_V1_V2_FIRST_RUN_FOUNDATION_FIX_REPORT.md` | Complete, 17,159 chars / 405 lines |

R4 findings matched: source fix implemented، V1 boundary داخل `runBootstrap()` transaction، focused tests `17/17`، final counts `659/39/5/20/0`، rollback/replay/partial fail-closed PASS، والـR4 gate السابق محجوب فقط لإعادة PostgreSQL fresh.

## 3. R4 Verification Block Recap

R4-R1 نفذ verification فقط. لم يُعد فتح business design ولم يُجرِ source fix جديدًا. الهدف كان إغلاق verification gate بعد تصحيح assertion فقط.

## 4. Official Backup Reverification

```text
FILE = backups/official/darfus_erp_POST_R2_FULL_20260818_095351.dump
SIZE = 646071 bytes
SHA256 = 844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1
BACKUP_SHA256_MATCH = YES
PG_RESTORE_LIST = PASS
```

`pg_restore -l` استخدم read-only bind mount داخل disposable container؛ لم يحدث restore لأي قاعدة.

## 5. Official DB Baseline Before

الـread-only baseline قبل إنشاء الـDB الجديدة:

| Entity | Actual |
|---|---:|
| Database | `darfus_erp` |
| SequelizeMeta | 83 |
| Companies / Branches / Users | 1 / 1 / 1 |
| Profile / Pearl | 659 / 39 |
| Barcode inventory / item | 5 / 20 |
| Barcode sequences | 0 |
| Inventory bootstrap state | 1, version 2, READY |
| Audit logs | 23 |
| Suppliers / Locations | 0 / 0 |
| Purchase orders / Assets / Movements | 0 / 0 / 0 |
| Payments / Journal entries / Journal lines | 0 / 0 / 0 |
| Customers | 0 |

## 6. Previous Disposable Preservation

`darfus_first_run_r3b_20260818_104917` لم تُمس. بعد R4-R1 ظلت:

```text
SequelizeMeta=83
companies=1
profile=659
pearl=39
barcode_inventory=5
barcode_item=20
barcode_sequences=0
bootstrap_state=READY v2
business transaction rows=0
```

## 7. New Disposable Creation

تم إنشاء قاعدة واحدة جديدة فقط:

```text
NEW_DISPOSABLE_DB = darfus_first_run_r4r1_20260818_143710
```

وهي ليست `darfus_erp` وليست الـDisposable السابقة.

## 8. New Disposable Identity

قبل migration:

```text
current_database = darfus_first_run_r4r1_20260818_143710
current_user = postgres
PostgreSQL = 16.15
NEW_DISPOSABLE_DB_IDENTITY = PASS
```

## 9. Migration Result

تم تشغيل migrations الحالية فقط على القاعدة الجديدة، باستخدام environment process-local دون تعديل `.env`:

```text
Push-Location backend
npm run db:migrate
Pop-Location
```

النتيجة:

```text
migration exit = 0
SequelizeMeta = 83
MIGRATIONS = PASS
```

لم تُطبق migration على `darfus_erp`.

## 10. True Zero Baseline Proof

بعد migration وقبل First Run، القراءة كانت:

```text
companies = 0
branches = 0
users = 0
profile_master_data = 0
pearl_size_master_data = 0
barcode_inventory_codes = 0
barcode_item_codes = 0
barcode_sequences = 0
inventory_master_data_bootstrap_states = 0
first_run_setup_states = 0
purchase_orders = 0
assets = 0
inventory_asset_movements = 0
payments = 0
journal_entries = 0
journal_lines = 0
suppliers = 0
inventory_locations = 0
customers = 0
```

```text
TRUE_ZERO_BASELINE = PASS
```

## 11. Corrected Assertion Presence

`tests/first-run-postgres.integration.test.cjs` كان يحتوي قبل التشغيل على assertion النهائي المصحح الذي يطابق V1+V2 category totals، بما فيها `DIAMOND_CLARITY: 11` و`CERTIFICATE_AUTHORITY: 16`.

```text
CORRECTED_ASSERTION_PRESENT = YES
TEST_CODE_CHANGED_THIS_CONTROL = NO
```

## 12. R4 Source Fix Presence

المصدر الحالي يحتوي `initializeV1Foundation()` داخل `runBootstrap()`، مع semantics مثبتة:

- zero baseline → canonical V1 creation;
- exact V1 → keep and verify;
- partial/conflicting → `INVENTORY_MASTER_DATA_BASELINE_DRIFT` fail closed;
- existing V2 READY → existing replay branch before V1 initialization.

```text
R4_SOURCE_FIX_PRESENT = YES
SOURCE_CODE_CHANGED_THIS_CONTROL = NO
```

## 13. PostgreSQL Integration Command

تم تشغيل الاختبار مرة واحدة فقط على الـNew Disposable:

```text
DB_NAME=darfus_first_run_r4r1_20260818_143710
FIRST_RUN_PG_INTEGRATION_DB=darfus_first_run_r4r1_20260818_143710
node --test tests/first-run-postgres.integration.test.cjs
```

لا توجد قيم secrets في التقرير.

## 14. PostgreSQL Integration Result

```text
PROCESS_EXIT_CODE = 0
TEST_RESULT = PASS
tests = 1
passed = 1
failed = 0
```

The existing PostgreSQL test covered rollback, advisory-lock concurrency, winner completion, replay, changed-body conflicting replay, final state, exact category assertions, and lock cleanup. ظهر تحذير `pg@9.0` deprecation فقط، ولم يؤثر على النتيجة.

## 15. V1 Foundation Result

The successful run proved:

```text
V1 profile = 502
V1 pearl = 39
V1 barcode inventory = 5
V1 barcode item = 20
V1 barcode sequences = 0
```

V1 was created inside the same First-Run transaction and then verified before V2.

## 16. V2 Final Result

Read-only final state:

```text
V2 delta = 157
profile_master_data = 659
pearl_size_master_data = 39
barcode_inventory_codes = 5
barcode_item_codes = 20
barcode_sequences = 0
dataset = INVENTORY_REFERENCE_MASTER_DATA
version = 2
state = READY
manifest_hash = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
BOOTSTRAP_V2_READY = PASS
```

## 17. Canonical Category Assertions

The corrected integration assertion and final read-only query passed:

| Category | Count |
|---|---:|
| `CERTIFICATE_AUTHORITY` | 16 |
| `DIAMOND_TONE` | 14 |
| `DIAMOND_TONE_LEVEL` | 9 |
| `DIAMOND_SATURATION` | 10 |
| `DIAMOND_POSITION` | 7 |
| `DIAMOND_SETTING` | 47 |
| `GEMSTONE_POSITION` | 7 |
| `GEMSTONE_SETTING` | 47 |
| `GEMSTONE_TREATMENT` | 0 |

Additional checks:

```text
Gübelin = PRESENT, canonical_value = gübelin
Gubelin canonical = ABSENT
WT = ABSENT
WCH = ABSENT
ERR = ABSENT
NLC = ABSENT
CANONICAL_CATEGORY_ASSERTIONS = PASS
```

## 18. Barcode Safety

```text
barcode_sequences = 0
assets = 0
physical barcode allocations = 0
```

The run inserted taxonomy rows only. No Asset or physical barcode was created.

## 19. Rollback Proof

The existing integration test injected failure through its audit dependency after the First-Run work. It verified zero Company/User/Branch, zero V1 rows, zero V2 rows, zero bootstrap marker, and `SETUP_REQUIRED` after rollback.

```text
ROLLBACK_ATOMICITY = PASS
```

## 20. Idempotency/Replay Proof

The same test proved:

- concurrent first-run requests have one winner;
- successful replay returns the existing result;
- changed body with the same key is rejected;
- no duplicate master data is created;
- `barcode_sequences` remains zero;
- READY state does not regress.

```text
V2_READY_REPLAY_IDEMPOTENCY = PASS
```

## 21. Business Transaction Safety

Final new-DB counts:

```text
suppliers = 0
inventory_locations = 0
purchase_orders = 0
assets = 0
inventory_asset_movements = 0
payments = 0
journal_entries = 0
journal_lines = 0
customers = 0
UNAUTHORIZED_BUSINESS_TRANSACTIONS = 0
```

Roles/accounts/system-account roles/branch financial mappings are First-Run foundation rows, not business transactions. No supplier, location, purchase, inventory, POS, payment, customer, or journal business record was created.

## 22. Official DB Baseline After

Read-only after-state remained:

```text
darfus_erp
SequelizeMeta=83
companies=1 branches=1 users=1
profile=659 pearl=39 barcode_inventory=5 barcode_item=20 sequences=0
inventory_bootstrap_states=1 READY v2
audit_logs=23
suppliers=0 locations=0 purchase_orders=0 assets=0 movements=0
payments=0 journal_entries=0 journal_lines=0 customers=0
```

## 23. Official DB Reconciliation

| Area | Before | After | Result |
|---|---:|---:|---|
| Companies / Branches / Users | 1 / 1 / 1 | 1 / 1 / 1 | unchanged |
| Profile / Pearl | 659 / 39 | 659 / 39 | unchanged |
| Barcode inventory / item | 5 / 20 | 5 / 20 | unchanged |
| Barcode sequences | 0 | 0 | unchanged |
| Bootstrap state | 1 READY v2 | 1 READY v2 | unchanged |
| Audit logs | 23 | 23 | unchanged |
| Suppliers / Locations | 0 / 0 | 0 / 0 | unchanged |
| Purchase / Assets / Movements | 0 / 0 / 0 | 0 / 0 / 0 | unchanged |
| Payments / Journals / Lines | 0 / 0 / 0 | 0 / 0 / 0 | unchanged |
| Customers | 0 | 0 | unchanged |

```text
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
```

## 24. Main Runtime Protection

No `localhost:3000` or `localhost:8000` restart, rebuild, repoint, or replacement occurred. No `8121`/`3301` Browser flow was started.

```text
MAIN_RUNTIME_RESTARTED = NO
BUILD_RUN = NO
BROWSER_ACCEPTANCE = NOT_RUN
```

## 25. Source/Test/Migration Freeze

R4-R1 made no source, test, assertion, migration, configuration, or environment edits. The only intentional repository write in this control is this report.

```text
SOURCE_CODE_CHANGED_THIS_CONTROL = NO
TEST_CODE_CHANGED_THIS_CONTROL = NO
MIGRATIONS_CREATED_THIS_CONTROL = 0
```

## 26. Git Safety

No `reset`, `clean`, `restore`, overwrite checkout, stash, add, commit, push, `AGENTS.md` edit, or `next-env.d.ts` edit was performed. Existing dirty worktree was preserved.

At report creation, the pre-existing worktree remained on:

```text
branch = main
HEAD = 1657b0e9ba580faef69be48f04637835c201b521
tracked modified = 89
untracked = 737 before this report
stash count = 11
```

## 27. Disposable Cleanup Status

The new Disposable DB is intentionally preserved:

```text
NEW_DISPOSABLE_DB_CLEANUP = DEFERRED_OWNER_DECISION
PREVIOUS_DISPOSABLE_CLEANUP = DEFERRED_OWNER_DECISION
```

Neither database was dropped, reset, cleaned, or reseeded. The new DB is populated `READY`; it is not assumed to be suitable for R5 true-fresh Browser proof.

## 28. R4 Final Gate

All R4-R1 verification criteria passed:

```text
NEW_DISPOSABLE_CREATED = YES
NEW_DISPOSABLE_IDENTITY = PASS
MIGRATIONS = PASS
TRUE_ZERO_BASELINE = PASS
CORRECTED_ASSERTION_PRESENT = YES
R4_SOURCE_FIX_PRESENT = YES
POSTGRES_INTEGRATION_EXIT_CODE = 0
POSTGRES_INTEGRATION_TEST = PASS
V1 = 502 / 39 / 5 / 20 / seq 0
FINAL = 659 / 39 / 5 / 20 / seq 0
BOOTSTRAP_V2_READY = PASS
CANONICAL_CATEGORY_ASSERTIONS = PASS
PARTIAL_BASELINE_FAIL_CLOSED = PASS
ROLLBACK_ATOMICITY = PASS
V2_READY_REPLAY_IDEMPOTENCY = PASS
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
MAIN_RUNTIME_RESTARTED = NO
SOURCE_CODE_CHANGED_THIS_CONTROL = NO
TEST_CODE_CHANGED_THIS_CONTROL = NO
MIGRATIONS_CREATED_THIS_CONTROL = 0
BUILD_RUN = NO
```

```text
GATE = PASS_PHASE_03A_R3B_R4_FRESH_DISPOSABLE_POSTGRES_VERIFICATION
R4_FINAL_STATUS = PASS
```

This closes R4 verification only. `PHASE_03A_FINAL_CLOSED` remains `NO`.

## 29. R5 Readiness

The next separately approved control is:

```text
R3B-R5_FINAL_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE
```

R5 must use a true fresh `SETUP_REQUIRED` Disposable target. The populated R4-R1 DB must not be assumed reusable for that purpose. R5 was not started automatically.

## 30. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3B-R4-R1-FRESH-DISPOSABLE-POSTGRES-VERIFICATION-RERUN
PHASE = 03A-R3B-R4-R1
MODE = CONTROLLED_FRESH_DISPOSABLE_POSTGRES_VERIFICATION_ONLY
OFFICIAL_DB = darfus_erp
PREVIOUS_DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
NEW_DISPOSABLE_DB = darfus_first_run_r4r1_20260818_143710
NEW_DISPOSABLE_DB_IDENTITY = PASS
MIGRATION_COUNT = 83
TRUE_ZERO_BASELINE = PASS
CORRECTED_ASSERTION_PRESENT = YES
R4_SOURCE_FIX_PRESENT = YES
POSTGRES_INTEGRATION_COMMAND = DB_NAME=<NEW_DISPOSABLE_DB> FIRST_RUN_PG_INTEGRATION_DB=<NEW_DISPOSABLE_DB> node --test tests/first-run-postgres.integration.test.cjs
POSTGRES_INTEGRATION_EXIT_CODE = 0
POSTGRES_INTEGRATION_TEST = PASS
V1_PROFILE = 502
V1_PEARL = 39
V1_BARCODE_INVENTORY = 5
V1_BARCODE_ITEM = 20
V1_BARCODE_SEQUENCE = 0
FINAL_PROFILE = 659
FINAL_PEARL = 39
FINAL_BARCODE_INVENTORY = 5
FINAL_BARCODE_ITEM = 20
FINAL_BARCODE_SEQUENCE = 0
BOOTSTRAP_VERSION = 2
BOOTSTRAP_STATE = READY
BOOTSTRAP_MANIFEST_HASH = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
CANONICAL_CATEGORY_ASSERTIONS = PASS
ROLLBACK_ATOMICITY = PASS
V2_READY_REPLAY_IDEMPOTENCY = PASS
UNAUTHORIZED_BUSINESS_TRANSACTIONS = 0
OFFICIAL_DB_MUTATIONS_THIS_CONTROL = 0
MAIN_RUNTIME_RESTARTED = NO
SOURCE_CODE_CHANGED_THIS_CONTROL = NO
TEST_CODE_CHANGED_THIS_CONTROL = NO
MIGRATIONS_CREATED_THIS_CONTROL = 0
BUILD_RUN = NO
NEW_DISPOSABLE_DB_CLEANUP = DEFERRED_OWNER_DECISION
PREVIOUS_DISPOSABLE_CLEANUP = DEFERRED_OWNER_DECISION
R4_FINAL_STATUS = PASS
PHASE_03A_FINAL_CLOSED = NO
GATE = PASS_PHASE_03A_R3B_R4_FRESH_DISPOSABLE_POSTGRES_VERIFICATION
NEXT_RECOMMENDED_STEP = R3B-R5_FINAL_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE AFTER OWNER REVIEW, USING A TRUE FRESH SETUP_REQUIRED DISPOSABLE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.** Do not start R3B-R5, Browser acceptance, Phase 03A closure, Phase 03B, Supplier/Location/VAT, GBW/GBP, Diamond/Gem/Pearl, cleanup, commit, or push automatically.

