# DARFUS Jewellery ERP — Frontend Implementation Plan
> Version: 2.0 | Date: 2026-06-14 | Mode: Frontend Only (Mock/Local)

---

## Guiding Principles

1. **Zero Deletion** — No existing file will be deleted or replaced.
2. **Surgical Extension** — Existing files extended minimally; new files added for new functionality.
3. **Mock First** — All data flows through Mock/LocalStorage. `api` mode stays disabled.
4. **Fix Bugs First** — Critical mutations and state bugs fixed before adding features.
5. **Type Safety** — All new code in TypeScript with strict types.
6. **i18n Always** — Every new string goes to `ar.json` and `en.json`.
7. **Permission Aware** — Every new action checks permissions before rendering.

---

## Phase 0 — Already Completed: Audit ✅

**Results:** See `FRONTEND_GAP_ANALYSIS.md`

---

## Phase 1 — Foundation & Critical Bug Fixes

### Goals
Fix state management bugs, expand ErpContext, add DataSource abstraction, fix filter bug, add missing translations.

### Files to MODIFY

#### `contexts/erp-context.tsx`
- Add `updateAsset(id, partial)` — immutable update
- Add `updateCustomer(id, partial)` — immutable update  
- Add `updateSupplier(id, partial)` — immutable update
- Add `deleteAsset(id)` (soft delete — status = "archived")
- Add `employees` state + `addEmployee` + `updateEmployee`
- Add `auditLogs` state for mock audit trail
- Add `goldPrice` state (per karat, updatable from UI)
- Add localStorage version check + migration helper
- Add `exportLocalData()` and `importLocalData()` helpers
- Add `seedDemoData()` separate from `resetDemo`

#### `features/assets/hooks/use-asset-query.ts`
- Remove all direct mutations (`target.events =`, `target.status =`)
- Replace with `updateAsset` call from ErpContext
- Add proper error handling and toast notifications

#### `features/assets/hooks/use-assets.ts`
- Fix `activeBranch` filter: when branch === "Main Branch" and no assets match, return all mock assets
- Add `updateAsset`, `deleteAsset` wrappers

#### `lib/types.ts`
- Extend `AssetEvent` with: `device?`, `reason?`, `sourceDocument?`, `beforeState?`, `afterState?`, `correlationId?`, `severity?`
- Add `Employee` type
- Add `AuditLog` type (rich)
- Add `GoldPrice` type
- Add `Transfer` type
- Add `Adjustment` type
- Add `ManufacturingOrder` type
- Add `CustomerGoldPool` (CGP) type
- Add `InventoryGoldPool` (IGP) type
- Add `JournalEntry` (rich, with debit/credit lines)
- Add `Account` (chart of accounts)

#### `lib/demo-data.ts`
- Add `demoEmployees`
- Add `demoTransfers`
- Add `demoAuditLogs` (rich)
- Add `demoManufacturingOrders`
- Add `demoCGP`
- Add `demoIGP`
- Add `demoJournals` (rich with debit/credit lines)
- Add `demoAccounts` (chart of accounts)

### Files to ADD

#### `lib/data-source.ts`
- Export `DATA_SOURCE: "mock" | "local" | "api"`
- Export `isMock()`, `isLocal()`, `isApiReady()` helpers
- Feature flag: `api` mode always returns graceful fallback

#### `lib/storage-version.ts`
- Version constant: `STORAGE_VERSION = 4`
- Migration function for v1→v2→v3→v4

### Acceptance Tests
- [ ] `updateAsset` works and persists to localStorage
- [ ] No direct mutations in any hook
- [ ] All mock data shows correctly on first load
- [ ] TypeScript compiles with zero errors

---

## Phase 2 — Core Asset Frontend

### Goals
Complete Asset Details, Timeline, Lineage, Barcode, RFID simulation.

### Files to MODIFY

#### `app/[locale]/(dashboard)/inventory/[id]/page.tsx`
- Remove all hard-coded RTL/LTR strings → use translation keys
- Add `cost` field with `SensitiveValue` permission gate
- Add `stones`, `pearls`, `source document` fields
- Add Edit Asset modal (inline form)
- Add Attachments placeholder UI
- Add Certificate placeholder UI
- Add Notes field
- Fix: actions now dispatch to context (not direct mutation)
- Add confirmation dialogs before destructive actions (melt)
- Add Toast notifications on action success/failure

