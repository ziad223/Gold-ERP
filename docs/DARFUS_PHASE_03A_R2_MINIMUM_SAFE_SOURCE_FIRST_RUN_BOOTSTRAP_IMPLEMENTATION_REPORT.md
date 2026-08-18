# DARFUS ERP — Phase 03A-R2 Implementation Report

تم تنفيذ Phase 03A-R2 على الـOfficial DB المصرّح به فقط بعد إعادة إثبات الـbackup والهوية والـbaseline. نجحت migration وbootstrap الأول وreplay والاختبارات المركزة، ولم تُكتب أي بيانات Suppliers/Locations/VAT/Assets/PO/Movement/Payment/Journal business.

## 1. Executive Summary

Implemented only the approved R1/R1A master-data bootstrap scope:

- versioned, company-scoped, idempotent bootstrap state;
- canonical V1 baseline key manifest for the existing 502 rows;
- exact R1 V2 delta of 157 profile master-data rows;
- missing Diamond/Gem Position/Setting and Diamond Tone/Tone Level/Saturation categories;
- canonical `Gübelin` with controlled `Gubelin` alias handling;
- server-authoritative KT=`00` for exact Loose Diamond/Gemstone/Pearl profiles;
- removal of non-canonical `WT`/`WCH` from source barcode defaults and preservation of the official 5/20 taxonomy.

No Phase 03A-R3, Diamond implementation, broad seed, reset, delete, build, or unrelated business workflow was started.

## 2. Preconditions

| Check | Result | Evidence |
|---|---|---|
| Official DB target | PASS | `current_database() = darfus_erp` |
| Current DB user | PASS | `postgres` |
| PostgreSQL | PASS | 16.15 |
| Pending migrations before apply | PASS | exactly `20260818010000-create-inventory-master-data-bootstrap-state.js` |
| Persistent write authorization | PASS | Explicit Phase 03A-R2 instruction authorized the approved migration/bootstrap path |
| Backup | PASS | B1 post-03A backup, hash and `pg_restore` checks below |
| Build | NOT RUN | Prohibited by the current acceptance guardrails |

## 3. Backup Reverification

| Item | Actual |
|---|---|
| File | `backups/official/darfus_erp_POST_03A_FULL_20260818_005442.dump` |
| Size | 636,014 bytes |
| SHA-256 | `3503287580368456E372EEFBE3E5550B725C4FD9FE29DF49779359D5B07C0458` |
| Required SHA-256 | Same value |
| Match | YES |
| `pg_restore --list` | PASS; 1,180 TOC lines |

## 4. Official DB Identity

`SELECT current_database(), current_user` returned `darfus_erp | postgres`. The official container was `darfus-postgres`; no clone or temporary backend was used.

## 5. Baseline Before

Captured before migration/bootstrap:

| Entity | Before |
|---|---:|
| `SequelizeMeta` | 82 |
| `profile_master_data` | 502 |
| `pearl_size_master_data` | 39 |
| `barcode_inventory_codes` | 5 |
| `barcode_item_codes` | 20 |
| `barcode_sequences` | 0 |
| `suppliers` | 0 |
| `inventory_locations` | 0 |
| `purchase_orders` | 0 |
| `assets` | 0 |
| `inventory_asset_movements` | 0 |
| `payments` | 0 |
| `journal_entries` | 0 |
| `journal_lines` | 0 |
| `idempotency_requests` | 0 |
| `audit_logs` | 22 |

## 6. R1/R1A Design Lock

The implementation preserves the locked design:

- explicit first-run/setup action only;
- no runtime-startup provisioning;
- V1 rows are exact-key `KEEP` candidates, not delete/reseed input;
- V2 is an additive manifest upgrade;
- disabled/user-modified/historically referenced rows are not silently rewritten;
- state is company + dataset + version + manifest hash;
- one transaction and one summary audit event for the successful bootstrap;
- no barcode sequence allocation.

## 7. Exact Source Touch Map

Intentional R2 files:

- `backend/src/config/barcode-defaults.js`
- `backend/src/models/index.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/barcode-identity.service.js`
- `backend/src/services/first-run-bootstrap.service.js`
- `backend/src/services/profile-master-data.service.js`
- `backend/src/services/inventory-master-data-baseline.js`
- `backend/src/services/inventory-master-data-bootstrap.service.js`
- `backend/src/services/inventory-master-data-manifest.js`
- `backend/src/models/inventoryMasterDataBootstrapState.model.js`
- `backend/migrations/20260818010000-create-inventory-master-data-bootstrap-state.js`
- `backend/tests/inventory-master-data-bootstrap-r2.test.cjs`
- this report.

