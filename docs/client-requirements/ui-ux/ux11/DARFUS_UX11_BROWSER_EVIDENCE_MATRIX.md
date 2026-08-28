# UX-11 Browser Evidence Matrix

| Surface | Locale | Read-only result | Evidence |
|---|---|---|---|
| Invoice search | EN | Loads, filters/list/detail controls visible, no overflow | Browser DOM; no Print/Reprint clicked |
| Invoice search | AR | Loads with RTL, no overflow | Browser DOM |
| Asset tag detail | EN | Loads, Asset tag preview mounted, `data-print-root` present | Browser DOM; no Print tag clicked |
| Asset tag detail | AR | Loads, RTL preview mounted, `data-print-root` present | Browser DOM; no Print tag clicked |
| Asset tag theme | EN/AR | Fixed tag face remains white/dark-readable in light/dark shell | Computed style proof |
| Console/hydration | Current tab | No error/warn entries | Browser dev log result `[]` |
| Print fixture route | Current main runtime | `/test/print-export` redirected to localized 404 | Recorded runtime limitation; no second frontend started |

Business-sensitive Print/Reprint buttons were not clicked. Their source/authority maps and focused regressions provide the non-mutating proof.

