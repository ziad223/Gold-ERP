# UX-1 Browser Evidence Matrix

Route tested: `http://localhost:3000/en/test/ux1-reference`. The locale-prefixed route rendered HTTP 200 through the current frontend runtime. The route is not linked from production navigation and uses static fixtures only; no API/business request is connected.

The browser viewport capability reports a small device-scale adjustment. The table records the actual `innerWidth × innerHeight` observed by the page, not only the requested override.

| Locale / theme | Prototype | Mobile (actual) | Tablet (actual) | Desktop (actual) | Root lang/dir/theme | Visible prototype | Result |
|---|---|---:|---:|---:|---|---|---|
| EN / Dark | POS | 434×938 | 889×1111 | 1422×1000 | en / ltr / dark | `ux1-prototype-pos` | PASS |
| EN / Dark | Inventory / Asset | 434×938 | 889×1111 | 1422×1000 | en / ltr / dark | `ux1-prototype-inventory` | PASS |
| EN / Dark | Accounting + Gold | 434×938 | 889×1111 | 1422×1000 | en / ltr / dark | `ux1-prototype-finance` | PASS |
| AR / Light | POS | 434×938 | 889×1111 | 1422×1000 | ar / rtl / light | `ux1-prototype-pos` | PASS |
| AR / Light | Inventory / Asset | 434×938 | 889×1111 | 1422×1000 | ar / rtl / light | `ux1-prototype-inventory` | PASS |
| AR / Light | Accounting + Gold | 434×938 | 889×1111 | 1422×1000 | ar / rtl / light | `ux1-prototype-finance` | PASS |

Additional browser evidence:

- The POS reference loaded first in EN/Dark with a disabled checkout button, an alert state, a loading state, two named inputs and no Console warning/error entries.
- Arabic switching changed the prototype root to `lang=ar`, `dir=rtl`, Arabic labels and tab names; English restored `lang=en`, `dir=ltr`.
- Theme controls changed the prototype root between `data-theme=dark` and `data-theme=light`.
- All three tabs exposed `role=tab` and `aria-selected`; each selected tab rendered only its matching prototype test id.
- Customer input focus produced the gold visible outline (`outline-offset` observed) and named controls were present. The checkout button remained disabled as a safe read-only state.
- The served CSS contained the `prefers-reduced-motion: reduce` guard and no decorative keyframe animation. Browser tooling did not expose media emulation, so reduced-motion is verified as a served contract, not claimed as OS-preference emulation.
- At each tested size `body.scrollWidth` did not exceed the actual `innerWidth`; the finance table keeps its own horizontal overflow boundary for narrow layouts.
- Console warnings/errors: none captured (`tab.dev.logs`, levels warn/error).

Static focused test: `node --test tests/ux1-reference-prototype.test.cjs` passed 3/3. `npm run typecheck` and `npm run build` passed. Evidence is limited to the isolated prototype and does not close production UX rollout.
