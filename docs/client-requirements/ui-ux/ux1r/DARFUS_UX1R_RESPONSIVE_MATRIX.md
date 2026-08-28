# UX-1R Responsive Matrix

| Prototype set | Mobile small | Tablet | Desktop | Overflow result |
|---|---:|---:|---:|---|
| POS / Inventory / Accounting + Gold · EN/Dark | 434×938 | 889×1111 | 1422×1000 | No body overflow |
| POS / Inventory / Accounting + Gold · AR/Light | 434×938 | 889×1111 | 1422×1000 | No body overflow |

POS was also checked at mobile-large `478×1000`. The finance table retains a local horizontal overflow boundary for narrow data, while the page body remains within the viewport. Requested overrides were 390×844, 800×1000 and 1280×900; actual page dimensions are recorded above.

`RESPONSIVE_FINAL_MATRIX = PASS`