#### `features/assets/components/AssetTimeline.tsx`
- Extend event display: reason, device, source document, before/after state, correlation ID
- Add severity badge
- Add expand/collapse for each event

#### `features/assets/components/AssetLineageGraph.tsx`
- Support one-to-many: show child assets
- Support many-to-one: show multiple parents
- Add contribution weight display
- Add process loss display
- Improve visual graph layout
- Keep accessible table fallback

### Files to ADD

#### `features/assets/components/AssetEditModal.tsx`
- Full edit form for all asset fields
- Zod validation schema
- react-hook-form integration
- Permission check before showing

#### `features/assets/components/AssetCostPanel.tsx`
- Displays cost, margin, markup
- Permission-gated with `SensitiveValue`

#### `features/assets/components/AttachmentsPanel.tsx`
- File list UI (mock — no actual file storage)
- Add/remove placeholders
- Shows document type icons

#### `features/assets/components/CertificatePanel.tsx`
- Certificate number, issuer, date, validity
- Mock data display

#### `app/[locale]/(dashboard)/inventory/transfers/page.tsx` [NEW]
- Transfer list with status: pending, approved, in-transit, received
- Create transfer form
- Status step indicators
- Branch and date filters

#### `app/[locale]/(dashboard)/inventory/adjustments/page.tsx` [NEW]  
- Inventory adjustment list
- Create adjustment form with reason selection
- Permission gate: `performInventoryAdjustments`

#### `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx` [NEW]
- RFID scan simulation UI
- Expected vs. found list
- Missing items
- Unexpected items
- Variance resolution UI

### Translation Keys to ADD
```
AssetDetails.cost, AssetDetails.stones, AssetDetails.pearls, AssetDetails.sourceDoc,
AssetDetails.attachments, AssetDetails.certificate, AssetDetails.notes,
AssetDetails.confirmMelt, AssetDetails.confirmMeltText,
AssetDetails.editAsset, AssetDetails.editSaved,
Transfers.title, Transfers.description, ...
Adjustments.title, ...
StockAudit.title, ...
```

---

## Phase 3 — Inventory List Enhancement

### Files to MODIFY

#### `app/[locale]/(dashboard)/inventory/page.tsx`
- Add Grid/Table view toggle
- Add bulk selection checkboxes
- Add bulk status update action (permission-gated)
- Add quick filter by Status chips (in addition to dropdown)
- Add real `exportCsv` with all fields
- Add low-stock alert banner (when count < threshold)
- Complete form validation with Zod

### Files to VERIFY/FIX

#### `app/[locale]/(dashboard)/inventory/manufacturing/page.tsx`
- Inspect current state
- If incomplete: add input assets, output assets, process loss, status flow, lineage link

---

## Phase 4 — POS Enhancement

### Files to MODIFY

#### `app/[locale]/(dashboard)/pos/page.tsx`
- Add Barcode text input field (simulates barcode scanner — auto-finds asset)
- Add RFID input simulation
- Add Discount field (permission-gated `applyLargeDiscount`)
- Add Making Charge field
- Add Stone Value field
- Add Print Receipt button (opens print-friendly modal)
- Add confirmation dialog before `completeSale`
- Add Draft Save / Resume Draft using localStorage
- Add Cancel Draft action
- Add keyboard shortcut: `F2` = focus search, `F12` = complete sale, `Escape` = cancel
- Add double-submit prevention (disable button during `isPosting`)
- Display actual VAT label from settings

### Files to ADD

#### `app/[locale]/(dashboard)/sales/returns/page.tsx` [VERIFY/FIX]
- Return form: select invoice → select items → reason → confirm
- Mock: sets asset status back to "available" or "returned"
- Updates invoice status to "returned"

#### `app/[locale]/(dashboard)/sales/exchanges/page.tsx` [VERIFY/FIX]
- Exchange form: return item(s) + select replacement item(s)
- Price difference calculation
- Payment or refund display

#### `app/[locale]/(dashboard)/sales/reservations/page.tsx` [VERIFY/FIX]
- Reservation list with expiry dates
- Create reservation form
- Release / Extend / Complete actions
- Expiry warning badges

