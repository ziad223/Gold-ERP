# Market Release Findings Register

## BRANCH-CONTEXT-RUNTIME-FIX — 2026-07-28

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| BRANCH-CONTEXT-RUNTIME-F001 | P2, release-blocking operational runtime regression | IMPLEMENTED — pending customer-financial runtime evidence | Root causes were split Branch authority (storage/display versus request client), customer invoice `skipBranch`, ungated statement/credit queries, and fixed-Company refresh clearing the Branch candidate. The canonical Branch provider, client accessor, server validation, Branch-aware keys and customer-financial gates are implemented and focused tests pass. Reused runtime proves N5/N8 Branch readiness, A→B header propagation and logout; `CUSTOMER_A` is unavailable for safe read-only invoice/statement/credit navigation. Do not create data; capture that exact evidence next. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 | P2 | OPEN — final notification acceptance remains gated | Company lifecycle evidence remains valid, but `NOTIF-ACCEPT` is paused until the Branch customer-financial runtime boundary is closed. Notification Company-only list/unread/SSE behavior itself remained non-regressed in this phase. |

## COMPANY-CONTEXT-RUNTIME-FIX — accepted runtime repair — 2026-07-28

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| COMPANY-CONTEXT-RUNTIME-F001 | P2, release-blocking runtime regression | RESOLVED | Root cause: global Operator bootstrap called Company-scoped `/operator/current` before Company READY, whose fail-closed `422` re-invalidated the context. Branch switching also cleared the authoritative bootstrap cache. Focused tests (32/32), typecheck and lint pass. Reused-runtime browser evidence passed N5/N8 (one bootstrap/list/unread/SSE each; zero 401/403/422, reconnects and notification error toasts), Branch A→B, and logout safety. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 | P2 | OPEN — FINAL NOTIFICATION ACCEPTANCE REQUIRED | The Company-context runtime prerequisite is resolved and `NOTIF_ACCEPT_AUTHORIZED = YES`; run the separately scoped `NOTIF-ACCEPT` lifecycle acceptance before considering release readiness. |

## RELEASE-GAP-AUDIT — current release findings — 2026-07-28

### RELEASE-GAP-FIX-1-CONT2 — external runtime result — 2026-07-28

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| RELEASE-GAP-F001 | P1 | RESOLVED — external-runtime reuse mode | Explicit localhost-only reuse mode fingerprints the pre-existing DARFUS services and never spawns, stops or registers them as owned. Launcher tests, typecheck and lint pass; 3000/8000 survived browser-only cleanup. |
| COMPANY-CONTEXT-RUNTIME-F001 | P2, release-blocking runtime regression | OPEN — Company Context never reaches READY | Authenticated browser evidence: login `200`; accessible-Companies `200` five times without a Company header; Branch `200` once with Company header; the read-only Company display never appeared in 30 seconds. List/unread/SSE/dashboard/logout and N8 were therefore not reached. Resolve only the authoritative single-Company state/invalidation sequence; do not add a selector, fallback or manual context bypass. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 | P2 | OPEN — COMPANY CONTEXT RUNTIME FAILURE | N5 did not establish Company READY; integrated list/unread/SSE/header/toast/logout evidence remains unaccepted and `NOTIF-ACCEPT` remains unauthorized. |

The audit at `399badc` is complete and is read-only. It does **not** authorize
RC, Staging or Production. The historical rows below are retained as evidence;
the dispositions in this section are the current release-audit view.

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| RELEASE-GAP-F001 | P1 | OPEN — harness pre-spawn log-stream defect | `scripts/run-single-company-browser-acceptance.mjs` gives `spawn` an asynchronous WriteStream before its `fd` is open. The documented safe run exits with `ERR_INVALID_ARG_VALUE` before any owned child, login, N5 or N8 observation. `RELEASE-GAP-FIX-1` may repair only that stream-opening and owned-temp-cleanup defect. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 | P2 | OPEN — HARNESS EXECUTION FAILURE | Preserve the existing finding: authenticated N5/N8 REST/header/list/unread/SSE/toast/logout evidence is not observed; `NOTIF-ACCEPT` remains unauthorized. |
| RELEASE-GAP-F002 | P1 | OPEN — deployment material contradicts guarded First Run | `README_DEPLOYMENT.md` and `docker-compose.yml` still advertise legacy `ADMIN_*` automatic first-admin/default behavior while the accepted guarded setup API is authoritative. Correct the material and validate the release procedure before Staging. |
| RELEASE-GAP-F003 | P1 | OPEN — migration rehearsal/deployment gate absent | Official `darfus_erp` remains 50 applied / 1 source migration pending; isolated First Run acceptance does not authorize a server migration. Require backup/rollback compatibility and a Staging rehearsal. |
| RELEASE-GAP-F004 | P1 | OPEN — full current-head regression incomplete | N5/N8, integrated notification acceptance, role/RTL/mobile Browser evidence and the complete current release matrix are not accepted. |
| RELEASE-GAP-F005 | P1 | OPEN — backup/restore acceptance absent | The backup utility's default 14-file pruning has no accepted restore drill, RPO/RTO, retention or provenance evidence. |
| RELEASE-GAP-F006 | P1 | OPEN — current dependency security review absent | Historical advisory data is not reasserted as current. An authorized current dependency review and owner triage are required before RC. |
| RELEASE-GAP-F007 | P2 | OPEN — production upload/storage controls unaccepted | MIME/size checks are source-proven, but scanning, storage access policy, retention and recovery are not accepted. |
| RELEASE-GAP-F008 | P2 | OPEN — performance/capacity evidence absent | No accepted representative load, query-plan, capacity or SSE fan-out evidence exists. |

| Historical ID | Current disposition |
| --- | --- |
| DASHRES-F004 | RESOLVED — superseded by `ERROR-CONTRACT`; current unexpected ORM/database failures map safely to 500 rather than `422 VALIDATION_FAILED`. Historic rows remain below. |
| MR1-F004 / MR1-F005 / MR1-F007 / MR1-F008 | Historic source evidence only; their live release consequences are reconciled above rather than duplicated. |

### RELEASE-GAP-FIX-1 update — 2026-07-28

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| RELEASE-GAP-F001 | P1 | OPEN — `HARNESS_CHILD_SPAWN_EINVAL` | The `fd:null` root cause is fixed: a real opened WriteStream is passed only after `open`, real-child and cleanup regression tests pass, and owned logs/temp cleanup is safe. The unchanged authenticated harness now reaches the backend spawn attempt but the child emits `EINVAL` before readiness. No listener, login or N5/N8 evidence occurred. `RELEASE-GAP-FIX-1-CONT1` owns only this exact Windows child-spawn cause. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 | P2 | OPEN — HARNESS EXECUTION FAILURE | N5/N8/list/unread/SSE/header/toast/logout evidence remains `NOT_OBSERVED`; `NOTIF-ACCEPT` remains unauthorized. |

### RELEASE-GAP-FIX-1-CONT1 update — 2026-07-28

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| RELEASE-GAP-F001 | P1 | OPEN — `FRONTEND_NEXT_DEV_LOCK_CONFLICT` | `HARNESS_CHILD_SPAWN_EINVAL` is resolved: direct Node entrypoints replace Windows `.cmd` shims, real-child and failure-path tests pass, and backend readiness/owned cleanup pass. The unchanged run reaches frontend startup, which exits before 3300 readiness because a pre-existing unknown Next development process holds the workspace dev lock. No unknown process was stopped; N5/N8 remain unobserved. `RELEASE-GAP-FIX-1-CONT2` owns only this lock boundary. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 | P2 | OPEN — HARNESS EXECUTION FAILURE | Login, N5/N8/list/unread/SSE/header/toast/Branch/logout evidence is still `NOT_OBSERVED`; `NOTIF-ACCEPT` remains unauthorized. |

## ERROR-CONTRACT — standardized and verified — 2026-07-28

| ID | Severity | Status | Evidence / disposition |
| --- | --- | --- | --- |
| ERROR-CONTRACT-F001 | P1 | RESOLVED | Ad hoc direct error bodies are normalized centrally into the canonical envelope without a risky route-by-route rewrite; stable codes are preserved. |
| ERROR-CONTRACT-F002 | P1 | RESOLVED | ORM/database/query failures map to safe `500 INTERNAL_SERVER_ERROR`; 5xx direct-route messages, SQLSTATE, SQL, stacks and binds do not reach the client. |
| ERROR-CONTRACT-F003 | P2 | RESOLVED | Shared frontend parser preserves code/status/request ID, handles legacy/non-JSON/network failures, and Query/Mutation validation toast suppression preserves notification terminal ownership. |
| ERROR-CONTRACT-F004 | P2 | RESOLVED | Canonical `fields` maps public field names to deterministic message arrays; the First Run form renders inline accessible validation errors. |
| ERROR-CONTRACT-F005 | P2 | RESOLVED | A bounded request ID is accepted or generated server-side, returned in headers/error bodies and logged as redacted-safe metadata. |

