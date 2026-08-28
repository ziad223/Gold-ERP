# Reference-rate authority

## Source authority order

`backend/src/services/gold-sale-pricing.service.js:624–662` resolves a rate in this order:

1. Current-company approved `GoldPrice`, valid for the current time.
2. Approved global `GoldPrice` row (`company_id IS NULL`), valid for the current time.
3. `goldCenterReferencePriceService.getReferenceSnapshot(companyId, currency)` and the selected karat price.

The GBW receive route calls this resolver at `backend/src/routes/erp.routes.js:8542–8549`.

## Official DB read-only observation

`current_database() = darfus_erp`.

- `gold_prices`: one 18K row was observed, `PENDING`; no executable approved row was found for the current GBW 21K context.
- Latest valid `gold_market_quotes`: currency `AED`, quote timestamp `2026-08-28 09:12:13+00`, received `2026-08-28 09:12:15.297+00`, status `VALID`, quality `OFFICIAL_RESPONSE`.
- Latest observed per-karat rate for selected 21K: `475.36260000`.
- Gold Center settings observed: provider `GOLDAPI_IO`, mode `LIVE_PROVIDER`, currency `AED`, refresh `3500` seconds, stale threshold `4500` seconds, enabled.

No rate, setting, or master-data row was modified.

