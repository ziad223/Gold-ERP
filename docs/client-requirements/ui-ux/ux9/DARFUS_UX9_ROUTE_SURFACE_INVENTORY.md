# UX-9 Route / Surface Inventory

| Surface | Route | Current source | Data behavior | UX-9 treatment |
|---|---|---|---|---|
| Accounting overview | `/ar/accounting`, `/en/accounting` | `app/[locale]/(dashboard)/accounting/page.tsx` | Journal, statements, trial balance, reconciliation reads; manual draft/post/reverse/cancel controls exist | Scoped presentation styling only; write controls unchanged |
| Chart of accounts | `/ar/accounting/chart`, `/en/accounting/chart` | `.../accounting/chart/page.tsx` | Account/readiness/mapping reads; account and mapping forms are permission guarded | Scoped presentation styling only |
| Financial statements | `/ar/accounting/reports`, `/en/accounting/reports` | `.../accounting/reports/page.tsx` | GET income statement/balance sheet on Run reports | Scoped presentation styling only |
| Treasury | `/ar/accounting/treasury`, `/en/accounting/treasury` | `.../accounting/treasury/page.tsx` | GET summary, transactions, registers, closings; mutation actions remain present and uninvoked | Scoped presentation styling only |
| Embedded journal preview | shared component | `features/accounting/components/JournalPreview.tsx` | Displays server preview lines and balance state | Presentation class only |

No new route, endpoint, workflow, or financial action is introduced.
