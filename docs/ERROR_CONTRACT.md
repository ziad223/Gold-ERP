# Error Contract

## Status

`ERROR-CONTRACT = COMPLETE` on the source/test boundary. It standardizes error serialization without changing success payloads or stable domain codes. Browser N5/N8 and notification acceptance remain deferred.

## Canonical backend envelope

Every JSON error now has exactly this shape:

```json
{
  "success": false,
  "error": {
    "code": "UPPER_SNAKE_CASE",
    "message": "Safe client-facing message",
    "details": null,
    "fields": null,
    "requestId": "safe-correlation-id"
  }
}
```

`fields` is a map of public form names to message arrays. Nested names use dot or bracket notation. Unknown/non-public ORM paths collapse to `body`; raw validator, SQL, constraint, stack and bind content never cross this boundary. `details` is restricted to safe boolean/numeric metadata.

The response adapter normalizes existing direct `res.status(...).json(...)` error routes centrally, so the established Product code catalog is retained while the repository is migrated incrementally. Success payloads are deliberately unchanged. The frontend parser accepts this envelope and the former `{ message, code, errors }` shape during the transition.

## HTTP mapping

| Status | Generic code | Intended use |
|---:|---|---|
| 400 | `BAD_REQUEST` / `INVALID_JSON` | malformed transport or payload syntax |
| 401 | `UNAUTHORIZED` | absent, invalid, expired, revoked or logged-out authentication |
| 403 | `FORBIDDEN` | authenticated identity lacks policy, role, Company, Branch or permission scope |
| 404 | `ROUTE_NOT_FOUND` / `RESOURCE_NOT_FOUND` | unknown API route or an allowed missing resource |
| 409 | `STATE_CONFLICT` | duplicate, idempotency, concurrent or incompatible state |
| 422 | `VALIDATION_FAILED` | client-correctable semantic field/business validation |
| 500 | `INTERNAL_SERVER_ERROR` | unexpected programming, ORM, database or infrastructure failure |
| 429 | `RATE_LIMITED` | existing rate limit boundary; preserved outside the primary matrix |

Known unique and foreign-key constraint failures map safely to 409; ORM validation maps to 422. Database/query/connection failures map to safe 500, never `VALIDATION_FAILED` and never raw SQLSTATE/SQL.

## Stable code catalog and compatibility

Existing codes remain authoritative. Examples covered by shared tests and source consumers are `VALIDATION_FAILED`, `INTERNAL_SERVER_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `STATE_CONFLICT`, `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED`, `COMPANY_SCOPE_INVALID`, branch/operator codes, all `FIRST_RUN_*` codes, accounting/system-account codes, deposit/reservation codes and idempotency conflicts. The decision for the current catalog is **PRESERVE**; only transport status or old serialization is normalized where needed. No client behavior branches on English/Arabic message text.

Company contract remains exact: missing explicit Super Admin Company context is `422 SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED`; invalid Company scope is `403 COMPANY_SCOPE_INVALID`. First Run known conflicts remain stable; unexpected PostgreSQL/ORM faults are safe 500s. Notification list/unread/SSE terminal ownership is unchanged.

## Request ID, logging and ownership

`request-id.middleware` accepts only bounded safe inbound correlation/request IDs; otherwise it generates a server-side UUID, returns `X-Request-ID`, includes it in every error envelope and logs it as metadata. It is not authorization material.

The error middleware is the server-side error logging owner. It records safe method/path/status/code/name metadata once; centralized redaction remains responsible for auth/setup/database PII and SQL binds. The error response adapter has no logging side effect.

Frontend ownership is deliberate:

- field validation is rendered inline by the form; shared Mutation/Query caches do not add a duplicate validation toast;
- 401 keeps the existing auth/session owner;
- 403 preserves the session and presents scope/permission handling;
- 404 and 409 remain local empty/conflict states;
- 500 and network failures use the shared generic retry-safe error model;
- notification terminal errors keep their existing single lifecycle toast owner.

The shared `DarfusApiError` carries `status`, `errorCode`, `errors`, `details`, request/correlation ID and network/auth/permission/validation/conflict/server classification. It safely handles canonical JSON, legacy JSON, empty/non-JSON bodies and network failures.

## Evidence and boundaries

HTTP tests prove canonical 400 malformed JSON and 404 unknown-route responses with request IDs. Shared tests cover all required generic statuses, stable-code preservation, field normalization, 5xx SQL/message suppression, request-ID validation, frontend parser/adoption, redaction, First Run, Company context, notification lifecycle and deposit rollback regressions. Typecheck, lint and production build pass.

No official database mutation, migration application, N5/N8 browser runtime observation or notification acceptance occurred. The official database release boundary remains 50 applied / 1 pending source migration; the next marker is `RELEASE-GAP-AUDIT`.
