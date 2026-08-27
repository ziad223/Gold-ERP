# Gift Voucher Financial Mapping — Official Zero Delta

Database: `darfus_erp`

The failed official retry was not replayed. The prior before/after read-only comparison for the single failed attempt was unchanged:

| Entity | Before | After | Delta |
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

`OFFICIAL_DB_BUSINESS_DELTA = 0`.
`OFFICIAL_DB_FINANCIAL_MAPPING_DELTA = 0`.
`FAILED_POST_REPLAYED = NO`.

