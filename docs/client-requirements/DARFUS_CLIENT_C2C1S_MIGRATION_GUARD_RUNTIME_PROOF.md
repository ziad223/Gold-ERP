# DARFUS Client C2C1S — Migration Guard Runtime Proof

Control: `DARFUS-CLIENT-C2C1S-MIGRATION-STARTUP-SAFETY-GUARD-01`  
Proof mode: local read-only official checks plus disposable-only migration

## 1. Focused static proof

Test command:

```text
node --test backend/tests/c2c1s-migration-startup-safety.test.cjs
```

Result: `7 passed, 0 failed`. The test proves the Compose startup command is `npm start`, the package migration commands point to the same wrapper, explicit mode/target is required, exact official approval is required, actual target mismatch is rejected, protected refusal occurs before migration-runner construction, and the approval flag is not in Compose defaults.

Syntax proof:

```text
node --check backend/scripts/migrate-safe.js = PASS
node --check backend/tests/c2c1s-migration-startup-safety.test.cjs = PASS
```

## 2. Disposable migration proof

| Item | Result |
|---|---|
| disposable database | `darfus_c2c1s_migration_guard_01` |
| existence check before creation | absent |
| target mode | `disposable` |
| connection target | `127.0.0.1:5433`, explicit DB name |
| actual `current_database()` | `darfus_c2c1s_migration_guard_01` |
| source migration count | 92 |
| pending before run | 92 |
| safe wrapper execution | 92 exact migrations |
| `SequelizeMeta` after | 92 |
| revision headers after | 0 |
| revision changes after | 0 |
| C2B indexes after | 8 |

The database is a new disposable target and is retained for review. It was not confused with `darfus_erp`, and no official DB migration was used for this proof.

An initial harness invocation stopped before migration because its caller used `backend/backend/migrations`; it created the disposable database but did not construct/run the migration command. The corrected invocation used `backend/migrations` and passed. This was a contained harness path error, not a product or database-integrity failure.

## 3. Protected official refusal proof

The canonical safe command was invoked with actual target `darfus_erp`, `DARFUS_MIGRATION_TARGET_MODE=disposable`, and no official approval flag.

Observed safe output:

```text
MIGRATION_TARGET_DATABASE=darfus_erp
OFFICIAL_DB_MIGRATION_NOT_AUTHORIZED
exit=1
```

The injected static test also verified the refusal occurs before `makeMigrator` is called. Therefore:

```text
PROTECTED_DB_REFUSAL = PASS
MIGRATION_RUNNER_STARTED_ON_PROTECTED_DB = NO
```

The refusal path issued only connection/authentication and `SELECT current_database()`; it did not invoke Sequelize migration discovery or execution.

## 4. Normal backend startup proof

The backend container was recreated through the normal Compose path after changing only the startup command. PostgreSQL and Redis were not restarted.

| Probe | Result |
|---|---|
| container | `darfus-backend` running |
| startup command | `npm start` → `node src/server.js` |
| `/api/v1/health` | HTTP 200, UP |
| `/api/v1/health/db` | HTTP 200, UP |
| `/api/v1/health/redis` | HTTP 200, UP |
| `/api/v1/health/gold` | HTTP 200, UP |
| current startup log `db:migrate` matches | 0 |
| current startup log migration execution | 0 |

Current startup log includes `Redis socket connected`, `Database connection established successfully`, and `Listening on Port: http://localhost:8000`; it contains no `db:migrate`, `migrating`, or `migrated` entry.

## 5. Official zero-delta proof

Read-only pre-start and post-start checks agree:

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| `SequelizeMeta` | 92 | 92 | 0 |
| `asset_revisions` | 0 | 0 | 0 |
| `asset_revision_changes` | 0 | 0 | 0 |
| `assets` | 18 | 18 | 0 |
| `asset_barcode_history` | 18 | 18 | 0 |
| `asset_rfid_assignments` | 2 | 2 | 0 |
| `asset_events` | 65 | 65 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |
| `permissions` | 150 | 150 | 0 |

`current_database()` remained `darfus_erp`. No official migration, business request, seed, rollback, or direct business DML was performed by C2C1S.

## 6. No rollback

```text
C2B_SCHEMA_ON_darfus_erp = KEEP
OFFICIAL_DB_MIGRATION_EXECUTIONS = 0
OFFICIAL_DB_BUSINESS_WRITES = 0
```

