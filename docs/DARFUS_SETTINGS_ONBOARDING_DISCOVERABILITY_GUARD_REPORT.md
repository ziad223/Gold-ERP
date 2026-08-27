# DARFUS ERP — Settings Onboarding Discoverability Guard Report

Control: `DARFUS-SETTINGS-ONBOARDING-DISCOVERABILITY-GUARD`

## 1. Verification Result

The onboarding route and page already existed, but the canonical Settings UI had no visible entry to it.

```text
ONBOARDING_ROUTE_EXISTS = YES
ONBOARDING_PAGE_EXISTS = YES
DISCOVERABLE_FROM_SETTINGS_UI_BEFORE = NO
EXISTING_ENTRY_COUNT_BEFORE = 0
```

This required the minimum safe change: one Settings card only.

## 2. Existing Settings Navigation Evidence

Reviewed:

- `app/[locale]/(dashboard)/settings/page.tsx`
- `app/[locale]/(dashboard)/settings/onboarding/page.tsx`
- Settings-related components and messages search.

Before the change, `settings/page.tsx` contained cards for Barcode/Inventory Codes and System Accounts, but no `/settings/onboarding` link and no onboarding/readiness label.

Added exactly one entry in the existing Settings card grid:

```tsx
<Link href="/settings/onboarding" data-testid="settings-onboarding-entry">
```

The label is:

- Arabic: `إعداد الشركة وجاهزية التشغيل`
- English: `Company Setup & Operational Readiness`

The existing Settings permission visibility remains unchanged; no permission or backend code was modified.

## 3. Browser Evidence

Read-only browser proof on Local Frontend:

- `/ar/settings`: Settings rendered and the Arabic entry was visible.
- One click reached `/ar/settings/onboarding`; Arabic onboarding rendered.
- `/en/settings`: Settings rendered and the English entry was visible.
- One click reached `/en/settings/onboarding`; English onboarding rendered.
- `data-testid="settings-onboarding-entry"` count after change: `1`.
- No duplicate entry, legacy `/setup` navigation, or hard-coded `/ar/`/`/en/` target.
- No visible fatal error or visible 5xx on the tested pages.

## 4. Decision: STOP or MINIMUM SAFE ADD

Decision: `MINIMUM_SAFE_ADD` was required because the entry was missing.

Only the Settings main page was changed. The onboarding page, readiness service, backend API, tax engine, inventory receive, accounting, and database were not changed.

## 5. Files Changed

Intentional files:

- `app/[locale]/(dashboard)/settings/page.tsx` — one discoverability card.
- `tests/settings-onboarding-discoverability.test.cjs` — focused recurrence guard.
- `docs/DARFUS_SETTINGS_ONBOARDING_DISCOVERABILITY_GUARD_REPORT.md` — this report.

No backend file, database, migration, configuration, secret, or business data changed.

## 6. Focused Tests

Passed:

- `node --test tests/settings-onboarding-discoverability.test.cjs` — 2/2.
- `node --test backend/tests/phase-03b-g2d-operational-readiness.test.cjs` — 4/4.
- `npm run typecheck` — PASS.

## 7. Recurrence Guard

`tests/settings-onboarding-discoverability.test.cjs` asserts:

1. onboarding route/page exists;
2. Settings contains exactly one onboarding entry;
3. Arabic and English labels exist;
4. target is the locale-preserving `/settings/onboarding` path;
5. no legacy `/setup` or hard-coded locale path is introduced.

Guard name: `USER_FACING_DASHBOARD_PAGE_DISCOVERABILITY` applied to Settings Onboarding.

## 8. Final Gate

```text
CURRENT_CONTROL = DARFUS-SETTINGS-ONBOARDING-DISCOVERABILITY-GUARD

ONBOARDING_ROUTE_EXISTS = YES
ONBOARDING_PAGE_EXISTS = YES
DISCOVERABLE_FROM_SETTINGS_UI_BEFORE = NO
EXISTING_ENTRY_COUNT_BEFORE = 0

SOURCE_CHANGE_REQUIRED = YES
SETTINGS_ONBOARDING_ENTRY_ADDED = YES
DISCOVERABLE_FROM_SETTINGS_UI_AFTER = YES
EXISTING_ENTRY_COUNT_AFTER = 1

AR_SETTINGS_BROWSER = PASS
AR_ONBOARDING_NAVIGATION = PASS
EN_SETTINGS_BROWSER = PASS
EN_ONBOARDING_NAVIGATION = PASS
NO_DUPLICATE_ONBOARDING_ENTRY = PASS
RECURRENCE_GUARD_TEST = PASS

BACKEND_CHANGED = NO
DATABASE_CHANGED = NO
MIGRATION_CREATED = NO
BUSINESS_DATA_WRITES = 0
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_SETTINGS_ONBOARDING_DISCOVERABILITY_FIXED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
STOP = YES
```

No further work was started.
