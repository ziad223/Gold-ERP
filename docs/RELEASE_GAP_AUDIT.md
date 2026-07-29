# Release Gap Audit

## FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT1 — complete — 2026-07-30

The repair started at exact checkpoint
`387c5f8dfd1e4e15e6d949dafc68504b2a39de8f` on `main` and produced
implementation commit `6fa27b5a01e36ae4425a0f320c6943fb7ecbcb57`
(`feat: complete financial account bootstrap`). Preflight preserved 11
stashes, zero remotes, the protected semantic baseline, the required
`next-env.d.ts` hash, and the owner-managed 3000/8000/5432 runtime.

The implementation establishes versioned catalogs of 12 required Company
account roles and 11 required Branch mapping roles. First Run now reconciles
that complete baseline and evaluates financial readiness before setup can
become READY. Existing environments have an explicit, permissioned,
transactional, idempotent reconciliation API and UI; valid existing mappings
are preserved.

Account administration now uses a dedicated domain service and Chart of
Accounts UI. It enforces Company ownership, unique codes, compatible
hierarchies, cycle prevention, posting status, mapped-account lifecycle
guards, and non-destructive deletion. All posting account resolution is
centralized and fail-closed; business posting no longer creates accounts.
Statement Branch scope uses the shared authorization resolver. GL-backed
Income Statement and Balance Sheet endpoints and UI use posted journal lines
and semantic classifications.

The authorized source migration adds posting/classification/bootstrap
metadata and reference/idempotency safeguards. It was applied, rolled back,
and reapplied only on disposable PostgreSQL databases. Fresh First Run
produced 12 roles, 11 mappings, READY status, and an idempotent no-op replay.
A legacy-shaped disposable installation reconciled without replacing valid
configuration. Missing required mapping caused a canonical failure with zero
business/journal/account writes. Synthetic GL reports reconciled and the
balance-sheet equation held. All disposable databases were dropped.

Validation: the new contract failed 0/8 before repair and passes 8/8 after
repair; the focused financial/First Run suite passes 23/23; all `.mjs` tests
pass 59/59; `.cjs` tests pass 58 with one intentional disposable-DB skip;
permission baseline remains 128/128; typecheck, targeted lint,
`git diff --check`, ledger/reporting verifier, and post-reset bootstrap
verifier pass.

The official database was not migrated or mutated. Its final state is source /
applied / pending `52/51/1`, with exact preflight account, mapping, journal,
and journal-line fingerprints unchanged, zero waiting locks, and no disposable
database residue. The existing runtime remained owner-managed; backend hot
reload was observed without service control.

Disposition: `FINANCIAL-BOOTSTRAP-F001`, `F002`, `F003`, `F005`, `F007`,
`F008`, `F009`, and `F010` are RESOLVED. Open release-blocking financial
findings: 0. Release, Staging, and Production remain unauthorized. Exact next
marker: `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT1`; it was not started.

## FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1 — fresh-install financial readiness audit — 2026-07-30

The audit started at exact checkpoint
`1a490b4ecb937bb3ed17a6238fae15c65489bc01` on `main`
(`docs: accept final employee authorization runtime`). Preflight confirmed zero
staged files, 11 stashes, no remotes, the protected semantic baseline, the
required `next-env.d.ts` hash, owner-managed listeners on 3000/8000/5432, and
official `darfus_erp/public` at source/applied/pending `51/51/0`. The three
inherited backend CRLF-only artifacts remained unstaged.

### Ownership and supported-flow map

- `backend/src/services/first-run-bootstrap.service.js` owns the atomic initial
  Company/Branch/account creation. Its current template creates seven
  Branch-owned accounts, six final-sale system roles, and two reservation/cash
  mappings.
- `backend/src/services/first-run-setup-state.service.js` marks setup READY
  against that same narrow minimum. It does not require bank, supplier payable,
  opening equity, operating expense, or other-income readiness.
- `backend/src/services/company-bootstrap.service.js` validates the strict
  final-sale roles and can bootstrap only the reservation-liability role for a
  Branch; it is not a complete financial onboarding flow.
- `backend/src/services/posting.service.js` contains a broader canonical chart
  but lazily creates missing Company-scoped accounts while a transaction is
  posting. Most legacy posting flows therefore self-heal instead of failing
  closed on missing explicit Branch financial authority.
- `backend/src/models/account.model.js`,
  `systemAccountRole.model.js`, and `branchFinancialMapping.model.js` own the
  account and mapping records. Account code uniqueness, parent-account foreign
  keys, circular-hierarchy protection, and a posting/non-posting contract are
  not enforced by the schema.
- `backend/src/routes/erp.routes.js` exposes generic account CRUD, strict
  reservation mapping settings, account statements, trial balance, and ledger
  reports. `app/[locale]/dashboard/accounting/page.tsx` consumes accounts for
  journals/statements/reports but provides no supported Chart-of-Accounts
  create/edit/deactivate/hierarchy workflow.

### Read-only official baseline

The official database contains 19 active Company-scoped accounts and no
Branch-scoped accounts, system-role rows, or Branch financial mapping rows.
All five active Branches fail the accepted six-role/two-mapping readiness
minimum. Existing journal headers and lines are balanced by the observed
aggregate checks, with no cross-Company line or duplicate source group found.
These are anonymized counts only; no account names, identifiers, balances, or
business payloads were retained.

### Disposable PostgreSQL proof

A uniquely named local disposable database was target-proven on PostgreSQL
5432, migrated through all 51 source migrations, and exercised with
`tests/first-run-postgres.integration.test.cjs`. Rollback, advisory-lock
concurrency, replay idempotency, and setup-state acceptance passed. The fresh
result contained one Company, one active Branch, seven Branch-scoped accounts,
six system roles, two active Branch mappings, one setup-state row, and zero
duplicate account-code groups. The database was dropped and prefix residue was
verified as zero. No migration or write-capable test targeted official
`darfus_erp`.

### Capability decision

| Area | Classification | Evidence |
| --- | --- | --- |
| Chart of Accounts schema | PARTIAL | Core account fields exist; structural and posting-account invariants are absent. |
| Default account bootstrap | PARTIAL | Seven Branch accounts are created; required bank/AP/equity/expense/other-income categories are absent. |
| First Run integration | PARTIAL | Atomic/idempotent and real-PostgreSQL PASS, but READY uses an incomplete financial minimum. |
| Manual account management API | PARTIAL | Generic CRUD exists but lacks accounting-specific scope, reference, hierarchy, and destructive-change guards. |
| Manual account management UI | MISSING | No supported Chart-of-Accounts administration flow was found. |
| Branch mapping model | PARTIAL | Six system roles and two mapping types exist; coverage is not complete for required posting families. |
| Branch mapping API/UI | PARTIAL | Reservation deposit/cash settings exist; no complete financial mapping workflow exists. |
| Fail-closed posting | PARTIAL | Strict reservation completion fails closed; legacy posting can lazily create missing accounts. |
| Deposit posting | COMPLETE | Focused deposit and strict resolver contracts passed. |
| Cash posting | PARTIAL | Posting exists but can depend on code-based lazy account creation. |
| Bank posting | PARTIAL | Posting exists but the fresh bootstrap does not create/map the required bank account. |
| Expense posting | PARTIAL | Posting exists but missing accounts can be created at transaction time. |
| Other-income posting | PARTIAL | Posting exists but missing accounts can be created at transaction time. |
| Ledger visibility | COMPLETE | Posted journal ledger and trial-balance routes/UI are present and verifier passed. |
| Account statement visibility | COMPLETE | Opening/running/closing balance statement exists, subject to the scope defect below. |
| Financial statements | MISSING | No GL-backed balance sheet and income statement acceptance surface was found. |
| Idempotency | PARTIAL | First Run and mapping uniqueness pass; general journal source uniqueness is not a DB invariant. |
| Security/scope | PARTIAL | Accounting permissions exist, but one statement path and generic account mutations bypass uniform Branch/domain guards. |
| Fresh-environment portability | MISSING | A fresh setup becomes READY before complete financial setup and relies on later transaction-triggered creation. |

### Findings

Eight release-blocking findings are proven:
`FINANCIAL-BOOTSTRAP-F001`, `F002`, `F003`, `F005`, `F007`, `F008`, `F009`,
and `F010`. `F004` is not opened because disposable PostgreSQL proved atomic
idempotency without duplicates. `F006` is not opened because representative
posting implementations exist; their missing-account authority defect is
classified under F005/F009 rather than duplicated.

Focused contracts passed 19/19, real PostgreSQL First Run passed, the ledger
foundation and post-reset operational bootstrap verifiers passed, permission
baseline remained 128/128, typecheck passed, lint errors were zero, and
`git diff --check` passed. No Product, schema, migration, configuration,
runtime, or official database change was made.

`FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1 = COMPLETE`.
`FINANCIAL_BOOTSTRAP_CLASSIFICATION = PARTIAL_OR_MISSING`.
`NEW_FINANCIAL_FINDINGS = F001,F002,F003,F005,F007,F008,F009,F010`;
`OPEN_RELEASE_BLOCKING_FINANCIAL_FINDINGS = 8`. `RELEASE_READY = NO`;
Staging and Production remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT1`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT3 — final independent employee runtime acceptance — 2026-07-29

The phase started at exact Product checkpoint
`215db1b3bc319ce4e996f5c6d5d56c3158994f7e` on `main` (`docs: resolve
operator restore verification flash`). Required authorization repair history
through `0c48bd2ff29b7f10c161ecabe91e86d143a4b066` was present. Preflight retained
zero staged files, 11 stashes, no remotes, the protected semantic baseline,
the exact `next-env.d.ts` hash, the same restricted encrypted-package hashes
and ACL, the existing 3000/8000/5432 listeners, and official
`darfus_erp/public` at source/applied/pending `51/51/0`. The three inherited
backend CRLF-only artifacts remained unstaged.

The encrypted loader passed a presence-only child check and left all parent
credential variables absent. A fresh owned Chromium process with one
non-persistent context then completed one Branch-shell login and one Employee
PIN verification, both `200`. The active non-admin Employee remained distinct
from the technical shell, the backend returned an active authorization with a
current authorization version and effective permissions, the server-validated
single Company was correct, and the fixed Branch/default matched the sole
active explicit assignment. The allowed navigation and read API passed; the
privileged navigation was absent, and the single deliberate read-only denied
probe returned a canonical correlated `403` with no protected data or side
effect.

Automatic unauthorized request counts before refresh were zero for settings,
Branches, notifications, customers, assets, invoices, suppliers, products,
stock movements, purchase orders, approvals, and reservations. On hard
refresh, neutral protected loading mounted once before the Branch-scoped
operator request; no operator-current request lacked validated Branch
authority, exactly one Branch-authorized operator-current request completed
`200`, and the allowed route restored. Verification-shell, PIN-form, and
Employee-selector mount counts were `0/0/0`; protected data exposure during
the unresolved interval, duplicate restore, restore loop, pending work, and
unauthorized UI flash were all zero. Post-refresh automatic unauthorized
requests and notification list/unread/SSE ownership remained zero.

The owned completed request set retained numeric client-observed durations,
request IDs, and one terminal response outcome per request; undefined
durations and duplicate terminal summaries were zero. Static terminal-logging
coverage preserves completed, aborted, and client-disconnected classification.
Before Product logout, the exact-owned technical/operator sessions were
fingerprint-linked `1/1`; normal logout returned `200` and changed them to
`0/0` without manual cleanup or unrelated-session revocation. Post-logout
protected traffic, notification traffic, reconnects, and `401` storms were
zero.

Final validation passed CONT4 `3/3`, CONT3 `5/5`, the complete focused Node
inventory `59/59`, canonical permission baseline `128/128`, typecheck,
targeted lint with zero errors, and diff check. Cleanup removed the owned
browser context/process and all temporary evidence, retained the encrypted
package byte-identical outside Git, and left parent credentials absent. The
owner-managed listeners retained PIDs 15532/21644, official migrations stayed
`51/51/0`, fixture authorization stayed unchanged, idle transactions and
waiting locks were zero, and owned sessions remained `0/0`.

`AUTHORIZATION-RUNTIME-ACCEPT-CONT3 = COMPLETE`; F004–F010 and
`OBSERVABILITY-F001` are resolved; the authorization runtime workstream is
complete. `OPEN_RELEASE_BLOCKING_AUTHORIZATION_FINDINGS = 0` and
`OPEN_RELEASE_BLOCKING_PRODUCT_REGRESSIONS = 0`. `RELEASE_READY = NO`;
Staging and Production remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-FIX-CONT4 — operator verification fallback flash resolved — 2026-07-29

Starting from `6e054bb3872bd73fc73829e56c59aed51efdd741` on `main`, preflight retained
zero staged files, 11 stashes, no remotes, the protected semantic baseline,
the exact `next-env.d.ts` hash, unchanged encrypted-package hashes/ACL, reused
3000/8000/5432, and official `darfus_erp/public` at `51/51/0` with zero idle
transactions and waiting locks. The three inherited backend CRLF-only artifacts
remained unstaged.

The unchanged secure replay reproduced F008: valid operator restoration and the
allowed route succeeded, but the verification shell and its PIN form each
mounted once during hard-refresh hydration. Source ownership traced the flash
to `contexts/operator-context.tsx` exposing only independent `loading` and
`active` values, while `components/auth/auth-guard.tsx` treated `!active` as
authoritative absence after a transient loading drop.

`0c48bd2` adds explicit internal restore states (`uninitialized`, `deferred`,
`restoring`, `active`, `absent`, `invalid`, `error`). The guard now renders a
neutral protected loading shell until restoration is authoritative, renders
verification only for authoritative absent/invalid states, and keeps a safe
retry boundary for restore failure. No backend, session, logout, notification,
request-logging, migration, package, fixture, or configuration path changed.

The new focused contract failed before the repair and passed afterward. Final
validation passed CONT3 `5/5`, complete Node inventory `59/59`, permission
baseline `128/128`, typecheck, targeted lint with zero errors, and diff check.
Post-commit secure replay produced one successful operator-current restore,
restored the allowed route, completed normal logout `200`, and recorded zero
verification-shell, PIN-form, and employee-selector mounts. The final owned
technical/operator session counts were `0/0`; services and the official
database remained preserved. `AUTHORIZATION-RUNTIME-FIX-CONT4 = COMPLETE`;
`FULL-REGRESSION-F008 = RESOLVED_BY_CODE_AND_RUNTIME_REPLAY`.

`RELEASE_READY = NO`; Staging and Production remain unauthorized. Exact next
marker: `AUTHORIZATION-RUNTIME-ACCEPT-CONT3`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT2 — independent runtime acceptance partial — 2026-07-29

The phase started at exact checkpoint `fbac02c6dd4b58da4e9d17d787c756ba2fd72083`
on `main`. Preflight retained zero staged files, 11 stashes, no remotes, the
protected semantic baseline and declaration hash, the existing 3000/8000/5432
runtime, official `darfus_erp/public` at `51/51/0`, and the unchanged restricted
current-user encrypted fixture package. The dedicated fixture remained active,
non-admin, and distinct from its fixed Branch shell, with one explicit
active/default Branch, one effective read capability, one denied administration
capability, and a valid authorization version.

A fresh non-persistent owned browser process completed one Branch-shell login
and one employee-code/PIN verification (`200` each). The active operator had
one backend-resolved effective permission, the fixed Branch control was
disabled, the allowed dashboard route and safe allowed GET passed, and the
privileged employee-administration route was absent. One deliberate safe denied
route rendered no protected data, and its GET returned canonical correlated
`403` without partial data. The fixed one-assignment shell makes Branch
switching `NOT_APPLICABLE`.

F010 remained closed: automatic unauthorized requests before and after refresh
were both zero; notification list, unread, and SSE ownership were all zero.
Hard refresh observed the non-ready interval, emitted zero operator-current
requests while explicitly transitioning, then exactly one Branch-scoped
operator-current request after validated authority; it returned `200`, restored
the operator and allowed route, retained the denied navigation boundary, and
settled with zero pending work. Independent replay nevertheless observed the
employee-verification shell mount once during that restoration window. This
reproducible unauthorized fallback flash reopens `FULL-REGRESSION-F008` as
`OPERATOR_VERIFICATION_FALLBACK_FLASH_DURING_READY_RESTORE`; the repair restored
the final state but did not keep the guard non-fallback for the whole hydration
interval.

F009 independently passed. Immediately before logout, the exact owned
technical/operator counts were `1/1` and the operator carried the stable
technical-session fingerprint. One normal Product logout returned `200`; both
owned counts became `0/0`, protected post-logout traffic stayed zero, and no
manual cleanup API was required. Thirteen completed owned request lifecycles
had numeric durations and request IDs, with zero undefined duration. The
pre-existing runtime terminal buffer was not exported or copied; the exact
terminal-logger regression and aborted/client-disconnected classifications
passed the focused static suite.

Final static validation passed the CONT3 suite `5/5`, complete Node inventory
`56/56`, permission baseline `128/128`, typecheck, diff check, and lint with
zero errors and 18 inherited warnings. Runtime services stayed healthy, fixture
authorization remained unchanged, sessions ended at zero, and the official
database remained `51/51/0` with zero idle transactions and waiting locks.
`AUTHORIZATION-RUNTIME-ACCEPT-CONT2 = PARTIAL`; F009, F010, and
`OBSERVABILITY-F001` remain resolved, while F008 is open. `RELEASE_READY = NO`;
exact next marker: `AUTHORIZATION-RUNTIME-FIX-CONT4`.

## AUTHORIZATION-RUNTIME-FIX-CONT3 — employee runtime regressions resolved — 2026-07-29

Preflight at `da2e07f` retained `main`, zero staged files, 11 stashes, no
remotes, the protected hashes, the unchanged encrypted fixture package, the
existing 3000/8000/5432 runtime, and official `darfus_erp` at `51/51/0`.

`FULL-REGRESSION-F008` was reproduced as an operator-current request attempted
before Branch READY, followed by premature provider clearing and the employee
verification fallback. `428e9dd` makes restoration Branch-generation aware,
waits for READY, performs one restore per authenticated READY generation, and
keeps the guard in a loading state until that decision is authoritative. A
fresh secure replay retained the operator and allowed route across hard refresh
without showing the verification fallback.

`FULL-REGRESSION-F009` was reproduced with one active technical session and one
active operator session before logout, followed by an orphaned operator session.
The login-time technical session could lack a device association, while logout
used that association as its only linkage. `44f9964` introduces a stable,
non-secret technical-session fingerprint and transactional exact-owned logout;
`25c0d45` preserves explicit user-wide revocation for security changes. The
secure replay ended with both owned active-session counts at zero.

The F010 candidate was confirmed: fixed-shell bootstrap requested Branch
metadata before operator authorization, and core module plus notification
lifecycles were gated by operator activity rather than effective permission.
`3fabf5b` derives fixed-shell Branch metadata from the authenticated shell and
permission-gates module, notification REST, and notification SSE ownership.
The deliberate denied acceptance probe still returned canonical `403`.

`OBSERVABILITY-F001` was confirmed because the previous response-time token
could not classify aborted/client-disconnected terminal paths and could emit an
undefined duration. `3bb60c0` adds one explicit terminal record with monotonic
numeric duration and `completed`, `aborted`, or `client_disconnected` outcome.
The protected `backend/src/app.js` change is limited to installing that
middleware.

New regression coverage passed `5/5`; the complete Node test set passed `56/56`;
permission baseline passed `128/128`; typecheck passed; lint reported zero
errors and 18 inherited warnings. Secure runtime replay passed login, employee
verification, operator restoration, permission denial, hard refresh, and
logout. The fixture authorization relationships and encrypted package remained
unchanged, owned sessions ended at zero, and no migration or business/config
mutation occurred. `AUTHORIZATION-RUNTIME-FIX-CONT3 = COMPLETE`;
`FULL-REGRESSION-F008`, `F009`, `F010`, and `OBSERVABILITY-F001` are resolved.
`RELEASE_READY = NO`; exact next marker:
`AUTHORIZATION-RUNTIME-ACCEPT-CONT2`.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT1 — real employee runtime findings — 2026-07-29

Starting at `ef1093b`, the protected Git/runtime/database preflight passed. The
external current-user encrypted package was present, ACL-restricted, unchanged,
and exposed the three required variables only to its child. The dedicated
fixture was active and non-admin, with one explicit active/default Branch, one
effective read capability, one denied administration capability, and a valid
authorization version.

The owned runtime session completed Branch-shell login, employee-code/PIN
verification, operator bootstrap, the allowed dashboard route, a safe allowed
GET (`200`), a denied frontend route, and a safe denied GET (`403`) with the
canonical correlated envelope and no partial data. The fixed one-Branch shell
made assigned-Branch switching `NOT_APPLICABLE`; its current-Branch control was
fixed and unassigned Branches were not offered.

Hard refresh then reproduced a release-blocking operator-bootstrap race.
`ApiOperatorRepository.current()` uses the default Branch-aware client while
the transport rejects non-skipped requests during Branch transition.
`OperatorProvider` records `CURRENT_FAILED` but does not depend on Branch READY,
so the still-valid operator session was replaced by the employee-verification
gate. This is `FULL-REGRESSION-F008`.

Logout also exposed `FULL-REGRESSION-F009`: the technical login session did not
store a device-session association, so technical logout revoked that session
but did not revoke the active operator session. A fixture-scoped cleanup used
the supported login/end-session/logout APIs and left zero active technical or
operator sessions; no fixture configuration or business row was changed.
Focused contracts passed `30/30`, permission baseline `128/128`, typecheck,
targeted lint, and diff check. `AUTHORIZATION-RUNTIME-ACCEPT-CONT1 = PARTIAL`;
`RELEASE_READY = NO`; exact next marker:
`AUTHORIZATION-RUNTIME-FIX-CONT3`.

## AUTHORIZATION-RUNTIME-TEST-FIXTURE-CONT1 — dedicated local employee fixture ready — 2026-07-29

At `34d3de6`, the operator authorized one narrow local-only fixture in
`darfus_erp`. `QA_EMPLOYEE_AUTH_RUNTIME_001` was created identity-first and
verified with zero implicit Branch mappings before its single explicit active
assignment and explicit default were set. The default belongs to that active
set; no administrator, Company-label, first-Branch, or persisted-candidate
fallback was used.

The fixture has a dedicated non-admin QA role, one safe effective read
capability, one safe denied capability, a valid PIN credential, and a dedicated
fixed-Branch shell account. A Windows current-user DPAPI/SecureString package
outside Git passed a presence-only loader round trip and restricted ACL check.
The fixed Branch-shell contract makes in-session Branch switching not applicable
for this one-assignment credential package; an unassigned active Branch
candidate exists for denial evidence. No Product code, migration, configuration,
or unrelated business row changed. Static contracts, permission baseline,
typecheck, targeted lint, and diff check passed. Exact next marker:
`AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT1 — employee credential availability boundary — 2026-07-29

