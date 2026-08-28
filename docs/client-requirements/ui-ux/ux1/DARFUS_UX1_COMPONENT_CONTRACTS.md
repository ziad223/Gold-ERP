# UX-1 Component Contracts

Every canonical component supports named/labelled semantics, visible focus, keyboard access, disabled and readonly distinction, clear errors, touch-size targets, reduced-motion behavior, and independent AR/EN RTL/LTR dark/light states.

| Group | Contract |
|---|---|
| Button / Icon Button | one clear local primary action; icon-only has accessible name and useful tooltip |
| Input / Search / Amount / Weight / Date | visible/programmatic label, unit/precision presentation only, inline error |
| Select / Combobox / Checkbox / Radio / Switch | keyboard and touch, selected state, no color-only meaning |
| Card / Summary / Metric | hierarchy without card multiplication; totals remain legible |
| Table / Toolbar / Filter / Pagination | headers, priority columns, numeric alignment, responsive detail, keyboard clarity |
| Modal / Drawer / Popover / Tooltip | focus management, touch/focus invocation, boundary fit, reduced motion |
| Badge / Status / Alert / Toast | text plus semantic styling; status is not only color |
| Tabs / Breadcrumb / Page Header / Navigation | semantic structure, active state and responsive reachability |
| Empty / Loading / Skeleton / Error | clear user-facing language, no raw backend message, stable layout |

These are contracts for later UX-1 implementation and the isolated reference route, not a migration of shared production components.
