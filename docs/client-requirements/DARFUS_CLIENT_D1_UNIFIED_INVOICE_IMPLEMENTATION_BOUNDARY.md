# D1 — Unified Invoice Projection Implementation Boundary

## Objective

Deliver only the read-only source registry, canonical summary/detail mapping,
and the smallest authenticated GET API needed to prove the foundation.

## Files changed for D1

| File | Purpose |
|---|---|
| `backend/src/services/invoice-projection.service.js` | Registry, Invoice adapter, canonical summary/detail mapper, scope-aware reads |
| `backend/src/routes/invoice-projection.routes.js` | GET-only source registry, summary list, and detail endpoints |
| `backend/src/routes/index.js` | Mount the D1 route under `/invoice-projection` |
| `backend/tests/d1-unified-invoice-projection.test.cjs` | Focused pure-contract and read-only route tests |
| `docs/client-requirements/DARFUS_CLIENT_D1_*.md` | D1 evidence and acceptance artifacts |

These files are the intentional D1 scope. Any other pre-existing worktree
changes belong to earlier owner-approved work and are not attributed to D1.

## Forbidden changes

- No invoice, payment, cash, journal, Asset, Customer, Supplier, CGP, tax, or
  POS source-model changes.
- No frontend Search & Print page or final print template changes.
- No mutation route, audit-write route, event-store creation, cache table,
  materialized invoice table, migration, seed, or backfill.
- No changes to permissions catalog; `sales.view` is the existing read
  permission.
- No official DB mutation, test fixture creation, cleanup, or transaction
  execution.

## Read-only implementation contract

1. Resolve the registry before loading a source.
2. Resolve source records with authenticated `companyId` and `branchId`.
3. Return `PROJECTION_SOURCE_FORBIDDEN` for a known source outside scope and
   `PROJECTION_SOURCE_NOT_FOUND` for an unknown source.
4. Copy financial/tax values from source fields; never recalculate them.
5. Preserve source line and Asset IDs.
6. Return stable JSON shapes for summary and detail.
7. Use no idempotency service and no write-capable model method.

## Acceptance boundary

The D1 gate can pass only for the foundation. It cannot close the client's
final Search & Print parity, Gift Voucher, CGP invoice artifact, audit logging,
performance/cache, or final print-layout requirements.

