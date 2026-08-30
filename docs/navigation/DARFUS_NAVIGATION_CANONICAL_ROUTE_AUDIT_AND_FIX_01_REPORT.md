# DARFUS ERP — Canonical Navigation Route Audit & Minimum Safe Fix Report

## 1. Executive Summary

تم تدقيق خريطة Next.js ومصادر التنقل الداخلية، وثبت عطل واحد في مولّد الـbreadcrumbs: كان يضيف `dashboard` كعنصر عرض ثم يستخدمه داخل روابط الصفحات الفرعية. تم إصلاح مولّد الرابط فقط، مع إبقاء route tree وpermissions وbusiness logic كما هي.

النتيجة: روابط Gold Center والروابط الفرعية العامة أصبحت canonical، واختبار AR/EN والمتصفح و`typecheck` و`build` نجحوا. لم يتم تنفيذ أي طلب business write أو تعديل Backend/DB.

| Metric | Result |
|---|---|
| Canonical route files inspected | 71 |
| Internal navigation producer families audited | 15 |
| Logical broken navigation producers found | 1 |
| Broken emitted route families | 2 |
| Broken navigation producers fixed | 1 |
| Known false `/dashboard/...` targets after fix | 0 |
| Navigation 404 observed | 0 |
| AR navigation | PASS |
| EN navigation | PASS |
| Focused navigation tests | PASS (2/2) |
| Navigation regression tests | PASS (5/5) |
| Typecheck | PASS |
| Build | PASS |

## 2. Root Cause

Classification: `BREADCRUMB_CONFIG_DEFECT` with synthetic home-crumb leakage.

Before the fix, `components/layout/breadcrumbs.tsx` formed:

```text
items = ["dashboard", ...actualPathSegments]
href = "/" + items.slice(0, index + 1).join("/")
```

For `/gold-center`, this emitted `/dashboard/gold-center`, although the actual
route file is `app/[locale]/(dashboard)/gold-center/page.tsx` and its public
URL is `/gold-center`. The `(dashboard)` route group is not a URL segment.

## 3. Canonical Route Map

The map below is derived from the actual `app/` filesystem and the successful
production build. Route groups such as `(dashboard)` are excluded from public
URLs; `[id]` and `[receiptId]` are dynamic segments.

