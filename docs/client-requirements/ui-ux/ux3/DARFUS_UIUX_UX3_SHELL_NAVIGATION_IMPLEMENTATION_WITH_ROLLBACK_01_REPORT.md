# DARFUS ERP — UX-3 Shell / Navigation Implementation Report

تم تنفيذ نطاق UX-3 المحدود على الـApp Shell والتنقل فقط. نجحت اختبارات UX3 والانحدار، ونجح `typecheck` و`build` وإثبات المتصفح AR/EN، مع صفر أخطاء console. لم يتم لمس Backend أو قاعدة البيانات أو أي workflow أعمال. الملاحظة الوحيدة P3 هي أن أداة المتصفح المتصلة لا تعرض Network panel مستقلة؛ لذلك تم إثبات حدود الشبكة من source scope وعدم استدعاء أي mutation، وسُجلت هذه المحدودية صراحة.

## Executive Summary

| Gate item | Result |
|---|---|
| UX-3 scope | PASS — shell/header/sidebar/breadcrumb/page container only |
| Permission behavior | PRESERVED — existing filter/catalog unchanged |
| Route contract | PRESERVED — no route rename/move/remove/redirect change |
| Business/API/DB behavior | UNCHANGED |
| Focused UX3 tests | PASS — 3/3 |
| Selected regressions | PASS — 33/33 |
| Typecheck / build | PASS / PASS |
| Browser AR/EN | PASS — Dashboard, POS, Inventory, Accounting, Gold Center, Settings |
| Responsive interaction | PASS — mobile drawer and desktop collapse |
| Console errors | 0 |
| Rollback rehearsal | PASS — isolated SHA-256 restore/reapply |
| Official DB writes | 0 |

## Owner Authorization

The supplied UX-3 control authorizes a minimum-safe implementation for shell/navigation with rollback proof. No authorization was inferred for business, database, permission, authentication, or route changes.

## Read First

Read before editing: `AGENTS.md`, project handoff, UX-2 report/artifacts, UX-2 change/rollback registers, and current locale/dashboard shell sources. The current source authority was found in `app/[locale]/layout.tsx`, dashboard layout, `CompanyDashboardShell`, `AppShell`, `Header`, `Sidebar`, context switchers, `PageHeader`, theme context, and UX-2 `app/globals.css` aliases.

The active `next-env.d.ts` status was not modified. A pre-existing generated artifact at `.tmp-count-browser-r5/next-env.d.ts` remains outside this batch.

## Git/Worktree Baseline

| Item | Before UX-3 |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Worktree | Dirty before UX-3 |
| Tracked modified count | 121 |
| Untracked count | 5214 |
| Stash count | 11 |
| Unrelated drift | Preserved; not cleaned/reset/stashed |
| UX-3 pre-snapshot | `backups/ui-ux/PRE_UX3_SHELL_20260828_023226/` |

## Shell Authority Map

The complete map is in `DARFUS_UX3_SHELL_AUTHORITY_MAP.md`. The key invariant is `NAV_VISIBILITY_PRESENTATION != PERMISSION_AUTHORITY`: the existing `groups`, permission values, `usePermissions`, `useOperator`, account type handling, and `permissionMatches` remain the authority.

## Before Snapshot

The pre-UX3 snapshot includes the shell-related production dependencies and exact hashes in `DARFUS_UX3_BEFORE_HASH_MANIFEST.md`. The snapshot was taken before source edits and includes existing locale/layout/context files as restore evidence.

## Before Hash Manifest

Machine-readable evidence: `backups/ui-ux/PRE_UX3_SHELL_20260828_023226/manifests/ux3-before-manifest.json` and `ux3-before-sha256.txt`.

## Before Screenshots

The baseline is in `backups/ui-ux/PRE_UX3_SHELL_20260828_023226/screenshots/`. It covers Dashboard AR/EN light/dark state pairs, POS AR/EN, Inventory AR/EN, Accounting AR/EN, Gold Center AR/EN, Settings AR/EN, and narrow representative Dashboard captures.

## Restore Map

`DARFUS_UX3_SHELL_RESTORE_MAP.md` defines the exact existing-file restore paths and identifies the new breadcrumbs/test files. No backend, migration, API, database, or module implementation file belongs to this restore map.

## UX-3 Scope

### In scope

- Header shell presentation and accessible mobile trigger.
- Sidebar navigation landmark, active route semantics, collapse semantics, and mobile close naming.
- Existing visual grouping preservation.
- Pathname/locale-derived breadcrumbs.
- Page-container width/spacing/focus scroll margin.
- UX-2 semantic token consumption and reduced-motion hooks.

### Explicitly out of scope

Business logic, API callers, database, migrations, accounting, tax, inventory authority, POS, Gold, Gift Voucher, CGP, barcode, print, pricing, idempotency, authentication, RBAC decisions, route permissions, redirects, and module screens.

## Files Changed

### Intentional UX-3 source/test delta

