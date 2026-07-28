# Deployment Runbook — Parameterized and Tag-Gated

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3 — deployment prohibition — 2026-07-29

The pre-existing 3000/8000 local runtime remains untouched. A deterministic
customer-discovery enhancement is static-test proven, but no authenticated
customer-financial browser evidence was collected because process-scoped
credential injection was denied before harness launch. Do not substitute a
browser-form login, create data, deploy, or authorize `NOTIF-ACCEPT`. Resume
only via `BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1` with a compliant credential
transport boundary.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT2 — deployment prohibition — 2026-07-29

The local 51/0 runtime was reused without restart. The Branch transition fix
is source/test proven and its isolated core A→B browser window has zero
`BRANCH_CONTEXT_REQUIRED`, transient 401/403/422, duplicate notification
list/unread/SSE, or notification error-toast observations. Do not treat that
as release acceptance: customer invoice/statement/credit A→B and refresh were
not observable because no safe existing profile was available. No data
creation, fallback, migration, deployment, Staging or Production action is
authorized. Keep `NOTIF_ACCEPT_AUTHORIZED = NO` pending
`BRANCH-CONTEXT-RUNTIME-FIX-CONT3`.

## Local migration reconciliation — 2026-07-28

The official local development database now has 51 applied / 0 pending source
migrations following the user's authorized local migration. Registry and
schema verification passed. Treat this only as the local baseline for the
next Branch repair; it is not a Staging migration rehearsal, RC approval, or
Production deployment authorization. Do not replay or roll back migration 51
in the local runtime.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT1 — release boundary — 2026-07-28

Do not progress to `NOTIF-ACCEPT`, Staging, RC, or Production while
`BRANCH-CONTEXT-RUNTIME-FIX-CONT1` is partial. Read-only customer profile
evidence passed for invoice, statement-v2 and credit with both context
headers, but a normal Branch A→B transition emitted three fail-closed
`BRANCH_CONTEXT_REQUIRED` responses and invalidated the Branch context. The
required repair is only the pre-ready Branch transition race; do not replace
the fail-closed backend contract or introduce a fallback.

## Branch context release boundary — 2026-07-28

Do not deploy this Branch-context change from static coverage alone. The
frontend now validates a persisted Branch candidate against server-authorized
Branches before adding `X-Branch-ID`, and customer financial queries wait for
that READY state. The existing local runtime passed N5/N8, A→B and logout
checks, but invoice/statement/credit navigation remains unobserved because no
safe customer exists for the approved identity. Release/RC authorization is
therefore still prohibited pending `BRANCH-CONTEXT-RUNTIME-FIX-CONT1` and then
`NOTIF-ACCEPT`. No database migration, data repair, fallback or manual header
injection is an approved substitute.

## COMPANY-CONTEXT-RUNTIME-FIX runtime gate — 2026-07-28

The local single-Company runtime gate is accepted: N5/N8 automatic bootstrap,
Branch bootstrap, list/unread/SSE, Branch A→B and logout passed on the existing
localhost runtime. Scoped REST/SSE carried Company context after READY and all
observed Company-context failures, reconnects and notification error toasts
were zero. No selector/fallback, backend authorization relaxation, migration,
or official database mutation occurred.

This authorizes `NOTIF-ACCEPT` only. `RELEASE_READY = NO`; no deployment,
Staging or Production action is authorized until all remaining release gates
are complete.

## RELEASE-GAP-FIX-1-CONT2 deployment boundary — 2026-07-28

Do not deploy. The external-runtime harness safely reused the existing local
frontend/backend and left both running, resolving the local Next lock
infrastructure boundary. The authenticated Product run did not reach the
single-Company READY/display state after successful context-free bootstrap, so
N5 fails and N8, notification/SSE and logout acceptance remain unobserved.
No Company fallback, database mutation, migration, deployment or process stop
is authorized. Resolve `COMPANY-CONTEXT-RUNTIME-FIX` before `NOTIF-ACCEPT`.

## Release-gap audit hold — 2026-07-28

