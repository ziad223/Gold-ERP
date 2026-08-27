# DARFUS CLIENT C4 — Tag Database / Identity Proof

Control: `DARFUS-CLIENT-C4-TAG-PROFILE-EXACT-PARITY-01`  
Database authority: `darfus_erp`  
Proof mode: read-only

## Database identity

The read-only query `SELECT current_database(), current_user` returned:

| Field | Observed |
|---|---|
| `current_database()` | `darfus_erp` |
| `current_user` | `postgres` |

No disposable clone was used because C4 has no mutation requirement. The official database was queried only for identity, Asset/Barcode/profile evidence, and before/after count reconciliation.

## Runtime container baseline

| Container | State | Port |
|---|---|---|
| `darfus-backend` | Up | `localhost:8000` |
| `darfus-postgres` | Up / healthy | `localhost:5433` → PostgreSQL 5432 |
| `darfus-redis` | Up / healthy | `localhost:6379` |

## Read-only count reconciliation

| Authority table | C4 boundary snapshot | Post-browser snapshot | Delta |
|---|---:|---:|---:|
| `assets` | 18 | 18 | 0 |
| `asset_barcode_history` | 18 | 18 | 0 |
| `asset_rfid_assignments` | 2 | 2 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |

The C4 browser actions are read-only Asset detail navigation, context selection, and client-side print preparation. The implementation introduces no SQL, migration, seed, Asset update, Barcode allocation, RFID assignment, movement, journal, or tag audit write.

## Identity examples

| Asset | Inventory profile | Stored Barcode | Status | Branch |
|---|---|---|---|---|
| `AST-PUR-1787083585731-1-1-plz5` | `GOLD_BY_WEIGHT_JEWELLERY` | `GWRNG21000001` | `available` | Branch-1 |
| `AST-PUR-1787090870838-1-1-9k4e` | `GOLD_BY_PIECE` | `GPRNG21000001` | `available` | Branch-1 |
| `AST-PUR-1787292943243-1-1-9juc` | `DIAMOND_JEWELLERY` | `DDBRH21000001` | `available` | Branch-1 |
| `AST-PUR-1787330905253-1-1-zo5f` | `GEMSTONE_JEWELLERY` | `GSRNG21000001` | `available` | Branch-1 |
| `AST-PUR-1787391626468-1-1-wf0w` | `PEARL_JEWELLERY` | `PLRNG18000001` | `available` | Branch-2 |

The tag renderer consumes `Asset.barcode` through `assetToTagData`; it never generates a barcode and never substitutes SKU, Asset ID, or RFID. The tag is a view over the current Asset identity.

## Database conclusion

`TAG_DB_BUSINESS_DELTA = 0`  
`OFFICIAL_BUSINESS_WRITES = 0`  
`OFFICIAL_DB_DAMAGE = 0`  
`MIGRATIONS = 0`

