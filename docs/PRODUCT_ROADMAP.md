# DARFUS Jewellery ERP — v1.0.0 Product Roadmap

## BRANCH-CONTEXT-RUNTIME-FIX — partial, evidence-only continuation required — 2026-07-28

`2b000ff` and `2e687ab` repair the authoritative active-Branch lifecycle:
validated server Branch bootstrap, fixed Company refresh preservation,
canonical `X-Branch-ID` propagation, controlled Branch gate and
Branch-discriminated customer-financial queries. N5/N8 reused-runtime evidence
passes (one Company bootstrap, Branch bootstrap, list, unread and SSE each;
zero 401/403/422, reconnects and notification error toasts). Branch A→B and
logout also pass without touching the existing 3000/8000 runtime.

The identity has no safe existing customer, therefore invoice, statement and
credit live navigation is `NOT_OBSERVED`, not PASS. `BRANCH-CONTEXT-RUNTIME-FIX
= PARTIAL`; `NOTIF_ACCEPT_AUTHORIZED = NO`; `RELEASE_READY = NO`; Staging and
Production remain unauthorized. Next only: `BRANCH-CONTEXT-RUNTIME-FIX-CONT1`
to capture that read-only evidence without creating data. Afterwards:
`NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC`.

## COMPANY-CONTEXT-RUNTIME-FIX complete — 2026-07-28

`COMPANY-CONTEXT-RUNTIME-FIX = COMPLETE`. The single-Company provider now
reaches READY before globally mounted Operator work may issue a Company-scoped
request, and a Branch change preserves the authoritative
`accessible-companies` bootstrap while isolating old scoped work. The external
runtime harness passed N5 and N8: each had one bootstrap, Branch, list, unread
and SSE lifecycle, Company context on scoped traffic, and zero 401/403/422,
reconnects and notification error toasts. Branch A→B executed against five
existing Branches; logout left zero protected notification traffic.

`N5 = PASS`; `N8 = PASS`; `NOTIF_ACCEPT_AUTHORIZED = YES`; no selector,
fallback, backend relaxation, migration or database change was made. The next
marker is `NOTIF-ACCEPT`. `RELEASE_READY = NO`, `STAGING_AUTHORIZED = NO` and
`PRODUCTION_AUTHORIZED = NO` remain unchanged.

## RELEASE-GAP-FIX-1-CONT2 — reused local runtime regression — 2026-07-28

`RELEASE-GAP-FIX-1-CONT2 = COMPLETE`; external runtime reuse is accepted:
`RELEASE-GAP-F001 = RESOLVED_BY_REUSE_MODE`. The explicit harness mode uses
only the manually started localhost 3000/8000 services and leaves them
running. Authenticated evidence then exposed a distinct Product regression:
five successful context-free bootstrap requests and one Branch request with a
Company header occurred, but the read-only Company display did not appear in
30 seconds. No list/unread/SSE/dashboard/logout lifecycle was reached; N5
fails and N8 is not observed. `COMPANY_CONTEXT_RUNTIME = FAIL`,
`NOTIF_ACCEPT_AUTHORIZED = NO`, and release gates remain unwaived. Next only:
`COMPANY-CONTEXT-RUNTIME-FIX`.

## RELEASE-GAP-AUDIT complete — 2026-07-28

`RELEASE-GAP-AUDIT = COMPLETE`; `RELEASE_READY = NO`; and
`RELEASE_BLOCKERS_FOUND = YES`. The audited checkpoint is `399badc`. Source,
focused tests (56/56), typecheck, lint and build pass, but this is not enough
for release: the authenticated browser harness fails before spawning owned
processes, so N5/N8 REST/header/list/unread/SSE/toast evidence remains
`NOT_OBSERVED`; `NOTIF_ACCEPT_AUTHORIZED = NO`.

Current release blockers are recorded in `docs/RELEASE_GAP_AUDIT.md`: harness
pre-spawn log-stream startup, obsolete First Run deployment material, migration
rehearsal, full regression, backup/restore, dependency review, storage and
performance evidence. `DASHRES-F004` is resolved by the completed Error
Contract; historic evidence is retained. The next marker is
`RELEASE-GAP-FIX-1`, restricted to the exact harness log-stream/cleanup defect.
`RELEASE_GATE_WAIVED = NO`; `STAGING_AUTHORIZED = NO`; `PRODUCTION_AUTHORIZED = NO`.

### RELEASE-GAP-FIX-1 / HARNESS-LOG-STREAM-FIX — infrastructure partial

The former `fd:null` stream defect is repaired with open-before-spawn,
idempotent close, verified owned-temp cleanup and focused real-child lifecycle
coverage. The authenticated unchanged harness no longer has the original
`ERR_INVALID_ARG_VALUE`; it is instead blocked at the backend child attempt by
`HARNESS_CHILD_SPAWN_EINVAL`, before listener readiness, login or any N5/N8
observation. Cleanup and process-scoped credential removal pass; no Product
regression is claimed. `RELEASE-GAP-F001` remains open; next only:
`RELEASE-GAP-FIX-1-CONT1` for that exact spawn cause.

### RELEASE-GAP-FIX-1-CONT1 — launcher repaired; workspace lock blocks runtime

