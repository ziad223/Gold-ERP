# Phase 34.5A-HF5A — Super Admin & Simple Login Stabilization

Status: implemented locally on top of `d5b87d2 feat: enforce employee operator on returns exchanges installments`.

## Owner Model

`USR-ADMIN` / `admin@admin.com` is the first local Super Admin. The account logs in with email and password only. Super Admin login does not require Employee Code, PIN, Level 1, Level 2, or operator step-up.

No synthetic Employee, EmployeeCredential, PIN, or default Employee was created for the owner account.

## Bootstrap

Local-only CLI:

```powershell
node scripts/bootstrap-first-super-admin.js --email admin@admin.com --confirm BOOTSTRAP_FIRST_SUPER_ADMIN
```

The CLI refuses production/remote configuration, targets only `localhost:5433 / darfus_erp`, row-locks `USR-ADMIN`, preserves ID/email/password hash/role, requires zero active Super Admins, sets `accountType = "super_admin"`, increments `sessionVersion`, revokes active technical sessions, and writes immutable audit action `system_account.first_super_admin_bootstrapped` with `employeeId = null` and `operatorSessionId = null`.

Second execution reports already bootstrapped and does not mutate.

Backup before DB mutation:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf5a_20260715_195517.dump`

Size: `471727` bytes.

## Access Policy

Super Admin has complete technical system scope through account type, not through Employee authorization. System Accounts create/edit/change-email/reset-password/unlock/revoke/convert routes require authenticated `accountType = super_admin`, preserve final active Super Admin safeguards, enforce password policy and email uniqueness, revoke sessions on security changes, and audit actions.

Super Admin also has direct access to current operator-protected Sales/POS/Return/Exchange/Installment command gates. Branch selection is still required for branch-scoped business operations. Employee actor fields may remain null for Super Admin business records and audit rows.

Branch Shell remains Employee-first and fixed-branch. Legacy behavior remains compatible and does not gain Super Admin technical scope.

## Scope Hardening

`X-Company-ID` can no longer widen Legacy or Branch Shell scope. Branch Shell is fixed to its assigned company/branch. Super Admin may select an existing company and an active branch under that selected company; invalid company/branch headers are rejected with stable scope errors.

Company management CRUD no longer breaks on the `Company` model by applying a nonexistent `companyId` column.

## Email and Password Management

Email normalization is trim/lowercase. Case-insensitive uniqueness is enforced in service/controller logic without a migration. Super Admin own password/email changes require the current password but no Employee Level 2. Admin-mediated account password reset still stores only hashes, returns a temporary password once, sets force-change, increments versions, revokes sessions, and audits.

## UI and Error Handling

`/settings/users` now reflects direct Super Admin technical authorization and catches expected API errors in mutation handlers so duplicate email, password-policy, safeguard, and scope errors surface as controlled toasts instead of unhandled runtime errors. The frontend permission hook treats `accountType = super_admin` as full technical UI scope and keeps Branch Shell restricted.

## Counts

- migrations: 42
- permissions: 123
- verifier files: 54

No schema migration or permission row was added by HF5A.

## Verification Evidence

- `node scripts/bootstrap-first-super-admin.js --email admin@admin.com --confirm BOOTSTRAP_FIRST_SUPER_ADMIN`
  - changed true
  - `sessionVersion = 2`
  - `activeSessionsBefore = 9`
  - `revokedSessions = 9`
  - password hash preserved
- second bootstrap execution:
  - changed false
  - already bootstrapped
- DB assertions:
  - `USR-ADMIN|admin@admin.com|super_admin`
  - failed login count `0`
  - `lockedUntil = null`
  - active owner sessions `0`
  - active Super Admin count `1`
  - permissions `123`
- offline bcrypt comparison against the current local owner password succeeded; no password hash or plaintext password was documented.
- `VERIFY_SIMPLE_SUPER_ADMIN_LIVE=true node scripts/verify-simple-super-admin-access.js`
  - `Simple Super Admin static contract: PASS`
  - `Simple Super Admin live contract: PASS`
  - `SIMPLE SUPER ADMIN ACCESS PASSED`
- `node scripts/verify-super-admin-branch-shell-recovery.js`
  - `TECHNICAL SESSION REVOCATION PASSED`
  - `FINAL ADMIN SAFEGUARDS PASSED`
  - `LIVE HTTP ACCOUNT TESTS EXECUTED`
  - `SUPER ADMIN BRANCH SHELL RECOVERY PASSED`
- `node scripts/verify-sales-pos-operator-enforcement.js`
  - `BRANCH SHELL EMPLOYEE-FIRST SALES/POS GATE PASSED`
  - `SALES/POS OPERATOR ENFORCEMENT PASSED`
- `node scripts/verify-sales-adjustment-operator-enforcement.js`
  - `SALES ADJUSTMENT OPERATOR ENFORCEMENT PASSED`

## Browser QA Evidence

Local browser QA used the already-running local backend/frontend on
`localhost:8000` and `localhost:3000`.

- Arabic owner login with `admin@admin.com` opened `/ar/dashboard`.
- Dashboard showed the major implemented modules, including POS, Sales,
  Customers, Inventory, Gold Center, Suppliers/Purchases, Accounting, Treasury,
  Reports, Employees, System Accounts, Audit, Approvals, and Settings.
- No blocking Employee Code, PIN, Level 1, Level 2, or operator modal appeared
  after Super Admin login.
- `/ar/settings/users` loaded in RTL and showed `USR-ADMIN` as Super Admin with
  the direct-auth message.
- Created a QA Super Admin from System Accounts UI.
- Created a QA Branch Shell from System Accounts UI.
- A rejected Branch Shell temporary password showed a controlled password-policy
  toast and preserved form state; no runtime overlay text appeared.
- One-time temporary passwords were cleared from the screen after inspection.
- `/en/settings/users` loaded in LTR and showed the direct-auth message.
- Mobile Arabic `/settings/users` loaded at 390x844 with the owner visible and no
  runtime overlay text.
- Branch-scoped pages `/ar/pos`, `/ar/sales/returns`,
  `/ar/sales/exchanges`, and `/ar/sales/installments` opened without
  access-denied or runtime-overlay text.
- Browser QA fixture accounts were deleted and owner sessions were scheduled for
  final revocation before closure.

## Deferred

HF5B Branch Account Simplification, HF5C Single-Level Employee Operator Policy, HF5D Simplified Employee Page, Phase 34.5B2A/B/C, Phase 34.6, Phase 34.7, Phase 33D, and Phase 33C-HF2 remain deferred.
