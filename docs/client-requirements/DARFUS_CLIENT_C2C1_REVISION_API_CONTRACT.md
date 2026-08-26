# DARFUS Client C2C1 — Revision API Contract

## Endpoints frozen for C2C2

| Method | Endpoint | Permission | Behavior |
|---|---|---|---|
| `POST` | `/api/v1/inventory-v2/assets/:assetId/revisions` | `inventory.revision.create` | creates one generic revision command transactionally |
| `GET` | `/api/v1/inventory-v2/assets/:assetId/revisions` | `inventory.revision.view` | read-only deterministic list projection |
| `GET` | `/api/v1/inventory-v2/assets/:assetId/revisions/:revisionId` | `inventory.revision.view` | read-only detail projection |

There is no public update or delete endpoint. `PUBLIC_UPDATE_REVISION_ENDPOINT = NONE`; `PUBLIC_DELETE_REVISION_ENDPOINT = NONE`. Durable history is append-only.

## Create request

Required authenticated request fields:

```json
{
  "changes": [
    {
      "fieldKey": "description",
      "newValue": "updated description"
    }
  ],
  "reason": "documented reason",
  "sourceOperation": "approved-operation-name"
}
```

Optional request field: `sourceReference`. The exact spelling is part of this contract. The `Idempotency-Key` header is required and is not accepted as a body substitute. `expectedAssetUpdatedAt` is required for stale-write protection when the future C2C2 handler is implemented; it is compared exactly to the server-read Asset timestamp.

Client must not submit `companyId`, `branchId`, `technicalUserId`, `employeeId`, actor names, `revisionNo`, timestamps, revision ID, request hash, authority type, old value, or database foreign keys. Those are server-derived. The generic command does not accept dedicated-operation references as a way to bypass the allowlist.

Request validation:

- `changes` is a non-empty array with unique `fieldKey` values.
- `fieldKey` is one of `name`, `description`, `category`, `brand`, `notes`.
- `newValue` is checked against the existing field validator; no UI label or display text is authority.
- `reason` and `sourceOperation` are non-empty bounded strings; `sourceReference`, when present, is bounded and auditable.
- all fields validate before a transaction inserts anything.

## Server-derived response

The successful response returns a read-only projection containing:

```json
{
  "success": true,
  "data": {
    "revision": {
      "id": "…",
      "assetId": "…",
      "companyId": "…",
      "branchId": "…",
      "revisionNo": 1,
      "reason": "…",
      "sourceOperation": "…",
      "sourceReference": "…",
      "occurredAt": "…",
      "actor": { "technicalUserId": "…", "employeeId": null, "employeeCode": null },
      "changes": [
        { "fieldKey": "description", "oldValue": "…", "newValue": "…", "valueType": "string", "authorityType": "GENERAL_REVISION_CHANGE" }
      ]
    }
  },
  "requestId": "…"
}
```

IDs and actor snapshots are shown only within the caller’s authorized company/branch projection. `requestId` is the HTTP correlation identifier, not the idempotency key.

## List and detail projections

List ordering is deterministic: `occurredAt DESC, revisionNo DESC, id DESC`, with server-side company/branch filtering before pagination. Detail includes the revision header, all change rows, actor/operation snapshots, event reference, audit reference/correlation, and idempotency status where authorized. It does not pretend that a revision row is the current Asset value.

## Error envelope

All failures use the existing canonical envelope:

```json
{
  "success": false,
  "error": {
    "code": "REVISION_FIELD_NOT_ALLOWED",
    "message": "safe localized/server message",
    "details": {},
    "fields": {},
    "requestId": "…"
  }
}
```

Frozen codes: `ASSET_NOT_FOUND` (404), `ASSET_SCOPE_INVALID` (403), `REVISION_PERMISSION_DENIED` (403), `REVISION_FIELD_NOT_ALLOWED` (422), `REVISION_NO_EFFECTIVE_CHANGE` (422), `REVISION_IDEMPOTENCY_CONFLICT` (409), `REVISION_CONCURRENT_CONFLICT` (409), `REVISION_DEDICATED_OPERATION_REQUIRED` (422), `REVISION_INVALID_VALUE` (422), and `REVISION_SOURCE_INVALID` (422). Existing `UNAUTHORIZED` remains the unauthenticated code.

## UI contract (design only)

C2C1 authorizes no UI work. A future UI may show a read-only timeline/list and a form for the five allowed metadata fields, with Arabic RTL and English LTR localization, keyboard access, field-level validation, and the same stable error codes. It must never expose internal table names, actor/security bypasses, or controls for denylisted authorities.

