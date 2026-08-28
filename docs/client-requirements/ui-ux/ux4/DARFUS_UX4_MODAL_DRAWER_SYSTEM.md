# UX4 Modal / Drawer System

`Modal` was refined in place with dialog semantics, labelled title/description, accessible close buttons, Escape handling, focus on open, and focus restoration. Existing open/close/title/description/children props remain unchanged. Added standalone `Drawer` with dialog semantics, close affordance, start/end positioning, scroll containment, and focus handling. No route or workflow changed.

Result: `MODAL_DRAWER_SYSTEM = PASS` by source/focused tests and read-only inventory-consumer inspection.
