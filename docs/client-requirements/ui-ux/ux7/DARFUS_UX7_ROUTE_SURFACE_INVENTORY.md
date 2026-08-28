# UX-7 Route / Surface Inventory

| Route | Authority | Purpose | Data source | Mutating actions | Permission | Risk |
|---|---|---|---|---|---|---|
| `/[locale]/customers` | `customers/page.tsx` + `useCustomers` | Customer list/search/filter/pagination | Existing customer hook/API | create/edit/deactivate/reactivate/delete handlers preserved | Existing `customers.*` permissions | B |
| `/[locale]/customers/[id]` | customer detail page + `useCustomer` | identity, contact, address, history, KYC and read panels | Existing customer/detail/statement queries | existing edit/address/KYC/attachment actions preserved | Existing permission gates | C |
| `/[locale]/customers/loyalty` | existing loyalty page | loyalty/segments navigation target | Existing page | not changed | Existing | D/deferred |
| `/[locale]/suppliers` | `suppliers/page.tsx` + `useSuppliers` | supplier list/search/filter/pagination | Existing supplier hook/API | create/edit/deactivate/reactivate/delete handlers preserved | Existing `suppliers.*` permissions | B |
| `/[locale]/suppliers/[id]` | supplier detail page + `useSupplier` | supplier identity, purchases, statement, documents and consignment panels | Existing supplier/detail/accounting queries | existing payment/reversal/document/consignment actions preserved | Existing permission gates | C |
| `/[locale]/suppliers/purchases` | existing legacy/read surface | purchase history/receive compatibility surface | Existing page | not changed in UX-7 | Existing | D/deferred |

