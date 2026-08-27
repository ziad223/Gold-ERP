# DARFUS ERP — C2C1S Migration Startup Safety Guard Report

تم تنفيذ Minimum Safe Fix لإيقاف Migration التلقائي عند تشغيل backend. تم تغيير startup إلى `npm start` فقط، وإضافة حارس مركزي يثبت `SELECT current_database()` قبل إنشاء migration runner، ويرفض `darfus_erp` بدون موافقة صريحة. نجح الاختبار المركز، ونجح تشغيل 92 Migration على Disposable DB، ونجح رفض Official DB. لا توجد كتابة على `darfus_erp` في هذا الـControl.

## 1. Executive Summary

| Item | Result |
|---|---|
| root cause | `AUTO_STARTUP_MIGRATION_TO_PROTECTED_DEFAULT_DB` |
| previous path | `sh -c "npm run db:migrate && npm start"` |
| final startup path | `npm start` |
| safe migration implementation | `backend/scripts/migrate-safe.js` |
| protected DB | `darfus_erp` |
| official default approval | deny |
| C2B schema | kept; no rollback |
| official DB migration in C2C1S | 0 |
| official business writes in C2C1S | 0 |

## 2. Pre-change baseline

Before the fix, `docker-compose.yml` set `DB_NAME=${DB_NAME:-darfus_erp}` and ran `npm run db:migrate && npm start`. `backend/package.json` defined `db:migrate` as plain `sequelize db:migrate`. C2C1R logs proved this path applied `20260824010000-create-asset-revision-schema.js` to the official DB during backend startup.

The C2C1S pre-change official read-only baseline was:

```text
database=darfus_erp
SequelizeMeta=92
asset_revisions=0
asset_revision_changes=0
assets=18
asset_barcode_history=18
asset_rfid_assignments=2
asset_events=65
inventory_asset_movements=62
journal_entries=25
permissions=150
```

## 3. Change boundary and files changed

| File | Change | Status |
|---|---|---|
| `docker-compose.yml` | replace automatic `db:migrate && npm start` with `npm start` | intentional |
| `backend/package.json` | route `db:migrate` and add `db:migrate:safe` to the same guard | intentional |
| `backend/scripts/migrate-safe.js` | new canonical actual-target/approval/exact-list guard | intentional |
| `backend/tests/c2c1s-migration-startup-safety.test.cjs` | focused static and guard-order tests | intentional |
| existing migration files | unchanged | forbidden scope preserved |
| business/frontend/permission files | unchanged by C2C1S | forbidden scope preserved |

The worktree had broad pre-existing user-owned drift. No cleanup/reset/restore/stash was performed. The C2B migration file remains an earlier untracked/pre-existing C2B artifact and was not changed by C2C1S.

## 4. Guard contract

```text
OFFICIAL_MIGRATION_APPROVAL_FLAG = DARFUS_OFFICIAL_MIGRATION_APPROVED
OFFICIAL_MIGRATION_APPROVAL_DEFAULT = DENY
PROTECTED_DB_NAME = darfus_erp
MIGRATION_GUARD_USES_ACTUAL_DATABASE_IDENTITY = YES
ONE_CANONICAL_SAFE_MIGRATION_ENTRYPOINT = YES
MIGRATION_GUARD_SCOPE = ALL_SCHEMA_CHANGING_STAGES
```

The safe wrapper requires `DARFUS_MIGRATION_TARGET_MODE`, an explicit database target, and the actual target query. For an official target, only exact approval `YES` allows the wrapper to continue. The flag is not in Compose defaults or normal `.env` configuration.

It also requires an explicit ordered migration list when pending migrations exist and defaults to dry-run unless `--execute` is supplied. A target mismatch, missing mode, missing target, missing approval, or unexpected pending set fails closed.

## 5. Static safety proof

```text
node --check backend/scripts/migrate-safe.js = PASS
node --check backend/tests/c2c1s-migration-startup-safety.test.cjs = PASS
node --test backend/tests/c2c1s-migration-startup-safety.test.cjs = 7 passed / 0 failed
STATIC_SAFETY_TESTS = PASS
```

The tests cover startup command removal, canonical script routing, explicit target/mode, exact approval, mismatch refusal, runner-not-started protected refusal, and absence of persistent approval in Compose.

## 6. Disposable proof

New disposable DB: `darfus_c2c1s_migration_guard_01`.

```text
DISPOSABLE_MIGRATION_GUARD = PASS
ACTUAL_DATABASE = darfus_c2c1s_migration_guard_01
PENDING_MIGRATIONS = 92
EXECUTED_MIGRATIONS = 92
SEQUELIZE_META_AFTER = 92
REVISION_HEADERS_AFTER = 0
REVISION_CHANGES_AFTER = 0
```

The first harness attempt failed before executing because of a caller path typo; the corrected safe invocation passed. No official target was involved. The disposable DB is retained and was not cleaned.

## 7. Protected DB refusal proof

With `DB_NAME=darfus_erp`, `DARFUS_MIGRATION_TARGET_MODE=disposable`, and no approval flag:

