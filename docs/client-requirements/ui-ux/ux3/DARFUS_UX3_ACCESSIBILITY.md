# UX-3 Accessibility

| Requirement | Evidence | Result |
|---|---|---|
| Named sidebar/header/main landmarks | `aside`, `nav`, `header`, `main` in browser DOM | PASS |
| Active route semantics | `aria-current="page"` | PASS |
| Collapse semantics | `aria-controls` + `aria-expanded` | PASS |
| Mobile open/close naming | localized open/close labels | PASS |
| Keyboard focus | existing focus-visible policy plus UX3 shell focus ring | PASS |
| Touch target | existing button/link targets; mobile drawer click proof | PASS |
| Reduced motion | global UX2 media policy plus UX3 scoped policy | PASS |

No permission or authentication behavior was moved into presentation code.