At `4564b37`, read-only preflight retained the accepted checkpoint, protected
semantic baseline, required generated declaration hash, live 3000/8000
listeners, and official `darfus_erp` baseline `51/51/0` with zero idle
transactions and waiting locks. The three required process-scoped employee
Branch-shell credential variables were absent. No login session, browser
context, account selection, PIN attempt, or database mutation was performed.

This is an acceptance-evidence boundary, not a new Product finding. The
isolated closures for `FULL-REGRESSION-F004` through `F007` remain unchanged;
real employee runtime authorization is not proven. `RELEASE_READY = NO`; exact
next marker remains `AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-FIX-CONT2 — Branch readiness financial regression resolved — 2026-07-29

Starting at `d621460`, the unchanged reuse-only browser harness reproduced
`FULL-REGRESSION-F007`: two normalized customer-invoice reads began before its
observed Branch-B READY boundary during A→B. Statement-v2 and credit were not
affected. Request ownership remained exact to the Branch-switch scenario.

The root cause was in `contexts/branch-context.tsx`: it installed the new
Branch accessor and opened the imperative transport guard before committing the
validated READY state. `80b9909` keeps the transport closed through the
transition and uses a layout effect to publish the accessor only after the READY
DOM commit, before passive query effects. Branch-scoped financial query keys and
the existing cancellation boundary remain unchanged; notification resources
remain Company-scoped.

The new ordering test failed before the repair and passes afterward. Focused
context/error/notification/employee coverage passed `42/42`, permission
baseline `128/128`, typecheck and targeted lint passed. The unchanged reused
runtime harness now passes with `preReadyFinancialRequests = 0`, validated
A→B, zero context errors, and a controlled Branch-B scoped absence only after
READY with both context headers. No migration or official data mutation occurred.
Real employee runtime acceptance remains credential-blocked. `RELEASE_READY =
NO`; exact next marker: `AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-FIX-CONT1 — employee repair partial; Branch regression found — 2026-07-29

Starting at `7387ac2`, the authorized committed-byte recovery restored only the
generated `next-env.d.ts` baseline; it was never staged. Product commits
`0e72f28` and `56c0538` resolve the employee findings without a migration.
Employee creation is identity-only, never uses Company metadata or the
administrator's active Branch, and visibly directs the operator to the explicit
Branch-assignment step. A Branch mapping is created only by an explicit choice.

The existing nullable primary-Branch field and `EmployeeBranchAccess` mapping
are sufficient: a non-null primary is now transactionally required to belong to
the active selected mappings; revoking it requires an explicit replacement.
Operator verification and live sessions fail closed without an active mapping,
reject unassigned Branches, and re-check authorization version. Effective
permissions remain backend-resolved active role grants plus direct grants minus
active denials; no normal Employee `/auth/login` account was introduced.