`backend/src/services/inventory-master-data-policy.service.js` was pre-existing untracked worktree content and was not changed by R2.

## 8. Dataset Manifest Implementation

`inventory-master-data-manifest.js` now contains one V2 source of truth with dataset/version/category/key/label/applicable profiles/initial active state/authority source/aliases/ownership/sort order. It contains:

- a 502-row V1 canonical key snapshot;
- the exact 157-row V2 delta;
- the 39 Pearl-size baseline contract;
- the 5 inventory and 20 item barcode taxonomy contract;
- an explicitly empty Gem Treatment initial list.

Manifest hash: `d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c`.

## 9. Master Category Implementation

Added source registry support for:

- `DIAMOND_TONE` 14;
- `DIAMOND_TONE_LEVEL` 9;
- `DIAMOND_SATURATION` 10;
- `DIAMOND_POSITION` 7;
- `DIAMOND_SETTING` 47;
- `GEMSTONE_POSITION` 7;
- `GEMSTONE_SETTING` 47.

`GEMSTONE_TREATMENT` remains supported but receives zero initial values. Position/Setting scope remains jewellery-only as required by R1; loose profiles are not widened.

## 10. Bootstrap Service Implementation

`inventory-master-data-bootstrap.service.js` implements:

- server-supplied company context;
- exact V1 baseline count and key-set guard;
- Pearl/barcode baseline reconciliation;
- deterministic profile row IDs;
- canonical insert-only missing-row behavior;
- alias matching without creating a `Gubelin` duplicate;
- fail-closed duplicate/version/baseline conflicts;
- transaction-scoped advisory serialization through the service transaction;
- dry-run preview;
- version state and summary audit.

## 11. Bootstrap Version Storage

Added `inventory_master_data_bootstrap_states` with:

- company and dataset scope;
- current version and manifest hash;
- state, report, error code, start/completion timestamps;
- unique `(company_id,dataset_id)` constraint;
- company/state index;
- restrictive Company foreign key.

The successful official state is `READY`, dataset `INVENTORY_REFERENCE_MASTER_DATA`, version `2`.

## 12. Migration Review

Migration `20260818010000-create-inventory-master-data-bootstrap-state.js` was reviewed before apply. It creates only the bootstrap-state table, constraints, and index. It contains no `DROP`, `TRUNCATE`, business-table rewrite, seed, barcode write, asset write, or unrelated `ALTER`. Its down path is explicitly forward-only and non-destructive.

Apply result: PASS. `SequelizeMeta` advanced from 82 to 83.

## 13. Gübelin Alias Implementation

The V2 manifest stores/displays `Gübelin` as canonical and carries `{ Gubelin: Gübelin }` as a controlled alias. The official DB contains one canonical row:

`canonical_value = gübelin`, `display_label = Gübelin`.

No canonical `Gubelin` duplicate row exists, and no historical row was rewritten.

## 14. Loose KT=00 Implementation

`resolveKaratCodeForProfile` is server-side and exact-profile based:

- `LOOSE_DIAMOND` → `00`;
- `LOOSE_GEMSTONE` → `00`;
- `LOOSE_PEARL` → `00`.

Contradictory non-`00` input is rejected with `LOOSE_PROFILE_KARAT_MUST_BE_00`. Jewellery profiles retain existing karat behavior. Barcode format was not changed.

## 15. Focused Tests Before DB Mutation

Command:

`node --test backend/tests/inventory-master-data-bootstrap-r2.test.cjs backend/tests/master-data-foundation-01d.test.cjs tests/first-run-bootstrap.test.cjs`

Result before official bootstrap: 16 passed, 0 failed.

The suite covered manifest counts/uniqueness, taxonomy, alias, profile scope, KT=00, existing 01D authority tests, and first-run rollback/authorization tests.

## 16. Source Diff Review

The worktree was already dirty before R2. Current evidence is:

- HEAD: `1657b0e9ba580faef69be48f04637835c201b521`;
- tracked modified count: 88;
- untracked count: 249;
- stash count: 11;
- `next-env.d.ts` was not edited by R2;
- no reset/restore/clean/stash/add/commit/push was run.

