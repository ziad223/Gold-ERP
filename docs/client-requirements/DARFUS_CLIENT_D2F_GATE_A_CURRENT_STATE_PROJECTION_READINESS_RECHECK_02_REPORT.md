# DARFUS ERP — D2F Gate A Current-State Projection Readiness Recheck

## 1. Executive Summary

تم تنفيذ هذا الـControl قراءةً فقط لإعادة تقييم D2F Gate A بعد أعمال Gift Voucher اللاحقة. النتيجة ليست PASS: الأدلة اللاحقة تثبت عقد Gift Voucher المالي ومسارًا رسميًا مسمى، لكنها لا تثبت أن Gift Voucher أصبح مصدرًا نشطًا داخل D1/D2F عبر read-only projection adapter.

الدليل الحاسم من المصدر الحالي:

- `backend/src/services/invoice-projection.service.js:16` يعرّف المصادر النشطة كخمسة Invoice types و`customer_gold_purchase` فقط.
- `backend/src/services/invoice-projection.service.js:87-99` يعرّف `gift_voucher` كـ`SUPPORTED_LATER` مع `adapter: null` و`canViewDetail: false` و`canPrint: false`.
- `features/sales/hooks/use-invoice-search-print.ts:11` لا يضمّن `gift_voucher` في أنواع البحث.
- `app/[locale]/(dashboard)/sales/search-print/page.tsx:402-404` يعرض أن Gift Voucher غير مفعّل حتى اعتماد عقد الإسقاط.
- اختبار D2 الحالي يثبت عمدًا أن عائلات Invoice المستقبلية تبقى غير نشطة؛ مرّ الاختبار، لكنه لا يثبت Gate A projection readiness.

لذلك:

```text
GATE_A = BLOCKED_PROJECTION_AUTHORITY_NOT_READY
ROOT_CAUSE = Gift Voucher projection adapter/registry activation is not implemented in current source
MISSING_PROOF = active read-only search/detail/print projection for gift_voucher
CURRENT_RISK = D2F cannot honestly claim Gift Voucher invoice parity or proceed to Gates B/C/D
```

لم يحدث أي تعديل على المصدر أو الاختبارات أو الإعدادات أو قاعدة البيانات، ولم يُرسل أي POST/PUT/PATCH/DELETE أو Print mutation أو Voucher operation.

## 2. Historical Gate A Result

النتيجة التاريخية محفوظة ولم تُكتب فوقها:

`DARFUS_CLIENT_D2F_GATE_A_GIFT_VOUCHER_INHERITANCE_REENTRY_01_REPORT.md`

```text
HISTORICAL_GATE_A = BLOCKED_FINANCIAL_AUTHORITY_UNRESOLVED
```

التقرير التاريخي أثبت أن العوائق كانت تشمل العملة، الضريبة الخاصة، branch/company authority، payment/redemption linkage، liability/accounting، display identity، وprint/projection authority. هذه النتيجة لا تُعتبر الحالة الحالية تلقائيًا؛ تمت مقارنتها بالأدلة الأحدث أدناه.

## 3. Later Gift Voucher Evidence Chain

### 3.1 سلسلة الأدلة المقروءة

| المرحلة | الدليل الحالي | النتيجة |
|---|---|---|
| Business contract / full redemption | `DARFUS_GIFT_VOUCHER_FULL_REDEMPTION_CONTRACT_CORRECTION_01_REPORT.md` وملفات العقد | full redemption، one-time، no partial redemption |
| Schema/design | `DARFUS_GIFT_VOUCHER_SCHEMA_*` وmigration `20260827010000-gift-voucher-purchased-foundation.js` | schema/runtime foundation موجود حسب التقارير اللاحقة |
| Disposable rehearsal | Gift Voucher migration/acceptance artifacts | clone-only rehearsal evidence موجود؛ لا ينشئ صلاحية official mutation هنا |
| Financial authority | `DARFUS_D2F_GV_FINANCIAL_AUTHORITY_CLOSURE_01_REPORT.md` | policy authority مغلقة؛ implementation/projection لم تكن مغلقة في التقرير نفسه |
| Mapping recovery | `DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md` وrelated reports | mapping لمسار named أصبح مثبتًا؛ الوقاية الدائمة منفصلة ومفتوحة |
| Official named E2E | `DARFUS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000_01_REPORT.md` | one named issue + activation + full POS redemption PASS |
| Payment integration | `backend/src/services/gift-voucher.service.js` و`erp.routes.js` | voucher settlement يمر عبر canonical POS/payment boundary |
| Tax integration | official E2E report + current source policy | Voucher issue بلا output VAT؛ Sales Invoice يملك VAT عند redemption |
| Accounting/Treasury | official E2E report + mapping reports | liability/treasury path مثبت للمسار المسمى |
| Audit/idempotency/security | reports/tests/source | command guards وidempotency/audit boundaries مثبتة للمسار المقبول |
| Voucher print/reprint | `gift_voucher_print_events` model/routes/UI | voucher-specific print event موجود؛ لا يساوي D2F invoice projection print |
| Unified projection | current `invoice-projection.service.js` and D2 UI | Gift Voucher غير نشط؛ adapter غير موجود |

