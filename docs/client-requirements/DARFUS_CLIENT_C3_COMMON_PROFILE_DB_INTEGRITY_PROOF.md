# DARFUS C3 — Database Integrity and No-Mutation Proof

بالعربي المختصر: تم فحص `darfus_erp` بـ`SELECT` فقط. أُنشئت نسخة منفصلة `darfus_c3_common_profile_fields_01` من dump قراءة فقط، وتم توجيه backend التجريبي إليها. لا يوجد C3 business delta رسمي.

## Official DB identity

| Check | Result |
|---|---|
| `SELECT current_database()` | `darfus_erp` |
| Official DB business writes in C3 | 0 |
| Official DB damage | 0 |
| Migrations executed by C3 | 0 |
| Seeds/backfills by C3 | 0 |
| Source migration files | 92 |
| `SequelizeMeta` rows | 92 |
| Source/applied name comparison | `pending=0`, `extra=0` |

## Official read-only baseline

| Entity | Count | Evidence |
|---|---:|---|
| companies | 1 | Direct SELECT |
| branches | 2 | Direct SELECT |
| users | 1 | Direct SELECT |
| permissions | 152 | Direct SELECT |
| assets | 18 | Direct SELECT |
| purchase_orders | 14 | Direct SELECT |
| purchase_order_items | 14 | Direct SELECT |
| inventory_asset_movements | 62 | Direct SELECT |
| journal_entries | 25 | Direct SELECT |
| journal_lines | 67 | Direct SELECT |
| inventory_locations | 4 | Direct SELECT |
| profile_master_data | 660 | Direct SELECT |
| idempotency_requests | 100 | Direct SELECT |
| asset_revisions | 1 | Direct SELECT |

## In-scope profile data quality observations

The five accepted profile families contain 11 existing Assets in the official database. For those rows:

| Check | Count |
|---|---:|
| Missing supplier | 0 |
| Missing location | 0 |
| Missing description | 0 |
| Missing branch | 0 |
| Blank barcode | 0 |
| Duplicate barcode rows | 0 |

The full 18-row Asset table has four missing locations, all outside the five C3 profile-family rows (the observed rows are CGP). This is a pre-existing DB state and was not repaired by C3.

## Disposable clone identity and comparison

The clone was created only after checking that the exact name did not exist. The dump was read from `darfus_erp` and restored into the new database. The clone backend environment was verified with `DB_NAME=darfus_c3_common_profile_fields_01`, `DB_HOST=darfus-postgres`, `PORT=8000`, and `REDIS_URL=redis://darfus-redis:6379` exposed on host port `8001`.

| Clone check | Result |
|---|---:|
| `current_database()` | `darfus_c3_common_profile_fields_01` |
| assets | 18 |
| purchase_orders | 14 |
| movements | 62 |
| journal_entries | 25 |
| journal_lines | 67 |
| asset_revisions | 1 |

No C3 business row was inserted, updated, deleted, or backfilled in the clone. The clone exists as a disposable read-only runtime target for any separately approved future mutation acceptance; it is not an authorization to start C4.

## Integrity boundaries preserved

- `assets.id` remains the stable physical identity.
- Asset barcodes are unique in the observed current state.
- Movement rows have no missing `asset_id` in the observed current state.
- No common-field contract creates a second Asset metadata table or JSON authority.
- No migration, seed, permission change, Barcode/RFID change, status change, financial change, or Inventory Count change occurred.

