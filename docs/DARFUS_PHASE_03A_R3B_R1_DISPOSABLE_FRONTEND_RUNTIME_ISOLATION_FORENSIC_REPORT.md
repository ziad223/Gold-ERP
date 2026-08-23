# DARFUS ERP — Phase 03A-R3B-R1 Disposable Frontend Runtime Isolation Forensic Report

Control ID: `DARFUS-PHASE-03A-R3B-R1-DISPOSABLE-FRONTEND-RUNTIME-ISOLATION-FORENSIC`

Mode: `READ_ONLY_RUNTIME_FORENSIC_DESIGN_ONLY`

Date: `2026-08-18`

## 1. Executive Summary

تم تنفيذ هذا التحكم قراءة فقط. لم يتم تشغيل First-Run، ولم يتم إرسال `POST /setup/bootstrap`، ولم يتم تعديل المصدر أو الاختبارات أو migrations أو الإعدادات، ولم تتم أي كتابة على `darfus_erp` أو على قاعدة الـDisposable.

الحقائق المثبتة هي:

- قاعدة `darfus_first_run_r3b_20260818_104917` بقيت Fresh بحالة `SETUP_REQUIRED`.
- Backend المعزول السابق على `http://localhost:8121` كان متصلًا بالـDisposable وأعاد `health=200` و`setup/status=200 SETUP_REQUIRED`.
- Browser السابق على `http://localhost:3001/ar/setup` حمّل HTML/assets وبقي على `Preparing setup…`؛ لم يظهر نموذج First-Run ولم تُثبت منه طلبات `setup/status` أو `setup/bootstrap`.
- مصدر `SetupPage` يبدأ بـ`status=null` ويعرض `Preparing setup…` لكل حالة غير `SETUP_REQUIRED`، بينما `catch` يضع `error` فقط ولا يعرضه في هذا الفرع. هذا يثبت مسار UI قابلًا للبقاء على شاشة الانتظار إذا لم ينجح status request، لكنه لا يثبت وحده سبب عدم تنفيذ client effect.
- الـmain compiled frontend bundle يحتوي القيمة المضمّنة `http://localhost:8000/api/v1`. لذلك فإن تمرير HTML/assets من `:3000` خلف proxy على `:3001` مع توجيه `/api/v1` فقط إلى `:8121` لا يغيّر القيمة المضمّنة ولا يضمن أن طلبات Browser ستصل إلى Backend الـDisposable.
- لا توجد Browser console exception أو Network trace كافية لتحديد أول فشل client-side بعينه، كما أن Browser evaluation المتاح في R3B لم يوفّر `fetch` أو `performance` لإجراء diagnostic read-only إضافي. لذلك يبقى السبب الفوري لعدم إرسال الطلب `UNPROVEN`، مع وجود topology defect مثبت.

بناءً على قاعدة “لا تستخدم التخمين بدل الدليل”، Gate هذا التحكم `BLOCKED` وليس PASS.

## 2. Preconditions

تمت قراءة مدخلي R3B-R1 كاملين:

| Input | Result |
|---|---|
| `docs/DARFUS_PHASE_03A_R3A_FIRST_RUN_BROWSER_PATH_FORENSIC_ACCEPTANCE_CRITERIA_CORRECTION_REPORT.md` | `READ_COMPLETE` |
| `docs/DARFUS_PHASE_03A_R3B_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE_DISPOSABLE_POSTGRES_REPORT.md` | `READ_COMPLETE` |
| R3B-R1 execution instruction | `READ_COMPLETE` |

Preconditions accepted from the previous controls:

| Fact | Value |
|---|---|
| Disposable DB | `darfus_first_run_r3b_20260818_104917` |
| Disposable migration state | `SequelizeMeta=83` |
| Disposable initial state | `SETUP_REQUIRED` |
| Previous frontend access | `http://localhost:3001` |
| Previous disposable backend | `http://localhost:8121` |
| Official DB | `darfus_erp`, read-only |
| Product First-Run integration gap | `NO`, per R3A source trace |

