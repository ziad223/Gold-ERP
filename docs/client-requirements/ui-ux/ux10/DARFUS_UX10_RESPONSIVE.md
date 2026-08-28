# UX-10 Responsive Verification

The current browser was checked at desktop (`1440x900` requested), tablet (`840x900` requested), and mobile (`390x844` requested) sizes on Settings and Audit in both locales. The browser runtime reported the expected responsive shell and no console errors. The CSS scopes bounded tables, preserves horizontal overflow only on local data wrappers, and supplies mobile heading/table treatment.

| Viewport | AR | EN | Result |
|---|---|---|---|
| Desktop | PASS | PASS | PASS |
| Tablet | PASS | PASS | PASS |
| Mobile | PASS | PASS | PASS |

The runtime reports its browser viewport after shell chrome; this is recorded evidence, not a claim that the shell has no reserved navigation width.
