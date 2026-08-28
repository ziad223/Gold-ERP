# UX-8 Gold Center Business Contract Freeze

The following are frozen for this control:

- `GOLD_RATE_AUTHORITY_CHANGED = NO`
- `GOLD_PROVIDER_AUTHORITY_CHANGED = NO`
- `GOLD_NUMERIC_SEMANTICS_CHANGED = NO`
- `GOLD_FRESHNESS_SEMANTICS_CHANGED = NO`
- `DOWNSTREAM_GOLD_CALCULATION_CHANGED = NO`
- `HISTORICAL_GOLD_SNAPSHOT_CHANGED = NO`
- `POS_GBW_WEIGHT_BASIS_CHANGED = NO` (`netGoldWeight * validatedMakingChargePerGram` remains the accepted rule)
- `GBW_OVERRIDE_RULE_CHANGED = NO` (equal reference rate needs no reason; different rate requires permission and non-empty reason)
- `TAX_LOGIC_CHANGED = NO`
- `ACCOUNTING_LOGIC_CHANGED = NO`
- `PERMISSIONS_CHANGED = NO`
- `SECURITY_AUTHORITY_CHANGED = NO`
- `API_CHANGED = NO`
- `DATABASE_CHANGED = NO`
- `DB_SCHEMA_CHANGED = NO`
- `MIGRATIONS = 0`

UX-8 may change only presentation, layout, hierarchy, responsive wrappers, semantic visual treatment, bidi-safe display styling, and existing loading/error/empty presentation. It must not recalculate, normalize, round, activate, refresh-persist, or write any market value.
