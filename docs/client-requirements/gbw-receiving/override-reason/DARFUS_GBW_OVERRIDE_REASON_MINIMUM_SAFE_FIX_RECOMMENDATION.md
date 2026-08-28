# Minimum-safe fix recommendation — not executed

1. Add one GBW-only reason state/control adjacent to the purchase-rate override input, shown when the existing contract indicates manual override is available and the entered rate is non-equal to the server reference.
2. Map the value to the already accepted server key `piece.purchaseRateOverrideReason` (or the exact shared contract key chosen by Owner), without creating a second authority.
3. Keep server permission, Decimal comparison, reference resolution, audit, and transaction behavior unchanged.
4. Keep the field absent/optional for equal-rate usage; let the server remain authoritative.
5. Replace raw backend English display with existing localized safe error mapping, separately tracked.

Required approval: a named implementation batch and Owner authorization. No source or DB change was made by this forensic control.