The intentional R2 file list is separated in Section 7; unrelated prior worktree content was preserved.

## 17. Migration Apply Proof

The only pending migration was applied directly after the exact-target and backup checks. Post-apply state:

- `SequelizeMeta = 83`;
- state table exists with required constraints/indexes;
- no other pending migration was applied.

## 18. Bootstrap Preview

The implementation provides a dry-run preview that performs baseline/key checks without writes. The official first run independently proved the same contract before inserts through the baseline guard. The first run inserted exactly 157 rows in one transaction.

## 19. Official Bootstrap First Run

Result: PASS.

| Result | Value |
|---|---:|
| V1 baseline profile rows kept | 502 |
| V2 rows inserted | 157 |
| Existing V2 rows | 0 |
| Alias matches | 0 |
| Updates | 0 |
| Deletes | 0 |
| Barcode sequences consumed | 0 |
| Summary bootstrap audit events | 1 |

The first Pearl comparator defect detected before insertion was a lexical ordering issue for NUMERIC text values. It was corrected to numeric comparison, focused tests passed, and the retried transaction completed with no partial state or rows from the failed attempt.

## 20. Approved Delta Verification

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
| Total delta | 157 | 157 |

## 21. Replay Proof

The same bootstrap was replayed twice after the successful first run, including after the exact V1 key-manifest source guard was added. Final replay result:

- `replayed = true`;
- new profile rows = 0;
- new Pearl rows = 0;
- new barcode-code rows = 0;
- updates = 0;
- deletes = 0;
- duplicates = 0;
- manifest hash remained unchanged.

## 22. Master Data Coverage

Post-bootstrap `profile_master_data = 659`. The V1 exact key snapshot is 502 and the V2 delta is 157. Duplicate canonical-key query returned 0. The state row is company-scoped and `READY`.

## 23. Barcode/Pearl Coverage

| Entity | Expected | Actual |
|---|---:|---:|
| Pearl sizes | 39 | 39 |
| Inventory codes | 5 | 5 |
| Item codes | 20 | 20 |
| Barcode sequences | 0 | 0 |
| `WT` inventory code | absent | absent |
| `WCH` item code | absent | absent |
| Pearl duplicate keys | 0 | 0 |

`ROS` and `CSD` are present in the 20-item canonical taxonomy.

## 24. Unauthorized Mutation Check

The approved writes were limited to `SequelizeMeta`, bootstrap state, 157 profile rows, and one summary audit event. All forbidden business-table counts remained unchanged:

| Table/domain | Before | After | Unauthorized delta |
|---|---:|---:|---:|
| Suppliers | 0 | 0 | 0 |
| Locations | 0 | 0 | 0 |
| Settings | 0 | 0 | 0 |
| Assets | 0 | 0 | 0 |
| Purchase Orders | 0 | 0 | 0 |
| Inventory movements | 0 | 0 | 0 |
| Payments | 0 | 0 | 0 |
| Journal entries/lines | 0/0 | 0/0 | 0 |
| Idempotency requests | 0 | 0 | 0 |

## 25. Baseline After

| Entity | After |
|---|---:|
| `SequelizeMeta` | 83 |
| `profile_master_data` | 659 |
| `pearl_size_master_data` | 39 |
| `barcode_inventory_codes` | 5 |
| `barcode_item_codes` | 20 |
| `barcode_sequences` | 0 |
| `inventory_master_data_bootstrap_states` | 1 |
| `audit_logs` | 23 |

## 26. DB Reconciliation

The final read-only reconciliation returned `current_database = darfus_erp`, database size 17 MB, and the expected category/taxonomy/state counts. The state manifest hash equals the implementation hash `d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c`. No duplicate canonical keys or duplicate Pearl identities were found.

## 27. Git Safety

No destructive Git command was used. No cleanup, reset, restore, stash, commit, push, or automatic revert was run. Pre-existing worktree drift remains visible and was not claimed as R2 work.

## 28. Files Changed

R2-intentional source/test files are listed in Section 7. No `AGENTS.md`, `.env`, secret, `next-env.d.ts`, frontend screen, Diamond implementation, or unrelated migration was changed.

## 29. Remaining Gaps

