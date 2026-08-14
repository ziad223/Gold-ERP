# Phase 34.3 — Operator Session and Dual Audit Identity

Status: implemented pending final commit verification.

## Scope

Phase 34.3 adds the employee operator-session foundation without converting any business execution route. Sales, POS, returns, reservations, purchases, inventory, treasury, accounting, payroll, attendance, and Gold Purchase command execution remain on their existing authorization boundaries.

## Data model

Migration `20260714040000-employee-operator-session-dual-audit.js` is additive:

- Adds `employees.authorization_version` for stale-session invalidation when employee permissions, branch access, status, role, branch, or employee code changes.
- Creates `employee_operational_sessions` as the durable server-side operator-session table.
- Adds dual audit identity fields to `audit_logs`:
  - `technical_user_id`
  - `employee_id`
  - `employee_code_snapshot`
  - `employee_name_snapshot`
  - `operator_session_id`
  - `device_session_id`
  - `verification_level`
  - `level_2_verified_at`
  - `required_permission`
  - `requested_operation`
  - `authorization_result`
  - `authorization_failure_code`
  - `operator_reason`
  - `hash_version`

Existing audit rows are retained as `hash_version = "v1"`. New dual-identity rows use `v2`, whose tamper-evident hash canonicalizes the legacy audit payload plus operator identity fields.

## Backend API

The Phase 34.2 `/operator/verify` route remains response-compatible and now creates/replaces a server-side operator session using `X-Device-Session-ID`.

New operator endpoints:

- `GET /api/v1/operator/current`
- `POST /api/v1/operator/authorize-action`
- `POST /api/v1/operator/lock`

The API enforces:

- Authenticated technical user remains the JWT principal.
- Employee operator identity is verified by employee code and PIN.
- Server-side session expiry: 15-minute idle timeout and 8-hour absolute timeout.
- Level-2 step-up freshness: 5 minutes.
- Credential version drift invalidates active sessions.
- Authorization version drift invalidates active sessions.
- Branch access drift invalidates active sessions.
- Inactive employees cannot continue sessions.
- Employees on leave cannot perform Level-2 step-up.
- Device session id is required and is never trusted as authorization by itself.

## Frontend

Frontend changes are limited to operator-session infrastructure:

- API client generates and sends `X-Device-Session-ID` only with authenticated API requests.
- Device session id is cleared on logout and global 401 cleanup.
- Operator provider and repository methods expose current, verify, step-up, and lock.
- Header shows minimal operator verify and lock controls.

Business command UI integration is intentionally deferred until the relevant execution phases.

## Audit behavior

`audit.service` now supports both:

- `canonicalV1` for existing audit rows.
- `canonicalV2` for dual audit identity rows.

`attachDualAuditActor` records both identities:

- technical user: authenticated platform account.
- employee operator: verified operational actor.

This preserves existing chain verification while making new operator-aware actions tamper-evident.

## Verification

Added verifier:

- `scripts/verify-employee-operator-session.js`

The verifier proves:

- Static migration/model/service/route/frontend contract.
- Real HTTP operator verification through Express middleware.
- Durable server-side operator session creation.
- `GET /operator/current` active/inactive behavior.
- Level-2 authorization success and permission denial.
- On-leave employee Level-2 denial.
- Authorization-version invalidation after employee permission change.
- Manual lock behavior.
- v1 audit canonical determinism.
- v2 audit hash includes employee identity.
- Audit hash chain remains valid.
- No business posting/inventory/accounting mutation.
- Namespace cleanup reaches zero.

Final expected verifier inventory: 49.

## Limitations

MANUAL UI QA REQUIRED.

Business execution routes are not converted in this phase. Phase 33D and Phase 33C-HF2 remain not started.
