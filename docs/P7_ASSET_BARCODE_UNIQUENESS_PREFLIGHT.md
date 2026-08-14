# P7.5b — Asset Barcode Uniqueness — Preflight (READ-ONLY)
> Read-only audit. No migration, no dedup, no data change.
> Date: 2026-06-21. Script: `backend/scripts/audit-asset-barcodes.js` (SELECT only).
> Live audit ran against `darfus_erp@5433`.

## 1. Totals
| metric | value |
|---|---|
| total assets | **290** |
| barcode NULL | **0** |
| barcode empty / whitespace | **0** |
| barcode present (trimmed) | **290** |
| barcode == id (fallback artifact) | **0** |

## 2/3. Null / empty barcodes
**None** — every asset has a non-empty barcode. So **no backfill is needed** for
null/empty values.

## 4/5. Within-company duplicate groups
**3 duplicate groups, all in company CMP-DEMO** — 275 rows total, **272 excess**
rows that need a fresh unique barcode:

| company | barcode | count |
|---|---|---|
| CMP-DEMO | `1781862198099` | 125 |
| CMP-DEMO | `1781862587633` | 100 |
| CMP-DEMO | `1781881665294` | 50 |

These are large collisions: a single `Date.now()` value was reused for every item
in a bulk receive (the generator `String(Date.now()).slice(-13)` produced the same
13-digit barcode for the whole batch), so 125 / 100 / 50 assets each share one
barcode. (No sensitive data beyond the barcode value is shown.)

## 6. Cross-company duplicates
**0** — no barcode value is shared across different companies. A **company-scoped**
unique index would NOT be blocked by any cross-company collision.

## 7. Format / generator
- All 290 barcodes are **13-digit numeric** (the current timestamp generator);
  0 `AST-%` id-like, 0 other formats.
- Confirms the root cause is the **timestamp-based generator** producing identical
  values within a batch (not collision-safe).

## 8. Can the unique index be created NOW?
**NO.** A `(company_id, barcode)` unique (partial) index would fail to build because
of the 3 within-company duplicate groups (272 excess rows). **Dedup must run first.**

## 9. Proposed later migration (NOT executed)
```sql
-- company-scoped, allows NULL/empty, only after dedup:
CREATE UNIQUE INDEX assets_company_barcode_uidx
  ON assets (company_id, barcode)
  WHERE barcode IS NOT NULL AND btrim(barcode) <> '';
```
- Allows NULL (none today) → safe.
- Prevents duplicate barcode within a company.
- Allows the same barcode in two different companies (cross-company=0 today anyway).

## 10. Proposed dedup / backfill plan (NOT executed — gated)
For each within-company duplicate group:
1. Keep the **oldest** asset (lowest created_at) with its current barcode.
2. Re-assign every other member a **new, collision-safe, company-unique** barcode.
3. Use a generator that re-checks uniqueness within the company (retry loop).
4. Wrap in a single **transaction**; **dry-run first** (report which ids change).
5. Produce a **before/after report**; take a **DB backup** before any write.
6. Re-run this preflight afterwards → expect 0 duplicate groups, then create the index.
- (No null/empty backfill needed — count is 0.)

## 11. Generator follow-up (separate phase, NOT in P7.5b)
The current generator is **timestamp-based and not collision-safe** (proven by the
125/100/50 collisions). A later phase should:
- Centralise a single barcode generator (backend).
- Enforce **company-scoped uniqueness** with a check + retry loop inside the create
  transaction.
- Stop generating barcodes on the frontend (use it only as a temporary preview),
  so the backend is the single source of truth.

## Risks
- The dedup touches **272 existing rows** → must be transactional, dry-run + backup
  first, and gated by explicit approval (per project rules on touching live data).
- Some of these assets may be referenced by labels already printed with the old
  (duplicate) barcode — re-assigning changes the scannable value; surface this in
  the dedup plan (operationally, reprint affected labels).
- Building the unique index after dedup is fast/safe (partial, company-scoped).

## Recommendation
Two gated steps, in order, each with its own approval:
1. **P7.5c — dedup** (transaction + dry-run + backup + before/after report) to clear
   the 3 groups (272 rows), then re-run this preflight.
2. **P7.5d — additive migration** to create the `(company_id, barcode)` partial unique
   index, plus the collision-safe central generator follow-up.
Do NOT create the index or run dedup until each is explicitly approved.