Focused contracts, context/error/notification regression coverage, permission
baseline, typecheck, lint and a real PostgreSQL disposable-DB lifecycle pass.
The disposable DB was dropped. The preserved administrator runtime reached the
employee route but did not expose its create control, so it supplied no form
evidence and made no write. No approved employee credential exists, so real
employee runtime acceptance remains blocked. The unchanged reuse-only browser
replay then observed two customer-financial requests before Branch-B READY
during A→B, where the accepted contract requires zero. This is new
release-blocking Product evidence, `FULL-REGRESSION-F007`; it was not repaired
in this employee-scoped phase. Official `darfus_erp` remains `51/51/0`.
`RELEASE_READY = NO`; exact next marker: `AUTHORIZATION-RUNTIME-FIX-CONT2`.

## AUTHORIZATION-RUNTIME-AUDIT-CONT1 — employee Branch and authorization audit — 2026-07-29

`FULL-REGRESSION-F004` through `F006` are proven static/schema Product
defects. Employee creation pre-fills the required primary-Branch *label* from
Company session metadata without an explicit assignment choice. The creation
request does not carry a Branch identifier, while the backend creates an
`EmployeeBranchAccess` row only when such an identifier is supplied. The
resulting identity metadata and operational Branch authorization are separate
but the creation flow neither makes that distinction visible nor completes the
required second step.

The current model has no employee default-Branch invariant: `employees.branch_id`
is nullable and no database constraint requires it to occur in active
`employee_branch_access`. The separate Branch editor supports multiple explicit
assignments and invalidates authorization versions, but it neither selects nor
validates a default from that set. Employee credentials are PIN credentials for
operator verification; normal authentication is a separate User/technical
account flow. Employee permissions are evaluated server-side only for a
Branch-shell account with an active operator session, so direct employee login
and permission propagation are not a complete Product contract.

No employee credential was approved for this phase, so employee-login runtime
evidence is blocked. The static/schema defects independently block release.
The official database was queried read-only only; current aggregate consistency
showed no existing duplicate mappings or active primary/mapping mismatch.
`RELEASE_READY = NO`. Exact next marker: `AUTHORIZATION-RUNTIME-FIX-CONT1`.

## FULL-REGRESSION-FIX-CONT1 — Product regression closure — 2026-07-29

Starting from `a2fd04e`, the narrow Product repairs resolve both release
findings without changing the backend, schema, packages, configuration or
official data. F002 had separate ownership causes: Header-wide core preloads,
an imperative supplier refetch, a reservations page/core overlap, and
Company-only core keys that varied by Branch generation. Core resources are now
explicitly requested, Company-only keys are Branch-independent, Suppliers has
one declarative owner, and Reservations owns its list. F003 traced to the
inventory asset list bypassing the Branch contract with `skipBranch`; asset and
inventory reads now wait for validated Branch READY, use the canonical client,
include the validated Branch in their query identity, and forward cancellation.

Focused lifecycle/context tests (`24/24`), typecheck and lint (zero errors;
18 inherited warnings) pass. The unchanged reuse-mode browser replay exited
`0/PASS`, started no service child, and retained zero secret leakage. Every
required module passed with terminal pending and duplicate lifecycle counts of
zero. Assets retained both context-presence booleans, including an explicit
Branch-B capture; N5/N8, A→B, hard refresh, notification/SSE and logout remain
non-regressed. The official database stayed `51/51/0` with no phase mutation.

`FULL-REGRESSION-F002 = RESOLVED`; `FULL-REGRESSION-F003 = RESOLVED`; and
`FULL-REGRESSION = COMPLETE`. `RELEASE_READY = NO`; Staging and Production
remain prohibited. Exact next marker: `MIGRATION-STAGING-REHEARSAL`.

## FULL-REGRESSION-HARNESS-FIX-CONT1 — browser evidence closure and findings — 2026-07-29

Starting at `af90f95`, the harness-only commits `d660ea8`, `9dec085`,
`5b05719`, and `d54d3ba` added a sanitized per-module reducer and read-only
navigation/refresh capture. It preserves Playwright Request-object correlation,
normalizes dynamic paths, retains only booleans/status categories/counts, and
does not retain payloads, raw headers, identifiers, credentials or browser
storage. Focused helper tests (`13/13`), the current Node suite (`43/43`), the
permission guard, typecheck and lint (zero errors; 18 inherited warnings) pass.

The reused `localhost:3000/8000` runtime was not started, stopped or restarted.
N5/N8 each retained exactly one bootstrap, Branch bootstrap, notification
list/unread/SSE lifecycle, with zero observed 401/403/422, reconnect and
notification-error-toast counts. Branch A→B executed and logout retained zero
protected notification traffic. The harness coverage gap is resolved, but the
terminal module matrix proves F002 duplicate lifecycles and F003 headerless
asset reads. `FULL-REGRESSION = PARTIAL`; `RELEASE_READY = NO`; exact next
marker is `FULL-REGRESSION-FIX-CONT1`.

## FULL-REGRESSION — bounded read-only result and coverage boundary — 2026-07-29

Starting from `27c9259` (`docs: accept notification runtime lifecycle`), the
repository and reused local runtime passed all safe checks: the accepted
history is present; `git diff --check` passed; protected semantic drift is
zero; tracked generated evidence and high-confidence key material are zero;
and `next-env.d.ts` has its required hash. The selected cross-domain
contract/isolation suite passed `99/99`; the canonical permission guard passed
at `128/128`; environment/bootstrap and local-database guard tests passed;
typecheck passed; and lint reported zero errors with the inherited 18
warnings. The real-PostgreSQL First Run test correctly skipped without an
explicit disposable target, so it could not target the official database.

The unchanged credential-clean reuse harness exited `0/PASS` against the
pre-existing `localhost:3000/8000` runtime. N5 and N8 each observed one
Company bootstrap, Branch bootstrap, notification list, unread count and SSE;
all observed 401/403/422, reconnect and notification-error-toast counts were
zero. Branch A→B observed non-ready before Branch-B READY, no pre-ready
financial traffic, no Branch-context-required error and no notification
restart. The controlled Branch-B customer absence retained both contexts and
Branch READY; logout produced zero protected notification traffic.

This is not a Product regression, but it is not a complete full-module browser
matrix: the accepted harness tracks dashboard resources but does not retain
per-module endpoint/status evidence for suppliers, inventory/products,
transfers, reservations, purchase orders, approvals and invoices. No unsafe
ad-hoc browser flow was substituted. `FULL-REGRESSION = PARTIAL` with
`HARNESS_DEFECT = FULL_MODULE_READ_ONLY_BROWSER_MATRIX_NOT_CAPTURED` and
`RELEASE_READY = NO`. Exact next marker:
`FULL-REGRESSION-HARNESS-FIX-CONT1`.

## NOTIF-ACCEPT — authenticated reused-runtime lifecycle accepted — 2026-07-29

The unchanged reuse-mode harness completed with sanitized `0/PASS`, no owned
service child, zero secret leakage and removed cleanup. N5 and N8 each observed
one Company bootstrap, one Branch bootstrap, one notification list, one unread
count and one SSE lifecycle; context was present on Company-only notification
traffic and no Branch header was sent there. Observed 401/403/422, Company
context-required, SSE reconnect and notification-error-toast counts were all
zero. Branch A→B created no notification list/unread/SSE lifecycle; the bounded
controlled Branch-B `RESOURCE_NOT_FOUND` retained both headers and Branch
`READY` without notification impact. Logout left zero protected notification
traffic. `NOTIF-ACCEPT = COMPLETE`; this does not authorize release, Staging or
Production.

## NOTIF-ACCEPT — reused runtime unavailable — 2026-07-29

The operator-mediated credential wrapper removed its own process-scoped
credentials and emitted only a sanitized result: exit `1`,
`HARNESS_EXECUTION_FAILED`, no started child, no runtime fingerprint, no
evidence, zero secret leakage and removed owned cleanup. Read-only follow-up
confirmed the pre-existing frontend 3000 and backend 8000 listeners are no
longer available; PostgreSQL 5432 remains healthy. The harness therefore did
not reach login, N5/N8, Branch switch or notification observation. No process
was stopped or restarted, and no Product, database, migration or harness change
is authorized. `NOTIF-ACCEPT = BLOCKED` with
`BLOCKER = PREEXISTING_RUNTIME_UNAVAILABLE`; retain the authorization for a
future unchanged reuse-mode run only.

## BRANCH-CONTEXT-HARNESS-FIX-CONT1 — authenticated replay accepted — 2026-07-29

The supplied sanitized operator-mediated replay exited `0` with `PASS` while
reusing the existing local runtime. It completes the earlier harness boundary:
N5/N8, safe customer discovery, Branch-A invoice/statement/credit, atomic
Branch A→B, controlled Branch-B scoped absence, refresh and logout all pass.
Branch-B `RESOURCE_NOT_FOUND` retained Company and Branch context, Branch
`READY`, zero `BRANCH_CONTEXT_REQUIRED` and no retry loop; it is not a context
failure. Secret leakage is zero and harness cleanup is removed. Therefore
`BRANCH-CONTEXT-HARNESS-FIX-CONT1 = COMPLETE`,
`BRANCH-CONTEXT-RUNTIME-FIX = COMPLETE`,
`BRANCH-CONTEXT-RUNTIME-F001 = RESOLVED`, and
`NOTIF_ACCEPT_AUTHORIZED = YES`. This authorizes `NOTIF-ACCEPT` only; release,
Staging and Production remain blocked.

