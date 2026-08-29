# UX-12 Network and DB Safety

Read-only GET health checks: backend health 200, DB health 200, Redis health 200, Gold health 200, frontend dashboard 200. Official DB identity was `darfus_erp`. Before/after read-only counts were identical: purchase_orders 19, purchase_order_items 19, assets 23, asset_components 13, inventory_asset_movements 81, journal_entries 72, journal_lines 195, idempotency_requests 160. No business POST/PUT/PATCH/DELETE was issued.
