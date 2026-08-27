# Component Variant Inventory

| Component family | Current variants/evidence | Consistency finding |
|---|---|---|
| Button | shared `Button` plus page-local classes, primary/secondary/ghost/danger | One shared pattern exists but page-local variants remain |
| Input | `input-base`, numeric/date wrappers, raw native controls | Mostly coherent; association varies |
| Select | `NativeSelect` plus raw selects | Variant duplication |
| Card/panel | `.panel`, Card, page-local rounded surfaces | Visual language is related but not single |
| Table | `.table-wrap`, raw tables, card projections | Density and responsive behavior vary |
| Modal/drawer | shared Modal plus page-local dialogs/drawers | Need consolidation proposal |
| Status | Badge plus inline color classes | Semantic status colors not fully centralized |
| Error/loading/empty | shared components plus local guards | Shared foundation is strong; local messages vary |

Target for later UX-1: `ONE_CANONICAL_COMPONENT_PATTERN`. No components were changed.