## 3. Frozen R3A/R3B Facts

R3A proved the canonical source path:

`/{locale}/setup` → `GET /api/v1/setup/status` → `POST /api/v1/setup/bootstrap` → first-run orchestrator → financial readiness → inventory master-data bootstrap → `READY`.

R3B proved a fresh Disposable target and direct Backend readiness, but its real Browser path stopped at `Preparing setup…`:

| R3B observation | Result |
|---|---|
| HTML/assets loaded | `YES` |
| First-Run form visible | `NO` |
| Browser `GET /api/v1/setup/status` observed on isolated path | `NO` |
| Browser `POST /api/v1/setup/bootstrap` | `NOT_SENT` |
| Direct `GET http://localhost:8121/api/v1/setup/status` | `200 SETUP_REQUIRED` |
| Official DB mutation | `0` |

These facts are not reopened or relabeled as a Product First-Run defect.

## 4. Official DB Protection

`darfus_erp` was treated as read-only. No `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `DROP`, migration, bootstrap, setup, reset, or backup operation was performed in R3B-R1.

Read-only verification during this control returned:

```text
darfus_erp|postgres|16.15
companies|1
branches|1
users|1
profile_master_data|659
pearl_size_master_data|39
inventory_master_data_bootstrap_states|1
suppliers|0
inventory_locations|0
settings|0
```

The values match the post-R2/R3B baseline evidence. `OFFICIAL_DB_WRITES_THIS_CONTROL=0`.

## 5. Disposable DB Fresh-State Verification

The existing Disposable was queried read-only through the local PostgreSQL container. No setup request or mutation was issued.

```text
darfus_first_run_r3b_20260818_104917|postgres|16.15
companies|0
branches|0
users|0
profile_master_data|0
pearl_size_master_data|0
inventory_master_data_bootstrap_states|0
```

The prior R3B baseline also recorded zero business transaction rows and zero bootstrap marker rows. No First-Run rows appeared during R3B-R1.

Decision: `EXISTING_DISPOSABLE_DB_SAFE_TO_REUSE=YES`, subject to the next control rechecking the same values immediately before any approved mutation.

## 6. Previous Proxy Topology

The R3B temporary topology was:

```text
Browser :3001
  ├─ HTML / assets → main Next runtime :3000
  └─ /api/v1       → Disposable Backend :8121
                         └─ Disposable DB darfus_first_run_r3b_20260818_104917
