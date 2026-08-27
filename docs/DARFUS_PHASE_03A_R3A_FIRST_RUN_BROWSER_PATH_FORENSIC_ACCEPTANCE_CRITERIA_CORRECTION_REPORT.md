# DARFUS ERP — Phase 03A-R3A First-Run Browser Path Forensic / Acceptance Criteria Correction

Control ID: `DARFUS-PHASE-03A-R3A-FIRST-RUN-BROWSER-PATH-FORENSIC-ACCEPTANCE-CRITERIA-CORRECTION`

Mode: `READ_ONLY_FORENSIC_DESIGN_ONLY`

Main Frontend: `http://localhost:3000`

Main Backend: `http://localhost:8000`

Official DB: `darfus_erp`

## 1. Executive Summary

تم تنفيذ Phase 03A-R3A كفحص مصدر وruntime قراءة فقط. النتيجة الحاسمة هي أن مسار First-Run الحقيقي موجود ومتكامل في المصدر:

`Browser /{locale}/setup` → `POST /api/v1/setup/bootstrap` → `bootstrapFirstRun` → Company/User/Branch → Chart of Accounts and branch financial mappings → Inventory Master Data Bootstrap → validation → audit/READY marker → LOGIN.

Inventory Master Data Bootstrap ليس مطلوبًا أن يظهر كزر Replay في شاشة `READY`. الـorchestrator يستدعي service الداخلي `bootstrapInventoryMasterData` داخل نفس transaction وقبل تحويل marker إلى `READY`. لذلك كان شرط R3 الذي حاول إثبات Bootstrap POST من شاشة READY معيار قبول غير مطابق للحالة التصميمية الفعلية، وليس دليلًا على غياب التكامل.

لا يوجد Product Gap مثبت في تكامل First-Run. توجد فجوة قبول فقط: الاختبار browser الحقيقي لمسار First-Run يحتاج حالة fresh/disposable، بينما `darfus_erp` الحالية بالفعل `READY` ولا يجوز إعادة ضبطها. أوصي بقبول منفصل على قاعدة PostgreSQL disposable مخصصة، مع إبقاء Official DB كدليل READY/read-only.

لم يحدث في R3A أي تعديل مصدر أو اختبار أو migration أو build أو restart أو DB mutation.

## 2. Preconditions

تمت قراءة الملفات السابقة كاملة قبل إصدار هذا التقرير. سجل القراءة:

| Input | Characters | Lines | Result |
|---|---:|---:|---|
| `docs/DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md` | 12,462 | 312 | READ_COMPLETE |
| `docs/DARFUS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_REPORT.md` | 29,531 | 453 | READ_COMPLETE |
| `docs/DARFUS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_REPORT.md` | 36,391 | 639 | READ_COMPLETE |
| `docs/DARFUS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION_REPORT.md` | 15,046 | 401 | READ_COMPLETE |
| `docs/DARFUS_PHASE_03A_B2_FRESH_POST_R2_BACKUP_REPORT.md` | 7,632 | 244 | READ_COMPLETE |
| `docs/DARFUS_PHASE_03A_R3_FIRST_RUN_BOOTSTRAP_BROWSER_NETWORK_RUNTIME_ACCEPTANCE_CLOSURE_REPORT.md` | 12,122 | 301 | READ_COMPLETE |

Precondition gates accepted from the evidence:

- R1: design gate PASS.
- R1A: first-run master-data design gate PASS.
- R2: `PASS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION`.
- B2: `PASS_PHASE_03A_B2_FRESH_POST_R2_VERIFIED_BACKUP`.
- Previous R3: correctly remained `BLOCKED_PHASE_03A_R3_BROWSER_ACCEPTANCE` because the READY browser path did not expose a replay action.

## 3. R3 Blocker Restatement

R3 observed the authenticated real browser at `/ar/setup` in `READY` state. The page rendered `Setup complete` and `Go to login`; it did not render the fresh-install form and did not expose a Bootstrap/Replay action. No hidden POST or direct service call was substituted.

This is an acceptance-path limitation, not proof that the actual First-Run orchestrator omits Inventory Master Data Bootstrap. R3 tested a READY-state UI against a first-run action that is only available while the installation is `SETUP_REQUIRED`.

## 4. Frozen R2/R3 Facts

