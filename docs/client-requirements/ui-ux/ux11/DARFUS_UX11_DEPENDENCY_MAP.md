# UX-11 Dependency Map

```text
Source business document / view model
        ↓
InvoiceDocument / ReceiptPrintTemplate / Barcode templates
        ↓
Preview surfaces + shared print CSS
        ↓
Browser print presentation

Server-authorized invoice/Gift Voucher reprint paths remain separate
and are not changed by UX-11.
```

| Dependency | Preserved? | Evidence |
|---|---|---|
| Document source → view model | YES | Existing template props and view-model imports |
| View model → fixed-format template | YES | `InvoiceDocument` selector |
| Asset → barcode/QR display | YES | `ScannableBarcode` receives stored value |
| Permission → barcode print action | YES | `isAuthorized("printBarcode")` guards |
| Print helper → browser dialog | YES | `printHtmlDocument` unchanged |
| Server print/reprint audit → business authority | YES | No handler/API edits |

