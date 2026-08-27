# DARFUS ERP — Stage E Final Acceptance Closure

تم تنفيذ Stage E على المصدر الحالي. نجحت الـfinal regression، parity للـruntime، AR/EN browser smoke، قراءة `darfus_erp`، وfresh empty DB rehearsal على قواعد مؤقتة فقط. ظهر عيب fresh-install مثبت في migration قديمة، وتم إصلاحه بأقل تعديل آمن ثم اجتازت قاعدة جديدة تمامًا migrations وfirst-run integration. لم تُنشأ أي معاملة أعمال على `darfus_erp`.

## 1. Executive Summary

- `darfus_erp` بقي read-only؛ لا Receive أو Transfer أو Workshop أو Count أو Checkout أو Return أو Refund أو Void جديد.
- كل مراحل A وB وC وD بقيت مقفلة ومقبولة، ولم يُعاد تشغيل business acceptance mutation.
- Final regression: `346/346` passed، منها `345` اختبارًا مركّزًا/regression و`1` fresh PostgreSQL first-run integration.
- Main backend/frontend/PostgreSQL/Redis سليمة، والـcanonical health endpoints أعادت `200`.
- Fresh DB rehearsal نجح بعد إصلاح migration: `91` migration مرة واحدة، وإعادة الفحص `No migrations were executed`.
- لا توجد P0 أو P1 أو P2 حاجبة.
- الملاحظات المتبقية غير الحاجبة: development JWT defaults، Gold provider network warning، وPOS JournalPreview observability gap.

## 2. Accepted Stage A–D State

| Stage | State | Evidence |
|---|---|---|
| Stage A | PASS | Existing accepted profile/receive tests and source authority preserved |
| Stage B | PASS | Transfer, Workshop, Count, Lifecycle matrix passed |
| Stage C | PASS | Accepted sale readback and POS/financial regressions passed |
| Stage D | PASS | `docs/DARFUS_STAGE_D_CONTROL_AND_SAFETY_FINAL_CLOSURE_REPORT.md` |

Frozen authorities remain: one company/multi-branch, server-authoritative Company/Branch/RBAC, Asset-centric inventory, one physical piece = one Asset, maximum one active Barcode, canonical workflow per action, and no generic lifecycle/financial bypass.

## 3. Final Source / Worktree Reality

- Branch: `main`.
- HEAD: `1657b0e9ba580faef69be48f04637835c201b521`.
- Worktree before this report: `103` tracked modified files, `1576` untracked files, `11` stashes; inherited dirty worktree was preserved.
- `git diff --check = PASS`.
- No reset, restore, clean, stash, commit, push, or broad cleanup occurred.
- Stage E focused source/test changes:
  - `backend/migrations/20260721010000-reconcile-canonical-permission-baseline.js`: the fresh-install migration now inserts the complete current canonical permission baseline idempotently before validating it.
  - `tests/first-run-postgres.integration.test.cjs`: stale hard-coded master-data counts/hash/category expectations now derive from the current canonical manifest.
  - This report file.
- Prior Stage D changes and unrelated worktree drift were not reclassified as Stage E ownership.

## 4. Final Regression

الحالة: `PASS`.

- Profile/receive/tax/asset/barcode/supplier/diamond/gem/pearl/GBW/GBP matrix: `130/130`.
- Stage B, Stage C, Stage D, auth/context/RBAC/error/financial matrix: `215/215`.
- Fresh PostgreSQL first-run integration on disposable DB: `1/1`.
- `FINAL_TEST_PASS_COUNT = 346`.
- `FINAL_TEST_FAIL_COUNT = 0`.
- `npm run typecheck = PASS`.
- Node syntax checks for the changed migration, first-run test, and critical backend route: `PASS`.
- Auth containment, idempotency, and secondary idempotency verifiers: `PASS`.

## 5. Backend Runtime Parity

الحالة: `PASS`.

| Check | Actual |
|---|---|
| Backend container | Up on `:8000` |
| `GET /api/v1/health` | `200` |
| `GET /api/v1/health/db` | `200` |
| `GET /api/v1/health/redis` | `200` |
| PostgreSQL container | Up/healthy |
| Redis container | Up/healthy |
| `current_database()` | `darfus_erp` |
| Runtime migration check | No pending migration; startup said schema up to date |
| Runtime admin bootstrap | Skipped; explicit setup command required |

No backend restart was required for the Stage E migration/test-only correction; the serving backend already represented the accepted Stage D source. No PostgreSQL/Redis restart occurred.

## 6. Frontend Runtime Parity

الحالة: `PASS`.

