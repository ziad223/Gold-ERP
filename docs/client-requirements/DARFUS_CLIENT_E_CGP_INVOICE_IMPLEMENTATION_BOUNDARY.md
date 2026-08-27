# DARFUS Client E — Implementation Boundary

## Declared boundary

| Boundary | Decision |
|---|---|
| Target | Activate only the D1 read-only `customer_gold_purchase` adapter |
| Business authority | Existing CGP aggregate remains unchanged |
| Persistence | No new CGP document, invoice row, table, migration, seed, or write path |
| Accounting | Read existing journal and line evidence only |
| Gold | Read stored CGP pricing snapshot/source evidence only |
| Tax | Preserve current no-tax-field source semantics; no calculation |
| Payment | Read current liability/settlement/cash evidence only |
| Security | Reuse `sales.view`; preserve server company/branch scope |
| UI | No D2 invoice search UI and no final print layout |

## Files changed for E

- `backend/src/services/invoice-projection.service.js`
  - activates the CGP registry entry;
  - maps CGP summary/detail/lines/tax/payment/accounting/source links;
  - routes CGP reads through the adapter;
  - keeps unrelated future adapters inactive.
- `backend/src/routes/invoice-projection.routes.js`
  - advertises the active projection source list while retaining the GET-only route and existing permission.
- `backend/tests/d1-unified-invoice-projection.test.cjs`
  - updates the D1 contract for the intentionally activated CGP adapter and adds pure mapping proof.
- `backend/tests/e-cgp-invoice-projection.test.cjs`
  - adds E-specific source, identity, equality, no-tax/no-write, future-boundary, and route proof.
- The six E report/contract artifacts in this directory.

## Explicitly forbidden in this batch

No CGP create/edit/validate/post/settle/reprice/recalculate changes; no accounting/tax/gold formula changes; no customer/asset/barcode/inventory mutation; no new invoice persistence; no D2 UI; no migration; no official business write; no production action.

## Boundary result

The implemented source/test delta stayed within the declared boundary. Runtime work used the normal backend refresh plus a disposable cloned DB for authenticated GET proof. The official DB was never used for authentication or business mutation by E.

