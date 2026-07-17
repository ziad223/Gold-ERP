# Phase 34.5A-HF5B — Simple Fixed Branch Accounts

Status: verified closed locally.

HF5B simplifies fixed branch access to one visible Branch Account per active branch. The internal account type remains `branch_shell`, but user-facing Arabic/English terminology is `حساب الفرع` / `Branch Account`.

## Migration 43

Migration `backend/migrations/20260715010000-simple-fixed-branch-accounts.js` is additive and reversible. It pre-checks duplicate non-deleted Branch Accounts by branch, adds `users.is_active`, and creates unique index `users_branch_shell_one_per_branch_uq`.

The index permits at most one non-deleted `account_type = 'branch_shell'` row per non-null `branch_id`. Inactive but non-deleted Branch Accounts still block duplicates. Soft-deleted rows do not block replacement.

No permissions were added.

## Backup

Local backup before DB mutation:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf5b_2026-07-15T19-25-50-061Z.dump`

Size: `478237` bytes.

The backup and migration targeted only `localhost:5433 / darfus_erp`. Production/Render and host port 5432 were untouched.

## Branch Account Contract

Super Admin creates Branch Accounts through `/system-accounts/branch-accounts`. Owner-entered fields are limited to branch, branch login email, temporary password, and active status.

The server derives company, fixed branch, role, account type, session/password versions, and audit actor. Client company, role, account type, direct permissions, and default Employee overrides are rejected or ignored.

Branch Account fixed fields are immutable through normal account patch paths:

- company
- branch
- account type
- role
- direct permissions
- default Employee

## Login And Scope

Branch Account login rejects inactive accounts, locked accounts, missing branches, inactive/missing branches, and branch/company mismatches with stable HF5B errors.

Successful login returns fixed branch identity in `user.accountScope`. The frontend locks branch switching for Branch Accounts, and backend middleware rejects company/branch header widening with `BRANCH_ACCOUNT_FIXED_SCOPE`.

## Employee-First Operation

Branch Accounts receive no direct User operational permissions. Supported Sales/POS/Returns/Exchanges/Installment operations still require a valid Employee operator session, Employee branch access, Employee permission, direct-denial precedence, current Level policy, and fresh session/credential/authorization versions.

Missing Employee context for Branch Accounts maps to `BRANCH_ACCOUNT_EMPLOYEE_REQUIRED`.

## Change And End Employee Session

The operator header now exposes Current Employee, Change Employee, and End Employee Session in Arabic and English.

Change Employee uses the existing verification flow, which revokes/replaces the current operator session while preserving technical login. End Employee Session calls `/operator/end-session`, revokes the current operator session, clears Employee context, and preserves technical login.

Full technical logout and security changes revoke bound operator sessions.

## UI And Module Policy

`/settings/users` now exposes a Branch Accounts section and constrained Branch Account creation form. It hides technical Branch Account terminology, role selection, permission editing, default Employee selection, Level controls, and generic conversion prompts from the Branch Account workflow.

Branch Account navigation is allowlisted to Sales/POS only after active Employee verification. Broader modules remain hidden/denied until future explicitly approved phases convert them.

## Verification Evidence

Passing evidence collected during implementation:

- `node scripts/verify-simple-branch-account-access.js`
  - `Simple Branch Account static contract: PASS`
  - `SIMPLE BRANCH ACCOUNT ACCESS PASSED`
- `node scripts/verify-simple-super-admin-access.js`
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
- `npm run typecheck`
- `npm run lint`
  - passed with existing warnings only
- `npm run build`
- `git diff --check`
- Local browser QA against `localhost:3000` and `localhost:8000`
  - Super Admin login opened the API-backed dashboard.
  - `/settings/users` showed the simplified Branch Account form with only branch, login email, temporary password, active status, and reason fields.
  - UI creation of a temporary Branch Account on `BR-SHJ` succeeded and showed the fixed branch account in the Branch Accounts list.
  - A second UI create attempt for `BR-SHJ` was rejected with `A Branch Account already exists for this branch.` and no duplicate row was created.
  - Branch Account login was fixed to `فرع الشارقة`, showed `Employee verification required` / `يلزم التحقق من الموظف`, exposed no alternate branch options, and hid broader admin/system navigation.
  - Arabic RTL POS smoke rendered the fixed branch and localized payment/operator labels.

Clean-tree full verifier suite after closure passed `55/55`.

## Counts

- migrations: 43
- permissions: 123
- verifier files: 55

## Closure

Implementation commit:

- `3dbc7d4 feat: simplify fixed branch account access`

Verifier/documentation follow-up commits:

- `39c6c42 test: align employee authorization verifier with branch account errors`
- `f4c80ed test: align operator ui verifier with branch account session controls`
- `7c58c59 test: align operator session verifier with end session control`
- `c9b778a docs: remove plaintext owner password samples`

Final closure HEAD is recorded in the final phase report. The final clean-tree suite passed `55/55`, temporary verifier/browser fixtures were cleaned, and ports `3000` and `8000` were quiet.

## Deferred

HF5C Single-Level Employee Operator Policy, HF5D Simplified Employee Page, HF5E Grouped Permissions, HF5F Ready Employee Roles, HF5G Employee Code/PIN Management, HF5H UX/UI Consolidation, HF5I Market-Ready Release Validation, and Phase 34.5B2A/B/C remain deferred.
