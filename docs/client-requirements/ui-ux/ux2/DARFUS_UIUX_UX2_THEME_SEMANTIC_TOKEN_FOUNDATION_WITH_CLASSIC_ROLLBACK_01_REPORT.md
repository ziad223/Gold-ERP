هل تم حفظ التصميم القديم بالكامل؟ نعم، 48 ملفًا مع SHA-256.
أين يوجد Classic snapshot؟ `backups/ui-ux/PRE_UX2_CLASSIC_DESIGN_20260828_020614/`.
هل تم إنشاء SHA-256 manifest؟ نعم، 48/48.
هل تم إنشاء Screenshot baseline؟ نعم، مع توثيق التغطية الجزئية القديمة ولقطات UX2 بعدية.
هل تم إنشاء Restore Map؟ نعم.
هل Rollback rehearsal نجحت؟ نعم، parity حرفي.
هل يمكن إعادة التصميم القديم بدون Git reset؟ نعم، file-scoped manifest-based.
ما الملفات التي تغيرت في UX-2؟ `app/globals.css` فقط كـproduction source؛ باقي الملفات أدلة/توثيق.
هل التغيير Foundation فقط؟ نعم.
هل Dark foundation نجحت؟ نعم.
هل Light foundation نجحت؟ نعم.
هل Gold policy محفوظة؟ نعم.
هل Motion/Reduced Motion foundation نجحت؟ نعم.
هل الصفحات الحالية ما زالت مقروءة؟ نعم في المسارات الممثلة.
هل AR/EN سليمان؟ نعم؛ RTL/LTR مثبتان.
هل تم تغيير Business Logic؟ لا.
هل تم لمس API؟ لا.
هل تم لمس DB؟ لا.
هل UX2 rollback جاهز؟ نعم.
Gate: `PASS_DARFUS_UIUX_UX2_THEME_SEMANTIC_TOKEN_FOUNDATION_WITH_CLASSIC_ROLLBACK`.
الخطوة التالية فقط: Owner review ثم UX-3 بموافقة صريحة.

# Executive Summary

تم تطبيق UX-2 كـminimum production theme foundation بعد نجاح Phase A. التغيير أضاف semantic aliases/hooks في `app/globals.css` وحوّل global canvas/text/border إلى aliases، دون ترحيل الصفحات أو المكونات. لم يحدث business/API/DB/migration change.

| Area | Result | Evidence |
|---|---|---|
| Classic baseline and rollback | PASS | 48-row manifest; isolated exact-hash restore |
| Production foundation scope | PASS | `app/globals.css` only |
| Browser AR/EN, Dark/Light | PASS | `localhost:3000`; 14 known route checks; 4 stable screenshots |
| Focused frontend regression | PASS | 34/34 |
| Typecheck / build | PASS | exit 0 / 128 generated pages |
| Persistent business delta | NONE | no business mutation or DB write |

# Owner Authorization

The supplied UX-2 control authorizes the Obsidian Atelier direction and this first controlled production-design foundation, conditional on classic rollback readiness. Phase A passed before the production CSS edit.

# Read First

`READ_FIRST = YES`. AGENTS, UX-2, UX-0/0B/1/1R evidence and current production design authorities were read. `next-env.d.ts` was not edited; Next dev was not started.

# Pre-UX2 Git State

Read-only capture before the CSS edit:

| Field | Value |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Worktree | dirty; pre-existing changes preserved |
| Tracked modified count | 121 |
| Untracked count | 5214 |
| Stash count | 11 |
| UX2 attribution | no pre-existing file claimed |

No reset/restore/clean/stash was used.

# Classic Design File Inventory

48 relevant production frontend/design files were inventoried: global CSS, theme/config, layouts/shell, shared UI, i18n, representative POS/Inventory/Accounting/Gold/Settings surfaces and print/tag presentation. No secrets, `.env*`, `node_modules` or `.next` were copied.

`CLASSIC_DESIGN_FILE_INVENTORY = COMPLETE`

# Classic Source Snapshot

`CLASSIC_SOURCE_SNAPSHOT = PASS`  
`CLASSIC_SNAPSHOT_PATH = backups/ui-ux/PRE_UX2_CLASSIC_DESIGN_20260828_020614/`

The snapshot contains source and manifests. TypeScript backup copies use `.ux2snapshot` so TypeScript does not compile the incomplete backup tree; the logical paths and hashes remain explicit in the manifest/restore map.

# Hash Manifest

The complete 48-row record is in `DARFUS_UX2_CLASSIC_DESIGN_HASH_MANIFEST.md`, `classic-design-manifest.json` and `classic-design-sha256.txt`. Classic `app/globals.css` = `63ACA2712543F567123AE89E3C204CAAEDC7E7424BE1BA50DCC65B51F95C257C`.

`CLASSIC_HASH_MANIFEST = PASS`

# Screenshot Baseline

The classic baseline and any unavailable route/state are documented without inference. UX2 stable AR/EN Dashboard Light/Dark screenshots are in `backups/ui-ux/UX2_THEME_FOUNDATION_20260828_020614/screenshots/`.

