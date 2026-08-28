# UX-7 Authority Map

| Concern | Customer authority | Supplier authority | UX-7 result |
|---|---|---|---|
| ID/name/phone/email/address | Existing `Customer` hook/API and detail source | Existing `Supplier` hook/API and detail source | Display-only classes; values unchanged |
| Tax identity | Existing customer/supplier fields and forms | Existing supplier fields/forms | No normalization or mutation |
| Classification/status/VIP | Existing tier/status keys and permission-gated handlers | Existing category/status/rating keys and permission-gated handlers | Badge/color presentation only |
| Company/branch scope | Auth/branch context and backend | Auth/branch context and backend | Unchanged |
| Financial values | Existing customer purchase/reference display and statement source | Existing supplier reference balance/statement/accounting source | No UI recalculation |
| Sales/purchase/history links | Existing queries and links | Existing purchase/statement/document queries | Links and handlers unchanged |
| Search/filter/pagination | `useCustomers`, `DataToolbar`, existing query state | `useSuppliers`, `DataToolbar`, existing query state | Styling only |
| Permissions/actions | `usePermissions` and existing mutation calls | `usePermissions` and existing mutation calls | Preserved |
| Loading/empty/error | Existing `LoadingState`, `EmptyState`, `ErrorState` | Existing state components | Presentation shell only |

