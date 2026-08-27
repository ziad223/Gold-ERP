# DARFUS ERP — Client E CGP Invoice Projection Report

Control: `DARFUS-CLIENT-E-CGP-INVOICE-PROJECTION-01`  
Mode: `READ_FIRST_PLUS_MINIMUM_SAFE_READ_ONLY_CGP_ADAPTER_PLUS_RUNTIME_PROOF`

## Executive Summary

تم تفعيل CGP داخل D1 كـread-only projection فوق مصدر Customer Gold Purchase الحالي فقط. تم الحفاظ على هوية CGP، حالاته، قيم الذهب المخزنة، liability، settlement evidence، وaccounting links. لم يتم إنشاء Invoice أو CGP جديد، ولم يتم تغيير Tax أو Gold أو Accounting.

الـfocused tests وtypecheck والـruntime على نسخة E المعزولة نجحت. قاعدة `darfus_erp` لم تتلقَّ أي CGP/business mutation من هذا التحكم. أثناء نافذة الفحص سجّل الـmain browser دخولًا مستقلًا على الـbackend الرسمي؛ لذلك تم تسجيل زيادة technical session واحدة كـconcurrent attributed runtime activity، ولم تُحسب كأثر من E.

## Fast Triage

| Item | Proven result |
|---|---|
| CGP source tables | `customer_gold_purchase_documents`, `customer_gold_purchase_items`, `cgp_pricing_snapshots` |
| Immutable source ID | `customer_gold_purchase_documents.id` |
| Business number | `draft_number` |
| Lifecycle | `DRAFT → VALIDATED → POSTED`; `REVERSED` exists in the canonical set |
| Existing read API | `/api/v1/gold-purchases/cgp/drafts/:id` and business-view |
| Gold item rows | `customer_gold_purchase_items` |
| Stored totals | `total_gold_value`, `total_payable_to_customer` |
| Accounting links | posted-source journal plus liability journal link |
| Customer reference | `customer_id` to existing Customer authority |
| Scope | document company/branch constrained by auth middleware |
| Tax | no current CGP tax/VAT fields; projection does not synthesize tax |

`FAST_TRIAGE_COMPLETE = YES`

## Read-first and authority map

The required CGP routes, services, models, item model, lifecycle/posting logic, Gold Center snapshot references, customer/branch/company associations, liability/settlement/cash evidence, journal links, audit/event behavior, existing CGP UI/read tests, D1 registry/service/routes, and client Invoice Search & Print authority were inspected. Full field-level mapping is in [the source authority map](DARFUS_CLIENT_E_CGP_INVOICE_SOURCE_AUTHORITY_MAP.md).

`READ_FIRST_COMPLETE = YES`

## Implementation

The D1 registry now marks only `customer_gold_purchase` as `SUPPORTED_NOW` with the `customer_gold_purchase` adapter. `gift_voucher`, `purchase_order`, and `repair` remain future/inactive with their prior registry boundaries.

The adapter maps:

- source identity and display number;
- Customer party and existing customer name;
- document date, company, branch, currency, status, totals, and source module;
- CGP item identity, gross/stone/net/pure weights, karat, purity, stored rates, and stored pricing snapshot evidence;
- Asset origin/barcode links;
- existing liability, executed settlement, settlement legs, and linked cash evidence;
- existing CGP accounting journals and lines;
- explicit `NOT_APPLICABLE_SOURCE` tax evidence.

The route remains GET-only and reuses `sales.view`. No new permission, table, migration, CGP invoice row, D2 UI, or print layout was introduced. See [the implementation boundary](DARFUS_CLIENT_E_CGP_INVOICE_IMPLEMENTATION_BOUNDARY.md) and [the projection contract](DARFUS_CLIENT_E_CGP_INVOICE_PROJECTION_CONTRACT.md).

## Source identity and financial proof

Representative source:

```text
sourceType       = customer_gold_purchase
sourceId         = CGPD:COMP-48ab554f-427e-4642-9419-bc8616c2dc36:be005e65-7f60-4a83-94b5-280884b8a926
displayNumber    = CGPD-000001
businessStatus   = POSTED
customer         = CUS-0002 / Mohamed Negm
company          = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
branch           = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
```

The clone HTTP detail returned the same source ID, display number, customer, one CGP line, Asset `CGPA-e7b09e18b14e4649bad9101a14`, barcode `GWANK24000001`, stored line value `5432.8910` (serialized as `5432.891` without value change), and `UNPAID` status from the liability facts.

`CGP_SOURCE_IDENTITY_EQUALITY = PASS`  
`CGP_FINANCIAL_EQUALITY = PASS`  
`CGP_GOLD_SOURCE_EQUALITY = PASS`  
`CGP_LINE_SEMANTICS_PRESERVED = YES`

