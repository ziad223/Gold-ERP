# DARFUS UX4 — Core Component Inventory

Inventory captured before UX4 edits. Existing consumers were counted with `rg` over `app`, `components`, `features`, `hooks`, and `lib`.

| Priority | Component/system | Current implementation | Consumers / evidence | UX4 disposition |
|---|---|---|---|---|
| P1 | Button | `components/ui/button.tsx` | 68 import matches | Refine in place |
| P1 | Input/Search/Amount/Weight | `input-base` CSS plus `numeric-input.tsx` and `data-toolbar.tsx` | 100+ raw input consumers; numeric wrapper exists | Add compatible shared Input/Textarea primitives; preserve raw consumers |
| P1 | Select | `components/ui/native-select.tsx` | 16 import matches | Refine in place; add shared Select adapter |
| P1 | Form controls | Native controls in consumers | no shared checkbox/radio/switch primitive | Add presentation-only primitives |
| P1 | Card | `components/ui/card.tsx` / `.panel` | 64 import matches | Refine in place |
| P2 | Badge/status | `components/ui/badge.tsx` | 41 import matches | Refine in place |
| P2 | Alert/toast | local alert markup; `sonner` dependency | no shared primitive | Add accessible visual primitives without wiring business messages |
| P1 | Modal | `components/ui/modal.tsx` | 20 import matches | Refine in place |
| P2 | Drawer/popover/tooltip | local implementations; `info-tooltip.tsx` | tooltip has 4 import matches | Add compatible primitives; refine InfoTooltip |
| P2 | Tabs/pagination | local page markup; no shared primitive | no shared pagination import | Add presentation primitives; no route or query changes |
| P1 | Empty/loading/error | existing state components | 17/30/21 import matches | Refine semantics in place |
| P1 | Table foundation/toolbar | `.table-wrap`, raw tables, `data-toolbar.tsx` | toolbar has 8 import matches | Add presentation-only table primitives; preserve tables |
| P1 | Numeric hooks | `numeric-input.tsx`, `numeric-token.tsx`, global tabular numerals | used by profile/financial UI | Preserve value and formatting behavior |

## Exact candidate production files

Existing files eligible for in-place refinement: `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `modal.tsx`, `info-tooltip.tsx`, `native-select.tsx`, `data-toolbar.tsx`, `empty-state.tsx`, `error-state.tsx`, `loading-state.tsx`.

New shared primitives permitted by the UX4 scope: `input.tsx`, `textarea.tsx`, `select.tsx`, `form-controls.tsx`, `alert.tsx`, `drawer.tsx`, `popover.tsx`, `tooltip.tsx`, `tabs.tsx`, `pagination.tsx`, `table.tsx`.

No module page, backend, API, route, config, database, migration, or `next-env.d.ts` file is in scope.
