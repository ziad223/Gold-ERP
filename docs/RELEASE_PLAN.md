# v1.0.0 Release Plan

## FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT1 — repair gate closed — 2026-07-30

The eight financial-bootstrap findings are resolved by implementation commit
`6fa27b5a01e36ae4425a0f320c6943fb7ecbcb57`. A fresh migrated database now
reaches financial READY through supported Product flows, existing partial
installations have an explicit idempotent reconciliation workflow, posting
fails closed on missing authority, and GL financial statements and integrity
guards are present.

The migration remains intentionally unapplied to official `darfus_erp`.
Official state is `52` source, `51` applied, `1` pending with unchanged
financial fingerprints. Do not deploy or begin Staging. The next controlled
phase is `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT1`, which must exercise the
new account/readiness/mapping/report surfaces without bypassing migration
policy.

## FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1 — repair gate — 2026-07-30

The audit is complete but financial bootstrap is not release-ready. Before any
runtime acceptance or migration-staging rehearsal, the release must close the
eight financial findings covering complete account creation, complete Branch
mapping authority, supported account administration, Product-wide fail-closed
posting, GL financial statements, uniform financial scope enforcement,
fresh-install portability, and hierarchy/reference integrity.

Repair must preserve the working First Run transaction/idempotency contract,
strict reservation posting, existing ledger/account statements, the
single-Company/multi-Branch model, and the accepted authorization runtime.
Schema changes, if required, must be tested first on a unique disposable
PostgreSQL database and must not be applied to official local data in the fix
phase unless separately authorized.

`RELEASE_READY = NO`; `STAGING_AUTHORIZED = NO`;
`PRODUCTION_AUTHORIZED = NO`. Next only:
`FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT1`. Do not begin the fix automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT3 — authorization workstream complete — 2026-07-29

Final independent runtime acceptance passed Branch-shell login, Employee PIN,
backend permission bootstrap, explicit fixed/default Branch, allowed and
denied read access, neutral hard-refresh restoration with zero verification
fallback mounts, zero unauthorized automatic ownership, request-terminal
observability, and exact-owned Product logout to sessions `0/0`.

F004–F010 and OBSERVABILITY-F001 are resolved. This closes the authorization
runtime workstream but does not authorize release, Staging, Production,
deployment, or migration rehearsal. Next only:
`FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-FIX-CONT4 — release gate remains controlled — 2026-07-29

`0c48bd2` resolves the final F008 fallback flash without broadening the
authorization model: an unresolved operator restore no longer mounts employee
verification. Fresh secure replay recorded zero transient verification/PIN/
selector mounts, restored the allowed route after one successful operator
restore, and normal logout left owned sessions `0/0`. F009, F010, and terminal
observability remained non-regressed.

Do not deploy, rehearse migrations, authorize Staging/Production, or begin the
financial audit. Next only: `AUTHORIZATION-RUNTIME-ACCEPT-CONT3`.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT2 — release blocked by fallback flash — 2026-07-29

The independent real-employee replay passed login/PIN, fixed explicit
Branch/default validation, backend-resolved permissions, allowed and denied
read access, zero unauthorized automatic module/notification ownership, and
exact-owned Product logout (`1/1 → 0/0`). Hard refresh performed one successful
post-authority operator restore and retained the allowed route, but mounted the
employee-verification fallback once during hydration.

Reopen `FULL-REGRESSION-F008`; retain F009, F010, and OBSERVABILITY-F001 as
resolved. Do not deploy, rehearse migrations, authorize Staging/Production, or
start the financial audit. Next only: `AUTHORIZATION-RUNTIME-FIX-CONT4`.

## AUTHORIZATION-RUNTIME-FIX-CONT3 — release gate remains controlled — 2026-07-29

The operator hard-refresh, logout orphaning, unauthorized employee prefetch,
and terminal-duration defects are resolved by the narrow commits from
`428e9dd` through `3bb60c0`, with aligned regression tests through `37d262b`.
Secure replay and postcheck passed; F004–F010 are resolved, no release-blocking
Product regression remains, the encrypted fixture package is unchanged, owned
sessions are zero, and official `darfus_erp` remains `51/51/0`.

This completion does not authorize release, Staging, Production, deployment, or
migration work. Next only: `AUTHORIZATION-RUNTIME-ACCEPT-CONT2`. Do not start it
automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT1 — release blocked by runtime session defects — 2026-07-29

Do not deploy or begin migration rehearsal. Real employee runtime proved the
explicit Branch/default and permission contracts, but hard refresh cannot
reliably restore the active operator state and logout can leave an operator
session active when its technical session lacks a device association. These are
open `FULL-REGRESSION-F008` and `FULL-REGRESSION-F009`. Cleanup left no active
owned session. Next only: `AUTHORIZATION-RUNTIME-FIX-CONT3`.

## AUTHORIZATION-RUNTIME-TEST-FIXTURE-CONT1 — release gate remains closed — 2026-07-29

One explicitly authorized local-only employee authorization fixture is ready for
the separate runtime acceptance. Its encrypted current-user package is outside
Git; no Product code, deployment, Staging, Production, or migration work was
authorized. Next only: `AUTHORIZATION-RUNTIME-ACCEPT-CONT1`. Do not begin it
automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT1 — release gate remains closed — 2026-07-29

Read-only preflight at `4564b37` passed, but the approved employee
Branch-shell credential triplet was unavailable. No employee runtime session
was attempted and no Product, runtime, or official database state changed. Do
not deploy, rehearse Staging, or authorize Production. Next only:
`AUTHORIZATION-RUNTIME-ACCEPT-CONT1` after approved process-scoped credentials
are available.

## AUTHORIZATION-RUNTIME-FIX-CONT2 — release gate remains closed — 2026-07-29

The Branch transition financial regression is resolved by `80b9909` and an
unchanged reuse-only runtime replay. No migration or official data change
occurred. This does not authorize deployment, Staging, Production, or migration
rehearsal: real employee Branch-shell acceptance still requires an approved
credential. Next only: `AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-FIX-CONT1 — deployment remains prohibited — 2026-07-29

