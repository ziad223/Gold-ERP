# UX5B Main DB Safety

Official identity was read-only verified as `current_database() = darfus_erp` before evidence. The live POS was only searched and one existing available asset was selected in browser-local state; no checkout or mutation endpoint was invoked. The populated fixture had no API connection.

`MAIN_DB_POS_CHECKOUTS = 0`; `MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`; `MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`; `MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`.
