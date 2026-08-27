# D2 Implementation Boundary

## Objective

Close the unified Invoice Search & Print UI over the D1/E projection authority for six active source types. Preserve source ownership and prevent a second invoice, customer, employee, tax, payment, accounting, asset, or barcode authority.

## Proven pre-change gap

The old UI used the legacy invoice search surface, supported only the five Invoice rows, kept employee filtering disabled, did not use the canonical D1/E detail for all active sources, and had no final multi-type projection search contract. CGP was not part of the D1 active search. D1's print-event assertion also treated every POST as forbidden even after explicit print authorization was introduced.

## Minimum safe D2 changes

- Add D2 source registry/read projection behavior for six active sources.
- Add branch-scoped, company-scoped, bounded, stable GET search.
- Add employee filtering for Invoice attribution and CGP actor -> User.defaultEmployee attribution.
- Add canonical GET detail with Asset/Barcode identity and source links.
- Wire one unified AR/EN UI with six type checkboxes, row click, detail, and print authorization calls.
- Keep legacy /invoices/search-print only as an adapter to the same projection service.
- Preserve existing invoice print-event route and add CGP projection print authorization without making CGP a generic Invoice.
- Update the stale D1/E tests to assert semantic permissions: read routes are GET-only; only explicit print authorization POST is allowed.
- Update the existing verifier to check the D2 projection and source registry.

## Intended files

Product/source:
- app/[locale]/(dashboard)/sales/search-print/page.tsx
- features/sales/hooks/use-invoice-search-print.ts
- features/printing/lib/invoice-print-view-model.ts
- components/sales/InvoiceReadOnlyDetail.tsx
- lib/types.ts
- backend/src/services/invoice-projection.service.js
- backend/src/routes/invoice-projection.routes.js
- backend/src/routes/erp.routes.js
- backend/src/models/index.js
- scripts/verify-invoices-search-print.js

Tests:
- tests/d2-final-invoice-search-print.test.cjs
- backend/tests/d1-unified-invoice-projection.test.cjs
- backend/tests/e-cgp-invoice-projection.test.cjs

The worktree already contained unrelated and earlier-batch edits. D2 does not claim ownership of those changes and did not run cleanup/reset/restore/stash.

## Explicitly forbidden in D2

- No migration or schema change.
- No seed/master-data provisioning.
- No Invoice/CGP/POS/customer/employee business mutation.
- No accounting recalculation or tax mutation.
- No asset/barcode/inventory mutation.
- No production contact.
- No Next dev start and no edit/revert of owner-accepted next-env.d.ts drift.
- No CRM batch start.

## Proof boundary

Backend source was syntax-checked; focused tests passed; typecheck passed; backend image was rebuilt and health/db/redis returned 200. The protected Next build was not run because the current owner/AGENTS guardrail protects generated next-env.d.ts and the owner accepted the exact generated drift. This is reported, not hidden.

