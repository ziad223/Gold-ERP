# DARFUS Client E — Runtime Acceptance

## Main runtime

The normal backend was rebuilt/recreated after the source change. Read-only probes returned:

| Probe | Result |
|---|---|
| `GET http://localhost:8000/api/v1/health` | `200`, status `UP` |
| `GET http://localhost:8000/api/v1/health/db` | `200`, PostgreSQL connected |
| `GET http://localhost:8000/api/v1/health/redis` | `200`, Redis connected |
| `GET http://localhost:8000/api/v1/health/gold` | `200`, `GOLDAPI_IO`, `LIVE_PROVIDER`, AED, fresh at observation |
| unauthenticated `GET /api/v1/invoice-projection/sources` | `401` |
| startup log | bootstrap skipped; no startup migration |

## Disposable authenticated acceptance

Clone: `darfus_e_cgp_invoice_projection_01`

Before authentication, the temporary backend connection itself returned:

```text
current_database = darfus_e_cgp_invoice_projection_01
```

No official credentials or official session were used. A synthetic credential was prepared in the clone only; its value is intentionally not recorded.

| GET proof | Result |
|---|---|
| `GET /api/v1/invoice-projection/sources` | `200`; active list contains five invoice types plus `customer_gold_purchase`; `gift_voucher`, `purchase_order`, and `repair` remain inactive/future |
| `GET /api/v1/invoice-projection/summaries?sourceType=customer_gold_purchase` | `200`; representative CGP summary present |
| `GET /api/v1/invoice-projection/customer_gold_purchase/:sourceId` | `200`; identity/customer/items/gold/financial/accounting evidence present |
| same detail GET repeated | `200` twice; semantic JSON stable |
| unknown CGP ID | `404 / PROJECTION_SOURCE_NOT_FOUND` |
| wrong company context | `403 / COMPANY_SCOPE_INVALID` |
| unrelated `gift_voucher` detail | `422 / PROJECTION_UNSUPPORTED_SOURCE_TYPE` |

## No final business action

No CGP POST, validate, post, settlement, print event, tax mutation, accounting mutation, or D2 UI action was executed.

## Runtime gate observation

The E clone acceptance itself is clean. During the same wall-clock window, the already-open main browser issued an independent `POST /api/v1/auth/login` to the official backend at `11:04:40 UTC`; the official backend log records the request and the official technical-session count increased by one. This is not attributable to the E clone (the clone login target was proven separately), but it prevents an unconditional claim that the whole window had zero official session writes. Official business tables remained unchanged.

