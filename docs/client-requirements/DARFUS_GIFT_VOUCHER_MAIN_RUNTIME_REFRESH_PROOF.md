# DARFUS Gift Voucher Main Runtime — Refresh Proof

## Authorized action

Only the normal `darfus-backend` service was restarted. PostgreSQL, Redis, and
the frontend were not restarted. No migration command or business endpoint was
run.

## Result

| Proof | Result | Evidence |
|---|---|---|
| Backend restarted | PASS | `docker inspect`: started `2026-08-27T11:46:27.857708103Z`, state `running` |
| PostgreSQL connection | PASS | startup log: `Database connection established successfully` |
| Redis connection | PASS | startup log: `Successfully connected to Redis` |
| Automatic admin bootstrap | SKIPPED | startup log: `Runtime admin bootstrap skipped; use an explicit local setup command.` |
| Listening endpoint | PASS | startup log: `Listening on Port: http://localhost:8000` |
| Automatic migration | NOT OBSERVED | no migration/sequelize migration execution lines; current `server.js` has no normal migration runner |
| Route source parity | PASS | host/container hashes match in `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_SOURCE_IDENTITY.md` |

## Root cause

`GV-E-008` / `GV-I-003` was caused by a stale Node process retaining the old
fail-closed module while the bind-mounted source had the current route. The
backend-only refresh loaded the current source. This is classified as
`ENVIRONMENT_CONFIG / RUNTIME_PARITY`, not a Gift Voucher business-rule change.
