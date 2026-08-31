# DARFUS ERP — Theme Reduced-Motion Minimum Safe Fix

تَمَّ تنفيذ تعديل محدود في CSS فقط، وتشغيل الاختبارات الثابتة والبناء، ثم تحقق Chrome للـ reduced-motion على مسارات AR/EN وDesktop/Mobile. لم تحدث أي كتابة على قاعدة البيانات أو Business API. تحقق reduced-motion نجح، لكن اختبار Normal-Motion المطلوب باستخدام Chrome مع `--force-prefers-no-reduced-motion` غير متاح في سطح Chrome الحالي؛ لذلك يبقى الـGate جزئيًا ولا يُسجَّل PASS كامل.

## 1. Executive Summary

| Item | Result | Evidence |
|---|---|---|
| Control | `DARFUS-UI-THEME-REDUCED-MOTION-MINIMUM-SAFE-FIX-01` | This report |
| Scope | CSS-only reduced-motion correction | `app/globals.css` only for this control |
| Root trigger | `prefers-reduced-motion: reduce` | Owner A/B evidence plus live Chrome media-query proof |
| Reduced-motion browser proof | PASS for observed reduced-motion path | `reduce=true`, `noPreference=false`; four routes; AR/EN; desktop/mobile |
| Typecheck | PASS | `npm run typecheck`, exit 0 |
| Production build | PASS | `npm run build`, Next.js 16.2.9, 130/130 pages |
| Normal-motion regression | BLOCKED / not run | Current Chrome surface exposes no isolated `--force-prefers-no-reduced-motion` launch control |
| Database/business mutation | 0 | No business POST/PUT/PATCH/DELETE; no DB mutation |
| Overall gate | `BLOCKED_THEME_REDUCED_MOTION_FIX_PARTIAL` | Normal-motion evidence is required by the control |

The CSS-only correction did not require ThemeProvider, Tailwind, layout, backend, API, business, or database changes. The observed reduced-motion path no longer reproduced the owner-reported heavy/abrupt switch in the available ordinary Chrome run, but the required normal-motion comparison remains unproven.

## 2. Owner A/B Proof

The control supplied the upstream owner A/B evidence:

| Condition | Owner evidence | Interpretation |
|---|---|---|
| Ordinary/system Chrome | `prefers-reduced-motion: reduce = true` and Light/Dark switch felt heavy/visually abrupt | Reduced-motion path is the proven trigger |
| Same Chrome with `--force-prefers-no-reduced-motion` | Switch became smooth/normal | Supports reduced-motion-specific cause |
| Profile cause | Not supported | No evidence of a profile defect |
| Extension cause | Not supported | No evidence of an extension defect |
| General performance cause | Not supported | No evidence to widen scope |

Live ordinary Chrome confirmation after the change returned `reduce=true` and `noPreference=false`. The exact internal paint mechanism was not inferred.

## 3. Pre-Change Hashes

These hashes were captured immediately before the CSS change. The unchanged files were rechecked after the change.

| File | SHA-256 before | SHA-256 after | Control changed? |
|---|---|---|---|
| `app/globals.css` | `7F208980DB9A25E2A04A16AD0897FF8496F2182EA6AAE27CA94D17144C2CD61B` | `141ABBE81EC26FFFAA0B84F8479B77B772649B83FD44F24164C4F6C8903FEAEB` | YES; bounded CSS hunk |
| `contexts/theme-context.tsx` | `78B875D7F8078351AAF61B56EDD998C3EB4D9A8F2F5FAE229FA868DA3C07824C` | `78B875D7F8078351AAF61B56EDD998C3EB4D9A8F2F5FAE229FA868DA3C07824C` | NO |
| `components/layout/header.tsx` | `5AA4E6B5A393D05EAAFA6D3AE3E77329E87C4D0C7B606AE74CDFAED0F15FB2BF` | `5AA4E6B5A393D05EAAFA6D3AE3E77329E87C4D0C7B606AE74CDFAED0F15FB2BF` | NO |
| `components/layout/sidebar.tsx` | `8F7378EF4AD18F15366F0F693CCD4C05A8EB29A7FAEAB5A58B2034B45CCD922C` | `8F7378EF4AD18F15366F0F693CCD4C05A8EB29A7FAEAB5A58B2034B45CCD922C` | NO |

`next-env.d.ts` was not edited by this control and currently contains the accepted `./.next/types/routes.d.ts` import. The pre-existing broad worktree drift remains untouched.

## 4. Exact Reduced-Motion Source Rules

The current `app/globals.css` contains three reduced-motion blocks relevant to this audit:

| Location | Selectors | Declarations | Classification |
|---|---|---|---|
| Lines 162–171 | `html`, `*`, `*::before`, `*::after` | `scroll-behavior:auto`; `animation-duration:0.01ms !important`; `animation-iteration-count:1 !important`; `transition-duration:0ms !important` | A: animation/scroll reduction plus broad transition snap |
| Lines 263–267 | `.ux7-page .ux7-stat-card`, `.ux7-page .ux7-data-table tbody tr` | `transition-duration:0ms !important` | B/D: scoped presentation/interaction reduction |
| Lines 491–510 | `.ux3-shell-header`, `.ux3-shell-content`, `.ux3-nav-item`, `.ux3-breadcrumb-link` | Scoped property and duration overrides | C: shell/theme transition correction |

The global block still disables non-essential animation and movement-oriented transition behavior. The UX3 block is now property-scoped: shell color/border, navigation color/background, and breadcrumb color receive a short coherence transition; shell layout movement remains disabled.

## 5. Root Declaration

`ROOT_TRIGGER = PREFERS_REDUCED_MOTION_REDUCE`

The exact theme-relevant declarations are:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0ms !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ux3-shell-header {
    transition-property: background-color, border-color !important;
    transition-duration: 80ms !important;
  }

  .ux3-shell-content {
    transition-property: none !important;
    transition-duration: 0ms !important;
  }

  .ux3-nav-item {
    transition-property: background-color, color !important;
    transition-duration: 80ms !important;
  }

  .ux3-breadcrumb-link {
    transition-property: color !important;
    transition-duration: 80ms !important;
  }
}
```

## 6. Minimum Safe Change

The minimum change was:

1. Keep reduced-motion animation reduction and scroll behavior unchanged.
2. Change the broad reduced-motion transition duration from `0.01ms` to `0ms`, keeping non-essential movement from running.
3. Replace the existing UX3 reduced-motion `transition-duration:0ms` blanket override with four scoped property lists.
4. Allow only an 80ms color/background/border transition for shell/navigation coherence.
5. Keep shell content margin/layout transition disabled.

No global `0ms → 300ms` change, no `transition-all` addition, no new animation, no token change, and no design-color change were made.

## 7. Source Diff

The control-specific diff is small and line-explainable. The file already contained unrelated accepted worktree changes from earlier controls; the complete Git diff of `app/globals.css` therefore is not the control delta.

Control-specific edits:

```diff
@@ global reduced-motion block @@
-    transition-duration: 0.01ms !important;
+    transition-duration: 0ms !important;