```

The proxy was a temporary foreground helper, not a repository file. Its observed behavior was:

| Concern | Observed behavior | Consequence |
|---|---|---|
| HTML/assets | Forwarded to `:3000` | Browser received main runtime output |
| `/api/v1` | Forwarded to `:8121` | Only relative API calls could use Disposable Backend |
| Host/origin | Not a full Next reverse proxy contract | Origin assumptions were not proven equivalent |
| `X-Forwarded-*` | Not consistently implemented | Forwarded-origin behavior was not equivalent to Next |
| WebSocket upgrade | Not implemented | HMR socket was not proven |
| RSC/Next internals | No complete Next-aware forwarding contract | Client/server runtime parity was not proven |
| cookies/Location | No complete domain/path/absolute-location rewrite contract | Cross-origin behavior was not proven |
| cache | Later attempts forced identity/no-store and appended a cache-buster | This reduced cache risk but did not change compile-time API values |

## 7. Browser Failure Reproduction

R3B evidence was reused; R3B-R1 did not restart the stopped Backend/proxy or create a new topology.

The previous real Browser result was:

```text
URL: http://localhost:3001/ar/setup
Visible state: Preparing setup…
HTML/assets: loaded
First-Run form: not visible
GET /api/v1/setup/status through isolated path: not observed
POST /api/v1/setup/bootstrap: not sent
```

This is a valid reproduction record from R3B. It is not evidence that the source orchestrator is absent.

## 8. Browser Console Evidence

The R3B Browser log contained React DevTools informational output only. No message was recorded as:

| Class | Result |
|---|---|
| `FATAL_CLIENT_ERROR` | Not observed |
| `HYDRATION_ERROR` | Not observed |
| `CHUNK_LOAD_ERROR` | Not observed |
| `CORS_ORIGIN_ERROR` | Not observed |
| `API_CLIENT_ERROR` | Not observed |
| `NEXT_ROUTER_ERROR` | Not observed |
| `HMR_ONLY_INFO` | Observed / informational |

`EXACT_FIRST_BLOCKING_CLIENT_ERROR = NO_CONSOLE_EXCEPTION_OBSERVED`.

Absence of a console exception is not converted into a claim that client execution completed successfully.

## 9. Browser Network Evidence

The previous proxy log recorded document and Next static asset requests, plus HMR HTTP activity. It did not record an isolated `/api/v1/setup/status` or `/api/v1/setup/bootstrap` request.

| Request class | Previous result |
|---|---|
| document | loaded |
| `_next/static` JavaScript/CSS | loaded in the observed proxy attempt |
| RSC/navigation | no complete proof of setup client transition |
| HMR HTTP | observed |
| HMR WebSocket | not proven; proxy had no WebSocket upgrade handling |
| `/api/v1/setup/status` to `:8121` | not observed |
| `/api/v1/setup/bootstrap` | not sent |

The evidence does not distinguish, by itself, among “client effect did not run”, “request used the main absolute backend”, “request failed before the disposable proxy”, or “request was not captured by the available Browser surface”.

## 10. SetupPage Hydration Trace

Source: `app/[locale]/setup/page.tsx`.

| Location | Evidence |
|---|---|
| line 1 | Client component: `"use client"` |
| lines 15–20 | Initial `status=null`, `error=null`, `complete=false` |
| lines 23–29 | `useEffect` calls `apiClient("/setup/status", { companyScope: "none", skipBranch: true })` |
| lines 25–27 | Success sets status; rejection sets an error message |
| lines 58–62 | READY/recovery branches are rendered explicitly |
| lines 64–66 | Any status other than `SETUP_REQUIRED` renders `Preparing setup…` |
| lines 68–88 | The form is rendered only after exact `SETUP_REQUIRED` |
| lines 71, 32–56 | Error rendering exists in form/submit paths, not in the `status !== SETUP_REQUIRED` loading branch |

Proven possible paths to a permanent-looking Preparing state:

1. Client component has not hydrated or its effect has not run: `status` remains `null`.
2. The status request rejects: `error` is set, but the loading branch ignores `error` while `status` remains `null`.
3. The response never resolves or the request is routed outside the observed disposable path: `status` never becomes `SETUP_REQUIRED`.
4. A response returns a state other than `SETUP_REQUIRED`, `READY`, `RECOVERY_REQUIRED`, or `CONFIGURATION_CONFLICT`: the same fallback branch remains visible.

The source proves the UI’s error-visibility weakness. It does not prove which of these paths occurred in the Browser run.

## 11. API Client Runtime Base Resolution

Source: `lib/api/client.ts` lines 319–380 and `lib/data-source.ts` lines 24–31.

The client uses:

```text
const dataSource = getDataSourceMode();
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
return fetch(`${apiBaseUrl}${path}`, ...);
```

`/setup/status` is classified as context-free by `isContextFreePath`, and the SetupPage explicitly disables company and branch context. Therefore the path construction is expected to be:

```text
${compiled NEXT_PUBLIC_API_URL}/setup/status
```

not a runtime lookup of `window.location.origin` and not an automatic substitution of `:8121`.

In the compiled main frontend evidence, the effective Browser base is:

```text
http://localhost:8000/api/v1
```

Therefore, for a reused main bundle opened at `:3001`, `BROWSER_API_BASE_RESOLUTION` is proven as `http://localhost:8000/api/v1`, not `http://localhost:8121/api/v1` and not guaranteed to be relative to `:3001`.

