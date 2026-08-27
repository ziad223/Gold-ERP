# Gift Voucher Browser / Network Acceptance

## Isolation proof

| Item | Actual |
|---|---|
| Frontend | `http://localhost:3001` temporary production build |
| Backend | `http://127.0.0.1:8001/api/v1` |
| Backend database | `current_database()=darfus_gift_voucher_schema_impl_01` |
| Official DB | `darfus_erp`; not used by this UI |
| Authentication | Success; admin role, company `Gold ERP`, branch `Branch-1` |

## AR and EN

Both pages loaded and rendered the voucher table, face value, status, date, and Print/Reprint control without Console errors. The browser network evidence in the isolated backend log shows:

- `POST /api/v1/auth/login` → `200`
- `GET /api/v1/auth/accessible-companies` → `200/304`
- `GET /api/v1/branches` → `200/304`
- `GET /api/v1/gift-vouchers` → `200/304`

No issue, activate, print, redeem, checkout, payment, journal, or inventory request was made by the browser. The Issue button was inspected only and not activated.

## Browser result

`AR_UI=PASS`, `EN_UI=PASS`, `AUTH_CONTEXT=PASS`, `CONSOLE_ERRORS=0`, `BROWSER_BUSINESS_MUTATIONS=0`.
