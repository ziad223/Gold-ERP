# UX-9 Main DB Safety

Target identity was read-only verified as `darfus_erp` / PostgreSQL. No UX-9 business request was submitted and no migration, seed, account mapping, journal, treasury, tax, inventory, or Gift Voucher write was executed.

Read-only current counts captured after the proof: `journal_entries=71`, `journal_lines=192`, `cash_transactions=49`, `idempotency_requests=157`. These are observation values, not UX-9-created records. The pre-existing dirty worktree was preserved.
