# Phase 34.4 — Employee Management UI, System Accounts, and Operator Experience

Status: implemented pending final verification.

## Scope

Phase 34.4 completes the management and operator-experience layer around the Phase 34.2 Employee authorization foundation and Phase 34.3 DB-backed operator-session foundation.

This phase does not integrate Employee operator enforcement into Sales, POS, Gold Purchase, Returns, Exchanges, Reservations, Purchases, Payments, Inventory, Treasury, Accounting, Payroll, Attendance, or other business execution routes.

## Migration and permission status

- Database migrations remain unchanged at 40.
- Permission catalog remains unchanged at 111.
- Gold Purchase permissions remain unchanged at 24.
- No `employees.view` permission was added.
- No `User.accountType` field was added.
- No User-to-Employee link was added.

## System Accounts

The former Users & Permissions page is reframed as System Accounts at the existing compatible route:

- `/settings/users`

System Accounts are technical authentication accounts. Employee Code, PIN, branch access, role templates, direct grants, direct denials, effective permissions, verification attempts, and operator sessions are managed from Employee profiles.

The UI deliberately does not infer owner, support, service, operating, or legacy account categories from names, emails, roles, or branches.

## Employee route visibility

Employee pages are visible when the technical User has any existing permission from this zero-delta set:

- `payroll.view`
- `employees.credentials.manage`
- `employees.permissions.manage`
- `employees.branches.manage`
- `employees.verification.view`

Core Employee create/update/deactivate/reactivate routes are no longer authentication-only. They use existing management permissions:

- `payroll.manage`
- `employees.credentials.manage`

Action-specific authorization remains unchanged:

- PIN and credential details: `employees.credentials.manage`
- Branch access: `employees.branches.manage`
- Employee roles, grants, denials and effective permissions: `employees.permissions.manage`
- Verification attempts and operational sessions: `employees.verification.view`
- Dual audit activity: existing audit visibility

## Employee list

The Employee list now uses server-backed pagination and safe summary fields.

Supported search:

- Employee Code
- name
- phone
- email

Supported filters:

- status
- role
- primary branch
- explicit branch access
- credential state
- locked state
- role template
- active operator session

Safe row summary fields include:

- credential state
- branch access count
- role-template count
- active operator-session count
- last verified timestamp
- primary branch display

The list does not return PIN hashes, raw device session IDs, auth fingerprints, full permission sets, raw IP/user-agent, or ordinary diagnostic versions.

## Employee detail

Employee detail separates operational authorization from HR/payroll subject data:

- Overview
- Security permissions
- Approval limits
- Activity history
- Operational sessions

Branch access and authorization inputs no longer use comma-separated ID management. Backend-resolved effective permissions remain the source of truth.

Employee audit activity now queries Employee audit identity (`employeeId`) rather than treating the Employee ID as a technical `User.userId`.

## Operational session history

Added read-only endpoint:

`GET /api/v1/employees/:id/operator-sessions`

Permission:

- `employees.verification.view`

The endpoint is company scoped, Employee scoped, paginated, newest first, and read-only. It returns safe session fields only:

- state
- masked device label
- branch display
- technical user display
- verification level
- verified timestamps
- last activity
- idle and absolute expiry
- locked/revoked timestamps and reason

It does not return:

- raw `deviceSessionId`
- `authSessionFingerprint`
- raw token
- PIN
- PIN hash
- full permission set

Verification attempts now mask IP addresses and summarize user-agent values.

## Device session key migration

Canonical browser storage key:

- `darfus-device-session-id-v1`

Legacy key:

- `darfus-device-session-v1`

The frontend API client performs a safe one-time migration:

1. Read canonical key first.
2. If absent, read legacy key.
3. If legacy value is valid, copy to canonical and remove legacy.
4. If legacy value is invalid, remove it and generate a new canonical value.
5. All new writes use the canonical key.
6. Logout clears both canonical and legacy keys.

No Employee, PIN, permission, JWT, or operator authority data is stored with the device ID.

## Operator bar

The authenticated header now uses a consolidated operator bar supporting:

- no active operator
- active Level 1
- active Level 2
- Level 2 freshness countdown
- Level 1 idle countdown
- absolute expiry display
- verify
- switch
- step-up
- lock
- stale/expired/branch-changed recovery display
- responsive compact display
- RTL/LTR support

Countdowns are derived from server timestamps locally and do not poll the API every second.

## Cross-tab behavior

The operator context uses:

- `BroadcastChannel` where available
- `storage` event fallback

It propagates only safe event types and timestamps. It does not broadcast PINs, permission sets, raw session IDs, tokens, or device IDs.

