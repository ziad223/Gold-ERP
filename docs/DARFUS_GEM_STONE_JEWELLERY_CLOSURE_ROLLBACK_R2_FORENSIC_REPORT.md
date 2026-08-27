# DARFUS ERP — Gem Stone Jewellery Closure Rollback R2 Forensic Report

## 1. Executive Summary

تم تنفيذ فحص الإغلاق المطلوب للـGem Stone Jewellery. تم إثبات مسار الاستلام الكامل على Disposable Clone مع Forced Rollback، وبقيت قاعدة `darfus_erp` بدون أي كتابة أو Receive جديد. تم تصحيح توقع اختبار R2 المتقادم فقط، ثم نجحت الاختبارات المركزة وBuild وTypecheck، وأعيد فحص واجهة Stone Settings في AR/EN وPOS قراءة فقط.

**نتيجة مختصرة:** مسار rollback آمن، بيانات الاستلام المقبولة محفوظة، ولا توجد P0/P1 جديدة. لا يوجد Receive جديد في Official DB.

## 2. Closure Scope

- Control: `DARFUS-GEM-STONE-JEWELLERY-CLOSURE-ROLLBACK-R2-FORENSIC`
- `NEW_RECEIVE_ALLOWED=NO`
- `BUSINESS_DB_WRITES_ALLOWED=NO`
- `PRE_LIVE_ROLLBACK_ACCEPTANCE=NOT_RUN` remains unchanged.
- New evidence is explicitly `POST_LIVE_FULL_ROUTE_ROLLBACK_SAFETY_PROOF`.
- No migration, seed, cleanup, delete, production contact, or business-rule change was executed.

## 3. Existing Accepted Gem State

The accepted state was preserved and re-read from the Official DB:

| Evidence | Value |
|---|---|
| PO | `PO-1787330905244`, received |
| Asset | `AST-PUR-1787330905253-1-1-zo5f`, available |
| Barcode | `GSRNG21000001` |
| Journal | `JE-1787330905329`, posted |
| Idempotency | `a231a335-d1cc-4255-a985-73f22f1ed499`, succeeded/201 |
| PO tax | Base 2692.00000000, VAT 376.88000000, total 3068.88000000, 14% |
| Journal balance | Debit 3068.88000000 = Credit 3068.88000000 |

## 4. Chronology/Process Deviation

The historical live acceptance happened before the requested pre-live rollback proof. That deviation is documented, not rewritten. The required post-live proof was subsequently run on a fresh disposable clone and did not alter the accepted live evidence.

## 5. Pre-Control DB Baseline

Official identity was read-only verified as `current_database() = darfus_erp`, role `postgres`.

| Table | Baseline / final count |
|---|---:|
| purchase_orders | 11 |
| purchase_order_items | 11 |
| assets | 11 |
| asset_components | 8 |
| asset_gemstone_component_details | 1 |
| asset_gemstone_component_settings | 0 |
| asset_barcode_history | 11 |
| asset_origins | 11 |
| asset_purchase_cost_revisions | 11 |
| asset_current_valuations | 11 |
| inventory_asset_movements | 11 |
| journal_entries | 14 |
| journal_lines | 39 |
| cash_transactions | 3 |
| idempotency_requests | 15 |
| audit_logs | 66 |
| profile_master_data | 660 |
| SequelizeMeta | 88 |

## 6. Exact Accepted Request Recovery

The prior accepted request evidence was recovered from the existing idempotency record and prior acceptance report. The exact request key and request hash matched the preserved record. No key or secret value was printed into this report or intended logs.

## 7. Post-Live Full-Route Rollback Proof

1. Confirmed the only initial persistent database was the Official DB.
2. Created disposable clone `darfus_erp_gem_closure_rollback_20260821`.
3. Restored the pre-Gem backup into the clone with `pg_restore --exit-on-error`.
4. Verified temporary backend identity through `GET /api/v1/health/db` HTTP 200 and `current_database()` on the clone.
5. Sent one isolated synthetic Gem request to the temporary backend only.
6. Forced the transaction commit to throw `CONTROLLED_POST_LIVE_ROLLBACK` after the normal full route staged its business evidence.
7. Route returned HTTP 500 and executed transaction rollback.

The temporary backend was stopped after proof; port 8001 no longer responded. The clone was not deleted because cleanup was outside scope.

## 8. Rollback Staged Business Evidence

The staged route reached Asset/PO evidence, purchase-cost/current-valuation persistence, inventory movement, payable/accounting posting, and idempotency completion before the controlled commit failure. The temporary log recorded a balanced staged journal before rollback:

`JE-1787332791028` for `PO-1787332790962` — Dr 3068.88 / Cr 3068.88.