The employee Branch/authorization repair is accepted by code and isolated
PostgreSQL lifecycle coverage. The official database was not changed and stays
at `51/51/0`; no migration is pending. The live employee runtime replay cannot
run until an approved employee credential is available. The unchanged runtime
harness also found `FULL-REGRESSION-F007`: two pre-READY financial requests in
a Branch A→B transition. Do not deploy, start Migration Staging Rehearsal, or
authorize Staging/Production. Next only: `AUTHORIZATION-RUNTIME-FIX-CONT2`.

## AUTHORIZATION-RUNTIME-AUDIT-CONT1 — employee authorization release block — 2026-07-29

Do not begin migration rehearsal or release work. Read-only evidence proves
employee creation/Branch assignment/default semantics and employee login
bootstrap do not meet the required explicit-assignment contract. Three Product
findings are open (`FULL-REGRESSION-F004`–`F006`). Employee login runtime is
still credential-blocked, but the source/schema defects independently block
release. Next only: `AUTHORIZATION-RUNTIME-FIX-CONT1` after approval.

## FULL-REGRESSION-FIX-CONT1 — full regression accepted; release gate remains closed — 2026-07-29

The two proven Product regressions are resolved by narrow frontend query/context
repairs. A sanitized reuse-mode replay passed all required module records, N5,
N8, Branch A→B, hard refresh, notification/SSE and logout; no runtime process
or official database data was changed. `FULL-REGRESSION = COMPLETE` and open
release-blocking regressions are zero.

This is not deployment authorization: `RELEASE_READY = NO`, migration
rehearsal/RC/Staging/Production remain gated. Continue only with
`MIGRATION-STAGING-REHEARSAL` when explicitly authorized.

## FULL-REGRESSION-HARNESS-FIX-CONT1 — release block changed from evidence to Product — 2026-07-29

The module-evidence harness gap is closed, but read-only browser evidence now
proves F002 duplicate successful list lifecycles and F003 headerless
Branch-scoped asset reads. No Product fix was attempted. RC, migration
rehearsal, Staging and Production remain prohibited. Continue only with
`FULL-REGRESSION-FIX-CONT1` after explicit remediation scope approval.

## FULL-REGRESSION — release gate remains closed — 2026-07-29

The bounded read-only regression passed its repository, type/lint, permission,
environment, First Run source-contract, error/deposit/accounting contract and
accepted authenticated Company/Branch/notification checks. The existing harness
does not retain enough sanitized endpoint/status detail to accept the complete
browser module matrix. This is an acceptance-harness coverage gap, not a proven
Product failure. `FULL-REGRESSION = PARTIAL`; `RELEASE_READY = NO`; RC, Staging
and Production remain prohibited. Continue only with
`FULL-REGRESSION-HARNESS-FIX-CONT1`.

## NOTIF-ACCEPT complete — 2026-07-29

The unchanged authenticated reuse-mode harness passed final notification
acceptance. N5/N8 each observed exactly one Company-only list/unread/SSE
lifecycle with zero context errors, reconnects and notification error toasts.
Branch A→B did not restart notifications; the controlled Branch-B scoped
absence remained outside notification toast ownership; logout left zero
protected notification traffic. Credentials and owned temporary material were
removed without stopping the existing runtime.

`NOTIF-ACCEPT = COMPLETE`; `RELEASE_READY = NO`. Continue only with the next
approved `FULL-REGRESSION` phase; no RC, Staging or Production authorization
follows.

## NOTIF-ACCEPT — release boundary: reused runtime unavailable — 2026-07-29

The secure operator launch did not reach the existing frontend/backend: it
returned sanitized `HARNESS_EXECUTION_FAILED` before fingerprint or scenario,
and read-only follow-up found 3000/8000 unavailable. The wrapper removed its
credentials and owned evidence; no process, database or Product state was
changed. `NOTIF-ACCEPT = BLOCKED` until the accepted local runtime is restored
outside this phase and the unchanged reuse capture runs. No release, RC,
Staging or Production action is authorized.

## Branch context prerequisite accepted — 2026-07-29

