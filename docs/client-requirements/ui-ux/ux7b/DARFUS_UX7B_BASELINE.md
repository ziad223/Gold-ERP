# UX7B Baseline

Captured: `2026-08-28T16:12:55Z`–`2026-08-28T16:14:30Z`

| Item | Evidence |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Tracked modified count before UX7B docs | 132 (pre-existing worktree state) |
| Untracked count before UX7B docs | 5520 (pre-existing worktree state) |
| Stash count | 11 |
| Generated drift | `.tmp-count-browser-r5/next-env.d.ts` was already untracked; not edited |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8000` |
| Frontend GET | `/ar/customers` = 200 |
| Backend health | `/api/v1/health` = 200 |
| DB health | `/api/v1/health/db` = 200 |
| Redis health | `/api/v1/health/redis` = 200 |
| Gold health | `/api/v1/health/gold` = 200; HEALTHY, AED, fresh at observation |
| Production source changed by UX7B | 0 |

No reset, restore, clean, checkout, stash, build, restart, or mutation was performed.