## BRANCH-CONTEXT-HARNESS-FIX-CONT1 — exact response correlation repaired / runtime rerun pending — 2026-07-29

`26d25a2` replaces the reverse method/path pending-record lookup with a
`WeakMap` keyed by the exact Playwright `Request` object. A request now owns one
sanitized record and one terminal outcome (`RESPONSE`, `FAILED`, or `ABORTED`);
late response metadata cannot move it across scenario boundaries, and
`requestfinished` cannot manufacture a success. Financial summaries now count
responses, aborts, failures and pending records separately, and their bounded
settle barrier requires a qualifying response with no pending short-lived
financial record.

Focused static validation passes 39 tests, including out-of-order same-path
response, aborted peer, distinct failed/successful credit, terminal-event
idempotency, scenario ownership, correlation cleanup, and redaction coverage;
typecheck and targeted lint also pass. No Product, backend, package, migration,
database or pre-existing runtime process changed. The secure operator-mediated
authenticated rerun remains required; do not infer A→B, refresh, logout, or
notification acceptance from static evidence. `NOTIF_ACCEPT_AUTHORIZED = NO`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1 — authenticated financial evidence / harness boundary — 2026-07-29

The unchanged operator-mediated harness reused verified local 3000/8000 DARFUS services and authenticated without retaining credentials. N5 and N8 each observed one Company bootstrap, Branch bootstrap, notification list, unread and SSE lifecycle; context was present where required, the Company gate was absent, and observed 401/403/422, reconnect and notification-error-toast counts were zero.

Read-only discovery found a safe customer profile (`MANY` category), confirming the earlier discrepancy was an immediate post-navigation selector check, not missing customer data. Branch-A invoice, statement-v2 and credit each had an observed `200` with Company and Branch context and zero `BRANCH_CONTEXT_REQUIRED`. The scenario stopped before A→B, refresh and logout because the evidence collector pairs concurrent same-method/same-path responses through a reverse scan of pending records. An older request can remain `status: null` while a later request receives `200`, falsely producing zero statement/credit successes. This is a harness evidence-correlation defect, not a proven Product regression.

`BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1 = PARTIAL`; `BRANCH-CONTEXT-RUNTIME-F001 = OPEN — harness response correlation prevents customer-financial acceptance`; `NOTIF_ACCEPT_AUTHORIZED = NO`. No Product, database, migration, package or runtime-process change occurred. Exact next marker: `BRANCH-CONTEXT-HARNESS-FIX-CONT1`, limited to one-to-one Playwright request/response correlation and the same sanitized capture.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3 — authenticated customer evidence boundary — 2026-07-29

Starting at `fa0d04a`, `013b388` improves the repository-local acceptance
harness only: it waits for the existing customer-list response and a visible
profile route before declaring discovery, records only the list count category,
and adds sanitized A→B/refresh ordering assertions. The prior immediate check
after `domcontentloaded` is therefore a credible H7 harness deficiency, but
the customer discrepancy is not yet runtime-proven.

