# DARFUS ERP — PHASE 03A-B1 FRESH POST-03A VERIFIED OFFICIAL DATABASE BACKUP REPORT

**Control ID:** `DARFUS-PHASE-03A-B1-FRESH-POST-03A-VERIFIED-BACKUP`  
**Official DB:** `darfus_erp`  
**Official PostgreSQL container:** `darfus-postgres`  
**Mode:** `BACKUP_ONLY + READ_ONLY_VERIFICATION`  
**Backup timestamp:** `2026-08-18 00:55:42`

## 1. Executive Summary

A fresh full PostgreSQL Custom Format backup of the exact current official `darfus_erp` database was created inside `darfus-postgres`, verified with `pg_restore -l`, copied to the official host backup directory, hashed, and accompanied by a non-secret manifest.

The required post-03A baseline matched the expected values:

- `profile_master_data = 502`
- `pearl_size_master_data = 39`
- `barcode_inventory_codes = 5`
- `barcode_item_codes = 20`
- `barcode_sequences = 0`

The complete before/after read-only baseline matched. No business mutation was performed by this control. The older Phase 02 backup was preserved and not overwritten.

## 2. Preconditions

| Precondition | Evidence | Result |
|---|---|---|
| Phase 01 final authority closed | `docs/DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md` | PASS |
| Phase 02 verified backup | Existing `darfus_erp_FULL_20260818_000425.dump`; SHA-256 preserved | PASS |
| Phase 03A safe subset provisioned | Prior report: 502 + 39 + 5 + 20 reference rows | PASS |
| Phase 03A-R1 gate | `PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY` | PASS |
| Phase 03A-R1A gate | `PASS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_READY` | PASS |
| Prior backup preserved | Old file exists, size 617067 bytes, SHA-256 `7BDC254D6D9512A32D13B0909CCFDDD700907DBB380332974AF4117BB31860E3` | PASS |

No prior authority decision was reopened.

## 3. Phase Lineage

```text
PHASE_01_FINAL_CLOSED
  -> PHASE_02_VERIFIED_BACKUP
  -> PHASE_03A_REFERENCE_DERIVED_SAFE_PROVISIONING
  -> PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN
  -> PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN
  -> PHASE_03A-B1_FRESH_POST_03A_VERIFIED_BACKUP
```

Prior accounting is preserved accurately:

- Phase 03A transactional business writes: `0`.
- Phase 03A reference provisioning writes: `566`.
- Phase 03A audit writes: `2`.
- Phase 03A-R1 writes: `0`.
- Phase 03A-R1A writes: `0`.

## 4. Official DB Identity

Read-only identity query:

| Item | Actual |
|---|---|
| Container | `darfus-postgres` |
| Database | `darfus_erp` |
| Current user | `postgres` |
| PostgreSQL | `16.15` |
| Database size at capture | `16 MB` |
| Identity result | PASS |

The wrong-database stop condition was not triggered.

## 5. PostgreSQL Health

`docker compose ps` showed:

| Service | Status |
|---|---|
| `darfus-postgres` | Up, `healthy` |
| `darfus-backend` | Up |
| `darfus-redis` | Up, `healthy` |

No restart was performed.

`POSTGRES_HEALTH = PASS`.

## 6. Disk Space Preflight

| Location | Available | Result |
|---|---:|---|
| Container `/tmp` / PostgreSQL volume | `999192440 KB` reported by `df -Pk` | PASS |
| Host `I:` volume | `32950333440` bytes free reported by PowerShell | PASS |

The available space was sufficient for the observed database and resulting archive. No cleanup was performed.

## 7. Post-03A Baseline Before Backup

The following was captured by read-only SQL immediately before backup creation:

| Entity | Count |
|---|---:|
| `SequelizeMeta` | 82 |
| `companies` | 1 |
| `branches` | 1 |
| `users` | 1 |
| `profile_master_data` | 502 |
| `pearl_size_master_data` | 39 |
| `barcode_inventory_codes` | 5 |
| `barcode_item_codes` | 20 |
| `barcode_sequences` | 0 |
| `suppliers` | 0 |
| `inventory_locations` | 0 |
| `settings` | 0 |
| `gold_market_settings` | 1 |
| `purchase_orders` | 0 |
| `purchase_order_items` | 0 |
| `assets` | 0 |
| `inventory_asset_movements` | 0 |
| `asset_origins` | 0 |
| `asset_purchase_cost_revisions` | 0 |
| `asset_current_valuations` | 0 |
| `payments` | 0 |
| `journal_entries` | 0 |
| `journal_lines` | 0 |
| `idempotency_requests` | 0 |
| `audit_logs` | 22 |

This is the recorded `POST_03A_OFFICIAL_DB_BASELINE_BEFORE_BACKUP`.

