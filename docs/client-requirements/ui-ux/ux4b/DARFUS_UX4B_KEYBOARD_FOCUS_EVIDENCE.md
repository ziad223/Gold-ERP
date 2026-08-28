# UX4B Keyboard and Focus Evidence

| Interaction | Result | Evidence |
|---|---|---|
| Button tab navigation | PASS | Native/button focus moved through the surface. |
| Input and search focus | PASS | Text controls remained keyboard reachable. |
| Select/Combobox keyboard interaction | PASS | Combobox opened and selection changed; Escape closed the list. |
| Checkbox/Switch keyboard state | PASS | State changed and remained inspectable. |
| Tabs keyboard/state | PASS | Details tab became selected; disabled tab remained unavailable. |
| Pagination keyboard/state | PASS | Next changed page state and Previous became enabled. |
| Modal entry focus | PASS | Focus entered `Close dialog`. |
| Modal focus return | PASS | Focus returned to `Open modal`. |
| Drawer entry focus | PASS | Focus entered `Close drawer`. |
| Drawer focus return | FAIL | Focus returned to `BODY`, not `Open drawer`. |
| Tooltip keyboard open | PASS | Tooltip opened from keyboard focus/activation. |
| Touch/compact interaction | PASS | Mobile responsive controls and overlays were exercised without overflow. |

The Drawer result is an actionable accessibility defect and blocks the UX4B PASS gate.

