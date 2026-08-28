# UX-3 Breadcrumb Implementation

`components/layout/breadcrumbs.tsx` is a new client presentation component. It reads only the existing pathname and locale, maps known shell/module segments to AR/EN labels, and renders an accessible `nav`/`ol` with a current-page item. It performs no API call, permission decision, or business calculation.

`PageHeader` renders the breadcrumb above the existing title/description/actions. Dynamic identifiers are displayed as a localized Details/التفاصيل label rather than leaking an opaque identifier into the navigation chrome.

`BREADCRUMBS_ROUTE_CHANGE = NO`

`BREADCRUMBS_BUSINESS_DATA_ACCESS = NO`
