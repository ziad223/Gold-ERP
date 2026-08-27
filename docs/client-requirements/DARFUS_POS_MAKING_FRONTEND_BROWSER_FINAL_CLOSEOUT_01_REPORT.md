# DARFUS ERP — POS Making Charge Frontend Browser Final Closeout

ما تم: تم تنفيذ build وrefresh للواجهة الرئيسية المصرّح بهما، مع إثبات أن build الجديد يخدم التصحيح، وأن backend/DB/Redis سليمة. ما مرّ: build، runtime parity، HTTP smoke، focused/regression tests، وtypecheck. ما فشل: Browser Preflight بسبب عطل بيئي متكرر، لذلك لم يتم إنشاء Clone أو fixtures ولم يتم تنفيذ Checkout. الخطر على `darfus_erp`: لا توجد business writes أو financial/inventory delta بهذا الـcontrol. الخطوة التالية: إصلاح/إتاحة قناة Browser Control ثم إعادة هذا الـcloseout فقط.

## Executive Summary

The approved GBW formula correction is present and now served by a fresh production frontend build. The backend proof and disposable checkout proof from the immediately preceding control remain accepted upstream evidence and were not reopened. The required current-control AR/EN real-browser evidence cannot be collected because Browser Preflight failed before isolated setup.

**Gate decision: `BLOCKED_BROWSER_CONTROL_ENVIRONMENT`**

This is not a product formula failure and is not a database failure. It is an acceptance-environment/tooling blocker.

## Scope and authority

- Control: `DARFUS-POS-MAKING-CHARGE-FRONTEND-BROWSER-FINAL-CLOSEOUT-01`
- Formula authority preserved: `GBW Eligible Weight = Asset.netGoldWeight`; making = eligible weight × validated AED/g rate.
- No Gold Center, Tax Engine, accounting, inventory, or Gift Voucher changes.
- No official checkout or official synthetic fixture.

## Fast triage and build

- Corrected source was present in POS page, POS hook, and pricing route.
- Old `.next` build was stale relative to source.
- `npm run build` / `next build` completed with exit code `0`.
- Next.js `16.2.9 (Turbopack)`; TypeScript and `125/125` static pages passed.
- New build: `Y6V_WF-4PV_YuGaSjVsEK`.
- `next-env.d.ts` was not manually edited. The build-generated transition from SHA `7AD303...AAAF240CC` to SHA `7B550D...1E712651` exactly matches the permitted toolchain variant.

Detailed build evidence: [DARFUS_POS_MAKING_FRONTEND_BUILD_REFRESH_PROOF.md](./DARFUS_POS_MAKING_FRONTEND_BUILD_REFRESH_PROOF.md)

## Main runtime parity

- Refreshed frontend PID `26740`, workspace `next start`, start `2026-08-26 19:56:34`.
- `/ar/pos` = `200`.
- `/en/pos` = `200`.
- New build manifest under `/_next/static/Y6V_WF-4PV_YuGaSjVsEK/` = `200`.
- Served POS chunk contains the corrected eligible-weight label and `netGoldWeight` logic.
- Backend health, DB health, and Redis health = `200`.

`FRONTEND_RUNTIME_PARITY = PASS`  
`BACKEND_RUNTIME_PARITY = PASS`  
`MAIN_RUNTIME_CHECK = PASS` (HTTP/runtime level)

## Browser preflight and isolated environment

Browser-control initialization failed with:

```text
failed to write kernel assets: The system cannot find the path specified. (os error 3)
```

This is recorded as `BROWSER_CONTROL_ENVIRONMENT_001 = RECURRENCE`. The required safety rule stopped the flow before Clone creation, fixture mutation, or browser checkout-capable setup.

Detailed evidence: [DARFUS_POS_MAKING_ISOLATED_BROWSER_ENV_PROOF.md](./DARFUS_POS_MAKING_ISOLATED_BROWSER_ENV_PROOF.md)

`BROWSER_PREFLIGHT = BLOCKED_BROWSER_CONTROL_ENVIRONMENT`  
`ISOLATED_DB_IDENTITY_PROVEN = NOT_RUN`  
`ISOLATED_BACKEND_POINTS_TO_CLONE = NOT_RUN`  
`ISOLATED_FRONTEND_POINTS_TO_ISOLATED_BACKEND = NOT_RUN`  
`BROWSER_FIXTURES = NOT_CREATED`

## AR / EN browser and network proof

The direct HTTP GETs and served chunk marker are recorded as supporting evidence only. No claim is made for visual cart totals, console capture, or browser Network capture.

- AR evidence: [DARFUS_POS_MAKING_AR_BROWSER_NETWORK_FINAL.md](./DARFUS_POS_MAKING_AR_BROWSER_NETWORK_FINAL.md)
- EN evidence: [DARFUS_POS_MAKING_EN_BROWSER_NETWORK_FINAL.md](./DARFUS_POS_MAKING_EN_BROWSER_NETWORK_FINAL.md)
- Main HTTP smoke: [DARFUS_POS_MAKING_MAIN_FRONTEND_READONLY_SMOKE.md](./DARFUS_POS_MAKING_MAIN_FRONTEND_READONLY_SMOKE.md)

