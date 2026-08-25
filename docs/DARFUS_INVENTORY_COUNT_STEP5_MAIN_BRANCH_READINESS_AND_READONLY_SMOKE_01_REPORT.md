# DARFUS ERP — Inventory Count Step 5 Main Branch Readiness + Final Read-Only Smoke

Control ID: `DARFUS-INVENTORY-COUNT-STEP5-MAIN-BRANCH-READINESS-AND-READONLY-SMOKE-01`

## 1. Executive Summary

تم تنفيذ فحص Main قراءة فقط على `localhost:3000` و`localhost:8000` بعد قراءة الـPrompt كاملًا. السبب السابق لم يكن عيبًا في المنتج: جلسة المستخدم لم تكن تحتوي على Branch مختار. تم اختيار `Branch-1` من الـBranch selector الرسمي، فانتقلت الواجهة من `Branch readiness required` إلى شاشة Stock Audit الجاهزة.

نجح فحص AR وEN، وظهرت السجلات المغلقة نفسها بالقيم نفسها. لم يتم إنشاء أو بدء أو ملاحظة أو إكمال أو إغلاق أي Count. لم يتم تعديل الكود أو قاعدة البيانات. قبل وبعد الفحص الرسمي بقيت أعداد الجداول: `6 / 33 / 18 / 62 / 25 / 65` دون Delta.

## 2. Master Plan Position

- `MASTER_STAGE = INVENTORY_COUNT_STABILIZATION`.
- `MASTER_STEP = 5_OF_8`.
- Steps 1–4: CLOSED.
- Step 5 semantic fix, disposable AR/EN proof, parity, and Clone integrity: already PASS.
- This control: Main Branch readiness and final read-only smoke.
- No Clone rerun and no new Count.

## 3. Owner Attribution Resolution

Recorded exactly as instructed:

| Record | Attribution | System unauthorized mutation |
|---|---|---|
| `COUNT-20260825172650-c010b637` | `OWNER_MANUAL_COUNT` | `NO` |

`UNEXPECTED_MAIN_DB_DELTA = RESOLVED`.
`P1_DB_STATE_GAP = CLOSED`.
No further attribution forensic work was performed.

## 4. Runtime Parity

| Surface | Result | Evidence |
|---|---|---|
| `/ar/inventory/stock-audit` | HTTP 200 | Main frontend response length 63,191 bytes |
| `/en/inventory/stock-audit` | HTTP 200 | Main frontend response length 66,095 bytes |
| `/api/v1/health` | HTTP 200 | Main backend |
| `/api/v1/health/db` | HTTP 200 | Main database health |
| `/api/v1/health/redis` | HTTP 200 | Main Redis health |
| Main runtime | Current source served | Existing Next process with HMR; source mtime `2026-08-25 17:43:30Z`, `.next` mtime `17:45:26Z`, route entry mtime `17:45:03Z` |

No `ChunkLoadError`, SSR chunk blocker, or route load failure was observed. The existing Main Next runtime was used; no second frontend was started.

`MAIN_FRONTEND_RUNTIME_PARITY = PASS`.

## 5. Branch Context Source Map

| Concern | Source | Function / behavior | Finding |
|---|---|---|---|
| Branch authority | `contexts/branch-context.tsx` | `BranchContextProvider`, `resolveBranchContext` | Branch is READY only after the active server branch list validates the selected ID. |
| Branch selection | `components/layout/branch-switcher.tsx` | `selectBranch` via supported selector | User can select only an active branch; fixed branch accounts are restricted. |
| Branch persistence | `contexts/auth-context.tsx` | `switchBranch` | Selected branch is session/context state; no business transaction is created. |
| Branch state resolution | `lib/branch-context-state.ts` | `resolveBranchContext` | Multiple active branches with no selected ID produce `SELECTION_REQUIRED`; no unsafe first-branch fallback. |
| API Branch header | `lib/api/client.ts` | `resolvedBranchIdForRequest`, `apiClient` | `X-Branch-ID` is injected only from explicit request context or the validated branch accessor. |
| API Company header | `lib/api/client.ts` | `resolvedCompanyIdForRequest`, `apiClient` | `X-Company-ID` is injected from the validated Company context. |
| Readiness guard | `components/branch/branch-context-gate.tsx` | `BranchContextGate` | Operational pages remain fail-closed until `isReady`. |
| Stock Audit consumer | `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx` | `useBranchContext`, GET readers | Locations and Count reads are branch-scoped and do not mount before readiness. |