| File Route | Canonical Public URL | Notes |
|---|---|---|
| `app/[locale]/page.tsx` | `/{locale}` | locale root |
| `app/[locale]/(dashboard)/accounting/page.tsx` | `/{locale}/accounting` | route group excluded |
| `app/[locale]/(dashboard)/accounting/chart/page.tsx` | `/{locale}/accounting/chart` | |
| `app/[locale]/(dashboard)/accounting/reports/page.tsx` | `/{locale}/accounting/reports` | |
| `app/[locale]/(dashboard)/accounting/treasury/page.tsx` | `/{locale}/accounting/treasury` | |
| `app/[locale]/(dashboard)/approvals/page.tsx` | `/{locale}/approvals` | |
| `app/[locale]/(dashboard)/audit/page.tsx` | `/{locale}/audit` | |
| `app/[locale]/change-password/page.tsx` | `/{locale}/change-password` | |
| `app/[locale]/(dashboard)/customers/page.tsx` | `/{locale}/customers` | |
| `app/[locale]/(dashboard)/customers/[id]/page.tsx` | `/{locale}/customers/:id` | dynamic |
| `app/[locale]/(dashboard)/customers/loyalty/page.tsx` | `/{locale}/customers/loyalty` | |
| `app/[locale]/(dashboard)/dashboard/page.tsx` | `/{locale}/dashboard` | actual dashboard segment |
| `app/[locale]/(dashboard)/employees/page.tsx` | `/{locale}/employees` | |
| `app/[locale]/(dashboard)/employees/[id]/page.tsx` | `/{locale}/employees/:id` | dynamic |
| `app/[locale]/(dashboard)/employees/payroll/page.tsx` | `/{locale}/employees/payroll` | |
| `app/[locale]/forgot-password/page.tsx` | `/{locale}/forgot-password` | |
| `app/[locale]/(dashboard)/gold-center/page.tsx` | `/{locale}/gold-center` | route group excluded |
| `app/[locale]/(dashboard)/gold-center/live-prices/page.tsx` | `/{locale}/gold-center/live-prices` | |
| `app/[locale]/(dashboard)/gold-center/price-history/page.tsx` | `/{locale}/gold-center/price-history` | |
| `app/[locale]/(dashboard)/gold-center/pricing-rules/page.tsx` | `/{locale}/gold-center/pricing-rules` | |
| `app/[locale]/(dashboard)/gold-center/settings/market-data/page.tsx` | `/{locale}/gold-center/settings/market-data` | |
| `app/[locale]/(dashboard)/inventory/page.tsx` | `/{locale}/inventory` | |
| `app/[locale]/(dashboard)/inventory/[id]/page.tsx` | `/{locale}/inventory/:id` | dynamic |
| `app/[locale]/(dashboard)/inventory/adjustments/page.tsx` | `/{locale}/inventory/adjustments` | |
| `app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx` | `/{locale}/inventory/diamond-jewellery` | |
| `app/[locale]/(dashboard)/inventory/gem-stone/page.tsx` | `/{locale}/inventory/gem-stone` | |
| `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx` | `/{locale}/inventory/gold-by-piece` | |
| `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx` | `/{locale}/inventory/gold-by-weight` | |
| `app/[locale]/(dashboard)/inventory/locations/page.tsx` | `/{locale}/inventory/locations` | |
| `app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx` | `/{locale}/inventory/loose-diamond` | |
| `app/[locale]/(dashboard)/inventory/loose-gem-stone/page.tsx` | `/{locale}/inventory/loose-gem-stone` | |
| `app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx` | `/{locale}/inventory/loose-pearl` | |
| `app/[locale]/(dashboard)/inventory/manufacturing/page.tsx` | `/{locale}/inventory/manufacturing` | |
| `app/[locale]/(dashboard)/inventory/pearl/page.tsx` | `/{locale}/inventory/pearl` | |
| `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx` | `/{locale}/inventory/stock-audit` | |
| `app/[locale]/(dashboard)/inventory/transfers/page.tsx` | `/{locale}/inventory/transfers` | |
| `app/[locale]/(dashboard)/inventory/workshop/page.tsx` | `/{locale}/inventory/workshop` | |
| `app/[locale]/login/page.tsx` | `/{locale}/login` | |
| `app/[locale]/(dashboard)/notifications/page.tsx` | `/{locale}/notifications` | |
| `app/[locale]/(dashboard)/pos/page.tsx` | `/{locale}/pos` | |
| `app/[locale]/(dashboard)/reports/page.tsx` | `/{locale}/reports` | |
| `app/[locale]/(dashboard)/reports/exports/page.tsx` | `/{locale}/reports/exports` | |
| `app/[locale]/(dashboard)/reports/inventory-valuation/page.tsx` | `/{locale}/reports/inventory-valuation` | |
| `app/[locale]/reset-password/page.tsx` | `/{locale}/reset-password` | |
| `app/[locale]/(dashboard)/sales/page.tsx` | `/{locale}/sales` | |
| `app/[locale]/(dashboard)/sales/customer-gold/page.tsx` | `/{locale}/sales/customer-gold` | |
| `app/[locale]/(dashboard)/sales/customer-gold/drafts/page.tsx` | `/{locale}/sales/customer-gold/drafts` | |
| `app/[locale]/(dashboard)/sales/customer-gold/history/page.tsx` | `/{locale}/sales/customer-gold/history` | |
| `app/[locale]/(dashboard)/sales/exchanges/page.tsx` | `/{locale}/sales/exchanges` | |
| `app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx` | `/{locale}/sales/gift-vouchers` | |
| `app/[locale]/(dashboard)/sales/installments/page.tsx` | `/{locale}/sales/installments` | |
| `app/[locale]/(dashboard)/sales/reservations/page.tsx` | `/{locale}/sales/reservations` | |
| `app/[locale]/(dashboard)/sales/reservations/[id]/receipt-history/page.tsx` | `/{locale}/sales/reservations/:id/receipt-history` | dynamic |
| `app/[locale]/(dashboard)/sales/reservations/receipts/[receiptId]/page.tsx` | `/{locale}/sales/reservations/receipts/:receiptId` | dynamic |
| `app/[locale]/(dashboard)/sales/returns/page.tsx` | `/{locale}/sales/returns` | |
| `app/[locale]/(dashboard)/sales/search-print/page.tsx` | `/{locale}/sales/search-print` | |
| `app/[locale]/(dashboard)/settings/page.tsx` | `/{locale}/settings` | |
| `app/[locale]/(dashboard)/settings/barcode-codes/page.tsx` | `/{locale}/settings/barcode-codes` | |
| `app/[locale]/(dashboard)/settings/onboarding/page.tsx` | `/{locale}/settings/onboarding` | |
| `app/[locale]/(dashboard)/settings/tax/page.tsx` | `/{locale}/settings/tax` | |
| `app/[locale]/(dashboard)/settings/users/page.tsx` | `/{locale}/settings/users` | |
| `app/[locale]/setup/page.tsx` | `/{locale}/setup` | |
| `app/[locale]/signup/page.tsx` | `/{locale}/signup` | |
| `app/[locale]/(dashboard)/suppliers/page.tsx` | `/{locale}/suppliers` | |
| `app/[locale]/(dashboard)/suppliers/[id]/page.tsx` | `/{locale}/suppliers/:id` | dynamic |
| `app/[locale]/(dashboard)/suppliers/investment-gold/page.tsx` | `/{locale}/suppliers/investment-gold` | |
| `app/[locale]/(dashboard)/suppliers/purchases/page.tsx` | `/{locale}/suppliers/purchases` | existing compatibility redirect to inventory |
| `app/[locale]/test/ux1-reference/page.tsx` | `/{locale}/test/ux1-reference` | test surface |
| `app/[locale]/test/ux4-components-reference/page.tsx` | `/{locale}/test/ux4-components-reference` | test surface |
| `app/test/print-export/page.tsx` | `/test/print-export` | non-localized test surface |
| `app/test/ux1-reference/page.tsx` | `/test/ux1-reference` | non-localized test surface |