Deployment is on hold. `RELEASE-GAP-AUDIT = COMPLETE` and `RELEASE_READY = NO`.
Do not use the legacy `ADMIN_*` first-admin guidance/defaults in
`README_DEPLOYMENT.md` or `docker-compose.yml` as a deployment procedure: the
accepted product contract is guarded, one-time First Run setup, not runtime
automatic admin creation. Do not apply the pending migration to the official
local database.

Before any Staging action: repair and run the local browser harness, accept
N5/N8 and notifications, complete full regression, correct the deployment
material, rehearse migration 51 with backup/rollback, and obtain explicit
owner approval. Before Production: additionally complete a restore drill,
retention/RPO/RTO ownership, dependency review, storage controls, monitoring
and capacity evidence. `RELEASE_GATE_WAIVED = NO`.

### Harness infrastructure boundary — 2026-07-28

The local owned harness now opens and closes its log streams safely, but its
backend child emits `HARNESS_CHILD_SPAWN_EINVAL` before readiness. No backend
or frontend listener, deployment target, migration or official database action
occurred. Do not treat this local launcher repair as N5/N8 or deployment
acceptance; resolve only the child-spawn boundary first.

### Harness workspace-lock boundary — 2026-07-28

The child-spawn `EINVAL` is resolved: backend readiness passes through the
direct-Node harness launcher. The authenticated run is blocked earlier than
Product acceptance because an unknown existing Next dev process holds the
workspace development lock and prevents the owned frontend from reaching 3300.
Do not stop or repurpose that process in deployment work; resolve the local
owned-frontend lock boundary before claiming N5/N8 or notification acceptance.

## ERROR-CONTRACT deployment boundary — 2026-07-28

Before any future RC, verify errors use the canonical `success:false/error` envelope, retain stable domain codes, carry only a safe request ID, and expose neither SQL/SQLSTATE/stack nor PII/secrets. Do not treat generic 500 text or request IDs as authorization material. This implementation has static/HTTP contract evidence only; deferred N5/N8 browser runtime, `NOTIF-ACCEPT`, full regression and all existing release gates remain mandatory. No deployment is authorized.

## FIRST-RUN acceptance completed in isolation — 2026-07-28

The prior first-run acceptance defects are resolved and accepted only on disposable local PostgreSQL databases. The transaction advisory lock now protects bootstrap without aggregate row locks; development query rendering is disabled by default and central redaction protects auth/setup/database values. Clean bootstrap, retry, concurrency, rollback, login/logout and registration closure passed. The official database remains 50 applied / 1 pending source migration and was not changed.

This is not deployment authorization. `ERROR-CONTRACT`, deferred browser N5/N8 acceptance, `NOTIF-ACCEPT`, full regression and the remaining release gates still precede RC, Staging and Production.

## FIRST-RUN-ACCEPT deployment prohibition — 2026-07-28

Do not deploy the first-run bootstrap implementation. Isolated PostgreSQL acceptance proved that the valid bootstrap reaches a database error before any setup row is created: the locked setup-state resolver applies `FOR UPDATE` to aggregate counts, which PostgreSQL rejects (`SQLSTATE 0A000`). It also proved that development Sequelize query logging can emit a submitted setup email to the owned log. The disposable database and temporary evidence were removed; the official database was not migrated or changed.

`FIRST-RUN-ACCEPT = BLOCKED`; `FIRST-RUN-FIX-CONT1_AUTHORIZED = YES`. Correct the exact transaction-lock and log-redaction defects, then repeat clean isolated acceptance. No Staging or Production authorization exists.

## FIRST-RUN-FIX deployment boundary — 2026-07-28

Do not deploy this implementation yet. A new forward-only `first_run_setup_states` migration is present but intentionally was not applied to the official local database. On a future accepted deployment, provide a high-entropy `FIRST_RUN_SETUP_TOKEN` through the deployment secret channel only; never place it in source, `.env.example`, browser storage, URL, logs, or screenshots. Missing token fails closed. The setup POST uses `X-First-Run-Setup-Token` and `Idempotency-Key`, is rate-limited, and becomes unavailable after READY.