### 3.2 Chain status

```text
LATEST_GIFT_VOUCHER_EVIDENCE_CHAIN = COMPLETE_FOR_GIFT_VOUCHER_BUSINESS_AND_NAMED_E2E
GIFT_VOUCHER_PROJECTION_EVIDENCE = INCOMPLETE
```

السلسلة ليست ناقصة من ناحية أن تقارير Gift Voucher اللاحقة مفقودة؛ هي ناقصة تحديدًا في نقطة D2F التي يعيد هذا Control فحصها: adapter/search/detail/print projection النشط.

## 4. Client Authority Recheck

تمت مطابقة authority المتخصصة مع العقود والتقارير المقبولة، مع بقاء Gift Voucher المتخصص أعلى من Deposit ثم Sales عند التعارض:

| Authority | Current result | Evidence |
|---|---|---|
| Independent stored value | PROVEN | Gift Voucher contract/financial policy |
| Full redemption only | PROVEN | contract tests + service guard |
| One-time redemption | PROVEN | contract tests + official named E2E |
| Partial redemption forbidden | PROVEN | contract tests/service validation |
| Payment Engine owns allocation | PROVEN | settlement preparation in `gift-voucher.service.js` and sale route |
| Voucher Engine owns lifecycle | PROVEN | issue/activate/settlement service |
| Sales Invoice owns revenue/VAT/inventory/COGS | PRESERVED | official E2E and posting boundary |
| Duplicate financial authority | NO | no generic Invoice posting owner for Voucher found |
| Anonymous issuance behavior | PROVEN_BY_CONTRACT | specialized contract allows optional customer |

القواعد أعلاه لا تمنح permission تلقائيًا لتفعيل Gift Voucher في unified Invoice projection؛ هذا عقد منفصل يحتاج adapter read-only مثبتًا.

## 5. Historical Blocker Supersession Matrix

