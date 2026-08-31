# DARFUS ERP — UI Theme Switch Performance & Visual Forensic Report

## ملخص تنفيذي

تم فحص مسار تبديل المظهر Light/Dark من المصدر ومن متصفح Chromium المحلي على صفحات رئيسية، وباللغتين العربية والإنجليزية، وعلى أحجام Desktop وTablet وMobile. لم يتم تعديل الكود أو CSS أو قاعدة البيانات أو منطق الأعمال.

الذي اجتاز الفحص: زر التبديل يعمل، يتغير `dark` على عنصر `<html>`، وتعود الصفحات إلى مظهر متجانس في أغلب القياسات، ولم تظهر أخطاء Console في الجولات الناجحة. لم يثبت: زمن click-to-paint الحقيقي، Long Tasks، Paint/Composite، React rerender fan-out، أو عدد طلبات الشبكة الناتجة من التبديل، لأن واجهة المتصفح المتاحة لا تعرض DevTools Performance/Network/React Profiler، كما أن Chromium يعمل افتراضيًا مع `prefers-reduced-motion: reduce`.

ظهر شذوذ معزول أثناء قياس EN Mobile/Tablet: انزياح Layout في بعض الجولات وحالة Mixed Theme واحدة في مسار Settings، ثم عادت الصفحة إلى حالة صحيحة عند الفحص المباشر. لذلك لا يمكن نسب الشذوذ إلى عيب Theme مؤكد، ولا يمكن اعتماد سبب جذري نهائي قبل إعادة القياس بملف Performance حقيقي مع Motion طبيعي وViewport ثابت.

خطر قاعدة البيانات الدائمة: لا توجد كتابة أعمال أو كتابة DB في هذا الـControl. الخطر المتبقي هو خطر قبول أداء/عرض غير مثبت، وليس فساد بيانات. النتيجة: التقرير مكتمل تشخيصيًا، لكن الـGate محجوب بسبب عدم حسم السبب الجذري.

الخطوة التالية المقترحة: Owner approval لقياس واحد مخصص في Chromium غير مقيد بـReduced Motion مع DevTools Performance/Network/React profiling، ثم اختيار أصغر تعديل بصري فقط إذا أثبت القياس سببه.

## 1. Control and Scope

| Item | Value |
|---|---|
| Current control | `DARFUS-UI-THEME-SWITCH-PERFORMANCE-AND-VISUAL-FORENSIC-01` |
| Mode | `READ_ONLY_BROWSER_AND_SOURCE_FORENSIC_ONLY` |
| Source change allowed | `NO` |
| Style/theme logic change | `NO` |
| Business/API/DB change | `NO` |
| Production | `NOT CONTACTED` |
| Official DB | `darfus_erp`, read-only |
| Browser | Local Chromium via Codex In-app Browser |
| Routes | `/dashboard`, `/customers`, `/pos`, `/inventory`, `/accounting`, `/settings`, `/sales/returns`, `/sales/installments` |
| Locales | `ar` / RTL, `en` / LTR |
| Directions | Light → Dark and Dark → Light |
| Repetitions | 3 per route and direction where route/session remained observable |

The browser toggle necessarily exercises the existing client preference persistence (`localStorage` key `darfus-theme`). This was not a product/DB/business mutation and no business form or mutating API was used.

## 2. Current Environment

| Service | Status | Evidence |
|---|---|---|
| Frontend `localhost:3000` | UP, HTTP 200 | `GET /ar/dashboard` returned HTML with `lang="ar" dir="rtl"` |
| Frontend process | Existing Next start server | `node ... next/dist/server/lib/start-server.js` on port 3000; not restarted by this control |
| Backend `localhost:8000` | UP, HTTP 200 | `GET /api/v1/health` returned `success:true`, `status:"UP"` |
| PostgreSQL | Healthy | `docker compose ps`: `postgres running healthy`, host port `5433` |
| Redis | Healthy | `docker compose ps`: `redis running healthy`, host port `6379`; `/api/v1/health/redis` 200 |
| Backend DB health | UP | `GET /api/v1/health/db` returned `success:true` |
| Docker | `29.7.2` | Read-only version command |
| Docker Compose | `v5.3.1` | Read-only version command |
| Node / npm | `v24.19.0` / `11.17.0` | Read-only version command |