`BRANCH_CONTEXT_AUTHORITY = validated active server branch list + selected BranchContext READY state`.

`STOCK_AUDIT_READINESS_REQUIREMENT = BranchContext.isReady; API mode requires status READY and a concrete validated branchId`.

No fallback, hardcoded branch, company fallback, or fail-closed weakening was found.

## 6. Auth / Company / Branch Forensic

### Initial state

After normal authenticated session restore, the Main page showed:

`Branch readiness required` / `Select an active Branch to continue`.

The header displayed the branch selector with no selected branch. The supported selector listed `Branch-1` and `Branch-2`.

### Context resolution

`Branch-1` was selected once through the existing UI selector. This is session/context state, not a business mutation. After the state committed:

- Header showed `Current branch: Branch-1` / `الفرع الحالي: Branch-1`.
- Stock Audit route rendered normally.
- Protected GET requests returned 200/304.
- Main backend logs recorded GET `/branches`, GET `/settings`, GET `/inventory/locations`, and GET Count list routes.
- Source mapping proves `X-Company-ID` and `X-Branch-ID` are produced by the canonical API client from validated context.

### Auth classification

An expired-session GET 401 and technical refresh POST occurred during session recovery before the read-only route proof. Login/session recovery then succeeded. This was not a business mutation and did not create or alter business records.

```text
AUTH_CONTEXT = PASS
COMPANY_CONTEXT = PASS
ACTIVE_BRANCH_LIST = PASS
BRANCH_CONTEXT = PASS
ROOT_CAUSE_CLASS = BR-01
CLASSIFICATION = EXPECTED_CONTEXT_REQUIREMENT
```

## 7. Root Cause

`BR-01 = no branch selected in frontend session/context`.

Evidence:

1. The branch selector listed active Branch options.
2. No branch was shown in the header before selection.
3. `BranchContextGate` correctly blocked operational work.
4. Selecting `Branch-1` through the supported selector changed the context to READY.
5. The same Main routes then loaded successfully without source or backend changes.

`PRODUCT_DEFECT = NO`.
`SOURCE_FILES_CHANGED = 0`.
`MINIMUM_SAFE_FIX = none; supported context selection was sufficient`.

## 8. Main AR Read-Only Smoke

Route: `http://localhost:3000/ar/inventory/stock-audit`.

After selecting Branch-1:

- Route loaded.
- Branch context showed `Branch-1`.
- Start form rendered with DB location selector `مخزن-7 (HOUSE-7)`.
- No active Count existed for Branch-1, so the conditional Active Counts card correctly had no rows. The two official in-progress rows belong to another branch (`BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`) and were correctly excluded by branch scope.
- Closed Count history rendered.
- Known records and totals rendered, including `COUNT-20260825172650-c010b637` with Expected=9, Counted=9, Missing=0, Unexpected=0, Variance=0.
- Correct Arabic in-progress/final semantic strings are present in the source and the closed history rendered correctly.
- No mutation control was clicked.

`OFFICIAL_AR_READ_ONLY = PASS`.
`AR_MAIN_MUTATION_REQUESTS = 0`.

## 9. Main EN Read-Only Smoke

Route: `http://localhost:3000/en/inventory/stock-audit`.

After the same selected Branch-1 context:

- Route loaded.
- Branch context showed `Current branch: Branch-1`.
- Location selector and read-only closed history rendered.
- No active Count existed for this branch, correctly producing no active rows.
- The same three closed records rendered with the same totals as AR.
- English labels rendered: Expected, Counted, Missing, Unexpected, Variance, Closed.
- No mutation control was clicked.

