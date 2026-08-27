# DARFUS ERP — G3 Financial Reconciliation Correction Report

بدأت هذه المرحلة بتشخيص Read-Only لعيبي G3 الماليين، ثم طُبّق أقل تعديل مصدر آمن، واختُبرت المعاينة فقط. لم يُنشأ Receive جديد، ولم يُنفّذ Idempotency Replay، ولم تُكتب قاعدة `darfus_erp`.

## 1 Executive Summary

| Item | Result | Evidence |
|---|---|---|
| GBP Preview/Submit tax mismatch | Corrected in source | GBP shared preview now receives server-derived `purchaseCost`, `vatBase`, `vatAmount`, and `makingTotal`; focused parity test passes |
| One-cent journal imbalance | Corrected fail-closed in source | `posting.service.js` now compares the rounded persisted cents exactly before `JournalEntry.create` |
| Read-only browser preview | Passed | Arabic canonical GBP form rendered profile preview and shared receive tax preview with matching current values |
| Official DB mutation | None | `current_database() = darfus_erp`; all business counts unchanged |
| New Receive / Replay | None | Button was not pressed; no replay was run |
| Historical G3 evidence | Preserved | PO and journal remain unchanged and classified as historical defective evidence |

G3 is not final acceptance closure. The correction is ready for Owner approval for one new GBP acceptance Receive followed by the approved idempotency replay batch.

## 2 Preserved G3 Evidence

The following rows were read and not changed:

- PO: `PO-1787090870807`
- Asset: `AST-PUR-1787090870838-1-1-9k4e`
- Barcode: `GPRNG21000001`
- Journal: `JE-1787090870905`
- Classification: `PRESERVED_G3_FINANCIAL_DEFECT_EVIDENCE`, `NOT_FINAL_ACCEPTANCE`

Frozen G3 values:

| Evidence | Taxable base | VAT | Total | State |
|---|---:|---:|---:|---|
| GBP profile Preview | 1834.56543649 | 298.65018733 | 2133.21562382 | Defective historical evidence |
| Persisted PO/tax snapshot | 1871.24177528 | 261.97384854 | 2133.21562382 | Defective historical evidence |
| Persisted Journal debit | 2133.21 | — | — | Defective historical evidence |
| Persisted Journal credit | — | — | 2133.22 | Defective historical evidence |

The old journal was not edited, reversed, deleted, or reposted.

## 3 GBP Preview vs Submit Input Matrix

The current browser run used the same synthetic G3 input shape in the canonical Inventory GBP form. The live Gold Center rate changed from the historical G3 rate, so current values are not compared as if they were the old transaction.

| Input / authority | A. GBP profile Preview | B. Shared Receive Preview | C. Canonical Submit source | D. Persisted old G3 PO | E. Persisted old G3 tax snapshot |
|---|---|---|---|---|---|
| Profile | `GOLD_BY_PIECE` | `GOLD_BY_PIECE` per-piece | Server resolves GBP before persistence | GBP | GBP tax snapshot |
| Karat | 21K | Same piece | Server validates/recalculates | 21K | Snapshot only |
| Gross / stone / net | 4 / 0 / 4 g | Same per-piece evidence | Server recalculates | 4 / 0 / 4 g | Snapshot only |
| Purchase gold rate | 448.69471393 live | Carried from profile evidence through the piece | Server canonical GBP rate path | 447.81044382 historical | Historical snapshot |
| Purchase making | 20/g; total 80 | Same evidence | Server canonical GBP calculation | 20/g; total 80 | Historical snapshot |
| Gold value | 1794.77885572 | Same evidence | Server canonical GBP calculation | 1791.24177528 historical | Historical snapshot |
| Purchase cost / total | 2137.24789552 | 2137.24789552 | Server canonical GBP calculation | 2133.21562382 historical | Historical snapshot |
| VAT rate | 14% | 14% | Server company policy | 14% | 14% |
| VAT base | 1874.77885572 | 1874.77885572 | Server canonical GBP calculation | 1871.24177528 historical | 1871.24177528 |
| VAT amount | 262.46903980 | 262.46903980 | Server canonical GBP calculation | 261.97384854 historical | 261.97384854 |
| Supplier / location | DB-backed QA supplier / DB-backed QA location | Same IDs sent to preview | Server validates company/branch scope | Historical QA rows | Snapshot context |
| Tax treatment | `STANDARD_VAT` | `STANDARD_VAT` | Server resolves tax policy | `STANDARD_VAT` | Immutable snapshot |
| Markup / maximum discount | 25% / 10% | Carried as pricing evidence | Server canonical pricing path | 25% / 10% historical | Not a tax authority |

