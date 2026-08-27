# DARFUS UI/UX UX-0 — Route Inventory

Read-only inventory derived from every `page.tsx` under `app/`. The codebase contains **68 page files**: 67 locale route templates and one non-production `app/test/print-export` page. Dashboard routes use `AuthGuard` and `lib/permissions/module-access.ts`; the permission below is the first matching rule.

| Route template | Source page | Auth | Permission | Navigation | Page type | Criticality |
|---|---|---|---|---|---|---|
| `/[locale]` | `app/[locale]/page.tsx` | public | none | none | Landing | P3 |
| `/[locale]/login` | `.../login/page.tsx` | public | none | none | Auth | P1 |
| `/[locale]/forgot-password` | `.../forgot-password/page.tsx` | public | none | none | Auth | P2 |
| `/[locale]/reset-password` | `.../reset-password/page.tsx` | public | none | none | Auth | P2 |
| `/[locale]/signup` | `.../signup/page.tsx` | public | none | none | Auth | P2 |
| `/[locale]/setup` | `.../setup/page.tsx` | public | setup flow | none | Setup | P1 |
| `/[locale]/change-password` | `.../change-password/page.tsx` | guarded | auth context | none | Form | P1 |
| `/[locale]/dashboard` | `.../dashboard/page.tsx` | guarded | `dashboard.view` | Dashboard | Dashboard | P1 |
| `/[locale]/pos` | `.../pos/page.tsx` | guarded | `pos.view`/`pos.sell` | Point of sale | Workflow | P0 |
| `/[locale]/sales` | `.../sales/page.tsx` | guarded | `sales.view` | Invoices & sales | Table | P1 |
| `/[locale]/sales/search-print` | `.../sales/search-print/page.tsx` | guarded | `sales.view` | indirect | Search/Print | P1 |
| `/[locale]/sales/returns` | `.../sales/returns/page.tsx` | guarded | `sales.view` | indirect | Workflow | P1 |
| `/[locale]/sales/exchanges` | `.../sales/exchanges/page.tsx` | guarded | `sales.view` | indirect | Workflow | P1 |
| `/[locale]/sales/installments` | `.../sales/installments/page.tsx` | guarded | `sales.view` | indirect | Table | P1 |
| `/[locale]/sales/reservations` | `.../sales/reservations/page.tsx` | guarded | `sales.view` | indirect | Workflow | P1 |
| `/[locale]/sales/reservations/[id]/receipt-history` | `.../receipt-history/page.tsx` | guarded | `sales.view` | indirect | Detail | P2 |
| `/[locale]/sales/reservations/receipts/[receiptId]` | `.../receipts/[receiptId]/page.tsx` | guarded | `sales.view` | indirect | Print/Detail | P1 |
| `/[locale]/sales/customer-gold` | `.../customer-gold/page.tsx` | guarded | `sales.view` | indirect | Workflow | P1 |
| `/[locale]/sales/customer-gold/drafts` | `.../drafts/page.tsx` | guarded | `sales.view`/CGP | Customer Gold Purchase | Table | P1 |
| `/[locale]/sales/customer-gold/history` | `.../history/page.tsx` | guarded | `sales.view` | indirect | Table | P1 |
| `/[locale]/sales/gift-vouchers` | `.../gift-vouchers/page.tsx` | guarded | `sales.view` | indirect | Table | P1 |
| `/[locale]/customers` | `.../customers/page.tsx` | guarded | `customers.view` | Customers & CRM | Table | P1 |
| `/[locale]/customers/[id]` | `.../customers/[id]/page.tsx` | guarded | `customers.view` | indirect | Detail | P1 |
| `/[locale]/customers/loyalty` | `.../customers/loyalty/page.tsx` | guarded | `customers.view` | indirect | Workflow | P2 |
| `/[locale]/inventory` | `.../inventory/page.tsx` | guarded | `inventory.view` | Assets & inventory | Table | P0 |
| `/[locale]/inventory/[id]` | `.../inventory/[id]/page.tsx` | guarded | `inventory.view` | indirect | Detail | P0 |
| `/[locale]/inventory/adjustments` | `.../adjustments/page.tsx` | guarded | `inventory.view` | indirect | Workflow | P1 |
| `/[locale]/inventory/gold-by-weight` | `.../gold-by-weight/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/gold-by-piece` | `.../gold-by-piece/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/diamond-jewellery` | `.../diamond-jewellery/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/gem-stone` | `.../gem-stone/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/pearl` | `.../pearl/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/loose-diamond` | `.../loose-diamond/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/loose-gem-stone` | `.../loose-gem-stone/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/loose-pearl` | `.../loose-pearl/page.tsx` | guarded | `inventory.view` | indirect | Form | P1 |
| `/[locale]/inventory/locations` | `.../locations/page.tsx` | guarded | `inventory.view` | indirect | Master Data | P1 |
| `/[locale]/inventory/manufacturing` | `.../manufacturing/page.tsx` | guarded | `inventory.view` | indirect | Workflow | P2 |
| `/[locale]/inventory/transfers` | `.../transfers/page.tsx` | guarded | `inventory.view` | Branch transfers | Workflow | P1 |
| `/[locale]/inventory/workshop` | `.../workshop/page.tsx` | guarded | `inventory.view` | Workshop | Workflow | P1 |
| `/[locale]/inventory/stock-audit` | `.../stock-audit/page.tsx` | guarded | `inventory.view` | Inventory Count | Workflow | P0 |
| `/[locale]/gold-center` | `.../gold-center/page.tsx` | guarded | `gold.view` | Gold Center | Dashboard | P1 |
| `/[locale]/gold-center/live-prices` | `.../live-prices/page.tsx` | guarded | `gold.view` | indirect | Table | P1 |
| `/[locale]/gold-center/price-history` | `.../price-history/page.tsx` | guarded | `gold.view` | indirect | Table | P1 |
| `/[locale]/gold-center/pricing-rules` | `.../pricing-rules/page.tsx` | guarded | `gold.view` | indirect | Settings/Table | P1 |
| `/[locale]/gold-center/settings/market-data` | `.../market-data/page.tsx` | guarded | `gold.view` | indirect | Settings | P1 |
| `/[locale]/suppliers` | `.../suppliers/page.tsx` | guarded | `suppliers.view` | Suppliers & purchases | Table | P1 |
| `/[locale]/suppliers/[id]` | `.../suppliers/[id]/page.tsx` | guarded | `suppliers.view` | indirect | Detail | P1 |
| `/[locale]/suppliers/purchases` | `.../purchases/page.tsx` | guarded | `suppliers.view` | indirect | Workflow/Table | P1 |
| `/[locale]/suppliers/investment-gold` | `.../investment-gold/page.tsx` | guarded | `suppliers.view` | indirect | Workflow | P1 |
| `/[locale]/accounting` | `.../accounting/page.tsx` | guarded | `accounting.view` | Accounting | Dashboard | P0 |
| `/[locale]/accounting/chart` | `.../chart/page.tsx` | guarded | `accounting.view` | Chart of accounts | Master Data | P0 |
| `/[locale]/accounting/reports` | `.../reports/page.tsx` | guarded | `accounting.view` | Financial statements | Report | P0 |
| `/[locale]/accounting/treasury` | `.../treasury/page.tsx` | guarded | `treasury.view` | Treasury | Table/Workflow | P0 |
| `/[locale]/reports` | `.../reports/page.tsx` | guarded | `reports.view` | Reports & analytics | Report | P1 |
| `/[locale]/reports/inventory-valuation` | `.../inventory-valuation/page.tsx` | guarded | `reports.view` | indirect | Report | P0 |
| `/[locale]/reports/exports` | `.../exports/page.tsx` | guarded | `reports.view` | indirect | Export | P2 |
| `/[locale]/notifications` | `.../notifications/page.tsx` | guarded | `notifications.view` | indirect | Table | P2 |
| `/[locale]/employees` | `.../employees/page.tsx` | guarded | employee permission set | Employees | Table/Form | P1 |
| `/[locale]/employees/[id]` | `.../employees/[id]/page.tsx` | guarded | employee permission set | indirect | Detail/Form | P1 |
| `/[locale]/employees/payroll` | `.../payroll/page.tsx` | guarded | employee permission set | indirect | Workflow | P1 |
| `/[locale]/settings` | `.../settings/page.tsx` | guarded | `settings.view` | Settings | Settings | P1 |
| `/[locale]/settings/users` | `.../users/page.tsx` | guarded | `users.view` | System Accounts | Master Data | P1 |
| `/[locale]/settings/tax` | `.../tax/page.tsx` | guarded | `settings.view` | indirect | Settings | P0 |
| `/[locale]/settings/barcode-codes` | `.../barcode-codes/page.tsx` | guarded | `settings.view` | indirect | Settings | P0 |
| `/[locale]/settings/onboarding` | `.../onboarding/page.tsx` | guarded | `settings.view` | indirect | Setup | P1 |
| `/[locale]/audit` | `.../audit/page.tsx` | guarded | `audit.view` | Audit log | Audit | P0 |
| `/[locale]/approvals` | `.../approvals/page.tsx` | guarded | `approvals.view` | Approvals | Queue | P1 |
| `/test/print-export` | `app/test/print-export/page.tsx` | none | non-production test page | none | Print/Preview | P2 |

Runtime note: exact navigations were exercised for critical families in both locales. A subset rendered a guarded `Branch readiness required` state, and those states are recorded as runtime evidence rather than treated as page failures.
