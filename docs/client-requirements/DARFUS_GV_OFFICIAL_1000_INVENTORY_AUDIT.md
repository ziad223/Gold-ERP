# Gift Voucher Official AED 1000 — Inventory and Audit

Asset `AST-PUR-1787092907353-1-1-hldv` retained its identity and barcode `GPRNG21000002`. Read-only DB state after the checkout:

- `status = sold`, `operational_status = SOLD`.
- Profile `GOLD_BY_PIECE`, Branch-1, location unchanged, 4g, 21K.
- One sale event: `ASEV2-50710fd667bf46b9bd5c51a09b`, `AVAILABLE → SOLD`.
- One sale movement: `IMV2-b17e2801752c4260b8dd3b81f5`.
- The exact checkout replay did not create another event or movement.

Audit rows exist for the new voucher issue, activation, redemption, and sale. Print was not required and no print/reprint action was used for this acceptance.

Results: `INVENTORY_RECONCILIATION = PASS`; `ASSET_SOLD_ONCE = YES`; `AUDIT_RECONCILIATION = PASS`.