## 4. Navigation Inventory

All application navigation producers were searched for `href`, `Link`, router
push/replace, redirects, pathname/path/route/url, breadcrumbs, sidebar,
menus, and navigation targets. The inventory below groups identical producer
families while preserving their target sets and dynamic behavior.

| ID | Source / Producer | Current Target Set or Pattern | Canonical Check | Category | Defect |
|---|---|---|---|---|---|
| NAV-001 | `components/layout/sidebar.tsx` | Dashboard, POS, Sales, Customers, CGP drafts, Inventory, Transfers, Workshop, Inventory Count, Gold Center, Suppliers, Accounting, Chart, Reports, Treasury, Employees, Users, Audit, Approvals, Settings | All targets exist in route map; permission filtering preserved | VALID_CANONICAL | NO |
| NAV-002 | `features/dashboard/components/command-palette.tsx` | `/dashboard`, `/pos`, `/sales`, `/inventory`, `/customers`, `/suppliers`, `/accounting`, `/employees`, `/reports`, `/audit`, `/approvals`, `/settings` | All targets exist; router uses localized navigation helper | VALID_CANONICAL | NO |
| NAV-003 | `features/dashboard/components/quick-actions.tsx` | `/pos`, `/customers`, `/inventory`, `/suppliers`, `/accounting`, `/reports`, `/approvals` | All targets exist | VALID_CANONICAL | NO |
| NAV-004 | `components/layout/breadcrumbs.tsx` | Dynamic accumulated parent hrefs | Pre-fix emitted `/dashboard/{segments}`; fixed to `/{segments}` | BREADCRUMB_CONFIG_DEFECT | YES, fixed |
| NAV-005 | `features/gold-center/components/GoldMarketAdminPanels.tsx` | Gold Center live-prices, pricing-rules, price-history, settings/market-data | All four page files exist | VALID_CANONICAL | NO |
| NAV-006 | Dashboard page/widgets | `/pos`, `/sales`, `/inventory`, `/customers`, `/accounting`, `/reports` | All targets exist | VALID_CANONICAL | NO |
| NAV-007 | Header search/profile/notifications | `/inventory/:id`, `/customers`, `/sales`, `/notifications`, `/settings` | Dynamic target is an existing route pattern; static targets exist | VALID_CANONICAL | NO |
| NAV-008 | Inventory pages/forms | `/inventory`, `/inventory/locations`, `/inventory/:id`, `/suppliers/purchases` | All routes exist; supplier purchases is an existing compatibility redirect to canonical Inventory | INTENTIONAL_LEGACY_COMPATIBILITY | NO |
| NAV-009 | Supplier pages | `/suppliers`, `/suppliers/:id`, `/suppliers/investment-gold` | All targets exist | VALID_CANONICAL | NO |
| NAV-010 | Employee pages | `/employees`, `/employees/:id`, `/employees/payroll` | All targets exist | VALID_CANONICAL | NO |
| NAV-011 | Customer pages | `/customers`, `/customers/:id`, `/customers/loyalty` | All targets exist | VALID_CANONICAL | NO |
| NAV-012 | Sales pages | `/sales`, `/sales/search-print`, `/sales/returns`, `/sales/exchanges`, `/sales/reservations`, customer-gold paths, installments, gift-vouchers, `/pos` | All targets exist | VALID_CANONICAL | NO |
| NAV-013 | Reservation helpers/pages | `/sales/search-print?search=...`, reservation receipt-history/detail patterns | Route patterns exist; query retained | VALID_CANONICAL | NO |
| NAV-014 | Reports/settings/onboarding pages | `/reports`, `/reports/exports`, `/reports/inventory-valuation`, `/settings`, `/settings/tax`, `/settings/users`, `/settings/onboarding`, `/inventory/locations`, `/accounting` | All targets exist | VALID_CANONICAL | NO |
| NAV-015 | Attachments and report anchors | `/api/reports/...`, external file URLs, `#...` anchors | API/external/fragment links are not UI route targets | API_LINK_NOT_UI_NAVIGATION / EXTERNAL_LINK | NO |

