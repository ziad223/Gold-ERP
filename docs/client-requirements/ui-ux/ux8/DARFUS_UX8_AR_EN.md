# UX-8 Arabic / English Evidence

`AR` and `EN` were checked on the main local runtime at `http://localhost:3000` after the presentation changes.

| Locale | Route | Direction | Result | Evidence |
|---|---|---|---|---|
| AR | `/ar/gold-center` | `rtl` | PASS | browser DOM evidence; localized headings/table labels; `backups/ui-ux/UX8_GOLD_CENTER_20260828T171500Z/screenshots/ar-desktop-light-after.png` |
| EN | `/en/gold-center` | `ltr` | PASS | browser DOM evidence; localized headings/table labels; `backups/ui-ux/UX8_GOLD_CENTER_20260828T171500Z/screenshots/en-desktop-light-after.png` |

The machine-owned values remain visibly stable (`GOLDAPI_IO`, `LIVE_PROVIDER`, `AED`, `BID`, `SPOT`, `ASK`); they were not translated or recomputed.

`AR_EN_PARITY = PASS`

