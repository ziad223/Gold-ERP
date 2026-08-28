# UX4B Component State Matrix

| Family | States exercised | Browser result |
|---|---|---|
| Button / Icon Button | primary, secondary, ghost, danger, disabled, loading, icon-only | PASS |
| Input / Search / Textarea | normal, readonly, disabled, long text, error/helper | PASS |
| Select / Combobox | selection, changed selection, disabled native select | PASS |
| Checkbox / Radio / Switch | checked/unchecked, selected option, enabled/disabled | PASS |
| Card / Badge / Status | default, selected, success, warning, danger, info, neutral | PASS |
| Alert / Toast | info, warning, error, local toast visibility | PASS |
| Modal / Drawer | open, close, Escape/close control, entry focus | PARTIAL — Drawer focus return failed |
| Popover / Tooltip / InfoTooltip | open, keyboard tooltip, local presentation | PASS |
| Tabs | Overview, Details, History, disabled tab | PASS |
| Pagination | previous/next, page state, disabled previous | PASS |
| Empty / Loading / Error | static empty, loading, local error | PASS |
| Table | headers, rows, status cells, static values | PASS |
| DataToolbar | static filter presentation and reset/default control | PASS |

