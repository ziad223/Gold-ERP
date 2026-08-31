# DARFUS ERP — UI Theme Switch Normal-Motion Performance Trace Report

## 1. Executive Summary

تم تنفيذ الفحص التمهيدي المطلوب لهذا الـControl باستخدام Chrome المحلي، مع الالتزام بالقراءة فقط. قبل أي قياس تم فحص تفضيل الحركة والـviewport.

النتيجة الحاسمة: جلسة Chrome الحالية تعمل مع `prefers-reduced-motion: reduce`، بينما المطلوب هو `no-preference`. كما أن الـviewport الفعلي الحالي `1536×695` وليس `1440×900`. لذلك لم يتم تشغيل أي trace أو استخدام أي قياس أداء غير صالح.

لم يتم تعديل المصدر أو CSS أو Theme Logic أو قاعدة البيانات، ولم تُرسل أي Business API mutation. التقرير محجوب بيئيًا قبل مرحلة القياس، ولا يثبت وجود عيب في المنتج أو عدمه.

`GATE = BLOCKED_NORMAL_MOTION_BROWSER_ENVIRONMENT_UNAVAILABLE`

## 2. Upstream Blocker

الـControl السابق أغلق على:

`GATE = BLOCKED_THEME_SWITCH_ROOT_CAUSE_UNRESOLVED`

والسبب أن جلسة القياس السابقة كانت Reduced-Motion ولم توفر Performance/Network/React profiling. هذا الـControl اشترط معالجة ذلك أولًا.

الفحص الحالي في Chrome أثبت:

| Check | Required | Actual | Result |
|---|---|---|---|
| `matchMedia("(prefers-reduced-motion: reduce)").matches` | `false` | `true` | FAIL / blocking |
| `matchMedia("(prefers-reduced-motion: no-preference)").matches` | `true` | `false` | FAIL / blocking |
| `window.innerWidth` | `1440` | `1536` | FAIL / blocking |
| `window.innerHeight` | `900` | `695` | FAIL / blocking |
| `devicePixelRatio` | record | `1.25` | recorded |
| `visualViewport.scale` | record | `1` | recorded |

The control explicitly requires stopping when Normal-Motion cannot be achieved. No reduced-motion performance data was promoted into this report as valid normal-motion evidence.

## 3. Browser / Motion Proof

| Item | Evidence |
|---|---|
| Browser | Local Chrome via connected browser extension |
| Initial route attempt | `http://localhost:3000/en/customers` |
| Actual result | Redirected to `http://localhost:3000/en/login` |
| Login mutation | Not performed in this control |
| Reduced motion | `true` |
| No preference | `false` |
| Normal-motion proof | `NO` |
| Performance trace started | `NO` |

Because the browser preference failed the mandatory gate, no login or authenticated route traversal was needed to reach a safe stop. No credentials were entered or recorded.

## 4. Session / Viewport Proof

The exact read-only page evaluation returned:

```json
{
  "url": "http://localhost:3000/en/login",
  "reduce": true,
  "noPreference": false,
  "innerWidth": 1536,
  "innerHeight": 695,
  "dpr": 1.25,
  "zoom": 1
}
```

`VIEWPORT_STABLE = NO` for the required `1440×900` initial scope. No attempt was made to reinterpret `1536×695` as `1440×900`, and no sample was collected.

## 5. Test Routes

The control requires this order:

| Route | Role | Attempted | Valid trace |
|---|---|---:|---:|
| `/en/customers` | SIMPLE_ROUTE | 1 navigation | 0 |
| `/en/dashboard` | HEAVY_ROUTE | not attempted after mandatory stop | 0 |
| `/ar/customers` | AR mirror | not attempted | 0 |
| `/ar/dashboard` | AR mirror | not attempted | 0 |

The customers navigation redirected to login. This is an authentication/session fact, not a theme performance result.

## 6. Theme Switch Timing

No theme switch trace was validly executed.

| Metric | Value |
|---|---|
| `VALID_TRACE_COUNT` | `0` |
| Light → Dark | `NOT_RUN` |
| Dark → Light | `NOT_RUN` |
| Click timestamp | `NOT_RUN` |
| Theme class timestamp | `NOT_RUN` |
| First theme paint | `NOT_RUN` |
| Visual settle | `NOT_RUN` |
| Min / median / P95 / max | `NOT_RUN` |

## 7. Main Thread Breakdown

Not collected. No Performance trace was started because the mandatory Normal-Motion environment gate failed.

| Metric | Result |
|---|---|
| Scripting | `NOT_RUN` |
| Style recalculation | `NOT_RUN` |
| Layout | `NOT_RUN` |
| Paint | `NOT_RUN` |
| Composite | `NOT_RUN` |
| Other | `NOT_RUN` |
| Total main-thread busy | `NOT_RUN` |

## 8. Long Tasks

`LONG_TASK_COUNT_GT_50MS = NOT_RUN`

`LONGEST_TASK_MS = NOT_RUN`

No long-task conclusion is made.

## 9. Paint / Composite

`FULL_VIEWPORT_PAINT = UNKNOWN`