## 5. Broken Route Inventory

See the complete emitted-family table in
`docs/navigation/DARFUS_NAVIGATION_BROKEN_ROUTE_INVENTORY.md`.

The confirmed defect was one shared breadcrumb producer, not a project-wide
literal `/dashboard/` replacement. The post-fix scan retains only legitimate
dashboard references: the actual dashboard page, dashboard permission rule,
dashboard navigation entry, and dashboard component imports.

## 6. Files Changed

| File | Change | Scope |
|---|---|---|
| `components/layout/breadcrumbs.tsx` | Descendant href construction now uses actual pathname segments; synthetic home crumb remains display-only | Navigation only |
| `tests/navigation-canonical-route-audit.test.cjs` | Added two focused static route/breadcrumb contract tests | Navigation test only |
| `docs/navigation/DARFUS_NAVIGATION_BROKEN_ROUTE_INVENTORY.md` | Audit artifact | Documentation |
| `docs/navigation/DARFUS_NAVIGATION_CANONICAL_ROUTE_AUDIT_AND_FIX_01_REPORT.md` | Final report | Documentation |

The first two source/test paths were already untracked in the pre-change
worktree status; they are reported as pre-existing worktree drift plus the
intentional in-place control change. No unrelated path was cleaned, restored,
or reset.

## 7. Exact Before/After Paths

| Case | Before | After | Proof |
|---|---|---|---|
| `/ar/gold-center` parent crumb | `/ar/dashboard/gold-center` | `/ar/gold-center` | route file and AR browser |
| `/ar/gold-center/pricing-rules` Gold Center crumb | `/ar/dashboard/gold-center` | `/ar/gold-center` | route file and AR browser |
| `/en/gold-center` parent crumb | `/en/dashboard/gold-center` | `/en/gold-center` | route file and EN browser |
| `/en/gold-center/pricing-rules` Gold Center crumb | `/en/dashboard/gold-center` | `/en/gold-center` | route file and EN browser |

The home crumb remains `/ar/dashboard` or `/en/dashboard` and is not changed.

## 8. Gold Center Validation

Filesystem/build proof:

- `app/[locale]/(dashboard)/gold-center/page.tsx` → `/{locale}/gold-center`.
- `app/[locale]/(dashboard)/gold-center/pricing-rules/page.tsx` → `/{locale}/gold-center/pricing-rules`.
- No `app/[locale]/(dashboard)/dashboard/gold-center/page.tsx` exists.
- Gold Center section links resolve to `/gold-center/live-prices`,
  `/gold-center/pricing-rules`, `/gold-center/price-history`, and
  `/gold-center/settings/market-data`.

## 9. Other Corrected Navigation Paths

