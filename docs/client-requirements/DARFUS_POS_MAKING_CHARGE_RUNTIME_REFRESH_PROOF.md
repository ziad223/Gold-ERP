# DARFUS POS Making Charge — Runtime Refresh Proof

بالعربي: تمت إعادة تهيئة backend فقط بالطريقة المدعومة، مع إثبات أن startup لا يشغّل migrations أو bootstrap على `darfus_erp`. لم يتم تشغيل build للـfrontend لأن تعليمات runtime الحالية تحمي `next-env.d.ts` وتمنع build غير المصرح.

## Preflight

| Check | Evidence | Result |
|---|---|---|
| Correct source files present | POS page, POS hook, `erp.routes.js`, focused test all exist and contain the correction | PASS |
| Git safety | HEAD `1657b0e9ba580faef69be48f04637835c201b521`; dirty worktree preserved; no reset/clean/stash | PASS |
| Backend command | `docker-compose.yml` uses `command: npm start` | PASS |
| Automatic migrations | `backend/src/server.js` authenticates only; no migration call; startup log says runtime admin bootstrap skipped | PASS / `AUTO_STARTUP_MIGRATION_TO_MAIN=NO` |
| Official target before refresh | `DB_NAME=darfus_erp`, `current_database()=darfus_erp` | PASS |
| Services before/after | `darfus-backend`, `darfus-postgres`, `darfus-redis` running | PASS |

## Backend refresh

Command used:

```text
docker compose up -d --build backend
```

This rebuilt/recreated only the backend service. No migration command, seed, fixture, checkout, or frontend process was started.

Post-refresh logs:

```text
Database connection established successfully.
[Bootstrap] Runtime admin bootstrap skipped; use an explicit local setup command.
[ReservationExpiry] scheduler disabled for this environment.
[GoldMarketRuntime] scheduler registered queue=gold-market-refresh schedules=1
```

Backend container start: `2026-08-26T16:37:52.716568783Z`.

| Endpoint | Status |
|---|---:|
| `GET http://localhost:8000/api/v1/health` | 200 |
| `GET http://localhost:8000/api/v1/health/db` | 200 |
| `GET http://localhost:8000/api/v1/health/redis` | 200 |
| `SELECT current_database()` through backend | `darfus_erp` |

## Frontend parity finding

The existing process on port 3000 is `next start` (PID 3468), not a new instance. The served process started before the correction. `.next/BUILD_ID` was last written at `2026-08-26 09:05:03`, while the corrected POS source was last written at `2026-08-26 19:19:51`. Served `/ar/pos` and `/en/pos` returned HTTP 200 but did not contain the new eligible-weight text.

```text
FRONTEND_RUNTIME_PARITY = BLOCKED_STALE_NEXT_BUILD
FRONTEND_REFRESH = NOT_RUN
BUILD = NOT_RUN_BY_CURRENT_RUNTIME_GUIDANCE
```

No Next dev process was started and `next-env.d.ts` was not edited.

