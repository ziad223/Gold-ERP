# UX4 Tab System

Added standalone controlled `Tabs` primitive with `tablist`/`tab` semantics, selected and disabled states, keyboard focus styling, horizontal overflow for narrow screens, and AR/EN-safe labels supplied by callers. No existing page tabs or business state machines were changed.

Result: `TAB_SYSTEM = PASS` by source and focused tests; no production tab consumer was mass-rewritten.
