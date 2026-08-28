# UX-11 Main DB Safety

Read-only verification against the official database returned `current_database=darfus_erp`, user `postgres`, and stable observed counts: `journal_entries=71`, `journal_lines=192`, `cash_transactions=49`, `idempotency_requests=157`. No UX11 business DB write, migration, seed, cleanup, or mutation was executed.