`ERROR-CONTRACT = COMPLETE`; contract tests, First Run/Company/notification/deposit regressions, typecheck, lint and production build pass. Browser N5/N8 and notification runtime acceptance remain separate mandatory gates. See `docs/ERROR_CONTRACT.md`.

## FIRST-RUN-FIX-CONT1 — acceptance regressions resolved — 2026-07-28

`FIRST-RUN-ACCEPT-F001` is **RESOLVED**: aggregate state reads no longer request `FOR UPDATE`; the existing transaction-scoped advisory lock serializes the real PostgreSQL bootstrap safely. Clean real-PostgreSQL rollback, concurrency, replay/conflict, direct creation and readiness tests pass.

`FIRST-RUN-ACCEPT-F002` is **RESOLVED**: development SQL rendering is disabled by default, optional SQL metadata is shape-only, and central logging redacts auth/setup/database values. Exact-value scans found zero generated email, password, setup token, idempotency key, access token or refresh-token occurrences in owned logs/evidence.

`FIRST-RUN-F001`, `FIRST-RUN-F002` and `FIRST-RUN-F004` are **RESOLVED**. `FIRST-RUN-F003` is **RESOLVED_FOR_HANDOFF_CONTRACT**: unsafe partial states continue to return `RECOVERY_REQUIRED` without automatic repair or legacy promotion. `FIRST-RUN-ACCEPT = COMPLETE`; browser/notification runtime findings remain separately deferred.

## FIRST-RUN-ACCEPT — isolated PostgreSQL acceptance blocked — 2026-07-28

`FIRST-RUN-ACCEPT-F001` is **OPEN — P1**: the real PostgreSQL bootstrap transaction fails before creating any setup data. `first-run-bootstrap.service.js` requests a locked state reclassification, and `first-run-setup-state.service.js` applies `FOR UPDATE` to aggregate `Company.count` / `User.count` queries. PostgreSQL returns `SQLSTATE 0A000` (`FOR UPDATE is not allowed with aggregate functions`); the API returns `422 VALIDATION_FAILED`. The isolated database remained empty and was dropped. Target: `FIRST-RUN-FIX-CONT1`.

`FIRST-RUN-ACCEPT-F002` is **OPEN — P1**: the owned development backend's Sequelize query logging emitted the generated acceptance email in its local log while processing the attempted login lookup. This violates the acceptance secret-redaction contract. The owned temporary files were deleted and no secret entered Git. Target: `FIRST-RUN-FIX-CONT1`.

`FIRST-RUN-F001` and `FIRST-RUN-F004` are **IMPLEMENTATION REGRESSION — P1**, not resolved: direct first-user and atomic Company/Branch/financial creation cannot complete until F001 is corrected. `FIRST-RUN-F002` remains **IMPLEMENTED — PENDING ACCEPTANCE / P1**; no legacy promotion occurred. `FIRST-RUN-F003` remains **RECOVERY HANDOFF IMPLEMENTED — FULL RECOVERY DEFERRED / P2**. `FIRST-RUN-ACCEPT_AUTHORIZED` was exercised but is blocked; `FIRST-RUN-FIX-CONT1_AUTHORIZED = YES`.

## FIRST-RUN-FIX — guarded bootstrap implemented, acceptance pending — 2026-07-28

`FIRST-RUN-F001` is **IMPLEMENTED — PENDING ACCEPTANCE / P1**: the guarded first-user API/UI and direct canonical Super Admin creation now exist; clean-install acceptance still must prove the real migration, one-time flow, login and replay. `FIRST-RUN-F002` is **IMPLEMENTED — PENDING ACCEPTANCE / P1**: no legacy-user promotion path is used. `FIRST-RUN-F003` is **RECOVERY HANDOFF IMPLEMENTED — FULL RECOVERY DEFERRED / P2**: partial/no-admin states return `RECOVERY_REQUIRED`; no automatic repair or public reset was added. `FIRST-RUN-F004` is **IMPLEMENTED — PENDING ACCEPTANCE / P1**: Company, Branch and mandatory financial rows are one locked transaction and focused rollback test passes.

`FIRST-RUN-FIX = COMPLETE`; `FIRST-RUN-ACCEPT_AUTHORIZED = YES`. Repository migration `20260728010000-create-first-run-setup-state.js` is pending for an isolated acceptance topology only; the official local DB was not migrated or changed. `PUBLIC_REGISTRATION = DISABLED`; browser N5/N8 and `NOTIF-ACCEPT` remain deferred/not authorized. Exact next marker: `FIRST-RUN-ACCEPT`.

## FIRST-RUN-PRE1 — first privileged operator gap — 2026-07-28

`FIRST-RUN-F001` is **OPEN — P1**: a migration-only fresh installation has no supported Product path to create its first active Super Admin. `POST /auth/register` is an explicit 410; normal startup skips runtime bootstrap; System Accounts requires an authenticated Super Admin.

`FIRST-RUN-F002` is **OPEN — P1**: manual promotion of a `legacy` database user bypasses canonical password, role, audit and access invariants. `FIRST-RUN-F003` is **OPEN — P2**: password recovery only serves existing accounts. `FIRST-RUN-F004` is **OPEN — P1**: Company, Branch and financial-role readiness are not one atomic first-install operation.

Approved remedy: `docs/FIRST_RUN_BOOTSTRAP_DESIGN.md`, a server-authoritative guarded one-time bootstrap with public registration disabled, direct Super Admin creation, one Company, one Branch, financial readiness, concurrency/idempotency controls and separate guarded recovery. No Product, test, migration, DB, configuration or deployment change occurred. Exact next marker: `FIRST-RUN-FIX`.

## CONT5 C10 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — Super Admin defect closed; remaining CONT9 financial acceptance open | `4079836` adds `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` at `422` for operational/financial Super Admin requests without `X-Company-ID`, while an explicit valid company is validated and assigned. Focused middleware tests and C10 real HTTP proof passed absent/valid/invalid company, foreign/missing/query-overridden branch, foreign account input, normal-user compatibility, Branch Account Employee guard, and auth-only compatibility with zero denied financial mutation. Configuration matrix, detailed reconciliation, orphan/duplicate audit and rollback seams remain unexecuted and must continue in CONT11. |

## CONT5 C9 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | OPEN — Super Admin explicit-company scope defect; all remaining C9 cells blocked | `backend/src/middleware/auth.middleware.js:43,56-63` defaults `req.companyId` to `user.companyId` or `CMP-DEMO`; a Super Admin with no `X-Company-ID` is not rejected. `backend/src/routes/erp.routes.js:401-419` can then resolve a branch inside that implicit company for a required branch-scoped mutation. This violates the owner contract of no context-free financial operation. Fix only the middleware to require an explicit valid company selection for Super Admin financial/operational paths, add focused HTTP regression tests for absent/valid/foreign company and branch, then resume C9 configuration, reconciliation, orphan audit and rollback evidence. No financial mutation occurred in CONT9. |

## CONT5 C8 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — Super Admin/config/reconciliation/rollback remain | C8 formally proved R2 through the actual route: a distinct-key second full-refund request conflicted while the first was active, with zero second financial artifacts and exact cleanup. CONT9 owns only the remaining cells. |

## CONT5 C7 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — context/config/reconciliation/rollback remain | C7 R1 HTTP race passed with exactly one execution winner; inactive Employee denied; exact cleanup zero. R2 is structurally prevented by the locked active-refund guard. Super Admin, configuration, detailed reconciliation and rollback are still unproved. CONT8 owns these cells. |

## CONT5 C6 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — race/config/reconciliation/rollback remain | C6 real HTTP refund request/execution idempotency replay and mismatch conflict passed; C6 cleanup zero; typecheck/lint/build pass. Inactive/Super Admin, refund race, configuration, detailed reconciliation and rollback are still unproved. CONT7 owns only these cells. |

## DEPOSIT-1-FIX-CONT5-CONT5 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — non-middleware financial evidence remains | C5 passed real HTTP refund request/approve/reject/execute for verified Employee; missing Employee was 401 and no-permission/direct-deny were 403 for each action. Initial 422 was a missing harness idempotency key, not Product behavior. Final exact C5 cleanup is zero; idempotency/race, inactive/Super Admin, configuration, reconciliation and rollback remain unproved. Next: CONT6. |

## DEPOSIT-APPLICATION-CONTRACT1 — closed owner policy

**DAC1-F001 — Unsafe standalone deposit application (closed by policy).** The
existing completion transaction is the only final-invoice, sale-posting,
inventory, and Reservation Advance settlement path. Owner-approved v1.0.0 Option
A therefore defers standalone pre-sale application and existing-invoice/AR
allocation. Forcing it would risk duplicate sale posting or liability clearing
without a final invoice. See `DEPOSIT-APPLICATION-CONTRACT1.md`.

