# Root cause classification

## Proven finding

`FRONTEND_MISSING_OVERRIDE_REASON_FIELD`

The GBW page exposes `purchaseGoldRate` and includes it in both preview/receive construction, but has no reason state or input and never sends any of the three backend-supported reason keys. The backend correctly classifies every non-equal Decimal rate as an override and requires permission plus a nonblank reason. Historical logs show repeated 422 failures with the exact reason-required message.

## Classification

| Layer | Expected | Actual | Classification | Confidence |
|---|---|---|---|---|
| UI | Manual rate path supplies override evidence | Rate input exists; reason control/mapping absent | PRODUCT_DEFECT / ACCEPTANCE_GAP | High |
| Backend | Non-equal rate is governed | Exact Decimal comparison, permission, reason validation | NO_ISSUE | High |
| Contract | UI and server agree on accepted keys | Server has accepted keys; UI sends none | CONTRACT_MISMATCH | High |
| Provider | Reference is canonical and available | Gold Center quote valid; 21K rate observed | NO_ISSUE for this issue | High |
| DB | No persistence on rejection | No new audit override rows; current counts read-only | NO_ISSUE for this issue | Medium |

## Separate observation

Raw backend English errors are surfaced through the frontend catch path. Register this as `DARFUS-GBW-RECEIVING-I18N-RAW-ERROR-001`, without widening this control into an implementation.

