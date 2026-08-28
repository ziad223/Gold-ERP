# UX-11 Document Authority Map

| Document concern | Current authority | Evidence | UX-11 rule |
|---|---|---|---|
| Invoice identity and lifecycle | Existing invoice/projection view model and source domain | `InvoiceDocument` receives `InvoicePrintViewModel` | Do not recompute or rename |
| Invoice totals/tax/payment | Existing invoice/view-model mapping and accounting authority | Templates render passed values | Presentation only |
| Receipt values | `ReceiptPreview` input invoice and receipt settings | Component source | No mapping change |
| Asset identity | Existing Asset source and tag input | `ClientAssetTagPreview` | Preserve Asset ID |
| Barcode/QR value | Stored barcode passed to `ScannableBarcode` | Barcode preview source | Preserve exact payload |
| Gift Voucher print/reprint | Existing Gift Voucher service/endpoint path | Page source comments and handler | Leave untouched |
| Reservation deposit receipt | Existing receipt/detail API payload | Reservation receipt page | Leave handler and data untouched |
| Language/direction | `renderPrintDocument` locale and component `rtl` branches | Shared renderer/components | Support AR/EN without changing content |

