# Phase 34.2 — Employee Authorization Foundation

Status: implemented and verified locally.

This phase adds the employee authorization foundation only. It does not integrate employee verification into Gold Purchase, Sales, POS, Returns, Exchanges, Reservations, Suppliers, Inventory, Treasury, Accounting, Payroll, or any business execution path. Phase 33D and Phase 33C-HF2 remain out of scope.

## Scope delivered

- Employee Code fields on `employees`.
- Dedicated employee credential table with hashed PIN storage.
- Branch access assignments.
- Employee role assignments.
- Direct employee permission grants.
- Direct employee permission denials, with denial precedence in resolution.
- Employee verification attempt ledger.
- Level 1 and Level 2 verification response contract with bounded freshness metadata.
- Administrative APIs for credential reset, branch access, employee permission assignments, and verification-attempt review.
- Operator verification API at `POST /api/v1/operator/verify`.
- Employee list/detail UI integration for Employee Code, PIN reset, branch access, role/grant/denial assignment, effective permissions, and verification-attempt review.
- Verifier coverage in `scripts/verify-employee-authorization-foundation.js`.

## Explicit exclusions

- No `User.accountType`.
- No operational employee sessions.
- No `/operator/current`.
- No current employee persisted in `localStorage` or `sessionStorage`.
- No business workflow enforcement.
- No Gold Purchase, Sales, POS, Returns, Exchanges, Reservations, Suppliers, Inventory, Treasury, Accounting, or Payroll integration.
- No Phase 33D work.

## Migration

Migration:

- `backend/migrations/20260714030000-employee-authorization-foundation.js`

The migration is additive:

- Adds nullable `employee_code` and `employee_code_normalized` to `employees`.
- Adds a company-scoped partial unique index on normalized Employee Code.
- Creates:
  - `employee_credentials`
  - `employee_branch_access`
  - `employee_role_assignments`
  - `employee_permission_grants`
  - `employee_permission_denials`
  - `employee_verification_attempts`
- Backfills eligible existing employee IDs as Employee Codes.
- Backfills same-company employee branch access where an existing employee branch is valid.
- Adds exactly four permissions:
  - `employees.credentials.manage`
  - `employees.permissions.manage`
  - `employees.branches.manage`
  - `employees.verification.view`
- Grants the four permissions to `Role.isAdmin` roles.

Pre-migration backup created:

- `backend/backups/darfus_erp_phase34_2_pre_migration_20260714-102411.dump`

The backup is git-ignored and was not committed.

## Employee Code contract

- Employee Code is the human/operator identifier.
- It is distinct from the technical `Employee.id`.
- Normalization is backend-authoritative:
  - trim
  - Unicode NFKC
  - uppercase
  - max length 64
- Uniqueness is enforced per company on `employee_code_normalized`.
- Leading zeros are preserved.
- Same code in a different company is allowed.
- Manual frontend count-based code generation is not authoritative.

## PIN and credential contract

- PIN must be exactly six digits.
- PIN is hashed asynchronously with bcrypt.
- PIN and hash are never returned by APIs.
- Credential reset requires `employees.credentials.manage`.
- Wrong PIN attempts are recorded.
- Five failed attempts lock the credential for 15 minutes.
- Successful verification resets failure state.

## Branch and permission contract

- Employee branch access is independent from the technical user branch.
- Branch access is explicitly stored in `employee_branch_access`.
- Branch updates require `employees.branches.manage`.
- Employee role, grant, and denial updates require `employees.permissions.manage`.
- Direct grant and direct denial overlap is rejected with validation failure.
- Role permissions and direct grants contribute to the effective set.
- Direct denials remove matching permissions from the effective set.
- Technical `User` permissions do not create employee permissions.

## Verification API contract

`POST /api/v1/operator/verify` accepts:

- `employeeCode`
- `pin`
- `branchId`
- `requestedLevel`
- optional `requestedPermission`
- optional `requestedOperation`

Safe failure behavior:

- Unknown, inactive, on-leave, wrong-branch, and wrong-PIN outcomes do not reveal sensitive employee or credential state.
- Failed attempts are still persisted for audit.
- Verification attempts do not expose PINs or hashes.

## Administrative APIs

- `POST /api/v1/employees/:id/credential/reset`
- `GET /api/v1/employees/:id/branches`
- `PUT /api/v1/employees/:id/branches`
- `GET /api/v1/employees/:id/permissions`
- `PUT /api/v1/employees/:id/permissions`
- `GET /api/v1/employees/:id/verification-attempts`

## UI coverage

- Employee list supports Employee Code during create/edit and displays it in list/export.
- Employee detail shows Employee Code.
- Employee detail includes PIN reset controls.
- Employee detail includes branch access management.
- Employee detail includes role/grant/denial controls.
- Employee detail displays effective authorization output.
- Employee detail displays verification attempts.

Manual UI browser QA is still required.

## Verification evidence

Local verification completed:

- `node --check scripts/verify-employee-authorization-foundation.js`
- `node scripts/verify-employee-authorization-foundation.js`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

The gated verifier proves:

- Static contract for migration, service, routes, models, and permission catalog.
- Employee Code normalization and uniqueness.
- Same-code allowance across companies.
- PIN hashing and response secrecy.
- Credential reset permission enforcement.
- Branch access permission enforcement.
- Employee permission assignment enforcement.
- Grant/denial contradiction rejection.
- Effective permission resolution and denial precedence.
- Technical-user permission isolation.
- Successful Level 1/Level 2 verification.
- Wrong-branch denial.
- Inactive/on-leave denial.
- Lockout and post-expiry reset behavior.
- Concurrent failure lockout protection.
- Verification attempt audit without PIN/hash leakage.
- Unknown code attempt recording without Employee FK.
- No business mutation side effects across business tables.
- Cleanup with no persistent test pollution.

Expected verifier inventory after this phase: 48.

## Remaining boundaries

- Employee authorization is now a reusable foundation.
- Business-flow integration requires a future explicit phase.
- Phase 33D remains blocked until separately authorized.
- MANUAL UI QA REQUIRED.
