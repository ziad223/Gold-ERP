# UX-11 Print Component Inventory

| Component | Authority | Current evidence | Allowed UX-11 change |
|---|---|---|---|
| `render-print-document.tsx` | Shared HTML document wrapper | Adds lang/dir/title and shared CSS; renders static markup | No business change; preserve contract |
| `lib/print/print-config.ts` | Fixed-format print CSS | A4/A5/thermal/barcode sizes, white print root, print media isolation | Presentation-only color isolation hardening |
| `InvoiceDocument.tsx` | Template selector | Selects existing templates and passes view model | Do not alter selector/data |
| Invoice templates | Document presentation | Fixed layouts; values from existing view model | Preserve fields/order/identities; scoped CSS only |
| `InvoicePrintOptionsDialog.tsx` | Preview/options UI | Display-only options, parent owns print callback | Improve viewport/focus containment only |
| `ReceiptPreview.tsx` | Receipt preview/print UI | Displays existing invoice/settings values; print helper | Improve readable frame and overflow only |
| `BarcodeLabelPreview.tsx` | Barcode/QR preview/print UI | Uses stored `barcode` with `ScannableBarcode`; permission guard | Improve machine-readable frame only |
| `ClientAssetTagPreview.tsx` | Asset tag preview/print UI | Uses AssetTag data and active barcode unchanged | Improve preview viewport only |
| `ScannableBarcode.tsx` | Barcode/QR renderer | `bwip-js`, CODE128/QR, supplied value | No payload or format change |