## 12. Environment Variable Resolution

Relevant variable names found without printing values:

```text
NEXT_PUBLIC_DATA_SOURCE
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_API_ORIGIN
BACKEND_ORIGIN
BACKEND_URL
FRONTEND_URL
```

The Browser-facing variables are `NEXT_PUBLIC_*`. `lib/data-source.ts` explicitly describes their values as compile-time inlined, and the generated bundle contains the literal `http://localhost:8000/api/v1`.

Conclusion:

| Question | Proven answer |
|---|---|
| Is Browser `NEXT_PUBLIC_API_URL` a server-only runtime lookup? | No |
| Can a proxy origin change an already compiled public value? | No |
| Does `:3001` automatically retarget the compiled absolute URL? | No |
| Can command-local env affect a newly started actual Next process? | Yes, by process start; not retroactively for the reused `:3000` bundle |
| Was a persistent env/config edit made in R3B-R1? | No |

## 13. Main Frontend Bundle Analysis

Read-only inspection of `.next/dev` found the relevant compiled literals:

```text
.next/dev/static/chunks/_07s-a9i._.js
  rawApiUrl() → "http://localhost:8000/api/v1"
  apiClient() → "http://localhost:8000/api/v1"

.next/dev/static/chunks/_06jh3ej._.js
  API URL consumers → "http://localhost:8000/api/v1"
```

The presence of the literal in the compiled output is direct evidence that the main frontend bundle was produced under main-runtime assumptions. Rewriting HTML or proxying asset bytes does not recompile the bundle. A temporary text rewrite may change selected responses, but it is not a complete or stable guarantee for all chunks, cached responses, RSC data, source maps, or dynamically discovered assets.

## 14. Proxy Routing Analysis

The previous helper routed based on request path: relative `/api/v1` requests went to `:8121`; all other paths went to `:3000`. The main bundle’s absolute `http://localhost:8000/api/v1` does not match that proxy branch. It can therefore bypass `:3001` and target the main Backend.

The later cache-buster and response-text rewrite reduced one class of stale asset issue, but did not establish a full Next-compatible reverse proxy. No complete proof was available for:

- Browser `Origin` preservation/rewriting;
- `Host` and `X-Forwarded-*` semantics;
- WebSocket upgrade and HMR socket target;
- RSC request/header forwarding;
- cookie path/domain rewriting;
- absolute `Location` rewriting;
- all dynamic chunk and cache variants.

`PROXY_BEHAVIOR = PARTIALLY_PROVEN; UNSAFE_FOR_ACCEPTANCE_AS_A_FULL_NEXT_RUNTIME`.

## 15. Next Dev Origin/HMR Analysis

Project source:

- `next` version in `package.json`: `16.2.9`;
- `next.config.ts` defines headers/CSP and image origins, but no `allowedDevOrigins`, `assetPrefix`, `basePath`, `rewrites`, or `redirects`;
- `proxy.ts` is the next-intl middleware with a matcher excluding `api`, `_next`, and file paths;
- no persisted repository proxy implements the R3B `:3001 → :3000/:8121` topology.

R3B observed HMR HTTP requests. The temporary proxy did not implement WebSocket upgrade. No reload loop or fatal runtime exception was observed.

Conclusion:

```text
HMR_RUNTIME_STATE = HMR_HTTP_REQUEST_OBSERVED; WEBSOCKET_UPGRADE_NOT_SUPPORTED_BY_TEMP_PROXY; NO_RELOAD_LOOP_PROVEN; NOT_PROVEN_AS_PRIMARY_BLOCKER
```

A broken HMR socket is a development-runtime risk, not a proven explanation for the missing setup request.

## 16. Safe Browser Read-Only Fetch Diagnostic

The requested Browser-side diagnostic `fetch('/api/v1/setup/status')` from `:3001` was not run in R3B-R1.

