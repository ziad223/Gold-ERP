# UX7B Tablet Viewport Measurements

Required viewport: measured width between `768px` and `900px` (preferred `840 × 1180`).

| Attempt | innerWidth | innerHeight | clientWidth | body.scrollWidth | documentElement.scrollWidth | Result |
|---|---:|---:|---:|---:|---:|---|
| New in-app browser tab, `/ar/customers` | 1422 | 800 | 1414 | 1414 | 1414 | Not Tablet |

The browser tab exposes no viewport capability. `playwright.setViewportSize` is unavailable; `window.resizeTo` is unavailable; passing `{ viewport: { width: 840, height: 1180 } }` when opening a tab produced the same measured `1422 × 800` surface. Therefore the required genuine Tablet viewport cannot be set or measured in this environment.

`TABLET_VIEWPORT_MEASURED = NO`

This is the UX7B blocking prerequisite. No CSS inference or 586/355px mobile view is substituted.
