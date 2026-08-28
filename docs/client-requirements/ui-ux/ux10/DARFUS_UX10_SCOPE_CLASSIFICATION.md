# UX-10 Scope Classification

| Surface | Class | UX-10 boundary |
|---|---|---|
| Settings landing/forms/tabs | C/D | presentation only; existing keys, values, validation, handlers and permissions frozen |
| Tax and barcode settings | D | presentation only; no tax/barcode semantics or writes invoked |
| Onboarding readiness | A/B | presentation and safe refresh presentation only |
| Users/system accounts | D | presentation only; no user, role, permission, session or password mutation |
| Audit list/detail/verify | A/B | readability and focus only; history and verification semantics frozen |
| Gift Voucher financial mapping track | E | open and out of scope |

Forbidden: backend, API, DB, migrations, seeds, setting changes, security changes, audit changes, tax/accounting/Gold/inventory/POS/numbering changes.
