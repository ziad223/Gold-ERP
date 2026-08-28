# UX-9 Accounting Authority Map

| Concern | Authority | Evidence |
|---|---|---|
| Journal source/state | ERP journal routes and `JournalEntry`/`JournalLine` services | `backend/src/routes/erp.routes.js`, `backend/src/services/journal.service.js` |
| Posting | `posting.service.js` with balanced double-entry checks | service comments and posting implementation |
| Account selection | `financial-account-resolver.service.js` and explicit branch/semantic mappings | resolver requires company, branch, active compatible account |
| Account catalog | `financial-account-catalog.service.js` | catalog imported by resolver/posting |
| Reports | `financial-reporting.service.js`, posted ledger lines | service exports `incomeStatement`, `balanceSheet` |
| UI reads | accounting hooks/repositories and page components | GET-backed hooks in source |

UX-9 changes no authority or meaning; it changes only visual grouping, spacing, alignment, and focus treatment.
