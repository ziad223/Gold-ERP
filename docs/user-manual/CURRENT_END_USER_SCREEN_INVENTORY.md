# DARFUS ERP - Current End-User Screen Inventory

Audit date: 2026-08-23  
Source: current route files, current sidebar, AR/EN translations, permission checks, and read-only runtime navigation at `http://localhost:3000`.

## Coverage decision

- 68 route files were discovered under the current application.
- 63 operational/admin/customer-facing runtime surfaces were captured in Arabic and English; the capture set includes the sidebar screens, all currently exposed inventory profiles, key detail dialogs, the unified intake chooser, POS cart/journal preview, and responsive POS views.
- The five non-manual routes are authentication/utility surfaces: landing redirect, signup, forgot/reset password, change-password, and the print-export test surface. Login and first-run setup were captured separately for reference but are documented only where relevant to an administrator.
- Dynamic record pages are represented by read-only captures of accepted local synthetic records: one Asset, one Supplier, one Customer, and one Invoice detail dialog.
- No screenshot used a new business mutation. POS screenshots use a pre-existing Asset selected into a client-side cart only.

## Sidebar and primary screens

| Module | Arabic name | English name | Route | Role/permission visibility | Mutation actions? | Screenshot | Manual chapter |
|---|---|---|---|---|---:|---:|---|
| Overview | لوحة التحكم | Dashboard | `/dashboard` | Dashboard access | No | Yes | Dashboard and basics |
| POS | نقطة البيع | Point of Sale | `/pos` | POS view/sell | Yes | Yes | POS |
| Sales | الفواتير والمبيعات | Invoices & sales | `/sales` | Sales view | No | Yes | Invoices and sales |
| Customers | العملاء وCRM | Customers & CRM | `/customers` | Customer view; create/update actions are permission-gated | Yes | Yes | Customers |
| CGP | شراء الذهب من العميل | Customer Gold Purchase | `/sales/customer-gold/drafts` | CGP/sales view | Yes | Yes | CGP |
| Inventory | الأصول والمخزون | Assets & inventory | `/inventory` | Inventory view | Yes | Yes | Inventory |
| Transfers | تحويلات الفروع | Branch transfers | `/inventory/transfers` | Transfer read/create/approve actions | Yes | Yes | Transfers |
| Workshop | الورشة | Workshop | `/inventory/workshop` | Workshop read/send/return actions | Yes | Yes | Workshop |
| Count | جرد المخزون | Inventory Count | `/inventory/stock-audit` | Count read/create/complete/close actions | Yes | Yes | Inventory count |
| Gold Center | مركز الذهب | Gold Center | `/gold-center` | Gold view | No | Yes | Gold Center |
| Suppliers | الموردون والمشتريات | Suppliers & purchases | `/suppliers` | Supplier view; create/update/payment actions are permission-gated | Yes | Yes | Suppliers |
| Accounting | الحسابات والمالية | Accounting | `/accounting` | Accounting view; posting actions are permission-gated | Yes | Yes | Accounting |
| Chart | دليل الحسابات | Chart of accounts | `/accounting/chart` | Accounting view | Yes | Yes | Accounting |
| Statements | القوائم المالية | Financial statements | `/accounting/reports` | Accounting view | No | Yes | Accounting |
| Treasury | الخزنة | Treasury | `/accounting/treasury` | Treasury view/actions are permission-gated | Yes | Yes | Treasury |
| Reports | التقارير والتحليلات | Reports & analytics | `/reports` | Reports view | No | Yes | Reports |
| Employees | الموظفون والصلاحيات | Employees & permissions | `/employees` | Employee/permission admin access | Yes | Yes | Users and permissions |
| Accounts | حسابات النظام | System Accounts | `/settings/users` | User/account admin access | Yes | Yes | Users and permissions |
| Audit | سجل التدقيق | Audit log | `/audit` | Audit view | No | Yes | Audit |
| Approvals | طلبات الاعتماد | Approvals Inbox | `/approvals` | Approval view/action | Yes | Yes | Approvals |
| Settings | الإعدادات | Settings | `/settings` | Settings view | Yes | Yes | Settings |

## Inventory profile screens

All eight current profile routes use the canonical Inventory intake entry point. The user chooses the profile from **Inventory -> Add / Receive Inventory**; the profile screen then shows its own fields. The five business authorities are documented without exposing internal strategy codes.

| Profile | Arabic screen | English screen | Route | Screenshot | Manual chapter |
|---|---|---|---|---:|---|
| Gold By Weight | إضافة ذهب بالوزن | Add Gold By Weight | `/inventory/gold-by-weight` | Yes | Inventory profiles |
| Gold By Piece | إضافة ذهب بالقطعة | Add Gold By Piece | `/inventory/gold-by-piece` | Yes | Inventory profiles |
| Diamond Jewellery | إضافة مجوهرات ألماس | Add Diamond Jewellery | `/inventory/diamond-jewellery` | Yes | Inventory profiles |
| Loose Diamond | إضافة ألماس حر | Add Loose Diamond | `/inventory/loose-diamond` | Yes | Inventory profiles |
| Gem Stone Jewellery | مجوهرات الأحجار الكريمة | Gem Stone Jewellery | `/inventory/gem-stone` | Yes | Inventory profiles |
| Loose Gem Stone | إضافة حجر كريم حر | Add Loose Gem Stone | `/inventory/loose-gem-stone` | Yes | Inventory profiles |
| Pearl Jewellery | مجوهرات اللؤلؤ | Pearl Jewellery | `/inventory/pearl` | Yes | Inventory profiles |
| Loose Pearl | إضافة لؤلؤ منفرد | Add Loose Pearl | `/inventory/loose-pearl` | Yes | Inventory profiles |

## Additional exposed screens

| Area | Current routes covered by source/runtime audit |
|---|---|
| Inventory administration | `/inventory/locations`, `/inventory/adjustments`, `/inventory/manufacturing`, `/inventory/[id]` |
| Supplier history | `/suppliers/purchases`, `/suppliers/investment-gold`, `/suppliers/[id]` |
| Sales support | `/sales/search-print`, `/sales/reservations`, `/sales/returns`, `/sales/exchanges`, `/sales/installments`, `/sales/gift-vouchers` |
| CGP history | `/sales/customer-gold/history`, `/sales/customer-gold` |
| Gold Center detail | `/gold-center/live-prices`, `/gold-center/price-history`, `/gold-center/pricing-rules`, `/gold-center/settings/market-data` |
| Reports | `/reports/inventory-valuation`, `/reports/exports` |
| Customers and people | `/customers/[id]`, `/customers/loyalty`, `/employees/[id]`, `/employees/payroll` |
| Settings | `/settings/onboarding`, `/settings/tax`, `/settings/barcode-codes` |
| Notifications | `/notifications` |
| Reservation details | `/sales/reservations/[id]/receipt-history`, `/sales/reservations/receipts/[receiptId]` |

## Screens not presented as normal end-user chapters

The following current route files are not normal operational screens and are not presented as customer workflow instructions: `/`, `/signup`, `/forgot-password`, `/reset-password`, `/change-password`, `/test/print-export`. Login and setup are shown only for the administrator quick-start context. A route that is not visible to a role remains permission-hidden and is not treated as a missing product action.

## Runtime observations

- The sidebar uses the current company and branch context in the header; the selected branch is visible before business actions.
- Arabic is RTL and English is LTR. Labels were taken from the corresponding runtime, not translated from the other language.
- The inventory intake chooser is a single entry point. Profile screens do not create a second supplier workflow.
- POS Journal Preview is read-only and was captured before checkout; no sale was completed during this documentation batch.