`CLASSIC_SCREENSHOT_BASELINE = PASS_OR_DOCUMENTED_PARTIAL`

# Restore Map

`DARFUS_UI_UX_CLASSIC_RESTORE_MAP.md` is file-scoped and hash-based; it explicitly avoids Git reset/clean.

`CLASSIC_RESTORE_MAP = PASS`

# Classic Rollback Rehearsal

An isolated copy received a harmless comment-only change, produced a different SHA (`96932DF4...3658DE`), then was restored from the classic snapshot. Restored SHA exactly matched `63ACA271...5C257C`; production worktree was not touched.

Evidence: `backups/ui-ux/PRE_UX2_CLASSIC_DESIGN_20260828_020614/manifests/classic-rollback-rehearsal.json`.

`CLASSIC_ROLLBACK_REHEARSAL = PASS`  
`RESTORED_HASH_PARITY = PASS`  
`ROLLBACK_FOUNDATION_READY = YES`

# UX-2 Scope

Only semantic aliases, status/focus/disabled/overlay/gold aliases, radius/spacing hooks, typography hooks, motion/easing and global reduced-motion were added. Existing page/component classes were not broadly migrated. No translation rollout or responsive rewrite occurred.

# Files Changed

| Category | Files / result |
|---|---|
| Production | `app/globals.css` — one minimum foundation file |
| Tests | 0 changed |
| Migrations | 0 created/executed |
| Docs/registers | UX2 artifacts and documentation-only register rows |
| DB/backend/API | unchanged |

# Semantic Tokens

The stylesheet now defines `--canvas`, `--surface-1/2/3`, `--surface-elevated`, `--surface-interactive`, `--surface-selected`, text hierarchy, border hierarchy, gold hierarchy, `--success`, `--warning`, `--danger`, `--info`, `--focus`, `--disabled`, `--overlay`, radius/spacing, motion/easing and typography hooks. Existing RGB variables remain the value authority.

`UX2_SEMANTIC_TOKEN_FOUNDATION = PASS`

# Dark Foundation

Dark runtime exposed `--canvas = 6 15 25`; layered surfaces, readable text, controls and controlled gold remained visible in AR/EN.

`UX2_DARK_FOUNDATION = PASS`

# Light Foundation

Light runtime exposed `--canvas = 246 248 251`; readable text, controls, cards and gold widget remained visible in AR/EN.

`UX2_LIGHT_FOUNDATION = PASS`

# Gold Policy

Gold is a semantic premium/secondary emphasis only. No universal gold treatment or pricing/gold calculation change was introduced.

`GOLD_USAGE_POLICY_PRESERVED = YES`

# Typography Hooks

`--font-brand` is distinct from `--font-operational`; numeric, Arabic and English hooks were prepared without broad font migration.

`UX2_TYPOGRAPHY_HOOKS = PASS`

# Motion Foundation

Tokens: fast `120ms`, standard `180ms`, slow `260ms`, standard/emphasized easing. No workflow depends on animation.

`UX2_MOTION_FOUNDATION = PASS`

# Reduced Motion

`prefers-reduced-motion: reduce` disables smooth scrolling and reduces animation/transition duration and iteration.

`UX2_REDUCED_MOTION_FOUNDATION = PASS`

# Browser Evidence

The existing main frontend at `http://localhost:3000` was used; no second frontend or Next dev server was started. Read-only checks covered 14 known URLs across Dashboard, POS, Inventory, Accounting, Gold Center, Settings and Settings/Tax in AR/EN. All rendered a visible `main`, correct `lang`/`dir`, expected theme state and zero captured console errors. The Dashboard theme toggle was exercised without a business action.

`UX2_REAL_BROWSER = PASS`

# AR/EN

AR checks returned `lang=ar, dir=rtl`; EN checks returned `lang=en, dir=ltr`, with visible main content and controls.

`UX2_AR_REGRESSION = PASS`  
`UX2_EN_REGRESSION = PASS`

# Dark/Light Regression

Dark and light Dashboard screenshots and runtime computed values were captured for AR and EN; no clipping, white leakage or unreadable text was observed in the stable captures.

`UX2_DARK_REGRESSION = PASS`  
`UX2_LIGHT_REGRESSION = PASS`

# Accessibility

Existing focusable controls and focus-visible styling remain present; text, border and status semantics were not removed. The theme toggle retained visible focus during browser inspection.

`UX2_ACCESSIBILITY_FOUNDATION = PASS`

# Functional Regression

Focused command passed 34/34: UX1/UX1R isolation, POS Gift Voucher UI/i18n/composition/visual checks, POS JournalPreview, and Inventory Count UI discovery/state checks. Tests were not edited or weakened.

`AFFECTED_FRONTEND_REGRESSION = PASS`

# Typecheck/Build

`npm run typecheck` exited 0. `npm run build` exited 0 with Next.js 16.2.9 (Turbopack) and 128 static pages. Next dev was not started.

`TYPECHECK = PASS`  
`BUILD = PASS`

# DB Zero Delta

No DB client, business API mutation, migration or seed was issued. Backend source was unchanged.

