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
