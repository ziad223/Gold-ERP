# UX-11 Print Authority Map

| Operation | Current implementation | Authority classification | UX-11 proof/action |
|---|---|---|---|
| Build print HTML | `renderPrintDocument(element, options)` | Pure presentation transform | Source and browser preview proof |
| Browser print from rendered HTML | `printHtmlDocument` → `printWindow.print()` | Browser presentation action | Do not invoke in acceptance |
| Invoice option preview | `InvoicePrintOptionsDialog` → `InvoiceDocument` | Read-only presentation | Inspect and style only |
| Receipt preview | `ReceiptPreview` | Read-only presentation | Inspect and style only |
| Barcode preview | `BarcodeLabelPreview` | Read-only presentation; permission guard on print | Inspect and style only |
| Asset tag preview | `ClientAssetTagPreview` | Read-only presentation; permission guard on print | Inspect and style only |
| Invoice authorized print/reprint | `search-print/page.tsx` `authorizeAndPrint` | Server-authorized C/D path | Preserve; not clicked |
| Gift Voucher original/reprint | Gift Voucher page print handler | Existing business/audit path | Preserve; not clicked |
| Reservation receipt print | `window.print()` | Browser action; mutation not assumed | Preserve; not clicked |

