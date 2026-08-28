# UX-3 Shell Authority Map

| Concern | Current authority/source | Caller/data source | Permission or scope rule | UX-3 boundary |
|---|---|---|---|---|
| Locale and direction | `app/[locale]/layout.tsx` | Next locale segment and `next-intl` | `dir` is locale-derived | Preserve; breadcrumbs use the same locale |
| Dashboard shell composition | `components/company/company-dashboard-shell.tsx`, dashboard layout | Auth/company/branch providers compose `AppShell` | Existing gates remain unchanged | Presentation only |
| Shell layout | `components/layout/app-shell.tsx` | Children from dashboard routes | Existing local collapse preference only | Container spacing, landmark, responsive shell classes |
| Header | `components/layout/header.tsx` | Existing auth/company/branch/operator/theme/notifications hooks | Existing handlers remain authoritative | Compact surface, labels, focus, responsive arrangement |
| Sidebar route catalog | `components/layout/sidebar.tsx` `groups` | Static route catalog | Existing `usePermissions`, `accountType`, `useOperator`, `permissionMatches` filter | Do not change catalog/filter; add semantics and visual grouping only |
| Active route | `Sidebar` pathname comparison | `usePathname()` | Existing prefix matching | Preserve matching; add `aria-current` |
| Company context | `CompanySwitcher` / `useCompanyContext` | Existing provider and GET-backed context | Existing server/context authority | No behavior change |
| Branch context | `BranchSwitcher` / branch context | Existing provider | Existing branch authority | No behavior change |
| Theme | `contexts/theme-context.tsx` and UX-2 tokens | Existing theme provider | Existing toggle/persistence | Consume tokens; no second theme system |
| Language | `components/auth/language-switcher.tsx` | Existing locale navigation | Existing locale routes | Preserve route contract |
| Page title/actions | `components/ui/page-header.tsx` | Existing page callers | Existing caller-owned labels/actions | Add shell breadcrumbs only |
| Breadcrumbs | New `components/layout/breadcrumbs.tsx` | Read-only pathname + locale | No permission or business data | Presentation-only route context |

## Protected invariants

- `PERMISSION_BEHAVIOR_CHANGED = NO`
- `ROUTE_CONTRACT_CHANGED = NO`
- `BUSINESS_LOGIC_CHANGED = NO`
- `API_CONTRACT_CHANGED = NO`
- `DB_MUTATION = NO`
