# DARFUS UX4 — Core Component Restore Map

| Changed file | Before snapshot | Component(s) | Restore instruction |
|---|---|---|---|
| `components/ui/button.tsx` | `PRE_UX4_CORE_COMPONENTS_20260828_030413/components/ui/button.tsx.ux4snapshot` | Button | Copy snapshot over source; verify hash |
| `components/ui/badge.tsx` | `.../badge.tsx.ux4snapshot` | Badge/status | Copy snapshot over source; verify hash |
| `components/ui/modal.tsx` | `.../modal.tsx.ux4snapshot` | Modal | Copy snapshot over source; verify hash |
| `components/ui/info-tooltip.tsx` | `.../info-tooltip.tsx.ux4snapshot` | Tooltip | Copy snapshot over source; verify hash |
| `components/ui/native-select.tsx` | `.../native-select.tsx.ux4snapshot` | Select | Copy snapshot over source; verify hash |
| `components/ui/empty-state.tsx` | `.../empty-state.tsx.ux4snapshot` | Empty | Copy snapshot over source; verify hash |
| `components/ui/error-state.tsx` | `.../error-state.tsx.ux4snapshot` | Error | Copy snapshot over source; verify hash |
| `components/ui/loading-state.tsx` | `.../loading-state.tsx.ux4snapshot` | Loading/skeleton | Copy snapshot over source; verify hash |
| `components/ui/input.tsx` and other new primitives | none | UX4 additions | Delete only the exact new file if rollback is approved; do not touch consumers |

UX2 and UX3 restore maps remain authoritative and are not altered by this batch. No module page or business file is included.
