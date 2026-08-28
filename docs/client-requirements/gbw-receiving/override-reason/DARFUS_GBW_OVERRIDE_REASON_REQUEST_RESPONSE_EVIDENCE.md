# Request/response evidence

## Current runtime

- `GET http://localhost:8000/api/v1/health` → 200, service `UP`.
- `GET http://localhost:8000/api/v1/health/db` → 200.
- `GET http://localhost:8000/api/v1/health/redis` → 200.
- Browser `GET http://localhost:3000/en/inventory/gold-by-weight` → 200.
- Browser DOM showed authenticated company `Gold ERP`, `Branch-1`, Gold Center ready, `GOLDAPI_IO · AED`, and no override-reason field.
- Browser console error/warn sample at audit time: `[]`.

## Historical backend failure observations

The current backend log contains four `422` requests to `POST /api/v1/purchase-orders/receive` with the exact safe message `Purchase gold-rate override reason is required.` and request IDs:

| Time (local log stream) | Status | Request ID | Safe response/error |
|---|---:|---|---|
| 09:17:39 | 422 | `76564846-5eb8-4a88-ad88-81cc212a1567` | reason required |
| 09:17:54 | 422 | `0972174e-49e2-4b02-beeb-9f969769910f` | reason required |
| 09:18:16 | 422 | `51073c8c-9b90-4a88-9e7f-a38a95c0e893` | reason required |
| 09:19:38 | 422 | `df9fea4d-d5fa-4270-a7ca-fcdf5db31211` | reason required |

The log does not retain request bodies. No new Receive or replay was sent to recover them. Therefore:

`FAILING_REQUEST_PAYLOAD_CAPTURED = NO_EXACT_RAW_BODY_RETAINED`  
`EQUIVALENT_SOURCE_TRACE = YES`  
`RAW_PAYLOAD_EVIDENCE = INCOMPLETE`

The source-built payload is documented in the frontend authority map; it includes the rate but no accepted reason key.