@@ UX3 reduced-motion block @@
-  .ux3-shell-header,
-  .ux3-shell-content,
-  .ux3-nav-item,
-  .ux3-breadcrumb-link {
-    transition-duration: 0ms !important;
+  .ux3-shell-header {
+    transition-property: background-color, border-color !important;
+    transition-duration: 80ms !important;
+  }
+
+  .ux3-shell-content {
+    transition-property: none !important;
+    transition-duration: 0ms !important;
+  }
+
+  .ux3-nav-item {
+    transition-property: background-color, color !important;
+    transition-duration: 80ms !important;
+  }
+
+  .ux3-breadcrumb-link {
+    transition-property: color !important;
+    transition-duration: 80ms !important;
   }
```

`FILES_CHANGED = app/globals.css only for this control`.

`CONTROL_SPECIFIC_LINES_CHANGED = 24 (17 additions, 7 deletions)`.

`BUSINESS_LOGIC_CHANGED = NO`.

`THEME_STATE_LOGIC_CHANGED = NO`.

## 8. Accessibility Preservation

| Contract | Result | Evidence |
|---|---|---|
| Reduced-motion media query retained | PASS | `@media (prefers-reduced-motion: reduce)` remains in source |
| Non-essential animation reduced | PASS | `animation-duration:0.01ms`, iteration limit, and scroll auto retained |
| Shell/layout movement disabled | PASS | `.ux3-shell-content { transition-property:none; transition-duration:0ms }` |
| No global motion restoration | PASS | No global long transition and no new animation |
| Theme color coherence | PASS in reduced-motion observation | 80ms property-scoped transitions only |
| Keyboard/semantic behavior | Unchanged | No component or ThemeProvider edit |

`REDUCED_MOTION_ACCESSIBILITY_PRESERVED = YES` for static source and observed reduced-motion behavior.

## 9. Typecheck

Command:

```text
npm run typecheck
```

Result: `TYPECHECK = PASS`, exit code `0`.

No TypeScript configuration was weakened.

## 10. Production Build

Command:

```text
npm run build
```

Result: `BUILD = PASS`, exit code `0`.

Observed build evidence:

- Next.js `16.2.9 (Turbopack)`.
- Compilation successful.
- TypeScript completed successfully.
- Static generation completed `130/130` pages.
- No migration, seed, backend, or business data operation was run.

## 11. Reduced-Motion Browser Acceptance

The acceptance used the existing ordinary Chrome session without `--force-prefers-no-reduced-motion` and without entering credentials. Live media-query proof:

```json
{
  "reduce": true,
  "noPreference": false
}
```

Desktop effective viewport was `1536×639` after the browser surface settled. The following route sweep ran three times per locale/direction set (12 route loads total):

| Route | Locale/dir | Loads | Ready | Reduced motion | Stable after load |
|---|---|---:|---|---|---|
| `/en/customers` | `en/ltr` | 3 | `complete` | `true/false` = `reduce/noPreference` | YES |
| `/en/dashboard` | `en/ltr` | 3 | `complete` | `true/false` | YES |
| `/ar/customers` | `ar/rtl` | 3 | `complete` | `true/false` | YES |
| `/ar/dashboard` | `ar/rtl` | 3 | `complete` | `true/false` | YES |

Theme switching on `/en/customers` was exercised three times in each direction. Each toggle changed the root `dark` class exactly once and returned to the prior state. Observed computed values included:

- Light background: `rgb(246, 248, 251)`.
- Dark background: `rgb(6, 15, 25)`.
- UX3 header transition duration: `0.08s`.
- UX3 shell content transition property: `none`.
- UX3 navigation transition property: `background-color, color`.

Result:

```text
THEME_SWITCH_HEAVINESS = NOT_REPRODUCED_IN_OBSERVED_REDUCED_MOTION_RUN
MIXED_THEME_FRAME = NO_OBSERVED
THEME_CAUSED_LAYOUT_SHIFT = NO_OBSERVED
```

The browser surface does not expose a Performance/DevTools frame trace or Layout Instability trace. “No layout shift” is therefore based on repeated visual/DOM geometry snapshots after load, not on an unavailable browser performance counter.

## 12. Normal-Motion Regression

Required setup was an isolated Chrome run using:

```text
--force-prefers-no-reduced-motion
```

That launch-flag control was not available in the current Chrome automation surface. The available capabilities were only `viewport` and tab `pageAssets`; no browser launch-flag or performance-trace capability was exposed. No attempt was made to fake the media query through page code.

Therefore:

```text
NORMAL_MOTION_REGRESSION = BLOCKED_NOT_RUN
NORMAL_MOTION_BEHAVIOR_CHANGED = NOT_ESTABLISHED
```

This is an evidence limitation, not evidence of a normal-motion regression. A future owner-approved continuation must run the exact isolated normal-motion comparison before a full PASS can be issued.

## 13. AR/EN Validation

| Check | EN | AR |
|---|---|---|
| Route load | PASS | PASS |
| Correct document language | `en` | `ar` |
| Correct direction | `ltr` | `rtl` |
| Reduced-motion media query | PASS | PASS |
| Theme toggle accessible name | `Toggle theme` | `تبديل المظهر` |
| Light → Dark → Light observation | PASS | PASS on mobile/RTL pair; full three-cycle desktop loop on EN |
| Layout overflow | none observed | none observed |
| Console errors | 0 | 0 |

No unexpected locale-specific CSS, direction, or theme-state source change was introduced.

## 14. Desktop/Mobile Validation

Desktop proof used the default Chrome viewport (`1536×639` effective page viewport). Mobile proof used the temporary viewport `390×844`, then the viewport was reset to default before completion.

| Surface | EN | AR | Evidence |
|---|---|---|---|
| Customers, mobile | PASS | PASS | `header`, `aside`, `main` present; horizontal overflow false |
| Dashboard, mobile | PASS | PASS | `header`, `aside`, `main` present; horizontal overflow false |
| Customers, desktop | PASS | PASS | stable header/sidebar/main geometry |
| Dashboard, desktop | PASS | PASS | stable header/sidebar/main geometry |
| Mobile theme toggle | PASS one pair | PASS one pair | dark class and background changed then restored; overflow remained false |

The temporary viewport override was reset. No responsive component source was edited.

## 15. Console/Page Errors

Final Chrome log read:

```json
{
  "total": 76,
  "errors": 0,
  "warnings": 0
}
```

The log contained normal HMR/Fast Refresh messages from the already-running local development runtime; none were error or warning entries. All inspected routes reached `document.readyState = complete`. No page error was observed.

`CONSOLE_ERRORS = 0`.

`PAGE_ERRORS = 0 observed`.

Network/performance DevTools capture was not available through the current Chrome surface, so no unsupported network or frame-level claim is made.

## 16. Data/DB Safety

| Operation | Result |
|---|---:|
| Business POST | 0 |
| Business PUT | 0 |
| Business PATCH | 0 |
| Business DELETE | 0 |
| Database writes | 0 |
| Migration executed | 0 |
| Seed executed | 0 |
| Business records created/changed | 0 |
| Theme localStorage state | Client-only and allowed by control |

The frontend runtime, backend, `darfus_erp`, accounting, inventory, tax, permissions, and business workflows were not modified by this control. The production build only generated build artifacts; it did not perform business mutations.

## 17. Open Items Not Touched

The following were intentionally left untouched:

- A8 historical test.
- POS universal customer search.
- CRM-1B4 migration.
- CRM-1C.
- Gold provider warning.
- Dependency audit notices.
- Barcode verifier residue.
- ThemeProvider logic.
- Tailwind dark-mode configuration.
- Header/sidebar components.
- Business/API/backend/database code.

No scope expansion was performed.

## 18. Owner Decision Packet

```text
ROOT_TRIGGER = PREFERS_REDUCED_MOTION_REDUCE
EXACT_ROOT_DECLARATION = global reduced-motion universal transition-duration rule plus UX3 reduced-motion 0ms block
FILES_CHANGED = app/globals.css only for this control
LINES_CHANGED = 24 control-specific lines (17 insertions, 7 deletions)
WHY_THIS_IS_MINIMUM_SAFE_CHANGE = keep non-essential motion disabled while allowing only scoped 80ms theme color/background/border coherence; preserve layout movement suppression and all theme/state/business authorities
REDUCED_MOTION_ACCESSIBILITY_PRESERVED = YES
THEME_DESIGN_CHANGED = NO
THEME_STATE_LOGIC_CHANGED = NO
NORMAL_MOTION_REGRESSION = BLOCKED_NOT_RUN
AR_EN_REGRESSION = NO_OBSERVED
RESPONSIVE_REGRESSION = NO_OBSERVED
TYPECHECK = PASS
BUILD = PASS
ORIGINAL_OWNER_SYMPTOM = Light/Dark switch feels heavy and visually strange under reduced motion
POST_FIX_RESULT = PARTIAL (symptom not reproduced in observed reduced-motion run; normal-motion comparison unavailable)
DATABASE_WRITES = 0
BUSINESS_API_MUTATIONS = 0
ROLLBACK_METHOD = restore only the control-specific CSS lines/file from the pre-change hash/source; do not touch unrelated worktree edits
```

## 19. Gate

`GATE = BLOCKED_THEME_REDUCED_MOTION_FIX_PARTIAL`

Reason: the required ordinary reduced-motion acceptance passed at the available observation level, and the CSS-only correction is statically valid. However, the control requires a separate isolated Chrome normal-motion regression with `--force-prefers-no-reduced-motion`; the current browser surface cannot launch that mode. The CSS-only fix did not fail, so this is not a scope-expansion gate.

No rollback was performed because no product defect or regression was observed in the completed scope, and the control requires waiting for Owner review before any further work.

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UI-THEME-REDUCED-MOTION-MINIMUM-SAFE-FIX-01
MODE = OWNER_APPROVED_MINIMUM_SAFE_THEME_FIX

OWNER_AB_PROOF = REDUCED_MOTION_PATH_CONFIRMED
ROOT_TRIGGER = PREFERS_REDUCED_MOTION_REDUCE
FILES_CHANGED = 1 (app/globals.css; bounded control delta; unrelated worktree changes excluded)
STYLE_FILES_CHANGED = 1
THEME_LOGIC_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
REDUCED_MOTION_ACCESSIBILITY_PRESERVED = YES
TYPECHECK = PASS
BUILD = PASS
REDUCED_MOTION_BROWSER_PROOF = PASS_REDUCE_TRUE_NO_PREFERENCE_FALSE_AR_EN_DESKTOP_MOBILE
NORMAL_MOTION_REGRESSION = BLOCKED_NOT_RUN_NO_ISOLATED_FORCE_FLAG_SURFACE
AR_EN = PASS_READ_ONLY_REDUCED_MOTION
DESKTOP_MOBILE = PASS_READ_ONLY_STRUCTURAL_AND_THEME_TOGGLE_OBSERVATION
ORIGINAL_OWNER_SYMPTOM = NOT_REPRODUCED_IN_OBSERVED_REDUCED_MOTION_RUN
POST_FIX_RESULT = PARTIAL
DATABASE_WRITES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_API_MUTATIONS = 0
GATE = BLOCKED_THEME_REDUCED_MOTION_FIX_PARTIAL
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_RESUME_POS_UNIVERSAL_SEARCH
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP AFTER REPORT.

No POS universal search, A8 reauthorization, CRM-1B4 migration, CRM-1C, or broader theme scope was started.