| Fact | Evidence / Result |
|---|---|
| Official database | `darfus_erp`; read-only in R3A |
| Bootstrap dataset | `INVENTORY_REFERENCE_MASTER_DATA` |
| Bootstrap version | `2` |
| Bootstrap state | `READY` |
| `profile_master_data` | `659` |
| `pearl_size_master_data` | `39` |
| `barcode_inventory_codes` | `5` |
| `barcode_item_codes` | `20` |
| `barcode_sequences` | `0` |
| Bootstrap state rows | `1` |
| R2 replay | PASS, zero duplicates |
| Main frontend/backend/auth/company context | PASS in R3 |
| R3 official DB mutation | `0` |

Fresh read-only query during R3A returned:

`darfus_erp|READY|1|1|659|39|5|20|0`

in the order `current_database | first_run_state | companies | inventory_bootstrap_states | profiles | pearl_sizes | inventory_codes | item_codes | sequences`.

## 5. Frontend Setup Source Trace

Primary file: `app/[locale]/setup/page.tsx`.

| File / function | Trigger | Condition | Endpoint | Payload / headers | Context behavior | READY behavior |
|---|---|---|---|---|---|---|
| `app/[locale]/setup/page.tsx:13-29`, `SetupPage` | Page mount | Always on mount | `GET /setup/status` | No body; `companyScope: "none"`, `skipBranch: true` | Context-free; the API client does not require company or branch | Sets local `status` from server |
| `SetupPage:31-53`, `submit` | User submits first-run form | Only the `SETUP_REQUIRED` form is rendered | `POST /setup/bootstrap` | Form body without token; `X-First-Run-Setup-Token`; generated idempotency key | Context-free; no company/branch scope | On success sets local `complete=true`, `status=READY` |
| `SetupPage:58-60` | Render | `status === READY || complete` | None | None | No setup mutation | Renders `Setup complete` and only `Go to login` |
| `SetupPage:61-63` | Render | `RECOVERY_REQUIRED` or `CONFIGURATION_CONFLICT` | None | None | No setup mutation | Renders administrator recovery notice |
| `app/[locale]/login/page.tsx:28-29` | Login page mount | Status is `SETUP_REQUIRED` | `GET /setup/status` | Context-free | Redirects to `/setup` when setup is required | Does not add a replay action |

The frontend has no caller for `/inventory-master-data/bootstrap`. The only setup mutation caller is `/setup/bootstrap` from the first-run form.

The API client uses `/api/v1` by default (`lib/api/client.ts:319-330`), adds `Idempotency-Key` when requested (`:367-369`), and intentionally treats `/setup/*` as context-free (`:270-277`).

## 6. Backend Setup Source Trace

### Route and mount

- `backend/src/app.js:99-101` mounts the router at `/api/v1` and a compatibility mount at `/api`.
- `backend/src/routes/index.js:32` mounts `setup.routes` at `/setup`.
- `backend/src/routes/setup.routes.js:10-11` defines `GET /status` and rate-limited `POST /bootstrap`.

Therefore the canonical API paths used by the frontend are:

- `GET /api/v1/setup/status`
- `POST /api/v1/setup/bootstrap`

### Status path

`backend/src/controllers/setup.controller.js:5-13` calls `resolveSetupState(models)` and returns `publicStatus`. It does not mutate the DB and sets `Cache-Control: no-store`.

`backend/src/services/first-run-setup-state.service.js:24-53` derives the state from the durable marker, Company count, active Super Admin count, active Branch count, and financial readiness.

### Bootstrap path

`backend/src/controllers/setup.controller.js:15-29` calls `bootstrapFirstRun` with:

- `models`
- request body
- `X-First-Run-Setup-Token`
- `Idempotency-Key`

The controller does not choose a Company or Branch from the client. The service creates and owns those records in the first-run transaction.

## 7. REAL_FIRST_RUN_CALL_GRAPH

