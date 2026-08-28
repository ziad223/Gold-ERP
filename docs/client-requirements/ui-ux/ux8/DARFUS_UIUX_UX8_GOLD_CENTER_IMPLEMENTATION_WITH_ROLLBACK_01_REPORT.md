# DARFUS ERP — UX-8 Gold Center Implementation With Rollback — Final Report

## الملخص التنفيذي

| السؤال | النتيجة |
|---|---|
| ما الذي تم تغييره؟ | تحسين عرض Gold Center المشترك، الجداول الكثيفة، الاستجابة، وحفظ أسماء وصولية لحقول أسعار الكارات الموجودة فقط. |
| ما الذي لم يتغير؟ | Provider، Gold Rate، BID/SPOT/ASK، العملة، freshness، snapshots، الحسابات، الضرائب، المخزون، API، DB، الصلاحيات، والمنطق التجاري. |
| Gold Rate authority محفوظة؟ | نعم، القيم ما زالت server/API-owned. |
| Provider authority محفوظة؟ | نعم؛ `GOLDAPI_IO` ظهر من المصدر الحالي ولم يُغيّر. |
| AR/EN؟ | PASS؛ `rtl` للعربي و`ltr` للإنجليزي. |
| Dark/Light؟ | PASS. |
| Desktop/Tablet/Mobile؟ | PASS؛ لا يوجد page overflow، والـdense tables لها overflow محلي عند الحاجة. |
| Embedded components؟ | PASS؛ status, metrics, tables, provider/settings, empty/error, focus/disabled states فُحصت. |
| Long/dense data؟ | PASS؛ bounded data frames. |
| Accessibility؟ | PASS؛ labels، keyboard focus، focus-visible، textual status، reduced motion. |
| Console/hydration؟ | 0 application `warn/error` و0 hydration error observed. |
| Tests/typecheck/build؟ | PASS؛ UX8 4/4، Gold regressions 3/3، typecheck، build 130/130 pages. |
| Main DB control-owned mutation؟ | 0. |
| Rollback؟ | PASS؛ before/after hash copy rehearsal أعاد hashes المتوقعة. |

النتيجة: `GATE = PASS_DARFUS_UIUX_UX8_GOLD_CENTER_IMPLEMENTATION_WITH_ROLLBACK`.

## 1. Scope and preserved authorities

UX-8 was limited to presentation and interaction UI. The following remained frozen and unchanged: provider/rate authority, numeric semantics, freshness and timestamp semantics, historical snapshots, tax/accounting, inventory/GBW weight basis, API contracts, database/schema, permissions and security.

Evidence:

- `features/gold-center/components/GoldMarketAdminPanels.tsx` keeps the existing GET/PUT/POST paths, permission `gold.manage_pricing_policy`, handlers, and source values.
- `app/[locale]/(dashboard)/gold-center/page.tsx` receives only a localized `aria-label` on existing karat-rate inputs; the value, normalization and `saveKaratPrices` handler are unchanged.
- `features/gold-center/components/GoldMarketAdminPanels.module.css` is scoped presentation CSS only.

## 2. Route / surface coverage

Covered routes in AR and EN:

- `/gold-center`
- `/gold-center/live-prices`
- `/gold-center/price-history`
- `/gold-center/pricing-rules`
- `/gold-center/settings/market-data`

The route inventory and authority map are in `DARFUS_UX8_ROUTE_SURFACE_INVENTORY.md` and `DARFUS_UX8_AUTHORITY_MAP.md`. The dashboard widget and `use-gold.ts` were inspected but not changed.

## 3. Before snapshot and worktree safety

Before source edits, the current dirty worktree was preserved. Captured baseline: `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`, 132 tracked modified files, 5554 untracked files, and 11 stashes. No cleanup, reset, restore, stash, add, or commit was run.

Before hashes are recorded in `DARFUS_UX8_BEFORE_HASH_MANIFEST.md` and copies are under `backups/ui-ux/PRE_UX8_GOLD_CENTER_20260828T171500Z/`.

## 4. Implementation summary

Applied only:

1. A scoped CSS module for surfaces, hierarchy, metrics, provider cards, data frames, dense tables, focus-visible styling, responsive behavior and reduced motion.
2. Presentation classes/localized headings and navigation in the shared Gold Center admin panel.
3. Localized accessible names for the eight existing karat rate inputs: AR `السعر/جرام {K}K`, EN `Rate/g {K}K`.
4. A focused UX8 test covering presentation scope, preserved authority strings, responsive CSS and labels.

