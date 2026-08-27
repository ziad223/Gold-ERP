# Gift Voucher Internal Browser Proof

## Environment

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Authenticated session: existing local session; company `Gold ERP`, branch
  `Branch-2`.
- Database: `darfus_erp`, inspected read-only.
- Browser: Codex internal in-app browser, clean agent-created tab.

## Read-only journey

The synthetic unknown code `GV-I18N-NOTFOUND-TEST-0001` was entered once in AR
and once in EN and validated. Each operation was the existing read-only GET
lookup only. No issue, activation, redemption, checkout, payment, print, or
other business mutation was performed.

| Locale | Expected | Observed | Result |
|---|---|---|---|
| AR desktop | localized not-found error | `القسيمة غير موجودة` | PASS |
| EN desktop | localized not-found error | `Gift voucher not found` | PASS |
| AR narrow | localized UI and readable layout | localized section/error | PASS |
| EN narrow | localized UI and readable layout | localized section/error | PASS |

The final clean tab reported zero console errors. The earlier HMR tab had a
transient stale missing-message diagnostic before reload; after reload the same
runtime rendered correctly. It is not present in the clean final proof.

