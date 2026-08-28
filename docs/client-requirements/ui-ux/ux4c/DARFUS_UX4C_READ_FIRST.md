# DARFUS UX4C — Read First

- Control: `DARFUS-UIUX-UX4C-DRAWER-FOCUS-RESTORATION-MINIMUM-SAFE-FIX-01`
- Scope: the shared Drawer focus lifecycle only.
- Authority: `components/ui/drawer.tsx`; only the reference surface and existing consumers were inspected.
- Frozen boundaries: no Drawer redesign, prop-contract change, route/API/DB/business/permission change, migration, deployment, or consumer migration.
- Pre-fix defect was reproduced in a fresh UX4B reference tab: focus entered `Close drawer`, then became `BODY` after close.