## MARKET-RELEASE-AUDIT1 — 2026-07-21

Evidence is local to `H:\WORK\jewellery-erp-master`, `main`, beginning at
`cff507f781823a799d13123a654894c6293c2a56`. Findings are not authorization to
change Product code or the adopted database.

| ID | Domain | Severity | Title | Evidence and reproduction | Impact | Proposed phase | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MR1-F001 | Reservations / accounting | P1 | Branch reservation-deposit readiness is absent in the adopted database | Read-only DB query: 22 branches, zero `system_account_roles`, zero `reservationAdvancesAccountId` settings, zero cash-register sessions. Source `company-bootstrap.service.js` requires a branch-scoped `CUSTOMER_DEPOSIT_LIABILITY`; `reservation.service.js` resolves it before posting. | Core reservation deposits cannot be safely posted. Financial configuration, operational readiness, and release acceptance are blocked; no data corruption was observed. | DEPOSIT-1-DIAG-CLOSE, DEPOSIT-1-FIX | OPEN |
| MR1-F002 | Reservation refunds / GL | P1 | Refund execution accepts a client-selected treasury account code | `app/[locale]/(dashboard)/sales/reservations/page.tsx` prompts for `1110/1120`; `reservation.service.js` uses `body.treasuryAccountCode` ahead of the stored/refund-method value in both standard and renewal-excess execution paths, then posts that code to the GL. | A crafted request could direct cash-out posting to an unintended account. Branch/customer/liability scope remains server-resolved, but treasury-account authority is insufficiently constrained. | DEPOSIT-1-FIX | OPEN |
| MR1-F003 | Authorization / readiness data | P1 | Permission baseline divergence is reconciled | `fba8a3f` establishes immutable v1.0.0 source baseline of 128 exact slugs. Forward migration `20260721010000` inserted only the three missing sales-operation rows and idempotently reconciled only built-in system-role grants. The nine lifecycle rows remain canonical because active routes enforce them. | Source, adopted local DB, default roles, bootstrap and verifiers converge without a reset, broad seed, or legacy deletion. | PERMISSION-BASELINE-RECONCILE1 | CLOSED |
| MR1-F004 | Test infrastructure | P1 | Verifier suite remains tied to obsolete second-QA target | 24 verifier/deployment files reference port 5433 and/or `darfus_erp_branch1_qa`; owner policy now permits only local `5432/darfus_erp`. | Full regression cannot safely run until each verifier is classified for read-only, rollback-owned, cleanup-owned, or prohibited shared-DB behavior. | LOCAL-DB-VERIFIER-ADOPT1 | OPEN |
| MR1-F005 | Deployment / release | P1 | Current deployment material is not a safe v1.0.0 release procedure | `docker-compose.yml` defaults PostgreSQL to host port 5433 and development fallback credentials; `README_DEPLOYMENT.md` has generic startup instructions but no immutable tag gate, dirty-server refusal, backup verification record, rollback procedure, or health/acceptance record. | Server deployment is not release-safe under the owner push/local then pull/server workflow. | STAGING-FOUNDATION1, RELEASE-RC1 | OPEN |
| MR1-F006 | Runtime / UX acceptance | P2 | Controlled runtime and Browser acceptance were not reproducible in this audit | Existing listeners on 3000/8000 are unidentified and were not reused. A controlled 8001 launch was rejected by platform policy before execution. | API, scheduler, Redis, Swagger, Arabic/English, desktop/mobile, and authenticated UI acceptance remain unproven at current HEAD. | BRANCH-1-ACCEPT1, STAGING-ACCEPT1 | BLOCKED_BY_ENVIRONMENT |
| MR1-F007 | Dependency security | P1 | Production dependency advisories require assessed remediation | `npm audit --omit=dev`: 3 high and 3 moderate advisories: direct `xlsx`, `next`, `next-intl`, and `@playwright/test`; transitive `playwright` and `postcss`. | Exploitability depends on exposed spreadsheet and rendering paths, but release cannot claim dependency review completion. No upgrade was performed. | RELEASE-BLOCKERS-FIX1, SECURITY-REVIEW1 | OPEN |
| MR1-F008 | Operational safeguards | P2 | Backup utility prunes archives by default | `backend/scripts/backup.js` deletes dumps beyond its default retention of 14. The audit-created backup is valid (368,660 bytes; `pg_restore -l` PASS), but release retention/provenance rules are not documented. | Backup retention can conflict with owner preservation expectations; recovery procedure is incomplete. | BACKUP-RESTORE-DRILL1 | OPEN |
| MR1-F009 | Generated worktree state | P3 | Build normalized generated `next-env.d.ts` | Before build the approved development-reference hunk was present; after `next build` it returned to the committed content and is clean. No manual restore was authorized or performed. | No Product or runtime risk; baseline handoff must distinguish generated state from source change. | V1.0.0-CLOSURE1 | RECORDED |
| MR1-F010 | Runtime environment contract | P1 | Production DB configuration is fail-closed | ENV resolver is shared by runtime and Sequelize CLI config. Staging/Production require explicit DB identity and credentials or a valid authoritative `DATABASE_URL`; malformed ports/SSL and contradictory targets fail with secret-safe `CONFIG_ERROR`. | The previous P1 environment-default blocker is closed; server ENV deployment precheck remains required. | ENV-CONTRACT-FIX1 | CLOSED |

## Required finding fields

Each row is evidence-backed. Expected behavior, root-cause confidence, and
dependencies are recorded in the phase documents: P1 findings require a bounded
fix/acceptance phase before v1.0.0; P2 findings require acceptance or an
operational decision; P3 findings are tracked without blocking release.

| MR1-F011 | Verifier safety | P1 | Legacy Employee verifiers defaulted to obsolete live QA execution | `e3215f9` makes them static-by-default and V3-guarded. | Corrected without Product change. | LOCAL-DB-VERIFIER-REDESIGN2 | PARTIAL |
| MR1-F012 | Verifier readiness | P1 | Permission-dependent V3 verifier baseline reconciled | The six guarded V3 verifiers pass against the exact canonical 128-slug set after `fba8a3f`, `65e897b`, `d0a689b`, and `0398b8b`. | 6 PASS / 0 FAIL / 0 BLOCKED; direct-deny and Branch Account/Employee tests remain strict. | PERMISSION-BASELINE-RECONCILE1 | CLOSED |
| MR1-F013 | Test data hygiene | P1 | Historical named Employee fixtures persisted | Exact `CMP-T34-2-*`/`CMP-T34-3-*` cleanup deleted 11 owned tenants; post-check zero. | No non-owned tenant touched. | LOCAL-DB-VERIFIER-REDESIGN1 | CLOSED |
| MR1-F014 | Scope boundary | P2 | `bootstrap-first-super-admin.js` retains 5433 | Outside verifier-only allowed paths. | Not executed by verifier matrix. | BOOTSTRAP-TARGET-RECONCILE1 | OPEN |
| MR1-F015 | Local cleanup | P2 | Temporary untracked backup artifact blocks strict scope checks | Exact root file `-`, 368,763 bytes; deletion rejected by local tool policy. | No Product/DB effect; 8 scope verifiers BLOCKED. | LOCAL-DB-VERIFIER-REDESIGN2 | BLOCKED_BY_ENVIRONMENT |

| MR1-F014 | Scope boundary | P2 | Bootstrap obsolete target resolved | `4fbb977` replaces the 5433 default with the shared ENV resolver and adopted-local target check; `947ce71` aligns its static verifier. | No bootstrap execution occurred. | LOCAL-DB-VERIFIER-REDESIGN2 | CLOSED |
| MR1-F015 | Local cleanup | P2 | Root temporary artifact owner-resolved | Owner deletion was confirmed by literal path check returning `False`; no `?? -` remains. Eight formerly blocked scope verifiers PASS. | Clean static verification restored. | LOCAL-DB-VERIFIER-REDESIGN2 | CLOSED |

| B1VV-F001 | Verifier/data baseline | P2 | Historical client-demo snapshot was incorrectly treated as a mandatory Branch-1 live gate | `02f870a` introduced the `>=20` Asset assertion for a one-time Phase 32.4 post-reset snapshot (also fixed invoices/installments/journals/cash totals). Current adopted data has 11 structurally valid operational Assets and no `AST-CD-*` snapshot rows; the unchanged explicit read-only historical mode still fails `Expected at least 20 assets, found 11`. | The historical-demo richness probe is optional/readiness-only, not Product or release acceptance. No Product, financial, inventory, or DB mutation occurred. | BRANCH-1-VERIFIER-VALIDATE1-CONT1 | CLOSED — OPTIONAL HISTORICAL READINESS |

## DEPOSIT-1-DIAG-CLOSE — 2026-07-21