| Historical blocker | Old state | Later evidence | Current state | Classification / proof |
|---|---|---|---|---|
| Durable voucher identity | غير مثبت بالكامل | schema + official E2E يحتفظان بـid/code/number | RESOLVED_BY_LATER_EVIDENCE | DB schema وواجهة Gift Voucher تعرضان رقمًا وكودًا ثابتين |
| Code uniqueness / immutability | gap تاريخي | foundation tests/migration guard + official rows | RESOLVED_BY_LATER_EVIDENCE | `gift-vouchers` contract tests وunique identity boundary |
| Business display number | غير منفصل تاريخيًا | `voucher_number` موجود ومستخدم في UI/print | RESOLVED_BY_LATER_EVIDENCE | current DB column/UI snapshot |
| Currency authority | غير مثبت | company settings + official E2E AED | RESOLVED_BY_LATER_EVIDENCE | official E2E + current model currency |
| Company scope | غير مثبت | route queries by `companyId` | RESOLVED_BY_LATER_EVIDENCE | `erp.routes.js:16449-16475` |
| Branch restriction authority | غير مثبت | issue/activation resolves authorized branch; eligibility model exists | PARTIALLY_RESOLVED | current `gift_voucher_branch_eligibilities` count is 0; mode/branch behavior needs no projection inference |
| Customer / anonymous issuance | غير مثبت | specialized contract + schema nullable customer | RESOLVED_BY_LATER_EVIDENCE | model and contract tests |
| Fixed immutable value | غير مثبت | `face_value` non-null + official E2E | RESOLVED_BY_LATER_EVIDENCE | current DB/model |
| Funding source | field missing historically | purchased foundation stores funding source | RESOLVED_BY_LATER_EVIDENCE | model/schema/reports |
| Lifecycle / activation | implementation gap | official named E2E PASS | RESOLVED_BY_LATER_EVIDENCE | issue→activate→redeem evidence |
| One-time/full redemption | not runtime-proven historically | service guards + official E2E | RESOLVED_BY_LATER_EVIDENCE | no partial path accepted |
| Failed redemption atomicity | not proven in old Gate A | contract/service transaction boundary exists; no new mutation run here | PARTIALLY_RESOLVED | source/contract evidence, no new failure runtime proof |
| Duplicate redemption prevention | not proven in old Gate A | idempotency/locking tests + official E2E | RESOLVED_BY_LATER_EVIDENCE | accepted later evidence |
| Multi-voucher compatibility | generic payment ambiguity | current service rejects duplicate/unsupported cases | PARTIALLY_RESOLVED | contract/static proof; no new runtime scenario here |
| Payment Engine boundary | unresolved | canonical POS settlement code | RESOLVED_BY_LATER_EVIDENCE | current route/service trace |
| Tax Engine authority | unresolved for voucher-specific case | policy + official E2E sale tax evidence | RESOLVED_BY_LATER_EVIDENCE | no manual VAT authority added |
| Liability accounting | account 2400 was design hint | mapping recovery + official issue journal | RESOLVED_FOR_ACCEPTED_NAMED_FLOW | not a generic Invoice owner |
| Treasury movement | not active historically | official E2E treasury reconciliation | RESOLVED_FOR_ACCEPTED_NAMED_FLOW | scope limited to named flow |
| Redemption accounting | not active historically | official POS sale journal | RESOLVED_FOR_ACCEPTED_NAMED_FLOW | Sales owns revenue/VAT/COGS |
| Audit contract | incomplete historically | audit rows and source actor context | RESOLVED_BY_LATER_EVIDENCE | current routes call audit/idempotency boundaries |
| Idempotency | incomplete historically | foundation tests + official E2E | RESOLVED_BY_LATER_EVIDENCE | issue/checkout command guards |
| Permission/security | incomplete historically | routes require sales/treasury permissions | RESOLVED_BY_LATER_EVIDENCE | no fail-open shortcut found |
| Voucher print contract | separate from invoice print | voucher print events/UI exist | PARTIALLY_RESOLVED | voucher print is not D2F projection print |
| Reprint identity | contract/source supports same voucher event history | no D2F invoice projection route | PARTIALLY_RESOLVED | voucher-specific path, not unified projection |
| Projection adapter | `adapter=null`, inactive | no later source change found | STILL_OPEN | current source lines 87-99 |
| Search mapping | not active | UI/source omit gift voucher | STILL_OPEN | hook line 11, page lines 402-404 |
| Detail mapping | not active | route fails closed for inactive source | STILL_OPEN | `assertActiveSourceType` rejects inactive entry |
| Print-view mapping | generic `giftVoucher` branch only | no active projection source | STILL_OPEN | `invoice-print-view-model.ts:463-473` warns fields missing |

## 6. Current Source Reality

### 6.1 Gift Voucher source and routes

| Location | Observed implementation |
|---|---|
| `backend/src/models/giftVoucher.model.js` | durable `id`, `voucherNumber`, `voucherCode`, `faceValue`, `companyId`, `issueBranchId`, `currency`, lifecycle and redemption references |
| `backend/src/routes/erp.routes.js:16449-16479` | authenticated GET list/detail scoped by `companyId`; list includes branch eligibility rows and detail includes print events |
| `backend/src/routes/erp.routes.js:16484-16511` | issue is a guarded business POST; not called in this control |
| `backend/src/routes/erp.routes.js:16513-16531` | activation is a guarded business POST; not called in this control |
| `backend/src/routes/erp.routes.js:16533-16549` | print event is a guarded mutation; not called in this control |
| `backend/src/routes/erp.routes.js:16552-16556` | direct redeem is fail-closed; POS settlement is canonical |
| `backend/src/services/gift-voucher.service.js` | lifecycle, settlement, liability, idempotency and print-event helpers exist |
| `backend/src/models/giftVoucherPrintEvent.model.js` | immutable print-event model with `original`/`reprint` |

### 6.2 Current source does not activate the D2F projection

`invoice-projection.service.js` contains a registry entry for Gift Voucher only as a future extension point:

```text
sourceType = gift_voucher
status = SUPPORTED_LATER
adapter = null
canViewDetail = false
canPrint = false
```

`assertActiveSourceType()` accepts only entries with `status === SUPPORTED_NOW` and a non-null adapter. Therefore a request for `gift_voucher` cannot enter current unified detail/search as an active projection.

This is the minimum safe conclusion. No code fix is proposed or applied in this Control.

### 6.3 Worktree source-drift note