`HARNESS_CHILD_SPAWN_EINVAL = RESOLVED`. The Windows `.cmd` launcher was the
proven cause; the harness now invokes installed Next and Playwright CLI
entrypoints through Node and validates cwd/stdio/string-only environments.
Backend readiness on 8001 and owned cleanup pass. The unchanged authenticated
run is instead blocked by a pre-existing unknown Next development process that
holds the workspace dev lock, causing owned frontend readiness failure before
3300, login or N5/N8 observation. No Product regression is claimed and no
unknown process was stopped. `RELEASE-GAP-F001` remains open; next only:
`RELEASE-GAP-FIX-1-CONT2`. `NOTIF_ACCEPT_AUTHORIZED = NO`.

## ERROR-CONTRACT complete — 2026-07-28

`ERROR-CONTRACT = COMPLETE`. Backend JSON errors now use one canonical `{ success: false, error: { code, message, details, fields, requestId } }` envelope through a central response adapter and error middleware. Stable domain codes—including Company context, First Run, notification, accounting, deposit and reservation codes—are preserved. The shared frontend client supports canonical and legacy errors, inline form-field validation, safe network/non-JSON fallbacks and one toast owner per scenario. Malformed JSON, unknown routes, ORM constraints and unexpected database errors are mapped safely; PII/secret redaction remains central. Focused contract/regression tests, typecheck, lint and production build pass.

The active sequence is `RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC → PRODUCTION`. `CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `NOTIF_ACCEPT_AUTHORIZED = NO`; release gates are not waived and Staging/Production remain unauthorized. See `docs/ERROR_CONTRACT.md`.

## FIRST-RUN acceptance complete — 2026-07-28

`FIRST-RUN-FIX-CONT1 = COMPLETE`; `FIRST-RUN-ACCEPT = COMPLETE`; `FIRST-RUN = COMPLETE`. Real PostgreSQL acceptance resolved the aggregate-lock failure and development PII query-log exposure. The clean isolated flow passed guarded status/token negatives, atomic direct Super Admin/Company/Branch/financial creation, rollback, one-winner concurrency, idempotency, login/logout/context smoke, recovery/conflict contracts, registration closure and exact-value log scans. The official database remains untouched at 50 applied / 1 pending source migration.

The active sequence is `ERROR-CONTRACT → RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC → PRODUCTION`. `CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `RELEASE_GATE_WAIVED = NO`; `NOTIF_ACCEPT_AUTHORIZED = NO`; Staging and Production remain unauthorized. Exact next marker: `ERROR-CONTRACT`.

## FIRST-RUN-ACCEPT isolated runtime result — 2026-07-28

`FIRST-RUN-ACCEPT = BLOCKED`. An isolated database was created on local PostgreSQL 5432, migrated to all 51 source migrations, and removed. The official database was not mutated and remains 50 applied / 1 pending. Pre-bootstrap classification and authorization/public-registration negatives passed, but the valid bootstrap failed before data creation: the locked state resolver sends `FOR UPDATE` on aggregate counts, which PostgreSQL rejects with `SQLSTATE 0A000`. Development query logging also emitted the generated acceptance email into the owned log, so the secret-redaction gate is not accepted.

The active sequence is `FIRST-RUN-FIX-CONT1 → FIRST-RUN-ACCEPT → ERROR-CONTRACT → RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC → PRODUCTION`. `CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `RELEASE_GATE_WAIVED = NO`; `NOTIF_ACCEPT_AUTHORIZED = NO`; Staging and Production remain unauthorized. Exact next marker: `FIRST-RUN-FIX-CONT1`.

## FIRST-RUN-FIX implementation checkpoint — 2026-07-28

`FIRST-RUN-FIX = COMPLETE`; `FIRST-RUN-ACCEPT_AUTHORIZED = YES`. The Product now has a server-authoritative setup state resolver, context-free status endpoint, token-guarded/idempotent/bootstrap API, atomic direct Super Admin/Company/Branch/financial setup service, secret-free audit, and a no-persistence setup route. `POST /auth/register` stays 410. The singleton marker migration is committed but deliberately not applied to the official local database; clean lifecycle acceptance belongs exclusively to `FIRST-RUN-ACCEPT`.

The active sequence is `FIRST-RUN-ACCEPT → ERROR-CONTRACT → RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC → PRODUCTION`. `CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `RELEASE_GATE_WAIVED = NO`; `NOTIF_ACCEPT_AUTHORIZED = NO`; Staging and Production remain unauthorized. Exact next marker: `FIRST-RUN-ACCEPT`.

## FIRST-RUN-PRE1 approved design — 2026-07-28

`FIRST-RUN-PRE1 = COMPLETE`. Fresh install has no supported first-user route: public registration is hard-disabled, normal startup is non-mutating, and System Accounts has a Super-Admin prerequisite. Manual legacy-to-Super-Admin database mutation is unsupported. `FIRST-RUN-FIX` is authorized for a guarded, server-authoritative, atomic first Super Admin/Company/Branch/financial-readiness bootstrap and separate recovery handoff. See `docs/FIRST_RUN_BOOTSTRAP_DESIGN.md`.

Roadmap: `FIRST-RUN-PRE1 → FIRST-RUN-FIX → FIRST-RUN-ACCEPT → ERROR-CONTRACT → RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC → PRODUCTION`.

`CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `RELEASE_GATE_WAIVED = NO`; `STAGING_AUTHORIZED = NO`; `PRODUCTION_AUTHORIZED = NO`. Exact next marker: `FIRST-RUN-FIX`.

## CONT5 C10 — Super Admin company scope repaired

Super Admin operational and financial calls now require a validated explicit
company selection; no implicit `user.companyId` or `CMP-DEMO` context is retained
for those paths. Context-free technical auth routes are explicitly separated.
The remaining narrow work is `DEPOSIT-1-FIX-CONT5-CONT11`: configuration
fail-closed, detailed reconciliation, orphan/cross-scope audit and rollback
evidence only.

## CONT5 C9 — P1 Super Admin scope repair required

CONT9 source mapping found that Super Admin requests without `X-Company-ID` fall
through to `user.companyId`/`CMP-DEMO`. This is incompatible with the owner’s
explicit selected-company requirement for branch-scoped finance. The only next
scope is `DEPOSIT-1-FIX-CONT5-CONT10`: fail closed for absent Super Admin company
scope, prove valid/foreign scope behavior, then resume the unexecuted CONT9
configuration, reconciliation, orphan-audit and rollback cells.

## CONT5 C8 — R2 invariant formally accepted

The Product route prevents two simultaneous active full refunds for one
reservation. Remaining CONT9 scope is Super Admin, configuration, reconciliation,
orphan-audit and rollback evidence.

## CONT5 C7 — race invariant accepted, final financial evidence open

The real route permits only one active full refund per reservation and C7 R1
concurrency produced one winner. CONT8 remains limited to Super Admin context,
configuration, reconciliation and rollback evidence.

## CONT5 C6 — idempotency and validation accepted, final runtime matrix open

Real refund request/execution idempotency and clean validation now pass. The
remaining scoped work is CONT7: refund race, inactive/Super Admin, configuration,
reconciliation and rollback evidence.

## DEPOSIT-1-FIX-CONT5-CONT5 — refund middleware accepted, financial matrix open

The local HTTP Branch Account matrix now covers refund request, approve, reject
and execute with verified-Employee success and missing-Employee/no-permission/
direct-deny denial. `DEPOSIT-CONT5-F002` remains open for refund
idempotency/race, inactive/Super Admin, configuration fail-closed, detailed
reconciliation and rollback evidence. Next: `DEPOSIT-1-FIX-CONT5-CONT6`.

## Product vision and official decisions

DARFUS v1.0.0 is a branch-safe jewellery ERP with controlled Super Admin and
fixed Branch Account access, Employee Code plus PIN operations, auditable
financial flows, Arabic/English desktop/mobile use, and a reversible release
process. The only official workspace is `H:\WORK\jewellery-erp-master`; the
only adopted local development/test database is `localhost:5432/darfus_erp`.

Completed foundations include the Next.js/Express architecture, 47 committed
migrations, 46 frontend pages, 83 models, 40 services, branch-scoped system
account schema, Customer/BranchCustomer scope helpers, reservation workflow v2,
Customer Credit ledger, cash-register/GL services, 66 verifier files, and
Arabic/English route generation. Source presence is not acceptance evidence.

## Ordered delivery plan

| Phase | Goal and allowed scope | Dependencies / risks | Acceptance evidence | Target / status |
| --- | --- | --- | --- | --- |
| MARKET-RELEASE-AUDIT1 | Documentation-only system audit and roadmap. | None. | Audit backup, findings, plans, static validation. | v1.0.0 / COMPLETE |
| LOCAL-DB-VERIFIER-ADOPT1 | Verifier-only classification/adoption for `localhost:5432/darfus_erp`; no Product changes. | Guard and validated backup; V4/V5 remain blocked. | Explicit local-target/backup/run-ID guard; 44 static verifiers passed; V4/V5 require redesign. | v1.0.0 / PARTIAL |
| BRANCH-1-VERIFIER-VALIDATE1 | Run the approved local verifier matrix after adoption. | Previous phase; known permission/catalog state. | Exact PASS/FAIL/BLOCKED results and no shared-data pollution. | v1.0.0 / BLOCKED |
| AUTH-SUPERADMIN-ADOPT1 | Convert the owner-named legacy account only after exact email and local DB proof. | Backup; exact owner target; no Branch Account conversion. | Hash/company preserved, active/unlocked, branch/default Employee cleared, sessionVersion bumped, audit event, reversal procedure. | v1.0.0 / PLANNED |
| DEPOSIT-1-DIAG-CLOSE | Close configuration and behavioral evidence for Customer Credit, reservation Araboon, down payments, and refunds. | Current P1 findings; no posting test without rollback/cleanup. | Read-only diagnosis completed; see `docs/DEPOSIT-1-DIAG-CLOSE.md`. | v1.0.0 / COMPLETE |
| DEPOSIT-1-FIX | Repair only proven deposit/refund authorization, configuration, or GL defects. | DEPOSIT-F001..F009; no unrelated Product work. | Server-derived distinct liability/treasury authority, register control, partial state model, employee-aware authorization, atomic/idempotent posting. | v1.0.0 / READY |
| DEPOSIT-1-ACCEPT | API, GL, CashRegister, receipt, cancellation/refund and duplicate-submit acceptance. | Deposit fix; safe fixture ownership. | Local C1–C15 evidence accepted: atomic rollback, fail-closed scope, reconciliation, integrity, repeatability and cleanup. | v1.0.0 / COMPLETE (LOCAL ONLY) |
| BRANCH-1-ACCEPT1 | Two-branch Customer, Reservation, Credit, inventory, journals and direct-deny acceptance. | Verifier adoption and safe fixtures. | Same-branch allow; cross-branch read/write deny; exact-ID responses; zero partial writes. | v1.0.0 / BLOCKED |
| RELEASE-BLOCKERS-FIX1 | Address approved P1 findings: permission baseline, dependency remediation, deployment gaps. | Findings triage and explicit scope. | Focused regression and security evidence. | v1.0.0 / BLOCKED |
| ENV-CONTRACT-FIX1 | Make Product runtime database configuration fail closed for Production while retaining ENV-driven local/staging behavior. | Explicit Product/config authorization. | Shared resolver, strict parsing, URL conflict refusal, focused probes. | v1.0.0 / COMPLETE |
| FULL-REGRESSION-1 | Execute all accepted static, API, financial and Browser matrices. | Prior fixes/acceptance. | Clean report with exact totals and residual warnings. | v1.0.0 / BLOCKED |
| STAGING-FOUNDATION1 | Define isolated staging environment, secrets, backups, tags, service ownership. | Server information and owner approval. | Staging runbook and health gates. | v1.0.0 / PLANNED |
| STAGING-DEPLOY1 | Deploy one approved immutable release candidate to staging. | Staging foundation. | Backup, migration, build, restart, health, rollback readiness. | v1.0.0 / BLOCKED |
| STAGING-ACCEPT1 | Run operational and Browser acceptance in staging. | Staging deployment. | Arabic/English desktop/mobile, roles, deposits, POS, reports and printing evidence. | v1.0.0 / BLOCKED |
| RELEASE-RC1 | Freeze an immutable release candidate and release notes. | Staging acceptance. | Tag `v1.0.0-rc.1`, SBOM/advisory decision, go/no-go owner approval. | v1.0.0 / BLOCKED |
| SECURITY-REVIEW1 | Review auth, CORS, uploads, dependencies, logs, secrets and attack paths. | RC scope. | Findings disposition and remediation validation. | v1.0.0 / BLOCKED |
| BACKUP-RESTORE-DRILL1 | Prove backup restore on a disposable target. | Staging; no shared DB restore. | Archive provenance, restore, integrity checks, RTO/RPO record. | v1.0.0 / BLOCKED |
| PRODUCTION-PRECHECK1 | Verify server commit/tag, clean tree, secret configuration, backup and rollback readiness. | RC and owner approval. | Explicit go/no-go record. | v1.0.0 / BLOCKED |
| PRODUCTION-DEPLOY1 | Deploy only an approved immutable tag. | Precheck and separate authorization. | Server backup, migrations, restart, smoke and rollback gate. | v1.0.0 / BLOCKED |
| POST-DEPLOY-VERIFY1 | Verify real production behavior without unsafe test data. | Deployment. | Health, logs, access, reporting, backup and monitoring record. | v1.0.0 / BLOCKED |
| V1.0.0-CLOSURE1 | Close release evidence and record known residuals. | All prior gates. | Signed owner go-live decision. | v1.0.0 / BLOCKED |

## Change intake

Every future owner request enters the roadmap as a candidate with: business
intent, affected domain, financial/inventory/security/branch impact, migration
need, acceptance evidence, rollback need, target release, and dependency.
Requests are not implemented directly from chat. A named phase is added only
after this triage and must state allowed files, commit strategy, local and
server validation, and owner approval gates. Post-v1 work includes reporting
depth, UX polish, barcode/printing enhancements, and non-blocking lint cleanup.

## LOCAL-DB-VERIFIER-REDESIGN1-RESUME

Verifier-only commit `e3215f9` closes legacy executable 5433 assumptions in the Employee/Super-Admin verifier group. Product scope is unchanged. The phase is partial: exact permission divergence blocks three V3 contracts, V4/V5 remain intentionally blocked, and one untracked local temporary archive blocks clean scope verification. Next: `LOCAL-DB-VERIFIER-REDESIGN2`.

## LOCAL-DB-VERIFIER-REDESIGN2-RESUME

Owner cleanup removed the temporary artifact, and `4fbb977`/`947ce71` close the remaining bootstrap target default. Static 66/66 now passes. The only remaining live-verifier blocker is the unchanged canonical permission baseline; next phase is `PERMISSION-BASELINE-RECONCILE1`.

## PERMISSION-BASELINE-RECONCILE1 — COMPLETE

Canonical v1.0.0 permission baseline is now 128 exact active slugs. The nine branch/customer/supplier lifecycle permissions are retained as active compatibility-required permissions because current routes enforce them; they are admin/owner-only default grants. The three sales adjustment permissions are present in the source and adopted DB and are granted only to built-in admin, owner, and manager roles. Custom roles remain unchanged and require deliberate manual assignment; direct denial remains authoritative; Super Admin and Branch Account/Employee separation are unchanged. Next: `BRANCH-1-VERIFIER-VALIDATE1` for formal branch verification evidence. Deployment remains separately blocked.

## BRANCH-1-VERIFIER-VALIDATE1 — COMPLETE

Formal validation proved 66/66 static/readiness PASS, 6/6 finalized guarded V3 PASS, V2 rollback PASS, exact 128 permission/48 migration baseline, fixture cleanup, and V4/V5 fail-closed safety. CONT1 proved `B1VV-F001` is a Phase 32.4 historical full-demo snapshot probe, not a mandatory Branch-1 Product contract: its unchanged read-only live mode still reports 11 versus historical 20 assets, while the mandatory static mode passes. No persistent data or verifier/Product code was changed. Next: `DEPOSIT-1-DIAG-CLOSE`; Browser, staging, and deployment remain separate gates.

## DEPOSIT-1-DIAG-CLOSE — COMPLETE

The release-blocker diagnosis is closed at `bb664ed` with no Product or DB write.
Reservation payment data is structurally distinct from Customer Credit, but both
use `CUSTOMER_DEPOSIT_LIABILITY`; receipt hard-codes `1110/1120`, refund accepts
a raw client treasury code, and neither path enforces a cash-register session.
Current local configuration has zero role mappings and sessions. Partial
application/refund and Branch-Employee-aware refund action are absent. Next is
the narrowly bounded `DEPOSIT-1-FIX`, then `DEPOSIT-1-ACCEPT`; Browser, staging,
deployment, notifications and UX remain separate phases.

## DEPOSIT-APPLICATION-CONTRACT1 — v1.0.0 policy closed

Owner-approved Option A allows multiple receipts and bounded partial pre-sale
refunds, but applies a reservation deposit only at `complete-sale`. Standalone
application, allocation to an existing AR/invoice, and multi-invoice allocation
are deferred. `DEPOSIT-1-FIX-CONT3` may finish the preserved implementation;
deployment remains separately blocked until financial acceptance completes.

## DASHBOARD-LOOP-FIX1 — COMPLETE

`593b84c` closes the source-proven `DASHRES-F001` dashboard stability defect by
using stable module-level fallbacks for the six no-data collections passed to
`LocalDashboardProvider`. Focused regression tests, typecheck, targeted lint,
production build, and diff hygiene pass. This is deliberately not a
reservations-API fix: the authenticated 422 body, backend producer, valid
control, and request-storm relationship remain unproven. Next is
`DASHBOARD-RESERVATIONS-DIAG1-CONT2` for one owner-authorized authenticated
network capture; do not resume `DEPOSIT-1-FIX-CONT4C` automatically.

## DASHBOARD-RESERVATIONS-DIAG1-CONT2 — COMPLETE

The authenticated reservations 422 is a local pending-schema condition, not an
auth or query-context defect. The current `ReservationPayment` model selects
`reservation_payments.cash_transaction_id` through the `payments` include alias;
the matching source migration `20260721020000` is absent from the local 48-row
migration history. The next bounded phase is `DASHBOARD-RESERVATIONS-FIX1`: a
backup-gated, forward-only migration correction and focused read acceptance. It
must not use manual DDL, model suppression, or error swallowing.

## DASHBOARD-RESERVATIONS-FIX1 — local repair complete

The official development schema now has the required reservation-payment cash
links after the existing first pending migration was backup-gated and applied
once (history 48→49). Receipt migration `20260721030000` remains pending. ORM
read paths and authenticated Arabic dashboard/reservations UI are stable;
formal acceptance still needs a real authorized detail/link case and isolation
matrix. Next: `DASHBOARD-RESERVATIONS-ACCEPT1`. `DASHRES-F004` is unchanged.

## DASHBOARD-RESERVATIONS-ACCEPT1 — partial

The repaired list/detail schema path and dashboard runtime are locally stable,
but linked cash/session object hydration is not implemented: only scalar FKs are
present, with no Sequelize associations. The applied migration and model/schema
contract are also uncommitted preserved Deposit work. `DASHRES-F006` and the
release-source gate belong to `DEPOSIT-1-FIX-CONT4C`; Staging/Production are
blocked pending coherent source integration. Next: `DASHBOARD-RESERVATIONS-ACCEPT1-CONT2`.

## DASHBOARD-RESERVATIONS-ACCEPT1-CONT2 — integration complete, matrix pending

`9d391c4` closes the applied-local/uncommitted-source gap and adds explicit
nullable `cashTransaction` and `cashRegisterSession` associations for
ReservationPayment. Focused null/non-null rollback-only hydration, list/detail,
resolver fail-closed, dashboard-loop regression, typecheck, targeted lint, and
build passed. Receipt migration `20260721030000` remains pending and out of this
commit. The next bounded acceptance work is the unavailable multi-account
matrix: `DASHBOARD-RESERVATIONS-ACCEPT1-CONT3`. `DASHRES-F004` remains separate.

## DASHBOARD-RESERVATIONS-ACCEPT1-CONT3 — API isolation accepted

`DASHRES-F007` is closed by real authenticated local API evidence for Company
Admin, Branch Account, verified Employee, missing Employee, direct-deny,
cross-branch, cross-company, and selected-context Super Admin reads. Browser
multi-account UI remains an explicit safe-evidence limitation, not a defect.
Next: `DEPOSIT-1-FIX-CONT4C`; keep receipt migration `20260721030000` pending
and `DASHRES-F004` open.

## DEPOSIT-1-FIX-CONT4C — receipt source and local migration complete

Commit `2afa6d9` adds the immutable reservation-deposit receipt source. Local
development migration `20260721030000` is applied once: source/applied count is
50/50 with no pending migration. First run `DEPOSIT-1-FIX-CONT4D` to close the
named bounded receipt fixture/runtime acceptance gap; then continue with CONT5
for complete-sale/refund alignment, Branch Settings UI, and reconciliation. Do
not reopen dashboard work.

## DEPOSIT-1-FIX-CONT4D-CONT1 — receipt runtime accepted

The isolated local receipt journey now passes end-to-end and `DEPOSIT-RDR-F001`
is closed. It exercised the committed payment/receipt transaction, accounting,
idempotency replay/conflict, receipt reads/history, immutable Arabic/English
snapshot and exact cleanup with zero residue; no Product change was needed.
Next: `DEPOSIT-1-FIX-CONT5` for the remaining complete-sale/refund alignment,
Branch Settings UI, bounded-refund UI and reconciliation only. Keep
`DASHRES-F004` separate; no deployment is authorized.

## DEPOSIT-1-FIX-CONT5 implementation complete — 2026-07-26

Complete sale applies only deterministic remaining reservation-deposit subledger
value and leaves residual customer due on the final invoice. Partial pre-sale
refunds are bounded immutable allocations; server financial resolution is
branch-scoped and rejects raw client account, register or session authority. The
Branch Settings editor/API exposes only eligible active branch accounts. Focused
static verification, typecheck, lint and build pass. Next:
`DEPOSIT-1-FIX-CONT5-CONT1` for owned local runtime/GL/reconciliation
acceptance; no deployment is authorized and `DASHRES-F004` remains separate.

## DEPOSIT-1-FIX-CONT5-CONT1 partial runtime result — 2026-07-26

The first exact-owned financial run proves multi-receipt completion,
partial-refund completion, selected fail-closed conditions, branch/company
denial and zero-residue cleanup on local development only. Next:
`DEPOSIT-1-FIX-CONT5-CONT2`, limited to employee/direct-deny, race/idempotency,
high-count and rollback/failure-seam evidence. No deployment is authorized.

## DEPOSIT-1-FIX-CONT5-CONT2 partial evidence — 2026-07-26

C2 added positive controlled evidence for one-winner complete-sale concurrency,
deposit replay/conflict and 25-receipt settlement. The next phase remains
`DEPOSIT-1-FIX-CONT5-CONT3`: establish real Employee/direct-deny middleware,
refund race/idempotency, remaining fail-closed, reconciliation and rollback
acceptance. No deployment is authorized.
### CONT5-CONT11 outcome — 2026-07-26

Selected configuration fail-closed and one owned reconciliation scenario were exercised locally and cleaned to zero. CONT5 is not closed: retain DEPOSIT-CONT5-F002 until all named configuration/reconciliation/orphan cells and permanent isolated rollback coverage exist. Next: DEPOSIT-1-FIX-CONT5-CONT12.

### CONT5-CONT12 checkpoint — 2026-07-26

The existing live rollback verifier requires non-owned branch/customer readiness and therefore cannot supply C12-owned acceptance evidence. Next: DEPOSIT-1-FIX-CONT5-CONT13, limited to a permanent guarded verifier/test with its own complete fixture graph.

### CONT16-CONT1 checkpoint — 2026-07-26

The first permanent Deposit rollback cell is accepted locally: journal-persistence failure rolls back and a restored retry succeeds in the fully owned verifier. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT2` for Deposit receipt-persistence rollback.

