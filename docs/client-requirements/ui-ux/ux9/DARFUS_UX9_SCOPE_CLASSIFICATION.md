# UX-9 Scope Classification

| Area | Classification | Boundary |
|---|---|---|
| Card/table spacing, hierarchy, density | IN SCOPE | CSS presentation inside four page roots |
| Numeric readability and tabular alignment | IN SCOPE | CSS only; values and formatters unchanged |
| RTL/LTR, focus-visible, reduced motion, responsive overflow | IN SCOPE | CSS only |
| Accounting/Treasury labels, calculations, API contracts | FROZEN | no change |
| Journal/posting/account resolver/treasury mappings | FROZEN | no change |
| Tax, rounding, sign, inventory, permissions/security | FROZEN | no change |
| Gift Voucher financial mapping prevention track | OPEN / OUT OF SCOPE | not implemented or closed by UX-9 |
| Backend, DB, migrations, seeds | FORBIDDEN | zero UX-9 writes |

Expected source change is limited to scoped CSS imports/classes and the shared preview presentation hook, plus focused tests and documentation.
