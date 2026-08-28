# UX-3 Regression Results

| Command | Result |
|---|---|
| `node --test tests/ux3-shell-navigation.test.cjs` | PASS — 3/3 |
| `node --test tests/ux3-shell-navigation.test.cjs tests/ux1-reference-prototype.test.cjs tests/ux1r-owner-visual-refinement.test.cjs tests/gold-by-weight-sidebar-navigation-02-r2.test.cjs tests/unified-inventory-intake-ux-02-r3.test.cjs tests/unified-inventory-ux-final-closure.test.cjs tests/pos-gift-voucher-visual-ux-correction.test.cjs tests/inventory-count-step5-inprogress-ux.test.cjs` | PASS — 33/33 |
| `npm run typecheck` | PASS — exit 0 |
| `npm run build` | PASS — Next.js 16.2.9, 128 static routes, exit 0 |

The selected regressions cover UX navigation, POS/Gift Voucher presentation, Inventory/Inventory Count presentation, and previously closed UX shell authorities. No business module implementation test was changed.