The supplied sanitized operator-mediated reused-runtime replay passed the
Branch customer-financial acceptance contract: N5/N8, Branch-A reads, A→B,
controlled Branch-B `RESOURCE_NOT_FOUND`, refresh and logout. The scoped
absence preserved both headers and Branch `READY`, with no context error or
loop. `BRANCH-CONTEXT-HARNESS-FIX-CONT1 = COMPLETE`,
`BRANCH-CONTEXT-RUNTIME-FIX = COMPLETE`, and
`BRANCH-CONTEXT-RUNTIME-F001 = RESOLVED`.

`NOTIF_ACCEPT_AUTHORIZED = YES` only to run `NOTIF-ACCEPT`; no RC, Staging,
Production or release-readiness authorization follows.

## BRANCH-CONTEXT-HARNESS-FIX-CONT1 — release boundary after authenticated partial replay — 2026-07-29

The reused local runtime observed passing N5/N8 Company/notification
lifecycle evidence and Branch-A financial reads with both contexts. A normal
Branch-B request for the Branch-A-only customer returned the controlled stable
`RESOURCE_NOT_FOUND` with both headers while Branch remained `READY`; it is a
safe scoped-resource absence, not a release authorization failure. The harness
has been corrected to preserve that distinction and not count its unrelated
domain toast as a notification error. It must be replayed to capture Branch-B
refresh and logout. `NOTIF_ACCEPT_AUTHORIZED = NO`; RC, Staging and Production
remain unauthorized.

## BRANCH-CONTEXT-HARNESS-FIX-CONT1 — release boundary — 2026-07-29

The repository-local evidence collector has a static, exact one-to-one
correlation repair. It is not release acceptance: an operator-mediated,
sanitized rerun against the unchanged local runtime must still complete the
customer-financial Branch A→B, refresh and logout capture. Do not authorize
`NOTIF-ACCEPT`, RC, Staging or Production.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1 — release boundary — 2026-07-29

An authenticated reused-runtime capture now proves the ordinary N5/N8 Company and notification prerequisite, but does not complete customer-financial Branch acceptance. The unchanged harness miscounts concurrent same-path responses, so it stops after Branch-A reads and before A→B, refresh and logout. Treat this as a test-harness defect only; Product regression is not proven. Do not deploy, authorize `NOTIF-ACCEPT`, create data, or restart the existing runtime. Next only: `BRANCH-CONTEXT-HARNESS-FIX-CONT1`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3 — release boundary — 2026-07-29