Reason: the previously available in-app Browser evaluation context did not expose `fetch` or `performance`, and starting a new frontend/backend topology solely to obtain this diagnostic would violate the no-restart/no-new-runtime rule for this control. The prior direct request to `http://localhost:8121/api/v1/setup/status` returned `200 SETUP_REQUIRED`, but that was not a Browser-origin fetch and is not relabeled as one.

```text
SAFE_BROWSER_READ_ONLY_SETUP_STATUS_FETCH = UNSUPPORTED_BY_AVAILABLE_BROWSER_EVALUATION_CONTEXT; DIRECT_8121_GET_ALREADY_PROVEN_200_SET_UP_REQUIRED; NOT_BROWSER_PROOF
```

## 17. Exact Root Cause

The exact **topology defect** is proven:

```text
REUSED_MAIN_BUNDLE_COMPILED_WITH_ABSOLUTE_MAIN_API_8000
 + TEMPORARY_PROXY_ONLY_ROUTED_RELATIVE_API_V1_TO_DISPOSABLE_8121
 + PROXY_DID_NOT_PROVIDE_FULL_NEXT_ORIGIN/HMR/RSC_CONTRACT
 = ISOLATED_BROWSER_RUNTIME_NOT_AUTHORITY-SAFE_FOR_DISPOSABLE_FIRST-RUN_PROOF
```

The exact **immediate Browser blocker** that left the page on `Preparing setup…` is not proven. No first console exception, Browser-side fetch status, or client execution trace was available to distinguish hydration non-execution from an early API failure or a request bypassing the disposable proxy.

Therefore:

```text
BROWSER_PREPARING_SETUP_ROOT_CAUSE = IMMEDIATE_BLOCKER_UNPROVEN; PROVEN_CONTRIBUTOR_MAIN_BUNDLE_API_BASE_MISMATCH_AND_INCOMPLETE_NEXT_PROXY_TOPOLOGY
ROOT_CAUSE_CLASS = I_UNPROVEN_WITH_PROVEN_A_CLIENT_BUNDLE_API_BASE_MISMATCH_AND_B_NEXT_DEV_PROXY_ORIGIN_RUNTIME_INCOMPATIBILITY
```

No generic `ENVIRONMENT_CONFIG` label is used as the final root cause.

## 18. Product Defect vs Acceptance Runtime Classification

| Finding | Classification | Evidence | Product patch? |
|---|---|---|---|
| First-Run orchestrator integration | Product integration gap not proven | R3A source trace | No |
| Disposable Backend/DB status | Healthy in prior direct proof | R3B direct `200 SETUP_REQUIRED` | No |
| Main compiled API base reused under `:3001` | Acceptance runtime/topology defect | `.next/dev` literal `http://localhost:8000/api/v1` | No source patch in R1 |
| Temporary proxy not full Next reverse proxy | Acceptance runtime limitation | No WebSocket/RSC/forwarded-header proof | No source patch in R1 |
| SetupPage hides status-fetch errors while status is null | Product UX robustness limitation | `page.tsx:27`, `:64–66` | Out of scope; do not patch in R1 |
| Immediate reason for no Browser request | Unknown | No Browser-side fetch/exception evidence | No patch justified |

`PRODUCT_FIRST_RUN_INTEGRATION_GAP=NO` remains unchanged. `PRODUCT_SOURCE_PATCH_REQUIRED=NO` for this runtime-isolation control.

## 19. Retry Topology Options

### Option A — Previous Proxy Reuse

`Browser :3001 → proxy HTML/assets :3000; /api/v1 → :8121`

Decision: `UNRELIABLE` and not acceptable for R3B closure because the reused public bundle is compiled with the main absolute API URL and the proxy lacks a complete Next dev-origin contract.

### Option B — Separate Actual Next Frontend

Start a separate frontend process from the same source with command-local `NEXT_PUBLIC_API_URL=http://localhost:8121/api/v1` and `NEXT_PUBLIC_DATA_SOURCE=api`, on a separate local port, while the isolated Backend targets the existing Disposable DB.

