# DARFUS ERP — C2C1R Official DB Migration Provenance Report

النتيجة المختصرة: ثبت أن Migration C2B طُبّق على `darfus_erp` تلقائيًا أثناء إقلاع حاوية backend يوم 26 أغسطس 2026. السبب التنفيذي مثبت في Compose والـlogs، وليس هناك دليل على أمر Migration بشري مباشر. الـMigration كان إضافيًا فقط، ولم ينشئ أي Revision business rows أو يغيّر صفوف الأعمال الحالية حسب مصدره والأعداد الحالية. لم تحدث أي كتابة في هذه المراجعة؛ لكن هناك فجوة سلامة حقيقية في مسار startup التلقائي يجب منعها قبل أي C2C2.

## 1. Control boundary

| Item | Result |
|---|---|
| official target | `darfus_erp` |
| mode | read-only forensic provenance |
| migrations executed by this control | 0 |
| rollback executed | 0 |
| SQL DDL/DML issued by this control | 0; only SELECT/read-only inspection |
| source/test/migration files changed by this control | 0 |
| production contacted | no |

## 2. What changed before this control

Current read-only state is:

```text
current_database() = darfus_erp
SequelizeMeta = 92
20260824010000-create-asset-revision-schema.js = present
asset_revisions = present, 0 rows
asset_revision_changes = present, 0 rows
```

The previous C2B report recorded Meta 91 and no revision tables. Its statement that the official DB was untouched is historical evidence of the earlier observation; it is contradicted by the later official backend log and current DB state, not silently rewritten.

## 3. Evidence chain

| Evidence | Observation | Interpretation |
|---|---|---|
| current DB query | `darfus_erp` | exact official target confirmed |
| Meta query | exact C2B migration row | migration recorded by Sequelize |
| schema catalog | both C2B tables, indexes, constraints, triggers | migration objects exist |
| row counts | both revision tables are 0 | no revision business history/backfill |
| Compose | `DB_NAME: ${DB_NAME:-darfus_erp}` and backend command `npm run db:migrate && npm start` | startup can target official and apply migrations |
| container env | `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=darfus_erp`, `NODE_ENV=development` | actual process target is official |
| backend log | migration started at `2026-08-26T04:33:36.970800627Z`, migrated at `04:33:37.441588416Z` | exact process and time proven |
| migration source | creates only new revision storage/guards; no backfill/DML | business impact limited to additive schema |

## 4. Provenance conclusion

```text
MIGRATION_APPLIED_TO_OFFICIAL_DB = YES
PROVENANCE_CONFIDENCE = PROVEN
ROOT_CAUSE_CLASS = AUTO_STARTUP_MIGRATION
```

The most evidence-supported path is:

```text
backend container restart/start
→ docker-compose backend command
→ npm run db:migrate
→ Sequelize development config
→ DB_NAME=darfus_erp
→ C2B migration applied
→ npm start
```

The available evidence does not identify the human who initiated the container lifecycle operation. It does identify the executing container command and target.

## 5. Why the official DB was selected

`docker-compose.yml` sets the backend environment to `DB_HOST=postgres`, `DB_PORT=5432`, and `DB_NAME=${DB_NAME:-darfus_erp}` and runs `sh -c "npm run db:migrate && npm start"`. `backend/package.json` defines `db:migrate` as plain `sequelize db:migrate`. `backend/src/config/database-env.js` also defines the development default database as `darfus_erp`. There is no mandatory disposable target or official-DB refusal in that generic path.

The dedicated acceptance/promotion guards are narrower scripts and do not wrap this Compose command. Therefore:

```text
DEFAULT_TARGET_CAN_HIT_OFFICIAL = YES
MIGRATION_TARGET_GUARD_EXISTS = PARTIAL
WHAT_ALLOWED_IT_TO_HAPPEN = unguarded automatic startup migration plus official development default
```

## 6. Migration and damage analysis

`MIGRATION_IS_ADDITIVE_ONLY = YES`. The source creates `asset_revisions`, `asset_revision_changes`, indexes, checks, one immutability function, and two immutability triggers. It does not alter existing business tables, write existing business rows, create permissions, or backfill revisions. The current catalog confirms the expected constraints/indexes/triggers. The `down` method drops the new objects only after checking that both new tables are empty; it is not a permitted rollback action here.

Current read-only counts: Companies 1, Branches 2, Users 1, Employees 0, Permissions 150, Assets 18, Barcode History 18, RFID 2, Asset Events 65, Movements 62, Journals 25, Journal Lines 67, Invoice Items 1, Invoice Asset Links 1, Cost Revisions 18, Current Valuations 14, Revisions 0, Revision Changes 0, SequelizeMeta 92.

```text
REVISION_ROWS = 0
FAKE_HISTORY = 0
UNEXPLAINED_BUSINESS_DATA_DELTA = 0
UNEXPLAINED_SCHEMA_DELTA = 0
EXISTING_SCHEMA_MEANING_CHANGED = NO
```

The zero business delta is bounded by source DML analysis and current count comparison; a historical row-by-row snapshot for the exact unapproved startup interval was not available and is not fabricated.

