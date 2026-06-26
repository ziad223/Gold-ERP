# P7.5c — Asset Barcode Dedup — DRY-RUN Plan
> DRY-RUN only. No DB writes, no migration. Apply is gated + needs separate approval.
> Date: 2026-06-21. Script: `backend/scripts/dedup-asset-barcodes.js` (default dry-run).

## 1. Duplicate groups (before)
3 within-company duplicate groups, all in **CMP-DEMO** (from the timestamp
generator reusing one `Date.now()` per bulk receive):

| barcode | count |
|---|---|
| `1781862198099` | 125 |
| `1781862587633` | 100 |
| `1781881665294` | 50 |

## 2. Excess rows
**272** rows need a new barcode (275 members − 3 kept).

## 3. Strategy — keep oldest, regenerate the rest
For each duplicate group (scoped to one company):
- **Keep** the OLDEST asset (`created_at ASC`, then `id ASC` for stability) with its
  current barcode unchanged.
- **Re-assign** every other member a new, company-unique barcode.
Dry-run result: **272 proposed changes** (== excess), all in CMP-DEMO.

## 4. Generator strategy
- New barcode = **13-digit numeric starting `9`** (`9000000000001`, `9000000000002`, …).
- Rationale: keeps the existing **numeric / 13-digit format** (minimal change — no
  switch to alphanumeric), and the `9e12` range is **disjoint from the timestamp
  generator** (which produces `~17…`), so a new barcode can never collide with a
  past or future generated value.
- Generated against the company's full set of existing barcodes (preloaded) +
  the running set of newly-assigned ones → **company-scoped uniqueness** with a
  retry loop. Numeric-only, valid for the scannable CODE128 renderer.

## 5. Is the plan collision-free?
**Yes** (dry-run verification):
- proposed changes == excess (272 == 272).
- new barcodes **all unique** among themselves: YES.
- new barcodes **collide with existing**: NO.
- **apply safe? YES** (pending approval).

## 6. Sample (sanitized, first 5)
```
AST-PUR-…-2 : 1781862198099 -> 9000000000001
AST-PUR-…-3 : 1781862198099 -> 9000000000002
AST-PUR-…-4 : 1781862198099 -> 9000000000003
AST-PUR-…-5 : 1781862198099 -> 9000000000004
AST-PUR-…-6 : 1781862198099 -> 9000000000005
… and 267 more
```
The full 272-row mapping is **NOT committed** (no mapping file is written by default;
it stays a console summary / local artifact only).

## 7. Is apply safe?
Yes, but gated. The script writes **only** when ALL of these hold (none set now):
`--apply` flag **AND** `CONFIRM_ASSET_BARCODE_DEDUP=YES` **AND** `NODE_ENV !== production`
(unless `ALLOW_PROD_DEDUP=YES`). Default invocation is read-only and was verified to
modify **0 rows** (post-run audit still shows the 3 original groups, no `9…` barcodes).

## 8. Proposed apply steps (later, separate approval)
1. **DB backup** (`npm run db:backup`).
2. Re-run dry-run to refresh the plan against current data.
3. Run apply with all guard flags → executes the 272 `UPDATE`s **inside one
   transaction** (rolls back on any error).
4. Re-run the preflight audit → expect **0 duplicate groups**.
5. Then P7.5d: create the `(company_id, barcode)` partial unique index + the central
   collision-safe generator.

## 9. Reprint warning
The 272 re-barcoded assets currently carry labels printed with the OLD (duplicate)
barcode. After apply, those printed labels become stale — **the affected items must
be re-printed** (their scannable value changes). Operationally schedule a reprint of
the 272 assets after the dedup.

## 10. Recommendation
The plan is ready and verified collision-free. Proceed in two separately-approved
steps: **P7.5c-APPLY** (backup → transaction apply → re-audit) then **P7.5d**
(unique index + central generator). Do NOT apply until explicitly approved.

> NOTE: the live asset count drifted 290 → 292 between P7.5b and this dry-run due to
> ongoing live usage; the 3 historical collision groups are unchanged and the plan
> recomputes per run.