### CONT16-CONT2 checkpoint — 2026-07-26

Deposit receipt-persistence rollback is accepted locally with exact zero-commit and retry evidence. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT3` for Deposit idempotency-success persistence rollback.

### CONT16-CONT3 checkpoint — 2026-07-27

All three Deposit rollback cells are locally accepted: journal, receipt and idempotency-success persistence. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT4` for Refund cash-out persistence rollback.

### CONT16-CONT4 checkpoint — 2026-07-27

Refund cash-out persistence rollback is accepted locally with zero-commit, same-key retry and replay evidence. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT5` for Refund journal-persistence rollback.

### CONT16-CONT5 checkpoint — 2026-07-27

Refund journal-persistence rollback is accepted locally: the scoped owned `JournalEntry.create` failure rolled back the real transaction, and restored same-key retry/replay remained single-effect and receipt-immutable. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT6` for Refund allocation-persistence rollback.

### CONT16-CONT6 checkpoint — 2026-07-27

Refund allocation-persistence rollback is accepted locally: staged Refund journal and cash work rolled back with the exact owned allocation failure; restored retry/replay created only one scoped allocation and retained receipt immutability. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT7` for Refund idempotency-success persistence rollback.

### CONT16-CONT7 checkpoint — 2026-07-27

All Refund rollback cells are now accepted locally: cash-out, journal, allocation and idempotency-success failures each roll back the real owned transaction, and contract-correct retries/replays remain single-effect. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT8` for Complete-sale final invoice/sale persistence rollback.

