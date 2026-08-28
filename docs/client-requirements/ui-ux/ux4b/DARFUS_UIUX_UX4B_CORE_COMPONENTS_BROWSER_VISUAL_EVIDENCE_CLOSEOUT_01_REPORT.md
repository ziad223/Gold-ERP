# DARFUS ERP — UX4B Core Components Browser Visual Evidence Closeout

## Executive Summary

UX4B added and exercised an isolated localized static reference surface so the standalone UX4 component families could be observed in a real browser. AR/EN, RTL/LTR, dark/light, responsive rendering, component states, consumer smoke, and fresh-tab console/hydration checks passed. The closeout cannot PASS because Drawer focus restoration failed: after closing the Drawer, focus landed on `BODY` instead of the trigger. No production component, business workflow, API, database, migration, or permission authority was changed to hide or bypass that result.

## Control Scope and Boundary

- Control: `DARFUS-UIUX-UX4B-CORE-COMPONENTS-BROWSER-VISUAL-EVIDENCE-CLOSEOUT-01`
- UX4 implementation: frozen.
- UX4B source additions: localized test route, static reference surface, focused isolation test.
- No production navigation exposure.
- No business/API/DB writes.
- No mutation, migration, seed, deployment, or automatic UX5 start.

## Reference Surface

`/en/test/ux4-components-reference` and `/ar/test/ux4-components-reference` render static fixtures for Button, Icon Button, Input/Search/Textarea, Select/Combobox, Checkbox/Radio/Switch, Card/Badge/Status, Alert/Toast, Modal/Drawer, Popover/Tooltip, Tabs, Pagination, Empty/Loading/Error, Table, and DataToolbar.

Isolation proof is in `tests/ux4b-reference-surface.test.cjs`. The route has no fetch/API client/form action/navigation and contains no business-write affordance.

## Component Family Evidence

All required families rendered and were interactively exercised. The family result is `PARTIAL` only because Drawer focus restoration is a required accessibility behavior and failed. The detailed matrix is in `DARFUS_UX4B_COMPONENT_STATE_MATRIX.md`.

## AR/EN and Direction

AR rendered with `lang=ar`, `dir=rtl`; EN rendered with `lang=en`, `dir=ltr`. Fresh tabs reported no console errors or warnings. The initial hydration issue from document-time locale detection was removed by using the localized route prop; no stale-tab error is treated as current evidence.

## Dark/Light

Actual dark and light colors were observed in AR and EN. The isolated surface temporarily manages the document theme class and restores the prior class on cleanup. No global theme-system or consumer behavior was changed.

## Responsive Evidence

Desktop, tablet, and mobile runs had equal body `scrollWidth`/`clientWidth`, no persistent horizontal overflow, and no clipped primary controls. Browser-reported dimensions were 1422×800 for requested desktop 1440×900, 853×1138 for requested tablet 768×1024, and 434×938 for requested mobile 390×844.

## Keyboard, Focus, and Accessibility

Buttons, text inputs, combobox, checkbox/switch, tabs, pagination, tooltip, Modal, and Drawer entry focus were exercised. Modal focus returned to `Open modal`. Drawer focus entered `Close drawer`, but after closing the active element was `BODY`, not `Open drawer`.

Finding: `UX4B-A11Y-001`, Layer `Accessibility / shared Drawer behavior`, Expected `focus returns to the invoking trigger`, Actual `focus is BODY after close`, Evidence `fresh browser focus probe`, Impact `keyboard users lose context`, Severity `P2`, Classification `ACCESSIBILITY_GAP`, Confidence `HIGH`.

Per the Control, this is not fixed in UX4B. Proposed next control: `UX4C-DRAWER-FOCUS-RESTORATION-MINIMUM-SAFE-FIX`, with focused test and browser rerun.

## Reduced Motion

Actual media emulation was unavailable in the connected browser. Source boundary review found no new timers, polling, or animation loops in the static surface. Result: `PASS_WITH_BROWSER_TOOL_LIMITATION_AND_SOURCE_BOUNDARY`; not a full emulated reduced-motion PASS.

## Consumer Smoke

Read-only Dashboard, POS, Inventory/Stock Audit, and Accounting smoke remained available with no business submission. No consumer migration was performed.

## Network and Console

Network request instrumentation was not exposed by the browser capability set. This is documented as a limitation. The isolation test and source inspection prove the reference surface has no fetch/API/form-action path. Fresh reference tabs reported `0` console errors and `0` warnings, including `0` hydration errors after the route correction.

## Source, Test, Typecheck, and Build

Intentional UX4B files:

- `components/ux4b-reference-surface.tsx`
- `app/[locale]/test/ux4-components-reference/page.tsx`
- `tests/ux4b-reference-surface.test.cjs`
- evidence artifacts and screenshots under this directory

