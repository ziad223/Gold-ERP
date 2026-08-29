# UX-12B Network and DB Safety

Read-only health GETs returned 200 for backend, DB, Redis and Gold. `SELECT current_database()` returned `darfus_erp`. Counts remained PO 19, PO items 19, assets 23, asset components 13, movements 81, journal entries 72, journal lines 195 and idempotency requests 160, matching UX-12 baseline. Control-owned business mutating requests: 0; financial writes: 0; inventory writes: 0.
