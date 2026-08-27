# Gift Voucher Mapping — Official Delta

Database: `darfus_erp`

Expected and observed promotion delta:

| Entity | Before | After | Delta | Expected |
|---|---:|---:|---:|---:|
| `system_account_roles` total | 26 | 28 | +2 | +2 mapping rows |
| `GIFT_VOUCHER_LIABILITY` role rows | 0 | 2 | +2 | +2 |
| `gift_vouchers` | 0 | 0 | 0 | 0 |
| `invoices` | 3 | 3 | 0 | 0 |
| `payments` | 3 | 3 | 0 | 0 |
| `cash_transactions` | 11 | 11 | 0 | 0 |
| `journal_entries` | 29 | 29 | 0 | 0 |
| `inventory_asset_movements` | 70 | 70 | 0 | 0 |
| `asset_events` | 74 | 74 | 0 | 0 |
| company Tax settings | 12 | 12 | 0 | 0 |

`OFFICIAL_MAPPING_DELTA = EXACT_EXPECTED`.
`OFFICIAL_BUSINESS_DELTA = 0`.
`OFFICIAL_FINANCIAL_TRANSACTION_DELTA = 0`.
`OFFICIAL_INVENTORY_DELTA = 0`.
`OFFICIAL_TAX_DELTA = 0`.

## Later read-only observation

The promotion checkpoint was exact, but a later read-only query found an external official Voucher issue and lifecycle activity: `gift_vouchers` 1, `journal_entries` 30, `cash_transactions` 12, and `idempotency_requests` 109. This is not part of the mapping delta and is recorded as `GV-UNAUTHORIZED-OFFICIAL-MUTATION-001`; no repair or cleanup was performed.