Do not progress to `NOTIF-ACCEPT`, RC, Staging or Production. The customer
evidence harness is now deterministic, but the required process-scoped
authenticated run was blocked before login by environment credential-injection
policy. This is not authorization to enter credentials through another surface,
create records, weaken Branch middleware, or infer financial evidence. Continue
only with `BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT2 — release boundary — 2026-07-29

Do not progress to `NOTIF-ACCEPT`, RC, Staging or Production. The frontend
Branch transition race is repaired and core A→B browser evidence now has zero
missing-Branch failures and zero new Company-only notification lifecycle.
However, the current safe identity exposes no existing customer profile for
the required read-only invoice, statement-v2 and credit A→B/refresh capture.
This is an evidence gap, not authority to create data, use a fallback, or
weaken backend `BRANCH_CONTEXT_REQUIRED`. Continue only with
`BRANCH-CONTEXT-RUNTIME-FIX-CONT3`; `NOTIF_ACCEPT_AUTHORIZED = NO`.

## Local migration baseline reconciliation — 2026-07-28

The user-authorized migration is accepted locally after read-only verification:
the 51st migration is present once in `SequelizeMeta`, its declared schema is
complete, and `darfus_erp` now has 51 applied / 0 pending migrations. This
does not constitute a Staging rehearsal or Production authorization. Future
local Branch-fix preflight must use 51/0 and reuse localhost 3000/8000; the
next permitted phase is `BRANCH-CONTEXT-RUNTIME-FIX-CONT2` only.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT1 — release boundary — 2026-07-28

Read-only browser evidence now covers a safe customer profile: invoice,
statement-v2 and credit each completed `200` with Company and Branch headers
after readiness. The normal Branch A→B action on that profile remains a P2
release blocker: three `BRANCH_CONTEXT_REQUIRED` responses occur during the
transition and the Branch becomes `INVALID`. `NOTIF_ACCEPT_AUTHORIZED = NO`;
Staging and Production remain unauthorized. Resolve only the Branch provider
transition race in `BRANCH-CONTEXT-RUNTIME-FIX-CONT2`, then re-run the bounded
customer-financial refresh/switch/logout evidence.

## Branch context runtime gate — 2026-07-28

The Branch implementation is in place but the release gate is not waived.
Reused localhost runtime confirms Company and Branch readiness, canonical
Branch propagation after READY, A→B isolation behavior, notification
compatibility and logout safety. It did not find an existing safe customer for
the required read-only invoices/statement/credit observation. Keep
`NOTIF_ACCEPT_AUTHORIZED = NO`, `RELEASE_READY = NO`, `STAGING_AUTHORIZED = NO`
and `PRODUCTION_AUTHORIZED = NO`. Do not create customer data to satisfy this
gate; capture an existing-record observation in `BRANCH-CONTEXT-RUNTIME-FIX-CONT1`.

## COMPANY-CONTEXT-RUNTIME-FIX decision — 2026-07-28

The reused local runtime now passes the single-Company readiness gate. The fix
keeps `/operator/current` inactive until Company READY, preserves the
authoritative Company bootstrap during Branch cache isolation, and avoids the
Strict Mode duplicate SSE start. N5/N8 each observed one successful bootstrap,
Branch/list/unread/SSE lifecycle with Company context, zero 401/403/422,
reconnects and notification error toasts. Branch A→B and logout safety passed.

`NOTIF_ACCEPT_AUTHORIZED = YES`; proceed only to `NOTIF-ACCEPT`. This does not
waive the release gate or authorize RC, Staging or Production.

## RELEASE-GAP-FIX-1-CONT2 decision — 2026-07-28

The browser harness can now safely reuse the manually started local runtime:
it fingerprints localhost 3000/8000 and owns only the browser. This resolves
the local Next development-lock infrastructure blocker without stopping any
existing process. The authenticated run instead establishes a Product runtime
blocker: Company bootstrap repeats (`200`) but the single-Company display/READY
state is not reached in the 30-second window. N5 fails, N8 is not observed,
and notifications/SSE/logout cannot be accepted. `NOTIF_ACCEPT_AUTHORIZED =
NO`; RC, Staging and Production remain unauthorized. Next only:
`COMPANY-CONTEXT-RUNTIME-FIX`.

## Release-gap audit decision — 2026-07-28

`RELEASE-GAP-AUDIT = COMPLETE`, but `RELEASE_READY = NO`. The audited current
head passes selected source/static regression (56/56), typecheck, lint and
build. It does not pass the release gates: N5/N8 authenticated runtime is
unobserved because the owned Playwright launcher fails before child startup;
`NOTIF-ACCEPT` is not authorized; official migration 51 requires a deployment
rehearsal; and backup/restore, dependency, storage and capacity evidence is
absent. See `docs/RELEASE_GAP_AUDIT.md` for the evidence and owner gates.

Next is `RELEASE-GAP-FIX-1`, limited to the pre-spawn harness log-stream and
owned-temp cleanup defect. No release waiver, Staging or Production action is
authorized.

## HARNESS-LOG-STREAM-FIX result — 2026-07-28

The null/unopened WriteStream defect is fixed and lifecycle-tested. The
authenticated run is still blocked by `HARNESS_CHILD_SPAWN_EINVAL` at the
backend-child attempt, before readiness or Product acceptance. This is a new
harness infrastructure boundary, not a Product defect. Next only:
`RELEASE-GAP-FIX-1-CONT1`; no release authorization changes.

## RELEASE-GAP-FIX-1-CONT1 result — 2026-07-28

The Windows `npm.cmd` launcher cause of `HARNESS_CHILD_SPAWN_EINVAL` is fixed
by direct Node CLI execution with pre-spawn validation; backend readiness and
owned cleanup pass. The unchanged harness is now blocked before frontend
readiness by an existing unknown Next dev process holding the workspace dev
lock. No runtime Product evidence or release authorization results from this.
Next only: `RELEASE-GAP-FIX-1-CONT2`.

## FIRST-RUN release gate complete — 2026-07-28

`FIRST-RUN-FIX-CONT1 = COMPLETE`; `FIRST-RUN-ACCEPT = COMPLETE`; `FIRST-RUN = COMPLETE`. Isolated real-PostgreSQL acceptance resolved the prior aggregate `FOR UPDATE` failure and development PII query-log exposure. The guarded bootstrap, rollback, concurrency, idempotency, registration closure, login/logout and log-redaction contracts passed; the official database remains unmodified at 50 applied / 1 pending source migration.

The next release gate is `ERROR-CONTRACT`. Deferred browser N5/N8 and `NOTIF-ACCEPT` remain mandatory before RC; `RELEASE_GATE_WAIVED = NO`; no Staging or Production authorization exists.

## FIRST-RUN-ACCEPT release blocker — 2026-07-28

The isolated acceptance did not accept the first-run implementation. A disposable local PostgreSQL database migrated successfully to 51/0 and was dropped; the official database remains 50/1 with no data mutation. Valid bootstrap fails before writes because PostgreSQL rejects the resolver's aggregate `FOR UPDATE` statements (`SQLSTATE 0A000`). Owned development query logging also exposed the generated acceptance email. These are Product defects, not deployment issues.

`FIRST-RUN-ACCEPT = BLOCKED`; `FIRST-RUN-FIX-CONT1_AUTHORIZED = YES`; no RC, Staging, or Production action is authorized. Fix and re-run isolated acceptance before `ERROR-CONTRACT`. Deferred browser/runtime and notification gates remain mandatory and unwaived.

## FIRST-RUN-FIX release gate — 2026-07-28

The guarded first-run implementation is complete at focused-test/build level, but it is not release acceptance. The new migration and clean bootstrap lifecycle have not been applied to or exercised against the official local database. `FIRST-RUN-ACCEPT` must safely prove state classification, deployment-token boundary, direct Super Admin/Company/Branch/financial creation, rollback, one-winner concurrency, idempotent retry, repeat-bootstrap rejection, recovery handoff, login/refresh/logout and secret-safe logging.

`PUBLIC_REGISTRATION = DISABLED`; no default credential or automatic startup bootstrap is introduced. `CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `RELEASE_GATE_WAIVED = NO`; `NOTIF_ACCEPT_AUTHORIZED = NO`; Staging/Production remain unauthorized. Exact next marker: `FIRST-RUN-ACCEPT`.

