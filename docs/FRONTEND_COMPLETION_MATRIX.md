# DARFUS Jewellery ERP — Frontend Completion Matrix (Phase 5)
> Date: 2026-06-14 | Phase: 5 (Customers, Suppliers, Employees)

---

## 1. Customers Module Gaps

| Feature | State | Details |
|---|---|---|
| **Customer List Page** | ✅ Complete | Integrated useCustomers hook, search & filters. Added: pagination, Editing modal, Deactivating/Reactivating, local CSV Export, and visual empty/error states. |
| **Profile Routing** | ✅ Complete | Route `/[locale]/customers/[id]` is created and fully functioning. |
| **Profile tabs & details** | ✅ Complete | Overview tab, sales invoices history table, statement ledger local preview, KYC & AML checklist update, and attachments local metadata creation/deletion. |

---

## 2. Suppliers Module Gaps

| Feature | State | Details |
|---|---|---|
| **Supplier List Page** | ✅ Complete | Integrated useSuppliers hook. Added: local CSV export, Edit, Deactivate/Reactivate with deactivation reason, and visual empty/error states. |
| **Profile Routing** | ✅ Complete | Route `/[locale]/suppliers/[id]` is created and fully functioning. |
| **Profile tabs & details** | ✅ Complete | Overview, Purchases history (actual project data), Statement ledger preview, Consignment items list adding/removing, Reverse Charge (RCM) VAT informational preview, and legal documents badging with expiry checking. |

---

## 3. Employees Module Gaps

| Feature | State | Details |
|---|---|---|
| **Employee List Page** | ✅ Complete | Migrated employee page from standalone local storage state to useEmployees repository hook (global context). Integrated: edit modal, deactivate/reactivate modal with reasons, CSV export, and lists search/filter. |
| **Profile Routing** | ✅ Complete | Route `/[locale]/employees/[id]` is created and fully functioning. |
| **Profile tabs & details** | ✅ Complete | Overview, Permissions sets view (read-only grid based on Darfus Role), Approval Limits editor, Activity logs filter by employee, and Device sessions revocation simulator. |

---

## 4. Architectural Rules Applied

- **UI Components** are decoupled from data structures and persistence layers.
- **Repositories and Interfaces** are introduced for every domain module.
- **Factory Pattern** switches between `mock` and `api` dynamically from `lib/data-source.ts`.
- **Zod / Typescript type safety** checks all queries and mutations.
- **Audit Logs** capture before/after object states immutably.
- **Phone Normalization** prevents duplicate phones in Customer/Supplier records.

---

## 5. Reports, Export, and Print Layer

| Feature | State | Details |
|---|---|---|
| **Report builder CTA visibility** | ✅ Complete | Replaced the dark-mode-sensitive white CTA styling with semantic button styling so Arabic/English text remains visible. |
| **Reports page exports** | ✅ Complete | Report cards and report preview modal export live frontend rows to CSV/XLSX and offer isolated Print / Save as PDF. |
| **Export Center** | ✅ Complete | Removed simulated progress and dead `downloadUrl` values. Jobs now reflect real local CSV/XLSX generation or the PDF print fallback. |
| **Invoice / receipt printing** | ✅ Complete | Added isolated print templates and removed current-page print dependency from receipt flow. |
| **Barcode / inventory printing** | ✅ Complete | Inventory and barcode preview printing now render barcode labels in isolated print documents instead of printing the dashboard UI. |
| **CSV buttons across list pages** | ✅ Complete | Sales, inventory, customers, suppliers, and employees now use the shared export service with translated headers and empty/error handling. |
| **Print CSS isolation** | ✅ Complete | Dashboard shell, header, and sidebar are explicitly marked and hidden under scoped print rules. |
| **Automated coverage** | ✅ Complete | Added `test:print-export` Playwright coverage for CSV, XLSX, filename safety, print CSS, and barcode label defaults. |