| ID | Domain | Severity | Title | Evidence and reproduction | Impact | Proposed phase | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEPOSIT-F001 | Financial authority | P1 | Refund accepts client treasury account authority | Reservation UI sends `treasuryAccountCode`; standard and renewal execution choose `body.treasuryAccountCode` before server values. Source proof only; no exploit request was sent. | Crafted cash-out posting may select an unintended GL treasury account. | DEPOSIT-1-FIX | OPEN |
| DEPOSIT-F002 | Receipt authority | P1 | Receipt hard-codes treasury by client payment method | `treasuryAccountCode(paymentMethod)` maps client-controlled method to `1110`/`1120`; no branch treasury mapping is resolved. | Receipt can be posted to a non-authoritative treasury destination. | DEPOSIT-1-FIX | OPEN |
| DEPOSIT-F003 | Cash register | P1 | Reservation receipt/refund bypasses cash-register prerequisite | Receipt creates no `CashTransaction`; refund creates one without `requireOpenForCashMutation` or session lock. Current DB has zero sessions. | Register reconciliation and closed-register control are bypassed. | DEPOSIT-1-FIX | OPEN |
| DEPOSIT-F004 | Accounting design | P1 | Reservation advances are financially coupled to Customer Credit | Both paths resolve `CUSTOMER_DEPOSIT_LIABILITY`, while invoice deposits use `2300`; data tables remain separate. | Liability/reporting cannot reliably distinguish business purpose. | DEPOSIT-1-FIX | OPEN |
| DEPOSIT-F005 | Readiness configuration | P1 | Required reservation mapping and session are absent locally | SELECT-only: five active branches, zero system roles/mappings and zero cash-register sessions. | Deposit operations correctly fail closed but cannot operate. | DEPOSIT-1-FIX, DEPOSIT-1-ACCEPT | OPEN |
| DEPOSIT-F006 | Authorization | P1 | Refund financial actions are not Branch-Employee aware | Approve/reject/execute use `requireAnyPermission`; `permission.service` returns false for `branch_shell`, bypassing verified Employee/direct-deny evaluation by denying the valid operational path. | Branch Employee cannot perform authorized financial refund work; required control contract is incomplete. | DEPOSIT-1-FIX | OPEN |
| DEPOSIT-F007 | State machine | P1 | Partial application and partial refund are unsupported | Completion requires exact full payment; refund request/execution require all posted payments. | Required controlled partial flows are unavailable. | DEPOSIT-1-FIX | OPEN |
| DEPOSIT-F008 | Verifier coverage | P2 | Existing verifier baseline does not cover the proven deposit defects | Default static/readiness matrix is 66/66 PASS, but existing reservation checks accept current hard-coded/full-only behavior. | Passing baseline is not financial acceptance for DEPOSIT-1. | DEPOSIT-1-ACCEPT | OPEN |
| DEPOSIT-F009 | Idempotency | P2 | Refund request lacks replay semantics | Unique/open locking prevents duplicate open refund, but request itself has no idempotency key/replay contract. | Retries may receive conflict rather than an authoritative replay. | DEPOSIT-1-FIX | OPEN |

## DASHBOARD-RESERVATIONS-DIAG1 — 2026-07-21

| ID | Domain | Severity | Title | Evidence and reproduction | Impact | Proposed phase | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DASHRES-F001 | Dashboard state | P1 | Failed/no-data core queries caused a provider-identity render loop | `593b84c` replaces the six direct Provider-input `query.data ?? []` fallbacks with stable module-level typed arrays. The provider/effect dependencies and dashboard calculations are unchanged. Focused static regression test 2/2, typecheck, targeted lint, build, and diff check pass. | A single failed/no-data state no longer recreates the provider by fallback reference; authenticated Browser acceptance remains pending. | DASHBOARD-RESERVATIONS-DIAG1-CONT2 | FIXED — STATIC/BUILD PROVEN; RUNTIME ACCEPTANCE PENDING |
| DASHRES-F002 | Reservations payment schema | P1 | Pending migration causes reservations reads to select a missing column | Owner-captured 422 and explicit local read-only ORM reproduction both produce PostgreSQL `42703` / `errorMissingColumn`: `payments.cash_transaction_id`. `payments` is the `ReservationPayment` include alias for `reservation_payments`. Current model maps `cashTransactionId` to that column; untracked forward-only `20260721020000` adds it, but local history has 48 applied migrations and lacks that filename. | `GET /reservations`, reservation detail, and other default `ReservationPayment` reads fail before results can be returned. | DASHBOARD-RESERVATIONS-FIX1 | ROOT CAUSE PROVEN — PENDING MIGRATION |
| DASHRES-F003 | Diagnostic tooling | P3 | Two broad local log searches timed out and the installed PowerShell lacks `Invoke-WebRequest -SkipHttpErrorCheck` | Neither failure changed source, data, services, or the preserved worktree. Targeted source inspection and `curl.exe` supplied the safe control evidence. | Non-blocking; future capture should use a bounded known log source or browser network tooling. | DASHBOARD-RESERVATIONS-DIAG1-CONT1 | RECORDED |
| DASHRES-F004 | Error normalization | P2 | Schema fault is reported as client validation | `error.middleware.js` maps `SequelizeDatabaseError`, including PostgreSQL `42703`, to HTTP 422 `VALIDATION_FAILED`, generic Arabic validation text, and `errors.body`. | Users and clients receive an incorrect validation classification for a server migration/schema fault. | DASHBOARD-RESERVATIONS-FIX1 or separate error-semantics phase | OPEN — FIX CONTRACT REQUIRED |

### DASHBOARD-RESERVATIONS-FIX1 resolution update — 2026-07-25

| ID | Updated status | Evidence |
| --- | --- | --- |
| DASHRES-F002 | LOCALLY FIXED — FORMAL ACCEPTANCE PENDING | Backup-gated local `--to 20260721020000` completed once: history 48→49, nullable cash-link columns/FKs exist, receipt migration remains pending, and explicit read-only default-payment/list/detail ORM reads no longer raise `42703`. No business data changed. |
| DASHRES-F004 | OPEN — SEPARATE SCOPE | No error-middleware or HTTP-semantics change was made. |
| DASHRES-F005 | CLOSED — PROCESS RECORDED | One backend-relative path mistake and one persistent browser variable collision failed before stateful action; corrected commands completed without source, DB, service, credential, or preserved-worktree impact. |
| DASHRES-F006 | OPEN — PRODUCT/INTEGRATION GAP | The two FK scalar fields exist, but `models/index.js` has no `ReservationPayment.belongsTo(CashTransaction)` or `ReservationPayment.belongsTo(CashRegisterSession)` association. A rollback-only linked fixture passes scalar/FK/list/detail checks yet both ORM includes throw `SequelizeEagerLoadingError`. |

### DASHBOARD-RESERVATIONS-ACCEPT1-CONT2 resolution update — 2026-07-25

| ID | Updated status | Evidence |
| --- | --- | --- |
| DASHRES-F002 | CLOSED — LOCAL SCHEMA/SOURCE RECONCILED | Commit `9d391c4` contains the locally applied `20260721020000` source with matching SHA-256; local history remains 49 and receipt migration remains pending. |
| DASHRES-F006 | CLOSED — ASSOCIATIONS VERIFIED | `ReservationPayment.belongsTo` aliases `cashTransaction` and `cashRegisterSession` hydrate null and linked rollback-only fixture rows without eager-loading errors or duplicates. |
| DASHRES-F004 | OPEN — SEPARATE ERROR-SEMANTICS SCOPE | No error-middleware or HTTP-status behavior changed. |
| DASHRES-F007 | PARTIAL ACCEPTANCE GAP | Only one authorized local Admin context was available; Branch Account, verified Employee, direct-deny, cross-branch, and cross-company runtime cells remain unproven. |

### DASHBOARD-RESERVATIONS-ACCEPT1-CONT3 closure update — 2026-07-25

| ID | Updated status | Evidence |
| --- | --- | --- |
| DASHRES-F007 | CLOSED — AUTHENTICATED API MATRIX VERIFIED | Real local `/auth/login` and `/operator/verify` calls with exact owned fixtures proved Company Admin, Branch Account, verified Employee, missing Employee, direct-deny, cross-branch, cross-company and Super Admin selected-context list/detail behavior. Exact cleanup was zero-residue. |
| DASHRES-F004 | OPEN — ERROR SEMANTICS | No error middleware, envelope, or HTTP-status mapping was changed. |

Multi-account Browser UI evidence remains safely unavailable because no
authorized browser session exists and credentials were not exposed. This is not
a Product or authorization defect.