Decision: `RECOMMENDED DESIGN`, provided the next control explicitly authorizes the isolated frontend process. It requires no source edit, no persistent `.env` edit, and does not alter `:3000` or `:8000`.

### Option C — Actual Frontend Plus Isolated Reverse Proxy

Decision: `NOT_SELECTED`. It would require proving or implementing a full Next-aware origin/proxy contract and is not necessary if Option B is available.

### Option D — Existing Browser/E2E Harness

The existing `scripts/run-single-company-browser-acceptance.mjs` can start an owned Backend on `8001` and an actual Next process on `3300` with command-local API values. Its current reuse mode only accepts the main runtime ports `3000/8000`, so it cannot reuse `8121`/a disposable frontend without a separately approved harness invocation or a future harness-scope decision.

Decision: `POTENTIALLY_USABLE_EXISTING_PATTERN; NOT_EXECUTED_IN R1`.

## 20. Recommended Minimum Safe Retry Topology

Recommend exactly one design:

```text
Existing fresh Disposable DB
        ↑
isolated Backend process :8121 (or an explicitly approved equivalent)
        ↑
separate actual Next frontend process :3301
  command-local NEXT_PUBLIC_API_URL=http://localhost:8121/api/v1
  command-local NEXT_PUBLIC_DATA_SOURCE=api
        ↑
real Browser :3301/ar/setup
```

Required properties for R3B-R2:

- do not reuse HTML/assets from the main `:3000` process;
- do not edit persistent `.env` files;
- do not build;
- verify the child frontend process received the intended values before Browser navigation;
- verify the Browser requests `GET /api/v1/setup/status` and, only after explicit approved setup data entry, `POST /api/v1/setup/bootstrap`;
- verify the Backend process is connected to `darfus_first_run_r3b_20260818_104917`;
- verify `darfus_erp` remains unchanged.

This is a design only. It was not started automatically.

## 21. Existing Disposable Reuse Decision

```text
EXISTING_DISPOSABLE_DB_SAFE_TO_REUSE = YES
```

Evidence: read-only identity is `darfus_first_run_r3b_20260818_104917`, with `companies=0`, `branches=0`, `users=0`, `profile_master_data=0`, `pearl_size_master_data=0`, and `inventory_master_data_bootstrap_states=0`. Prior R3B evidence recorded zero setup marker/business transaction rows.

The next control must re-verify freshness immediately before any mutation. No cleanup or reset was performed.

## 22. Backend 8121 Reuse Decision

```text
DISPOSABLE_BACKEND_8121_CONFIGURATION_WAS_CORRECT = YES
```

R3B direct evidence:

```text
GET http://localhost:8121/api/v1/health → 200
GET http://localhost:8121/api/v1/setup/status → 200 SETUP_REQUIRED
current_database → darfus_first_run_r3b_20260818_104917
```

The process was stopped after R3B. R3B-R1 did not restart it.

## 23. Product Source Change Requirement

```text
PRODUCT_SOURCE_PATCH_REQUIRED = NO
```

The R3B-R1 evidence identifies an acceptance runtime isolation/topology problem and an unproven immediate Browser execution blocker. It does not justify changing Product source. The SetupPage error-rendering limitation is documented as a separate source observation, not patched because R1 forbids Product changes and does not prove it was the triggering runtime event.

## 24. Risk Classification

| Risk | Severity | Classification | Impact |
|---|---|---|---|
| R3B Browser acceptance cannot prove First-Run | P2 | Acceptance runtime blocker | Phase 03A closure is blocked |
| Reusing main compiled bundle for Disposable Browser | P2 | Runtime topology | Requests may target `:8000` instead of `:8121`; evidence can be invalid |
| SetupPage does not show status-fetch error in loading branch | P2 | Product UX robustness / observability | Browser may appear stuck without actionable error |
| HMR WebSocket not supported by temporary proxy | P3 | Dev runtime/observability | Hot reload state is not trustworthy; not proven as primary blocker |
| Official DB mutation | None observed | Safety | No persistent DB risk introduced by R1 |

