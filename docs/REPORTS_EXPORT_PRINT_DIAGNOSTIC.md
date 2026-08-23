# DARFUS Reports, Export, and Print Diagnostic

Date: 2026-06-14  
Mode: Read-only diagnostic. No source-code fixes were applied.

Implementation follow-up: these diagnostic findings were implemented later on 2026-06-14. See `docs/PRINT_EXPORT_IMPLEMENTATION_REPORT.md` for the final fix summary, verification commands, and remaining notes. The issue register below is preserved as the original diagnostic baseline.

## 0. Implementation Status After Follow-up

| Original ID | Final status | Implementation note |
| -- | -- | -- |
| REP-UI-001 | Fixed | Report CTA now uses semantic button colors and was verified in Arabic and English. |
| EXP-PDF-001 | Addressed with fallback | PDF is exposed honestly as isolated `Print / Save as PDF`; no fake PDF Blob is generated. |
| EXP-XLSX-001 | Fixed | Added `xlsx` and real client-side workbook generation. |
| EXP-CSV-001 | Fixed | Report exports now use live frontend data instead of hardcoded demo rows. |
| EXP-CSV-002 | Fixed | Export-center jobs now generate CSV/XLSX and expose real file names/download actions. |
| PRN-RCP-001 | Fixed | Receipt printing now uses the shared isolated print service. |
| PRN-BC-001 | Fixed | Barcode preview now renders isolated label print documents. |
| PRN-GEN-001 | Fixed | Inventory print action now prints selected/filtered barcode labels, not the dashboard page. |
| PRN-LAY-001 | Fixed | Dashboard shell/header/sidebar are tagged and hidden through scoped print CSS. |

## 1. Executive Summary

This inspection found three primary problem clusters:

- Blank report builder button: confirmed dark-mode color collision. The button text exists in both Arabic and English, but in dark mode the global `.dark .text-navy-950` override turns the text near-white while the button background remains white.
- PDF/XLSX export failures: confirmed missing implementation. The export center simulates jobs and marks completed jobs with `downloadUrl: "#"`, but its Download button has no handler or link. No PDF/XLSX libraries are present in `package.json` or `package-lock.json`.
- Printing full application screen: confirmed direct `window.print()` usage in barcode/inventory flows and partial isolation in receipt printing. There is no shared print layer, no dedicated print routes, and no global print CSS hiding dashboard chrome.

`npm run lint` was run because it is read-only. It returned 0 errors and 9 warnings unrelated to the requested export/print/report defects. `npm run typecheck` and `npm run build` were not run because the project has `incremental: true` in `tsconfig.json` and build/typecheck can update generated artifacts such as `tsconfig.tsbuildinfo` or `.next`, which conflicts with the "report only" constraint.

## 2. Scope Inspected

Files and areas inspected:

- Reports pages: `app/[locale]/(dashboard)/reports/page.tsx`, `app/[locale]/(dashboard)/reports/exports/page.tsx`.
- Export utility: `lib/export-csv.ts`.
- Export call sites: `app/[locale]/(dashboard)/reports/page.tsx`, `app/[locale]/(dashboard)/sales/page.tsx`, `app/[locale]/(dashboard)/inventory/page.tsx`, `app/[locale]/(dashboard)/customers/page.tsx`, `app/[locale]/(dashboard)/suppliers/page.tsx`, `app/[locale]/(dashboard)/employees/page.tsx`.
- Print call sites: `features/sales/components/ReceiptPreview.tsx`, `features/barcodes/components/BarcodeLabelPreview.tsx`, `app/[locale]/(dashboard)/inventory/page.tsx`.
- Modal/layout/chrome: `components/ui/modal.tsx`, `components/layout/app-shell.tsx`, `components/layout/header.tsx`, `components/layout/sidebar.tsx`, `app/[locale]/(dashboard)/layout.tsx`.
- Shared UI/CSS: `components/ui/button.tsx`, `components/ui/page-header.tsx`, `app/globals.css`, `tailwind.config.ts`.
- Translations: `messages/ar.json`, `messages/en.json`.
- Packages: `package.json`, `package-lock.json`.

