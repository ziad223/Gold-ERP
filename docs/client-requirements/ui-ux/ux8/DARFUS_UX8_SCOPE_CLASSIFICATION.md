# UX-8 Gold Center Scope Classification

| Scope item | Class | Decision |
|---|---:|---|
| Page hierarchy, toolbar and section navigation | A | Safe presentation-only refinement |
| Market status and rate cards | B | Improve scanability; preserve source values and status semantics |
| Provider/settings cards | C | Refine presentation only; keep existing permission guards and handlers |
| BID/SPOT/ASK and karat tables | B | Improve dense-data readability and bounded overflow; no formatter/field change |
| Empty/loading/error states | A/B | Improve clarity without swallowing or rewriting errors |
| Responsive wrappers at desktop/tablet/mobile | A/B | Use bounded containers and responsive grids; no workflow change |
| Focus-visible, disabled and status presentation | B | Preserve semantic text and existing disabled logic |
| Existing karat-rate input accessible names | B | Add localized `aria-label` only; preserve value, parser, save handler and server authority |
| Main overview fixing, quote calculator and fixing modal business logic | D | Not changed by UX-8 |
| `use-gold.ts`, API routes, backend services, DB/schema, migrations | D | Forbidden and not changed |
| Dashboard gold widget | D | Unrelated surface; not changed |

`UX8_SCOPE_CLASSIFICATION = COMPLETE` before implementation. No class-D surface is edited.
