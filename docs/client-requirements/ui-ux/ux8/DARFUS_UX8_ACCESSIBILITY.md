# UX-8 Accessibility Evidence

| Check | Result | Evidence |
|---|---|---|
| Keyboard navigation | PASS | focused rate input and advanced with `Tab`; active element remained the labeled input |
| Focus-visible styling | PASS | scoped CSS includes `:focus-visible` treatment |
| Labels | PASS | AR: 8 rate inputs labeled `السعر/جرام {K}K`; EN: 8 rate inputs labeled `Rate/g {K}K` |
| Tables | PASS | semantic table structure retained with readable headings |
| Status not color-only | PASS | `HEALTHY · FRESH`, mode, provider, timestamps and warning text are textual |
| Dialog/focus scope | PASS | no UX-8 dialog contract changed; existing page controls remain keyboard reachable |
| Reduced motion | PASS | scoped `prefers-reduced-motion: reduce` rule |
| Touch targets | PASS | browser surface remains usable at 390px; no persistent page overflow; existing compact controls unchanged in behavior |
| Contrast/readability | PASS | dark/light screenshots inspected for hierarchy and readable text |
| UX4C focus regression | NO | no drawer/focus code was changed |

`UX8_ACCESSIBILITY = PASS`
`UX4C_FOCUS_REGRESSION = NO`