## FIRST-RUN-PRE1 release gate — 2026-07-28

Fresh installation has a P1 operator-bootstrap gap: public registration returns 410, ordinary server startup does not mutate, and authorized system-account creation presupposes an existing Super Admin. Direct database promotion from `legacy` is unsupported and cannot be a deployment instruction.

`FIRST-RUN-PRE1 = COMPLETE`; `FIRST-RUN-FIX` is limited to a guarded one-time atomic first-Super-Admin/Company/Branch/financial-readiness flow and separate recovery handoff. `FIRST-RUN-ACCEPT` is a release prerequisite. See `docs/FIRST_RUN_BOOTSTRAP_DESIGN.md`.

The sequence is `FIRST-RUN-FIX → FIRST-RUN-ACCEPT → ERROR-CONTRACT → RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → Staging/RC → Production`. `RELEASE_GATE_WAIVED = NO`; Staging and Production remain unauthorized.

## CONT5 C10 gate — 2026-07-26

The Super Admin explicit-company P1 defect is repaired and accepted locally by
focused tests and an owned real-HTTP matrix. Release remains blocked: CONT11 must
complete the configuration fail-closed, reconciliation, orphan/cross-scope and
rollback evidence. Staging and Production remain prohibited.

## CONT5 C9 release stop — 2026-07-26

Do not deploy. A P1 Super Admin company-scope defect is source-proven: omitted
`X-Company-ID` retains an implicit `user.companyId`/`CMP-DEMO` context. The next
authorized work is the bounded `DEPOSIT-1-FIX-CONT5-CONT10` repair and regression;
CONT5 acceptance, Staging and Production remain blocked.

## CONT5 C8 gate — 2026-07-26

R2 is now formally accepted as a Product invariant. Release remains blocked by
Super Admin context, configuration, reconciliation/orphan-audit and rollback gaps.

## CONT5 C7 gate — 2026-07-26

R1 race and inactive Employee evidence are accepted locally, but release remains
blocked by Super Admin context, configuration, reconciliation and rollback gaps.
No deployment is authorized.

## CONT5 C6 gate — 2026-07-26

Idempotency and validation are accepted locally, but release remains blocked by
the remaining `DEPOSIT-CONT5-F002` race, context, configuration, reconciliation
and rollback evidence. Do not deploy; next scope is CONT7.

## CONT5 C5 refund-middleware gate — 2026-07-26

Refund-route Employee/direct-deny middleware is accepted locally. Release is
still blocked by `DEPOSIT-CONT5-F002`: idempotency/race, inactive/Super Admin,
configuration, detailed reconciliation and rollback must be completed in
`DEPOSIT-1-FIX-CONT5-CONT6`. Staging and Production remain prohibited.

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

## Formal verifier-validation gate

The finalized Branch-1 verifier matrix is proven at 66 static/readiness PASS, six guarded V3 PASS, V2 rollback PASS, and V4/V5 refusal. CONT1 closed `B1VV-F001`: the 20-Asset check is a one-time Phase 32.4 historical demo-snapshot readiness probe, not a current mandatory Product or release gate. Its explicit live mode remains honestly failing when that snapshot is absent; it is optional and does not establish demo richness. No deployment authorization is implied.

## Reservation-deposit release gate

`DEPOSIT-1-DIAG-CLOSE` found release-blocking P1 defects: raw client treasury
authority on refunds, hard-coded receipt treasury codes, CashRegister bypass,
shared Customer-Credit/reservation liability mapping, absent local required
configuration, Branch-Employee-incompatible refund guards, and no partial
application/refund state. `DEPOSIT-1-FIX` and `DEPOSIT-1-ACCEPT` must close these
with financial fixture reconciliation before any staging, RC, or Production gate.
The present 66/66 static/readiness result is not deposit financial acceptance.

## Deposit application contract gate

Owner-approved v1.0.0 Option A permits multiple receipts and bounded partial
refunds, but permits application only in the existing `complete-sale` path.
Release evidence must prove final-invoice linkage, exactly-once sale/settlement
posting, net-deposit calculation after refunds, and refund/completion race
serialization. Standalone AR allocation is deferred and cannot be inferred from
this release gate.

## Dashboard/reservations local schema gate

The local `reservation_payments` compatibility fault is repaired only in the
official development database: backup validated, migration `20260721020000`
applied once, history 49, and receipt migration remains pending. This does not
authorize a server migration or deployment. `DASHBOARD-RESERVATIONS-ACCEPT1`
must complete controlled detail/isolation/runtime acceptance; `DASHRES-F004`
remains open separately.

## Reservation-payment source integration gate