- `GET http://localhost:3000/en/dashboard = 200`.
- One existing frontend owner remained on port `3000`; no parallel frontend was started.
- No blind `.next` deletion or build was run.
- No Build Error, Application Error, Unhandled Runtime Error, or broken-chunk signal appeared in the read-only browser smoke.

## 7. AR/EN Browser Acceptance

الحالة: `PASS` read-only.

- AR routes checked: Dashboard, Inventory, Asset detail route, Transfers, Workshop, Inventory Count, POS, Customers, Suppliers, Settings, Employees, Accounting (`12/12`).
- EN routes checked: the same critical surfaces (`12/12`).
- All requested URLs remained on their requested paths and title was `DARFUS Jewellery ERP`.
- AR document state: `lang=ar`, `dir=rtl`; EN: `lang=en`, `dir=ltr`.
- No Build/Application/Runtime error; final browser diagnostics contained no error or warning entries.
- No mutation control was clicked; no cookies, local storage, credentials, passwords, or tokens were inspected.
- Read-only protected API probes without authorization returned `401` for Customers, Inventory Assets, and POS Search as expected.

## 8. Accepted Business Evidence Readback

الحالة: `PASS`, read-only.

Accepted Stage C sale remains coherent:

- Invoice: `INV-2026-000001`, paid/posted.
- One InvoiceItem, one Payment, one linked CashTransaction.
- Payment and CashTransaction amount: `2710.6763`.
- VAT snapshot: `14.000`.
- One balanced posted Journal with debit = credit `5076.71000000`.
- Asset `AST-PUR-1787085524749-1-1-dww3` remains SOLD with Barcode `GWRNG21000002`.
- One SALE event, one SALE movement, and one succeeded `pos.checkout` idempotency row.
- Stage B Transfer, Workshop, and closed Count accepted readbacks remained coherent in the prior Stage D evidence and were not mutated or replayed.

## 9. DB Integrity

الحالة: `PASS` with one named historical exception.

Current `darfus_erp` read-only counts remain aligned with the Stage D baseline: `SequelizeMeta=91`, companies `1`, branches `2`, users `1`, suppliers `2`, locations `4`, assets `14`, purchase orders `14`, transfers `1`, workshops `1`, stock audits `3`, invoices `1`, payments `1`, cash transactions `4`, journals `18`, idempotency rows `34`.

Current anomaly checks:

| Check | Result |
|---|---:|
| Duplicate active Barcodes | 0 |
| Duplicate idempotency company/scope/key | 0 |
| Cross-company Asset/Barcode relation | 0 |
| Cross-branch Asset/Location relation | 0 |
| Orphan InvoiceItems | 0 |
| Orphan Payments | 0 |
| Other Stage D orphan/duplicate checks | 0 |

The only unbalanced journal is the named inherited exception `JE-1787090870905` linked to `PO-1787090870807`; it is unchanged, not reproduced by Stage E, and remains HISTORICAL rather than a new blocker.

## 10. Financial Integrity

الحالة: `PASS` for current accepted data.

- Stage C invoice/payment/cash/journal links remain valid and balanced.
- VAT snapshot and purchase-cost/origin history were not changed.
- Asset remains SOLD with its original Barcode and sale evidence.
- No supplier payable, purchase order, journal, or cash business write occurred in Stage E.
- Financial mapping, account compatibility, balanced posting, and no-auto-create account tests passed.
- Historical journal exception is excluded by the accepted authority and was not repaired.

## 11. Security Final Readback

الحالة: `PASS`.

- Protected routes without auth: `401`.
- Super Admin missing Company context and wrong Company/Branch contexts fail closed in tests.
- Unknown permissions do not grant access.
- Generic lifecycle/financial/Company/approval/journal mutation bypasses remain blocked by the Stage D guard.
- Client price override cannot control server sale authority.
- Idempotency exact replay/conflict verifiers passed.
- Error envelope tests confirm no SQL/ORM/stack/secret leakage to normal clients.
- Local logs show expected security warnings only; no secret values were printed in this report.

## 12. Fresh Empty DB Rehearsal

الحالة: `PASS` after minimum safe correction.

### Initial finding

Disposable DB `darfus_stage_e_fresh_20260823_01` failed at migration `20260721010000` with `CANONICAL_PERMISSION_BASELINE_INCOMPLETE` after `47` migrations. The migration inserted only `SALES_ADJUSTMENT_PERMISSIONS` while validating the complete current baseline.

### Minimum safe correction

The migration now inserts the complete imported `PERMISSIONS` baseline with `ignoreDuplicates` before role grants and validation. This is idempotent, does not change schema, does not create business data, and has no effect on an already-applied migration in `darfus_erp`.

