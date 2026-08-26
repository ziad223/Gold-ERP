# DARFUS ERP — C2C3 Browser / DB Proof

## Official DB safety

`darfus_erp` remained read-only. The final read-only baseline observed before the C2C3 browser gate was:

| Entity | Count |
|---|---:|
| Assets | 18 |
| Asset Revisions | 0 |
| Revision Changes | 0 |
| Asset Events | 65 |
| Inventory Movements | 62 |
| Journal Entries | 25 |
| Barcode History | 18 |
| RFID Assignments | 2 |

No C2C3 browser mutation ran, so the expected official delta remains zero. A post-browser delta query was not run because browser acceptance was correctly stopped before runtime execution.

## Disposable runtime

C2C2 disposable backend `http://localhost:8001` on `darfus_c2c2_revision_runtime_02` was preserved. C2C3 did not add new rows to it because the frontend runtime-parity gate stopped before browser acceptance.

## Required post-acceptance assertions

When the protected runtime drift is resolved by Owner decision, the browser run must compare before/after for: `asset_revisions`, `asset_revision_changes`, `assets`, `asset_events`, `asset_barcode_history`, `asset_rfid_assignments`, `inventory_asset_movements`, `journal_entries`, purchase cost revisions, current valuations, and invoice links. Only the approved Revision rows/event/audit/idempotency record may change in the disposable DB.