```text
Browser /ar/setup or /en/setup
  └─ SetupPage useEffect
       └─ GET /api/v1/setup/status
            └─ setupController.status
                 └─ resolveSetupState
                      ├─ SETUP_REQUIRED → render first-run form
                      └─ READY → render Setup complete / Go to login

SETUP_REQUIRED form submit
  └─ SetupPage.submit
       └─ POST /api/v1/setup/bootstrap
            └─ setupController.bootstrap
                 └─ bootstrapFirstRun
                      ├─ verify FIRST_RUN_SETUP_TOKEN
                      ├─ validate payload and idempotency key
                      ├─ begin Sequelize transaction
                      ├─ pg_advisory_xact_lock(736287401)
                      ├─ resolve setup state under transaction
                      ├─ create SETUP_IN_PROGRESS marker
                      ├─ create Company
                      ├─ ensure roles and create Super Admin User
                      ├─ assign admin role
                      ├─ create first Branch
                      ├─ ensureFinancialReadiness
                      │    └─ financialBootstrapService.reconcile
                      │         ├─ posting Chart of Accounts catalog
                      │         ├─ SystemAccountRole rows
                      │         └─ BranchFinancialMapping rows
                      ├─ inventoryMasterDataBootstrapService.bootstrapInventoryMasterData
                      │    └─ same transaction
                      ├─ validate Super Admin / Branch / Role / Mapping counts
                      ├─ audit first_run_setup_completed
                      ├─ update marker to READY
                      └─ commit transaction and return { state: READY, next: LOGIN }
```

Exact orchestration source: `backend/src/services/first-run-bootstrap.service.js:80-146`.

## 8. Inventory Bootstrap Integration Proof

The integration is proven in source for the real application model set:

1. `backend/src/models/index.js:107-108` loads `FirstRunSetupState` and `InventoryMasterDataBootstrapState` into the real `models` object.
2. `backend/src/services/first-run-bootstrap.service.js:122-129` checks the real model and loads `inventory-master-data-bootstrap.service`.
3. It calls `bootstrapInventoryMasterData({ models, companyId: company.id, actorId: user.id, transaction })` before any READY marker update.
4. `backend/src/services/inventory-master-data-bootstrap.service.js:196-200` reuses the supplied transaction instead of opening a nested transaction.
5. `backend/src/services/inventory-master-data-bootstrap.service.js:173-193` creates the state, reconciles reference rows, verifies the result, records audit, and marks the inventory dataset READY within the supplied transaction.

Classification:

`INVENTORY_BOOTSTRAP_CALLED_BY_FIRST_RUN = YES_FOR_REAL_SCHEMA`

The conditional model guard exists to keep isolated unit fixtures compatible. It does not disable the call in the actual application because the real model is present.

## 9. Chart of Accounts Integration Proof

COA/financial readiness is integrated at the same first-run orchestration level:

- `first-run-bootstrap.service.js:63-78` defines `ensureFinancialReadiness`.
- `first-run-bootstrap.service.js:121` invokes it after Company/User/Branch creation.
- `financial-bootstrap.service.js:136-203` reconciles posting accounts, system account roles, and branch financial mappings using the supplied transaction.
- `financial-bootstrap.service.js:199-200` evaluates readiness and fails closed if it is not `READY`.

Order is therefore:

`Company/User/Branch → COA and financial mappings → Inventory Master Data → final count checks → audit → READY marker`.

COA and Inventory Master Data are not separate top-level transactions during First-Run. Both participate in the transaction owned by `bootstrapFirstRun`.

## 10. Setup State Machine

| State | Source condition | UI | Allowed action | Transition source |
|---|---|---|---|---|
| `SETUP_REQUIRED` | No Company, no active Super Admin, no marker | First-time setup form | Submit `/setup/bootstrap` | `resolveSetupState` lines 38; form submit |
| `SETUP_IN_PROGRESS` | Durable marker is in progress | Preparing/wait or wait response | No second bootstrap; service returns conflict | Marker creation at `first-run-bootstrap.service.js:107`; state resolver line 37 |
| `READY` | One valid Company, active Super Admin, active Branch, financial readiness READY, marker READY | Setup complete / Go to login | Login only | Marker update at lines 139-144; resolver lines 51-53 |
| `RECOVERY_REQUIRED` | Partial Company/User/Branch/financial state or marker not READY | Administrator recovery notice | No public setup submit | Resolver lines 39, 43, 51-52 |
| `CONFIGURATION_CONFLICT` | More than one Company | Administrator recovery notice | No public setup submit | Resolver line 36 |
| `UNINITIALIZED` | Enum/type exists but is not emitted by the current resolver | Not observed as a live resolved state | None defined | Enum only at line 6 |

