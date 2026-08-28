# UX-6 Responsive Evidence

Real browser captures were taken at the browser's requested responsive sizes:

| View | Evidence | Result |
|---|---|---|
| Desktop | AR/EN list and detail, light/dark | PASS |
| Tablet (840 px requested) | AR/EN list and detail | PASS; table remains locally bounded |
| Mobile (420 px requested) | AR/EN list and detail | PASS; no body-level overflow, wide table scroll is contained |

Final AR mobile browser metrics: viewport reported approximately `467x1043` in the in-app browser; `bodyScrollWidth=459`, `clientWidth=459`, `scrollWidth=459`, `dir=rtl`. The table wrapper was the intentionally scrollable surface.

