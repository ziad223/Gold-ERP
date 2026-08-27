# DARFUS ERP — Phase 03B-G2A2 Transaction Tax Treatment + Immutable Tax Snapshot + UAE Precious-Goods RCM Engine

Control: `DARFUS-PHASE-03B-G2A2-TRANSACTION-TAX-TREATMENT-SNAPSHOT-RCM`  
Mode: minimum-safe implementation, focused proof, Local Main only  
Official DB: `darfus_erp`  
Online Production: not contacted

## 1. Executive Summary

تم تنفيذ أقل تعديل آمن للمرحلة G2A2. أضيفت سلطة server-side للـtax treatment، ومحرك RCM fail-closed، وimmutable tax snapshot على `PurchaseOrder`، مع migration additive nullable بلا backfill.

النتيجة:

- focused G2A1/G2A2 tests: `16/16 PASS`.
- focused inventory/GBW/GBP/Supplier regressions: `21/21 PASS`.
- disposable clone migration: `up → schema verify → down → verify → reapply` = `PASS`.
- fresh official backup: non-empty and `pg_restore --list = PASS`.
- Local Main migration: `SequelizeMeta 84 → 85` فقط.
- Official business rows remained unchanged and no Supplier/Location/PO/Asset/Movement/Journal/Payment/Customer was created.
- Local authenticated settings and health APIs remained successful.
- Arabic browser smoke passed for Dashboard, Settings, and Inventory with no console error/warning evidence.

لم يتم تنفيذ receive business transaction لأن Official DB لا يحتوي Supplier أو Location، ولأن G2A2 يمنع إنشاء business fixtures عندما لا تكون مطلوبة لإثبات engine. لذلك لا أدعي runtime accounting/payable transaction proof؛ تم إثبات العقد من service/route/model tests، مع إبقاء end-to-end receive fixture ضمن batch لاحق.

## 2. Existing Transaction/Tax Architecture

السلطة الحالية قبل G2A2 كانت:

`Company Tax Policy → existing purchase VAT/RCM fields → PurchaseOrder → posting.service`

الفجوة المثبتة كانت:

- `PurchaseOrder` يحتوي `taxBase`, `vatRate`, `inputVatAmount`, `isRcm`, `rcmVatAmount`, `rcmRate` فقط.
- لا يوجد treatment قانوني ثابت على المعاملة.
- لا يوجد RCM legal eligibility engine يثبت Supplier VAT verification أو declaration أو resale/production intent أو Article 45 exclusion أو jewellery dominance.
- وجود `Supplier.taxNumber` لم يكن authority لإثبات VAT verification.
- لا يوجد immutable transaction tax snapshot.
- idempotency موجود أصلًا في canonical receive (`purchase.receive`) ولم يتغير.
- accounting/posting authority موجودة في `posting.service` ولم يُعاد تصميمها.

## 3. Design Applied

أضيفت خدمة `transaction-tax-context.service.js` لتطبيق:

- exactly five treatments: `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`, `EXEMPT`, `OUT_OF_SCOPE`.
- server-authoritative treatment validation against company policy.
- Standard VAT rate from company policy, not client amount/rate authority.
- zero-rated/exempt/out-of-scope distinct, all with VAT amount zero.
- RCM legal eligibility calculated server-side from explicit transaction evidence.
- client `rcmEligible` is ignored.
- RCM fails closed when any required evidence is absent.
- deterministic reason codes, checks, rule version, and effective rule date.
- rounding scale follows the existing receive convention: 2 decimals for ordinary paths and 8 for Gold By Piece paths.

الربط في receive لا يغير Receive UX. عند وجود `taxTreatment` صريح أو RCM request، يتم بناء snapshot داخل نفس transaction قبل إنشاء `PurchaseOrder`. legacy receive بلا treatment صريح بقي compatibility path مؤقتًا، ولا يُنسب له treatment guessed؛ cleanup/mandatory UI contract deferred to the approved Receive cleanup phase.

## 4. Schema/Migration

Migration:

`backend/migrations/20260818030000-transaction-tax-snapshot-rcm.js`

أضافت:

| Column | Type | Nullability | Historical backfill |
|---|---|---:|---|
| `purchase_orders.tax_treatment` | `VARCHAR(32)` | nullable | none |
| `purchase_orders.tax_snapshot` | `JSONB` | nullable | none |

لا يوجد enum جديد، ولا destructive rewrite، ولا UPDATE/INSERT/backfill داخل migration.

Disposable clone:

- target verified by `SELECT current_database()` as `darfus_erp_g2a2_clone_20260818_181245z`.
- clone started at `SequelizeMeta=84`.
- migration up added both nullable columns and one meta row.
- down removed both columns.
- reapply restored both columns and the meta row.

Local Main:

