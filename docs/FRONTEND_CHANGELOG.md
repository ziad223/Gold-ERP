# DARFUS Jewellery ERP — Frontend Changelog

## [Phase 6] - 2026-06-14

### Added
- **Reusable export layer** (`lib/export/*`): Added typed CSV/XLSX export requests, UTF-8 CSV generation with Arabic-safe BOM output, safe filename handling, Blob download handling, and an `exportData` facade.
- **Reusable print layer** (`lib/print/*`, `features/printing/components/*`): Added isolated print document rendering plus invoice, receipt, barcode label, and report print templates.
- **Print/export tests** (`tests/export-print.spec.ts`): Covers CSV escaping/BOM, filename sanitization, XLSX workbook generation, print CSS scope, and barcode label defaults.

### Modified
- `app/[locale]/(dashboard)/reports/page.tsx`: Replaced demo-only report export rows with live frontend data, added CSV/XLSX/Print/PDF-fallback actions, fixed the report-builder CTA color collision, and applied permission-aware cost/margin masking.
- `app/[locale]/(dashboard)/reports/exports/page.tsx`: Replaced simulated progress and `downloadUrl: "#"` jobs with real local CSV/XLSX generation and a truthful `Print / Save as PDF` fallback.
- `app/[locale]/(dashboard)/sales/page.tsx`: Added invoice print from an isolated print template and migrated CSV export to the shared export service.
- `app/[locale]/(dashboard)/inventory/page.tsx`: Replaced full-page printing with isolated barcode-label printing and migrated CSV export to permission-aware translated headers.
- `features/sales/components/ReceiptPreview.tsx` and `features/barcodes/components/BarcodeLabelPreview.tsx`: Removed current-page print flows in favor of the shared print service.
- `app/[locale]/(dashboard)/customers/page.tsx`, `suppliers/page.tsx`, and `employees/page.tsx`: Migrated CSV buttons to the shared export service with translated headers and empty/error feedback.
- `app/globals.css`, `components/layout/app-shell.tsx`, `components/layout/header.tsx`, and `components/layout/sidebar.tsx`: Added scoped print CSS and data attributes to keep dashboard chrome out of print output.
- `messages/en.json` and `messages/ar.json`: Added print/export labels and export column translations.
- `package.json` and `package-lock.json`: Added `xlsx` for real client-side XLSX workbook generation.

### Verification
- `npm run typecheck`: Passed.
- `npm run lint`: Passed with 0 errors and 9 existing warnings.
- `npm run test:print-export`: Passed, 5 tests.
- `npm run build`: Passed. Next.js still reports the existing multiple-lockfile workspace-root warning.
- `npm run test:e2e`: Attempted with a 6-minute timeout and did not complete.

## [Phase 5] - 2026-06-14

### Added
- **Repository Interface Layer** (`lib/repositories/interfaces.ts`): Defined abstract signatures for `CustomerRepository`, `SupplierRepository`, `EmployeeRepository`, `AssetRepository`, `InventoryRepository`, `SalesRepository`, `ManufacturingRepository`, `AccountingRepository`, `ReportsRepository`, `AuditRepository`, `SettingsRepository`, and `FileStorageRepository`.
- **Local Repositories Adapter** (`lib/repositories/local-impl.ts`): Implemented all operations in-memory/state syncing via `LocalRepoContext`. Applies Phone Normalization, Unique Phone validations, immutable state operations, Audit Event snapshots (before/after states), and pagination/filters/search helpers.
- **Skeletal API Adapters** (`lib/repositories/api-impl.ts`): Placeholders for backend integration using `apiClient`.
- **Feature Hooks**:
  - `hooks/use-customers.ts`: Handles customer lists and mutations.
  - `hooks/use-suppliers.ts`: Handles supplier lists, POs, consignments, and documents.
  - `hooks/use-employees.ts`: Handles employee lists, sessions, and limits.
- **Dynamic Routes (Profile Pages)**:
  - `app/[locale]/(dashboard)/customers/[id]/page.tsx`: Overview, Sales invoices history, local statement calculation preview, KYC/AML checklist, and attachments metadata list.
  - `app/[locale]/(dashboard)/suppliers/[id]/page.tsx`: Overview, Purchase orders history, local ledger statement preview, consignments list, informational Reverse Charge Mechanism (RCM) VAT, and legal trade documents badging.
  - `app/[locale]/(dashboard)/employees/[id]/page.tsx`: Overview, system security permissions grid (based on Darfus role), approval limits editor, activity history log, and device active sessions revocation simulation.

### Modified
- `lib/types.ts`: Structured entity sub-types (e.g. `CustomerKycDetails`, `AttachmentMetadata`, `SupplierConsignment`, `SupplierDocument`, `EmployeeApprovalLimits`, `EmployeeSession`).
- `contexts/erp-context.tsx`: Injected centralized Repository Factory. Context value now propagates the active repository instance based on `DATA_SOURCE` mode.
- `app/[locale]/(dashboard)/customers/page.tsx`: Migrated customer list layout to run queries/mutations through repository-oriented hooks. Added: customer edit modal, deactivate/reactivate with reasons, row linking, and CSV export.
- `app/[locale]/(dashboard)/suppliers/page.tsx`: Migrated supplier list grid to run queries/mutations through repository-oriented hooks. Added: supplier edit modal, deactivate/reactivate with reasons, card link routing, and CSV export.
- `app/[locale]/(dashboard)/employees/page.tsx`: Migrated standalone `useLocalStorageState("darfus-employees-v1")` hook to use the central repository hook. Added: employee edit modal, deactivate/reactivate with reasons, row click routing, and CSV export.

### Documentation
- Created `docs/BACKEND_INTEGRATION_CONTRACT.md` detailing API requests/responses, multi-tenancy headers, numeric string serialization, date format requirements, and file upload protocols.
- Updated `docs/FRONTEND_COMPLETION_MATRIX.md` marking all Phase 5 modules as completed.
