# Phase HF6B - Employee Permission Catalog Wiring

Status: implementation complete pending the single closure commit from starting HEAD `51d22d14c52905e1c7887231eb38763343d2d278`.

## Scope

HF6B wires the Employee detail permission management surface to the central permission catalog. It does not redesign Account Center, create Employee email/password login, alter Branch Account fixed-scope behavior, reintroduce Level/step-up, or change business permission semantics.

Implemented scope:

- Employee permission APIs now return the full assignable central permission catalog.
- Employee detail UI can assign direct Employee grants and direct Employee denials from the full catalog, not only from current rows.
- Role permissions, direct grants, direct denials, effective permissions, and source explanations are separate concepts.
- Effective access remains `(role permissions union direct grants) minus direct denials`.
- Direct denial wins over role permissions and direct grants.
- Authorization changes increment `authorizationVersion` through the existing service and stale/revoke current Employee operator sessions through the existing freshness model.
- Branch Account technical sessions remain intact after Employee authorization changes.
- Frontend menu/action visibility remains a UX layer; backend middleware and services remain authoritative.

Deferred:

- HF6C Account Center simplification.
- HF6D end-to-end Branch login/access QA expansion.
- Phase 35E Inventory and Purchase Market MVP.
- Role-builder redesign, grouped permissions, field-level permissions, payroll/attendance, and production deployment.

## Root Cause

The Phase 35D-PRE1 audit found that the Employee direct-permission UI built its assignable options only from the Employee's current grants, denials, and effective permission names. When an Employee had zero role permissions, zero direct grants, and zero direct denials, the UI could display zero available choices even though the local central catalog contained 128 permissions.

HF6B also diagnosed a browser-only Employee detail failure during QA. Direct API calls to `GET /employees/:id` and `GET /employees/:id/permissions` succeeded, while `/en/employees/<database employee id>` showed `Employee Not Found`. Browser network evidence showed `net::ERR_FAILED` because local QA used `http://127.0.0.1:3000` while the backend CORS runtime allow-list allowed `http://localhost:3000`. The direct Node probe succeeded because it did not send a browser Origin header. The correction for QA was runtime-only: start backend QA with `CORS_ALLOWED_ORIGINS` including both `http://localhost:3000` and `http://127.0.0.1:3000`. No product CORS source file or repository environment file was changed.

## Catalog Source

The canonical source is the existing `permissions` table, exposed by the Employee permission route through the same backend model used elsewhere in the system.

The Employee permission response includes:

- `assignableCatalog`: all active assignable system permissions in stable module/action/name order.
- `rolePermissions`: permissions inherited from assigned Employee roles.
- `directGrants`: direct Employee allow rows.
- `directDenials`: direct Employee deny rows.
- `effectivePermissions`: the final allow set after denial removal.
- `effectiveSources`: per-permission explanation for `ROLE`, `DIRECT_GRANT`, `ROLE_AND_DIRECT_GRANT`, `DENIED`, or `NOT_GRANTED`.
- `authorizationVersion`: the Employee authorization freshness version.
- Employee company and branch context already returned by the existing Employee detail APIs.

No second permission catalog was created.

## Grant and Denial Rules

Direct grants:

- Require existing Employee permission-management authorization.
- Validate Employee company/branch scope server-side.
- Require permission IDs that exist in the central catalog.
- Are idempotent when repeated.
- Do not silently override a direct denial.
- Increment `authorizationVersion`, audit through the existing service path, and stale/revoke active Employee operator sessions.

Direct denials:

- Use the same central catalog.
- May deny a permission inherited from a role or granted directly.
- Win over role and direct grant.
- Are idempotent when repeated.
- Restore access only when removed and another allow source remains.
- Increment `authorizationVersion`, audit through the existing service path, and stale/revoke active Employee operator sessions.

## UI

The Employee detail permission section now:

- Searches the full assignable catalog.
- Groups permissions by module/category.
- Shows role permissions as read-only source information.
- Allows direct grants and direct denials from the full catalog.
- Shows an effective permission summary with source/status badges.
- Displays the explicit localized warning that direct denial overrides role and direct grant.
- Avoids the previous false zero-options state.
- Wraps long labels and header metadata safely on narrow screens without changing the broader Employee page identity.

Arabic and English browser QA covered RTL/LTR, desktop and mobile/narrow viewport behavior, and no runtime overlay.

## Verification

New verifier:

- `scripts/verify-employee-permission-catalog-wiring.js`
- Marker: `EMPLOYEE PERMISSION CATALOG WIRING PASSED`

The focused verifier proves:

- Full assignable catalog is returned for Employees with no current permission rows.
- Catalog has no duplicate codes and stable grouping/order.
- Unauthorized, wrong-company, wrong-branch, and nonexistent permission attempts are denied.
- Role permissions, direct grants, direct denials, effective permissions, and source explanations are distinct.
- Direct grant gives access.
- Direct denial overrides role and direct grant.
- Removing denial restores a remaining allow.
- Removing final allow removes access.
- Authorization changes stale Employee operator sessions while preserving the Branch Account technical session.
- New Employee verification receives updated permissions.
- Fixtures clean back to zero.

Targeted regressions passed for HF5C, HF6A, Employee authorization foundation, Employee operator sessions, Employee management UI contract, Branch Account safe shell, Sales/POS operator enforcement, Sales adjustment operator enforcement, Phase 35B containment, and Phase 35D accounting/treasury.

Quality gates passed:

- `node --check` for changed backend JS files and the new verifier.
- `npm run typecheck`.
- `npm run lint` with the existing 18 warnings and no errors.
- `npm run build`.
- `git diff --check`.

Full clean-tree suite result is recorded in the final closure report.

## Counts and Backups

Counts after HF6B:

- Migrations: 44.
- Permissions: 128.
- Verifier files: 60.

Backups:

- Start: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6b_start_20260717_165258.dump` (`488940` bytes), `pg_restore -l` validated.
- Final: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6b_final_20260717_190858.dump` (`488940` bytes), `pg_restore -l` validated.

Local DB target remained Docker PostgreSQL `localhost:5433 / darfus_erp`. Production/Render remained untouched.

## Cleanup

HF6B namespace cleanup checks returned zero rows for companies, branches, users, Employees, Employee credentials, branch assignments, roles, role permissions, direct grants, direct denials, technical sessions, and operator sessions.

Temporary browser QA helper `scripts/tmp-hf6b-browser-qa.js` was removed after QA passed. No plaintext PIN, password, token, or hash artifact is documented.

## Next Safe Action

Create the single authorized HF6B commit:

`fix: wire employee permission catalog`

After commit, record the final commit hash in the final response, confirm clean tree, 11 stashes untouched, ports 3000/8000 quiet, `next-env.d.ts` clean, and do not start HF6C or Phase 35E automatically.