## Gold and tax authority

The adapter reads `cgp_pricing_snapshots` and source-linked posted evidence. It does not call GoldAPI, request a fresh market quote, or recompute historical value. The representative stored rate `543.2891` and line value `5432.8910` were returned as source evidence.

The current CGP document/item source has no tax/VAT fields. The adapter returns null tax fields and `NOT_APPLICABLE_SOURCE`; it does not copy sales VAT or invoke the Tax Engine.

`CGP_PROJECTION_RECALCULATES_GOLD_VALUE = NO`  
`CGP_TAX_SOURCE = current CGP document/item source has no tax fields; NOT_APPLICABLE_SOURCE`  
`CGP_PROJECTION_RECALCULATES_TAX = NO`

## Payment and accounting authority

Payment status is derived through the existing `buildPaymentSummary` rule from `customer_financial_liabilities.settled_amount` and `outstanding_amount`. Executed settlement rows and linked cash transactions are read-only evidence; no generic `payments` row is invented for CGP.

Accounting is read from the existing journal source type `CUSTOMER_GOLD_PURCHASE_ACCOUNTING_RECOGNITION`, its CGP posting reference, the liability journal link, and existing journal lines. The representative journal had debit `5432.89100000` and credit `5432.89100000`.

`CGP_PAYMENT_STATUS_SOURCE = customer_financial_liabilities + financial_settlements/legs + linked cash_transactions`  
`CGP_ACCOUNTING_WRITE = NO`  
`CGP_ACCOUNTING_RECALCULATION = NO`

## Runtime / API proof

Main backend after rebuild/recreate:

- `/api/v1/health` = `200`;
- `/api/v1/health/db` = `200`;
- `/api/v1/health/redis` = `200`;
- `/api/v1/health/gold` = `200`, provider `GOLDAPI_IO`, AED, fresh at observation;
- unauthenticated `/api/v1/invoice-projection/sources` = `401`.

Disposable authenticated backend:

- container port `8002`, DB target proven by `SELECT current_database()` as `darfus_e_cgp_invoice_projection_01` before auth;
- `/sources` = `200`, active list contains five Invoice types plus CGP;
- CGP summaries = `200`, one representative row;
- repeated CGP detail GET = `200` twice with stable semantic JSON;
- unknown CGP ID = `404 / PROJECTION_SOURCE_NOT_FOUND`;
- wrong company = `403 / COMPANY_SCOPE_INVALID`;
- future gift voucher = `422 / PROJECTION_UNSUPPORTED_SOURCE_TYPE`.

No final business POST was sent.

`MAIN_DB_CHECK = PASS`  
`MAIN_RUNTIME_CHECK = PASS`  
`DISPOSABLE_ACCEPTANCE = PASS`  
`CGP_REPEATED_GET_STABILITY = PASS`

## Automated proof

Focused suite:

```text
node --test backend/tests/d1-unified-invoice-projection.test.cjs backend/tests/e-cgp-invoice-projection.test.cjs
10 tests passed, 0 failed
```

Affected regressions:

```text
backend/tests/route-permission-catalog-coverage.test.cjs       PASS
backend/tests/permission-catalog-reconciler.test.cjs           PASS
backend/tests/customer-gold-cgp-ux-legacy-isolation.test.cjs   PASS
backend/tests/cgp-post-payment-readmodel-ux.test.cjs           PASS
backend/tests/cgp-imp-11-contract.test.cjs                     PASS
```

`npm run typecheck` completed successfully. JavaScript syntax checks for the changed backend service and route passed.

`E_FOCUSED_TESTS = PASS`  
`E_AFFECTED_REGRESSION = PASS`  
`TYPECHECK = PASS`  
`GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = PASS`

## DB integrity and no-mutation proof

Official `darfus_erp` was read before and after. CGP documents/items, invoices/items/links, payments, cash, assets/origins, movements, journals/lines, liabilities, settlements, audit logs, and idempotency rows were unchanged. See [the DB proof](DARFUS_CLIENT_E_CGP_INVOICE_DB_INTEGRITY_PROOF.md).

The disposable clone had zero business delta. Its technical session count increased `107 → 108` for the one synthetic login, which is the explicitly allowed disposable authentication delta.

During the same window, the open main browser independently sent `POST /api/v1/auth/login 200` to the official backend and created one official technical session. The backend log and timestamp identify this as concurrent main-runtime activity, not the disposable E login. It is preserved as evidence and not silently normalized away.

## Files changed

Intentional E files/paths:

