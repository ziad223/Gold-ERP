# Component Problem Map

Counts are source/sample indicators from UX-0, not defect counts invented from naming. Exact global counts were not available for every component; `not fully counted` is an evidence boundary.

| Component | Current variants | Dark | Light | AR | EN | Responsive | Accessibility | Future canonical target |
|---|---|---|---|---|---|---|---|---|
| Button | shared + page-local | sampled/open | sampled/open | partial | partial | action wrapping | names/focus | one semantic hierarchy |
| Input | `input-base` + raw | open | open | label association | label association | long forms | explicit labels | one labeled field |
| Select | `NativeSelect` + raw | open | open | RTL | LTR | width/menus | keyboard | one select pattern |
| Textarea | page-local | open | open | partial | partial | tall forms | label/error | standard |
| Date | native/wrappers | open | open | locale | locale | form width | label | standard date field |
| Amount/Weight | numeric wrappers | precision display | precision display | bidi | bidi | dense forms | unit labels | presentation contract |
| Search | toolbars/page-local | open | open | partial | partial | filter collapse | keyboard | query + filter pattern |
| Card | Card/`.panel`/local | scattered | scattered | density | density | stacking | headings | surface hierarchy |
| Table | raw/table-wrap/cards | contrast | contrast | bidi | mixed data | desktop-heavy | headers/keyboard | responsive table/list detail |
| Modal/Drawer | shared/local | open | open | RTL width | LTR width | fit unproven | focus trap | single overlay pattern |
| Badge/Status | Badge/inline colors | semantics | semantics | labels | labels | wraps | text + color | semantic status system |
| Tabs | page-local | open | open | direction | direction | overflow | keyboard | accessible tab pattern |
| Filter Bar | repeated toolbars | open | open | order | order | collapse | labels | filter priority pattern |
| Page Header | repeated | hierarchy | hierarchy | RTL | LTR | wrapping | landmarks | one header contract |
| Navigation | sidebar/mobile menu | contrast | contrast | RTL | LTR | long labels | keyboard | responsive navigation |
| Error/Empty/Loading | shared + local | text contrast | text contrast | mixed copy | raw messages | page length | alert semantics | state language contract |
| Tooltip/Popover | shared + local | focus | focus | placement | placement | touch unproven | keyboard/touch | dual input support |
| Pagination | page-local | open | open | direction | direction | small screens | labels | standard pagination |

No component was changed in UX-0B.