There is no durable explicit failure state transition in the normal bootstrap path. A thrown error rolls back the transaction, including the in-progress marker, so a genuinely empty installation returns to `SETUP_REQUIRED`; a partial pre-existing installation is classified as `RECOVERY_REQUIRED`.

## 11. READY State Design

The READY design is intentional and source-consistent:

- `SetupPage` renders only `Setup complete` and `Go to login`.
- `publicStatus(READY)` maps the action to `LOGIN`.
- No READY-state call to `/inventory-master-data/bootstrap` exists in the frontend.
- No manual replay button or second setup form is present.

Conclusion:

`ABSENCE_OF_READY_REPLAY_ACTION = EXPECTED_DESIGN`

It is not a product defect established by this forensic control. Adding a replay button would create a new UI/workflow requirement outside R3A.

## 12. Inventory Bootstrap Endpoint Role

The endpoint in `backend/src/routes/erp.routes.js:5278-5288` is:

`POST /api/v1/inventory-master-data/bootstrap`

It requires:

- `authMiddleware`
- `settings.update` business permission
- server-derived `req.companyId`
- server-derived `req.user.id`

It calls the same service and supports `dryRun`. It is a protected administrative/manual reconciliation API. It is not the canonical browser First-Run entry point and is not called by the setup page.

The canonical First-Run path calls the service directly from `first-run-bootstrap.service.js`, which is the correct orchestration boundary. The absence of a frontend caller to the endpoint is therefore expected, not evidence of missing First-Run integration.

## 13. Security / Auth / Setup Guard Review

| Control | Evidence | Result |
|---|---|---|
| Setup status context | `/setup/status` is context-free and read-only | Expected for pre-company state |
| Bootstrap authentication | No normal Bearer auth is required before the first user exists; deployment-controlled `FIRST_RUN_SETUP_TOKEN` is required at service line 55 | Fail-closed token boundary |
| Token comparison | `crypto.timingSafeEqual` after length check at lines 55-59 | PASS |
| Rate limit | `setup.routes.js:8-11`, max 5 per 15 minutes | PASS |
| Idempotency | Required header; payload/key hashes stored and checked | PASS by source/tests |
| Concurrency | PostgreSQL transaction-scoped advisory lock at line 92 | PASS by source/tests |
| Company context | Company is created server-side; setup client uses `companyScope:none` | PASS |
| Branch context | Branch is created server-side; `skipBranch:true` applies to setup calls | PASS |
| READY denial | Marker READY rejects new/different bootstrap attempts | PASS by lines 94-97 |
| Public registration | Existing contract test confirms registration is closed with HTTP 410 | PASS by `tests/first-run-bootstrap.test.cjs:181-192` |

No security weakening was introduced or proposed.

## 14. Transaction / Rollback Analysis

`bootstrapFirstRun` owns one `models.sequelize.transaction` at `first-run-bootstrap.service.js:89`. The following are inside it:

- setup marker
- Company
- roles and User
- Branch
- COA/accounts/system roles/branch mappings
- Inventory Master Data state and rows
- audit record
- final READY marker

The Inventory service receives the existing transaction at lines 126-129 and does not open a nested transaction when one is supplied (`inventory-master-data-bootstrap.service.js:199-200`). The READY marker is written only at line 144 after Inventory and final validation succeed.

Source conclusion:

`INVENTORY_BOOTSTRAP_FAILURE → transaction rejection → no committed Company/User/Branch/COA/Inventory/READY state`.

Existing unit evidence proves rollback on a financial mapping failure (`tests/first-run-bootstrap.test.cjs:168-179`). A dedicated real-PostgreSQL inventory-failure injection was not run in R3A because the control forbids creating a fresh DB or performing mutation. That is a future acceptance proof item, not a source ambiguity.

## 15. Existing Test Evidence

