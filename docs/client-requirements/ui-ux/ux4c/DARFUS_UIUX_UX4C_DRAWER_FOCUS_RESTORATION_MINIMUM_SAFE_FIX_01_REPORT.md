# DARFUS ERP — UX4C Drawer Focus Restoration Minimum Safe Fix

## Executive Summary

UX4C corrected only the proven Drawer focus-return defect `UX4B-A11Y-001`. The shared Drawer now remembers the exact invoking trigger and restores focus after close when the trigger remains connected. Public props and close semantics remain unchanged. Focus entry, exact return, AR/EN, RTL/LTR, dark/light, desktop/mobile, consumer smoke, focused tests, typecheck, build, and isolated hash rollback proof passed. No business, API, database, migration, permission, or route behavior changed.

## Pre-change State and Reproduction

Branch `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`; the worktree was already dirty and was not cleaned. Fresh EN browser reproduction: `Open drawer` → active element `Close drawer` → inner close → active element `BODY`. Root cause was absence of trigger capture/restoration in `components/ui/drawer.tsx`.

## Drawer Authority and Contract

`components/ui/drawer.tsx` is the actual shared authority. `open`, `onClose`, `title`, `description`, `side`, and `children` are unchanged. Existing inner-close and overlay-close paths are preserved. Escape was not implemented before this control and was intentionally not added because the scope forbids new close behavior.

## Minimum Fix

The only production source file changed is `components/ui/drawer.tsx`. It captures the active HTMLElement on the false→true transition and restores it after the true→false transition with an `isConnected` guard and `preventScroll`. Existing body-scroll lock and close-button focus entry remain intact.

## Tests and Build

`node --test tests/ux4c-drawer-focus.test.cjs tests/ux4b-reference-surface.test.cjs tests/ux4-core-components.test.cjs tests/ux3-shell-navigation.test.cjs` → `13/13 PASS`.

`npm run typecheck` → PASS. `npm run build` → PASS. No deployment was performed.

## Browser Acceptance

EN/LTR desktop: inner close and overlay close returned focus to `Open drawer`; Escape remained unsupported as before. AR/RTL dark and light returned focus to `فتح الدرج`. Mobile browser-reported viewport 434×938 (requested ~390×844) fit the Drawer and returned focus correctly. Modal, Tooltip/Popover, and Tabs smoke passed. Fresh tested tabs had zero console errors/warnings and zero hydration errors.

## Consumer Smoke

Read-only Dashboard, POS, Inventory, and Accounting routes passed in EN and AR with no horizontal overflow. No business actions were clicked.

## Safety and Scope

`DATABASE_CHANGED=NO`, `BUSINESS_LOGIC_CHANGED=NO`, `API_CHANGED=NO`, `NETWORK_BEHAVIOR_CHANGED=NO`, `MIGRATIONS=0`, `BUSINESS_WRITES=0`, `FINANCIAL_WRITES=0`, `INVENTORY_WRITES=0`, `TAX_CHANGED=NO`, `PERMISSION_BEHAVIOR_CHANGED=NO`, `ROUTE_CONTRACT_CHANGED=NO`. The owner-accepted pre-existing `next-env.d.ts` drift was not edited or reverted.

## Snapshots and Rollback

Before SHA: `73B50EF20B2D7251BF803B2F7C83426C32D4009BCB40867BF05FC9FE26E55FB8`.

After SHA: `32251475D47AC86F1A8C64267A4F2188CBDAE956361FD769889B61A505D466E6`.

Isolated restore-to-before and reapply-to-after hash parity both passed. Classic, UX2, UX3, and UX4 rollback states remain available.

## Registers and Defect State

The six DARFUS registers and UX2 UI/UX ledger/rollback register were updated by documentation only. `UX4B-A11Y-001` is closed for this scoped defect; UX4B accessibility evidence is now complete.

## Gate

`GATE = PASS_DARFUS_UIUX_UX4C_DRAWER_FOCUS_RESTORATION_MINIMUM_SAFE_FIX`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX4C-DRAWER-FOCUS-RESTORATION-MINIMUM-SAFE-FIX-01
MODE = MINIMUM_ACCESSIBILITY_CORRECTIVE_FIX_ONLY
READ_FIRST = YES
PRE_UX4C_GIT_STATE_CAPTURED = YES
DRAWER_AUTHORITY_MAP = COMPLETE
DRAWER_PROP_CONTRACT_CHANGED = NO
UX4C_BEFORE_SNAPSHOT = PASS
UX4C_BEFORE_HASH_MANIFEST = PASS
UX4B-A11Y-001_REPRODUCED = YES
ROOT_CAUSE_PROVEN = YES
DRAWER_FOCUS_RESTORATION_IMPLEMENTED = YES
DRAWER_CLOSE_PATHS_PRESERVED = YES
DRAWER_FOCUS_ENTRY = PASS
DRAWER_FOCUS_RETURN = PASS
DRAWER_FOCUS_REGRESSION_TEST = PASS
DRAWER_CONTRACT_REGRESSION = PASS
UX4C_REAL_BROWSER = PASS
UX4C_AR_RTL = PASS
UX4C_EN_LTR = PASS
UX4C_DARK = PASS
UX4C_LIGHT = PASS
UX4C_DESKTOP = PASS
UX4C_MOBILE = PASS
UX4C_ACCESSIBILITY = PASS
MODAL_FOCUS_REGRESSION = PASS
REDUCED_MOTION_BEHAVIOR_CHANGED = NO
UX4C_CONSUMER_SMOKE = PASS
CONSOLE_APPLICATION_ERRORS = 0
HYDRATION_ERRORS = 0
NETWORK_BEHAVIOR_CHANGED = NO
DATABASE_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
MIGRATIONS = 0
BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
TAX_CHANGED = NO
PERMISSION_BEHAVIOR_CHANGED = NO
ROUTE_CONTRACT_CHANGED = NO
FOCUSED_UX4C_TESTS = PASS
AFFECTED_UX4C_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
UX4C_AFTER_SNAPSHOT = PASS
UX4C_CHANGE_LEDGER_UPDATED = YES
UX4C_ROLLBACK_REGISTER_UPDATED = YES
UX4C_ROLLBACK_REHEARSAL = PASS
UX4C_RESTORED_HASH_PARITY = PASS
CLASSIC_BASELINE_STILL_AVAILABLE = YES
UX2_ROLLBACK_STILL_AVAILABLE = YES
UX3_ROLLBACK_STILL_AVAILABLE = YES
UX4_ROLLBACK_STILL_AVAILABLE = YES
UX4B_A11Y_DEFECTS_OPEN = 0
UX4_FINAL_VISUAL_ACCEPTANCE = PASS
UX4_FINAL_ACCESSIBILITY_ACCEPTANCE = PASS
UX4_STATUS = CLOSED
P0 = 0
P1 = 0
P2 = 0
P3 = 0
GATE = PASS_DARFUS_UIUX_UX4C_DRAWER_FOCUS_RESTORATION_MINIMUM_SAFE_FIX
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY; UX5 NOT AUTHORIZED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

UX4C is complete. Stop. Do not start UX5 or any unrelated batch automatically.