```text
MIGRATION_TARGET_DATABASE=darfus_erp
OFFICIAL_DB_MIGRATION_NOT_AUTHORIZED
exit=1
PROTECTED_DB_REFUSAL = PASS
MIGRATION_RUNNER_STARTED_ON_PROTECTED_DB = NO
```

The guard queried actual identity and stopped before creating the migrator. No Migration was applied.

## 8. Startup runtime proof

The normal backend container was recreated once after the Compose change. The result was:

```text
BACKEND_START_AUTO_MIGRATES = NO
NORMAL_STARTUP_HAS_NO_SCHEMA_MUTATION = YES
BACKEND_START_WITHOUT_MIGRATION = PASS
DB_HEALTH = HTTP 200
REDIS_HEALTH = HTTP 200
GOLD_HEALTH = HTTP 200
CURRENT_STARTUP_DB_MIGRATE_LOG_MATCHES = 0
```

## 9. Official zero-delta proof

Read-only checks before and after startup returned identical values:

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| `SequelizeMeta` | 92 | 92 | 0 |
| revision headers | 0 | 0 | 0 |
| revision changes | 0 | 0 | 0 |
| assets | 18 | 18 | 0 |
| barcode history | 18 | 18 | 0 |
| RFID assignments | 2 | 2 | 0 |
| asset events | 65 | 65 | 0 |
| movements | 62 | 62 | 0 |
| journals | 25 | 25 | 0 |
| permissions | 150 | 150 | 0 |

## 10. Prevention lesson closure

```text
NEW_LESSON_ID = OFFICIAL-DB-MIGRATION-TARGET-001
ROOT_CAUSE = automatic startup migration + protected DB as default target
MINIMUM_FIX = remove startup auto-migrate + canonical fail-closed migration guard
PREVENTION_GATE = OFFICIAL_DB_EXPLICIT_MIGRATION_AUTHORIZATION_REQUIRED
TEST_TO_PREVENT_REGRESSION = startup-no-migrate + official-refusal + disposable-success guard suite
MODULES_AFFECTED = ALL_SCHEMA_CHANGING_STAGES
LESSON_PREVENTION_IMPLEMENTED = YES
```

## 11. Risk and disposition

| Risk | Result | Disposition |
|---|---|---|
| automatic official schema mutation on restart | closed by current startup path | future stages must use safe wrapper |
| raw target text differs from actual DB | guarded by same-connection query | stable mismatch refusal |
| accidental official approval persistence | not present in Compose/normal env | exact per-process approval only |
| C2B history loss | not changed | keep existing empty additive schema |
| broad business regression | none in changed files | business modules untouched |

## 12. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C1S-MIGRATION-STARTUP-SAFETY-GUARD-01
ROOT_CAUSE = AUTO_STARTUP_MIGRATION_TO_PROTECTED_DEFAULT_DB
CURRENT_BACKEND_START_COMMAND = sh -c "npm run db:migrate && npm start"
FINAL_BACKEND_START_COMMAND = npm start
BACKEND_START_AUTO_MIGRATES = NO
PROTECTED_DB_NAME = darfus_erp
OFFICIAL_MIGRATION_APPROVAL_FLAG = DARFUS_OFFICIAL_MIGRATION_APPROVED
OFFICIAL_MIGRATION_APPROVAL_DEFAULT = DENY
MIGRATION_GUARD_USES_ACTUAL_DATABASE_IDENTITY = YES
ONE_CANONICAL_SAFE_MIGRATION_ENTRYPOINT = YES
MIGRATION_GUARD_SCOPE = ALL_SCHEMA_CHANGING_STAGES
STATIC_SAFETY_TESTS = PASS
DISPOSABLE_DB = darfus_c2c1s_migration_guard_01
DISPOSABLE_MIGRATION_GUARD = PASS
PROTECTED_DB_REFUSAL = PASS
MIGRATION_RUNNER_STARTED_ON_PROTECTED_DB = NO
BACKEND_START_WITHOUT_MIGRATION = PASS
OFFICIAL_META_DELTA = 0
OFFICIAL_REVISION_ROW_DELTA = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_BARCODE_DELTA = 0
OFFICIAL_RFID_DELTA = 0
OFFICIAL_EVENT_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
OFFICIAL_PERMISSION_DELTA = 0
C2B_SCHEMA_ON_darfus_erp = KEEP
LESSON_PREVENTION_IMPLEMENTED = YES
SOURCE_FILES_CHANGED = 3
TEST_FILES_CHANGED = 1
MIGRATIONS_CHANGED = 0
OFFICIAL_DB_WRITES = 0
P0 = 0
P1 = 0
P2 = 0
P3 = 0
GATE = PASS_CLIENT_C2C1S_MIGRATION_STARTUP_SAFETY_GUARD
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

No C2C2 implementation, new business migration, revision mutation, barcode/RFID/inventory/accounting change, rollback, or production action was performed. Owner approval is required before the next batch.