#### `app/[locale]/(dashboard)/sales/customer-gold/page.tsx` [VERIFY/FIX]
- Customer gold purchase form
- Assay result input
- Purity and weight
- Transfer to CGP
- Mock audit entry

#### `features/sales/components/ReceiptPreview.tsx` [NEW]
- Print-friendly receipt layout
- Company logo, branch, date, items, totals, VAT
- "Print" button using `window.print()`

#### `features/sales/hooks/use-pos.ts` [MODIFY]
- Inspect current state
- Fix: ensure `postInvoice` dispatches to ErpContext not just mock
- Add `saveDraft` and `loadDraft`

---

## Phase 5 — Customers, Suppliers, Employees

### Files to ADD

#### `app/[locale]/(dashboard)/customers/[id]/page.tsx` [NEW]
- Customer profile: identity, tier, contacts, KYC status
- Sales history (from `invoices` context filtered by customer)
- Returns history
- Reservations list
- Customer gold history (from CGP)
- Account statement preview
- Receivable summary
- Edit customer inline

#### `app/[locale]/(dashboard)/suppliers/[id]/page.tsx` [NEW]
- Supplier profile: identity, category, contacts
- Purchase history
- Invoices and payments
- Balance display
- Consignment UI
- Documents placeholder

#### `app/[locale]/(dashboard)/suppliers/purchases/page.tsx` [VERIFY/FIX]
- Purchase order list
- Create purchase order form
- Receive shipment UI
- Consignment status

#### `app/[locale]/(dashboard)/employees/[id]/page.tsx` [NEW]
- Employee profile
- Role and permissions summary
- Activity log (from audit)
- Approval limit display
- Deactivate/Activate toggle (permission-gated)

---

## Phase 6 — Manufacturing and Gold Pools

### Files to ADD

#### `app/[locale]/(dashboard)/inventory/manufacturing/page.tsx` [VERIFY/FIX]
- Manufacturing order list + creation form
- Input assets selector
- Expected/actual output
- Process loss field
- Status: draft → approved → in-process → completed
- Lineage auto-creation on complete

#### `app/[locale]/(dashboard)/sales/customer-gold/pool/page.tsx` [NEW]
- CGP list with balances
- Movement history
- Approval flow UI
- Transfer to IGP request

#### `app/[locale]/(dashboard)/inventory/gold-pool/page.tsx` [NEW]
- IGP list with balances
- Allocation to manufacturing orders
- Conversion preview

---

## Phase 7 — Accounting Frontend

### Files to MODIFY

#### `app/[locale]/(dashboard)/accounting/page.tsx`
- Add tab navigation: Overview | Chart of Accounts | Journals | Reports
- Add Chart of Accounts tree view (mock data)
- Enhance journal list to show debit/credit lines in details
- Add journal creation form with balanced validation
- Add period filter
- Add Financial Indicators with real data from invoices context

### Files to ADD

#### `features/accounting/components/ChartOfAccounts.tsx` [NEW]
- Tree structure: Assets, Liabilities, Equity, Revenue, Expenses
- Expandable sections
- Account code, name, balance display
- Permission-gated balance visibility

#### `features/accounting/components/JournalForm.tsx` [NEW]
- Dynamic debit/credit lines
- Account selector per line
- Real-time balance check (total debits === total credits)
- Zod validation
- Submit disabled if unbalanced

#### `features/accounting/components/TrialBalance.tsx` [NEW]
- Period filter
- Account balances table
- Debit/Credit columns
- Running totals

#### `features/accounting/components/ProfitLoss.tsx` [NEW]
- Revenue vs Expenses breakdown
- Period filter
- Mock data from invoices

#### `features/accounting/components/VATReport.tsx` [NEW]
- Input VAT / Output VAT
- Period filter
- Net VAT due
- Based on invoice tax fields

---

## Phase 8 — Reports, Audit, Settings

### Files to MODIFY

#### `app/[locale]/(dashboard)/reports/page.tsx`
- Connect sales report to real `invoices` context data
- Connect inventory report to real `assets` context data
- Connect customers report to real `customers` context data
- Add date range picker for each report
- Add branch filter
- Add real CSV export with actual data
- Add cost/margin masking based on permissions
- Add saved filters (localStorage)
- Add favorites (localStorage)

