# v1.0.0 Test and Acceptance Matrix

## COMPANY-CONTEXT-RUNTIME-FIX external-runtime evidence — 2026-07-28

| Acceptance area | Status | Observed evidence |
| --- | --- | --- |
| N5 single-Company bootstrap | PASS | One context-free bootstrap `200`, one Branch `200`, read-only Company display, one list/unread/SSE lifecycle, scoped Company context present. |
| N8 hard refresh | PASS | One bootstrap followed by Company READY and one Branch/list/unread/SSE lifecycle; no selection gate. |
| Company errors and notifications | PASS | N5/N8 each: 401/403/422 = 0, `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` = 0, SSE reconnects = 0, notification error toasts = 0. |
| Branch A→B | PASS | Five existing Branches available; normal switch reloaded scoped reads with Company context retained and Branch context on Branch-scoped resources. |
| Logout safety | PASS | Normal logout `200`; post-logout list/unread/SSE requests and notification error toasts = 0. |
| Zero/multiple Company contract | PASS — focused tests | Zero fails closed to setup-required; multiple fails closed to configuration-conflict; no selector or fallback. |

Focused lifecycle/harness tests: 32/32 PASS; typecheck and targeted lint PASS.
Production build: DEFERRED — the manually running shared Next development
workspace is retained and was not disturbed; no build PASS is claimed here.

## RELEASE-GAP-FIX-1-CONT2 external-runtime evidence — 2026-07-28

| Acceptance area | Status | Current evidence / remaining gate |
| --- | --- | --- |
| Existing-runtime reuse safety | PASS | Explicit localhost-only mode fingerprints 3000/8000, spawns/stops neither, and browser-only cleanup preserves both services. |
| Login / Super Admin path | PASS | Normal browser login returned `200`; subsequent Super Admin Company bootstrap path was reached. |
| N5 single-Company runtime | FAIL | Five `accessible-companies` `200` responses (no Company header) and one Branch `200` (Company header present) did not produce the read-only Company display within 30 seconds. |
| N8 refresh hydration | NOT_OBSERVED | N5 never reached Company READY; refresh was not a valid continuation. |
| Notification list / unread / SSE / toast counts | NOT_OBSERVED | No lifecycle started before the Company readiness failure. No tracked 401/403/422 response or notification toast was observed. |
| Branch A→B / logout | NOT_OBSERVED | Not reached because Company READY was not observed. |
| Zero/multiple Company contracts | PASS (focused tests) | Remain source/test-proven; no database state was manipulated for browser evidence. |

## RELEASE-GAP-AUDIT evidence boundary — 2026-07-28

| Acceptance area | Status | Current evidence / remaining gate |
| --- | --- | --- |
| Selected cross-domain regression | PASS | 56/56 focused Error Contract, First Run, Company, notification and deposit rollback tests passed at `399badc`. |
| Typecheck / lint / production build | PASS | Re-run in the read-only audit; no lint errors. |
| First Run isolated PostgreSQL lifecycle | PASS | Previously accepted disposable-DB evidence; official database remains 50 applied / 1 source migration pending. |
| Error semantics / redaction | PASS | Canonical envelope and safe ORM/database mapping supersede historical `DASHRES-F004`. |
| N5 single-Company authenticated runtime | NOT_OBSERVED | Browser harness exits pre-spawn due to unopened WriteStream; no count/header/toast value is inferred. |
| N8 refresh hydration runtime | NOT_OBSERVED | Same harness boundary; no authenticated refresh chronology was captured. |
| Notification integrated acceptance | NOT AUTHORIZED | Requires repaired harness plus N5/N8 evidence. |
| Branch A→B browser runtime | NOT_OBSERVED | No safe post-login branch inventory or switch run occurred. |
| Backup / restore drill | NOT_OBSERVED | Required before Production. |
| Dependency, storage and performance release evidence | NOT_OBSERVED | Separate RC/Production gates; no claims made from historic reports. |

`RELEASE_READY = NO`; `RELEASE_GATE_WAIVED = NO`; see `docs/RELEASE_GAP_AUDIT.md`.

| Harness log-stream lifecycle | PASS | Opened stream before spawn, real child-process stream, synchronous/asynchronous spawn failure, readiness failure, idempotent close and safe owned-temp cleanup are covered. |
| Authenticated harness execution after log fix | BLOCKED | Original `fd:null` is absent; backend child emits `HARNESS_CHILD_SPAWN_EINVAL` before readiness. N5/N8 remain `NOT_OBSERVED`. |
| Windows launcher direct-CLI regression | PASS | Real Next CLI child starts through Node with owned logs; cwd/stdio/env validation and command-not-found handling are covered. |
| Authenticated harness after launcher repair | BLOCKED | Backend readiness/cleanup pass and `EINVAL` is absent. A pre-existing unknown Next dev process holds the workspace dev lock, so owned frontend readiness fails before login/N5/N8. |

## FIRST-RUN-FIX-CONT1 / FIRST-RUN-ACCEPT — complete

| Gate | Status | Evidence |
|---|---|---|
| PostgreSQL aggregate-lock regression | PASS | Advisory lock retained; aggregate state reads are plain reads; real PostgreSQL bootstrap commits without SQLSTATE `0A000`. |
| Central PII/query-log safety | PASS | Default rendered SQL logging disabled; safe-shape logger and central redaction tested; exact generated-value scans all returned `0`. |
| Real transaction lifecycle | PASS | Clean migrated disposable DB: rollback zero residue, one-winner concurrency, idempotent replay/conflict, READY and no waiting/idle lock residue. |
| HTTP acceptance | PASS | Status/token negatives, registration `410` before/after, `201 READY`, direct login, context smoke, logout and post-logout protected rejection. |
| Recovery/conflict contract | PASS — focused | Inactive/partial states are `RECOVERY_REQUIRED`; multiple Companies are `CONFIGURATION_CONFLICT`; no fallback. |
| Static validation | PASS | Focused first-run/redaction/error tests, real PostgreSQL integration, Company/notification contracts, typecheck, targeted lint and production build passed. |