No new business field, route, provider, formula, setting, permission, API, migration or DB object was added.

## 5. AR/EN and theme proof

AR browser proof returned `dir=rtl`, localized headings and table labels, authenticated Company/Branch context, `HEALTHY · FRESH`, `AED`, and the server-owned provider/source values. EN returned `dir=ltr` with equivalent English labels. Both had `bodyOverflow=0` and eight labeled rate inputs after the async data load.

Light/Dark evidence was collected for both locales at desktop, tablet and mobile dimensions. Screenshots and JSON observations are under `backups/ui-ux/UX8_GOLD_CENTER_20260828T171500Z/`. No warning/error console entries were observed in the final AR check; the browser’s informational React DevTools/HMR messages are not application errors. The pre-existing `next dev` process observed during process inspection was not started or modified by UX8; port 3000 was owned by the existing `next start` listener.

## 6. Responsive / dense data proof

| Viewport | Result |
|---|---|
| 1440×900 | Full layout, no body overflow |
| 840×1180 | Responsive grids and bounded data frames, no body overflow |
| 390×844 | Local table scrolling only where a dense table exceeds the viewport, no body overflow |

## 7. Accessibility proof

- Existing editable rate inputs are programmatically named in both locales.
- Keyboard focus reached the labeled rate input and `Tab` moved through the interactive sequence.
- Scoped `:focus-visible` and reduced-motion rules are present.
- Status meaning is textual (`HEALTHY · FRESH`, mode, provider and timestamps), not color-only.
- Semantic table elements/headings remain in place.
- No UX4C drawer/focus code was changed.

## 8. Tests, typecheck and build

| Check | Result |
|---|---|
| `node --test tests/ux8-gold-center-presentation.test.cjs` | PASS, 4/4 |
| `node --test tests/gold-live-feed-05-contract.test.cjs tests/gold-by-weight-sidebar-navigation-02-r2.test.cjs` | PASS, 3/3 |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; Next.js 16.2.9, static pages 130/130 |

## 9. Main DB safety and runtime

`SELECT current_database()` confirmed `darfus_erp` for the official runtime. Docker showed backend up, PostgreSQL healthy, and Redis healthy. UX8 did not click any Gold settings save, connection-test, fixing, pricing, receive, POS, accounting or inventory mutation control. Recent backend evidence for this control contains GET Gold reads (`/gold-pricing/market/settings`, `/market/quotes/history`, `/policies/history`, `/gold/karat-prices`, `/gold/fixings`) and no UX8-owned business write.

`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`
`MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`
`MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`

## 10. After snapshot and rollback rehearsal

After source copies and hashes are recorded in `DARFUS_UX8_AFTER_HASH_MANIFEST.md` and `backups/ui-ux/UX8_GOLD_CENTER_20260828T171500Z/after-source/`.

Rollback rehearsal used isolated evidence copies only:

- restored the pre-UX8 shared panel and page copies; hashes matched the before manifest;
- reapplied the after copies; hashes matched the after manifest;
- product source was never replaced or reverted during the rehearsal.

Evidence: `backups/ui-ux/UX8_GOLD_CENTER_20260828T171500Z/rollback/ROLLBACK_REHEARSAL_HASHES.txt`.

## 11. Files changed for UX-8

Intentional UX8 implementation/test files:

- `features/gold-center/components/GoldMarketAdminPanels.tsx` — presentation classes/localized display structure; handlers and authorities preserved.
- `features/gold-center/components/GoldMarketAdminPanels.module.css` — new scoped presentation styles.
- `app/[locale]/(dashboard)/gold-center/page.tsx` — existing rate-input accessible names only.
- `tests/ux8-gold-center-presentation.test.cjs` — focused semantic/presentation test.

Documentation/evidence files are under `docs/client-requirements/ui-ux/ux8/`, the UX2 ledger/rollback register, and the six project registers. Pre-existing unrelated worktree changes are not attributed to UX8.

## 12. Risk and disposition

| Item | Classification | Severity | Disposition |
|---|---|---|---|
| Pre-existing dirty worktree | Environment/evidence context | P3 | Preserved; before/after UX8 snapshots are file-scoped |
| Pre-existing `next dev` process with no port-3000 listener | Environment observation | P3 | Not started or modified; main tested listener was existing `next start` |
| No UX8 business defect observed | — | P0/P1 = 0 | No additional fix required |

## 13. Final tokens

`CURRENT_CONTROL = DARFUS-UIUX-UX8-GOLD-CENTER-IMPLEMENTATION-WITH-ROLLBACK-01`