No service restart, build, migration, seed, deployment, or business POST was executed in this control.

## 3. Source / Worktree Baseline

| Item | Observed |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Worktree | Already dirty before this control |
| Status lines | 1048 |
| Tracked modified entries | 146 |
| Untracked entries | 902 |
| Stashes | 11 |
| `next-env.d.ts` | SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`; preserved and not edited |
| Theme source files changed by this control | 0 |

The following theme-relevant files were already reported as dirty before this control and were not edited here: `app/globals.css`, `components/layout/header.tsx`, and `components/layout/sidebar.tsx`. Their within-control SHA-256 values were captured before the report was written and are recorded below. Existing worktree drift is not attributed to this control.

## 4. Theme Architecture

### 4.1 Theme authority

| Concern | Current authority | Evidence |
|---|---|---|
| React theme state | `ThemeProvider` state in `contexts/theme-context.tsx` | `useState<Theme>("light")` |
| Persistence | Browser `localStorage["darfus-theme"]` | `contexts/theme-context.tsx:18`, `:28` |
| CSS mode selector | Class `dark` on `document.documentElement` | `contexts/theme-context.tsx:21`, `:27` |
| Utility strategy | Tailwind `darkMode: "class"` | `tailwind.config.ts:4` |
| Token authority | `:root` and `.dark` CSS custom-property blocks | `app/globals.css:7-133` |
| Server markup | Locale and direction only; no server-side theme class | `app/[locale]/layout.tsx:34-35` |
| Hydration handling | `suppressHydrationWarning` on `<html>` and `<body>` | `app/[locale]/layout.tsx:34-35` |

### 4.2 Toggle call chain

`Header` theme button (`components/layout/header.tsx:133`) → `useTheme()` (`:38`) → `ThemeProvider.toggleTheme()` → React state updater → synchronous `document.documentElement.classList.toggle("dark", ...)` → `localStorage.setItem("darfus-theme", next)` → context consumer update → CSS custom-property/utility recalculation under `.dark`.

The source contains one class toggle per user click. The runtime snapshot observed the class as changed immediately after the click; an exact millisecond value is not available from the permitted browser surface.

## 5. Transition / Animation Inventory

Static scan scope: `app`, `components`, `contexts`, and `lib`, excluding `node_modules` and `.next`.

| Inventory | Count / observation | Interpretation |
|---|---:|---|
| `transition-all` occurrences | 7 | Candidate broad transitions; not proof of theme-switch cost |
| `transition` occurrences | 112 | Includes utility classes and unrelated interaction transitions |
| `animate-` occurrences | 33 | Candidate route/popover/widget animation sites |
| `backdrop-blur` occurrences | 13 | Candidate compositor-sensitive layers |
| `shadow-*` class occurrences | 71 | Candidate repaint/compositing work |
| CSS `transition: all` declaration | 0 | No global CSS `transition: all` rule found |

Theme-relevant source evidence:

- `app/globals.css:79-83` defines `120ms`, `180ms`, and `260ms` motion tokens.
- `app/globals.css:135-143` applies semantic border/body colors and a radial gradient.
- `app/globals.css:162-171` short-circuits animation and transition duration under reduced motion.
- `app/globals.css:410-417` transitions header background/border/shadow and shell margin.
- `app/globals.css:451-453` transitions navigation background/color/shadow/transform.
- `components/layout/sidebar.tsx:136` uses `transition-all duration-300` together with `shadow-float`.
- `components/layout/header.tsx:83` uses `backdrop-blur-xl` and a shadowed translucent panel.
- Dashboard source uses many widgets, a lazy `SalesInsightsWidget`, tables, and SVG-based analytics (`app/[locale]/(dashboard)/dashboard/page.tsx:13-57`, `:198-350`).

These are candidate contributors only. They do not prove that any one of them is the user-observed root cause.

## 6. Browser Test Matrix

The following matrix records the completed repeated coverage. Each successful row represents three Light → Dark and three Dark → Light attempts for each listed route.

| Locale / direction | Viewport requested | Routes covered | DOM settle result under reduced motion | Mixed theme | Layout shift | Console error/warning |
|---|---:|---|---:|---|---|---|
| AR / RTL | Desktop 1440×900 | all 8 routes | 77–83 ms | none observed | none observed | none |
| EN / LTR | Desktop 1440×900 | all 8 routes | 76–83 ms | none observed | none observed | none |
| AR / RTL | Tablet 1024×768 | all 8 routes | 77–82 ms | none observed | none observed | none |
| EN / LTR | Tablet 1024×768 | all 8 routes | 77–82 ms | none observed | one isolated dashboard L→D outlier | none |
| AR / RTL | Mobile 390×844 | all 8 routes | 77–81 ms | none observed | none observed | none |
| EN / LTR | Mobile 390×844 | all 8 routes | normally 51–53 ms | one isolated Settings outlier | Accounting/Installments outliers in isolated runs | none |

Correct route names were verified from the source tree for the sales pages: `/sales/returns` and `/sales/installments`. The guessed shortcuts `/returns` and `/installments` are 404s and were not counted as product theme evidence.

### 6.1 Representative route details

| Route group | AR Desktop | EN Desktop | AR Tablet | EN Tablet | AR Mobile | EN Mobile |
|---|---|---|---|---|---|---|
| Dashboard | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3; one L→D shift outlier | 3×3, no mixed/shift | 3×3, no mixed/shift |
| Customers | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift |
| POS | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift |
| Inventory | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift |
| Accounting | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | one L→D 310 ms/shift outlier |
| Settings | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | one D→L mixed-theme/outlier observation |
| Sales Returns | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift |
| Sales Installments | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | 3×3, no mixed/shift | two D→L shift outliers |

`3×3` means three repetitions in each of the two directions, not three total switches.

## 7. Switch Measurements

### 7.1 What was measurable

- `dark` class state was observable after the click.
- Theme class direction and final state were observable.
- DOM settle was sampled by repeated DOM signatures at approximately 25 ms intervals.
- Main/header/sidebar geometry and document scroll height were compared before/after.
- Computed colors, transition, animation, backdrop filter, shadow, direction, and route DOM counts were read.

### 7.2 What was not measurable

| Required metric | Result | Reason |
|---|---|---|
| Exact click → class-change milliseconds | `NOT_OBSERVABLE_EXACT` | Browser API exposes post-click DOM, not a trusted monotonic click timestamp |
| Exact click → first paint | `NOT_OBSERVABLE` | `window.performance` is not exposed in the page evaluation scope |
| Exact visual settle under normal motion | `NOT_OBSERVABLE` | Current browser advertises `prefers-reduced-motion: reduce` |
| Long Tasks | `NOT_OBSERVABLE` | No PerformanceObserver/DevTools Performance surface |
| Paint/composite duration | `NOT_OBSERVABLE` | No DevTools trace or paint timing surface |
| React render count/fan-out | `NOT_OBSERVABLE` | No React Profiler surface and no instrumentation allowed in this control |
| Network request count caused by toggle | `NOT_OBSERVABLE` | No Network panel/CDP event stream exposed |

The observed DOM settle interval was roughly `51–83 ms` in the reduced-motion environment. It must not be treated as production click-to-paint performance.

The browser automation envelope was generally `~550–900 ms`; this is tool/transport time and is not a UI performance metric. An isolated Settings observation had a `3015 ms` envelope and an isolated Accounting observation had a `310 ms` DOM sample; both were accompanied by session/viewport inconsistencies and are not accepted as theme cost measurements.

## 8. DOM, Visual, and Layout Evidence

### 8.1 Theme DOM mutation

| Check | Observed |
|---|---|
| Target | `document.documentElement` |
| Dark marker | class `dark` |
| Light marker | no `dark` class |
| `data-theme` | not present in snapshots |
| Inline theme style | absent/null in snapshots |
| Body theme class | none |
| Per-click source class toggle | one |
| AR direction | `dir="rtl"` |
| EN direction | `dir="ltr"` |

### 8.2 Mixed-theme / flash result

Most route repetitions reached a coherent final state: light body/header in Light and dark body/header in Dark, with no mixed state detected by the DOM/computed-style snapshot.

One EN Mobile Settings Dark → Light observation returned a mixed final snapshot in the same measurement batch. The following direct check on `/en/settings` returned `lang="en"`, `dir="ltr"`, light body/header/sidebar colors, and no console errors. Because the same batch also showed changing CSS viewport dimensions, this is recorded as `RUNTIME_SESSION_ANOMALY`, not as a proven Theme flash defect.

### 8.3 Layout shift

No layout shift was observed in the stable AR/EN Desktop, Tablet AR, and the majority of Mobile runs. The isolated Tablet EN Dashboard, Mobile EN Accounting, and Mobile EN Installments observations had geometry changes. They were not repeatably tied to the theme class and occurred alongside changing viewport/session geometry, so they remain unresolved evidence.

### 8.4 Screenshots

A real Chromium screenshot was captured for AR Dashboard in Light and inspected together with the DOM/computed-style snapshot. The current in-app browser produced an oversized/scaled canvas with a blank adjacent area after responsive viewport operations; this is consistent with the browser harness viewport transform and is not enough to identify a product visual defect. No screenshot was persisted as a product artifact.

## 9. Reduced Motion and Accessibility

The browser reported `prefers-reduced-motion: reduce`.

Evidence:

- `app/globals.css:162-171` sets animation duration and transition duration to `0.01ms` and disables smooth scrolling.
- `app/globals.css:491-497` sets the UX-3 shell/header/navigation transition duration to `0ms` under the same preference.
- Runtime computed styles reported `animation: 1e-05s` and body/sidebar transition duration `1e-05s`.
- Theme button accessible names were present in both languages: Arabic `تبديل المظهر`, English `Toggle theme`.
- The theme button was discoverable and clickable by semantic role on all successful route checks.

`REDUCED_MOTION_RESPECTED = OBSERVED_PASS` for the existing source. This does not prove normal-motion performance or WCAG contrast for every component.

## 10. Network, Console, and Runtime Errors

Console inspection returned no error/warning entries for the successful route batches and for the direct post-anomaly checks.

Network request attribution is not available from the selected browser surface. Therefore:

- `THEME_SWITCH_NETWORK_REQUESTS = NOT_OBSERVABLE`
- `THEME_SWITCH_REFETCH = NOT_PROVEN`
- `THEME_SWITCH_NO_NETWORK_ACTIVITY = NOT_CLAIMED`

No business POST/PUT/PATCH/DELETE was issued by this control. Health checks were GET-only.

## 11. Root-Cause Correlation

| Layer | Evidence | Finding | Confidence |
|---|---|---|---|
| Theme state | `ThemeProvider` owns state and local preference | Proven architecture | High |
| DOM mutation | one `<html>` class toggle in source and runtime | Proven mechanism | High |
| CSS token propagation | `:root` / `.dark` custom properties used across semantic UI | Plausible style-recalculation scope | Medium |
| Broad transitions | 7 `transition-all` occurrences and many generic transitions | Candidate visual delay contributor | Low/medium |
| Compositor effects | 13 backdrop-blur occurrences, shadows, gradient, dashboard SVG/widgets | Candidate paint/composite contributor | Low |
| Hydration flash | server has no theme class, client reads localStorage in effect | Static risk exists | Medium |
| React fan-out | Theme context provider wraps app, but only direct profiler absent | Cannot prove cost or scope | Unknown |
| Refetch/network | no network event stream | Cannot prove or exclude | Unknown |
| Observed mixed state | one inconsistent EN Mobile Settings batch, direct recheck coherent | Session/viewport anomaly more likely than proven product cause | Low/medium |

### Root-cause decision

`PRIMARY_ROOT_CAUSE = UNRESOLVED`

The user-reported slowness/strangeness was not reproducibly measured under normal motion. The evidence proves several possible contributors but not which one caused the complaint. The isolated mixed/layout observations are not sufficiently stable to support a source fix.

## 12. Severity and Regression Radius

| ID | Finding | Classification | Severity | Priority | Blocks acceptance? |
|---|---|---|---|---|---|
| THEME-FORENSIC-001 | Isolated mixed-theme/layout outliers with changing session/viewport geometry | Runtime/session observability gap; product defect not proven | `P2` | `P2` | Yes, root-cause acceptance |
| THEME-FORENSIC-002 | DevTools long-task/paint/network/React metrics unavailable | Environment/tooling evidence gap | `P3` | `P3` | Yes, precise performance claim |

No P0 or P1 security, financial, inventory, data-integrity, or business-logic regression was found in this control. No business workflow was mutated.

Regression radius if a future fix is approved: global shell/theme consumers, header, sidebar, semantic color tokens, dashboard widgets, tables, settings animations, and any shared component using generic transitions. No current regression was introduced.

## 13. Minimum Safe Fix Proposal — Not Executed

The following is a proposal for a later Owner-approved fix only; it is not a change in this control:

1. Capture a normal-motion Chrome Performance trace on one simple page and one heavy route, in both directions, before changing source.
2. Attribute cost separately to style recalculation, layout, paint/composite, React render, and network/refetch.
3. If broad transitions are the proven cause, replace only the affected theme-transition declarations with property-scoped transitions; do not globally remove transitions.
4. If hydration flash is the proven cause, address only theme initialization/SSR synchronization; do not alter business providers or routes.
5. If a specific backdrop/shadow/chart layer is proven, isolate that component only.
6. Re-run AR/EN and Desktop/Tablet/Mobile evidence plus no-mutation checks.

Forbidden without a new approval: changing business logic, API, DB, permissions, tax/accounting/inventory behavior, theme colors solely to hide a contrast issue, or adding broad `transition: none` rules.

## 14. Candidate Files for a Future Approved Fix

No file was edited. Based on current evidence, the smallest possible future candidate set is:

| Candidate | Reason |
|---|---|
| `contexts/theme-context.tsx` | Only if initialization/DOM class timing is proven as the cause |
| `app/globals.css` | Only if semantic transition/reduced-motion scope is proven |
| `components/layout/sidebar.tsx` | Only if its `transition-all`/shadow is proven as a contributor |
| `components/layout/header.tsx` | Only if header blur/translucency is proven as a contributor |

This is a forensic candidate list, not authorization to edit.

## 15. File SHA-256 Evidence

Captured before report creation; unchanged during this control:

| File | SHA-256 |
|---|---|
| `contexts/theme-context.tsx` | `78B875D7F8078351AAF61B56EDD998C3EB4D9A8F2F5FAE229FA868DA3C07824C` |
| `app/globals.css` | `7F208980DB9A25E2A04A16AD0897FF8496F2182EA6AAE27CA94D17144C2CD61B` |
| `tailwind.config.ts` | `DB42E0B99DDDF066EE7D0979D8447A2DED242E0EE1109D1273A176BA616A3F0F` |
| `app/providers.tsx` | `9F0729A818EE2AE570B4828B356738B841AE4C09AF569E52077DE27B7080438E` |
| `app/[locale]/layout.tsx` | `A9BCFE5377AE9C3525038E0ED6790421026853B73AD495319215CB83A780DB5A` |
| `components/layout/header.tsx` | `5AA4E6B5A393D05EAAFA6D3AE3E77329E87C4D0C7B606AE74CDFAED0F15FB2BF` |
| `components/layout/sidebar.tsx` | `8F7378EF4AD18F15366F0F693CCD4C05A8EB29A7FAEAB5A58B2034B45CCD922C` |

The report file itself is the only intentional new artifact from this control.

## 16. Mutation / Safety Proof

| Proof | Result |
|---|---|
| Source files changed | `0` by this control |
| Style files changed | `0` by this control |
| Theme logic changed | `NO` |
| Business logic changed | `NO` |
| Tests changed | `0` |
| Database writes | `0` |
| Business API mutations | `0` |
| Migrations/seeds | `0` |
| Service restart/deployment | `0` |
| `next-env.d.ts` changed | `NO` |
| Production contacted | `NO` |

## 17. Owner Decision Packet

Owner decision required on whether to authorize a separate evidence-only performance capture with:

- normal-motion Chromium (`prefers-reduced-motion: no-preference`);
- fixed, independently verified viewport dimensions;
- DevTools Performance trace for long tasks, style/layout, paint/composite;
- Network trace to distinguish theme-only CSS work from refetches;
- React Profiler or equivalent source-safe render attribution;
- repeatable reproduction of the isolated EN Settings/Accounting/Installments observations.

Until that evidence exists, a source/style fix would be speculative and is not authorized by this control.

## 18. Gate

The required root-cause proof is not complete because normal-motion performance instrumentation is unavailable and the isolated mixed/layout observations were not stable across the same browser session.

`GATE = BLOCKED_THEME_SWITCH_ROOT_CAUSE_UNRESOLVED`

This is not a product PASS and does not authorize any fix. It also does not establish a P0/P1 product defect.

## 19. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UI-THEME-SWITCH-PERFORMANCE-AND-VISUAL-FORENSIC-01
MODE = READ_ONLY_BROWSER_AND_SOURCE_FORENSIC_ONLY

SOURCE_FILES_CHANGED = 0
STYLE_FILES_CHANGED = 0
THEME_LOGIC_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
DATABASE_WRITES = 0
BUSINESS_API_MUTATIONS = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
PRODUCTION_CONTACTED = NO

THEME_PROVIDER = contexts/theme-context.tsx
THEME_DOM_AUTHORITY = document.documentElement.classList["dark"]
THEME_TOKEN_AUTHORITY = app/globals.css :root/.dark CSS variables
TAILWIND_DARK_MODE = class
THEME_CLASS_MUTATION_PER_CLICK = 1
THEME_FLASH = NOT_STABLY_REPRODUCED
MIXED_THEME_OBSERVATION = ONE_ISOLATED_EN_SETTINGS_BATCH
LAYOUT_SHIFT_OBSERVATION = ISOLATED_TABLET_EN_DASHBOARD_AND_MOBILE_EN_RUNS

CLICK_TO_CLASS_CHANGE_MS = NOT_OBSERVABLE_EXACT
CLICK_TO_FIRST_PAINT_MS = NOT_OBSERVABLE
DOM_SETTLE_REDUCED_MOTION_MS = APPROXIMATELY_51_TO_83
LONGEST_TASK_MS = NOT_OBSERVABLE
PAINT_COMPOSITE_MS = NOT_OBSERVABLE
REACT_RERENDER_FANOUT = NOT_OBSERVABLE
NETWORK_REQUESTS_CAUSED_BY_THEME = NOT_OBSERVABLE

AR_DESKTOP = PASS_STABLE_DOM_PROOF
EN_DESKTOP = PASS_STABLE_DOM_PROOF
AR_TABLET = PASS_STABLE_DOM_PROOF
EN_TABLET = PASS_WITH_ISOLATED_LAYOUT_OUTLIER
AR_MOBILE = PASS_STABLE_DOM_PROOF
EN_MOBILE = PASS_WITH_ISOLATED_SESSION_OUTLIERS
CONSOLE_ERRORS = 0_IN_SUCCESSFUL_BATCHES
REDUCED_MOTION = OBSERVED_RESPECTED

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1
P3_COUNT = 1
P4_COUNT = 0

PRIMARY_ROOT_CAUSE = UNRESOLVED
ROOT_CAUSE_CONFIDENCE = INSUFFICIENT_FOR_FIX
REGRESSION_RADIUS = SHELL_THEME_SHARED_COMPONENTS_AND_HEAVY_WIDGETS

GATE = BLOCKED_THEME_SWITCH_ROOT_CAUSE_UNRESOLVED
NEXT_RECOMMENDED_STEP = OWNER_APPROVE_NORMAL_MOTION_DEVTOOLS_PERFORMANCE_NETWORK_REACT_CAPTURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 20. Stop

`FULL FORENSIC CONTROL COMPLETE → OWNER REVIEW → ROOT-CAUSE EVIDENCE DECISION → WAIT FOR EXPLICIT APPROVAL`

No fix, migration, build, restart, database mutation, production work, or next batch was started.