The current worktree, rather than HEAD alone, is the implementation reality:

| Path | Current Git state | Meaning for this recheck |
|---|---|---|
| `backend/src/services/invoice-projection.service.js` | untracked | Current worktree implementation was inspected; it is not present in HEAD |
| `backend/src/routes/invoice-projection.routes.js` | untracked | Current worktree route was inspected; it is not present in HEAD |
| `app/[locale]/(dashboard)/sales/search-print/page.tsx` | tracked modified | Current worktree UI was inspected |
| `features/sales/hooks/use-invoice-search-print.ts` | tracked modified | Current worktree hook was inspected |

The observed file timestamps precede this recheck, and no command in this Control edited these files. They remain pre-existing/global worktree drift for purposes of this report. The conclusion therefore uses the running/current worktree content while recording that source provenance is not clean.

## 7. Projection Adapter / Registry

| Required check | Actual | Evidence |
|---|---|---|
| `GIFT_VOUCHER_PROJECTION_ADAPTER_EXISTS` | NO | registry `adapter: null` |
| `GIFT_VOUCHER_PROJECTION_ADAPTER_ACTIVE` | NO | `SUPPORTED_LATER` |
| `GIFT_VOUCHER_SOURCE_IDENTITY_STABLE` | YES | `gift_vouchers.id` and current model/schema |
| `GIFT_VOUCHER_DISPLAY_NUMBER_STABLE` | YES | `voucher_number` and `voucher_code` persisted |
| `GIFT_VOUCHER_SEARCH_MAPPING` | FAIL_NOT_ACTIVE | not in active source types or UI type list |
| `GIFT_VOUCHER_DETAIL_MAPPING` | FAIL_NOT_ACTIVE | `assertActiveSourceType` blocks it |
| `GIFT_VOUCHER_PRINT_VIEW_MAPPING` | FAIL_D2F_PROJECTION_NOT_ACTIVE | generic print branch is not a registry adapter |
| `GIFT_VOUCHER_REPRINT_IDENTITY_PRESERVED` | PARTIALLY_PROVEN | voucher-specific immutable print events; D2F print adapter absent |
| `GIFT_VOUCHER_FINANCIAL_VALUES_ARE_READ_ONLY` | YES_FOR_EXISTING_GET | GET returns stored voucher data; no D2F adapter |
| `GIFT_VOUCHER_TAX_VALUES_ARE_READ_ONLY` | YES_FOR_EXISTING_GET | no projection recalculation path found |
| `DUPLICATE_INVOICE_AUTHORITY` | NO_CURRENT_DUPLICATE | no Voucher Invoice owner is active |
| `DUPLICATE_VOUCHER_AUTHORITY` | NO | Gift Voucher service/model remains source authority |

Required chain is therefore not currently present:

```text
Gift Voucher canonical source
  → read-only projection adapter        [MISSING]
  → unified search/detail               [INACTIVE]
  → print view                          [INACTIVE_FOR_D2F]
```

## 8. Search / Detail / Print View

### 8.1 Read-only Gift Voucher page

The authenticated AR browser read of `/ar/sales/gift-vouchers` loaded the Gift Voucher page and showed five current rows, including stable voucher number/code/value/status fields. This proves the existing Gift Voucher GET page is reachable; it does not prove D2F invoice projection.

### 8.2 Unified invoice search

The authenticated AR browser read of `/ar/sales/search-print` loaded the unified search screen and showed:

- six active checkbox types: sale, return, exchange, installment, deposit, customer gold purchase;
- 55 matching invoice rows;
- AR labels and read-only search/detail/print controls;
- explicit message that Gift Vouchers remain inactive until their projection contract is approved.

No Gift Voucher type checkbox or row appeared. This matches source:

- `features/sales/hooks/use-invoice-search-print.ts:11` — six-item type list;
- `app/[locale]/(dashboard)/sales/search-print/page.tsx:402-404` — explicit inactive message.

### 8.3 Print view

`features/printing/lib/invoice-print-view-model.ts:463-473` has a generic `giftVoucher` branch that emits `gift_voucher_fields_missing` and derives `voucherNumber`/`voucherValue` from a generic Invoice object. It is not evidence of an active `gift_voucher` projection adapter, and it must not be used to claim D2F print parity.

Current conclusion:

```text
GIFT_VOUCHER_PRINT_VIEW = BLOCKED_D2F_PROJECTION_NOT_ACTIVE
GIFT_VOUCHER_REPRINT_SAME_IDENTITY = PARTIALLY_PROVEN_VOUCHER_PATH_ONLY
GIFT_VOUCHER_REPRINT_CREATES_NEW_VOUCHER = NO_BY_VOUCHER_PRINT_CONTRACT
```

## 9. Financial Authority

The later accepted named E2E and financial authority reports establish this boundary for the accepted purchased-voucher flow:

| Event | Authority | Result |
|---|---|---|
| Purchased issue | Gift Voucher service + treasury mapping | liability journal, no sales revenue |
| Voucher value | stored `face_value` | fixed stored value |
| POS redemption | canonical Sales Invoice/payment settlement | Voucher liability decreases |
| Sales revenue | Sales Invoice | preserved |
| Sales VAT | Tax Engine through Sales Invoice | preserved |
| Inventory/COGS | Sales/Asset authority | not Gift Voucher projection |
| Projection | should be read-only adapter | not active in current source |

```text
GIFT_VOUCHER_LIABILITY_AUTHORITY = PROVEN_FOR_ACCEPTED_NAMED_FLOW
TREASURY_AUTHORITY = PROVEN_FOR_ACCEPTED_NAMED_FLOW
SALES_REVENUE_AUTHORITY = PRESERVED
VAT_AUTHORITY = PRESERVED
DUPLICATE_POSTING_AUTHORITY = NO
```

لا يوجد في هذا التقرير أي posting جديد أو إعادة حساب أو تعديل على أرقام قائمة.

## 10. Tax Authority

- Gift Voucher issuance is not treated as sales revenue/output VAT in the accepted policy.
- Redemption remains a Sales Invoice event; Sales/Tax Engine owns revenue and VAT.
- The current projection gap does not justify adding VAT fields or recalculating tax in a future UI.
- No Tax settings or tax code was changed in this Control.

```text
TAX_ENGINE_AUTHORITY = PROVEN_AND_PRESERVED
GIFT_VOUCHER_TAX_VALUES = STORED/READ_ONLY_BOUNDARY_ONLY
```

## 11. Treasury Authority

The current accepted named flow has Treasury/account mapping proof through the later financial mapping recovery and official E2E reports. The current source continues to resolve account authority through server-side mappings and guarded permissions; no account code was supplied by a request in this Control.

```text
TREASURY_AUTHORITY = PROVEN_FOR_ACCEPTED_NAMED_FLOW
LIABILITY_MAPPING = CURRENT_NAMED_FLOW_PROVEN
PERMANENT_MAPPING_PREVENTION = OPEN_SEPARATE_TRACK
```

## 12. Payment Engine Boundary

`gift-voucher.service.js` prepares voucher settlement as a payment split and validates:

- the voucher is purchased and redeemable;
- full face value is used;
- one voucher is not duplicated in one request;
- ordinary split methods remain within the accepted set;
- the canonical Sales Invoice owns the final transaction.

The current source does not expose Gift Voucher as an independent invoice posting source. That preserves the no-duplicate-authority rule, but it also means Gate A projection readiness is not met.

## 13. Audit / Idempotency / Security

| Concern | Current evidence | Gate A result |
|---|---|---|
| Company scope | GET routes filter by `companyId`; model has company FK | PROVEN for Gift Voucher GET |
| Branch authority | issue/activation/print resolve authorized branch; eligibility model present | PARTIALLY_PROVEN for projection context |
| Permissions | issue uses `sales.create` + `treasury.update`; activation/print guarded | PROVEN for guarded commands |
| Audit | route/service actor context and audit events exist | PROVEN for later named flows |
| Idempotency | `runGiftVoucherIdempotentCommand` and contract tests | PROVEN for commands |
| Projection reads | search/detail source accepts only active adapter | NOT_READY for Gift Voucher |
| Print mutation | route is POST and therefore excluded from this control | NOT_RUN / belongs to later Gate C |

## 14. Current Main Runtime

### 14.1 Service owners and health

| Owner | Evidence | Result |
|---|---|---|
| Frontend | `GET http://localhost:3000/ar/dashboard` | HTTP 200 |
| Backend | `GET http://localhost:8000/api/v1/health` | HTTP 200 |
| PostgreSQL | `GET http://localhost:8000/api/v1/health/db` | HTTP 200 |
| Redis | `GET http://localhost:8000/api/v1/health/redis` | HTTP 200 |
| Gold Center | `GET http://localhost:8000/api/v1/health/gold` | HTTP 200 |

```text
MAIN_RUNTIME_HEALTH = PASS
```

### 14.2 Main runtime read paths

