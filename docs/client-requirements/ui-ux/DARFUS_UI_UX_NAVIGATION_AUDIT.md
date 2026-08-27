# Navigation Audit

The sidebar is code-defined in `components/layout/sidebar.tsx` with five groups: Overview, Sales & Customers, Assets & Inventory, Finance Management, and System. Visibility is permission-driven through `usePermissions` and `permissionMatches`; active state is path-prefix based.

Strengths: predictable grouping, active route indicator, collapsed desktop mode, mobile overlay, bilingual labels, and permission filtering. Risks: the menu is long (around 20 visible entries), labels such as Customer Gold Purchase and Financial Statements are truncated in the narrow/desktop rail, and deep screens are “indirect” rather than exposed as nested navigation. Mobile requires an extra open-sidebar action. These are P2 navigation/density findings, not functional defects.

Evidence: real dashboard screenshots and DOM snapshots in AR/EN; source lines in `sidebar.tsx`. No navigation mutation performed.
