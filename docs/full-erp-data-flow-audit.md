# Full ERP Data Flow & Integration Audit

Date: 2026-06-18  
Workspace: `H:\WORK\jewellery-erp-master`  
Scope: read-only audit of current Next.js frontend, Express/Sequelize/PostgreSQL backend, Docker services, API contracts, state reflection, permissions, realtime, settings, i18n, and file uploads.

## 1. Executive Summary

The system is not consistently using one source of truth. Core backend APIs exist and several modules now read/write PostgreSQL, but many frontend pages still depend on `useErp()` local state or static/mock calculations. This explains the visible symptom: a sale can be created in the backend and still not appear in another page, report, dashboard, or header search.

The backend has a useful foundation: authenticated CRUD, tenant scoping by `companyId`, role/permission tables, SSE realtime events, notification endpoints, settings endpoints, upload support, and POS checkout logic. The main gap is frontend integration consistency and several contract mismatches around branch IDs, purchase order items, attachments, and permission naming.

Verification performed:

- `npm run typecheck` passed.
- `npm run lint -- --max-warnings=999` passed with 0 errors and 9 warnings.
- `node --check` passed for main backend route/controller/middleware files inspected.
- Docker PostgreSQL and Redis are running and healthy.
- Current local DB still contains non-empty/demo-like data: `assets=8`, `customers=6`, `invoices=5`, `suppliers=5`, `purchase_orders=3`, `notifications=1`, `users=2`, `roles=5`, `permissions=49`.

## 2. Critical Findings

| Severity | Finding | Evidence | Impact |
|---|---|---|---|
| Critical | Mixed data sources remain in API mode | `H:\WORK\jewellery-erp-master\contexts\erp-context.tsx:281-295` uses API repos only for customers, suppliers, employees, assets, accounting; inventory/sales/manufacturing/reports/audit/settings remain local repos | CRUD operations do not reliably reflect across modules |
| Critical | Dashboard is local snapshot based | `H:\WORK\jewellery-erp-master\features\dashboard\hooks\use-dashboard-state.ts:47-95` reads `invoices`, `assets`, `customers`, etc. from `useErp()` and `LocalDashboardProvider` | Dashboard KPIs can show empty/stale data while DB has records |
| Critical | Reports are generated from local context | `H:\WORK\jewellery-erp-master\app\[locale]\(dashboard)\reports\page.tsx:64-123` and `reports\exports\page.tsx` use `useErp()` | Sales/inventory/customer reports can miss real backend data |
| Critical | Several operational pages still mutate local-only state | Inventory adjustments/transfers/manufacturing/stock audit and sales returns/exchanges/reservations/customer gold use `useErp()` | Operations may look successful but never persist to PostgreSQL |
| High | POS branch contract is strict backend-side but frontend branch state is partly name-based | `lib\api\client.ts:97-100`, `contexts\auth-context.tsx:198-234`, `backend\src\routes\erp.routes.js:91-154` | Checkout can fail validation or hide inventory if branch ID/name is inconsistent |
| High | Purchase receiving creates asset + PO header, not a full received PO item flow | `app\[locale]\(dashboard)\suppliers\purchases\page.tsx:86-132`; generic `/purchase-orders` CRUD at `backend\src\routes\erp.routes.js:733` | Supplier purchase totals/details may not reconcile with stock/accounting |
| High | Header global search uses local context | `H:\WORK\jewellery-erp-master\components\layout\header.tsx:33-45` | Search can miss real assets/customers/invoices in API mode |
| High | User management is partial | `hooks\use-user-management.ts:54-77`, `app\[locale]\(dashboard)\settings\users\page.tsx:42-67` | Create user and role permissions exist, but no UI for edit, deactivate/activate, reset password, assign multiple roles after creation |
| Medium | Realtime only updates React Query consumers | `components\realtime-provider.tsx:39-65` invalidates queries, mounted in `app\[locale]\(dashboard)\layout.tsx:7-10` | Pages using local `useErp()` do not receive live updates |
| Medium | i18n key parity is currently okay, but hardcoded Arabic/English remains widespread | `messages\ar.json` and `messages\en.json` both have 1032 keys; many pages use inline `rtl ? ... : ...` | Future `MISSING_MESSAGE` risk is lower, but translation governance remains weak |
| Medium | Upload support is uneven | Supplier documents and logo uploads exist; customer/asset attachments are metadata/local-state only | Some files appear saved in UI but are not persisted as real uploaded files |

## 3. Data Flow Matrix

