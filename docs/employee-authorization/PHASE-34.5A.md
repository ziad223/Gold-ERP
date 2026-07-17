# Phase 34.5A — Super Admin, Branch Shell Accounts, Employee-First Authorization & Recovery

Status: implementation in progress for the additive core.

## Account Types

Phase 34.5A adds `legacy`, `super_admin`, and `branch_shell` account types on `users.account_type`.
Existing users remain `legacy` by default. No existing user, including `USR-ADMIN`, is automatically converted or classified.

`super_admin` is a platform-wide technical account for system governance. Sensitive actions still require an active System Administrator Employee with fresh Level 2 verification.

`branch_shell` is fixed to one company branch and receives no direct operational permission fallback. Protected operations rely on the technical session plus the Employee operator session and Employee permissions.

`default_employee_id` is optional convenience metadata only. It never activates an Employee session and never bypasses PIN.

## Technical Sessions

Access tokens now carry user password/session versions and a `technicalSessionId`. Refresh tokens are persisted in `technical_account_sessions` as SHA-256 hashes only. Refresh rotates the token hash. Logout and security changes revoke server-side sessions.

Password, email, account-type, and security-status changes bump versions and revoke affected sessions.

## Recovery

Core recovery includes:

- `recovery_email`, `recovery_phone`, and verification timestamp fields.
- `password_reset_tokens` with hashed one-time tokens and short expiry.
- `email_change_tokens` foundation with hashed tokens.
- Generic forgot-password response with no account enumeration.
- Local/development recovery delivery sink only.
- Admin-mediated temporary password reset with `force_password_change`.

Production SMTP, email OTP, TOTP, backup codes, SMS, and full break-glass delivery are deferred and are not claimed ready.

## Employee Credentials

Phase 34.5A adds durable `employee_code_history` and Employee Code change endpoints with reason and session revocation.

PIN support includes self-change, admin reset, unlock, reset-required state, credential-version bump, and operator-session revocation. PIN/password values are never returned except one-time temporary credentials where the policy explicitly allows.

## Permissions

Exactly six permissions are added:

- `system_accounts.view`
- `system_accounts.manage`
- `system_accounts.credentials.reset`
- `system_accounts.sessions.revoke`
- `security.recovery.manage`
- `super_admin.manage`

Permission codes remain stable English identifiers. UI display uses localized metadata from the permission catalog.

## UI

System Accounts settings now separates:

- Super Admin Accounts
- Branch Shell Accounts
- Legacy Accounts
- Security & Recovery

The login flow includes forgot password, reset password, and mandatory change-password screens. The Employee permission UI uses localized labels for direct and effective permissions.

## Verification

New verifier:

`scripts/verify-super-admin-branch-shell-recovery.js`

Required markers:

- `LIVE HTTP ACCOUNT TESTS EXECUTED`
- `TECHNICAL SESSION REVOCATION PASSED`
- `FINAL ADMIN SAFEGUARDS PASSED`
- `SUPER ADMIN BRANCH SHELL RECOVERY PASSED`
- `No persistent account test pollution detected`

## Deferred

- production SMTP
- email OTP
- TOTP
- backup codes
- SMS
- full break-glass implementation
- service accounts
- Phase 34.5B
- Returns/Exchanges Employee-first expansion
- Gold Purchase integration expansion
- broad Treasury/Accounting/Inventory conversion
- historical User deletion
- automatic account classification
- offline recovery bypass
- Phase 33D
- Phase 33C-HF2

## Phase 34.5A-HF1 — Recovery, Credential UI and Permission Localization Correction

Status: closure correction implemented and verified locally before the final HF1 commit.

HF1 corrected the gaps found in the v2 read-only audit without adding a migration, permission, or verifier file. Counts remain:

- migrations: 42
- permissions: 120
- POS permissions: 3
- Gold Purchase permissions: 24
- verifier files: 52

### Permission localization

`lib/permissions/catalog.ts` is the centralized display boundary for permission UI metadata. Permission codes remain stable English identifiers for authorization, while user-facing labels, module names, descriptions, sensitivity, status, and source labels resolve through localized Arabic/English catalog metadata.

Arabic UI now avoids the previously confirmed mixed English system labels such as `PIN`, `Branch Access`, `System Accounts`, `L2`, and `PIN · 6 digits`. English UI remains English-only for system labels. Missing permission translations are surfaced as missing metadata rather than silently falling back to raw action fragments or the opposite language.

### Recovery and session correction

HF1 completed the missing auth route wiring:

- `POST /auth/validate-reset-token`
- `POST /auth/change-email`
- `POST /auth/confirm-email-change`

