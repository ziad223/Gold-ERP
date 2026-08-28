# UX-7 Change Map

| Changed file | Change | Explicitly not changed |
|---|---|---|
| `app/globals.css` | Added `.ux7-*` scoped presentation rules, responsive wrapping, bidi-safe identifiers and reduced-motion handling | No global business/UI behavior, API, DB or state |
| `app/[locale]/(dashboard)/customers/page.tsx` | Added scoped UX7 classes to page, actions, stats, table, contacts, identifiers and form | hooks, filters, handlers, payloads and permissions |
| `app/[locale]/(dashboard)/customers/[id]/page.tsx` | Added scoped detail/form/tab classes and safe title wrapping | detail queries and mutation actions |
| `app/[locale]/(dashboard)/suppliers/page.tsx` | Added scoped UX7 classes to page, actions, stats, cards, contacts, identifiers and form | hooks, filters, handlers, payloads and permissions |
| `app/[locale]/(dashboard)/suppliers/[id]/page.tsx` | Added scoped detail/tab classes and safe title wrapping | payment, document, consignment and accounting actions |
| `tests/ux7-customers-suppliers.test.cjs` | Focused source contract checks | no runtime data or DB writes |