Current A and B match at the calculation precision used by GBP. C was not submitted in this correction batch by design; its source path still recomputes the same server-authoritative GBP calculation before persistence.

## 4 GBP Tax Root Cause

`G3-FIN-001A` was caused by an input-construction divergence, not by a new GBP formula:

1. The GBP page used the server profile preview to obtain `unitCost`, but the per-piece payload did not carry the profile preview's `vatBase` and `vatAmount`.
2. The shared V2 preview normalizer therefore fell back to `purchaseCost` as the VAT base.
3. Because `purchaseCost` is the VAT-inclusive GBP total, the shared preview calculated VAT on the gross total instead of the GBP purchase base.
4. The final receive route had a separate server-side GBP canonicalization path and rebuilt the correct base/VAT before persistence. Preview and submit therefore did not consume the same economic evidence.

This explains the historical G3 pair: the total was equal, while the tax components differed.

## 5 GBP Minimum Safe Fix

Changed the canonical GBP page's `receiveItem` construction only:

- `purchaseCost` is carried from the server GBP profile preview.
- `goldValue` and `makingTotal` are carried from the same server preview.
- `vatBase` and `vatAmount` are carried from the same server preview.
- The final Submit route remains server-authoritative and continues to recalculate GBP; the frontend is not treated as the final financial authority.

Source: `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx:124-149`.

No formula was copied from GBW, no VAT value was hardcoded, and no new business field or tax rule was introduced.

## 6 Read-only Preview Reconciliation

The canonical Arabic GBP page was opened at `/ar/inventory/gold-by-piece` with the existing authenticated session. The form used DB-backed supplier/location selectors and `STANDARD_VAT`; no Submit action was taken.

| Preview | Status evidence | Tax base | VAT | Total |
|---|---|---:|---:|---:|
| Profile GBP preview | Form populated server-derived fields | 1874.77885572 | 262.46903980 | 2137.24789552 |
| Shared Supplier V2 receive preview | Tax summary rendered | 1874.77885572 | 262.46903980 | 2137.24789552 |

The displayed form also showed current live rate `448.69471393`, net gold weight `4.00000000`, pure gold weight `3.50000000`, purchase gold value `1794.78`, purchase making total `80.00`, and Gold Center status `GOLDAPI_IO · AED · GLOBAL / SPOT`.

## 7 Journal Rounding Forensic

The historical persisted journal was:

| Line | Debit | Credit |
|---|---:|---:|
| Inventory | 1871.24 | 0.00 |
| Input VAT | 261.97 | 0.00 |
| Supplier Payable | 0.00 | 2133.22 |
| Total | 2133.21 | 2133.22 |

The source values are:

- `round2(1871.24177528) = 1871.24`
- `round2(261.97384854) = 261.97`
- `round2(2133.21562382) = 2133.22`
- Rounded component debit sum = `2133.21`
- Rounded payable credit = `2133.22`
- Difference = `-0.01`

The defect was not fixed by changing the old journal.

## 8 Existing Rounding Authority

The source already contains exact-balance authorities in the four-decimal posting path and manual journal validation. The ordinary posting path, however, used a tolerance that allowed a difference of exactly `0.01` (`> 0.01` rejection condition). There is no approved generic residual account or residual-line rule for supplier receiving.

Therefore the safe authority is:

`rounded persisted JournalLine cents MUST sum exactly before posting; no residual line is invented.`

This preserves the existing account mapping and rejects an incomplete accounting calculation instead of silently posting it.

## 9 Journal Minimum Safe Fix

Changed `backend/src/services/posting.service.js:249-320`:

- Round the same line values that will be persisted.
- Calculate journal totals from those rounded values.
- Require exact cent equality before `JournalEntry.create`.
- Keep the existing atomic transaction and account resolution.
- Do not add a residual account, adjustment line, or hardcoded `0.01`.

This is a fail-closed correction. A future receive with the old mismatch will be rejected before a journal row is created, rather than creating another unbalanced journal.

## 10 Pre-Posting Balance Guard

Static proof: the exact cent guard appears before `JournalEntry.create`.

Focused proof: `backend/tests/g3-financial-reconciliation-correction.test.cjs` verifies the guard ordering and the one-cent rejection contract.

Runtime posting proof was intentionally not run because this correction batch forbids a new Receive, replay, or persistent business mutation. The historical bad journal remains available for the next approved acceptance reconciliation.

## 11 Focused Tests

Passed:

- `node --test backend/tests/g3-financial-reconciliation-correction.test.cjs` — 3/3
- `node --test backend/tests/gold-by-piece-rate-calculation-03-r2.test.cjs` — 5/5
- `node --test backend/tests/phase-03b-g2a1-tax-policy.test.cjs` — 6/6
- `node --test backend/tests/phase-03b-g2a2-transaction-tax.test.cjs` — 10/10
- `node --test backend/tests/phase-03b-g2c-receive-tax-location.test.cjs` — 4/4
- `node --test backend/tests/phase-03b-g2d-operational-readiness.test.cjs` — 4/4
- `node --test backend/tests/gold-by-weight-financial-formula-01b.test.cjs` — 6/6
- `node --test backend/tests/inventory-authority-foundation-01a.test.cjs` — 6/6
- `node --test backend/tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs` — 2/2
- `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs` — 5/5
- `node --test tests/settings-onboarding-discoverability.test.cjs` — 2/2
- `npm run typecheck` — PASS
- `node --check backend/src/services/posting.service.js` — PASS

No full suite and no build were run.

## 12 Browser/Network Preview Proof

Browser proof was performed from the canonical Arabic Inventory GBP page only:

- Profile preview request completed and populated the GBP calculated fields.
- Shared `/inventory-v2/receive-preview` request completed and populated the tax summary.
- The browser showed no fatal error state and no application console error; the only captured development messages were React DevTools information and `[HMR] connected`.
- The Receive button remained unpressed.
- No `/purchase-orders/receive` action was initiated in this batch.
- No Supplier legacy receive screen was used.

The source route contracts return HTTP 200 for both read-only preview endpoints; the successful populated response is also evidenced by the rendered values above.

## 13 DB Reconciliation

Read-only checks were executed against `darfus_erp`.

| Entity | G3 baseline before correction | Current after correction | Delta |
|---|---:|---:|---:|
| purchase_orders | 4 | 4 | 0 |
| purchase_order_items | 4 | 4 | 0 |
| assets | 4 | 4 | 0 |
| asset_origins | 4 | 4 | 0 |
| asset_purchase_cost_revisions | 4 | 4 | 0 |
| inventory_asset_movements | 4 | 4 | 0 |
| journal_entries | 4 | 4 | 0 |
| journal_lines | 12 | 12 | 0 |
| payments | 0 | 0 | 0 |
| idempotency_requests | 4 | 4 | 0 |

Additional read-only proof:

- `current_database() = darfus_erp`
- `SequelizeMeta` row count = `85`
- Historical PO `PO-1787090870807` remains present.
- Historical journal `JE-1787090870905` remains present with debit `2133.21000000` and credit `2133.22000000`.
- No SQL INSERT, UPDATE, DELETE, TRUNCATE, migration, seed, Receive, or replay was run in this correction batch.

## 14 Stale Test Handling

The historical Supplier acquisition acceptance test that expects the removed legacy Supplier receive page remains deferred. The accepted architecture redirects Supplier receive creation to canonical Inventory intake. It was not resurrected or rewritten in this correction batch.

`STALE_LEGACY_SUPPLIER_TEST = DEFERRED`

## 15 Files Changed

Intentional current-batch changes:

- `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx` — GBP shared-preview economic/tax evidence alignment. This path was already part of the pre-existing dirty worktree; only the listed `receiveItem` construction was changed in this batch.
- `backend/src/services/posting.service.js` — exact cent balance guard before journal persistence. The file also contained pre-existing worktree changes; only the G3 guard hunk is attributed to this batch.
- `backend/tests/g3-financial-reconciliation-correction.test.cjs` — focused GBP parity and journal guard tests.
- `docs/DARFUS_G3_FINANCIAL_RECONCILIATION_CORRECTION_REPORT.md` — this report.

Not changed:

- `next-env.d.ts` — owner-accepted generated drift preserved.
- No migration files.
- No configuration, secrets, API keys, or database data.

## 16 Gate

`GATE = PASS_G3_FINANCIAL_RECONCILIATION_SOURCE_CORRECTION_READY_FOR_ACCEPTANCE_RERUN`

This gate means the two source defects have a minimum safe correction, focused tests pass, read-only browser Preview parity passes, the official DB has zero business delta, and the historical defective evidence is preserved. It does not mean final G3 acceptance closure.

Required next acceptance evidence remains Owner-controlled:

1. One new canonical GBP Receive only.
2. Asset, barcode, origin, cost revision, movement, payable, and balanced journal reconciliation.
3. One valid idempotency replay and one conflicting replay according to the established contract.
4. Explicit confirmation that the new journal is balanced and the old defective journal remains unchanged.

## 17 Final Tokens

```text
CURRENT_CONTROL = DARFUS-G3-FINANCIAL-RECONCILIATION-CORRECTION
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 85
PRESERVED_G3_PO = PO-1787090870807
PRESERVED_G3_JOURNAL = JE-1787090870905

GBP_PREVIEW_ROOT_CAUSE = SHARED_PREVIEW_USED_GROSS_PURCHASE_COST_AS_VAT_BASE_BECAUSE_PROFILE_VAT_COMPONENTS_WERE_NOT_CARRIED_INTO_PER_PIECE_INPUT
GBP_PREVIEW_FIX = PASS
PREVIEW_SUBMIT_CALCULATION_PARITY = PASS_READ_ONLY_SOURCE_PARITY
CURRENT_PROFILE_PREVIEW_TAX_BASE = 1874.77885572
CURRENT_SHARED_PREVIEW_TAX_BASE = 1874.77885572
CURRENT_PROFILE_PREVIEW_VAT = 262.46903980
CURRENT_SHARED_PREVIEW_VAT = 262.46903980
CURRENT_PROFILE_PREVIEW_TOTAL = 2137.24789552
CURRENT_SHARED_PREVIEW_TOTAL = 2137.24789552

JOURNAL_ROUNDING_ROOT_CAUSE = ORDINARY_POSTING_ROUNDED_COMPONENT_LINES_AND_TOTAL_SEPARATELY_WHILE_ALLOWING_EXACT_0_01_IMBALANCE
ROUNDING_AUTHORITY_FOUND = YES
ROUNDING_AUTHORITY = EXACT_ROUNDED_CENT_EQUALITY_BEFORE_POSTING_NO_RESIDUAL_LINE_AUTHORITY
JOURNAL_FIX = PASS_STATIC_SOURCE_ONLY
JOURNAL_PREPOST_BALANCE_GUARD = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS
STALE_LEGACY_SUPPLIER_TEST = DEFERRED

NEW_RECEIVES = 0
IDEMPOTENCY_REPLAYS = 0
DB_BUSINESS_DELTA = 0
OLD_DEFECTIVE_PO_PRESERVED = YES
OLD_DEFECTIVE_JOURNAL_PRESERVED = YES
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO
G3_FINAL_CLOSED = NO

GATE = PASS_G3_FINANCIAL_RECONCILIATION_SOURCE_CORRECTION_READY_FOR_ACCEPTANCE_RERUN
NEXT_ACTION_IF_PASS = OWNER_APPROVAL_FOR_ONE_NEW_GBP_ACCEPTANCE_RECEIVE_AND_IDEMPOTENCY_REPLAY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP — OWNER REVIEW REQUIRED. No new Receive or Replay was started automatically.