- `app/globals.css` — UX-3 shell styles; uses existing UX-2 aliases.
- `components/layout/app-shell.tsx` — shell/main semantic hooks and container class.
- `components/layout/header.tsx` — localized mobile/theme semantics and shell hook.
- `components/layout/sidebar.tsx` — nav landmark, active/collapse/close semantics and hook.
- `components/ui/page-header.tsx` — renders shell breadcrumbs above the existing header content.
- `components/layout/breadcrumbs.tsx` — new read-only pathname/locale presentation component.
- `tests/ux3-shell-navigation.test.cjs` — focused static boundary/accessibility tests.

All other pre-existing worktree changes are unrelated and were preserved. No backend source file was intentionally changed by UX-3.

## Header

The existing company, branch, operator, search, language, theme, notifications, profile, and logout actions remain unchanged. UX-3 adds only semantic classes and localized open/theme labels. `HEADER_BUSINESS_BEHAVIOR_CHANGED = NO`.

## Sidebar

The existing five visual groups and 21 hrefs remain. The existing permission filter and active prefix matching remain. The sidebar now has a named navigation landmark, `aria-current`, collapse `aria-controls/aria-expanded`, and a localized mobile close label.

## Navigation

No route was renamed, moved, removed, redirected, or made accessible by presentation code. Grouping remains visual only. `ROUTE_CONTRACT_CHANGED = NO`.

## Active State

Active links retain the current pathname logic and now expose `aria-current="page"`. UX-2 semantic selected-surface, primary-text, gold accent, and focus aliases are used; gold is not applied as a full navigation fill.

## Breadcrumbs

`components/layout/breadcrumbs.tsx` reads only `usePathname()` and `useLocale()`. It maps known route segments to AR/EN shell labels and marks the current page. It performs no API call, permission decision, or business calculation. `BREADCRUMB_BUSINESS_DATA_ACCESS = NO`.

## Page Container

The existing 1700px max-width and padding rhythm remain. UX-3 adds `min-width: 0`, mobile-safe padding, and `scroll-margin-top`. Internal module layouts were not changed.

## Module Context

The existing `PageHeader` remains the title/description/action owner. Breadcrumbs provide module/section/current-page context without adding a decorative hero or business fields.

## Responsive Shell

Desktop browser proof used 1440×900. Representative narrow proof used the browser viewport override and confirmed the localized menu trigger, visible navigation drawer, close action, and preserved active route. The browser rasterizer returned a 472px image surface for the narrow capture while retaining its own breakpoint environment; this harness limitation is documented, and responsive behavior is also protected by the existing `lg` shell classes and focused source tests.

## Mobile Navigation

Observed: `Open navigation`/`فتح القائمة` count 1; drawer open class present; `#primary-navigation` visible; localized close control present; close succeeded. No second workflow or business action was exposed.

## AR/EN

| Locale | Observed |
|---|---|
| AR | `lang=ar`, `dir=rtl`; shell, group labels, active state, breadcrumbs, mobile labels present |
| EN | `lang=en`, `dir=ltr`; shell, group labels, active state, breadcrumbs, mobile labels present |

## Dark/Light

Before/after paired Dashboard images were retained. The existing theme context and toggle remain the authority. UX-3 uses the existing UX-2 aliases and does not introduce a second token system.

## Motion

Shell transitions use `--motion-fast`/`--motion-standard`. No new animation system was introduced.

## Reduced Motion

The existing UX-2 global reduced-motion policy remains active, with UX-3 scoped transitions set to zero duration under `prefers-reduced-motion: reduce`.

## Accessibility

Named `header`, `aside`, `nav`, and `main` landmarks were observed. Links expose current-page semantics; collapse controls expose expanded state and controlled navigation; mobile controls have localized accessible names; focus-visible uses the UX2 focus alias; touch interaction was verified through the drawer proof.

## Module Isolation

No module form/table/action code was changed. No business API, route handler, database, migration, accounting, inventory, POS, Gold, Gift Voucher, or permission source was changed by UX-3.

## Tests

`node --test tests/ux3-shell-navigation.test.cjs` → PASS, 3/3.

The focused test protects route catalog presence, existing permission authority references, landmarks, active semantics, breadcrumb read-only boundaries, UX-2 token use, and reduced-motion coverage.

## Regression

Selected UX/navigation regressions passed 33/33, covering UX-1/UX-1R, Gold By Weight sidebar navigation, unified Inventory intake, closed Inventory Count UX, and POS Gift Voucher visual behavior.

## Typecheck/Build

- `npm run typecheck` → PASS, exit 0.
- `npm run build` → PASS, Next.js 16.2.9, 128 static routes, exit 0.

## Browser Evidence

Authenticated local main runtime at `http://localhost:3000`; no new frontend instance was started. AR/EN Dashboard, POS, Inventory, Accounting, Gold Center, and Settings each rendered one shell header/sidebar/main; tested pages exposed an active link and breadcrumbs. Mobile drawer and desktop collapse were executed as UI-state-only interactions. Console error count after the final route sweep: `0`.

