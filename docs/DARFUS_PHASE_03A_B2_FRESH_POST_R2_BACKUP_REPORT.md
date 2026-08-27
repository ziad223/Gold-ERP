# DARFUS ERP — Phase 03A-B2 Fresh Post-R2 Verified Official Database Backup

## 1. Executive Summary

تم تنفيذ B2 كـBackup-only gate للحالة الرسمية بعد R2. تم التحقق من `darfus_erp`، وPostgreSQL health، وR2 master-data state، ثم إنشاء PostgreSQL Custom dump جديد، والتحقق منه بـ`pg_restore -l`، ونسخه إلى host، وحساب SHA-256، وإنشاء manifest. لم يحدث أي DB business mutation، ولم يبدأ R3.

## 2. Preconditions

تمت قراءة التقارير الخمسة المطلوبة كاملة، وجميعها موجودة. تقرير R2 يثبت:

`GATE = PASS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION`

كما يثبت:

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

## 3. R2 Gate Proof

R2 gate موجود وPASS. تم التحقق من الحالة فعليًا، دون الاعتماد على التقرير وحده.

## 4. Official DB Identity

| Check | Actual |
|---|---|
| Database | `darfus_erp` |
| User | `postgres` |
| Container | `darfus-postgres` |
| PostgreSQL | 16.15 |
| DB size | 17 MB |

## 5. PostgreSQL Health

`docker compose ps` returned `darfus-postgres Up ... (healthy)`. No restart was performed.

## 6. Disk Space

| Location | Available | Result |
|---|---:|---|
| Host `I:` | 30.85 GB | PASS |
| Container `/tmp` | 999,191,436 KiB | PASS |

## 7. Bootstrap State Verification

Read-only query returned one row:

| Dataset | Version | State | Manifest hash |
|---|---:|---|---|
| `INVENTORY_REFERENCE_MASTER_DATA` | 2 | READY | `d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c` |

## 8. Master Data R2 Verification

| Category | Expected | Actual |
|---|---:|---:|
| CERTIFICATE_AUTHORITY | 16 | 16 |
| DIAMOND_TONE | 14 | 14 |
| DIAMOND_TONE_LEVEL | 9 | 9 |
| DIAMOND_SATURATION | 10 | 10 |
| DIAMOND_POSITION | 7 | 7 |
| DIAMOND_SETTING | 47 | 47 |
| GEMSTONE_POSITION | 7 | 7 |
| GEMSTONE_SETTING | 47 | 47 |
| GEMSTONE_TREATMENT | 0 | 0 |

Canonical checks: `Gübelin` PRESENT; canonical `Gubelin` ABSENT; `WT`, `WCH`, `ERR`, and `NLC` ABSENT.

## 9. Pearl / Barcode Verification

- Pearl rows: 39.
- Range: 1.0 through 20.0 mm.
- Step: 0.5 mm; no gap detected.
- Barcode inventory codes: 5.
- Barcode item codes: 20.
- Barcode sequences: 0.

## 10. Baseline Before

`POST_R2_BASELINE_BEFORE_BACKUP` was captured before `pg_dump`:

| Entity | Count |
|---|---:|
| SequelizeMeta | 83 |
| companies / branches / users | 1 / 1 / 1 |
| profile_master_data | 659 |
| pearl_size_master_data | 39 |
| barcode_inventory_codes / item_codes | 5 / 20 |
| barcode_sequences | 0 |
| bootstrap states | 1 |
| suppliers / locations / settings | 0 / 0 / 0 |
| gold_market_settings | 1 |
| purchase_orders / purchase_order_items | 0 / 0 |
| assets | 0 |
| inventory_asset_movements | 0 |
| asset_origins / cost_revisions / valuations | 0 / 0 / 0 |
| payments | 0 |
| journal_entries / journal_lines | 0 / 0 |
| idempotency_requests | 0 |
| audit_logs | 23 |

## 11. Backup Method

The dump was created inside the official PostgreSQL container using:

`pg_dump -U postgres -d darfus_erp -Fc -f /tmp/darfus_erp_POST_R2_FULL_20260818_095351.dump`

No PowerShell binary redirection was used.

## 12. Container Backup Verification

The container file existed and was non-empty: 646,071 bytes.

## 13. pg_restore Proof

`pg_restore -l` exited 0 and returned 1,186 TOC entries.

## 14. Core Object Coverage

PASS. The archive contains the bootstrap state table, `profile_master_data`, Pearl master data, both barcode-code tables, barcode sequences, assets, purchase orders, inventory movements, payments, journals, settings, audit logs, and `SequelizeMeta`.

## 15. Host Copy

The container dump was copied with `docker cp` to:

`I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_R2_FULL_20260818_095351.dump`

The host file exists and is non-empty.

## 16. SHA-256

