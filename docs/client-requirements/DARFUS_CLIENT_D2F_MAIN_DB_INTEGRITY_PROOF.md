# D2F Main DB and Runtime Integrity Proof

## Main DB

| Check | Result |
|---|---|
| current_database/current_user | darfus_erp / postgres |
| gift_vouchers | 0 |
| invoices | 1 |
| payments | 1 |
| journal_entries | 25 |
| journal_lines | 67 |
| assets | 18 |
| inventory_asset_movements | 62 |
| invoice_print_events | 0 |
| idempotency_requests | 100 |
| gift-related journal rows | 0 |
| gift-related audit rows | 0 |

No D2F source, test, migration, seed, or business DB write was executed.

## Main runtime

- GET /api/v1/health = 200.
- GET /api/v1/health/db = 200.
- GET /api/v1/health/redis = 200.
- Unauthenticated GET /api/v1/invoice-projection/sources = 401, proving permission protection; no authenticated activation call was made.
- Backend container is running on localhost:8000; PostgreSQL is 5433→5432; Redis is healthy.
- The current projection registry remains six active sources; Gift Voucher is future/inactive in source and UI.

MAIN_DB_CHECK = PASS_READ_ONLY
MAIN_RUNTIME_CHECK = PASS_HEALTH_ONLY
DISPOSABLE_ACCEPTANCE = NOT_RUN_GATE_A_BLOCKED
OFFICIAL_BUSINESS_DELTA_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
OFFICIAL_PRINT_EVENT_DELTA_BY_CONTROL = 0

