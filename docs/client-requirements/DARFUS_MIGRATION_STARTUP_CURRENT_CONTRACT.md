# DARFUS Migration Startup — Current Contract

Control: `DARFUS-MIGRATION-STARTUP-CONTRACT-RESTORATION-01`

Before restoration, the worktree diff showed `docker-compose.yml:67` as
`command: npm start` and `backend/package.json:9` as
`db:migrate = node scripts/migrate-safe.js`. The restored contract is:

`npm run db:migrate` → canonical Sequelize CLI migration runner → success → `npm start`.

`backend/package.json:10` remains `db:migrate:safe = node scripts/migrate-safe.js`.
The Compose chain uses `&&`, so a migration failure blocks application start.

