# DARFUS Client C2C1R — Official DB Migration Provenance

Control: `DARFUS-CLIENT-C2C1R-OFFICIAL-DB-MIGRATION-PROVENANCE-01`  
Mode: `READ_ONLY_FORENSIC_PROVENANCE`  
Target: `darfus_erp`

## Scope

This is a read-only reconstruction of what happened to the official database after the C2B disposable rehearsal report. No migration, rollback, DDL, DML, seed, service restart, or Git mutation was performed by C2C1R.

## Fast triage result

| Check | Observed result | Evidence |
|---|---|---|
| `SELECT current_database()` | `darfus_erp` | read-only psql query in `darfus-postgres` |
| C2B row in `SequelizeMeta` | present | exact name `20260824010000-create-asset-revision-schema.js` |
| `asset_revisions` | present, 0 rows | `information_schema` and `COUNT(*)` |
| `asset_revision_changes` | present, 0 rows | `information_schema` and `COUNT(*)` |
| revision immutability triggers | present | four UPDATE/DELETE trigger entries, two triggers/tables |
| total `SequelizeMeta` | 92 | read-only count |

`MIGRATION_APPLIED_TO_OFFICIAL_DB = YES` is proven by the Meta row, the objects, and the backend startup log naming the migration as migrated.

## Current official baseline

The following was captured read-only after the forensic check:

| Entity | Rows |
|---|---:|
| companies | 1 |
| branches | 2 |
| users | 1 |
| employees | 0 |
| permissions | 150 |
| assets | 18 |
| asset_barcode_history | 18 |
| asset_rfid_assignments | 2 |
| asset_events | 65 |
| inventory_asset_movements | 62 |
| journal_entries | 25 |
| journal_lines | 67 |
| invoice_items | 1 |
| invoice_item_asset_links | 1 |
| asset_purchase_cost_revisions | 18 |
| asset_current_valuations | 14 |
| asset_revisions | 0 |
| asset_revision_changes | 0 |
| `SequelizeMeta` | 92 |

The previous C2B report recorded `darfus_erp` at Meta 91, Assets 18, Barcode 18, RFID 2, Events 65, Movements 62, Journals 25, Permissions 150, and no revision tables. The current business counts agree with those recorded baselines. The C2B migration source has no DML against any existing business table, so the observed schema advance is explained without an unexplained business-data delta.

## Exact migration object proof

Source: `backend/migrations/20260824010000-create-asset-revision-schema.js`.

The `up` function creates only:

1. `asset_revisions` with Asset/company/branch/User/Employee foreign keys, reason/source fields, operation timestamp, and idempotency scope/key/hash.
2. `asset_revision_changes` with revision FK, field key, JSONB old/new snapshots, value/authority types, and optional dedicated-operation reference.
3. Primary-key and named indexes, including unique `(asset_id, revision_no)` and unique `(company_id, idempotency_scope, idempotency_key)`.
4. Checks for positive revision numbers, non-empty scope/key/source operation, field-key format, supported value type, supported authority type, and old/new value presence.
5. Function `asset_revision_history_immutable`.
6. Triggers `asset_revisions_immutable_trg` and `asset_revision_changes_immutable_trg`, rejecting UPDATE/DELETE.

It does not alter an existing table, update an existing row, insert a business row, backfill history, add a permission, or change an existing business enum. The entire `up` path is wrapped in a transaction. The `down` path is destructive to the two new tables/function but refuses to run when either revision table is non-empty; it remains forbidden on the official database under current policy.

```text
MIGRATION_IS_ADDITIVE_ONLY = YES
MIGRATION_BACKFILLS_BUSINESS_DATA = NO
MIGRATION_INSERTS_BUSINESS_ROWS = NO
MIGRATION_ALTERS_EXISTING_BUSINESS_TABLES = NO
MIGRATION_DOWN_IS_DESTRUCTIVE = YES_FOR_EMPTY_SCHEMA_ONLY
```

## Provenance timeline

### Latest prior absence evidence

The C2B report states that its read-only official check returned Meta 91, no revision tables, and zero official schema/business delta. The report file’s last-write time is `2026-08-26T00:48:53.2947063+03:00`; the report does not embed the SQL observation timestamp, so that file time is not presented as an exact database timestamp.