Search terms used included `window.print`, `print(`, `@media print`, `print:hidden`, `print:block`, `export`, `pdf`, `xlsx`, `excel`, `csv`, `blob`, `download`, `receipt`, `invoice`, and `barcode`.

## 3. Issue Register

| ID | Problem | Severity | Status | File | Likely cause |
| -- | ------- | -------- | ------ | ---- | ------------ |
| REP-UI-001 | Blank white report builder button in dark mode | High | Confirmed | `app/[locale]/(dashboard)/reports/page.tsx` | `bg-white text-navy-950` collides with global `.dark .text-navy-950` override |
| EXP-PDF-001 | PDF export does not generate/download a PDF | High | Confirmed | `app/[locale]/(dashboard)/reports/exports/page.tsx` | Simulated job only; no PDF library, generator, Blob, route, or download handler |
| EXP-XLSX-001 | XLSX export does not generate/download XLSX | High | Confirmed | `app/[locale]/(dashboard)/reports/exports/page.tsx` | Simulated job only; no XLSX/Excel library or workbook code |
| EXP-CSV-001 | Report card export produces demo CSV, not report data | Medium | Confirmed | `app/[locale]/(dashboard)/reports/page.tsx` | `exportReport` exports three hardcoded metric rows |
| EXP-CSV-002 | Completed export-center Download button does nothing | High | Confirmed | `app/[locale]/(dashboard)/reports/exports/page.tsx` | Button is not wired to `job.downloadUrl`, `href`, or click handler |
| PRN-RCP-001 | Receipt print depends on page-level `window.print()` | Medium | Partially confirmed | `features/sales/components/ReceiptPreview.tsx` | Local CSS isolates receipt but still prints current page/modal context |
| PRN-BC-001 | Barcode print prints current UI screen | High | Confirmed | `features/barcodes/components/BarcodeLabelPreview.tsx` | Direct `window.print()` with no print container or print CSS |
| PRN-GEN-001 | Inventory print button prints the whole inventory page | High | Confirmed | `app/[locale]/(dashboard)/inventory/page.tsx` | Direct `window.print()` from dashboard page action |
| PRN-LAY-001 | Dashboard chrome can leak into print | High | Confirmed | `components/layout/app-shell.tsx`, `header.tsx`, `sidebar.tsx`, `app/globals.css` | No global `@media print` rules hiding shell/header/sidebar |

## 4. Blank Button Diagnostic

Symptom: in the reports banner titled "أنشئ تقريرك دون تعديل الكود" / "Build reports without changing code", the white CTA can appear blank.

Reproduction steps:

1. Open Arabic or English reports page.
2. Enable dark mode.
3. Inspect the banner CTA on the dark gradient card.

Evidence:

- `app/[locale]/(dashboard)/reports/page.tsx:53` renders the banner CTA as `<Button ... className="bg-white text-navy-950 ...">{t("customReport")}</Button>`.
- `messages/ar.json:520` defines `"customReport": "إنشاء تقرير مخصص"`.
- `messages/en.json:520` defines `"customReport": "Create custom report"`.
- `components/ui/button.tsx:15-23` merges the primary button classes and the caller `className`; the text is not conditionally hidden.
- `app/globals.css:149-151` defines `.dark .text-navy-950 { color: rgb(var(--foreground)); }`.
- `app/globals.css:51-53` sets dark foreground to `241 245 249`, a near-white value.
- No `text-transparent`, `opacity-0`, missing icon, fixed-width truncation, or `overflow-hidden` hiding the CTA text was found on this button.

Exact component: `ReportsPage`.

Exact line range: `app/[locale]/(dashboard)/reports/page.tsx:50-54`, with the decisive class on line 53.

Root cause: confirmed CSS color override in dark mode. The button background remains white via `bg-white`, while the text class `text-navy-950` is overridden in dark mode to near-white by the global hardcoded palette safety net. This makes existing translated text visually disappear.