The locally applied migration is not release-ready source: its untracked
`20260721020000` file and modified/untracked model-schema contract must be
coherently committed by `DEPOSIT-1-FIX-CONT4C`. Acceptance also found missing
ORM associations from `ReservationPayment` to the linked cash/session models
(`DASHRES-F006`). Do not advance to Staging/Production until the state is
`APPLIED_LOCALLY_AND_SOURCE_COMMITTED` and the linked hydration acceptance passes.

## Reservation-payment source integration complete

Commit `9d391c4` makes the first applied migration and its required model/schema
slice release-auditable: migration/model hash reconciliation passed, payment
cash/session aliases hydrate correctly, and receipt source remains excluded.
The local state is now `APPLIED_LOCALLY_AND_SOURCE_COMMITTED`; this specific
source-integrity stop is removed. Staging/Production remain blocked for the
separate pending receipt migration and remaining Deposit acceptance, including
the multi-account isolation matrix and `DASHRES-F004` error semantics.

## Reservation multi-account API acceptance complete

`DASHRES-F007` is closed by real local authenticated API evidence. This removes
the reservation authorization/isolation API gate only; it does not authorize a
release. Receipt migration `20260721030000`, receipt integration, Deposit
financial acceptance, and `DASHRES-F004` remain release gates. Staging and
Production remain blocked.

## Receipt migration gate — 2026-07-25

`2afa6d9` and local migration `20260721030000` close the receipt
source/applied mismatch: 50 source migrations equal 50 local applied migrations.
This is not release approval. Staging/Production remain blocked for CONT5
financial acceptance and `DASHRES-F004` error semantics.

## Receipt runtime acceptance complete

The local receipt runtime gate is closed: an exact-owned, loopback-only
transaction accepted one deposit and proved journal, receipt, idempotency,
replay/conflict, read/history/print snapshot, no-invoice/no-stock effects and
zero-residue cleanup. `DEPOSIT-RDR-F001` is closed. This does not authorize a
Staging or Production release: `DEPOSIT-1-FIX-CONT5`, `DASHRES-F004`, the
normal migration/deployment controls and explicit owner authorization remain
release gates.

## CONT5 release gate — 2026-07-26

CONT5 source implementation is complete, but release remains blocked by
`DEPOSIT-1-ACCEPT1`. Controlled local owned-fixture acceptance must prove
multi-receipt net application at final sale, partial refund followed by
completion, exact liability/AR settlement, cash/session and receipt links, no
premature revenue/VAT/COGS/inventory, idempotency/rollback/race behavior,
branch/company/direct-deny isolation and zero fixture residue. `DASHRES-F004`
is an independent pre-release error-semantics decision. No deployment is
authorized.

## CONT5 runtime evidence update — 2026-07-26

Local exact-owned runtime now covers multi-receipt and partial-refund settlement
with exact cleanup, but release remains blocked by `DEPOSIT-CONT5-F002` until
`DEPOSIT-1-FIX-CONT5-CONT2` proves employee/direct-deny, races, complete
idempotency, high-count and rollback/failure-seam behavior.

## CONT5 C2 runtime evidence — 2026-07-26

Complete-sale concurrency, payment idempotency and 25-receipt settlement now
have local owned-runtime evidence. Release remains blocked: the real Branch
Account Employee/direct-deny authorization and remaining mandatory runtime cells
are still unaccepted.
## CONT5-CONT11 release gate update — 2026-07-26

Release remains blocked. Although selected local configuration and reconciliation evidence passed, DEPOSIT-CONT5-F002 remains open for named configuration, reconciliation, orphan-audit and durable transaction-rollback acceptance. Required next gate is DEPOSIT-1-FIX-CONT5-CONT12; neither Staging nor Production is authorized by CONT11.

CONT12 did not change this gate. The current verifier infrastructure cannot provide owned runtime rollback evidence without relying on non-owned branch/customer state. CONT13 must add the owned fixture capability; no release is authorized.

## CONT16-CONT1 release gate update — 2026-07-26

One mandatory rollback cell is now local-runtime accepted, but the Deposit feature is not release-ready: `DEPOSIT-CONT5-F002` remains open for the unexecuted rollback groups and remaining acceptance matrix. No Staging or Production action is authorized.

## CONT16-CONT2 release gate update — 2026-07-26

Deposit receipt rollback is also locally accepted, but the release gate remains blocked by the remaining Deposit idempotency, Refund, Complete-sale and broader acceptance cells. No Staging or Production action is authorized.

## CONT16-CONT3 release gate update — 2026-07-27

The Deposit rollback group is locally accepted, but the release gate remains blocked by Refund, Complete-sale and broader required acceptance cells. No Staging or Production action is authorized.

## CONT16-CONT4 release gate update — 2026-07-27

The first Refund rollback cell is locally accepted, but the release gate remains blocked by remaining Refund, Complete-sale and broader required acceptance cells. No Staging or Production action is authorized.

## CONT16-CONT5 release gate update — 2026-07-27

The Refund journal-persistence rollback cell is locally accepted, but the release gate remains blocked by Refund allocation/idempotency, Complete-sale and broader required acceptance cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT6 release gate update — 2026-07-27

