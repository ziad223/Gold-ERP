# UX-8 Browser Evidence Matrix

| Route group | Locales | Themes | Viewports | Result | Console warn/error |
|---|---|---|---|---|---:|
| `/gold-center` overview | AR/EN | Light/Dark | 1440×900, 840×1180, 390×844 | PASS | 0 |
| `/gold-center/live-prices` | AR/EN | baseline light | 1440×900 | PASS | 0 |
| `/gold-center/price-history` | AR/EN | baseline light | 1440×900 | PASS | 0 |
| `/gold-center/pricing-rules` | AR/EN | baseline light | 1440×900 | PASS | 0 |
| `/gold-center/settings/market-data` | AR/EN | baseline light | 1440×900 | PASS | 0 |

Observed shared signals: correct `dir`, `bodyOverflow = 0`, authenticated Company/Branch context, status/freshness text, and no captured browser `warn`/`error`. No PUT/POST control was clicked. Backend logs show only GET Gold Center reads during this proof; mutation endpoints were not invoked by the evidence journey.

The main runtime at port 3000 was the existing `next start` listener. No Frontend instance was started by UX-8. A pre-existing `next dev` process was observed without a listener on port 3000 and was not modified.

`UX8_BROWSER_PROOF = PASS`