`FIRST-RUN-ACCEPT = COMPLETE`; all disposable databases and temporary evidence were removed. Browser UI runtime, N5/N8 and `NOTIF-ACCEPT` remain independent deferred gates.

## FIRST-RUN-ACCEPT — real PostgreSQL acceptance result

| Gate | Status | Evidence / remaining requirement |
|---|---|---|
| Isolated migration | PASS | Disposable local database applied 51 source migrations with zero pending; it was dropped after acceptance. Official DB remains 50 applied / 1 pending. |
| Pre-bootstrap state and negative authorization | PASS | `SETUP_REQUIRED`; missing/invalid token `403`; weak payload `422`; public registration `410`; zero setup residue. |
| Valid atomic bootstrap | FAIL — product regression | Locked state resolution emits `COUNT(...) FOR UPDATE`; PostgreSQL rejects it with `SQLSTATE 0A000`, so the API returns `422 VALIDATION_FAILED` before creation. |
| Direct creation / Company / Branch / financial / replay / login | NOT OBSERVED | Blocked by the valid-bootstrap failure; no rows were created. |
| Secret-safe owned logging | FAIL — product regression | Development Sequelize logging emitted the generated acceptance email in the owned backend log. Temporary files were deleted; no secret entered Git. |
| Focused implementation tests | PASS — insufficient | `node --test tests/first-run-bootstrap.test.cjs tests/first-run-ui-contract.test.mjs`: 6/6. The fake transaction does not reproduce PostgreSQL's aggregate-lock rule. |

Required next validation: fix only the locked aggregate query strategy and development PII logging, then repeat the complete isolated acceptance. `FIRST-RUN-ACCEPT_AUTHORIZED = NO`; `FIRST-RUN-FIX-CONT1_AUTHORIZED = YES`.

## FIRST-RUN-FIX — implementation validation and remaining acceptance

| Gate | Status | Evidence / remaining requirement |
|---|---|---|
| Setup state/API | PASS — focused | `GET /setup/status` is context-free and no-store; `POST /setup/bootstrap` is rate-limited, token-gated and requires idempotency. |
| Direct privileged creation | PASS — focused | Existing bcrypt/password policy, `accountType=super_admin`, canonical `admin` role and `UserRole` are asserted. |
| Atomic Company/Branch/financial readiness | PASS — focused | One Company, Branch, six System Account Roles and cash/deposit mappings; injected mapping failure rolls all rows and marker back. |
| Replay/conflict | PASS — focused | Same key/payload replays; changed request/key conflicts; advisory-lock/marker path is covered by service contract. |
| UI/public registration | PASS — static/type/build | `/setup` retains secrets only in component memory; login routes SETUP_REQUIRED; defaults removed; `/auth/register` remains 410. |
| Clean first-run lifecycle | REQUIRED — `FIRST-RUN-ACCEPT` | Apply new migration only in isolated acceptance topology; prove status, one winner, retry, login/refresh/logout, recovery handoff and no secret leakage. |
| Deferred Company/notification browser gate | REQUIRED | N5/N8 runtime evidence and `NOTIF-ACCEPT` remain independent release gates. |

Validation: focused 21/21 pass, typecheck pass, lint with no errors, production build pass, `git diff --check` pass, required `next-env.d.ts` SHA-256 pass. Official DB remains at 50 applied migrations; one repository forward migration is intentionally pending for isolated `FIRST-RUN-ACCEPT`.

## FIRST-RUN-PRE1 — required future acceptance

| Gate | Status | Acceptance requirement |
|---|---|---|
| Source/contract audit | PASS — DESIGN READY | Registration is explicit 410; startup is non-mutating; System Accounts needs an authenticated Super Admin. No setup was executed. |
| State classification | REQUIRED | `UNINITIALIZED`, `SETUP_REQUIRED`, `SETUP_IN_PROGRESS`, `READY`, `RECOVERY_REQUIRED`, `CONFIGURATION_CONFLICT` from locked server facts. |
| First Super Admin | REQUIRED | Token-gated direct canonical password/role/access creation; no legacy intermediate, public registration or fallback. |
| Atomic Company/Branch/finance | REQUIRED | One transaction, rollback at every failure, single-winner concurrency, idempotent retry and explicit mapping readiness. |
| Recovery/release | REQUIRED | Partial states fail closed to guarded recovery; wizard/login/refresh/logout/repeat rejection pass before release. |

## CONT5 C10 Super Admin company-context acceptance — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Focused middleware test | PASS | Three deterministic tests cover absent, valid, invalid Super Admin company, no `CMP-DEMO` fallback, normal user, and auth-only compatibility. |
| Real HTTP scope matrix | PASS | Owned Super Admin received `422 SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` without company; valid Company A succeeded; nonexistent company returned `403 COMPANY_SCOPE_INVALID`; foreign/missing/overridden branch and foreign account input were denied. |
| Non-Super-Admin regression | PASS | Normal company user succeeded without header; Branch Account still required verified Employee; auth-only Super Admin `/auth/me` remained compatible. |
| Zero mutation / cleanup | PASS | All owned payment, receipt, refund, allocation, application, cash, journal, invoice, reservation, idempotency-success and reservation-audit counts stayed zero; C10 residue is zero. |
| Full quality gate | PASS | Typecheck 0; lint 0 errors/18 warnings; production build 0 with 85 pages. |
| Remaining | PARTIAL | Configuration, reconciliation, orphan-audit and rollback evidence remain for CONT11. |

