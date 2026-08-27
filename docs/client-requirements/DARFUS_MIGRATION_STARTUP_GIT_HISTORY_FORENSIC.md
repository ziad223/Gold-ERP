# Git History Forensic

`git show HEAD:backend/package.json` and `git show c7a71c0:backend/package.json`
both prove `"db:migrate": "sequelize db:migrate"`. `git show HEAD:docker-compose.yml`
proves `sh -c "npm run db:migrate && npm start"`.

Package history is `074964e3`, `9195eb2`, `2728942`, `c7a71c0`. There is no
reachable Git history for `backend/scripts/migrate-safe.js`; it is an uncommitted
worktree file. Therefore `INTRODUCING_COMMIT` is recorded as
`UNCOMMITTED_WORKTREE_CHANGE (no introducing commit in reachable Git history)`.
No history was rewritten and no destructive Git command was used.

