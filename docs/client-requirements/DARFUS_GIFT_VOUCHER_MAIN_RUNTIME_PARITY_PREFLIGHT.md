# DARFUS Gift Voucher Main Runtime Parity — Preflight

Control: `DARFUS-GIFT-VOUCHER-MAIN-RUNTIME-PARITY-RECOVERY-01`
Date: 2026-08-27
Mode: `OWNER_AUTHORIZED_RUNTIME_PARITY_RECOVERY_ONLY`

## Scope and safety

This was a read-only parity recovery with the explicitly permitted backend-only
runtime refresh. No voucher issue, activation, redemption, checkout, payment,
journal, inventory, print, migration, seed, or database business write was
performed.

| Check | Result | Evidence |
|---|---|---|
| Official DB target | PASS | `SELECT current_database(), current_user` returned `darfus_erp\|postgres` before and after refresh |
| Main backend | PASS | `darfus-backend`, `npm start`, port 8000 |
| Main frontend | PASS | Existing `http://localhost:3000` only; no second frontend started |
| PostgreSQL / Redis | PASS | Health endpoints returned 200 after refresh |
| Auto migration | PASS / not observed | `server.js` has no normal startup migration runner; startup logs show connection/bootstrap/listen only |
| Business mutation | NOT RUN | No mutation endpoint was called in this control |
| Production | NOT CONTACTED | Only local main URLs were used |

## Pre-refresh baseline

The prior official acceptance attempt was preserved as evidence. It failed
before persistence with HTTP 403 from the stale process, and its read-side list
request returned HTTP 500. The prior business counts were retained as the
comparison baseline; the known acceptance Asset was
`AST-PUR-1787087436118-1-1-1v4x` / `GWPND21000001`.

## Gate decision

The preflight passed for a backend-only refresh. The refresh did not authorize
or include a business retry.
