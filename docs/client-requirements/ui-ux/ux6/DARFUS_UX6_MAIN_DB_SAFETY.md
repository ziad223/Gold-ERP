# UX-6 Main DB Safety

- Read-only identity proof: `SELECT current_database()` on the local PostgreSQL service returned `darfus_erp`.
- Official DB writes: `0`.
- Business receive/sale/transfer/adjustment/count/repair mutations: `0`.
- No migration, seed, backup restore, cleanup, or direct SQL mutation was run.
- Browser proof used existing authenticated read/list/detail requests; no business POST/PUT/PATCH/DELETE was executed.
- The pre-existing frontend/backend processes were observed; no new acceptance server was started.

