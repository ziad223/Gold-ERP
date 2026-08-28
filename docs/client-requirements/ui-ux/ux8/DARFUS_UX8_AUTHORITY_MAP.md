# UX-8 Gold Center Authority Map

| Concern | Current authority | Evidence | UX-8 treatment |
|---|---|---|---|
| Provider selection/configuration | server settings + provider registry; `GOLDAPI_IO` is current runtime provider | `backend/src/routes/gold-pricing-policy.routes.js`; `gold-market-settings.service.js`; `gold-market-provider-registry.service.js` | display only |
| Rate source | canonical market settings/latest quote returned by `/gold-pricing/market/settings` | `GoldMarketAdminPanels.tsx` `loadState`; live health response | display only |
| Currency | server `marketCurrency`, current runtime `AED` | `MarketState.settings.marketCurrency` | display only |
| Purity/karat | server quote fields and `KARATS = [18,21,22,24]` in panel; profile-specific consumers remain authoritative | panel table; gold services | display only |
| BID/SPOT/ASK | quote fields and policy `baseQuoteType`; panel labels keep the distinction | panel `marketRows`, table and policy form | no relabeling or recomputation |
| Freshness | server health/status plus quote timestamp; `ageText` is display age only | `gold-market-health-endpoint.service.js`; panel status | visual emphasis only |
| Snapshot/history | server latest quote and paginated history | `/market/settings`, `/market/quotes/history` | read-only rendering only |
| Override/reason | existing GBW receiving authority, not owned by UX-8 | frozen GBW controls and tests | untouched |
| Company/branch | authenticated server context; no hardcoded context in UI | auth context, route middleware, runtime browser baseline | untouched |
| Permissions | `gold.manage_pricing_policy` controls write surfaces | `usePermissions()` and existing `canManage` branches | guards untouched |
| Audit/accounting/tax/inventory | downstream domain authorities and snapshots | frozen UX-8 contract and current backend boundaries | untouched |

The Gold Center presentation does not become a second rate authority. Business values, raw source codes, timestamps, and permission decisions continue to originate from the existing source/API.