## 7. Time window

```text
LATEST_PROVEN_OFFICIAL_SCHEMA_ABSENCE = C2B report: Meta 91, revision tables 0; exact SQL timestamp UNKNOWN; report mtime 2026-08-26T00:48:53.2947063+03:00
EARLIEST_PROVEN_OFFICIAL_SCHEMA_PRESENCE = 2026-08-26T04:33:36.970800627Z backend startup log
```

The exact application window is bounded by those observations. PostgreSQL was not treated as preserving table creation time automatically.

## 8. Disposable/official separation

The prior C2B report states that `darfus_c2b_revision_schema_01` and `darfus_c2b_revision_fresh_01` were checked with exact `current_database()` proof and that the official DB was not targeted at that time. No durable timestamped shell record proving a lost override was found. Accordingly:

```text
ENV_OVERRIDE_LEAK_RISK = UNKNOWN
DIRECT_COMMAND_EVIDENCE_FOUND = YES (container startup command)
HUMAN_DIRECT_MIGRATION_COMMAND_EVIDENCE = NO
```

The observed official event does not require an override leak hypothesis; the Compose default path explains it directly.

## 9. Rollback decision

```text
ROLLBACK_RECOMMENDATION = KEEP_PENDING_OWNER
```

Do not drop the empty tables, run `down`, or delete the Meta row. Any rollback would be a new schema mutation requiring a separately named Owner-approved decision and a verified backup/rehearsal.

## 10. Prevention gate and lesson

```text
PREVENTION_GATE = OFFICIAL_DB_EXPLICIT_MIGRATION_AUTHORIZATION_REQUIRED
NEW_LESSON_ID = OFFICIAL-DB-MIGRATION-TARGET-001
```

Before every future migration: print intended target, query the actual database on the migration connection, fail if the actual target differs, refuse `darfus_erp` without explicit approval, verify the exact pending list, capture before/after metadata and integrity counts, and stop on any unexplained delta. This remains design-only in C2C1R.

## 11. C2C2 decision

The C2B schema is present and empty, business/schema deltas are explained, provenance is proven, and the prevention gate is defined. C2C2 may be considered only after a new explicit Owner approval and after the prevention gate is implemented or otherwise enforced for that execution path.

```text
C2C2_READINESS = READY_PENDING_OWNER_APPROVAL
```

## 12. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C1R-OFFICIAL-DB-MIGRATION-PROVENANCE-01
MODE = READ_ONLY_FORENSIC_PROVENANCE
CURRENT_DATABASE = darfus_erp
MIGRATION_META_PRESENT = YES
REVISION_SCHEMA_PRESENT = YES
REVISION_HEADER_ROWS = 0
REVISION_CHANGE_ROWS = 0
MIGRATION_IS_ADDITIVE_ONLY = YES
MIGRATION_BACKFILLS_BUSINESS_DATA = NO
BACKEND_STARTUP_AUTO_MIGRATES = YES
AUTO_MIGRATION_TRIGGER = docker-compose.yml backend command: sh -c "npm run db:migrate && npm start"
DEFAULT_TARGET_CAN_HIT_OFFICIAL = YES
DIRECT_COMMAND_EVIDENCE_FOUND = YES (backend container startup command; human shell command not proven)
CONTAINER_START_CAN_APPLY_MIGRATIONS = YES
EARLIEST_PROVEN_OFFICIAL_SCHEMA_PRESENCE = 2026-08-26T04:33:36.970800627Z backend log
LATEST_PROVEN_OFFICIAL_SCHEMA_ABSENCE = C2B report Meta 91/revision tables 0; exact SQL timestamp UNKNOWN
ENV_OVERRIDE_LEAK_RISK = UNKNOWN
MIGRATION_TARGET_GUARD_EXISTS = PARTIAL
ROOT_CAUSE_CLASS = AUTO_STARTUP_MIGRATION
ROOT_CAUSE = Compose startup ran the generic migration script with DB_NAME=darfus_erp.
WHAT_ALLOWED_IT_TO_HAPPEN = no mandatory official-DB refusal/Owner authorization in generic startup path
UNEXPLAINED_BUSINESS_DATA_DELTA = 0
UNEXPLAINED_SCHEMA_DELTA = 0
REVISION_ROWS = 0
FAKE_HISTORY = 0
ROLLBACK_RECOMMENDATION = KEEP_PENDING_OWNER
PREVENTION_GATE = OFFICIAL_DB_EXPLICIT_MIGRATION_AUTHORIZATION_REQUIRED
NEW_LESSON_ID = OFFICIAL-DB-MIGRATION-TARGET-001
C2C2_READINESS = READY_PENDING_OWNER_APPROVAL
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS_CHANGED = 0
OFFICIAL_DB_WRITES = 0
BUSINESS_MUTATIONS = 0
P0 = 0
P1 = 0
P2 = 1 (unguarded automatic migration target safety gap)
P3 = 0
GATE = PASS_CLIENT_C2C1R_OFFICIAL_DB_MIGRATION_PROVENANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

No rollback, migration, permission change, C2C2 implementation, revision mutation, or production action was performed. Owner review is required.

