# DARFUS ERP Integration Repair Progress

Date: 2026-06-18

## 1. Summary of Changes

This pass focused on removing high-impact mixed data sources in API mode and making PostgreSQL/API the source of truth for dashboard, reports, header search, branch switching, inventory adjustments, transfers, reservations, and supplier purchase receiving.

## 2. Files Modified

- `lib/api/normalize.ts`
- `lib/repositories/api-impl.ts`
- `features/assets/hooks/use-assets.ts`
- `features/sales/hooks/use-invoices.ts`
- `hooks/use-user-management.ts`
- `hooks/use-notifications.ts`
- `hooks/use-core-erp-data.ts`
- `features/dashboard/hooks/use-dashboard-state.ts`
- `components/layout/header.tsx`
- `components/layout/branch-switcher.tsx`
- `contexts/auth-context.tsx`
- `app/[locale]/(dashboard)/reports/page.tsx`
- `app/[locale]/(dashboard)/reports/exports/page.tsx`
- `app/[locale]/(dashboard)/inventory/adjustments/page.tsx`
- `app/[locale]/(dashboard)/inventory/transfers/page.tsx`
- `app/[locale]/(dashboard)/sales/reservations/page.tsx`
- `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`
- `backend/src/routes/erp.routes.js`
- `backend/src/models/index.js`
- `backend/src/models/purchaseOrderItem.model.js`
- `backend/src/services/audit.service.js`
- `backend/src/services/notification.service.js`
- `backend/src/services/posting.service.js`
- `backend/migrations/20260618010000-link-purchase-order-items-to-assets.js`

## 3. Modules Converted From Local/Mock To API In API Mode

- Dashboard data aggregation now reads from API-backed core ERP data.
- Header global search now searches real API-backed assets/customers/invoices.
- Reports and Export Center now use real API-backed assets/customers/invoices.
- Inventory adjustments now patch assets through `/assets/:id` and write `/audit-logs`.
- Inventory transfers now create/update through `/transfers` and use DB branches.
- Sales reservations now create `/reservations`, patch asset status, and create deposit invoices through `/sales/invoices/draft`.
- Supplier purchases now call a transaction-safe `/purchase-orders/receive` endpoint in API mode instead of creating an asset separately and then a header-only purchase order.
- Supplier purchase receiving now creates the purchase order, purchase-order items, linked assets, asset events, accounting journal entry, optional treasury cash/bank transaction, audit log, notification, and SSE events in one backend transaction.
- Users/roles/permissions and notifications now use `skipBranch: true` and shared response normalization.

## 4. Remaining Local/Mock Usage

Some pages still need conversion in the next pass:

- `app/[locale]/(dashboard)/inventory/manufacturing/page.tsx`
- `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx` attachment mutations
- `app/[locale]/(dashboard)/sales/returns/page.tsx`
- `app/[locale]/(dashboard)/sales/exchanges/page.tsx`
- `app/[locale]/(dashboard)/sales/customer-gold/page.tsx`
- `app/[locale]/(dashboard)/audit/page.tsx`
- `app/[locale]/(dashboard)/employees/[id]/page.tsx`

`useErp()` remains intentionally used by mock/local fallback hooks, but production pages should continue moving away from it for real data.

## 5. API Endpoints Used/Modified

Backend routes and frontend calls now use these endpoints more consistently:

- `GET /assets`
- `PATCH /assets/:id`
- `GET /customers`
- `GET /invoices`
- `GET /suppliers`
- `GET /transfers`
- `POST /transfers`
- `PATCH /transfers/:id`
- `GET /reservations`
- `POST /reservations`
- `POST /sales/invoices/draft`
- `GET /audit-logs`
- `POST /audit-logs`
- `GET /notifications`
- `GET /notifications/unread-count`
- `GET /users`
- `GET /roles`
- `GET /permissions`
- `POST /purchase-orders/receive`
- `GET /suppliers/:id/purchase-orders` including `items.asset`

## 6. DB Migrations Added

- `20260618010000-link-purchase-order-items-to-assets.js`

Adds nullable `purchase_order_items.asset_id` with a foreign key to `assets.id`, allowing received supplier purchase lines to be traced directly to generated inventory assets.

## 7. Environment Variables Added

None.

## 8. Production Deployment Notes

