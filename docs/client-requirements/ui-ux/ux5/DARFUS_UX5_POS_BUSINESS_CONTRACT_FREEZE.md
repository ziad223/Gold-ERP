# DARFUS ERP — UX5 POS Business Contract Freeze

Control: `DARFUS-UIUX-UX5-POS-SALES-IMPLEMENTATION-WITH-ROLLBACK-01`
Authority source: `C:\Users\NEGM\Desktop\DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK_01.md`
Mode: `PRODUCTION_POS_VISUAL_IMPLEMENTATION_WITH_BUSINESS_CONTRACT_FREEZE_AND_FILE_SCOPED_ROLLBACK`

## Scope boundary

UX5 is limited to POS presentation: hierarchy, density, readability, responsive layout,
Arabic/English presentation, dark/light presentation, and accessibility. It does not
change business logic, routes, API contracts, tax, pricing, making-charge calculations,
payment behaviour, gift-voucher rules, inventory authority, accounting, permissions, or
database state.

## Current authority map

| Concern | Current owner | POS presentation may change | Frozen behaviour |
|---|---|---|---|
| Customer identity | `useAuth` / customer list and `/pos/customer-lookup` | arrangement, labels, empty/loading/error presentation | no customer creation; selected customer remains the invoice identity |
| Search | `DataToolbar` in `app/[locale]/(dashboard)/pos/page.tsx`; `/pos/search` in API mode | spacing, result density, focus presentation | bounded read-only search; barcode/ID/name search preserved |
| Physical item identity | Asset result from POS search | line-card/table readability | Asset/barcode identity remains authoritative |
| Legacy product compatibility | existing `Product` branch in POS page | presentation only | no global removal or business-rule change |
| Weights/karat | selected item/asset fields | labels and visual hierarchy | values and source unchanged |
| Making charge | `calculatePricing` / server pricing contract | display grouping only | `netGoldWeight × validated making charge per gram` for GBW remains unchanged |
| Discount | existing POS state and server checkout contract | display only | no calculation or permission change |
| VAT | `settings.vatRate` display and server pricing | display only | server remains tax authority; no rate/formula change |
| Gift Voucher | `GiftVoucherPaymentSection` and voucher service | presentation only | payment settlement, not discount; existing supported combinations preserved |
| Payments | `paymentOptions`, split/installment/deposit handlers | grouping and selected-state presentation | existing methods and validation unchanged |
| Totals | server pricing response rendered by POS | hierarchy and emphasis | subtotal/VAT/total values unchanged |
| Checkout | `completeSale` / draft posting path | affordance/layout only | disabled/validation/POST behaviour unchanged |
| Journal preview | `JournalPreview` consuming server response | presentation wrapper only | no client-side accounting calculations |
| Permissions/context | `useAuth`, `usePermissions`, server scope | status visibility only | Company/Branch/RBAC remain authoritative and fail closed |
| i18n/direction | `useLocale`, `dir` | AR/EN layout and text placement | AR RTL and EN LTR; no new business labels or logic |

## Explicit exclusions

- No backend, migration, database, tax, accounting, inventory, voucher, payment, or permission edits.
- No new checkout/customer/voucher/invoice mutation.
- No new sidebar entry, route, or shared component API.
- No formula or pricing change.
- No modification or reversion of the owner-accepted `next-env.d.ts` drift.

## Proposed minimum presentation change

Use the existing POS state and handlers while improving the existing page composition:

1. Keep customer/search/invoice-items/payment as the same three authority areas.
2. Increase content density and visual grouping without changing field values or actions.
3. Make the selected customer, searchable item, invoice items, payment method, totals, and checkout state scannable.
4. Preserve read-only empty-state proof when no item is selected; do not create fixture transactions.

This document is a pre-edit contract record. It authorizes no business mutation.