This execution environment rejected every process-scoped credential injection
attempt before `npm run test:single-company-runtime` could start. The browser
surface was not used as a bypass because the phase requires process-scoped
credentials. No login, customer discovery, customer-financial request,
refresh, logout, browser profile, or API request occurred. Static Branch,
Company, notification, error, harness/redaction tests and typecheck pass.
`BRANCH-CONTEXT-RUNTIME-FIX-CONT3 = BLOCKED` only by
`AUTHENTICATED_HARNESS_CREDENTIAL_INJECTION_UNAVAILABLE`; the existing 3000/
8000 runtime was preserved and no DB data or migration changed. Keep
`BRANCH-CONTEXT-RUNTIME-F001` open and `NOTIF_ACCEPT_AUTHORIZED = NO`. Exact
next marker: `BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT2 — atomic Branch transition repair — 2026-07-29

Starting from `e559d1f`, the frontend race was repaired without changing the
fail-closed backend contract. `TRANSITIONING` is now a non-ready Branch state;
the provider enters it before retiring the canonical accessor, the shared API
client blocks a stale Branch-scoped request in the render/effect interval, and
only query keys with a concrete Branch discriminator are cancelled/removed.
Customer invoices, statement-v2/v3, credit and core Branch reads now forward
React Query abort signals, so cancelled Branch-A work cannot overwrite
Branch-B results. The selector remains usable in `SELECTION_REQUIRED` and is
locked only while actually transitioning.

The reused localhost 3000/8000 browser harness passed N5 and N8 (one Company
bootstrap, Branch bootstrap, notification list, unread and SSE each; zero
401/403/422, reconnects and notification error toasts). Its isolated A→B
window recorded Branch-aware core reads with headers, zero
`BRANCH_CONTEXT_REQUIRED`, and zero new list/unread/SSE/error-toast lifecycle.
No safe existing customer profile was visible to this authorized identity, so
customer invoice/statement/credit A→B and refresh evidence is
`NOT_OBSERVED`; no data was created. Thus `BRANCH-CONTEXT-RUNTIME-FIX-CONT2 =
PARTIAL`, `BRANCH-CONTEXT-RUNTIME-F001` remains open only for that evidence,
and `NOTIF_ACCEPT_AUTHORIZED = NO`. The official DB remains 51 applied / 0
pending with zero phase mutation. Exact next marker:
`BRANCH-CONTEXT-RUNTIME-FIX-CONT3`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT2-CONT1 — user-applied migration reconciliation — 2026-07-28

The user explicitly ran the local migration command before this reconciliation.
The historical official baseline was 50 applied / 1 pending; it is preserved as
historical evidence. The newly verified official local baseline is **51 applied
/ 0 pending**. Reconciliation performed no migration, rollback, schema change,
data change, or runtime restart.

Migration 51 is `20260728010000-create-first-run-setup-state.js`
(`SHA-256 D9D576E89625A78402C0DD06570104905A1E7D6CDB192D89E42692237101A024`).
It is schema-only: it creates `first_run_setup_states` with its nine declared
columns and `id` primary key. Read-only registry comparison found 51 source
names = 51 applied names, no missing/unknown/duplicate rows, and migration 51
exactly once. PostgreSQL catalog inspection confirmed the table, types,
nullability, primary key and zero invalid indexes. No partial application or
migration-owned state row was observed.

The active runtime is the same repository: Next parent/child serve localhost
3000 and Nodemon/server serve localhost 8000 from this workspace. The newer
backend PID is an accepted same-project process replacement; it has an
established local PostgreSQL 5432 connection and `/health/db` reports UP.
The official database is `darfus_erp`, schema `public`, PostgreSQL 18.4, with
zero idle-in-transaction and waiting-lock counts. Local migration application
does not complete Staging rehearsal or authorize Production.

`BRANCH-CONTEXT-RUNTIME-FIX-CONT2-CONT1 = COMPLETE`;
`OFFICIAL_LOCAL_DATABASE_BASELINE = 51 APPLIED / 0 PENDING`; and
`BRANCH-CONTEXT-RUNTIME-FIX-CONT2 = AUTHORIZED_TO_RESUME`. The Branch fix has
not run and `NOTIF_ACCEPT_AUTHORIZED = NO`. Exact next marker:
`BRANCH-CONTEXT-RUNTIME-FIX-CONT2`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT1 — customer-financial evidence, Branch switch not accepted — 2026-07-28

The existing localhost 3000/8000 runtime was reused with its original PIDs;
the harness owned only a temporary browser context and sanitized evidence.
The authenticated customer list yielded a safe read-only `CUSTOMER_A`. Its
profile retained Company and Branch `READY`; invoice, statement-v2 and credit
each completed one `200` with both context headers, and none started before
Branch readiness. Empty data would have been accepted, but no contents were
retained.

The bounded normal A→B switch from that profile exposed a new release-blocking
transition race. `selectBranch` clears old client context/work while the
provider's published state remains ready for a render. Statement-v2 and credit
therefore begin without Branch context; three total
`BRANCH_CONTEXT_REQUIRED` responses invoke the invalidation path and leave the
Branch `INVALID`. One ordinary new-Branch profile `404` was also observed.
No Product repair, data mutation, migration, process restart, or notification
acceptance occurred. Refresh-on-profile and final profile-route logout were not
run after the failure. Official aggregate fingerprints, migration boundary
(50 applied / 1 pending), and lock counts remained unchanged.

`BRANCH-CONTEXT-RUNTIME-FIX-CONT1 = PARTIAL`; `NOTIF_ACCEPT_AUTHORIZED = NO`.
Next only: `BRANCH-CONTEXT-RUNTIME-FIX-CONT2`, to correct the exact Branch
state/accessor ordering and repeat the customer financial evidence.

## BRANCH-CONTEXT-RUNTIME-FIX — implementation accepted; customer-financial runtime evidence bounded — 2026-07-28

Starting checkpoint `62e140b9934375eef54b1d5165c6126417811542` exposed the
manual `BRANCH_CONTEXT_REQUIRED` finding as a frontend authority and query
gating defect. The former display/storage Branch value was not the API-client
authority; customer invoice history explicitly suppressed the Branch header;
statement and credit queries were ungated; and each fixed-Company bootstrap
cleared the persisted Branch candidate before refresh validation.

`2b000ff` introduces one validated Branch state machine
(`UNRESOLVED`, `READY`, `SETUP_REQUIRED`, `SELECTION_REQUIRED`, `INVALID`,
`ERROR`), a canonical API-client Branch accessor, Branch-aware cache keys and
customer-financial readiness gates. Persisted Branch storage is now only a
candidate validated against the current accessible Branch list; no arbitrary
multi-Branch fallback exists. `2e687ab` adds lifecycle and sanitized browser
coverage. Notifications intentionally retain their completed Company-only
`skipBranch` contract; the observed list/unread/SSE lifecycle did not regress.

The externally reused 3000/8000 harness passed: N5 and N8 each observed one
context-free Company bootstrap, one Branch bootstrap, one notification list,
one unread request and one SSE connection; all observed status counts for
401/403/422, reconnects and notification error toasts were zero. N8 restored
the server-validated Branch to READY after hard refresh. Five existing
Branches allowed an A→B run with Branch context on observed Branch-scoped
resources and zero `BRANCH_CONTEXT_REQUIRED`. Logout then had zero protected
list/unread/SSE traffic. The safe identity had no existing customer profile,
so invoices, statement-v2 and credit navigation was not executed and is not
claimed as accepted runtime evidence.

| Scenario | Resource | Requests | Status | Company context | Branch context | Outcome |
| --- | --- | ---: | --- | --- | --- | --- |
| N5 | accessible Companies | 1 | 200 | absent as required | absent | PASS |
| N5 | Branch bootstrap / list / unread / SSE | 1 / 1 / 1 / 1 | 200 | present / present / present / present | Branch bootstrap absent; notifications intentionally absent | PASS |
| N8 | accessible Companies | 1 | 200 | absent as required | absent | PASS |
| N8 | Branch bootstrap / list / unread / SSE | 1 / 1 / 1 / 1 | 200 | present / present / present / present | Branch bootstrap absent; notifications intentionally absent | PASS |
| Branch A→B | observed Branch-scoped core reads | observed | 200 where completed | present | present after READY | PASS |
| Customer financial | invoices / statement-v2 / credit | 0 | NOT_OBSERVED | — | — | no safe existing customer |
| Logout | notification list / unread / SSE | 0 / 0 / 0 | — | — | — | PASS |

`BRANCH-CONTEXT-RUNTIME-FIX = PARTIAL` only for the missing existing-customer
read-only runtime observation. `BRANCH-CONTEXT-RUNTIME-F001 = IMPLEMENTED —
PENDING CUSTOMER-FINANCIAL RUNTIME EVIDENCE`; `NOTIF_ACCEPT_AUTHORIZED = NO`.
No backend, migration, package, `.env`, data or pre-existing runtime process
changed. The official database remains `darfus_erp`, 50 applied / 1 pending
source migration, with zero idle transactions and waiting locks. Exact next
marker: `BRANCH-CONTEXT-RUNTIME-FIX-CONT1`.

## COMPANY-CONTEXT-RUNTIME-FIX — accepted external-runtime repair — 2026-07-28

Starting at `cca5502`, the root cause was a pre-READY `/operator/current`
request from the globally mounted Operator provider. Its expected backend `422`
was routed to Company-context invalidation, repeatedly restarting the
context-free bootstrap. The provider now remains inactive with
`COMPANY_CONTEXT_PENDING` until the authoritative single-Company context is
READY. A second defect cleared the entire query cache during a Branch switch,
evicting the retained `accessible-companies` bootstrap; Branch switching now
cancels/removes only non-bootstrap queries. Development Strict Mode also now
defers the first SSE connect by one microtask, avoiding an aborted duplicate
connection.

The unchanged localhost-only harness passed using the existing 3000/8000
services: N5 and N8 each recorded one `accessible-companies`, Branch,
notification-list, unread and SSE lifecycle; all successful observed resources
carried Company context except the context-free bootstrap. Both paths had zero
401/403/422, zero `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED`, zero SSE reconnects
and zero notification error toasts. Five existing Branches permitted an A→B
run; Company context remained present and scoped reads reloaded. Logout made
one normal logout request and then recorded zero protected list/unread/SSE
traffic. The run owned no service process and left the pre-existing runtime
running. `COMPANY-CONTEXT-RUNTIME-F001 = RESOLVED`; `NOTIF_ACCEPT_AUTHORIZED =
YES`. This authorizes `NOTIF-ACCEPT`, not release, Staging or Production.

**Phase:** `RELEASE-GAP-AUDIT`
**Date:** 2026-07-28
**Starting checkpoint:** `399badcec4cc03f3ae59d1fbcabfe4d2310164bd` — `docs: record error contract implementation`
**Decision:** `RELEASE-GAP-AUDIT = COMPLETE`, `RELEASE_READY = NO`, `RELEASE_BLOCKERS_FOUND = YES`.

## RELEASE-GAP-FIX-1-CONT2 — external-runtime browser evidence — 2026-07-28

`6a16e18` adds an explicit, localhost-only reuse mode to the existing browser
harness. In that mode it fingerprints `localhost:3000` and `localhost:8000`,
starts no backend or frontend child, registers neither existing service as
owned, and closes only its own browser/context. Focused launcher/redaction
tests (21), typecheck and targeted lint pass. The pre-existing frontend and
backend listeners remained reachable with their original PIDs after browser
cleanup; port 8000 was never targeted.

The authenticated browser run reached normal login (`200`) and made five
context-free `GET /auth/accessible-companies` calls (`200`, Company header
absent). It made one `GET /branches` call (`200`, Company header present), but
never reached the read-only Company display within the bounded 30-second wait.
No notification list, unread-count, SSE, dashboard-resource or logout record
was observed; no tracked `401`, `403` or `422` response and no tracked
notification toast was observed. The existing UI observation remains the
controlled Company-context gate ("Preparing workspace" / context validation);
the harness did not fabricate an unobserved stable error code.

This is a Product runtime regression, not a reuse-mode defect:
`COMPANY_CONTEXT_RUNTIME = FAIL`, `N5 = FAIL`, and `N8 = NOT_OBSERVED` because
N5 never established READY. `RELEASE-GAP-F001 = RESOLVED_BY_REUSE_MODE`, while
`COMPANY-CONTEXT-RUNTIME-F001` is open. `NOTIF_ACCEPT_AUTHORIZED = NO`.
Exact next marker: `COMPANY-CONTEXT-RUNTIME-FIX`.

| Scenario | Endpoint/resource | Requests | Status | Company context | Outcome |
| --- | --- | ---: | --- | --- | --- |
| N5 login | `/auth/login` | 1 | 200 | Not applicable | PASS |
| N5 bootstrap | `/auth/accessible-companies` | 5 | 200 | Absent, as required | Repeated; READY not observed |
| N5 Branch bootstrap | `/branches` | 1 | 200 | Present | No Company display followed |
| N5 notifications / SSE | list, unread, stream | 0 observed | — | — | Blocked before lifecycle |
| N8 / Branch A→B / logout | runtime scenarios | NOT_OBSERVED | — | — | N5 did not reach READY |

## RELEASE-GAP-FIX-1-CONT1 — Windows launcher repair, next harness boundary — 2026-07-28

Sanitized real-child diagnostics proved that the backend direct-Node launch was
already valid. The exact `EINVAL` was a synchronous Windows failure from the
frontend's `npm.cmd` shim under `shell: false`; it reproduced independently
with stream, numeric-fd and `ignore` stdio. Commit `dd568d5` replaces the
frontend and Playwright shims with their installed direct Node CLI entrypoints,
validates an absolute directory cwd and supported stdio, and filters child
environment values to strings only. A real Next CLI child-process test plus
failure-path coverage pass. The owned backend reached readiness on 8001 and
cleaned its log/temp root; `HARNESS_CHILD_SPAWN_EINVAL = RESOLVED`.

The unchanged authenticated harness then started backend and frontend but the
owned frontend exited before port-3300 readiness because a pre-existing,
unknown local Next development process holds the workspace development lock.
The harness returned `HARNESS_READINESS_FAILED_OWNED_FRONTEND`; cleanup was
`REMOVED`, credentials were absent afterward, and no Product/browser/login/N5/
N8/REST/SSE/notification/Branch/logout evidence was collected. No unknown
process was stopped and this is not a Product regression.

`RELEASE-GAP-F001` is now **OPEN — FRONTEND_NEXT_DEV_LOCK_CONFLICT**. Exact
next marker: `RELEASE-GAP-FIX-1-CONT2`, limited to safe resolution of that
owned-frontend workspace-lock boundary.

## RELEASE-GAP-FIX-1 / HARNESS-LOG-STREAM-FIX result — 2026-07-28

The original pre-spawn defect is repaired in `96c7094`, `09013d9` and
`1372c31`: owned logs now await a real `open` event before their stream is
passed to `spawn`; close is idempotent; owned children end before log closure;
and known temporary files are removed only from a verified harness root. The
focused lifecycle suite includes a real child-process stream acceptance and
passes. The safe no-credential path still exits before listeners start.

The unchanged authenticated harness was then run once with process-scoped
local-only credentials. It no longer throws `ERR_INVALID_ARG_VALUE` from a
null descriptor, but the attempted backend child emits the separately classified
`HARNESS_CHILD_SPAWN_EINVAL` before readiness. Cleanup returned `REMOVED`,
credential variables were absent afterward, and the in-memory log scan found
zero credential occurrences. No owned listener, login, N5, N8, REST/SSE,
notification, Branch, or logout observation occurred. This is harness
infrastructure, not a Product regression.

`RELEASE-GAP-F001` remains **OPEN — HARNESS_CHILD_SPAWN_EINVAL (original
null-stream defect fixed)**. Exact next marker: `RELEASE-GAP-FIX-1-CONT1`,
limited to the backend-child `EINVAL` launcher cause.

This is a read-only assessment. It made no Product, test, package, migration,
environment, database, process, Staging, Production, remote, or deployment
change. It is not a release authorization.

## Evidence standard

| Label | Meaning |
| --- | --- |
| `SOURCE_AND_TEST_PROVEN` | Current source and focused automated evidence agree. |
| `ISOLATED_RUNTIME_PROVEN` | A prior bounded disposable/owned runtime acceptance is recorded. |
| `NOT_OBSERVED` | Required live/browser/operational evidence was not collected and is not inferred. |
| `UNKNOWN` | The repository contains no current evidence sufficient to make a release claim. |

The audit distinguishes historical register entries from current evidence. A
later accepted checkpoint supersedes an older “open” row only where its scope
and test evidence actually cover the same fault.

## Safety and boundary

| Item | Result |
| --- | --- |
| Repository / branch / checkpoint | `H:\WORK\jewellery-erp-master`, `main`, exact starting HEAD above. |
| Worktree | No staged paths. The inherited changes in `backend/package-lock.json`, `backend/package.json`, and `backend/src/controllers/erp.controller.js` are CRLF-only; protected semantic diff is zero. |
| Stashes / remotes | 11 preserved stashes; no remotes. |
| `next-env.d.ts` | SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`. |
| Official DB | `darfus_erp` on local PostgreSQL 5432 only; read-only audit. Applied source migrations: 50. Source migrations: 51. Pending: 1. |
| DB safety | Idle transactions: 0. Waiting locks: 0. No owned DB connection or listener was created. |
| Runtime ports | Existing 8000 and PostgreSQL 5432 were inspected only. No owned listener ran on 3300 or 8001. |