The Refund allocation-persistence rollback cell is locally accepted, but the release gate remains blocked by Refund idempotency, Complete-sale and broader required acceptance cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT7 release gate update — 2026-07-27

All Refund rollback cells are locally accepted, but the release gate remains blocked by Complete-sale and broader required acceptance cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT8 release gate update — 2026-07-27

The Complete-sale Invoice-persistence rollback cell is locally accepted, but the release gate remains blocked by Complete-sale accounting/application/idempotency and broader required acceptance cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT9 release gate update — 2026-07-27

The Complete-sale accounting-persistence rollback cell is locally accepted, but the release gate remains blocked by Complete-sale application/idempotency and broader required acceptance cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT10 release gate update — 2026-07-27

The Complete-sale Deposit-application-persistence rollback cell is locally accepted, but the release gate remains blocked by Complete-sale idempotency-success persistence and the required configuration, reconciliation, audit and repeatability cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT11 release gate update — 2026-07-27

All Complete-sale rollback cells are locally accepted, but the release gate remains blocked by required configuration, reconciliation, orphan/cross-scope audit and repeatability cells. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL. No Staging or Production action is authorized.

## CONT16-CONT12 release gate blocker — 2026-07-27

`DEPOSIT-CONT16-C12-F001` blocks the configuration gate: Complete-sale silently auto-created company-code posting accounts where explicit branch configuration was required. Deposit/Refund guard evidence does not close this P1 defect. No Staging or Production action is authorized.

## CONT16-CONT12-CONT1 release gate update — 2026-07-27

`DEPOSIT-CONT16-C12-F001` is resolved: Complete-sale now requires explicit valid branch role mappings and cannot create/choose a Company fallback account. CONT5 remains open for reconciliation, audit and repeatability; no Staging or Production action is authorized.

## CONT16-CONT13 release gate update — 2026-07-27

The local financial reconciliation gate is accepted: all owned lifecycle journals balanced, mapped-account balances reconciled to journal lines, and replay was financially inert. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for orphan/cross-scope audit and final repeatability. No Staging or Production action is authorized.

## CONT16-CONT14 release gate update — 2026-07-27

The local owned integrity-audit gate is accepted: no orphan, duplicate or cross-scope lifecycle artifact was reproduced, and rejected A2/B1 calls made zero writes. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for final repeatability/regression only. No Staging or Production action is authorized.

## CONT16-CONT15 release gate update — 2026-07-27

The local technical acceptance repeatability gate is accepted: two complete owned runs were equivalent and residue-free, with focused regression passing. `DEPOSIT-CONT5-F002` is resolved. The next formal acceptance-decision documentation phase remains local only; no Staging or Production action is authorized.

## DEPOSIT-1 final local acceptance decision — 2026-07-27

The Deposit/Refund/Complete-sale subsystem is **accepted for the verified local backend technical scope**. `DEPOSIT-1-ACCEPT = COMPLETE` and `DEPOSIT-CONT5-F002 = RESOLVED`. This closes its local acceptance-evidence gap, not the release gate: `DEPLOYMENT_AUTHORIZED = NO`, `STAGING_AUTHORIZED = NO`, `PRODUCTION_AUTHORIZED = NO`, and `PRODUCT_WIDE_PRODUCTION_READY = NO`. The remaining roadmap starts at `NOTIF-PRE1` diagnosis only.

## NOTIF-PRE1 diagnostic gate — 2026-07-27

The notification/auth-context issue is not a reason to weaken backend Company enforcement. Static evidence identifies a frontend/SSE propagation and retry problem; authenticated local chronology is still required before a fix is authorized. `NOTIF-PRE1 = PARTIAL`; next only: `NOTIF-PRE1-CONT1`. No Staging, Production or deployment action is authorized.

### NOTIF-PRE1-CONT1 runtime gate — 2026-07-27

The authenticated capture gate remains incomplete because the local frontend/session surface was unavailable. `NOTIF-FIX` is not authorized. Next only: `NOTIF-PRE1-CONT1-CONT1`, using an existing safe authenticated local Super Admin session; no Company fallback, deployment or Product change is authorized.

### NOTIF-PRE1-CONT1-CONT1 local-start gate — 2026-07-27

The local frontend could not bind either expected development port (3000 or 3001) because the execution environment returned `listen EACCES`. The diagnostic phase is blocked before authentication and must not work around this by changing ports, configuration, identity data or Product behavior. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1`.

### NOTIF-PRE1-CONT1-CONT1-CONT1 origin-compatibility gate — 2026-07-27

The bind gate is resolved without mutation: 3000/3001 are Windows-excluded, while a loopback 3300 frontend is available. The remaining login/authentication block is the existing backend CORS allow-list mismatch for that alternate origin. Do not change CORS, Windows ports, frontend configuration or Product behavior in this diagnosis chain. `NOTIF-FIX` is not authorized. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1`.

### NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1 owned-origin runtime gate — 2026-07-27

