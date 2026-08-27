# DARFUS C3 — Implementation Boundary

## Target boundary before code

```text
TARGET_REQUIREMENTS = C3-COMMON-001, C3-COMMON-002, C3-COMMON-003
EXACT_GAP = The five profile families already share the receive UI envelope and canonical Asset projections, but no single server-published common-field contract and semantic test contract makes the shared boundary explicit.
ROOT_CAUSE = Common receive fields are passed through one UI component but profile registry/API response, Asset projections, and tests do not publish one reusable common-field definition. Existing data is not missing; the contract is implicit and duplicated in evidence.
FILES_EXPECTED_TO_CHANGE = backend/src/services/inventory-common-profile-fields.service.js (new); backend/src/routes/erp.routes.js (additive read-only contract only); backend/tests/c3-common-profile-fields.test.cjs (new); six C3 documentation artifacts.
FILES_FORBIDDEN_TO_CHANGE = migrations; seeds; .env/secrets; next-env.d.ts; Asset/Barcode/RFID/Revision schema; Tax/Accounting services; POS/sale authority; closed Inventory Count; unrelated profile business calculators.
DB_SCHEMA_CHANGE_EXPECTED = NO
BUSINESS_LOGIC_CHANGE_EXPECTED = NO; contract metadata and fail-closed field classification only.
ACCOUNTING_IMPACT = NONE; existing PO Tax/Journal authority remains unchanged.
INVENTORY_IMPACT = NONE beyond read-only contract proof; one Asset per physical piece remains unchanged.
SECURITY_IMPACT = NONE; reuse inventory.view and existing server scope.
IDEMPOTENCY_IMPACT = NONE; no mutation route or hashing change.
```

## Allowed minimum change

1. Define one immutable server-side common profile field registry using existing canonical field names and authorities.
2. Publish it additively with the existing read-only profile registry endpoint, without changing the receive payload or persistence model.
3. Add focused tests for the five top-level profile families/internal strategies, shared receive field ownership, dedicated-authority rejection classification, unknown-field fail-closed behavior, and the existing route permission catalog.
4. Produce static/API/read-only evidence. Mutation acceptance remains disposable-only and is not allowed against `darfus_erp`.

## Explicitly not in scope

- No SKU invention or Barcode alias.
- No universal image field or attachment redesign.
- No common-field database table/JSON duplicate.
- No change to Asset, Barcode, RFID, status, location, weight, karat, pricing, tax, accounting, invoice, POS, CGP, transfers, workshop, returns, count, CRM, or tag authorities.
- No new permission; no migration; no seed; no official DB business write.
- No re-opening closed C1/C2/Inventory Count controls.

## Gate conditions for implementation

Implementation can proceed only for the boundary above if:

- the matrix and authority map remain unambiguous;
- the new contract is additive and backward compatible;
- no schema change appears necessary;
- tests prove all five profile families map to the same common semantics;
- official DB remains read-only.

If any requirement instead needs a new field owner, schema, master data, or dedicated business mutation, stop with the corresponding C3 blocked gate and do not widen this boundary.
