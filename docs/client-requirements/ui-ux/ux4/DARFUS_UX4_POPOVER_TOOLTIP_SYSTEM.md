# UX4 Popover / Tooltip System

`InfoTooltip` retains `label` and `text` props and now supports hover, keyboard focus, and tap/click toggle with stable tooltip association and a viewport-bounded surface. Added standalone controlled `Popover` and `Tooltip` primitives. Technical content is caller-owned; no business data or mutation is introduced.

Result: `POPOVER_TOOLTIP_SYSTEM = PASS` by source and focused semantic tests.
