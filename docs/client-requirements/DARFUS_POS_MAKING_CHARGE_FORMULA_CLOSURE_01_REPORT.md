# DARFUS ERP — POS Making Charge Formula Closure 01 Report

بالعربي: تم إصلاح مسار المصنعية في POS بأقل تغيير مثبت، ونجحت الاختبارات المركزة و`typecheck`. لم تُكتب قاعدة `darfus_erp`، لكن لا يمكن إعلان الإغلاق النهائي لأن إثبات المتصفح والـruntime الحي والـdisposable checkout محجوب حاليًا، ويوجد قيد مالي تاريخي غير متوازن خارج هذا التغيير.

## 1. Executive summary

The client authority proves:

```text
MAKING_RATE_MEANING = AED_PER_GRAM
GBW_TOTAL_MAKING = NET_GOLD_WEIGHT × MAKING_RATE_PER_GRAM
```

The canonical backend formula already followed that rule. The proven defects were a GBW POS display quote using gross weight and a preview response that failed to report dynamic GBW making although the internal subtotal included it. Both were corrected narrowly. The main runtime was not restarted, the browser tool was unavailable, and no business mutation was attempted.

## 2. Authority and forensic evidence

- `Gold By Weight.docx` was read from the beginning through the final rendered page. The relevant client paragraphs are listed in `DARFUS_POS_MAKING_CHARGE_FORMULA_AUTHORITY.md`.
- `1- Sales Invoice.docx` was read from the beginning through the final rendered page. Its invoice-line and Pricing Engine rules are listed in the authority report.
- OOXML extraction and LibreOffice rendering were compared. The embedded Gold By Weight formula image confirmed the separate pure-gold formula; it did not override the explicit net-weight making rule.
- Source paths inspected include POS page/hook, `gold-sale-pricing.service.js`, `erp.routes.js`, Asset/invoice item models, Tax Engine reuse, accounting preview, and focused tests.

## 3. Required tokens

| Token | Value |
|---|---|
| `POS_WEIGHT_AUTHORITY` | Server-resolved serialized Asset fields; `netGoldWeight` is GBW eligible authority |
| `POS_WEIGHT_BASIS` | Profile-specific; GBW = `NET_GOLD_WEIGHT`, non-GBW retains its existing strategy |
| `MAKING_RATE_MEANING` | `AED_PER_GRAM` |
| `MAKING_RATE_AUTHORITY` | Server-validated `makingChargePerGram`; Gold Center remains authority for gold rate |
| `MULTI_ITEM_FORMULA` | `Σ(eligibleWeight_i × validatedRate_i)` |
| `SERVER_FINAL_AUTHORITY` | YES |
| `CLIENT_WEIGHT_TOTAL_AUTHORITY` | NO |
| `TAX_ENGINE_REUSED` | YES |
| `DUPLICATE_VAT` | ELIMINATED in static/source proof |
| `MINIMUM_MAKING_APPROVAL_PRESERVED` | YES |

## 4. Root cause

`H_MULTIPLE_PROVEN = YES` with:

- `A_UI_SEMANTIC_BUG`: rate/eligible-weight semantics were not explicit at the display boundary.
- `B_FRONTEND_TOTAL_CALCULATION_BUG`: GBW display used gross weight.
- `D_GROSS_VS_NET_WEIGHT_BUG`: stone-bearing GBW items produced a wrong display amount.
- `C_BACKEND_FORMULA_BUG = NOT_PROVEN`: canonical server formula was already net-based.
- `G_RUNTIME_STALE = PROVEN_FOR_THIS_ACCEPTANCE`: current backend container predates the source edit and was not restarted.

## 5. Files changed in this batch

Intentional changes made during this control:

1. `I:\WORK\jewellery-erp-master\app\[locale]\(dashboard)\pos\page.tsx` — GBW display quote uses net eligible weight; bilingual eligible-weight summary.
2. `I:\WORK\jewellery-erp-master\features\sales\hooks\use-pos.ts` — mock fallback applies per-gram rate to GBW net eligible weight.
3. `I:\WORK\jewellery-erp-master\backend\src\routes\erp.routes.js` — `/pricing/calculate` reports dynamic GBW making without double-counting tax base.
4. `I:\WORK\jewellery-erp-master\backend\tests\pos-making-charge-formula-closure-01.test.cjs` — new MC-01..MC-16 and semantic/static tests.

The worktree contained extensive pre-existing unrelated changes and untracked reports. They were not cleaned, reset, restored, stashed, or claimed as this batch’s changes.

## 6. Test evidence