The clone required a controlled fresh Gold quote adapter because its restored quote was stale. This adapter was disposable harness infrastructure only; it did not change Official DB or production Gold Center behavior. Official main Gold health was independently read-only verified as HTTP 200, `HEALTHY`, `GOLDAPI_IO`, `LIVE_PROVIDER`, `AED`, fresh.

## 9. Rollback Zero-Delta Proof

Clone counts before and after forced rollback were identical:

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 10 | 10 | 0 |
| purchase_order_items | 10 | 10 | 0 |
| assets | 10 | 10 | 0 |
| asset_components | 7 | 7 | 0 |
| origins | 10 | 10 | 0 |
| purchase-cost revisions | 10 | 10 | 0 |
| current valuations | 10 | 10 | 0 |
| movements | 10 | 10 | 0 |
| journal_entries | 13 | 13 | 0 |
| journal_lines | 36 | 36 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 14 | 14 | 0 |
| audit_logs | 65 | 65 | 0 |

`POST_LIVE_ROLLBACK_CLONE_BUSINESS_DELTA=0`.

## 10. R2 Regression Reproduction

The exact R2 test initially failed only because it expected 157 rows while current source returned 158. All other assertions passed.

## 11. Exact157/158 Difference

| Set | Count | Finding |
|---|---:|---|
| R1 manifest | 157 | Valid current R1 rows |
| R2 extension | 1 | `DIAMOND_NAME / Diamond / LOOSE_DIAMOND` |
| Current manifest v3 | 158 | Unique and internally consistent |

The extra row is an intentional Loose Diamond v3 extension, not a Gem duplicate or invalid master-data row.

## 12. DCLA/IIDGR Authority Trace

`DCLA` and `IIDGR` remain valid certificate authorities within the 16-row `CERTIFICATE_AUTHORITIES` R1 category. They are not the 157/158 difference. The earlier wording that treated them as drift was stale evidence wording.

## 13. R2 Root Cause

`R2_ROOT_CAUSE = STALE_TEST_EXPECTATION_AFTER_LOOSE_DIAMOND_V3_EXTENSION`.

Classification: test expectation drift; not a runtime Gem defect, not DB drift, not duplicate master data, and not a business-rule conflict.

## 14. Minimum Safe R2 Correction

Only the existing untracked R2 test expectation was narrowed to assert R1=157, R2=1, current=158, and the exact `DIAMOND_NAME/Diamond` row. No manifest, migration, DB, or runtime business logic was changed.

## 15. Files Changed

Intentional changes for this control:

- `backend/tests/inventory-master-data-bootstrap-r2.test.cjs` — narrow R2 expectation correction.
- `backend/tests/gold-center-legacy-price-sync.test.cjs` — stale canonical karat-count assertion corrected from 5 to 8.
- `backend/tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs` — stale technical UI wording assertion corrected from `Server Tax Summary` to the current user-facing `Tax Summary`.
- This report.

