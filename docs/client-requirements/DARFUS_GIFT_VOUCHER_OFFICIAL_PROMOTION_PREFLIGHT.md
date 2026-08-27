# Gift Voucher Official Promotion — Preflight

Control: `DARFUS-GIFT-VOUCHER-CONTROLLED-OFFICIAL-MIGRATION-PROMOTION-01`

| Check | Evidence | Result |
|---|---|---|
| Owner scope | Attached Owner authorization explicitly limits this control to official Gift Voucher schema promotion | PASS |
| Official target | Same PostgreSQL service connection returned `current_database()=darfus_erp`, `current_user=postgres` | PASS |
| Pre-migration meta | `SequelizeMeta=92`; target absent | PASS |
| Pending set | Exactly `20260827010000-gift-voucher-purchased-foundation.js` | PASS |
| Active non-SELECT writes | `pg_stat_activity` check returned `0` | PASS |
| Startup migration safety | Normal `npm start` does not invoke a migration runner; admin bootstrap is opt-in only | PASS |
| Product/migration source | Target file is the previously reviewed Worktree file; no prior rehearsal hash was recorded, so parity is recorded with that limitation | PASS WITH LIMITATION |

No business command was run. No Voucher, Payment, Journal, Cash, Inventory, or
Invoice fixture was created.