The operator must use `/{locale}/setup` only when authoritative status is `SETUP_REQUIRED`. READY, recovery, and multi-Company conflict must not be bypassed; partial data requires the separately authorized recovery process. Public `/auth/register` remains 410. `FIRST-RUN-ACCEPT`, deferred N5/N8 browser evidence, and `NOTIF-ACCEPT` remain required before any RC. No Staging/Production authorization exists.

## FIRST-RUN-PRE1 deployment prohibition — 2026-07-28

Do not deploy a fresh installation using a manual SQL user/role mutation. The Product has no approved first-user bootstrap yet: public registration is disabled, startup is non-mutating by default, and System Accounts needs an existing Super Admin.

`FIRST-RUN-FIX` must provide a one-time deployment-secret-gated transaction that creates the first Super Admin through canonical services, exactly one Company, at least one Branch and validated financial mappings, then disables bootstrap. Partial/conflicting data must enter guarded recovery, not auto-healing. Local uses explicit process-scoped setup authorization; Staging/Production fail closed without deployment-secret authorization, HTTPS/browser safeguards and `FIRST-RUN-ACCEPT`. See `docs/FIRST_RUN_BOOTSTRAP_DESIGN.md`.

This is a design-only record: no setup, credential, migration, database, runtime, deployment or remote action occurred.

## CONT5 C10 release stop — 2026-07-26

Do not deploy. `4079836` closes the Super Admin implicit-company defect only.
The local C10 matrix and zero-residue cleanup passed, but configuration,
reconciliation, orphan/cross-scope, and rollback acceptance remains incomplete.
No Staging, Production, remote or deployment action is authorized.

## CONT5 C9 release stop — 2026-07-26

Do not deploy. Super Admin lacks the required explicit-company fail-closed guard
for operational financial routes. No C9 live fixture, schema, source, migration,
configuration, Staging, Production, remote, or deployment action was taken.
Repair and focused regression in `DEPOSIT-1-FIX-CONT5-CONT10` are required before
the remaining CONT5 acceptance matrix can resume.

## CONT5 C8 release stop — 2026-07-26

Do not deploy. C8 formally proves R2 only; Super Admin, configuration,
reconciliation/orphan-audit and rollback acceptance remains.

## CONT5 C7 release stop — 2026-07-26

Do not deploy. C7 closes only R1 race and bounded inactive-Employee evidence;
Super Admin, configuration, reconciliation and rollback acceptance remains.

## CONT5 C6 release stop — 2026-07-26

Do not deploy. C6 closed refund idempotency and validation evidence only;
race, context, configuration, reconciliation and rollback acceptance remain.

## CONT5 C5 release stop — 2026-07-26

Do not deploy. Refund-route Employee/direct-deny middleware is proven, but
idempotency/race, configuration, reconciliation and rollback requirements are
not. Run only `DEPOSIT-1-FIX-CONT5-CONT6`; no Staging, Production, remote or
deployment action is authorized.

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

## Formal local verifier evidence

`BRANCH-1-VERIFIER-VALIDATE1` and CONT1 created fresh local backups and proved 66 static/readiness PASS, six guarded V3 PASS, V2 rollback PASS, and V4/V5 refusal. CONT1 classified `B1VV-F001` as an optional Phase 32.4 historical demo-snapshot probe: it still honestly fails without that old 20-Asset snapshot, but is not a mandatory Branch-1 Product/release gate. This remains local test/demo evidence only and does not authorize server access or deployment.

## Reservation-deposit deployment stop

Do not deploy the current reservation-deposit workflow. `DEPOSIT-1-DIAG-CLOSE`
proves raw refund treasury authority, hard-coded receipt account selection,
CashRegister bypass, and missing branch mappings/sessions in the local baseline.
First complete `DEPOSIT-1-FIX` and its transactional financial acceptance; then
record mapping/readiness, cash-session, rollback, and reconciliation evidence in
the normal staging/RC process. This diagnosis does not authorize any server,
staging, remote database, or Production action.

## v1.0.0 deposit application policy

Server rollout must preserve the owner-approved contract: Reservation Advance is
applied only by `complete-sale` to its final invoice; no pre-sale application or
existing-invoice allocation is authorized. Before future deployment, verify
branch mappings, receipt/refund journals, net-deposit settlement, final-invoice
application rows, exactly-once sale posting, and refund/completion serialization.