```text
LATEST_PROVEN_OFFICIAL_SCHEMA_ABSENCE = C2B report content: Meta 91 + revision tables 0; exact SQL timestamp UNKNOWN
```

### Proven application

The running `darfus-backend` container logged:

```text
2026-08-26T04:33:09.582884800Z  > ... db:migrate
2026-08-26T04:33:36.970800627Z  == 20260824010000-create-asset-revision-schema: migrating =======
2026-08-26T04:33:37.441588416Z  == 20260824010000-create-asset-revision-schema: migrated (0.470s)
```

The container then started `node src/server.js` and connected to PostgreSQL. This is the earliest direct official-schema-presence evidence found in the available logs.

```text
EARLIEST_PROVEN_OFFICIAL_SCHEMA_PRESENCE = 2026-08-26T04:33:36.970800627Z, backend container migration log
```

The narrowest supported window is therefore: after the C2B report’s Meta-91/no-table observation and before/at the backend log’s migration start; the exact initiating wall-clock event before the first retry is not available.

## Who/what applied it

| Question | Evidence-backed answer |
|---|---|
| Executing process | `darfus-backend` container’s `npm run db:migrate` / `sequelize db:migrate` process |
| Trigger | Compose backend command during container startup/restart |
| Human initiator | not proven by available local evidence; PowerShell history shows backend Compose operations but does not identify a timestamped C2B command |
| Target | `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=darfus_erp` in the running container |
| Migration | exact C2B filename above |
| Why target was official | Compose and development config default `DB_NAME` to `darfus_erp`; no disposable target is required by the generic startup command |

`DIRECT_COMMAND_EVIDENCE_FOUND = YES` for the executing container command. `HUMAN_DIRECT_MIGRATION_COMMAND_EVIDENCE = NO`.

## Damage assessment

The migration log, source inspection, current counts, and zero revision rows support:

| Item | Result | Qualification |
|---|---|---|
| revision business rows | 0 | direct count |
| fake revision history | 0 | direct count; no backfill in source |
| existing Asset rows changed | NO | migration contains no Asset DML; no row snapshot from exact interval is available |
| existing barcode rows changed | NO | migration contains no barcode DML |
| existing RFID rows changed | NO | migration contains no RFID DML |
| existing movement rows changed | NO | migration contains no movement DML |
| existing journal rows changed | NO | migration contains no accounting DML |
| permission count changed | NO | migration contains no permission operation; current count is 150 |
| existing schema meaning changed | NO | no `ALTER` to an existing business table; only additive objects |
| unexplained business-data delta | 0 | no business table is written by this migration |
| unexplained schema delta | 0 | observed delta is exactly the C2B schema and Meta row |

## Classification

```text
MIGRATION_APPLIED_TO_OFFICIAL_DB = YES
PROVENANCE_CONFIDENCE = PROVEN
ROOT_CAUSE_CLASS = AUTO_STARTUP_MIGRATION
ROOT_CAUSE = docker-compose backend startup executed npm run db:migrate against DB_NAME=darfus_erp; the log records the exact C2B migration and timestamp.
WHAT_ALLOWED_IT_TO_HAPPEN = generic startup command has no explicit official-DB refusal/Owner-approval guard, while development defaults and Compose default the target to darfus_erp.
```

The classification does not prove which person initiated the container restart. It does prove the process, target, migration, and execution time.

## Decision on rollback

No rollback is executed or recommended in this control. The schema is additive and empty, and the C2B `down` is destructive even though it protects only the empty case. Removing the Meta row or dropping the tables would create a second uncontrolled schema change and could diverge from the current source/runtime.

```text
ROLLBACK_RECOMMENDATION = KEEP_PENDING_OWNER
```

## C2C2 readiness

The data and provenance preconditions are satisfied for a future Owner-approved C2C2 implementation: revision schema exists, both revision tables are empty, business delta is zero, the only schema delta is explained by C2B, the root cause is proven, and the prevention gate is defined. This is eligibility only; it is not authorization to implement C2C2.

```text
C2C2_READINESS = READY_PENDING_OWNER_APPROVAL
```

