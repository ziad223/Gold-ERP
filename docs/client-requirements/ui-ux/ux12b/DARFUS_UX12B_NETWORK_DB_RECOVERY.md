# UX-12B Network and DB Recovery

Read-only health endpoints returned 200 for backend, DB, Redis and Gold. `SELECT current_database()` returned `darfus_erp`. Counts remain purchase_orders 19, purchase_order_items 19, assets 23, inventory_asset_movements 81, journal_entries 72, journal_lines 195 and idempotency_requests 160. Control-owned business, financial and inventory writes: 0.
