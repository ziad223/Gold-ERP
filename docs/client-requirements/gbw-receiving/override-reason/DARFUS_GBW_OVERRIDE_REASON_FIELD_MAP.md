# GBW override-reason field map

| Business field | Frontend key/state | Backend accepted key | Persistence/audit target | Status |
|---|---|---|---|---|
| Purchase gold rate | `draft.purchaseGoldRate` | `piece.goldValuation.purchaseGoldRate` / `piece.purchaseGoldRate` | Approved rate enters purchase snapshot; source is recorded. | Present and mapped |
| Override reason | None found | `piece.purchaseRateOverrideReason`, `piece.goldValuation.purchaseRateOverrideReason`, or `body.purchaseRateOverrideReason` | Audit after/before evidence and `operatorReason`; model columns `override_reason` exist for legacy entities. | Missing in UI/payload |
| Reference rate | Server-resolved only | `referenceRate` internal | Gold Center/approved GoldPrice authority | Server-owned |
| Permission | UI contract reports `manualOverride.available`; server checks `inventory.adjust` | Server permission service | Audit required permission | Server-owned |
| Comparison | None in UI | Decimal exact equality | N/A | Server-owned |
| Error | Raw `caught.message` | Stable validation message | No business row created on rejection | Localization gap in UI |

No database schema change is required to represent the server-side evidence; this control does not propose executing any change.

