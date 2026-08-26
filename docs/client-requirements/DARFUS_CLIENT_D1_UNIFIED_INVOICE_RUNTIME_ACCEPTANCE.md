# D1 — Unified Invoice Projection Runtime Acceptance

## Runtime boundary

- Runtime under test: existing backend `http://localhost:8000` only after the
  backend image is refreshed for the D1 route.
- Database: `darfus_erp`, read-only.
- Allowed requests: authenticated GET only.
- Forbidden requests: invoice creation, payment, print-event creation, return,
  exchange, CGP posting, migration, seed, or any POST/PUT/PATCH/DELETE.

## Required scenarios

| Scenario | Request | Expected evidence |
|---|---|---|
| D1-A | `GET /api/v1/invoice-projection/sources` | Five active Invoice adapters, Gift Voucher/CGP later entries, explicit D2 extension metadata |
| D1-B | `GET /api/v1/invoice-projection/summaries` | One source row → one stable summary, page count, no write |
| D1-C | `GET /api/v1/invoice-projection/sale/<known-id>` | Summary/detail identity, financial equality, payment/source links, Asset link |
| D1-D | same detail with unknown ID | HTTP 404 `PROJECTION_SOURCE_NOT_FOUND` |
| D1-E | unsupported `customer_gold_purchase` detail | HTTP 422 `PROJECTION_UNSUPPORTED_SOURCE_TYPE`; no CGP implementation leak |
| D1-F | known source outside branch/company scope | HTTP 403 `PROJECTION_SOURCE_FORBIDDEN` |
| D1-G | repeat the same GETs | Semantically identical body; no idempotency, audit, or business rows created |
| D1-H | inspect request methods/network | D1 requests are GET-only and `sales.view` protected |

## Runtime result

The final report records actual status, response codes, and the known official
DB delta. A stale backend must not be called D1 runtime proof; it is a parity
blocker and requires a safe backend refresh before acceptance.

