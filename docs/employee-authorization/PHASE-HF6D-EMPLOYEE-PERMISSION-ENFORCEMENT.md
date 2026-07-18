# Phase HF6D - Employee Permission Enforcement

## Scope

HF6D applies the Employee effective-permission result to Branch Account
navigation, page access, and business APIs. It does not alter the approved
technical login model, Employee Code/PIN model, role-builder, or Account
Center separation.

## Root Cause And Correction

- `/operator/verify` resolved permissions but the frontend did not retain the
  authorization payload. `/operator/current` returned only session state.
- Branch Account navigation had a fixed POS/Sales allowlist and Dashboard
  redirected to POS. It did not use the verified Employee permission set.
- Most non-Sales/POS business APIs used technical `requirePermission`; a
  Branch Account intentionally has no direct technical business permissions.

The correction returns a safe authorization summary on both operator endpoints,
stores it in `OperatorProvider`, and makes `usePermissions` read effective
Employee permissions for a `branch_shell`. `module-access.ts` supplies the
canonical navigation/page mapping. `business-permission.middleware.js` applies
the same live operator-session, branch, direct-denial, credential-version, and
authorization-version checks to business APIs. Technical administration remains
on the existing technical permission middleware.

## Authorization Rules

For a Branch Account, effective business access is:

`(role permissions union direct grants) minus direct denials`

plus a verified, current Employee operator session in the fixed Branch Account
scope. Direct denials win. Updating Employee authorization increments the
authorization version and makes the prior operator session stale; it does not
end the Branch Account technical session. Reverification returns the updated
authorization summary.

Sales/POS command policies keep their existing exact command permissions.
The generic business guard now covers customer, supplier, inventory, sales,
reservations, accounting, treasury, and report business surfaces without
weakening technical account administration. Inventory transfer uses the
existing cataloged `inventory.adjust` key rather than the previously unmapped
`inventory.transfer` route key.

## Permission UI

The Employee direct-permission section remains the only direct-grant/denial
editor. It now has role/grant/denial/effective counts, label/code search,
module and source filters, collapsible module groups, a sticky save action, and
the direct-denial precedence warning in Arabic and English. It does not expose
technical-account permission management.

## Data And Migration Decision

- No migration added: 44 migrations remain.
- No permission definition added: 128 permissions remain.
- The focused verifier raises the verifier-file count to 62.
- Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6d_start_20260718_005736.dump` (488940 bytes), created from local Docker PostgreSQL `darfus-postgres` and validated with `pg_restore -l`.
- Production and Render were not contacted.

## Verification Evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed with 18 pre-existing warnings and no errors.
- `npm run build`: passed.
- `node scripts/verify-employee-permission-enforcement.js`: passed with
  `EMPLOYEE PERMISSION ENFORCEMENT PASSED`.
- Focused live coverage proves a Branch Account Employee can access Customers
  only after `customers.view`, is denied Inventory without `inventory.view`,
  gets a stale operator session after authorization change, can reverify for
  Inventory, and is denied again when a direct denial overlaps the grant.
- HF6B catalog wiring, HF5C single-level operator, and Sales/POS operator
  regressions passed after the change.

## Browser QA Status

The HF6D-PRE-CLOSE1 audit proved that `AuthGuard` rendered the Branch Account
safe shell before `AppShell` and its header/OperatorBar mounted. That made the
old message-only safe shell a first-login dead end. The correction renders the
shell inside `AppShell` and uses one shared `EmployeeVerificationForm` in two
modes: inline for an inactive Branch Account and dialog mode for Change
Employee. End, expired, revoked, and stale operator sessions return to the
inline form while preserving the technical Branch Account session.

The audit also proved that the React Query global 401 handler incorrectly
cleared the technical session for expected operator-recovery errors after End
Employee Session. `isOperatorRecoveryError` now prevents that logout path;
real technical authentication failures retain the API client's existing refresh
and invalidation behavior.

Host-local Playwright QA using isolated `HF6D-BQA-*` data passed: English and
Arabic safe shells, desktop and mobile layouts without horizontal overflow,
controlled invalid PIN feedback, first verification to the first permitted
route, Change Employee with replacement permissions, End Employee Session,
revoked-session recovery, preserved Branch Account token, Super Admin without
an Employee prompt, and no console or runtime-overlay errors. The temporary
QA script, fixtures, technical sessions, and operator sessions were removed.
Services were stopped and ports 3000/8000 are quiet.

Final backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6d_final_20260718_210622.dump` (493583 bytes), created from local Docker PostgreSQL and validated with `pg_restore -l`.

## Deferred

- HF6E end-to-end Branch login/access QA across fuller day-to-day roles.
- Phase 35E inventory and purchase market MVP.
- Account Center redesign, role-builder redesign, grouped permissions, and
  Employee email/password login.
