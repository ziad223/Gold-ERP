# Disposable Clone Baseline

| Field | Evidence |
|---|---|
| Source | `darfus_c2c1s_migration_guard_01` (Disposable) |
| New clone | `darfus_migration_startup_restore_20260827_01` |
| Clone method | PostgreSQL `CREATE DATABASE ... TEMPLATE ...` after absence check |
| Identity | `current_database()` returned the new clone name; user `postgres` |
| Meta | 92 rows |
| Pending | 1 exact migration |
| Business baseline | companies/branches/users/POs/assets/journals/gift_vouchers all 0 |

The official database was not the mutation target.