No other source location required a separate correction. The breadcrumb fix is
shared and covers the parent links for all current non-dashboard descendants.

## 10. Navigation Paths Confirmed Valid

The audit confirmed the static Sidebar, Command Palette, Quick Actions,
Dashboard cards/widgets, Header links, Gold Center section navigation, and
page-local links against the route map. Existing dynamic IDs were checked as
route patterns. The existing `/suppliers/purchases` page is an intentional
compatibility route whose current implementation redirects to `/inventory`; it
was not changed because it is not a broken target or a 404.

## 11. Focused Tests

Commands:

```text
node --test tests/navigation-canonical-route-audit.test.cjs
node --test tests/navigation-canonical-route-audit.test.cjs tests/ux3-shell-navigation.test.cjs
```

Results:

- Focused navigation test: 2 passed, 0 failed.
- Navigation regression set: 5 passed, 0 failed.
- Assertions cover synthetic dashboard crumb exclusion, Gold Center route
  existence, absence of `/dashboard/gold-center`, Sidebar catalog, permissions,
  breadcrumb landmarks, and shell navigation contracts.

## 12. Typecheck

`npm run typecheck` → exit 0 / PASS.

## 13. Build

`npm run build` → exit 0 / PASS.

The authoritative build emitted the expected localized routes, including:
`/ar/gold-center`, `/en/gold-center`, `/ar/gold-center/pricing-rules`, and
`/en/gold-center/pricing-rules`. No build configuration or `next-env.d.ts` was
changed.

## 14. AR Browser

Authenticated local browser proof on `http://localhost:3000`:

1. Dashboard → Gold Center: `/ar/dashboard` → `/ar/gold-center`, page heading
   `المركز` present.
2. Gold Center → Pricing Rules: `/ar/gold-center` →
   `/ar/gold-center/pricing-rules`, page heading `قواعد التسعير` present.
3. Pricing Rules breadcrumb → Gold Center: resolved href `/ar/gold-center`
   and arrived there.
4. Gold Center breadcrumb → Dashboard: resolved href `/ar/dashboard` and
   arrived at Dashboard with the dashboard heading present.

AR result: `AR_NAVIGATION = PASS`.

## 15. EN Browser

Authenticated local browser proof on `http://localhost:3000`:

1. Language switch reached `/en/dashboard`.
2. Dashboard → Gold Center: `/en/dashboard` → `/en/gold-center`, page heading
   `Gold Center` present.
3. Gold Center → Pricing Rules: `/en/gold-center` →
   `/en/gold-center/pricing-rules`.
4. Pricing Rules breadcrumb exposed `/en/gold-center`.
5. Pricing Rules → Gold Center → Dashboard ended at `/en/dashboard` with the
   English dashboard heading present.

EN result: `EN_NAVIGATION = PASS`.

## 16. Cross-Module Smoke

Read-only page-load smoke reached, with no route Not Found page observed:

`/ar/dashboard`, `/ar/gold-center`, `/ar/sales`,
`/ar/sales/search-print`, `/ar/sales/gift-vouchers`, `/ar/customers`,
`/ar/inventory`, `/ar/accounting`, `/ar/accounting/treasury`, `/ar/settings`,
`/ar/employees`, `/ar/suppliers`.

Page identity was confirmed from each page's rendered main content. The first
generic text scan falsely matched a `404` substring within page data; direct
DOM inspection confirmed Inventory rendered its normal table and all listed
pages had their expected main content.

## 17. Console / Network / 404 Evidence

| Evidence | Result |
|---|---|
| Browser console error logs during AR/EN navigation | 0 observed |
| Browser console warning logs during AR/EN navigation | 0 observed |
| Application page errors | 0 observed |
| Navigation 404 pages | 0 observed |
| Corrected URLs reached | All reached expected URL and page identity |
| Request-failure event stream | Not exposed by the selected read-only browser surface; no failed navigation surfaced |

`NAVIGATION_404 = 0`, `CONSOLE_APPLICATION_ERRORS = 0`, and
`UNEXPECTED_PAGE_ERRORS = 0` are based on the captured browser evidence.

## 18. DB / Business Safety

This control performed no direct DB command and no POST/PUT/PATCH/DELETE
business request. Browser work was navigation/page-load only. No business
transaction, inventory, accounting, tax, authentication, permission, or API
implementation was changed.

