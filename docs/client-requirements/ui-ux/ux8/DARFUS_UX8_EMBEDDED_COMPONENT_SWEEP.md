# UX-8 Embedded Component Sweep

| Embedded surface | Result | Evidence |
|---|---|---|
| Market status / freshness card | PASS | shared panel `statusSurface`, source status and timestamps preserved |
| BID / SPOT / ASK metrics | PASS | source labels and numeric values preserved; no formula change |
| Karat price table and editable inputs | PASS | table hierarchy preserved; existing inputs retain handlers and now have accessible labels |
| Provider/settings cards | PASS | presentation classes only; provider selection and write handlers unchanged |
| Pricing rules/history tables | PASS | bounded tables and localized headings |
| Loading / error / empty states | PASS | existing states preserved; error retains `role="alert"` |
| Buttons, focus, disabled/permission state | PASS | existing action/permission behavior preserved; focus-visible CSS added in scoped module |
| Charts / extra business widgets | NOT APPLICABLE | no chart was introduced or required by UX-8 |

`UX8_EMBEDDED_COMPONENT_SWEEP = PASS`