## Dashboard/reservations schema boundary

Local evidence on 2026-07-25 applied only existing forward migration
`20260721020000-branch-reservation-deposit-financial-settings.js` after a
validated local backup; it is not a deployment record. Any server release must
repeat server identity/backup gates, inspect the ordered pending set, and obtain
explicit approval. Do not apply receipt migration `20260721030000` merely to
restore reservation reads. Production, Staging, and remote targets were not
accessed in this phase.

## Reservation-payment integration stop

`20260721020000` is applied only locally while its source remains untracked and
its model contract remains modified/uncommitted. Acceptance additionally proves
that linked cash/session ORM hydration is absent because no Sequelize
associations are defined. This is a hard release-source stop: `DEPOSIT-1-FIX-CONT4C`
must create a coherent approved source commit and later acceptance must pass
before any server migration plan is considered.

## Reservation-payment source integration complete

The local source-integrity stop is closed by `9d391c4`; its committed
`20260721020000` migration exactly matches the locally applied source and the
cash/session ORM aliases have focused null/non-null acceptance evidence. This
does not authorize a server migration: receipt migration `20260721030000`, the
receipt subsystem, multi-account acceptance, and `DASHRES-F004` remain separate
release gates. Production, Staging, and remote targets remain untouched.

## Reservation authorization acceptance boundary

Local authenticated API acceptance closed `DASHRES-F007` for Company/branch/
Employee/direct-deny reservation isolation. This is not deployment approval:
no server was accessed and no receipt migration was applied. Complete
`DEPOSIT-1-FIX-CONT4C`, financial acceptance, and the separate `DASHRES-F004`
decision before any server migration or deployment gate.

## Local receipt migration record — 2026-07-25

Only local development `darfus_erp` on loopback port 5432 was backed up and
migrated through exact Sequelize `--to 20260721030000`. The backup validates;
the migration is committed in `2afa6d9`, applied once, and rerun no-ops.
Do not apply this migration to Staging or Production until CONT5 acceptance and
the normal separate deployment authorization are complete.

## Receipt runtime local-acceptance record — 2026-07-25

The local-only receipt acceptance gap is closed. A disposable owned fixture
completed the real payment service transaction and exact cleanup with no
residue; source/applied migration state remains 50/50. This is evidence for the
local committed receipt contract only. Before any server migration, repeat the
server identity, backup, ordered migration and acceptance gates under separate
owner authorization. Production, Staging and remote targets were not accessed.

## CONT5 deployment stop — 2026-07-26

Do not deploy the CONT5 reservation-deposit changes. Static implementation
evidence is complete, but `DEPOSIT-1-ACCEPT1` must first provide local owned
financial-runtime evidence for net application, partial refund, reconciliation,
idempotency, rollback and isolation, with exact cleanup. No server migration or
configuration action is implied by this source change. `DASHRES-F004` remains a
separate error-semantics gate.

## CONT5 runtime evidence stop — 2026-07-26

Do not deploy. The primary local financial journeys and exact cleanup passed,
but concurrent, employee/direct-deny, high-count, full-idempotency and rollback
acceptance remains unproven. `DEPOSIT-1-FIX-CONT5-CONT2` is the only next scope.

## CONT5 C2 runtime stop — 2026-07-26

Do not deploy. C2 service-level race/idempotency/high-count checks passed with
zero residue, but this does not substitute for the required Branch Account
Employee/direct-deny middleware and remaining refund/rollback acceptance.
## CONT5-CONT11 non-deployment note — 2026-07-26

CONT11 ran only against local darfus_erp on localhost/::1:5432. No Staging, Production, remote database, deployment, or migration action occurred. Do not promote Deposit work until the remaining rollback-evidence release gate is closed.

CONT12 performed no financial fixture operation after its guarded verifier found no active BranchCustomer in the existing branch. No deployment or remote action occurred.

## CONT16-CONT1 non-deployment note — 2026-07-26

The journal rollback probe ran only against the guarded local `darfus_erp` database with a validated ignored backup and an exact owned C16-C1 fixture. It cleaned to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT2 non-deployment note — 2026-07-26