### Fresh rerun

On brand-new disposable DB `darfus_stage_e_fresh_20260823_04`:

- Target safety proved: `current_database()` matched the temporary name and was not `darfus_erp`.
- All `91/91` current migrations applied once.
- Second migration run: `No migrations were executed, database schema was already up to date.`
- First-run PostgreSQL integration: `1/1 PASS`.
- Rollback, advisory-lock concurrency, single-winner setup, replay, and changed-payload conflict all passed.
- Fresh backend process was not started on a second port; migration/bootstrap/readiness evidence was sufficient and the main ports were not disturbed.

All four named temporary rehearsal DBs (`..._01` through `..._04`) were explicitly dropped after evidence capture. No other database was dropped.

## 13. Fresh DB Business Emptiness

Before first-run bootstrap on the successful fresh DB:

| Entity | Count |
|---|---:|
| Companies | 0 |
| Branches | 0 |
| Users/Employees | 0 |
| Customers/Suppliers | 0 |
| Assets/Barcodes | 0 |
| Purchase Orders/Transfers/Workshops/Counts | 0 |
| Invoices/Payments/Cash Transactions | 0 |
| Journals/Idempotency business rows | 0 |

The first-run test then used only synthetic disposable values and proved the canonical setup transaction reaches `READY`; that temporary DB was dropped. No synthetic data was copied to `darfus_erp`.

## 14. Fresh DB Product Metadata

After the successful synthetic first-run bootstrap on the disposable DB:

- Roles `5`, permissions `150`, role grants `469`.
- Profile master data `660` (current V1 baseline `502` plus current dataset `158`).
- Pearl sizes `39`.
- Barcode inventory codes `5`, item codes `20`, barcode sequences `0`.
- System account roles `12`, branch financial mappings `11`.
- Bootstrap state `READY`, one state row.

These are canonical system metadata/configuration artifacts created by the explicit first-run flow, not fake customer transactions. The pre-bootstrap empty DB itself had zero company-scoped metadata rows, as required.

## 15. Fake Production Defaults Check

الحالة: `PASS`.

- `FAKE_PRODUCTION_DEFAULTS = 0` in the empty migration state.
- No fake Supplier, Customer, TRN, VAT identity, Branch, Location, inventory, invoice, PO, opening balance, or cash balance was seeded.
- The first-run integration used synthetic test-only setup data and the disposable DB was dropped.
- Runtime admin bootstrap remained skipped on the main backend.

## 16. Customer Configuration Readiness

الحالة: `PASS`.

The canonical first-run setup path is present, token/idempotency guarded, transactional, concurrency-safe, and reaches `READY` with validated Company/Branch, roles, financial mappings, and inventory reference bootstrap. Customer-facing Supplier, Customer, Location, Tax, User/Role, and Inventory configuration surfaces are present in source and browser smoke. Stage E did not populate any of them on the official DB.

`CUSTOMER_CONFIGURATION_PATHS_PRESENT = PASS`.

## 17. Remaining Risks

| Finding | Classification | Priority | Blocking |
|---|---|---|---|
| Development-default JWT secrets in local compose | Security hardening / P2 non-blocking local | P2 | No |
| GoldAPI refresh network warning observed in local log | External provider/observability | P2 | No |
| POS JournalPreview cost omission | Observability | P2 non-blocking | No |
| `JE-1787090870905` imbalance | Historical accepted local exception | HISTORICAL | No |

Production requires strong non-default JWT secrets before deployment. Stage E did not rotate local secrets or contact production.

## 18. P0/P1/P2/P3/Historical

| Class | Count | Result |
|---|---:|---|
| P0 | 0 | None found |
| P1 | 0 | Fresh-install blocker corrected and rerun passed |
| P2 blocking | 0 | None |
| P2 non-blocking | 3 | JWT hardening, Gold provider warning, POS preview observability |
| P3 | 0 | None newly identified |
| Historical | 1 | Named unbalanced JE, preserved unchanged |

## 19. Final Gate

| Gate | Result |
|---|---|
| Final relevant regression | PASS |
| Backend runtime parity | PASS |
| Frontend runtime parity | PASS |
| AR browser acceptance | PASS |
| EN browser acceptance | PASS |
| DB integrity | PASS with named historical exception |
| Financial integrity | PASS |
| Security readback | PASS |
| Fresh empty DB migrations | PASS |
| Fresh DB product metadata | PASS |
| Fake production defaults | 0 |
| Customer configuration paths | PASS |