## CONT5 C9 pre-write gate — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Required static CONT5 matrix | PASS | Seven required contract/verifier/test commands exited 0. The three `verify-*` commands that say `STATIC ONLY` were not treated as live-data proof. |
| Super Admin no-company contract | FAIL — P1 source-proven | `auth.middleware.js:43` assigns implicit company context; `:56-63` accepts Super Admin omission of `X-Company-ID`. |
| Live C9 fixture/config/reconciliation/rollback matrix | NOT RUN | Safely stopped before any financial write; a successful run on implicit scope would not meet owner policy. |
| C9 cleanup / residue | PASS — no fixture created | C9 namespace company count is zero; C1–C8 company-prefix count is zero. |

## CONT5 C8 R2 invariant evidence — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| R2 second active full refund | PASS — Product invariant | Actual distinct-key route request conflicted; no second refund/cash/journal/allocation. |
| C8 cleanup | PASS | Exact owned-prefix counts are zero across financial/auth/audit/idempotency tables. |
| Remaining | PARTIAL | Super Admin, configuration, reconciliation/orphan audit and rollback remain. |

## CONT5 C7 evidence — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Refund race R1 | PASS | Two different HTTP idempotency keys yielded one success and one loser. |
| Inactive Employee | PASS (bounded) | Supported inactive state was denied before refund mutation. |
| Refund race R2 | INVARIANT | Route locks and refuses a second active full refund; unsafe direct insertion was not used. |
| Remaining | PARTIAL | Super Admin, config, reconciliation and rollback remain. |

## CONT5 C6 evidence — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Refund request idempotency | PASS | Same key replayed the original HTTP success; changed payload conflicted. |
| Refund execution idempotency | PASS | Same key replayed once; changed payload conflicted without a duplicate execution. |
| Typecheck / lint / build | PASS | Natural exits: 0 / 0 / 0; lint has 18 warnings, zero errors. |
| Remaining | PARTIAL | Race, inactive/Super Admin, config, reconciliation and rollback remain. |

## CONT5 C5 refund middleware evidence — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Request / approve / reject / execute | PASS | Actual local HTTP verified-Employee responses: 201/200/200/200. |
| Missing Employee | PASS | Every action returned `401 BRANCH_ACCOUNT_EMPLOYEE_REQUIRED`. |
| No permission / direct deny | PASS | Every action returned `403 EMPLOYEE_PERMISSION_DENIED`; direct deny won. |
| C5 cleanup | PASS | Exact C5 prefix audit is zero for financial, session, audit and idempotency rows. |
| Remaining CONT5 | PARTIAL | Idempotency/race, inactive/Super Admin, config, reconciliation and rollback remain. |

| Critical flow | Role / branch / locale / viewport | Expected API and data effect | Financial / inventory / audit effect | Cleanup and evidence |
| --- | --- | --- | --- | --- |
| Super Admin login and recovery | Super Admin; EN/AR desktop/mobile | Password-only login, session freshness, no fixed branch. | No financial effect; auth audit and logout/session revocation. | Named test account/session removed or rolled back. |
| Branch Account plus Employee PIN | Fixed Branch Account and verified Employee; A/B; EN/AR desktop/mobile | Six-digit PIN, direct deny wins, branch fixed, stale authorization rejected. | No financial effect; operator session/audit. | Namespaced session cleanup. |
| Customer exact identity | Two branches and A1/A2/B1/unknown customers | Exact requested same-branch ID; cross-branch/unknown 404/403; no substitution. | No PII, credit, loyalty or statement leakage. | Rollback-owned fixtures. |
| Customer Credit deposit/refund | Treasury role; branch A/B | Protected liability and effective branch server-resolved; idempotency/replay safe. | Cash register, credit ledger, GL and audit exactly once. | Transaction rollback or proof of named cleanup. |
| Reservation Araboon | Sales/treasury roles; A/B; EN/AR desktop/mobile | Initial/subsequent payment, totals/status transitions, duplicate protection. | Receipt, cash movement, Dr cash/bank Cr branch advances only; no premature VAT/revenue/COGS/inventory. | Named fixture, journal/cash/application cleanup proof. |
| Reservation completion/cancel/refund | Same reservation lifecycle | Complete once; cancellation/refund approval/execution and expiry/renewal rules. | Settlement clears advances once; refund reverses liability to authoritative treasury; asset releases correctly. | Rollback or complete named cleanup. |
| POS, sale, return, exchange, installments | Employee permissions; A/B; EN/AR desktop/mobile | Scoped commands and correct errors. | Idempotency, VAT, AR, GL, stock and receipts reconcile. | Isolated fixture accounting reconciliation. |
| Inventory/barcode/gold purchase | Authorized branch A/B | Same-branch access only; no unauthorized lifecycle mutation. | Stock and valuation/audit correctness. | Fixture asset removal only when safely owned. |
| Reports/printing/localization | Super Admin/Branch Employee; EN/AR desktop/mobile | Routes, RTL/LTR, permissions and response data correct. | No write; labels and financial display match underlying ledger. | Screenshot/network/console record. |

Every live test records preconditions, actions, expected HTTP result, database
effect, cash-register/GL/inventory/audit effect, exact cleanup, and evidence.
Shared `darfus_erp` tests require the LOCAL-DB-VERIFIER-ADOPT1 safety contract.

Live verification requires exact local `VERIFY_DATABASE_*` / `DB_*` identity,
owner and live confirmation, a unique run ID, and a validated local backup for
V2/V3. V4 existing-data mutation and V5 destructive verifiers are blocked.