| Read path | Evidence | Result |
|---|---|---|
| Gift Voucher list/detail | authenticated AR page loaded five rows and status/value data | PASS |
| Unified invoice search | authenticated AR page loaded 55 rows and six active types | PASS_FOR_ACTIVE_SOURCES |
| Gift Voucher in unified search | source/UI explicitly excludes it | BLOCKED_PROJECTION_NOT_ACTIVE |
| Invoice detail for active sources | current UI/source route exists | PASS_FOR_ACTIVE_SOURCES |
| D2F Gift Voucher detail | no active adapter | BLOCKED |
| D2F Gift Voucher print view | no active projection route; generic warning branch only | BLOCKED |

```text
MAIN_RUNTIME_GIFT_VOUCHER_READ_PATH = PASS
MAIN_RUNTIME_GIFT_VOUCHER_D2F_PROJECTION_PATH = BLOCKED
```

## 15. Main DB Read-Only Proof

### 15.1 Identity

Executed read-only through the running PostgreSQL container:

```text
SELECT current_database(), current_user;
current_database = darfus_erp
current_user = postgres
```

### 15.2 Current counts

| Table/entity | Count |
|---|---:|
| companies | 1 |
| branches | 2 |
| gift_vouchers | 5 |
| gift_voucher_branch_eligibilities | 0 |
| gift_voucher_print_events | 5 |
| invoices | 10 |
| payments | 20 |
| payments with `gift_voucher_id` | 4 |
| journal_entries | 73 |
| journal_entries with Gift Voucher source | 5 |
| journal_lines | 200 |
| audit_logs | 317 |
| idempotency_requests | 161 |
| invoice_print_events | 9 |

The safe voucher row read showed five existing vouchers in company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`, with AED values and statuses; no row was inserted, updated, deleted, or cleaned.

### 15.3 Before/after read-only delta

Two identical SQL snapshots around the additional read-only queries were equal:

```text
gift_vouchers = 5 → 5
payments = 20 → 20
journal_entries = 73 → 73
audit_logs = 317 → 317
idempotency_requests = 161 → 161
invoice_print_events = 9 → 9
gift_voucher_print_events = 5 → 5
```

The authenticated unified-search GETs produced two expected `audit_logs` rows with action `invoice_projection.search` during the browser proof/refetch. They are read-audit events, not business, financial, treasury, or inventory writes.

The repository was already dirty before the report artifact was created. The additional report file is documentation only; no product-source change is attributed to this Control.

```text
MAIN_DB_IDENTITY = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_BUSINESS_WRITE_DELTA = 0
MAIN_DB_FINANCIAL_WRITE_DELTA = 0
MAIN_DB_INVENTORY_WRITE_DELTA = 0
EXPECTED_READ_AUDIT_DELTA = 2
```

## 16. Mapping Persistence Track Status

The separate `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-PERSISTENCE-001` track was inspected but not executed.

```text
GIFT_VOUCHER_CURRENT_MAPPING_WORKS = YES_FOR_ACCEPTED_NAMED_FLOW
GIFT_VOUCHER_MAPPING_PERSISTENCE_PREVENTION = OPEN_UNCHANGED
```

This open prevention item does not by itself invalidate the accepted named flow’s current financial semantics, but it prevents claiming permanent mapping hardening. It is not a reason to silently activate a projection adapter.

## 17. Focused Tests

Existing relevant tests were run without modification:

```text
node --test backend/tests/gift-voucher-purchased-foundation.test.cjs \
  backend/tests/gift-voucher-full-redemption-contract.test.cjs \
  backend/tests/e-cgp-invoice-projection.test.cjs \
  backend/tests/d1-unified-invoice-projection.test.cjs \
  tests/d2-final-invoice-search-print.test.cjs \
  backend/tests/cgp-post-payment-readmodel-ux.test.cjs