`PAINTED_AREA = NOT_RUN`

`TOP_PAINT_HOTSPOTS = NOT_RUN`

The previously identified static candidates remain unproven for this Control: header `backdrop-blur-xl`, translucent header surface, sidebar `transition-all`, shadows, global radial gradient, and dashboard widgets/SVG.

## 10. CSS Effect Correlation

No runtime trace exists to correlate source effects to cost.

| Candidate | Runtime cost |
|---|---|
| Header blur/translucency | `NOT_PROVEN` |
| Sidebar `transition-all duration-300` | `NOT_PROVEN` |
| Global radial background | `NOT_PROVEN` |
| Shared shell transitions | `NOT_PROVEN` |

## 11. React Profiler

React Profiler was not available through the connected browser surface and no product instrumentation was added.

| Metric | Result |
|---|---|
| React commit count | `NOT_RUN` |
| Total render time | `NOT_RUN` |
| Max commit | `NOT_RUN` |
| Render fan-out | `NOT_OBSERVABLE` |

## 12. Remount Detection

`HEAVY_COMPONENT_REMOUNT = NOT_OBSERVABLE`

No conclusion was made about ThemeProvider, Header, Sidebar, Dashboard, tables, widgets, charts, or query-provider reset.

## 13. Network Trace

No Network trace was started.

| Metric | Result |
|---|---|
| Requests during switch | `NOT_RUN` |
| Requests caused by switch | `NOT_RUN` |
| Data refetch | `NOT_OBSERVABLE` |
| Network cause ruled out | `NO` |
| Non-GET mutation | `0` |

The only navigation observed was a GET navigation to the local frontend, which redirected to login. No business API mutation was sent.

## 14. Transition Duration Evidence

No authenticated theme-switch surface was reached in a valid Normal-Motion session, so the required computed transition table was not collected.

| Element | Transition property | Duration | Result |
|---|---|---|---|
| `html` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| `body` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| header | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| sidebar | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| main shell | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| representative card | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Customers table | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Dashboard widget | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |

`THEME_SWITCH_VISUAL_DELAY_FROM_TRANSITION = NOT_PROVEN`

## 15. Sidebar 300ms Hypothesis

`SIDEBAR_300MS_HYPOTHESIS = INCONCLUSIVE`

The source candidate remains documented from the upstream forensic work, but this Control collected no valid normal-motion trace and therefore cannot confirm or reject it.

## 16. Customers vs Dashboard Comparison

| Metric | Customers | Dashboard | Delta |
|---|---|---|---|
| Click → paint median | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Visual settle median | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Scripting | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Style/layout | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Paint/composite | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Longest task | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| React render time | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |
| Theme-caused requests | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |

## 17. AR/RTL Mirror

Not run. The control requires proving the English normal-motion baseline first, which was blocked by the browser environment.

`RTL_COST_DELTA = NOT_RUN`

`AR_ONLY_THEME_ANOMALY = NOT_RUN`

## 18. Mixed Theme Evidence

No valid theme-switch window was captured.

`MIXED_THEME_FRAME = NOT_RUN`

The prior control’s isolated mixed-theme observation remains historical/unresolved evidence and was not reclassified here.

## 19. Layout Stability

No valid switch trace was captured.

| Metric | Result |
|---|---|
| Header rect before/after | `NOT_RUN` |
| Sidebar rect before/after | `NOT_RUN` |
| Main rect before/after | `NOT_RUN` |
| Document height | `NOT_RUN` |
| Scrollbar presence | `NOT_RUN` |
| CLS | `NOT_RUN` |
| Theme-caused layout shift | `NOT_RUN` |

## 20. Console / Runtime Errors

| Metric | Result |
|---|---|
| Console errors | `0` observed on the login redirect |
| Console warnings | `0` observed on the login redirect |
| Page errors | `0` observed |
| Hydration warnings | `0` observed |
| Request failures | `NOT_FULL_TRACE` |

These observations cover only the unauthenticated login redirect, not the required application routes.

## 21. Root Cause

No product root cause can be chosen because no valid normal-motion switch trace exists.

`PRIMARY_ROOT_CAUSE = ROOT_CAUSE_UNRESOLVED`

`SECONDARY_CONTRIBUTORS = NORMAL_MOTION_ENVIRONMENT_UNAVAILABLE; PERFORMANCE_TRACE_SURFACE_NOT_EXPOSED`

`CONFIDENCE = LOW`

This is an environment/evidence blocker, not a proven product defect.

## 22. Severity / Regression Radius

| Finding | Classification | Severity | Priority |
|---|---|---|---|
| Normal-Motion cannot be enabled in Chrome session | Environment/configuration blocker | P2 | P2 |
| Required Performance/Network/React trace surface is unavailable | Observability/tooling gap | P3 | P3 |

No P0/P1 business, security, financial, inventory, or data-integrity regression was tested or introduced.

Potential future regression radius remains the shared theme shell, Header, Sidebar, global semantic tokens, dashboard widgets, tables, and shared transition utilities.

## 23. Minimum Safe Fix Proposal

No product fix is proposed from this incomplete trace. The minimum safe next diagnostic action is to provide a valid browser session with:

1. `prefers-reduced-motion: no-preference` (`reduce=false`, `no-preference=true`).
2. Verified CSS viewport exactly `1440×900` for the trace window.
3. Performance timeline including scripting, style, layout, paint, and composite.
4. Network event attribution.
5. React Profiler if available; otherwise explicit `NOT_OBSERVABLE`.
6. Stable authenticated session on `/en/customers` and `/en/dashboard`.

No source, CSS, Tailwind, ThemeProvider, Header, Sidebar, Dashboard, database, or business behavior change is authorized by this report.

## 24. Owner Proposed Change Packet

```text
ROOT_CAUSE = UNRESOLVED
PROPOSED_CHANGE = NONE_UNTIL_VALID_NORMAL_MOTION_TRACE
FILES_TO_CHANGE = NONE
WHY_THIS_IS_MINIMUM_SAFE_CHANGE = No product change is justified by an invalid/incomplete trace
WHY_DESIGN_WILL_NOT_CHANGE = No design change executed
WHY_BUSINESS_BEHAVIOR_WILL_NOT_CHANGE = No business code was touched
EXPECTED_PERFORMANCE_EFFECT = NOT_ESTIMABLE
POSSIBLE_SIDE_EFFECTS = NONE_FROM_THIS_CONTROL
REGRESSION_RADIUS = NONE_INTRODUCED; FUTURE_SCOPE_IS_SHARED_THEME_SHELL_IF_APPROVED
ROLLBACK_METHOD = NOT_APPLICABLE; no source change
BEFORE_HASHES = Upstream report hashes retained; current theme files unchanged in this control
OWNER_APPROVAL_REQUIRED = YES
```

## 25. DB / Mutation Safety

| Safety item | Result |
|---|---|
| Source files changed | `0` |
| Style files changed | `0` |
| Theme logic changed | `NO` |
| Business logic changed | `NO` |
| Database writes | `0` |
| Business API mutations | `0` |
| Migrations executed | `0` |
| Seeds executed | `0` |
| POS work started | `NO` |
| Production contacted | `NO` |

The pre-existing dirty worktree and Owner-accepted `next-env.d.ts` drift were not modified or reverted.

## 26. Gate

The mandatory Normal-Motion proof failed before tracing:

- `reduce = true`, not `false`.
- `no-preference = false`, not `true`.
- viewport `1536×695`, not `1440×900`.

Therefore the exact gate is:

`GATE = BLOCKED_NORMAL_MOTION_BROWSER_ENVIRONMENT_UNAVAILABLE`

No implementation or theme fix is authorized.

## 27. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UI-THEME-SWITCH-NORMAL-MOTION-PERFORMANCE-TRACE-01
MODE = READ_ONLY_NORMAL_MOTION_BROWSER_PERFORMANCE_FORENSIC

NORMAL_MOTION_PROVEN = NO
VIEWPORT_STABLE = NO

SIMPLE_ROUTE = /en/customers
HEAVY_ROUTE = /en/dashboard
VALID_TRACE_COUNT = 0

LIGHT_TO_DARK_MEDIAN_MS = NOT_RUN
DARK_TO_LIGHT_MEDIAN_MS = NOT_RUN
LONGEST_TASK_MS = NOT_RUN
SCRIPTING_SHARE = NOT_RUN
STYLE_LAYOUT_SHARE = NOT_RUN
PAINT_COMPOSITE_SHARE = NOT_RUN
REACT_RENDER_FANOUT = NOT_OBSERVABLE
HEAVY_COMPONENT_REMOUNT = NOT_OBSERVABLE
THEME_SWITCH_CAUSES_DATA_REFETCH = NOT_OBSERVABLE
SIDEBAR_300MS_HYPOTHESIS = INCONCLUSIVE
FULL_VIEWPORT_PAINT = UNKNOWN
MIXED_THEME_FRAME = NOT_RUN
THEME_CAUSED_LAYOUT_SHIFT = NOT_RUN

PRIMARY_ROOT_CAUSE = ROOT_CAUSE_UNRESOLVED
SECONDARY_CONTRIBUTORS = NORMAL_MOTION_ENVIRONMENT_UNAVAILABLE; PERFORMANCE_TRACE_SURFACE_NOT_EXPOSED
ROOT_CAUSE_CONFIDENCE = LOW

SOURCE_FILES_CHANGED = 0
STYLE_FILES_CHANGED = 0
THEME_LOGIC_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
DATABASE_WRITES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_API_MUTATIONS = 0

MINIMUM_SAFE_FIX_IDENTIFIED = NO
OWNER_APPROVAL_REQUIRED = YES
GATE = BLOCKED_NORMAL_MOTION_BROWSER_ENVIRONMENT_UNAVAILABLE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_PROVIDE_VALID_NORMAL_MOTION_PERFORMANCE_TRACE_PATH
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

`NORMAL-MOTION TRACE BLOCKED → OWNER REVIEW → WAIT FOR VALID BROWSER ENVIRONMENT`

No theme fix, source edit, build, migration, database mutation, or next batch was started.