Runtime configuration acceptance includes development `::1:5432/darfus_erp`,
server missing-variable refusal, strict port/SSL parsing, URL target conflict
refusal, and error output that excludes credential values.

## LOCAL-DB-VERIFIER-REDESIGN1-RESUME execution

Canonical inventory: 66 `scripts/verify-*.js`. After `e3215f9`, default mode was 58 PASS and 8 scope-BLOCKED only by untracked temporary file `-`; no Product assertion failed. Guard and owned-fixture helper tests PASS. Fresh ignored backup `backend/backups/darfus_erp_local_db_verifier_redesign1_20260721124738.dump` (368,763 bytes) passed `pg_restore -l`. V3 PASS: Employee authorization foundation, Employee operator session, Employee permission enforcement. V3 BLOCKED: permission catalog wiring, single-level Employee, Super Admin recovery (`125` versus `128` permissions). V4/V5 and V6 modes remain blocked/deferred.

## LOCAL-DB-VERIFIER-REDESIGN2-RESUME execution

Owner-proven root artifact absence restored all scope checks: eight prior scope verifiers PASS and the canonical static matrix is **66 PASS / 0 FAIL / 0 BLOCKED**. Fresh ignored backup `backend/backups/darfus_erp_local_db_verifier_redesign2_20260721132707.dump` is 367,530 bytes and passed `pg_restore -l`. Guarded V3 is **3 PASS / 0 FAIL / 3 BLOCKED**, with each block the unchanged `125 !== 128` permission assertion. Zero owned companies/employees remained after execution.

## PERMISSION-BASELINE-RECONCILE1 execution

Fresh ignored local backup `backend/backups/darfus_erp_permission_baseline_reconcile1_20260721103957.dump` is 367,530 bytes; `pg_dump` and `pg_restore -l` both exited 0. Migration `20260721010000-reconcile-canonical-permission-baseline.js` advanced the adopted `::1:5432/darfus_erp` development database from 47 to 48 migrations and from 125 to the exact 128-slug canonical set. It inserted only the missing sales adjustment rows, retained all nine active lifecycle rows, added only absent grants on named built-in roles, and left custom roles/direct grants/direct denials unchanged. Focused catalog, ENV guard and bootstrap-config tests PASS; static matrix is **66 PASS / 0 FAIL / 0 BLOCKED**; guarded V3 is **6 PASS / 0 FAIL / 0 BLOCKED**. Typecheck and build PASS; lint has 18 existing warnings and 0 errors. Failed early verifier namespaces were exactly identified and cleaned to zero.

## BRANCH-1-VERIFIER-VALIDATE1 execution

Fresh ignored backup `backend/backups/darfus_erp_branch1_verifier_validate1_20260721130243.dump` (368,533 bytes) passed `pg_restore -l`. Formal execution is static **66/66 PASS**, approved guarded V3 **6/6 PASS**, and V2 rollback PASS. Negative target/mode matrix is 13/13 PASS; V4/V5 remain fail-closed. Exact fixture residue and journal-balance probes are clean. One additional SELECT-only demo-data live mode is FAIL/BLOCKED on its historical 20-asset expectation against current 11 assets (`B1VV-F001`); it made no write. Formal status is partial pending `BRANCH-1-VERIFIER-VALIDATE1-CONT1`.

## BRANCH-1-VERIFIER-VALIDATE1-CONT1 closure

`B1VV-F001` was classified from history and current structure, not suppressed: `02f870a` added the 20-Asset assertion for a one-time Phase 32.4 full-demo snapshot with fixed transaction totals. Current local operational data has 11 valid Assets and is not that snapshot. The unchanged explicit read-only historical mode still fails at `11 < 20`; mandatory static/readiness mode is **PASS**. Fresh backup `backend/backups/darfus_erp_branch1_verifier_validate1_cont1_20260721132906.dump` (370,982 bytes) validated with `pg_restore -l`; rerun is static **66/66 PASS**, guarded V3 **6/6 PASS**, V2 PASS, V4/V5 refusal PASS, and guard negatives **13/13 PASS**. The historical richness probe is optional/readiness-only and does not prove Browser, release, or Product acceptance.

## DEPOSIT-1-ACCEPT — pre-implementation matrix

`DEPOSIT-1-ACCEPT` is blocked on the targeted Product fix. It must prove valid
cash and bank receipt, missing/invalid/duplicate mapping refusal, missing/closed/
stale register refusal, raw-account/cross-branch/cross-company rejection, balanced
receipt/apply/refund journals, no premature revenue/VAT/COGS/inventory, replay
safety, multiple receipts, partial/full apply and refund boundaries, apply/refund
and close-session races, transaction rollback, Customer Credit/invoice-deposit
separation, Employee direct-deny/Branch/Super-Admin controls, Arabic/English
desktop/mobile UX, reporting/audit, full verifier/typecheck/lint/build, and zero
owned fixture residue. Use only approved local named fixtures after backup and
owner/live confirmation; do not use a second database.

## DEPOSIT-APPLICATION-CONTRACT1 revision

For v1.0.0, replace standalone partial-application cases with multiple partial
receipts, overpayment refusal, bounded/repeated refunds, request replay/conflict,
completion after receipts and prior refunds, exact net-deposit calculation,
exactly-once liability clearing and final-invoice-linked application rows,
exactly-once sale posting, completion replay, and refund/completion serialization.
Standalone partial application before `complete-sale` is explicitly out of scope.

## DASHBOARD-RESERVATIONS-FIX1 local evidence

On local development `::1:5432/darfus_erp`, validated-backup migration
`20260721020000` advanced history 48→49 and left receipt migration `20260721030000`
pending. Catalog proof confirms optional cash-link fields/FKs; the reservation
payment table remains empty. Read-only default/list/detail ORM queries and
bounded Arabic Admin dashboard/reservations UI observation passed without 42703
or update-depth evidence. Formal acceptance must still exercise a real authorized
detail, linked cash/session case, isolation matrix, and release-readiness gates.

