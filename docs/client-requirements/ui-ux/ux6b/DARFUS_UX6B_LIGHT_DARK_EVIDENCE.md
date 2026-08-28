# UX-6B Light / Dark Evidence

Same Asset and barcode were rendered independently:

| Theme | Before | After | Computed face background | Computed face foreground | Result |
|---|---|---|---|---|---|
| Light | readable | readable | `rgb(255,255,255)` | `rgb(17,24,39)` | PASS; no regression |
| Dark | black-on-dark defect | readable light paper | `rgb(255,255,255)` | `rgb(17,24,39)` | PASS; defect closed |

After Dark Mode SVG background computed white and SVG fill remained black. Barcode text remained `GWBGL22000001` in both modes.

`SAME_STATE_LIGHT_DARK_EVIDENCE = PASS`.

