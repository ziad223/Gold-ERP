# UX-9 Treasury Authority Map

| Concern | Authority | Evidence |
|---|---|---|
| Register state | `cash-register.service.js` and `/treasury/register/*` routes | current/open/register routes and service |
| Treasury reads | `/treasury/summary`, `/treasury/transactions`, `/treasury/closings` | ERP routes; `useTreasury` |
| Cash movement writes | `/treasury/transactions`, permission `treasury.update` | ERP route guard; not called in UX-9 |
| Closing writes | `/treasury/closing`, permission `treasury.update` | ERP route guard; not called in UX-9 |
| Cash/bank account resolution | `resolveTreasuryAccount` → explicit branch financial mapping | ERP route and resolver |
| UI | `accounting/treasury/page.tsx` | action buttons and GET state remain behaviorally unchanged |

No Treasury mutation, account mapping, payment, posting, or register state transition is part of UX-9.