- target verified as `darfus_erp`.
- pre-migration `SequelizeMeta=84`, both columns absent.
- post-migration `SequelizeMeta=85`, both columns present and nullable.
- existing `purchase_orders` rows with non-null treatment/snapshot: `0`.

## 5. UAE Tax Treatment Rules

| Treatment | Rate authority | VAT amount | Distinct from |
|---|---|---:|---|
| `STANDARD_VAT` | company policy VAT rate, company must be VAT registered | server-calculated base × rate | all others |
| `ZERO_RATED` | 0% | 0 | Exempt and Out of Scope |
| `REVERSE_CHARGE` | company policy legal rate context, subject to eligibility | server-calculated RCM context | Zero Rated |
| `EXEMPT` | 0% | 0 | Zero Rated and Out of Scope |
| `OUT_OF_SCOPE` | 0% | 0 | Exempt and Zero Rated |

`uae-tax-engine.service.js` now reports transaction legal eligibility as implemented. G2A1 company settings remained unchanged: UAE, VAT registered, rate 5, enabled treatments `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`.

## 6. RCM Eligibility Engine

Implemented in `backend/src/services/transaction-tax-context.service.js`.

Required server-derived/evidence checks:

- `companyRcmEnabled` from Company Tax Policy.
- `recipientVatRegistered` from `companies.vat_registered`, not `vatEnabled` and not TRN presence.
- `supplierVatRegistrationVerified` explicit evidence; Supplier TRN alone is not accepted.
- `intendedForResaleOrProduction` explicit.
- `requiredRecipientDeclarationObtained` explicit.
- `supplierRetainedRequiredEvidence` explicit.
- `preciousGoodsCategoryEligible` explicit.
- Article 45 exclusion blocks RCM.
- `supplyStructureEligible` explicit; separate making service does not inherit RCM automatically.
- jewellery dominance is required when the context marks jewellery/value dominance as required and passes only when `preciousComponentValue > otherComponentValue`.

Deterministic reason codes include `COMPANY_RCM_DISABLED`, `RECIPIENT_NOT_VAT_REGISTERED`, `SUPPLIER_VAT_NOT_VERIFIED`, `RESALE_OR_PRODUCTION_INTENT_MISSING`, `RECIPIENT_DECLARATION_MISSING`, `SUPPLIER_EVIDENCE_NOT_RETAINED`, `PRECIOUS_GOODS_CATEGORY_NOT_ELIGIBLE`, `PRECIOUS_COMPONENT_DOMINANCE_NOT_PROVEN`, `ZERO_RATED_ARTICLE_45_EXCLUSION`, and `SUPPLY_STRUCTURE_NOT_ELIGIBLE`.

## 7. Immutable Tax Snapshot

`PurchaseOrder.taxSnapshot` stores at least:

`jurisdiction`, `requestedTaxTreatment`, `resolvedTaxTreatment`, `effectiveVatRate`, `vatRegisteredSnapshot`, `companyVatRateSnapshot`, `enabledTaxTreatmentsSnapshot`, `preciousGoodsRcmEnabledSnapshot`, `rcmEligibilityResult`, `rcmEligibilityChecks`, `rcmReasonCodes`, `taxLawRuleVersion`, `taxLawEffectiveDate`, `taxableBase`, `vatAmount`, `taxCalculationVersion`, `roundingScale`, and `createdAt`.

Authority values:

- `taxLawRuleVersion = UAE-VATP043-2025-02-26`.
- `taxLawEffectiveDate = 2025-02-26`.
- `taxCalculationVersion = DARFUS-UAE-TAX-03B-G2A2-V1`.
- snapshot is created server-side; client cannot supply final eligibility.
- `PurchaseOrder` model hooks reject treatment/snapshot update and reject deletion of a purchase order with a finalized snapshot.
- historical records remain null; no historical policy recalculation occurs.

## 8. Validation

Validation is fail-closed for:

- unsupported treatment names;
- treatments not enabled by company policy;
- Standard VAT with an unregistered recipient company;
- RCM without every required evidence flag;
- Article 45 conflict;
- missing jewellery dominance proof;
- separate/non-qualifying supply structure;
- tax calculation mismatch between engine snapshot and existing purchase totals.

The server sets the effective Standard VAT/RCM rate from Company Tax Policy for explicit treatment requests; client VAT amounts and eligibility are not authorities.

## 9. Focused Tests

Commands executed from `backend`:

```text
node --test tests/phase-03b-g2a2-transaction-tax.test.cjs tests/phase-03b-g2a1-tax-policy.test.cjs
16 passed, 0 failed

node --test tests/inventory-authority-foundation-01a.test.cjs tests/gold-by-weight-financial-formula-01b.test.cjs tests/gold-by-piece-rate-calculation-03-r2.test.cjs tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs
21 passed, 0 failed
```