`OFFICIAL_EN_READ_ONLY = PASS`.
`EN_MAIN_MUTATION_REQUESTS = 0`.

## 10. AR / EN Main Parity

| Evidence | AR | EN |
|---|---|---|
| Selected branch | Branch-1 | Branch-1 |
| Active Count rows for selected branch | 0 | 0 |
| Closed IDs | `COUNT-20260825172650-c010b637`, `COUNT-20260825154754-b103b823`, `COUNT-20260823075745-dde82bfe` | Same |
| Expected totals | 9, 9, 1 | 9, 9, 1 |
| Counted totals | 9, 9, 1 | 9, 9, 1 |
| Missing / Unexpected / Variance | 0 / 0 / 0 for each | Same |
| Lifecycle | Closed | Closed |
| Difference | Arabic labels | English labels |

`OFFICIAL_AR_EN_READ_ONLY_PARITY = PASS`.

## 11. Console / Network

### Console

Main browser logs contained only React DevTools informational output and Next HMR informational output. No application exception or ChunkLoadError was present.

```text
AR_CONSOLE_BLOCKERS = 0
EN_CONSOLE_BLOCKERS = 0
```

### Network / backend evidence

Main backend logs for the controlled route proof recorded only protected GETs for branches, settings, locations, and Count lists. Responses were 200 or 304. No Count create/start/observe/complete/close endpoint was called.

Expected technical/non-business entries:

- One pre-login expired-session GET 401 followed by technical auth refresh.
- Unrelated upload icon GET 404s.
- SSE GET stream connect/disconnect.

No business mutation endpoint was called.

`NETWORK_5XX_BLOCKERS = 0`.
`OFFICIAL_BROWSER_MUTATION_COUNT = 0`.

## 12. Main DB No-Write Proof

Official DB identity and controlled interval snapshots:

| Snapshot | Database | stock_audits | stock_audit_items | assets | inventory_asset_movements | journal_entries | asset_events |
|---|---|---:|---:|---:|---:|---:|---:|
| Before Main smoke | `darfus_erp` | 6 | 33 | 18 | 62 | 25 | 65 |
| After Main smoke | `darfus_erp` | 6 | 33 | 18 | 62 | 25 | 65 |
| Delta | — | 0 | 0 | 0 | 0 | 0 | 0 |

`CONTROL_ISSUED_MUTATION = NO`.
`OWNER_CONCURRENT_ACTION = NONE OBSERVED DURING CONTROLLED INTERVAL`.
`CONTROL_ISSUED_BUSINESS_MUTATION = NO`.
`MAIN_BUSINESS_WRITE_DELTA = 0`.

The previously recorded Owner-created Count is retained as `OWNER_MANUAL_COUNT`; it was not reopened or modified.

## 13. Focused Tests

Command:

```text
node --test tests/inventory-count-active-session-discovery.test.cjs tests/inventory-count-step5-inprogress-ux.test.cjs
```

Result: `13 passed, 0 failed`.

No redundant tests were added in this control and no source files were changed.

`FOCUSED_TESTS = PASS`.
`FOCUSED_TEST_COUNT = 13`.

## 14. Typecheck

```text
npm run typecheck → PASS
```

## 15. Remaining Risks

| ID | Risk | Severity | Status |
|---|---|---|---|
| BR-01 | A multi-branch session with no selected Branch is intentionally blocked until the user selects one. | P2 operational context | Resolved for this session through supported selector; fail-closed behavior retained. |
| BR-02 | None proven. | — | Rejected by source map and successful post-selection GET reads. |
| BR-03 | None proven. | — | Selected Branch persisted across AR→EN navigation in the same session. |
| BR-05 | None proven for Branch-1. | — | Branch-1 was active and accepted. |
| UX-ICON-404 | Unrelated upload icon GET 404 appears in logs. | P3 | Non-blocking and outside Step 5 scope. |

No P0 or blocking P1 defect remains in this control.

## 16. Gate

All required Step 5 Main closure conditions passed:

