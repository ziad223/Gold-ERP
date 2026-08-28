# UX5C — Search Clipping

The POS page keeps the existing `DataToolbar` query, filter, reset, and key
handlers. A POS-local `min-w-0` wrapper and the responsive parent grid prevent
the toolbar from forcing a narrow panel; the query API and search projection are
unchanged.

AR and EN placeholders were readable in desktop, tablet, and mobile evidence with
zero horizontal document overflow.

`POS_SEARCH_CLIPPING = RESOLVED`
`SEARCH_BEHAVIOR_CHANGED = NO`