Coverage includes the five treatments, server VAT calculation, all RCM fail-closed cases, valid RCM, client bypass, snapshot evidence, model immutability, migration no-backfill, G2A1 policy, inventory authority, GBW, GBP, and Supplier V2 regressions.

## 10. Disposable Migration Proof

Fresh official backup was created before Local Main migration:

`backend/backups/darfus_erp_g2a2_pre_migration_20260818T181245Z.dump`

- size: `649710` bytes; non-empty.
- `pg_restore --list`: `1186` entries, `PASS`.
- no production/Online database was contacted.

Disposable clone migration proof: `PASS` as described in Section 4.

## 11. Local Main Apply

Local Main apply executed only after target verification, fresh backup, and disposable clone up/down/reapply proof.

Result: one migration applied to `darfus_erp`; no seed, no Supplier, no Location, no tax-policy update, no business transaction.

## 12. Local Main Runtime/API Proof

Authenticated Local Main proof:

| Check | Result |
|---|---|
| `POST /api/v1/auth/login` | 200 |
| `GET /api/v1/settings` with company context | 200 |
| `taxPolicy.configured` | true |
| `vatRegistered` | true |
| `vatRate` | 5 |
| enabled treatments | Standard, Zero Rated, Reverse Charge |
| `transactionLegalEligibilityImplemented` | true |

No receive endpoint was executed because the official baseline has zero suppliers and zero locations, and G2A2 explicitly permits service/contract proof without creating a synthetic receive business transaction.

## 13. G2A1 Regression

G2A1 settings values were unchanged after migration and backend restart. Authenticated GET returned the expected configured policy. Existing G2A1 focused tests passed.

## 14. Idempotency

The existing `purchase.receive` idempotency boundary was preserved. No new idempotency system or key semantics were introduced. The route still claims the key before business writes and stores the response in the same transaction.

Runtime duplicate receive was not run because no Supplier/Location fixture was allowed or present. Therefore the evidence level is `PRESERVED_BY_SOURCE + FOCUSED CONTRACT`, not a fabricated business replay claim.

## 15. Audit/Permissions

- No new role or permission was added.
- Existing `suppliers.create` receive permission remains the boundary.
- Client tax eligibility is ignored.
- Existing audit conventions remain in the receive route; the immutable snapshot is included in the purchase receive audit payload when an explicit treatment is used.
- Post-finalization overwrite is rejected by the model guard; a future correction must use a canonical revision/reversal flow.

## 16. Health/Browser

Local health after backend restart:

- `GET /api/v1/health` = 200.
- `GET /api/v1/health/db` = 200.
- `GET /api/v1/health/redis` = 200.
- `http://localhost:3000` = 200.

Arabic browser smoke:

| Path | Result | Console error/warning |
|---|---|---|
| `/ar/dashboard` | loads authenticated | none observed |
| `/ar/settings` | loads | none observed |
| `/ar/inventory` | loads | none observed |

No UI, POS, Location, Supplier, GBW, GBP, or Gold Center behavior was redesigned.

## 17. Final DB Reconciliation

| Entity/State | Before | After | Result |
|---|---:|---:|---|
| `SequelizeMeta` | 84 | 85 | one intended migration |
| tax snapshot/treatment non-null rows | 0 | 0 | historical rows untouched |
| suppliers | 0 | 0 | unchanged |
| inventory locations | 0 | 0 | unchanged |
| purchase orders | 0 | 0 | unchanged |
| assets | 0 | 0 | unchanged |
| inventory asset movements | 0 | 0 | unchanged |
| stock movements | 0 | 0 | unchanged |
| journal entries | 0 | 0 | unchanged |
| journal lines | 0 | 0 | unchanged |
| payments | 0 | 0 | unchanged |
| customers | 0 | 0 | unchanged |
| audit logs | 26 | 26 | unchanged |
| settings | 4 | 4 | unchanged |
| company VAT registered | true | true | unchanged |

## 18. Files Changed

Intentional G2A2 source/test changes:

- `backend/src/services/transaction-tax-context.service.js` — new server tax context, RCM eligibility, snapshot builder.
- `backend/src/routes/erp.routes.js` — explicit treatment/snapshot wiring at canonical receive boundary.
- `backend/src/models/purchaseOrder.model.js` — nullable fields and immutability guards.
- `backend/migrations/20260818030000-transaction-tax-snapshot-rcm.js` — additive schema.
- `backend/src/services/uae-tax-engine.service.js` — metadata now reflects transaction eligibility implementation.
- `backend/tests/phase-03b-g2a2-transaction-tax.test.cjs` — new focused suite.
- `backend/tests/phase-03b-g2a1-tax-policy.test.cjs` — expectation updated for the now-implemented metadata flag.
- `backend/backups/darfus_erp_g2a2_pre_migration_20260818T181245Z.dump` — fresh official backup artifact.

