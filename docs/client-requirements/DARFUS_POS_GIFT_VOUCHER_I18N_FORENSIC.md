# DARFUS POS Gift Voucher I18N Forensic

Control: `DARFUS-POS-GIFT-VOUCHER-I18N-NARROW-VISUAL-CLOSEOUT-01`
Date: 2026-08-27
Mode: narrow I18N/UI closeout; no financial acceptance.

## Arabic leakage root cause

The read-only Gift Voucher lookup route returns HTTP 404 for an unknown code. The
current route's 404 payload has an Arabic `message` and no stable error code. The
POS page previously copied `DarfusApiError.message` into the user-facing error
state, so the English page rendered that server-language string. This was a
frontend error-presentation defect, not a Tax, Payment, Voucher, or accounting
defect.

Evidence:

- `backend/src/routes/erp.routes.js`: existing GET voucher lookup is read-only
  and its not-found response is HTTP 404.
- `lib/api/client.ts`: `DarfusApiError` preserves `status` and `errorCode`.
- `app/[locale]/(dashboard)/pos/page.tsx:945-967`: the corrected validation
  paths use the POS catalog and `getGiftVoucherErrorKey`; raw `error.message` is
  no longer used for Gift Voucher UI errors.
- `lib/api/gift-voucher-error.ts:32-49`: stable error-code/status classifier;
  HTTP 404 maps to `notFound` and unknown failures map to `generic`.

## Scope and result

The minimum safe change localizes the shared Gift Voucher component and all
Gift Voucher validation/presentation errors through `messages/ar.json` and
`messages/en.json`. The backend route, payment contract, tax engine, voucher
state, checkout, accounting, and database schema were not changed.

`RAW_BACKEND_MESSAGE_RENDERED_TO_USER = NO` after reload of the current runtime.
The clean internal-browser tab had zero console errors during final proof.

