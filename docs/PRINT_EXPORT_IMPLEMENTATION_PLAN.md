# DARFUS Print/Export Implementation Plan

Date: 2026-06-14

## Baseline

- `npm run typecheck`: passed.
- `npm run lint`: passed with 0 errors and 9 existing warnings.
- `npm run build`: passed. Next.js warned about multiple lockfiles and inferred `C:\Users\NEGM` as workspace root.
- `npm run test:e2e`: timed out after 244 seconds before returning a pass/fail result.
- `npx playwright test --list`: found 60 visual tests in `tests/visual.spec.ts`.

## Audit Summary

- Existing direct print calls:
  - `features/sales/components/ReceiptPreview.tsx`
  - `features/barcodes/components/BarcodeLabelPreview.tsx`
  - `app/[locale]/(dashboard)/inventory/page.tsx`
- Existing export utility:
  - `lib/export-csv.ts`
- Existing export call sites:
  - `app/[locale]/(dashboard)/reports/page.tsx`
  - `app/[locale]/(dashboard)/reports/exports/page.tsx`
  - `app/[locale]/(dashboard)/sales/page.tsx`
  - `app/[locale]/(dashboard)/inventory/page.tsx`
  - `app/[locale]/(dashboard)/customers/page.tsx`
  - `app/[locale]/(dashboard)/suppliers/page.tsx`
  - `app/[locale]/(dashboard)/employees/page.tsx`
- No XLSX or PDF generation package exists in `package.json`.
- Permission model currently exposes broad operational permissions such as `viewCosts`, `viewMargins`, `viewAuditLogs`, and `manageSettings`; it does not expose named `reports.export` or `barcode.print` permissions.

## Implementation Decisions

1. Add a reusable print layer with print types, configs, a browser-isolated print service, and print templates.
2. Use an isolated print window for print actions so the application DOM, sidebar, header, filters, buttons, and modal backdrops are not printed.
3. Add a scoped print stylesheet using `data-print-root`, `.no-print`, `.print-only`, page-size classes, and document-specific classes.
4. Use `xlsx` as the single required Frontend dependency for real XLSX workbooks.
5. Do not add a PDF library in this pass. Browser-generated Arabic PDFs from the isolated print template will be exposed honestly as `Print / Save as PDF`, not as a fake `Download PDF` Blob.
6. Keep print/export templates pure: they receive domain data through props and do not access LocalStorage, fetch, API URLs, or demo arrays.
7. Add Vitest only if needed for focused unit tests around export utilities and print configuration. Prefer pure tests over visual snapshot churn.

## Planned New Files

- `lib/print/print-types.ts`: shared print option and document types.
- `lib/print/print-config.ts`: paper-size and layout configuration.
- `lib/print/print-service.ts`: isolated print-window service.
- `lib/export/export-types.ts`: shared export request/column/result types.
- `lib/export/download-file.ts`: safe browser download helper.
- `lib/export/csv-exporter.ts`: CSV generator with BOM, escaping, filename handling, and empty-state errors.
- `lib/export/xlsx-exporter.ts`: real workbook generation.
- `lib/export/export-service.ts`: format router for CSV/XLSX/PDF fallback.
- `features/printing/components/InvoicePrintTemplate.tsx`: invoice print template.
- `features/printing/components/ReceiptPrintTemplate.tsx`: receipt print template.
- `features/printing/components/BarcodePrintTemplate.tsx`: barcode label template.
- `features/printing/components/ReportPrintTemplate.tsx`: report print template.
- `features/printing/components/render-print-document.tsx`: template-to-static-HTML renderer for isolated print windows.
- `tests/export-print.spec.ts` or equivalent: focused tests for CSV, XLSX, print config, and print CSS expectations.
- `docs/PRINT_EXPORT_IMPLEMENTATION_REPORT.md`: final implementation report.

## Planned Modified Files

- `app/[locale]/(dashboard)/reports/page.tsx`: CTA visibility fix, real report datasets, CSV/XLSX/print/PDF fallback actions, removal of hardcoded demo rows.
- `app/[locale]/(dashboard)/reports/exports/page.tsx`: replace simulated jobs/progress/downloads with real local export actions and truthful PDF fallback.
- `app/[locale]/(dashboard)/inventory/page.tsx`: remove full-page print action and route barcode printing through the print layer.
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx`: pass print-safe barcode config/data to the barcode preview.
- `features/sales/components/ReceiptPreview.tsx`: reuse receipt print template and print service instead of direct current-page `window.print()`.
- `features/barcodes/components/BarcodeLabelPreview.tsx`: support mm label config, batch-safe template rendering, and print service.
- `app/globals.css`: add scoped print CSS policy.
- `lib/export-csv.ts`: keep as compatibility wrapper around the new CSV exporter.
- `messages/ar.json`: add print/export error/action labels.
- `messages/en.json`: add print/export error/action labels.
- `package.json` and `package-lock.json`: add `xlsx`; add test script/dependency only if unit tests require it.
- `docs/REPORTS_EXPORT_PRINT_DIAGNOSTIC.md`, `docs/FRONTEND_CHANGELOG.md`, `docs/FRONTEND_COMPLETION_MATRIX.md`: update with implemented outcomes.

## Execution Order

1. Install the minimal XLSX dependency.
2. Add export types, download helper, CSV exporter, XLSX exporter, and compatibility wrapper.
3. Add print types, configs, templates, static renderer, and isolated print service.
4. Add scoped print CSS.
5. Fix report CTA without broad CSS exceptions.
6. Wire reports page exports and print/PDF fallback.
7. Replace export center simulation with real local actions.
8. Wire receipt and barcode previews through the print service.
9. Replace inventory full-page print with barcode batch printing.
10. Add translation keys and error handling.
11. Add focused tests.
12. Run typecheck, lint, build, and available tests.
13. Run local browser checks for Arabic/English, dark/light CTA, downloads, and print media.

## Known Constraints

- No backend, API routes, server actions, database, or background job system will be added.
- PDF will be truthful `Print / Save as PDF` unless a reliable Arabic-capable client PDF Blob solution is proven during implementation.
- Existing visual snapshots will not be updated to hide changes.
- Existing lint warnings unrelated to this task will not be fixed unless touched code requires it.