The receipt rollback probe used a separate guarded local C16-C2 fixture and validated ignored backup. It cleaned all owned receipt, sequence and financial rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT3 non-deployment note — 2026-07-27

The idempotency-success rollback probe used a guarded local C16-C3 fixture and validated ignored backup. It cleaned all owned idempotency and financial rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT4 non-deployment note — 2026-07-27

The Refund cash-out rollback probe used a guarded local C16-C4 fixture and validated ignored backup. It cleaned all owned refund, cash, journal, allocation and idempotency rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT5 non-deployment note — 2026-07-27

The Refund journal rollback probe used a guarded local C16-C5 fixture and validated ignored backup `backend/backups/darfus_erp_cont16_c5_20260727_055321.dump` (498602 bytes; 696 `pg_restore -l` objects). It cleaned all owned Refund, cash, journal, allocation and idempotency rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT6 non-deployment note — 2026-07-27

The Refund allocation rollback probe used a guarded local C16-C6 fixture and validated ignored backup `backend/backups/darfus_erp_cont16_c6_20260727_060935.dump` (498602 bytes; 696 `pg_restore -l` objects). It cleaned all owned Refund, allocation, cash, journal and idempotency rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT7 non-deployment note — 2026-07-27

The Refund idempotency-success rollback probe used a guarded local C16-C7 fixture and validated ignored backup `backend/backups/darfus_erp_cont16_c7_20260727_080129.dump` (498602 bytes; 696 `pg_restore -l` objects). It cleaned all owned Refund, allocation, cash, journal and idempotency rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT8 non-deployment note — 2026-07-27

The Complete-sale Invoice rollback probe used a guarded local C16-C8 fixture and validated ignored backup `backend/backups/darfus_erp_cont16_c8_20260727_085829.dump` (398871 bytes; 733 `pg_restore -l` objects). It cleaned all owned Invoice, application, journal, inventory and idempotency rows to zero. No remote, Staging, Production, migration, restore, or deployment action occurred.

## CONT16-CONT9 non-deployment note — 2026-07-27

The Complete-sale accounting rollback probe used ignored backup `backend/backups/darfus_erp_cont16_c9_20260727_163013.dump` (398871 bytes; 733 `pg_restore -l` objects), cleaned all owned final-sale rows to zero, and performed no remote, Staging, Production, migration, restore or deployment action.

## CONT16-CONT10 non-deployment note — 2026-07-27

The Complete-sale Deposit-application rollback probe used guarded local C16-C10 fixtures and ignored backup `backend/backups/darfus_erp_cont16_c10_20260727_173223.dump` (398871 bytes; 733 `pg_restore -l` objects). It cleaned all owned Invoice, application, journal, stock, idempotency and fixture rows to zero. No remote, Staging, Production, migration, restore, deployment or process-stop action occurred.

## CONT16-CONT11 non-deployment note — 2026-07-27

The Complete-sale idempotency-success rollback probe used guarded local C16-C11 fixtures and ignored backup `backend/backups/darfus_erp_cont16_c11_20260727_175514.dump` (398871 bytes; 733 `pg_restore -l` objects). It cleaned all owned Invoice, application, journal, stock, idempotency and fixture rows to zero. No remote, Staging, Production, migration, restore, deployment or process-stop action occurred.

## CONT16-CONT12 non-deployment blocker note — 2026-07-27

The guarded local C12 matrix used ignored backup `backend/backups/darfus_erp_cont16_c12_20260727_180834.dump` (398871 bytes; 733 `pg_restore -l` objects). Its Complete-sale probe reproduced an owned account-fallback defect, then the verifier `finally` cleanup returned all owned rows to zero. No remote, Staging, Production, migration, restore, deployment or process-stop action occurred.

## CONT16-CONT12-CONT1 non-deployment fix note — 2026-07-27

The guarded local CONT1 probe used ignored backup `backend/backups/darfus_erp_cont16_c12_cont1_20260727_185012.dump` (398871 bytes; 733 objects). It verified strict branch role resolution, fail-closed negative paths, valid completion/replay and zero owned residue. No remote, Staging, Production, migration, restore, deployment or process-stop action occurred.

