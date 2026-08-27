# DARFUS Client C2C1R — Migration Target Prevention Gate

Control: `DARFUS-CLIENT-C2C1R-OFFICIAL-DB-MIGRATION-PROVENANCE-01`  
Status: design/documentation only; not implemented by C2C1R.

## Frozen prevention rule

```text
PREVENTION_GATE = OFFICIAL_DB_EXPLICIT_MIGRATION_AUTHORIZATION_REQUIRED
```

No future schema-changing stage may invoke a migration until it has an explicit target mode and a target proof. The default for ordinary rehearsal, acceptance, and local runtime is disposable-only.

## Required preflight sequence

1. Print the intended database name and target mode in a non-secret manifest.
2. Open the exact connection that will be used by the migration runner.
3. Execute `SELECT current_database()` on that same connection.
4. Require exact equality between the actual database and the explicitly authorized target.
5. If the actual database is `darfus_erp`, require a separately named Owner-approved promotion gate with the exact database, migration list, start/end baselines, and fresh backup proof. Otherwise abort before constructing the migrator.
6. Refuse any URL/`DB_*` ambiguity or missing target identity.
7. Record the applied migration list and relevant integrity counts before migration.
8. Verify the pending set equals the approved exact list, in order.
9. Execute only that list.
10. Record the applied migration list and integrity counts after migration.
11. Re-query `SELECT current_database()` on the same connection and retain the target proof.
12. Stop if any unexpected schema, business, permission, Asset, barcode, movement, journal, or active-write delta appears.

## Recommended fail-closed decision logic

Design only; this pseudocode is not a source change in C2C1R:

```text
if actualDatabase != explicitlyAuthorizedDatabase:
    abort("MIGRATION_ACTUAL_TARGET_MISMATCH")

if actualDatabase == "darfus_erp" and OFFICIAL_MIGRATION_APPROVED != "YES":
    abort("OFFICIAL_DB_MIGRATION_NOT_AUTHORIZED")

if targetMode == "disposable" and actualDatabase == "darfus_erp":
    abort("DISPOSABLE_TARGET_RESOLVED_TO_OFFICIAL")

if pendingMigrations != approvedMigrationList:
    abort("UNEXPECTED_MIGRATION_SET")

runOnly(approvedMigrationList)
```

The production implementation must not rely on a shell variable that can be lost across a subprocess, a `.env` default, a container name, a port, or a human label. The actual database query is mandatory.

## Current safety coverage

| Path | Current behavior | Coverage |
|---|---|---|
| `backend/scripts/acceptance-migration-guard.js` | requires development config, resolves actual DB, rejects anything other than the historical acceptance DB, checks actual DB before run | guarded for that dedicated acceptance path |
| `backend/scripts/persistent-promotion-migration-guard.js` | requires explicit `--target` mode, checks persistent/rehearsal target, uses dry-run default, checks actual DB and expected migration set | guarded for that dedicated promotion path |
| `backend/package.json` `db:migrate` | plain `sequelize db:migrate` | unguarded generic runner |
| `docker-compose.yml` backend | `sh -c "npm run db:migrate && npm start"` | unguarded automatic migration at startup |
| `backend/src/config/database-env.js` | development default database is `darfus_erp`; explicit env values are accepted | target identity is resolvable, but not an authorization guard |

```text
MIGRATION_TARGET_GUARD_EXISTS = PARTIAL
BACKEND_STARTUP_AUTO_MIGRATES = YES
DEFAULT_TARGET_CAN_HIT_OFFICIAL = YES
CONTAINER_START_CAN_APPLY_MIGRATIONS = YES
```

The dedicated guards did not protect the Compose startup path that produced the C2C1R event. This is the exact control gap; it is not proof that the disposable C2B commands lost their override.

## Disposable override assessment

The C2B report records exact `current_database()` checks for `darfus_c2b_revision_schema_01` and `darfus_c2b_revision_fresh_01`, and their migration results are consistent with those targets. The available PowerShell history does not retain a timestamped command containing those names, and no complete environment manifest for every subprocess is available.

```text
ENV_OVERRIDE_LEAK_RISK = UNKNOWN
```

This means no specific disposable override loss is proven or disproven. Separately, the structural risk that an unqualified migration command defaults to `darfus_erp` is proven and is the cause of the observed event.

## Permanent test contract

Every schema-changing stage must add or run a guard test that proves:

- missing target is rejected;
- `darfus_erp` is rejected without explicit promotion authorization;
- a disposable target with the wrong actual `current_database()` is rejected;
- a URL/`DB_*` target conflict is rejected;
- a pending migration outside the approved list is rejected;
- dry-run performs zero migrator calls;
- the same verified connection is passed to the migrator without reloading a different environment;
- after migration, `current_database()` and the migration list match the manifest.

The test must assert semantic target safety, not only source strings. It must not run against or mutate the official DB.

## New lesson record

```text
NEW_LESSON_ID = OFFICIAL-DB-MIGRATION-TARGET-001
ROOT_CAUSE = Automatic backend startup migration used an unguarded generic runner with a development default of darfus_erp.
WHAT_ALLOWED_IT_TO_HAPPEN = Compose had no disposable-only default and no explicit official-DB authorization check before npm run db:migrate.
MINIMUM_FIX = Route every schema-changing command through an actual-database identity check and explicit target authorization; remove the unguarded startup path from ordinary acceptance/runtime.
PREVENTION_GATE = OFFICIAL_DB_EXPLICIT_MIGRATION_AUTHORIZATION_REQUIRED
TEST_TO_PREVENT_REGRESSION = verified target mismatch/official refusal/approved-list/dry-run/after-proof guard suite
MODULES_AFFECTED = ALL_SCHEMA_CHANGING_STAGES
```

The minimum fix above is a future implementation proposal only. C2C1R does not edit Compose, scripts, configuration, or source.