## DASHBOARD-RESERVATIONS-ACCEPT1 result

Rollback-only owned acceptance data proved null and linked scalar FKs, list and
detail payment includes, and exact rollback cleanup. Direct linked ORM hydration
is **not accepted**: the source has no `ReservationPayment` cash-transaction or
cash-register-session association, and both includes produce
`SequelizeEagerLoadingError`. The authenticated Admin list/dashboard runtime is
stable, but multi-account isolation cells were unavailable. Formal release
acceptance is blocked by uncommitted migration/model source and `DASHRES-F006`.

## DASHBOARD-RESERVATIONS-ACCEPT1-CONT2 result

| Contract | Result |
| --- | --- |
| Model aliases | PASS — `cashTransaction` and `cashRegisterSession` are explicit nullable `belongsTo` associations. |
| Null and linked hydration | PASS — rollback-only `ACC-DASHRES2-*` graph, nested list/detail path, scalar-ID agreement, no duplicates, zero residue. |
| Existing list/detail contract | PASS — default service includes remain scalar-only and backward-compatible. |
| Branch mapping guard | PASS — missing mapping fails closed; no company fallback or raw client financial authority. |
| Source/migration reconciliation | PASS — `9d391c4`, matching SHA-256, migration history 49, receipt migration pending. |
| Multi-account isolation matrix | PARTIAL — authorized Branch Account, Employee, direct-deny, and cross-company contexts unavailable. |

## DASHBOARD-RESERVATIONS-ACCEPT1-CONT3 result

| Cell | Runtime | Result | Evidence |
| --- | --- | --- | --- |
| Company Admin / same company | Authenticated API | PASS | List/detail 200; selected other-branch detail 404. |
| Branch Account / verified Employee | Login + `/operator/verify` + API | PASS | Own branch list/detail 200; other branch 404. |
| Missing Employee | Authenticated API | DENIED AS DESIGNED | 401 `BRANCH_ACCOUNT_EMPLOYEE_REQUIRED`; no data. |
| Direct deny | Authenticated API | DENIED AS DESIGNED | 403 `EMPLOYEE_PERMISSION_DENIED`; no data. |
| Cross-company | Authenticated API | DENIED AS DESIGNED | Foreign header 403; foreign detail 404. |
| Super Admin | Authenticated API | PASS | Explicit selected company/branch succeeds; selected cross-branch detail 404. |
| Payment/cash-session aliases | Prior controlled fixture + focused test | PASS | Null/non-null aliases and nested list/detail remain isolated. |
| Dashboard multi-account UI | Browser | UNAVAILABLE WITH SAFE EVIDENCE | No authorized browser session; no credential injection/exposure. |

Exact owned fixtures and all touched sessions, attempts and audit events were
removed with zero residue. No financial, cash, ledger or inventory rows were
created.

## DEPOSIT-1-FIX-CONT4C — receipt acceptance

| Contract | Result | Evidence |
| --- | --- | --- |
| Migration 49 -> 50 / exact no-op rerun | PASS | Sequelize exact `--to` applied `20260721030000` once; rerun reported schema current. |
| Schema/FKs/indexes | PASS | Both receipt tables, six document FKs and six expected indexes present. |
| Receipt source/static contract | PASS | `node scripts/verify-reservation-deposit-receipts.js`; syntax, typecheck, targeted lint, production build all pass. |
| Full owned payment fixture | PARTIAL | Bounded probe timed out; immediate residue audit was zero. CONT5 must re-run with instrumentation. |

## DEPOSIT-1-FIX-CONT4D-CONT1 — receipt runtime acceptance

| Contract | Result | Evidence |
| --- | --- | --- |
| External harness gates | PASS | Final external SHA-256 `0447A2970C59A79312A6E63120FE961177911761E5DB7ED9EB7C5676B59BE3AD`; `node --check`, import-only init and local 50/50 target proof passed. |
| Owned payment and accounting | PASS | One `1.0000` cash deposit created exactly one payment, cash transaction, balanced two-line treasury/liability journal, audit, idempotency result, sequence and receipt; no VAT, invoice, stock movement or payment application. |
| Replay/conflict | PASS | Same key/payload replayed the same receipt identity; changed payload returned 409 with no extra rows. |
| Reads/history/print/snapshot | PASS | ID/payment/number reads agree; one-row history, Arabic/English notices, immutable snapshot after an owned master-data change. |
| Locks and cleanup | PASS | Pre/post activity snapshots: zero lock waiters and idle transactions; exact raw audit cleanup plus dependency order returned all owned counts to zero; clean exit. |
| Focused/static release checks | PASS | Receipt verifier, association test, dashboard-loop test, typecheck and build passed; lint has 18 existing warnings and zero errors. |

## DEPOSIT-1-FIX-CONT5 static implementation gate — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Net deposit completion | PASS (static) | Complete sale reads immutable available payment balance, writes deterministic applications and records remaining customer due. |
| Bounded pre-sale refund | PASS (static) | Request/execute are bounded by remaining net deposit; partial execution preserves the reservation. |
| Financial authority | PASS (static) | Routes derive authorized branch; services reject raw account/register/session fields and resolver supplies protected branch mappings. |
| Branch settings/UI | PASS (static/build) | Server validates branch-owned active account type/nature; Settings UI loads only eligible accounts. |
| Focused CONT5 tests | PASS | `node --test tests/reservation-deposit-cont5-contract.test.mjs` (3/3). |
| Reconciled settlement verifier | PASS | `node scripts/verify-reservation-completion-refund-settlement.js` static mode. |
| Typecheck/lint/build | PASS | Typecheck/build pass; lint has 18 existing warnings and zero errors. |

