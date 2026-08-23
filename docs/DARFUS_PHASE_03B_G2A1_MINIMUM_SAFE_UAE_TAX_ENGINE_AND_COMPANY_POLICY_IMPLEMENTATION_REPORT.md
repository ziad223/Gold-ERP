# DARFUS ERP — Phase 03B-G2A1 Implementation Report

تم تنفيذ أساس UAE Tax Engine وCompany Tax Policy بأقل تغيير آمن. الاختبارات المركزة، typecheck، migration على قاعدة Disposable، وAPI integration نجحت. لم تتم أي كتابة على `darfus_erp`، ولم يتم تشغيل build أو إعادة تشغيل الـmain runtime. الفشل الوحيد الذي ظهر أثناء الفحص كان bypass في `PUT /settings/by-key/:key` وتم إغلاقه ضمن نفس نطاق G2A1 وإعادة الاختبار بنجاح.

## 1. Executive Summary

النتيجة: G2A1 مكتمل ضمن النطاق المعتمد.

- UAE Tax Engine server-owned metadata: `UAE`, exact five treatments، وlegal standard rate metadata `5`.
- `companies.vat_registered` أضيف كمصدر legal/customer registration authority، nullable، بلا default، بلا backfill.
- Company Tax Policy يستخدم `settings` الحالي، ولا توجد tax-policy table جديدة.
- القراءة والكتابة company-scoped من `req.companyId`، ولا يقبل المسار company override من العميل.
- `vatEnabled` و`tax_number/TRN` لا يستنتجان `vatRegistered`.
- Manager غير المصرح له تم منعه من Tax Policy حتى مع اتساع `settings.update` التاريخي؛ Accountant مسموح له فقط بـtax-policy-only payload.
- تم الحفاظ على fallback compatibility الحالي خارج explicit policy response.
- لم يتم تنفيذ transaction-level eligibility أو VATP043 engine أو G2A2.

## 2. Preconditions

تمت مراجعة authorities الحالية وG1/G1A وG2A1 قبل التعديل.

| Check | Result | Evidence |
|---|---|---|
| Official DB target | PASS | `SELECT current_database()` = `darfus_erp` قبل وبعد الفحص |
| Official DB mutation authorization | NO | G2A1 authorizes Disposable PostgreSQL only |
| Existing official backup | PASS | `backups/official/darfus_erp_POST_R2_FULL_20260818_095351.dump`, 646071 bytes، hash verified |
| Source HEAD | `1657b0e9ba580faef69be48f04637835c201b521` | read-only git query |
| Main runtime restart | NO | not performed |
| Build | NO | explicitly not run |
| Migration timestamp availability | PASS | latest existing `20260818010000`; selected `20260818020000` |

## 3. Frozen Authority

- `OFFICIAL_DATABASE = darfus_erp`.
- Official DB remains read-only in this control.
- `UAE_TAX_ENGINE = SYSTEM_OWNED`.
- `COMPANY_TAX_POLICY = COMPANY_SCOPED`.
- `VAT_REGISTERED_AUTHORITY = companies.vat_registered`.
- `TRN_AUTHORITY = companies.tax_number`.
- `VAT_REGISTERED_DEFAULT = UNSET`.
- `vatEnabled` remains an operational VAT-processing switch.
- Enabled treatments do not grant transaction legal eligibility.
- `TRANSACTION_LEGAL_ELIGIBILITY = NOT_IMPLEMENTED_IN_G2A1`.
- No Supplier, Location, VAT production data, inventory, PO, accounting transaction, or customer data was provisioned.

## 4. Pre-Change Source Forensic