- A live browser acceptance of the new authenticated setup route is deferred to R3, as required by the batch boundary.
- Supplier/Location/VAT provisioning remains intentionally absent; official counts are zero and no workflow data was invented.
- Full Diamond/Gem/Pearl profile implementation remains out of scope.
- Existing broad worktree drift requires Owner review before any cleanup or promotion.

No remaining R2 P0/P1 blocker was found.

## 30. Gate

`GATE = PASS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION`

The gate is supported by the exact backup, official DB identity, single approved migration, 157-row delta, final counts, first-run transaction, replay, zero duplicates, zero forbidden business mutations, and 16/16 focused tests.

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R2-MINIMUM-SAFE-SOURCE-FIRST-RUN-BOOTSTRAP-IMPLEMENTATION
PHASE = 03A-R2
OFFICIAL_DB = darfus_erp
SAFETY_BACKUP_FILE = darfus_erp_POST_03A_FULL_20260818_005442.dump
SAFETY_BACKUP_SHA256 = 3503287580368456E372EEFBE3E5550B725C4FD9FE29DF49779359D5B07C0458
BACKUP_SHA256_MATCH = YES
PG_RESTORE_LIST = PASS
BASELINE_PROFILE_MASTER_DATA_BEFORE = 502
BASELINE_PEARL_SIZE_BEFORE = 39
BASELINE_BARCODE_INVENTORY_BEFORE = 5
BASELINE_BARCODE_ITEM_BEFORE = 20
BASELINE_BARCODE_SEQUENCES_BEFORE = 0
BOOTSTRAP_VERSION_STORAGE_IMPLEMENTED = YES
BOOTSTRAP_VERSION_MIGRATION_CREATED = YES
BOOTSTRAP_VERSION_MIGRATION_APPLIED = YES
FIRST_RUN_BOOTSTRAP_IMPLEMENTED = YES
RUNTIME_STARTUP_AUTO_PROVISIONING = NO
CANONICAL_DATASET_VERSION = 2
REFERENCE_DELTA_EXPECTED = 157
REFERENCE_DELTA_ACTUAL = 157
PROFILE_MASTER_DATA_AFTER = 659
PEARL_SIZE_MASTER_DATA_AFTER = 39
BARCODE_INVENTORY_CODES_AFTER = 5
BARCODE_ITEM_CODES_AFTER = 20
BARCODE_SEQUENCES_AFTER = 0
CERTIFICATE_AUTHORITY_COUNT = 16
CERTIFICATE_CANONICAL = Gübelin
CERTIFICATE_LEGACY_ALIAS = Gubelin
DIAMOND_TONE_COUNT = 14
DIAMOND_TONE_LEVEL_COUNT = 9
DIAMOND_SATURATION_COUNT = 10
DIAMOND_POSITION_COUNT = 7
DIAMOND_SETTING_COUNT = 47
GEMSTONE_POSITION_COUNT = 7
GEMSTONE_SETTING_COUNT = 47
GEMSTONE_TREATMENT_COUNT = 0
LOOSE_DIAMOND_KT_00_TEST = PASS
LOOSE_GEMSTONE_KT_00_TEST = PASS
LOOSE_PEARL_KT_00_TEST = PASS
JEWELLERY_KARAT_NON_REGRESSION = PASS
GBW_BARCODE_NON_REGRESSION = PASS
GBP_BARCODE_NON_REGRESSION = PASS
BOOTSTRAP_FIRST_RUN = PASS
BOOTSTRAP_REPLAY = PASS
BOOTSTRAP_DUPLICATES = 0
DESTRUCTIVE_RESEED = NO
UNAUTHORIZED_BUSINESS_TABLE_MUTATIONS = 0
SUPPLIER_WRITES = 0
LOCATION_WRITES = 0
TAX_SETTINGS_WRITES = 0
ASSET_WRITES = 0
PURCHASE_ORDER_WRITES = 0
MOVEMENT_WRITES = 0
PAYMENT_WRITES = 0
JOURNAL_BUSINESS_WRITES = 0
FOCUSED_TESTS = PASS
SOURCE_BUSINESS_SCOPE_DRIFT = NO
BUILD_RUN = NO
GATE = PASS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION
NEXT_RECOMMENDED_STEP = PHASE_03A_R3_FIRST_RUN_BOOTSTRAP_ACCEPTANCE_AND_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No Phase 03A-R3 or Phase 03B was started automatically.