## Product and architecture inventory

The repository contains 9 route modules, 5 controller modules, 47 service
modules, 88 model modules, 51 migrations, 17 test files and 69 documentation
files. The architecture is Next.js frontend plus Express/Sequelize/PostgreSQL,
with optional Redis-assisted queue/realtime services. Runtime database
configuration is ENV-driven and fails closed for conflicting or incomplete
Production/Staging configuration. Health endpoints, request IDs, Helmet, CORS
allowlisting and canonical error normalization are source/test-proven.

| Area | Current evidence | Release conclusion |
| --- | --- | --- |
| Auth, token/session and logout | `SOURCE_AND_TEST_PROVEN`; public registration remains `410`. | Requires browser role/session acceptance before RC. |
| Roles, permissions and audit | 128-slug canonical baseline and role tests are recorded. | No current cross-role browser matrix. |
| Single Company / operational Branch model | Auto-adopt-one Company, zero/many fail-closed, Branch switcher and scoped keys are tested. | N5/N8 browser/runtime chronology is `NOT_OBSERVED`. |
| First Run | Isolated PostgreSQL acceptance passed direct Super Admin/Company/Branch/mapping creation, locking, rollback and redaction. | Source migration 51 is intentionally not applied to the official DB; deployment migration gate remains open. |
| Error contract | Canonical envelope, safe 5xx mapping, frontend parser and redaction are `SOURCE_AND_TEST_PROVEN`. | Historical `DASHRES-F004` is covered; see finding disposition. |
| Notifications / SSE | Lifecycle and terminal-error contract tests pass. | Real N5/N8 list/unread/SSE/header/toast counts are `NOT_OBSERVED`. |
| Sales, reservations and deposits | Local technical acceptance and rollback/reconciliation evidence are recorded. | Product-wide regression and browser workflows remain unrun. |
| Inventory, purchases, treasury and accounting | Source, permission and focused static/service suites exist. | Full RC integration, performance and operational reporting evidence is `UNKNOWN`. |
| Reports and dashboard | Source/static behavior exists; historical local evidence is recorded. | Responsive Arabic/English browser acceptance is `NOT_OBSERVED`. |
| Files/uploads | 10 MB MIME allowlist and local/Cloudinary driver abstraction are source-proven. | Antivirus/content inspection, production storage retention and recovery evidence are `UNKNOWN`. |
| UI, accessibility and RTL | Component/localization conventions are present. | Full keyboard, screen-reader, mobile and RTL browser matrix is `NOT_OBSERVED`. |
| Observability | Safe query metadata, request IDs and redaction are tested. | Alerting, retention, central aggregation and incident runbook exercise are `UNKNOWN`. |
| Backups / restore | A backup utility and historical local backup evidence exist. | No current end-to-end restore drill or production retention/provenance acceptance. |
| Performance | No load, capacity, query-plan or SSE fan-out acceptance was located. | `UNKNOWN`; must be bounded before Production. |

### Domain-by-domain release inventory

| Domain | Evidence classification | Release-readiness conclusion |
| --- | --- | --- |
| Authentication, refresh and logout | SOURCE_AND_TEST_PROVEN | Browser session lifecycle remains unobserved. |
| Users, roles, permissions and audit | SOURCE_AND_TEST_PROVEN | Cross-role operational Browser matrix remains a full-regression gate. |
| Company setup/profile | SOURCE_AND_TEST_PROVEN | Single Company model is fail-closed; production migration and deployment material are blocked. |
| Branch management/switching | SOURCE_AND_TEST_PROVEN | Real Branch A→B browser acceptance is not observed. |
| System settings, currency and fiscal configuration | SOURCE_AND_TEST_PROVEN | First Run isolated acceptance covers mandatory defaults; operational settings regression remains pending. |
| Dashboard | SOURCE_AND_TEST_PROVEN | Browser/RTL/mobile dashboard acceptance is not observed. |
| Notifications and SSE | SOURCE_AND_TEST_PROVEN | N5/N8 integrated runtime counts and reconnection evidence are not observed. |
| Customers and customer documents | SOURCE_AND_TEST_PROVEN | Production upload scanning/storage and browser accessibility remain unaccepted. |
| Suppliers and supplier documents | SOURCE_AND_TEST_PROVEN | Same storage/operational evidence gap applies. |
| Products, assets and stock movements | SOURCE_AND_TEST_PROVEN | Full end-user/browser and performance coverage is pending. |
| Inventory/audits/transfers | SOURCE_AND_TEST_PROVEN | Cross-branch operational acceptance is pending. |
| Purchases | SOURCE_AND_TEST_PROVEN | Product-wide regression has not run. |
| Sales, POS and invoices | SOURCE_AND_TEST_PROVEN | Full current-head end-to-end/browser acceptance has not run. |
| Reservations | ISOLATED_RUNTIME_PROVEN | Error semantics are now resolved; browser acceptance remains pending. |
| Deposits, refunds and completion | ISOLATED_RUNTIME_PROVEN | Local financial technical acceptance is not release/staging approval. |
| Cash, bank, treasury and sessions | SOURCE_AND_TEST_PROVEN | Operational reconciliation/performance acceptance remains a full-regression gate. |
| GL, journals, accounts and reports | SOURCE_AND_TEST_PROVEN | End-user reporting/printing and performance evidence is not observed. |
| Approvals, operator/employee controls | SOURCE_AND_TEST_PROVEN | Full role/browser workflow remains pending. |
| Localization, RTL, printing and responsive UI | NOT_OBSERVED | Required Browser acceptance before RC. |
| Security, CORS, headers and rate limits | SOURCE_AND_TEST_PROVEN | Current dependency/security assessment remains required. |
| Logging, request IDs and error reporting | SOURCE_AND_TEST_PROVEN | Alerting, retention and incident-operation evidence is unknown. |
| Database migrations and readiness | ISOLATED_RUNTIME_PROVEN | Official 50/1 boundary and Staging rehearsal block deployment. |
| Build, tests and CI-like verification | SOURCE_AND_TEST_PROVEN | Complete full-regression aggregate has not run at this head. |
| Backup, recovery and operational deployment | NOT_OBSERVED | Restore, rollback and release procedure must be accepted before Production. |

