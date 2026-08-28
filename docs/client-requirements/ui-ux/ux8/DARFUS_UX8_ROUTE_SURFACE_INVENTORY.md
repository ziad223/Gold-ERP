# UX-8 Gold Center Route / Surface Inventory

Control: `DARFUS-UIUX-UX8-GOLD-CENTER-IMPLEMENTATION-WITH-ROLLBACK-01`

| Surface | Route/source | Read authority | Write-capable controls | UX-8 classification |
|---|---|---|---|---|
| Gold Center overview + live panel | `/[locale]/gold-center`; `features/gold-center/components/GoldMarketAdminPanels.tsx` (`section=overview`) | `/gold-pricing/market/settings` and current latest quote | refresh GET; settings PUT; test-connection POST; policy POST; existing Gold Center fixing/rate controls on the page | B/C: presentation changes only; controls and handlers frozen |
| Live prices | `/[locale]/gold-center/live-prices` (`section=live`) | same market settings/latest quote authority | refresh GET; settings/test controls remain permission guarded | B/C |
| Price history | `/[locale]/gold-center/price-history` (`section=history`) | `/gold-pricing/market/quotes/history` | paginated GET | A/B |
| Pricing rules | `/[locale]/gold-center/pricing-rules` (`section=rules`) | `/gold-pricing/policies/history` plus current settings | create policy remains `gold.manage_pricing_policy` guarded | C: no business behavior change |
| Market data settings | `/[locale]/gold-center/settings/market-data` (`section=settings`) | `/gold-pricing/market/settings` and provider registry response | settings PUT and test-connection POST remain unchanged | C: no business behavior change |
| Dashboard gold widget | `features/dashboard/components/gold-market-widget.tsx` | dashboard gold read model | optional refresh callback | D for UX-8; not changed |
| Gold Center data hook | `hooks/use-gold.ts` | `/gold/karat-prices`, `/gold/fixings`, `/gold/quote` | POST quote/fixing/price handlers | D for UX-8; not changed |

## Embedded surface inventory

The shared panel directly renders the market status card, source/health metrics, BID/SPOT/ASK cards, karat table, settings/provider cards, pricing-rule form/table, quote-history table, empty states, error state, refresh action, disabled permission state, and responsive overflow wrappers. No chart or tooltip is present in the shared panel. Existing dialogs/forms on the overview page are outside this presentation-only change.

## Baseline evidence

The read-only browser baseline loaded `/ar/gold-center` successfully with Arabic RTL, authenticated Company/Branch context, live `GOLDAPI_IO`/`AED` state, and no captured console error or warning. Before screenshot and DOM evidence are stored under `backups/ui-ux/PRE_UX8_GOLD_CENTER_20260828T171500Z/`.