| Module/Page | Frontend Source | Backend Endpoint/Route | Reflection Status |
|---|---|---|---|
| Dashboard | `useErp()` via `use-dashboard-state.ts` | No dashboard API used | Broken for API mode/stale |
| POS | `useAssets()`, `usePos()` | `POST /pos/checkout`, `POST /pricing/calculate` | Mostly API-backed; sensitive to branch ID and payload |
| Sales list | `useInvoices()` | `GET /invoices` | API-backed and normalized |
| Sales returns | `useErp()` | No API mutation used | Local-only |
| Sales exchanges | `useErp()` | No API mutation used | Local-only |
| Sales reservations | `useErp()` | Backend `/reservations` exists | Frontend not integrated |
| Sales installments | API hook | `/installments`, `/installments/:id/pay` | API-backed |
| Gift vouchers | API hook | `/gift-vouchers/*` | API-backed |
| Customers list | `useCustomers()` | `GET/POST/PATCH /customers` | API-backed |
| Customer profile | `useCustomer()` for profile/statement; local attachments | `/customers/:id`, `/customers/:id/statement` | Partial |
| Suppliers list | `useSuppliers()` | `GET/POST/PATCH /suppliers` | API-backed |
| Supplier profile | `useSupplier()` | `/suppliers/:id`, `/suppliers/:id/purchase-orders`, `/suppliers/:id/documents` | Mostly API-backed |
| Supplier purchases | `useSuppliers()`, `useAssets()`, direct `/purchase-orders` | `POST /assets`, `POST /purchase-orders` | Partial accounting/item detail |
| Inventory list | `useAssets()` | `GET/POST/PATCH /assets` | API-backed, but `allAssets` still mock |
| Inventory detail | `useAssetQuery()` plus `useErp().updateAsset` for attachments | `/assets/:id`, `/assets/:id/timeline` | Partial |
| Inventory adjustments | `useErp()` | No API mutation used | Local-only |
| Inventory transfers | `useErp()` | Backend `/transfers` custom API exists | Frontend not integrated |
| Manufacturing | `useErp()` | Backend `/manufacturing-orders` CRUD exists | Frontend not integrated |
| Stock audit | `useErp()` | No API mutation used | Local-only |
| Accounting | Mixed/static | `/journal-entries`, `/accounts` exist | Incomplete |
| Treasury | API hook | `/treasury/*` | API-backed |
| Reports | `useErp()` | No report API used | Broken for API mode |
| Audit | Static/local | `/audit-logs` exists | Frontend not integrated |
| Settings | `SettingsProvider` API plus local `resetDemo` | `/settings`, `/settings/by-key/:key`, `/branches` | Partial; many effects implemented |
| Users/Roles | `useUserManagement()` | `/users`, `/roles`, `/permissions` | Partial admin UI |
| Notifications | `useNotifications()` + SSE toast | `/notifications`, `/events/stream` | API-backed for React Query pages |

## 4. API Contract Mismatch

| Contract | Backend | Frontend | Risk |
|---|---|---|---|
| List envelope | Generic CRUD returns `{ success, items, data: { items } }` in `backend\src\controllers\erp.controller.js:193-204` | Hooks sometimes unwrap both, sometimes expect direct arrays | `reduce is not a function` / empty dropdowns if hook misses envelope |
| Branch identity | POS requires real `branchId` and validates asset `branchId` in `backend\src\routes\erp.routes.js:91-154` | UI stores `activeBranch` name and `activeBranchId`; assets are filtered by `branchId` in `features\assets\hooks\use-assets.ts:80-81` | Checkout/list mismatch |
| Purchase order details | Backend has generic PO header CRUD; no clear frontend item persistence in purchase receiving | `suppliers\purchases\page.tsx` sends `total`, `supplierId`, `supplierName`, but no item rows | Supplier PO detail can be incomplete |
| Invoice items | Backend includes invoice items for `/invoices` in `backend\src\controllers\erp.controller.js:183-184` | `useInvoices()` normalizes missing `items` to `[]` | Good fallback, but old receipt/preview code must always guard arrays |
| Numeric fields | Sequelize decimals may arrive as strings; backend decimal parser exists in `backend\src\config\database.js` | Some components still assume numbers (`toFixed`, arithmetic) | Remaining NaN risk if endpoint bypasses normalization |
| Upload URLs | Backend returns `/uploads/...` | Some print components hardcode `http://localhost:8000` for relative logos | Production domain mismatch |

## 5. State Management Issues

The current state architecture has three overlapping layers:

- Local/demo state in `contexts\erp-context.tsx`.
- Repository abstraction in `lib\repositories\local-impl.ts` and `lib\repositories\api-impl.ts`.
- React Query API hooks in `hooks/*` and `features/*/hooks/*`.

In API mode, `ErpProvider` initializes arrays as empty, then many pages still read those arrays directly. This is the main reason data does not reflect consistently. The realtime provider invalidates React Query only, so it cannot repair pages that never use React Query.

Immediate state priority:

1. Convert all dashboard/report/header/search pages from `useErp()` arrays to API hooks or dedicated dashboard/report endpoints.
2. Replace remaining local action pages with API mutations.
3. Keep `useErp()` only as mock-mode fallback or remove it from production routes after migration.

## 6. CRUD Reflection Audit

Backend CRUD coverage is broad:

- Generic CRUD exists for customers, suppliers, employees, assets, companies, branches, transfers, manufacturing orders, customer/inventory gold pools, purchase orders, invoices, reservations, approval requests, journal entries, and accounts.
- Custom POS checkout posts invoice, invoice items, payments, asset events, asset status, journal entries, cash transactions, loyalty, notification, and SSE event.
- Custom transfer endpoints validate source/target branch and update asset branch on receipt.

Frontend reflection is inconsistent:

- Good: customers, suppliers, employees list, inventory list, sales list, users, roles, notifications, treasury, gold, installments, gift vouchers.
- Partial: supplier profile documents, supplier purchases, customer profile attachments, inventory detail attachments, settings.
- Not persistent/unsafe: dashboard, reports, inventory adjustments, inventory transfers, manufacturing, stock audit, sales returns, exchanges, reservations, customer gold, audit.

## 7. Dropdowns Audit

Supplier purchase dropdown is now API-backed and safer:

- `H:\WORK\jewellery-erp-master\app\[locale]\(dashboard)\suppliers\purchases\page.tsx:26`
- It uses `useSuppliers({ page: 1, pageSize: 100 })`, filters inactive suppliers, shows loading/error/empty states, and sends both `supplierId` and `supplierName`.

Remaining dropdown risks:

- Branch switcher must use branch IDs from `/branches`, not hardcoded name-to-ID maps.
- POS customer list uses `/customers`, but asset availability depends on branch ID consistency.
- Pages using `useErp()` can still render empty dropdowns in API mode.

## 8. Branch & Company Scope Audit

Backend scoping is mostly correct:

- `auth.middleware.js` sets `req.companyId` from user/company header and validates `X-Branch-ID` for non-company-level routes.
- Generic CRUD list scopes by `companyId`.
- Branch filtering on generic lists is explicit query-only, not automatic.

Main issue:

- Frontend still mixes branch name (`activeBranch`) and branch ID (`activeBranchId`), with hardcoded mappings in auth context. This should be replaced by `/branches` as the single branch registry.

## 9. Settings Effect Audit

Working or partially working:

- `SettingsProvider` loads `/settings` and `/branches`.
- Company name/logo/currency/VAT/receipt settings are read and patched.
- Receipt preview uses company logo and receipt config.
- POS checkout backend reads `vatRate`, `invoicePrefix`, and installment settings.

Gaps:

- Reports/dashboard do not consistently use API settings because their data source is local.
- Theme/language settings are stored, but runtime application depends on separate theme/i18n contexts.
- Print logo URL handling hardcodes localhost in some templates.
- Low stock threshold is stored, but no complete low-stock notification/report cycle was verified.

## 10. i18n Audit

Machine check:

- `messages\en.json`: 1032 flattened keys.
- `messages\ar.json`: 1032 flattened keys.
- Missing `ar` keys: none.
- Missing `en` keys: none.

Risk:

- Many pages still use inline bilingual strings instead of message keys, e.g. supplier purchases, users management, reports, sales submodules. This avoids `MISSING_MESSAGE` temporarily but makes translation completeness hard to audit.

## 11. File Upload Audit

Implemented:

- Generic attachment upload: `backend\src\routes\index.js:20`.
- Logo upload: `backend\src\routes\index.js:22-38`.
- Static upload serving: `backend\src\app.js:61-66`.
- Supplier document upload/delete: `backend\src\routes\erp.routes.js:1099-1233`.
- Frontend supplier document UI validates file type/size and uploads through repository.

Incomplete:

- Customer attachments in `customers\[id]\page.tsx` are metadata/state updates, not real uploads.
- Asset attachments in `inventory\[id]\page.tsx` update context state, not backend `asset_attachments`.
- Production upload URL handling needs API-base-aware URL construction, not localhost literals.