### DEPOSIT-1-FIX-CONT4C update — 2026-07-25

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-RDR-F001 | P2 | PARTIAL — bounded fixture acceptance gap | A local exact-owned receipt fixture probe was stopped after exceeding its bounded diagnostic window. Immediate prefix-based residue audit proved zero company/branch/customer/asset/reservation/item/payment/receipt/sequence rows. Migration catalog, ORM model load, source verifier, typecheck, lint, and build pass. CONT5 must run a separately instrumented bounded receipt-payment/fixture acceptance or classify the exact infrastructure blocker. |
| DASHRES-F004 | P2 | OPEN — separate scope | Schema errors still normalize to `422 VALIDATION_FAILED`; receipt work did not change error middleware or HTTP semantics. |

### DEPOSIT-1-FIX-CONT4D-CONT1 closure update — 2026-07-25

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-RDR-F001 | P2 | CLOSED — owned runtime acceptance proven | Final external harness SHA-256 `0447A2970C59A79312A6E63120FE961177911761E5DB7ED9EB7C5676B59BE3AD` passed static/init gates, 50/50 local target proof, dry-run, one real service payment, accounting assertions, replay, 409 conflict, reads/history, Arabic/English snapshot contract, snapshot immutability, cleanup and zero residue. Earlier failures were harness-only (immutable audit-model delete, syntax, cleanup order, fixed test receipt number and numeric assertion); no Product defect was proven. Proceed only to CONT5 scope. |
| DASHRES-F004 | P2 | OPEN — separate scope | No error middleware, envelope, or HTTP-status behavior changed. |

### DEPOSIT-1-FIX-CONT5 update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F001 | P2 | CLOSED — stale verifier reconciled | The historical verifier retained superseded one-application, fully-paid completion and full-refund assertions. It now proves immutable multi-application, net available deposit, bounded partial refund and branch-authoritative static contracts. |
| DEPOSIT-CONT5-F002 | P1 | OPEN — financial runtime acceptance | Source, focused tests, typecheck, lint and build prove CONT5 implementation, but no CONT5-owned financial fixture was created. `DEPOSIT-1-ACCEPT1` must prove final-sale/refund journals, cash/session, reconciliation, rollback/idempotency, isolation and exact cleanup. |
| DASHRES-F004 | P2 | OPEN — separate error semantics | No error middleware, HTTP-status or envelope change was made. |

### DEPOSIT-1-FIX-CONT5-CONT1 runtime update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — runtime matrix incomplete | Exact-owned local Scenario A (three receipts, `20.0000` settlement), Scenario B (`30.0000` received / `8.0000` refund / `22.0000` application), selected bounds/state, missing-treasury, branchless and cross-scope checks passed with zero residue. Mandatory employee/direct-deny, concurrent/race, high-count, full idempotency and transaction-failure rollback evidence is absent. `DEPOSIT-1-FIX-CONT5-CONT2` owns only those gaps. |

### DEPOSIT-1-FIX-CONT5-CONT2 runtime update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — named Employee/direct-deny acceptance gap remains | C2 passed service-level complete-sale concurrency (`201` + `STATE_CONFLICT`), payment replay/conflict, and 25 payment/receipt deterministic application with exact cleanup. It did not establish the required real Branch Account Employee operational-session and direct-deny middleware matrix; refund-race/idempotency, full configuration, detailed reconciliation and failure-seam evidence also remain. `DEPOSIT-1-FIX-CONT5-CONT3` must address only these named gaps. |

### DEPOSIT-1-FIX-CONT5-CONT3 runtime update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — full Employee action matrix and financial evidence remain | C3 real HTTP middleware proved verified Employee Settings read, missing Employee `401 BRANCH_ACCOUNT_EMPLOYEE_REQUIRED`, no-permission `403 EMPLOYEE_PERMISSION_DENIED`, and direct-deny precedence over an explicit grant. It did not prove all required mutation routes or refund/configuration/reconciliation/rollback cells. |

### DEPOSIT-1-FIX-CONT5-CONT4 runtime update — 2026-07-26

| ID | Severity | Status | Evidence / required next action |
| --- | --- | --- | --- |
| DEPOSIT-CONT5-F002 | P1 | PARTIAL — refund/configuration/reconciliation/rollback evidence remains | C4 real HTTP `PUT /branch-settings/reservation-deposit` succeeded for a verified Employee and was denied for missing Employee, no permission and direct denial, all with exact cleanup. Remaining required mutation routes and financial matrices are unproved. |
### DEPOSIT-CONT5-F002 — P1 — partial financial acceptance evidence

**Status:** OPEN / PARTIAL — mandatory configuration, reconciliation, orphan-audit and rollback cells remain.

CONT11 locally proved selected fail-closed configuration cells, one service-path reconciliation scenario, allocation/receipt counts, selected orphan checks, and zero C11 residue. It did not cover every required configuration/session/account/method cell, complete GL/AR/cash/tax and full orphan/cross-scope audits, nor the three named rollback groups through permanent reviewed tests: Deposit journal/receipt/idempotency persistence; Refund cash/journal/allocation/idempotency persistence; Complete-sale invoice/accounting/application/idempotency persistence. Existing static verifiers remain static when their live gate is not enabled and cannot be reported as runtime proof. No product defect has been reproduced. Required next phase: DEPOSIT-1-FIX-CONT5-CONT12, limited to those named acceptance cells.

CONT12 confirmed a verifier-infrastructure boundary: the existing live completion/refund verifier depends on an existing Company/Branch/Customer relationship and cannot run as an exact-owned C12 test when that branch lacks an active BranchCustomer. This is a TEST_INFRASTRUCTURE_GAP, not a Product defect. Required next phase: DEPOSIT-1-FIX-CONT5-CONT13, which must use a full owned fixture graph and preserve exact cleanup.

CONT13 closes the fixture-ownership blocker through committed verifier 647417e, but not the remaining acceptance cells. Status remains P1 OPEN/PARTIAL for full matrix and rollback evidence.

### CONT16-CONT1 update — 2026-07-26

`DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL**. `DEPOSIT_ROLLBACK_JOURNAL_PERSISTENCE` is now PASS: a fully owned local transaction injected `ACC_C16_C1_DEPOSIT_JOURNAL_PERSISTENCE_FAILURE` at journal posting, rolled back all observed Deposit effects, and succeeded once after method restoration with a fresh idempotency key. Receipt/idempotency Deposit seams, all Refund/Complete-sale seams, and the remaining matrix/reconciliation/audit cells remain open.

### CONT16-CONT2 update — 2026-07-26

`DEPOSIT_ROLLBACK_RECEIPT_PERSISTENCE` is PASS. The verifier injected `ACC_C16_C2_DEPOSIT_RECEIPT_PERSISTENCE_FAILURE` at immutable receipt persistence with the real transaction object; all failure-side effects rolled back and a fresh-key retry created one receipt/payment/cash/journal set. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for Deposit idempotency persistence, Refund/Complete-sale seams, and remaining acceptance cells.

### CONT16-CONT3 update — 2026-07-27

`DEPOSIT_ROLLBACK_IDEMPOTENCY_SUCCESS_PERSISTENCE` is PASS. The real success-persistence call used the Deposit transaction before commit; injected failure left no financial or idempotency row, same-key retry succeeded once, and replay returned the same payment without duplicates. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for Refund/Complete-sale seams and remaining matrix, reconciliation and audit cells.

### CONT16-CONT4 update — 2026-07-27

`REFUND_ROLLBACK_CASH_OUT_PERSISTENCE` is PASS. A real `CashTransaction.create` failure in the Refund transaction restored the approved refund state with zero execution financial rows; same-key retry executed once and replay produced no duplicate cash/journal/allocation artifacts. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for remaining Refund, Complete-sale and broader acceptance cells.

### CONT16-CONT5 update — 2026-07-27

`REFUND_ROLLBACK_JOURNAL_PERSISTENCE` is PASS. A fully owned real `JournalEntry.create` failure for the `reservation_refund` journal received the Refund transaction and rolled it back before cash-out, allocations, final status and idempotency success. The Refund remained approved with zero committed execution effects; restored same-key retry posted one balanced liability/treasury journal, cash-out and allocation, while replay created no duplicates. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for Refund allocation/idempotency, Complete-sale and broader acceptance cells.

### CONT16-CONT6 update — 2026-07-27

`REFUND_ROLLBACK_ALLOCATION_PERSISTENCE` is PASS. A fully owned real `ReservationRefundAllocation.create` failure reached the Refund transaction after staged journal and cash-out work, then rolled every effect back. The approved Refund, balances, source payment and immutable receipt stayed unchanged; restored same-key retry made one correctly scoped allocation totaling 5.00000000 and replay created no duplicate. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for Refund idempotency, Complete-sale and broader acceptance cells.

### CONT16-CONT7 update — 2026-07-27

`REFUND_ROLLBACK_IDEMPOTENCY_SUCCESS_PERSISTENCE` is PASS. A fully owned real `idempotencyService.succeed` failure received the Refund transaction after all execution work was staged and rolled all work, including the claimed key, back together. The failed key was absent; same-key retry created one succeeded result and one complete Refund execution, while replay created no duplicate. All Refund rollback cells now pass. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for Complete-sale and broader acceptance cells.

### CONT16-CONT8 update — 2026-07-27

`COMPLETE_SALE_ROLLBACK_INVOICE_PERSISTENCE` is PASS. A fully owned real `Invoice.create` failure received the Complete-sale transaction after validation and invoice-number calculation, then rolled back before any valid Invoice/document, application, accounting, inventory, Reservation completion, idempotency success or audit committed. The failed key was absent; same-key retry created exactly one Invoice, one Deposit application, two balanced journals and one stock movement, while replay created no duplicate. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for Complete-sale accounting/application/idempotency and broader acceptance cells.

### CONT16-CONT9 update — 2026-07-27

`COMPLETE_SALE_ROLLBACK_ACCOUNTING_PERSISTENCE` is PASS. A fully owned real Invoice-sale `JournalEntry.create` failure occurred after staged Invoice/item/stock work and rolled every staged final-sale effect back. Same-key retry recognized AR, revenue, VAT, COGS, inventory and Deposit-liability settlement once through balanced journals; replay created no duplicate. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for Complete-sale application/idempotency and broader acceptance cells.

### CONT16-CONT10 update — 2026-07-27

`COMPLETE_SALE_ROLLBACK_DEPOSIT_APPLICATION_PERSISTENCE` is PASS. The owned real `ReservationPaymentApplication.create` failure ran after Invoice, stock and both final-sale journals were staged, then the real transaction rolled every effect back. The Reservation stayed `partially_paid`; no Invoice, application, accounting, inventory, completion, idempotency, audit, balance or receipt-snapshot delta committed. The failed key was absent; restored same-key retry created one correctly scoped `10.0000` application for the owned payment and Invoice, while replay added no artifact. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for Complete-sale idempotency and the broader required acceptance cells; no Product defect was reproduced.

### CONT16-CONT11 update — 2026-07-27

`COMPLETE_SALE_ROLLBACK_IDEMPOTENCY_SUCCESS_PERSISTENCE` is PASS. The owned real `idempotencyService.succeed` failure received the Complete-sale transaction after all final-sale state was staged and rolled everything, including the claim, back together. The Reservation remained `partially_paid`; no Invoice, application, accounting, inventory, completion, idempotency, audit, balance or receipt-snapshot delta committed. The failed key was absent; restored same-key retry created one complete final sale and succeeded response, while replay added no artifact. All Complete-sale rollback seams pass. `DEPOSIT-CONT5-F002` remains **P1 OPEN / PARTIAL** for configuration, reconciliation, audit and repeatability; no Product defect was reproduced.

### DEPOSIT-CONT16-C12-F001 — 2026-07-27

**P1 RESOLVED — Complete-sale silently fell back to company-code posting accounts.** C12 originally created only A1 liability/treasury mappings, deliberately omitted AR/revenue/VAT/COGS/inventory mappings, and `postingService.ensureAccount(companyId, code, transaction)` auto-created 1300/4100/2200/5000/1200. CONT1 replaced that Complete-sale path with a pre-write strict `system_account_roles` resolver for AR, revenue, VAT, inventory, COGS and Reservation Advance Liability. It rejects missing, cross-Company, cross-Branch, inactive, wrong-role and ambiguous mappings with stable `BRANCH_FINANCIAL_*` codes; Invoice and settlement posting use resolved IDs. Runtime C12-CONT1 proved zero account/financial writes for every rejection and one duplicate-free valid completion/replay without account creation. The historical evidence remains retained; migrations remain 50/50.

## CONT16-CONT13 reconciliation result — 2026-07-27

No C13 reconciliation defect was reproduced. The owned runtime matrix proved exact fixed-point balance equations for Deposit, partial Refund and both Complete-sale variants; every posted journal balanced and every persisted account delta equalled its owned journal-line movement. No tolerance was used.

## CONT16-CONT14 integrity audit result — 2026-07-27

No C14 Product defect was reproduced. The fully owned C14 graph audit passed 14 cells covering Deposit, Refund and Complete-sale parent/reference joins, immutable receipt links, semantic duplicates and same-key replays, A2/B1 rejection with zero write delta, journal/account scope, idempotency/audit linkage, cash/session evidence and inventory linkage. The optional historical non-owned scan was deliberately not run; no existing rows were touched.

## DEPOSIT-CONT5-F002 closure — 2026-07-27

**P1 RESOLVED — local acceptance-evidence gap.** C15 completed two isolated, fully owned runs of every accepted rollback, configuration/no-fallback, reconciliation and integrity suite. Both runs passed; exact cleanup and zero residue held between and after runs; normalized semantic evidence matched; focused regression passed. This closes the local technical acceptance chain only and does not authorize deployment or claim Product-wide production readiness.

### Final acceptance confirmation — 2026-07-27

`DEPOSIT-CONT5-F002` remains **RESOLVED**. Closure is supported by all Deposit, Refund and Complete-sale rollback cells; the fail-closed configuration/no-fallback matrix; the resolved C12 branch-account fallback finding; financial reconciliation; owned orphan/duplicate/cross-scope integrity audit; C15 RUN1/RUN2 cleanup and zero residue; normalized equivalence; and 35 focused regression tests. No unresolved P1/P2 technical acceptance blocker remains for this local subsystem. Historical P1 evidence is preserved. This confirmation does not change the explicit non-authorization of Staging, Production or deployment.

## NOTIF-PRE1 diagnosis — 2026-07-27

**`NOTIF-PRE1-F002` — P2, static root cause proven:** `hooks/use-notifications.ts` enables both Company-scoped reads after authentication/operator readiness but does not require an explicit Super Admin Company context and calls `apiClient` without `companyId`. `lib/api/client.ts` emits `X-Company-ID` only when that option is supplied. The backend correctly rejects the resulting Super Admin calls with `422 SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED`; no Company fallback is acceptable.

**`NOTIF-PRE1-F004` — P2, static root cause proven:** `components/realtime-provider.tsx` opens `/events/stream` with Authorization only, then schedules up to eight reconnects for every non-OK response, including Company-context `422`. This is the exact repeated-request chain after an authenticated Super Admin reaches the dashboard without an explicit Company header.

**`NOTIF-PRE1-F005` — P2, static root cause proven:** the list and unread-count queries are distinct keys and each failed query reaches the global `QueryCache.onError` toast owner in `app/providers.tsx`; a single blocked startup therefore creates two error toasts. The Header and Notifications page are duplicate consumers of the same keys, so React Query shares those requests rather than proving an additional network loop. No hook-level notification error toast was found.

The direct unauthenticated local endpoint probes returned expected `401`; the accepted Super Admin middleware test passed the mandatory `422`/`403` contract. No local frontend listener or authenticated browser session was available to capture the Super Admin chronology, so this is a bounded static diagnosis, not a claimed full browser reproduction. No Product change was made. Next only: `NOTIF-PRE1-CONT1` to capture the authenticated Super Admin request/timing/toast chronology and confirm the proposed minimal frontend fix scope.

### NOTIF-PRE1-CONT1 runtime-capture boundary — 2026-07-27

The runtime-capture attempt did not obtain a safe authenticated Super Admin session: no listener existed on ports 3000/3001, the only available browser surface had zero tabs and no authenticated session, and no existing safe local identity/Company context was supplied. The existing port-8000 Node backend was left untouched; unauthenticated notification list, unread-count and SSE probes each correctly returned `401`. Therefore N4–N10, header presence, request counts, toast counts and SSE reconnect timing are **NOT_EXECUTED**, not negative evidence. `NOTIF-PRE1-F002`, `F004` and `F005` remain P2 static findings and are not runtime-finalized. No Product, database, configuration, browser storage, credential, process or deployment action occurred. Next only: `NOTIF-PRE1-CONT1-CONT1` to capture the authenticated Super Admin chronology with an existing safe local session.

### NOTIF-PRE1-CONT1-CONT1 frontend-start blocker — 2026-07-27

The documented local command `npm run dev -- --port <port>` reached Next but the execution environment denied binding both expected free frontend ports: `3000` and `3001` each failed with sanitized `listen EACCES`. No frontend process remained, `next-env.d.ts` was unchanged, and the existing port-8000 backend was untouched. The required authenticated browser session and N4/N5/N7/N8 observations consequently remain **NOT_EXECUTED**. This is `BLOCKED — LOCAL_FRONTEND_START_FAILURE`, not a reclassification of `NOTIF-PRE1-F002`, `F004` or `F005`; no Product/configuration/DB/process workaround was attempted. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1` to resolve the sanctioned local frontend binding/availability gap before runtime capture.

### NOTIF-PRE1-CONT1-CONT1-CONT1 bind and origin-compatibility result — 2026-07-27