## 25. Exact R3B-R2 Scope

R3B-R2 should be limited to a true first-run Browser retry using the recommended isolated actual frontend process:

1. Re-read and verify the Disposable identity and Fresh counts.
2. Start one isolated Backend against that Disposable only.
3. Start one actual frontend process with command-local public API values targeting the isolated Backend.
4. Open the real Browser at the isolated frontend `/ar/setup`.
5. Capture `GET /api/v1/setup/status` from Browser to the isolated Backend.
6. If the form renders, submit approved test values once and capture `POST /api/v1/setup/bootstrap`.
7. Verify the first-run transaction, master-data bootstrap, READY state, login, and idempotency/conflict behavior according to the R3B contract.
8. Reconcile the Disposable DB and prove Official DB unchanged.
9. Stop and report; do not start Phase 03B automatically.

No source patch, Product formula change, migration, seed, Official DB write, or Diamond work belongs in R3B-R2.

## 26. Files Changed

Intentional R3B-R1 output:

```text
docs/DARFUS_PHASE_03A_R3B_R1_DISPOSABLE_FRONTEND_RUNTIME_ISOLATION_FORENSIC_REPORT.md
```

No source, test, migration, `.env`, `next.config.*`, `proxy.ts`, `next-env.d.ts`, or `AGENTS.md` file was changed. Existing worktree changes and previous untracked reports were preserved and not claimed as R3B-R1 changes.

## 27. DB Mutation Proof

```text
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
DISPOSABLE_DB_WRITES_THIS_CONTROL = 0
SETUP_BOOTSTRAP_POST_THIS_CONTROL = 0
MIGRATIONS_APPLIED_THIS_CONTROL = 0
```

The Disposable’s earlier R3B migration application belongs to the prior control and was not repeated. R3B-R1 performed read-only SQL only.

## 28. Git Safety Proof

Read-only Git inspection used an explicit `safe.directory` command override because the repository ownership differs from the current Windows identity; no global Git configuration was changed.

```text
CURRENT_BRANCH = main
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
WORKTREE_DIRTY = YES (pre-existing)
TRACKED_MODIFIED_COUNT = 88 (pre-existing at inspection)
UNTRACKED_COUNT = 732 (pre-existing at inspection)
STASH_COUNT = 11
```

No `reset`, `restore`, `clean`, `stash`, `checkout`, `add`, `commit`, or `push` was run. The newly created R3B-R1 report is the only intentional file output of this control.

## 29. Gate

The following are proven:

| Criterion | Result |
|---|---|
| Official DB protection | PASS |
| Disposable freshness decision | PASS |
| API client compiled-base behavior | PASS |
| Previous proxy behavior | PARTIALLY_PROVEN / unsafe for acceptance |
| SetupPage possible stuck paths | PASS |
| Exact immediate Browser blocker | NOT PROVEN |
| Minimum-safe retry topology | DEFINED |
| Source/test/migration/build changes | NONE |

Because the exact Browser blocker is not proven and the R3B-R1 contract explicitly forbids guessing, the gate is:

```text
GATE = BLOCKED_PHASE_03A_R3B_R1_FRONTEND_RUNTIME_ROOT_CAUSE_UNPROVEN
```

This does not close R3B or Phase 03A.

## 30. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3B-R1-DISPOSABLE-FRONTEND-RUNTIME-ISOLATION-FORENSIC
PHASE = 03A-R3B-R1
MODE = READ_ONLY_RUNTIME_FORENSIC_DESIGN_ONLY

OFFICIAL_DB = darfus_erp
DISPOSABLE_DB = darfus_first_run_r3b_20260818_104917
PREVIOUS_DISPOSABLE_FRONTEND = http://localhost:3001
PREVIOUS_DISPOSABLE_BACKEND = http://localhost:8121
DISPOSABLE_DB_INITIAL_SETUP_STATE = SETUP_REQUIRED

