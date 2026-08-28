# UX-6B Main DB Safety

`SELECT current_database()` returned `darfus_erp`. No business request, print mutation, Asset mutation, barcode mutation, database write, migration, seed, or cleanup was performed. Browser steps were GET/read-only plus theme/viewport changes; the print button was not activated.

`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`
`MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`
`MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`