| Area | Actual before change | Decision |
|---|---|---|
| Company model | `taxNumber` existed; `vatRegistered` did not | add only `vatRegistered` mapped to `vat_registered` |
| Settings model | company-scoped JSONB `settings` table existed | reuse it |
| Existing settings keys | `vatRate`, `vatEnabled`, purchase VAT/RCM compatibility keys existed | preserve meanings; do not duplicate |
| New G1A policy keys | no canonical keys found | add as typed Settings keys |
| Tax policy service | no canonical service found | create one service/facade |
| Read route | `GET /settings` existed with `settings.view` | extend existing response with `taxPolicy` |
| Write route | `PATCH /settings` existed | extend existing route |
| Alternate write route | `PUT /settings/by-key/:key` accepted broad settings keys | add the same Tax Policy authority guard |
| Audit | append-only `auditService.record` existed | reuse it; add semantic events |
| Permission mapping | `settings.update` was available to Admin/Owner/Manager; Accountant had view but not update | add narrow server-side Tax Policy authority check |

## 5. Official DB Read-Only Baseline

Final reconciliation values remained equal to the pre-change baseline:

| Entity | Before | After | Result |
|---|---:|---:|---|
| companies | 1 | 1 | unchanged |
| settings | 0 | 0 | unchanged |
| suppliers | 0 | 0 | unchanged |
| inventory_locations | 0 | 0 | unchanged |
| purchase_orders | 0 | 0 | unchanged |
| assets | 0 | 0 | unchanged |
| journal_entries | 0 | 0 | unchanged |
| `SequelizeMeta` | 83 | 83 | unchanged |
| G2A1 migration in official `SequelizeMeta` | 0 | 0 | not applied |
| `companies.vat_registered` column in official DB | 0 | 0 | not applied |

Official identity remained `darfus_erp|postgres`. No official company row, setting row, or existing row was updated.

## 6. Backup Reverification

No new backup was created. The existing approved backup was reverified read-only:

```text
FILE = backups/official/darfus_erp_POST_R2_FULL_20260818_095351.dump
BYTES = 646071
SHA256 = 844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1
EXPECTED_HASH_MATCH = YES
```

## 7. Implementation Decision

The existing Settings/Company architecture was suitable. A new policy table, permission, accounting subsystem, or transaction tax model would have duplicated or widened authority, so none was created.

The pre-existing permission mismatch was handled with the minimum server-side restriction:

- Admin/Owner/Super Admin: allowed for Tax Policy.
- Accountant: allowed only for a Tax Policy-only payload through the canonical PATCH route.
- Manager: denied for Tax Policy even when historical `settings.update` is present.
- General settings compatibility remains unchanged for the existing authorized path.

## 8. UAE Tax Engine Foundation

Implemented in `backend/src/services/uae-tax-engine.service.js`:

- `JURISDICTION = UAE`.
- Exact supported list:
  `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`, `EXEMPT`, `OUT_OF_SCOPE`.
- `LEGAL_STANDARD_VAT_RATE = 5` as server-owned metadata.
- Numeric `vatRate` validation preserves the existing company configuration range `0..100`; it does not turn the legal metadata into an automatic customer setting.
- Exact enum validation, duplicate rejection, unknown-value rejection, and no lowercase/empty aliases.
- `transactionLegalEligibilityImplemented = false`.
- No VATP043 legal eligibility, evidence, precious-value comparison, or transaction snapshot was added.

## 9. Company VAT Registration Implementation

Implemented:

```text
Company.vatRegistered -> companies.vat_registered
type = BOOLEAN
nullable = YES
default = NONE
backfill = NONE
```

Semantics:

- `NULL` = UNSET.
- `TRUE` = explicitly configured VAT registered.
- `FALSE` = explicitly configured not VAT registered.

No inference is made from `taxNumber/TRN`, `vatEnabled`, `vatRate`, or transaction flags.

## 10. Company Tax Policy Storage

The existing company-scoped `settings` table stores only the new explicit policy keys required by G2A1:

| Key | Type | Unconfigured representation |
|---|---|---|
| `enabledTaxTreatments` | exact enum array | no row / response `null` |
| `defaultTaxTreatment` | nullable exact enum | no row / response `null` |
| `preciousGoodsRcmEnabled` | nullable boolean | no row / response `null` |