#### `app/[locale]/(dashboard)/audit/page.tsx`
- Replace static `logs` array with data from ErpContext `auditLogs`
- Add severity filter
- Add device column
- Add correlation ID column
- Add export to CSV from local data
- Keep AuditDiffViewer

#### `app/[locale]/(dashboard)/settings/page.tsx`
- Add Roles tab: list roles with permission checkboxes
- Add Approval Thresholds section
- Add Tax Rates config
- Add Currency and Rounding settings
- Add Language and Timezone settings
- Save all to localStorage

### Files to ADD

#### `app/[locale]/(dashboard)/approvals/page.tsx` [VERIFY/FIX]
- Approval request list (mock)
- Approve / Reject actions (permission-gated)
- Reason field on rejection
- Filters by type and status

#### `app/[locale]/(dashboard)/reports/exports/page.tsx` [VERIFY/FIX]
- Export center with scheduled export history (mock)
- Manual export triggers for each report type

---

## Phase 9 — Frontend Hardening

### Unit Tests to ADD (Playwright or Vitest)

> Note: Add `vitest` as dev dependency for unit tests

Files:
- `lib/utils.test.ts` — formatCurrency, formatNumber
- `lib/decimal/decimal.test.ts` — decimal calculations
- `lib/permissions/permissions.test.ts` — hasPermission
- `contexts/erp-context.test.ts` — state transitions
- `features/assets/hooks/use-assets.test.ts` — mock mode

### E2E Tests to ADD

File: `tests/e2e.spec.ts`
Tests:
1. Login and navigate to dashboard
2. Create asset (mock mode)
3. Edit asset
4. Transfer asset between branches
5. Reserve asset
6. Release reservation
7. POS: add items, complete sale
8. Verify asset shows as "sold" after sale
9. Return simulation
10. Add customer
11. View customer profile
12. Add supplier
13. Journal form: balanced entry submission
14. Journal form: unbalanced entry blocked
15. Permission denial: sales role cannot view cost
16. Arabic RTL layout check
17. English LTR layout check
18. Mobile viewport (375px): sidebar, navigation
19. LocalStorage persistence: data survives reload
20. Reset demo data: data returns to original

### Accessibility Improvements
- All interactive elements: `aria-label`, `role`
- Modal: focus trap, Escape key closes
- Forms: `aria-required`, `aria-invalid`, error `aria-describedby`
- Tables: `scope="col"` on headers

### Performance
- No heavy animations added
- Skeleton loaders for all list pages
- Debounce search inputs (300ms)
- Memoize filtered arrays (already done in most pages ✅)

---

## Phase 10 — API Readiness

### Files to ADD

#### `docs/BACKEND_INTEGRATION_CONTRACT.md`
- Domain models
- Request/Response DTOs
- Pagination shape
- Error shape
- Auth expectations
- Permission expectations
- Idempotency header
- Correlation ID

#### `lib/api/contracts.ts` [NEW]
- TypeScript interfaces for all API contracts
- Request types
- Response types
- Paginated response wrapper
- Error response type

#### `lib/repositories/interfaces.ts` [NEW]
- `IAssetRepository` interface
- `ISalesRepository` interface
- `IInventoryRepository` interface
- `ICustomerRepository` interface
- `ISupplierRepository` interface
- `IAccountingRepository` interface

#### `lib/repositories/mock/` [NEW]
- `MockAssetRepository.ts`
- `MockSalesRepository.ts`
- `MockCustomerRepository.ts`

#### `lib/repositories/api/` [NEW — SKELETON ONLY]
- `ApiAssetRepository.ts` — stub, all methods throw "API not configured"
- Behind `isApiReady()` feature flag

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Breaking existing working pages | Only extend, never replace. Run build after each phase. |
| Direct mutation bug causing data loss | Fixed in Phase 1 before any new features. |
| Translation key conflicts | Always add new keys under new namespaces. |
| localStorage schema conflicts | Add version key + migration in Phase 1. |
| Nested legacy folder confusion | Active root is outer folder. Never touch inner. |
| TypeScript errors in new code | Strict types from day one. Run `npm run typecheck` each phase. |

---

## Build Verification After Each Phase

```bash
npm run typecheck
npm run lint
npm run build
```

After Phase 9:
```bash
npm run test:e2e
```