The worktree contained extensive pre-existing dirty/untracked project work. No cleanup, reset, restore, stash, or unrelated ownership was taken. `next-env.d.ts` remained at the Owner-accepted SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`.

## 16. Focused Tests

The Gem/R2 focused set passed: **7/7 Gem tests and 5/5 R2 assertions**. The curated combined run passed **89/89 tests, 0 failures**.

## 17. Shared Regression

The curated regression set covering Gem, inventory authority, master data, barcode/status, Asset pricing, GBW, GBP, Supplier receive, and unified inventory UX passed **89/89**. The three assertion-only corrections above aligned tests with current source authority; no business behavior was loosened.

## 18. Typecheck/Build

- `npm run typecheck`: PASS.
- `npm run build`: PASS; Next 16.2.9 Turbopack; 117 static pages generated.
- Next environment hash: MATCH; no unauthorized `next-env.d.ts` edit.
- No Next dev server was started.

## 19. Existing Gem Asset Immutability

The accepted Asset, barcode, origin, movement, purchase-cost revision, current valuation, and source PO linkage were unchanged. Final Official DB target query still returned the same accepted identifiers and values.

## 20. Accounting Immutability

The accepted journal remained `JE-1787330905329`, posted, with debit and credit both `3068.88000000`. The pre-existing unrelated imbalance `JE-1787090870905` also remained unchanged; it is not introduced by this control.

## 21. Idempotency Immutability

The accepted idempotency row remained `purchase.receive`, `succeeded`, status 201, with its existing request hash. The rollback clone produced no persistent idempotency delta.

## 22. Final DB No-Mutation Proof

Official final counts exactly matched the pre-control baseline. The accepted PO/Asset/Journal/Idempotency rows matched the recorded evidence. Therefore:

`OFFICIAL_DB_WRITES=0`

`UNAUTHORIZED_OFFICIAL_BUSINESS_DELTA=0`

## 23. Stone Settings AR/EN Re-check

Read-only real-browser proof on the current main frontend:

| Check | AR | EN |
|---|---|---|
| Multi-select binding | PASS | PASS |
| Accessible listbox | PASS | PASS |
| 47 settings available | PASS | PASS |
| Antique + Bar selected as chips/summary | PASS | PASS |
| Remove selected value | PASS | PASS |
| No native `select[multiple]` | PASS | PASS |
| Keyboard focus on remove control | PASS | PASS |
| Touch/pointer activation path | PASS | PASS |
| Technical console errors | 0 | 0 |

The control uses the existing `<details>`/summary multi-select pattern with chips/removal controls; no Master Data or business binding was changed.

## 24. POS Re-check

Read-only POS search for `GSRNG21000001` returned one `Gem Stone Ring` result at AED 7,000.00 with no invoice item selected and no checkout/sale submitted. Prior accepted Asset detail evidence confirmed Gem Stone Ring, `GEMSTONE_JEWELLERY`, 21K, 10g, quantity 1, correct barcode and branch scope.

## 25. Existing P0

One inherited pre-control accounting anomaly remains unchanged:

`JE-1787090870905` has debit `2133.21000000` and credit `2133.22000000` (difference `0.01000000`). It predates this control, was not touched, and is not a new regression. It remains an Owner-priority item outside this rollback/R2 closure scope.

## 26. P0/P1

| Class | New in this control | Status |
|---|---:|---|
| P0 | 0 | No new P0 |
| P1 | 0 | No new P1 |
| Inherited P0 | 1 | Preserved, separately documented above |

## 27. Gate

`GATE = PASS_GEM_STONE_JEWELLERY_FINAL_CLOSURE_AFTER_POST_LIVE_SAFETY_PROOF`

This PASS is limited to the requested Gem Stone closure evidence. It does not authorize another Receive, mutation of the Official DB, or Loose Gem Stone work.

## 28. Final Tokens

```text
CURRENT_CONTROL = DARFUS-GEM-STONE-JEWELLERY-CLOSURE-ROLLBACK-R2-FORENSIC
LOCAL_MAIN_DB = darfus_erp
PRE_LIVE_ROLLBACK_ACCEPTANCE = NOT_RUN
POST_LIVE_FULL_ROUTE_ROLLBACK_SAFETY_PROOF = PASS
NEW_RECEIVE_EXECUTED = NO
POST_LIVE_ROLLBACK_CLONE_WRITES_PERSISTED = 0
OFFICIAL_DB_WRITES = 0
EXISTING_ACCEPTED_PO_PRESERVED = YES
EXISTING_ACCEPTED_ASSET_PRESERVED = YES
EXISTING_ACCEPTED_BARCODE_PRESERVED = YES
EXISTING_ACCEPTED_JOURNAL_PRESERVED = YES
EXISTING_ACCEPTED_IDEMPOTENCY_PRESERVED = YES
R2_EXPECTED_R1 = 157
R2_CURRENT = 158
R2_EXTRA_ROW = DIAMOND_NAME/Diamond/LOOSE_DIAMOND
DCLA_IIDGR = VALID_R1_CERTIFICATE_AUTHORITIES
R2_ROOT_CAUSE = STALE_TEST_EXPECTATION_AFTER_LOOSE_DIAMOND_V3_EXTENSION
R2_CORRECTION = TEST_ONLY_NARROW
FOCUSED_TESTS = PASS
SHARED_REGRESSION = PASS_89_OF_89
TYPECHECK = PASS
BUILD = PASS
NEXT_ENV_HASH_MATCH = YES
STONE_SETTING_MULTISELECT_UI = PASS
AR_STONE_SETTING_UI = PASS
EN_STONE_SETTING_UI = PASS
STONE_SETTING_BROWSER_PROOF = PASS
POS_GEM_BARCODE_READ_ONLY = PASS
UNAUTHORIZED_OFFICIAL_BUSINESS_DELTA = 0
INHERITED_P0_COUNT = 1
NEW_P0_COUNT = 0
NEW_P1_COUNT = 0
GATE = PASS_GEM_STONE_JEWELLERY_FINAL_CLOSURE_AFTER_POST_LIVE_SAFETY_PROOF
GEM_STONE_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = YES
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY; DO NOT START LOOSE GEM STONE
```

**STOP — Gem Stone Jewellery closure report complete. Owner review required. No next batch started.**