Existing keys retain their meaning:

- `settings.vatRate` = persisted company VAT rate where already supported.
- `settings.vatEnabled` = operational VAT processing switch only.
- `companies.tax_number` = TRN authority.

Null writes remove the corresponding Settings row, preventing a JSONB `null` row from being confused with an explicit configured value. No fallback is exposed as persisted policy.

## 11. Company Tax Policy Service

Implemented in `backend/src/services/company-tax-policy.service.js`.

The service:

- reads Company and raw company-scoped Settings;
- returns explicit stored values or `null`;
- merges patch validation with current explicit values so `defaultTaxTreatment` cannot be enabled without an enabled list;
- writes Company VAT registration and Settings in a transaction;
- uses `req.companyId` from the route caller;
- never consumes client-supplied legal eligibility, VAT amount, or accounting account override;
- keeps TRN and VAT registration independent.

## 12. API Read Contract

Existing route reused:

```text
GET /api/v1/settings
GET /api/settings
permission: settings.view
scope: authenticated req.companyId
```

The existing response remains compatible and now includes `data.taxPolicy` with:

```json
{
  "jurisdiction": "UAE",
  "vatRegistered": null,
  "trn": null,
  "vatEnabled": null,
  "vatRate": null,
  "enabledTaxTreatments": null,
  "defaultTaxTreatment": null,
  "preciousGoodsRcmEnabled": null,
  "supportedTaxTreatments": ["STANDARD_VAT", "ZERO_RATED", "REVERSE_CHARGE", "EXEMPT", "OUT_OF_SCOPE"],
  "legalStandardVatRate": 5,
  "configured": false
}
```

Values above are the unconfigured shape; runtime values are server-read explicit values.

## 13. API Write Contract

Existing route reused:

```text
PATCH /api/v1/settings
PATCH /api/settings
```

Supported G2A1 policy input keys:

```text
vatRegistered
vatRate
vatEnabled
enabledTaxTreatments
defaultTaxTreatment
preciousGoodsRcmEnabled
```

Validation is fail-closed. Unknown treatment, duplicate treatment, invalid boolean, invalid numeric rate, and default-not-enabled requests return validation failure before policy persistence.

The pre-existing alternate route is also protected:

```text
PUT /api/v1/settings/by-key/:key
```

Tax Policy keys are routed through the same Company Tax Policy service and authority check; non-tax Settings keys retain their existing compatibility route.

## 14. Permission Enforcement

The source forensic found that `settings.update` is not a sufficient frozen role boundary by itself because the historical mapping includes `manager`, while `accountant` has `settings.view` but not `settings.update`.

Implemented minimum safe behavior:

| Actor | Tax Policy PATCH | Tax Policy by-key | Result |
|---|---|---|---|
| Admin | allowed | allowed | PASS |
| Owner | allowed | allowed | PASS by role guard |
| Super Admin | allowed with company context | existing route permission still applies | preserved context authority |
| Accountant | allowed only tax-policy-only PATCH | existing `settings.update` gate remains | PASS for accounting-only policy path |
| Manager | rejected | rejected | fail-closed |
| Cross-company header override | rejected by auth middleware | rejected | fail-closed |

No new Permission row or broader global permission was introduced.

## 15. Audit

The existing append-only audit subsystem was reused.

Successful Tax Policy mutation records before/after snapshots with:

- company scope;
- actor and user ID;
- source document `company-tax-policy`;
- changed policy state;
- timestamp and existing hash-chain behavior.

Semantic actions:

```text
company.vat_registration.updated
company.tax_policy.updated
```

The existing `settings.update` audit remains for compatibility. Invalid and unauthorized requests were proven not to create policy/settings writes in the Disposable API test.

## 16. Historical Compatibility

