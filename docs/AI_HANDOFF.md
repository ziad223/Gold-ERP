# READ THIS FIRST — CURRENT PROJECT HANDOFF

> **NOTICE:** This block is the primary project-state entry point. All future tools must read it first before any code execution or planning. It summarizes the current state but does NOT replace the original client requirements.
>
> **Phase HF6D - Employee Permission Enforcement (closed):** HF6D completed on local `main` only. Commits are `c8bda95 docs: record branch employee selector audit`, `4336699 fix: enforce employee permissions across branch access`, and the following documentation closure commit. The phase repairs the full Branch Account Employee-permission path: `/operator/verify` and `/operator/current` return a safe authorization summary; `OperatorProvider`, `usePermissions`, the canonical module access map, navigation, and page guards consume effective Employee permissions; and `business-permission.middleware.js` enforces verified Employee, fixed branch, direct denial, credential version, and authorization version server-side. No POS fallback remains. The Employee page has focused permission counts, filters, collapsible module groups, an accessible sticky save flow, and Arabic/English denial precedence messaging. HF6D-PRE-CLOSE1 proved an AuthGuard layout regression: the safe shell was returned before AppShell/Header, leaving first Branch Account login without a visible Employee entry point. The final flow uses one shared Code plus six-digit PIN form inline in the safe shell and in the Change Employee dialog. End/expired/revoked/stale Employee sessions return to the inline form while preserving the Branch Account technical login. A second proven client fix prevents the React Query global 401 handler from clearing a valid technical session for expected operator-recovery errors. Host-local Playwright QA passed English/Arabic desktop and mobile, invalid PIN recovery, first allowed-route navigation, Change Employee, End Employee Session, revoked-session recovery, Super Admin separation, no overflow, no runtime overlay, and no console errors. `HF6D-BQA-*` fixtures and sessions were cleaned. Counts remain 44 migrations, 128 permissions, and 62 verifiers. Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6d_start_20260718_005736.dump` (488940 bytes). Final backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6d_final_20260718_210622.dump` (493583 bytes), both validated with `pg_restore -l` against local Docker `darfus-postgres`. Typecheck, lint, build, focused and targeted regressions passed; the clean-tree 62/62 suite is run immediately after this documentation commit. `next-env.d.ts` was restored only after the exact authorized generated development-path drift. Production/Render was untouched, ports 3000/8000 are quiet, and 11 stashes remain untouched. NEXT TOOL START HERE: HF6E may begin only with owner approval; do not start Phase 35E or deploy to Production.
>
> **HF6D-PRE1 - Employee Permission Application and Navigation Audit:** Documentation-only audit completed from clean `main` at `597fb733c195a394f6a0ecefedb9be4c367f8a30` with 11 stashes untouched, `next-env.d.ts` clean, ports 3000/8000 quiet, Docker PostgreSQL `localhost:5433 / darfus_erp`, and production/Render untouched. No implementation, tests, verifiers, build/dev server, browser login, Employee verification, write API, fixture, migration, seed, or DB mutation was performed; database work was SELECT-only. Files/routes/services inspected include `backend/src/routes/employee-authorization.routes.js`, `backend/src/services/employee-authorization.service.js`, `backend/src/services/operator-session.service.js`, `backend/src/middleware/auth.middleware.js`, `backend/src/services/permission.service.js`, `backend/src/services/sales-operator-policy.service.js`, `backend/src/routes/erp.routes.js`, `backend/src/routes/gold-purchase.routes.js`, `contexts/auth-context.tsx`, `contexts/operator-context.tsx`, `hooks/use-permissions.ts`, `components/layout/sidebar.tsx`, `components/auth/auth-guard.tsx`, `lib/repositories/api-impl.ts`, `lib/api/client.ts`, `lib/types.ts`, `lib/permissions/catalog.ts`, and Employee/POS/Inventory/Customers page surfaces. SELECT-only current data counts: 7 Employees, 6 active/present Employees, 0 active Employee role assignments, 0 active Employee direct grants, 0 active Employee direct denials, 409 role-permission rows, 0 active Employee operator sessions, 8 active technical sessions, 0 active authorization-version-mismatched operator sessions, 0 Employees with effective permissions greater than zero, 0 with effective POS permissions, and 0 with effective non-POS permissions. Current data therefore cannot prove the owner's exact runtime Employee by existing rows without forbidden fixture/session creation; the root cause is source-proven. Permission assignment itself is not the primary loss point: `PUT /employees/:id/permissions` calls `updateEmployeeAuthorization`, validates roles/permission IDs, replaces role/direct grant/direct denial rows, audits, increments `Employee.authorizationVersion` when changed, and `GET /employees/:id/permissions` returns `assignableCatalog`, `rolePermissions`, `directGrants`, `directDenials`, `effectivePermissions`, `effectiveSources`, and `authorizationVersion`. Employee verification also resolves effective permissions and returns `authorization` in `/operator/verify`; sessions store `credentialVersion` and `authorizationVersion`, and stale authorization is revoked by `operator-session.service`. The first proven loss is frontend state: `OperatorVerifyResult.authorization` is typed as `unknown`, `OperatorProvider.verify` stores only `operatorSession`, `/operator/current` returns only session state and no authorization payload, and `usePermissions()` reads only `useAuth().user.permissions` from the technical login. Branch Accounts intentionally have no direct technical permissions, so Employee effective permissions never reach navigation/page/action guards. The second proven loss is backend coverage outside Sales/POS operator policy: ordinary route guards call `requirePermission`, which delegates to `permission.service.userHasPermission`; that service returns `false` for `accountType = branch_shell`. Therefore direct Employee permissions cannot authorize Customers, Inventory, Treasury, Accounting, Reports, Settings, Gold Purchase, Suppliers, Employees, or generic CRUD routes for Branch Accounts. Sales/POS representative commands are the exception because `sales-operator-policy.service` calls `operatorSessionService.currentFromRequest(... requiredPermission: policy.employeePermission ...)`; it checks Employee effective permissions and session freshness. Exact POS finding: POS appears because `AuthGuard` redirects Branch Accounts from `/dashboard` to `/pos`, bypasses route permission denial for `/pos` and `/sales`, and `Sidebar` hardcodes Branch Account visible routes to `/pos` and `/sales` when `operator.active`; this is not evidence that assigned Employee permissions are being applied. POS surface matrix: `/pos` navigation checks hardcoded `operator.active && href in {"/pos","/sales"}` instead of `pos.sell`; page guard bypasses Branch/Super Admin `/pos` and `/sales`; backend checkout guard is `pos.checkout -> employeePermission pos.sell`, so UI can be visible while API still denies without `pos.sell`. Non-POS comparison: Inventory uses sidebar/page guard `inventory.view` but Branch Account `usePermissions` and backend `requirePermission("inventory.view")` both ignore Employee permissions, so assigned Employee `inventory.view` would remain UI hidden/API denied; Customers uses `customers.view` with the same problem; Treasury uses `treasury.view`/`treasury.register.*` with the same problem. Permission-code consistency findings: catalog contains the major nav codes (`dashboard.view`, `sales.view`, `sales.create`, `pos.view`, `pos.sell`, `customers.view`, `inventory.view`, `gold.view`, `suppliers.view`, `accounting.view`, `treasury.view`, `reports.view`, `employees.permissions.manage`, `users.view`, `approvals.view`, `settings.view`). Mismatches/coverage gaps: sidebar and AuthGuard use `/pos -> sales.create` while backend POS checkout uses `pos.sell` and product search uses `pos.view|pos.sell`; Branch Account sidebar ignores all permission codes and hardcodes only `/pos` and `/sales`; `inventory.transfer` is required by backend transfer routes but is not present in the 128-permission catalog; frontend checks `inventory.manage` in barcode settings but the catalog has no `inventory.manage`; Gold Purchase routes use technical user permissions/fallbacks rather than Employee operator permissions; generic module routes use technical `requirePermission` and are not Employee-aware. Session freshness matrix: permission save changes DB rows and increments `Employee.authorizationVersion` only when sets differ; it does not immediately delete the Branch Account technical session. Existing Employee operator sessions become stale on the next `/operator/current` or protected action because stored session `authorizationVersion` no longer matches Employee `authorizationVersion`; the service revokes the operator session with `authorization_version_changed` and returns `OPERATOR_SESSION_STALE_AUTHORIZATION`. Frontend operator recovery can clear/show reverify state, but it does not hydrate new Employee permissions into `usePermissions` after reverification, and page reload/current-session restoration cannot recover permissions because `/operator/current` omits authorization. UI/API consistency classification from source: POS/Sales shell is UI visible by hardcoded exception and API allowed only for Employee permissions implemented in `sales-operator-policy`; Inventory, Customers, Treasury, Accounting, Reports, Suppliers, Gold Purchase, Employees, and Settings are UI hidden and API denied for Branch Accounts even if the verified Employee has matching direct grants, except for specific Sales/POS operator-policy routes. Root-cause register: RC1 `FRONTEND AUTH STORE BUG` / P1 - Employee authorization payload is returned but never stored or consumed by permission hooks; smallest fix is to type/store operator authorization in OperatorContext, expose an Employee-aware `hasPermission`, refresh it on verify/current/reverify/end-session. RC2 `NAVIGATION PERMISSION MAPPING BUG` / P1 - Branch Account sidebar hardcodes only POS/Sales; smallest fix is to filter Branch Account navigation by verified Employee effective permissions and safe-shell rules. RC3 `PAGE GUARD BUG` / P1 - AuthGuard bypasses only POS/Sales for Branch/Super Admin and otherwise uses technical permissions; smallest fix is Employee-aware route guard for Branch Accounts after verification. RC4 `BACKEND PERMISSION CODE BUG` / P1 - non-Sales/POS backend routes use technical `requirePermission` that always denies Branch Accounts; smallest fix is an Employee-aware backend guard/middleware for allowed Branch Account business modules, preserving Super Admin and legacy behavior. RC5 `POS HARDCODE/FALLBACK BUG` / P2 - POS visibility comes from redirect/hardcoded allow routes, not assigned permissions; fix by aligning POS nav/page guard to Employee `pos.sell`/`pos.view` while keeping verify prompt safe shell. RC6 `UI DESIGN DEFECT` / P3 - Employee permission management is functional but too long: 128 rows render as a large grouped list with search only in Direct Grants/Denials and a separate Effective tab; save action is at the bottom, no summary counts in the header, no module/status filter in Direct Grants/Denials, no collapsible groups, and direct grant/direct denial controls sit on every row. Recommended HF6D scope: no migration expected; implement operator authorization hydration (`authorization.effectivePermissionNames`, role/direct/denial names, version) in types, operator context, repository, and current endpoint; update `usePermissions` to use Employee effective permissions for Branch Accounts while preserving Super Admin and legacy rules; replace Branch Account sidebar hardcoded POS/Sales list with permission-filtered navigation plus safe Employee selection shell; update AuthGuard route checks for Branch Accounts to require verified Employee permissions; add backend Employee-aware permission middleware for Branch Account routes/modules approved for Day-1 and convert representative Customers, Inventory read, Treasury read/register, Accounting read, Reports, Suppliers/Purchases read, Sales/POS/Returns/Exchanges/Installments as needed without changing business logic; keep direct denial and authorizationVersion freshness authoritative; add controlled stale-session/reverification recovery. Permission UI redesign spec for HF6D: add summary header counts for Role, Direct Grants, Direct Denials, Effective; add search by label/code, module filter, source/status filter; split into tabs or sections Role Permissions, Direct Grants, Direct Denials, Effective Permissions; use collapsible module groups with counts; allow select-all/clear only within direct grants/denials; keep role permissions read-only; each row shows localized label, code secondary, source badge, effective/denied state, short description; use sticky save bar with changed-count indicator and direct-denial warning; ensure Arabic/English, no horizontal overflow, keyboard-accessible controls, long label wrapping, and no giant unstructured list. Proposed HF6D verifier/browser QA: create controlled local fixtures after backup, assign role/direct grant/direct denial combinations, verify Branch Account login + Employee Code/PIN, prove Employee permissions hydrate into navigation, prove non-POS modules visible/hidden correctly, prove backend API allowed/denied matches Employee effective permissions and direct denials, prove stale old operator session after permission change, prove reverification receives updated menu/API access, prove POS is no longer merely hardcoded, prove UI redesign usability in Arabic/English desktop/mobile, and cleanup zero fixtures. Proposed HF6E: end-to-end market QA across realistic Branch Account roles (cashier, sales, inventory viewer, treasury cashier, manager) with complete browser flows and representative business commands. NEXT TOOL START HERE: begin HF6D only after owner approval; first rerun git pre-flight, create a local backup before fixtures, then implement the smallest Employee-permission hydration/navigation/backend-guard fixes above. Do not start Phase 35E or production deployment.
>
> **Phase HF6D — Employee Permission Enforcement (implementation in progress):** Starting documentation commit `f81134624c60917f5237e4e15da211742edb28d1`; local Docker PostgreSQL only at `localhost:5433 / darfus_erp`, production/Render untouched, and 11 stashes preserved. The documented HF6D root causes are corrected: a safe Employee authorization summary is returned from `/operator/verify` and `/operator/current`, persisted through `OperatorProvider`, and used by Branch Account navigation/page checks through the central `module-access.ts` mapping. Fixed POS/Sales fallback visibility was removed. `business-permission.middleware.js` applies live verified-Employee, branch, direct-denial, credential-version, and authorization-version checks to business APIs while technical administration remains technical-only. The Employee direct-permission section now has summary counts, search, module/source filters, collapsible groups, a sticky save action, and Arabic/English denial precedence messaging. No migration or permission was added: 44 migrations and 128 permissions remain; the new `scripts/verify-employee-permission-enforcement.js` brings verifier files to 62 and passed both static and local fixture-backed API checks. Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6d_start_20260718_005736.dump` (`488940` bytes), validated with `pg_restore -l` in `darfus-postgres`. Typecheck, lint (18 existing warnings/no errors), build, HF6B catalog wiring, HF5C single-level, Sales/POS enforcement, and customer-credit reconciliation passed. A full 62-verifier run passed through `verify-customer-reconciliation-panel.js` and then stopped at `verify-customer-statement-reconciliation.js` only because its historic read-only-audit dirty-tree guard rejects the authorized HF6D files; this is not a product authorization failure and must be rerun on the final clean tree after the authorized implementation commit. Browser QA was attempted after local services started, but the in-app browser received `ERR_CONNECTION_REFUSED` for localhost while host HTTP succeeded; no browser-success claim is valid until a browser-capable local runner is available. `next-env.d.ts` dev drift was the authorized one-line generated path change and was restored only with `git restore --source=HEAD --worktree -- next-env.d.ts`. No HF6D implementation commit, final backup, or final clean-tree suite has been performed. NEXT TOOL START HERE: resolve browser-capable local QA first; then run browser QA, exact-file staging, the one authorized `fix: enforce employee permissions across branch access` commit, the final clean-tree 62-verifier suite, final backup, and fixture-pollution query. Do not start HF6E or Phase 35E.

> **HF6D-PRE-CLOSE1 — Branch Account Employee Selector Visibility Audit (documentation only):** Audited at `f81134624c60917f5237e4e15da211742edb28d1` on `main`, with the recorded HF6D dirty files preserved, no staged files, 11 untouched stashes, clean `next-env.d.ts`, quiet ports 3000/8000, local Docker PostgreSQL only, and Production/Render untouched. The reported Arabic safe-shell screenshot exactly matches the new `components/auth/auth-guard.tsx` branch at lines 43-55: for a `branch_shell` on any `routeRule.branchBusiness` route while `operator.active` is false, `AuthGuard` returns the centered message before it returns dashboard layout children. `app/[locale]/(dashboard)/layout.tsx` nests `AppShell` inside `AuthGuard`; therefore the early return prevents `components/layout/app-shell.tsx` from mounting `Header`, and prevents `components/layout/header.tsx` from mounting `OperatorBar`. The expected Employee entry point is `OperatorBar`: an always-rendered top-bar status button which opens a positioned panel containing Employee Code, numeric six-digit PIN, and Verify controls (`components/operator/operator-bar.tsx` lines 124-205). It has no `operator.active`, Employee business-permission, technical-permission, locale, viewport, or RTL prerequisite for the inactive button. `OperatorVerifyDialog` is an unused legacy component (defined but not mounted). Git diff proves an HF6D regression: before HF6D, Branch Accounts were redirected from `/dashboard` to `/pos`, and `/pos`/`/sales` were permitted through the former Sales/POS exception, so `AppShell` and the top-bar selector mounted. HF6D intentionally removed that POS fallback but introduced the early safe-shell return without preserving an entry point. Primary classification: `AUTHGUARD RETURNS BEFORE HEADER RENDERS` / `HF6D REGRESSION`; it blocks every first-login, ended, expired, revoked, or stale Branch Account Employee session on all business routes, desktop/mobile and Arabic/English alike. It is not a responsive CSS, RTL, z-index, loading, or backend authorization defect. Runtime DOM proof was not run: no owner-provided Branch Account credentials were supplied, fixture creation is not authorized for this audit, and the prior in-app browser runner cannot connect to `http://localhost:3000`; source and screenshot evidence are conclusive for the render path. Smallest safe correction for the later approved fix: reorder `app/[locale]/(dashboard)/layout.tsx` so `AppShell` renders outside `AuthGuard`, leaving the latter to replace only the page content with the safe shell. This restores the existing persistent `Header` and `OperatorBar` without reintroducing the POS fallback. Recommended option B: add one explicit, keyboard-accessible safe-shell action that opens the same `OperatorBar` verification control, preferably through a narrowly scoped shared open event rather than duplicating Code/PIN state. The action must be mounted without an active Employee or any Employee business permission; after verification, use current effective permissions to navigate to the first allowed business route, with no POS fallback. Expected later product files are `app/[locale]/(dashboard)/layout.tsx`, `components/auth/auth-guard.tsx`, `components/operator/operator-bar.tsx` (or a narrowly extracted shared verification control), the focused HF6D verifier, and only localization if an existing label cannot be reused; no migration, permission, technical login, Super Admin, or business policy changes are expected. Later verifier/browser QA must prove first-login selector visibility, no active-operator/permission dependency, Code plus six-digit PIN, End/Change Employee usability, no POS fallback, Super Admin separation, Arabic/English desktop/mobile accessibility, controlled invalid PIN, post-verify allowed navigation, and no overlay/console errors. No product, verifier, test, config, package, translation, database, fixture, session, or commit change was made by this audit. NEXT TOOL START HERE: wait for owner approval of the evidence-based selector-entry-point correction; do not commit HF6D, start HF6E, or resume HF6D closure before that correction is implemented and QA is rerun.

> **Phase HF6C — Simple Super Admin and Branch Account Center:** Implemented locally from starting HEAD `058193b0604113310a7a59c1b3c4b9fd8af457ca` with clean `main`, 11 stashes untouched, Docker PostgreSQL `localhost:5433 / darfus_erp`, and production/Render untouched. Scope stayed limited to simplifying technical account management; Employee authorization was not redesigned. Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6c_start_20260717_234628.dump` (`488940` bytes), validated. Final backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6c_final_20260718_001142.dump` (`488940` bytes), validated with `pg_restore -l` in the local `darfus-postgres` container. `/settings/users` is now a focused Account Center with Super Admin security/profile controls, explicit self email/password change, Branch Account list/create/edit, fixed-branch reassignment, password reset/set, activate/deactivate, unlock, and session revocation controls. The embedded technical role/permission editor is removed from Day-1 Account Center UI. Employee Code, six-digit PIN, role templates, direct grants, direct denials, effective permissions, operator sessions, and credential controls remain under Employee detail. Backend System Account create/reset now requires an explicit replacement password and returns only `passwordSet: true`; no generated or plaintext temporary password is returned. Branch Account branch reassignment validates same-company active branches, enforces one Branch Account per branch, audits the change, and bumps session version. Self Super Admin email change requires current password confirmation. No migration or permission was added; counts are 44 migrations, 128 permissions, and 61 verifier files. New focused verifier `scripts/verify-simple-account-center.js` prints `SIMPLE ACCOUNT CENTER PASSED`. Targeted regressions passed for HF5C, HF6A, HF6B, Super Admin/Branch Shell recovery, simple Super Admin, simple Branch Account, Employee management UI contracts, Sales/POS operator enforcement, Phase 35B containment, and Phase 35D accounting/treasury. Typecheck passed; lint passed with existing 18 warnings and no errors; build passed; `next-env.d.ts` stayed clean. Browser QA passed with isolated `HF6C-BQA-*` fixtures: Super Admin login, English Account Center desktop, Branch Account UI create, API-proven email/password/branch edit with old credentials rejected and old session invalidated, Employee detail still loading 128 assignable permissions, Arabic RTL Account Center, mobile Account Center smoke, no runtime overlay, no console/page errors, and zero fixture rows after cleanup. Documentation added in `docs/employee-authorization/PHASE-HF6C-SIMPLE-ACCOUNT-CENTER.md`. Deferred: HF6D end-to-end Branch login/access QA, Phase 35E Inventory and Purchase Market MVP, advanced Account Center role-builder decisions, MFA/SSO/IdP, Employee email/password login, grouped permissions, payroll/attendance redesign, and production deployment. NEXT TOOL START HERE: after the HF6C commit, confirm clean tree, 11 stashes, ports 3000/8000 quiet, and do not start HF6D or Phase 35E without owner approval.
>
> **Phase HF6C — Pre-Implementation Account Center Inventory:** Started from clean `main` at `058193b0604113310a7a59c1b3c4b9fd8af457ca` with 11 stashes untouched. Required inventory completed before product edits. Current `/settings/users` mixes Day-1 technical account management with broad role/permission editing. KEEP/SIMPLIFY: Super Admin technical account cards, Branch Account list/create/edit actions, account status, active technical-session count, unlock, activate/deactivate, revoke sessions, current-account security, and readiness badges. SIMPLIFY: replace prompt-driven email/password actions with explicit forms, keep one compact Branch Account create/edit flow, require entered replacement passwords instead of generated/returned temporary passwords, and allow authorized Super Admin branch reassignment for Branch Accounts with session invalidation. MOVE TO EMPLOYEES: Employee Code, six-digit PIN, Employee role templates, direct grants, direct denials, effective permissions, operator sessions, and Employee credential controls remain under Employee detail. HIDE FROM DAY-1 NAVIGATION: the technical role/permission editor embedded in `/settings/users`; backend `/roles`, `/permissions`, and `/roles/:id/permissions` remain available for internal compatibility and existing verifiers unless a later HF6C check proves a safe redirect is necessary. KEEP BACKEND SECURITY: `/system-accounts`, `/system-accounts/branch-accounts`, `/system-accounts/:id/change-email`, `/reset-password`, `/activate`, `/deactivate`, `/unlock`, `/revoke-sessions`, `/readiness`; Super Admin-only scope and final Super Admin safeguards remain. DEFER: full Account Center redesign, role-builder redesign, grouped permissions, MFA/SSO/IdP, Employee email/password login, and any Employee authorization redesign. OWNER DECISION REQUIRED later: whether to expose any technical role builder in a separate advanced admin route after HF6C. NEXT TOOL START HERE: if interrupted during HF6C, reread this inventory, confirm clean/expected HF6C tree, and keep Employee operational permissions out of Account Center.
>
> **Phase HF6B — Employee Permission Catalog Wiring:** Implemented locally from starting HEAD `51d22d14c52905e1c7887231eb38763343d2d278` (`51d22d1 feat: require employee credential setup`) with 11 stashes untouched and production/Render untouched. Scope stayed limited to wiring Employee permission management to the central `permissions` catalog; Account Center redesign, Employee email/password login, grouped permissions, role-builder redesign, payroll/attendance, production, HF6C, HF6D, and Phase 35E remain deferred. Root cause from Phase 35D-PRE1 was confirmed: the Employee detail Direct Permissions UI built assignable options from current grants/denials/effective rows, so an Employee with no permission rows could show zero choices despite 128 catalog permissions. Backend `GET/PUT /employees/:id/permissions` now returns separate `assignableCatalog`, `rolePermissions`, `directGrants`, `directDenials`, `effectivePermissions`, `effectiveSources`, and `authorizationVersion`; the catalog source is the existing central `permissions` table in stable module/action/name order. Effective access remains `(role permissions union direct grants) minus direct denials`; direct denial wins over role and direct grant. Authorization changes continue through the existing service path, increment `authorizationVersion`, stale/revoke active Employee operator sessions, and preserve the Branch Account technical session. Browser diagnosis also proved the temporary `Employee Not Found` QA failure was browser-scope CORS configuration, not missing Employee data: direct API probes succeeded, while browser requests from `http://127.0.0.1:3000` failed with `net::ERR_FAILED` because local runtime CORS allowed `http://localhost:3000`; QA was run with both local origins allowed at runtime and no product CORS source or `.env` file was changed. Browser QA passed Employee detail render, full catalog render, direct grant, direct denial, effective permission explanation, stale/reverify behavior, Branch Account session preservation, English LTR, Arabic RTL, mobile/narrow viewport, and no runtime overlay. Counts are 44 migrations, 128 permissions, and 60 verifier files with new `scripts/verify-employee-permission-catalog-wiring.js` printing `EMPLOYEE PERMISSION CATALOG WIRING PASSED`. Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6b_start_20260717_165258.dump` (`488940` bytes), validated. Final backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6b_final_20260717_190858.dump` (`488940` bytes), validated. Targeted HF6B/HF5C/HF6A/authorization/Sales/POS/Phase 35B/Phase 35D regressions passed; typecheck passed; lint passed with existing 18 warnings and no errors; build passed; `git diff --check` passed; `next-env.d.ts` is clean. Clean-tree full-suite verification found one stale static assertion in `scripts/verify-super-admin-branch-shell-recovery.js` that expected the removed `Permission count` UI string; it was updated to assert the HF6B `assignableCatalog` / `effectiveSources` / direct-denial override contract instead. HF6B fixture namespace cleanup returned zero rows across companies, branches, users, Employees, credentials, branch access, roles, role permissions, grants, denials, technical sessions, and operator sessions. Temporary browser QA helper was removed after QA passed. Final closure commits and exact final HEAD are recorded in the final response.
>
> **Phase HF6A — Employee Creation and Credential Setup Readiness:** Implemented locally from HF6A starting HEAD `343036f73cc794fca0a09488dc1c9fa6319930f9` (`343036f docs: record employee access audit`) with 11 stashes untouched and production/Render untouched. Scope stayed limited to requiring Employee Code plus a six-digit Employee PIN at active Employee creation, preserving inactive-without-PIN compatibility while blocking activation until a configured credential exists, and keeping Branch Account -> Employee Code + PIN operator verification unchanged. No migration and no permission were added; counts remain 44 migrations, 128 permissions, and verifier inventory is now 59 with new `scripts/verify-employee-credential-setup-readiness.js` printing `EMPLOYEE CREDENTIAL SETUP READINESS PASSED`. Start backup before write-capable fixtures: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6a_start_20260717_155607.dump` (`488940` bytes). Final local backup after browser QA and cleanup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6a_final_20260717_162948.dump` (`488940` bytes). Browser QA passed Super Admin Employee create with Code/PIN/confirmation validation, no PIN display after submit, existing Employee Set PIN, reset-required Employee Reset PIN, unauthorized reset controlled 403, Arabic RTL, mobile no horizontal overflow, Branch Account Employee verification/end-session/full-logout separation, and no runtime overlay/pageerror/unexpected console error; all temporary `HF6A-BQA-*` fixtures were cleaned. Typecheck passed; lint passed with the existing 18 warnings and no errors; build passed; `next-env.d.ts` did not drift. A dirty-tree full-suite attempt stopped on the expected `verify-barcode-tag-print-layouts.js` scope guard before the implementation commit; rerun the complete 59-verifier suite after the clean implementation commit. Deferred: HF6B Employee Permission Catalog Wiring, HF6C Account Center simplification, HF6D broader end-to-end access QA, Employee email/password login, payroll/attendance, production, and broader account redesign.
>
> **Phase 35D — Accounting and Treasury Launch Minimum:** Implemented and locally verified from clean `main` at `0d3bc0bc99ccb4e1aedf0192dfc78b12096152bf` (`0d3bc0b docs: map client requirements to market mvp`) with 11 stashes untouched. Scope stayed limited to Phase 35C IDs `CR-ACC-004`, `CR-ACC-005`, `CR-ACC-006`, `CR-ACC-011`, `CR-TREAS-004`, `CR-TREAS-005`, `CR-REP-001`, and blockers `LB-35C-001`, `LB-35C-002`, `LB-35C-003`, `LB-35C-006`. Start backup before DB writes: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase35d_start_20260717_144709.dump` (`481174` bytes). Final local backup after verification: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase35d_final_20260717_152429.dump` (`488940` bytes). Migration `20260717010000-accounting-treasury-launch-minimum.js` adds `accounting_locks`, `cash_register_sessions`, one-open-register uniqueness, and five narrow permissions: `treasury.register.view`, `treasury.register.open`, `treasury.register.close`, `accounting.lock.manage`, `accounting.reconciliation.view`; counts are now 44 migrations and 128 permissions. Backend now calculates launch-critical account/treasury balances from posted journal lines, blocks direct `Account.balance` mutation, enforces accounting locked-through dates in posting/manual journals, requires an open branch cash register for cash-affecting treasury mutations, computes register expected cash server-side, requires a variance reason on non-zero close variance, and disables Gift Voucher issue/redeem writes with `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` while keeping reads. UI adds accounting date-lock/balance-truth controls, treasury register open/current/close/history, and Gift Voucher disabled messaging. New verifier `scripts/verify-accounting-treasury-launch-minimum.js` passes with `ACCOUNTING TREASURY LAUNCH MINIMUM PASSED`; it uses rollback-scoped fixtures and verifies cleanup. Browser QA passed local Super Admin login, English Treasury register open/close, Accounting reconciliation date-lock/balance-truth, Gift Voucher disabled controls, Arabic RTL Treasury, and mobile-width Arabic Treasury with no runtime overlay; browser-created register row was cleaned. Typecheck/lint/build/diff-check and targeted regressions passed. Deferred: Gift Voucher liability, Customer Gold Purchase final settlement/gold liability, VAT/UAE e-invoicing, purchase lifecycle, inventory/warehouse MVP, payroll, full fiscal close/report catalog, production, and integrations.
>
> **Phase 35D-PRE1 — Employee Access, Permissions and Account Center Verification Audit:** Documentation-only audit completed from clean `main` at `6c44ef6ed5d60d2e0e778df667a07aee9bae4837` (`6c44ef6 feat: add accounting and treasury launch minimum`) with 11 stashes untouched. No implementation, commit, tests, verifiers, build/dev server, browser login, write API, session creation, Employee verification, PIN reset, migration, fixture, or DB mutation was performed; SELECT-only DB inspection targeted Docker PostgreSQL `localhost:5433 / darfus_erp`, and production was untouched. Employee creation currently requires Employee Code in UI and API, normalizes/uniquely scopes it by company, and blocks generic code edits; DB columns remain nullable for compatibility. PIN is not configured at Employee create time; admin reset/self-change paths enforce exactly six digits and store bcrypt hashes only. Current local data shows 7 Employees, 0 missing Employee Codes, 6 Employees without PIN credentials, 1 reset-required credential, 0 active operator sessions, 3 Branch Accounts, 1 Super Admin, 0 active Employee role assignments, 0 direct Employee grants, 0 direct Employee denials, and 128 permission catalog entries. Employee permissions resolve correctly as role plus direct grants minus direct denials, but the Employee detail Direct Permissions UI is fed only by current employee grants/denials/effective names from `/employees/:id/permissions`; it does not load the full permission catalog, so employees with no current permission rows show zero assignable choices even though the System Accounts role editor fetches `/permissions`. Account Center has working Super Admin/Branch Account technical controls, but remains crowded by technical role/permission editing and should be simplified for Day-1 operations. Stale `Level 2` naming remains in `requireSensitiveAdminLevel2` and sensitivity labels, but the inspected implementation requires Super Admin technical scope rather than Employee Level/step-up. Recommended next implementation scope: HF6A create Employee + credential/setup readiness, HF6B wire the full permission catalog into Employee permission management, HF6C simplify Account Center into clear Super Admin/Branch Account controls, and HF6D run branch-login-to-employee-access browser QA. Do not start Phase 35E or Phase 35D implementation from this audit without owner approval.
>
> **Phase 35C — Client Requirements Coverage Verification and Simple Market MVP Scope Lock:** Documentation-only coverage report completed from starting HEAD `4e47f4c3b1d700d7f39d39876f890fbe58985703`. Created `docs/client-requirements/PHASE-35C-CLIENT-REQUIREMENTS-COVERAGE.md` and updated this handoff only; no implementation, tests, verifiers, browser QA, migrations, seeds, fixtures, write APIs, DB writes, production access, or original client-requirement edits were performed. Source inventory verified `H:\WORK\client-requirements` contains 31 files including nested `client-requirements.zip`; excluding the ZIP there are 30 business source files, 28 unique by SHA-256 after two duplicate JPEG pairs, and 0 unreadable files. The nested ZIP contains 30 entries and matches the folder source by filename and SHA-256, so no client source conflict was found. Normalized coverage uses 219 raw extracted requirement candidates, 94 duplicate/inherited candidates, and 125 unique normalized requirements. Coverage totals: 35 implemented and verified, 15 implemented/manual QA, 10 implemented differently with business intent satisfied, 25 partial, 5 unsafe, 8 implemented not verified, 4 frontend only, 6 backend only, 4 DB foundation only, 5 not implemented, 3 approved deferred, 3 owner decision, and 2 accountant sign-off. Proposed launch classification is **CONDITIONAL**: preserve verified Sales/POS/Return/Exchange/Installment/Reservation/operator/access/barcode foundations, but resolve or explicitly disable the M0/M1 blockers around account-balance repair, fiscal period/VAT sign-off, treasury cashbox/register controls, inventory valuation/warehouse limits, purchase lifecycle reversals, gift voucher liability, and full launch browser QA. Deferred: HF/product work outside the proposed MVP, payroll, advanced CRM/loyalty/communications, offline, integrations, executive BI, full report catalog, and unapproved item subtypes. NEXT TOOL START HERE: read `docs/client-requirements/PHASE-35C-CLIENT-REQUIREMENTS-COVERAGE.md`, confirm `git status --short`, `git rev-parse HEAD`, and `git stash list`, then wait for owner approval of the proposed MVP scope before starting any implementation.
>
> **Phase 34.5A-HF5C — Single-Level Employee Operator & Simple PIN:** Implemented locally from starting HEAD `bf2b4ed46d2fd093bd1f0ec519ef6099a53cea9b`. HF5C keeps Level columns for compatibility but removes active Level 1/Level 2, step-up, elevated-session, and `OPERATOR_STEP_UP_REQUIRED` behavior. Branch Accounts still log in with email/password, then verify one Employee once with Employee Code + exactly six numeric PIN digits. Valid verification creates a single `verified` Employee operator session; normal Sales/POS/Return/Exchange/Installment commands require verified Employee + permission + branch access + current credential/authorization versions, with no repeated PIN. Super Admin remains email/password-only and outside Employee/PIN/Level requirements. Employee PIN failures now return generic invalid Code/PIN, audit the failure, use only a short bounded delay, and never auto-lock credentials; technical email/password lockout is unchanged. Employee inactivity is 30 minutes; `/operator/current` and passive polling do not refresh activity, while meaningful protected actions do. Change Employee and End Employee Session revoke only the Employee session and preserve Branch Account login; full logout still clears both. Migration count remains 43, permissions remain 123, verifier count is now 56 with `scripts/verify-single-level-employee-operator.js` printing `SINGLE LEVEL EMPLOYEE OPERATOR PASSED`. Local backup before HF5C runtime fixtures: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf5c_20260717_062043.dump` (`476066` bytes). HF5D-HF5I and Phase 34.5B2A/B/C remain deferred.
>
> **Phase 34.5A-HF5B — Simple Fixed Branch Accounts:** Verified closed from starting HEAD `c0a5b19cad64451e4b3276c6d0bbed6611852a07`. HF5B keeps internal `accountType = branch_shell` but exposes `Branch Account` / `حساب الفرع` terminology. Migration `20260715010000-simple-fixed-branch-accounts.js` adds `users.is_active` and unique index `users_branch_shell_one_per_branch_uq` so each non-deleted Branch Account is fixed to at most one branch and inactive non-deleted accounts still block duplicates. Super Admin creates Branch Accounts through `/system-accounts/branch-accounts` with only branch, login email, temporary password, and active status supplied by the owner; company/role/account type/default Employee are server-derived or blocked. Branch Account login and middleware enforce fixed company/branch scope with stable HF5B errors, and technical logout/security changes revoke bound Employee operator sessions. The operator header supports Change Employee and End Employee Session via `/operator/end-session`. Browser QA covered Super Admin login, Branch Account UI creation, duplicate branch rejection, fixed Branch Account POS scope, locked branch display, hidden broader navigation, and Arabic RTL POS smoke. Clean-tree full verifier suite passed `55/55`; counts are 43 migrations, 123 permissions, and 55 verifier files. Local backup before migration: `backend/backups/darfus_erp_phase34_5a_hf5b_2026-07-15T19-25-50-061Z.dump` (`478237` bytes). HF5C-HF5I and Phase 34.5B2A/B/C remain deferred.
>
> **Phase 34.5A-HF5A — Super Admin & Simple Login Stabilization:** Implemented locally from HEAD `d5b87d2b1ba30f690d9c67c854f9eaf01a38f66e`. This is the first simplified market-ready access-model hotfix. `USR-ADMIN` / `admin@admin.com` was bootstrapped as the first local `super_admin` with ID/email/password hash/role preserved, `sessionVersion` incremented to 2, and 9 active owner technical sessions revoked. Super Admin now logs in with email/password only and does not require Employee Code, PIN, Level 1, Level 2, or operator step-up for System Accounts governance or current Sales/POS/Return/Exchange/Installment command gates. Super Admin business actor attribution keeps `technicalUserId` and permits `employeeId = null` / `operatorSessionId = null`; no synthetic Employee was created. Branch Shell remains fixed-branch and Employee-first; Legacy behavior remains compatible. `X-Company-ID`/`X-Branch-ID` scope is hardened so Legacy/Branch Shell cannot widen scope and Super Admin selections are server-validated. Counts remain 42 migrations and 123 permissions; verifier inventory is now 54 with `scripts/verify-simple-super-admin-access.js` printing `SIMPLE SUPER ADMIN ACCESS PASSED`. Local backup before mutation: `backend/backups/darfus_erp_phase34_5a_hf5a_20260715_195517.dump` (`471727` bytes). HF5B/HF5C/HF5D, Phase 34.5B2A/B/C, Phase 34.6, Phase 34.7, Phase 33D, and Phase 33C-HF2 remain deferred.
>
> **Phase 34.5B Core — Returns, Exchanges and Installment Collection Employee-First Enforcement:** Implemented in the current working tree from HEAD `8e8d6f8486af8cf17f636b6a5705089185b65655` and pending final closure commit. Scope is limited to Sales Returns, Sales Exchanges, standalone Installment Collection, and invoice-backed print/reprint enforcement. Added exactly three permissions: `sales.returns.execute`, `sales.exchanges.execute`, `sales.installments.collect`; expected permission count is 123, migration count remains 42, POS permissions remain 3 and Gold Purchase permissions remain 24. Backend routes reuse the centralized account-type-aware Sales/POS command gate: Branch Shell has no direct operational User permission, Super Admin has no operational bypass, and legacy technical behavior is preserved. Return/exchange invoices reuse `createdByEmployeeId` and `finalizedByEmployeeId`; installment payments populate `Payment.receivedByEmployeeId`. Idempotency hashes include server-side operator actor consistency. New verifier `scripts/verify-sales-adjustment-operator-enforcement.js` brings expected verifier inventory to 53 and prints `SALES ADJUSTMENT OPERATOR ENFORCEMENT PASSED`. Local DB backup before live verification: `backend/backups/darfus_erp_phase34_5b_core_20260715_175406.dump` (`467855` bytes). Deferred: finalized cancel/void, generic refunds/reversals, gift vouchers, customer credit deposit/refund/application, non-invoice receipt persistence, Gold Purchase integration, broad Treasury/Accounting/Inventory conversion, production SMTP/OTP/TOTP/break-glass, Phase 33D and Phase 33C-HF2.
>
> **Phase 34.5A — Super Admin, Branch Shell Accounts, Employee-First Authorization & Recovery:** Additive core implementation started on HEAD `5c0c9cdb219c8d142d9b77b5263fb93996ea1be0`. Adds account types `legacy`, `super_admin`, `branch_shell`; persisted hashed technical refresh sessions; password reset-token foundation; local/dev recovery delivery only; final Super Admin safeguards; Branch Shell fixed-branch technical scope; System Accounts APIs/UI; Employee Code history; PIN self-change/reset/unlock/session-revocation paths; six system-account permissions; and verifier `scripts/verify-super-admin-branch-shell-recovery.js`. Existing users remain `legacy`; `USR-ADMIN` is not auto-converted. Production SMTP, OTP, TOTP, backup codes, SMS, break-glass, service accounts, Phase 34.5B, Phase 33D, and Phase 33C-HF2 remain deferred.
>
> **Phase 34.5 — Sales/POS Operator Enforcement Pilot:** Implemented controlled Sales/POS operator enforcement over the closed Phase 34.2/34.3/34.4 foundations. Current baseline before this phase was HEAD `65f38a784852c382503663191759d5abb92a133c`, 40 applied migrations, 50 verifier files, 111 permission rows, and 24 Gold Purchase permissions. Migration `20260714050000-sales-pos-operator-enforcement.js` adds nullable Employee attribution on invoices/payments plus `invoice_print_events`; migration count is now 41. Added POS permissions `pos.view`, `pos.sell`, `pos.discount.approve`; permission count is now 114 while Gold Purchase remains 24. `salesOperatorMode` is resolved through existing settings storage with company default, branch override and fallback `legacy_users`. Shared mode gates true sales draft create/edit/cancel with Level 1 and gates draft post, POS checkout, legacy immediate-post, discount override, official print and reprint with fresh Level 2. Generic Invoice mutation bypasses now return `GENERIC_INVOICE_MUTATION_FORBIDDEN`; generic read/list remains compatible. Frontend operator failures dispatch recovery to the existing Operator Bar without auto-retry. Upgraded verifier `scripts/verify-sales-pos-operator-enforcement.js` now runs real local Express HTTP and proves shared/legacy mode behavior, exact denials, Level 1/Level 2 enforcement, Employee invoice/payment/print attribution, discount override, generic CRUD closure, failure atomicity, and zero namespace pollution. Local browser QA covered API login, shared POS rendering, operator-required denial, Level 2 employee-attributed checkout, legacy POS checkout, and Arabic RTL smoke with zero namespace pollution. Typecheck/lint/build/diff-check pass. **Status: READY FOR CLOSURE COMMIT AND CLEAN-TREE 51/51 VERIFIER SUITE.** Do not start Phase 34.5B, Phase 33D, or Phase 33C-HF2.
>
> **Phase 33C-HF1 — Controlled Self-Review Closure:** Added the CGP/IGP `self_approve` keys (24 Gold Purchase permissions total). `Role.isAdmin` is the canonical trusted path; missing override is exact `403 SELF_APPROVAL_FORBIDDEN`; authorized self review is explicit, reason-required and audited. Migration `20260714020000-gold-purchase-self-approval-permissions.js` was applied once. The zero-byte initial HF1 dump remains incident evidence; valid pre-HF1 backup is `backend/backups/darfus_erp_phase33c_20260714-004524.dump`; valid post-migration backup SHA-256 is `953CC2E5B5CD48AAD95AFA0F1A35E3430603DA3587B85FAE2BC5CA744D9AFC0B`. Verifier commit `3e54fdd` adds direct, namespace-scoped `0/0/0` before/after/final evidence for supplier payments, customer settlements/payments, Treasury, Gold Center, and accounting posting links; the complete 16-row matrix, 47/47 suite, and gated live verifier pass. No rollback/rerun. MANUAL UI QA REQUIRED. Do not start Phase 33D.
>
> **Project Identity & Safeties:**
> - Repository: [jewellery-erp-master](file:///H:/WORK/jewellery-erp-master)
> - Branch: `main`
> - Current Implementation Commit: Phase 34.5B Core working tree pending final closure commit
> - Original Client Requirements: Located at [client-requirements](file:///H:/WORK/client-requirements)
> - Phase Status: **Phase 34.5B Core — IMPLEMENTED, VERIFICATION/CLOSURE IN PROGRESS**
> - Approved Decisions: AD-002, AD-003, CD-026 to CD-030, SD-008, PC-001 to PC-004, Phase 34.4 locked owner decisions, Phase 34.5 locked Sales/POS pilot decisions
> - Migration State: 41 migrations applied locally; Phase 34.5 additive migration verified
> - Verification State: 53 verifier files expected after Phase 34.5B Core. Targeted Phase 34.5B verifier and full 53-file suite are required for closure; browser QA is required before verified closure.
> - Remaining Limitations: Phase 34.5B2 broader business surfaces are deferred.
> - Recommended Next Phase: Complete Phase 34.5B Core closure only. Do not start Phase 34.5B2, Phase 34.6, Phase 34.7, Phase 33D, Phase 33C-HF2, or broader business-flow employee authorization integration without a new owner-approved phase.
> - Exact Next-Tool Start Instructions: Verify git safety status and read this handoff file.

NEXT TOOL START HERE: if interrupted before the HF6B closure commit, rerun `git status --short`, confirm only HF6B files are dirty, confirm `git diff -- next-env.d.ts` is empty, rerun the focused HF6B verifier if needed, then create the single authorized commit `fix: wire employee permission catalog`. Do not start HF6C or Phase 35E automatically.

---

## Phase 35B — Market Launch Safety Containment

Starting checkpoint:
- Phase name: `PHASE 35B — MARKET LAUNCH SAFETY CONTAINMENT`.
- Starting HEAD after Phase 35A docs commit: `df7e25f0e3f17d83daada8ccb25cc70beb6ac58e`.
- Branch: `main`.
- Clean-tree state before Phase 35B implementation: `git status --short` returned no output.
- Stash count: 11, untouched.
- Local DB target if runtime verification/fixtures are required: Docker PostgreSQL `localhost:5433 / darfus_erp`.
- Production/Render/remote databases: untouched.
- Backup state: not yet required at phase start because no Phase 35B DB writes or runtime fixtures have been performed.
- Exact scope: four workstreams only: payroll/attendance permission guard closure; treasury input validation containment; generic inventory and purchase mutation containment; branch and report scope hardening.
- Exact exclusions: no complete payroll, attendance-to-payroll calculation, payroll accounting/treasury payment, cashbox/register/shift/opening/closing, treasury reconciliation redesign, Account.balance repair, fiscal periods, period close/lock, VAT filing, purchase returns/debit notes, supplier payable redesign, new purchase lifecycle, inventory valuation redesign, warehouse transfer/stock count workflow, new accounting reports, UI/navigation redesign, production deployment, dependency upgrades, or unrelated refactors.
- Implementation files changed: `backend/src/routes/erp.routes.js`, `app/[locale]/(dashboard)/accounting/treasury/page.tsx`, `hooks/use-treasury.ts`, `messages/en.json`, `messages/ar.json`, `package.json`, `scripts/verify-market-launch-safety-containment.js`, stale verifier allow-list updates for the existing reconciliation/exchange/statement guards, `scripts/verify-simple-branch-account-access.js`, `scripts/verify-simple-super-admin-access.js`, `scripts/verify-single-level-employee-operator.js`, and this handoff file.
- Workstream A, payroll/attendance permission guards: `/attendance` and `/payslips` now require `payroll.view`; `/attendance/check-in`, `/attendance/check-out`, `/payroll/generate`, and `/payslips/:id/pay` now require `payroll.manage`. Employee session read/revoke routes are guarded with `employees.verification.view` and `employees.credentials.manage`. No payroll calculation, approval, treasury payment, payslip redesign, or attendance-to-payroll workflow was added.
- Workstream B, treasury validation containment: manual treasury transaction creation now requires explicit `type`, explicit `account` (`cash` or `bank`), active treasury GL account validation for `1110`/`1120`, explicit validated `counterAccountCode` for manual `cash_in`/`cash_out`, rejection when the counter account is a treasury account, validated `toAccount` for transfers, same-account transfer denial, valid `YYYY-MM-DD` date when supplied, and active authorized branch validation. Treasury transactions, summary, closings, and closing list now validate branch query/header scope. Supplier PO payment now rejects unknown treasury account keys instead of silently falling back. Treasury UI now exposes Counter Account Code for manual cash in/out and shows localized controlled validation before submit; browser QA found and fixed the native `required` interception so expected validation does not become a browser-native prompt.
- Workstream C, generic inventory/purchase mutation containment: generic create/update/patch/deactivate/reactivate/delete are blocked with stable errors for `assets`, `products`, `stock-movements`, `transfers`, `purchase-orders`, and `cash-transactions`; generic list/detail remain wired. Dedicated lifecycle routes such as purchase receive/pay, inventory transfer, Sales/POS, returns, exchanges, installments, reservations, and Gold Purchase were not redesigned.
- Workstream D, branch/report scope hardening: added shared branch scope validation so selected branches must be active and in the authenticated company; fixed-branch users cannot widen scope. Applied to treasury reads, ledger reports, inventory valuation, tax/financial/profit summaries, and related branch filters. Supplier purchase/document/consignment reads now validate tenant supplier ownership and use existing supplier permissions.
- Stable error contracts added: `GENERIC_INVENTORY_MUTATION_FORBIDDEN`, `GENERIC_STOCK_MOVEMENT_MUTATION_FORBIDDEN`, `GENERIC_TRANSFER_MUTATION_FORBIDDEN`, `GENERIC_PURCHASE_MUTATION_FORBIDDEN`, `GENERIC_TREASURY_MUTATION_FORBIDDEN`, `BRANCH_SCOPE_FORBIDDEN`, and `BRANCH_SCOPE_INVALID`.
- Verification: targeted `node scripts/verify-market-launch-safety-containment.js` passed with marker `MARKET LAUNCH SAFETY CONTAINMENT PASSED`; final full verifier suite passed `57/57`; `node --check` passed for changed backend/verifier JS files; `npm run typecheck` passed; `npm run lint` passed with 18 existing warnings and no new Phase 35B warnings; `npm run build` passed; `git diff --check` passed. `next-env.d.ts` had no post-build drift.
- Counts: migrations remain 43; permissions remain 123 by SELECT-only local Docker DB query; verifier files are now 57.
- Backup and DB evidence: final local Docker backup after the last live verifier suite is `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase35b_final_20260717_125347.dump` (`484493` bytes). Earlier intermediate backups were `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase35b_final_20260717_122707.dump` (`478257` bytes) and `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase35b_20260717_122402.dump` (`478257` bytes). Fixture cleanup queries for `t345a` and `35b` user/employee/operator/technical-session namespaces returned zero rows after verification.
- Browser QA: local browser QA passed with Super Admin login, dashboard open, Treasury English LTR render, Cash In modal showing Counter Account Code, missing counter-account controlled error `Counter account code is required`, Arabic RTL Treasury render, Arabic controlled error `كود الحساب المقابل مطلوب`, mobile-width Arabic Treasury smoke with no horizontal overflow, no Next.js runtime overlay, no console errors on tested paths, and logout cleanup of the browser QA session.
- Production/Render/remote databases: untouched. Local database target used only through Docker PostgreSQL `localhost:5433 / darfus_erp`.
- Unresolved/deferred scope: complete payroll process, treasury cashbox/register/shift MVP, Account.balance repair, fiscal periods/VAT filing, purchase lifecycle/returns/debit notes/reversal, inventory valuation/warehouse governance, and all Phase 35C+ work remain deferred.
- Current progress: Phase 35B implementation, verification, and browser QA complete; closure commit is next.
- Exact next action: stage the Phase 35B files and commit `fix: contain unsafe market launch workflows`, then rerun final clean-tree safety checks and stop local repo services so ports 3000/8000 are quiet.
- NEXT TOOL START HERE: if interrupted before commit, rerun `git status --short`, confirm only the Phase 35B files above are dirty, then commit the implementation with the approved message.

---

## Phase 35A — Core Business Market-Readiness Audit

Starting checkpoint:
- Starting HEAD: `05bf51f9c870fc8f5cdc37f458ce1f19ad09ebd3`.
- Branch: `main`.
- Clean-tree confirmation before audit: `git status --short` returned no output.
- Stash count: 11, untouched.
- Production untouched; audit limited to local Docker PostgreSQL `localhost:5433 / darfus_erp`.
- Classification: `PHASE 35A AUDIT ONLY — NO IMPLEMENTATION AUTHORIZED`.
- Authorized write exception: additive documentation in `docs/AI_HANDOFF.md` only.
- Generated-file safety note: `next-env.d.ts` had previously drifted from `import "./.next/types/routes.d.ts";` to `import "./.next/dev/types/routes.d.ts";` and was restored under owner authorization before Phase 35A began.
- Audit scope: inventory/warehouses, purchases/suppliers, sales/POS/invoices/returns/exchanges/installments, treasury, accounting/reconciliation, employees/payroll, UI readiness, and cross-module launch risk.
- Deferred scope: implementation, migrations, permission changes, fixtures, browser QA execution, package scripts, verifiers, DB mutations, production access, commits, and any business/accounting redesign.

### Phase 35A Checkpoint 1 — Inventory and Warehouses

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: branches/warehouses/storage locations; product/asset models; serialized jewellery assets; bullion/unique item foundations; opening stock; purchase receipt linkage; sales/return/exchange movements; reservations; transfers; stock adjustments; stock counts; asset statuses; stock movement linkage; barcode uniqueness; duplicate sale/negative stock/concurrency controls; valuation/COGS; reconciliation; permissions; branch isolation; audit trail.
- Frontend files inspected: `app/[locale]/(dashboard)/inventory/page.tsx`, `app/[locale]/(dashboard)/inventory/adjustments/page.tsx`, `app/[locale]/(dashboard)/inventory/transfers/page.tsx`, `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`, `app/[locale]/(dashboard)/reports/inventory-valuation/page.tsx`, `hooks/use-core-erp-data.ts`, `lib/repositories/api-impl.ts`.
- Backend files inspected: `backend/src/routes/erp.routes.js`, `backend/src/models/asset.model.js`, `backend/src/models/product.model.js`, `backend/src/models/stockMovement.model.js`, `backend/src/models/stockAudit.model.js`, `backend/src/models/stockAuditItem.model.js`, `backend/src/models/transfer.model.js`, migrations `20260710000000-barcode-inventory-foundation.js`, `20260711021000-stock-movement-asset-reference.js`, `20260618030000-create-stock-audits.js`, `20260619050000-add-asset-statuses.js`.
- API routes inspected: generic `setupCrud("assets")`, `setupCrud("products")`, `setupCrud("stock-movements")`, `setupCrud("transfers")`; custom `/stock-audits`, `/stock-audits/:id/items`, `/stock-audits/:id/complete`, `/transfers`, `/transfers/:id`, `/inventory/products`, `/products/:id/movements`, `/reports/inventory-valuation`.
- Middleware and permissions inspected: `authMiddleware`, `guardFor`, `requirePermission`, `requireAnyPermission`; inventory permission keys `inventory.view`, `inventory.create`, `inventory.update`, `inventory.delete`, `inventory.adjust`, `inventory.export`, `inventory.print`, `inventory.transfer`.
- Services inspected: route-local stock audit/transfer logic, `auditService`, `notificationService`, `barcodeIdentityService`, `postingService` references from sale/purchase paths.
- Models/tables inspected: `assets`, `products`, `stock_movements`, `stock_audits`, `stock_audit_items`, `transfers`, `branches`, barcode settings/sequence tables.
- SELECT-only database evidence used: Docker container `darfus-postgres` on port 5433; DB migration count 43 via `SequelizeMeta`; permission count 123; row counts `assets=20`, `products=1`, `stock_movements=9`, `stock_audits=0`, `stock_audit_items=0`, `transfers=2`; no public table matching `%warehouse%`; `assets` indexes include `assets_barcode_components_uq`, `assets_company_barcode_uq`, `assets_company_rfid_uq`; `stock_movements` has nullable `asset_id` and `warehouse_id`.
- Verifier files inspected: `scripts/verify-barcode-inventory-foundation.js`, `scripts/verify-inventory-item-type-forms.js`, historical inventory pagination verifier names only; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`, `docker ps`, SELECT-only `psql`, and git pre-flight. No package script, verifier, API write, fixture, migration, or browser command was run.
- Confirmed behavior: barcode identity/sequence foundation exists; assets/products are persisted; stock movements can reference assets; stock audit sessions and transfer routes are transactional; transfer create locks selected assets and rejects wrong source branch/non-available assets; inventory valuation endpoint exists; generic invoice mutation is blocked but generic inventory CRUD remains available behind inventory permissions.
- Partial behavior: branches can represent warehouses by `branches.type`, but there is no dedicated warehouse/storage-location table; product `warehouseId` and stock movement `warehouseId` are nullable fields without a first-class warehouse ledger; transfer UI/API covers asset transfers but not weighted/bullion stock ledger transfer accounting; stock audit uses status/branch corrections rather than full counted quantity/value variance accounting.
- Unsafe behavior: generic `/assets` and `/products` update paths can mutate operational inventory fields through generic CRUD; inventory page bulk status update and adjustments page patch assets directly and create generic audit logs; stock audit UI simulates scanned IDs, reads unscoped assets with `skipBranch`, and uses `localStorage` branch state for cross-branch scan simulation; inventory summary cards compute page-local totals in the frontend, not authoritative all-inventory aggregates.
- Missing behavior: first-class warehouses/storage bins, warehouse balances, opening-stock workflow, stock count approval, stock adjustment financial posting, inventory subledger reconciliation, COGS/inventory GL reconciliation report, physical count variance valuation, damaged/lost workflow with accountant-approved write-off, idempotency keys for transfer/status/adjustment actions, and manual browser QA evidence for mobile/RTL/LTR inventory flows.
- Launch blockers: P0 inventory cannot be market-launched as authoritative warehouse control because generic inventory mutations and incomplete warehouse/location/valuation/reconciliation controls can change stock truth without full accounting/reversal governance. P1 stock audit completion can archive or reassign assets without an approval/reversal/accounting write-off workflow.
- Accountant sign-off items: inventory valuation method, COGS basis, lost/damaged write-off accounting, opening-stock accounting, transfer accounting policy, stock-count variance posting.
- Owner-decision items: whether branches-as-warehouses is acceptable for MVP or a dedicated warehouse/bin model is required; whether manual generic adjustments must be disabled before launch; whether stock audits require maker-checker approval.
- Manual QA gaps: inventory list, asset create/edit, barcode print, bulk status, transfers, stock audit, valuation report, Arabic RTL, English LTR, desktop/mobile, Branch Account permissions, Super Admin behavior.
- Severity summary: P0 `INV-001` authoritative warehouse/inventory controls incomplete; P1 `INV-002` generic inventory mutation paths unsafe for market launch; P1 `INV-003` stock audit can produce irreversible operational changes without complete approval/accounting/reversal; P2 `INV-004` inventory UI totals are page-local and not authoritative.
- Exact next audit step: continue with module 2, Purchases and Suppliers, starting from purchase order models, purchase receive/post routes, supplier payment state, supplier UI pages, and SELECT-only purchase/supplier/cash/journal evidence.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then inspect Purchases and Suppliers.

### Phase 35A Checkpoint 2 — Purchases and Suppliers

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: cash/credit purchase invoices; drafts/approvals; receiving; supplier invoices; VAT/RCM; landed costs; serialized/product receipt; supplier payments; partial payments/allocation; supplier advances; purchase returns/debit notes; duplicate posting prevention; idempotency; supplier balances/statements/aging; treasury/accounting/inventory effects; permissions; maker-checker; audit; printing/numbering.
- Frontend files inspected: `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`, `app/[locale]/(dashboard)/suppliers/[id]/page.tsx`, `app/[locale]/(dashboard)/suppliers/investment-gold/page.tsx`, `features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx`, `lib/repositories/api-impl.ts`, `lib/repositories/interfaces.ts`.
- Backend files inspected: `backend/src/routes/erp.routes.js`, `backend/src/routes/gold-purchase.routes.js`, `backend/src/services/posting.service.js`, `backend/src/services/supplier-payment-state.service.js`, `backend/src/services/gold-purchase-draft.service.js`, `backend/src/services/gold-purchase-governance.service.js`, `backend/src/models/purchaseOrder.model.js`, `backend/src/models/purchaseOrderItem.model.js`, `backend/src/models/supplier.model.js`, `backend/src/models/supplierDocument.model.js`, `backend/src/models/supplierConsignment.model.js`.
- API routes inspected: `/purchase-orders/receive`, `/supplier-purchases/receive`, `/purchase-orders/:id/pay`, generic `setupCrud("suppliers")`, generic `setupCrud("purchase-orders")`, `/suppliers/:id/statement`, gold-purchase draft/validate/void/submit/approve/reject/revision routes.
- Middleware and permissions inspected: `authMiddleware`, `guardFor`, `requirePermission`, `requireAnyPermission`; supplier keys via CRUD mapping; `treasury.update` for supplier payment; gold-purchase permission prefixes.
- Services inspected: `postingService.postPurchaseEntry`, `postingService.postCashEntry`, `supplierPaymentState.computePoPaymentState`, supplier statement route logic, gold-purchase draft/governance services.
- Models/tables inspected: `suppliers`, `purchase_orders`, `purchase_order_items`, `cash_transactions`, `journal_entries`, `journal_lines`, `supplier_documents`, `supplier_consignments`, `investment_gold_purchase_documents`, `investment_gold_purchase_items`, `gold_purchase_approval_requests`.
- SELECT-only database evidence used: `suppliers=4`, `purchase_orders=5`, `purchase_order_items=5`, `cash_transactions` category `supplier_purchase=2` totaling `11000.0000`; all local purchase orders are `received`; journal source `purchase_order=3`; supplier-related tables present are `supplier_consignments`, `supplier_documents`, and `suppliers`.
- Verifier files inspected: `scripts/verify-gold-purchase-draft-workflow.js`, `scripts/verify-gold-purchase-approval-workflow.js`; referenced supplier-due verifier name was not present at the searched path; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`, SELECT-only `psql`; no API write, package script, verifier, fixture, migration, or browser command was run.
- Confirmed behavior: supplier purchase receive requires an idempotency key; validates supplier, branch/warehouse branch, items, quantities/costs, VAT/RCM snapshot, and overpaid receive amount; creates purchase order, product/assets, stock movement for product receipts, purchase order items, asset events, journal entry, optional cash-out, audit log, notification, and idempotent replay body in one transaction. Supplier payment requires idempotency, locks the received non-consignment PO, blocks overpayment, posts `cash_out` plus journal, and leaves legacy `Supplier.due` as reference-only. Supplier statement is read-only and computed from received POs and supplier payment cash-outs rather than `Supplier.due`.
- Partial behavior: the market purchase flow is immediate receive rather than a full draft -> approval -> partial receive -> close lifecycle; `PurchaseOrder` has `draft/sent/partial/received/cancelled` statuses, but the active receive route creates `received` directly. Supplier documents/consignments exist as tables, and investment-gold purchase has draft/governance workflow, but it does not post purchase inventory/treasury/accounting closure.
- Unsafe behavior: generic `setupCrud("purchase-orders")` remains available for purchase order mutation behind supplier permissions, so lifecycle/status/financial fields may be mutable outside the dedicated receive/payment controls. Supplier delete can hard-delete when linked counts are zero, but purchase/business archival policy still needs owner approval. Supplier statement relies on `CashTransaction.reference -> PurchaseOrder.id`; if legacy/manual payments use inconsistent references they become invisible to the supplier subledger.
- Missing behavior: purchase quotations/orders with maker-checker approval, partial receiving, supplier invoice number uniqueness, landed costs and expense allocation, purchase returns/debit notes, supplier advances/prepayments, supplier aging report, formal payable reconciliation against GL AP, purchase reversal/cancellation after receive, receipt/print numbering, supplier payment approval workflow, and browser QA evidence for the purchase/supplier pages.
- Launch blockers: P0 purchase/supplier workflow is not market-ready because the active path is direct receive/post and lacks purchase returns/debit notes/reversals and full supplier payable reconciliation. P1 generic purchase-order mutation remains a risk to accounting and stock truth. P1 supplier payment/reference model needs reconciliation hardening before real supplier settlement.
- Accountant sign-off items: purchase VAT/RCM treatment, recoverable/non-recoverable VAT capitalization, AP account `2100`, inventory account `1200`, supplier payment journal, supplier statement vs GL AP reconciliation, purchase return/debit note accounting, supplier advance accounting.
- Owner-decision items: whether direct receive is acceptable for MVP; whether supplier payment needs approval; whether `Supplier.due` remains visible as a legacy reference; whether investment-gold drafts should be closed into the same purchase ledger or remain separate.
- Manual QA gaps: purchase receive, product vs serialized receipt, VAT/RCM preview, supplier detail statement, supplier payment modal, investment-gold draft workflow, Arabic RTL, English LTR, desktop/mobile, Branch Account permissions, Super Admin behavior.
- Severity summary: P0 `PUR-001` full purchase lifecycle and reversal model missing; P1 `PUR-002` generic purchase-order mutation path unsafe; P1 `PUR-003` supplier payable reconciliation depends on source-document convention and needs GL comparison; P2 `PUR-004` investment-gold draft/governance is backend/UI foundation only, not posted purchase closure.
- Exact next audit step: continue with module 3, Sales/POS/Invoices/Returns/Exchanges/Installments, starting from POS checkout, sales draft lifecycle, returns/exchanges, installment collection, customer statements, print/reprint, and SELECT-only invoice/payment/journal evidence.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then inspect Sales/POS/Invoices/Returns/Exchanges/Installments.

### Phase 35A Checkpoint 3 — Sales, POS, Invoices, Returns, Exchanges, Installments

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: cash/credit sales; POS; drafts/posting; numbering; payment methods/split/partial/installments; customer balances; reservations-to-sale; returns; exchanges; discounts; deposits; print/reprint; Employee attribution; stock/COGS/VAT/revenue/treasury/AR/profit; cancellation/void/refund/reversal; idempotency/concurrency; statements/reports; branch scope; operator enforcement; Arabic/English/responsive state.
- Frontend files inspected: `app/[locale]/(dashboard)/pos/page.tsx`, `app/[locale]/(dashboard)/sales/page.tsx`, `app/[locale]/(dashboard)/sales/returns/page.tsx`, `app/[locale]/(dashboard)/sales/exchanges/page.tsx`, `app/[locale]/(dashboard)/sales/installments/page.tsx`, `app/[locale]/(dashboard)/sales/search-print/page.tsx`, `app/[locale]/(dashboard)/sales/reservations/page.tsx`, `components/sales/*`.
- Backend files inspected: `backend/src/routes/erp.routes.js`, `backend/src/services/sales.service.js`, `backend/src/services/sales-operator-policy.service.js`, `backend/src/services/posting.service.js`, `backend/src/services/exchange-policy.service.js`, `backend/src/services/exchange-display.service.js`, `backend/src/models/invoice.model.js`, `backend/src/models/invoiceItem.model.js`, `backend/src/models/payment.model.js`, `backend/src/models/installment.model.js`, `backend/src/models/invoicePrintEvent.model.js`.
- API routes inspected: `/pos/checkout`, `/sales/invoices/drafts`, `/sales/invoices/:id`, `/sales/invoices/:id/cancel`, `/sales/invoices/:id/post`, `/sales/returns`, `/sales/exchanges/preview`, `/sales/exchanges`, `/installments/:id/pay`, `/invoices/search-print`, `/invoices/:id/print-events`, `/invoices/:id/exchange-display`, customer statement routes.
- Middleware and permissions inspected: `authMiddleware`, Sales/POS command access policy, `sales.create`, `sales.print`, `sales.reprint`, `sales.returns.execute`, `sales.exchanges.execute`, `sales.installments.collect`, `pos.sell`, `pos.discount.approve`, Branch Account Employee-first policy, Super Admin direct access.
- Services inspected: server sales totals/payment/installment helpers, posting engine sale/return/exchange/installment methods, exchange tax/display policy, idempotency service usage, command actor attribution.
- Models/tables inspected: `invoices`, `invoice_items`, `payments`, `installments`, `cash_transactions`, `journal_entries`, `journal_lines`, `stock_movements`, `assets`, `products`, `invoice_print_events`, customer credit tables.
- SELECT-only database evidence used: invoices by type/posting status: `sale posted=12`, `return posted=1`, `exchange posted=1`, `deposit posted=1`, `installment posted=1`; `invoice_items=16`; payments by method include `cash=5/26200`, `Cash=8/6444.5`, `card=1/1417.5`, `deposit=1/1500`; `installments paid=6`; `invoice_print_events=0`; journal source counts include `invoice=8`, `sale=1`, `return=1`, `exchange=1`, `installment=8`.
- Verifier files inspected: `scripts/verify-sales-pos-operator-enforcement.js`, `scripts/verify-sales-adjustment-operator-enforcement.js`, `scripts/verify-return-exchange-settlement.js`, `scripts/verify-installment-reconciliation.js`; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`, SELECT-only `psql`; one read-only `payments.type` query failed because the column does not exist, then schema columns were inspected and `payment_method` was queried.
- Confirmed behavior: POS checkout requires idempotency, validates active branch/customer/items, locks product/asset rows, rejects unavailable/wrong-branch stock, computes totals server-side, applies settings-driven installment/payment rules, posts invoice/payment/installments/stock/GL/treasury/customer balance atomically, and records Employee/Super Admin attribution. Draft create/edit/cancel/post exists; draft post revalidates availability and posts atomically. Returns/exchanges are idempotent, line-aware, operator-gated, stock-aware, and post receivable-first settlement with GL/treasury/customer credit handling. Installment collection is idempotent, operator-gated, overpayment-guarded, and updates installment/payment/invoice/customer/GL/treasury in one transaction. Official print/reprint creates immutable print-event authorization with reason required for reprint.
- Partial behavior: search/print supports invoice rows only; gift vouchers and customer-gold purchases remain separate. `invoice_print_events` is empty in local data, so browser/manual print evidence is absent. Draft posting keeps technical `DRAFT-*` id while assigning final invoice number, which is acceptable technically but needs business acceptance. Payment method casing is inconsistent in local data (`Cash` and `cash`).
- Unsafe behavior: finalized posted-invoice void/cancel/reversal is not a general workflow; posted invoice cancellation message points users to return/accounting cancellation, but a full business void/reversal process is still absent. Return/exchange financial policy is complex and likely requires accountant sign-off before launch. Manual browser QA was not run in this audit, so runtime overlay/responsive/operator UX remains unverified here.
- Missing behavior: finalized sale void, non-return cash refund workflow, broad reversal governance, settlement approval workflow, gift voucher end-to-end launch validation, customer credit deposit/refund/application launch QA, complete exchange/return reporting sign-off, and full browser QA across Branch Account/Super Admin Arabic/English desktop/mobile.
- Launch blockers: P1 `SAL-001` posted invoice void/reversal/cancellation is incomplete for market operations; P1 `SAL-002` returns/exchanges/installment flows need accountant sign-off and browser QA before launch; P2 `SAL-003` print/reprint backend is implemented but local data/browser evidence is absent.
- Accountant sign-off items: VAT on exchange returned value vs new items, return/exchange AR relief and cash/customer-credit settlement, COGS reversal, installment AR/cash timing, revenue recognition for deposits/reservations, posted invoice void/reversal policy.
- Owner-decision items: whether returns/exchanges are enough instead of general posted-void for MVP; whether gift vouchers/customer-gold are launch scope; whether payment method normalization is required pre-launch.
- Manual QA gaps: POS checkout, sales draft post, return, exchange preview/execute/display, installment collection, official print/reprint, Arabic RTL, English LTR, mobile/desktop, Branch Account operator workflow, Super Admin direct workflow.
- Severity summary: P1 `SAL-001` posted void/reversal lifecycle missing; P1 `SAL-002` accountant sign-off and browser QA required for adjustments/installments; P2 `SAL-003` print-event route implemented but unexercised in current local data; P2 `SAL-004` payment method normalization/reporting consistency.
- Exact next audit step: continue with module 4, Treasury, starting from cash transaction model/routes, manual treasury operations, cash/bank transfers, daily closing, source linkage, GL posting, and SELECT-only cash/journal evidence.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then inspect Treasury.

### Phase 35A Checkpoint 4 — Treasury

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: cash/bank accounts, cash-in/cash-out, transfers, treasury summaries, transaction pagination, daily closing, variance capture, GL posting linkage, idempotency, branch/company scope, permissions, audit trail, UI workflow, source document links, and reconciliation readiness.
- Frontend files inspected: `app/[locale]/(dashboard)/accounting/treasury/page.tsx`, `hooks/use-treasury.ts`, repository API usage, translation/key usage by source reference.
- Backend files inspected: `backend/src/routes/erp.routes.js`, `backend/src/models/cashTransaction.model.js`, `backend/src/services/posting.service.js`, model associations in `backend/src/models/index.js`, treasury-related verifier file names.
- API routes inspected: `/treasury/transactions` GET/POST, `/treasury/summary`, `/treasury/closing`, `/treasury/closings`, generic `cash-transactions` permission mapping.
- Middleware and permissions inspected: `authMiddleware`, `requirePermission("treasury.view")`, `requirePermission("treasury.update")`, `guardFor` mapping for `cash-transactions`.
- Services inspected: `postingService.postCashEntry`, generic `postEntry`, audit recording, idempotency service usage in manual treasury transaction route.
- Models/tables inspected: `cash_transactions`, `accounts`, `journal_entries`, `journal_lines`; no dedicated cashbox, vault, register, teller shift, or treasury closing table exists beyond `cash_transactions` rows with type `closing`.
- SELECT-only database evidence used: `cash_transactions=25`, all status `posted`; no `closing` rows; no unlinked manual money movements among `cash_in/cash_out/transfer`; cash movements by type/account are `cash_in bank=1/1417.5000`, `cash_in cash=17/36653.5000`, `cash_out cash=7/21371.5000`; account balances `1110=245914.00000000`, `1120=301269.50000000`; journal entries with `source_type='cash_transaction'` count `3`; only treasury/cash-named public table is `cash_transactions`.
- Verifier files inspected by name/search only: `backend/scripts/verify-treasury-closing-safety.js` and cash/posting related static verifiers; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`, SELECT-only `psql`; two read-only PowerShell path commands failed because `(dashboard)` was not passed as a literal path, then were rerun safely with `-LiteralPath`.
- Confirmed behavior: manual treasury transaction POST requires `treasury.update`, positive amount, required idempotency key, atomic `CashTransaction` + GL `postCashEntry` + back-link + audit in one database transaction, and idempotent replay. Summary reads GL balances for accounts `1110` cash and `1120` bank. Closing records expected vs actual balance, prevents duplicate same-account same-day closing, and audits variance. UI generates a stable idempotency key per manual transaction modal and paginates transaction reads.
- Partial behavior: closing idempotency is optional rather than required and the frontend does not send a closing idempotency key; closing records variance but does not post a variance journal or require approval; branch is stored as free text/default branch and `branch_id` is nullable; treasury accounts are only `cash`/`bank`, not real cashboxes/bank accounts/vaults.
- Unsafe behavior: manual transaction POST accepts invalid `account`/`toAccount` values by falling back in posting (`cash` -> `1110`, transfer destination fallback -> `1120`) instead of rejecting; `type` silently defaults to `cash_in` if invalid; manual cash-in/cash-out default counter accounts to `4900`/`6000` unless the client supplies a counter account, which can misclassify owner injections, expenses, adjustments, or bank deposits; no cashier shift/opening count/approval/reversal workflow is present.
- Missing behavior: cashbox/register model, per-branch teller shifts, opening float, physical count approvals, variance posting/approval, transfer approval, bank account identity, deposit/withdrawal workflow, treasury reversal/correction workflow, payment-method normalization, source-document reconciliation dashboard, cash/bank aging/reconciliation, attachment/receipt evidence, and browser QA.
- Launch blockers: P0 `TRE-001` treasury is not market-ready as a cash-control subsystem because it lacks cashbox/shift/opening/approval/reversal/variance-posting governance. P1 `TRE-002` manual transaction account validation is too permissive and can silently post to fallback cash/bank accounts. P1 `TRE-003` closing is recorded but not an accounting-controlled period/cash reconciliation process.
- Accountant sign-off items: manual cash-in/cash-out counter-account policy, variance accounting, owner capital/draw handling, bank/cash transfer treatment, cashbox daily close procedure, branch cash custody responsibilities.
- Owner-decision items: whether MVP can launch with only company-level cash/bank totals; whether manual treasury entries should be disabled except for Super Admin/accountant; whether closing variance should post automatically or require accountant approval.
- Manual QA gaps: add cash-in, add cash-out, transfer, closing duplicate prevention, closing variance display, Arabic RTL, English LTR, mobile/desktop, Branch Account permission denial, Super Admin behavior, controlled error display.
- Severity summary: P0 `TRE-001` cash-control governance incomplete; P1 `TRE-002` invalid account/type fallback risk; P1 `TRE-003` closing lacks idempotent frontend key and variance posting/approval; P2 `TRE-004` branch/cashbox identity is weak.
- Exact next audit step: continue with module 5, Accounting and Reconciliation, starting from account/journal models, posting service, journal service/reversal paths, accounting pages, financial reports, period/lock controls, and SELECT-only journal/account evidence.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then inspect Accounting and Reconciliation.

### Phase 35A Checkpoint 5 — Accounting and Reconciliation

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: chart of accounts, account balances, journal entries/lines, automatic posting, manual journal drafts, manual posting, manual reversal, account statement, trial balance, ledger reconciliation, cash/AR/AP reconciliation, period/fiscal close, immutable posted entries, generic CRUD hardening, branch scope, permissions, audit trail, and reporting UI.
- Frontend files inspected: `app/[locale]/(dashboard)/accounting/page.tsx`, `app/[locale]/(dashboard)/accounting/treasury/page.tsx`, `app/[locale]/(dashboard)/reports/page.tsx`, `hooks/use-accounting.ts`, `lib/repositories/api-impl.ts`, `lib/repositories/interfaces.ts`, `lib/types.ts`.
- Backend files inspected: `backend/src/routes/erp.routes.js`, `backend/src/controllers/erp.controller.js`, `backend/src/services/posting.service.js`, `backend/src/services/journal.service.js`, `backend/src/services/statement-reconciliation.service.js`, `backend/src/services/full-2300-reconciliation.service.js`, `backend/src/models/account.model.js`, `backend/src/models/journalEntry.model.js`, `backend/src/models/journalLine.model.js`.
- API routes inspected: `/journal-entries/manual-draft`, `/journal-entries/:id/post`, `/journal-entries/:id/reverse`, `/journal-entries/:id/cancel`, generic `/journal-entries` read/list, `/accounts`, `/accounts/:id/statement`, `/reports/trial-balance`, `/reports/ledger-reconciliation`, `/reports/ledger/account`, `/reports/ledger/cash-reconciliation`, `/reports/ledger/ar-ap-reconciliation`.
- Middleware and permissions inspected: `authMiddleware`, `requirePermission("accounting.view")`, `requirePermission("accounting.post")`, generic `guardFor` behavior for accounting resources.
- Services inspected: `postingService.postEntry` and source-specific posting helpers, `journalService.createManualDraft`, `journalService.postManualDraft`, `journalService.reverseManualEntry`, `journalService.cancelManualDraft`, source-aware statement diagnostics, full 2300 reconciliation diagnostics.
- Models/tables inspected: `accounts`, `journal_entries`, `journal_lines`; no period, fiscal year, close, accounting lock, or reconciliation-fix table exists.
- SELECT-only database evidence used: `accounts=20`, active accounts `19`, nonzero accounts `17`; `journal_entries=50`, `journal_lines=133`; entry-level and line-level total imbalance both `0`; source/status mix includes posted `invoice=8`, `purchase_order=3`, `installment=8`, `reservation_payment=9`, `customer_credit=4`, `cash_transaction=3`, `manual_reversal=1`; one `manual` row is `balanced`, one `manual` row is `reversed`, and one `sale` row is `balanced`; local stored `Account.balance` differs materially from posted-line calculated balances for many accounts, including `1110`, `1120`, `1200`, `1300`, `2100`, `2300`, `4100`, `5000`, and parent/control accounts.
- Verifier files inspected: `scripts/verify-ledger-reporting-foundation.js`, `scripts/verify-customer-credit-ledger.js`, `scripts/verify-reservation-core-accounting-foundation.js`; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`, SELECT-only `psql`; one read-only broad `rg` path command failed because `(dashboard)` was not treated as a literal path, then relevant files were read safely.
- Confirmed behavior: generic journal creation is blocked in the controller and replaced by a dedicated balanced manual-draft endpoint. Manual posting locks the draft, revalidates stored lines, updates account balances atomically, flips the same entry to posted, and audits. Manual reversal creates a new posted reversal entry with swapped lines, updates account balances, flips the original to reversed, and prevents double reversal. Draft cancellation deletes only unposted manual drafts and audits. Account statement/trial balance/ledger reconciliation routes are read-only and compute from posted journal lines rather than trusting `Account.balance`.
- Partial behavior: automatic posting exists for major sales, purchases, treasury, customer credit, reservations, vouchers, customer gold, installments, returns, and exchanges, but route coverage is source-specific and not a complete financial close. Accounting UI has read-only statement/trial/reconciliation tabs plus manual journal actions, but dashboard stat cards and indicators include static/demo values. Ledger reports expose account-level reconciliation; party-level AR/AP reconciliation is explicitly deferred because journal lines do not carry customer/supplier dimensions.
- Unsafe behavior: local `Account.balance` mirrors are materially out of sync with posted journal-line calculated balances, so the current local accounting state cannot be trusted for launch without reconciliation/repair. Generic `/accounts` update remains available behind accounting permissions for `name`, `nameAr`, and `code`, which is acceptable for labels/codes only if tightly permissioned but still needs chart-governance sign-off. Several routes accept optional `branchId` report filters without a dedicated branch authorization check in the report route itself, relying on authenticated company scope rather than a complete accounting reporting scope policy.
- Missing behavior: fiscal periods, period close/lock, VAT return workflow, profit/loss and balance sheet from closed periods, source-document reversal governance across all business modules, party-level AR/AP ledger dimensions, accountant approval for manual journals, account-code change lock, opening-balance governance, retained earnings/year-end close, bank reconciliation, audit-ready export pack, and browser QA evidence.
- Launch blockers: P0 `ACC-001` local stored account balances do not reconcile to posted journal lines, so accounting cannot be treated as market-ready until balances are reconciled or rebuilt. P0 `ACC-002` no fiscal period close/lock or VAT filing workflow exists. P1 `ACC-003` source-document reversal/void coverage is incomplete outside manual journals. P1 `ACC-004` party-level AR/AP reconciliation is diagnostic/account-level only.
- Accountant sign-off items: chart of accounts, opening balances, `Account.balance` rebuild policy, VAT report basis, revenue/COGS/inventory/AP/AR accounts, manual journal approval, period close process, reversal/adjustment policy, retained earnings.
- Owner-decision items: whether `Account.balance` should be rebuilt from posted journal lines before any launch testing; whether manual journal posting requires maker-checker approval; whether account-code edits should be frozen after posting exists; whether party dimensions must be added before launch.
- Manual QA gaps: manual draft create/post/reverse/cancel, account statement, trial balance, ledger reconciliation, cash reconciliation, AR/AP reconciliation, error states, Arabic RTL, English LTR, mobile/desktop, Branch Account access denial, Super Admin access.
- Severity summary: P0 `ACC-001` stored balance vs ledger drift; P0 `ACC-002` no period close/VAT filing controls; P1 `ACC-003` incomplete source reversal governance; P1 `ACC-004` party-level reconciliation deferred; P2 `ACC-005` accounting UI uses static summary indicators.
- Exact next audit step: continue with module 6, Employees and Payroll, starting from Employee/operator auth, attendance/payslip models, payroll routes/UI, payroll posting, branch/permission scope, and SELECT-only employee/payroll evidence.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then inspect Employees and Payroll.

### Phase 35A Checkpoint 6 — Employees, Operator Authorization, Attendance, and Payroll

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: employee master data, Employee Code/PIN, operator verification/session lifecycle, branch access, role/direct permission/denial, credential reset/revoke, attendance, payslip generation, salary payment, payroll posting, idempotency, permissions, audit trail, HR/payroll UI, and local DB readiness.
- Frontend files inspected: `app/[locale]/(dashboard)/employees/page.tsx`, `app/[locale]/(dashboard)/employees/[id]/page.tsx`, `app/[locale]/(dashboard)/employees/payroll/page.tsx`, `hooks/use-employees.ts`, `hooks/use-payroll.ts`, `contexts/operator-context.tsx`, `components/operator/operator-bar.tsx`, `components/operator/operator-verify-dialog.tsx`.
- Backend files inspected: `backend/src/routes/erp.routes.js`, `backend/src/routes/employee-authorization.routes.js`, `backend/src/services/employee-authorization.service.js`, `backend/src/services/operator-session.service.js`, `backend/src/services/posting.service.js`, `backend/src/models/employee.model.js`, `backend/src/models/attendance.model.js`, `backend/src/models/payslip.model.js`, employee authorization models/associations.
- API routes inspected: `/operator/verify`, `/operator/current`, `/operator/end-session`, `/operator/change-pin`, employee credential/branch/permission routes, generic `/employees` routes, `/attendance`, `/attendance/check-in`, `/attendance/check-out`, `/payslips`, `/payroll/generate`, `/payslips/:id/pay`.
- Middleware and permissions inspected: `authMiddleware`, employee-management permission routes, `employees.credentials.manage`, `employees.permissions.manage`, `employees.branches.manage`, `employees.verification.view`, payroll route permission mapping in `guardFor`, and direct payroll/attendance route handlers.
- Services inspected: `employee-authorization.service`, `operator-session.service`, `postingService.postPayrollEntry`, payroll idempotency service usage in payslip payment.
- Models/tables inspected: `employees`, `employee_credentials`, `employee_operational_sessions`, `employee_verification_attempts`, `employee_branch_access`, `employee_role_assignments`, `employee_permission_grants`, `employee_permission_denials`, `employee_code_history`, `attendance`, `payslips`.
- SELECT-only database evidence used: `employees=7`; statuses `present=6`, `leave=1`; `employee_credentials=0`; `employee_operational_sessions=0`; `attendance=0`; `payslips=0`; no paid payslip without journal/idempotency because no payslips exist; employee/payroll-related public tables exist, but no salary-loan, payroll-period, or payroll-approval table exists.
- Verifier files inspected: `scripts/verify-employee-authorization-foundation.js`, `scripts/verify-employee-operator-session.js`, `scripts/verify-single-level-employee-operator.js`, `scripts/verify-employee-management-operator-ui-contract.js`, `scripts/verify-secondary-idempotency.js`; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`, SELECT-only `psql`; one read-only broad `rg` path command failed because `(dashboard)` was not literal, then targeted reads were used.
- Confirmed behavior: Employee Code/PIN verification enforces 6 numeric digits, uses bcrypt hash comparison and a dummy hash for unknown codes, records verification attempts, does not automatically lock credentials, applies a short failed-verify delay, validates branch access, checks requested permission, creates a single verified operator session with compatibility `verificationLevel=1`, 30-minute idle expiry, 8-hour absolute expiry, credential/authorization version checks, and `/operator/current` does not refresh activity. Credential/code/PIN/security changes revoke active operator sessions. Payroll payslip payment requires idempotency, posts payroll journal inside the same transaction, and prevents a payslip from being marked paid without GL posting.
- Partial behavior: employee management UI exposes safe authorization summaries and credential/operator-session surfaces, but local data has zero Employee credentials, so Branch Account employee-operation readiness is data-incomplete in the current DB. Attendance supports only basic same-day check-in/check-out and simple hours calculation. Payroll generation creates draft payslips directly from employee base salary + allowances for present/leave employees; it does not consume attendance, overtime rules, deductions workflow, approval workflow, or payroll periods.
- Unsafe behavior: `/attendance`, `/attendance/check-in`, `/attendance/check-out`, `/payslips`, `/payroll/generate`, and `/payslips/:id/pay` are authenticated but not explicitly guarded in the route with `payroll.view`/`payroll.manage`; this is a launch security gap even if sidebar/UI hides the page. Payroll generation is not wrapped in one transaction and has no idempotency key. Attendance check-in/check-out uses only `employeeId` from the request and does not require an Employee operator session, branch assignment validation, or manager approval. Payslip payment does not create a treasury cash transaction, only a payroll journal entry.
- Missing behavior: payroll periods, approval/maker-checker, attendance import/approval, leave management, overtime calculation, deductions, advances/loans, commissions, benefits, end-of-service, salary bank file, payroll reversal/correction, payslip print, employee self-service, payroll taxes/social insurance, payroll reports, branch payroll allocation, and browser QA evidence.
- Launch blockers: P0 `HRP-001` payroll/attendance endpoints lack explicit payroll permission guards and operator/business authorization. P0 `HRP-002` payroll lifecycle is only a draft/pay foundation, not a market payroll process. P1 `HRP-003` local DB has no Employee credentials, so Branch Account operation cannot be fully market-tested from current data. P1 `HRP-004` salary payment posts GL but no treasury cash movement or cashbox/bank execution workflow.
- Accountant/HR sign-off items: salary expense account `6100`, cash/bank payment account, payroll period approval, attendance-to-payroll rules, overtime/deduction policy, leave policy, salary payment method, payroll reversal policy.
- Owner-decision items: whether payroll is launch scope or can remain hidden/deferred; whether attendance is operational-only or payroll-authoritative; whether employee credentials must be provisioned before next browser QA; whether payroll payment should create treasury movements.
- Manual QA gaps: Employee list/detail, credential reset/revoke, branch/permission management, operator verification with real credentials, attendance check-in/out, payroll generation/payment, Arabic RTL, English LTR, mobile/desktop, Branch Account access, Super Admin management.
- Severity summary: P0 `HRP-001` payroll/attendance permission guard gap; P0 `HRP-002` payroll process incomplete; P1 `HRP-003` no local Employee credentials; P1 `HRP-004` payroll payment lacks treasury execution; P2 `HRP-005` attendance is basic same-day capture only.
- Exact next audit step: continue with module 7, Cross-Module UI and Runtime Readiness, starting from navigation, route guards, core pages, localization, error handling, local/mock fallbacks, and browser-QA gaps.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then inspect Cross-Module UI and Runtime Readiness.

### Phase 35A Checkpoint 7 — Cross-Module UI and Runtime Readiness

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Requirements inspected: navigation visibility, route guards, Super Admin/Branch Account UI separation, API client error handling, data-source mode, branch selection storage, local/mock fallbacks, Arabic/English localization, responsive risk, runtime overlay risk, destructive confirmations, static/demo values, and browser-QA gaps.
- Frontend files inspected: `components/layout/sidebar.tsx`, `components/auth/auth-guard.tsx`, `components/layout/app-shell.tsx`, `components/layout/branch-switcher.tsx`, `contexts/auth-context.tsx`, `contexts/operator-context.tsx`, `contexts/settings-context.tsx`, `contexts/erp-context.tsx`, `hooks/use-permissions.ts`, `lib/api/client.ts`, `lib/data-source.ts`, `messages/en.json`, `messages/ar.json`, representative dashboard/business pages from prior checkpoints.
- Backend files inspected for UI contract context: route permissions in `backend/src/routes/erp.routes.js`, employee authorization routes, system-account behavior by earlier phase docs/source references.
- Verifier files inspected by name/content where relevant: `scripts/verify-production-data-source.js`, `scripts/verify-employee-management-operator-ui-contract.js`, `scripts/verify-ledger-reporting-foundation.js`, business verifier names from prior checkpoints; no verifier was executed.
- Commands run: read-only `rg`, `Get-Content`; one read-only `rg` pattern had a PowerShell quoting error around `|`, then was rerun with single quotes. No browser, package script, verifier, or DB mutation was run.
- Confirmed behavior: app layout sets `dir` from locale; English and Arabic message namespaces exist for core modules; `AuthGuard` maps major routes to granular permissions; sidebar hides most routes for Branch Account until an operator session is active and limits Branch Account visible routes to POS/Sales; `usePermissions` grants full UI permission to `super_admin`; API client emits stable `DarfusApiError`, refreshes expired technical sessions, dispatches operator recovery events for expected operator errors, and production data-source guard forbids mock/local business mode in production.
- Partial behavior: UI route guards and sidebar visibility are client-side affordances and do not replace missing backend route permissions, especially payroll/attendance. Active branch is stored in localStorage and sent as `X-Branch-ID`; backend hardening reduces widening risk, but frontend still relies on local state for selected branch UX. Several management/reporting pages use `skipBranch: true` appropriately for company-wide routes, but that requires continued backend-side scope validation.
- Unsafe behavior: several business-sensitive flows still use `window.confirm` instead of controlled dialogs (`accounting`, `reservations`, settings deletion/reset, supplier/customer deletes), so expected errors and user decisions may be less accessible/mobile-friendly. Accounting stat cards still show static/demo values. POS retains localStorage draft cache for draft-resume behavior; inventory stock audit uses unscoped asset fetch plus localStorage branch state for scan simulation. Browser runtime overlay, mobile layout, and RTL/LTR visual correctness were not tested in this audit.
- Missing behavior: full browser QA, production build/type/lint evidence for this phase, accessibility pass, mobile screenshots, runtime-overlay proof, complete controlled-dialog replacement, complete removal of static dashboard/accounting summary values, persisted server-side user UI preferences, and end-to-end Branch Account/Super Admin UI workflows for every launch module.
- Launch blockers: P1 `UI-001` browser QA was not authorized/run, so runtime market readiness is unproven. P1 `UI-002` payroll/attendance backend permission gaps are not mitigated by UI hiding. P1 `UI-003` stock-audit/localStorage branch simulation and selected-branch UX need hard launch validation. P2 `UI-004` static/demo accounting indicators and `window.confirm` flows remain.
- Owner-decision items: whether Phase 35B should be a backend hardening phase before browser QA; whether browser QA should cover all modules after P0 data/accounting issues are repaired; whether window-confirm flows must be replaced before market launch; whether localStorage POS draft cache is acceptable.
- Manual QA gaps: all major module flows across Arabic RTL, English LTR, desktop/mobile, Super Admin, Branch Account with verified Employee, invalid branch/company, expected API errors, session expiry, and no runtime overlay.
- Severity summary: P1 `UI-001` no browser QA evidence; P1 `UI-002` UI guard cannot compensate for backend route gaps; P1 `UI-003` local branch/draft/stock-audit state needs launch validation; P2 `UI-004` static indicators and native confirms remain.
- Exact next audit step: perform final Phase 35A consolidation, rank launch blockers, document recommended next implementation phases, then run final safety checks.
- Current state confirmation: no implementation occurred; no database mutation occurred; Production untouched.
- NEXT TOOL START HERE: read this Phase 35A checkpoint, rerun git safety checks, then consolidate the final Phase 35A audit result.

### Phase 35A Final Consolidation — Market-Readiness Decision

AUDIT FINDING ONLY — NO IMPLEMENTATION PERFORMED

- Final audit scope completed: inventory/warehouses, purchases/suppliers, sales/POS/invoices/returns/exchanges/installments, treasury, accounting/reconciliation, employees/payroll, and cross-module UI/runtime readiness.
- Final classification: `PHASE 35A AUDIT COMPLETED — DOCUMENTATION ONLY — NO IMPLEMENTATION PERFORMED`.
- Overall market-readiness decision: NOT READY FOR MARKET LAUNCH. The system has meaningful foundations in sales/POS posting, returns/exchanges/installments, manual journal controls, Super Admin/Branch Account access simplification, and Employee operator sessions, but core launch blockers remain in inventory governance, purchasing lifecycle, treasury cash controls, accounting reconciliation/period close, payroll/attendance authorization, and browser QA evidence.

Top P0 blockers:
- `INV-001`: authoritative warehouse/inventory controls incomplete; generic inventory mutation and stock-audit correction paths can change stock truth without full approval/accounting/reversal governance.
- `PUR-001`: purchase/supplier workflow lacks full lifecycle, returns/debit notes/reversals, and formal supplier payable reconciliation.
- `TRE-001`: treasury lacks cashbox/register/shift/opening/approval/reversal/variance-posting governance.
- `ACC-001`: local stored `Account.balance` materially diverges from posted journal-line calculated balances.
- `ACC-002`: no fiscal period close/lock or VAT filing workflow exists.
- `HRP-001`: payroll/attendance endpoints lack explicit payroll permission guards and operator/business authorization.
- `HRP-002`: payroll is only a draft/pay foundation, not a market payroll process.

Top P1 blockers:
- `INV-002`: generic inventory mutation paths unsafe for launch.
- `INV-003`: stock-audit completion can archive/reassign assets without complete approval/accounting/reversal.
- `PUR-002`: generic purchase-order mutation path unsafe.
- `PUR-003`: supplier payable reconciliation depends on source-document convention and needs GL comparison.
- `SAL-001`: posted invoice void/reversal/cancellation lifecycle missing.
- `SAL-002`: returns/exchanges/installment accounting policy needs accountant sign-off and browser QA.
- `TRE-002`: manual treasury account/type fallback can silently post to fallback accounts.
- `TRE-003`: closing lacks required frontend idempotency and variance posting/approval.
- `ACC-003`: source-document reversal/void coverage incomplete outside manual journals.
- `ACC-004`: party-level AR/AP reconciliation deferred.
- `HRP-003`: local DB has no Employee credentials, blocking Branch Account operational QA.
- `HRP-004`: payroll payment posts GL but no treasury cash movement/cashbox execution.
- `UI-001`: browser QA was not authorized/run, so runtime market readiness is unproven.
- `UI-002`: UI guards do not compensate for backend payroll/attendance route gaps.
- `UI-003`: selected-branch/localStorage/stock-audit scan behavior needs launch validation.

What appears strongest:
- POS checkout and sales posting have transactional server-side validation, idempotency, stock locks, GL/treasury/customer balance effects, and operator attribution.
- Returns, exchanges, installment collection, and official print/reprint have dedicated backend paths and operator policy, though accountant sign-off and browser evidence remain required.
- Manual accounting journal draft/post/reverse/cancel paths are safer than generic CRUD and are transaction/audit aware.
- Super Admin/Branch Account/Employee operator foundations from recent phases are present in source, with Super Admin broad UI permission and single verified Employee operator session behavior.
- Production data-source hardening prevents production API flows from silently falling back to mock/local data.

Recommended next implementation order:
1. Phase 35B — backend launch hardening: close payroll/attendance route permission gaps, treasury account/type validation, generic inventory/purchase mutation containment, and branch/report scope validation.
2. Phase 35C — accounting repair: rebuild/reconcile `Account.balance` from posted journal lines, add fiscal period close/lock/VAT workflow decision, and define source-document reversal policy.
3. Phase 35D — inventory and warehouse governance: warehouse/bin decision, stock adjustment approval/accounting, opening stock, stock count variance, transfer/stock-audit approval/reversal.
4. Phase 35E — purchase lifecycle: purchase draft/approval/partial receive/close, purchase returns/debit notes, supplier aging/reconciliation, supplier payment approval.
5. Phase 35F — treasury cash-control model: cashboxes/registers/shifts/opening/closing/variance posting/approval and bank identity.
6. Phase 35G — browser QA and UI stabilization after P0 backend/accounting blockers are resolved.

Audit evidence limitations:
- No package scripts, typecheck, lint, build, or verifier suite was run.
- No browser QA was run.
- No API write request was performed.
- No fixture was created.
- SELECT-only database inspection was limited to local Docker PostgreSQL `localhost:5433 / darfus_erp`.
- Production/Render was not contacted.
- This phase intentionally produced documentation only in `docs/AI_HANDOFF.md`.

Final safety intent:
- Leave only `docs/AI_HANDOFF.md` dirty as the authorized documentation handoff.
- Do not stage, commit, restore, clean, migrate, seed, test, or run verifiers in this phase.
- NEXT TOOL START HERE: after owner approval, start Phase 35B backend launch hardening from the P0/P1 blocker list above. First rerun the full repo safety pre-flight and confirm only `docs/AI_HANDOFF.md` is dirty from Phase 35A documentation.

# DARFUS Jewellery ERP — AI Handoff

This file is the handoff checkpoint for AI coding agents working on this repository.

Every agent must read this file before making changes and must preserve its purpose as the project handoff source of truth.

> **Phase 32.6-Fix D — Reservation Governance Closure (current):** Fully implemented, verified, and closed all remaining gaps in Phase 32.6-Fix D.
> Added a configurable warning setting `reservationExpiryWarningHours` (default 72) in settings service, validation rules in settings endpoints, and Settings Dashboard input UI.
> Strengthened `processApproachingExpiryNotifications` in reservation service to dynamically look up creator and specific roles (admin/manager), generating a single warning deduplicated format using `reservation.approaching_expiry:<companyId>:<reservationId>:<expiryEpoch>:<thresholdHours>:<recipientLabel>` eventKey, protected by DB unique index.
> Implemented comprehensive GL-vs-subledger reconciliation at `GET /reports/reservations/reconciliation`, dynamically validating the advances liability account, calculating expected liability, mapping posted journal lines per reservation, and classifying unattributable entries as `unsupported_legacy` with `investigationFlag: true`.
> Extended customer statement-v2 `reservationAdvances` section with complete payment lifecycle mapping (created, payments, renewal transfers in/out, completion, cancel/expiry refunds, renewal excess refunds, final status).
> Exposed custom search/status filters and details view enhancements in the Reservations list UI dashboard, including clickable predecessor/successor links and receipt printing triggers.
> Strengthened `verify-reservation-governance-reports-ui.js` with comprehensive local read-only live behavioral tests for deduplication, config warnings, GL balance math, 22 permissions checks via Express HTTP server simulation, 11 API smoke endpoint checks, reservationNumber formatting, unified Option A configuration_missing status assertions, and strict cleanup.
> All 45/45 static and behavioral live tests PASS. Working tree clean. 11 stashes untouched.
>
> **Phase 32.6-Reservation-Audit (docs-only):** audited current reservation implementation against
> approved RE-001. Current architecture is a legacy **single-asset** reservation shortcut:
> frontend `/sales/reservations` creates generic `/reservations` row, separately PATCHes asset
> status, and optionally creates a **deposit invoice** for the entered deposit. Backend has only
> generic CRUD (`setupCrud("reservations", models.Reservation, ...)`) and a minimal
> `reservations` table (`asset_id`, `customer_id`, `deposit`, `expires_at`, `status`). Local
> SELECT-only inspection of `darfus_erp` confirmed one reservation row and **0 linked payments /
> 0 linked journals**. Reusable foundations exist (postingService `postDepositEntry`, audit log
> hash chain, notification service, POS/final invoice posting, idempotency service), but RE-001
> reservation payment/accounting is **not implemented** and the visible flow is partially
> **conflicting**: no reservation items table, no multiple payments/receipts, no configured
> Customer Reservation Advances account, no reservation-bound final completion, no refund
> request/approval/execution, no expiry scheduler, no renewal/successor link, no granular
> reservation permissions/reports/statement section. Next recommended phase:
> **Phase 32.6-Fix A — Reservation Core Data Model & Atomic Accounting Foundation**.
>
> **Phase 32.5-Requirements-Delta (docs-only):** client requirement source grew from 27 → **30 files**
> (+3 docx: `9- Audit System`, `10 - Reports`, `11- Setting`; all 27 prior files SHA-256-unchanged;
> 28 unique content units). UAE e-invoicing docs remain absent (deferred). **Reservation decisions
> recorded APPROVED** via owner-supplied evidence **RE-001** (2026-07-10): reservation is an operational
> document (asset stays Reserved, remainder **not** posted to AR); multiple partial payments each with own
> receipt + journal (Dr Cash/Bank → Cr **Customer Reservation Advances**, Current Liabilities, **account
> code PENDING**); no edit/delete of payments (reverse/refund only); per-reservation expiry (no grace) →
> auto-cancel to Available + "Cancelled — Refund Pending" + notify; full refund on cancel (separate
> approve/execute permissions); renewal/repricing rules; **multi-item reservation amendment approved**
> (one/many items; add/remove/replace before final sale by authorized users; added items Reserved, removed/
> replaced items Available; totals/paid/remaining/excess recalculated; excess refunded before completion;
> prior payments immutable; final invoice includes only current reserved items; full audit trail required;
> this supersedes the earlier no-item-change rule); VAT-inclusive price, **no double VAT**, final VAT
> at the final sale invoice (configurable). **Implementation NOT started** — next phase is
> **Phase 32.6-Reservation-Audit**. Audit/Reports/Settings docs are largely internal-foundation/partial;
> nothing claimed implemented without code review. No application/DB/requirement-source changes.
>
> **Phase 32.5-Client-Confirmation-Hotfix (test-only):** fixed a stale scope guard in
> `scripts/verify-client-demo-data.js`. It previously diffed every future commit against
> the frozen Phase 32.4-Run-C baseline `02f870a` with a rigid allow-list, so the approved
> Phase 32.5 clarification docs (`docs/client-requirements/*`) produced a false failure
> (39/40). **Default mode now inspects only the current working tree** (never re-litigates
> committed history); the historical allow-list is enforced only when explicitly requested
> via `VERIFY_CLIENT_DEMO_SCOPE_BASELINE=<git-ref>` (invalid baseline → non-zero). Functional,
> static, and read-only live checks (`VERIFY_CLIENT_DEMO_LIVE=true` + `VERIFY_DATABASE_NAME`)
> are unchanged; live still fails if requested and skipped. Verifier count stays 40; result
> is now 40/40. No application, database, or requirement-file changes.

---

## 1. Project Identity

DARFUS Jewellery ERP.

Stack:
- Next.js frontend.
- Express / Sequelize backend.
- PostgreSQL.
- Redis / queues where configured.
- React Query / API repositories.
- Print system currently uses React templates rendered to static HTML and browser print.

Primary rule:
- Production/API mode source of truth is PostgreSQL/API, not localStorage/mock data.

---

## 2. Global Safety Rules

Before any work, always run:

```bash
git status --short
git stash list
git log --oneline -10
```

Rules:

* If working tree is dirty, stop and report files only.
* Never use `git reset`, `git restore`, `stash pop`, `stash apply`, or `stash drop` unless explicitly instructed by the user.
* Never run DB reset, seed, undo, destructive migrations, or production DB writes.
* Prefer surgical changes.
* One phase = one focused commit.
* Stop after the requested phase.
* Do not broaden scope.
* Do not silently fix unrelated issues.
* Do not touch stashes.

Financial/business safety:

* Backend financial truth must stay server-side.
* Frontend must not recalculate VAT, COGS, treasury balances, stock truth, payment truth, journal entries, or invoice posting truth.
* Print/UI layers may format and display values but must not mutate or become financial source of truth.
* No hardcoded company branding, TRN, address, logo, tax data, or customer data.

---

## 3. Current Confirmed HEAD

Latest confirmed functional HEAD before this handoff file:

```text
1af77ac fix: send invoice item ids for returns and exchanges
```

If the actual current HEAD differs, inspect `git log --oneline -10` and preserve the latest committed phase report.

---

## 4. Return / Exchange Work Completed

### Phase 18S — Backend line-level selection

Commit:

```text
dafb100 fix: select returned invoice items by line id
```

Backend changes:

* Returns optionally accepts `returnedInvoiceItemIds`.
* Exchanges optionally accepts `returnedInvoiceItemId`.
* Old contracts remain backward-compatible:

  * `returnedAssetIds`
  * `returnedAssetId`
* If invoice item IDs are supplied, backend selects the exact original `InvoiceItem.id`.
* If old asset IDs are supplied, backend falls back to previous assetId behavior.
* Financial logic, VAT, COGS, stock movements, and posting logic were not redesigned.
* Double guard remains conservative product-level by `assetId`.
* Full line-level return/exchange history requires future migration storing `originalInvoiceItemId`.

Verification reported green:

* duplicate product line return/exchange contract: 23/23
* return product support
* exchange product support
* mixed exchange items contract
* returns/exchange contract
* API contracts
* regressions
* typecheck/lint/build

---

### Phase 18T — Frontend sends InvoiceItem.id

Commit:

```text
1af77ac fix: send invoice item ids for returns and exchanges
```

Frontend changes:

* `InvoiceItem` type includes `id?: number`.
* Returns selection uses unique line keys.
* Returns sends `returnedInvoiceItemIds` when selected lines have IDs.
* Returns still sends `returnedAssetIds` fallback.
* Exchanges selection uses unique line keys.
* Exchanges sends `returnedInvoiceItemId` when selected returned line has ID.
* Exchanges still sends `returnedAssetId` fallback.
* No financial payload fields are sent.
* Backend was untouched.

Verification reported green:

* typecheck
* lint on modified files
* build
* backend sanity:

  * duplicate-lines contract 23/23
  * mixed-items 39/39
  * exchange product support 26/26
  * return product support 20/20
  * API contracts 8/8

Remaining:

* Browser QA Network inspection for duplicate PRD-ID lines if not already done.
* Full line-level history still deferred.

---

## 5. Print System Work

---

### 🔖 Print Template Track — Transfer Checkpoint (through Phase 19T)

Read this block first. It is the transfer-ready summary of the invoice print
template track. Per-phase detail (19A–19T) follows below.

**Latest approved commit:** `19a79e1 fix: localize invoice print labels by language mode`

**Completed phases (invoice print track):**

| Phase | Commit | What shipped |
| --- | --- | --- |
| 19A | (discovery, no commit) | Print system discovery — found `InvoicePrintTemplate.tsx`, `print-config.ts`, iframe + `window.print()` flow; recommended a ViewModel before CSS. |
| 19B | `060fc43 feat: add invoice print view model` | `InvoicePrintViewModel` + `buildInvoicePrintViewModel` + dynamic title helper + `scripts/verify-invoice-print-view-model.js`. |
| 19C / 19C-REV / 19C-FIX / 19C-ALIGN | `f04ccb0`, `4ed279f`, `8ba51a8`, `5253daf` | Luxury Gold A4 bilingual template + reference match + one-page fit + layout alignment. |
| 19D-CLEAN | `5c7a740 refactor: stabilize invoice print template` | Template cleanup + `features/printing/lib/print-template-config.ts` (types + defaults, groundwork). |
| 19E | `71a03c0 feat: wire invoice print template config` | Runtime config wiring: theme CSS vars + section/field visibility + language mode from config; `resolveInvoicePrintTemplateConfig`. |
| 19F | `725dc59 feat: add invoice print options dialog` | Print options dialog on `/sales` (Document Type / Template / Language). Defaults Auto / Luxury Gold / Bilingual. Display-only `documentTitleOverride`. |
| 19G | `5f5c8f2 feat: persist invoice print defaults` | Persist defaults via `PUT /settings/by-key/printTemplateDefaults` (value `{ documentMode, templateId, languageMode }`); read from raw `settings.printTemplateDefaults`; Settings UI section "طباعة الفاتورة الافتراضية". NOT `PATCH /settings`. |
| 19H | `117bdbd feat: add compact invoice print template` | Real Compact A4 template + `InvoiceDocument.tsx` selector. |
| 19I | `bcbb917 feat: add minimal invoice print template` | Real Minimal A4 template (id `minimal`, replaced never-real `minimalA4` placeholder). |
| 19J | `d253313 feat: add thermal invoice print template` | Real Thermal receipt-style template (id `thermal`, replaced never-real `thermalReceipt` placeholder). All four templates enabled. |
| 19J handoff | `43b352a docs: update print template handoff through 19J` | Transfer checkpoint for phases 19A-19J. |
| 19K-Fix | `7488ec0 fix: harden invoice print template browser output` | Replaced Compact/Minimal/Thermal semantic headers with print-safe sections; mapped Thermal to 80mm paper and Luxury/Compact/Minimal to A4. |
| 19L-Fix | `e6a9b7e fix: allow luxury invoice print pagination` | Replaced Luxury fixed height/max-height with `min-height`, removed outer clipping, and allowed long Luxury invoices to paginate. |
| 19M-Fix | `19a79e1 fix: localize invoice print labels by language mode` | Added localized print label helper and expanded label language-mode coverage across Luxury/Compact/Minimal/Thermal. |
| 19N | (audit, no commit) | Manual browser print acceptance audit. No Critical/High findings; native print preview/iframe capture and real thermal roll behaviour remain partially/unverified. |
| 19O | (audit, no commit) | Print export test setup audit. `npm run test:print-export` currently fails because `tests/export-print.spec.ts` and the `tests/` directory are missing. |
| 19O-Fix | `test: add invoice print export smoke coverage` | Added `tests/export-print.spec.ts` + test fixture page `app/test/print-export/page.tsx`. `npm run test:print-export` now passes (11 tests). Covers all 4 templates × 3 language modes + invalid fallback. No native print preview. |
| 19Q | `feat: add invoice print builder config schema` | Created `print-builder-config.ts` defining strict Zod schema for builder settings, defaults, validation/stripping, and fallback/merge helpers. Added `useInvoicePrintBuilderConfig` storage hook. Mapped to `invoicePrintBuilderConfig` settings key via generic PUT endpoint. Mapped new verification script. No UI yet. |
| 19R | `feat: add invoice print builder toggle UI` | Added a Settings UI panel/tab "Print Builder" to edit section & field visibility overrides per template, with save/reset and warnings. Integrated overrides into `InvoiceDocument` render gateway. |
| 19S | `feat: add invoice print builder preview` | Extracted mock print data to `invoice-print-fixture.ts` and added a Live Print Preview panel to the Print Builder UI. Renders dynamic changes instantly on the client using mock data via `InvoiceDocument`. Added a preview language switcher. |
| 19T | `feat: add invoice print builder theme presets` | Added pre-defined Theme Presets (`classicGold`, `modernDark`, `softGold`, `minimalGray`, `thermalMono`) to Print Builder config schema, settings page dropdown selector, and dynamic stylesheets inside InvoiceDocument. |

**Current source of truth**

Template IDs (`features/printing/lib/invoice-print-options.ts` → `InvoicePrintTemplateId`):

```ts
"luxuryGold" | "compactA4" | "minimal" | "thermal"
```

Selector — `features/printing/components/InvoiceDocument.tsx`:

```ts
compactA4 -> CompactInvoicePrintTemplate
minimal   -> MinimalInvoicePrintTemplate
thermal   -> ThermalInvoicePrintTemplate
default   -> InvoicePrintTemplate   // Luxury Gold; also the unknown/missing fallback
```

Template components (`features/printing/components/`):

* `InvoicePrintTemplate.tsx` — Luxury Gold A4 (exports `InvoicePrintTemplateProps`, the shared props type).
* `CompactInvoicePrintTemplate.tsx` — Compact A4.
* `MinimalInvoicePrintTemplate.tsx` — Minimal A4.
* `ThermalInvoicePrintTemplate.tsx` — Thermal (~80mm, monochrome).
* `LocalizedPrintLabel.tsx` — reusable label-only localization helper (`LocalizedPrintLabel`, `formatLocalizedText`).
* `InvoiceDocument.tsx` — renderer selector (single entry point used by `/sales`).

Shared print layer:

* Data source: `features/printing/lib/invoice-print-view-model.ts` (`buildInvoicePrintViewModel`). All templates render ViewModel values only.
* Config: `features/printing/lib/print-template-config.ts` (`resolveInvoicePrintTemplateConfig`, `shouldShowArabic/English`, theme/section/field defaults).
* Options + persistence helpers: `features/printing/lib/invoice-print-options.ts` (`getDefaultInvoicePrintOptions`, `sanitizePrintTemplateDefaults`, `buildTemplateConfigFromPrintOptions`, `getPrintDocumentTitleOverride`).
* Dialog: `features/printing/components/InvoicePrintOptionsDialog.tsx` (all four templates enabled; no disabled placeholders remain).
* Defaults hook: `hooks/use-print-template-defaults.ts`.
* Callers: `app/[locale]/(dashboard)/sales/page.tsx` (print), `app/[locale]/(dashboard)/settings/page.tsx` (defaults UI, in the Receipt Layout tab).

Print defaults settings key: `printTemplateDefaults`

* Saved through: `PUT /settings/by-key/printTemplateDefaults` with body `{ value: { documentMode, templateId, languageMode } }`.
* Read from: raw settings map `settings.printTemplateDefaults` (via `GET /settings` → `data.settings`), then `sanitizePrintTemplateDefaults`.
* **Do NOT use** `PATCH /settings` for this key (its whitelist does not include it).

Fallback defaults (`getDefaultInvoicePrintOptions()`):

```ts
{ documentMode: "auto", templateId: "luxuryGold", languageMode: "bilingual" }
```

An invalid/unknown saved `templateId` sanitizes to `luxuryGold`; an unknown id at render also falls back to Luxury Gold via the selector.

**Safety state (19F → 19O-Fix):**

* Backend untouched throughout this print-template track. No DB schema changes, no migrations, no API changes.
* No invoice financial recalculation; no ViewModel calculation changes after print ViewModel stabilization.
* No posting/payment/stock/accounting/treasury/POS changes.
* No `localStorage` persistence; no PDF generator; no Search & Print; no Builder UI.
* Stashes were not touched. `next-env.d.ts` clean. Working tree was clean before this docs update.

**Checks passed (latest Phase 19M-Fix / audits):**

* `npm run typecheck` — clean.
* lint — passed with existing warnings only. Expected static-print `<img>` warnings only (each template renders the company logo via a raw `<img>`; `next/image` cannot be used in `renderToStaticMarkup` print HTML). No errors.
* `npm run build` — succeeded.
* `node scripts/verify-invoice-print-view-model.js` — ok.
* `node scripts/verify-print-template-config.js` — ok.
* financial-safety grep on changed print/settings files — clean.
* `npm run test:print-export` — ✅ passes (11 tests, added in 19O-Fix).

**Remaining gaps:**

* Native print preview/manual browser QA is still recommended.
* Real thermal printer / 80mm roll behavior still needs manual QA.
* All four templates are fixed layouts — no Print Template Builder UI yet.
* PDF generator not started.
* Search & Print not started.
* Backend read-only print-field exposure audit still pending.
* Document-type list remains the 19F set (expansion is a separate product decision).
* Legacy `features/printing/components/ReceiptPrintTemplate.tsx` retains an old `invoice.subtotal ?? items.reduce(...)` display fallback (untouched; predates 19x).

**Next recommended phase:** `Print Template Builder UI` (or other print track work)

* 19O-Fix is complete; all smoke tests pass.
* Builder UI has not been started.
* Do not start Builder UI, PDF generator, Search & Print, or document type expansion without a dedicated phase.

---

### Phase 19A — Invoice Print System Discovery

Status:

* Completed as read-only discovery.
* No files modified.
* No commit.
* No DB needed.

Key findings:

* Existing invoice print template:

  * `features/printing/components/InvoicePrintTemplate.tsx`
* Current invoice print is mainly used from:

  * `app/[locale]/(dashboard)/sales/page.tsx`
* Other print templates:

  * `features/printing/components/ReceiptPrintTemplate.tsx`
  * `features/printing/components/BarcodePrintTemplate.tsx`
  * `features/printing/components/ReportPrintTemplate.tsx`
* Print rendering flow:

  * React template to static HTML.
  * Hidden iframe.
  * browser `window.print()`.
* No real PDF generator currently.
* `lib/print/print-config.ts` contains print CSS, `@page`, print media, direction, and table behavior.
* Current invoice template is simple and raw `Invoice`-based.
* There is no dedicated `InvoicePrintViewModel`.
* Document title is not sufficiently dynamic by invoice type.
* Search & Print as a unified independent layer is not implemented.
* Current `/sales` print does not cover the complete documented invoice universe.
* Payments/customer/branch/company/installment details are not fully available in generic invoice detail.
* Gift Voucher and Customer Gold Purchase are not fully represented in current invoice print model.
* Do not start luxury CSS directly before creating a safe ViewModel.

Client documentation says print/search should support these Sales-domain document types:

* Sales Invoice.
* Return Invoice.
* Exchange Invoice.
* Installments Invoice.
* Deposit Invoice.
* Gift Voucher Invoice.
* Customer Gold Purchase Invoice.
* Invoices Search & Print.

Design reference:

* Luxury bilingual Arabic/English A4 invoice.
* Gold visual style.
* Logo/watermark.
* TRN.
* Client details.
* Invoice details.
* Items table.
* Payment method box.
* Amount details box.
* Notes.
* Customer signature.
* Company stamp.
* Salesperson signature.
* Footer with contact details.

Important 19A conclusion:

* The next safe phase is 19B — Invoice Print ViewModel.
* Do not implement CSS/template first.

---

### Phase 19B — Invoice Print ViewModel

Commit:

```text
060fc43 feat: add invoice print view model
```

Status:

* Completed.
* Frontend-only.
* No backend changes.
* No DB reads/writes.
* No migrations.

Files added:

* `features/printing/lib/invoice-print-view-model.ts`
* `scripts/verify-invoice-print-view-model.js`

Key result:

* Added `InvoicePrintViewModel` types.
* Added `buildInvoicePrintViewModel`.
* Added dynamic document title helper for sales/tax/return/exchange/installment/deposit/gift voucher/customer gold purchase.
* Totals map from invoice fields only.
* Line VAT/line total are not invented; missing data creates warnings.
* Company branding is mapped from settings/company options only.
* Verification script confirms titles, warnings, and no client-side financial truth recalculation.

---

### Phase 19C — Luxury Bilingual A4 Template

Commit:

```text
feat: add luxury invoice print template
```

Status:

* Completed.
* Frontend-only.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Existing invoice print entrypoint remains compatible with `/sales`.
* `InvoicePrintTemplate` now builds/accepts `InvoicePrintViewModel`.
* Template renders a luxury bilingual Arabic/English A4-style invoice.
* Added gold borders, logo/initial fallback, watermark, company header, TRN display, client details, invoice details, items table, payment method box, amount details box, notes, signatures, and footer.
* Document title comes from the ViewModel, not a fixed title.
* Special sections render only available ViewModel data for exchange/installments/deposit/gift voucher/customer gold purchase.
* Warnings remain internal and are not printed for customers.
* The template formats totals from `viewModel.totals`; it does not recalculate VAT, subtotal, total, payments, stock, posting, or customer balances.

Remaining:

* Browser print preview visual QA should be performed with real sample invoices.
* Backend may later need read-only print fields for richer company/customer/branch/payment/installment data.
* Unified Search & Print route remains deferred.
* Special invoice type wiring remains deferred.

---

### Phase 19C-REV — Match Final Invoice Reference Image

Commit:

```text
style: match invoice print reference
```

Status:

* Completed.
* Frontend-only visual refinement.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Refined the luxury invoice template to more closely match the final client reference image.
* Header is now centered and brand-led, with a dynamic primary brand line and secondary line derived from company data.
* Gold double border, decorative corners, central ornament, watermark placement, client/invoice boxes, table styling, payment/amount boxes, notes, signatures, and footer contact bar were tuned closer to the reference.
* Template still uses `InvoicePrintViewModel`.
* All company/customer/document/payment/totals data remains dynamic.
* No hardcoded DARFUS, TRN, phone, email, address, invoice number, or customer data.
* No VAT, subtotal, total, payment, stock, posting, or customer balance recalculation.
* CSS variables were added inside the template to keep future settings integration straightforward.

Remaining:

* Browser print preview QA with real sample invoices is still recommended.
* Settings UI for print branding/style remains deferred.
* Special invoice type wiring remains deferred.

---

### Phase 19C-FIX — One Page Print Fit + Header Visibility

Commit:

```text
fix: fit invoice print to one page
```

Status:

* Completed.
* Frontend-only print CSS/layout hotfix.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Added template-local A4 `@page` sizing with zero print margin.
* Set the invoice page to `210mm x 297mm` and compacted header, detail boxes, table rows, notes, signatures, and footer spacing so normal invoices fit one A4 page.
* Fixed company EN/AR name visibility with safe dynamic fallbacks from ViewModel/company data.
* Centered company/document title/TRN stack independently of the logo.
* Kept the current print button/API compatible.
* No hardcoded company/customer/invoice data.
* No VAT, subtotal, total, payment, stock, posting, or customer balance recalculation.

Remaining:

* Very long invoices still need a future multi-page/page-break pass.
* Browser print preview QA with real sample invoices remains recommended.
* Print settings UI remains deferred.

---

### Phase 19C-ALIGN — Exact Reference Layout Alignment

Commit:

```text
style: align invoice print layout
```

Status:

* Completed.
* Frontend-only visual/layout alignment.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Fixed print header visibility by avoiding the semantic `header` element hidden by global print CSS.
* Set the invoice template visual layout to LTR while isolating Arabic text with RTL spans.
* Restored large centered company/document title/TRN header.
* Fixed visual order for Client Details left and Invoice Details right.
* Fixed visual table column order to match the reference image.
* Fixed Payment Method left and Amount Details right.
* Moved notes/signatures/footer into a bottom tail area to use the page height more like the reference.
* Preserved one-page A4 sizing for normal invoices.
* No hardcoded company/customer/invoice data.
* No VAT, subtotal, total, payment, stock, posting, or customer balance recalculation.

Remaining:

* Final approval still needs browser print preview QA against real sample invoices.
* Very long invoices still need a future controlled multi-page/page-break pass.
* Print settings UI remains deferred.

---

### Phase 19D-CLEAN — Print System Stabilization Before Builder

Commit:

```text
refactor: stabilize invoice print template
```

Status:

* Completed.
* Frontend-only print module cleanup.
* No backend, no DB, no migrations, no API contract changes, no financial/business logic.
* No settings UI, no template builder UI, no drag & drop, no PDF generator, no Search & Print route.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `features/printing/lib/print-template-config.ts` (new — types + defaults only)
* `docs/AI_HANDOFF.md`

Audit result (no critical issues found):

* Template is already financial-safe: only formats/displays `viewModel` values via `money()`/`text()`; no `items.reduce`, `calculateVat`, `subtotal =`, `total =`, `tax =`.
* ViewModel does not invent line financials (line net/vat/total stay `undefined` → render as `—`).
* Layout is LTR with isolated Arabic (`.luxury-ar` spans), per 19C-ALIGN — not global RTL.
* No hardcoded company/customer/invoice/TRN data; all dynamic with `—` fallbacks.
* No conflicting/duplicate CSS selectors of concern; A4 one-page sizing intact.

What was cleaned:

* Made the "Original Invoice Ref" detail row conditional so normal sales invoices no longer show an empty `—` row (return/exchange still show it).
* Removed dead `getBrandDisplay` second parameter (`englishName`) that was never passed.

Defaults / config shape extracted:

* Added `features/printing/lib/print-template-config.ts` with TYPES + SAFE DEFAULTS only:
  * `PrintTemplateLanguageMode`, `PrintTemplatePaperSize`, `PrintTemplateFieldVisibility`, `PrintTemplateSectionConfig`, `PrintTemplateThemeConfig`, `PrintTemplateConfig`.
  * `DEFAULT_PRINT_TEMPLATE_THEME/SECTIONS/FIELDS/CONFIG` (theme mirrors current luxury gold palette).
* Intentionally NOT wired to settings/backend/DB or the current render path — groundwork only for the future builder.

Preserved:

* A4 one-page behavior for normal invoices (template-local `@page` + sizing untouched).
* Layout direction (LTR + isolated Arabic).
* Dynamic data / `InvoicePrintViewModel` (still the single display source).
* No financial recalculation.
* Old print button/API compatibility (`InvoicePrintTemplate` props `invoice/company/cashierName/locale/labels/settings/viewModel` unchanged; caller `app/[locale]/(dashboard)/sales/page.tsx` untouched).

Verification reported green:

* typecheck
* lint on changed files: 0 errors, 2 pre-existing `<img>` warnings (watermark/logo — intentional for static print HTML; `next/image` cannot be used in `renderToStaticMarkup`).
* build
* `node scripts/verify-invoice-print-view-model.js` → ok
* financial-safety grep on template + `features/printing/lib` → no financial recalculation

Remaining gaps:

* `InvoicePrintLabels` still carries ~22 fields of which only `trn` + `assetId` are used by the template; kept intact because it is the caller's compatibility contract (caller out of this phase's scope).
* Browser print-preview QA with real sample invoices still recommended.
* Line-level net/VAT/total remain unavailable from backend (do not invent).
* Payments/customer phone-TRN-address/installment schedule still not in generic invoice detail (backend read-only exposure needed later).
* Unified Search & Print route, special-type wiring, and the print builder/settings UI remain deferred.

Next suggested phase:

* Print Template Config / Builder groundwork can now build on `print-template-config.ts`; OR proceed with `19D — Wire Sales / Return / Exchange Print Data` (read-only wiring). Keep print read-only; no financial recalculation.

---

### Phase 19E — Print Template Config Runtime Wiring

Commit:

```text
feat: wire invoice print template config
```

Status:

* Completed.
* Frontend-only print config runtime wiring.
* No backend, no DB, no migrations, no API contract changes, no financial/business logic.
* No settings UI, no template builder UI, no drag & drop, no print dialog, no PDF generator, no Search & Print route.

Files changed:

* `features/printing/lib/print-template-config.ts` (resolver + language helpers + a few non-critical toggle fields + `watermarkOpacity`)
* `features/printing/components/InvoicePrintTemplate.tsx` (reads a resolved config)
* `scripts/verify-print-template-config.js` (new)
* `docs/AI_HANDOFF.md`

Config resolver added:

* `resolveInvoicePrintTemplateConfig(overrides?)` — dependency-free per-group shallow merge onto `DEFAULT_PRINT_TEMPLATE_CONFIG`; `null`/`undefined`/missing overrides never break the template (returns the exact current default look).
* `PrintTemplateConfigOverrides` type allows partial nested overrides (tweak one color/toggle without restating the config).
* `shouldShowArabic` / `shouldShowEnglish` language-mode helpers.
* Extended (additive, defaults true / current values): `theme.watermarkOpacity` (0.04) and fields `itemAssetId`, `originalInvoiceRef`, `footerPhone`, `footerEmail`, `footerAddress`.

Template wiring (defaults preserve the exact current look):

* `InvoicePrintTemplate` accepts an optional `templateConfig?: PrintTemplateConfigOverrides` (also reads `settings.printTemplateConfig` via a safe typed access); resolves to a full config via the resolver.
* Theme: `--invoice-*` CSS variables + `--invoice-watermark-opacity` are now set from `config.theme` on the root article `style` (defaults equal the previous hardcoded palette, so no visual change).
* Section visibility wired for: header, clientDetails, invoiceDetails, itemsTable, specialSummary, paymentMethod, amountDetails, notes, terms, signatures, footer.
* Field visibility wired (non-critical only): companyLogo, companyTrn, watermark, customerPhone, customerTrn, customerAddress, salesperson, originalInvoiceRef, itemAssetId, footerPhone/Email/Address. Legal/core fields (invoice no./date, totals, VAT, TRN default) stay on by default.
* Language mode foundation: `shouldShowArabic/English` applied to the main document title and brand AR/EN lines only; bilingual (default) shows both = unchanged. Full per-label language mode deferred to the builder/UI phase.
* Watermark: gated by `fields.watermark` with opacity from `theme.watermarkOpacity`; watermark source stays the company logo (ViewModel). Background image config intentionally not added/wired (A4 risk) — deferred.
* Icons: footer still uses the existing inline unicode glyphs; no icon dependency added — icon config deferred to the UI phase.

Preserved:

* Default visual behavior (no `templateConfig` → identical output).
* Old print button/API compatibility (all previous props still work; caller `app/[locale]/(dashboard)/sales/page.tsx` untouched).
* `InvoicePrintViewModel` remains the single display source; no new API calls.
* No hardcoded company/customer/invoice/TRN data.
* No financial recalculation (grep on template + `features/printing/lib` clean).

Verification reported green:

* typecheck
* lint on changed files: 0 errors, 2 pre-existing `<img>` warnings (watermark/logo — static print HTML).
* build
* `node scripts/verify-invoice-print-view-model.js` → ok
* `node scripts/verify-print-template-config.js` → ok (defaults complete, partial merge correct, language helpers correct)
* financial-safety grep → clean

Remaining gaps:

* No settings UI / builder UI / persistence yet — `templateConfig` is accepted but nothing supplies overrides in production (defaults only).
* Full per-label language mode (box titles/detail labels) still bilingual; deferred.
* Background image + configurable icons deferred.
* Backend read-only exposure of payments/customer/branch/installment print fields still pending (unchanged from 19A/19C).

Next suggested phase:

* Print Template Builder / Settings UI to produce `PrintTemplateConfigOverrides` (and later persist them), OR `19D — Wire Sales / Return / Exchange Print Data`. Keep print read-only.

---

### Phase 19F — Print Dialog & Template Selection

Commit:

```text
feat: add invoice print options dialog
```

Status:

* Completed.
* Frontend-only print options dialog.
* No backend, no DB, no migrations, no API contract changes.
* No settings persistence (no DB / no localStorage), no builder UI, no drag & drop, no PDF generator, no Search & Print route.
* No financial/business logic.

Files changed/added:

* `features/printing/lib/invoice-print-options.ts` (new — options model + helpers)
* `features/printing/components/InvoicePrintOptionsDialog.tsx` (new — dialog UI)
* `features/printing/components/InvoicePrintTemplate.tsx` (optional `documentTitleOverride` prop, display-only)
* `app/[locale]/(dashboard)/sales/page.tsx` (print button opens the dialog; print flow passes options)
* `docs/AI_HANDOFF.md`

Print Dialog:

* Clicking Print in the invoice detail modal on `/sales` now opens `InvoicePrintOptionsDialog` instead of printing immediately.
* Options: Document Type (Auto + 8 manual types), Template (Luxury Gold A4 active; Compact/Minimal/Thermal shown disabled "Coming soon"), Language Mode (Bilingual/Arabic/English).
* Defaults: Auto + Luxury Gold + Bilingual (printing with defaults = identical output to before).
* Built with existing `Modal`/`NativeSelect`/`Button` components; bilingual inline labels; no new dependencies; no new i18n keys.

Document Type status — WIRED (title-only):

* `getPrintDocumentTitleOverride(mode)` returns display titles mirroring the ViewModel wording; template applies it to the printed header title + the "Invoice Type" detail row only.
* It never changes invoice type, items, totals, VAT, or stored data. `auto` (default) keeps ViewModel behaviour.
* `printModeMatchesInvoice` powers a non-blocking advisory warning in the dialog when the chosen type doesn't match the invoice's stored type.

templateConfig passing:

* `buildTemplateConfigFromPrintOptions(options)` → `{ languageMode }` passed as `templateConfig` (19E wiring), so Arabic/English/Bilingual affects titles + brand lines exactly as 19E defined.
* `printInvoice(invoice, options?)` keeps direct-print compatibility — calling with no options uses `getDefaultInvoicePrintOptions()`.

Preserved / safety:

* Old template props all optional/unchanged; template works with no `templateConfig`/`documentTitleOverride`.
* `InvoicePrintViewModel` remains the single display source; no new API calls; no hardcoded company/customer/invoice data (dialog labels are generic document-type wording only).
* No financial recalculation (grep clean on dialog/options/template/sales print path).

Verification reported green:

* typecheck
* lint on changed files: 0 errors; 2 pre-existing `<img>` warnings (template watermark/logo).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep → clean for 19F files. NOTE (pre-existing, untouched): `ReceiptPrintTemplate.tsx` line ~57 has an old display fallback `invoice.subtotal ?? items.reduce(...)` from the legacy receipt template — predates the 19x series; flag for a future receipt-template cleanup phase.

Remaining gaps:

* Options are per-print only — no persistence (deferred to a settings/persistence phase).
* Only one real template; Compact/Minimal/Thermal are placeholders.
* Language mode still title/brand-level only (full per-label mode deferred).
* Legacy receipt template retains its old subtotal display fallback (see note above).
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Template Config persistence / Settings UI, or Print Template Builder UI, or additional templates (Compact A4). Keep print read-only.

---

### Phase 19G — Persist Invoice Print Defaults

Commit:

```text
feat: persist invoice print defaults
```

Status:

* Completed (audit + implementation, both approved).
* Frontend-only. NO backend routes/models/migrations. NO `PATCH /settings` whitelist change. NO DB schema change.
* Persistence reuses the existing generic setting store; no localStorage / no hidden fallback persistence.

Audit result (D): Safe to implement without DB/API change — the `settings` table is a JSONB key/value store, `GET /settings` returns the full raw map (`data.settings`), and `PUT /settings/by-key/:key` accepts any key with arbitrary JSONB value (no whitelist). Product decision (per user): keep the exact 19F document-type list; do NOT adopt the audit prompt's alternative list.

Files changed/added:

* `features/printing/lib/invoice-print-options.ts` — `sanitizePrintTemplateDefaults(raw)` validates an untrusted value against the 19F enums (documentMode/templateId/languageMode), falling back to Auto / Luxury Gold / Bilingual.
* `hooks/use-print-template-defaults.ts` (new) — reads `settings.printTemplateDefaults` (sanitized) and saves via `PUT /settings/by-key/printTemplateDefaults` with `{ value }`, then `refreshSettings()`.
* `contexts/settings-context.tsx` — added `printTemplateDefaults?: { documentMode; templateId; languageMode }` to `AppSettings` and to the JSON-parse keys read from the raw settings map (read-only; save path is the by-key route, so no PATCH whitelist edit).
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — new optional `initialOptions` prop; the dialog seeds from it (falls back to 19F defaults).
* `app/[locale]/(dashboard)/sales/page.tsx` — reads saved defaults via the hook; passes `initialOptions={savedPrintDefaults}` to the dialog; `printInvoice(invoice, options = savedPrintDefaults)` stays direct-print compatible.
* `app/[locale]/(dashboard)/settings/page.tsx` — new "Invoice Print Defaults" card in the existing Receipt Layout tab: Document Type / Template / Language selects + Save (mirrors the receipt section's raw-select pattern; existing components only).
* `docs/AI_HANDOFF.md`.

Persistence contract:

* Key: `printTemplateDefaults`. Value: `{ documentMode: string; templateId: string; languageMode: string }`.
* Read: raw settings map → sanitize → fallback to 19F defaults.
* Write: `PUT /settings/by-key/printTemplateDefaults` `{ value: sanitized }` → `refreshSettings()` (the settings context is useState-backed, refreshed via GET /settings; SSE `Settings` event also fires).

Preserved / safety:

* No saved value → identical 19F behaviour (Auto / Luxury Gold / Bilingual).
* Direct `printInvoice(invoice)` still works; dialog still optional.
* Values sanitized against enums before both read-use and save (the by-key route stores arbitrary JSON, so the frontend guards).
* No financial/business logic; no invoice/posting/payment/stock/treasury/accounting change; no hardcoded company/customer/invoice data.

Verification reported green:

* typecheck
* lint on changed files: 0 errors; warnings are all pre-existing/unrelated (settings logo `<img>`, `isAuthenticated` dep in existing settings-context callbacks).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on changed print/settings files → clean

Remaining gaps:

* Document-type list intentionally still the 19F set (the audit-prompt list — Simplified Tax / Proforma / Quotation / Delivery / Credit / Debit Note — is a separate product decision, not implemented).
* Still one real template (Compact/Minimal/Thermal are placeholders).
* Language mode remains title/brand-level (full per-label mode deferred).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Real Compact A4 template, or Print Template Builder UI, or expand document-type list (needs product sign-off). Keep print read-only.

---

### Phase 19H — Real Compact A4 Invoice Template

Commit:

```text
feat: add compact invoice print template
```

Status:

* Completed. Frontend-only.
* No backend/DB/migrations/API changes; no settings persistence logic change (only reads existing `templateId`); no localStorage/PDF/Search & Print/Builder UI.
* No financial/business logic; no invoice/posting/payment/stock/accounting change.

Template IDs (unchanged convention — camelCase; NOT the audit prompt's hyphenated examples):

* `luxuryGold` → existing Luxury Gold A4 (unchanged output).
* `compactA4` → new Compact A4 template.
* invalid/missing → falls back to `luxuryGold` (via `sanitizePrintTemplateDefaults` for saved values, and via the renderer selector at render time).

Files changed/added:

* `features/printing/components/CompactInvoicePrintTemplate.tsx` (new) — dense A4 template. Same props as Luxury (`InvoicePrintTemplateProps`), same `InvoicePrintViewModel` data source, honours `templateConfig` (theme/language/sections/fields) and `documentTitleOverride`. Smaller header, dense meta grid, compact items table + totals, minimal decoration. No `items.reduce`/VAT/subtotal/total math — ViewModel values only.
* `features/printing/components/InvoiceDocument.tsx` (new) — renderer selector: `templateId === "compactA4"` → Compact, else (luxuryGold/unknown) → Luxury.
* `features/printing/components/InvoicePrintTemplate.tsx` — exported `InvoicePrintTemplateProps` only (no output/behaviour change).
* `features/printing/lib/invoice-print-options.ts` — `InvoicePrintTemplateId = "luxuryGold" | "compactA4"`; `compactA4` added to `ALLOWED_TEMPLATE_IDS` (sanitize still falls back to luxuryGold for invalid).
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — Compact A4 enabled (Minimal/Thermal still disabled placeholders).
* `app/[locale]/(dashboard)/sales/page.tsx` — prints via `<InvoiceDocument templateId={options.templateId} .../>` instead of the Luxury template directly.
* `app/[locale]/(dashboard)/settings/page.tsx` — Compact A4 added to the Template select.
* `docs/AI_HANDOFF.md`.

Selection / persistence behaviour:

* Print dialog and settings both offer Luxury Gold + Compact A4 (enabled); Minimal/Thermal remain "Coming soon" disabled.
* A saved `printTemplateDefaults.templateId = "compactA4"` opens the dialog with Compact selected and prints Compact.
* An invalid/old saved value sanitizes to `luxuryGold`.

Compatibility:

* `printInvoice(invoice)` with no options → saved defaults (or 19F defaults) → Luxury Gold + Auto + Bilingual when nothing saved.
* Luxury Gold rendering unchanged.
* No saved settings → identical previous behaviour.
* Direct print calls do not crash; unknown templateId → Luxury.

Verification reported green:

* typecheck
* lint on changed files: 0 errors; only pre-existing/expected `<img>` warnings (settings logo preview + Compact/Luxury print logos — static print HTML can't use `next/image`).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on Compact template + selector → clean

Remaining gaps:

* Minimal A4 / Thermal Receipt still placeholders.
* Compact honours language/title/theme/section/field config but is a fixed dense layout (no per-user layout builder).
* Document-type list still the 19F set (expansion is a separate product decision).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Print Template Builder UI, or a third template (Minimal A4), or backend read-only print-field exposure. Keep print read-only.

---

### Phase 19I — Real Minimal A4 Invoice Template

Commit:

```text
feat: add minimal invoice print template
```

Status:

* Completed. Frontend-only.
* No backend/DB/migrations/API changes; no settings-persistence architecture change (only reads existing `templateId`); no localStorage/PDF/Search & Print/Builder UI.
* No financial/business logic; no invoice/posting/payment/stock/accounting change.

Template IDs (camelCase convention preserved):

* `luxuryGold` → Luxury Gold A4 (unchanged).
* `compactA4` → Compact A4 (unchanged).
* `minimal` → new Minimal A4 template. (Replaced the old disabled `minimalA4` placeholder value, which was never a real allowed id.)
* `thermalReceipt` → still a disabled placeholder.
* invalid/missing → falls back to `luxuryGold` (sanitize for saved values + selector at render).

Files changed/added:

* `features/printing/components/MinimalInvoicePrintTemplate.tsx` (new) — clean, white, spacious A4 layout (more spacious than Compact, less ornate than Luxury). Same `InvoicePrintTemplateProps` + same `InvoicePrintViewModel`; honours `templateConfig` (theme/language/sections/fields) and `documentTitleOverride`. No `items.reduce`/VAT/subtotal/total math — ViewModel values only.
* `features/printing/components/InvoiceDocument.tsx` — selector now: `compactA4` → Compact, `minimal` → Minimal, else (luxuryGold/unknown) → Luxury.
* `features/printing/lib/invoice-print-options.ts` — `InvoicePrintTemplateId` adds `"minimal"`; `minimal` added to `ALLOWED_TEMPLATE_IDS`.
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — Minimal A4 enabled (value `minimal`); Thermal still disabled placeholder.
* `app/[locale]/(dashboard)/settings/page.tsx` — Minimal A4 added to the Template select.
* `docs/AI_HANDOFF.md`.
* (sales/page.tsx unchanged — it already renders via `<InvoiceDocument templateId={options.templateId} .../>`.)

Selection / persistence behaviour:

* Print dialog and settings both offer Luxury Gold + Compact A4 + Minimal A4 (enabled); Thermal remains "Coming soon" disabled.
* A saved `printTemplateDefaults.templateId = "minimal"` opens the dialog with Minimal selected and prints Minimal. `compactA4`/`luxuryGold` still work. Invalid → luxuryGold.

Compatibility:

* `printInvoice(invoice)` with no options → saved defaults (or 19F defaults) → Luxury Gold when nothing saved.
* Luxury Gold and Compact A4 output unchanged.
* No saved settings → identical previous behaviour.
* Direct print calls do not crash; unknown templateId → Luxury.

Verification reported green:

* typecheck
* lint on changed files: 0 errors; only pre-existing/expected `<img>` warnings (settings logo preview + Minimal print logo — static print HTML can't use `next/image`).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on Minimal template + selector → clean

Remaining gaps:

* Thermal Receipt still a placeholder.
* All three templates are fixed layouts (no per-user layout builder).
* Document-type list still the 19F set (expansion is a separate product decision).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Print Template Builder UI, or a Thermal receipt-style template, or backend read-only print-field exposure. Keep print read-only.

---

### Phase 19J — Real Thermal Receipt-Style Invoice Template

Commit:

```text
feat: add thermal invoice print template
```

Status:

* Completed. Frontend-only.
* No backend/DB/migrations/API changes; no settings-persistence architecture change (only reads existing `templateId`); no localStorage/PDF/Search & Print/Builder UI.
* No financial/business logic; no invoice/posting/payment/stock/accounting change. Still an invoice print template (not POS).

Template IDs (all four fixed templates now real; convention preserved):

* `luxuryGold` → Luxury Gold A4 (unchanged).
* `compactA4` → Compact A4 (unchanged).
* `minimal` → Minimal A4 (unchanged).
* `thermal` → new Thermal receipt-style template. (Replaced the old disabled `thermalReceipt` placeholder value, which was never a real allowed id.)
* invalid/missing → falls back to `luxuryGold` (sanitize for saved values + selector at render).

Files changed/added:

* `features/printing/components/ThermalInvoicePrintTemplate.tsx` (new) — narrow (~80mm) monochrome receipt-style layout: centered header/logo, compact invoice + customer blocks, receipt-style item rows (name + qty/karat/weight/total sub-line, not a wide A4 table), clear totals block, dashed rules, minimal decoration, `@page { size: 80mm auto }`. Same `InvoicePrintTemplateProps` + same `InvoicePrintViewModel`; honours `templateConfig` (language/sections/fields; only text/muted colours from theme since thermal is monochrome) and `documentTitleOverride`. No `items.reduce`/VAT/subtotal/total math — ViewModel values only.
* `features/printing/components/InvoiceDocument.tsx` — selector now: `compactA4` → Compact, `minimal` → Minimal, `thermal` → Thermal, else (luxuryGold/unknown) → Luxury.
* `features/printing/lib/invoice-print-options.ts` — `InvoicePrintTemplateId` adds `"thermal"`; `thermal` added to `ALLOWED_TEMPLATE_IDS`.
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — Thermal enabled (value `thermal`). All four fixed templates now enabled; no disabled placeholders remain.
* `app/[locale]/(dashboard)/settings/page.tsx` — Thermal added to the Template select (distinct from the unrelated receipt paper-size select).
* `docs/AI_HANDOFF.md`.
* (sales/page.tsx unchanged — it already renders via `<InvoiceDocument templateId={options.templateId} .../>`.)

Selection / persistence behaviour:

* Print dialog and settings both offer Luxury Gold + Compact A4 + Minimal A4 + Thermal (all enabled).
* A saved `printTemplateDefaults.templateId = "thermal"` opens the dialog with Thermal selected and prints Thermal. compactA4/minimal/luxuryGold still work. Invalid → luxuryGold.

Compatibility:

* `printInvoice(invoice)` with no options → saved defaults (or 19F defaults) → Luxury Gold when nothing saved.
* Luxury Gold, Compact A4 and Minimal A4 output unchanged.
* No saved settings → identical previous behaviour.
* Direct print calls do not crash; unknown templateId → Luxury.
* Thermal works inside the current iframe print pipeline (renderPrintDocument + printHtmlDocument).

Verification reported green:

* typecheck
* lint on changed files: 0 errors; only pre-existing/expected `<img>` warnings (settings logo preview + Thermal print logo — static print HTML can't use `next/image`).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on Thermal template + selector → clean

Remaining gaps:

* All four templates are fixed layouts (no per-user layout builder).
* Thermal preview page size depends on the browser's thermal/roll print support; the layout renders as a narrow receipt regardless.
* Document-type list still the 19F set (expansion is a separate product decision).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Print Template Builder UI (per-user layout/section/theme editor over the existing config), or backend read-only print-field exposure, or invoice print browser QA across the four templates. Keep print read-only.

---

### Phase 19K-Fix — Safe Print Browser QA Fixes

Commit:

```text
fix: harden invoice print template browser output
```

Status:

* Completed. Frontend-only safe browser-print hardening.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting/treasury/POS changes.
* No Builder UI, no PDF generator, no Search & Print, no document-type expansion.

Files changed:

* `features/printing/components/CompactInvoicePrintTemplate.tsx`
* `features/printing/components/MinimalInvoicePrintTemplate.tsx`
* `features/printing/components/ThermalInvoicePrintTemplate.tsx`
* `app/[locale]/(dashboard)/sales/page.tsx`
* `docs/AI_HANDOFF.md`

Key fixes:

* Replaced semantic template-level `header` tags with print-safe `section` tags in Compact A4, Minimal A4, and Thermal templates so shared print CSS does not hide their printed company/logo/title/TRN headers.
* Fixed invoice print paper-size mapping by selected template:

  * `thermal` -> `80mm`
  * `luxuryGold`, `compactA4`, `minimal` -> `A4`

Preserved:

* Template selection remains unchanged.
* Persisted defaults remain unchanged.
* Invalid/missing template IDs still fall back to Luxury Gold.
* Luxury Gold output was not modified.

Remaining gaps:

* Luxury long-invoice truncation/page-break redesign still pending.
* Full language mode expansion across every label/header still pending.
* Missing `tests/export-print.spec.ts` / `npm run test:print-export` target still pending.
* Browser/manual print preview QA across all four templates is still recommended.

---

### Phase 19L-Fix — Luxury Gold Long Invoice Pagination

Commit:

```text
fix: allow luxury invoice print pagination
```

Status:

* Completed. Frontend-only Luxury Gold print layout fix.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting/treasury/POS changes.
* No Builder UI, no PDF generator, no Search & Print, no language mode expansion.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key fixes:

* Fixed Luxury Gold long-invoice clipping by replacing fixed A4 `height`/`max-height` with natural `min-height`.
* Removed the outer Luxury Gold clipping rule so long invoices can flow beyond one printed page.
* Existing table row / totals / signatures / notes page-break hardening remains in place.

Remaining gaps:

* Manual browser print preview QA is still recommended.
* Full language mode expansion across every label/header still pending.
* Missing `tests/export-print.spec.ts` / `npm run test:print-export` target still pending.
* Print Template Builder UI has not been started.

---

### Phase 19M-Fix — Invoice Print Language Label Expansion

Commit:

```text
fix: localize invoice print labels by language mode
```

Status:

* Completed. Frontend-only print label rendering fix.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting/treasury/POS changes.
* No Builder UI, no PDF generator, no Search & Print, no document-type expansion.

Files changed:

* `features/printing/components/LocalizedPrintLabel.tsx`
* `features/printing/components/InvoicePrintTemplate.tsx`
* `features/printing/components/CompactInvoicePrintTemplate.tsx`
* `features/printing/components/MinimalInvoicePrintTemplate.tsx`
* `features/printing/components/ThermalInvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key fixes:

* Added a reusable localized print label helper plus string formatter for label-only print contexts.
* Expanded `languageMode` coverage across Luxury Gold, Compact A4, Minimal A4, and Thermal labels.
* Arabic-only now suppresses English labels in template labels.
* English-only now suppresses Arabic labels in template labels.
* Bilingual remains the default and stays visually close to the previous output.
* Dynamic values, ViewModel values, totals, payment amounts, and document title override behavior remain display-only and unchanged.

Remaining gaps:

* Manual browser print preview QA is still recommended.
* Missing `tests/export-print.spec.ts` / `npm run test:print-export` target still pending.
* Print Template Builder UI has not been started.

---

### Phase 19N — Manual Browser Print Acceptance Audit

Status:

* Completed as audit-only.
* No files modified.
* No commit.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting changes.

Key findings:

* No Critical findings.
* No High findings.
* Browser print dialog and source wiring were partially verified.
* Native print preview / iframe capture was not fully exercised due to browser automation limitations.
* Real thermal printer / 80mm roll-print behavior remains unverified.
* Dynamic bilingual customer/product/company data is not a label-localization bug; only labels are expected to switch by language mode.

Recommendation from audit:

* Proceed to missing print-export test setup.

---

### Phase 19O — Print Export Test Setup Audit

Status:

* Completed as audit-only.
* No persistent file changes.
* No commit.
* No backend/DB/migrations/API changes.
* No production print component changes.

Key findings:

* `npm run test:print-export` currently fails because `tests/export-print.spec.ts` does not exist.
* The `tests/` directory is absent.
* Current script:

  ```text
  playwright test tests/export-print.spec.ts --project="Desktop Large"
  ```

* Playwright is installed/configured through:

  * `playwright.config.ts`
  * `@playwright/test` 1.51.1

Preferred next implementation:

* `Phase 19O-Fix — Add Minimal Print Export Smoke Test`.
* Prefer a static render smoke test rather than native browser print preview.
* Cover all template IDs:

  * `luxuryGold`
  * `compactA4`
  * `minimal`
  * `thermal`

* Cover language modes:

  * `bilingual`
  * `ar`
  * `en`

* Cover invalid template fallback to Luxury Gold.
* Do not touch backend/DB/API/migrations.
* Do not change financial/business logic.
* Do not start Builder UI.

---

### Phase 19O-Fix — Add Minimal Print Export Smoke Test

Status:

* Completed.
* Added `tests/export-print.spec.ts` (new file).
* Added `app/test/print-export/page.tsx` (test-only fixture page).
* Updated `.gitignore` to ignore `playwright-report/` and `test-results/`.
* No backend/DB/migrations/API changes.
* No production print component changes.
* No financial/business logic changes.

What was added:

* `tests/export-print.spec.ts` — Playwright smoke test (11 tests).
* `app/test/print-export/page.tsx` — test-only fixture page that renders all 4 templates × 3 language modes with static fixture data.
* Test strategy: static render smoke via Playwright navigating to the fixture page.
* Does NOT call `window.print()` or use native print preview.

Templates covered:

* `luxuryGold` — asserts `luxury-invoice` class + `size: A4`.
* `compactA4` — asserts `compact-invoice` class + `size: A4`.
* `minimal` — asserts `minimal-invoice` class + `size: A4`.
* `thermal` — asserts `thermal-invoice` class + `80mm`.

Language modes covered:

* `bilingual` — English + Arabic labels present.
* `ar` — Arabic labels present, English labels suppressed.
* `en` — English labels present, Arabic labels suppressed.

Invalid template fallback:

* Unknown template ID falls back to Luxury Gold (asserts `luxury-invoice` class, no other template classes).

---

### Phase 19Q — Print Builder Config Schema / Storage Design

Status:

* Completed.
* Created `features/printing/lib/print-builder-config.ts` (Zod validation, sanitization, defaults, and resolution helpers).
* Created `hooks/use-invoice-print-builder-config.ts` (storage hook reusing generic PUT route).
* Created `scripts/verify-print-builder-config.js` (VM verification unit tests).
* Updated `contexts/settings-context.tsx` to include `invoicePrintBuilderConfig` type field.
* No UI yet.
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

What was added:

* Zod schema `InvoicePrintBuilderConfigSchema` supporting overrides per template ID under a single `invoicePrintBuilderConfig` key.
* Verification unit test script ensuring that:
  * Raw input is strictly sanitized and validated against allowed properties (stripping unknown keys, rather than failing validation entirely).
  * Missing or malformed payloads fall back to standard builder defaults.
  * Template configuration override extraction and template default merging operate safely without throwing in the render path.
* Storage hook reading/writing directly via `PUT /settings/by-key/invoicePrintBuilderConfig`.

---

### Phase 19R — Print Builder MVP UI: Section / Field Toggles

Status:

* Completed.
* Added "Print Builder" tab panel to Settings UI page `app/[locale]/(dashboard)/settings/page.tsx` with selectors for template ID (`luxuryGold`, `compactA4`, `minimal`, `thermal`).
* Added UI switches/toggles for all 11 config sections and 14 individual fields from `print-template-config.ts` dynamically bound to active template form states.
* Wired overrides into `InvoiceDocument.tsx` render path selector.
* Implemented template reset (clears specific overrides, keeps defaults) and save handlers using `useInvoicePrintBuilderConfig`.
* Display-only: warnings shown if critical columns/totals are disabled; no recalculations or DB ledger impact.
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

---

### Phase 19S — Print Builder Preview Panel

Status:

* Completed.
* Extracted static invoice print data to `features/printing/lib/invoice-print-fixture.ts` to share between test runners and settings UI.
* Refactored Settings Print Builder tab to a split-screen layout (toggles editor on the left, live mock preview panel on the right).
* Live Preview updates instantly as toggles are flipped (uses live React state without requiring settings save first).
* Responsive layout hides/stacks preview below toggles on mobile viewports.
* Added live language selector (Bilingual, Arabic, English) for previewing label visibility.
* Display-only: Preview renders strictly local fixture data (no DB/API invoice calls).
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

---

### Phase 19T — Print Builder Theme Presets

Status:

* Completed.
* Added `themePreset` field and `PRINT_BUILDER_THEME_PRESETS` predefined options mapping (`classicGold`, `modernDark`, `softGold`, `minimalGray`, `thermalMono`) to `print-builder-config.ts` and Zod schema.
* Added `themePreset` key to `PrintTemplateConfigOverrides` and `PrintTemplateConfig` in `print-template-config.ts` so template components resolve presets.
* Refactored Settings UI Print Builder panel to show a Theme Preset dropdown.
* Integrated preset resolving color merge logic inside `InvoiceDocument.tsx` so preset values cascade safely.
* Expanded `scripts/verify-print-builder-config.js` to assert that themePreset validates correctly, sanitizes invalid presets, and resolves colors.
* Added E2E Playwright smoke assertion checking that theme preset renders without crashing.
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

---

### Phase 19U-Fix — Print Builder Persistence + Modal Scroll Lock

Status:

* Completed. Two focused frontend-only bugfixes from the Phase 19U audit.
* No backend/DB/migrations/API/new-endpoint changes. No `PATCH /settings`. No localStorage. No financial/business logic. No new Builder feature.

Bug 1 — Builder customization not applied / appeared reset:

* Root cause: `contexts/settings-context.tsx` parsed only `["paymentMethods", "receipt", "barcode", "printTemplateDefaults"]` from the JSON-serialized settings map, so `settings.invoicePrintBuilderConfig` stayed a raw string; `sanitizeInvoicePrintBuilderConfig` (Zod) then failed and fell back to defaults in both the Settings Builder UI and Sales print.
* Fix: added `"invoicePrintBuilderConfig"` to that read-side parse list (only). The write path stays `PUT /settings/by-key/invoicePrintBuilderConfig`; the PATCH-whitelist array (`updateSettings`) was NOT touched.
* Result: `settings.invoicePrintBuilderConfig` rehydrates as an object after refresh; the Builder UI shows saved toggles/theme; Sales print (`InvoiceDocument`) now receives the parsed config and applies saved customization.

Bug 2 — page scroll frozen after Sales invoice print flow:

* Root cause: `components/ui/modal.tsx` scroll-lock effect depended on `[open, onClose]`. The Sales parent modal passes an inline `onClose`, so the effect cleaned up + re-ran while the nested print dialog was open, re-capturing `document.body.style.overflow` as `"hidden"` and restoring `"hidden"` on final cleanup.
* Fix: reference-counted body scroll lock via module-level `activeModalCount` + `previousBodyOverflow`; the effect now depends on `[open]` only; the Escape handler uses the latest `onClose` via a ref. Body is locked when the first modal opens and restored only when the last closes.
* Result: nested/stacked modals and repeated print/cancel/close cycles no longer leave `body`/`html` overflow stuck; scroll works after the flow.

Verification:

* typecheck clean; lint 0 errors (2 pre-existing `isAuthenticated` `useCallback` warnings, unrelated); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok.
* financial-safety grep on the two changed files → clean.
* `npm run test:print-export` (Playwright, `webServer: npm run dev` on :3000) could not complete in the current headless environment (no output; server/browser-dependent). Not a code failure — the two fixes don't touch the print/export rendering path; manual browser QA still recommended.

Remaining gaps:

* Native/manual browser print QA still recommended (esp. the two fixed flows).
* Builder advanced controls not started; drag/drop not started; PDF generator + Search & Print not started.

---

### Phase 21.3-Fix — Central Idempotency Requests + Critical Frontend Keys

Status:

* Completed (code). Added race-safe idempotency for the critical financial/stock mutation endpoints. **Migration NOT executed here** — it must be applied before the wrapped endpoints work (they insert into the new table): `cd backend && npm run db:migrate` on a safe/dev DB.
* No print work; no accounting/settlement/stock redesign; no POS/purchase calculation changes; no destructive DB command.

Infrastructure (new):

* Migration `backend/migrations/20260707000000-create-idempotency-requests.js` — additive/reversible; creates `idempotency_requests` (id, company_id, scope, key, request_hash, status, status_code, response_body JSONB, expires_at, timestamps) with **UNIQUE (company_id, scope, key)** + helper indexes.
* Model `backend/src/models/idempotencyRequest.model.js` (registered in `models/index.js`).
* Service `backend/src/services/idempotency.service.js`: `hashRequest(scope, body)` (sha256 canonical JSON, key excluded), `claim` (insert-first in the caller's transaction → race-safe via the unique index), `resolveExisting` (fresh query → replay/processing/conflict), `succeed` (store response). Existing per-table `idempotency_key` trace columns kept.

Contract & behavior:

* Header `Idempotency-Key`; scopes `pos.checkout`, `sales.return`, `sales.exchange`, `purchase.receive`.
* Missing key on a wrapped endpoint → **400**. Same key + same request → **replay** the saved 2xx response. Same key + processing → **409**. Same key + different request hash → **409**. On business failure the `processing` row rolls back with the transaction, so a genuine retry can proceed.
* Race-safe by construction: the `processing` row is claimed in the SAME transaction as the business mutation and updated to `succeeded` before commit; a concurrent duplicate blocks on the unique key then replays, or its insert fails → it rolls back and resolves the committed row.

Endpoints wrapped: **`/pos/checkout`, `/sales/returns`, `/sales/exchanges`, `/purchase-orders/receive`** — each replaces its old lookup-only replay with claim + resolve, and persists the exact success payload via `succeed` before commit (returns/exchanges preserve Phase 21.2 settlement; receive preserves stock/accounting). **Deferred:** `/purchase-orders/:id/pay` (already *requires* a key + has replay/conflict + PO row-lock — strong; central conversion is a follow-up); secondary payment/treasury/installment/draft endpoints keep their existing lookup + row locks.

Frontend keys (mandatory now — backend rejects missing keys): returns / exchanges / purchase-receive pages send a **stable** `Idempotency-Key` (ref-based `generateUUID`, generated once per attempt, reused on retry, reset on success / new-search). POS checkout already sent a stable key (unchanged).

Verification:

* `scripts/verify-idempotency.js` (new, `npm run verify:idempotency`): functional service test with a mock unique store (claim/duplicate/processing/replay/conflict + hash contract), migration/model unique-constraint static checks, route scope+claim+succeed coverage, and frontend key coverage. **Passes.** `node -c` on all changed backend files ok; typecheck/lint/build ok; `verify-invoice-crud-guards` + `verify-return-exchange-settlement` still pass; no print files touched.

Remaining deferred: run the migration; convert `/purchase-orders/:id/pay` + secondary payment/treasury endpoints to the central service; enforce missing-key rejection on secondary endpoints; TTL cleanup job for `expires_at`; customer credit ledger; mock-production-default hardening; ledger-based report reconciliation.

---

### Phase 23-Fix — Customer Credit Ledger MVP (Infrastructure)

Status:

* Completed (code). Added a per-customer **credit ledger** as **infrastructure only** — new table + model + service + one read-only endpoint + a read-only UI display. **No shipped behavior changed**: returns/exchanges still cash-refund excess, overpayment stays prevented/rejected, `Customer.balance` stays AR-only, `Invoice.remainingAmount` unchanged, installments/treasury unchanged, `statement-v2` unchanged (only a read-only credit card added on the page). **No credit is created by any flow** in this phase.
* **Migration created but NOT run here** — apply before the endpoint returns real data: `cd backend && npm run db:migrate` on a safe/dev DB. No destructive DB command.

Infrastructure (new):

* Migration `backend/migrations/20260707010000-create-customer-credit-transactions.js` — additive/reversible; creates `customer_credit_transactions` (id, company_id, branch_id, customer_id, source_type, source_id, direction, amount, currency, description, status, **journal_entry_id** (GL-bridge, nullable), cash_transaction_id, invoice_id, created_by, metadata, timestamps) + 5 indexes (company+customer+created, company+source, journal, cash, invoice). No CHECK constraints on existing tables.
* Model `backend/src/models/customerCreditTransaction.model.js` (registered in `models/index.js` with minimal `belongsTo Company`/`Customer` + reverse `hasMany`). `direction ∈ {credit_in, credit_out}`, `status ∈ {active, reversed, void}`, `amount > 0`, `source_type ∈ {opening_balance, return_credit, exchange_credit, overpayment, credit_application, credit_refund, manual_adjustment, migration_seed}` — enforced via model validators.
* Service `backend/src/services/customer-credit.service.js`: `recordCreditIn`, `recordCreditOut` (rejects if it would drive available credit **negative**), `getCustomerCreditSummary` (availableCredit = Σ active credit_in − Σ active credit_out), `getCustomerCreditTransactions`. Accepts `transaction`; company/customer-scoped. **Never touches `Customer.balance`, `Invoice.remainingAmount`, or the GL** (never requires posting.service). **GL bridge to account 2300 "Customer Deposits" is DEFERRED** — `journalEntryId` is a nullable pass-through.

API (read-only): `GET /customers/:id/credit` (auth + `customers.view`, company-scoped, 404 if not found) → `{ customerId, availableCredit, totalCreditIn, totalCreditOut, currency, page, pageSize, transactions, meta:{ glBridge:"deferred" } }`. **No POST/apply/refund/adjust endpoint.**

Frontend (read-only): a small "Available Credit" card on the customer statement panel (`customers/[id]/page.tsx`), fetched via the existing direct-`apiClient` pattern. No buttons/actions/forms — display only; shows 0 until a future phase enables credit creation.

Verification: `scripts/verify-customer-credit-ledger.js` (`npm run verify:customer-credit-ledger`) — **functional** (mock store: credit_in/out sum, no-negative rule, amount validation, per-customer scoping; the mock exposes only the credit model, so the service can't touch Customer/Invoice) + **static** (migration/model/registration, service surface, service never accesses Customer/Invoice models or posts GL, read-only endpoint exists, **no flow records credit**, return/exchange settlement intact, posting.service not coupled/rewritten). **Passes.** `node -c` on routes/service/model/migration ok; typecheck/lint (0 errors)/build ok; all prior verifiers pass; no print/report files touched; 11 stashes untouched.

Remaining deferred (need a business decision): keep return/exchange excess as credit vs cash refund; overpayment acceptance; credit application to future invoices; credit refund workflow; GL posting bridge to 2300; `Customer.balance` installment drift; ledger-based reports.

---

### Phase 22-Fix — Strict Production Data-Source Hardening

Status:

* Completed (code). Closed the one remaining silent-mock hazard: a production build missing/empty/invalid `NEXT_PUBLIC_DATA_SOURCE` used to default the whole app to `mock`/localStorage, bypassing PostgreSQL. Frontend-only change; **no backend, no DB, no migration, no print/accounting/idempotency changes.**

Central selector ([lib/data-source.ts](../lib/data-source.ts)):

* New helpers: `getDataSourceMode()`, `isApiDataSource()`, `assertProductionDataSource()`. Removed the `(… as DataSourceMode) || "mock"` unsafe-cast default.
* **Production** (`NODE_ENV === "production"`): `getDataSourceMode()` **always returns "api"** (mock/local can never be returned). The module stays **import-safe** (never throws just from import) so `next build` succeeds; the loud failure is `assertProductionDataSource()`, called by the API client before any request — it throws when `NEXT_PUBLIC_DATA_SOURCE` is missing/≠"api" or `NEXT_PUBLIC_API_URL` is empty.
* **Development**: validated env value, defaulting to `mock` when unset; an **invalid** value throws loudly. Value is trimmed + lowercased.
* `DATA_SOURCE` const kept (production-forced "api") so all existing `DATA_SOURCE === "api"` callers keep working; `isMock`/`isLocal`/`shouldPersist`/`isApiReady` now derive from the getter (never mock/persist in production).

API client ([lib/api/client.ts](../lib/api/client.ts)):

* Removed the duplicate `process.env.NEXT_PUBLIC_DATA_SOURCE || "mock"` default; imports and calls `assertProductionDataSource()` + `getDataSourceMode()`. Preserved the existing safe behavior — **API errors throw (`DarfusApiError`), no catch-return-mock, no fallback to local**.

Direct env readers centralized (13 files): removed every direct `process.env.NEXT_PUBLIC_DATA_SOURCE` read from business flows — POS, sales returns/exchanges, customer-gold, invoices, assets (`use-asset-query`, `use-assets`), inventory (`use-inventory-list`, manufacturing, stock-audit), employees, settings — now use `isApiDataSource()` / `getDataSourceMode()`. Only `lib/data-source.ts` reads the raw env.

localStorage / mock (unchanged, preserved): business persistence stays gated — `erp-context` skips persistence and clears demo state in api mode; `settings-context` branch/settings writes are all behind `if (!isApi)`. POS drafts remain a pre-checkout local cache. **No mock files deleted**; the api-mode `Local*` repo cleanup remains deferred.

Env contract: `.env` is **untracked** (local only) — its empty `NEXT_PUBLIC_DATA_SOURCE=` no longer causes silent mock (production forces api + fails loud on real deployments). Tracked `.env.example` / `.env.production.example` already correctly show `NEXT_PUBLIC_DATA_SOURCE=api` — left unchanged; no secrets added.

Verification: new `scripts/verify-production-data-source.js` (`npm run verify:production-data-source`) — **functional** (transpiles the selector and exercises production/dev × missing/mock/api/no-URL/invalid → asserts forced-api, loud throws, dev default/invalid) + **static** (no `|| "mock"`, no unsafe cast, NODE_ENV guard + 3 rules, client imports the guard & still throws with no mock/local fallback, no stray direct env reads, localStorage gates intact, mock files present). **Passes.** typecheck/lint (0 errors)/**build (production) ok**; all prior verifiers still pass; no backend/print files touched; 11 stashes untouched.

Remaining deferred: optional explicit demo-mode flag/banner (`NEXT_PUBLIC_ALLOW_DEMO_MODE`) if ever needed; api-mode `Local*` repository cleanup (inventory/sales/manufacturing/reports/audit/settings still local in api mode); customer credit ledger; ledger-based reports.

---

### Phase 21.5-Fix — Edge Financial Idempotency & Cleanup Script Repair

Status:

* Completed (code). Extended the central `idempotency_requests` service to the two remaining exposed financial mutation endpoints, and repaired the (previously broken) TTL cleanup command. **No new migration** — the 21.3 table/indexes are reused.
* No print work; no payroll/gold-model/accounting/settlement/stock redesign; no destructive DB command. **Treasury closing intentionally left unchanged** (strong per-account-per-day uniqueness + no cash/journal effect → deferred).

Endpoints converted (each now REQUIRES `Idempotency-Key` → 400 if missing; `req.params.id` folded into the request hash; old lookup-only logic removed):

* **`POST /payslips/:id/pay`** — scope `payroll.payslip_payment`. Replaced the optional-key `slip.idempotencyKey === key` lookup with claim/succeed. **Wrapped in a `sequelize.transaction` for the first time** and moved `postPayrollEntry` INSIDE it (`{ transaction: t }`, which the service already supports) — a posting failure now rolls back the whole payment, ending the old best-effort divergence where a payslip could be marked `paid` with no GL entry. Status guard (`paid` → 409) kept. Payroll calculation unchanged.
* **`POST /customers/:id/gold/payout`** — scope `customer.gold_payout`. Added the central claim inside the existing transaction (previously it had **zero** idempotency/status guard). Negative `CustomerGoldPool` deduction + Dr 2300 / Cr cash|bank journal unchanged. **No frontend caller exists** (endpoint is API-only) — none was invented; requiring a key makes any future/API caller safe-by-default.

Frontend keys:

* **Payslip** (`hooks/use-payroll.ts` `payPayslip` + `employees/payroll/page.tsx`): per-payslip `useRef` key map, generated on first pay attempt, reused on retry, cleared on success.
* **Gold payout:** no change (no caller).

Cleanup script repair (Phase 21.4 bug):

* The root `scripts/idempotency-cleanup.js` failed with `MODULE_NOT_FOUND` — `require("dotenv")` cannot resolve from the repo root (`dotenv` is only in `backend/node_modules`), so `npm run idempotency:cleanup` never ran. **Relocated to `backend/scripts/idempotency-cleanup.js`** (backend convention: `require("dotenv").config({ path: ../.env })` + `require("../src/models")` + `require("sequelize").Op`); root copy removed; `package.json` script now `node backend/scripts/idempotency-cleanup.js`. Still deletes ONLY `expires_at < now`, supports `--dry-run`, no truncate/reset/delete-all, closes the connection. **Dry-run verified live** (read-only `SELECT count(*) … WHERE expires_at < now` → 0 rows, no deletion).
* **Cron:** run manually or via an **external scheduler** (e.g. daily at low-traffic hours: `npm run idempotency:cleanup`). No in-app scheduler (BullMQ/Redis is optional and degrades to in-memory, so it is not relied on for cleanup).

Verification:

* `scripts/verify-secondary-idempotency.js` extended (`npm run verify:secondary-idempotency`): now asserts the two new scopes wired + required-key 400 + `req.params` in hash + old lookup removed (claim/succeed/resolve ≥ 9); treasury closing NOT centralized; payslip frontend sends a stable ref key; **gold payout has no frontend caller** (recursive grep); cleanup relocated + root copy gone + resolves backend deps + package path updated. **Passes.**
* `node -c` on `erp.routes.js` + `backend/scripts/idempotency-cleanup.js` ok; typecheck/lint (0 errors)/build ok; `verify-idempotency` + `verify-invoice-crud-guards` + `verify-return-exchange-settlement` still pass; no print files touched; 11 stashes untouched.

Remaining deferred: treasury-closing centralization (low risk); a scheduled/automated cleanup job (currently manual/cron); customer credit ledger; mock-production-default hardening; ledger-based report reconciliation.

---

### Phase 21.4-Fix — Secondary Financial Idempotency & TTL Cleanup

Status:

* Completed (code). Extended the Phase 21.3 central `idempotency_requests` service to the three highest-risk secondary financial mutation endpoints, and added a safe manual TTL cleanup script. **No new migration** — the 21.3 `idempotency_requests` table/indexes (already run by the user) are reused as-is.
* No print work; no accounting/settlement/stock redesign; no POS/return/exchange/generic-CRUD changes; no destructive DB command.

Endpoints converted (each now REQUIRES `Idempotency-Key` → 400 if missing; old lookup-only logic removed; `req.params` folded into the request hash so one key cannot cross records):

* **`POST /treasury/transactions`** — scope `treasury.cash_transaction`. Replaced the optional-key `CashTransaction.findOne` lookup (which admitted a race window) with claim/succeed inside the existing `sequelize.transaction` callback; a concurrent duplicate throws a sentinel → the callback rolls back → `resolveExisting` replays/conflicts. Treasury cash + GL journal behavior unchanged; same response shape saved & replayed.
* **`POST /purchase-orders/:id/pay`** — scope `purchase.payment`. Replaced the `CashTransaction` lookup/`sameOperation` replay with the central claim inside the write transaction (after opening `t`, before the PO row-lock). PO `FOR UPDATE` lock, overpayment guards and Dr AP / Cr cash|bank posting unchanged. `Supplier.findByPk` reference read moved inside the tx so the saved response includes `supplierDueReference`; `succeed` runs before commit.
* **`POST /installments/:id/pay`** — scope `installment.payment`. Replaced the optional-key `inst.idempotencyKey === key` lookup with claim/succeed inside the `sequelize.transaction` callback (sentinel-on-duplicate pattern). Payment row + installment status + GL journal + treasury CashTransaction logging unchanged.

Frontend keys:

* **Treasury** (`hooks/use-treasury.ts` `addTransaction` + `accounting/treasury/page.tsx`): stable `useRef` key, generated on modal open, reused on retry (kept on failure), reset to `""` on success.
* **Installments** (`hooks/use-installments.ts` `payInstallment` + `sales/installments/page.tsx`): per-installment `useRef` key map, generated on first pay attempt, reused on retry, cleared on success.
* **Purchase payment**: caller already existed (`suppliers/[id]/page.tsx` → `accountingRepository.payPurchaseOrder` → `api-impl.ts`) and already sent a stable `payKey` (`crypto.randomUUID`, one per payment session) — **unchanged**, no invented caller.

TTL cleanup (no migration, no scheduler infra):

* `scripts/idempotency-cleanup.js` (`npm run idempotency:cleanup`): deletes ONLY expired rows via `IdempotencyRequest.destroy({ where: { expiresAt: { [Op.lt]: now } } })` (`expires_at < now`). Supports `--dry-run` (count only). Never truncates/resets/deletes-all; prints the deleted count; closes the DB connection. Intended for manual run or external cron. **Not executed here** (per safety rules).

Verification:

* `scripts/verify-secondary-idempotency.js` (new, `npm run verify:secondary-idempotency`): static checks — the three scopes wired with required key + `req.params` in the hash, old lookup-only patterns removed, claim/succeed/resolve now cover ≥7 endpoints; frontend hooks/pages send stable ref-based keys and reset on success; cleanup deletes only `expiresAt < now` with no truncate/delete-all; the four Phase 21.3 scopes still wired; no print coupling. **Passes.**
* `node -c` on `erp.routes.js`, `idempotency.service.js`, `idempotency-cleanup.js` ok; typecheck/lint (0 errors)/build ok; `verify-idempotency` + `verify-invoice-crud-guards` + `verify-return-exchange-settlement` still pass; no print files touched; 11 stashes untouched.

Remaining deferred: payslip / customer gold-payout / treasury-closing centralization; a scheduled/automated cleanup job (currently manual/cron); customer credit ledger; mock-production-default hardening; ledger-based report reconciliation.

---

### Phase 21.2-Fix — Receivable-First Return / Exchange Settlement

Status:

* Completed. Backend accounting/treasury fix for the confirmed High-risk Phase 21.2 finding: sales returns/exchanges booked cash movement + receivable changes inconsistently (double compensation, fake cash, GL-vs-balance divergence).
* No print work; no DB reset/seed/migration; no customer-credit ledger; no idempotency wiring; no generic-invoice-CRUD/POS-checkout/supplier changes; stock/asset reversal unchanged.

Bug (confirmed in the 21.2 audit):

* **Return** — created a `cash_out` for the **full** `returnedTotal` (any paid state) **and separately** reduced receivable; `postReturnEntry` credited **Cash 1110** for the full total (never AR 1300). An unpaid/partial return double-compensated the customer and diverged the GL from `customer.balance`.
* **Exchange** — created `cash_in`/`cash_out` by diff sign whenever `diffTotal !== 0` (independent of settlement/outstanding); GL money leg always hit Cash 1110/1120, never AR 1300; the receivable branch keyed off `paymentMethod === "credit"` which the UI never sends (`"Exchange"`), so it was dead.

Fix — receivable-first settlement (`erp.routes.js` returns + exchanges, `posting.service.js`):

* **Returns:** `receivableReliefAmount = min(returnedTotal, outstanding)`, `cashRefundAmount = returnedTotal − relief`. Receivable relief applied **once** (`customer.balance` + `invoice.remainingAmount`, clamped ≥ 0); `CashTransaction cash_out` created **only if** `cashRefundAmount > 0`; `postReturnEntry` now splits the money leg **Cr AR 1300** (relief) + **Cr Cash/Bank** (refund). Legacy callers (no split) still get the old full-cash entry (balanced).
* **Exchanges:** `diff<0` → relieve AR first, cash-refund only the excess. `diff>0` → `settlementMode` (`paid_now`|`credit`); default = **credit** when `paymentMethod:"Exchange"`/unconfirmed (avoids fake `cash_in`), `paid_now` only for a real cash/bank method or explicit flag. GL money leg splits **Cash/Bank + AR 1300**; treasury `CashTransaction` only for real cash (`exchangeCashAmount > 0`); receivable moved once via a single signed `exchangeArDelta` (+`invoice.remainingAmount`, clamped ≥ 0).
* Examples: unpaid return 3000/out 10000 → AR −3000, cash 0. Partial return 3000/out 2000 → AR −2000, cash 1000. Fully-paid return 3000/out 0 → AR 0, cash 3000. Exchange diff −1000/out 400 → AR −400, cash refund 600. Exchange diff +1000 credit → AR +1000, no cash_in.

Frontend: **unchanged** — the backend safe default (`"Exchange"`+diff>0 → credit) closes the fake-`cash_in` hole without UI changes; an explicit "paid now" toggle is an optional future add. Returns already work via the receivable-first default (no settlement UI needed for MVP).

Verification:

* `scripts/verify-return-exchange-settlement.js` (new, `npm run verify:return-exchange-settlement`): (A) functional — stubs `postEntry`/`resolveAccountingByKarat` and asserts `postReturnEntry`'s AR 1300 / Cash split + legacy fallback + that every entry **balances**; (B) the settlement-formula matrix (all return + exchange scenarios); (C) static route assertions that both routes use receivable-first + gated treasury + AR 1300 and that the **old bug patterns are gone** (`amount: returnedTotal`, `if (diffTotal !== 0)`, `paymentMethod === "credit"`), with stock/asset sections intact. **All pass.**
* `node -c` on both changed backend files ok; frontend typecheck/lint/build ok; `verify-invoice-crud-guards` still ok; no orphaned refs; grep-safety clean (no print/POS-checkout/supplier logic touched).

Remaining risks (deferred): idempotency on return/exchange submit → Phase 21.3; a proper customer-credit ledger (currently AR only, clamped ≥ 0 — no negative/credit balance) → future; ledger-based report reconciliation.

---

### Phase 21.1-Fix — Generic Invoice CRUD Guards (data integrity)

Status:

* Completed. Backend guard-only fix for the Critical Phase 21 audit finding: the generic `/invoices` CRUD could create/update/delete **posted** financial invoices with no stock/treasury/accounting reversal. Posted invoices are now changed only through the lifecycle-safe routes.
* No print work; no DB/migration/seed; no accounting/treasury redesign; no returns/exchanges accounting change; no idempotency work; no POS checkout / purchase-receive calculation changes.

Root cause:

* `setupCrud("invoices", …)` (erp.routes.js) wired generic POST/PUT/PATCH/DELETE + deactivate/reactivate through `ErpController`. The only guard was "reject explicit lifecycle fields in the body", but the model default is `postingStatus:"posted"`, so a generic create with items/totals (no lifecycle field) produced a **posted** header with none of the side effects; generic update/delete could mutate/soft-delete posted invoices; `deactivate` even set an invalid `status:"inactive"` enum.

Fix (`backend/src/controllers/erp.controller.js`, all scoped to `model.name === "Invoice"`):

* **create** — blocked entirely (403): invoices are created only via `/pos/checkout` or `/sales/invoices/drafts → /sales/invoices/:id/post`.
* **update** — 409 when `postingStatus !== "draft"` (posted/cancelled). DRAFT updates remain allowed; the pre-existing lifecycle-field guard (postingStatus/postedAt/cancelledAt/cancelReason) still applies to drafts (403).
* **delete** — 409 when `postingStatus !== "draft"`; only drafts (no posted side effects) may be soft-deleted; posted docs need a lifecycle cancel/reversal.
* **deactivate / reactivate** — blocked (409) for invoices (no such lifecycle; also avoids the invalid status enum).
* Guards are pure `res.status(...)` returns before any DB write; no new financial/DB operations added.

Frontend: unchanged — it never called generic invoice mutations (only `GET /invoices` lists + the `/sales/invoices/*` and `/pos/checkout` lifecycle endpoints). Nothing to remediate.

Verification:

* `scripts/verify-invoice-crud-guards.js` (new, `npm run verify:invoice-crud-guards`) — functionally exercises the guards against a mock Invoice model (no DB): create 403; posted/cancelled update 409; draft update allowed (reaches `item.update`) but draft lifecycle-field 403; posted delete 409 (no destroy) while draft delete allowed; deactivate/reactivate 409; a non-Invoice model is unaffected; and statically confirms the lifecycle routes (`/pos/checkout`, `/sales/invoices/:id/post|cancel`, `/sales/invoices/draft`) + `setupCrud("invoices")` are still wired. **All pass.**
* `node -c` on the controller ok; frontend typecheck/lint/build ok (backend-only change); grep-safety clean (guards only). Backend has no lint/test scripts (skipped); no destructive DB command run.

Remaining risks (deferred): return/exchange accounting risk → Phase 21.2; broad idempotency → Phase 21.3; any legacy draft route/mock-production default and serialized-asset StockMovement / ledger-report items remain as previously noted.

---

### Phase 19Y.3 — POS Print Dialog with Template Selector & Live Preview

Status:

* Completed. Frontend-only. After a successful POS checkout, a print dialog now opens with a template selector + live preview (Thermal default), reusing the existing print system.
* No backend/DB/migration/API; no new settings key; no autoPrint/copies; no `defaultPosTemplate` persistence; no custom text blocks; no favicon; no POS submit/payment/stock/accounting/treasury changes; no totals recalculation. `ReceiptPrintTemplate`/`ReceiptPreview` files retained.

Changes:

* **`InvoicePrintOptionsDialog.tsx` (extended, backward-compatible):** added optional props `showPreview` / `previewCompany` / `previewSettings` / `previewLabels`. When `showPreview` is set, it renders a live `InvoiceDocument` (scaled: thermal at 80mm, A4 via `zoom:0.5`) reacting to the selected template/language/document-type. Sales passes none of these, so its behavior is unchanged (selectors + Print only). Added `id`/`name` to the three selects (`print-document-type` / `print-template` / `print-language`).
* **`pos/page.tsx`:** replaced the post-checkout `ReceiptPreview` modal (Option 1) with `InvoicePrintOptionsDialog` opened on `completedInvoice` (set by the existing `postInvoice` success). `initialOptions = POS_PRINT_DEFAULTS` (module const: documentMode auto / templateId **thermal** / bilingual — stable ref so the dialog's reseed effect never resets the user's choice). Added a POS `printInvoice(invoice, options)` mirroring Sales (`InvoiceDocument` → `renderPrintDocument` → `printHtmlDocument`), a memoized `printCompany` (`PrintCompany` from the auth company / Company Profile), and `printLabels` (POS + PrintExport namespaces; all keys verified present in en/ar). `onPrint={printInvoice}`, `onClose` just clears `completedInvoice`.

Behavior / safety:

* Dialog opens only after `postInvoice` succeeded. `printInvoice` and the dialog **never call `postInvoice`** (verified: `postInvoice` only at the checkout handler line 814). Print/close do not mutate cart/order/payment/stock/accounting; no invoice is re-created. Preview + print render the server-returned `completedInvoice` via the ViewModel — no totals recalculation. Company data comes from the auth company (not `receipt.*`). Receipt messages still flow via the templates. `ReceiptPreview`/`ReceiptPrintTemplate` remain in the codebase (POS no longer mounts `ReceiptPreview`, but the files are intact for reuse/rollback).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings; none in the two changed files); build succeeded; `next-env.d.ts` clean.
* All print verifies pass (VM / template-config / builder-config / company-info); grep-safety clean (no new financial logic; the pre-existing display-only subtotal `reduce` in `ReceiptPrintTemplate`/`ReceiptPreview` was not touched); translation keys for the POS labels confirmed present in `messages/en.json` + `ar.json`.
* Playwright not run (POS dialog isn't covered by the `/test/print-export` fixture spec; known headless limitation). Native POS print QA recommended.

Remaining gaps: autoPrint/copies not added; `ReceiptPreview`/`ReceiptPrintTemplate` consolidation/removal deferred; custom text blocks not started; favicon deferred; closing/thank-you not added; native POS print QA recommended.

---

### Phase 19Y.6 — Persist POS Default Print Template

Status:

* Completed. Frontend/settings-only POS print default persistence.
* No backend/DB/migration/API changes; no new settings key; no `posPrint` key.
* No autoPrint/copies; no legacy receipt component deletion; no custom text blocks; no favicon.
* No POS submit/payment/stock/accounting/treasury changes; no totals recalculation.

Changes:

* Added `receipt.defaultPosTemplate` under the existing `receipt` settings document, using the current template IDs (`thermal`, `luxuryGold`, `compactA4`, `minimal`) with Thermal fallback.
* Added a Settings -> Print & Invoice Design -> POS Print Behavior field for the default POS template.
* POS print dialog now seeds `initialOptions.templateId` from `settings.receipt.defaultPosTemplate || "thermal"` while keeping `documentMode: "auto"` and `languageMode: "bilingual"`.
* Added guard logic that accepts current template IDs and normalizes short legacy/prompt aliases (`luxury` -> `luxuryGold`, `compact` -> `compactA4`); invalid/missing values fall back to `thermal`.
* Temporary template changes inside the POS print dialog remain temporary and are not auto-saved.

Preserved:

* Existing `receipt` key and existing receipt fields.
* Sales invoice print defaults (`printTemplateDefaults`) and Sales print behavior.
* POS dialog opens only after successful invoice creation and still prints the server-returned invoice through `InvoiceDocument`.
* `ReceiptPreview` and `ReceiptPrintTemplate` remain in place for deferred legacy cleanup.

Verification:

* `npm run typecheck` clean.
* `npm run lint` passed with existing warnings only.
* `npm run build` succeeded.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js`, `verify-print-company-info.js` all ok.

Remaining gaps:

* autoPrint/copies deferred.
* legacy `ReceiptPreview`/`ReceiptPrintTemplate` cleanup deferred.
* custom text blocks not started.
* favicon deferred.
* closing/thank-you not added.
* broader accessibility cleanup deferred.
* native/manual POS print QA still recommended.

---

### Phase 19Y.8 — Duplicate POS Receipt Controls Cleanup

Status:

* Completed. Frontend Settings UI cleanup only.
* No backend/DB/migration/API changes; no settings key rename; no data deletion.
* No autoPrint/copies; no legacy `ReceiptPreview`/`ReceiptPrintTemplate` deletion.
* No POS checkout/payment/stock/accounting/treasury changes; no totals recalculation.
* No Print Builder schema expansion.

Changes:

* Cleaned duplicate POS/Receipt visibility controls from Settings -> Print & Invoice Design.
* Kept visible only:

  * Invoice & Receipt Messages (`welcomeMessage`, `headerNote`, `footerMessage`, `termsMessage`).
  * POS Print Behavior (`receipt.defaultPosTemplate`).

* Added helper text near POS Print Behavior that field visibility is controlled from Invoice Print Builder below.
* Added a short backward-compatibility note that legacy POS receipt options are preserved internally.
* Hid the old visible POS/Receipt paper/layout controls and visibility toggles:

  * `paperSize`, `layout`
  * `showLogo`, `showCashier`, `showBarcode`, `showQrCode`
  * `showCompanyName`, `showTaxNumber`, `showAddress`, `showPhone`
  * `showVatBreakdown`, `showCustomerInfo`, `showBranchInfo`

Preserved:

* Existing `receipt` key and `receiptForm` state fields.
* Existing `handleSaveReceipt` payload, so hidden legacy values are not stripped when saving messages/default template.
* Active POS printing continues through `InvoicePrintOptionsDialog` -> `InvoiceDocument`.
* Invoice Print Builder remains the field/section visibility source for active POS/Sales invoice templates.

Remaining gaps:

* Missing builder controls audit optional for barcode/QR/branch/VAT granularity.
* autoPrint/copies deferred.
* legacy `ReceiptPreview`/`ReceiptPrintTemplate` deletion deferred.
* custom text blocks not started.
* favicon deferred.
* closing/thank-you not added.
* broader accessibility cleanup deferred.
* native/manual POS print QA still recommended.

---

### Phase 19Y.2 — Receipt Settings Cleanup & POS Company Data Source

Status:

* Completed. Frontend-only. Removed the duplicate company-data inputs from the POS/Receipt settings card and made the POS receipt render company data from Company Profile first (receipt = legacy fallback).
* No backend/DB/migration/API; no settings-key rename; no data deletion; no POS print dialog; no custom text blocks; no favicon; no POS submit/payment/stock/accounting changes; no totals recalculation.

Changes:

* **Settings UI** (`settings/page.tsx`): removed the `receipt.phone` / `receipt.vatNumber` / `receipt.address` inputs from the "POS Receipt-specific Options" area and the now-duplicate `showVatNumber` toggle (`showTaxNumber` already governs TRN visibility). Added helper text: "Company name, logo, phone, TRN, and address are managed from Company Profile." Kept messages (welcome/header/footer/terms), paperSize/layout, and all POS visibility toggles. `receiptForm` still holds phone/address/vatNumber/showVatNumber and `handleSaveReceipt` still persists them → **legacy values preserved, not deleted**.
* **POS receipt data source** (`ReceiptPrintTemplate.tsx` + `ReceiptPreview.tsx`): both now resolve company **address / phone / TRN** as `company (Company Profile) → receipt.* fallback`. Address is formatted from structured company fields (`[address1, address2, city, region, country, postalCode].filter(Boolean).join(", ")`). `ReceiptPreview.handlePrint` passes the structured company fields into `ReceiptPrintTemplate`. TRN visibility now gated by `showTaxNumber` (was `showVatNumber`). Visibility toggles control visibility only, not the data source. Messages still from `receipt`.

Not changed (reported): pre-existing display-only subtotal `reduce` in `ReceiptPrintTemplate` (`invoice.subtotal ?? items.reduce(...)`) and `ReceiptPreview` (`baseSubtotal = items.reduce(...)`) were left intact — totals/tax/total still come from the server `invoice`. Invoice-print VM precedence unchanged (already company-first from 19X.2). `receipt.phone/address/vatNumber` schema/parse untouched; `receipt` key not renamed; `ReceiptPrintTemplate` kept.

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* All print verifies pass (VM / template-config / builder-config / company-info); grep-safety clean (only the pre-existing subtotal `reduce` + a helper-text string).
* Playwright not run (POS receipt not covered by the fixture spec; known headless limitation). Native POS print QA recommended.

Remaining gaps: POS print dialog (template selection + live preview) not started (19Y.3); custom text blocks not started; favicon deferred; closing/thank-you not added; native POS print QA recommended.

---

### Phase 19Y-Fix — Invoice Message Fields Across Templates

Status:

* Completed. Configurable invoice/print messages now render across all four invoice templates, using the **existing `receipt` settings key** (welcomeMessage / headerNote / footerMessage / termsMessage).
* No new settings key; no backend/DB/migration/API; no custom text blocks; no closing/thank-you field; no financial/business logic.

Changes:

* **ViewModel** (`invoice-print-view-model.ts`): added display-only `vm.messages = { welcomeMessage?, headerNote?, footerMessage?, termsMessage? }` sourced from `settings.receipt` (trimmed; empty → undefined). Kept **separate** from `vm.notes` (= per-invoice `invoice.notes`).
* **Builder config:** added section toggles `welcomeMessage`, `headerNote`, `footerMessage` (default `true`) to `PrintTemplateSectionConfig` + defaults (print-template-config.ts), the Zod `SectionConfigSchema` (print-builder-config.ts), and the Settings Print Builder section-toggle list. Reused existing `sections.terms` for `termsMessage`. Old saved builder configs sanitize safely (missing keys default true).
* **Templates (all four):** render messages from `vm.messages`, gated by the section toggles — welcome + header note near the header; terms in the terms section; footer message near the footer. **Luxury no longer reads `receiptConfig.termsMessage` directly** (removed the unused `receiptConfig`); all four now use `vm.messages.termsMessage`, so terms appears in Compact/Minimal/Thermal too (previously Luxury-only). Plain text, React-escaped, `white-space: pre-line`, no `dangerouslySetInnerHTML`; Thermal uses compact sizing; empty messages auto-collapse.
* **Settings UI:** the POS/Receipt card's message inputs are now under an **"Invoice & Receipt Messages / رسائل الفواتير والإيصالات"** sub-heading with helper text ("appear on printed invoices and POS receipts; plain text; do not affect totals"); POS-specific fields split under a "POS Receipt-specific Options" sub-heading. Same `receipt` save path; POS receipt behavior preserved.
* **Fixture/tests:** `FIXTURE_SETTINGS.receipt` messages added; `verify-invoice-print-view-model.js` asserts messages source/trim/empty→undefined + notes separation + totals unchanged; `verify-print-builder-config.js` asserts new section defaults + toggle round-trip; one export smoke test (terms in Compact/Minimal/Thermal, footer message in Luxury).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* All print verifies pass (VM / template-config / builder-config / company-info); grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; force-terminated). No artifacts tracked. Native browser QA recommended.

Preserved: `receipt` / `printTemplateDefaults` / `invoicePrintBuilderConfig` / `printCompanyInfo`; invoice `notes` stays separate; POS `ReceiptPrintTemplate` unchanged.

Remaining gaps: closing/thank-you message not added; custom text blocks not started; native print QA recommended; advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-G — Live Company Data in Invoice Preview

Status:

* Completed. Frontend/preview-only fix. The Settings → Print & Invoice Design builder preview no longer shows stale fixture company data.
* No backend/DB/migration/API changes; no financial/business logic; no invoice messages; no custom text blocks.

Root cause:

* Both preview `InvoiceDocument` instances passed the static `company={FIXTURE_COMPANY}` ("Test Jewellery Co", fixture TRN), so the preview reflected the demo fixture rather than the live/edited company data.

Fix (`app/[locale]/(dashboard)/settings/page.tsx` only):

* Added a memoized `livePreviewCompany` (useMemo — no setState, no loop) derived with precedence **Company Profile form state > auth company/session > FIXTURE_COMPANY (demo fallback)**, covering name/logo/branch/currency/TRN/phone/email/website + address (country/city/region/address1/address2/postalCode). Both previews now pass `company={livePreviewCompany}`.
* Demo invoice/items/customer/totals still come from `FIXTURE_INVOICE`. Preview `settings` still spreads real `settings` + unsaved `invoicePrintBuilderConfig: builderForm`, so builder toggles/theme/template/language stay live. `receipt`/`printCompanyInfo` remain contact/address fallback via the VM; identity stays company-first (printInfo.displayName/taxNumber cannot override).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* print verifies (VM / template-config / builder-config / company-info) all ok; grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; the settings preview isn't covered by the fixture spec anyway). No artifacts tracked. Native browser QA recommended.

Remaining gaps: invoice message expansion / custom text blocks not started; native print QA recommended; advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-F — Company Address Wiring

Status:

* Completed. Wires the official company address (existing DB columns) into Company Profile and invoice print.
* No new DB columns, no migration, no data deletion, no settings-key rename, no custom text blocks, no invoice-message expansion, no financial/business logic.

Audit outcome (no surprises):

* `companies` already has `country, city, region, address1, address2, postal_code, commercial_register`; `serializeCompany` already returns them; `DarfusCompany` already types them. The only gap was the `PATCH /settings` company whitelist (omitted them) and the missing Company Profile UI + VM formatting. `EGYPT` seen in output is `company.country`, not a full address.

Changes:

* **Backend (existing columns only):** extended the `PATCH /settings` company whitelist (erp.routes.js) with `country, city, region, address1, address2, postalCode, commercialRegister`. No model/migration change; `/settings/by-key` untouched.
* **settings-context:** `AppSettings` + `updateSettings` payload forward the seven address fields.
* **Company Profile UI:** new "Official Company Address / العنوان الرسمي للشركة" section (country, city, region, postalCode, address1, address2, commercialRegister) with helper text; `handleSaveCompany` sends them via `updateSettings` (→ PATCH /settings) + `updateCompany` (session). Load effect populates from the auth company. No company-address input remains in Print & Invoice Design.
* **ViewModel address:** formats `[address1, address2, city, region, country, postalCode].filter(Boolean).join(", ")`; precedence = formatted company address > `printCompanyInfo.address` > `receipt.address`. Country-only still yields a location string (acceptable). Display-only.
* **PrintCompany + templates + sales caller:** `PrintCompany` and the VM `options.company` gained the six structured address fields; all four templates forward them; the sales print caller passes them from the auth company.

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean; `node -c` on erp.routes.js ok.
* `verify-invoice-print-view-model.js` extended + ok (structured address formats and wins; country-only; printInfo fallback; receipt fallback; prior identity/contact precedence still holds). print-company-info / template-config / builder-config verifies ok. grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; force-terminated). No artifacts tracked. Native browser QA recommended.

Preserved keys: `receipt`, `printTemplateDefaults`, `invoicePrintBuilderConfig`, `printCompanyInfo` (address fallback). `printCompanyInfo.address` / `receipt.address` remain hidden fallback/backward-compat.

Remaining gaps:

* Invoice message expansion / custom text blocks not started.
* Native print QA recommended.
* Advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-C/D/E — Company Profile Contact Wiring + Print Source Cleanup

Status:

* Completed (frontend-only; the 19X.2-B dev migration was run: `20260704000000-add-company-contact-fields: migrated`). Finishes the company-data consolidation.
* No backend/DB/migration/API changes; no data deletion; no settings-key rename; no custom text blocks; no invoice-message expansion; no financial/business logic.

Changes:

* **Types (C):** `DarfusCompany` (auth-context) + `PrintCompany` (InvoicePrintTemplate) + `AppSettings` (settings-context) gained `phone/email/website`. `serializeCompany` already returns them (19X.2-B).
* **Company Profile UI (C):** added phone/email/website inputs alongside name/logo/currency/TRN; one Save button. `handleSaveCompany` now sends `taxNumber` (TRN persistence fix) + `phone/email/website` through `updateSettings` (→ `PATCH /settings`) and mirrors them into `updateCompany` (session). Load effect prefills contact fields from the DB company, falling back to legacy `printCompanyInfo` when the DB field is empty (frontend-assisted migration; no DB backfill). Address intentionally NOT added to Company Profile this phase — still served by `printCompanyInfo`/`receipt` fallback (reported).
* **settings-context (C):** `updateSettings` payload now forwards `taxNumber/phone/email/website` as company props (backend whitelist accepts them). PATCH whitelist on the frontend list unchanged for settings keys; `/settings/by-key` untouched.
* **Remove duplicate card (E):** deleted the "Company Print Info / بيانات الشركة للطباعة" card from Print & Invoice Design (and its state/handlers/preview wiring). `printCompanyInfo` key/schema/hook **kept** as fallback/backward-compat.
* **ViewModel precedence (D):** identity (`displayName`, `trn`) is now company-master-only — `printCompanyInfo.displayName/taxNumber` are ignored as overrides (kept in schema, no deletion). Contact fields resolve company → `printCompanyInfo` → `receipt`.
* **Print path wiring (required, reported):** to actually deliver DB company contact into print, `PrintCompany` gained phone/email/website, the sales print caller passes them from the auth company, and all four templates now build the VM `company` from the real company props (removing the old `receiptConfig.phone/address` injection into `options.company`; the VM still applies the `receipt` fallback internally, so no regression). `receiptConfig` retained only where still used (Luxury terms).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js` rewritten + ok: company businessName/taxNumber/phone/email/website win over old `printCompanyInfo`; empty company → printInfo fallback; empty both → receipt fallback; email undefined when no source. `verify-print-company-info.js` still ok (schema unchanged). template/builder verifies ok. grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; force-terminated). No artifacts tracked. Native browser QA recommended.

Preserved keys: `receipt`, `printTemplateDefaults`, `invoicePrintBuilderConfig`, `printCompanyInfo` (fallback).

Remaining gaps:

* True DB address wiring (address1/2/postalCode → print) optional/not started.
* Invoice message expansion / custom text blocks not started.
* Native print QA recommended.
* Advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-B — DB-Backed Company Contact Fields (backend/DB foundation)

Status:

* Completed (code). Backend/DB-only foundation for making Company Profile the master source of company contact data. **Migration NOT executed here** (requires a real DB; see below). No frontend/print/ViewModel/template changes.
* From the Phase 19X.1 + 19X.2 audits (Option B, staged). This is phase **B** (backend + migration + serializer). Frontend wiring / precedence cleanup / duplicate-card removal are later phases C/D/E — NOT started.

Changes:

* Migration `backend/migrations/20260704000000-add-company-contact-fields.js` (new): additive, idempotent (`columnExists` guard), adds nullable columns to `companies` — `phone STRING(40)`, `email STRING(160)`, `website STRING(200)`. No defaults, no index, no backfill, no data rewrite. `down` removes the three columns if present. Mirrors the established pattern (e.g. `20260627010000-add-purchase-vat-fields.js`).
* `backend/src/models/company.model.js`: added `phone`/`email`/`website` attributes (nullable; single-word names map cleanly under `underscored: true`).
* `backend/src/routes/erp.routes.js` (`PATCH /settings`): extended the company whitelist loop to `["businessName","logo","currency","branchName","taxNumber","phone","email","website"]`. Existing fields unchanged; settings JSONB behavior and `/settings/by-key` untouched; permission (`settings.update`) unchanged.
* `backend/src/controllers/auth.controller.js` (`serializeCompany`): added `email` and `website` (empty-string fallback); `phone` (already listed) now resolves from the real DB column. Flows through login/refresh/me/register/logout responses (single serialization point).

Migration execution:

* **Not run.** Command for a safe/dev DB: `cd backend && npm run db:migrate` (never against production). Columns are additive + nullable, so pre-migration the code is safe: existing rows serialize the new fields as `""` and the whitelist simply no-ops for absent values.

Safety / compatibility:

* `taxNumber` already backend-supported (unchanged). `printCompanyInfo` schema/key and the current print fallback remain the source for print contact data until the frontend phase (C). Existing frontend + print output unchanged. No financial/business logic; grep-safety clean on changed files. typecheck/lint/build green; syntax checks (`node -c`) pass on all changed backend files + migration; print verifies all ok.

Remaining next phases:

* 19X.2-C — frontend Company Profile wiring (send phone/email/website + fix TRN send; prefill from `printCompanyInfo`).
* 19X.2-D — print ViewModel precedence cleanup (company-first identity; company→printInfo→receipt contact).
* 19X.2-E — remove the duplicate Company Print Info card from Print & Invoice Design.
* Invoice messages / custom text blocks / advanced features — not started.

---

### Phase 19X-Fix — Print Company Info Source + Email End-to-End

Status:

* Completed. Frontend-only. Added a new settings JSONB key `printCompanyInfo` (display-only company print contact/branding), saved via the generic `PUT /settings/by-key/printCompanyInfo`.
* No backend/DB/migrations/API/new-endpoint changes; no company model columns; no `PATCH /settings` whitelist change; no localStorage; no custom text blocks; no financial/business logic; no ViewModel calculation changes.

Problem addressed (from the Phase 19X audit):

* Company `email` had no end-to-end source: the company DB model has no email/phone/website columns; templates never passed email into the ViewModel; `vm.company.email` was always empty even though the `footerEmail` toggle/slot exists.

Storage / schema:

* `features/printing/lib/print-company-info-config.ts` (new): `PrintCompanyInfoConfig` type + `DEFAULT_PRINT_COMPANY_INFO_CONFIG` + `sanitizePrintCompanyInfoConfig` (Zod-based; never throws; strips unknown keys; trims + caps lengths; clears invalid email/website rather than rejecting the payload; input `version` ignored, output normalized to 1). Fields: displayName, subtitle, phone, email, website, address, taxNumber.
* `hooks/use-print-company-info.ts` (new): reads `settings.printCompanyInfo` (memoized-sanitized to avoid render loops), exposes `config / isSaving / error / saveConfig`; saves via by-key then `refreshSettings()`.
* `scripts/verify-print-company-info.js` (new) + `package.json` script `verify:print-company-info`.

ViewModel merge (`features/printing/lib/invoice-print-view-model.ts`):

* Added display-only `subtitle` + `website` to the VM company type (and optional `website` to the options.company input type).
* Layering (display-only): `printCompanyInfo` > company master > legacy `receipt` fallback, for displayName/subtitle/phone/email/website/address/trn. Existing `receipt` fallbacks preserved. No totals/VAT/item/payment changes. Import-free (keeps the plain-`require` VM verify script working).

Settings context (`contexts/settings-context.tsx`):

* Added `printCompanyInfo?: any` to `AppSettings` and to the JSON parse-keys list. PATCH whitelist NOT touched (writes go through by-key only).

Settings UI (`app/[locale]/(dashboard)/settings/page.tsx`):

* New "Company Print Info / بيانات الشركة للطباعة" card in the unified Print & Invoice Design tab, between Invoice Print Defaults and the Print Builder. Fields displayName/subtitle/phone/email/website/address/taxNumber, Save + Reset, helper text ("print display only; does not modify company master data; leave blank to use fallback"). Signature-guarded rehydrate effect (Phase 19U-Hotfix pattern) to avoid update loops. Builder live preview now merges the sanitized in-progress company info (`printCompanyInfo: previewCompanyInfo`).

Rendering:

* Email now flows end-to-end into all four templates' footer via the existing `footerEmail` field/slot — no template file changes needed. `website` and `subtitle` are stored (and merged into the VM) but NOT yet rendered in templates (reported as stored-but-not-rendered; future phase).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings only); build succeeded; `next-env.d.ts` clean.
* `verify-print-company-info.js` ok (default/fallback/unknown-key-strip/invalid-email+website-clear/length-cap/version-normalize); `verify-invoice-print-view-model.js` extended + ok (email sourced from printCompanyInfo; precedence; receipt fallback still works); template-config + builder-config verifies ok; financial-safety grep on changed files clean.
* `npm run test:print-export` not run to completion (known headless Playwright `webServer`/browser limitation; run force-terminated). Added one smoke assertion (configured email renders in footer) + `printCompanyInfo` in the fixture; no artifacts tracked (gitignored). Native browser QA recommended.

Preserved keys (unchanged): `receipt`, `printTemplateDefaults`, `invoicePrintBuilderConfig`.

Remaining gaps:

* Invoice message fields expansion (greeting/closing/footer/terms into A4 invoice templates) not started (Phase 19Y).
* Custom text blocks not started (Phase 19Z).
* `website`/`subtitle` stored but not rendered in templates yet.
* Native/manual browser print QA still recommended.
* Advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19W — Settings Print Tabs Consolidation

Status:

* Completed. UI-only Settings page consolidation (`app/[locale]/(dashboard)/settings/page.tsx`).
* No backend/DB/migrations/API changes; no settings-key rename; no data migration; no deletion of saved settings; no localStorage; no new Builder controls; no company email/custom-text additions; no financial/business logic; no ViewModel/template output change.

Problem:

* Settings previously showed two competing tabs that both sounded like invoice design: `receipt` (تصميم الفاتورة / Receipt Layout) and `printBuilder` (مُصمّم الطباعة / Print Builder).

Change (Option A — single visible tab, multiple existing keys):

* Merged the `receipt` and `printBuilder` tabs into one tab `printDesign`, labelled **تصميم الطباعة والفواتير / Print & Invoice Design**. The `activeTab` union dropped `receipt` and `printBuilder` and gained `printDesign`; the two tab-list entries collapsed into one.
* All three cards now render under the single `printDesign` tab, each still saving to its own existing key:
  * POS / Receipt Print Options → `receipt` (relabelled heading + description to make clear it is POS/thermal receipt + messages, not A4 invoice design; card body/toggles/save unchanged).
  * Invoice Print Defaults → `printTemplateDefaults` (unchanged).
  * Invoice Print Builder → `invoicePrintBuilderConfig` (unchanged; toggles, theme presets, live preview, reset, save all intact).
* Card physical order was intentionally preserved (POS/Receipt, then Invoice Print Defaults directly above the Print Builder) to avoid a risky large block relocation; the POS/Receipt description points to the invoice templates below it. Invoice Print Defaults and Print Builder remain adjacent/grouped.
* No external deep-links referenced the old `receipt`/`printBuilder` tab ids (grep-verified), so no navigation callers needed updating.

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings only); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok; financial-safety grep on the changed file clean (only pre-existing payment-method *settings* labels, no calculation logic).
* `npm run test:print-export` not run to completion in this headless environment (Playwright `webServer`/browser dependent; the run was force-terminated). No artifacts tracked (gitignored). Native browser QA recommended: one clear print/invoice design tab; Invoice Print Defaults sits with the Builder; Builder toggles + preview work; POS/receipt settings still accessible and clearly labelled; save + refresh persists `receipt`, `printTemplateDefaults`, and `invoicePrintBuilderConfig`.

Remaining gaps:

* Company print info + messages (incl. missing company email) / custom text blocks not started (Phase 19X).
* Native/manual browser print QA still recommended.
* Builder advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19V-Fix — CSP Upload Image Origin

Status:

* Completed. Frontend-only CSP config fix (from the Phase 19V audit).
* No backend/DB/migrations/API changes; no `PATCH /settings`; no localStorage; no financial/business logic; no Builder/UI changes.

Root cause:

* The Content-Security-Policy is defined in `next.config.ts` (`headers()`, applied to `/:path*`, all environments). Its `img-src 'self' data: blob:` omitted the backend upload origin, so logos served cross-origin from `<backend>/uploads/...` (e.g. `http://localhost:8000/uploads/...`, via `lib/files.ts` `getPublicFileUrl` → `getApiOrigin()` from `NEXT_PUBLIC_API_URL`) were blocked in the app UI and the print iframe (which inherits the parent-page CSP).

Fix (`next.config.ts` only):

* Added a `getOrigin(value)` helper and a de-duplicated `uploadImageOrigins` allow-list derived from env only: `NEXT_PUBLIC_API_ORIGIN`, `NEXT_PUBLIC_API_URL`, `BACKEND_ORIGIN`. `'self'` already covers the frontend origin (FRONTEND_URL intentionally not added).
* CSP `img-src` is now `'self' data: blob: <configured upload origins>`. In dev this resolves to `http://localhost:8000`; in production it uses the configured backend/asset origin. No wildcard `img-src *`; the rest of the CSP is unchanged.

Result: settings logo/image preview, sales image preview, and the invoice print logo (main page + print iframe) can load backend uploads; CSP stays restrictive.

Verification:

* typecheck clean; lint 0 errors; build succeeded; `next-env.d.ts` clean.
* origin derivation confirmed: `new URL("http://localhost:8000/api/v1").origin` → `http://localhost:8000`.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok; financial-safety grep clean.
* `npm run test:print-export` not run to completion in this headless environment (Playwright `webServer`/browser dependent). Native browser QA of the three surfaces + DevTools console (no `img-src` CSP violation for backend uploads) recommended.

Remaining gaps:

* Settings tab consolidation (receipt vs printBuilder) not started (Phase 19W).
* Company print info + messages (incl. missing company email) not started (Phase 19X).
* Native/manual browser print QA still recommended.
* Builder advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19U-Hotfix — Stabilize Print Builder Settings State

Status:

* Completed. Frontend-only hotfix for a `Maximum update depth exceeded` crash on the Settings Print Builder tab (`app/[locale]/(dashboard)/settings/page.tsx:187`).
* No backend/DB/migrations/API changes; no `PATCH /settings`; no localStorage; no financial/business logic; no new Builder feature.

Root cause:

* `useInvoicePrintBuilderConfig` called `sanitizeInvoicePrintBuilderConfig(...)` on every render, returning a NEW object each time. The Settings page's `useEffect(() => setBuilderForm(savedBuilderConfig), [savedBuilderConfig])` therefore saw a new dependency reference every render → `setBuilderForm` → re-render → infinite loop.

Fix:

* `hooks/use-invoice-print-builder-config.ts`: memoize `config` with `useMemo(() => sanitizeInvoicePrintBuilderConfig(rawBuilderConfig), [rawBuilderConfig])` so it keeps a stable reference across renders (the raw settings value is stable between reloads). Save path unchanged.
* `app/[locale]/(dashboard)/settings/page.tsx`: defensive guard — a `savedBuilderConfigSignature = useMemo(() => JSON.stringify(savedBuilderConfig), [savedBuilderConfig])` plus `setBuilderForm(prev => JSON.stringify(prev) === signature ? prev : savedBuilderConfig)`, so a redundant/unstable config can never trigger an update loop (returning `prev` makes React bail out).

Preserved (unchanged): saving/reading `invoicePrintBuilderConfig`, Builder toggles, preview panel, theme presets, Sales print application, and the 19U-Fix modal scroll-lock.

Verification:

* typecheck clean; lint 0 errors (1 pre-existing `<img>` logo warning); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok; financial-safety grep clean.
* `npm run test:print-export` again not run to completion in this headless environment (Playwright `webServer: npm run dev` on :3000 / browser dependent). No artifacts left (gitignored). Native browser QA of the Print Builder tab (no crash, save/refresh rehydrate, Sales print applies, scroll intact) recommended.

---

## 6. Current Next Phase

Phase 19T is complete. Next intended phase:

```text
Phase 19U — Builder advanced settings controls
```

Purpose:

* Add control sliders or selectors for print settings like margin scale (small/medium/large), document title custom wording, and font selections.
* Save customized properties safely under `invoicePrintBuilderConfig` per-template.
* Keep the E2E print export tests green.

---

## 7. Known Gaps / Deferred Work

Return/Exchange:

* Full line-level return/exchange history requires migration to store `originalInvoiceItemId`.
* Current double guard remains product-level and conservative.
* Partial return/exchange remains deferred.

Print/Search:

* No unified Search & Print route/filter layer yet.
* `tests/export-print.spec.ts` added in 19O-Fix; `npm run test:print-export` passes (11 tests).
* Native print preview/manual browser QA is still recommended.
* Real thermal printer / 80mm roll behavior still needs manual QA.
* Print Template Builder UI has not been started.
* PDF generator has not been started.
* `InvoicePrintViewModel` exists.
* Current template uses the ViewModel.
* Dynamic titles by invoice type exist in the ViewModel helper.
* Payment rows exist in backend but are not included in generic invoice detail.
* Installment rows exist but are not included in generic invoice detail.
* Company/customer/branch print fields may need future read-only exposure.
* Gift Voucher and Customer Gold Purchase require special print modeling.
* Company stamp/signature assets and watermark settings are not confirmed.
* Customer phone/TRN/address may be missing from current invoice print data.
* Line-level VAT/net/total may be missing; do not invent financial truth.

---

## 8. Print ViewModel Principles

Future print ViewModel must follow:

* Read-only.
* Display-only.
* No DB writes.
* No API mutations.
* No financial recalculation.
* Invoice/system totals are source of truth.
* Fallbacks must be clearly display-only.
* Missing data should become warnings/gaps, not invented values.
* Branding must come from company/settings, not hardcoded.
* Titles should be dynamic by invoice type and tax context.
* Special invoice types must not be printed as normal sales invoices.

Suggested ViewModel direction:

```ts
type InvoicePrintViewModel = {
  document: {
    titleAr: string;
    titleEn: string;
    type: string;
    number: string;
    date: string;
    status?: string;
    originalInvoiceNumber?: string;
  };
  company: {
    nameAr?: string;
    nameEn?: string;
    logoUrl?: string;
    watermarkUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    trn?: string;
  };
  customer: {
    name?: string;
    phone?: string;
    trn?: string;
    address?: string;
  };
  items: Array<{
    index: number;
    descriptionAr?: string;
    descriptionEn?: string;
    karat?: string;
    weight?: number;
    quantity?: number;
    netAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
  }>;
  payments: Array<{
    methodLabelAr: string;
    methodLabelEn: string;
    amount: number;
    currency: string;
  }>;
  totals: {
    netAmount?: number;
    vatRate?: number;
    vatAmount?: number;
    totalAmount?: number;
    totalPaid?: number;
    balance?: number;
    currency?: string;
  };
  notes?: string;
  warnings?: string[];
  special?: {
    exchange?: {
      returnedItems?: unknown[];
      newItems?: unknown[];
      difference?: number;
    };
    installments?: {
      downPayment?: number;
      remainingBalance?: number;
      scheduleSummary?: unknown[];
    };
    deposit?: {
      depositStatus?: string;
      redeemedAmount?: number;
    };
    giftVoucher?: {
      voucherNumber?: string;
      expiryDate?: string;
      redemptionPolicy?: string;
    };
    customerGoldPurchase?: {
      goldWeight?: number;
      karat?: string;
      purchaseRate?: number;
    };
  };
};
```

---

## 9. Verification Baseline

Recent reported green before 19PREP:

* return/exchange duplicate product lines contract
* sales return product support
* sales exchange product support
* sales exchange mixed items contract
* returns/exchange contract
* API contracts
* frontend typecheck
* frontend lint
* frontend build

For print work, future verification should include:

* sales title
* tax title
* return title
* exchange title
* installment title
* deposit title
* gift voucher title
* customer gold purchase title
* items mapping
* totals mapping from stored invoice values
* payment mapping
* missing logo fallback
* missing TRN fallback
* no client-side financial recalculation

---

## 10. Do Not Touch Without Explicit Phase

* backend posting/accounting logic
* VAT calculation
* COGS calculation
* stock movement logic
* treasury/payment mutation logic
* invoice posting status logic
* migrations
* seeders
* stashes
* production database
* destructive Git commands
* existing return/exchange contracts unless the phase explicitly targets them

---

## 11. Last Updated

### Latest Approved Exchange Display State (Phase 30.5 → 30.7-Fix)

**Current approved HEAD:** `a534ffc feat: render customer-safe exchange invoice print`

The customer-facing exchange display track is now complete across the three surfaces
that show an exchange to a person: the sales invoice detail, the customer history,
and the printed/customer-facing invoice. All three consume the **trusted**
`GET /invoices/:id/exchange-display` endpoint and never recompute VAT/tax/totals on
the frontend. Normal (non-exchange) invoices are unchanged on every surface.

**Phase 30.5-Fix — Sales Detail Exchange Summary** — commit `0d65b36 feat: add exchange summary to sales detail`
- Added the `ExchangeSummary` UI to the sales invoice detail + an exchange-display hook for `GET /invoices/:id/exchange-display`.
- Sales detail fetches exchange-display only for `selected?.type === "exchange"`; successful enrichment replaces raw exchange rows/totals; loading avoids a raw negative-row flash.
- Endpoint error / 403 falls back to the stored raw invoice detail with a warning. Normal invoices unchanged.
- No frontend tax recalculation; no backend/API/DB/migration changes.

**Phase 30.6-Fix — Customer History Exchange Summary** — commit `a76f190 feat: add exchange summary to customer history`
- Customer detail Sales & Invoices tab gained an exchange-only "View exchange summary" action; summary is fetched lazily only for the expanded/selected exchange invoice.
- Reuses the trusted `/invoices/:id/exchange-display` and the existing `ExchangeSummary`; no raw exchange item rows render inside the summary panel.
- Endpoint error / 403 falls back to the existing customer invoice row with a warning. Normal invoices unchanged.
- No frontend tax recalculation; no backend/API/DB/migration changes; customer statement unchanged; print unchanged in that phase; POS unchanged.

**Phase 30.7-Fix — Exchange Invoice Print Display** — commit `a534ffc feat: render customer-safe exchange invoice print`
- Added the print-safe `features/printing/components/ExchangePrintSummary.tsx`; the sales print handler passes the trusted exchange-display data into print when available.
- Exchange invoices in print now **suppress** the raw negative exchange item rows, the raw negative totals, and the misleading near-zero exchange "difference" derived from `remainingAmount`.
- Luxury/default, Compact, Minimal, and Thermal templates all render the customer-safe exchange print summary (gated by `invoice.type === "exchange"`). Normal invoice print unchanged.
- Missing/unavailable exchange-display renders a conservative warning and never invents numbers. The screen `ExchangeSummary` is **not** reused directly in print — the print render is static (`renderToStaticMarkup`) with no React Query / NextIntl provider — so a print-safe component (`locale` prop, inline styles) is used instead.
- No frontend tax recalculation; no backend/API/DB/migration changes; customer statement unchanged; POS checkout/payment unchanged; legacy `ReceiptPrintTemplate.tsx` remains deferred.

**Current coverage — DONE:** sales invoice detail exchange display · customer history exchange display · customer-facing exchange invoice print display.

**Not yet covered / deferred:**
- Customer statement / source-aware exchange reconciliation
- Exchange settlement mutation UI
- POS customer-credit payment
- Source-aware 2300 reconciliation
- Granular permissions
- Legacy `ReceiptPrintTemplate.tsx` exchange path
- Optional missing print verifier scripts: `verify-print-dialog.js`, `verify-pos-print-template.js`

**Data-safety rules going forward:**
- Use the trusted `/invoices/:id/exchange-display` for all customer-facing exchange summaries.
- Do NOT recalculate VAT/tax/totals on the frontend from raw invoice items.
- Do NOT change historical posted invoice totals without an explicit accounting phase.
- Do NOT treat the customer statement as display-only until source-aware reconciliation is audited.
- Do NOT include customer-credit / 2300 logic in frontend-only phases.
- Keep normal invoices unchanged in every exchange display phase.

**Recommended next phase:** `Phase 30.8 Audit — Customer Statement & Source-aware Exchange Reconciliation` (sales detail, customer history, and print are covered; the customer statement remains high-risk and may need backend/source-aware reconciliation rather than a frontend-only UI — audit before any fix).

---

Updated by AI during:

```text
Phase 31.1 — Client Scope Lock + Hide Accounting-Sensitive UI
(follows the Phase 31.0 Client Scope Cleanup & Alignment Audit, which compared the client requirement
files at H:\client-requirements against the system. The Phase 30 accounting-diagnostic track is PAUSED;
client requirements are now the source of truth. Added docs/CLIENT_SCOPE_LOCK.md (7 sections: Source of
Truth, In Scope / customer-facing, Internal Only, Hidden Until Sign-off, Deferred / Needs Client Sign-off,
Needs Accounting Sign-off, Do Not Remove Without Approval). Hid the accounting-sensitive UI on the customer
detail page (app/[locale]/(dashboard)/customers/[id]/page.tsx) behind a module flag
const SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS = false: the source-aware statement-v3 toggle and the customer
credit reconciliation panel are no longer rendered by default (statement-v2 remains the default, and the
components/queries/repository methods/backend endpoints are ALL KEPT intact — only entry points are gated).
Added scripts/verify-client-scope-lock.js (doc sections present; UI gated by the flag; v2 kept; nothing
deleted; scope guard). NO deletions; NO backend accounting/posting/balance/statement/2300 changes; NO
migrations; NO POS/print changes; NO missing client features built. UAE Government E-Invoicing remains the
P0 missing requirement but is DEFERRED to a dedicated scope + accounting/client sign-off phase. typecheck/
lint(0 err)/build ok; verify-client-scope-lock passes; the two UI content verifiers pass (their content
checks are unaffected by the flag; their tree-scoped guards clear post-commit). 11 stashes untouched.
Next recommended: Phase 31.2 Audit — UAE Government E-Invoicing Scope & Sign-off (do not implement yet).)

Previous marker:
Phase 30.13-Fix — Full 2300 Per-customer Diagnostic (read-only, informational)
(follows Phase 30.13 audit. Added backend/src/services/full-2300-reconciliation.service.js — a PURE,
READ-ONLY buildFull2300Reconciliation() that reconstructs the account-2300 balance per customer BY SOURCE
CATEGORY from already-fetched data (no DB access, no IIFE, no execSync, no writes, no ORM calls, no side
effects at import). Categories: customer_credit_ledger, gold_pool_liability, pos_deposit_sale_liability,
unresolved_or_other. Per-customer attribution hops JournalEntry.sourceType → sourceId → source document →
customerId (customer_credit→CustomerCreditTransaction; exchange/return→invoice→customer_credit_ledger;
deposit→invoice→pos_deposit_sale_liability; customer_gold_pool→CustomerGoldPool→gold_pool_liability;
anything else→unresolved bucket). Uses the signed liability convention signedAmount = credit − debit and a
GL cross-check (Σ per-customer resolved + unresolved === company 2300 GL balance, matchesGl within 0.01).
INFORMATIONAL ONLY: meta.customerFacing=false, mutatesData=false, statementChanged=false,
injectsGoldPoolIntoStatement=false, requiresAccountingSignoffForUiOrPostingChanges=true. NO endpoint added
(service + verifier only, minimal scope). New verify-full-2300-reconciliation.js (functional + static +
scope guard) passes. typecheck/lint(0 err)/build ok; non-tree-scoped verifiers pass; tree-scoped guards
pass on the clean tree post-commit. Did NOT change statement-v2/v3, Customer.balance, invoice totals,
Payment/CashTransaction/CustomerCreditTransaction/CustomerGoldPool/JournalEntry/JournalLine records, posting
service, 2300 posting, gold-pool logic, POS, print, permissions, frontend, or migrations. Gold-pool NOT
injected into statement-v3. next-env.d.ts (generated) was already dirty on entry and was left untouched.
Deferred (accounting sign-off required): full-2300 frontend/report UI, showing full 2300 to users, adding a
customerId/supplierId dimension to journal lines, historical 2300 reclassification. 11 stashes untouched.)

Previous marker:
Phase 30.12-Hotfix-2 — Safe Fix for Remaining Statement v3 Date Formatting Crash
(follows Phase 30.12-Hotfix. Replaced remaining direct `.slice(0, 10)` date handling on createdAt/date values inside backend/src/services/source-aware-statement.service.js with the safe toDateOnly helper to prevent Date object formatting crashes. Confirmed CustomerCreditTransaction query does not request invalid date column. No statement-v2 changes. No frontend changes. No balance/accounting/posting changes. No migrations.)

Phase 30.12-Hotfix — Fix Statement v3 CustomerCreditTransaction Date Handling
(follows Phase 30.12-Fix. Fixed Statement v3 load failure. Removed invalid date attribute from CustomerCreditTransaction query in backend/src/routes/erp.routes.js. Added toDateOnly safe Date/string formatting helper in backend/src/services/source-aware-statement.service.js to prevent TypeError. No statement-v2 changes. No frontend changes. No accounting/posting changes. No migrations.)

Phase 30.12-Fix — Frontend Source-aware Statement v3 Toggle/View
(follows Phase 30.12 audit. Added frontend source-aware statement v3 toggle/view. Existing statement-v2 remains default Legacy / Document-only. Statement v3 loads lazily only when selected. Uses GET /customers/:id/statement-v3. Displays dual-ledger view: AR Statement and Customer Credit Ledger. Customer Credit Ledger is clearly labeled as not full account 2300. Non-authoritative rows are highlighted. Read-only warning shown. No backend changes. No statement-v2 changes. No balance changes. No accounting/posting changes. No migrations.)

Phase 30.11-Fix — Source-aware Customer Statement v3 Backend Endpoint
(follows Phase 30.11 audit. Added new read-only source-aware customer statement endpoint. New endpoint: GET /customers/:id/statement-v3. statement-v2 remains unchanged as legacy/document-only statement. New statement uses Dual-Ledger View: AR statement and Customer Credit Ledger. Negative exchange/return excess is clamped to AR relief. Cash transactions are shown as statement rows where linked/authoritative. Customer credit ledger is credit-ledger-only, not full account 2300. No frontend changes. No balance changes. No posted data changes. No accounting/posting changes. No migrations. Uncertain settlement remains non-authoritative and warning-only.)

Phase 30.10-Fix — Collapsed Customer Credit Reconciliation Panel
(follows Phase 30.10 audit. Added collapsed read-only customer reconciliation panel in Statement tab. Panel consumes GET /customers/:id/credit/reconciliation. Query is lazy/on-demand. No backend changes. No statement-v2 changes. No balance changes. No accounting/posting changes. No migrations. Customer credit balance is labeled as credit-ledger-only, not full 2300. Diagnostic displays categories, warnings, documents, and metadata. Non-authoritative settlement remains clearly labeled.)

Phase 30.9-Fix — Customer Credit / 2300 Reconciliation Report (read-only)
(follows Phase 30.9 audit. Added read-only customer credit / 2300 reconciliation endpoint. Extracted statement reconciliation logic into pure backend service statement-reconciliation.service.js. Refactored diagnostic verifier to reuse pure service. Added GET /customers/:id/credit/reconciliation. Endpoint is GET-only and guarded by customers.view. customerCreditBalance is credit-ledger-only, not full 2300. Statement-v2 unchanged. Customer balances unchanged. Posted data unchanged. No accounting/posting changes. No frontend changes. No migrations. best_effort / unavailable settlement remains non-authoritative.)

Phase 30.8-Fix — Customer Statement Reconciliation Diagnostic (read-only)
(follows Phase 30.8 audit. Added scripts/verify-customer-statement-reconciliation.js — a READ-ONLY
diagnostic that identifies and categorizes the divergence between statement-v2's source-document closing
balance and the true source-aware AR / customer-credit (2300) position. It exports a pure reconcileCustomer()
that takes already-fetched invoices/payments/cashTransactions/creditTransactions + Customer.balance +
per-invoice exchange/return settlement meta and returns a report { statementClosingBalance, customerBalance,
customerCreditBalance, sourceAwareEstimatedArBalance, difference, categories[], documents[], warnings[],
meta:{ source:"diagnostic_read_only", mutatesData:false, statementChanged:false, ledgerBased:"diagnostic_only",
settlementAuthority } }. Categories: exchange_paid_now_cash_missing_from_statement, exchange_excess_over_reduces_ar,
customer_credit_2300_conflation, return_excess_cash_refund_over_credits_statement, settlement_best_effort_non_authoritative,
settlement_unavailable, legacy_exchange_policy, unknown_exchange_policy. best_effort/unavailable settlement and
legacy/unknown policy are flagged NON-authoritative (never auto-corrected). The script also statically asserts
statement-v2 is unchanged (source_documents, ledgerBased:false, returns→credit, exchange→ordinary invoice/debit,
signed inv.total, reads Payment only — NOT CashTransaction/CustomerCreditTransaction) and a scope guard that this
phase touched no statement/frontend/print/POS/migration/mutation. NOTHING was fixed: statement-v2 behavior,
Customer.balance, invoice totals/remainingAmount, Payment/CashTransaction/CustomerCreditTransaction records, GL/2300
posting, and the frontend statement are all unchanged. No backend route/service added (minimal script-only scope);
no migration. typecheck/lint(0 err)/build ok; the new verifier + non-tree-scoped verifiers pass (the phase-scoped
guards pass on the clean tree post-commit). 11 stashes untouched. Deferred: actual source-aware statement rebuild,
2300 reconciliation UI/report, exchange settlement mutation UI, POS customer-credit payment, granular permissions,
legacy ReceiptPrintTemplate exchange path.)

Previous marker:
Phase 30.7-Fix — Exchange Invoice Print Display (frontend/print only)
(follows Phase 30.7 audit. Exchange invoice PRINT now renders a customer-safe summary from the trusted
/invoices/:id/exchange-display data instead of raw negative item rows / negative totals. New print-safe
component features/printing/components/ExchangePrintSummary.tsx: `locale` as a prop (no useLocale / no
next-intl provider — safe under renderToStaticMarkup), no React Query / useExchangeDisplay, no Badge /
Tailwind (inline styles only), all amounts from ExchangeDisplayResponse.figures clamped with Math.max(0,…)
(never negative), and a conservative fallback warning when trusted data is absent. All four templates
(Luxury/Compact/Minimal/Thermal) gain `const isExchange = invoice.type === "exchange"`: for exchange they
render <ExchangePrintSummary exchangeDisplay={exchangeDisplay ?? null} …/> and SUPPRESS the raw item
table, the raw totals/amount-details, and the misleading special.exchange difference; normal invoices are
unchanged. InvoicePrintTemplateProps gained optional exchangeDisplay (forwarded by InvoiceDocument via
...props). sales/page.tsx print handler passes exchangeDisplay only when the printed invoice is the
selected exchange invoice (else undefined → fallback). No frontend tax recalculation — trusted figures
only. New verify-exchange-print-display.js. typecheck/lint(0 err)/build ok; core print verifiers
(invoice-print-view-model, print-template-config) + return/exchange settlement verifiers pass. Backend/
API/DB/migrations/POS-checkout/customer-statement unchanged; ReceiptPrintTemplate untouched. NOTE: listed
verifiers verify-print-dialog.js and verify-pos-print-template.js do not exist in the repo (reported, not
faked). 11 stashes untouched. Deferred: customer statement/source-aware 2300 reconciliation, exchange
settlement UI, POS customer-credit payment, granular permissions.)

Previous marker:
Phase 30.3-Fix — Live Exchange Tax-Base Change (backend only)
(follows Phase 30.3 audit. Changed live POST /sales/exchanges to reuse
backend/src/services/exchange-policy.service.js for the approved exchange policy.
VAT is now calculated on new replacement item subtotal only; returned item value is treated
as a flat exchange credit; the live route uses newSubtotal, newTax, newGross, difference,
amountDueFromCustomer, arRelief, and excessDueToCustomer from the helper. Excess due to
customer is not taxable, settlement validates against excessDueToCustomer, and AR relief
remains first. The exchange journal remains one journal only: positive differences debit
cash/bank or AR, customer-owed exchanges credit AR/cash/bank/2300 as applicable, and VAT
credits 2200 for newTax only. exchange_credit still records CustomerCreditTransaction with
an explicit journalEntryId and NO glPosting. No postCashEntry. No frontend UI, print/display,
print view-model, POS, return flow, migration, seed/reset, backfill, deposit/refund/apply-credit,
or dashboard/report rewrite. Historical exchange records remain unchanged. Added
verify-live-exchange-tax-policy.js and package script verify:live-exchange-tax-policy; updated
legacy static verifiers for the new live policy. Deferred: exchange customer-facing display
usage, exchange print/display phase, exchange settlement UI, POS customer-credit payment,
source-aware 2300 reconciliation, granular permissions.)

Previous marker:
Phase 30.2-Fix — Exchange Preview & Customer-Facing Policy Helper
(follows Phase 30.2 audit. Added read-only POST /sales/exchanges/preview using sales.create
permission and the current exchange input shape/safe subset. Preview loads the original invoice and
items, validates company/posting state/returned line/new replacement items, performs NO writes, and
returns target-policy figures only: returnedValue, newSubtotal, newTax, newGross, difference,
amountDueFromCustomer, arRelief, excessDueToCustomer, settlementPreview, taxPolicy, and
customerFacing metadata. Added backend pure helper backend/src/services/exchange-policy.service.js:
VAT applies to new replacement item subtotal only, returned value is a flat exchange credit, excess
due to customer is not taxable, and optional settlement is validated against excessDueToCustomer
using cash 1110 / bank 1120 / credit. Added frontend/shared helper lib/exchange-policy.ts to build
a customer-facing model that clamps display amounts, forbids negative product lines/totals, labels
Balance due to customer, and carries the policy note. Added verify-exchange-tax-customer-facing-policy.js
and package script verify:exchange-tax-customer-facing-policy; adjusted legacy scope verifiers to allow
the preview/helper files. CRITICAL: no live /sales/exchanges posting/tax-base/storage behavior changed:
diffBase/diffTax/diffTotal, negative return line storage, exchange journal lines, settlement execution,
and print/view rendering remain unchanged. No print template changes, no POS changes, no return UI
changes, no DB migration. Deferred: live exchange tax-base change pending explicit business/tax sign-off,
exchange settlement UI, exchange print/display phase, POS customer-credit payment, source-aware 2300
reconciliation, granular permissions.)

Previous marker:
Phase 30.1-Fix — Return Settlement UI (frontend, return only)
(follows Phase 30.1 audit. Added settlement controls to the sales RETURN form only
(app/[locale]/(dashboard)/sales/returns/page.tsx). Backend was already ready (Phase 30-Fix). The UI
computes receivable-first math client-side: returnValueGross = Σ(selected line price) × (1 + vatRate/100),
outstandingAR = invoice.remainingAmount, arRelief = min(gross, AR), excess = max(gross − relief, 0),
and shows a read-only summary (returned incl VAT / outstanding / AR relief / excess). Settlement controls
are shown ONLY when excess > 0: an "Add settlement options" toggle reveals cash(1110)/bank(1120)/
customer-credit(2300) amount inputs + Full-Cash/Bank/Credit presets + optional reference/description.
Validation: parts sum to excess (±0.01), non-negative, credit needs invoice.customerId; submit disabled
when invalid. Payload includes `settlement` ONLY when the operator enables it AND excess > 0 — otherwise
omitted (legacy full cash/bank refund preserved). Idempotency key resets when selected items or the
settlement split change (backend hashes whole body incl. settlement), reused on retry; reset on success.
Added type ReturnSettlement + optional settlement on CreateReturnPayload (lib/types.ts). New
verify-return-exchange-settlement-ui.js passes (return UI present, exchange UI deferred, frontend-only
scope guard). typecheck/lint(0 err)/build + all verifiers pass. NO backend changes, NO exchange UI, NO
POS changes, NO print/dashboard/report rewrite, NO migration. 11 stashes untouched. Deferred: exchange
settlement UI, exchange preview/diff, exchange tax/customer-facing invoice policy audit, POS
customer-credit payment, source-aware 2300 reconciliation, granular permissions.)

Previous marker:
Phase 30-Fix — Return / Exchange Settlement Options (backend)
(follows Phase 30 audit. Added an optional `settlement` object to POST /sales/returns and
POST /sales/exchanges so the operator settles the EXCESS after receivable-first AR relief as
cash (1110) / bank (1120) / customer credit (2300) / split. New pure helper
salesService.resolveExcessSettlement validates parts sum to the excess, non-negative, account
codes (cash=1110, bank=1120), credit-only-with-customer, and settlement-must-be-zero when no excess.
Absent settlement PRESERVES the legacy default (full excess refunded to cash/bank on the original
payment-method account; no credit). Accounting = Option A: the return/exchange journal stays the sole
GL owner — postReturnEntry extended with bankRefundAmount + customerCreditAmount (adds Cr 2300 line);
exchange inline money leg adds Cr 1110/1120/2300. The credit portion records a CustomerCreditTransaction
credit_in (sourceType return_credit/exchange_credit) with an EXPLICIT journalEntryId and NO glPosting
(no second journal). Cash/bank refunds create CashTransaction cash_out logs (one per non-zero part,
linked to the journal); no postCashEntry. AR mirrors (Customer.balance, Invoice.remainingAmount) stay
relief-only per Phase 21.2; credit/cash never reduce AR further; no auto-apply to the same invoice.
Idempotency scopes sales.return/sales.exchange unchanged (whole-body hash already covers settlement).
Permissions unchanged (sales.create). New verify-return-exchange-settlement-options.js (functional +
static) passes; updated verify-return-exchange-settlement / verify-installment-balance-writeback /
verify-apply-customer-credit to reflect that returns/exchanges may now CREATE credit (credit_in) but
never CONSUME/apply it. typecheck/lint(0 err)/build + all verifiers pass. Backend only — no frontend UI,
no POS changes, no migration, no deposit/refund/apply behavior change, no print/dashboard/report rewrite.
11 stashes untouched. Deferred: settlement UI, POS customer-credit payment, source-aware 2300
reconciliation, granular return/exchange settlement permissions.)

Previous marker:
Phase 29-Fix — Apply Customer Credit to Existing Invoice
(follows Phase 29 audit. Added apply customer credit to existing posted invoice
only. Backend endpoint POST /invoices/:id/apply-customer-credit is guarded by
sales.create and requires Idempotency-Key with central scope customer.credit_apply.
The endpoint validates positive amount, posted/non-cancelled non-return/non-exchange
invoice, invoice/customer company match, invoice remaining > 0, amount <= invoice
remaining, and amount <= available credit from CustomerCreditTransaction only.
It locks invoice and customer rows, calls recordCreditOut(glPosting) as the only
GL owner, posts one journal only: Dr 2300 / Cr 1300, creates a Payment row with
paymentMethod customer_credit for statement/payment visibility, updates
Invoice.paidAmount / Invoice.remainingAmount / status, and reduces Customer.balance
as AR mirror only. No CashTransaction, no cash/bank movement, no postCashEntry,
no Customer.balance-as-credit calculation. Added minimal customer detail UI
Available Credit -> Apply to Invoice modal using open invoices, stable idempotency
key, amount guards for available credit and invoice remaining, and warnings that
no treasury transaction is created. Added verify-apply-customer-credit.js and npm
script verify:apply-customer-credit; adjusted older customer-credit verifiers to
allow the approved invoice apply route. No POS checkout change, no return/exchange
change, no deposit/refund behavior change, no migration, no dashboard/report
rewrite, no print work. Deferred: POS checkout customer-credit payment,
return/exchange settlement options, source-aware 2300 reconciliation, granular
customers.credit.apply permission, stronger concurrent credit consume locking.)

Previous marker:
Phase 28-Fix — Refund Customer Credit
(follows Phase 28 audit. Added customer credit refund workflow. Backend endpoint
POST /customers/:id/credit/refund is guarded by treasury.update and requires
Idempotency-Key with central scope customer.credit_refund. The endpoint validates
positive amount, sufficient available credit from CustomerCreditTransaction only,
cash/bank method, and 1110/1120 account-code pairing; locks the customer row;
rejects inactive customers; validates optional branch; creates an operational
CashTransaction cash_out log; calls recordCreditOut(glPosting) as the only GL
owner; posts one journal only: Dr 2300 / Cr 1110 or 1120; links journalEntryId
and cashTransactionId; stores idempotent replay response; emits customer credit
and cash transaction changes. Customer.balance and invoice balances are not
mutated. Added minimal customer detail UI refund modal in the Available Credit
card with stable idempotency key, available-credit client guard, and no apply
credit controls. Added verify-customer-credit-refund.js and npm script
verify:customer-credit-refund; adjusted older customer-credit verifiers so only
the approved refund route may call recordCreditOut. No DB migration, no generic
treasury rewrite, no duplicate GL posting, no return/exchange changes, no manual
deposit regression, no dashboard/report rewrite, no print work. Deferred: apply
credit to invoice/POS, return/exchange settlement options, source-aware 2300
reconciliation, granular customers.credit.refund permission, stronger concurrent
credit consume locking.)

Previous marker:
Phase 27-Fix — Manual Customer Deposit
(follows Phase 27 audit. Added manual customer deposit workflow. Backend endpoint
POST /customers/:id/credit/deposit is guarded by treasury.update and requires
Idempotency-Key with central scope customer.credit_deposit. The endpoint validates
positive amount, cash/bank method, and 1110/1120 account-code pairing; locks the
customer row; rejects inactive customers; validates optional branch; creates an
operational CashTransaction cash_in log; calls recordCreditIn(glPosting) as the
single GL owner; posts one journal only: Dr 1110/1120 and Cr 2300; links
cashTransactionId on CustomerCreditTransaction and journalEntryId on both credit
row and CashTransaction. Customer.balance and invoice balances are not mutated.
CustomerCreditTransaction sourceType now accepts manual_deposit at model
validation level only; no DB migration/schema change. Minimal customer detail UI
adds Available Credit -> Add Deposit modal with amount, cash/bank, date,
description, reference, stable idempotency key, and warnings that this is a
customer credit liability and not invoice settlement. Added
verify-manual-customer-deposit.js and package script. Updated customer-credit
verifiers to allow deposit only. No refund/apply credit endpoint, no return/
exchange changes, no dashboard/report rewrite, no print work. Deferred: granular
customers.credit.deposit permission, refund customer credit, apply credit to
invoice/POS, return/exchange settlement options, source-aware 2300 reconciliation,
stronger concurrent credit consume locking.)

Previous marker:
Phase 26.1-Hotfix-Fix — Backend Script Env Loading Repair
(follows the Phase 26.1-Hotfix audit. Fixed root-invoked backend maintenance
scripts to load backend/.env by script path before requiring Sequelize models.
Root npm run check:customer-credit-gl-bridge now uses the same backend DB env as
backend migration/status commands; the mismatch was root cwd loading root .env
and falling back to localhost:5432 while backend migrations used localhost:5433.
Also normalized reconcile-installment-balances and idempotency-cleanup backend
scripts to the same explicit env loading pattern. No migration repair was needed;
no DB writes, no backfill, no route changes, no customer credit business flow
changes, no return/exchange changes, no apply/refund/manual deposit flows, no
posting.service redesign, no dashboard/report rewrite, no print work. Updated
verifiers to require explicit backend env loading. Deferred: manual customer
deposit, refund customer credit, apply credit to invoice/POS, return/exchange
settlement options, source-aware 2300 reconciliation, backfill only if ever
proven safe.)

Previous marker:
Phase 26.1-Fix — Customer Credit Existing Rows Dry-Run Checker
(follows Phase 26-Fix. Added backend/scripts/check-customer-credit-gl-bridge.js,
a dry-run-only checker for existing CustomerCreditTransaction rows and their
GL bridge state. Root command: npm run check:customer-credit-gl-bridge. Supports
--company-id, --customer-id, --source-type, --status, --limit, and --json; rejects
--apply/--write/--fix/--update/--backfill/--confirm. The checker reads only
CustomerCreditTransaction, JournalEntry, JournalLine, Account, and Customer with
explicit attributes; it performs no writes and closes the DB connection. It
classifies rows as OK, Needs GL Bridge Review, Broken Link, Invalid Journal, or
Ignored / Not Eligible; validates linked journals when present; checks credit_in
has Cr 2300 and credit_out has Dr 2300; reports amount mismatches, missing/invalid
journals, missing customer/company, and inactive rows. It warns that GL 2300 can
include non-CustomerCreditTransaction subledgers (invoice deposits/customer gold),
so it does not treat total 2300 vs customer-credit total as an error. Added
verify-customer-credit-existing-rows-checker.js and npm script verify:customer-
credit-existing-rows-checker. No backfill, no apply mode, no route changes, no
public customer credit mutation endpoint, no return/exchange changes, no apply/
refund/manual deposit flows, no migration, no dashboard/report rewrite, no print
work. Deferred: manual customer deposit, refund customer credit, apply credit to
invoice/POS, return/exchange settlement options, source-aware 2300 reconciliation,
full credit backfill only if dry-run output proves safe, stronger concurrent
credit consume locking.)

Previous marker:
Phase 26-Fix — Customer Credit Service-Level GL Bridge to 2300
(follows Phase 26 audit. Added service-level GL bridge primitives to
backend/src/services/customer-credit.service.js without adding public mutation
endpoints. recordCreditIn/recordCreditOut now support optional glPosting:
credit_in can Dr an explicit counter account and Cr 2300; credit_out can Dr
2300 and Cr an explicit counter account. If glPosting is missing/disabled, rows
remain ledger-only as before. Generated journalEntryId is saved on the
CustomerCreditTransaction row; explicit journalEntryId + glPosting.enabled is
rejected to prevent duplicate/ambiguous journals. GL bridge work uses
postingService.postEntry, the existing chart/ensureAccount behavior, and wraps
credit row + journal in a transaction when no caller transaction is supplied.
No route changes, no return/exchange credit mode, no apply-credit-to-invoice/POS,
no refund endpoint, no backfill, no migration, no dashboard/report rewrite, no
print work. Future public credit endpoints must use central idempotency scopes
customer.credit_in / customer.credit_apply / customer.credit_refund. Phase 25
reconciliation may still show 2300 differences because 2300 includes other
subledgers such as invoice deposits/customer gold. Added
verify-customer-credit-gl-bridge.js and npm script verify:customer-credit-gl-
bridge. Deferred: customer credit dry-run/backfill checker, manual deposit,
return/exchange credit mode, apply credit, refund credit, source-aware 2300
reconciliation, customer/supplier journal-line dimensions.)

Previous marker:
Phase 25-Fix — Ledger Reporting Foundation MVP
(follows the Phase 25 audit. Added/strengthened read-only ledger reporting
foundation without rewriting dashboards or operational reports. Existing
/accounts/:id/statement and /reports/trial-balance remain JournalEntry/
JournalLine-based and now include additive ledger metadata; account statement
also exposes branch filter and period debit/credit totals. Added read-only
/reports/ledger/account for accountCode/accountId ledger lookup, plus
/reports/ledger/cash-reconciliation comparing GL cash/bank accounts 1110/1120
against CashTransaction movement, and /reports/ledger/ar-ap-reconciliation
comparing GL AR/AP/customer-deposit accounts 1300/2100/2300 against operational
mirrors. Customer/supplier reconciliation remains account-level only because
JournalLine has no customerId/supplierId dimensions; customer/supplier
statements remain source-document-based. Operational reports remain unchanged
except additive ledgerBased:false/source metadata where touched. Added
verify-ledger-reporting-foundation.js and npm script verify:ledger-reporting-
foundation. No dashboard rewrite; no posting.service redesign; no migration; no
print work. Deferred: dashboard KPI conversion, full balance sheet, full income
statement, cash flow statement, customer/supplier journal-line dimensions,
customer credit GL bridge to 2300, ledger-based operational report conversion.)

Previous marker:
Phase 24.1-Hotfix — Installment Reconciliation Script Runtime Repair
(follows Phase 24.1-Fix after manual dry-run exposed two runtime issues: root script
could not resolve backend-only sequelize without NODE_PATH, and Invoice.findAll selected
all model columns including optional vat_rate, which the current DB schema lacks. Moved
the dry-run script to backend/scripts/reconcile-installment-balances.js, updated the root
npm command to call that path, and switched model imports to the backend convention
require("dotenv").config() + require("../src/models"). All Sequelize reads now use explicit
attributes only; the script does not mention or require vat_rate/vatRate. The report output
and JSON mode remain the same. Still dry-run only: no apply mode, no writes, no route changes,
no DB migration, no business logic changes, no return/exchange changes, no print work.)

Previous marker:
Phase 24.1-Fix — Dry-Run Installment Drift Reconciliation Report
(follows the Phase 24.1 audit. Added scripts/reconcile-installment-balances.js as a
dry-run-only report for historical installment mirror drift between Payment rows and
Invoice.paidAmount / Invoice.remainingAmount / Customer.balance. The script supports
--company-id, --invoice-id, --customer-id, --limit, and --json; it rejects --apply,
--write, --fix, --update, and --confirm with a dry-run-only error. It reads only
Invoice, Payment, Installment, Customer, plus related return/exchange Invoice rows
for risky skip classification. It performs no writes, has no apply mode, runs no
backfill, and changes no routes/business logic. Risky invoices with returns/exchanges
or suspicious overpayment are skipped for manual review. Added
verify-installment-reconciliation.js and npm scripts reconcile:installment-balances
and verify:installment-reconciliation. No DB mutation, no migration, no print work,
and no ledger-based reports. Deferred: review real dry-run output, guarded apply-mode
design if approved, historical return/exchange settlement review, ledger-based reports,
credit application/refund, GL bridge to 2300.)

Previous marker:
Phase 24-Fix — Installment AR Mirror Writeback
(follows the Phase 24 audit. Fixed forward-going installment AR mirror drift in POST
/installments/:id/pay only: after a fresh central idempotency claim and inside the existing
installment payment transaction, the route now locks the related Invoice and Customer rows,
reduces Customer.balance, reduces Invoice.remainingAmount, and increases Invoice.paidAmount
by the collected amount, with AR mirrors clamped at >=0. Idempotency replay/conflict/
processing paths resolve before the writeback and do not re-apply it. Existing Payment,
CashTransaction, and postInstallmentPayment journal behavior remain unchanged. No return/
exchange settlement changes; no customer credit ledger calls; no historical backfill/
reconciliation; no migration; no print work. Added verify-installment-balance-writeback.js
and npm script verify:installment-balance-writeback. Deferred: historical installment drift
reconciliation/backfill, ledger-based reports, credit application/refund flows, GL bridge
for customer credit ledger.)

Previous marker:
Phase 23-Fix — Customer Credit Ledger MVP (Infrastructure)
(follows the Phase 23 audit. Added customer_credit_transactions table (migration 20260707010000, NOT
run here), model customerCreditTransaction.model.js (registered), and customer-credit.service.js
(recordCreditIn/recordCreditOut/getCustomerCreditSummary/getCustomerCreditTransactions; availableCredit
= Σ active credit_in − credit_out; credit_out cannot go negative; accepts transaction; company/customer
scoped; NEVER writes Customer.balance/Invoice.remainingAmount and posts NO GL — 2300 bridge deferred,
journalEntryId nullable). Read-only GET /customers/:id/credit endpoint + a read-only Available Credit
card on customers/[id] statement panel. INFRASTRUCTURE ONLY: no flow creates credit; returns/exchanges
still cash-refund excess; overpayment still prevented; Customer.balance stays AR-only; statement-v2
unchanged. New verify-customer-credit-ledger.js (functional + static) passes; typecheck/lint(0 err)/build
+ node -c + all prior verifiers ok. No print/report/posting.service rewrite; no destructive DB; migration
created but not run. 11 stashes untouched. Deferred (business decision): excess-as-credit vs refund,
overpayment acceptance, credit apply/refund, GL 2300 bridge, Customer.balance installment drift, ledger reports.)

Previous marker:
Phase 22-Fix — Strict Production Data-Source Hardening
(follows the Phase 22 audit. Closed the silent-mock hazard: production (NODE_ENV=production) now
ALWAYS resolves the data source to "api" and fails loudly via assertProductionDataSource() when
NEXT_PUBLIC_DATA_SOURCE is missing/≠api or NEXT_PUBLIC_API_URL is empty — called by the API client
before any request. Centralized lib/data-source.ts (getDataSourceMode/isApiDataSource/
assertProductionDataSource), removed the (as DataSourceMode) || "mock" default and the duplicate
|| "mock" in lib/api/client.ts, and replaced 13 direct process.env.NEXT_PUBLIC_DATA_SOURCE reads
across POS/sales/returns/exchanges/customer-gold/invoices/assets/inventory/employees/settings with
the central helper. Module is import-safe so next build passes; loud failure is at the API boundary.
Dev still allows mock/local (default mock; invalid throws). localStorage business persistence stays
gated by !isApi (unchanged); no mock files deleted. New verify-production-data-source.js (functional +
static) passes; typecheck/lint(0 err)/production build + prior verifiers ok. Frontend-only; no backend/
DB/migration/print/idempotency/accounting changes. .env is untracked (local); examples already =api.
11 stashes untouched. Deferred: explicit demo-mode flag; api-mode Local repo cleanup; credit ledger;
ledger reports.)

Previous marker:
Phase 21.5-Fix — Edge Financial Idempotency & Cleanup Script Repair
(follows the Phase 21.5 audit. Extended central idempotency to the last two exposed financial
endpoints: /payslips/:id/pay (payroll.payslip_payment) and /customers/:id/gold/payout
(customer.gold_payout). Both now REQUIRE Idempotency-Key (400 if missing), fold req.params.id into
the hash, and use claim/succeed inside a transaction — payslip pay is now wrapped in a transaction
for the first time with postPayrollEntry moved inside it (ends the best-effort no-journal divergence).
Payslip frontend sends a stable per-payslip ref key; gold payout has no UI caller so none was invented.
Treasury closing left unchanged (per-account-per-day uniqueness, no cash/journal — deferred). Repaired
the broken TTL cleanup: relocated scripts/idempotency-cleanup.js → backend/scripts/idempotency-cleanup.js
(root copy failed with MODULE_NOT_FOUND on dotenv), package script → node backend/scripts/idempotency-
cleanup.js; still deletes only expires_at < now, --dry-run verified live (0 rows, no delete); run via
external cron. verify-secondary-idempotency.js extended and passes; verify-idempotency + prior verifiers
still pass; typecheck/lint(0 err)/build + node -c ok. NO new migration; no payroll/gold/accounting/
print redesign; no destructive DB. 11 stashes untouched. Deferred: treasury-closing centralization;
scheduled cleanup job; customer credit ledger; mock hardening; ledger reports.)

Previous marker:
Phase 21.4-Fix — Secondary Financial Idempotency & TTL Cleanup
(follows the Phase 21.4 audit. Extended the central idempotency_requests service to the three
highest-risk secondary financial endpoints: /treasury/transactions (treasury.cash_transaction),
/purchase-orders/:id/pay (purchase.payment), /installments/:id/pay (installment.payment). Each now
REQUIRES Idempotency-Key (400 if missing), folds req.params into the request hash, and uses
claim/succeed inside its business transaction (sentinel-on-duplicate → rollback → resolveExisting
replay/conflict), replacing the old optional-key/lookup-only logic. Frontend: treasury + installments
pages now send stable ref-based keys (reset/cleared on success); purchase-pay caller already sent a
stable key (unchanged). Added scripts/idempotency-cleanup.js (npm run idempotency:cleanup) — deletes
ONLY expires_at < now (Op.lt), supports --dry-run, no truncate/reset/delete-all; NOT executed here.
New verify-secondary-idempotency.js passes; verify-idempotency + prior verifiers still pass;
typecheck/lint(0 err)/build + node -c ok. NO new migration (21.3 table reused); no accounting/
settlement/stock/print redesign; no destructive DB. 11 stashes untouched. Deferred: payslip/gold-
payout/treasury-closing centralization; scheduled cleanup job; customer credit ledger; mock hardening.)

Previous marker:
Phase 21.3-Fix — Central Idempotency Requests + Critical Frontend Keys
(follows the Phase 21.3 audit. Added central idempotency_requests table with UNIQUE
(company_id, scope, key) + model + idempotency.service (hashRequest/claim/resolveExisting/succeed).
Wrapped /pos/checkout, /sales/returns, /sales/exchanges, /purchase-orders/receive with insert-first
race-safe idempotency (missing key→400, replay saved response, same-key-diff-hash→409, processing→409);
success payload persisted before commit. Frontend returns/exchanges/purchase-receive now send a stable
Idempotency-Key (generateUUID, reset on success); POS unchanged. /purchase-orders/:id/pay + secondary
payment/treasury endpoints deferred (already required-key + row-lock). Migration NOT executed — run
`cd backend && npm run db:migrate` before use. verify-idempotency.js (functional + static) passes;
typecheck/lint/build + prior verifiers ok; no print work; no settlement/stock redesign; no DB reset.
Next: run migration; convert pay/secondary endpoints; TTL cleanup — deferred.)

Previous marker:
Phase 21.2-Fix — Receivable-First Return / Exchange Settlement
(follows the Phase 21.2 audit's High finding. Returns/exchanges now settle against the
original invoice's outstanding receivable FIRST — cash moves only for the real excess.
Returns: receivableReliefAmount=min(returnedTotal,outstanding), cash_out only if excess>0;
postReturnEntry money leg splits Cr AR 1300 + Cr Cash/Bank (legacy full-cash fallback kept).
Exchanges: diff<0 relieves AR first then cash-refunds excess; diff>0 defaults to CREDIT for
the UI's hardcoded "Exchange" (no fake cash_in), paid_now only for a real method/flag; GL
splits Cash/Bank + AR 1300; treasury CashTransaction only for real cash; customer.balance +
invoice.remainingAmount adjusted once, clamped >=0. Stock/asset reversal unchanged; frontend
unchanged (backend safe default). New verify-return-exchange-settlement.js (functional GL split
+ formula matrix + static route checks; confirms old bug patterns gone) passes; node -c +
typecheck/lint/build ok. No DB/migration; no customer-credit ledger; idempotency → 21.3 deferred.)

Previous marker:
Phase 21.1-Fix — Generic Invoice CRUD Guards (data integrity)
(follows the Phase 21 audit's Critical finding. Blocked generic /invoices create
entirely (403) and generic update/delete/deactivate/reactivate of posted/cancelled
invoices (409) in ErpController — posted financial docs change only via lifecycle
routes (/pos/checkout, /sales/invoices/*). Draft invoices still updatable/deletable;
lifecycle-field guard preserved. Frontend never used generic invoice mutations, so
unchanged. New verify-invoice-crud-guards.js (functional, no DB) + lifecycle-route
static checks all pass; typecheck/lint/build ok. No DB/migration; no accounting/
treasury redesign. Return/exchange accounting → 21.2; idempotency → 21.3 deferred.)

Previous marker:
Phase 20.3-Fix — Custom Text Block Styling Controls
(follows Phase 20.3 request after user confirmed 20.2 manual QA working. Added
safe per-block style controls for invoicePrintCustomBlocks: fontSize xs/sm/base/
lg/xl, align left/center/right, and bold/italic/underline booleans. Existing
blocks without style default safely. Sanitizer rejects invalid font/alignment
values and ignores arbitrary style/CSS fields. Settings -> Print & Invoice
Design now exposes a simple print styling toolbar per block. CustomPrintTextBlocks
maps style enums/booleans to fixed safe rendering values only; text remains plain
React text with white-space: pre-line. No HTML, no Markdown, no dangerouslySetInnerHTML,
no rich text editor, no font-family/color picker, no arbitrary CSS input. Existing
receipt messages, invoice.notes, branch, Sales/POS print paths, and Builder
customTextBlocks section toggle remain unchanged. No backend/DB/API/migration;
no financial/business logic changes.)
```

Previous marker:
```text
Phase 20.2-Fix — Custom Print Text Blocks MVP
(follows Phase 20.2 audit. Added independent invoicePrintCustomBlocks settings
key with a constrained plain-text MVP: max 5 blocks, title max 120 chars, content
max 1000 chars, predefined placements afterHeader / afterInvoiceDetails /
beforeItems / afterItems / afterTotals / beforeSignatures / beforeFooter,
optional template filter, and sortOrder. Added sanitizer/config module, by-key
save hook, Settings -> Print & Invoice Design editor, Builder section toggle
sections.customTextBlocks defaulting true, ViewModel grouping by placement, and
CustomPrintTextBlocks renderer. Luxury, Compact, Minimal, and Thermal render
blocks in their placement slots. Existing receipt messages and invoice.notes are
unchanged. Plain React text only: no HTML, no Markdown, no dangerouslySetInnerHTML.
No backend/DB/API/migration; no receipt custom blocks; no barcode/QR, VAT
granularity, paper/layout, autoPrint/copies, legacy cleanup, POS checkout,
payment/stock/accounting, or totals recalculation changes. Remaining gaps:
drag/drop deferred; barcode/QR controls deferred; VAT granularity deferred;
paper/layout controls deferred; autoPrint/copies deferred; legacy cleanup
deferred; broader a11y cleanup deferred.)

Previous marker:
Phase 20.1-Fix — Invoice Branch Print Toggle
(follows Phase 20.1 audit. Added fields.invoiceBranch to the Print Builder
field visibility config, defaulting true. InvoicePrintViewModel now exposes
document.branch from invoice.branch only; no fallback to company.branchName, so
prints do not invent or substitute the operational branch. Luxury, Compact,
Minimal, and Thermal templates render Branch / الفرع near invoice metadata when
the field is enabled and the invoice branch exists. Updated verify scripts for
ViewModel source/no-fallback behavior and Builder/template config defaults. No
barcode/QR, VAT granularity, paper/layout, backend/DB/API/migration, POS submit,
payment/stock/accounting, or totals recalculation changes. Remaining gaps:
barcode/QR controls deferred; VAT granularity deferred; paper/layout controls
deferred; custom text blocks not started; autoPrint/copies deferred; legacy
cleanup deferred; broader a11y cleanup deferred.)

Previous marker:
Phase 19Z-Fix — Static Favicon + Company Logo Favicon
(follows 19Z audit. Added a static public/favicon.ico fallback so /favicon.ico no longer
404s before auth loads. Added a client-side CompanyFaviconUpdater mounted once in AppShell;
it uses company.logo from Company Profile via getPublicFileUrl and falls back to /favicon.ico
when no company logo is available or after logout/no company. Future custom favicon precedence
is left as a code comment only; no custom favicon upload/settings key added. No backend/DB/API/
migration changes; no print/POS/business logic changes. Remaining gaps: custom favicon upload
not added; favicon shape/quality depends on the company logo; browser favicon caching may require
hard refresh; custom text blocks not started; autoPrint/copies deferred; legacy receipt cleanup
deferred; broader a11y cleanup deferred.)

Previous marker:
Phase 19Y.8 — Duplicate POS Receipt Controls Cleanup
(follows 19Y.7 audit. Hid duplicate legacy POS/Receipt visibility controls plus
paperSize/layout from Settings -> Print & Invoice Design; kept visible shared messages
and receipt.defaultPosTemplate only. Added helper that visibility is controlled from
Invoice Print Builder below and legacy receipt options are preserved internally.
receiptForm/save payload still preserve hidden legacy values. Active POS print remains
InvoicePrintOptionsDialog -> InvoiceDocument; no backend/DB/API/migration; no data
deletion; no legacy component deletion; no autoPrint/copies; no POS submit/payment/
stock/accounting changes; no totals recalculation. Next: optional missing builder controls
audit or autoPrint/copies audit only in separate phase.)

Previous marker:
Phase 19Y.6 — Persist POS Default Print Template
(follows 19Y.3 + 19Y.5 audit. Added persisted POS default template under existing
receipt.defaultPosTemplate; Settings -> Print & Invoice Design now has POS Print Behavior
default-template select. POS print dialog seeds Auto/Bilingual plus saved template, Thermal
fallback; in-dialog template changes are temporary and not auto-saved. No new settings key;
no backend/DB/API/migration; no autoPrint/copies; no legacy receipt deletion; no
POS submit/payment/stock/accounting changes; no totals recalculation. typecheck/lint/build ok;
all print verifies pass. Next: autoPrint/copies audit or legacy cleanup only in separate phase.)

Previous marker:
Phase 19Y.3 — POS Print Dialog with Template Selector & Live Preview
(follows 19Y.2 + receipt-form-field id/name a11y fix e038e44. POS post-checkout now opens
InvoicePrintOptionsDialog (extended with optional showPreview/previewCompany/previewSettings/previewLabels
— Sales unchanged) with a live InvoiceDocument preview, Thermal default; replaced the ReceiptPreview
modal (files retained). POS printInvoice mirrors Sales (InvoiceDocument → renderPrintDocument →
printHtmlDocument); company from auth/Company Profile; server totals only, no recalculation; print/close
never call postInvoice or mutate order/payment/stock/accounting. Frontend-only; no backend/DB/API; no
new settings key. typecheck/lint/build ok; all print verifies pass; POS label keys verified in en/ar.
Next: custom text blocks / favicon / default-template persistence — not started.)

Previous marker:
Phase 19Y.2 — Receipt Settings Cleanup & POS Company Data Source
(follows 19Y-Fix. Removed duplicate receipt.phone/vatNumber/address inputs + showVatNumber toggle
from the POS/Receipt settings card (values kept as legacy fallback, not deleted); added a "managed from
Company Profile" helper. ReceiptPrintTemplate + ReceiptPreview now use company (Company Profile) data
first for address/phone/TRN, receipt.* only as fallback; address formatted from structured company
fields; TRN gated by showTaxNumber. Pre-existing display-only subtotal reduce left intact; no totals
recalculation. Frontend-only; no backend/DB/API; receipt key/schema preserved; ReceiptPrintTemplate kept.
typecheck/lint/build ok; all print verifies pass. Next: 19Y.3 POS print dialog — not started.)

Previous marker:
Phase 19Y-Fix — Invoice Message Fields Across Templates
(follows 19X.2-G. Added vm.messages (welcomeMessage/headerNote/footerMessage/termsMessage) from the
existing receipt key; rendered across all four invoice templates gated by builder section toggles
(reused sections.terms; added welcomeMessage/headerNote/footerMessage toggles, default true).
Luxury no longer reads receiptConfig.termsMessage directly; terms now shows in Compact/Minimal/Thermal.
Relabeled the Settings messages area "Invoice & Receipt Messages". Plain text, escaped; invoice.notes
stays separate; POS receipt unchanged. No new key/backend/DB/migration; no custom text blocks.
typecheck/lint/build ok; VM + builder verifies extended and all print verifies pass. print-export E2E
not run (headless limitation). Next: 19Z custom text blocks / closing message — not started.)

Previous marker:
Phase 19X.2-G — Live Company Data in Invoice Preview
(follows 19X.2-F. Fixed the Settings builder preview to use LIVE company data via a memoized
livePreviewCompany — precedence Company Profile form state > auth company > FIXTURE_COMPANY demo
fallback — instead of the static FIXTURE_COMPANY. Fixture still supplies demo invoice/items/totals;
builder toggles/theme/template stay live; identity company-first (printInfo cannot override).
Single-file frontend fix (settings/page.tsx); no backend/DB/API; no financial logic.
typecheck/lint/build ok; print verifies pass. print-export E2E not run (headless limitation).
Next: 19Y invoice messages — not started.)

Previous marker:
Phase 19X.2-F — Company Address Wiring
(follows 19X.2-C/D/E. Wired official company address (existing DB columns country/city/region/
address1/address2/postalCode/commercialRegister) into Company Profile + print. Extended the
PATCH /settings whitelist with those existing columns (no migration); settings-context forwards them;
new Official Company Address UI section; VM formats company address (structured DB > printCompanyInfo.address
> receipt.address); PrintCompany + 4 templates + sales caller pass structured address. EGYPT = country,
not full address. Frontend + 1-line backend whitelist; no new columns/migration/data deletion.
typecheck/lint/build ok; node -c ok; VM verify extended + all print verifies pass. print-export E2E
not run (headless limitation). Next: 19Y invoice messages — not started.)

Previous marker:
Phase 19X.2-C/D/E — Company Profile Contact Wiring + Print Source Cleanup
(follows 19X.2-B; dev migration applied. Company Profile now edits/saves phone/email/website + TRN
persistence fix via PATCH /settings; auth/PrintCompany/AppSettings types gained phone/email/website;
sales print caller + all four templates pass DB company contact into the VM (removed receiptConfig
injection). ViewModel precedence: identity company-only (printCompanyInfo.displayName/taxNumber
ignored), contact company→printCompanyInfo→receipt. Removed the duplicate Company Print Info card;
printCompanyInfo key/schema kept as fallback. Frontend-only; no backend/DB/API changes; no data
deletion. typecheck/lint/build ok; VM verify rewritten (company-wins + fallbacks) + all print
verifies pass. print-export E2E not run (headless limitation). Next: optional DB address wiring /
19Y invoice messages — not started.)
```

After this file is committed, future agents must update this section when they complete a phase.

---

## Phase 30.4-Fix — Exchange Display API Enrichment

Added read-only `GET /invoices/:id/exchange-display` for trusted server-side
exchange display data. The endpoint requires `sales.view`, is company-scoped,
and accepts exchange invoices only.

Target-policy classification requires the explicit Phase 30.3 `exchangePolicy`
marker saved in the successful `sales.exchange` idempotency response. Rows
without that trusted marker return `legacy_or_unknown`; their stored historical
tax/totals remain authoritative and are not recalculated under the new policy.

The response includes policy status/version, target-policy figures when trusted,
positive-only replacement/returned-credit display sections, balance labels,
and a settlement summary sourced from linked CashTransaction and
CustomerCreditTransaction rows. Settlement completeness is marked
`linked_records`, `best_effort`, or `unavailable`.

No frontend UI, print/view-model, live exchange tax/posting, POS, return flow,
schema, migration, or historical backfill changes were made.

Remaining deferred:

* ExchangeSummary frontend component.
* Sales invoice detail integration.
* Customer history/statement integration.
* Exchange print/display phase.
* Exchange settlement UI.
* POS customer-credit payment.
* Source-aware 2300 reconciliation.
* Granular permissions.

---

## Phase 32.1-Fix — Editable Barcode + Inventory Foundation

Added a forward-safe, additive barcode identity foundation without resetting or
backfilling data. New Asset component fields are nullable and preserve all
existing type, cost, price, gold-cost snapshot, stone, pearl, status, branch,
and lifecycle fields. Inventory subtype plus versioned JSONB metadata prepare
the aggregate for the Phase 32.2 item-type forms.

The target stored operational format is
`INVENTORY_CODE + ITEM_CODE + KT + six-digit SERIAL`, uppercase with no
separators. The sequence scope is company + inventory code + item code + karat
code and is allocated atomically in PostgreSQL. Initial database-backed,
company-scoped inventory mappings are GW, GP, DD, GS, PL, and WT. The 18 client
item codes are authoritative (`ERG`, `NCK`; not the inconsistent examples
`ERR`/`NLC`) and WCH is added for Watch.

Watch remains visible as an **owner-approved provisional system extension
pending client confirmation**. Its initial mapping is `WT/WCH/00`: active,
provisional, and not client-approved. Barcode code settings are editable at
`/settings/barcode-codes`, backed by dedicated inventory-code, item-code, and
sequence tables. Used code values and structural fields are locked; descriptive
fields and approval/status flags remain editable. Replacement requires a new
code plus deactivation of the old code.

The backend is the only source of final stored barcode values. Generic Asset
PATCH rejects changes to type, karat, barcode, component fields, generation
time, serial, and revision after a barcode exists. Existing return/exchange and
branch-transfer flows retain the same Asset ID/barcode/RFID/history and were not
changed. Loose diamond/gem/pearl barcode generation remains blocked unless a
default KT code is explicitly configured; Watch uses its configured `00`.

Uniqueness for new component identities is enforced. Company barcode and
nonblank RFID unique indexes are guarded by live duplicate preflight checks; a
conflicting legacy dataset causes the relevant index to be skipped with a clear
warning, never an automatic rewrite. RFID remains optional / future-ready only;
no hardware integration or claim of real RFID scanning was added.

No demo data reset or seed rewrite occurred. Production reset is forbidden. No
old barcode backfill or production historical migration occurred. No posting,
journal, VAT, COGS, statement, credit, POS, return/exchange submit, exchange
display/print, or invoice template behavior changed. UAE E-Invoicing remains
deferred.

---

## Phase 32.1-Hotfix — Refresh Invoices Search & Print Verifier Scope Guard

**Current approved HEAD:** `0a7b7ce feat: add editable barcode inventory settings`

Refreshed the **stale working-tree scope guard** in
`scripts/verify-invoices-search-print.js` only. The guard had pinned its baseline
to the Phase 31.4 base (`8169bfe`) and enforced a rigid allowed-files whitelist,
so after Phase 32.1 was approved and committed it wrongly rejected every legitimate
barcode-foundation file (barcode inventory settings, barcode identity service,
barcode foundation migration, barcode settings UI/APIs, Asset barcode fields) merely
because they post-dated `8169bfe`.

The guard now (a) tracks the current approved baseline (`0a7b7ce`) and (b) rejects
changed files only when they touch a protected accounting/posting/journal/
reconciliation/customer-credit area, are a deletion, or introduce UAE E-Invoicing /
event-sourcing — never simply because a file is new since an older base.

- **No product/business code changed.** Only the verifier's scope logic + docs.
- **No barcode foundation behavior changed.**
- **No accounting/posting/print/Search-&-Print functionality changed.**
- **Functional assertions preserved:** filters, results columns, print reuse,
  read-only GET endpoint, no-mutation, no financial recalculation, hidden
  diagnostics (statement-v3, credit reconciliation, full-2300) remain hidden.
- **UAE E-Invoicing remains deferred**; event-sourcing/projection architecture not
  implemented; current relational/audit architecture retained.

---

## Phase 32.4-Run — Owner Gate + Backup Readiness (reset NOT executed)

Owner confirmed the **local** `darfus_erp` (NODE_ENV=development, host localhost,
port 5433, Docker `darfus-postgres` postgres:16-alpine) is **demo-only and
disposable**. This phase hardened the tooling and proved backup readiness but
**did not execute the destructive reset**.

Delivered (safe, verified):
- **Owner-confirmation gate** in `scripts/reset-client-demo-data.js`: `darfus_erp`
  is eligible ONLY when `ALLOW_CLIENT_DEMO_RESET=true` + `RESET_TARGET=demo` +
  `CONFIRM_DATABASE_NAME=darfus_erp` + `OWNER_CONFIRMED_DEMO_ONLY=true` + a **local
  host** (localhost/127.0.0.1). The dedicated demo-name allowance is unchanged.
  Remote/managed providers (Render/Supabase/Neon/Railway/AWS/Azure/GCP) are
  rejected. A **mandatory backup-capability preflight** refuses if no backup method
  (host `pg_dump` or the local Docker Postgres) is available.
- **Docker-aware backup**: host `pg_dump` missing here, so backup uses
  `docker exec darfus-postgres pg_dump`. **Backup mechanism proven** with a
  non-destructive 1.49 MB dump of `darfus_erp` (DB left intact, 293 assets).
- **Guard refusal tests (no DB mutation):** no-gates → exit 2; missing
  `OWNER_CONFIRMED_DEMO_ONLY` → exit 2; wrong `CONFIRM_DATABASE_NAME` → exit 2;
  `NODE_ENV=production` → exit 2; remote host → exit 2; DB-name mismatch → exit 2.
- **Deterministic client-demo inventory seeder** `backend/seeders/client-demo/index.js`
  (seed `client-demo-v1`): idempotent, accounting-neutral, seeds the barcode
  taxonomy + all **10 inventory variants** via the canonical
  `barcode-identity.service` (no second algorithm / no `Date.now()`), with realistic
  metadata (incl. `stoneWeight`/`discount`/`minimumMakingCharge`/gemstone `stones`)
  and a GW/BRC/21 pair proving serial 000001/000002. Loose-item KT is a **configured
  demo setting** (default KT seeded on the stone taxonomy) — a demo/testing
  assumption pending final client confirmation, not an approved production policy.
- `verify-client-demo-data.js` asserts the owner gate, remote rejection, and backup
  preflight; live data checks still skip cleanly until a verified demo run occurs.

**Reset NOT executed** because the **service-driven transactional/accounting seed
workflow is not yet complete/reviewed** (only inventory/taxonomy is), and the
reset orchestration is unvalidated end-to-end. Per the prompt's precondition
("implement the missing seed workflow first"), the destructive run is deferred to
a dedicated, supervised step once the transactional seeds exist.

**Browser verification:** not performed (no reset/seed executed). **Physical
printer verification:** not performed (no hardware) — not claimed. **Production and
Render untouched.** No accounting/posting/sales/return/exchange/print/inventory-form
business code changed. Watch remains provisional (WT/WCH/00). Production reset
remains forbidden. UAE E-Invoicing remains deferred.

---

## Phase 32.4-Hotfix — Refresh Barcode Foundation Verifier Reset Guard

Test-only maintenance: refreshed the stale working-tree scope guard in
`scripts/verify-barcode-inventory-foundation.js`. It had pinned its baseline to
`cf1c84f` and rejected any changed file whose path merely contained "reset"
(`/reset/i`), which wrongly flagged the approved, environment-gated Phase 32.4
demo-reset tooling (`scripts/reset-client-demo-data.js`). The guard now tracks the
current approved baseline (`1a6c76f`) and distinguishes **sanctioned gated demo
tooling** (allowed) from **unsafe/production reset or historical-barcode backfill
tooling** (rejected) by content, not just filename — and positively asserts the
demo-reset script is environment-gated, secret-safe, and not auto-run.

**No product/business code changed. No database operation was executed.** All
functional barcode assertions are unchanged; production reset remains forbidden.

---

## Phase 32.4-Fix — Guarded Client-Demo Data Reset (tooling only; reset NOT executed)

**Current approved HEAD (before this phase):** `7acb127 feat: add client barcode tag layouts`

Added a **guarded, safety-gated client-demo reset process** — scripts + docs only.
**No reset, migration, or seed was executed**, and no business/backend/frontend
code changed.

- `scripts/reset-client-demo-data.js` (`npm run demo:reset:client`) — refuses to
  reset unless a **dedicated, disposable demo database** is positively verified
  AND the operator opts in: `ALLOW_CLIENT_DEMO_RESET=true`, `RESET_TARGET=demo`,
  and `CONFIRM_DATABASE_NAME=<exact effective DB name>`. It rejects production/
  shared hosts and names, requires a dedicated demo-name allow-rule (e.g.
  `darfus_client_demo`), prints only a **masked** plan (never secrets), backs up
  before any reset (`pg_dump` → `backups/client-demo/<timestamp>/`, gitignored),
  then migrates from zero and runs deterministic client-demo seeds. Exits non-zero
  on any safety failure.
- `scripts/verify-client-demo-data.js` (`npm run verify:client-demo-data`) —
  validates the guard/gates statically; **live data checks run only against a
  verified demo DB with opt-in**, otherwise they skip cleanly (never a false pass).

**Environment gate result in this workspace:** the only configured database is
`DB_NAME=darfus_erp` (NODE_ENV=development) — the **general development database**,
NOT a dedicated disposable demo DB (`darfus_client_demo`/`darfus_demo`/
`darfus_dev_demo`), and the opt-in vars are unset. Per the safety gate the reset
was **intentionally not executed**; to run it, provision a dedicated demo DB and
set the opt-in variables.

- **Seed order** (for a live run): company → branches → users → roles/permissions
  → settings → chart of accounts → treasury config → barcode inventory codes →
  item codes → sequence scopes → employees → customers → suppliers → gold prices
  → inventory assets → asset events/movements → sales → returns → exchanges →
  installments → deposits → gift vouchers → customer-gold → payments → balanced
  journals → audit. Transactional records go through existing domain services
  (never hand-fabricated/unbalanced). Seed version: `client-demo-v1`.
- **Demo coverage** (for a live run): one asset per variant (Gold By Weight
  Jewellery + 24K/bar, Gold By Piece, Diamond J/Loose, Gem Stone J/Loose, Pearl
  J/Loose, Watch) with realistic metadata (incl. Phase 32.3 `stoneWeight`/
  `discount`/`minimumMakingCharge`/gemstone `stones`); sequence proof (000001/
  000002 in the same scope); all supported invoice/sales flows.
- **Watch remains provisional** (WT/WCH/00). **Loose-item KT remains a
  demo-configured assumption** pending final client confirmation (seeded in
  barcode settings, not hardcoded in assets).
- **Browser verification:** not performed (no verified demo DB / seeded data).
  **Physical printer verification:** not performed (no hardware) — not claimed.
- **Production reset remains forbidden.** No accounting/posting/sales/return/
  exchange/print/barcode-generator/inventory-form code changed. Hidden diagnostics
  (statement-v3, credit reconciliation, full-2300) stay hidden. UAE E-Invoicing
  remains deferred.

---

## Phase 32.3-Fix — Client Barcode Tag Front/Back Layouts

**Current approved HEAD (before this phase):** `852ae8b feat: align inventory item type forms`

Added client-aligned **front/back barcode tag layouts** for serialized Assets,
**reusing** the existing print engine (ScannableBarcode → renderPrintDocument →
printHtmlDocument). Additive — the generic `BarcodePrintTemplate` and the Product
label flow are unchanged and still used.

- New components: `features/printing/components/ClientBarcodeTagTemplate.tsx`,
  `barcode-tags/BarcodeTagFront.tsx`, `barcode-tags/BarcodeTagBacks.tsx`
  (GoldWeight/GoldPiece/Diamond/Gemstone/Pearl/Watch backs), `barcode-tags/types.ts`.
- Mapper extended: `lib/print/barcode-label.ts` gains `AssetTagData` +
  `assetToTagData` carrying metadata, inventory_subtype, barcode identity
  components, net/gold weight, etc. The **printed barcode equals the stored
  `asset.barcode`** — the browser never allocates or regenerates an identity.
- Inventory page adds a **"Client Tags"** action (assets tab) rendering the
  front/back tags; the existing generic "Print Barcode" flow is untouched.
- **Type-specific layouts:** Gold By Weight (GW/ST/NT/MC, **no price**), Gold By
  Piece (WT/DIS + brand), Diamond J/Loose (Carat/CC/Cut/DIS/cert), Gem Stone
  J/Loose (multi ST rows/DIS/cert), Pearl J/Loose (Type/size/quality/DIS), Watch
  (brand/model/ref/movement/condition — **owner-approved provisional**).
- **Price policy:** Gold By Weight hides price; other client types show it; Watch
  price configurable. Missing optional rows are hidden (never fake zeros). No
  purchase/internal cost is printed.
- **Metadata capture added** through the existing Phase 32.2 forms (no migration —
  metadata JSONB already exists): `discount` (tag-only, never invoice-derived),
  `stoneWeight` (ST), `minimumMakingCharge` (+ configurable `obfuscateMakingCharge`
  display), and a gemstone `stones` array (with single-stone fallback preserved).
- **Physical tag dimensions and printer hardware remain configurable / pending
  client confirmation** (default 62mm × 28mm; duplex method left to the printer).
  RFID defaults to indicator-only; CODE128 default, QR optional. RTL/LTR preserved.
- No DB migration, no seeds/reset, no backend change, no accounting/posting/VAT/
  COGS, no sales/return/exchange submit, no invoice print template change. Hidden
  diagnostics (statement-v3, credit reconciliation, full-2300) stay hidden.
  Production reset remains forbidden. UAE E-Invoicing remains deferred.

---

## Phase 32.2-Fix — Inventory Item-Type Forms

**Current approved HEAD (before this phase):** `dddcb65 test: refresh invoices search print verifier scope`

Added the client-aligned, type-driven inventory item Add/Edit form on top of the
Phase 32.1 barcode/inventory foundation. Supported item types: **Gold By Weight,
Gold By Piece, Diamond, Gem Stone, Pearl, and Watch**. Watch stays visible as an
**owner-approved provisional type pending client confirmation** (WT / WCH / 00).

- **Frontend-only alignment.** The existing single "Add Asset" modal on
  `/inventory` now renders `InventoryItemForm` (type selector → 8 sections →
  type-specific Section 2). No second/disconnected inventory flow was created.
- New components under `features/inventory/components/`: `InventoryItemForm`,
  `InventoryTypeFields` (GoldWeight/GoldPiece/Diamond/Gemstone/Pearl/Watch),
  `BarcodeTagPreview`, `InventoryMetadataViewer`, and `inventory-item-form-config`.
- Type-specific attributes are stored in `Asset.metadata` (JSONB) with
  `metadata_schema_version = 1`; the loose/jewellery and 24K/bar distinctions use
  `inventory_subtype`. **No new per-item-type tables** were introduced.
- **Barcode safety:** the browser never generates the final stored barcode. The
  form sends only taxonomy (inventory code / item code / karat) and shows a
  read-only preview; the backend (`barcode-identity.service`) allocates the serial
  and final barcode on save. Edit sends only non-identity fields.
- **No backend change** was required — `ErpController.normalizeAssetCreatePayload`
  already generates the barcode and persists `metadata`/`inventory_subtype`.
- Codes are read from the editable company-scoped barcode settings, with a
  documented Watch fallback (WT / WCH / 00) when the settings API is unavailable.
- No demo/production data reset, no seed rewrite, no barcode backfill, no
  historical migration. No posting/accounting/VAT/COGS/statement/customer-credit,
  POS, return/exchange submit, exchange display/print, or invoice-template behavior
  changed. Hidden diagnostics (statement-v3, credit reconciliation, full-2300)
  remain non-customer-facing. UAE E-Invoicing remains deferred.

---

## Phase 31.4-Fix — Unified Invoices Search & Print

Added the dedicated customer-facing `/sales/search-print` page and a guarded,
read-only `GET /invoices/search-print` endpoint. The page searches, views, and
prints real invoice rows only, with invoice number, customer/customer ID, date,
branch, type, and derived display-status filters. Results show invoice number,
type, status, date, customer, branch, total, stored paid/remaining values, and
view/print actions.

Supported invoice-row types are `sale`, `return`, `exchange`, `installment`, and
`deposit`. Gift vouchers and customer-gold purchases remain in their existing
modules because the current schema does not store them as invoice rows. The
employee/salesperson filter and column are explicitly unavailable because the
invoice model has no employee/salesperson field. `Closed` is a display-only
mapping for posted invoices whose stored payment status is `paid`; no DB enum or
migration was added.

The existing `InvoiceDocument`, `InvoicePrintOptionsDialog`, Luxury/default,
Compact, Minimal, and Thermal templates are preserved. Search & Print uses the
trusted exchange-display query and existing `ExchangePrintSummary` path, so
exchange print behavior remains unchanged and normal invoice printing uses the
same established renderer. The existing Sales detail content was extracted into
a shared read-only component and reused by both pages.

Safety: read-only search/view/print only. No accounting, posting, balance, VAT,
invoice-total, POS submit, return/exchange submit, settlement, credit, statement,
or mutation-route changes. Statement-v3, the customer credit reconciliation
panel, and full-2300 diagnostics remain hidden/non-customer-facing. UAE
E-Invoicing remains deferred. Event-sourcing/projection architecture was not
implemented; the current relational/audit architecture is retained.

---

## Phase 30.5-Fix — ExchangeSummary UI in Sales Detail

Added a customer-facing `ExchangeSummary` component and integrated it only
into the Sales invoice detail modal. The UI fetches the trusted read-only
`GET /invoices/:id/exchange-display` endpoint only while an exchange invoice
is selected; normal invoice detail behavior remains unchanged.

The summary renders the endpoint's positive-only replacement, returned-credit,
result, and settlement data without recalculating tax or settlement from raw
invoice items. Successful enrichment suppresses raw negative exchange rows and
totals. Both `target_policy` and conservative `legacy_or_unknown` records are
handled, along with `linked_records`, `best_effort`, and `unavailable`
settlement sources. Endpoint failure shows a warning and falls back to the
stored raw detail so invoice data is not hidden.

No customer statement/history, print, backend, POS, return flow, schema, or
migration changes were made.

Remaining deferred:

* Customer history/statement integration.
* Exchange print/display phase.
* Exchange settlement UI.
* POS customer-credit payment.
* Source-aware 2300 reconciliation.
* Granular permissions.

---

## Phase 30.6-Fix — Customer History Exchange Display

Added exchange-summary access to the Customer detail Sales & Invoices history
tab only. Exchange invoice rows now expose a lazy exchange-only summary action
that reuses the existing `ExchangeSummary` component and the trusted read-only
`GET /invoices/:id/exchange-display` hook.

Normal invoice rows remain unchanged and never fetch exchange-display data. The
customer history integration does not recalculate VAT, replacement totals,
returned credit, policy, settlement, or balances from raw invoice items; the
expanded summary uses the endpoint response only. The existing invoice history
row stays visible during loading and on endpoint error/403; failures show a
compact warning and fall back to the stored customer invoice history row.

No customer statement, print, POS, backend, API route, DB, schema, migration,
return/exchange submit flow, permissions, accounting, customer-credit
application, or 2300 reconciliation changes were made.

Remaining deferred:

* Customer statement/source-aware reconciliation.
* Exchange print/display phase.
* Exchange settlement UI.
* POS customer-credit payment.
* Source-aware 2300 reconciliation.
* Granular permissions.

---

## Phase 32.4-Run-Hotfix B — Implement Trusted HTTP Transactional Demo Seeds

**Current approved HEAD (before this phase):** `f94bcc0 feat: add owner gate and client demo inventory seeder`

Implemented a trusted, service-driven, and client-aligned transactional demo seeding workflow under `backend/seeders/client-demo/transactional/` (seed version: `client-demo-transactions-v1`).

- **In-Process Ephemeral localhost Server Execution:** The seeder boots the real Express application (`backend/src/app.js`) in-process and binds to an ephemeral local port (port 0) on `127.0.0.1`. No public ports or external servers are required. No remote or production URLs (e.g. Render, AWS, Neon, Supabase, GCP) are contacted. Standard Node `fetch` is used.
- **Uniform HTTP Route Usage:** All transactional operations (14 scenarios covering approximately 22 HTTP calls) go through real, authenticated Express route handlers. This ensures authentication, validation, audit logging, and GL postings are processed correctly (never calling `postingService` or `journalService` directly from the seed script).
- **Plan / Dry-Run Mode:** Running `npm run seed:client-demo:transactions:plan` prints a complete, masked visual execution plan outlining routes, enums, prerequisite DB records, and business impacts, without performing login queries, starting HTTP calls, or mutating the database.
- **Prerequisite Context Resolver:** Prior to running seeds, `context.js` dynamically queries and caches existing seeded database references (Company, Branch, User, Customer, Supplier, Account code, active Products, and inventory Assets) by email/code instead of hardcoding database IDs, failing fast if prerequisites are missing.
- **Scenario Coverage:** Implemented 14 scenarios (Supplier purchases cash/credit/products, POS cash sales, POS installment sale with downpayment/schedule/guarantor, POS deposit/arbon sale, Sales return, Sales exchange, Installment payments, Customer gold cycle, Supplier payment, Manual journal draft/post/reversal cycle, Gift voucher issue/redemption, Treasury cash-in/out, Customer credit deposit/refund, and Draft/post invoice).
- **Verification Manifest:** Created `verification-manifest.js` documenting expected minimum record counts and balances for all 18 transactional tables.
- **Safety Static Verifier:** Created `scripts/verify-client-demo-transactional-seeds.js` to assert safety invariants (e.g. no `Math.random` is used, no direct DB creates exist on transactional tables, no bypasses exist, and JWT/passwords are not logged).
- **Reset Workflow Integration:** Integrated the transactional seeder execution step into `scripts/reset-client-demo-data.js` after the inventory seeder has completed, so a failure in the transactional seed halts the reset process.
- **Safety Guarantees:** No database table was reset, no migrations were run, and no seed data was mutated in this phase. Live reset/run is deferred to Phase 32.4-Run-C. No application business code changed. Watch remains provisional (WT/WCH/00). Production reset remains forbidden. UAE E-Invoicing remains deferred.

---

## Phase 32.4-Run-C-Closure — Evidence, Reconciliation & Final Approval Verification

**Current approved HEAD (before this phase):** `fbff419 test: update verifiers baseline for Phase 32.4-Run-C`

Closed all verification gaps and performed complete post-reset reconciliation against the owner-confirmed local database `darfus_erp` running on local Docker container `darfus-postgres` (port 5433).

- **Database Reset & Migration:** Successfully verified that all 30/30 database migrations are applied and the DB is in a clean post-reset state.
- **Backup Evidence & Manifest:** Confirmed the backup SQL dump size (325,609 bytes), validated the dump header, summarized `manifest.json`, and added `restore-instructions.txt` to the backup folder.
- **Live Client Demo Verifier:** Modified `scripts/verify-client-demo-data.js` to execute actual live PostgreSQL database assertions. The script successfully validates active inventory codes, taxonomy item codes, zero-line posted journal entries, and balanced trial balances. All assertions passed.
- **Taxonomy & Item Codes:** Verified 6 inventory codes (including provisional/active `WT`) and all 19 item codes. Built a table matching the 10 variants.
- **Asset Discrepancy Resolved:** Proved that the 2 missing assets (`AST-2026-00179` and `AST-2026-00144`) have non-null `parent_asset_id` (linked to a gold bar and a gold pool), explaining why they are correctly filtered out on the main inventory page which queries `/assets?standaloneOnly=true`.
- **Transactional Flows:** Checked all 14 scenarios and confirmed 26 transactional API operations, 1 authentication request, and 14 cash transactions are recorded.
- **Ledger Reconciliations:**
  - **Invoices:** Reconciled 12 invoices (3 legacy, 9 transactional) mapping to exactly 10 invoice items (the 3 legacy invoices have 0 items as designed in the base seeds).
  - **Journals:** Checked 26 journal entries (2 balanced, 1 reversed, 23 posted) and 73 journal lines. Verified that every posted entry is balanced (SUM(debit) = SUM(credit)), the global trial balance net difference is exactly `0.00000000`, and no posted journal has zero lines.
  - **VAT:** Reconciled output VAT on account code `2200` (`1597.00000000` net credit) and verified zero input VAT.
  - **COGS:** Verified COGS postings on account code `5000` (net debit `21100.00000000`) and matching stock effects. Product RNG-21K-BULK-SEED stock is exactly 10.
  - **Customer & Supplier Balances:** Inspected balances for all five customers. Verified that `Supplier.due` remains frozen as a reference-only field per Phase 10M design, while the supplier statement is computed dynamically from documents.
  - **Treasury:** Verified 14 cash transactions (Cash In: `29232.5000`, Cash Out: `14812.5000`) and confirmed all match journal postings.
  - **Installments:** Reconciled the 6 installments (2 partial payments of 1000 each, 4 pending; remaining balance `4444.5000` matches the customer statement).
  - **Deposit / Arbon:** Verified the deposit invoice and cash-in of 1500 (Dr Cash 2415 / Cr Customer Deposits 2415).
  - **Gift Vouchers:** Verified issue (500 value) and redemption (200 value), with liability account `2400` balance of 300.
  - **Customer Gold:** Verified 4 gold pool records (1 legacy, 3 transactional: deposit, payout, use-in-sale). Khaled's net gold balance is 5g.
- **Identity Preservation:** Confirmed that returned and exchanged assets retain their original barcodes (`GPERG21000001` and `GWBRC21000002`).
- **Complete Verifier Suite:** All 39 verifier scripts in the repository were executed and passed perfectly.

## Phase 32.4-Run-C-Hotfix Fix — Deposit Posting & Live Demo Verification

Source-fix commit: `c0c4300` (`fix: reconcile deposit posting and live demo verification`).

The Run-C audit found that the POS deposit flow resolved `paidAmount=1500` but did not
persist that value in `Invoice.deposit`; `postDepositEntry` therefore used the unsafe
`invoice.deposit || invoice.total` fallback and posted 2415 instead of the 1500 actually
received. The fix passes an explicit authoritative `receivedAmount` from all three existing
deposit callers and removes the invoice-total fallback. Invoice totals, remaining amounts,
customer-balance updates, and non-deposit posting paths are unchanged. Zero/missing deposits
continue to be rejected by the trusted payment resolver; no unpaid remainder journal line was
invented.

`verify-client-demo-data.js` now has a separate read-only gate:
`VERIFY_CLIENT_DEMO_LIVE=true` and `VERIFY_DATABASE_NAME=darfus_erp`. Destructive reset gates
are never required for read-only checks. Explicit live mode rejects production/remote/wrong
database targets and fails non-zero on skipped or failed live sections. Static-only mode is
labelled `STATIC ONLY — LIVE DATA NOT VERIFIED`.

The focused `verify-deposit-posting-reconciliation.js` covers partial, full, zero/missing, and
decimal deposit cases plus live Payment/CashTransaction/journal reconciliation. The exchange
demo note now describes the selected gemstone necklace accurately; the payload and selected
asset are unchanged.

The owner-confirmed local database `darfus_erp` was rebuilt only through the guarded reset.
Backup: `backups/client-demo/2026-07-10T14-00-46-106Z`. All 30 migrations and the 14 trusted
transactional flows completed. Live verification confirmed invoice total 2415, payment/cash/
cash-journal/deposit-liability 1500, remaining 915, balanced journals, supplier balance 89500,
VAT 1597, COGS 21100, six installments (2 partial/4 pending), voucher balance 300, customer
gold net 5g, preserved return/exchange identity, and exact barcode sequence proof. Production,
Render, remote databases, historical barcodes, print templates, statement-v3, full-2300 UI, and
UAE E-Invoicing remain untouched/deferred. Browser/physical-printer verification remains pending.

## Phase 32.4-Run-C-Hotfix 2 — Final Browser/API Smoke & Accounting Clarification

Completed the final non-destructive smoke pass against the owner-confirmed local demo stack:
frontend `localhost:3000`, backend `localhost:8000`, PostgreSQL Docker `darfus-postgres`
on local `darfus_erp` port 5433. No reset, seed, migration, direct DB mutation, or business
mutation request was executed. The only POST was the local demo login needed to create an
authenticated test session; all follow-up API checks were GET/read-only.

Browser smoke verified dashboard, inventory, existing asset detail, barcode code settings,
Invoices Search & Print, sales list, returns, exchanges, installments, gift vouchers,
customer gold, and customer detail/statement surfaces. The Search & Print UI showed 12
queryable invoices and the deterministic deposit invoice as total 2415, paid/received 1500,
remaining 915. Barcode settings showed WT/WCH/00 as active provisional pending client
confirmation, NCK present, and used code values locked. Asset detail exposed the stored
barcode and tag action, with non-blocking missing Arabic translation keys noted for
`Inventory.gold-weight`, `AssetDetails.sourceDoc`, `AssetDetails.certificate`, and
`AssetDetails.attachments`. Physical printer output was not tested.

Authenticated GET API smoke passed for settings/dashboard data, assets, asset detail,
barcode settings, invoice search, invoice detail, exchange-display enrichment, installments,
customer statement-v2, gift vouchers, customer invoices, and treasury summary. DB/API/UI
values reconciled: 20 assets, 18 standalone assets, 12 invoices, 6 installments with
4444.5000 remaining, gift voucher `GV-DEMO-001` value 500 / balance 300, customer gold net
5g for Khaled, returned asset `AST-CD-gp` barcode `GPERG21000001`, replacement asset
`AST-CD-gs-jewellery` sold barcode `GSNCK18000001`, and unused `AST-CD-gw-jewellery-2`
available barcode `GWBRC21000002`.

Journal status wording is clarified: the database contains 23 `posted`, 2 `balanced`, and
1 `reversed` journal entries. The prior phrase "23 posted, 2 balanced, 1 reversed" was a
literal status distribution, not a count of balanced posted journals. All 23 posted journals
are balanced; 0 posted journals are unbalanced; 0 posted journals have zero lines; global
debit and credit both equal 176142.00000000.

Deposit accounting evidence remains: Dr Cash 1500 and Cr Customer Deposits 1500 only for the
received amount. The unpaid 915 remains as `Invoice.remainingAmount` and in the operational
`Customer.balance` AR mirror. No AR 1300 line is posted by the deposit journal for that
unpaid remainder, and no extra accounting treatment was invented. This matches the existing
repository behavior, but formal accounting sign-off is still required if the client/accountant
expects a different GL treatment for unpaid deposit remainders.

Verification completed on the clean tree: `npm run verify:client-demo-data` and
`npm run verify:deposit-posting-reconciliation` both reported `LIVE DATA CHECKS EXECUTED`;
all 40 verifier scripts passed; `npm run typecheck` passed; `npm run lint` passed with
0 errors and 19 existing warnings; `npm run build` passed. Production, Render, remote
databases, stashes, historical barcodes, invoice print templates, statement-v3 UI exposure,
full-2300 customer-facing exposure, and UAE E-Invoicing remain untouched/deferred.
## Phase 32.6-Fix A — Reservation Core Foundation

Added the reservation foundation requested by RE-001 without implementing final sale, refunds,
expiry, renewal, reports, customer statements, notifications, or full multi-item UI.

Backend additions:
- `reservations` extended additively with branch/currency/totals/final-invoice placeholder,
  workflow version, legacy marker, optimistic version, and created/updated-by fields.
- New `reservation_items` table for asset-backed multi-item foundation.
- New `reservation_payments` table for immutable posted reservation receipts/payments.
- Dedicated reservation service owns transactions, asset locks, server-side totals,
  idempotency, item reservation, optional initial payment posting, and audit events.
- Generic reservation CRUD writes were replaced with dedicated routes. Full replacement/delete
  are disabled; PATCH is notes-only.
- Reservation payment journal source type is `reservation_payment`.

Accounting:
- Reservation payments debit selected cash/bank and credit the configured
  `reservationAdvancesAccountId` liability account.
- No fallback to account `2300`; `2300` is valid only if company settings explicitly point
  reservation advances to that account.
- No VAT, revenue, AR, COGS, inventory, customer-credit, or deposit-income posting occurs for
  reservation payments.
- Reservation creation without payment does not require account configuration; creation with
  payment and payment posting do require valid configuration.

Frontend safety:
- `/sales/reservations` remains single-asset visually but now submits the atomic reservation
  payload with an idempotency key.
- It no longer PATCHes the asset separately after reservation creation.
- It no longer creates a deposit invoice or submits VAT/tax/subtotal metadata for reservation
  deposits.
- API cancellation/release is blocked pending a dedicated cancellation/refund workflow.

Legacy compatibility:
- Existing reservation rows remain readable as legacy (`workflow_version=1`, `is_legacy=true`).
- Existing `deposit` values were not converted into reservation payments.
- No historical reservation receipts or journals were fabricated.

Verification:
- Added `verify:reservation-core-accounting-foundation` with static checks and optional local
  live mode (`VERIFY_RESERVATION_CORE_LIVE=true`, `VERIFY_DATABASE_NAME=darfus_erp`) that uses
  isolated rollback-only records.

## Phase 32.6-Fix-A-Hotfix — Barcode Tag Verifier Scope Guard

Fix A implementation commit remains `13ab543dbf74d59077eed3238de9d4be746c09e3`
(`feat: add atomic reservation core and advances accounting`).

Root cause: `scripts/verify-barcode-tag-print-layouts.js` still used a frozen historical
baseline (`c21b20d`) in default global-suite mode. After approved later phases, including
the reservation foundation migration/models/service, the verifier re-litigated committed
history from the barcode-tag phase and rejected approved backend/migration files as barcode
scope drift. Barcode functional assertions were not failing.

Hotfix behavior:
- Default verifier mode runs all barcode functional/static/layout/source assertions and checks
  only the current working tree for unauthorized dirty/untracked changes.
- Historical barcode scope auditing is now explicit via
  `VERIFY_BARCODE_TAG_SCOPE_BASELINE=<git-ref>`.
- Invalid historical refs fail non-zero with a clear error and do not fall back to a default.
- Historical mode still prints the selected baseline, enforces the original barcode-phase
  allow-list/deletion checks, and may reject later approved commits when intentionally run
  against an old baseline.

No reservation business code, reservation migration, accounting posting behavior, database
records, Production/Render, or stashes were changed by this hotfix.

## Phase 32.6-Fix-A-Hotfix-2 — Remaining Phase Verifier Scope Guards

Fix A implementation commit remains `13ab543dbf74d59077eed3238de9d4be746c09e3`
(`feat: add atomic reservation core and advances accounting`). The first verifier hotfix
commit remains `f90a1558af870d1592582c5b073ddd4df27cd384`
(`test: fix stale barcode tag verifier scope guard`).

Root cause: three additional phase verifiers still used the old historical baseline
`c21b20d` automatically in default global-suite mode and re-litigated all approved later
commits. The affected verifiers were:
- `scripts/verify-barcode-inventory-foundation.js`
- `scripts/verify-inventory-item-type-forms.js`
- `scripts/verify-invoices-search-print.js`

The default contract now matches the barcode-tag verifier hotfix: all functional/static/
schema/UI assertions still run, but default scope checks inspect only the current working
tree. Historical phase scope auditing remains explicit through:
- `VERIFY_BARCODE_INVENTORY_SCOPE_BASELINE=<git-ref>`
- `VERIFY_INVENTORY_ITEM_TYPE_SCOPE_BASELINE=<git-ref>`
- `VERIFY_INVOICES_SEARCH_PRINT_SCOPE_BASELINE=<git-ref>`

Invalid historical refs fail non-zero with a clear error and do not fall back to a frozen
baseline. Explicit historical mode prints the selected baseline, enforces the original
phase allow-list/deletion checks, and may reject approved later commits when intentionally
run against an old baseline. No reservation business code, reservation migration, accounting
posting behavior, frontend reservation flow, database records, Production/Render, or stashes
were changed. Phase 32.6-Fix B is not implemented.

## Phase 32.6-Fix B — Final Sale Completion & Refund Settlement

Implemented the next reservation workflow layer on top of Fix A without starting Fix C/D.

Completion:
- Added additive completion/refund settlement schema and models:
  `reservation_payment_applications`, `reservation_refunds`, and
  `reservation_refund_allocations`.
- Fully paid, non-legacy reservations can be completed through a dedicated idempotent
  backend workflow only.
- The final posted sales invoice is created from the current active reservation items.
- Reservation payments are applied through immutable application rows; original payment
  rows are not edited or deleted.
- The sales invoice posting path remains the established `postInvoiceEntry` path for
  sales revenue, VAT, COGS, and inventory. For posting, the invoice is treated as AR first;
  a separate settlement journal then debits configured Customer Reservation Advances and
  credits AR/customer control. This leaves the final customer AR net zero when the
  reservation is fully paid.
- Assets and reservation items move from Reserved/active to Sold/sold, and the reservation
  links to exactly one final invoice.
- Completion is blocked for legacy, cancelled, refunded, expired, partially paid, already
  completed, or mismatched-total reservations.

Cancellation/refunds:
- Manual cancellation releases active reserved assets back to Available. If posted
  reservation payments exist, the reservation becomes `cancelled_refund_pending`; otherwise
  it becomes `cancelled`.
- Refund request, approval/rejection, and execution are separate backend workflows.
- Refund execution is idempotent and requires approval first.
- Refunds are full only; partial/excess refunds are rejected.
- Different refund method requires approval before execution.
- Refund posting debits configured Customer Reservation Advances and credits selected Cash
  or Bank. No revenue, VAT, COGS, inventory, or AR movement is posted by reservation refund
  execution because no final sale exists.

Permissions:
- Completion: `sales.create`
- Cancellation/refund request: `sales.approve`
- Refund approval/rejection: `approvals.manage`
- Refund execution: `treasury.update`

Added verifier: `verify:reservation-completion-refund-settlement`.

Still deferred:
- automatic expiry scheduler
- expiry notifications
- renewal/successor reservations
- add/remove/replace item workflows after creation
- repricing active reservations
- full reservation reports
- customer statement reservation section
- full granular reservation permission matrix
- full multi-item reservation UI

No reset, seed, production/Render access, customer-credit/statement service changes, print
template changes, or UAE E-Invoicing work is part of this phase.

### Phase 32.6-Fix-B-Closure

Closed the workflow on top of backend commit `7e1d390` (`feat: add reservation completion
refund settlement`) with closure commit `feat: close reservation completion refund workflow`.
Details in `docs/client-requirements/PHASE-32.6-FIX-B.md`.

- **VAT-inclusive completion correction**: the agreed reservation price is VAT-inclusive.
  Completion now extracts net/VAT from the gross agreed total (`taxBase = total / (1 + rate)`,
  `tax = total - taxBase`) instead of adding VAT on top via `salesService.computeTotals`.
  `postInvoiceEntry` consumes the stored subtotal/tax/total, so no double VAT. Live evidence
  (price 105, VAT 5%): invoice total 105, tax 5, subtotal 100.
- **Asset-backed stock movement**: new additive, forward-only migration
  `20260711021000-stock-movement-asset-reference.js` adds nullable `asset_id`
  (FK → assets) + `stock_movements_asset_id_idx` and relaxes `product_id` to nullable.
  Completion records exactly one `reservation_final_sale` stock movement per sold asset;
  existing product-backed movements and the product FK are preserved.
- **Live verification**: gated local verifier
  (`VERIFY_RESERVATION_SETTLEMENT_LIVE=true`, `VERIFY_DATABASE_NAME=darfus_erp`, local
  `darfus_erp@localhost:5433`) exercises completion, VAT-inclusive extraction, stock movement,
  AR-nets-to-zero settlement, idempotency, concurrency, rollback, cancellation, and the full
  refund lifecycle. Result: exit 0, **LIVE TESTS EXECUTED**, **No persistent test pollution
  detected**; before/after DB counts identical.
- **Minimal frontend wiring**: `/sales/reservations` gains permission-aware Complete/Cancel/
  Refund actions using dedicated endpoints only (no generic PATCH), submitting no trusted
  financial values, with loading/confirmation guards and RTL/LTR support.
- **Verifier normalization**: the Fix A verifier's stale "cancellation is deferred" guard was
  replaced with durable guards confirming the Fix B cancellation UI stays safe; all other
  Fix A safety assertions preserved.
- Both reservation migrations are already applied to local `darfus_erp`; the migration created
  no business records. Production/Render, remote databases, and the 11 stashes were untouched.

## Phase 32.6-Fix C — Multi-Item Changes, Automatic Expiry & Renewal

Implemented the remaining approved reservation lifecycle on top of Fix A/Fix B. Full detail:
`docs/client-requirements/PHASE-32.6-FIX-C.md`. Commit: `feat: add reservation amendments expiry
and renewal`.

- **Item amendments** — `POST /reservations/:id/amend-items` (permission `sales.approve`,
  idempotent) adds/removes/replaces/reprices active items atomically. Prices are resolved
  server-side from the asset record (client submits asset ids only). Totals/paid/remaining/status
  are recomputed server-side; an amendment that would leave total below paid, or leave zero active
  items, is rejected (no partial refund of an active reservation). Removed/replaced-out items are
  preserved as `released`; historical payments are never edited. No sales/VAT/AR/COGS/inventory/
  cash/advance journal is posted. Immutable `reservation_amendments` + `reservation_amendment_items`
  record before/after evidence. Idempotent; rolls back fully on failure; concurrency-safe.
- **Expiry extension** — `POST /reservations/:id/extend-expiry` (idempotent) moves expiry later
  only, only before the current (trusted-DB-time) expiry; immutable
  `reservation_expiry_extensions` history; no financial posting.
- **Automatic expiry** — reusable `processDueExpirations()` (no grace period,
  `expires_at <= now()`, `FOR UPDATE SKIP LOCKED`, per-row transaction, reuses the shared
  cancellation release path) releases assets, preserves payments, posts no refund/sale/journal, and
  moves paid→`cancelled_refund_pending` / unpaid→`cancelled` with `expired_by_system` metadata. A
  fully paid expired reservation is not auto-completed. A guarded `setInterval` scheduler
  (`reservation-expiry-scheduler.js`, isolated in test/verifier mode, `unref`'d) is bootstrapped
  from `server.js`.
- **Renewal** — `POST /reservations/:id/renew` (idempotent) is eligible only for automatically
  expired sources with no active successor/refund. It creates a linked successor at current server
  prices and transfers the eligible advance balance via the immutable
  `reservation_payment_transfers` subledger — **no GL journal** (Advances liability/customer/branch/
  company/currency unchanged → zero net GL impact), no cash movement, no auto-invoice. Successor
  total ≤ transferable activates immediately (Active/Partially Paid/Fully Paid); > transferable
  raises a distinct `renewal_excess` refund and holds the successor in `pending_renewal_settlement`.
- **Renewal-excess refund** — `POST /reservation-renewal-refunds/:id/approve` (`approvals.manage`)
  and `/execute` (`treasury.update`, idempotent) refund the server-derived excess via the Fix B
  Dr Advances / Cr Cash posting (no sales/VAT/AR/COGS/inventory), then transfer the exact successor
  total and activate the successor. Approval precedes execution; duplicate/early execution and
  posting-failure rollback are enforced. Fix B full refunds are filtered to `reservation_full` and
  blocked while a renewal is in progress.
- **Verification** — `scripts/verify-reservation-amendment-expiry-renewal.js` (static + gated
  local live). Live run against `darfus_erp@localhost:5433`: **LIVE TESTS EXECUTED**, **No
  persistent test pollution detected**, before/after counts identical.
- The Fix C migration is applied to local `darfus_erp` and created no business records.
  Production/Render, remote databases, and the 11 stashes were untouched.

Still deferred to Fix D: full granular permission matrix, notification delivery, reservation
reports, customer-statement reservation section, full UI redesign, cross-company/branch/currency
renewal, partial active-reservation refunds.

## Phase 32.6-Post-C — POS Reservation Deposit & Accounting Configuration

Wired the POS Deposit action, the mandatory reservation initial payment, and the Reservation
Advances Account configuration into one operable workflow. Full detail:
`docs/client-requirements/PHASE-32.6-POST-C-POS-RESERVATION.md`. Commit: `feat: wire POS
reservation deposits and account configuration`.

- **Reservation Advances Account configuration** — the existing `reservationAdvancesAccountId`
  setting is now selectable from Accounting Settings (only active credit-nature liability accounts
  listed; backend re-validates). Errors are stable-coded and bilingual
  (`RESERVATION_ADVANCES_ACCOUNT_NOT_CONFIGURED` / `RESERVATION_ADVANCES_ACCOUNT_INVALID`, HTTP
  422). No account code is hardcoded; no silent fallback.
- **Mandatory initial payment** — `createReservation` now rejects a manual reservation without an
  initial payment > 0 (`RESERVATION_INITIAL_PAYMENT_REQUIRED`) or without a payment method
  (`RESERVATION_PAYMENT_METHOD_REQUIRED`), and still rejects payment above the total. This applies
  only to the public manual path; internal Fix C renewal successors (`Reservation.create` + advance
  transfer) are unaffected. Later payments remain unlimited and unscheduled; no installment schedule
  was added.
- **POS reservation mode** — selecting `Deposit / عربون` opens a dedicated reservation dialog and
  returns before any invoice/sale posting. The dialog collects the initial payment, method, future
  expiry, and notes, shows total/remaining, and submits only asset ids + operational fields (no
  trusted totals/VAT/journal lines/account) to `POST /reservations`. Success clears the cart and
  shows the reservation summary; missing configuration disables the confirm with a bilingual warning
  and keeps the normal sale path available. No sales invoice or sales/VAT/AR/COGS/inventory posting
  occurs.
- **Reservation page** — the management create dialog enforces the same mandatory-initial-payment,
  payment-method, and configuration rules consistently with POS.
- **Accounting** — initial and later reservation payments post Dr Cash/Bank / Cr Reservation
  Advances only; the unpaid balance stays operational (not AR).
- **Verification** — `scripts/verify-pos-reservation-deposit-configuration.js` (static + gated
  local live). Live run against `darfus_erp@localhost:5433`: **LIVE TESTS EXECUTED**, **No
  persistent test pollution detected**, prior setting restored, before/after counts identical. No
  migration was required.

Still deferred to Fix D: fixed installment schedules, full permission matrix, reports,
customer-statement reservation section, notifications, full UI redesign, mobile reservation flow.

## Phase 32.6-Fix D — Granular Permissions, Audit, Notifications, Reports, Customer Statement & UI

Implemented the reservation governance/UI layer on top of the already closed Fix A/B/C/Post-C
reservation workflow. Full detail: `docs/client-requirements/PHASE-32.6-FIX-D.md`.

- Added granular reservation permissions (`reservations.view*`, create, record payment, complete
  sale, cancel, amend/reprice, extend, renew, refund request/approve/reject/execute, audit,
  reports, statement, and account-configuration permissions). Existing legacy permissions remain
  as transitional fallbacks only so current users are not locked out before final role assignment.
- Added branch/all/own reservation visibility foundation in the reservation service. Legacy rows
  remain readable through the existing safe read paths; the new workflow operations still require
  workflow facts and existing guards from Fix A/B/C.
- Added `GET /reservations/:id/audit-timeline` for read-only reservation audit history with
  before/after evidence from immutable audit logs.
- Added reservation notification metadata (`source_type`, `source_id`, `event_key`) with event-key
  deduplication, and emitted reservation notifications for creation, payments, fully-paid,
  completion, cancellation, refund, amendment, expiry, and renewal milestones.
- Added read-only reservation reports:
  `/reports/reservations/summary`, `/reports/reservations/payments`, and
  `/reports/reservations/reconciliation`.
- Added a separate `reservationAdvances` section to customer statement-v2. It is explicitly
  separate from Accounts Receivable, so reservation payments do not become customer debt before
  final sale.
- Enhanced `/sales/reservations` with granular permission checks, later-payment action, status
  labels, audit timeline display, and reservation report links. The browser still submits no
  trusted totals/VAT/journal lines/asset status for reservation actions.
- Added `scripts/verify-reservation-governance-reports-ui.js` and package script
  `verify:reservation-governance-reports-ui`.

No posting service, VAT, COGS, POS sales, statement services, customer-credit logic, print
templates, Production/Render, or stashes were changed by Fix D. Still deferred: final staff role
assignment, notification recipient escalation rules, full report UI/export polish, printable
statement reservation section, mobile workflow polish, and physical printer validation.
# Phase 32.6-Fix D final closure handoff (2026-07-13)

Reservation governance application closure is implemented in `6d12975`, behavioral verification in `669b194`, and the backend-filtered settings verifier alignment in `396e255`. All nine reservation reports now enforce common pagination (`page=1`, `limit=50`, max `100`, `{total,page,limit,pages}`), deterministic ordering, full-filter totals, complete authorized export, and identical company/branch/own visibility for rows and aggregates. Reconciliation retains secure unsupported-diagnostic rules and paginates only authorized logical rows.

The gated verifier uses real Express HTTP and local `darfus_erp@localhost:5433`, proves exact negative permissions, account permission/validation atomicity, payload-aware repricing, page and export behavior, scope isolation, a real 750/750 reconciled row plus mismatch, and zero namespace pollution with `ACC-2300` restored. Typecheck, lint, build, and 45/45 verifiers pass.

MANUAL UI QA REQUIRED. Do not start Phase 33 without owner direction.

## Phase 33B — Gold Purchase Core Data and Draft Workflow

Phase 33B is implemented as an additive, non-accounting CGP/IGP draft foundation. Full contract:
`docs/client-requirements/PHASE-33B.md`.

- Separate CGP and IGP document/item aggregates, server draft numbers, draft/validated states,
  optimistic versions, audited soft void, and backend decimal weight calculations.
- IGP supports physical gold, serialized bullion, and bullion lots; pool/custom are rejected.
- New bounded APIs live under `/api/v1/gold-purchases`; authenticated company/branch is the
  maximum scope and query filters only narrow it.
- Minimal bilingual workspaces live at `/sales/customer-gold/drafts` and
  `/suppliers/investment-gold`.
- The local additive migration was backed up and applied to `darfus_erp@localhost:5433` only.
- `scripts/verify-gold-purchase-draft-workflow.js` passed real HTTP behavior, exact cleanup, and
  zero posting/inventory/asset/barcode/pool/order effects. All 46 verifiers pass.

Phase 33C was subsequently owner-authorized and completed as recorded below. Final
value/accounting/tax/settlement still require accountant/client approval before Phase 33D.

MANUAL UI QA REQUIRED.

## Phase 34.5A-HF1 — Recovery, Credential UI and Permission Localization Correction

Phase 34.5A-HF1 closes the v2 audit gaps on top of `75cf92f feat: add super admin branch shell recovery` without recreating Phase 34.5A. The correction keeps the preferred counts unchanged: 42 migrations, 120 permissions, 3 POS permissions, 24 Gold Purchase permissions, and 52 verifier files.

Implemented corrections:

- completed centralized permission display metadata in `lib/permissions/catalog.ts`;
- removed confirmed Arabic/English mixed system labels from Employee credential/permission UI;
- made frontend permission visibility account-type aware so `branch_shell` does not receive admin/owner all-permission shortcuts;
- wired System Accounts UI actions to `/system-accounts` instead of creating Super Admin or Branch Shell accounts through `/users`;
- added `/auth/validate-reset-token`, `/auth/change-email`, and `/auth/confirm-email-change`;
- wired `email_change_tokens` with hashed one-time tokens and session revocation on confirmation;
- centralized backend password policy in `backend/src/utils/password-policy.js`;
- replaced plaintext JSONL development recovery delivery with an in-memory TTL local-development mailbox;
- required Level 2 for Employee PIN self-change;
- blocked generic Employee update from changing `employeeCode` outside the dedicated change-code/history path;
- added Employee credential UI actions for code/PIN/unlock/session revocation and effective-permission source display;
- fixed frontend refresh retry to use the rotated stored token after refresh.

Local verification used the Docker `darfus-postgres` service mapped to host `localhost:5433`; the unrelated local PostgreSQL on host port 5432 was not used as the application DB endpoint. A custom-format backup was created before live verification:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf1_resume_20260715-130413.dump` (470,938 bytes).

Passing evidence before final commit:

- `node scripts/verify-super-admin-branch-shell-recovery.js`
  - `LIVE HTTP ACCOUNT TESTS EXECUTED`
  - `TECHNICAL SESSION REVOCATION PASSED`
  - `FINAL ADMIN SAFEGUARDS PASSED`
  - `SUPER ADMIN BRANCH SHELL RECOVERY PASSED`
  - `No persistent account test pollution detected`
- `node scripts/verify-sales-pos-operator-enforcement.js`
  - `SALES/POS OPERATOR ENFORCEMENT PASSED`
  - `No persistent business test pollution detected`
- `verify-employee-authorization-foundation.js`, `verify-employee-operator-session.js`, and `verify-employee-management-operator-ui-contract.js` passed.
- `npm run typecheck`, `npm run lint`, `npm run build`, `node --check scripts/verify-super-admin-branch-shell-recovery.js`, and `git diff --check` passed. Lint still reports existing unrelated warnings only.
- Local Playwright browser QA passed Arabic RTL/English LTR Employee and System Accounts surfaces, reset-password token-state rendering, mobile Arabic System Accounts rendering, and no obvious plaintext secret/token display in tested UI surfaces.

Production SMTP, email OTP, TOTP, backup codes, SMS, full break-glass, service accounts, Phase 34.5B, Returns/Exchanges expansion, Gold Purchase integration expansion, broad Treasury/Accounting/Inventory conversion, historical User deletion, automatic account classification, offline recovery bypass, Phase 33D, and Phase 33C-HF2 remain deferred.

## Phase 34.5A-HF2 — Branch Shell Employee-First Sales/POS Gate Consistency

Phase 34.5A-HF2 corrects the blocker found during the Phase 34.5B pre-fix audit:
`BRANCH_SHELL_EMPLOYEE_FIRST_BASELINE_INCONSISTENT`.

The issue was ordering, not permission catalog drift. Branch Shell correctly
receives no direct operational User permissions, but Phase 34.5 Sales/POS routes
still had generic `requirePermission(...)` middleware before Employee operator
policy. That blocked Branch Shell before Employee-first authorization.

HF2 implemented a centralized account-type-aware Sales/POS command gate:

- `salesOperatorPolicy.requireSalesCommandAccess(...)`;
- legacy accounts retain technical User permission behavior and existing
  `salesOperatorMode` compatibility;
- Branch Shell uses fixed technical branch/company scope and then Employee
  permission/Level/direct-denial/session checks;
- Super Admin reaches the same policy through technical system scope but does not
  bypass Employee authorization for operational Sales/POS commands;
- in-scope Sales/POS routes and official print/reprint now use the centralized
  gate;
- frontend `AuthGuard` has only a narrow Sales/POS route compatibility allowance
  for `branch_shell`/`super_admin`, with no `usePermissions` all-permission
  shortcut.

No migration, permission, or verifier-file count changed:

- migrations: 42
- permissions: 120
- POS permissions: 3
- Gold Purchase permissions: 24
- verifier files: 52

Local evidence before commit:

- DB: local Docker `darfus-postgres` on `localhost:5433`, database `darfus_erp`;
- backup:
  `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf2_20260715-144007.dump`
  (467,853 bytes);
- `scripts/verify-sales-pos-operator-enforcement.js` passed and emitted
  `BRANCH SHELL EMPLOYEE-FIRST SALES/POS GATE PASSED`;
- `scripts/verify-super-admin-branch-shell-recovery.js` passed;
- targeted Employee authorization/operator-session/employee-management UI contract
  verifiers passed;
- Browser QA namespace `T345AHF2-BQA-1784116840926-hdmn0g` confirmed Branch Shell
  has no direct `pos.sell`/`sales.create`, reaches POS operator route, verifies
  and steps up Employee, opens Arabic RTL POS, and cleans to zero fixture users;
- typecheck, lint, build, syntax checks, and `git diff --check` passed during
  dirty-tree verification.

Phase 34.5B remains deferred until HF2 is committed and final clean-tree 52/52
verification passes. Do not start Returns, Exchanges, Finalized Void, Refunds,
Installment Collection, Gift Vouchers, Customer Credit, Phase 33D, or
Phase 33C-HF2 from this handoff.

## Phase 34.3 — Operator Session and Dual Audit Identity

Phase 34.3 adds the employee operator-session foundation while preserving existing business execution route boundaries.

- Added additive migration `20260714040000-employee-operator-session-dual-audit.js`.
- Added durable `employee_operational_sessions` with idle timeout, absolute timeout, credential-version snapshot, authorization-version snapshot, branch scope, device session id, and employee identity snapshots.
- Added `employees.authorization_version` and incrementing logic for material permission, branch-access, role/status/branch, and employee-code changes.
- Extended audit logs with dual technical-user / employee-operator identity fields and `hash_version`.
- Preserved legacy audit hash verification as v1 and added v2 canonical hashing for dual-identity rows.
- `/operator/verify` remains compatible and now creates/replaces a server-side session.
- Added `/operator/current`, `/operator/authorize-action`, and `/operator/lock`.
- Added frontend device-session header handling, operator provider/repository, and minimal header verify/lock controls.
- Added `scripts/verify-employee-operator-session.js`; verifier inventory is 49.
- Verified real HTTP behavior for session creation, current state, Level-2 step-up, permission denial, stale authorization invalidation, lock, dual audit hashing, zero business mutation, and zero namespace pollution.

Business execution routes are not converted by Phase 34.3. Gold Purchase, Sales, POS, returns/exchanges, reservations, purchases, inventory, treasury, accounting, payroll, and attendance command enforcement remains unchanged until a later explicitly approved phase.

MANUAL UI QA REQUIRED. Phase 33D and Phase 33C-HF2 are not started.

## Phase 33C — Gold Purchase Permissions, Submission and Maker–Checker

Phase 33C is implemented and verified. Full contract and evidence:
`docs/client-requirements/PHASE-33C.md`.

- Added the exact 11 CGP and 11 IGP dedicated permissions with base-view and
  `view_all > view_branch > view_own` visibility. Approval requires branch/all scope.
- Preserved Sales/Supplier permissions only as transitional draft-operation fallbacks; they do
  not authorize submit, approve, reject, or revision creation.
- Added validated submission, one-level maker–checker, creator/submitter self-review denial,
  mandatory rejection reasons, immutable canonical JSONB snapshots with SHA-256 hashes,
  optimistic versions, idempotent commands, and concurrent terminal-review serialization.
- Added submitted/approved states. Rejection returns to draft without deleting the rejected
  request/snapshot. Approved documents are immutable and changes require a linked new revision.
- Added scoped approval queue/detail APIs and live approval UI, permission administration labels,
  submit/read-only/revision behaviors in both Gold Purchase workspaces.
- Additive migration `20260714010000-gold-purchase-approval-governance.js` was applied only to
  local `darfus_erp@localhost:5433` after a validated 383,582-byte custom-format backup. Migration
  count is 37; 22 Gold Purchase permission rows exist.
- Application commit `be14c304472c86e776be41646d4d7aeb5dfca059`; verifier commit
  `007435c991abeb8f0bed5b35b48439188db8f15d`.
- Typecheck, lint, build, 47/47 verifiers, gated real HTTP behavior, concurrency, snapshot-tamper
  rejection, zero downstream posting effects, and zero persistent `T33C-*` pollution pass.

Phase 33D is not started. Accountant/client decisions remain required for price basis, VAT/RCM,
tax, valuation, account categories, customer/supplier settlement, payments, returns, and
reversals. Posting, receipt, assets, barcodes, inventory, accounting, treasury, withdrawal,
Liquidity Transfer, and transformation remain out of scope.

MANUAL UI QA REQUIRED.