The existing ENV-driven CORS/API-base contract allowed an owned, short-lived local 8001 backend and loopback 3300 frontend without a committed configuration change. CORS and normal Super Admin login passed. N4 runtime evidence confirms the Company-context 422/query/toast/SSE-reconnect chain; N7 confirms no persistent post-logout notification loop. N5 and valid-context N8 cannot be honestly executed because the current Super Admin UI has no authoritative Company-selection/propagation control. `NOTIF-FIX` is therefore still not authorized. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-CONT1` to resolve/observe the exact Company-context path; no deployment, fallback or Product change is authorized.

### NOTIF-PRE1 Company-context decision — 2026-07-28

The Company-context gap is classified, not deferred ambiguously: no authoritative Super Admin selection path exists in the current Product. The backend remains correctly header-only and fail-closed. This does not require a backend fallback and does not block the independently bounded notification remediation. `NOTIF-FIX` is authorized next for no-context query/SSE gating, terminal permanent-error handling, logout safety and controlled toasts. `UX-PRE1` follows to diagnose the missing selection experience; integrated N5/N8 acceptance remains its dependency. Deployment, Staging and Production remain unauthorized.

### NOTIF-FIX completion gate — 2026-07-28

`NOTIF-FIX = COMPLETE`: notification reads and SSE now share an explicit readiness gate; no Super Admin Company context means no notification request, reconnect or notification-specific toast. HTTP 4xx SSE responses are terminal pending a relevant state change, logout remains safe, and future explicit Company context is kept consistent across REST, SSE and cache identity. The existing backend 422/403 fail-closed contract is preserved. N5/N8 success remains an integrated acceptance dependency of `UX-PRE1` because no authoritative Company selector exists. No deployment authorization is created; next only: `UX-PRE1`.

### UX-PRE1 implementation-ready design — 2026-07-28

`UX-PRE1 = COMPLETE`; `SUPER_ADMIN_COMPANY_CONTEXT_DESIGN = APPROVED`; no selector is implemented. The next bounded phase is `UX-FIX`: safe context-free Company bootstrap, mandatory selection gate and persistent switcher, one server-validated tab-local Company state machine, scoped REST/SSE/cache propagation, Branch reset, invalid-context/logout cleanup and zero-Company handoff. `NOTIF-ACCEPT` follows UX-FIX; `FIRST-RUN-PRE1` follows that. Backend fallback, deployment, Staging and Production remain prohibited.

### UX-FIX partial local gate — 2026-07-28

The implementation and focused static regression passed, but final local product acceptance is not yet released to `NOTIF-ACCEPT`: N0 passed and N5 selection UI passed, but browser tooling did not expose its REST/SSE/header counts; N8 failed because the selected context was not restored to READY after hard refresh. This is an exact persistence/hydration and acceptance-telemetry gate. Preserve server fail-closed enforcement; do not use browser-storage or header injection as a workaround. Next only: `UX-FIX-CONT1`. Staging, Production and deployment remain unauthorized.

### UX-FIX-CONT1 revised local gate — 2026-07-28

The implementation replaces mutable Company selection with single-Company bootstrap adoption and preserves Branch as the only operational switcher. It addresses the structural N8 storage dependency, but runtime revalidation remains outstanding because the browser surface was unavailable after the owned local topology started. Next only: `UX-FIX-CONT1-CONT1` to capture authenticated N5/N8 traffic and refresh order. Do not use a header or storage bypass; no deployment is authorized.

### UX-FIX-CONT1-CONT1 acceptance gate — 2026-07-28

Browser control is unavailable before login, so this acceptance-only phase cannot establish the required safe authenticated chronology. No runtime process was started and no Product change is authorized. Next only: `UX-FIX-CONT1-CONT1-CONT1` for the browser/session gap; deployment remains unauthorized.

### UX-FIX-CONT1-CONT1-CONT1 browser-service gate — 2026-07-28

The approved browser-control surface enumerated zero browser bindings. Local Chrome/Edge executables do not make a safe attached session available by themselves, and no alternate controller, profile reuse, login, or owned runtime was used. Runtime acceptance remains blocked by the browser service; deployment and `NOTIF-ACCEPT` remain unauthorized. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1`.

### UX-FIX-CONT1-CONT1-CONT1-CONT1 harness gate — 2026-07-28

The local acceptance harness is committed and safe: it uses only an installed browser executable, temporary isolated context, process-scoped credentials, external sanitized evidence and exact owned-process cleanup. It fail-closes before topology startup when credentials are absent; this environment reached that safe boundary. No runtime acceptance, release, deployment or `NOTIF-ACCEPT` authorization follows. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1` for the safe authenticated-session input.

### UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1 harness stop — 2026-07-28

Credentials are no longer the blocker: the unchanged harness exited before backend/frontend/browser startup because its owned runtime log stream was not open when supplied to Node `spawn`. No Product evidence or release decision follows. The credentials were removed and deployment remains unauthorized. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1` for that exact harness defect.

# ERROR-CONTRACT release boundary — 2026-07-28

`ERROR-CONTRACT = COMPLETE`. Error payloads are canonical and secret-safe, request IDs are returned/logged safely, stable domain codes remain compatible and the frontend has a shared typed parser with field and toast ownership. This does not waive deferred browser N5/N8, `NOTIF-ACCEPT`, full regression, RC, Staging or Production gates. Next permitted phase: `RELEASE-GAP-AUDIT`.