Read-only Windows diagnostics classified the original bind failure as `WINDOWS_TCP_EXCLUDED_RANGE`: IPv4 and IPv6 non-administered exclusions include `2933–3032`, covering both 3000 and 3001. No relevant listener, URLACL or HTTP.sys reservation was found. Loopback `127.0.0.1:3300` was unoccupied, outside every reported exclusion, and passed a temporary socket bind/close probe. The documented Next command with `--hostname 127.0.0.1 --port 3300 --webpack` then rendered the login surface from an owned loopback-only process; it was shut down exactly after observation. Turbopack bound but did not return the bounded HTTP probe; webpack was the one supported invocation retry that returned the login redirect/page.

The authenticated capture remains blocked by a separate local origin-policy boundary: the browser login flow at `http://127.0.0.1:3300` reported its sanitized connection error, and its unauthenticated CORS preflight received no allow-origin response. The configured-origin control `http://localhost:3000` received the expected CORS allow response. Because 3000 is Windows-excluded and this phase forbids Windows or Product configuration mutation, no safe authenticated session can be established through the alternate origin. N4/N5/N7/N8 remain **NOT_EXECUTED**; `NOTIF-PRE1-F002`, `F004` and `F005` remain static and not runtime-finalized. `LOCAL_FRONTEND_AVAILABILITY = PASS`; `NOTIF_FIX_AUTHORIZED = NO`. Next only: `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1` to resolve the exact sanctioned local frontend-origin availability gap before resuming runtime capture.

### NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1 owned-origin runtime result — 2026-07-27

The source-supported local runtime contract was sufficient without a Product change: backend CORS reads `CORS_ALLOWED_ORIGINS`/`FRONTEND_URL`, server port reads `PORT`, and the frontend reads `NEXT_PUBLIC_DATA_SOURCE` plus `NEXT_PUBLIC_API_URL` at dev-process start. A short-lived owned backend used only process-scoped development values on port 8001 with the exact loopback 3300 origin; runtime-admin bootstrap was off and the expiry scheduler was disabled. Its preflight returned the exact allow-origin and credentials response for the selected origin, while an unrelated origin received no allow-origin response. The owned webpack frontend on `127.0.0.1:3300` then completed a normal local login as `SUPER_ADMIN_A`; the pre-existing port-8000 backend and PostgreSQL stayed untouched. This proves `LOCAL_FRONTEND_ORIGIN_COMPATIBILITY = PASS`.

Runtime N4 confirms the three static notification findings. After authenticated Super Admin readiness with no explicit Company context, notification list and unread-count each made one request, each received `422 SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED`, and the missing Company header is proven by that fail-closed result. There was no React Query retry. The stream made one initial request plus eight reconnects at the observed one- through eight-second backoff, all receiving the same permanent `422`; this confirms the reconnect defect. The two distinct notification request failures corresponded to two distinct rendered global toasts. The page rendered twelve context-error toasts in total because other Company-scoped dashboard requests were also premature; that total is not misclassified as twelve notification toasts, and no duplicate handler for a single notification request was observed.

`NOTIF-PRE1-F002` is **CONFIRMED** (list/unread enable without explicit Super Admin Company context). `NOTIF-PRE1-F004` is **CONFIRMED** (SSE reconnects the permanent missing-context response). `NOTIF-PRE1-F005` is **CONFIRMED_WITH_REFINED_SCOPE** (one global toast per distinct failed notification query; broader dashboard queries add their own toasts). Normal logout was also observed: over the nine-second post-logout window the owned backend recorded one logout request and zero list, unread-count, stream, or notification `401` requests; the UI returned to login. This is a correct N7 boundary, not a notification-fix result.

**`NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` — P2, runtime capture blocker:** the authenticated Super Admin profile surface offered Settings and Logout only, and source/runtime inspection found no authoritative Company-selection or Company-propagation control. Consequently N5 (valid selection/recovery) and the required valid-Company N8 refresh-hydration chronology are **NOT_EXECUTED**. A persisted authenticated no-Company reload is the captured N4 failure state, not evidence for valid-context N8. No header was injected manually. This preserves backend fail-closed enforcement and withholds `NOTIF-FIX` authorization: `NOTIF_FIX_AUTHORIZED = NO` until that exact normal Company-context path can be observed.

| State | Endpoint | Requests | Status / code | Company header | Retry / reconnect | Toasts | Outcome |
|---|---|---:|---|---|---:|---:|---|
| N4 | notifications list | 1 | 422 / `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` | absent | 0 | 1 | confirmed blocked query |
| N4 | unread count | 1 | 422 / `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` | absent | 0 | 1 | confirmed blocked query |
| N4 | events stream | 9 | 422 / `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` | absent | 8 reconnects | 0 attributed | confirmed reconnect loop |
| N5 | all three | NOT_EXECUTED | authoritative selector unavailable | — | — | — | no manual bypass |
| N7 | list / unread / stream | 0 post-logout | no 401 observed | cleared by logout state | 0 | 0 | no persistent leak |
| N8 | all three | NOT_EXECUTED | valid Company prerequisite unavailable | — | — | — | no valid-context chronology |

No notification source, test, `.env`, migration, DB row, Windows policy, or existing backend process was changed. Owned frontend/backend processes were stopped exactly. Final read-only checks found 50 applied migrations, zero pending migrations, zero idle transactions and zero waiting locks. The exact next marker is `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-CONT1`: resolve only the authoritative Super Admin Company-selection/propagation observation gap and capture N5 plus valid-context N8; do not implement `NOTIF-FIX` automatically.

### NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-CONT1 authoritative Company-context decision — 2026-07-28

`NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` is **CONFIRMED_WITH_REFINED_SCOPE — P2**: `SUPER_ADMIN_COMPANY_SELECTION_PATH = ABSENT`. The authenticated runtime inventory found only the independent Branch switcher, account menu entries for Settings and Logout, and Settings company-profile editing. It found no Company list, selector, switch action, route, modal, persisted selected-Company state, or normal Company-context propagation control for a Super Admin. Source inventory confirms the runtime result: `AuthProvider` stores the Company returned with login/session data and exposes only profile-field `updateCompany`; `apiClient` emits `X-Company-ID` only from an explicit request option; `useNotifications` supplies none; and `RealtimeProvider` sends Authorization but no Company header. No frontend Company-list/switch request and no backend Company-list/switch route exists.

The backend contract is `HEADER_ONLY_STATELESS`: operational Super Admin requests require `X-Company-ID`, validate that the Company exists, and fail closed with `422 SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` or `403 COMPANY_SCOPE_INVALID`; auth-only routes opt out. Therefore N5 and valid-context N8 are **NOT_EXECUTED** by design: no normal Product path can establish `COMPANY_A`, and no manual header/storage/API bypass was used. The preserved N4/N7 evidence remains valid: no-context notification reads fail once each, SSE reconnects the permanent 422, and logout leaves no persistent notification traffic.

`NOTIF-PRE1 = COMPLETE` and `NOTIFICATION_401_422_STORM_DIAGNOSIS = COMPLETE_WITH_UX_DEPENDENCY`. `NOTIF_FIX_AUTHORIZED = YES`; it is independently safe and necessary to gate list/unread/SSE on auth plus explicit Company readiness, make 401/403/422 terminal until state changes, cancel on logout, refetch once when valid context becomes available, and retain one toast owner while preserving backend fail-closed behavior. `NOTIF_FIX_FULL_N5_N8_ACCEPTANCE_DEPENDENCY = COMPANY_SELECTION_UX`. Roadmap order is **Option A**: `NOTIF-FIX` first to remove the current no-context storm, then `UX-PRE1` to diagnose/build the authoritative Company selection path, then integrated N5/N8 acceptance. No notification fix or selector was implemented here.

| State | Endpoint | Result |
|---|---|---|
| N5 | list / unread / SSE | NOT_EXECUTED — authoritative selection path absent |
| N8 | list / unread / SSE | NOT_EXECUTED — valid selected context cannot persist because it cannot be established normally |

The owned 8001/3300 topology was revalidated through normal login and all owned listeners ended before documentation. `next-env.d.ts` was regenerated by the owned webpack command only (`.next/dev/types/routes.d.ts`); its exact diff was recorded and it was normalized to the required HEAD hash. Exact next marker: `NOTIF-FIX`; do not build a Company selector in that phase.

### NOTIF-FIX resolution — 2026-07-28

`NOTIF-PRE1-F002` is **RESOLVED — P2 historical**. A shared Company-scoped notification lifecycle now blocks list, unread-count and SSE startup until auth is resolved, the user is authenticated, terminal auth handling is clear, Branch-Employee readiness holds, and a Super Admin has an explicit Company authority. The login/profile Company display object is deliberately not used as a fallback. The owned runtime N4 recheck recorded **zero** requests to notification list, unread-count and events stream after Super Admin dashboard readiness with no Company context; consequently it recorded zero notification-specific 422/error toasts and zero stream reconnects. Other premature dashboard context errors remained outside this narrow notification fix.

