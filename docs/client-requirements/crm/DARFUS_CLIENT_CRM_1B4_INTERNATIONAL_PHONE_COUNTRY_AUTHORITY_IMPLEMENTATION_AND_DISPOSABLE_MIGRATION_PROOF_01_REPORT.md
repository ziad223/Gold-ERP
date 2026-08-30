# DARFUS ERP — CRM-1B4 International Phone Country Authority

Control ID: `DARFUS-CLIENT-CRM-1B4-INTERNATIONAL-PHONE-COUNTRY-AUTHORITY-IMPLEMENTATION-AND-DISPOSABLE-MIGRATION-PROOF-01`

تم تنفيذ الحد الأدنى الآمن في مسار CRM‑1B4، وإثباته على Disposable Clone فقط. نجحت اختبارات الكود، الترحيل المعزول، canonical phone، العزل بين الشركات، واختبارات التزامن. لم تُنفذ أي كتابة على `darfus_erp`. إثبات المتصفح AR/EN محجوب بيئيًا لأن Browser harness لم يبدأ؛ لذلك البوابة النهائية BLOCKED وليست PASS.

## 1. Executive Summary

| Item | Result | Evidence |
|---|---|---|
| Explicit country authority | PASS | `customer-phone.service.js:18-57`; clone tests |
| Canonical E.164-style phone | PASS | EG/AE/SA local, `+`, `00` equivalence |
| Raw/canonical separation | PASS | Customer model and clone rows |
| Company-scoped uniqueness | PASS | Named unique index on clone |
| Create/update/concurrency | PASS | `[201,409]` create; `[200,409]` update |
| Official DB safety | PASS | `current_database()=darfus_erp`; no migration/write issued |
| AR/EN live browser evidence | BLOCKED | Browser harness kernel asset failure; port 3000 not listening |

## 2. Frozen Owner Decisions

- One real phone per customer per company; shared phone is rejected.
- `phoneCountry` is explicit per-customer authority.
- `defaultPhoneCountry` is a UI default only; it does not infer or overwrite customer country.
- Branch, nationality, address country, locale, currency, and branch address are not phone-country authorities.
- Canonical persisted identity is parser-produced; raw `Customer.phone` is retained.
- Official DB remains read-only in this control.
- Historical rows are not backfilled or rewritten.

## 3. Read-First

Read-first coverage included the CRM‑1B4 control, prior CRM phone/duplicate authorities, Customer/Company/Branch models, Customer CRUD and duplicate service, POS lookup, settings/auth context, address handling, invoice/transaction consumers, migrations, package manifests, focused tests, and current worktree state. The control attachment was read completely (SHA-256: `5CE143DDA671B469B562664322DF3389F22FEB07B478983A7AFBBF993A0D6AE2`).

## 4. Repository Baseline

