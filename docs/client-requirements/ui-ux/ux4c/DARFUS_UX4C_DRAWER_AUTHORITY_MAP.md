# UX4C Drawer Authority Map

| Concern | Current authority/evidence |
|---|---|
| Source | `components/ui/drawer.tsx`, `DrawerProps`, `Drawer` |
| Open state | Controlled `open` prop |
| Close callback | Controlled `onClose` prop |
| Portal/overlay | `createPortal(..., document.body)` with fixed presentation wrapper |
| Close button | Inner button labelled `Close drawer`, calls `onClose` |
| Overlay close | Full-screen button labelled `Close drawer`, calls `onClose` |
| Escape | Not implemented in the pre-UX4C shared Drawer; no new Escape behavior added |
| Focus entry | `closeRef.current?.focus()` when `open` |
| Focus return before fix | None; active element became `BODY` |
| Focus return after fix | `invokingTriggerRef`, guarded by `isConnected`, `focus({preventScroll:true})` after close |
| Trigger ownership | Exact `document.activeElement` captured on the false→true transition |
| Consumers | UX4B reference surface and dashboard customization uses a separate feature component; no consumer contract change required |