| Test | What it proves | What it does not prove |
|---|---|---|
| `tests/first-run-bootstrap.test.cjs` | Empty/partial/conflict state; token guard; atomic Company/User/Branch/financial setup; idempotent replay/conflict; rollback on financial failure; route contract | Its fake model omits `InventoryMasterDataBootstrapState`, so it does not execute the real Inventory call |
| `tests/first-run-postgres.integration.test.cjs` | Real PostgreSQL rollback, advisory-lock concurrency, idempotency, final READY and financial rows when explicit DB is supplied | It is skipped when `FIRST_RUN_PG_INTEGRATION_DB` is absent; it was not run against a newly created DB in R3A |
| `tests/first-run-ui-contract.test.mjs` | Setup status caller, setup token header, idempotency key, recovery UI, no default credentials | It is static contract inspection, not browser/network acceptance |
| `backend/tests/inventory-master-data-bootstrap-r2.test.cjs` | Manifest count/categories, canonical barcode taxonomy, aliases, loose-profile rules | It does not prove First-Run orchestration or Browser submission |
| `docs/...R2...REPORT.md` | R2 direct first-run/replay and official post-R2 state evidence | It is not the missing fresh browser proof |

This test coverage is sufficient to prove the source call graph, but not sufficient to close the fresh browser acceptance itself.

## 16. Browser Acceptance Criteria Analysis

R3 criterion:

`READY browser → Bootstrap POST → replay`

was not aligned with the current state machine. The action exists only for `SETUP_REQUIRED`, and the READY UI correctly offers login only.

Evaluation:

| Model | Assessment |
|---|---|
| Model A — Replay in READY state | Not required by current source/design; would invent a new UI action |
| Model B — True First-Run acceptance | Correct functional proof: fresh `SETUP_REQUIRED` state, browser submit, orchestrator, Inventory Bootstrap, READY |
| Model C — Split acceptance | Safest operational gate: disposable fresh browser proof plus official DB READY/read-only proof |

Recommended model: **Model C**, implemented by the next explicitly approved R3B control. It preserves the official DB and proves the real browser path on a safe fresh target.

## 17. Disposable Fresh-State Acceptance Options

No disposable DB or environment was created in R3A.

| Option | Assessment |
|---|---|
| A. Clone from pre-bootstrap-safe baseline | Only safe if a verified pre-bootstrap clone exists; the verified B2 artifact is post-R2 and already READY, so it is not a fresh First-Run target by itself |
| B. Dedicated disposable PostgreSQL DB using current migrations and explicit test harness | Recommended. Existing `tests/first-run-postgres.integration.test.cjs` explicitly requires `FIRST_RUN_PG_INTEGRATION_DB` and skips when absent, providing an existing safety contract |
| C. Disposable second Company in official DB | Rejected. Frozen architecture is single-company/multi-branch and official DB must not be mutated |
| D. Automated browser fixture | Possible only if it provisions an isolated DB/connection; it should not simulate fresh state inside `darfus_erp` |

Recommended target: **Option B**, with the same source, a separately resolved DB URL/name, a separate backend process/port only if required by the harness, and a separate browser session. The target must pass exact `SELECT current_database()` verification before any mutation in the future control.

## 18. Recommended Acceptance Model

Minimum safe next acceptance model:

1. Keep `darfus_erp` untouched and record its existing `READY`/R2 counts as the official baseline.
2. Obtain explicit approval for a disposable PostgreSQL target.
3. Apply only the already-approved migration sequence to that target through the project’s target-verified test harness.
4. Start a separate backend bound to that target, if needed; do not repoint the main runtime silently.
5. Use a separate authenticated browser session.
6. Open `/ar/setup` or `/en/setup` while the target is `SETUP_REQUIRED`.
7. Submit the real setup form and observe `POST /api/v1/setup/bootstrap`.
8. Prove the internal service call and resulting counts/state before/after the transaction.
9. Verify READY and login, replay/conflict semantics, and zero partial rows after an injected failure if the approved harness supports it.
10. Report disposable proof separately from official DB read-only proof.

No new UI replay action is required by this model.

## 19. Source Change Requirement

| Question | Result | Reason |
|---|---|---|
| Source change required for First-Run Inventory integration? | `NO` | Integration already exists in `first-run-bootstrap.service.js:122-129` |
| Source change required for acceptance-only? | `NO_PRODUCT_SOURCE_CHANGE` | The missing proof requires a fresh disposable target and corrected acceptance criteria, not a product patch |
| Test harness/control design required? | `YES` | Existing integration test requires an explicit disposable DB; R3B should exercise the real browser on that target |

## 20. Manual READY Replay Decision