## 8. Baseline Reconciliation Against Expected 502/39/5/20

| Assertion | Expected | Actual | Result |
|---|---:|---:|---|
| `profile_master_data` | 502 | 502 | PASS |
| `pearl_size_master_data` | 39 | 39 | PASS |
| `barcode_inventory_codes` | 5 | 5 | PASS |
| `barcode_item_codes` | 20 | 20 | PASS |
| `barcode_sequences` | 0 | 0 | PASS |

`POST_03A_BASELINE_DRIFT = NO`.

The actual `audit_logs = 22` and `gold_market_settings = 1` were recorded rather than inferred. No auto-correction was attempted.

## 9. Backup Method

The backup was created with PostgreSQL Custom Format inside the container:

```text
pg_dump -U postgres -d darfus_erp -Fc -f /tmp/darfus_erp_POST_03A_FULL_20260818_005442.dump
```

The forbidden PowerShell binary stdout redirection method was not used. The archive was verified inside the container before `docker cp` to the host.

## 10. Container Backup Verification

| Check | Actual | Result |
|---|---|---|
| Temporary file exists | Yes | PASS |
| Temporary file non-zero | Yes; 636014 bytes | PASS |
| `pg_restore -l` inside container | Exit code 0 | PASS |
| TOC list non-empty | Yes | PASS |

## 11. pg_restore Archive Readability

`pg_restore -l` returned successfully with:

```text
PG_RESTORE_LIST = PASS
TOC_ENTRIES = 1180
```

No restore rehearsal was run, as required by scope.

## 12. Core Object Coverage

The archive TOC contains schema/table and table-data entries for all required core objects:

`SequelizeMeta`, `profile_master_data`, `pearl_size_master_data`, `barcode_inventory_codes`, `barcode_item_codes`, `barcode_sequences`, `assets`, `purchase_orders`, `purchase_order_items`, `inventory_asset_movements`, `payments`, `journal_entries`, `journal_lines`, `settings`, and `audit_logs`.

`CORE_OBJECT_COVERAGE = PASS`.

## 13. Host Backup Proof

| Item | Actual |
|---|---|
| Host file | `darfus_erp_POST_03A_FULL_20260818_005442.dump` |
| Host path | `I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_03A_FULL_20260818_005442.dump` |
| Exists | YES |
| Non-zero | YES |
| Size | 636014 bytes |
| Copy method | `docker cp` after container verification |

## 14. SHA-256

```text
BACKUP_SHA256 = 3503287580368456E372EEFBE3E5550B725C4FD9FE29DF49779359D5B07C0458
```

The hash was computed on the host copy.

## 15. Manifest

The non-secret manifest was created beside the archive:

`backups/official/darfus_erp_POST_03A_FULL_20260818_005442.manifest.txt`

It contains the control ID, source identity, PostgreSQL version, format, path, size, SHA-256, TOC count, baseline counts, lineage, and mutation accounting. It contains no password, API key, token, secret, or credential-bearing connection string.

`MANIFEST_CREATED = YES`.

## 16. Post-03A Baseline After Backup

The same read-only baseline was captured after the host copy. All 25 entity counts matched the before-capture values, including:

```text
SequelizeMeta = 82
profile_master_data = 502
pearl_size_master_data = 39
barcode_inventory_codes = 5
barcode_item_codes = 20
barcode_sequences = 0
gold_market_settings = 1
audit_logs = 22
```

This is the recorded `POST_03A_OFFICIAL_DB_BASELINE_AFTER_BACKUP`.

## 17. Before/After Reconciliation

| Reconciliation | Result |
|---|---|
| Database identity | Unchanged: `darfus_erp` |
| Core Master Data counts | Unchanged |
| Transactional business counts | Unchanged at zero |
| Audit count | Unchanged at 22 |
| Schema migration count | Unchanged at 82 applied migrations |
| Backup-control DB mutations | 0 |

`BACKUP_CONTROL_DB_MUTATIONS = 0`.

## 18. Prior Write Accounting

```text
OFFICIAL_DB_TRANSACTIONAL_BUSINESS_WRITES_FROM_PHASE_03A = 0
OFFICIAL_DB_REFERENCE_PROVISIONING_WRITES_FROM_PHASE_03A = 566
OFFICIAL_DB_AUDIT_WRITES_FROM_PHASE_03A = 2
OFFICIAL_DB_WRITES_R1 = 0
OFFICIAL_DB_WRITES_R1A = 0
OFFICIAL_DB_BUSINESS_WRITES_BY_THIS_CONTROL = 0
```

The official database was not historically unwritten; the accounting above distinguishes prior reference provisioning from transactional business writes.

## 19. Source/Git Safety