This is not financial runtime acceptance. `DEPOSIT-1-ACCEPT1` must use exact
owned local fixtures to prove journals, cash/session effects, reconciliation,
idempotency, rollback, isolation and zero residue.

## DEPOSIT-1-FIX-CONT5-CONT1 controlled runtime evidence — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Three-receipt complete sale | PASS | `5 + 7 + 8 = 20.0000` received and applied once; invoice retained `20.0000` due. |
| Partial refund then completion | PASS | `30.0000` received, `8.0000` refund, `22.0000` application; receipts remained immutable. |
| Selected fail-closed/isolation | PASS | Refund bounds/state, missing treasury, branchless legacy and foreign branch/company access were denied. |
| Exact owned cleanup | PASS | Reservation payments were deleted before owned cash transactions; zero key owned rows remained. |
| Full CONT5 runtime matrix | PARTIAL | Employee/direct-deny, races, high-count, full idempotency and rollback/failure seams remain unproved. |
| Typecheck/lint/build | PASS | Typecheck and error-only lint exited 0; supervised production build exited 0. |

## DEPOSIT-1-FIX-CONT5-CONT2 C2 runtime evidence — 2026-07-26

| Check | Result | Evidence |
| --- | --- | --- |
| Complete-sale race | PASS | Two independent keys against one owned reservation yielded one `201`, one `STATE_CONFLICT`, one invoice and one application allocation set. |
| Deposit idempotency | PASS (partial matrix) | Same payment key replayed the original payment; changed amount conflicted without a duplicate. |
| High count | PASS | 25 owned payments, 25 unique immutable receipts, aggregate `25.0000`, and deterministic application at completion. |
| C2 cleanup | PASS | Zero owned companies, reservations, payments, receipts, refunds, applications, cash rows and invoices; no idle transaction. |
| Mandatory CONT2 matrix | PARTIAL | Employee/direct-deny middleware, refund race/idempotency, remaining config, detailed reconciliation and rollback seams remain. |
## CONT5-CONT11 local acceptance evidence (2026-07-26)

| Cell | Result | Evidence |
| --- | --- | --- |
| Branch configuration fail-closed | PARTIAL | C11 real-service owned fixture passed selected liability, treasury, channel, session, account eligibility, raw authority and branch/company cells; the remaining named method/session/account cells are untested. |
| Financial reconciliation | PARTIAL | One owned scenario: received 30, refunded 8, applied 22, remaining 0; 3 receipts for 3 payments; 1 refund allocation; 1 invoice and stock movement. Full GL/AR/cash/tax reconciliation remains untested. |
| Deposit rollback seams | NOT ACCEPTED | No permanent reviewed failure-injection test yet. |
| Refund rollback seams | NOT ACCEPTED | No C11 live durable evidence executed. |
| Complete-sale rollback seams | NOT ACCEPTED | No C11 live durable evidence executed. |
| Orphan / duplicate / cross-scope audit | PARTIAL | Selected receipt/application/journal checks zero; complete required audit remains untested. |
| Cleanup / residue | PASS | Exact C11 cleanup and all counted owned tables zero. |

| CONT12 permanent rollback verifier | BLOCKED | Existing live verifier requires a pre-existing active BranchCustomer; no non-owned relationship was created or changed. A fully owned fixture graph is required in CONT13. |

| CONT16-CONT1 Deposit journal rollback | PASS | Fully owned C16-C1 runtime injection at `postReservationPaymentEntry` observed a real transaction rollback, zero failure deltas, one clean retry, and zero residue. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Deposit receipt/idempotency, Refund, and Complete-sale persistence seams remain outside C1. |

| CONT16-CONT2 Deposit receipt rollback | PASS | Fully owned C16-C2 runtime injection at `createImmutableDocument` proved transaction rollback, no receipt/sequence or financial partial rows, one clean retry, immutable notices, and zero residue. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Deposit idempotency, Refund, and Complete-sale persistence seams remain outside C2. |

| CONT16-CONT3 Deposit idempotency-success rollback | PASS | Fully owned C16-C3 runtime injection at `idempotencyService.succeed` proved same-transaction rollback, no idempotency or financial residue, same-key retry and stable replay. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Refund and Complete-sale persistence seams remain outside C3. |

| CONT16-CONT4 Refund cash-out rollback | PASS | Fully owned C16-C4 runtime injection at `CashTransaction.create` proved approved-state rollback, zero financial delta, same-key retry/replay, and unchanged Deposit receipt snapshot. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Refund journal/allocation/idempotency and Complete-sale persistence seams remain outside C4. |

| CONT16-CONT5 Refund journal rollback | PASS | Fully owned C16-C5 runtime injection at `JournalEntry.create` for the Refund source proved transaction rollback before cash-out, zero execution delta, a balanced liability/treasury retry journal, same-key replay stability, and unchanged Deposit receipt snapshot. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Refund allocation/idempotency and Complete-sale persistence seams remain outside C5. |

| CONT16-CONT6 Refund allocation rollback | PASS | Fully owned C16-C6 runtime injection at `ReservationRefundAllocation.create` proved journal/cash rollback, zero allocation partial commit, one correctly scoped retry allocation, stable same-key replay, and unchanged Deposit receipt snapshot. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Refund idempotency and Complete-sale persistence seams remain outside C6. |

| CONT16-CONT7 Refund idempotency-success rollback | PASS | Fully owned C16-C7 runtime injection at `idempotencyService.succeed` proved one atomic transaction for claim, Refund execution and response persistence; failure left zero commit, same-key retry/replay remained single-effect, and the Deposit receipt snapshot was unchanged. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Complete-sale persistence seams and the broader CONT5 acceptance matrix remain outside C7. |

