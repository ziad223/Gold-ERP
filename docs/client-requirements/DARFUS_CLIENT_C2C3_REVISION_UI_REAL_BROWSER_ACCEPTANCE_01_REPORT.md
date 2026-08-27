# DARFUS ERP — C2C3 Revision UI + Real Browser Acceptance Report

بالعربي المختصر: تم تنفيذ واجهة Revision داخل Asset Detail وإضافة اختبارات Frontend مركزة، مع نجاح typecheck وbuild وC2C2 regression. توقفت مرحلة Browser قبل أي طلب متحور لأن build ولّد drift محميًا في `next-env.d.ts`. قاعدة `darfus_erp` لم تُكتب ولم تُنفذ أي Revision عليها.

## Executive Summary

C2C3 static implementation is ready, but the required real-browser acceptance gate is blocked. The Asset Detail now uses the canonical C2C2 Revision API for the five general fields only, with review confirmation, required reason, stale timestamp, one pending idempotency key, permission-based presentation, stable error-code localization, list/detail UI, and AR/EN messages.

No Backend source, migration, schema, Barcode/RFID, pricing/cost/valuation, status, branch/location, movement, POS, CGP, accounting, or invoice business logic was changed.

## Pre-change / runtime boundary

- Official DB: `darfus_erp`, read-only.
- Existing C2C2 disposable backend: `http://localhost:8001`, database `darfus_c2c2_revision_runtime_02`, preserved.
- No new frontend runtime was started.
- Existing main frontend was not used for mutation proof.
- No browser POST or business mutation was attempted in C2C3.

## Static implementation

| Requirement | Evidence | Status |
|---|---|---|
| Revision list | `components/inventory/asset-revision-panel.tsx`, newest-first API list | STATIC PASS |
| Revision detail | Same panel, detail API and old/new values | STATIC PASS |
| Edit flow | Asset Detail review dialog submits canonical `/revisions` | STATIC PASS |
| Allowed fields | `name`, `description`, `category`, `brand`, `notes` only | STATIC PASS |
| Dedicated-field protection | UI excludes Barcode/RFID/price/status/branch/location | STATIC PASS |
| Permission visibility | `inventory.revision.view/create` | STATIC PASS |
| Stable error localization | `lib/inventory/revision-ui.ts` | STATIC PASS |
| Duplicate submit protection | disabled busy state + one retained pending key | STATIC PASS |
| Stale conflict UI | `expectedUpdatedAt`, no automatic retry, stable message | STATIC PASS |
| AR/EN message parity | `messages/ar.json` and `messages/en.json` | STATIC PASS |

## Tests and build

- `node --test tests/c2c3-revision-ui.test.cjs`: **4/4 PASS**.
- `node --test backend/tests/c2c2-revision-service-api.test.cjs`: **6/6 PASS**.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**.

## Blocking runtime-parity finding

Before the build, the protected worktree contained the Owner-accepted generated drift:

`next-env.d.ts` → `./.next/dev/types/routes.d.ts`

During `npm run build`, Next regenerated:

`next-env.d.ts` → `./.next/types/routes.d.ts`

This was a reverse of the Owner-accepted worktree drift, not a manual C2C3 edit: the pre-build worktree pointed to `./.next/dev/types/routes.d.ts`, while the post-build file matched the HEAD reference to `./.next/types/routes.d.ts`. The current guardrail explicitly says `DO_NOT_EDIT_NEXT_ENV_D_TS = YES`, `DO_NOT_AUTO_REVERT_NEXT_ENV_D_TS = YES`, and requires stopping when the protected generated state changes outside the exact approved auto-repair SHA rule. The toolchain-generated reversal is therefore not silently accepted as C2C3 runtime evidence.

Therefore:

`FRONTEND_RUNTIME_PARITY = BLOCKED_PROTECTED_NEXT_ENV_AUTO_REVERT`

No Browser, Network, backend runtime, disposable DB mutation, AR/EN visual proof, or DB-after proof was run after the block.

## Official DB safety

The last read-only official counts were Assets 18, Revisions 0, Revision Changes 0, Asset Events 65, Movements 62, Journal Entries 25, Barcode History 18, RFID Assignments 2. Official DB writes remain zero.

