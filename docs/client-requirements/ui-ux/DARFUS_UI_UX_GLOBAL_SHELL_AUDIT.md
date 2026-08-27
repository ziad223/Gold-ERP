# Global Shell Audit

**Evidence:** `app/[locale]/layout.tsx`, dashboard layout, `components/company/company-dashboard-shell.tsx`, `components/layout/app-shell.tsx`, `header.tsx`, `sidebar.tsx`; internal browser at 1422/1580 CSS px and narrow override.

| Area | Observed result | Classification |
|---|---|---|
| Header/sidebar/container | Consistent semantic shell, sticky header, fixed side rail, max-width main, responsive mobile menu | PASS with density risk |
| Page title/action | Most pages use a title and action area; several profile screens place many equal-weight sections below | P2 GLOBAL |
| Background/surface | Semantic tokens are used; dark shell is cohesive, but special print surfaces need scoped overrides | P2 DARK_MODE |
| Narrow shell | Sidebar collapses to menu; at narrow viewport dashboard remains readable without horizontal overflow, but dense content requires vertical scan | PASS with P2 responsive risk |
| Context | Company/branch shown in header; branch readiness gate is prominent and can dominate the page when context is absent | P1 operational UX |

No shell code was changed.