`NOTIF-PRE1-F004` is **RESOLVED — P2 historical**. Notification SSE now opens only when the same lifecycle is ready and treats every HTTP 4xx response, including 401/403/422, as terminal until auth or Company state changes; network/5xx behavior retains the bounded reconnect path. `NOTIF-PRE1-F005` is **RESOLVED — P2 historical**. Notification queries carry lifecycle metadata and the existing global QueryCache is their single controlled toast owner, deduplicating the same notification error scope/code for five seconds while leaving unrelated query errors unchanged.

Future authoritative Company integration is contractual but intentionally not fabricated: one explicit Company ID drives REST request options, the SSE `X-Company-ID`, and Company-discriminated query keys, preventing a Company A cache result from being reused for Company B. `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains **OPEN — P2** because the Product still has no authoritative Super Admin selection path; valid-context N5 and N8 remain deferred to `UX-PRE1`, not inferred from login display metadata.

Local acceptance: `NOTIF-FIX = COMPLETE`; `NOTIFICATION_FIX_IMPLEMENTED = YES`; `NOTIFICATION_NO_CONTEXT_GATING = PASS`; `NOTIFICATION_SSE_TERMINAL_ERROR_HANDLING = PASS`; `NOTIFICATION_TOAST_OWNERSHIP = PASS`; `NOTIFICATION_LOGOUT_SAFETY = PASS`; `FUTURE_COMPANY_CONTEXT_NOTIFICATION_CONTRACT = PASS`; `N5_PRODUCT_UI_ACCEPTANCE = DEFERRED_TO_UX_PRE1`; `N8_PRODUCT_UI_ACCEPTANCE = DEFERRED_TO_UX_PRE1`. Focused lifecycle tests (7), the existing Super Admin context contract (3), typecheck, target lint, production build and `git diff --check` passed. Owned 3300/8001 processes were stopped; no Product fallback, backend contract change, `.env` change, DB write, deployment or push occurred. Exact next marker: `UX-PRE1`.

### UX-PRE1 design decision — 2026-07-28

`NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` is **CONFIRMED — DESIGN READY, P2** and remains open. The absence is precise: no context-free accessible-Company bootstrap, selector/switcher, selected-Company authority, persistence, or REST/SSE propagation exists. `UX-FIX` must add a minimal authenticated context-free Company-list contract plus one explicit Super Admin state machine and gate; it must not add a fallback or infer authority from login/profile display data. The current backend is `HEADER_ONLY_STATELESS`; its existing global Super Admin validation confirms Company existence but the Company model has no active/inactive lifecycle field. The UX-FIX bootstrap must therefore return only Companies selectable by the existing server policy, and lifecycle/governance expansion remains out of scope.

Risk controls are design requirements, not proven Product fixes: server revalidation of a tab-local opaque persisted ID; `UNRESOLVED/REQUIRED/VALIDATING/READY/INVALID/ERROR` state; Company-discriminated query keys; cancellation/removal plus generation isolation on switch; Branch reset/revalidation; terminal invalid-context recovery; logout/account-clear cleanup; and no scoped traffic before READY. Zero Companies is a controlled `FIRST-RUN-PRE1` handoff, not an automatic creation or first-Company choice. `UX-PRE1 = COMPLETE`; exact next marker: `UX-FIX`.

### UX-FIX implementation and N8 acceptance boundary — 2026-07-28

`NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains **OPEN — P2** (implementation delivered; acceptance closure withheld). The implementation adds authenticated context-free `GET /auth/accessible-companies`, a minimal deterministic Company list, one tab-local user-bound Company state machine, a dashboard selection gate, a header switcher, explicit REST/SSE authority, Company-aware query cleanup, Branch clearing, invalid-context recovery and logout storage cleanup. It deliberately introduces no Company fallback or server-side selected-Company state.

N0, N5 and logout were observed through the owned loopback topology: N0 showed the mandatory gate with no selected Company; N5 selected the single accessible Company and reached the dashboard with the header switcher; logout returned to login without console errors. N8 is **NOT ACCEPTED**: after a valid selection, a hard in-app-browser reload returned the selection gate rather than restoring a validated READY context. Browser storage/tokens were not inspected or modified. A second runtime attempt after synchronous request-context handoff still showed the gate. The root cause is therefore an exact persistence/hydration acceptance gap, not a reason to assert a fallback or to close this finding. Two-Company A→B runtime was unavailable because the safe identity exposed one accessible Company; no Company was created manually.

`UX-FIX = PARTIAL`; `N5_SELECTION_UI = PASS` but full N5 REST/SSE/header-count acceptance is not captured; `N8_PRODUCT_UI_ACCEPTANCE = FAIL — persisted Company context not restored in the observed in-app browser`; `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001 = OPEN — P2`. Exact next marker: `UX-FIX-CONT1`, limited to this persisted-context/hydration failure and its focused acceptance evidence.

### UX-FIX-CONT1 single-Company revision — 2026-07-28

The Product model is now **single Company, multiple Branches**. The proven N8 design fault was that READY depended on a user-selected Company saved in `sessionStorage`; a refresh could not safely reconstruct that selection. The revised provider clears and ignores that legacy key, calls the authenticated context-free bootstrap on every Super Admin startup, and adopts only an exactly-one server-authorized Company. Zero results yield `SETUP_REQUIRED`; more than one yields `CONFIGURATION_CONFLICT`; both block scoped traffic without selection or fallback. The Company header control is display-only and BranchSwitcher remains the only operational switcher.

Focused tests prove 0/1/many classification, legacy-key non-authority, context-free bootstrap, no interactive Company control, explicit REST/SSE authority, Branch readiness gating, and notification page propagation. Runtime topology on owned 8001/3300 became ready and was shut down exactly, but the available browser-control surface was unavailable before safe authentication; no N5/N8 request/header/SSE/toast count was fabricated. `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains **OPEN — P2**, refined to single-Company bootstrap/hydration and operational readiness pending runtime proof. Exact next marker: `UX-FIX-CONT1-CONT1` for only authenticated N5-single-Company/N8 evidence.

### UX-FIX-CONT1-CONT1 runtime acceptance boundary — 2026-07-28

The acceptance preflight repeated from `5b49a25` passed identity, protected hash, focused 14-test baseline and diff checks. Browser control returned `No browser is available` before an owned process or authenticated session was started. N5/N8 REST, Company-context, notification, SSE and toast counts remain **NOT_OBSERVED**; no Product regression is inferred and no Product code changed. `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` stays **OPEN — RUNTIME EVIDENCE INCOMPLETE / P2**. Next only: `UX-FIX-CONT1-CONT1-CONT1` for safe browser/session availability.

`UX-FIX-CONT1-CONT1-CONT1` refined the blocker without changing Product behavior: the supported browser-control runtime enumerated zero browser bindings. Chrome and Edge executables are installed but cannot be safely attached through the approved control surface. The focused 14-test baseline remains PASS; no owned runtime, profile, login or runtime evidence was created. `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains **OPEN — BROWSER SERVICE UNAVAILABLE / P2** and `NOTIF_ACCEPT_AUTHORIZED = NO`. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1`.

`UX-FIX-CONT1-CONT1-CONT1-CONT1` replaces the unavailable external browser binding with committed repository-local Playwright acceptance infrastructure, using an installed Chrome/Edge executable and an isolated temporary context. The launcher requires process-scoped `DARFUS_E2E_EMAIL` and `DARFUS_E2E_PASSWORD` before it starts any owned listener; both are absent in this environment, so it exited cleanly with code 2 and no runtime/login occurred. Redaction, evidence correlation, configuration, credential skip, focused Product tests, typecheck and targeted lint pass. `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains **OPEN — AUTHENTICATED SESSION UNAVAILABLE / P2**; all N5/N8 REST/SSE/header/toast evidence remains `NOT_OBSERVED` and `NOTIF_ACCEPT_AUTHORIZED = NO`. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1`.

`UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1` supplied the approved local test credentials only through the execution environment. The unchanged harness failed before spawning either owned service: Node rejected the newly-created runtime log `WriteStream` because its file descriptor was not yet open when passed to `spawn` as stdio (`ERR_INVALID_ARG_VALUE`). Credentials were removed immediately; 3300/8001 remained closed and 8000/5432 were untouched. No authenticated request, N5/N8 evidence, browser profile or Product regression was produced. The residual empty owned temporary log root could not be removed because the execution environment denied its cleanup command. `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` remains **OPEN — HARNESS EXECUTION FAILURE / P2** and `NOTIF_ACCEPT_AUTHORIZED = NO`. Next only: `UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1` for this exact pre-spawn log-stream/cleanup defect.