## 12. Security & Permissions Audit

Backend:

- Public signup endpoint is disabled at `backend\src\routes\auth.routes.js:13-20`.
- User creation is admin/permission protected through `/users`.
- Permission middleware exists in `backend\src\middleware\auth.middleware.js`.
- Permission service grants admin/owner bypass and role permission resolution.

Frontend:

- Sidebar hides menu entries via granular names like `sales.view`, `inventory.view`, `settings.view`.
- Users management page checks `users.view`, `users.create`, `roles.manage`.

Gaps:

- Several pages still rely on legacy permission helpers (`viewCosts`, `performInventoryAdjustments`) or local page-level checks.
- User management UI does not yet cover edit user, deactivate/reactivate, reset password, or role reassignment after creation.
- Backend has endpoint support for update/delete users, but UI does not expose the full cycle.

## 13. Realtime Audit

Implemented:

- SSE backend service: `backend\src\services\events.service.js`.
- Events route is mounted at `/events`.
- Dashboard layout mounts `RealtimeProvider`.
- `RealtimeProvider` invalidates all React Query data on `change` events and shows toast for `notification` events.

Limit:

- Realtime works only for React Query consumers. Any page using `useErp()` local arrays will not update live even if the backend broadcasts correctly.

## 14. Recommended Fix Plan

### Phase 1: Single Source of Truth

1. Replace dashboard provider with API-backed dashboard endpoint or React Query aggregations.
2. Replace reports with API-backed reads for invoices/assets/customers or dedicated `/reports/*` endpoints.
3. Replace header search `useErp()` arrays with API search queries.
4. Remove production use of local repos in `contexts\erp-context.tsx`.

### Phase 2: Operational Modules

1. Integrate inventory transfers page with custom `/transfers` endpoints.
2. Integrate inventory adjustments with backend mutation and asset events/audit logs.
3. Integrate manufacturing with `/manufacturing-orders`.
4. Integrate sales returns/exchanges/reservations/customer gold with backend endpoints and posting logic.

### Phase 3: Branch/Company Consistency

1. Load active branch exclusively from `/branches`.
2. Store and send real `branchId`.
3. Ensure asset creation sets both `branchId` and display `branch`.
4. Add tests for cross-branch POS checkout failure/success.

### Phase 4: Purchases & Accounting

1. Add purchase order item persistence or dedicated receive endpoint.
2. Post supplier payable/cash/bank accounting entries on receipt.
3. Link received asset IDs to purchase order items.
4. Emit notifications for purchase received and low stock.

### Phase 5: Admin & Permissions

1. Complete users UI: edit, deactivate/reactivate, reset password, role assignment, status display.
2. Add page guards for every route, not only sidebar hiding.
3. Add action-level guards for create/edit/delete/export/print/approve buttons.
4. Keep backend permission checks as source of truth.

### Phase 6: Uploads & Print

1. Add real customer and asset upload endpoints/UI wiring.
2. Replace hardcoded logo URLs with `NEXT_PUBLIC_API_URL` origin-safe helpers.
3. Test dark/light invoice preview and print templates with configured logo/messages.

## 15. Acceptance Criteria for Next Fix Pass

- Creating a POS sale appears immediately in `/sales`, dashboard KPIs, reports, customer profile, asset timeline, accounting/treasury where applicable.
- Creating a supplier purchase creates asset, purchase order, purchase order item/details, supplier profile entry, accounting entry, and notification.
- Transfers, adjustments, manufacturing, returns, exchanges, reservations, and customer gold persist to PostgreSQL.
- Realtime updates every API-backed screen without manual refresh.
- Branch switcher uses real `/branches` IDs and POS rejects only truly invalid cross-branch sales.
- Users can be created, edited, disabled, reset, and assigned roles from admin UI.
- Permissions are enforced both backend-side and frontend-side on menus/pages/actions.
- Settings visibly affect currency, VAT, invoice numbering, logo, receipt messages, theme/language, and low-stock thresholds.
- Uploads work for supplier/customer/asset/company logo and display with production-safe URLs.

## 16. Remaining Verification Notes

- Full browser E2E was not executed during this audit because the provided brief requested inspection/reporting before fixes.
- Docker currently has database and Redis running, but backend container is not shown in `docker ps`; verify backend startup separately before end-to-end testing.
- Local database is not empty. If the next step is a clean trial, truncate/recreate the local Docker volume and re-run migrations/admin bootstrap intentionally.
