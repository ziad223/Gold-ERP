# UX-10 AR/EN Verification

All six Settings/Audit routes were opened in the current `localhost:3000` runtime in Arabic and English. `document.documentElement.dir` was `rtl` for `/ar/*` and `ltr` for `/en/*`; language attributes matched the route. No API, form, save, delete, or mutation action was invoked.

| Surface | Arabic | English |
|---|---|---|
| Settings | PASS | PASS |
| Tax settings | PASS | PASS |
| Barcode settings | PASS | PASS |
| Operational onboarding | PASS | PASS |
| System accounts/users | PASS | PASS |
| Audit list/detail surface | PASS | PASS |

The same scoped presentation class was present in the served page for both locales.