- Branch selection now relies on real `/branches` records through `SettingsProvider`.
- Frontend company-level calls for users/roles/permissions/notifications skip branch headers.
- API response envelope handling is centralized in `lib/api/normalize.ts`.
- `/signup` still appears in the Next route table because a redirect page exists, but it redirects to `/login` and public backend registration remains disabled.

## 9. Testing Results

- `npm run typecheck`: passed.
- `npm run lint -- --max-warnings=999`: passed with 0 errors and 9 existing warnings.
- `npm run build`: passed.
- Backend syntax check with `node --check` for the changed route/model/service/migration files: passed.
- `cd backend && npm run db:migrate`: passed against the local Docker PostgreSQL database.
- `docker compose ps`: local PostgreSQL and Redis containers are healthy.
- Temporary backend smoke test:
  - `GET /api/v1/health`: `UP`
  - `GET /api/v1/health/db`: `UP`
  - `GET /api/v1/health/redis`: `UP`

Existing lint warnings:

- One missing hook dependency warning in `app/[locale]/(dashboard)/pos/page.tsx`.
- Several `<img>` optimization warnings.
- One missing `alt` warning in `features/assets/components/AttachmentsPanel.tsx`.
- Two unnecessary dependency warnings in `contexts/settings-context.tsx`.

## 10. Known Limitations

- Full browser E2E was not run in this pass.
- POS flow was not changed in this pass; it already uses backend checkout but still needs full accounting/treasury verification in browser.
- Supplier purchase receiving now has the dedicated receive endpoint. Browser E2E still needs to verify the full screen flow with a real supplier and branch.
- Upload standardization for customer/asset attachments is still pending.
- Manufacturing, returns, exchanges, customer gold, stock audit, and audit page are still pending deeper API integration.

## 11. Global Live Sync Pass — 2026-06-19

Added a two-layer live update foundation:

- Local mutation refresh: high-impact frontend mutations now call one shared invalidation helper after successful API responses.
- Global realtime sync: backend mutation events are standardized as `entity.changed` SSE payloads, and `RealtimeProvider` passes them through the same invalidation helper used locally.

Files added/updated for this pass:

- `lib/query-keys.ts`
- `lib/realtime/invalidate-affected-queries.ts`
- `components/realtime-provider.tsx`
- `backend/src/services/realtime-helper.service.js`
- `backend/src/services/events.service.js`
- `backend/src/services/notification.service.js`
- `backend/src/controllers/erp.controller.js`
- `backend/src/routes/index.js`
- `backend/src/routes/erp.routes.js`
- `contexts/settings-context.tsx`
- `features/assets/hooks/use-assets.ts`
- `features/assets/hooks/use-asset-query.ts`
- `features/sales/hooks/use-pos.ts`
- `features/sales/hooks/use-invoices.ts`
- `hooks/use-user-management.ts`
- `hooks/use-notifications.ts`
- `hooks/use-audit-logs.ts`
- `app/[locale]/(dashboard)/inventory/adjustments/page.tsx`
- `app/[locale]/(dashboard)/inventory/transfers/page.tsx`
- `app/[locale]/(dashboard)/sales/reservations/page.tsx`
- `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`

Coverage added:

- Customers/suppliers/assets/branches generic CRUD now emits standardized events from the shared ERP controller.
- POS checkout emits a standardized invoice event after commit.
- Returns, exchanges, customer-gold settlement, manufacturing completion, stock audit completion, transfers, asset attachments, supplier documents, settings/logo updates, notifications, users, roles, and permissions emit standardized events.
- RealtimeProvider listens to both the previous `change` event and the new `entity.changed` event for compatibility.
- Notification toast events remain separate to avoid toasting every entity change.
- Settings and branch saves refresh local provider state and invalidate affected query groups immediately.

Validation for this pass:

- `npm run typecheck`: passed.
- `npm run lint -- --max-warnings=999`: passed with 0 errors and 10 warnings.
- `npm run build`: passed.
- Backend `node --check` for changed routes/controllers/services: passed.
- `cd backend && npm run db:migrate`: passed; schema already up to date.
- `docker compose ps`: PostgreSQL and Redis are healthy.

Remaining limitations after this live sync pass:

- Full multi-tab browser E2E was not run in this pass.
- Some legacy pages still use local/mock fallback logic by design; API mode is now better invalidated, but deeper workflow testing is still needed.
- The acceptance target "any mutation everywhere" is broad; this pass centralizes the system and covers the high-impact mutations listed above, but future custom endpoints should call `emitEntityChanged` and `invalidateAffectedQueries` as they are added.