The connected browser capability set did not expose a dedicated network-capture API. No UX-3 source changed network callers or routes; no POST/PUT/PATCH/DELETE was issued by this control. This is recorded as `NETWORK_CAPTURE_LIMITATION = P3_EVIDENCE_TOOL_LIMIT`, not as an unsupported claim about hidden requests.

## DB Zero Delta

No DB client, mutation API, business form, or write-capable endpoint was used. UX-3 changed only frontend shell source plus documentation/test evidence. `OFFICIAL_DB_WRITES = 0`; no migration, seed, transaction, inventory, accounting, tax, or permission write occurred.

## After Snapshot

The after source/hash evidence is in `backups/ui-ux/UX3_SHELL_NAVIGATION_20260828_023226/`, with screenshots, manifests, and command evidence. Final CSS hash is recorded in `DARFUS_UX3_AFTER_HASH_MANIFEST.md` and the machine manifest.

## Change Ledger

The UX2 change ledger now contains the UX3 row. It records UX3 as presentation-only, with the pre/post manifests and rollback proof.

## Rollback Proof

`backups/ui-ux/UX3_SHELL_NAVIGATION_20260828_023226/rollback-rehearsal-v3/rollback-proof.json` proves isolated classic restore and UX3 reapply SHA matches. The official worktree was not reset, restored, cleaned, or mutated by the rehearsal.

## Registers

The UX2 change/rollback registers and the six project evidence registers received documentation-only UX3 entries. No owner decision was assumed for business or architecture behavior.

## Gate

`GATE = PASS_DARFUS_UIUX_UX3_SHELL_NAVIGATION_IMPLEMENTATION_WITH_ROLLBACK`

The gate is PASS because the requested shell scope was implemented and evidenced, focused/regression tests and build pass, no P0/P1 exists, permission and route authorities are preserved, no business/API/DB mutation occurred, and rollback hashes match. The non-blocking browser network-panel limitation is recorded as P3 evidence tooling only.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX3-SHELL-NAVIGATION-IMPLEMENTATION-WITH-ROLLBACK-01
CURRENT_BATCH = UX3
MODE = SHELL_NAVIGATION_IMPLEMENTATION_WITH_ROLLBACK

PREVIOUS_UX2_BASELINE_PRESERVED = YES
UX3_PRE_SNAPSHOT = backups/ui-ux/PRE_UX3_SHELL_20260828_023226
UX3_AFTER_SNAPSHOT = backups/ui-ux/UX3_SHELL_NAVIGATION_20260828_023226
CURRENT_BRANCH = main
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
WORKTREE_PREEXISTING_DRIFT_PRESERVED = YES

APP_SHELL_SCOPE = IMPLEMENTED
HEADER_SCOPE = IMPLEMENTED
SIDEBAR_SCOPE = IMPLEMENTED
NAVIGATION_GROUPING_SCOPE = IMPLEMENTED_PRESENTATION_ONLY
BREADCRUMBS_SCOPE = IMPLEMENTED
PAGE_CONTAINER_SCOPE = IMPLEMENTED
RESPONSIVE_SHELL_SCOPE = IMPLEMENTED
MOBILE_NAVIGATION_SCOPE = IMPLEMENTED

PERMISSION_BEHAVIOR_CHANGED = NO
PERMISSION_AUTHORITY_PRESERVED = YES
ROUTE_CONTRACT_CHANGED = NO
REDIRECTS_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
API_CONTRACT_CHANGED = NO
DATABASE_SCHEMA_CHANGED = NO
DATABASE_DATA_CHANGED = NO
OFFICIAL_DB_WRITES = 0

AR_SHELL = PASS
EN_SHELL = PASS
RTL_LTR_SHELL = PASS
DARK_LIGHT_SHELL = PASS
REDUCED_MOTION = PASS
ACCESSIBILITY_SHELL = PASS
MOBILE_DRAWER = PASS
DESKTOP_COLLAPSE = PASS
CONSOLE_ERRORS = 0
NETWORK_CAPTURE = LIMITED_BROWSER_CAPABILITY_NO_MUTATION_CALLS

FOCUSED_UX3_TESTS = PASS_3_OF_3
REGRESSION_TESTS = PASS_33_OF_33
TYPECHECK = PASS
BUILD = PASS
ROLLBACK_REHEARSAL = PASS
CLASSIC_RESTORE_HASH_MATCH = PASS
UX3_REAPPLY_HASH_MATCH = PASS

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
P3_COUNT = 1
P4_COUNT = 0
GATE = PASS_DARFUS_UIUX_UX3_SHELL_NAVIGATION_IMPLEMENTATION_WITH_ROLLBACK
NEXT_RECOMMENDED_STEP = OWNER_REVIEW
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next Step

Owner review of the UX3 report and snapshot. UX-4 is not started and requires explicit approval.

## STOP

STOP. No automatic next batch. No business implementation, DB mutation, migration, deployment, or module redesign was started.
