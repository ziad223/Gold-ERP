# DARFUS Client C2C1 — Revision Permission and Security Contract

Control: `DARFUS-CLIENT-C2C1-REVISION-SERVICE-API-PERMISSION-CONTRACT-01`

## Frozen permissions

| Contract permission | Purpose | Current catalog status |
|---|---|---|
| `inventory.revision.create` | create an Asset Revision command | not registered; C2C2 prerequisite |
| `inventory.revision.view` | read revision history/projections | not registered; C2C2 prerequisite |

These are dedicated names, not aliases for `inventory.adjust`. The current catalog contains `inventory.view`, `inventory.create`, `inventory.update`, `inventory.delete`, `inventory.adjust`, `inventory.export`, and `inventory.print` (`lib/permissions/catalog.ts`, inventory permission list). C2C1 does not add or mutate permissions.

`REVISION_ADMIN_OVERRIDE = NONE`. An administrator must pass the same server-side permission and scope checks. Employee role, Employee Code, or operator verification is attribution evidence; none of them grants technical authorization.

## Authentication and company scope

1. An authenticated technical User is required.
2. The service must use the server-derived `req.companyId`; a body/query company identifier is not authority.
3. The Asset must belong to that company. A mismatch returns `ASSET_SCOPE_INVALID` (403), with no existence-leaking alternative response.
4. A missing company context is rejected. The historical/demo fallback in legacy auth paths is not permitted for the revision contract.
5. The request is evaluated using the current User/Auth/RBAC authority. No shared branch account is introduced.

Evidence: `backend/src/middleware/auth.middleware.js` derives and validates `req.companyId`, requires explicit company context for super-admin requests, and exposes `requirePermission`/`requireBusinessPermission`; `command-actor-context.service.js` derives attribution instead of trusting client identity.

## Branch scope and fail-closed behavior

- A create operation requires a server-authorized active branch belonging to the selected company.
- The body cannot choose a branch. A header/selected branch may be an input to the existing resolver, but the server validates it against company, activity, user scope, and permission.
- Normal branch-scoped users remain in their assigned branch.
- A cross-branch administrator still needs the existing permission and an explicit server-validated branch context; no implicit “all branches” default is allowed.
- Missing branch, inactive branch, company mismatch, or unauthorized branch returns a 403 contract error and performs no write.
- The revision’s historical branch is the operation branch captured in its event/audit provenance. It is not rewritten when the Asset later moves.

Evidence: `resolveAuthorizedBranchId` in `backend/src/routes/erp.routes.js` requires/validates active Branch and company ownership; existing routes use `requireBusinessPermission` plus the resolver.

## Employee/operator attribution

The actor contract is:

| Value | Source | Required meaning |
|---|---|---|
| `technicalUserId` | authenticated User/session | who authenticated |
| `employeeId` | verified live operator session, if present | responsible employee identity |
| `employeeCode`/`employeeName` | verified session snapshot | human-readable attribution snapshot |
| `operatorSessionId`/`deviceSessionId` | live operator context, if present | session/device evidence |
| `companyId` | server context | company scope |
| `branchId` | server-authorized operation context | branch scope |

If no employee session is required/available for a technical admin, `employeeId` may be null; the service must not guess an employee. `operator-session.service.js` and `command-actor-context.service.js` are the existing authorities.

## Durable security evidence

The service must write actor snapshots through the existing `audit.service.js` hash-chain and `asset_events` actor fields in the same transaction as the revision. Historical revision provenance therefore remains readable after a User, Employee, session, or Asset is later deactivated. Nullable parent IDs do not erase the snapshots.

## Read security

Revision list/detail reads are company and branch scoped by default. A historical row is never exposed solely because the caller knows a revision ID. Cross-branch reads require an explicit server-validated context and the read permission. Detail projections must preserve the operation branch/actor snapshot while separately showing the Asset’s current branch, if requested and authorized.

## Stable security errors

The future service uses the existing error envelope and stable codes:

| Condition | Status/code |
|---|---|
| no authenticated session | existing `UNAUTHORIZED` / 401 |
| missing or invalid company/branch scope | `ASSET_SCOPE_INVALID` / 403 |
| permission absent | `REVISION_PERMISSION_DENIED` / 403 |
| unknown/dedicated/immutable field | `REVISION_FIELD_NOT_ALLOWED` / 422 |

The UI may localize the message, but the code is the machine contract. No error reveals another company’s Asset existence.