### CONT16-CONT8 checkpoint — 2026-07-27

The first Complete-sale rollback cell is accepted locally: an owned `Invoice.create` failure rolled back the real transaction with no final-sale artifact, and restored same-key retry/replay created one completion only. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT9` for Complete-sale accounting-persistence rollback.

### CONT16-CONT9 checkpoint — 2026-07-27

Complete-sale accounting persistence rollback is accepted locally: an owned final-sale `JournalEntry.create` failure rolled back staged Invoice, inventory and all accounting, then retry/replay remained single-effect. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT10` for Deposit-application persistence rollback.

### CONT16-CONT10 checkpoint — 2026-07-27

Complete-sale Deposit-application persistence rollback is accepted locally: an owned `ReservationPaymentApplication.create` failure rolled back staged Invoice, accounting and inventory inside the real transaction; same-key retry/replay created one scoped application and one completion only. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT11` for Complete-sale idempotency-success persistence rollback.

### CONT16-CONT11 checkpoint — 2026-07-27

All Complete-sale rollback seams are accepted locally: Invoice, accounting, Deposit-application and idempotency-success failures each roll back the real owned transaction, while same-key retries/replays remain single-effect. CONT5 remains open. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT12` for the configuration and no-fallback matrix.

### CONT16-CONT12 blocker — 2026-07-27

