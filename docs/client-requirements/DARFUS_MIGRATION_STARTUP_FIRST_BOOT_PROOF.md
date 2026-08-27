# First Boot Proof

With explicit `DB_NAME=darfus_migration_startup_restore_20260827_01`, the
restored `npm run db:migrate && npm start` chain applied migration 93 and started
the API on isolated port 8010. `GET /api/v1/health` returned HTTP 200 with
`status=UP`. After boot, `SequelizeMeta=93`, `gift_vouchers=0`, `companies=0`,
and `users=0`. The log showed PostgreSQL/Redis connection and listening on 8010.

`AUTO_STARTUP_MIGRATION_CLONE = PASS`.