| CONT16-CONT8 Complete-sale Invoice rollback | PASS | Fully owned C16-C8 runtime injection at `Invoice.create` proved zero Invoice/document/application/accounting/inventory/status/idempotency/audit commit; same-key retry/replay created one Invoice, application, two balanced journals and one stock movement while retaining the Deposit receipt snapshot. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Complete-sale accounting/application/idempotency seams and the broader CONT5 acceptance matrix remain outside C8. |

| CONT16-CONT9 Complete-sale accounting rollback | PASS | Fully owned C16-C9 runtime injection at the Invoice-sale `JournalEntry.create` proved staged Invoice/item/stock plus accounting, application, completion and idempotency all roll back; retry/replay created one balanced completion and retained the Deposit receipt snapshot. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Complete-sale application/idempotency seams and the broader CONT5 acceptance matrix remain outside C9. |

| CONT16-CONT10 Complete-sale Deposit-application rollback | PASS | Fully owned C16-C10 runtime injection at `ReservationPaymentApplication.create` proved staged Invoice/item/stock, two final-sale journals, settlement, application, completion and idempotency all roll back; same-key retry/replay created one Invoice, one correctly scoped 10.0000 application, two balanced journals and one stock movement while retaining the Deposit receipt snapshot. |
| CONT16 remaining rollback cells | NOT ACCEPTED | Complete-sale idempotency-success persistence and the broader CONT5 acceptance matrix remain outside C10. |

| CONT16-CONT11 Complete-sale idempotency-success rollback | PASS | Fully owned C16-C11 runtime injection at `idempotencyService.succeed` proved the claimed key plus all staged Invoice/item/stock, journals, application, completion and audit roll back in one transaction; same-key retry/replay created one successful completion and stable response while retaining the Deposit receipt snapshot. |
| CONT16 remaining acceptance cells | NOT ACCEPTED | Configuration/no-fallback, reconciliation, orphan/cross-scope audit and final repeatability remain outside C11. |

| CONT16-CONT12 configuration/no-fallback matrix | PASS | The original Complete-sale fallback was reproduced, fixed in CONT1, and rerun with six Deposit/Refund regressions plus strict Complete-sale role cells. `DEPOSIT-CONT16-C12-F001` is resolved; invalid mappings now fail closed with zero writes. |

| CONT16-CONT12-CONT1 Complete-sale account fallback closure | PASS | Explicit branch `system_account_roles` for AR/revenue/VAT/inventory/COGS/deposit liability are resolved before Invoice creation. Missing, Company/sibling/cross-Company, inactive and wrong-role cases failed closed with zero account/financial writes; valid mapped completion/replay created one scoped final sale without account creation. |
| CONT16-CONT13 financial reconciliation matrix | PASS | Four fully owned C13 cells used exact eight-decimal arithmetic: Deposit, partial Refund, Complete-sale without Refund, and Complete-sale after Refund. Every journal balanced; account deltas equalled journal movement; Invoice net+VAT, application/AR/due, liability, treasury, VAT/Revenue and COGS/Inventory equations passed; replay added zero financial movement and receipts stayed immutable. |
| CONT16-CONT14 orphan/duplicate/cross-scope audit | PASS | One fully owned lifecycle graph passed 14 cells: Deposit/Refund/Complete-sale parent and reference joins, receipts, applications, journals, stock, idempotency and audit linkage had zero anomalies; same-key replay added nothing; A2/B1 attempts returned `RESOURCE_NOT_FOUND` with zero write delta. |
| CONT16-CONT15 final repeatability/regression | PASS | RUN1 and RUN2 each passed 14 top-level suites: 11 rollback cells, 14 configuration cells, four reconciliation cells and 14 integrity cells. Isolated exact cleanup occurred after each suite; normalized semantic artifacts, financials, journal shapes, replay and negative zero-write outcomes matched exactly. |
| DEPOSIT-1 formal local technical acceptance | ACCEPTED | C1–C15 committed evidence chain verified: rollback, no-fallback, reconciliation, integrity and repeatability/regression all PASS; `DEPOSIT-CONT5-F002` remains RESOLVED. Acceptance is local backend subsystem scope only; deployment/Staging/Production remain unauthorized. |
| NOTIF-PRE1 notification auth/context diagnosis | PARTIAL | Static source and local unauthenticated probes prove notification list/count omit Super Admin Company propagation and SSE retries permanent `422` context rejection. Middleware contract test passes; authenticated browser request/toast chronology remains to be captured before implementation. |
| NOTIF-PRE1-CONT1 authenticated chronology capture | PARTIAL — NOT_EXECUTED | No frontend listener, browser session, or safe existing Super Admin identity was available. N4–N10 request/header/toast/SSE observations were not fabricated; next is `NOTIF-PRE1-CONT1-CONT1`. |
| NOTIF-PRE1-CONT1-CONT1 local frontend start | BLOCKED | `npm run dev -- --port 3000` and the one permitted retry on 3001 both reached Next but failed with local `listen EACCES`; no frontend process was left. Mandatory authenticated N4/N5/N7/N8 runtime evidence remains unavailable. |
| NOTIF-PRE1-CONT1-CONT1-CONT1 bind/origin boundary | PARTIAL | Windows IPv4/IPv6 TCP exclusions 2933–3032 explain 3000/3001. A temporary loopback bind and webpack Next frontend passed on `127.0.0.1:3300`, but browser login cannot reach the existing backend because that alternate origin is not CORS-allowed while `localhost:3000` is. N4/N5/N7/N8 remain not executed; no configuration change was made. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1 owned local origin/runtime capture | PARTIAL | Process-scoped ENV supported an owned 8001 backend that allowed only loopback 3300; CORS and normal Super Admin login passed. N4 confirmed one 422 list request, one 422 unread request, two corresponding global toasts, and nine 422 SSE attempts (initial plus eight reconnects). N7 showed no post-logout notification traffic/401 loop. N5 and valid-Company N8 are NOT_EXECUTED because no authoritative Super Admin Company-selection control exists; `NOTIF-FIX` remains unauthorized. |
| NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-CONT1 Company-context decision | COMPLETE — UX DEPENDENCY | Source plus authenticated runtime prove `SUPER_ADMIN_COMPANY_SELECTION_PATH = ABSENT`: only Branch switching and Company-profile editing exist; no Company list/switch action/route/persistence/header propagation exists. N5/N8 are honestly NOT_EXECUTED. The notification storm fix is independently authorized; integrated N5/N8 acceptance depends on later `UX-PRE1`. |

