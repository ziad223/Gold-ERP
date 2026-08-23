# Phase HF6A - Employee Creation and Credential Setup Readiness

Status: implementation complete pending clean-tree post-commit full-suite rerun from HF6A starting HEAD `343036f73cc794fca0a09488dc1c9fa6319930f9`.

## Scope

HF6A keeps the locked Branch Account -> Employee Code + six-digit PIN model.

Implemented scope:

- Employee Code remains required, normalized, and company-scoped unique.
- Active/non-inactive Employee creation requires a six-digit numeric Employee PIN and confirmation.
- Inactive Employees may exist without a PIN, but they cannot be reactivated until a configured PIN exists.
- Create-time PIN setup is atomic with Employee creation.
- Existing Employee Set PIN / Reset PIN uses the existing credential reset flow.
- Self-change PIN remains current Employee session + current PIN + new six-digit PIN + confirmation.
- Credential reset/change increments credential version and revokes/stales operator sessions.
- PIN values are never returned, displayed after submit, logged, or stored in plaintext.

Deferred:

- HF6B Employee Permission Catalog Wiring.
- HF6C Account Center simplification.
- HF6D end-to-end access QA expansion.
- Employee email/password login.
- Level 1, Level 2, step-up, repeated PIN, payroll, attendance, and broader account redesign.

## Employee Code Rules

- `employeeCode` is required by the create UI and backend API.
- Codes are trimmed, normalized with NFKC, uppercased for `employeeCodeNormalized`, and unique per company.
- Duplicate normalized codes in the same company are rejected.
- The same normalized code in a different company remains allowed by the current approved company-scoped model.
- Employee Code is not secret and is used with PIN for operator verification.
- Generic Employee update cannot change Employee Code; the dedicated change-code endpoint records history and revokes relevant sessions.

## PIN Rules

- PIN must be exactly six numeric digits.
- PIN and confirmation must match.
- Active/non-inactive creation without a valid PIN is rejected.
- Inactive creation without a PIN is allowed only as non-operable.
- Reactivation to `present` requires an active, non-reset-required credential.
- PIN setup/reset stores only a bcrypt hash.
- API responses, audit logs, local repository storage, and UI state after submit do not expose PIN values.

## API Contracts

`POST /employees`

- Requires `name`, `role`, `branch`, `employeeCode`.
- For non-inactive employees, also requires `pin` and `pinConfirm`.
- Creates Employee and EmployeeCredential in one database transaction.
- Rolls back Employee creation if credential setup fails.
- Returns the Employee only, without credential hash or PIN.

`POST /employees/:id/credential/reset`

- Reused for Set PIN and Reset PIN.
- Requires `employees.credentials.manage` plus existing Super Admin sensitive technical scope.
- Validates six-digit PIN.
- Creates missing credential or updates existing credential.
- Increments `credentialVersion`, configures a usable credential for UI Set PIN / Reset PIN, revokes active operator sessions, and audits without secrets.

`POST /operator/change-pin`

- Requires a current verified Employee session.
- Requires current PIN, new six-digit PIN, and matching confirmation.
- Does not require Level 2 or step-up.
- Increments credential version and revokes operator sessions.

## UI

Employee create modal now shows:

- Employee Code.
- Employee PIN.
- Confirm Employee PIN.
- Clear Arabic/English validation and non-secret storage guidance.

Employee list/detail now show clear PIN status labels:

- PIN not configured.
- PIN configured.
- PIN reset required.
- Credential inactive/locked where the existing model exposes those states.

Employee detail uses Set PIN for missing credentials and Reset PIN for configured/reset-required credentials.

The Employee detail UI calls `resetCredential(pin, false)` for Set PIN / Reset PIN so the resulting credential is usable by the Branch Account -> Employee Code + PIN verification flow.

## Counts

- Migrations: 44.
- Permissions: 128.
- Verifier files: 59.
- No migration was added.
- No permission was added.

## Verification

New verifier:

`scripts/verify-employee-credential-setup-readiness.js`

Required marker:

`EMPLOYEE CREDENTIAL SETUP READINESS PASSED`

Targeted regression verifiers run during implementation:

- `scripts/verify-single-level-employee-operator.js`
- `scripts/verify-employee-authorization-foundation.js`
- `scripts/verify-employee-operator-session.js`
- `scripts/verify-super-admin-branch-shell-recovery.js`
- `scripts/verify-simple-super-admin-access.js`
- `scripts/verify-simple-branch-account-access.js`
- `scripts/verify-employee-management-operator-ui-contract.js`
- `scripts/verify-sales-pos-operator-enforcement.js`
- `scripts/verify-sales-adjustment-operator-enforcement.js`
- `scripts/verify-market-launch-safety-containment.js`
- `scripts/verify-accounting-treasury-launch-minimum.js`

Static and build checks:

- Backend syntax checks passed for `employee-authorization.service.js` and `erp.routes.js`.
- Verifier syntax check passed for `verify-employee-credential-setup-readiness.js`.
- `npm run typecheck` passed.
- `npm run lint` passed with the existing 18 warnings and no errors.
- `npm run build` passed.
- `git diff --check` passed.
- `next-env.d.ts` did not drift during builds.

Browser QA:

- Super Admin fixture login opened the dashboard.
- English desktop Employee create modal showed Employee Code, Employee PIN, and confirmation.
- UI create validated six-digit/matching PIN, stored only a hash, and did not display PIN afterward.
- Existing missing-credential Employee Set PIN flow worked and became configured.
- Reset-required Employee Reset PIN flow worked and became configured.
- Unauthorized reset returned controlled `403`.
- Arabic RTL create modal showed Code/PIN/confirmation.
- Mobile Employee create workflow rendered without horizontal overflow.
- Branch Account verified one Employee with Code + PIN, rejected wrong PIN generically, ended the Employee session while preserving technical login, and full logout returned to login.
- No runtime overlay, page error, or unexpected console error was observed.
- Temporary `HF6A-BQA-*` fixtures were cleaned to zero.

Full suite:

- A dirty-tree precommit full-suite run stopped on `verify-barcode-tag-print-layouts.js`, which intentionally rejects unrelated dirty implementation files.
- Rerun the complete 59-verifier suite after the implementation commit when the tree is clean.

## Backups

Start backup before write-capable verification:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6a_start_20260717_155607.dump`

Size: `488940` bytes.

The host does not have `pg_dump` on PATH, so the backup was created with PostgreSQL tools inside the local `darfus-postgres` Docker container, copied to `backend/backups`, and validated with `pg_restore -l` in the same container.

Final backup after browser QA and fixture cleanup:

`H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_hf6a_final_20260717_162948.dump`

Size: `488940` bytes.

The final backup was created with the same Docker-container `pg_dump` method and validated with `pg_restore -l`.

## Next Tool Start Here

Before continuing, read this file and `docs/AI_HANDOFF.md`, then verify:

- branch `main`;
- clean or expected HF6A implementation tree;
- local Docker DB only at `localhost:5433 / darfus_erp`;
- stashes remain untouched.

NEXT TOOL START HERE: after the HF6A implementation commit, rerun the clean-tree 59-verifier suite, confirm clean tree/stashes/ports, and do not start HF6B automatically.