Email changes use the existing `email_change_tokens` model with hashed one-time tokens. Confirmation updates the login email and invalidates prior sessions. Reset-token validation returns only generic token state and no account details.

Password policy is centralized in `backend/src/utils/password-policy.js` with minimum length, uppercase, lowercase, digit, symbol, common-password rejection, and obvious identity-fragment rejection. Temporary generated passwords are policy-compliant and still shown once only.

The development recovery sink no longer persists reusable plaintext reset tokens to JSONL. It uses an in-memory, TTL-limited local development mailbox and remains explicitly not production SMTP.

### System Accounts and Branch Shell UI

The System Accounts UI now calls `/system-accounts` for Super Admin and Branch Shell creation/actions instead of creating those accounts through `/users`. The UI includes account type, fixed Branch Shell branch assignment, recovery email, default Employee selection for Super Admin convenience, readiness status, change email, reset password, unlock, revoke sessions, conversion, final-admin/final-recovery safeguard errors, and one-time temporary password display/clear behavior.

Frontend permission helpers now treat `accountType` as authoritative. `branch_shell` accounts do not receive admin/owner all-permission UI shortcuts and remain limited to shell/bootstrap/operator verification/self-service until an Employee session supplies operational authority.

### Employee credentials and effective permissions

`POST /operator/change-pin` now requires an active Employee session with fresh Level 2. The self-change flow validates current PIN, new PIN/confirmation, six-digit policy, weak PIN rejection, credential-version update, operator-session revocation, and audit.

Generic Employee update now rejects `employeeCode` changes after creation and directs callers to `POST /employees/:id/change-code`, preserving the dedicated reason/history/session-revocation flow.

Employee credential UI now exposes Change Employee Code with reason/history, self-change PIN, Admin reset PIN, unlock credential, revoke operator sessions, credential state, lock state, failed attempts, reset-required state, active sessions, and one-time credential handling.

Effective permissions now show localized per-permission source and denial precedence:

- inherited from role
- direct grant
- direct denial
- direct denial takes precedence

The UI also includes localized search/filter/count/reason support for permission changes.

### Verification evidence

Before DB-backed verification, a local custom-format PostgreSQL backup was created:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf1_resume_20260715-130413.dump`

Size: 470,938 bytes.

Verification used local `darfus_erp@localhost:5433` only. Port 5432 was not used as the application database endpoint.

Passing targeted evidence:

- `scripts/verify-super-admin-branch-shell-recovery.js`
  - `LIVE HTTP ACCOUNT TESTS EXECUTED`
  - `TECHNICAL SESSION REVOCATION PASSED`
  - `FINAL ADMIN SAFEGUARDS PASSED`
  - `SUPER ADMIN BRANCH SHELL RECOVERY PASSED`
  - `No persistent account test pollution detected`
- `scripts/verify-sales-pos-operator-enforcement.js`
  - `SALES/POS OPERATOR ENFORCEMENT PASSED`
  - `No persistent business test pollution detected`
- Employee authorization, operator session, and employee-management/operator UI regression verifiers passed.
- Static gates passed: typecheck, lint with existing unrelated warnings only, build, syntax, and `git diff --check`.

Browser QA was executed locally through Playwright against `localhost:3000` and `localhost:8000`, covering Arabic RTL and English LTR Employee/System Accounts surfaces, localized permission/account labels, reset-password generic token state, mobile Arabic System Accounts rendering, and absence of obvious secret/raw-token display in the tested UI surfaces.

Production SMTP, email OTP, TOTP, backup codes, SMS, full break-glass, service accounts, broader Employee-first workflow conversion, Phase 34.5B, Phase 33D, and Phase 33C-HF2 remain deferred.

## Phase 34.5A-HF2 — Branch Shell Sales/POS Route-Gate Consistency

HF2 closes the baseline inconsistency discovered before Phase 34.5B: Branch
Shell correctly had no direct operational User permissions, but Sales/POS routes
were still guarded by generic technical `requirePermission(...)` before the
Employee-first operator policy. That ordering blocked Branch Shell before a valid
Employee could authorize the Sales/POS command.

Implemented correction:

- added centralized account-type-aware Sales/POS command gate
  `salesOperatorPolicy.requireSalesCommandAccess(...)`;
- kept legacy technical permission behavior inside the centralized gate;
- allowed Branch Shell and Super Admin technical scopes to reach Employee operator
  policy without granting direct operational User permissions;
- enforced active Employee, Employee permission, direct-denial precedence,
  required Level, fixed Branch Shell branch, session/version checks, and
  failure-atomic denial before mutation;
- aligned in-scope Sales/POS routes and official print authorization to the
  centralized gate;
- narrowed frontend compatibility in `AuthGuard` so Branch Shell/Super Admin can
  open Sales/POS operator routes without `usePermissions` granting global
  operational permissions.

No schema or permission change was made:

- migrations: 42
- permissions: 120
- POS permissions: 3
- Gold Purchase permissions: 24
- verifier files: 52

Evidence recorded during HF2:

- local DB remained `darfus_erp@localhost:5433`; port 5432 was not used;
- backup:
  `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf2_20260715-144007.dump`
  (467,853 bytes);
- `scripts/verify-sales-pos-operator-enforcement.js` passed with
  `BRANCH SHELL EMPLOYEE-FIRST SALES/POS GATE PASSED`;
- `scripts/verify-super-admin-branch-shell-recovery.js` passed;
- Browser QA namespace `T345AHF2-BQA-1784116840926-hdmn0g` passed and cleaned to
  zero fixture users.

Phase 34.5B remains deferred and must not start unless HF2 final clean-tree
verification is complete.

## Phase 34.5A-HF5A — Super Admin & Simple Login Stabilization

HF5A changes the Super Admin policy from the earlier Employee-step-up model to
the simplified market-ready owner model:

- `USR-ADMIN` / `admin@admin.com` is bootstrapped locally as the first
  `super_admin`;
- Super Admin logs in with email/password only;
- no Employee Code, PIN, Level 1, Level 2, or operator step-up is required for
  Super Admin login, System Accounts governance, or current Sales/POS/Return/
  Exchange/Installment command gates;
- no synthetic Employee or EmployeeCredential is created for Super Admin;
- technical attribution remains `technicalUserId = USR-ADMIN`,
  `accountType = super_admin`, with nullable `employeeId` and
  `operatorSessionId`;
- Branch Shell remains fixed-branch and Employee-first;
- Legacy behavior remains compatible and does not receive Super Admin technical
  scope.

Local backup before DB mutation:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf5a_20260715_195517.dump`

