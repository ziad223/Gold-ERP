# UX-3 Sidebar Implementation

The static `groups` catalog, route hrefs, permission values, `usePermissions`, `useOperator`, `accountType`, `permissionMatches`, and active-prefix matching remain unchanged. The sidebar now exposes a named `nav`, `aria-current="page"`, collapse `aria-expanded/aria-controls`, explicit mobile close naming, and UX3 presentation hooks.

| Proof | Result |
|---|---|
| Existing navigation catalog | 21 routes retained by focused test |
| Permission authority | Existing hook/filter references retained |
| Active state | One `aria-current="page"` on tested pages |
| Mobile drawer | Open/close worked at 390×844 |
| Route behavior | No href or redirect change |

`SIDEBAR_PERMISSION_LOGIC_CHANGED = NO`

`SIDEBAR_ROUTE_CATALOG_CHANGED = NO`