Read-only Git checks confirmed the existing dirty worktree and preserved it:

```text
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
PRE_EXISTING_NEXT_ENV_D_TS_DRIFT = M next-env.d.ts
```

No reset, clean, restore, stash, checkout overwrite, add, commit, push, formatting, source edit, test edit, or configuration edit was performed. `AGENTS.md` and `next-env.d.ts` were not touched.

## 20. Files Created

Created by this control:

- `backups/official/darfus_erp_POST_03A_FULL_20260818_005442.dump`
- `backups/official/darfus_erp_POST_03A_FULL_20260818_005442.manifest.txt`
- `docs/DARFUS_PHASE_03A_B1_FRESH_POST_03A_BACKUP_REPORT.md`

The older Phase 02 backup was not overwritten, deleted, renamed, or cleaned.

The verified temporary container file remains at `/tmp/darfus_erp_POST_03A_FULL_20260818_005442.dump` and its metadata TOC file remains at `/tmp/darfus_erp_POST_03A_FULL_20260818_005442.toc.txt`; no broad cleanup was run.

## 21. Blockers

No backup, identity, health, disk, archive, hash, or baseline blocker was found.

The following remain intentionally outside this control:

- `RESTORE_REHEARSAL = NOT_RUN_OUT_OF_SCOPE`.
- Phase 03A-R2 source implementation.
- Bootstrap implementation and migration creation.
- 157-row R1 delta provisioning.
- Supplier, Location, VAT, Receive, Diamond, Gem, and Pearl work.

## 22. Gate

```text
GATE = PASS_PHASE_03A_B1_FRESH_POST_03A_VERIFIED_BACKUP
```

The fresh verified backup is now the safety gate required before a separately approved Phase 03A-R2 implementation. No next batch was started automatically.

## 23. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-B1-FRESH-POST-03A-VERIFIED-BACKUP
PHASE = 03A-B1
PHASE_NAME = FRESH_POST_03A_VERIFIED_OFFICIAL_DB_BACKUP
OFFICIAL_DB = darfus_erp
OFFICIAL_POSTGRES_CONTAINER = darfus-postgres

PHASE_03A_R1_GATE = PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY
PHASE_03A_R1A_GATE = PASS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_READY

OFFICIAL_DB_IDENTITY_VERIFIED = YES
POSTGRES_HEALTH = PASS
DISK_SPACE_PREFLIGHT = PASS

POST_03A_PROFILE_MASTER_DATA = 502
POST_03A_PEARL_SIZE_MASTER_DATA = 39
POST_03A_BARCODE_INVENTORY_CODES = 5
POST_03A_BARCODE_ITEM_CODES = 20
POST_03A_BARCODE_SEQUENCES = 0
POST_03A_AUDIT_LOGS = 22
POST_03A_BASELINE_DRIFT = NO

BACKUP_FORMAT = POSTGRES_CUSTOM
BACKUP_CREATED = YES
BACKUP_FILE = darfus_erp_POST_03A_FULL_20260818_005442.dump
BACKUP_HOST_PATH = I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_03A_FULL_20260818_005442.dump
BACKUP_SIZE_BYTES = 636014
BACKUP_SHA256 = 3503287580368456E372EEFBE3E5550B725C4FD9FE29DF49779359D5B07C0458
PG_RESTORE_LIST = PASS
TOC_ENTRIES = 1180
CORE_OBJECT_COVERAGE = PASS
MANIFEST_CREATED = YES
RESTORE_REHEARSAL = NOT_RUN_OUT_OF_SCOPE
POST_03A_BASELINE_AFTER_CAPTURED = YES

OFFICIAL_DB_TRANSACTIONAL_BUSINESS_WRITES_FROM_PHASE_03A = 0
OFFICIAL_DB_REFERENCE_PROVISIONING_WRITES_FROM_PHASE_03A = 566
OFFICIAL_DB_AUDIT_WRITES_FROM_PHASE_03A = 2
OFFICIAL_DB_BUSINESS_WRITES_BY_THIS_CONTROL = 0

SOURCE_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
PROVISIONING_PERFORMED = NO
BUILD_RUN = NO

SUPPLIER_WRITES = 0
LOCATION_WRITES = 0
TAX_SETTINGS_WRITES = 0
ASSET_WRITES = 0
PURCHASE_ORDER_WRITES = 0
MOVEMENT_WRITES = 0
PAYMENT_WRITES = 0
JOURNAL_WRITES = 0

GATE = PASS_PHASE_03A_B1_FRESH_POST_03A_VERIFIED_BACKUP
NEXT_RECOMMENDED_STEP = PHASE_03A_R2_MINIMUM_SAFE_SOURCE_AND_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — OWNER REVIEW REQUIRED.**