Size: `471727` bytes.

Counts:

- migrations: 42
- permissions: 123
- verifier files: 54

New files:

- `scripts/bootstrap-first-super-admin.js`
- `scripts/verify-simple-super-admin-access.js`
- `docs/employee-authorization/PHASE-34.5A-HF5A.md`

Verification evidence:

- bootstrap changed `USR-ADMIN` to `super_admin`, preserved ID/email/password
  hash/role, incremented `sessionVersion` to 2, and revoked 9 active owner
  technical sessions;
- second bootstrap execution safely reported already bootstrapped with no
  mutation;
- offline bcrypt comparison against the current local owner password succeeded;
- live owner login/refresh/logout and scope checks passed in
  `scripts/verify-simple-super-admin-access.js`;
- updated account/session, Sales/POS, and Sales adjustment verifiers passed with
  Super Admin direct access and Branch Shell employee-first behavior preserved.

HF5C, HF5D, Phase 34.5B2A/B/C, Phase 34.6, Phase 34.7, Phase 33D, and
Phase 33C-HF2 remain deferred.

## Phase 34.5A-HF5B — Simple Fixed Branch Accounts

HF5B adds the market-ready Branch Account layer on top of the existing internal
`branch_shell` foundation. Visible UI terminology is now `Branch Account` /
`حساب الفرع`; the internal account type remains unchanged.

Implemented:

- one non-deleted Branch Account per branch via migration 43;
- `users.is_active` for real activate/deactivate behavior;
- dedicated `/system-accounts/branch-accounts` creation path with only branch,
  login email, temporary password and active status accepted from the owner;
- server-derived company, fixed branch, role, account type, session/password
  versions and audit actor;
- duplicate Branch Account prevention, including inactive non-deleted accounts;
- stable Branch Account login/scope errors;
- backend fixed company/branch enforcement for Branch Accounts;
- Branch Account technical logout and security changes revoke bound Employee
  operator sessions;
- explicit `/operator/end-session` for End Employee Session while preserving
  technical login;
- Branch Account UI labels and constrained creation form in `/settings/users`;
- Branch Account navigation allowlist after active Employee verification.

Counts after HF5B:

- migrations: 43
- permissions: 123
- verifier files: 55

Local backup before migration:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf5b_2026-07-15T19-25-50-061Z.dump`

Size: `478237` bytes.

Full evidence and closure details are in `docs/employee-authorization/PHASE-34.5A-HF5B.md`.
