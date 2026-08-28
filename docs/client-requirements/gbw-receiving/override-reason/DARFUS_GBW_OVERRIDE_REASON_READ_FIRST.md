# GBW purchase gold-rate override reason — read-first record

Control: `DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-READ-ONLY-FORENSIC-01`  
Issue: `DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001`  
Mode: `READ_ONLY_FORENSIC_NO_FIX`

## Scope and safety

- Read: the supplied control, `AGENTS.md`, current handoff, six DARFUS registers, current GBW UI/route/services, focused tests, runtime logs, and read-only official DB evidence.
- No source, test, migration, configuration, or business-data edit was performed.
- No Receive was sent. No POST was issued by this control.
- Official DB identity was read as `darfus_erp`; no DB mutation was executed.
- Historical reports are supporting evidence only.

## Questions answered

| Question | Evidence-backed answer |
|---|---|
| Was code modified? | No. Product source/test files changed by this control: 0. |
| Was a Receive executed? | No. The only relevant runtime POSTs are historical observations in backend logs; this control sent none. |
| Was the DB touched? | Read-only SELECTs only; current database was `darfus_erp`. |
| Actual reference rate | For the current UI-selected 21K and AED, the latest valid Gold Center quote contains `475.36260000`; no active approved `gold_prices` row was present. |
| Equal rate | Exact Decimal equality: no override and no reason required. |
| Lower rate | Any non-equal positive/non-negative rate is an override; permission and a nonblank reason are required. Missing reason returns 422. |
| Higher rate | Same non-equal override path; no asymmetric tolerance was found. |
| When is rate an override? | When requested Decimal is not exactly equal to the resolved reference Decimal. |
| When is reason required? | After non-equality is established and override permission is available; missing/blank reason is rejected. |
| Does Frontend have Reason? | No state, field, or payload mapping exists in the current GBW page. |
| Hidden or absent? | Absent from the component/state/payload, not merely CSS-hidden. |
| Does payload send Reason? | No. None of the three accepted reason paths is constructed by the UI. |
| Backend condition | `!requestedDecimal.eq(new Decimal(String(referenceRate)))`, then permission, then `piece.purchaseRateOverrideReason ?? piece.goldValuation?.purchaseRateOverrideReason ?? body.purchaseRateOverrideReason`. |
| Root cause | Proven frontend/backend workflow contract mismatch: editable rate without a reason capture/mapping. |
| Backend validation bug? | Not proven; the backend validation is internally consistent and fail-closed. |
| Classification | `PRODUCT_DEFECT` at the GBW UI contract boundary; not a provider or DB defect. |
| Minimum safe fix | Owner-authorized GBW UI-only reason capture and exact mapping to the existing server contract, with localized user-safe error handling; no formula or DB change. |

## Gate

Root cause is proven with source, runtime DOM, logs, and DB reference evidence. Exact raw historical request body was not retained by the runtime/log stream, so the strict raw-payload evidence gate is blocked rather than inferred.

`GATE = BLOCKED_DARFUS_GBW_OVERRIDE_REASON_READ_ONLY_FORENSIC_EVIDENCE_INCOMPLETE`

