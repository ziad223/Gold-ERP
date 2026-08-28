# UX7C Baseline

Captured: `2026-08-28T16:17Z`–`2026-08-28T16:20Z`.

| Item | Evidence |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8000` |
| Frontend GET | `/ar/customers` = 200 in main browser; direct clean session redirected to login |
| Main DB | `SELECT current_database()` = `darfus_erp` |
| Production source changed by UX7C | 0 |
| Test files changed by UX7C | 0 |
| Migrations | 0 |

Pre-existing worktree drift and generated `.tmp-count-browser-r5/next-env.d.ts` were preserved. No reset, restore, clean, checkout, stash, build, restart, or production contact was performed.