`GATE = PASS_STAGE_E_FINAL_ACCEPTANCE`

`STAGE_E_STATUS = CLOSED`

`PRODUCT_LOCAL_ACCEPTANCE = PASS`

`CUSTOMER_FRESH_DB_READINESS = PASS`

`PRODUCTION_DEPLOYMENT = NOT_EXECUTED`

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-E-FINAL-ACCEPTANCE-MINIMUM-SAFE-EXECUTION-AND-CLOSURE
LOCAL_MAIN_DB = darfus_erp

STAGE_A_STATUS = CLOSED
STAGE_B_STATUS = CLOSED
STAGE_C_STATUS = CLOSED
STAGE_D_STATUS = CLOSED

WORKTREE_TRACKED_MODIFIED = 103
WORKTREE_UNTRACKED = 1577
FINAL_RELEVANT_REGRESSION = PASS
FINAL_TEST_PASS_COUNT = 346
FINAL_TEST_FAIL_COUNT = 0
TYPECHECK = PASS
NODE_CHECK = PASS
GIT_DIFF_CHECK = PASS

BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = PASS
BACKEND_HEALTH = 200
DB_HEALTH = 200
REDIS_HEALTH = 200
AR_BROWSER_ACCEPTANCE = PASS
EN_BROWSER_ACCEPTANCE = PASS
DB_INTEGRITY = PASS_HISTORICAL_EXCEPTION_PRESERVED
FINANCIAL_INTEGRITY = PASS
SECURITY_READBACK = PASS

ACCEPTED_STAGE_C_INVOICE = INV-2026-000001_PAID_POSTED
ACCEPTED_STAGE_C_ASSET = AST-PUR-1787085524749-1-1-dww3_SOLD
ACCEPTED_STAGE_C_BARCODE = GWRNG21000002
ACCEPTED_STAGE_C_JOURNAL_BALANCED = YES

FRESH_REHEARSAL_DB = darfus_stage_e_fresh_20260823_04_DROPPED_AFTER_EVIDENCE
FRESH_DB_TARGET_SAFETY = PASS
FRESH_DB_MIGRATIONS = PASS
FRESH_DB_MIGRATION_COUNT = 91
FRESH_DB_PENDING_MIGRATIONS = 0
FRESH_DB_REQUIRED_METADATA = PASS
FRESH_DB_CUSTOMERS = 0
FRESH_DB_SUPPLIERS = 0
FRESH_DB_ASSETS = 0
FRESH_DB_INVOICES = 0
FRESH_DB_FAKE_COMPANIES = 0
FRESH_DB_FAKE_BRANCHES = 0
FRESH_DB_FAKE_LOCATIONS = 0
FRESH_DB_FAKE_TAX_IDENTITIES = 0
FAKE_PRODUCTION_DEFAULTS = 0
CUSTOMER_CONFIGURATION_PATHS_PRESENT = PASS
RUNTIME_FRESH_DB_START = NOT_RUN_WITH_REASON_MAIN_PORTS_PROTECTED;READINESS_TESTS_SUFFICIENT
DISPOSABLE_DB_DROPPED = YES

JWT_LOCAL_DEFAULTS = P2_NON_BLOCKING_LOCAL
JWT_PRODUCTION_HARDENING_REQUIRED = YES
POS_JOURNAL_PREVIEW_P2 = P2_NON_BLOCKING_OBSERVABILITY
HISTORICAL_JE_EXCEPTION = PRESERVED_UNCHANGED

NEW_RECEIVE = 0
NEW_TRANSFER = 0
NEW_WORKSHOP = 0
NEW_COUNT = 0
NEW_CHECKOUT = 0
NEW_RETURN = 0
NEW_REFUND = 0
NEW_VOID = 0
NEW_LIFECYCLE_MUTATION = 0
LOCAL_MAIN_DB_BUSINESS_WRITES_THIS_CONTROL = 0

P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
P2_NON_BLOCKING_COUNT = 3
P3_COUNT = 0
GATE = PASS_STAGE_E_FINAL_ACCEPTANCE
STAGE_E_STATUS = CLOSED
PRODUCT_LOCAL_ACCEPTANCE = PASS
CUSTOMER_FRESH_DB_READINESS = PASS
PRODUCTION_DEPLOYMENT = NOT_EXECUTED
NEXT_RECOMMENDED_STEP = STAGE_F_DOCUMENTATION_AND_HANDOVER
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

لا يبدأ Stage F تلقائيًا، ولا يوجد Deployment أو Production contact أو Production JWT change أو Customer real-data entry. انتهى Stage E هنا وينتظر Owner review.