```

Result:

```text
46 tests passed
0 failed
```

Important interpretation: the passing D2 test asserts that future invoice families remain inactive. That is consistent with current source and proves fail-closed behavior; it is not evidence that Gift Voucher D2F projection is ready.

```text
FOCUSED_TESTS = PASS_CURRENT_CONTRACTS
AFFECTED_REGRESSION = PASS_CURRENT_ACTIVE_PROJECTION_AND_GV_CONTRACTS
TEST_OR_HARNESS_ISSUE = NO_NEW_FAILURE
```

## 18. Regression

The executed 46-test set covered:

- Gift Voucher foundation and full-redemption contract;
- payment/liability boundary;
- idempotency and permission guards;
- D1 CGP projection;
- D2 active projection/search/print boundary;
- CGP read-model behavior.

No test edit or product change was made to make the suite pass. The current test/source contract consistently keeps Gift Voucher outside D2F active sources.

```text
REGRESSION = PASS_FOR_EXISTING_AUTHORITY
D2F_GIFT_VOUCHER_PROJECTION_REGRESSION = NOT_READY_NOT_IMPLEMENTED
```

## 19. Typecheck

The existing authoritative command was run:

```text
npm run typecheck
exit code = 0
```

```text
TYPECHECK = PASS
```

No Build, migration, seed, package, config, or source edit was performed by this Control.

## 20. Gate A Decision

### 20.1 Required PASS checks

| Gate requirement | Result |
|---|---|
| Read-first | PASS |
| Later Gift Voucher evidence chain | COMPLETE for business/named E2E |
| Client authority | PROVEN |
| Identity/code/currency/branch/full redemption/one-time | PROVEN or separately classified above |
| Payment and Tax boundary | PROVEN/PRESERVED |
| Liability/Treasury authority | PROVEN for accepted named flow |
| Duplicate financial authority | NO |
| Active Gift Voucher projection adapter | FAIL — missing |
| Unified search | FAIL for Gift Voucher — inactive |
| Unified detail | FAIL for Gift Voucher — inactive |
| D2F print view | BLOCKED — inactive |
| D2F reprint identity | PARTIAL — voucher-specific path only |
| Main runtime health | PASS |
| Main Gift Voucher GET read path | PASS |
| Main DB identity/read-only | PASS |
| Focused tests | PASS current contracts |
| Affected regression | PASS current contracts |
| P0/P1 introduced by this control | 0 |

### 20.2 Decision

```text
GATE_A = BLOCKED_PROJECTION_AUTHORITY_NOT_READY
```

### 20.3 Root cause and missing proof

```text
ROOT_CAUSE = Current D1/D2 projection registry intentionally leaves gift_voucher as SUPPORTED_LATER with adapter=null.
MISSING_PROOF = An active read-only Gift Voucher projection adapter with stable source identity, search mapping, detail mapping, and D2F print-view mapping.
CURRENT_RISK = Gift Voucher cannot be included in unified invoice search/detail/print without inventing or duplicating business authority.
OWNER_APPROVAL_REQUIRED = YES
```

No automatic fix is proposed. Any implementation would require a separately named Owner-approved control that defines and proves the adapter contract first.

## 21. Remaining Open Tracks

These tracks remain separate and were not executed:

| Track | State |
|---|---|
| Gift Voucher financial mapping persistence prevention | OPEN_UNCHANGED |
| CGP repeated print/recovery UI | OPEN |
| UX11C stale print-export navigation test | OPEN_P3_TEST_MAINTENANCE |
| D2F Gate B performance/cache benchmark | NOT_STARTED |
| D2F Gate C print mutation acceptance | NOT_STARTED |
| D2F Gate D final 59-row closure | NOT_STARTED |
| CRM | NOT_STARTED |
| HR/Attendance/Payroll | NOT_STARTED |
| Production/deployment | NOT_STARTED |

Do not start Gate B, C, or D from this report. Do not start CRM, HR, CGP recovery, financial mapping prevention implementation, migration, deployment, or any Voucher operation.

## 22. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-D2F-GATE-A-CURRENT-STATE-PROJECTION-READINESS-RECHECK-02
MODE = READ_ONLY_CURRENT_STATE_RECONCILIATION_AND_GATE_DECISION

READ_FIRST = PASS
HISTORICAL_GATE_A_REENTRY = BLOCKED_FINANCIAL_AUTHORITY_UNRESOLVED
LATER_GIFT_VOUCHER_EVIDENCE_CHAIN = COMPLETE_FOR_GV_BUSINESS_AND_NAMED_E2E
HISTORICAL_BLOCKER_CURRENT_STATUS = PARTIALLY_SUPERSEDED_AND_RECONCILED

GIFT_VOUCHER_CLIENT_AUTHORITY = PROVEN
GIFT_VOUCHER_IDENTITY_AUTHORITY = PROVEN
VOUCHER_CODE_RULE = PROVEN
GIFT_VOUCHER_CURRENCY_AUTHORITY = PROVEN
GIFT_VOUCHER_BRANCH_SCOPE_AUTHORITY = PARTIALLY_PROVEN_FOR_PROJECTION
FULL_REDEMPTION_RULE = PROVEN
ONE_TIME_REDEMPTION_RULE = PROVEN
FAILED_REDEMPTION_ATOMICITY = PARTIALLY_PROVEN_SOURCE_AND_CONTRACT
DUPLICATE_REDEMPTION_PROTECTION = PROVEN

PAYMENT_ENGINE_BOUNDARY = PROVEN
TAX_ENGINE_AUTHORITY = PROVEN_AND_PRESERVED
GIFT_VOUCHER_LIABILITY_AUTHORITY = PROVEN_FOR_ACCEPTED_NAMED_FLOW
TREASURY_AUTHORITY = PROVEN_FOR_ACCEPTED_NAMED_FLOW
SALES_REVENUE_AUTHORITY = PRESERVED
DUPLICATE_FINANCIAL_AUTHORITY = NO

GIFT_VOUCHER_PROJECTION_ADAPTER_EXISTS = NO
GIFT_VOUCHER_PROJECTION_ADAPTER_ACTIVE = NO
GIFT_VOUCHER_PROJECTION_ADAPTER = INACTIVE_SUPPORTED_LATER_ADAPTER_NULL
GIFT_VOUCHER_SOURCE_IDENTITY_STABLE = YES
GIFT_VOUCHER_DISPLAY_NUMBER_STABLE = YES
GIFT_VOUCHER_SEARCH_MAPPING = FAIL_NOT_ACTIVE
GIFT_VOUCHER_DETAIL_MAPPING = FAIL_NOT_ACTIVE
GIFT_VOUCHER_PRINT_VIEW = BLOCKED_D2F_PROJECTION_NOT_ACTIVE
GIFT_VOUCHER_REPRINT_SAME_IDENTITY = PARTIAL_VOUCHER_SPECIFIC_PATH_ONLY
GIFT_VOUCHER_REPRINT_CREATES_NEW_VOUCHER = NO

MAIN_RUNTIME_HEALTH = PASS
MAIN_RUNTIME_GIFT_VOUCHER_READ_PATH = PASS
MAIN_RUNTIME_GIFT_VOUCHER_D2F_PROJECTION_PATH = BLOCKED
MAIN_DB_IDENTITY = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_BUSINESS_WRITE_DELTA = 0
MAIN_DB_FINANCIAL_WRITE_DELTA = 0
MAIN_DB_INVENTORY_WRITE_DELTA = 0
EXPECTED_READ_AUDIT_DELTA = 2

GIFT_VOUCHER_CURRENT_MAPPING_WORKS = YES_FOR_ACCEPTED_NAMED_FLOW
GIFT_VOUCHER_MAPPING_PERSISTENCE_PREVENTION = OPEN_UNCHANGED
FOCUSED_TESTS = PASS_CURRENT_CONTRACTS
AFFECTED_REGRESSION = PASS_CURRENT_CONTRACTS
TYPECHECK = PASS

SOURCE_CHANGES_THIS_CONTROL = 0
TEST_CHANGES_THIS_CONTROL = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
BUSINESS_MUTATIONS = 0
FINANCIAL_MUTATIONS = 0
INVENTORY_MUTATIONS = 0

P0 = 0
P1 = 0
GATE_A = BLOCKED_PROJECTION_AUTHORITY_NOT_READY

D2F_GATE_B = NOT_STARTED
D2F_GATE_C = NOT_STARTED
D2F_GATE_D = NOT_STARTED
FULL_INVOICE_CLIENT_SCOPE = OPEN_PENDING_GIFT_VOUCHER_PROJECTION_AND_B_C_D

ROOT_CAUSE = CURRENT_SOURCE_GIFT_VOUCHER_ADAPTER_NULL_AND_INACTIVE
MISSING_PROOF = ACTIVE_READ_ONLY_GIFT_VOUCHER_SEARCH_DETAIL_PRINT_PROJECTION
CURRENT_RISK = D2F_CANNOT_CLAIM_GIFT_VOUCHER_INVOICE_PARITY
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_FOR_SEPARATELY_NAMED_GIFT_VOUCHER_PROJECTION_ADAPTER_CONTROL
OWNER_APPROVAL_REQUIRED = YES
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Final Stop

توقف بعد التقرير. لا Gate B، لا benchmark، لا Gate C/D، لا CRM/HR، لا CGP recovery، لا financial mapping prevention implementation، لا Voucher issue/activation/redemption/print، لا migration، ولا deployment.

**D2F GATE A RECHECK COMPLETE → OWNER REVIEW → EXPLICIT DECISION REQUIRED**

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
