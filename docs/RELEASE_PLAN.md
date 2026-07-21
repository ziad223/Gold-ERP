# v1.0.0 Release Plan

## Policy

- Versioning: semantic versions; first market release is `v1.0.0`.
- Tags: immutable annotated `v1.0.0-rc.1`, optional `v1.0.0-rc.2`, then
  `v1.0.0`; deployments use a tag or recorded full commit only.
- Branches: short-lived local feature/fix branches merge only after evidence;
  `main` is not a blind server-pull target.
- Commits: one root cause per commit; no secrets, dumps, generated files, or
  unrelated worktree changes.
- Migrations: additive, reviewed, reversible where possible; no destructive
  migration without backup/rollback plan and owner approval.
- Secrets: environment or secret manager only, never Git, logs, screenshots,
  or release notes.

## Release gates

1. Owner approves the precise release candidate scope.
2. Local backup and verifier adoption/cleanup evidence are current.
3. P1 findings in `FINDINGS_REGISTER.md` are fixed or explicitly deferred by
   owner with a recorded risk decision.
4. Static checks, dependency review, API/financial acceptance, Browser matrix,
   backup restore drill, and staging acceptance pass.
5. Server precheck proves clean worktree, exact tag, backup, health checks,
   migration plan, configured origins/secrets, and rollback target.
6. Owner approves production go/no-go; deployment and monitoring are separate
   phases.

## Rollback and hotfix

Never use blind `git pull` on a dirty server. Rollback is to the previous
recorded tag/commit after restoring service configuration and only after the
pre-deploy backup/migration compatibility is assessed. A hotfix receives its
own branch, regression scope, tag, release note, backup, deployment record,
and post-deploy verification. No calendar date is committed until effort and
environment readiness are measured.

## Local verifier gate

No second QA database is authorized. V0 needs no DB; V2/V3 require the guard,
backup, rollback/cleanup proof; V4/V5 remain excluded pending redesign.

Runtime DB configuration is ENV-driven: `DATABASE_URL` is authoritative when
present, but conflicting DB target variables fail. Staging and Production must
provide explicit valid configuration and fail before connection when absent.

## Verifier redesign gate

Do not claim 66/66 at current HEAD. The local target and backup gate are proven, but permission divergence and the local untracked cleanup artifact block clean scope verification. No deployment or release action is authorized.

## Verifier redesign2 gate

Static 66/66 is restored and the bootstrap script is ENV-contract compliant. Release remains blocked only by permission-baseline reconciliation for the three guarded V3 contracts; no deployment authorization is implied.

## Permission baseline reconciliation gate

This gate is closed locally: source, migrations, adopted local DB, built-in default roles and verifier expectations agree on the exact v1.0.0 128-slug set. Server upgrades must run the forward-only `20260721010000-reconcile-canonical-permission-baseline.js` migration after a validated backup; it is idempotent through migration tracking and never deletes permission or role history on down. This does not authorize staging or Production deployment: dependency, deposit, Browser, staging and owner go/no-go gates remain open.
