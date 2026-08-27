# Gift Voucher Official Retry 01 — Preflight

Control: `DARFUS-GIFT-VOUCHER-OFFICIAL-RUNTIME-BUSINESS-ACCEPTANCE-RETRY-01`
Date: 2026-08-27

| Gate | Result | Evidence |
|---|---|---|
| Runtime health | PASS | `/api/v1/health`, `/db`, `/redis` returned 200 |
| Official DB identity | PASS | `current_database()=darfus_erp`, user `postgres` |
| Runtime/source parity | PASS | bind mount `/app`, host/container `erp.routes.js` SHA-256 match |
| Authenticated Gift Voucher list | PASS | authenticated page loaded; GET list returned 304/previous 200 |
| Fresh backup | PASS | see companion backup artifact |
| Exact Asset | PASS after selecting authorized Branch-1 | DB and POS search show the specified Asset/Barcode |
| Current pricing | PASS | immediate repeat returned Base 2,838.44, VAT 397.38, Total 3,235.82 AED |
| Financial mapping readiness | FAIL | issue endpoint returned 422 `FINANCIAL_MAPPING_REQUIRED` |

The failure is a hard precondition failure. Per the control, the financial
workflow stops before activation, redemption, checkout, or any retry.