The configuration/no-fallback matrix is blocked by `DEPOSIT-CONT16-C12-F001`: Complete-sale accepts absent branch-scoped AR/revenue/VAT/COGS/inventory configuration and auto-creates company-code accounts. Deposit and Refund guard cells passed; no Product fix was made because a correct final-sale account-role contract requires a focused follow-up. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT12-CONT1`.

### CONT16-CONT12-CONT1 checkpoint — 2026-07-27

The Complete-sale account fallback is closed through the existing branch-scoped `system_account_roles` contract; no migration was required. A future explicit Super Admin role-mapping management API/UI remains a controlled setup/onboarding item, but financial execution now fails closed until valid mappings exist. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT13`.

## CONT16-CONT13 checkpoint — 2026-07-27

The fully owned Deposit lifecycle reconciliation is accepted locally: Deposit/Refund liability and treasury, Invoice/AR/application, VAT/Revenue and COGS/Inventory all reconcile exactly and replay is financially inert. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT14` for the orphan, duplicate and cross-scope audit.

## CONT16-CONT14 checkpoint — 2026-07-27

The fully owned orphan, duplicate and cross-scope acceptance audit is accepted locally. Deposit, Refund and Complete-sale graph links, replay identity and scoped-resource rejection passed without a Product fix. The next remaining CONT16 acceptance work is repeatability/regression only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT15`.

