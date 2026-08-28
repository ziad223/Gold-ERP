# UX-0B Responsive Matrix

## Viewport classes

| Class | Requested | Browser-reported CSS viewport |
|---|---:|---:|
| Wide Desktop | 1440×900 | 1600×1000 |
| Desktop | 1280×900 | 1422×1000 |
| Laptop | 1100×900 | 1222×1000 |
| Tablet Landscape | 960×900 | 1067×1000 |
| Tablet Portrait | 800×1000 | 889×1111 |
| Mobile Large | 640×900 | 711×1000 |
| Mobile Small | 390×844 | 434×938 |

## Result

All seven requested classes were exercised for each of the 18 route families in `DARFUS_UI_UX_UX0B_BROWSER_EVIDENCE_MATRIX.md`. This proves viewport measurement, route reachability, document overflow signals, locale metadata, and dark-theme metadata for that sample. It does **not** prove that every content state, AR/EN translation state, theme state, modal, drawer, table projection, or permission state is perfect at every class.

| Dimension | Result | Why |
|---|---|---|
| Viewport class measurement | PASS | 7 classes × 18 families visited in the internal browser |
| Horizontal fit | PASS in measured DOM sample | `scrollWidth > clientWidth` was false in measured rows |
| Vertical adaptation | ISSUE | long forms/reports/settings and dense pages scroll heavily |
| Mobile navigation | PARTIAL | prior AR narrow dashboard showed condensed navigation; all route-specific drawers were not exercised |
| Responsive tables | ISSUE/PARTIAL | source and UX-0 evidence show desktop-heavy tables; mobile row projection not universally proven |
| POS payment/action reachability | PARTIAL | POS route reached; branch-readiness and empty-cart states limited populated control proof |
| Dialog/drawer fit | BLOCKED | no safe read-only state opened for every route family |
| AR/EN × Dark/Light matrix | BLOCKED | not all 4 locale/theme combinations were measured at all 7 classes |

`RESPONSIVE_VIEWPORT_CLASSES_PROVEN = 7`
`RESPONSIVE_MATRIX_COMPLETE_FOR_CRITICAL_ROUTES = NO_FOR_FULL_LOCALE_THEME_STATE; YES_FOR_EN_DARK_VIEWPORT_MEASUREMENT`
