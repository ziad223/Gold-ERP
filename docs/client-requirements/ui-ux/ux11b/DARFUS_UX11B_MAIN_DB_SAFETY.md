# Main DB Safety

Read-only health/database evidence returned `current_database = darfus_erp` and `current_user = postgres`. Existing observed counts were journal_entries 71, journal_lines 192, cash_transactions 49, and idempotency_requests 157. UX11B issued no business POST and no SQL write.

`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`; `MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`; `MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`.
