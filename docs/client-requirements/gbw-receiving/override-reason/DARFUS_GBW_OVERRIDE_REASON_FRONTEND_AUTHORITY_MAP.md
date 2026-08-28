# GBW frontend authority map

Source: `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx`.

| Concern | Current source evidence | Finding |
|---|---|---|
| Purchase rate state | `Draft` contains `purchaseGoldRate` at line 40; `initialDraft` initializes it at line 47. | Editable rate exists. |
| Rate input | Section 3 renders `Global Gold Rate At Purchase / g` at line 243. | User can enter a manual rate. |
| Reason state | No `overrideReason`, `purchaseRateOverrideReason`, or equivalent state/field in the page. | Missing, not hidden. |
| Preview payload | `itemPayload` sends `purchaseGoldRate` and `currentGoldRate` at lines 106–107. | Preview rate is sent, reason is not. |
| Shared preview | `receiveItem` sends nested `goldValuation.purchaseGoldRate` at lines 150–164; shared preview is POSTed at lines 174–175. | Shared preview can carry a rate but no reason. |
| Final payload | `submit()` creates a new `piece` at lines 202–213 and sends `/purchase-orders/receive`. | Final payload carries nested rate only. |
| Error display | `catch` assigns `caught?.message` at lines 140 and 221. | Raw backend English may appear in Arabic; separate P2 UX/observability issue. |
| Contract hint | Contract type has `settings.manualOverride.reasonRequired` at line 31, but no corresponding UI control is rendered. | Backend contract advertises the requirement; UI does not consume it. |

Conclusion: frontend is not an authority for approval; it currently lacks the required reason input and transport mapping.

