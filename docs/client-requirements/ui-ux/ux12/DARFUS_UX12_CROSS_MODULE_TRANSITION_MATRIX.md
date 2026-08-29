# UX-12 Cross-Module Transition Matrix

| Transition | Evidence | Result |
|---|---|---|
| Dashboard → POS | direct `/ar/pos` and `/en/pos` navigation | pass |
| POS → customer/payment presentation | direct POS load with populated shell and payment area | pass; no checkout submitted |
| Inventory → asset detail/tag | direct inventory and asset detail routes; embedded tag source sweep | pass |
| Sales → invoice search/print | `/ar|en/sales/search-print` loads with populated rows and Print controls | pass; no print mutation |
| Customers ↔ Suppliers | direct populated routes in AR/EN | pass |
| Gold Center → live/history/settings | direct Gold Center family routes and health GET | pass |
| Accounting → Treasury/Reports | direct route matrix and populated journal views | pass |
| Settings → Tax/Users/Barcode | direct route matrix | pass |
| CGP → drafts/history | direct read-only route matrix | pass; no posting |

No transition was used to create, edit, post, print, receive, pay, or mutate business data.