BROWSER_PREVIOUS_VISIBLE_STATE = Preparing setup…
BROWSER_SETUP_STATUS_REQUEST_PREVIOUSLY_OBSERVED = NO
BROWSER_SETUP_POST_PREVIOUSLY_OBSERVED = NO

SETUPPAGE_CLIENT_EXECUTION_STATE = NOT_PROVEN; CLIENT_COMPONENT_AND_USEEFFECT_SOURCE_TRACE_COMPLETE; NO_FATAL_CONSOLE_EXCEPTION_OBSERVED
BROWSER_API_BASE_RESOLUTION = PROVEN_MAIN_BUNDLE_ABSOLUTE_HTTP_LOCALHOST_8000_API_V1
NEXT_CLIENT_PUBLIC_ENV_BEHAVIOR = NEXT_PUBLIC_* COMPILE-TIME EMBEDDED IN BROWSER BUNDLE; NOT RETARGETED BY PROXY ORIGIN
PREVIOUS_PROXY_ROUTING = HTML/ASSETS_TO_3000; RELATIVE_API_V1_TO_8121; NO_COMPLETE_NEXT_RSC/WEBSOCKET/FORWARDED-ORIGIN CONTRACT; ABSOLUTE_8000_BUNDLE_CALLS_CAN_BYPASS_PROXY
HMR_RUNTIME_STATE = HMR_HTTP_REQUEST_OBSERVED; WEBSOCKET_UPGRADE_NOT_SUPPORTED; NO_RELOAD_LOOP_PROVEN; NOT_PRIMARY_BLOCKER_PROVEN
SAFE_BROWSER_READ_ONLY_SETUP_STATUS_FETCH = NOT_RUN; AVAILABLE_BROWSER_EVALUATION_CONTEXT_LACKED_FETCH/PERFORMANCE; DIRECT_8121_READ_ONLY_GET_ALREADY_PROVEN
BROWSER_PREPARING_SETUP_ROOT_CAUSE = IMMEDIATE_BROWSER_BLOCKER_UNPROVEN; PROVEN_MAIN_BUNDLE_API_BASE_MISMATCH_AND_INCOMPLETE_PROXY_TOPOLOGY
ROOT_CAUSE_CLASS = I_UNPROVEN_WITH_PROVEN_A_CLIENT_BUNDLE_API_BASE_MISMATCH_AND_B_NEXT_DEV_PROXY_ORIGIN_RUNTIME_INCOMPATIBILITY

PRODUCT_FIRST_RUN_INTEGRATION_GAP = NO
PRODUCT_SOURCE_PATCH_REQUIRED = NO
ACCEPTANCE_RUNTIME_CHANGE_REQUIRED = YES
EXISTING_DISPOSABLE_DB_SAFE_TO_REUSE = YES
DISPOSABLE_BACKEND_8121_CONFIGURATION_WAS_CORRECT = YES
RECOMMENDED_RETRY_TOPOLOGY = SEPARATE_ACTUAL_NEXT_FRONTEND_PROCESS_WITH_COMMAND_LOCAL_NEXT_PUBLIC_API_URL_TO_8121_AND_NEXT_PUBLIC_DATA_SOURCE_API; NO_PROXY_REUSE

OFFICIAL_DB_WRITES_THIS_CONTROL = 0
DISPOSABLE_DB_WRITES_THIS_CONTROL = 0
SOURCE_CODE_CHANGED = NO
TEST_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO

GATE = BLOCKED_PHASE_03A_R3B_R1_FRONTEND_RUNTIME_ROOT_CAUSE_UNPROVEN
NEXT_RECOMMENDED_STEP = R3B_R2_TRUE_FIRST_RUN_BROWSER_RETRY_USING_CORRECTED_ISOLATED_FRONTEND_RUNTIME_AFTER_OWNER_REVIEW
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No retry, runtime restart, setup POST, source patch, database cleanup, Official DB mutation, or Phase 03B was started automatically.