## CONT16-CONT13 non-deployment note — 2026-07-27

The guarded C13 reconciliation run used ignored backup `backend/backups/darfus_erp_cont16_c13_20260727_191903.dump` (398871 bytes; 718 `pg_restore -l` objects), validated it before local writes and never restored it. Exact fixture cleanup and zero residue passed; no remote, Staging, Production, migration, restore, deployment or process-stop action occurred.

## CONT16-CONT14 non-deployment note — 2026-07-27

The guarded local C14 integrity run used ignored backup `backend/backups/darfus_erp_cont16_c14_20260727_193617.dump` (398871 bytes; 733 `pg_restore -l` objects), validated before writes and never restored it. Exact owned cleanup and zero residue passed; no remote, Staging, Production, migration, restore, deployment or process-stop action occurred.

## CONT16-CONT15 non-deployment note — 2026-07-27

The guarded local C15 RUN1/RUN2 repeatability phase used external backup `C:\Users\NEGM\AppData\Local\Temp\DARFUS\darfus_erp_cont16_c15_20260727_202445.dump` plus ignored guard copy `backend/backups/darfus_erp_cont16_c15_20260727_202445.dump` (each 398871 bytes; 733 `pg_restore -l` objects). Neither was restored or staged. Every owned sub-fixture and both run namespaces cleaned to zero; no remote, Staging, Production, migration, deployment or process-stop action occurred.

## DEPOSIT-1 acceptance non-deployment decision — 2026-07-27

The final local acceptance documentation records a verified local subsystem decision only. It does not authorize a release operation: `DEPLOYMENT_AUTHORIZED = NO`, `STAGING_AUTHORIZED = NO`, `PRODUCTION_AUTHORIZED = NO`, and `PRODUCT_WIDE_PRODUCTION_READY = NO`. No deployment, remote connection, restore, migration, process-stop action or production backup/restore drill occurred in this acceptance phase.

## NOTIF-PRE1 non-deployment diagnostic note — 2026-07-27

Only source inspection, non-mutating local endpoint probes and the existing Super Admin Company-context test were run. The unknown port-8000 listener was not stopped; no frontend process, Product configuration, database state, backup, restore, migration, remote, Staging, Production or deployment action occurred.

### NOTIF-PRE1-CONT1 runtime boundary — 2026-07-27

The follow-on capture observed no local frontend listener and no authenticated browser surface. It did not start, stop or alter any process, session, DB row, configuration, backup, restore, remote, Staging, Production or deployment state. The existing port-8000 backend remained untouched.

### NOTIF-PRE1-CONT1-CONT1 local frontend attempt — 2026-07-27

The official local `next dev` command was attempted only on expected ports 3000 and 3001. Both failed before startup with `listen EACCES`; neither left a listener. The unknown port-8000 backend was not stopped or altered, and no fallback port, configuration, DB, browser/session, backup, restore, remote, Staging, Production or deployment operation was attempted.

### NOTIF-PRE1-CONT1-CONT1-CONT1 Windows/local-origin diagnostics — 2026-07-27

Read-only diagnostics found both 3000 and 3001 inside the non-administered IPv4/IPv6 TCP exclusion range 2933–3032; no relevant URLACL or HTTP.sys entry was found. A temporary `127.0.0.1:3300` socket probe and loopback-only webpack Next run passed, and the owned frontend process was stopped exactly afterward. The existing backend accepted the configured `localhost:3000` CORS control but omitted allow-origin for `127.0.0.1:3300`; no Windows policy, URLACL, firewall, CORS, `.env`, DB, process, backup, restore, remote, Staging, Production or deployment state was changed.

### NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1 owned local-origin diagnostic — 2026-07-27

The runtime used only process-scoped, source-supported development settings: an owned backend on 8001 allowed the exact loopback frontend origin on 3300, while the existing backend on 8000 and PostgreSQL on 5432 remained untouched. CORS preflight passed for the selected origin and omitted an allow-origin response for an unrelated origin. The owned frontend/backend were stopped exactly after the diagnostic. No source, `.env`, migration, manual DB write, Windows policy, firewall, URLACL, remote, Staging, Production, restore or deployment action occurred. Runtime diagnosis remains partial because the authenticated Super Admin UI has no authoritative Company-selection control for N5/valid-context N8.

### NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-CONT1 Company-context closure — 2026-07-28

The owned local topology was recreated only to inspect the normal authenticated Super Admin surface. It confirmed that the available UI exposes Branch selection and Company-profile editing, not a Company-context selector. No manual Company header, storage mutation, direct API bypass, Product source/configuration, DB row, migration, Windows policy, remote, Staging, Production, restore or deployment action was used. Owned listeners ended; the existing 8000/5432 services remained untouched. The next notification fix remains local Product work only and is not a deployment authorization.

### NOTIF-FIX local-only completion — 2026-07-28

The notification lifecycle repair was validated only through a short-lived owned local 8001 backend and loopback 3300 frontend; both owned process trees were stopped exactly after observation. No CORS source, backend enforcement, `.env`, database data/schema, Windows policy, remote, Staging, Production, restore or deployment action changed. The pre-existing 8000 process was never targeted; it was absent from the post-run listener audit before owned-process teardown and was not restarted. `next-env.d.ts` retained the required HEAD hash. This is not a deployment or release authorization.

### UX-PRE1 non-deployment design note — 2026-07-28

Only source/read-only contract inspection and documentation occurred. The approved UX-FIX design preserves server-side Company authorization, forbids display-data/first-Company fallback, requires revalidation before traffic, and specifies cache/SSE/Branch/logout isolation. It does not authorize a Company selector deployment, backend production change, Staging, Production, restore or system mutation.

### UX-FIX local implementation boundary — 2026-07-28

This local-only implementation used a short-lived owned backend on 8001 and loopback frontend on 3300; both were stopped exactly. N0 and N5 selection UI were observed, but browser tooling did not expose full N5 REST/SSE/header telemetry and N8 did not meet acceptance because a hard reload returned to the Company gate. No deployment decision follows from this work. The existing backend/process scope was not targeted, PostgreSQL remained untouched, no fallback was added, and `next-env.d.ts` was restored to its required hash after development startup. Resolve the narrow local N8 persistence/hydration and N5 telemetry gap before any integrated notification acceptance.

### UX-FIX-CONT1 local runtime boundary — 2026-07-28

The one-Company/multi-Branch revision was built and validated statically. An owned development backend on 8001 and loopback frontend on 3300 became ready and were stopped exactly; the existing 8000/5432 services were not targeted. Browser automation was unavailable before authenticated request observation, so runtime acceptance remains pending. No `.env`, CORS source, backend fallback, Windows policy, deployment or process action outside the two owned listeners occurred.

### UX-FIX-CONT1-CONT1 no-runtime note — 2026-07-28

No owned process was started in this acceptance retry because browser control was unavailable at the initial gate. The local DB, existing listeners and deployment state were not changed. This is not a release authorization.

### UX-FIX-CONT1-CONT1-CONT1 browser-service boundary — 2026-07-28

The supported browser-control runtime reported zero available bindings. Installed Chrome/Edge executables were identified read-only, but no safe attached browser session exists. No owned process, profile, login, DB change, Windows change, deployment or push occurred. This remains a local runtime-observation blocker only; it is not release authorization.

### UX-FIX-CONT1-CONT1-CONT1-CONT1 repository-local browser harness — 2026-07-28

The committed local harness uses the existing Playwright package and an installed Chrome/Edge binary with Playwright's temporary isolated context; it does not attach a personal profile or save authenticated storage. Its launcher checks process-scoped credentials before creating any owned backend/frontend process. In this run the variables were absent, so it exited with code 2 and no listener, profile, login, DB action, Windows action, deployment or push occurred. Runtime acceptance remains pending.

### UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1 harness pre-spawn failure — 2026-07-28

The approved local test identity was supplied process-scoped and removed after the one permitted execution. The launcher exited 1 before it created any backend/frontend/browser child: Node rejected the unopened asynchronous log stream used for child stdio. Ports 3300/8001 remained closed; 8000 and 5432 were not targeted. A residual owned empty temporary log root remains because the execution environment denied its cleanup command; no evidence, session material or Product/deployment action exists there.