Focused tests: `node --test tests/ux4b-reference-surface.test.cjs tests/ux4-core-components.test.cjs` → `8/8 PASS`.

UX4 regression suite: `15/15 PASS` (previous UX4 evidence). `npm run typecheck` → PASS. `npm run build` → PASS using Next.js 16.2.9. No `next-env.d.ts` edit was made; owner-accepted generated drift was not reverted.

The worktree contains substantial pre-existing accepted drift. It was not cleaned, reset, restored, stashed, or attributed to UX4B. Only the three intentional UX4B source/test files above are attributed to this control.

## Database and Mutation Safety

- Official DB: `darfus_erp`.
- Business DB writes: `0`.
- API business mutations: `0`.
- Migrations: `0`.
- Seeds/provisioning: `0`.
- Existing UX4 rollback evidence remains available.

## Strengths

1. A single static reference surface makes standalone primitives observable without introducing a business workflow; proven by route/source isolation test.
2. Locale is route-authoritative, eliminating the observed hydration mismatch; proven by fresh AR/EN tabs with zero errors.
3. Theme switching is scoped and reversible; proven by actual AR dark/light class/background measurements.
4. The reference surface is API-free and write-free; proven by source test and no business action affordances.

## Weaknesses / Confirmed Issue

| ID | Issue | Severity | Classification | Blocks UX4B PASS |
|---|---|---:|---|---|
| UX4B-A11Y-001 | Drawer does not restore focus to its invoking trigger after close | P2 | ACCESSIBILITY_GAP | Yes |
| UX4B-EVIDENCE-001 | Browser tool exposes no network request instrumentation | P3 | ACCEPTANCE_EVIDENCE_GAP | No, source boundary is documented |
| UX4B-MOTION-001 | Reduced-motion media emulation unavailable in browser tool | P3 | ACCEPTANCE_EVIDENCE_GAP | No, source boundary is documented |

## Gate

`GATE = FAIL_DARFUS_UIUX_UX4B_ACCESSIBILITY_DEFECT`

The gate is not `PASS`; the Drawer focus-return defect is proven and remains unfixed as required by the control. This control does not authorize UX4C or UX5.

## Next Step

Owner review of `UX4B-A11Y-001`. If approved, run a separately named UX4C minimum-safe Drawer focus-restoration fix and focused/browser rerun. No automatic next batch.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX4B-CORE-COMPONENTS-BROWSER-VISUAL-EVIDENCE-CLOSEOUT-01
MODE = EVIDENCE_ONLY_BROWSER_VISUAL_CLOSEOUT
UX4_IMPLEMENTATION_FROZEN = YES
REFERENCE_SURFACE_CREATED = YES
REFERENCE_SURFACE_ISOLATED = PASS
PRODUCTION_NAV_EXPOSURE = NO
BUTTONS = PASS
ICON_BUTTONS = PASS
INPUTS_SEARCH_TEXTAREA = PASS
SELECT_COMBOBOX = PASS
CHECKBOX_RADIO_SWITCH = PASS
CARD_BADGE_STATUS = PASS
ALERT_TOAST = PASS
MODAL_DRAWER = PARTIAL
POPOVER_TOOLTIP = PASS
TABS = PASS
PAGINATION = PASS
EMPTY_LOADING_ERROR = PASS
TABLE = PASS
DATA_TOOLBAR = PASS
AR_RTL = PASS
EN_LTR = PASS
DARK_LIGHT = PASS
DESKTOP = PASS
TABLET = PASS
MOBILE = PASS
KEYBOARD_FOCUS = PARTIAL
ACCESSIBILITY = PARTIAL
REDUCED_MOTION = PASS_WITH_BROWSER_TOOL_LIMITATION_AND_SOURCE_BOUNDARY
CONSUMER_SMOKE = PASS
CONSOLE_APPLICATION_ERRORS = 0
HYDRATION_ERRORS = 0
NETWORK_CAPTURE = NOT_AVAILABLE_IN_CONNECTED_BROWSER
FOCUSED_TESTS = PASS
TYPECHECK = PASS
BUILD = PASS
PRODUCTION_COMPONENT_SOURCE_CHANGED = NO
BUSINESS_API_DB_CHANGES = NO
MIGRATIONS = 0
BUSINESS_DB_WRITES = 0
UX4B_A11Y_DEFECTS = 1
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1
P3_COUNT = 2
VISUAL_VERIFICATION = COMPLETE_WITH_ACCESSIBILITY_FAILURE
GATE = FAIL_DARFUS_UIUX_UX4B_ACCESSIBILITY_DEFECT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

