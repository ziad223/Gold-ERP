# Phase HF6C — Simple Super Admin and Branch Account Center

## Status

HF6C implements the Day-1 technical Account Center simplification without changing Employee authorization.

- Starting HEAD: `058193b0604113310a7a59c1b3c4b9fd8af457ca`
- Branch: `main`
- Starting state: clean tree, 11 stashes untouched
- Local DB: Docker PostgreSQL `localhost:5433 / darfus_erp`
- Production/Render: untouched

## Page Inventory Decision

- Keep and simplify `/settings/users` as the technical Account Center.
- Keep backend System Account routes and safeguards.
- Move Employee Code, PIN, role templates, direct grants, direct denials, effective permissions, and operator sessions to Employee detail only.
- Hide the embedded technical role/permission editor from Day-1 Account Center UI.
- Defer broad role-builder redesign, MFA, SSO, grouped permissions, and Employee email/password login.

## Final Super Admin Surface

The Account Center now shows one focused Super Admin security area:

- current email display
- secure self email change with current password confirmation
- secure self password change through the existing auth change-password route
- account status/readiness badges
- active technical session counts
- no Employee Code, PIN, Level, or Employee permission editor

Self email and password changes revoke or stale affected technical sessions through the existing technical-session model.

## Final Branch Account Surface

The Branch Account flow is now:

1. list Branch Accounts
2. create with login email, explicit password, active flag, and exactly one fixed branch
3. edit email
4. set/reset password
5. change fixed branch with server-side validation
6. activate/deactivate
7. unlock/revoke sessions where supported

Branch Accounts still have no business permissions and no Employee PIN controls. Protected business work still requires Branch Account email/password login followed by Employee Code and six-digit PIN verification.

## Backend Security

- Super Admin-only technical account administration remains enforced.
- Branch Accounts cannot manage accounts.
- Branch Account branch reassignment validates active same-company branches and one Branch Account per branch.
- Branch reassignment bumps session version and invalidates affected technical/operator access.
- Email normalization and uniqueness remain server-side.
- Password create/reset/change requires an explicit replacement password and never returns a plaintext password.
- Final active Super Admin safeguards remain.
- Employee business permissions are not returned from System Account responses.

## API Contract Changes

System Account create/reset responses now return a safe acknowledgement:

```json
{
  "account": { "...": "safe account fields only" },
  "passwordSet": true
}
```

The backend continues to accept `temporaryPassword` as a compatibility request alias, but no generated or plaintext temporary password is returned.

## Employee Authorization Separation

Employee business access remains under Employees -> Employee detail:

- Employee Code
- six-digit PIN
- role templates
- direct grants
- direct denials
- effective permissions
- operator sessions
- credential controls

The effective permission formula from HF6B is unchanged:

```text
(role permissions union direct grants) minus direct denials
```

Direct denial still wins.

## Verification

Focused verifier:

- `npm run verify:simple-account-center`
- Marker: `SIMPLE ACCOUNT CENTER PASSED`

Targeted regressions passed:

- `npm run verify:single-level-employee-operator`
- `npm run verify:employee-credential-setup-readiness`
- `npm run verify:employee-permission-catalog-wiring`
- `npm run verify:super-admin-branch-shell-recovery`
- `npm run verify:simple-branch-account-access`
- `npm run verify:simple-super-admin-access`
- `node scripts/verify-employee-management-operator-ui-contract.js`
- `node scripts/verify-sales-pos-operator-enforcement.js`
- `npm run verify:market-launch-safety-containment`
- `npm run verify:accounting-treasury-launch-minimum`

Quality gates passed:

- `node --check` on changed backend/verifier JavaScript files
- `npm run typecheck`
- `npm run lint` with existing 18 warnings and no errors
- `npm run build`

## Browser QA

Local Playwright QA passed using an isolated `HF6C-BQA-*` namespace:

- Super Admin login
- English Account Center desktop render
- Super Admin security/profile surface visible
- Branch Account UI create
- Branch Account email edit, password reset, branch reassignment via API proof
- old Branch Account credentials rejected
- new Branch Account credentials accepted
- old Branch Account session invalidated
- Employee detail still loads the full 128-permission catalog
- no Employee permission editor in Account Center
- Arabic Account Center RTL render
- mobile Account Center smoke with no meaningful horizontal overflow
- no runtime overlay or browser console/page errors
- fixture cleanup returned zero rows

## Counts

- Migrations: 44
- Permissions: 128
- Verifier files: 61
- Migration added: none
- Permission added: none

## Backups

- Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6c_start_20260717_234628.dump` (`488940` bytes)
- Final backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6c_final_20260718_001142.dump` (`488940` bytes)
- Final backup validation: `pg_restore -l` succeeded inside the local `darfus-postgres` container.

## Deferred

- HF6D end-to-end Branch login/access QA
- Phase 35E Inventory and Purchase Market MVP
- Account Center advanced role-builder decisions
- MFA/SSO/IdP/recovery redesign
- Employee email/password login
- grouped permissions
- payroll/attendance redesign
- production deployment

NEXT TOOL START HERE: confirm the HF6C final commit, clean tree, 11 stashes, 61 verifier files, and no ports on 3000/8000 before starting HF6D or Phase 35E.