## CONT16-CONT15 checkpoint — 2026-07-27

The final local technical acceptance repeatability gate is accepted. Two equivalent fully owned Deposit/Refund/Complete-sale runs passed every committed suite, cleaned to zero, and matched on normalized business evidence. `DEPOSIT-CONT5-F002` is resolved; next only: `DEPOSIT-1-ACCEPT` for the formal local decision, with no Product change or deployment.

### DEPOSIT-1 local technical acceptance milestone — 2026-07-27

Deposit/Refund/Complete-sale local backend technical acceptance is complete: `DEPOSIT-1-ACCEPT = COMPLETE`, `DEPOSIT_REFUND_COMPLETE_SALE_LOCAL_TECHNICAL_ACCEPTANCE = ACCEPTED`, and `DEPOSIT-CONT5-F002 = RESOLVED`. This milestone covers the committed C1–C15 evidence chain only. It does not approve deployment, Staging, Production or Product-wide readiness. The next Product roadmap marker is `NOTIF-PRE1`: diagnose only the notification 401/422 storm, duplicate notification queries/toasts, auth/company-context gating and the request loop; do not implement the fix automatically.

### NOTIF-PRE1 checkpoint — 2026-07-27

Static diagnosis proves the notification list/count and SSE stream omit an explicit Super Admin `X-Company-ID` path. The list/count requests are blocked by the correct `422` contract; SSE classifies that permanent context error as reconnectable and retries up to eight times; two independent query failures reach the single global toast owner. React Strict Mode is enabled, but no non-idempotent notification effect or duplicate query key was proven. The authenticated browser chronology is the remaining gap; next only: `NOTIF-PRE1-CONT1`. No fix, fallback, deployment or Product behavior change was made.

### NOTIF-PRE1-CONT1 capture attempt — 2026-07-27

The required authenticated Super Admin capture could not start: local frontend listeners 3000/3001 were absent and the available browser had no tab/session; no safe existing identity or Company context was available to use. This is an access/environment gap, not evidence against the static notification findings. The next marker is narrowed to `NOTIF-PRE1-CONT1-CONT1`; do not begin `NOTIF-FIX` until N4, N5, N7 and N8 are captured from an authenticated local session.

### NOTIF-PRE1-CONT1-CONT1 checkpoint — 2026-07-27

The documented Next development command was attempted on both expected free frontend ports, 3000 then 3001. Both failed before readiness with local `listen EACCES`; no frontend listener or process remained. This blocks the authenticated runtime capture without authorizing a port workaround, configuration change or Product change. `NOTIF-FIX` remains unauthorized. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1` to resolve local frontend availability, then capture N4/N5/N7/N8.

### NOTIF-PRE1-CONT1-CONT1-CONT1 checkpoint — 2026-07-27

Windows TCP exclusions, not an active listener, caused the 3000/3001 bind restriction. A loopback-only frontend safely ran on 3300 after a successful socket probe, but the existing backend CORS allow-list accepted the configured `localhost:3000` origin and rejected the safe `127.0.0.1:3300` origin. The phase must not mutate either side, so authenticated runtime capture remains blocked at this exact local-origin compatibility boundary. `NOTIF-FIX` remains unauthorized; next only: `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1`.

### NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1 owned-origin checkpoint — 2026-07-27

The ENV-driven local origin contract passed through a short-lived owned backend on 8001 and loopback webpack frontend on 3300; no source, `.env`, system or existing port-8000 mutation occurred. Normal login as a safe local Super Admin made N4 reproducible: list and unread each made one missing-context `422`, generated separate global toasts, and the event stream made its initial request plus eight 422 reconnects. Normal logout produced no persistent notification request, 401, stream, or toast leak in the observed window. The runtime profile surface has no authoritative Super Admin Company-selection control, so N5 and valid-Company N8 remain intentionally not executed and no header bypass was used. `NOTIF-PRE1` remains PARTIAL and `NOTIF-FIX` remains unauthorized. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-CONT1` to observe that exact Company-context path, then N5/N8; do not implement a fix.

### NOTIF-PRE1 Company-context closure — 2026-07-28

The final Company-context inventory is conclusive: there is no authoritative Super Admin Company list, selector, switch route/action, persisted selection or REST/SSE propagation path. The existing Company object is login/profile display data; it is not request authority. Branch switching and Company profile editing are not Company selection. `NOTIF-PRE1 = COMPLETE` with `NOTIFICATION_401_422_STORM_DIAGNOSIS = COMPLETE_WITH_UX_DEPENDENCY`. The storm fix is independently authorized: next is `NOTIF-FIX` for no-context gating, terminal SSE handling, logout safety and toast control only. Then `UX-PRE1` must establish the missing Company-context path before integrated N5/N8 success acceptance. No selector or notification fix was implemented in diagnosis.