Confidence level: High.

Arabic/English impact: both locales are affected because both use the same CTA class and both translation values exist.

Desktop/Mobile impact: likely both, because the CSS rule is not viewport-specific.

Recommended fix options:

- Use a semantic foreground class on this CTA that is not globally overridden, such as a dedicated dark text token for white-surface buttons. Risk: low, one CTA-specific change.
- Scope the global dark hardcoded palette overrides so they do not affect elements explicitly placed on white backgrounds. Risk: medium, because many legacy hardcoded navy classes may rely on that safety net.
- Add an explicit dark-mode class to the CTA, for example keeping dark text when `bg-white` is present. Risk: low but local and less systemic.

No implementation was performed.

## 5. PDF Export Diagnostic

Current execution flow:

- `app/[locale]/(dashboard)/reports/exports/page.tsx:133-145` lets the user select `PDF` as a format.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:44-70` calls `handleStartExport`, which only starts a `setTimeout`.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:73-94` simulates progress with `setInterval`.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:79-82` marks the job completed and sets `downloadUrl: "#"`.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:198-203` renders a Download button with no `onClick`, no `href`, and no `download` attribute.

Root cause: confirmed placeholder implementation. There is no PDF generation flow.

Package evidence:

- `package.json` has no `jspdf`, `pdfmake`, `html2canvas`, `puppeteer`, `playwright-pdf`, or similar PDF generation dependency.
- `package-lock.json` search found no PDF generation packages.

Data/RTL/font concerns:

- No PDF document model exists, so Arabic font embedding, RTL shaping, table pagination, page size, and document metadata are not handled.
- There is no `application/pdf` Blob creation and no object URL lifecycle for PDF.
- There is no error handling path because there is no PDF operation to fail; the current simulation cannot surface browser console or generation errors.

Recommended approaches:

- Minimal: remove/disable PDF selection until a real PDF generator exists, or route it to a clearly labeled "coming soon" state.
- Client-side: generate PDF from a structured report model using a library that supports Arabic fonts and RTL after validating bundle size.
- Server-side later: generate printable PDFs from data/templates in an API/backend layer for stronger typography, pagination, and auditability.

No implementation was performed.

## 6. Excel Export Diagnostic

Current execution flow:

- `app/[locale]/(dashboard)/reports/exports/page.tsx:17` models format as `"CSV" | "XLSX" | "PDF"`.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:38` defaults to `XLSX`.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:44-94` simulates job creation/progress for all formats.
- `app/[locale]/(dashboard)/reports/exports/page.tsx:198-203` displays a Download button with no actual download behavior.

Whether output is real XLSX: no. No workbook or worksheet code exists.

Package evidence:

- `package.json` has no `xlsx`, `exceljs`, or SheetJS package.
- `package-lock.json` search found no XLSX/Excel generation package.

CSV handling:

- `lib/export-csv.ts:1-12` is the only real file-export utility found.
- It creates `text/csv;charset=utf-8` and prepends BOM via `new Blob(["\ufeff", content], ...)`, which helps Arabic in Excel.
- It quotes every cell and escapes double quotes. New lines inside values are not normalized, but quoted CSV should remain parseable in common spreadsheet tools.
- It uses comma delimiter, which may be acceptable but can conflict with locales expecting semicolon.
- `lib/export-csv.ts:2` silently returns on empty rows, so empty report export produces no feedback.
- `lib/export-csv.ts:8-12` creates an anchor, clicks it, and revokes the URL. The anchor is not appended to DOM, which usually works in modern browsers but can be less robust.
- The row type is `Record<string, string | number>`, so object-valued fields are excluded at type level in TypeScript call sites.

Data mapping observations:

- Reports: `app/[locale]/(dashboard)/reports/page.tsx:44-48` exports hardcoded rows, not actual filtered report data.
- Sales: `app/[locale]/(dashboard)/sales/page.tsx:35-43` computes filtered invoices and line 63 exports the filtered set.
- Inventory: `app/[locale]/(dashboard)/inventory/page.tsx:205-229` exports filtered inventory data.
- Customers/Suppliers/Employees: `customers/page.tsx:156-168`, `suppliers/page.tsx:177-190`, and `employees/page.tsx:190-203` export the full in-memory collections, not necessarily current filtered rows.

