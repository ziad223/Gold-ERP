# DARFUS C2B — Disposable Migration Rehearsal Record

This file records the controlled rehearsal evidence. Official `darfus_erp` is never a migration target.

## Targets

| Target | Role | Mutation status |
|---|---|---|
| `darfus_erp` | official baseline | read-only; no migration |
| `darfus_c2b_revision_schema_01` | clone of official baseline | disposable migration/test target; migration applied and synthetic schema rows preserved |
| `darfus_c2b_revision_fresh_01` | empty fresh migration target | full chain, rollback, re-up and second-run target |

If a preferred name already exists, the execution must choose the next free suffix and must not drop/reuse blindly. Disposable databases are preserved for Owner review; no cleanup is automatic.

## Actual rehearsal evidence

1. `current_database()` was checked as `darfus_c2b_revision_schema_01` before the clone migration and as `darfus_c2b_revision_fresh_01` before the fresh-chain migration.
2. Clone was created by `pg_dump`/`pg_restore` from `darfus_erp`; no official write was used.
3. Clone baseline reconciled: Assets 18, Barcode history 18, RFID assignments 2, Asset events 65, purchase cost revisions 18, current valuations 14, invoice Asset links 1, movements 62, journals 25, `SequelizeMeta` 91.
4. Only `20260824010000-create-asset-revision-schema.js` was applied to the clone; `SequelizeMeta` became 92.
5. Clone inspection found both new tables, all required FKs/checks/indexes and both immutability triggers.
6. Synthetic rows proved Asset A revisions 1 and 2, Asset B revision 1, one valid change row, and zero revision/Asset or change/header orphans.
7. Duplicate revision number, duplicate idempotency key, invalid Asset FK, invalid Revision FK, bad field key, non-positive revision, UPDATE and DELETE were all rejected.
8. Two concurrent inserts for the same Asset/revision number produced one success and one unique-constraint rejection.
9. Clone pre-existing business counts remained unchanged after synthetic tests.
10. Fresh full migration chain passed on `darfus_c2b_revision_fresh_01` (92 migrations); the new schema was present.
11. New migration down passed on the empty Fresh DB, removed only the two empty new tables, and restored `SequelizeMeta` to 91; up passed again.
12. Second full `db:migrate` run returned no pending migrations.
13. Official `darfus_erp` was reconnected with SELECT only; revision tables remain absent and official baseline counts remain unchanged.

## Rehearsal sequence

The commands above were executed only against the two named Disposable DBs. A new C2B run must repeat the exact target check rather than reuse a database blindly.

## No business runtime

No API, UI, revision service, Barcode/RFID operation, inventory movement, accounting posting, Receive, sale, CGP, status transition or business row is executed by C2B. Synthetic rows, if used, are schema tests in disposable databases only and are not copied to the official database.
