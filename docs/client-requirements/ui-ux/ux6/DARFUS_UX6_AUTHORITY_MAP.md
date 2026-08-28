# UX-6 Authority Map

| Concern | Current authority | Evidence | UX-6 treatment |
|---|---|---|---|
| List data | Inventory V2 Asset list | `useInventoryV2List` in `app/[locale]/(dashboard)/inventory/page.tsx:19,57` | Preserved |
| Detail data | Inventory V2 Asset detail | `useInventoryV2Detail` in `app/[locale]/(dashboard)/inventory/[id]/page.tsx:19,76` | Preserved |
| Physical identity | Asset | Page description and Asset detail contract | Preserved |
| Barcode/RFID | Existing Asset/barcode/RFID relations | list identity cells and detail RFID panel | Display only; no identity mutation added |
| Status | server `operationalStatus` plus existing localized maps/tones | list `statusLabel`; detail `lifecycleState` | Display labels improved, status transitions unchanged |
| Weight/karat/valuation/cost | server response and existing detail panels | existing Asset fields/panels | No remapping |
| Branch/location | `useBranchContext` and server-scoped response | existing page hook/context | No scope change |
| Permission | `usePermissions` | existing page action gates | No permission change |
| Search/filter/pagination | list hook params and existing handlers | `useInventoryV2List({search, profile, status, condition, tagState, page, pageSize...})` | Same query behavior |
| Workflow actions | existing canonical API handlers | return-review, revisions, selling-price, RFID paths | Unchanged |
| Loading/error/empty | existing shared states | `LoadingState`, `ErrorState`, `EmptyState` | Preserved |
| I18n/direction | `useLocale`, AR/LTR/RTL classes | list/detail locale branches | Presentation labels only |