| Field | Value |
|---|---|
| Project | `I:\WORK\jewellery-erp-master` |
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Pre-control worktree | already dirty; 146 tracked modified/staged entries and 900 untracked entries recorded before report creation |
| Stashes | 11 |
| `next-env.d.ts` SHA-256 | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` |
| Source ownership | unrelated pre-existing drift preserved; no reset/restore/clean/stash |

## 5. Parser Dependency Authority

| Check | Result |
|---|---|
| Package | `libphonenumber-js` |
| Version | `1.13.12` in root and backend manifests/lockfiles |
| Metadata/runtime | `libphonenumber-js/max`, Node `v24.19.0` |
| npm | `11.17.0` |
| Parser examples | EG `01012345678 → +201012345678`; AE `0501234567 → +971501234567`; SA `0501234567 → +966501234567` |
| Custom country map | Not introduced |
| Authority | Server parser and server validation; client helper is presentation/pre-validation only |

## 6. Phone Country Contract

`phoneCountry` is required for new phone-bearing Customer writes, must be exactly two uppercase ASCII letters, and must be supported by the parser. Missing, unsupported, ambiguous, invalid, extension-bearing, or country-mismatched input fails closed. The server ignores any client-supplied canonical value as authority.

## 7. Company Default Phone Country

`companies.default_phone_country` is nullable and exposed as `defaultPhoneCountry`. It is used only to preselect the UI country selector. No Customer country is inferred from it, and no historical row is changed. No branch-level or nationality-based default was added.

## 8. Canonical Phone Service

`backend/src/services/customer-phone.service.js:18-87` centralizes country normalization, `libphonenumber-js/max` parsing, validity/country-match checks, and stable `AppError` contracts. The result contains raw input, normalized country, parser-produced canonical phone, validity, and safe error code. No strip-and-accept fallback is used.

## 9. Raw vs Canonical Storage

`Customer.phone` remains the raw user-entered phone. `Customer.phoneCountry` stores the explicit ISO country. `Customer.canonicalPhone` stores the server-produced canonical number. The client never becomes the canonical authority.

## 10. Schema Design

The additive migration `backend/migrations/20260830020000-customer-phone-country-canonical.js` adds nullable `companies.default_phone_country`, `customers.phone_country`, and `customers.canonical_phone`, then creates:

```sql
CREATE UNIQUE INDEX customers_company_id_canonical_phone_uq
ON public.customers (company_id, canonical_phone);
```

The index is company-scoped and permits legacy null canonical values while unresolved rows remain. The migration is transactional and has a reversible `down` path. No official migration was executed.

## 11. Legacy Existing Rows

Official `darfus_erp` has 3 existing Customers with raw phones and no new columns because the migration was not promoted. Primary addresses show Egypt in the read-only snapshot, but no country was inferred. Legacy status is explicitly unresolved; new writes require explicit country.

## 12. CRM-1B2 Migration Supersession

`20260830010000-customer-phone-uniqueness.js` remains historical and is not promoted unchanged. CRM‑1B4 supplies `20260830020000-customer-phone-country-canonical.js`, which removes the historical named-index conflict on the clone and creates the final company-scoped canonical index. The complete sequence was rehearsed on the clone; the official database remains at its pre-promotion state.

## 13. Duplicate Detection

`backend/src/services/customer-duplicate-detection.service.js:16-111` uses `canonicalPhone` as the primary phone signal when server-resolved. Same local/international/`00` forms in the same country converge. Same local digits in different countries resolve to different canonical identities. Name remains a review signal; email was not made a hard uniqueness authority.

## 14. Create Flow

`backend/src/controllers/erp.controller.js:302-326` canonicalizes and validates before the Customer transaction, runs company-scoped duplicate detection, persists raw/country/canonical values, and maps DB races to `CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED`. Clone proof: missing country rejected with no row; valid EG and AE creates committed; duplicate EG returned stable `409`.

## 15. Update Flow

`backend/src/controllers/erp.controller.js:392-423` recanonicalizes when phone or country changes, excludes the current Customer from duplicate precheck, preserves expected-version conflict handling, and relies on the same unique index for the final race. Clone proof: one concurrent update committed (`200`) and the stale competing update returned `409 CUSTOMER_UPDATE_CONFLICT`.

## 16. POS/Search Compatibility

`backend/src/routes/erp.routes.js:5260-5310` requires explicit phone country for phone lookup, resolves canonical identity server-side, keeps the existing permission/company scope, and does not infer country from locale or currency. `app/[locale]/(dashboard)/pos/page.tsx:123-124,506,1366-1367` adds the selector and sends `phoneCountry`; the server remains authoritative.

## 17. Frontend Country Selector

`features/customers/components/PhoneCountrySelect.tsx` is a native accessible select displaying localized country name and calling code. It is reused in Customer list/create, Customer details/edit, POS lookup, and Settings. AR/EN labels and RTL/LTR layout are source-wired. Browser interaction evidence is pending because the browser harness was unavailable; no UI PASS is claimed.

## 18. Historical Snapshot Protection

Invoice, reservation, CGP, Gift Voucher, accounting, inventory, and historical snapshot authorities were not rewritten. The change adds Customer identity fields and lookup authority only; no existing document IDs, snapshots, assets, barcodes, journals, or financial rows were changed.

## 19. Disposable Clone

| Clone | Evidence |
|---|---|
| `darfus_crm_1b4_phone_country_20260831` | Restored from `backend/acceptance-artifacts/crm-1b2/darfus_erp_pre_crm_1b2.dump` (905,909 bytes; SHA-256 `12413099C0C50D293F2A452D6C09990AC2DBE8CAD8A05B490AD400A97CA6C489`), then full migrations |
| Final clone identity | `current_database()=darfus_crm_1b4_phone_country_20260831`, user `postgres` |
| Final clone state | 6 Customers total, 3 canonical new test rows, 6 `branch_customers` rows, new columns nullable, named unique index present |
| Rollback clone | `darfus_crm_1b4_phone_rollback_20260831`; down migration removed the new column/index/migration row, then reapply restored them |

The clone harness used synthetic test data only. No official business data was copied into the official database and no clone mutation was aimed at `darfus_erp`.

## 20. International Equivalence Matrix

| Country | Local | International `+` | International `00` | Result |
|---|---|---|---|---|
| EG | `01012345678` | `+201012345678` | `00201012345678` | same canonical |
| AE | `0501234567` | `+971501234567` | `00971501234567` | same canonical |
| SA | `0501234567` | `+966501234567` | `00966501234567` | same canonical |

Spaces, hyphens, and parentheses were covered by the parser-focused tests where valid. Invalid and extension-bearing values fail closed.

## 21. Cross-Country Separation

The same local digits `0505551234` resolve to different canonical phones for AE and SA. Clone proof confirmed no cross-country duplicate collision. `CROSS_COUNTRY_FALSE_COLLISION = 0`.

## 22. Create Concurrency

Two synthetic concurrent creates for the same customer phone, one local and one international, produced exactly one successful `201` and one stable duplicate `409`. The unique company/canonical index is the final race authority; no duplicate canonical rows remained.

## 23. Update Concurrency

Two synthetic updates targeting the same canonical phone with the same stale `expectedUpdatedAt` produced one `200` and one `409 CUSTOMER_UPDATE_CONFLICT`. No duplicate canonical rows were created.

## 24. Error Contracts

Stable application errors are used:

| Condition | Contract |
|---|---|
| Missing country | `422 CUSTOMER_PHONE_COUNTRY_REQUIRED` |
| Missing phone | existing `CUSTOMER_PHONE_REQUIRED` contract |
| Invalid phone | `422 CUSTOMER_PHONE_INVALID` |
| Country mismatch | `422 CUSTOMER_PHONE_COUNTRY_MISMATCH` |
| Company-scoped duplicate | `409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` |
| Update race/version conflict | existing `409 CUSTOMER_UPDATE_CONFLICT` |

Raw parser, SQL, or unique-index errors are not exposed as the public contract.

## 25. Security

User/Auth/RBAC remains authorization authority. Company and branch scope remain server-enforced. No shared account, permission widening, transaction-time account creation, fallback authority, or secret change was introduced. The company default is UI convenience only and cannot grant authorization.

## 26. System-Wide Impact

| Area | Impact | Disposition |
|---|---|---|
| Customer create/update | explicit country and canonical identity | Implemented and clone-proven |
| Duplicate review | canonical phone signal | Implemented and tested |
| POS customer lookup | country-aware canonical lookup | Implemented and tested statically |
| Sales/invoices/reservations/GV/CGP/loyalty/reports | no business-owner change | Existing authorities preserved; bounded regressions passed |
| DB | additive nullable fields and company unique index | Clone only; official promotion pending |
| Permissions/security | no change | Preserved |

## 27. Focused Tests

- `backend/tests/customer-phone-country-1b4.test.cjs`: CRM‑1B4 cases passed, including supported ISO validation, EG/AE/SA equivalence, invalid/missing/mismatch rejection, canonical duplicate authority, migration mapping, server boundaries, raw/canonical model separation, company default, and UI selector wiring.
- `backend/tests/customer-duplicate-detection.test.cjs`: existing duplicate contract passed.
- Combined focused CRM run: `24/24` passed in the focused pair.

## 28. Cross-Module Regression

Bounded regression passed with `92/92` tests:

- Customer/address/identity/invoice snapshot/CGP legacy isolation/master/POS summary plus CRM‑1B4: 53/53.
- POS status/making-charge/payment compatibility/Stage C: 29/29.
- D2 projection, CGP post UI sync, reservation associations: 10/10.

No unrelated full-suite claim is made.

## 29. Typecheck

`npm run typecheck` passed with exit code 0 (`tsc --noEmit`).

## 30. Build

`npm run build` passed. Next.js `16.2.9` compiled successfully, TypeScript completed, and 130/130 static pages generated. The accepted `next-env.d.ts` SHA remained unchanged.

## 31. AR Browser

`AR_BROWSER_PROOF = BLOCKED`. The required browser tool failed during kernel setup with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`. No AR interaction was claimed and no credentials/cookies were inspected. Frontend `localhost:3000` was not listening at the verification point.

