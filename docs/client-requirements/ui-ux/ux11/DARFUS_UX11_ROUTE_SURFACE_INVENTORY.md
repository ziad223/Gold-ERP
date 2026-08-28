# UX-11 Route / Surface Inventory

| Surface | Route/source | Read/print behavior | UX-11 treatment | Mutation risk |
|---|---|---|---|---|
| Unified invoice search/detail | `app/[locale]/(dashboard)/sales/search-print/page.tsx` | GET/search/detail; parent can authorize print/reprint | Preserve handlers; improve preview presentation only | Official print/reprint call not invoked |
| POS receipt | `features/sales/components/ReceiptPreview.tsx` | Read-only preview; direct browser print helper | Apply scoped preview surface/frame classes | No app API from preview/print helper |
| Barcode label | `features/barcodes/components/BarcodeLabelPreview.tsx` | Read-only Asset/barcode/QR preview; permission-guarded print helper | Apply scoped machine-readable presentation classes | No identity generation/change |
| Client Asset tag | `features/inventory/components/ClientAssetTagPreview.tsx` | Read-only Asset tag preview; permission-guarded print helper | Apply scoped preview viewport classes | No Asset/barcode mutation |
| Invoice templates | `features/printing/components/InvoiceDocument.tsx` and templates | Fixed-format document rendering from view model | Add no business mapping; protect fixed-format CSS | No mutation |
| Reservation receipt | `app/[locale]/(dashboard)/sales/reservations/receipts/[receiptId]/page.tsx` | Read/detail and `window.print()` | No handler change; no print click | Mutation semantics not assumed |
| Gift Voucher list | `app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx` | Existing original/reprint audit path | Do not change business/reprint flow | Not invoked |
| Print test fixture | `app/test/print-export/page.tsx` | Fixture preview | Used only if served by current runtime | No business data |