- Existing `settings.vatRate` remains persisted company configuration.
- Existing Settings fallback behavior remains available to legacy consumers.
- Tax Policy response does not report fallback values as explicit configuration.
- `vatEnabled` was not renamed or repurposed.
- TRN was not made mandatory.
- Existing purchase VAT/RCM compatibility keys and accounting mappings were not redesigned.
- No Supplier Receive, POS, GBW, GBP, Diamond, Gem Stone, Pearl, accounting posting, or inventory authority path was changed.

## 17. Migration

Created exactly one additive migration:

```text
backend/migrations/20260818020000-add-company-vat-registered.js
```

Up/down behavior:

- `up`: adds nullable `companies.vat_registered` with no default.
- `down`: removes only that column.
- no SQL update/backfill;
- no seed;
- no existing official row mutation;
- no new tax treatment/location/supplier/e-invoicing column.

Disposable evidence:

```text
full migration run: 0
new migration applied: 1
down: PASS
column after down: absent
reapply: PASS
column after reapply: nullable, default NULL
fresh company rows with vat_registered non-null: 0 before synthetic API test
```

## 18. Files Changed

Intentional G2A1 files:

| File | Change |
|---|---|
| `backend/src/models/company.model.js` | added nullable `vatRegistered` model field |
| `backend/src/services/uae-tax-engine.service.js` | new UAE metadata and validation service |
| `backend/src/services/company-tax-policy.service.js` | new canonical company policy facade |
| `backend/src/routes/erp.routes.js` | read/write integration, authority guard, by-key bypass closure, audit |
| `backend/migrations/20260818020000-add-company-vat-registered.js` | additive schema migration |
| `backend/tests/phase-03b-g2a1-tax-policy.test.cjs` | focused unit/static tests |
| `backend/tests/phase-03b-g2a1-disposable-api.integration.test.cjs` | Disposable API integration test |
| `docs/DARFUS_PHASE_03B_G2A1_MINIMUM_SAFE_UAE_TAX_ENGINE_AND_COMPANY_POLICY_IMPLEMENTATION_REPORT.md` | this report |

The worktree already contained unrelated tracked and untracked drift. No cleanup, reset, restore, stash, or ownership transfer of that drift was performed. In particular, `AGENTS.md` and `next-env.d.ts` were not edited.

## 19. Focused Tests

Commands and results:

```text
node --test tests/phase-03b-g2a1-tax-policy.test.cjs
6 passed, 0 failed

node --test tests/phase-03b-g2a1-disposable-api.integration.test.cjs
1 passed, 0 failed

node --test \
  tests/phase-03b-g2a1-tax-policy.test.cjs \
  tests/gold-by-weight-financial-formula-01b.test.cjs \
  tests/gold-by-piece-rate-calculation-03-r2.test.cjs \
  tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs \
  tests/database-env.test.js
22 passed, 0 failed

npm run typecheck
PASS

node --check on all changed JS/CJS/migration files
PASS
```

Focused assertions covered exact enum authority, typed values, TRN/VAT independence, default-treatment dependency, no fallback persistence, company scope, route authority, audit path, and migration shape.

## 20. Disposable PostgreSQL Migration Proof

Target:

```text
darfus_g2a1_20260818_163000z
```

The target was created fresh and verified with `SELECT current_database()` before migration. It was not `darfus_erp` and was not the historical acceptance DB.

Evidence:

- all current source migrations completed with exit code 0;
- `SequelizeMeta` reached 84 on the Disposable target;
- G2A1 migration was recorded once;
- down removed only the new column;
- reapply restored the column;
- information schema showed `is_nullable = YES` and `column_default = NULL`;
- no official migration metadata changed.

## 21. Disposable Policy/API Integration Proof

The API test used synthetic company/user data only. No supplier, location, VAT production configuration, inventory, PO, journal, or customer record was created.

Verified request results:

| Operation | Result |
|---|---|
| synthetic admin login | HTTP 200 |
| initial `GET /settings` | HTTP 200, explicit unconfigured/null policy |
| authorized policy `PATCH /settings` | HTTP 200 |
| subsequent policy read | HTTP 200, values persisted |
| unknown treatment | HTTP 422, Settings count unchanged |
| Manager Tax Policy PATCH | HTTP 403 |
| Manager `PUT /settings/by-key/vatRate` | HTTP 403 |
| Accountant tax-policy-only PATCH | HTTP 200 |
| cross-company company header | HTTP 403 |
| semantic audit rows | present in Disposable target |

The test process used no real customer data and did not print credentials or token values.

## 22. Official DB Reconciliation

Final read-only query on `darfus_erp`:

```text
database = darfus_erp
SequelizeMeta = 83
G2A1 migration row = 0
companies = 1
settings = 0
suppliers = 0
inventory_locations = 0
purchase_orders = 0
assets = 0
journal_entries = 0
vat_registered column = absent
```

`PERSISTENT_OFFICIAL_DB_MUTATION = 0`.

## 23. Main Runtime Protection

- `localhost:3000` was not restarted.
- `localhost:8000` was not restarted.
- No frontend source was changed.
- No build was run.
- No `.env`, secret, API key, or `next-env.d.ts` was changed.
- The Disposable API test used an in-process Express app against the Disposable DB; it did not replace or attach to the main backend process.
- Because the official DB migration is intentionally not applied, promotion of this source to a runtime using `darfus_erp` remains a later controlled operation and was not attempted here.

## 24. Scope/Non-Goals Confirmation

Not implemented in G2A1:

- `purchase_orders.tax_treatment`;
- transaction Tax Treatment snapshot;
- VATP043 transaction eligibility;
- RCM evidence/declaration persistence;
- precious-component value comparison;
- composite/multiple making-service resolution;
- Location CRUD or selector cleanup;
- Supplier/Receive UI or operational readiness;
- e-invoicing;
- GBW/GBP acceptance or formula changes;
- Diamond/Gem Stone/Pearl;
- official DB provisioning or configuration;
- master-data, supplier, location, customer, VAT, inventory, PO, or accounting business data.

## 25. Risks / Deferred To G2A2

| Risk/deferred area | State | Owner |
|---|---|---|
| Official DB migration promotion | pending controlled promotion; not part of this batch | Owner-approved future control |
| Transaction tax treatment snapshots | not implemented | G2A2 |
| VATP043 legal eligibility | not implemented | G2A2 |
| RCM declarations/evidence | not implemented | G2A2 |
| Precious value comparison | not implemented | G2A2 |
| Supplier/Receive operational readiness | unchanged and intentionally out of scope | later approved batch |
| Existing broad general `settings.update` compatibility | preserved for non-tax keys; Tax Policy guarded separately | future permission catalog decision if desired |

No P0/P1 regression was found. No business formula or accounting authority was changed.

## 26. Gate

All G2A1 pass conditions are satisfied:

- exact UAE tax engine and five treatments: PASS;
- nullable no-default VAT registration authority: PASS;
- explicit persisted policy validation: PASS;
- read/write API: PASS;
- company and cross-company security: PASS;
- permission authority: PASS with minimum server-side role restriction;
- audit: PASS;
- focused tests: PASS;
- disposable full migration: PASS;
- disposable policy/API integration: PASS;
- official migration applied: NO;
- official DB writes: 0;
- frontend changed: NO;
- build: NO;
- main runtime restarted: NO;
- G2A2: NOT IMPLEMENTED;
- P0 blockers: 0;
- P1 blockers: 0.

`GATE = PASS_PHASE_03B_G2A1_MINIMUM_SAFE_UAE_TAX_ENGINE_AND_COMPANY_POLICY_IMPLEMENTATION`

## 27. Next Recommended Control

