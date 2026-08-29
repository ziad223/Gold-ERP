# UX-12 Full Route Surface Inventory

The current dashboard tree contains 60 `page.tsx` route surfaces. The full source enumeration was taken read-only with `rg --files "app/[locale]/(dashboard)"` and is recorded below by area.

| Area | Routes covered |
|---|---|
| Shell | dashboard, notifications, approvals, audit |
| POS/Sales | pos, sales, sales/search-print, sales/returns, sales/exchanges, sales/installments, sales/gift-vouchers, sales/reservations, sales/reservations/[id]/receipt-history, sales/reservations/receipts/[receiptId], sales/customer-gold, sales/customer-gold/drafts, sales/customer-gold/history |
| Customers/Suppliers | customers, customers/[id], customers/loyalty, suppliers, suppliers/[id], suppliers/purchases, suppliers/investment-gold |
| Inventory | inventory, inventory/[id], inventory/adjustments, inventory/diamond-jewellery, inventory/gem-stone, inventory/gold-by-piece, inventory/gold-by-weight, inventory/locations, inventory/loose-diamond, inventory/loose-gem-stone, inventory/loose-pearl, inventory/manufacturing, inventory/pearl, inventory/stock-audit, inventory/transfers, inventory/workshop |
| Gold Center | gold-center, gold-center/live-prices, gold-center/price-history, gold-center/pricing-rules, gold-center/settings/market-data |
| Accounting | accounting, accounting/chart, accounting/reports, accounting/treasury |
| Settings | settings, settings/onboarding, settings/tax, settings/users, settings/barcode-codes |
| Employees/Reports | employees, employees/[id], employees/payroll, reports, reports/exports, reports/inventory-valuation |

Representative browser regression routes were selected across every area; all 11 representative routes were exercised in each required viewport/theme/locale cell.
