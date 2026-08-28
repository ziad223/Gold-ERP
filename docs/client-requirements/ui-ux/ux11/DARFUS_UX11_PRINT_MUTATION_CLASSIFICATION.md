# UX-11 Print Mutation Classification

| Class | Surfaces | UX-11 action |
|---|---|---|
| A read-only preview | Invoice options preview, receipt preview, barcode preview, Asset tag preview | Source/browser inspect only |
| B browser print helper | `printHtmlDocument`, direct receipt/barcode/tag print helpers | Not invoked |
| C official print | Invoice search parent authorization flow | Preserved; not invoked |
| D audit-sensitive reprint | Gift Voucher and server-authorized invoice/reprint flows | Preserved; not invoked |
| E machine-readable | Barcode/QR/tag templates | Payload source preserved; visual frame only |
| F out of scope | Gift Voucher/CGP business/recovery/accounting changes | Not touched |