## Files changed in C2C3

### Added

- `components/inventory/asset-revision-panel.tsx`
- `lib/inventory/revision-ui.ts`
- `tests/c2c3-revision-ui.test.cjs`
- `docs/client-requirements/DARFUS_CLIENT_C2C3_REVISION_UI_BOUNDARY.md`
- `docs/client-requirements/DARFUS_CLIENT_C2C3_REVISION_BROWSER_SCENARIOS.md`
- `docs/client-requirements/DARFUS_CLIENT_C2C3_REVISION_BROWSER_DB_PROOF.md`
- `docs/client-requirements/DARFUS_CLIENT_C2C3_REVISION_AR_EN_ACCEPTANCE.md`
- `docs/client-requirements/DARFUS_CLIENT_C2C3_REVISION_UI_REAL_BROWSER_ACCEPTANCE_01_REPORT.md`

### Updated intentionally for C2C3

- `app/[locale]/(dashboard)/inventory/[id]/page.tsx`
- `messages/ar.json`
- `messages/en.json`

The worktree already contained unrelated drift; no cleanup/reset/stash/restore was performed.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C3-REVISION-UI-REAL-BROWSER-ACCEPTANCE-01
MODE = FRONTEND_IMPLEMENTATION_PLUS_REAL_BROWSER_DISPOSABLE_ACCEPTANCE
OFFICIAL_DATABASE = darfus_erp
DISPOSABLE_DATABASE = darfus_c2c2_revision_runtime_02
REVISION_UI_LOCATION = ASSET_DETAIL_UNDER_EXISTING_ITEM_HISTORY
SECOND_HISTORY_SYSTEM = NO
AR_PARITY = STATIC_PASS_BROWSER_BLOCKED
EN_PARITY = STATIC_PASS_BROWSER_BLOCKED
REVISION_LIST_UI = STATIC_PASS_BROWSER_BLOCKED
REVISION_DETAIL_UI = STATIC_PASS_BROWSER_BLOCKED
REVISION_EDIT_FLOW = STATIC_PASS_BROWSER_BLOCKED
PERMISSION_VISIBILITY = STATIC_PASS
STABLE_ERROR_LOCALIZATION = STATIC_PASS
DUPLICATE_SUBMIT_PROTECTION = STATIC_PASS
STALE_CONFLICT_UI = STATIC_PASS
FRONTEND_RUNTIME_PARITY = BLOCKED_PROTECTED_NEXT_ENV_AUTO_REVERT
BROWSER_NETWORK_PROOF = NOT_RUN_BLOCKED
BACKEND_RUNTIME_PROOF = NOT_RUN_BLOCKED
DB_REVISION_PROOF = NOT_RUN_BLOCKED
EVENT_AUDIT_BROWSER_PARITY = NOT_RUN_BLOCKED
ASSET_DETAIL_REGRESSION = BUILD_PASS_BROWSER_BLOCKED
BARCODE_DELTA = 0
RFID_DELTA = 0
STATUS_DELTA = 0
BRANCH_DELTA = 0
MOVEMENT_DELTA = 0
JOURNAL_DELTA = 0
COST_DELTA = 0
VALUATION_DELTA = 0
C2C3_FRONTEND_TESTS = PASS
C2C2_BACKEND_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
OFFICIAL_DB_WRITES = 0
OFFICIAL_DB_DAMAGE = 0
DISPOSABLE_EVIDENCE_PRESERVED = YES
FUTURE_REVISION_UI_REUSE = YES
WILL_REQUIRE_CORE_UI_REDESIGN_LATER = NO
SECOND_REVISION_UI_PATTERN = NO
P0 = 0
P1 = 0
P2 = 1 (protected next-env.d.ts runtime-parity blocker)
P3 = 0
GATE = BLOCKED_C2C3_FRONTEND_RUNTIME_PARITY_NEXT_ENV_DRIFT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next step

Owner decision is required for the protected `next-env.d.ts` drift. After explicit resolution, rerun only the C2C3 frontend runtime parity and real-browser scenarios on the preserved disposable runtime. Do not run C3 automatically.

STOP.