`DATABASE_CHANGED = NO`  
`BUSINESS_WRITES = 0`  
`FINANCIAL_WRITES = 0`  
`INVENTORY_WRITES = 0`  
`TAX_CHANGED = NO`

# After Snapshot

`UX2_AFTER_SNAPSHOT = PASS`

Path: `backups/ui-ux/UX2_THEME_FOUNDATION_20260828_020614/`. After SHA for `app/globals.css` = `9EDE0FBD434D31F443C6AEAAF15D3ACCBA0D321C219F191CE8F6CA7C30CCDB37`. Screenshots, test results, build results and rollback proof are included.

# Change Ledger

`DARFUS_UI_UX_CHANGE_LEDGER.md` records the 48-file classic baseline and one UX2 production file with before/after hashes. Unrelated dirty files are not attributed.

`UI_UX_CHANGE_LEDGER = CREATED`

# UX-2 Rollback Proof

The isolated UX2 copy was restored to exact classic SHA and then re-applied to exact UX2 after SHA. Active production worktree was never rolled back.

`UX2_ROLLBACK_READY = YES`  
`UX2_ROLLBACK_REHEARSAL = PASS`

Evidence: `backups/ui-ux/UX2_THEME_FOUNDATION_20260828_020614/rollback-rehearsal/ux2-rollback-proof.json`.

# Registers

All six registers received documentation-only UX2 evidence rows; historical rows were retained. The initial snapshot compilation issue is recorded as resolved artifact-scope evidence, not a product defect.

`SUCCESS_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY`  
`ERROR_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY`  
`ISSUE_BLOCKER_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY`  
`ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY`  
`OWNER_DECISION_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY`  
`CLOSED_EVIDENCE_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY`

# Gate

Phase A and Phase B pass. The worktree was already dirty; no P0/P1 was introduced by UX2.

`UX2_BATCH_CLOSURE = IMPLEMENTATION_PASS_AND_ROLLBACK_READY`  
`GATE = PASS_DARFUS_UIUX_UX2_THEME_SEMANTIC_TOKEN_FOUNDATION_WITH_CLASSIC_ROLLBACK`

# Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX2-THEME-SEMANTIC-TOKEN-FOUNDATION-WITH-CLASSIC-ROLLBACK-01
MODE = CLASSIC_BASELINE_FREEZE_PLUS_MINIMUM_PRODUCTION_THEME_FOUNDATION
READ_FIRST = YES
PRE_UX2_GIT_STATE_CAPTURED = YES
CLASSIC_DESIGN_FILE_INVENTORY = COMPLETE
CLASSIC_SOURCE_SNAPSHOT = PASS
CLASSIC_SNAPSHOT_PATH = backups/ui-ux/PRE_UX2_CLASSIC_DESIGN_20260828_020614/
CLASSIC_HASH_MANIFEST = PASS
CLASSIC_SCREENSHOT_BASELINE = PASS_OR_DOCUMENTED_PARTIAL
CLASSIC_RESTORE_MAP = PASS
UI_UX_CHANGE_LEDGER = CREATED
ROLLBACK_REGISTER = READY
CLASSIC_ROLLBACK_REHEARSAL = PASS
RESTORED_HASH_PARITY = PASS
ROLLBACK_FOUNDATION_READY = YES
UX2_PRODUCTION_FILES_CHANGED = app/globals.css_ONLY
UX2_SEMANTIC_TOKEN_FOUNDATION = PASS
UX2_DARK_FOUNDATION = PASS
UX2_LIGHT_FOUNDATION = PASS
GOLD_USAGE_POLICY_PRESERVED = YES
UX2_TYPOGRAPHY_HOOKS = PASS
UX2_MOTION_FOUNDATION = PASS
UX2_REDUCED_MOTION_FOUNDATION = PASS
RESPONSIVE_BEHAVIOR_REGRESSION = NO
UX2_REAL_BROWSER = PASS
UX2_AR_REGRESSION = PASS
UX2_EN_REGRESSION = PASS
UX2_DARK_REGRESSION = PASS
UX2_LIGHT_REGRESSION = PASS
UX2_ACCESSIBILITY_FOUNDATION = PASS
AFFECTED_FRONTEND_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
DATABASE_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
MIGRATIONS = 0
BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
TAX_CHANGED = NO
UX2_AFTER_SNAPSHOT = PASS
UX2_ROLLBACK_READY = YES
UX2_ROLLBACK_REHEARSAL = PASS
UX2_BATCH_CLOSURE = IMPLEMENTATION_PASS_AND_ROLLBACK_READY
SUCCESS_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
ERROR_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
ISSUE_BLOCKER_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
OWNER_DECISION_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
CLOSED_EVIDENCE_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
P0 = 0
P1 = 0
P2 = 0
P3 = 1
GATE = PASS_DARFUS_UIUX_UX2_THEME_SEMANTIC_TOKEN_FOUNDATION_WITH_CLASSIC_ROLLBACK
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_UX3_ONLY_WITH_EXPLICIT_APPROVAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

# Next Step

Owner review only. UX-3 is not started automatically.

# STOP

Do not redesign modules, delete classic files, mass-clean styles, change business/API/DB, run migrations or start UX-3 automatically.