Recommended approaches:

- Introduce an explicit `exportCsv` result/error path for empty datasets and failed downloads.
- Add a real XLSX service only after choosing a library and validating Arabic/RTL, numeric formatting, dates, currency, and weights.
- Keep CSV and XLSX as separate output paths; do not rename CSV as `.xlsx`.

No implementation was performed.

## 7. Printing Diagnostic

### Invoice Printing

Current print trigger: no dedicated invoice print trigger was found in `app/[locale]/(dashboard)/sales/page.tsx`. The sales invoice modal at `sales/page.tsx:95-97` is a view-only modal.

Printed DOM scope: not applicable for a dedicated invoice route because no invoice print route/component was found.

Print CSS status: no invoice-specific A4/A5 print CSS found.

Layout leakage: if invoice printing is added by direct `window.print()` to the current dashboard modal, `AppShell`, `Header`, `Sidebar`, modal backdrop, and page content are at risk of printing because global print isolation does not exist.

Target element: none defined for invoice printing.

Root cause: missing dedicated invoice printable component/route.

Recommended architecture: create an invoice print template driven by invoice ID and render it either inside an isolated print route or through a ref-based print layer.

No implementation was performed.

### Receipt Printing

Current print trigger: `features/sales/components/ReceiptPreview.tsx:29-31` calls `window.print()`.

Printed DOM scope: current browser page. The component attempts to isolate `#print-receipt-container`.

Print CSS status:

- `ReceiptPreview.tsx:58-86` injects local `@media print`.
- `ReceiptPreview.tsx:64-69` hides `body *` by visibility and makes `#print-receipt-container` visible.
- `ReceiptPreview.tsx:70-81` positions the receipt at top-left and sets width to `80mm`.

Layout leakage:

- The receipt is inside `Modal` from `components/ui/modal.tsx:41-57`, which is portaled to `document.documentElement` with a fixed backdrop and panel.
- Visibility-based hiding usually prevents visible dashboard chrome, but fixed modal wrappers/backdrop/layout boxes may still affect print layout because they are hidden by visibility, not removed by display.
- No page size, print margins, 58mm fallback, or thermal-printer-specific `@page` rule exists.

Target element: `#print-receipt-container` at `ReceiptPreview.tsx:52-55`.

Root cause: partial local print isolation, still triggered globally with `window.print()`.

Recommended architecture: move receipt printing to a dedicated print route or reusable print service with thermal page sizes and a template outside modal backdrop/layout wrappers.

No implementation was performed.

### Barcode Printing

Current print trigger: `features/barcodes/components/BarcodeLabelPreview.tsx:31-33` calls `window.print()`.

Printed DOM scope: the entire current page.

Print CSS status: no `@media print`, no `print:hidden`, no `@page`, no barcode label page breaks.

Layout leakage:

- `inventory/[id]/page.tsx:284-295` renders `BarcodeLabelPreview` inside `Modal`.
- `components/ui/modal.tsx:42-44` wraps the label in a fixed overlay/backdrop and panel.
- Because no barcode print CSS exists, sidebar/header/modal chrome can print with the label.

Target element: the preview label exists visually at `BarcodeLabelPreview.tsx:42-88`, but it has no stable print id/class.

Root cause: direct current-page print with no label isolation.

Recommended architecture: dedicated label template with mm dimensions, batch support, page breaks, and a print-only route or ref-based print container.

No implementation was performed.

### Report Printing

Current print trigger: no report print button was found in `reports/page.tsx` or `reports/exports/page.tsx`.

Printed DOM scope: no dedicated report print flow exists. If users use browser print, the full dashboard page is printed.

Print CSS status: no global or report-specific print CSS found in `app/globals.css`.

Layout leakage:

- Reports page contains filters, report cards, modals, actions, and dashboard chrome.
- There is no print-only report container, landscape handling, table pagination, or chart-specific print support.

Target element: none.

Root cause: missing report print architecture.

Recommended architecture: report templates separate from interactive report browsing, with optional landscape mode for wide tables and SVG/chart verification.

No implementation was performed.

### General Print Behavior

Current direct print uses found:

- `features/sales/components/ReceiptPreview.tsx:30`
- `features/barcodes/components/BarcodeLabelPreview.tsx:32`
- `app/[locale]/(dashboard)/inventory/page.tsx:302`

Global shell/chrome:

- `app/[locale]/(dashboard)/layout.tsx:6-8` wraps dashboard pages in `AppShell`.
- `components/layout/app-shell.tsx:31` renders `Sidebar`.
- `components/layout/app-shell.tsx:44` renders `Header`.
- `components/layout/app-shell.tsx:45` renders dashboard `main`.
- `components/layout/header.tsx:54-116` contains sticky header UI.
- `components/layout/sidebar.tsx:100-174` contains fixed sidebar UI.
- `app/globals.css` has no global `@media print` rule.

Root cause: no shared print boundary or global print policy.

No implementation was performed.

## 8. Architecture Assessment

Dedicated printable component:

- Pros: reusable, testable, can share data models with PDF/export.
- Cons: still needs a reliable trigger and isolation policy.

Dedicated print route:

- Pros: best isolation from dashboard chrome, easy A4/80mm/page-size control, good for browser print and future server PDF.
- Cons: requires route/data loading design and permission checks.

`react-to-print` or equivalent:

- Pros: fast client-side path for printing specific refs.
- Cons: package addition required; still must handle modal/portal edge cases, page size, RTL, and thermal labels.

CSS-only print isolation:

- Pros: minimal changes for urgent relief.
- Cons: brittle if components move into portals/modals and if multiple printable areas exist.

PDF generation from data:

- Pros: avoids screenshot/DOM fragility; better for invoices/reports/audit.
- Cons: needs a library and Arabic font/RTL validation.

Client-side PDF:

- Pros: deploys without backend.
- Cons: bundle weight, font embedding, pagination, and RTL complexity.

Server-side PDF later:

- Pros: most robust for finance-grade documents.
- Cons: larger backend/API scope and infrastructure decisions.

## 9. Recommended Fix Options

### Option A - Minimal Surgical Fix

- Blank button: adjust only the reports banner CTA class or a small CSS exception.
- Print: add targeted print isolation for barcode and inventory print entry points.
- Export: disable or label unsupported PDF/XLSX, and wire CSV-only downloads clearly.
- Expected modified files: `app/[locale]/(dashboard)/reports/page.tsx`, `features/barcodes/components/BarcodeLabelPreview.tsx`, `app/[locale]/(dashboard)/inventory/page.tsx`, `app/[locale]/(dashboard)/reports/exports/page.tsx`, possibly `app/globals.css`.
- Expected added files: none.
- Risk: low to medium.
- Relative effort: low.
- Design impact: minimal.

### Option B - Reusable Print/Export Layer

- Add shared print utilities/templates for receipt, barcode, invoice, and report.
- Add shared export services for CSV and future XLSX/PDF.
- Expected modified files: existing report/sales/inventory pages and print preview components.
- Expected added files: `lib/export/*`, `lib/print/*`, `features/reports/*` templates, possibly print routes under `app/[locale]/(dashboard)/.../print`.
- Risk: medium.
- Relative effort: medium.
- Design impact: controlled if templates are separate from existing screens.

### Option C - Full Reporting Infrastructure

- Add report schemas, background export jobs, real PDF/XLSX generation, permission checks, audit logs, and storage/download URLs.
- Expected modified files: reports pages, data/context/API layer, permissions, export center, tests.
- Expected added files: report definitions, export job service, printable/PDF templates, API routes or backend contract updates.
- Risk: high.
- Relative effort: high.
- Design impact: potentially significant, but best long-term model.

No option was implemented.