## Current release blockers

| ID | Severity | Evidence | RC / Staging / Production effect | Required closure |
| --- | --- | --- | --- | --- |
| `RELEASE-GAP-F001` | P1 | `scripts/run-single-company-browser-acceptance.mjs` passes a newly created `WriteStream` before its file descriptor is open to `spawn`; the recorded run fails with `ERR_INVALID_ARG_VALUE` before any child starts. | Blocks RC. N5/N8, REST header, list/unread, SSE, reconnect and toast counts remain unobserved. | `HARNESS-LOG-STREAM-FIX`: repair only log-stream opening/owned-temp cleanup, test it, then rerun the unchanged safe harness. |
| `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` | P2, release-blocking evidence gap | Existing finding is currently `OPEN — HARNESS EXECUTION FAILURE / P2`. `NOTIF-ACCEPT` is not authorized. | Blocks RC and notification acceptance. | After F001, capture normal authenticated N5/N8 and logout evidence; then run `NOTIF-ACCEPT`. |
| `RELEASE-GAP-F002` | P1 | `README_DEPLOYMENT.md` and `docker-compose.yml` still describe legacy `ADMIN_*` automatic first-admin behavior/default credentials, whereas current `backend/src/server.js` only permits legacy runtime bootstrap when explicitly enabled outside Production and the guarded First Run flow is authoritative. | Blocks Staging and Production: deployment material can lead operators to use a superseded, unsafe installation path. | Replace legacy deployment/bootstrap instructions and development defaults with the guarded First Run contract; add a release runbook validation. |
| `RELEASE-GAP-F003` | P1 | Official local DB is 50 applied / 1 source migration pending; First Run was accepted only on disposable migrated databases. | Blocks Staging/Production migration authorization. | Pre-deploy migration plan, backup/restore compatibility, staging migration rehearsal and owner approval; do not mutate the official DB in this audit. |
| `RELEASE-GAP-F004` | P1 | `FULL-REGRESSION` has not run at the Error Contract checkpoint. Browser role/RTL/mobile, cross-branch and integrated financial/reporting workflows are not fully observed. | Blocks RC. | Run the defined complete static/API/financial/browser matrix after browser evidence and notification acceptance. |
| `RELEASE-GAP-F005` | P1 | `backend/scripts/backup.js` defaults to pruning beyond 14 archives; current runbook has no accepted restore drill, RPO/RTO, retention ownership or immutable backup evidence. | Blocks Production. | Execute a safe restore drill and approve retention, provenance, rollback and recovery ownership. |
| `RELEASE-GAP-F006` | P1 | No current dependency-security review was performed in this audit; historical `MR1-F007` is not current vulnerability evidence and was not revalidated. | Blocks RC until assessed; no claim about current vulnerabilities is made. | Run an authorized dependency/security review, triage direct and transitive exposure, and record remediation/owner risk decisions. |
| `RELEASE-GAP-F007` | P2 | Upload MIME/size checks exist, but malware scanning, production object-storage access policy, retention and restore acceptance are not evidenced. | Blocks Production file-handling approval. | Define and test production storage, scanning, retention and recovery controls. |
| `RELEASE-GAP-F008` | P2 | No controlled load, query-plan, capacity or SSE fan-out acceptance evidence is recorded. | Blocks Production performance sign-off. | Establish bounded representative-load and observability thresholds before production go/no-go. |

No new Product behavior defect was proven by this audit. These are release
readiness, deployment-material, infrastructure, or acceptance gaps unless a
future bounded reproduction proves otherwise.

## Finding reconciliation

`DASHRES-F004` is **RESOLVED — superseded by `ERROR-CONTRACT`**. The historical
finding described database/schema failures being exposed as `422
VALIDATION_FAILED`. The current central error middleware and its focused HTTP
tests map unexpected ORM/database/query failures to safe `500
INTERNAL_SERVER_ERROR`, without SQL text or SQLSTATE. The history stays
preserved; this is not a claim that every reservation browser workflow passed.

Historic `MR1-F004`, `MR1-F005`, `MR1-F007`, and `MR1-F008` are not copied as
unverified current findings. Their still-applicable release risks are captured
by `RELEASE-GAP-F002`, `F005`, and `F006`; the obsolete 5433 verifier target is
an input to the required full-regression strategy, not proof that the current
release has executed it.

## Required evidence before each boundary

| Boundary | Must fix / prove before crossing |
| --- | --- |
| Release candidate | F001 harness repair; N5/N8 authenticated browser chronology; `NOTIF-ACCEPT`; full regression; dependency review; no P1 open finding. |
| Staging | All RC evidence plus migration rehearsal for migration 51, corrected guarded-First-Run deployment material, configured origins/secrets, backup and rollback plan, owner approval. |
| Production | Staging acceptance, backup/restore drill, retention/RPO/RTO ownership, monitoring/alerting/incident evidence, upload-storage controls, performance/capacity evidence and explicit owner go/no-go. |

## Acceptance scorecard

| Contract | Status | Evidence / limitation |
| --- | --- | --- |
| Build, typecheck and lint | PASS | Re-run in this audit; no lint errors. |
| Focused cross-domain regression | PASS | 56/56 selected tests: Error Contract, First Run, Company, notification and deposit rollback. |
| Clean migration / First Run isolated acceptance | PASS | Prior disposable PostgreSQL acceptance; official DB remains unmodified. |
| Error-envelope and PII redaction | PASS | Current source/tests; raw email/token/password/SQL binds are redacted by central logger/query logger. |
| Notification N4/N7 contract | PASS | Focused lifecycle tests. |
| Notification N5/N8 browser acceptance | NOT_OBSERVED | Harness cannot start due to F001. |
| Company REST/SSE runtime consistency | NOT_OBSERVED | No authenticated browser instrumentation. |
| Branch A→B runtime acceptance | NOT_OBSERVED | Available identity/branch count was not safely observed after harness failure. |
| First Run UI browser acceptance | DEFERRED | Static/UI tests passed; browser automation remains deferred. |
| Zero/multiple Company fail-closed states | PASS | Focused lifecycle tests. |
| Backup / restore | NOT_OBSERVED | Utility exists; restore drill has not been accepted. |
| Security dependency assessment | NOT_OBSERVED | No live advisory database consulted in this audit. |

## Release sequence and next work

```text
RELEASE-GAP-AUDIT = COMPLETE
→ RELEASE-GAP-FIX-1 (only F001: harness pre-spawn log stream and owned-temp cleanup)
→ HARNESS-LOG-STREAM-FIX
→ N5/N8 RUNTIME ACCEPTANCE
→ NOTIF-ACCEPT
→ FULL-REGRESSION
→ STAGING/RC
→ PRODUCTION
```

`RELEASE_GATE_WAIVED = NO`. `NOTIF_ACCEPT_AUTHORIZED = NO`.
`STAGING_AUTHORIZED = NO`. `PRODUCTION_AUTHORIZED = NO`.

### Arabic client-readable summary / ملخص عربي للعميل

حالة النظام ليست جاهزة للإصدار بعد. الاختبارات البرمجية الأساسية ومرحلة الإعداد
الأولي نجحت، لكن دليل التشغيل الحقيقي في المتصفح لم يُجمع لأن أداة الاختبار تتوقف
قبل تشغيل التطبيق. كما أن دليل النشر والنسخ الاحتياطي والاستعادة يحتاجان إلى
تحديث واختبار قبل أي بيئة تجريبية أو إنتاجية. لا توجد موافقة على النشر أو الإنتاج
حالياً، ولا يُسمح بتجاوز هذه البوابات.

## Audit boundaries

This document does not assert a security certification, production performance,
browser accessibility, restore capability, or Staging readiness. It records
what current source/test evidence supports and makes every missing release
claim an explicit gate.