`MODE = PRESENTATION_AND_INTERACTION_UI_ONLY_BUSINESS_AUTHORITY_FROZEN`

`EXECUTE_THIS_CONTROL = YES`
`READ_FIRST = YES`
`UX7_STATUS = CLOSED_WITH_OWNER_EVIDENCE_WAIVER`
`UX8_ROUTE_SURFACE_INVENTORY = COMPLETE`
`UX8_SCOPE_CLASSIFICATION = COMPLETE`
`UX8_AUTHORITY_MAP = COMPLETE`
`MAIN_DB_IDENTITY_VERIFIED = YES (darfus_erp)`
`UX8_BEFORE_SNAPSHOT = PASS`
`UX8_BEFORE_HASH_MANIFEST = PASS`
`PRODUCTION_SOURCE_FILES_CHANGED = 3 (scoped)`
`TEST_FILES_CHANGED = 1 (focused)`
`DOCUMENTATION_FILES_CHANGED = UX8 artifacts/register entries only`

`GOLD_RATE_AUTHORITY_CHANGED = NO`
`GOLD_PROVIDER_AUTHORITY_CHANGED = NO`
`GOLD_NUMERIC_SEMANTICS_CHANGED = NO`
`GOLD_FRESHNESS_SEMANTICS_CHANGED = NO`
`DOWNSTREAM_GOLD_CALCULATION_CHANGED = NO`
`HISTORICAL_GOLD_SNAPSHOT_CHANGED = NO`
`POS_GBW_WEIGHT_BASIS_CHANGED = NO`
`GBW_OVERRIDE_RULE_CHANGED = NO`
`TAX_LOGIC_CHANGED = NO`
`ACCOUNTING_LOGIC_CHANGED = NO`
`PERMISSIONS_CHANGED = NO`
`SECURITY_AUTHORITY_CHANGED = NO`
`API_CHANGED = NO`
`DATABASE_CHANGED = NO`
`DB_SCHEMA_CHANGED = NO`
`MIGRATIONS = 0`

`UX8_AR = PASS`
`UX8_EN = PASS`
`AR_UI_CHROME_LEAKS = NO`
`EN_UI_CHROME_LEAKS = NO`
`UX8_RTL_LTR = PASS`
`UX8_LIGHT = PASS`
`UX8_DARK = PASS`
`UX8_THEME_PARITY_SWEEP = PASS`
`UX8_DESKTOP = PASS`
`UX8_TABLET = PASS`
`UX8_MOBILE = PASS`
`UX8_EMBEDDED_COMPONENT_SWEEP = PASS`
`UX8_LONG_VALUE_STRESS = PASS`
`UX8_DENSE_DATA = PASS`
`UX8_BODY_OVERFLOW = 0`
`UX8_ACCESSIBILITY = PASS`
`UX4C_FOCUS_REGRESSION = NO`
`UX8_MOTION = PASS`
`UX8_REAL_BROWSER = PASS`
`CONSOLE_APPLICATION_ERRORS = 0`
`HYDRATION_ERRORS = 0`
`UX8_CONTROL_OWNED_GOLD_RATE_MUTATIONS = 0`
`UX8_CONTROL_OWNED_PROVIDER_MUTATIONS = 0`
`UX8_FOCUSED_TESTS = PASS`
`AFFECTED_GOLD_REGRESSION = PASS`
`TYPECHECK = PASS`
`BUILD = PASS`
`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`
`MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`
`MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`
`UX8_AFTER_SNAPSHOT = PASS`
`UX8_CHANGE_LEDGER_UPDATED = YES`
`UX8_ROLLBACK_REGISTER_UPDATED = YES`
`UX8_ROLLBACK_REHEARSAL = PASS`
`UX8_BEFORE_HASH_PARITY = PASS`
`UX8_AFTER_HASH_PARITY = PASS`
`P0 = 0`
`P1 = 0`
`P2 = 0`
`P3 = 0`
`GATE = PASS_DARFUS_UIUX_UX8_GOLD_CENTER_IMPLEMENTATION_WITH_ROLLBACK`
`UX8_STATUS = CLOSED_PENDING_OWNER_REVIEW`
`NEXT_RECOMMENDED_STEP = UX-9_ACCOUNTING_TREASURY_AFTER_OWNER_REVIEW`
`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

## 14. Stop

UX-8 is complete. Do not start UX-9, client-requirements implementation, production work, migration, Gold logic, provider changes, tax/accounting changes, permission changes, or DB work automatically. Await Owner review.