```text
POST_BUSINESS_REQUESTS = 0
PUT_BUSINESS_REQUESTS = 0
PATCH_BUSINESS_REQUESTS = 0
DELETE_BUSINESS_REQUESTS = 0
DB_BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
```

The official database was not targeted by this control.

## 19. Diff / Hash / Rollback

Baseline:

- Branch: `main`
- HEAD: `1657b0e9ba580faef69be48f04637835c201b521`
- Pre-change worktree status: 1033 status entries, including 891 untracked
  entries; pre-existing drift preserved.
- `next-env.d.ts`: pre-existing owner-accepted generated drift, SHA
  `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`; not
  edited or reverted.

After:

- `components/layout/breadcrumbs.tsx` SHA:
  `4FDE0826606079425E8E87DC068EF6CF8174CC0E1B733AFDC16855EC683995FF`
- `tests/navigation-canonical-route-audit.test.cjs` SHA:
  `ADEB07587F3CDD3B0F462EDF451F2FB63E3304BEF5F6A54D99DD4B53938EDFD3`
- Only the declared navigation source/test paths and the two documentation
  artifacts were written by this control.

Rollback rehearsal is a source-only, one-line reversal of the href expression
documented in Section 7; no rollback was executed because it would reintroduce
the confirmed defect. No destructive Git command was used.

## 20. Final Gate

```text
CANONICAL_ROUTE_MAP_COMPLETE = YES
ALL_NAVIGATION_TARGETS_AUDITED = YES
GOLD_CENTER_CANONICAL_PATH = /{locale}/gold-center
KNOWN_FALSE_DASHBOARD_PREFIX_LINKS = 0
BROKEN_INTERNAL_TARGETS = 0
FOCUSED_NAVIGATION_TESTS = PASS
TYPECHECK = PASS
BUILD = PASS
AR_NAVIGATION = PASS
EN_NAVIGATION = PASS
NAVIGATION_404 = 0
CONSOLE_APPLICATION_ERRORS = 0
BUSINESS_LOGIC_CHANGED = NO
BACKEND_CHANGED = NO
DB_SCHEMA_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
DB_BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
SOURCE_CHANGES_OUTSIDE_NAVIGATION_SCOPE = 0
P0 = 0
P1 = 0
GATE = PASS_DARFUS_CANONICAL_NAVIGATION_ROUTE_AUDIT_AND_FIX
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_RESUME_NEXT_PROGRAM
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-NAVIGATION-CANONICAL-ROUTE-AUDIT-AND-FIX-01
MODE = READ_FIRST_THEN_MINIMUM_SAFE_NAVIGATION_ONLY_FIX
OWNER_APPROVAL = EXPLICIT
ROOT_CAUSE = BREADCRUMB_CONFIG_DEFECT_SYNTHETIC_DASHBOARD_CRUMB_LEAKAGE
CANONICAL_ROUTE_MAP_COMPLETE = YES
ALL_NAVIGATION_TARGETS_AUDITED = YES
BROKEN_NAVIGATION_LINKS_FOUND = 1_LOGICAL_SOURCE_DEFECT_2_ROUTE_FAMILIES
BROKEN_NAVIGATION_LINKS_FIXED = 1_LOGICAL_SOURCE_DEFECT_2_ROUTE_FAMILIES
KNOWN_FALSE_DASHBOARD_PREFIX_LINKS = 0
BROKEN_INTERNAL_TARGETS = 0
GOLD_CENTER_CANONICAL_PATH = /{locale}/gold-center
FOCUSED_NAVIGATION_TESTS = PASS
TYPECHECK = PASS
BUILD = PASS
AR_NAVIGATION = PASS
EN_NAVIGATION = PASS
NAVIGATION_404 = 0
CONSOLE_APPLICATION_ERRORS = 0
BUSINESS_LOGIC_CHANGED = NO
BACKEND_CHANGED = NO
DB_SCHEMA_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
DB_BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
SOURCE_CHANGES_OUTSIDE_NAVIGATION_SCOPE = 0
P0 = 0
P1 = 0
GATE = PASS_DARFUS_CANONICAL_NAVIGATION_ROUTE_AUDIT_AND_FIX
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_RESUME_NEXT_PROGRAM
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Wait for Owner review.