| Token | Result |
|---|---|
| `AR_BROWSER` | `BLOCKED_BROWSER_CONTROL_ENVIRONMENT` |
| `AR_VISUAL_TOTAL_MAKING_950` | `NOT_PROVEN` |
| `AR_STONE_NET_WEIGHT` | `NOT_PROVEN` |
| `AR_NETWORK` | `NOT_PROVEN` |
| `AR_NETWORK_SERVER_MAKING_950` | `NOT_PROVEN` |
| `AR_CONSOLE_BLOCKERS` | `NOT_OBSERVED` |
| `EN_BROWSER` | `BLOCKED_BROWSER_CONTROL_ENVIRONMENT` |
| `EN_VISUAL_TOTAL_MAKING_950` | `NOT_PROVEN` |
| `EN_STONE_NET_WEIGHT` | `NOT_PROVEN` |
| `EN_NETWORK` | `NOT_PROVEN` |
| `EN_NETWORK_SERVER_MAKING_950` | `NOT_PROVEN` |
| `EN_CONSOLE_BLOCKERS` | `NOT_OBSERVED` |
| `MAIN_AR_READONLY_BROWSER` | `BLOCKED_BROWSER_CONTROL_ENVIRONMENT` |
| `MAIN_EN_READONLY_BROWSER` | `BLOCKED_BROWSER_CONTROL_ENVIRONMENT` |

## Official DB before/after

Official identity before and after: `current_database() = darfus_erp`, user `postgres`.

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| assets | 18 | 18 | 0 |
| asset_pricing_policies | 14 | 14 | 0 |
| invoices | 3 | 3 | 0 |
| invoice_items | 3 | 3 | 0 |
| payments | 3 | 3 | 0 |
| cash_transactions | 11 | 11 | 0 |
| journal_entries | 29 | 29 | 0 |
| journal_lines | 81 | 81 | 0 |
| inventory_asset_movements | 70 | 70 | 0 |
| audit_logs | 187 | 187 | 0 |
| idempotency_requests | 105 | 105 | 0 |

`OFFICIAL_BUSINESS_WRITES_BY_CONTROL = 0`  
`OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0`  
`OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0`

The historical exception remains unchanged and out of scope:

- `JE-1787090870905`
- source `PO-1787090870807`
- total debit `2133.21000000`
- total credit `2133.22000000`
- delta `0.01`

`PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO`  
`ATTRIBUTED_TO_POS_MAKING_FIX = NO`

## Focused/regression verification

The affected test set completed successfully:

- `node --test` over the eight required affected test files: **59 pass, 0 fail**.
- `npm run typecheck`: exit code `0`.
- No test source was changed by this control.

`FOCUSED_TESTS = PASS`  
`AFFECTED_REGRESSION = PASS`  
`TYPECHECK = PASS`

## Strengths

1. The formula correction is now actually present in the served build, not only in source: the served chunk contains the eligible-weight label and `netGoldWeight` branch.
2. The frontend refresh was limited to the exact existing `next start` process; PostgreSQL and backend were not restarted.
3. The official database remained byte-count stable across the control’s before/after read-only checks.
4. The accepted backend/clone financial and inventory proof was preserved rather than needlessly rerun after Browser Preflight failed.

## Weakness / blocker

| ID | Layer | Finding | Classification | Severity | Impact |
|---|---|---|---|---|---|
| BROWSER_CONTROL_ENVIRONMENT_001 | Acceptance environment | Browser-control initialization cannot write its kernel assets | ENVIRONMENT_CONFIG / ACCEPTANCE_GAP | P2 | Prevents required AR/EN visual, console, and Network proof; does not prove a product defect |

No P0/P1 defect was introduced or observed in this control.

## Final tokens

```text
CURRENT_CONTROL = DARFUS-POS-MAKING-CHARGE-FRONTEND-BROWSER-FINAL-CLOSEOUT-01
FAST_TRIAGE_COMPLETE = YES
SOURCE_CORRECTION_PRESENT = YES
CONTROLLED_FRONTEND_BUILD = YES
NEXT_ENV_MANUAL_EDIT = NO
FRONTEND_BUILD = PASS
FRONTEND_RUNTIME_PARITY = PASS
BACKEND_RUNTIME_PARITY = PASS
MAIN_RUNTIME_CHECK = PASS
BROWSER_PREFLIGHT = BLOCKED_BROWSER_CONTROL_ENVIRONMENT
ISOLATED_DB_IDENTITY_PROVEN = NOT_RUN
ISOLATED_BACKEND_POINTS_TO_CLONE = NOT_RUN
ISOLATED_FRONTEND_POINTS_TO_ISOLATED_BACKEND = NOT_RUN
BROWSER_FIXTURES = NOT_CREATED
AR_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT
AR_VISUAL_TOTAL_MAKING_950 = NOT_PROVEN
AR_STONE_NET_WEIGHT = NOT_PROVEN
AR_NETWORK = NOT_PROVEN
AR_NETWORK_SERVER_MAKING_950 = NOT_PROVEN
AR_CONSOLE_BLOCKERS = NOT_OBSERVED
EN_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT
EN_VISUAL_TOTAL_MAKING_950 = NOT_PROVEN
EN_STONE_NET_WEIGHT = NOT_PROVEN
EN_NETWORK = NOT_PROVEN
EN_NETWORK_SERVER_MAKING_950 = NOT_PROVEN
EN_CONSOLE_BLOCKERS = NOT_OBSERVED
MAIN_AR_READONLY_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT
MAIN_EN_READONLY_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT
FOCUSED_TESTS = PASS (59/59)
AFFECTED_REGRESSION = PASS (59/59)
TYPECHECK = PASS
OFFICIAL_DB = darfus_erp
OFFICIAL_BUSINESS_WRITES_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO
ATTRIBUTED_TO_POS_MAKING_FIX = NO
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 1
P3 = 0
POS_MAKING_CHARGE_FORMULA = CORRECTED_SOURCE_AND_SERVED_BUILD; BROWSER_ACCEPTANCE_PENDING
GATE = BLOCKED_BROWSER_CONTROL_ENVIRONMENT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next step

Make the approved Browser Control channel operational, then rerun only the blocked AR/EN browser and Network evidence against an isolated environment. Do not perform official checkout, do not repair the historical `0.01` journal, and do not start Gift Voucher work automatically.

STOP.

