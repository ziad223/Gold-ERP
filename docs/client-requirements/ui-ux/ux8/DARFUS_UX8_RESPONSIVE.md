# UX-8 Responsive Evidence

| Viewport | AR | EN | Body overflow | Dense-table behavior |
|---|---|---|---:|---|
| Desktop 1440×900 | PASS | PASS | 0 | full table |
| Tablet 840×1180 | PASS | PASS | 0 | bounded frame; no page overflow |
| Mobile 390×844 | PASS | PASS | 0 | local horizontal table scroll only where required |

The shared panel uses bounded data frames and responsive grids. Mobile table widths exceeding the viewport are contained by the data frame; the document itself remains non-overflowing.

`UX8_DESKTOP = PASS`
`UX8_TABLET = PASS`
`UX8_MOBILE = PASS`
`UX8_BODY_OVERFLOW = 0`

