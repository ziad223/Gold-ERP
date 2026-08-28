# Frontend state

`Draft.purchaseGoldRateOverrideReason` is initialized empty and lives only in the GBW receiving draft. The Clear action restores `initialDraft`, so the value does not leak between receiving drafts. The value is preserved while the override condition remains active.

`REASON_STATE_SCOPED_TO_RECEIVING_DRAFT = YES`

