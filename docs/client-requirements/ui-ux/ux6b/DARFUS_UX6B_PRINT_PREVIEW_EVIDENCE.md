# UX-6B Print / Preview Evidence

The screen preview and print document use the same `ClientBarcodeTagTemplate` and `ScannableBarcode` path. The template retains `data-print-root`; the print renderer retains `renderPrintDocument`; the permission-gated action retains `printHtmlDocument`.

The existing scoped `@media print` policy in `app/globals.css` keeps `[data-print-root]` white and uses exact print-color adjustment. UX-6B did not change it. The after tag face itself now carries the same explicit paper/ink colors, so screen Dark Mode cannot produce a dark printed label. The print button was inspected but no physical printer was triggered.

`PRINT_PREVIEW_VISUAL_PARITY = PASS`; `PRINT_BEHAVIOR_CHANGED = NO`; `PHYSICAL_PRINT_TRIGGERED = NO`.