| NOTIF-FIX notification lifecycle repair | COMPLETE | N4 recheck recorded zero owned-backend notification list/unread/SSE requests after no-Company Super Admin dashboard readiness; zero notification-specific 422/toast/reconnect. N7 logout remained closed. Focused future-context contract isolates REST/SSE/query cache by explicit Company. N5/N8 stay deferred to `UX-PRE1`; backend fail-closed enforcement is unchanged. |

| UX-PRE1 Company-context design | APPROVED — NOT IMPLEMENTED | UX-FIX must prove context-free accessible-Company bootstrap; state transitions through UNRESOLVED/REQUIRED/VALIDATING/READY/INVALID/ERROR; no scoped traffic before READY; selector accessibility; persisted-ID server validation; A/B REST/SSE/cache isolation and Branch reset; invalid-context/logout/zero-Company recovery; N0/N5/N8/A→B. `NOTIF-ACCEPT` then proves real N5/N8 after selector implementation. |
| UX-FIX Super Admin Company context | PARTIAL — N5 telemetry and N8 BLOCKED | Bootstrap endpoint, state/provider, no-context gate, header switcher, scoped request/SSE authority, Branch clear and logout cleanup compile and pass focused tests. Runtime N0 gate and N5 selection UI passed, but browser tooling did not expose REST/SSE/header counts. A valid selected Company returned to the gate after hard in-app-browser reload, so N8 validated persistence/hydration is not accepted. Only one accessible Company existed, therefore A→B was contract-tested but not runtime-executed. Next: `UX-FIX-CONT1`. |
| UX-FIX-CONT1 single-Company hydration revision | PARTIAL — runtime evidence unavailable | One bootstrap Company auto-adopts; zero/many fail closed; legacy selected-Company persistence cannot decide READY; Company UI is display-only and Branch remains operational. Focused tests pass. Owned 8001/3300 topology reached readiness then stopped, but browser control was unavailable for safe authenticated N5/N8 REST/SSE/header/toast counts. Next: `UX-FIX-CONT1-CONT1`. |
| UX-FIX-CONT1-CONT1 runtime capture | PARTIAL — browser unavailable | Identity and focused 14-test baseline passed. Browser control reported no available browser before any owned runtime or login started; N5/N8 evidence is NOT_OBSERVED. Next: `UX-FIX-CONT1-CONT1-CONT1`. |
| UX-FIX-CONT1-CONT1-CONT1 browser-service resolution | PARTIAL — no supported browser binding | Browser control enumerated zero bindings. Chrome/Edge executables exist but cannot safely be attached through the approved control surface. Focused baseline: 14/14 PASS; runtime N5/N8 and all REST/SSE/header/toast counts remain NOT_OBSERVED. |
| UX-FIX-CONT1-CONT1-CONT1-CONT1 local browser harness | PARTIAL — authenticated session unavailable | `21d98db` supplies an existing-Playwright/installed-Chrome-or-Edge harness with isolated context, sanitized evidence, exact owned runtime cleanup and no storage-state persistence. Helper tests 3/3, focused contract tests 14/14, typecheck and targeted lint pass. Missing process-scoped credentials cause exit 2 before listeners or login; N5/N8 evidence remains NOT_OBSERVED. |
| UX-FIX-CONT1-CONT1-CONT1-CONT1-CONT1-CONT1 harness run | BLOCKED — pre-spawn log-stream defect | Approved local process-scoped credentials were supplied; the unchanged harness exited 1 before a child process started because its runtime log stream lacked an open file descriptor for `spawn` stdio. Credentials were removed; N5/N8 evidence remains NOT_OBSERVED. |

# ERROR-CONTRACT acceptance — 2026-07-28

| Contract | Result | Evidence |
| --- | --- | --- |
| Canonical 400/401/403/404/409/422/500 envelope | PASS | Shared `error-contract` tests assert the sole top-level error object and safe status defaults. |
| Request IDs | PASS | Safe bounded inbound ID is retained; unsafe input is replaced, response header/envelope use the generated ID. |
| Malformed JSON / unknown route | PASS | HTTP smoke returns `400 INVALID_JSON` and `404 ROUTE_NOT_FOUND`, each with canonical body/request ID. |
| ORM/database sanitization | PASS | Unique/foreign-key/validation map safely; unexpected DB failures are `500 INTERNAL_SERVER_ERROR` with no SQLSTATE/SQL/stack. |
| Frontend parser/form/toast ownership | PASS | Canonical + legacy parsing, network fallback, inline First Run fields, and validation-toast suppression are covered. |
| Regressions | PASS | First Run, Company context, notification lifecycle and reservation/deposit rollback targeted suites pass. |
| Browser N5/N8 / NOTIF-ACCEPT | DEFERRED | No browser runtime counts claimed or authorization granted. |