## 32. EN Browser

`EN_BROWSER_PROOF = BLOCKED` for the same environment reason. No EN interaction was claimed. This is an evidence/tool blocker, not proof of a product defect.

## 33. Visual Freeze

`VISUAL_FREEZE = NOT_PROVEN`. Source wiring supports localized labels and native keyboard/touch selection, but the mandatory real-browser AR/EN, RTL/LTR, and responsive proof could not run. No visual PASS is asserted.

## 34. Main DB Safety

Read-only checks against the official runtime returned:

| Check | Result |
|---|---|
| `current_database()` | `darfus_erp` |
| `current_user` | `postgres` |
| `/api/v1/health` | 200 UP |
| `/health/db` | 200 PostgreSQL connected |
| `/health/redis` | 200 Redis connected |
| Customers | 3 |
| Assets | 23 |
| Journal entries | 74 |
| Idempotency requests | 162 |
| CRM‑1B4 columns on official DB | absent; migration not promoted |
| Official migration execution | 0 |
| Official business writes issued by this control | 0 |

The runtime containers were observed only: backend on `8000`, PostgreSQL on host `5433`, Redis on `6379`; PostgreSQL and Redis reported healthy. Existing historical reports contain different later counts for some unrelated tables; those are not used as an attributed before/after delta. Controlled operations in this batch issued no official write.

