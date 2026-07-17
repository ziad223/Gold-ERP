# Phase 34.5A-HF5C — Single-Level Employee Operator & Simple PIN

Status: implemented locally; final closure depends on clean-tree full-suite rerun and commit.

## Starting State

- Starting HEAD: `bf2b4ed46d2fd093bd1f0ec519ef6099a53cea9b`
- Starting branch: `main`
- Local database: `localhost:5433 / darfus_erp`
- Production/Render: untouched
- Starting counts: 43 migrations, 123 permissions, 55 verifier files
- Backup before HF5C fixtures: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase34_5a_hf5c_20260717_062043.dump`
- Backup size: `476066` bytes

## Final Employee Authorization Model

Employee operator authorization now has one usable state: `verified`.

Unusable states are treated as not verified: missing, expired, revoked, stale credential, stale authorization, wrong branch, or denied permission.

Legacy Level columns remain for compatibility only. New valid operator sessions persist `verificationLevel = 1` and `level2VerifiedAt = null`, but no route or command policy makes decisions from Level.

## Removed Active Level And Step-Up

HF5C removes active runtime use of:

- Level 1
- Level 2
- elevated Employee sessions
- step-up dialogs/endpoints
- Level badges/timers
- `OPERATOR_STEP_UP_REQUIRED`
- Level-specific command requirements

`components/operator/operator-step-up-dialog.tsx` was removed. The operator context and API repositories no longer expose `authorizeAction`.

## PIN Policy

Employee PIN validation is exactly six numeric digits. PIN values are never returned, displayed, logged, or documented.

Wrong Code/PIN uses the generic controlled verification failure and does not enumerate Employee, credential, lock, or PIN state.

## Automatic Lockout Removal

Employee credential auto-lockout was removed. Repeated wrong PIN attempts:

- return the same generic failure
- record failed verification attempts
- may use a short bounded server delay
- do not set `lockedUntil`
- do not disable the credential
- do not block a later correct PIN

Manual credential disable/revoke remains. Technical email/password lockout remains unchanged.

## Inactivity And Activity Refresh

Employee operator inactivity is 30 minutes.

Passive polling and `/operator/current` do not refresh `lastActivityAt` or `idleExpiresAt`.

Meaningful Employee-protected actions refresh activity. This includes Sales/POS create/update/cancel/post/checkout, discount override, official print/reprint, returns, exchanges, installment collection, and equivalent protected business commands.

On inactivity timeout, only the Employee operator session expires. The Branch Account technical login remains active.

## Session Lifecycle

- Change Employee: revokes the current Employee operator session only, preserves Branch Account login, and prompts for Employee Code + PIN.
- End Employee Session: revokes the current Employee operator session only and returns to the safe shell.
- Full logout: revokes the technical session and bound Employee operator sessions, then clears local Employee state.
- Credential version, authorization version, Employee disable, credential disable, branch change, and permission/direct-denial changes continue to stale or revoke sessions.

## Account Separation

Super Admin remains email/password-only with no Employee Code, PIN, Level, or step-up. HF5A behavior is preserved.

Branch Account remains fixed to one company/branch and still requires verified Employee operator access for supported business operations.

Legacy/personal User behavior remains compatible and is not widened to Super Admin scope.

## UI

The operator bar is now compact and single-state. It shows current Employee name/code, branch context where available, Change Employee, and End Employee Session.

Visible Level, step-up, elevated-session, and PIN-lock countdown wording was removed from active operator UI and affected Employee/System Accounts surfaces.

Required Arabic and English labels are present:

- Current Employee / الموظف الحالي
- Change Employee / تغيير الموظف
- End Employee Session / إنهاء جلسة الموظف
- Select an employee to begin / اختر موظفًا للبدء
- Employee session expired. Select an employee to continue. / انتهت جلسة الموظف، اختر موظفًا للمتابعة
- Employee code or PIN is incorrect / كود الموظف أو الرقم السري غير صحيح

## Verification

New verifier:

`scripts/verify-single-level-employee-operator.js`

Required marker:

`SINGLE LEVEL EMPLOYEE OPERATOR PASSED`

The verifier covers static Level/step-up removal, six-digit PIN policy, no automatic PIN lockout, 30-minute inactivity, no polling refresh, meaningful activity refresh, permission denial without clearing Employee, stale credential handling, Change/End session behavior, Super Admin/Branch Account separation, cleanup, and expected counts.

Updated verifier expectations include:

- `scripts/verify-employee-authorization-foundation.js`
- `scripts/verify-employee-operator-session.js`
- `scripts/verify-sales-pos-operator-enforcement.js`
- `scripts/verify-sales-adjustment-operator-enforcement.js`
- `scripts/verify-employee-management-operator-ui-contract.js`
- `scripts/verify-super-admin-branch-shell-recovery.js`
- `scripts/verify-simple-super-admin-access.js`

## Counts

- Migrations: 43
- Permissions: 123
- Verifier files: 56

No migration 44 was added. No permissions were added.

## Deferred

- HF5D simplified Employee page
- HF5E grouped permissions
- HF5F role templates
- HF5G admin Code/PIN management UI
- HF5H broader UX
- HF5I release validation
- Phase 34.5B2A/B/C
- Payroll, inventory, purchases, treasury, accounting, and sales redesigns
