# UX-6B Tag / Barcode Authority Map

| Concern | Authority / source | Result |
|---|---|---|
| Asset detail entry | `app/[locale]/(dashboard)/inventory/[id]/page.tsx` | Existing Asset detail preserved |
| Preview wrapper | `features/inventory/components/ClientAssetTagPreview.tsx` | Builds `assetToTagData` and renders shared template |
| Tag data | `lib/print/barcode-label.ts` via `assetToTagData` | Unchanged |
| Tag layout | `features/printing/components/ClientBarcodeTagTemplate.tsx` and front/back components | Only face surface CSS changed |
| Barcode encoding | `features/printing/components/ScannableBarcode.tsx`, bwip-js CODE128/QR | Unchanged |
| Print surface | `data-print-root` + `renderPrintDocument` + `printHtmlDocument` | Unchanged |
| Print CSS | `app/globals.css` scoped `@media print` rules | Unchanged |
| Theme | application `.dark` ancestor | No longer recolors the inner tag face |
| Permission | `isAuthorized("printBarcode")` | Unchanged |
| Business/identity | Asset ID, stored Barcode, profile data | Unchanged |

