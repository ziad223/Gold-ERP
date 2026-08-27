# DARFUS Gift Voucher Main Runtime — Authenticated Read Proof

No credentials, token, cookies, or secrets are recorded here.

## Backend read checks

| Request | Result | Evidence |
|---|---|---|
| `GET /api/v1/health` | 200 | `{status:"UP"}` |
| `GET /api/v1/health/db` | 200 | PostgreSQL connected successfully |
| `GET /api/v1/health/redis` | 200 | Redis connected |
| Authenticated `GET /api/v1/gift-vouchers` | 200 | backend request id `f3f2b9c3-4fa3-4df7-ae25-f5929d55684a` |
| Browser cache revalidation | 304 | backend request ids `31b9c86e-d32b-40d6-b615-cd5b02e6b166`, `18d8c2d1-3e70-4ffe-b9ce-95c24707ee77`, `60018992-bdec-4c2a-aa2e-c29a22b817d3` |

The authenticated response represented an empty list, consistent with the
official database count of zero. The historical 500 read failure was not
reproduced after the refresh.

## Browser read-only proof

| Locale | URL | Result |
|---|---|---|
| Arabic | `http://localhost:3000/ar/sales/gift-vouchers` | PASS; page rendered, empty-state text visible, no Console errors/warnings |
| English | `http://localhost:3000/en/sales/gift-vouchers` | PASS; page rendered, empty-state text visible, no Console errors/warnings |

The page was not used to issue, activate, redeem, checkout, print, or otherwise
mutate a Voucher.