`READY_UI_REPLAY_REQUIREMENT = NO`.

`MANUAL_READY_REPLAY_BUTTON_REQUIRED = NO`.

Evidence: `SetupPage` READY branch at `app/[locale]/setup/page.tsx:58-60` renders only the completion notice and login action; `publicStatus(READY)` maps to `LOGIN`; the current business flow performs Inventory Bootstrap before READY.

## 21. Acceptance Truth Table

| Question | Result | Evidence |
|---|---|---|
| READY UI should replay bootstrap? | `NO` | READY branch only renders Setup complete / Go to login; page has no replay caller |
| First Run browser invokes setup backend? | `YES` | `SetupPage.submit` calls `/setup/bootstrap`; API base is `/api/v1` |
| Setup backend invokes first-run orchestrator? | `YES` | `setup.controller.js:15-29` calls `bootstrapFirstRun` |
| First-run orchestrator invokes COA bootstrap? | `YES` | `ensureFinancialReadiness` calls `financialBootstrapService.reconcile` at lines 63-70 |
| First-run orchestrator invokes Inventory Bootstrap? | `YES` for real schema | `first-run-bootstrap.service.js:122-129`; real model loaded at `models/index.js:108` |
| Inventory Bootstrap runs before READY? | `YES` | Inventory call lines 126-129 precedes marker update line 144 |
| Failure prevents READY? | `YES` by transaction/source | All work is in one Sequelize transaction; thrown failure prevents commit and marker update |
| Official DB can safely be reset for proof? | `NO` | Frozen official DB authority and R3A explicit prohibition |
| Disposable target required for true fresh proof? | `YES` | Official state is already READY; real PostgreSQL test explicitly requires `FIRST_RUN_PG_INTEGRATION_DB` |

## 22. Risk Classification

| Finding | Classification | Priority | Impact |
|---|---|---|---|
| R3 tested READY UI for a SETUP_REQUIRED action | Acceptance criteria gap | P2 | Blocks correct browser closure but does not block the product’s existing READY operation |
| No manual READY replay action | Expected design | INFO | Adding one would create an unapproved second setup action |
| First-Run Inventory integration missing from fake unit fixture | Test coverage gap | P2 | Unit test can pass without invoking Inventory service; real source path remains integrated |
| Fresh real-browser proof not yet run | Acceptance gap | P2 | Fresh-install runtime evidence remains open until R3B |
| Product integration gap | Not found | INFO | Source call graph proves integration |
| Official DB mutation in R3A | None | INFO | Read-only query only; zero writes |

P0 findings: `0`.

P1 findings: `0`.

No P0/P1 product, security, financial, or data-corruption defect was established by R3A.

## 23. Exact Next Control

`R3B_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE_ON_APPROVED_DISPOSABLE_TARGET`

Required scope:

- exact target verification before mutation;
- real Browser `SETUP_REQUIRED` form submission;
- network proof for `POST /api/v1/setup/bootstrap`;
- backend call/order proof for COA and Inventory Bootstrap;
- transaction/rollback and READY proof;
- replay/conflict proof;
- separate official `darfus_erp` read-only baseline reconciliation.

Do not add a READY replay button. Do not reset `darfus_erp`. Do not start Phase 03B.

## 24. Out-of-Scope Confirmation

Not performed:

- no source implementation;
- no UI change;
- no test modification;
- no migration creation or execution;
- no DB reset, seed, bootstrap replay, company creation, or business mutation;
- no disposable DB creation;
- no build, restart, deploy, or new container;
- no Supplier, Location, VAT, GBW, GBP, Diamond, Gem Stone, or Pearl implementation;
- no edit to `AGENTS.md` or `next-env.d.ts`;
- no destructive Git operation.

## 25. Files Changed

Intentional R3A output only:

- `docs/DARFUS_PHASE_03A_R3A_FIRST_RUN_BROWSER_PATH_FORENSIC_ACCEPTANCE_CRITERIA_CORRECTION_REPORT.md`

No frontend, backend, test, migration, config, environment, or secret file was changed.

The worktree already contained unrelated modifications and untracked work from earlier controls. They were preserved and not claimed as R3A changes.

## 26. DB Mutation Proof

Official DB read-only query result:

`darfus_erp|READY|1|1|659|39|5|20|0`