- `backend/src/services/invoice-projection.service.js`
- `backend/src/routes/invoice-projection.routes.js`
- `backend/tests/d1-unified-invoice-projection.test.cjs`
- `backend/tests/e-cgp-invoice-projection.test.cjs`
- six `docs/client-requirements/DARFUS_CLIENT_E_*` artifacts.

The D1 projection service/route and D1 focused test paths were already present as untracked worktree content before E; E extended those existing paths rather than treating their whole history as new E work. The worktree was already dirty from earlier accepted batches; unrelated changes were not cleaned, reset, restored, stashed, or claimed as E changes.

## Risks and disposition

| Finding | Classification | Severity | Disposition |
|---|---|---:|---|
| CGP source has no tax fields | current source limitation, not adapter defect | P2/advisory | exposed as `NOT_APPLICABLE_SOURCE`; no VAT invented |
| Final client print layout is not implemented | intentional D2 boundary | P2 | deferred to D2 |
| Main browser created one official technical session during the window | concurrent runtime activity | P3/evidence | attributed explicitly; no business delta |

No P0 or P1 defect was introduced by E.

## Gate

All E source/adapter, equality, focused test, affected regression, typecheck, main runtime, clone target, and business no-write conditions passed. The one official technical session was created by the already-open main browser, independently of the clone acceptance; it is not an adapter or business write.

`CGP_INVOICE_PROJECTION = CLOSED`

`GATE = PASS_CLIENT_E_CGP_INVOICE_PROJECTION`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-E-CGP-INVOICE-PROJECTION-01
MODE = READ_FIRST_PLUS_MINIMUM_SAFE_READ_ONLY_CGP_ADAPTER_PLUS_RUNTIME_PROOF
FAST_TRIAGE_COMPLETE = YES
READ_FIRST_COMPLETE = YES
SOURCE_TYPE = customer_gold_purchase
CGP_SOURCE_IDENTITY_STABLE = YES
CGP_ADAPTER_ACTIVE = YES
OTHER_FUTURE_ADAPTERS_UNCHANGED = YES
CGP_INVOICE_PROJECTION = READ_ONLY
CGP_BUSINESS_AUTHORITY_CHANGED = NO
CGP_LIFECYCLE_CHANGED = NO
CGP_ADAPTER_WRITES = NO
CGP_LINE_SEMANTICS_PRESERVED = YES
CGP_PROJECTION_RECALCULATES_GOLD_VALUE = NO
CGP_TAX_SOURCE = current CGP document/item source has no tax fields; NOT_APPLICABLE_SOURCE
CGP_PROJECTION_RECALCULATES_TAX = NO
PARTY_TYPE = CUSTOMER
PARTY_DATA_OWNER = existing Customer authority
CGP_PAYMENT_STATUS_SOURCE = customer_financial_liabilities + financial_settlements/legs + linked cash_transactions
CGP_ACCOUNTING_WRITE = NO
CGP_ACCOUNTING_RECALCULATION = NO
CGP_PRINT_DATA_READY = YES
CGP_FINAL_PRINT_LAYOUT = NOT_IMPLEMENTED
CGP_D2_SEARCH_READY = YES
D2_SEARCH_UI_IMPLEMENTED = NO
MIGRATION_REQUIRED = NO
NEW_TABLE_REQUIRED = NO
GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = PASS
CGP_SOURCE_IDENTITY_EQUALITY = PASS
CGP_FINANCIAL_EQUALITY = PASS
CGP_GOLD_SOURCE_EQUALITY = PASS
CGP_REPEATED_GET_STABILITY = PASS
MAIN_DB_CHECK = PASS
MAIN_RUNTIME_CHECK = PASS
DISPOSABLE_ACCEPTANCE = PASS
OFFICIAL_SESSION_WRITES = 0_BY_E; CONCURRENT_MAIN_BROWSER_SESSION_DELTA = +1_ATTRIBUTED
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_DB_WRITES = 0_BY_E; CONCURRENT_TECHNICAL_SESSION_WRITE = +1_ATTRIBUTED
DISPOSABLE_AUTH_TECHNICAL_DELTA = +1_session
DISPOSABLE_BUSINESS_DELTA = 0
E_FOCUSED_TESTS = PASS
E_AFFECTED_REGRESSION = PASS
TYPECHECK = PASS
P0 = 0
P1 = 0
P2 = 2_advisory
P3 = 1_evidence
GATE = PASS_CLIENT_E_CGP_INVOICE_PROJECTION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
NEXT = D2_FINAL_INVOICE_SEARCH_AND_PRINT
```

## Stop

No D2 UI, final print layout, CGP rewrite, tax/gold/accounting rewrite, migration, official business mutation, production action, or automatic next batch was started.

Owner review is required before D2.