## 10. Suggested Execution Order

1. Fix `REP-UI-001` blank report builder CTA.
2. Add print isolation for direct barcode/inventory `window.print()` flows.
3. Add invoice/receipt printable templates and thermal receipt page sizing.
4. Add barcode label templates with mm sizing and page breaks.
5. Clarify CSV behavior and empty-data feedback.
6. Implement true XLSX generation.
7. Implement true PDF generation.
8. Add regression tests for Arabic, English, print, and export flows.

## 11. Verification Plan

After future fixes, verify:

- Arabic and English locales.
- Light and dark modes.
- Desktop and mobile viewport behavior.
- Reports banner CTA visibility.
- CSV with Arabic headers/content and Excel opening behavior.
- XLSX file extension, MIME, workbook/worksheet structure, numeric/currency/date/weight formatting.
- PDF output with Arabic fonts, RTL, page breaks, and real report data.
- Empty reports and filtered reports.
- Large data sets.
- A4 invoice print.
- 80mm and 58mm receipt print.
- Barcode label dimensions, batches, and page breaks.
- Dashboard chrome hidden in all print flows.
- Modal/backdrop excluded from print.
- Permission checks for sensitive exports.

## 12. Files That Would Need Changes

- `app/[locale]/(dashboard)/reports/page.tsx`: fix CTA color collision; replace hardcoded report CSV rows if real report export is desired.
- `app/[locale]/(dashboard)/reports/exports/page.tsx`: replace simulated jobs/downloads with real export behavior or explicitly disable unsupported formats.
- `lib/export-csv.ts`: add empty-state feedback/result, stronger download handling, optional delimiter strategy, and reusable data mapping support.
- `features/sales/components/ReceiptPreview.tsx`: move from local style injection/global print to reusable receipt print template/service.
- `features/barcodes/components/BarcodeLabelPreview.tsx`: add print-only label container, label dimensions, and batch/page-break support.
- `app/[locale]/(dashboard)/inventory/page.tsx`: replace direct page print with a barcode-specific print target.
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx`: ensure modal label preview does not control print scope.
- `components/ui/modal.tsx`: may need print-aware hiding if modal-based printing remains.
- `components/layout/app-shell.tsx`, `components/layout/header.tsx`, `components/layout/sidebar.tsx`: may need `print:hidden` or global print classes if CSS-only isolation is chosen.
- `app/globals.css`: add or refine print CSS and avoid global dark text overrides affecting white-surface controls.
- `package.json`: only if a future approved solution selects `react-to-print`, XLSX, or PDF dependencies.
- `messages/ar.json`, `messages/en.json`: only if future user-facing export/print status/errors are added.

## 13. Final Decision Required

Confirmed root causes:

- `REP-UI-001`: dark-mode CSS override makes an existing CTA label white on a white button.
- `EXP-PDF-001` and `EXP-XLSX-001`: PDF/XLSX export center is simulated and has no real generation/download implementation.
- `EXP-CSV-001`: report card CSV export uses hardcoded demo rows.
- `EXP-CSV-002`: export-center Download button is not wired to any action.
- `PRN-BC-001` and `PRN-GEN-001`: barcode/inventory print flows call `window.print()` on the current app screen.
- `PRN-LAY-001`: no global print policy hides dashboard chrome.

Needs runtime verification:

- Whether receipt print fully excludes modal wrapper/backdrop in each target browser/printer.
- Whether browser print headers/footers and margins affect 80mm receipt output.
- Whether barcode labels are clipped or shifted on real label printers.
- Whether mobile viewport changes the perceived blank-button symptom beyond the confirmed dark-mode CSS issue.
- Whether CSV downloads behave consistently across browsers when the anchor is not appended to the DOM.

Available fix paths:

- Option A: minimal surgical fixes for visible CTA, direct print leaks, and unsupported export states.
- Option B: reusable print/export layer with templates and services.
- Option C: full reporting/export infrastructure with real background jobs and PDF/XLSX generation.

Stop point: no code fixes were applied. User decision is required before any implementation.
