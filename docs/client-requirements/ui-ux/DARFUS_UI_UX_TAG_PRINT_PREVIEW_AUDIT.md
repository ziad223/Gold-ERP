# Tag / Print Preview Audit

Source evidence: `features/printing/components/BarcodePrintTemplate.tsx`, `ReceiptPrintTemplate.tsx`, barcode-tag components, print CSS, and non-production print route. Print CSS deliberately isolates printable roots and preserves light paper surfaces in dark mode.

Observed boundary: barcode/tag payload and identity are separate from presentation. The existing modernization concern `DARFUS-TAG-PREVIEW-SCALE-001` remains open: a full actual-size/zoom/readability matrix was not proven in the current read-only route sample. Classification P1 for operational print readability; do not change payload or barcode authority in UX-0.
