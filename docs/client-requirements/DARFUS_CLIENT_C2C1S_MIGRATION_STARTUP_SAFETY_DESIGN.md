# DARFUS Client C2C1S — Migration Startup Safety Design

Control: `DARFUS-CLIENT-C2C1S-MIGRATION-STARTUP-SAFETY-GUARD-01`  
Protected local-main database: `darfus_erp`  
Scope: migration execution safety only

## Root cause being closed

C2C1R proved that the previous backend container command was:

```text
sh -c "npm run db:migrate && npm start"
```

Compose supplied `DB_NAME=${DB_NAME:-darfus_erp}`, so a normal backend restart could apply pending migrations to the protected local-main database. C2C1S removes this automatic path and places all package migration calls behind one fail-closed wrapper.

## Exact change boundary

| Allowed change | Result |
|---|---|
| normal backend startup | `npm start` only |
| migration command | `node scripts/migrate-safe.js` |
| official approval flag | `DARFUS_OFFICIAL_MIGRATION_APPROVED=YES`, supplied only for a separately authorized promotion |
| explicit target mode | `DARFUS_MIGRATION_TARGET_MODE=disposable` or `official` |
| actual target proof | same connection executes `SELECT current_database()` before the migrator is constructed |
| migration list | explicit `--migrations=file1.js,file2.js`; pending list must match exactly |
| default behavior | missing target mode/target/list/approval is denial or dry-run, never implicit execution |

No existing migration file, business service, API, frontend, permission, Asset, barcode, RFID, inventory, accounting, or production configuration is changed by this design.

## Final startup behavior

```text
normal backend startup
→ npm start
→ node src/server.js
→ no migration runner
→ no schema mutation
```

The existing migration capability remains available only through the canonical wrapper:

```text
DARFUS_MIGRATION_TARGET_MODE=disposable
DB_NAME=<explicit-disposable-db>
npm run db:migrate:safe -- --migrations=<exact-file-list> --execute
```

`db:migrate` remains a compatibility package command but points to the same `backend/scripts/migrate-safe.js`; it is not a second implementation. Both commands require explicit target mode and never use an implicit official approval.

## Protected target policy

The wrapper first resolves an explicit target configuration, opens the connection, and runs:

```sql
SELECT current_database();
```

It then requires actual and intended database names to match. The protected database is denied unless all of the following are deliberately supplied:

```text
actual database = darfus_erp
DARFUS_MIGRATION_TARGET_MODE = official
DARFUS_OFFICIAL_MIGRATION_APPROVED = YES
```

The approval flag is not present in Compose defaults or normal `.env` files. `YES` is an exact value; missing, blank, `0`, `no`, or any other value denies. The flag is evaluated only in the explicit safe command process and is not persisted by the wrapper.

## Target modes

| Mode | Required | Protected database |
|---|---|---|
| `disposable` | explicit `DB_NAME` or `DATABASE_URL`, actual DB must match, actual DB must not be `darfus_erp` | always denied |
| `official` | explicit target, actual DB must be `darfus_erp`, exact approval `YES` | allowed only under separate Owner-approved gate |
| missing/other | denied before connection/migrator | denied |

The wrapper does not trust only environment text: it checks the actual PostgreSQL identity. A mismatch is denied before migration discovery/execution.

## Exact migration set policy

The caller supplies the approved ordered list with `--migrations=file1.js,file2.js`. The wrapper:

1. proves actual database identity;
2. constructs the migrator only after the protected-target check;
3. reads pending names;
4. denies a non-empty pending set when no explicit list was supplied;
5. denies when pending names differ in count or order from the explicit list;
6. performs dry-run unless `--execute` is explicitly supplied;
7. records the post-execution `SequelizeMeta` count.

No broad “run everything pending” behavior is introduced.

## Existing guard relationship

The existing acceptance and promotion guard scripts remain valid for their named workflows. C2C1S closes the gap in the generic package/startup path. `backend/scripts/reset-database.js` remains separately default-deny and restricted to explicit local disposable names. All future schema-changing stages must use the same canonical wrapper or a stricter named gate that performs the same actual-database proof.

## Safety outcomes

```text
SAFE_DISPOSABLE_TARGET = ALLOW
PROTECTED_OFFICIAL_WITHOUT_APPROVAL = DENY
TARGET_MISMATCH = DENY
NORMAL_STARTUP_HAS_NO_SCHEMA_MUTATION = YES
MIGRATION_GUARD_USES_ACTUAL_DATABASE_IDENTITY = YES
OFFICIAL_MIGRATION_APPROVAL_DEFAULT = DENY
PERSISTENT_AUTO_APPROVAL = NO
MIGRATION_GUARD_SCOPE = ALL_SCHEMA_CHANGING_STAGES
```

## C2C1S non-goals

The C2B schema on `darfus_erp` is kept. No rollback, table drop, Meta deletion, seed, data correction, business migration, permission change, revision API, or production action is authorized by this control.

