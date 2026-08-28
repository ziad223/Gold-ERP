# Inventory / accounting regression

Commands passed:

- `node --test tests/asset-final-closure.test.cjs` — 9/9.
- `node --test tests/barcode-final-closure.test.cjs` — 11/11.
- `node --test tests/unified-inventory-ux-final-closure.test.cjs` — 8/8.
- `node --test backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs` — 5/5.

These tests preserve Asset identity, Barcode, Supplier V2, movement, accounting/tax boundaries, unified intake, and canonical idempotency source behavior. No business mutation was run.

`INVENTORY_REGRESSION = PASS`  
`ACCOUNTING_REGRESSION = PASS`  
`IDEMPOTENCY_REGRESSION = PASS`

