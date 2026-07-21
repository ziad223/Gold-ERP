# Deployment Runbook — Parameterized and Tag-Gated

## Preconditions

Set placeholders outside Git: `<REMOTE>`, `<SERVER>`, `<TAG>`,
`<PREVIOUS_TAG>`, `<BACKUP_DIR>`, `<SERVICE_BACKEND>`, and
`<SERVICE_FRONTEND>`. Never substitute secrets into this document.

1. Local: prove `git status --short` is clean except recorded approved artifacts;
   validate exact `<TAG>` and publish only after owner approval.
2. Server: fetch; refuse if its worktree is dirty; verify `<TAG>` exists and
   record `git rev-parse <TAG>`.
3. Take and validate a PostgreSQL backup before migrations. Record path, size,
   exit code, and restore-list validation.
4. Inspect migration status and compatibility; do not run destructive/reset/seed
   commands. Build the approved release, restart identified services, then run
   health, DB, Redis/queue, logs, and bounded smoke checks.
5. If a gate fails, stop; restore services to `<PREVIOUS_TAG>` only after
   assessing migration compatibility. Do not run blind `git pull`, force reset,
   or a database restore against an unidentified target.

## Verification record

For every deployment record tag/commit, operator, timestamps, backup evidence,
migration result, service PIDs/status, health URLs, CORS/origin check, smoke
results, log review, rollback decision, and owner approval. Production deploys
require `PRODUCTION-PRECHECK1` and `PRODUCTION-DEPLOY1`; this runbook itself
does not authorize deployment.

Keep local verifier backups unstaged and retain their path, size, `pg_dump`
exit code, and `pg_restore -l` validation result.

Before staging/Production startup, validate server-managed `DATABASE_URL` or
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_SSL`.
Missing, malformed, or conflicting targets are a stop condition.

## Local verifier evidence boundary

`e3215f9` is verifier infrastructure only. The adopted local DB backup passed `pg_restore -l`; no restore, migration, reset, seed, or deployment ran. Do not treat this as deployment approval while MR1-F003, MR1-F014, or MR1-F015 remains open.

`4fbb977` removes the bootstrap 5433 target fallback through the shared ENV resolver. The resolved local verifier target remains `::1:5432/darfus_erp`; permission baseline reconciliation remains a release gate.

## Permission baseline upgrade record

For any future server upgrade, preserve the canonical permission contract: 128 exact v1.0.0 slugs; the three sales-adjustment rows are required; the nine branch/customer/supplier lifecycle rows remain active because routes enforce them. Run only the forward migration `20260721010000-reconcile-canonical-permission-baseline.js` after the normal server backup/identity gate. It inserts missing sales rows and absent grants for built-in system roles only; custom roles, direct grants, direct denials and historical rows are not reset or deleted. Do not use a broad permission seed or manually delete lifecycle permissions. Validate the exact set, no orphan role grants, and role policy before service restart.
