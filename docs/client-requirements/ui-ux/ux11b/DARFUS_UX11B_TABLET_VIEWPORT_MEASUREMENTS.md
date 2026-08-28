# UX-11B Tablet Measurements

Measured in the direct local Chrome runtime at the required viewport:

| Measurement | Value |
|---|---:|
| `window.innerWidth` | 840 |
| `window.innerHeight` | 1180 |
| `document.documentElement.clientWidth` | 832 on invoice page; 840 on asset page |
| `document.documentElement.clientHeight` | 1180 |
| `document.body.scrollWidth` | equal to document width; no horizontal overflow |
| `document.documentElement.scrollWidth` | equal to document width; no horizontal overflow |
| `devicePixelRatio` | 1.0000000149 (asset page; harness DPR 1) |

The required 768–900 width range is satisfied. The extension evaluation did not expose `navigator`; the same executable was independently verified with Playwright and reported HeadlessChrome/151.
