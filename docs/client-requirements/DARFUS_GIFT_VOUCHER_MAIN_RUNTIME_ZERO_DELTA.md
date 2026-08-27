# DARFUS Gift Voucher Main Runtime — Official Zero Delta

Database target: `darfus_erp`  
Identity: `darfus_erp|postgres`

The counts below were read after the backend-only refresh and match the
pre-refresh official business baseline from the prior acceptance evidence.

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `gift_vouchers` | 0 | 0 | 0 |
| `gift_voucher_branch_eligibilities` | 0 | 0 | 0 |
| `gift_voucher_print_events` | 0 | 0 | 0 |
| `invoices` | 3 | 3 | 0 |
| `invoice_items` | 3 | 3 | 0 |
| `payments` | 3 | 3 | 0 |
| `cash_transactions` | 11 | 11 | 0 |
| `journal_entries` | 29 | 29 | 0 |
| `journal_lines` | 81 | 81 | 0 |
| `inventory_asset_movements` | 70 | 70 | 0 |
| `asset_events` | 74 | 74 | 0 |
| `audit_logs` | 189 | 189 | 0 |
| `idempotency_requests` | 105 | 105 | 0 |
| `SequelizeMeta` | 93 | 93 | 0 |

## Acceptance Asset preservation

Read-only lookup for `AST-PUR-1787087436118-1-1-1v4x` returned:

- Barcode: `GWPND21000001`
- Profile: `GOLD_BY_WEIGHT_JEWELLERY`
- Status: `available`
- Operational status: `AVAILABLE`
- Branch: `BRA-1787464306683`
- Location: `LOC-2ca3af2d-e01a-454c-a625-4951d0925927`
- Final purchase cost: `2866.5100`
- Cost: `2866.50869040`
- Price: `4314.00000000`
- Deleted: `NULL`

Result: `ACCEPTANCE_ASSET_STATE = AVAILABLE_UNCHANGED`.

`OFFICIAL_BUSINESS_DELTA = 0`, `OFFICIAL_FINANCIAL_DELTA = 0`, and
`OFFICIAL_INVENTORY_DELTA = 0`. No direct business UPDATE/DELETE/INSERT was
used.