## 35. Legacy Reconciliation Preview

Artifact: `docs/client-requirements/crm/DARFUS_CUSTOMER_LEGACY_PHONE_COUNTRY_RECONCILIATION_PREVIEW.md`.

It lists the three existing Customer IDs with masked raw phones, address/company country observations, proposed `phoneCountry=UNRESOLVED`, and `canonical=NOT_COMPUTED`. No inference or backfill is authorized by this report.

## 36. Main Promotion Decision Packet

Not authorized in this control. A future promotion packet must separately include:

1. Owner approval for the exact official migration sequence.
2. Fresh verified backup and disposable rehearsal evidence.
3. Legacy reconciliation decisions for unresolved rows; no automatic address inference.
4. Active-business-write check immediately before any official apply.
5. Main-runtime refresh only after schema promotion, followed by AR/EN browser proof.

No official migration, backfill, or runtime restart was performed here.

## 37. Risks

| Risk | Severity | Classification | Disposition |
|---|---|---|---|
| Browser harness unavailable | P2 | ENVIRONMENT | Blocks mandatory AR/EN proof; no product PASS claimed |
| Official schema not promoted | P2 operational prerequisite | MIGRATION_STATE | Expected and safe; main runtime still uses pre-CRM‑1B4 schema |
| Three legacy phone rows unresolved | P2 | DATA/OWNER_DECISION | Reconciliation required before canonicalizing historical rows |
| Pre-existing dirty worktree | P2 evidence risk | SOURCE_DRIFT | Preserved and separated; no cleanup |
| Product security/data corruption | P0/P1 | None proven | 0 in this control |

## 38. Gate

Static implementation, focused tests, clone migration/rollback, international equivalence, company isolation, duplicate handling, and concurrency proof passed. Mandatory browser evidence did not run because the approved browser harness was unavailable and `localhost:3000` was not listening.

`GATE = BLOCKED_CRM_1B4_BROWSER_EVIDENCE_UNAVAILABLE`

This gate does not authorize official migration or CRM‑1C. The control must be resumed only for the missing browser evidence after the environment is repaired/available, then separately reviewed for official promotion.

## 39. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-CRM-1B4-INTERNATIONAL-PHONE-COUNTRY-AUTHORITY-IMPLEMENTATION-AND-DISPOSABLE-MIGRATION-PROOF-01
CURRENT_TRACK = CRM-1B4_INTERNATIONAL_PHONE_COUNTRY_AUTHORITY
MODE = READ_FIRST_THEN_MINIMUM_SAFE_IMPLEMENTATION_THEN_DISPOSABLE_MIGRATION_AND_CONCURRENCY_PROOF
OWNER_APPROVAL = EXPLICIT
EXECUTE_THIS_CONTROL = YES

OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
OFFICIAL_DB_MIGRATIONS_EXECUTED = 0
OFFICIAL_DB_BACKFILL = NO
DISPOSABLE_CLONE_PROOF = PASS
DISPOSABLE_CLONES = darfus_crm_1b4_phone_country_20260831, darfus_crm_1b4_phone_rollback_20260831

PARSER = libphonenumber-js/max
PARSER_VERSION = 1.13.12
PARSER_METADATA_PROFILE = max
PARSER_COMPATIBILITY = PASS_STATIC_AND_CLONE
PHONE_COUNTRY_AUTHORITY = EXPLICIT_CUSTOMER_PHONE_COUNTRY
CANONICAL_FORMAT = E164_STYLE
RAW_PHONE_PRESERVED = YES
CANONICAL_PHONE_PERSISTED_SEPARATELY = YES
COMPANY_DEFAULT_PHONE_COUNTRY = UI_DEFAULT_ONLY
BRANCH_PHONE_COUNTRY_AUTHORITY = NO
NATIONALITY_PHONE_COUNTRY_AUTHORITY = NO
ADDRESS_COUNTRY_PHONE_AUTHORITY = NO

SCHEMA_MIGRATION_CREATED = YES
SCHEMA_MIGRATION = 20260830020000-customer-phone-country-canonical.js
CRM_1B2_MIGRATION_STATUS = HISTORICAL_SUPERSEDED_NOT_PROMOTED
DB_UNIQUE_AUTHORITY = (company_id, canonical_phone)
LEGACY_ROWS_UNRESOLVED = 3
LEGACY_BACKFILL = NO

EG_EQUIVALENCE = PASS
AE_EQUIVALENCE = PASS
SA_EQUIVALENCE = PASS
CROSS_COUNTRY_FALSE_COLLISION = 0
CREATE_CONCURRENCY = PASS_ONE_201_ONE_409
UPDATE_CONCURRENCY = PASS_ONE_200_ONE_409
ROLLBACK_REHEARSAL = PASS
REAPPLY_REHEARSAL = PASS

CUSTOMER_CREATE_AUTHORITY = PASS
CUSTOMER_UPDATE_AUTHORITY = PASS
DUPLICATE_DETECTION_AUTHORITY = CANONICAL_PHONE
POS_LOOKUP_COUNTRY_CONTEXT = IMPLEMENTED_SERVER_AUTHORITY
RBAC_COMPANY_BRANCH_SCOPE = PRESERVED
HISTORICAL_SNAPSHOTS_REWRITTEN = NO

PRODUCT_SOURCE_PATHS_CHANGED = 24_INTENTIONAL_CRM_1B4_PATHS
TEST_FILES_CHANGED = 1
DOCUMENTATION_FILES_CHANGED = 3
MIGRATIONS_CREATED = 1
MIGRATIONS_EXECUTED_OFFICIAL = 0
PERSISTENT_OFFICIAL_DB_MUTATIONS = 0

FOCUSED_TESTS = PASS_24_OF_24
CROSS_MODULE_REGRESSION = PASS_92_OF_92
TYPECHECK = PASS
BUILD = PASS
AR_BROWSER = BLOCKED_ENVIRONMENT
EN_BROWSER = BLOCKED_ENVIRONMENT
VISUAL_FREEZE = NOT_PROVEN
MAIN_DB_DELTA_BY_CONTROLLED_OPERATIONS = 0

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 4_DOCUMENTED_ENVIRONMENT_DATA_PREREQUISITES
P3_COUNT = 0
PARSER_ERROR_CONTRACT = STABLE
SECURITY_STATUS = PRESERVED
ACCOUNTING_INVENTORY_SNAPSHOT_STATUS = PRESERVED

GATE = BLOCKED_CRM_1B4_BROWSER_EVIDENCE_UNAVAILABLE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_RERUN_AR_EN_BROWSER_PROOF_AND_SEPARATE_MAIN_PROMOTION_GATE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
CRM_1C = NOT_STARTED
```

STOP. No official migration, legacy backfill, CRM‑1C, merge/remap, or additional business mutation is authorized by this report.