| Command | Result |
|---|---|
| `node --test backend/tests/pos-making-charge-formula-closure-01.test.cjs` | `19/19 PASS` |
| `node --test backend/tests/gold-by-weight-profile-02.test.cjs` | `7/7 PASS` |
| `node --test backend/tests/gold-by-weight-financial-formula-01b.test.cjs` | `6/6 PASS` |
| `node --test tests/pos-journal-preview-p2.test.cjs` | `3/3 PASS` |
| `node --test tests/stage-c-pos-financial-integration.test.cjs` | `3/3 PASS` |
| `node --test backend/tests/phase-03b-g2a2-transaction-tax.test.cjs` | `10/10 PASS` |
| `node --test backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs` | `5/5 PASS` (shared idempotency/tax regression evidence) |
| `node --test backend/tests/gold-live-feed-03-pricing-policy.test.cjs` | `6/6 PASS` |
| `npm run typecheck` | PASS, exit code 0 |
| `npm run build` | NOT RUN; protected by current runtime/Next guidance |

## 7. Runtime and browser gate

| Proof | Result |
|---|---|
| Health | PASS: backend, DB, Redis all HTTP 200 |
| Frontend GET | PASS: `/ar/pos` and `/en/pos` HTTP 200 |
| AR real browser/network/console | BLOCKED: browser kernel setup could not write required assets |
| EN real browser/network/console | BLOCKED: same tooling error |
| Live backend source parity | BLOCKED: no rebuild/restart after edit |
| Disposable checkout | BLOCKED: historical rehearsal DB required by existing script is absent; no safe fixtures |
| Official DB mutation | NOT RUN / 0 |

## 8. Official DB integrity

The before/after counts and the pre-existing accounting exception are recorded in `DARFUS_POS_MAKING_CHARGE_MAIN_DB_INTEGRITY.md`. No PO, invoice, payment, Asset, movement, journal, Gold Center setting, master data, or idempotency business row was created by this control.

## 9. Risk and disposition

| Risk | Severity | Disposition |
|---|---|---|
| Main runtime may still serve pre-fix backend/frontend | P2 evidence/runtime | Requires separately authorized refresh, then smallest browser rerun |
| No disposable fixture target for mutation proof | P2 acceptance blocker | Owner-approved disposable target/fixtures required |
| One pre-existing unbalanced posted purchase journal (0.01) | P1 financial integrity | Separate forensic/remediation control; untouched here |
| Official policy rows have null making/minimum values | P2 config readiness | Do not seed in this control; configure only under separate authority |
| Legacy `/gold/quote` remains gross-based foundation path | P2 scope risk | Not current POS path; do not widen without a proven consumer |

## 10. Gate

```text
STATIC_AUTHORITY_PROOF = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS
OFFICIAL_DB_WRITES = 0
MIGRATIONS = 0
P0_COUNT = 0
P1_COUNT = 1 (pre-existing unbalanced journal; not introduced here)
P2_COUNT = 4
AR_BROWSER = BLOCKED
EN_BROWSER = BLOCKED
DISPOSABLE_RUNTIME = BLOCKED
GATE = BLOCKED_POS_MAKING_CHARGE_RUNTIME_AND_BASELINE_INTEGRITY
```

The formula correction is not declared final acceptance because the required runtime/browser and isolated mutation proofs are incomplete, and the current official baseline contains an unrelated financial integrity exception.

## 11. Final tokens

```text
CURRENT_CONTROL = DARFUS-POS-MAKING-CHARGE-FORMULA-CLOSURE-01
MODE = MINIMUM_SAFE_SOURCE_CORRECTION_WITH_FOCUSED_TESTS_AND_RUNTIME_GATE
MAKING_RATE_MEANING = AED_PER_GRAM
POS_WEIGHT_BASIS_GBW = NET_GOLD_WEIGHT
POS_WEIGHT_AUTHORITY = SERVER_RESOLVED_ASSET
MULTI_ITEM_FORMULA = SUM(ELIGIBLE_WEIGHT_I * VALIDATED_RATE_I)
SERVER_FINAL_AUTHORITY = YES
NO_DOUBLE_VAT = PASS_STATIC
MINIMUM_MAKING_APPROVAL_PRESERVED = YES
FOCUSED_TESTS = PASS (19/19 control tests)
REGRESSION_TESTS = PASS (40/40 listed regression tests; 59/59 including control tests)
TYPECHECK = PASS
BUILD = NOT_RUN
AR_BROWSER = BLOCKED_BROWSER_TOOLING
EN_BROWSER = BLOCKED_BROWSER_TOOLING
DISPOSABLE_RUNTIME = BLOCKED_NO_SAFE_FIXTURE_TARGET
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_WRITES = 0
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
BACKUP = NOT_RUN
PRE_EXISTING_UNBALANCED_JOURNALS = 1
UNEXPECTED_DB_DELTA = 0
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 4
GATE = BLOCKED_POS_MAKING_CHARGE_RUNTIME_AND_BASELINE_INTEGRITY
NEXT_RECOMMENDED_STEP = OWNER REVIEW; separately approve runtime refresh/disposable fixture proof and address the pre-existing JE exception
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 12. Stop

STOP. No Gift Voucher work, no extra POS checkout, no official DB repair, no migration, no build, and no automatic next batch.
