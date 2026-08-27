# DARFUS Client C2C2 — Database Integrity Proof

## Official database proof

Before and after runtime, read-only queries against `darfus_erp` returned:

| Relation/authority | Before/after observed |
|---|---:|
| `current_database()` | `darfus_erp` |
| Assets | 18 / 18 |
| `asset_revisions` | 0 / 0 |
| `asset_revision_changes` | 0 / 0 |
| Asset events | 65 / 65 |
| Revision events | 0 / 0 |
| Audit logs | 136 / 136 |
| Revision audits | 0 / 0 |
| Asset barcode history | 18 / 18 |
| RFID assignments | 2 / 2 |
| Inventory movements | 62 / 62 |

`OFFICIAL_DB_BUSINESS_DELTA = 0` and `OFFICIAL_DB_WRITES = 0`.

## Disposable clone proof

The clone was created from a read-only `pg_dump` of the official database. Its runtime baseline was:

| Relation/authority | Baseline | Final |
|---|---:|---:|
| Assets | 18 | 18 |
| `asset_revisions` | 0 | 6 |
| `asset_revision_changes` | 0 | 7 |
| Asset events | 65 | 71 |
| `ASSET_REVISION_RECORDED` events | 0 | 6 |
| Audit logs | 136 | 142 |
| Revision audit rows | 0 | 6 |
| C2C2 idempotency rows | 0 | 6 |
| Barcode history | 18 | 18 |
| RFID assignments | 2 | 2 |
| Inventory movements | 62 | 62 |

The intended deltas are revision header/change rows, one event and one audit row per successful revision, and one idempotency row per successful key. Rejected requests did not leave revision, change, event, audit, or idempotency rows.

## Asset identity assertions

- Barcode remained `GWRNG21000001`.
- Operational status remained `AVAILABLE`.
- Branch remained `BRA-1787464306683`.
- Asset count remained 18.
- Duplicate revision number count: 0.
- Duplicate revision idempotency identity count: 0.
- Revision without its event: 0.
- Revision without its audit row: 0.
- Barcode/RFID/movement deltas: 0.

## Trigger proof

On the disposable clone only:

- `UPDATE asset_revisions ...` failed with `Asset revision history is immutable`.
- `DELETE FROM asset_revision_changes ...` failed with `Asset revision history is immutable`.
- Final counts remained `asset_revisions = 6`, `asset_revision_changes = 7`.

No immutability attempt was made against `darfus_erp`.