No INSERT, UPDATE, DELETE, TRUNCATE, migration, bootstrap execution, reset, or business transaction was run by R3A.

`OFFICIAL_DB_WRITES_THIS_CONTROL = 0`.

## 27. Git Safety Proof

- `git status` was read-only; the repository required a command-local `safe.directory` override because filesystem ownership differs from the current Windows identity.
- Existing dirty worktree content was observed and preserved.
- No `reset`, `restore`, `clean`, `stash`, `checkout`, `commit`, `push`, or broad `git add` was run.
- `AGENTS.md` was not edited.
- `next-env.d.ts` was not edited.
- No build was run.

## 28. Gate

The real First-Run browser entry, backend entry, orchestrator, COA integration, Inventory integration, READY semantics, security boundary, transaction boundary, and corrected acceptance model are all defined by source evidence.

```text
GATE = PASS_PHASE_03A_R3A_FIRST_RUN_PATH_AND_ACCEPTANCE_CRITERIA_DEFINED
```

This PASS is a forensic/design gate only. It is not a claim that fresh disposable Browser acceptance has already been executed. That proof belongs to the explicitly approved R3B control.

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3A-FIRST-RUN-BROWSER-PATH-FORENSIC-ACCEPTANCE-CRITERIA-CORRECTION
PHASE = 03A-R3A
MODE = READ_ONLY_FORENSIC_DESIGN_ONLY
OFFICIAL_DB = darfus_erp

R3_PREVIOUS_GATE = BLOCKED_PHASE_03A_R3_BROWSER_ACCEPTANCE

REAL_FIRST_RUN_BROWSER_ENTRY = http://localhost:3000/{locale}/setup (observed /ar/setup)
REAL_FIRST_RUN_BACKEND_ENTRY = POST /api/v1/setup/bootstrap
REAL_FIRST_RUN_ORCHESTRATOR = backend/src/services/first-run-bootstrap.service.js::bootstrapFirstRun
SETUP_STATUS_ENDPOINT = GET /api/v1/setup/status
INVENTORY_BOOTSTRAP_ENDPOINT = POST /api/v1/inventory-master-data/bootstrap
INVENTORY_BOOTSTRAP_ENDPOINT_ROLE = AUTHENTICATED settings.update ADMIN/MANUAL RECONCILIATION API; NOT THE CANONICAL FIRST-RUN BROWSER ENTRY

COA_BOOTSTRAP_CALLED_BY_FIRST_RUN = YES
INVENTORY_BOOTSTRAP_CALLED_BY_FIRST_RUN = YES_FOR_REAL_SCHEMA
INVENTORY_BOOTSTRAP_RUNS_BEFORE_READY = YES
FIRST_RUN_FAILURE_PREVENTS_READY = YES

READY_UI_REPLAY_ACTION_EXISTS = NO
MANUAL_READY_REPLAY_BUTTON_REQUIRED = NO
R3_ACCEPTANCE_CRITERIA_WAS_WRONG = YES
REAL_PRODUCT_FIRST_RUN_GAP = NO

SOURCE_CHANGE_REQUIRED_FOR_FIRST_RUN_INTEGRATION = NO
SOURCE_CHANGE_REQUIRED_FOR_ACCEPTANCE_ONLY = NO_PRODUCT_SOURCE_CHANGE

SAFE_FRESH_ACCEPTANCE_TARGET = DEDICATED_DISPOSABLE_POSTGRESQL_DB_SELECTED_BY_EXPLICIT_TARGET_VERIFIED_HARNESS_USING_FIRST_RUN_PG_INTEGRATION_DB; SAME SOURCE; SEPARATE BROWSER SESSION; NOT CREATED IN R3A
OFFICIAL_DB_SAFE_TO_RESET_FOR_ACCEPTANCE = NO

OFFICIAL_DB_WRITES_THIS_CONTROL = 0
SOURCE_CODE_CHANGED = NO
TEST_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO

GATE = PASS_PHASE_03A_R3A_FIRST_RUN_PATH_AND_ACCEPTANCE_CRITERIA_DEFINED
NEXT_RECOMMENDED_STEP = R3B_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE_ON_APPROVED_DISPOSABLE_TARGET
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Await Owner Review. No replay button, official DB reset, disposable DB creation, R3B, or Phase 03B was started automatically.