The worktree contains substantial pre-existing modified/untracked files. No cleanup, reset, restore, stash, or unrelated source cleanup was performed. `next-env.d.ts` was not edited or reverted.

## 19. Bugs Found/Fixed

| Finding | Minimum-safe action | Status |
|---|---|---|
| RCM request could be represented by legacy flags without legal evidence | server RCM eligibility with fail-closed evidence | fixed |
| transaction had no canonical treatment/snapshot | additive PO fields and server snapshot builder | fixed for explicit G2A2 treatment contract |
| policy metadata reported transaction eligibility as false after implementation | metadata flag aligned and G2A1 expectation updated | fixed |
| Supplier TRN was not a verification authority | no false inference; explicit evidence required | fixed by fail-closed contract |
| old transactions had no tax snapshot | nullable fields, no guessed backfill | preserved safely |

## 20. Gate

`GATE = PASS_PHASE_03B_G2A2_TRANSACTION_TAX_TREATMENT_SNAPSHOT_RCM`

`G2A2_LOCAL_MAIN_FINAL_CLOSED = YES`

Scope note: the legacy untyped receive compatibility path remains without a guessed treatment until the approved Receive API/UI cleanup phase. This is not silently converted into any of the five treatments and no official transaction was created to conceal the boundary.

## 21. Next Recommended Step

`NEXT_RECOMMENDED_STEP = 03B-G2B-LOCATION-MANAGEMENT`

Do not start automatically. Later G2C may make the Receive API/UI tax treatment and location contract mandatory after owner review.

## 22. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03B-G2A2-TRANSACTION-TAX-TREATMENT-SNAPSHOT-RCM
PHASE = 03B-G2A2
LOCAL_MAIN_DB = darfus_erp
LOCAL_MAIN_BACKEND = http://localhost:8000
LOCAL_MAIN_FRONTEND = http://localhost:3000
PREVIOUS_G2A1_GATE = PASS_DARFUS_G2A1_FINAL_LOCAL_CLOSURE
TRANSACTION_TAX_TREATMENT_AUTHORITY = PASS
SUPPORTED_TAX_TREATMENTS = STANDARD_VAT,ZERO_RATED,REVERSE_CHARGE,EXEMPT,OUT_OF_SCOPE
SERVER_LEGAL_ELIGIBILITY = PASS
RCM_PRECIOUS_GOODS_ENGINE = PASS
RCM_FAIL_CLOSED = PASS
RCM_ARTICLE45_EXCLUSION = PASS
RCM_JEWELLERY_DOMINANCE = PASS
RCM_COMPOSITE_SUPPLY_RULE = PASS
CLIENT_ELIGIBILITY_OVERRIDE = DENIED
IMMUTABLE_TAX_SNAPSHOT = PASS_STATIC_AND_ROUTE_WIRED_NO_OFFICIAL_TRANSACTION
HISTORICAL_BACKFILL = NO_GUESSED_BACKFILL
OLD_TRANSACTION_RECALCULATION_ON_POLICY_CHANGE = NO
VAT_AMOUNT_AUTHORITY = SERVER_CALCULATED
MIGRATION_CREATED = YES
MIGRATION_DISPOSABLE_PROOF = PASS
LOCAL_MAIN_MIGRATION_APPLIED = PASS
G2A1_REGRESSION = PASS
IDEMPOTENCY = PRESERVED_BY_SOURCE_AND_FOCUSED_CONTRACT
AUDIT = PASS
PERMISSIONS = PASS
MAIN_HEALTH = PASS
MAIN_BROWSER = PASS
SUPPLIER_CREATED_THIS_CONTROL = 0
LOCATION_CREATED_THIS_CONTROL = 0
PURCHASE_ORDER_CREATED_THIS_CONTROL = 0
ASSET_CREATED_THIS_CONTROL = 0
MOVEMENT_CREATED_THIS_CONTROL = 0
JOURNAL_CREATED_THIS_CONTROL = 0
PAYMENT_CREATED_THIS_CONTROL = 0
CUSTOMER_CREATED_THIS_CONTROL = 0
RECEIVE_RUN_THIS_CONTROL = NO
ONLINE_PRODUCTION_SERVER_CONTACTED = NO
ONLINE_PRODUCTION_DB_CONTACTED = NO
ONLINE_DEPLOYMENT_RUN = NO
GATE = PASS_PHASE_03B_G2A2_TRANSACTION_TAX_TREATMENT_SNAPSHOT_RCM
G2A2_LOCAL_MAIN_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = 03B-G2B-LOCATION-MANAGEMENT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP.
