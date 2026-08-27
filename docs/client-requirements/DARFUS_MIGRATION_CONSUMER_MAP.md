# Migration Consumer Map

| Consumer | Source | Disposition |
|---|---|---|
| Local Compose backend | `docker-compose.yml:67` | automatic canonical chain restored |
| Backend package | `backend/package.json:9-10` | canonical command restored; safe command retained |
| Dockerfile | `backend/Dockerfile:23` | unchanged `CMD ["npm","start"]`; Compose owns chain |
| Acceptance guard | `backend/scripts/acceptance-migration-guard.js` | retained controlled rehearsal only |
| Safe wrapper | `backend/scripts/migrate-safe.js` | retained manual target-verified rehearsal |
| Reset/seed scripts | `backend/scripts/reset-database.js`, package scripts | not invoked |

No Render environment, deployment, seed, reset, or production consumer was run.