`844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1`

## 17. Manifest

Created:

`I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_R2_FULL_20260818_095351.manifest.txt`

It contains the non-secret control, identity, post-R2 counts, bootstrap state/hash, backup metadata, TOC count, core coverage, and lineage.

## 18. Baseline After

`POST_R2_BASELINE_AFTER_BACKUP` was captured after the host copy and hash. It returned the same counts as the Before baseline, including `audit_logs = 23`.

## 19. Before/After Reconciliation

| Check | Result |
|---|---|
| SequelizeMeta drift | 0 |
| Profile/Pearl/barcode drift | 0 |
| Bootstrap state drift | 0 |
| Audit drift | 0 |
| Forbidden business-table drift | 0 |
| Database identity drift | 0 |

## 20. Business Mutation Check

The B2 control performed no `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, `ALTER`, migration, bootstrap replay, seed, provisioning, or business transaction. Suppliers, locations, settings, assets, purchase orders, movements, payments, journals, and idempotency rows remained at their verified baseline counts.

## 21. Git Safety

Read-only `git status --short` was used. No reset, clean, restore, stash, commit, push, source edit, `AGENTS.md` edit, or `next-env.d.ts` edit was performed.

## 22. Files Created

- `backups/official/darfus_erp_POST_R2_FULL_20260818_095351.dump`
- `backups/official/darfus_erp_POST_R2_FULL_20260818_095351.manifest.txt`
- `docs/DARFUS_PHASE_03A_B2_FRESH_POST_R2_BACKUP_REPORT.md`

Previous Phase 02 and Phase 03A-B1 backups were preserved and not overwritten.

## 23. Blockers

No B2 blocker. Restore rehearsal was intentionally not run because it is out of scope.

## 24. Gate

`GATE = PASS_PHASE_03A_B2_FRESH_POST_R2_VERIFIED_BACKUP`

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-B2-FRESH-POST-R2-VERIFIED-BACKUP
PHASE = 03A-B2
PHASE_NAME = FRESH_POST_R2_VERIFIED_OFFICIAL_DB_BACKUP
OFFICIAL_DB = darfus_erp
OFFICIAL_POSTGRES_CONTAINER = darfus-postgres
PHASE_03A_R2_GATE = PASS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION
OFFICIAL_DB_IDENTITY_VERIFIED = YES
POSTGRES_HEALTH = PASS
DISK_SPACE_PREFLIGHT = PASS
SEQUELIZE_META = 83
PROFILE_MASTER_DATA = 659
PEARL_SIZE_MASTER_DATA = 39
BARCODE_INVENTORY_CODES = 5
BARCODE_ITEM_CODES = 20
BARCODE_SEQUENCES = 0
BOOTSTRAP_STATE_ROWS = 1
BOOTSTRAP_DATASET = INVENTORY_REFERENCE_MASTER_DATA
BOOTSTRAP_VERSION = 2
BOOTSTRAP_STATE = READY
BOOTSTRAP_MANIFEST_HASH = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
CERTIFICATE_AUTHORITY_COUNT = 16
DIAMOND_TONE_COUNT = 14
DIAMOND_TONE_LEVEL_COUNT = 9
DIAMOND_SATURATION_COUNT = 10
DIAMOND_POSITION_COUNT = 7
DIAMOND_SETTING_COUNT = 47
GEMSTONE_POSITION_COUNT = 7
GEMSTONE_SETTING_COUNT = 47
GEMSTONE_TREATMENT_COUNT = 0
POST_R2_BASELINE_DRIFT = NO
BACKUP_FORMAT = POSTGRES_CUSTOM
BACKUP_CREATED = YES
BACKUP_FILE = darfus_erp_POST_R2_FULL_20260818_095351.dump
BACKUP_HOST_PATH = I:\WORK\jewellery-erp-master\backups\official\darfus_erp_POST_R2_FULL_20260818_095351.dump
BACKUP_SIZE_BYTES = 646071
BACKUP_SHA256 = 844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1
PG_RESTORE_LIST = PASS
TOC_ENTRIES = 1186
CORE_OBJECT_COVERAGE = PASS
MANIFEST_CREATED = YES
RESTORE_REHEARSAL = NOT_RUN_OUT_OF_SCOPE
POST_R2_BASELINE_AFTER_CAPTURED = YES
BACKUP_CONTROL_DB_MUTATIONS = 0
SOURCE_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BOOTSTRAP_EXECUTED = NO
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
GATE = PASS_PHASE_03A_B2_FRESH_POST_R2_VERIFIED_BACKUP
NEXT_RECOMMENDED_STEP = PHASE_03A_R3_FIRST_RUN_BOOTSTRAP_BROWSER_NETWORK_RUNTIME_ACCEPTANCE_AND_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Phase 03A-R3 was not started automatically.
