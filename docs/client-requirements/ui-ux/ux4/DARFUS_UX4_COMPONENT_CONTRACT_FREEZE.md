# DARFUS UX4 — Component Contract Freeze

| Component | File | Existing required/optional props | Defaults | Events/ref/className | Contract decision |
|---|---|---|---|---|---|
| Button | `components/ui/button.tsx` | native button props; `variant`, `size` | `primary`, `md` | native events; className passthrough; no ref before UX4 | Preserve all existing props/defaults |
| Card | `components/ui/card.tsx` | `children`, `className` | none | no events; className passthrough | Preserve |
| Badge | `components/ui/badge.tsx` | `children`, `tone`, `className` | `slate` | no events; className passthrough | Preserve |
| NativeSelect | `components/ui/native-select.tsx` | all native select props; `wrapperClassName` | none | native ref/events; className passthrough | Preserve |
| Modal | `components/ui/modal.tsx` | `open`, `onClose`, `title`, `description`, `children` | none | close/Escape; no new required props | Preserve |
| InfoTooltip | `components/ui/info-tooltip.tsx` | `label`, `text` | none | click/focus/hover; no new props | Preserve |
| DataToolbar | `components/ui/data-toolbar.tsx` | existing query/filter/reset and optional input callbacks | filters `[]`; reset `Reset` | existing callbacks/ref passthrough | Preserve |
| State components | `empty-state.tsx`, `loading-state.tsx`, `error-state.tsx` | existing documented props | existing defaults | existing callbacks | Preserve |

UX4 additions are optional standalone primitives. They introduce no changes to existing consumer contracts and are not required by any business module in this batch.

`COMPONENT_PROP_CONTRACT_CHANGED = NO`.
