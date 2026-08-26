# DARFUS Client C2C3M — Browser / Network Proof

## Read-only preflight

| Request | Result |
|---|---:|
| `GET http://localhost:3002/en/inventory/AST-PUR-1787083585731-1-1-plz5` | 200 |
| `GET http://localhost:3002/ar/inventory/AST-PUR-1787083585731-1-1-plz5` | 200 |
| `GET http://localhost:8001/api/v1/health` | 200 |
| `GET http://localhost:8001/api/v1/health/db` | 200 |
| `GET http://localhost:8001/api/v1/health/redis` | 200 |
| unauthenticated `GET .../revisions?limit=1` | 401 |
| clone `SELECT current_database()` | `darfus_c2c2_revision_runtime_02` |
| official `SELECT current_database()` | `darfus_erp` |

## Browser-triggered server access-log correlation

The browser actions were performed through the authenticated EN tab. The backend access log is the authoritative request/status evidence available from this runtime:

| Scenario | Method/path | HTTP | Server request ID |
|---|---|---:|---|
| B1 | `POST /api/v1/inventory-v2/assets/AST-PUR-…/revisions` | 201 | `8db36251-…` |
| B2 | same revision endpoint | 201 | `bbd4f6ef-…` |
| B3 | no POST | — | no write log |
| B4 | same revision endpoint | 201 | `1da43d23-…` |
| B5 fresh | same revision endpoint | 201 | `347ca099-…` |
| B5 stale | same revision endpoint | 409 | `d1dc84b3-…` |
| AR unexpected | same revision endpoint | 201 | `e6e6e519-…` |
| history refresh | `GET .../assets/:assetId` and `GET .../revisions?limit=50` | 200/304 | observed after accepted revisions |

The revision service requires `Idempotency-Key` and `expectedUpdatedAt`; the database rows contain a unique redacted key and request hash for each accepted 201. No key values, cookies, localStorage, password, or token was recorded.

## Network-capture limitation

The available browser capability list exposed DOM, CUA, page assets, and console logs, but no DevTools Network domain. Therefore:

```text
SERVER_ACCESS_LOG_CORRELATION = PASS
BROWSER_DOM_AND_CONSOLE_PROOF = PASS
BROWSER_NETWORK_WIRE_CAPTURE = NOT_AVAILABLE_IN_TOOL
UNEXPECTED_AR_CLONE_POST = 201 / revision v11 / root cause not proven
```

This limitation prevents claiming the full C2C3M network gate, although it does not invalidate the server-side status and persistence evidence above.

## Source anchors

- `backend/src/routes/asset-revision.routes.js:12-48`: authentication and `inventory.revision.view/create` guards.
- `backend/src/services/asset-revision.service.js:51-76`: allowed fields, dedicated-field rejection, and `expectedUpdatedAt` validation.
- `backend/src/services/asset-revision.service.js:141-199`: idempotency, transaction, revision/change/event/audit creation, and 201 response.
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx:157-174`: request body, idempotency header, and post-success refresh.

```text
NETWORK_PROOF = SERVER_CORRELATED_PARTIAL
READ_ONLY_AR_NETWORK_RESULT = FAIL_UNEXPECTED_DISPOSABLE_MUTATION
```
