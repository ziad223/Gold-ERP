# Release Gap Audit

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
