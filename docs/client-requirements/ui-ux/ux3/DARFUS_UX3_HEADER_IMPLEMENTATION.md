# UX-3 Header Implementation

The existing header remains the source of truth for company, branch, operator, language, theme, notifications, search, profile, and logout actions. UX-3 adds only compact shell presentation classes, a localized mobile navigation label, and focus semantics. No handler, data hook, auth action, or context authority changed.

Evidence: `components/layout/header.tsx`; browser matrix shows one banner, company/branch controls, locale direction, and theme control on all tested AR/EN routes.

`HEADER_BUSINESS_BEHAVIOR_CHANGED = NO`

`HEADER_CONTEXT_AUTHORITY_CHANGED = NO`