```text
OWNER_MANUAL_COUNT_ATTRIBUTION = RECORDED
SYSTEM_UNAUTHORIZED_MUTATION = NO
MAIN_FRONTEND_RUNTIME_PARITY = PASS
AUTH_CONTEXT = PASS
COMPANY_CONTEXT = PASS
ACTIVE_BRANCH_LIST = PASS
BRANCH_CONTEXT = PASS
OFFICIAL_AR_READ_ONLY = PASS
OFFICIAL_EN_READ_ONLY = PASS
OFFICIAL_AR_EN_READ_ONLY_PARITY = PASS
AR_MAIN_MUTATION_REQUESTS = 0
EN_MAIN_MUTATION_REQUESTS = 0
OFFICIAL_BROWSER_MUTATION_COUNT = 0
CONTROL_ISSUED_BUSINESS_MUTATION = NO
AR_CONSOLE_BLOCKERS = 0
EN_CONSOLE_BLOCKERS = 0
NETWORK_5XX_BLOCKERS = 0
FOCUSED_TESTS = PASS
TYPECHECK = PASS
P0_COUNT = 0
P1_BLOCKING_COUNT = 0
GATE = PASS_INVENTORY_COUNT_STEP5_FINAL_CLOSURE
```

## 17. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-STEP5-MAIN-BRANCH-READINESS-AND-READONLY-SMOKE-01
MASTER_STAGE = INVENTORY_COUNT_STABILIZATION
MASTER_STEP = 5_OF_8
OFFICIAL_DATABASE = darfus_erp
OWNER_MANUAL_COUNT_ID = COUNT-20260825172650-c010b637
OWNER_MANUAL_COUNT_ATTRIBUTION = CONFIRMED
SYSTEM_UNAUTHORIZED_MUTATION = NO
MAIN_FRONTEND_RUNTIME_PARITY = PASS
BRANCH_CONTEXT_AUTHORITY = validated active server branch list + selected BranchContext READY state
STOCK_AUDIT_READINESS_REQUIREMENT = BranchContext.isReady; API mode requires READY and concrete validated branchId
ROOT_CAUSE_CLASS = BR-01
ROOT_CAUSE = EXPECTED_CONTEXT_NOT_SELECTED
PRODUCT_DEFECT = NO
SOURCE_FILES_CHANGED = 0
AUTH_CONTEXT = PASS
COMPANY_CONTEXT = PASS
ACTIVE_BRANCH_LIST = PASS
BRANCH_CONTEXT = PASS
OFFICIAL_AR_READ_ONLY = PASS
OFFICIAL_EN_READ_ONLY = PASS
OFFICIAL_AR_EN_READ_ONLY_PARITY = PASS
AR_MAIN_MUTATION_REQUESTS = 0
EN_MAIN_MUTATION_REQUESTS = 0
OFFICIAL_BROWSER_MUTATION_COUNT = 0
CONTROL_ISSUED_BUSINESS_MUTATION = NO
MAIN_COUNT_DELTA = 0
MAIN_ITEM_DELTA = 0
MAIN_ASSET_DELTA = 0
MAIN_MOVEMENT_DELTA = 0
MAIN_ACCOUNTING_DELTA = 0
MAIN_BUSINESS_WRITE_DELTA = 0
AR_CONSOLE_BLOCKERS = 0
EN_CONSOLE_BLOCKERS = 0
NETWORK_5XX_BLOCKERS = 0
FOCUSED_TESTS = PASS
FOCUSED_TEST_COUNT = 13
TYPECHECK = PASS
STEP_5_FINAL_STATUS = CLOSED
P0_COUNT = 0
P1_BLOCKING_COUNT = 0
P2_COUNT = 1
P3_COUNT = 1
GATE = PASS_INVENTORY_COUNT_STEP5_FINAL_CLOSURE
NEXT_MASTER_STEP = 6_OF_8_ONLY_IF_PASS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 18. Stop

Step 6 was not started. No new Count, no cancel, no abandon, no Client Requirements work, no migration, no seed, no production action, and no official business mutation occurred. Await Owner review before any next batch.
