# Gift Voucher Official Promotion — Post-promotion Integrity

The same official PostgreSQL connection was used for before/after comparison.

| Entity | Before | After | Delta | Classification |
|---|---:|---:|---:|---|
| `SequelizeMeta` | 92 | 93 | +1 | Expected schema metadata |
| `gift_vouchers` | 0 | 0 | 0 | No business rows |
| `payments` | 3 | 3 | 0 | No business delta |
| `journal_entries` | 29 | 29 | 0 | No financial delta |
| `journal_lines` | 81 | 81 | 0 | No financial delta |
| `cash_transactions` | 11 | 11 | 0 | No treasury delta |
| `inventory_asset_movements` | 70 | 70 | 0 | No inventory delta |
| `audit_logs` | 189 | 189 | 0 | No business audit delta |
| `idempotency_requests` | 105 | 105 | 0 | No command/idempotency delta |
| `invoices` | 3 | 3 | 0 | No invoice delta |
| `invoice_items` | 3 | 3 | 0 | No invoice delta |

New `gift_voucher_branch_eligibilities` and `gift_voucher_print_events` tables
are empty. No default Voucher, Payment, Journal, Cash, Inventory, or Invoice rows
were created. The historical `PURCHASE-ORDER-UNBALANCED-JOURNAL-001` and Pearl
issue `GV-I-001` were not changed.

`OFFICIAL_BUSINESS_WRITES_BY_MIGRATION=0`,
`OFFICIAL_FINANCIAL_DELTA_BY_MIGRATION=0`,
`OFFICIAL_INVENTORY_DELTA_BY_MIGRATION=0`, and
`OFFICIAL_DB_POST_MIGRATION_INTEGRITY=PASS`.