Events include:

- verified
- step-up
- locked
- branch changed
- logout

Receiving tabs refresh `/operator/current`.

## Business integration exclusion

No business execution route imports or wires:

- `requireOperator`
- `requireEmployeePermission`
- `requireStepUp`
- operator enforcement middleware

Business command authorization remains on the existing Phase 34.3 boundary.

## Static verifier

Added:

- `scripts/verify-employee-management-operator-ui-contract.js`

Expected verifier inventory:

- before Phase 34.4: 49
- after Phase 34.4: 50

The verifier checks System Accounts framing, zero permission delta, Employee ANY-of route visibility, device key migration, Employee list/detail contracts, real operational sessions, operator bar/cross-tab behavior, privacy exclusions, localization, and no business-route operator middleware wiring.

## Manual browser QA

MANUAL UI QA REQUIRED.

Required coverage:

- Phase 34.2 Employee Code/PIN/branch/role/grant/denial/effective permission flows
- Phase 34.3 verify/current/step-up/lock/session persistence/cross-tab behavior
- Phase 34.4 System Accounts, Employee list/detail, real session history, operator bar, Arabic RTL, English LTR, mobile/tablet/POS width, dark/light, keyboard-only, loading/error/empty states

## Deferred

- `User.accountType`
- User-to-Employee linking
- forced session revoke
- manager override
- support elevated access
- Sales/POS enforcement
- Gold Purchase Employee maker-checker integration
- Treasury/accounting/inventory integration
- offline Level 2
- historical attribution rewrite
- Phase 33D
- Phase 33C-HF2

## Browser QA hotfix closure

Phase 34.4 browser QA hotfix resolved the three blocking manual QA defects:

- `P344QA-BQA-001` — PIN/modal lifecycle: operator verify, failed verify, Level 2 step-up and lock now clear PIN state through guaranteed `finally` paths. Level 2 success closes the step-up panel, Lock closes the operator panel, and inactive/stale operator transitions clear sensitive local form state.
- `P344QA-BQA-002` — Employee detail management contract: the detail page now exposes the accepted focused tab structure: Overview, Operational Access, Branch Access, Role Templates, Direct Permissions, Effective Permissions, Credential & PIN, Verification Attempts, Operational Sessions, Audit / Activity, and HR / Payroll / Attendance. Branch, role and permission management use searchable structured controls rather than raw ID textareas. Direct grants and denials are separated, overlap is blocked, denial precedence is explicit, and effective permissions remain backend-resolved.
- `P344QA-BQA-003` — stale operational-session panel: operator lifecycle events are dispatched in-tab and cross-tab, and Employee detail hooks refresh authorization/session data after verify, switch, step-up, lock, credential reset, branch access update and permission update.

Additional closure fix:

- `GET /employees/:id` now returns the same safe `authorizationSummary` used by the Employee list, including credential state and active operator-session count, so the Credential & PIN detail tab renders backend-authoritative state after PIN reset.

Browser QA evidence was collected against local `darfus_erp@localhost:5433` only:

- failed PIN attempt returned the generic failed verification state while clearing attempted PIN input;
- successful verify moved the header to `L1`, closed the verify panel, and removed the operator PIN input;
- Level 2 step-up moved the header to `L2`, closed the step-up panel, and cleared PIN input;
- Operational Sessions refreshed without page reload to show `active_level_2`;
- Lock closed operator dialogs, returned the header to Employee verification required, and refreshed Operational Sessions to `locked`;
- visible session rows display masked device labels and do not render raw `deviceSessionId`, `authSessionFingerprint`, raw token, PIN, or PIN hash;
- Credential & PIN fields use password inputs and clear after submit.

Verifier and regression evidence:

- `scripts/verify-employee-management-operator-ui-contract.js` now asserts the hotfix PIN lifecycle, focused detail tabs, searchable controls, backend detail `authorizationSummary`, lifecycle invalidation and privacy exclusions.
- Existing live verifier setup scripts were aligned to use `returning: false` for local Company fixture inserts, preventing PostgreSQL `RETURNING` from requesting model-only Company fields that are not present in the local Phase 34 schema.
- Typecheck, lint, build, targeted Phase 34.2/34.3/34.4 verifiers, and full verifier suite must be run with the documented local DB environment.

No migration was added. Permission count remains 111. Gold Purchase permission count remains 24. Business execution routes remain free of operator middleware wiring.

MANUAL UI QA REQUIRED evidence is now recorded for the browser hotfix pass, but future Phase 34.5 Sales/POS operator-enforcement work still requires a new owner-approved phase.