```text
NEXT_RECOMMENDED_STEP = 03B-G2A2-TRANSACTION-TAX-TREATMENT-SNAPSHOT-AND-PRECIOUS-GOODS-RCM-ELIGIBILITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

Do not start G2A2 automatically. Owner review and explicit approval are required.

## 28. Final Tokens

```text
CURRENT_BATCH = DARFUS-PHASE-03B-G2A1-MINIMUM-SAFE-UAE-TAX-ENGINE-AND-COMPANY-POLICY
MODE = MINIMUM_SAFE_UAE_TAX_ENGINE_AND_COMPANY_POLICY_IMPLEMENTATION

OFFICIAL_DATABASE = darfus_erp
PERSISTENT_OFFICIAL_DB_MUTATION_AUTHORIZED_THIS_BATCH = NO

UAE_TAX_ENGINE = SYSTEM_OWNED
COMPANY_TAX_POLICY = COMPANY_SCOPED
TRANSACTION_LEGAL_ELIGIBILITY = NOT_IMPLEMENTED_IN_G2A1
SUPPORTED_TAX_TREATMENTS = EXACT_5
LEGAL_STANDARD_VAT_RATE = 5

VAT_REGISTERED_AUTHORITY = companies.vat_registered
VAT_REGISTERED_DEFAULT = UNSET
TRN_AUTHORITY = companies.tax_number
VAT_ENABLED_INFERENCE = FORBIDDEN

COMPANY_POLICY_READ_API = GET /api/v1/settings
COMPANY_POLICY_WRITE_API = PATCH /api/v1/settings; PUT /api/v1/settings/by-key/:key guarded
COMPANY_POLICY_WRITE_PERMISSION = Admin/Owner/SuperAdmin or Accountant tax-policy-only server guard; Manager denied

AUDIT = PASS
MIGRATION_CREATED = backend/migrations/20260818020000-add-company-vat-registered.js
MIGRATION_APPLIED_TO_DISPOSABLE = YES
MIGRATION_APPLIED_TO_OFFICIAL = NO
DISPOSABLE_DB = darfus_g2a1_20260818_163000z
DISPOSABLE_MIGRATION_PROOF = PASS
DISPOSABLE_POLICY_INTEGRATION = PASS

OFFICIAL_DB_WRITES_THIS_CONTROL = 0
OFFICIAL_DB_MIGRATION_APPLIED = NO
MAIN_RUNTIME_RESTARTED = NO
BUILD_RUN = NO
FRONTEND_SOURCE_CHANGED = NO
MAIN_RUNTIME_PROTECTED = YES

FOCUSED_TESTS = 22 PASS + 6 G2A1 unit/static PASS + 1 Disposable API PASS
FOCUSED_TESTS_PASS = YES
TYPECHECK = PASS
STATIC_PROOF = PASS
RUNTIME_PROOF = PASS_ON_DISPOSABLE_ONLY
DB_ASSERTIONS = PASS_ON_DISPOSABLE; OFFICIAL_UNCHANGED
ACCOUNTING_PAYABLE_PROOF = NOT_IN_SCOPE_AND_UNCHANGED
IDEMPOTENCY_PROOF = NOT_IN_SCOPE_AND_UNCHANGED
LEGACY_COMPATIBILITY_PROOF = PASS_FOR_NON_TAX_SETTINGS_AND_EXISTING_VAT_SEMANTICS

G2A2_IMPLEMENTED = NO
P0_BLOCKERS = 0
P1_BLOCKERS = 0
OWNER_DECISIONS_REQUIRED = 0
REFERENCE_CONFLICTS = 0
REGRESSIONS_INTRODUCED = 0

GATE = PASS_PHASE_03B_G2A1_MINIMUM_SAFE_UAE_TAX_ENGINE_AND_COMPANY_POLICY_IMPLEMENTATION
NEXT_RECOMMENDED_STEP = 03B-G2A2-TRANSACTION-TAX-TREATMENT-SNAPSHOT-AND-PRECIOUS-GOODS-RCM-ELIGIBILITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**G2A1 COMPLETE → OWNER REVIEW → NEXT BATCH ONLY AFTER EXPLICIT APPROVAL → STOP**