### NOTIF-FIX local lifecycle repair — 2026-07-28

The independently bounded notification repair is complete locally. It uses one explicit Company-scoped readiness predicate for notification list, unread-count and SSE; a Super Admin without authoritative Company context now produces zero notification traffic, zero notification-specific context toast and zero SSE reconnect. Stable 4xx SSE failures are terminal until state changes; logout remains closed; future explicit context uses the same Company for REST, SSE and query-cache isolation. The backend remains fail-closed and no Company fallback was introduced. N5/N8 valid-context acceptance is still deferred because `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains open: there is no selector/authority to establish that context normally. Next only: `UX-PRE1` to diagnose the Company-selection experience; do not deploy or begin unrelated work.

### UX-PRE1 Company-context design — 2026-07-28

The Super Admin Company-context design is approved, not implemented. `UX-FIX` will add a minimal context-free authenticated accessible-Company bootstrap, a mandatory root selection gate plus persistent header switcher, one tab-local validated state machine, automatic header/SSE propagation only after READY, Company-safe cache/generation isolation, Branch reset/revalidation, invalid-context recovery and logout cleanup. Current Company profile/login data remains display-only. The backend stays header-only and fail-closed; no first-Company fallback is permitted. Empty Company access hands off to `FIRST-RUN-PRE1`. After `UX-FIX`, run `NOTIF-ACCEPT` for N5/N8 and A→B integration. No deployment authorization exists.

### UX-FIX implementation checkpoint — 2026-07-28

The approved Company-context implementation is in place: authenticated context-free bootstrap, tab-local user-bound state, no-context gate, header switcher, explicit scoped REST/SSE context, query cleanup, Branch reset and logout cleanup. Local N0 passed and N5 selection UI passed: the single accessible Company selected normally and the dashboard switcher appeared. Browser tooling did not expose the N5 REST/SSE/header counts, so full N5 acceptance remains unproven. N8 did not pass: a hard reload in the available in-app browser returned to the gate instead of restoring validated Company context. No browser storage inspection or mutation was used, so the exact persistence/hydration cause remains unresolved. `UX-FIX` is therefore partial, the P2 Company-context finding remains open, and `NOTIF-ACCEPT` must not begin. Next only: `UX-FIX-CONT1` to resolve N8 safely; no fallback, deployment or unrelated work is authorized.

### UX-FIX-CONT1 single-Company/multi-Branch revision — 2026-07-28

The Company model is revised to one server-authorized Company and multiple operational Branches. Company startup no longer reads or persists a user choice: bootstrap classifies 0/1/many as setup-required/READY/configuration-conflict, retains backend fail-closed behavior, and makes the Company label read-only. Branch remains the operational switcher. Typecheck, focused tests, lint and production build pass. The owned local backend/frontend topology became ready but browser automation was unavailable, so N5/N8 headers, notification counts and SSE evidence remain unobserved. Next only: `UX-FIX-CONT1-CONT1` for that runtime evidence; `NOTIF-ACCEPT` remains unauthorized.

### UX-FIX-CONT1-CONT1 browser/session gate — 2026-07-28

The narrowed runtime-only preflight confirmed that no browser service is currently available. No owned topology was started and no authentication attempt was made. The previously implemented single-Company contract remains unchanged, while N5/N8 acceptance evidence remains pending. Next only: `UX-FIX-CONT1-CONT1-CONT1` to restore a safe browser/session surface; `NOTIF-ACCEPT` remains unauthorized.

### UX-FIX-CONT1-CONT1-CONT1 browser-service resolution — 2026-07-28

The supported browser-control runtime enumerated zero available bindings. Chrome and Edge executables are installed, but no safe browser attachment or automation service is available; no alternate controller, profile reuse, token handling, owned topology, or login was attempted. The focused single-Company/notification/auth baseline remains 14/14 PASS, but N5/N8 REST, header, list, unread, SSE, toast, logout and Branch evidence remains `NOT_OBSERVED`. `NOTIF-ACCEPT` remains unauthorized. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1` to restore the supported safe browser/session surface.

### UX-FIX-CONT1-CONT1-CONT1-CONT1 repository-local harness — 2026-07-28

`21d98db` adds a repository-local Playwright harness that launches only installed Chrome/Edge through an isolated temporary context and writes sanitized evidence outside Git. It starts the owned 8001/3300 topology only after both process-scoped safe login variables are present, then asserts N5, N8, optional Branch A→B and logout contracts. Current environment has no `DARFUS_E2E_EMAIL`/`DARFUS_E2E_PASSWORD`; the launcher fail-closed with exit 2 and no process started. Therefore runtime evidence remains `NOT_OBSERVED`, the P2 finding remains open as authenticated-session unavailable, and `NOTIF-ACCEPT` remains unauthorized. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1`.

### UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1 harness execution failure — 2026-07-28

The approved process-scoped local test identity was supplied and the unchanged harness was run once. It exited 1 before backend/frontend/browser startup: its asynchronous `WriteStream` had no file descriptor when used as `spawn` stdio. Credentials were removed; no listener appeared on 3300/8001 and 8000/5432 were untouched. N5/N8 remain `NOT_OBSERVED`; this is harness infrastructure, not a Product regression. `NOTIF-ACCEPT` remains unauthorized. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1` to repair only the exact log-stream startup/cleanup defect.
