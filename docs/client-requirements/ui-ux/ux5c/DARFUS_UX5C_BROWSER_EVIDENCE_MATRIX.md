# DARFUS ERP — UX5C Browser Evidence Matrix

Runtime under test: existing `http://localhost:3000`; no second frontend was
started. Browser actions were navigation, theme/language changes, inspection,
and selecting a payment presentation mode only. No checkout, customer creation,
voucher mutation, draft mutation, or payment mutation was invoked.

| Surface | Evidence | Result |
|---|---|---|
| EN light desktop | `screenshots/en-light-desktop.png`, `dir=ltr`, overflow 0 | PASS |
| EN dark desktop | `screenshots/en-dark-desktop.png`, `dir=ltr`, overflow 0 | PASS |
| AR light desktop | `screenshots/ar-light-desktop.png`, `dir=rtl`, overflow 0 | PASS |
| AR dark desktop | `screenshots/ar-dark-desktop.png`, `dir=rtl`, overflow 0 | PASS |
| EN tablet | `screenshots/en-tablet.png`, width 853 × 1138, overflow 0 | PASS |
| AR tablet | `screenshots/ar-tablet.png`, width 853 × 1138, overflow 0 | PASS |
| EN mobile | `screenshots/en-mobile.png`, width 434 × 938, overflow 0 | PASS |
| AR mobile | `screenshots/ar-mobile.png`, width 434 × 938, overflow 0 | PASS |
| AR split payment | Arabic-only payment chrome | PASS |
| EN split payment | English-only payment chrome | PASS |
| Console | No application errors, warnings, or hydration errors observed | PASS |
| Backend/frontend reachability | `:8000/health=200`, `:3000/en/pos=200` | PASS |

Detailed request interception is not exposed by the connected browser surface;
source review and backend log review were used to confirm unchanged contracts.
