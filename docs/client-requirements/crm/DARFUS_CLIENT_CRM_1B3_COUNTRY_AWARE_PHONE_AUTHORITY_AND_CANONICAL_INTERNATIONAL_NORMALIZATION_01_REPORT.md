# DARFUS ERP — CRM-1B3 Country-Aware Phone Authority & Canonical International Normalization

Control ID: `DARFUS-CLIENT-CRM-1B3-COUNTRY-AWARE-PHONE-AUTHORITY-AND-CANONICAL-INTERNATIONAL-NORMALIZATION-01`  
Project: `I:\WORK\jewellery-erp-master`  
Official database: `darfus_erp`  
Mode: Read-first forensic review; no CRM-1B3 source, migration, test, or database mutation was performed.

## 1. Executive Summary

تم فحص سلطة الهاتف في المصدر والـschema وقاعدة `darfus_erp` قراءة فقط. النتيجة المؤكدة: النظام الحالي يملك هاتفًا خامًا للعميل وتطبيعًا قديمًا يعتمد على حذف غير الأرقام ثم حذف الأصفار من البداية، لكنه لا يملك `phoneCountry` أو `countryCode` للعميل، ولا parser دوليًا أو country metadata مثبتًا.

لذلك تم إيقاف الجزء country-aware عند بوابة السلامة. لا يجوز اختيار دولة الهاتف من الجنسية أو من locale/currency، ولا يجوز اعتبار الدولة النصية للعنوان أو الدولة العامة للشركة سلطة هاتف بدون قرار صريح. لم تُشغّل Migration CRM-1B2 على القاعدة الرسمية، ولم تُنشأ كتابة أو backfill أو إعادة كتابة للقطات التاريخية.

| Result | Actual evidence |
|---|---|
| Country authority | غير مثبتة في النظام الحالي |
| Canonical international parser | غير موجود في dependencies أو `node_modules` |
| Official DB | reachable as `darfus_erp`; read-only evidence only |
| Existing customers | 3; no null/blank phone; no current-normalizer duplicates |
| CRM-1B2 migration on official DB | 0 rows; functional unique index absent |
| New country-aware proof | BLOCKED until authority/parser/storage are Owner-frozen |
| Gate | `BLOCKED_CRM_1B3_COUNTRY_AUTHORITY_UNRESOLVED` |

## 2. Frozen Owner Policy

| Policy | Frozen value | Evidence |
|---|---|---|
| Phone uniqueness | `ONE_REAL_PHONE_NUMBER_PER_CUSTOMER_PER_COMPANY` | CRM-1B3 control and CRM-1B2 authority |
| Shared phone | `NO` | CRM-1B3 control |
| Customer identity | `Customer.id` | CRM-1A/CRM-1B2 authority |
| Company scope | `Customer.companyId` | `backend/src/models/customer.model.js:7-15` and controller scope |
| Branch role | `BranchCustomer` relationship, not a second customer identity | CRM-1A/CRM-1B2 authority |
| Historical snapshots | Must remain unchanged | CRM-1B3 control |

The frozen uniqueness policy remains valid. What is not frozen is how two representations from different numbering contexts become the same real phone number.

## 3. Read-First

`READ_FIRST = PASS`.

The complete CRM-1B3 control was read before this report. The following prior authority/report artifacts and current source areas were reviewed:

- `docs/client-requirements/crm/DARFUS_CLIENT_CRM_1B2_CANONICAL_PHONE_UNIQUENESS_AND_CONCURRENCY_HARDENING_01_REPORT.md`
- `docs/client-requirements/crm/DARFUS_CUSTOMER_DUPLICATE_DETECTION_AUTHORITY.md`
- `docs/client-requirements/crm/DARFUS_CLIENT_CRM_1B_DUPLICATE_CUSTOMER_DETECTION_AND_REVIEW_SAFE_CONTROL_01_REPORT.md`
- `docs/client-requirements/crm/DARFUS_CLIENT_CRM_1A_CUSTOMER_IDENTITY_AND_FIELD_AUTHORITY_SAFE_FOUNDATION_01_REPORT.md`
- `docs/client-requirements/crm/DARFUS_CUSTOMER_CANONICAL_IDENTITY_AND_FIELD_AUTHORITY.md`
- Customer, Company, Branch, Setting, auth/context, address, duplicate detection, POS lookup/summary, invoice snapshot, reservation receipt, and Customer UI source
- CRM-1B2 focused and bounded regression tests

No source file was edited for CRM-1B3. No migration was run. The existing CRM-1B2 evidence was not rewritten.

## 4. Current Country Sources

| Candidate authority | Current source | Scope | Reliability for phone country | Can drive phone parsing now? |
|---|---|---|---|---|
| Explicit phone-country selector | None found | Per input | Would be high if added and frozen | NO; absent |
| Customer country | No `customers.country` column/model field | None | None | NO |
| Customer primary-address country | `customers.addresses` JSONB, `country` free text; resolved by `resolvePrimaryAddress` | Per address | Address country is not proven phone country; text is not constrained to ISO/calling metadata | NO |
| Customer nationality | `customers.nationality` free text | Per customer | Explicitly not equivalent to phone country | NO |
| Company country | `companies.country` nullable free string | Per company | Company domicile/default is not a customer phone-country authority; current official value is empty | NO |
| Branch country | No `branches.country`; only free-text `branches.address` and `phone` | Per branch | No country field or mapping | NO |
| Company settings | No distinct phone-country setting; general settings persist company/profile fields | Per company | No proven phone-country meaning | NO |
| Supplier country | `suppliers.country` | Supplier only | Not a Customer phone authority | NO |
| System locale | `ar`/`en` UI locale | Request/UI | Language is not numbering context | NO |
| Currency | Company/settings currency, official value `AED` | Company | Currency is not phone country | NO |
| Raw phone prefix | `Customer.phone` | Per value | Not sufficient to resolve local numbers safely | NO |

The current server whitelist accepts `country` as a Company Profile field, but it does not constrain the value or make it a phone-country authority. The customer address sanitizer accepts `country` as arbitrary text. Neither behavior proves a country-code mapping.

`NATIONALITY != PHONE COUNTRY` is preserved as a hard rule.

## 5. Company/Branch Country Model

| Question | Proven result |
|---|---|
| Company country model | One nullable free-text `companies.country`; no ISO/calling-code constraint |
| Branch country model | No country attribute; Branch has `address` and `phone` only |
| Multiple companies in different countries | Tenant model supports multiple Company rows by `companyId`, but country-aware phone behavior is not proven |
| Multiple branches in different countries | Not supported by a proven Branch-country model |
| Official current company country | `NULL`/empty; currency `AED` |
| Official current branch country | None; one branch address is the literal text `EGYPT`, not a structured country field |
| Locale as country | Not valid; AR/EN locale is presentation context only |

Source evidence: `backend/src/models/company.model.js:17-27`, `backend/src/models/branch.model.js:7-34`, `backend/src/services/customer-address.service.js:3-114`, and `contexts/auth-context.tsx`/`contexts/settings-context.tsx` country fields.

## 6. Phone Authority Candidates

The control's preference order was evaluated, not silently frozen:

1. Explicit phone country selected by the user — currently absent; this is the safest future input authority.
2. Customer Primary Address country — present as free text, but its business meaning is address location, not phone numbering context.
3. Company/Branch default phone country — no distinct setting/Branch field is present, and the official Company country is empty.
4. Require explicit country — the only fail-closed behavior that can avoid guessing when the above are unavailable.

**Decision:** `COUNTRY_AUTHORITY = OWNER_DECISION_REQUIRED_EXPLICIT_PHONE_COUNTRY_VS_APPROVED_FALLBACK`.

No country was inferred from `nationality`, locale, currency, branch address text, or customer name. No new selector was implemented.

## 7. Existing Phone Libraries/Utilities

Dependency audit:

| Candidate | Present in root/backend manifest or installed module? | Current finding |
|---|---:|---|
| `libphonenumber` | No | Not available |
| `libphonenumber-js` | No | Not available |
| `awesome-phonenumber` | No | Not available |
| `react-phone-number-input` | No | Not available |
| `intl-tel-input` | No | Not available |
| Country metadata package | No matching dependency found | Not available |
| Existing phone parser utility | No | Only digits-only helper exists |

Current utility: `backend/src/services/customer-phone.service.js:1-4`:

```js
String(phone).replace(/[^0-9]/g, "").replace(/^0+/, "")
```

The equivalent PostgreSQL expression is used by CRM-1B2's proposed functional index. It is not an international parser and does not prove national-number validity.

Safe options for a future Owner decision:

| Option | Server support | Browser support | Validation/metadata | Risk/status |
|---|---|---|---|---|
| Adopt one audited `libphonenumber`-family implementation at the server boundary | Yes | Browser would consume server result unless a shared package is approved | Strong when metadata/version is frozen | Requires dependency and policy approval; not installed |
| Adopt `libphonenumber-js` with a deliberately selected metadata profile | Yes | Yes | Strong when metadata/version is frozen | Bundle/metadata and version choices require approval; not installed |
| Custom country-prefix mapping | Possible | Possible | Incomplete and easy to get wrong | Rejected as unsafe custom parser |

No dependency was installed automatically.

## 8. Canonical Format Design

The target to evaluate is an E.164-style semantic value:

```text
+<country calling code><national significant number>
```

This is a target design only. It is not a frozen implementation contract because the phone-country authority, parser library, metadata version, invalid-number policy, and storage model are unresolved.

Required future decisions:

- how country is explicitly selected or safely resolved;
- which parser/metadata version is the authority;
- whether extensions are rejected or stored separately;
- whether short/service codes are rejected;
- whether local forms are accepted only with an explicit country;
- how display/raw input and canonical comparison values coexist.

`CANONICAL_PHONE_FORMAT = E164_STYLE_TARGET_PENDING_OWNER_FREEZE`.

## 9. Raw vs Canonical Storage Decision

| Option | Compatibility | International integrity | Historical risk | CRM-1B3 result |
|---|---|---|---|---|
| A. Keep raw `phone` plus persisted `canonical_phone` | Preserves display/API input; requires dual-field contract and migration | Strong if parser and write authority are centralized | Backfill/dual-write impact | Recommended candidate, not frozen |
| B. Replace `phone` with canonical value | Simple comparison | Potentially strong | Changes display, API, and assumptions; risks historical/contact semantics | Not recommended |
| C. Keep raw `phone` plus functional DB expression | Preserves raw data and old API | Current expression is not country-aware | Does not solve international equivalence | CRM-1B2 only; cannot be promoted unchanged |

`RAW_PHONE_STORAGE_POLICY = KEEP_CUSTOMER_PHONE_RAW_AND_HISTORICAL`.

`CANONICAL_PHONE_STORAGE_POLICY = OWNER_DECISION_REQUIRED`.

The existing CRM-1B2 choice of a functional expression is proven only for its old digits-only normalization. It is not accepted as the final country-aware design.

## 10. International Test Matrix

The matrix below is a read-only proof of the current helper using synthetic examples. It is not a replacement for the future authoritative parser.

| Country/context | Input form | Current helper output | International equivalence expected under a future frozen parser | Current result |
|---|---|---|---|---|
| Egypt | `01013054967` local | `1013054967` | Must be resolved only with explicit Egypt authority | Not equivalent to current `+` form |
| Egypt | `+201013054967` | `201013054967` | Same real-number group as Egypt local | Current helper differs |
| Egypt | `00201013054967` | `201013054967` | Same real-number group as Egypt `+` form | Current helper groups with `+`, not local |
| UAE | `0501234567` local | `501234567` | Must be resolved only with explicit UAE authority | Not equivalent to current `+` form |
| UAE | `+971501234567` | `971501234567` | Same real-number group as UAE local | Current helper differs |
| UAE | `00971501234567` | `971501234567` | Same real-number group as UAE `+` form | Current helper groups with `+`, not local |
| Saudi Arabia | `0501234567` local | `501234567` | Must be resolved only with explicit Saudi authority | Current helper differs |
| Saudi Arabia | `+966501234567` | `966501234567` | Same real-number group as Saudi local | Current helper differs |
| Saudi Arabia | `00966501234567` | `966501234567` | Same real-number group as Saudi `+` form | Current helper groups with `+`, not local |
| UAE vs Saudi synthetic local values | `0501234567` in each country | `501234567` in both | Must not be treated as the same international number | Current helper creates a false same-company collision risk |

Conclusion: the current helper neither joins local and international forms nor preserves country distinction for identical local prefixes. No fake equivalence logic was added.

## 11. Invalid/Ambiguous Input Policy

Current behavior is not an international validation contract:

| Input | Current source behavior | Safe country-aware disposition |
|---|---|---|
| Empty | UI marks phone required; helper returns empty; Customer model is `allowNull: false`, but no international validity proof exists | Owner decision; reject before canonical write |
| Too short/too long | No length validation in helper | Require parser validation/correction |
| Letters | Non-digits are removed; this can hide invalid input | Reject or require correction; never silently accept as canonical |
| Invalid country code | No country parser | Reject/require correction |
| Local number without country authority | Digits are stripped only | Require explicit country or approved fallback |
| Extension | Punctuation/letters are stripped; no extension contract | Owner decision; safest default is reject until separately modeled |
| Service/short code | No classification | Owner decision; do not treat as a normal Customer mobile identity |

`INVALID_INPUT_POLICY = OWNER_DECISION_REQUIRED`; there is no silent legacy-unverified policy frozen by this control.

## 12. Main DB Canonicalization Preview

Connection proof:

```text
current_database|current_user
darfus_erp|postgres
```

Schema proof:

- `customers.phone` exists and is non-null in the model/schema.
- `customers.nationality` exists; it is not a phone-country field.
- `customers.addresses` is JSONB and can contain a free-text `country`.
- `customers.canonical_phone`, `customers.phone_country`, and `customers.phone_country_code` do not exist.
- `customers_company_id_canonical_phone_uq` is absent on the official DB.
- CRM-1B2 migration row count is `0`.

Read-only per-customer preview (phones are masked in this report):

| Customer | Raw phone (masked) | Available country authority | Current helper result | Future canonical candidate | Validation | Collision |
|---|---|---|---|---|---|---|
| `CUS-0001` | `01***67` | Primary address text `Egypt`; no phone-country authority | `1013054967` | Not computed; parser/authority not frozen | Legacy-normalizer-only | No current collision |
| `CUS-0002` | `01***38` | Primary address text `Egypt`; no phone-country authority | `1024237538` | Not computed; parser/authority not frozen | Legacy-normalizer-only | No current collision |
| `CUS-0003` | `01***67` | Primary address text `Egypt`; no phone-country authority | `1144223567` | Not computed; parser/authority not frozen | Legacy-normalizer-only | No current collision |

`MAIN_DB_PHONE_CANONICALIZATION_PREVIEW = COMPLETE` in the permitted forensic sense: every current Customer row was inspected without UPDATE/backfill. A country-aware canonical value is intentionally not fabricated.

Official customer facts:

| Check | Result |
|---|---:|
| Customer rows | 3 |
| Null phone rows | 0 |
| Blank phone rows | 0 |
| Raw `(company_id, phone)` duplicate groups | 0 |
| CRM-1B2 normalizer duplicate groups | 0 |
| Primary address country missing | 0 |
| Official CRM-1B2 migration rows | 0 |
| Official country-aware canonical columns | 0 |

The primary-address country is available for these rows, but it remains an unvalidated address string and was not promoted to phone authority.

## 13. Collision Inventory

| Collision class | Official result | Interpretation |
|---|---:|---|
| Current raw duplicate groups | 0 | Current baseline is clean under raw equality |
| Current CRM-1B2 normalized duplicate groups | 0 | Current baseline is clean under old helper |
| Country-aware canonical collisions | Not computed | Parser and country authority are unresolved |
| Official local-vs-international collision | Not evidenced | Official rows are local Egyptian-looking values with address text `Egypt`; no authoritative conversion was applied |
| Synthetic cross-country local-prefix risk | Demonstrated by helper matrix | UAE and Saudi local forms can collapse to the same old digits-only output |

No Customer was merged, deleted, rewritten, or selected as a survivor. `COUNTRY_AWARE_COLLISIONS = UNDETERMINED_PENDING_AUTHORITY_AND_PARSER`.

## 14. System-Wide Impact Matrix

| Consumer | Current authority/path | Country-aware impact | Action in CRM-1B3 |
|---|---|---|---|
| Customer create | `ErpController.createCustomerWithContract`; raw `phone`; duplicate service | Must receive chosen country/parser result before future canonical uniqueness | No change |
| Customer update | `updateCustomerWithContract`; same current helper and company scope | Must preserve self-exclusion and race handling with new canonical value | No change |
| Duplicate review | `GET /customers/duplicate-check` | Must use the same future canonical authority | No change |
| POS lookup | `GET /pos/customer-lookup`; current helper; active/company scope | Local/international lookup parity will require bounded adaptation | No change |
| POS summary | Customer phone projection | Display/raw compatibility must be preserved | No change |
| Invoice snapshots | `customer_phone_snapshot` stores raw contact snapshot | Historical snapshots must not be rewritten; future snapshot contract needs review | No change |
| Reservation receipt | Reads current Customer phone in receipt projection | Country-aware display/identity impact to be bounded later | No change |
| Gift Voucher/CGP/Loyalty | Customer identity linkage; no separate Customer-phone authority found | Must consume Customer identity without a second phone owner | No change |
| Reports/exports | Reads Customer phone | Must preserve raw/display semantics | No change |
| Security/RBAC | Existing auth, permissions, company/branch scope | Must remain unchanged | No change |
| Accounting/Inventory | No Customer phone authority for posting/asset identity | No direct business-rule change authorized | No change |

`SYSTEM_WIDE_IMPACT_REVIEW = BLOCKED_FOR_COUNTRY_AWARE_IMPLEMENTATION; CURRENT_LEGACY_CONSUMER_MAP = COMPLETE`.

## 15. Disposable Clone

No new disposable clone or mutating rehearsal was run in CRM-1B3.

Reason: the authoritative country source, parser, invalid-input policy, and canonical storage strategy are not frozen. A disposable mutation before those decisions would prove an arbitrary design and could not serve as accepted evidence. The existing CRM-1B2 clone is retained as historical evidence of the old functional-index design and was not reused as 1B3 proof.

`DISPOSABLE_PROOF = BLOCKED_COUNTRY_AUTHORITY_UNRESOLVED`.

No official DB mutation occurred, and no test customer was created.

## 16. Create/Update Proof

CRM-1B2 legacy proof remains:

- focused duplicate detection tests: `13 pass, 0 fail`;
- unused phone create: successful on the isolated CRM-1B2 path;
- same old normalized phone: stable `409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED`;
- update excludes the same Customer ID;
- update-to-another-customer is rejected by precheck or named DB index on the CRM-1B2 clone.

CRM-1B3 country-aware create/update proof is blocked because there is no chosen country/parser/storage contract. No create/update mutation was attempted.

`CREATE_PHONE_UNIQUENESS = BLOCKED_FOR_COUNTRY_AWARE_SCOPE`  
`UPDATE_PHONE_UNIQUENESS = BLOCKED_FOR_COUNTRY_AWARE_SCOPE`.

## 17. Concurrency Proof

CRM-1B2 proved, on its isolated clone, one-success/one-conflict behavior for concurrent same-company creates and updates under the old canonical expression. That evidence remains valid only for the old normalization.

Country-aware concurrency proof is not claimed. It must be rerun after the Owner freezes:

- country authority;
- parser and metadata;
- canonical storage/index strategy;
- invalid/ambiguous input contract;
- company scope and soft-delete policy.

`CONCURRENCY_DUPLICATE_PROTECTION = BLOCKED_FOR_COUNTRY_AWARE_SCOPE`.

## 18. CRM-1B2 Migration Disposition

Migration under review: `backend/migrations/20260830010000-customer-phone-uniqueness.js`.

Current migration behavior:

- preflights null/empty old canonical values;
- preflights old-expression duplicate groups;
- creates functional unique index `customers_company_id_canonical_phone_uq`;
- does not add a persisted canonical field;
- has not been executed on `darfus_erp`.

Disposition:

`CRM1B2_MIGRATION_DISPOSITION = SUPERSEDE_BEFORE_MAIN_PROMOTION_PENDING_OWNER_DESIGN`.

It must not be promoted unchanged as the final country-aware authority. No corrective migration was created. The safest next step is to decide the country/parser/storage contract first, then replace or supersede the old migration before any official promotion gate.

## 19. Frontend Input Design Compatibility

Current customer create/edit UI evidence:

- `app/[locale]/(dashboard)/customers/page.tsx:681-690` renders one free-text phone input.
- `CustomerAddressFields` renders a separate free-text address country field; it is not bound to phone parsing.
- `lib/types.ts:227-254` has `Customer.phone`, `nationality`, and `addresses`, but no phone-country field.
- `lib/repositories/api-impl.ts:111-128` sends duplicate-check/create payloads without country context.

No frontend change was made. A future country selector, if Owner-approved, must have an accessible country name and calling code, keyboard support, screen-reader semantics, AR/EN labels, RTL/LTR behavior, and a server-authoritative payload. A flag-only selector is not sufficient.

## 20. AR/EN + RTL/LTR

Current evidence confirms AR/EN customer form localization and a localized phone label; it does not prove a country-aware selector because none exists. No browser mutation or country-aware UI proof was run.

`AR_EN_PHONE_COUNTRY_UI = NOT_APPLICABLE_CURRENTLY`  
`RTL_LTR_COUNTRY_INPUT = NOT_APPLICABLE_CURRENTLY`.

Future UI acceptance must cover AR/LTR? No: Arabic must be RTL and English LTR, with the phone value itself rendered in a stable numeric/LTR direction where appropriate. This is a future requirement, not an implemented claim.

## 21. Security

Security authority was preserved:

- Customer create/update and duplicate-check remain behind existing authenticated permission routes.
- Company scope remains server-derived from `req.companyId`.
- Branch membership remains a relationship/read-scope concern, not a phone identity override.
- POS lookup remains authenticated and company-scoped.
- No public phone lookup, shared account, permission, or RBAC change was introduced.

`SECURITY_INTEGRITY = PRESERVED`.

## 22. Focused Tests

Executed as current baseline, without CRM-1B3 source changes:

```text
node --test backend/tests/customer-duplicate-detection.test.cjs
13 pass, 0 fail
```

This test set proves CRM-1B2's old normalizer, duplicate signal contract, controller ordering, migration preflight contract, DB error mapping, company-row lock, update exclusion, and email policy. It does not prove country-aware parsing.

The synthetic international matrix was executed against the current helper and showed local/international non-equivalence plus a local-prefix cross-country collision risk. No 1B3 parser tests were added because no parser or country policy was approved.

`FOCUSED_TESTS = LEGACY_CRM_1B2_PASS; COUNTRY_AWARE_1B3_BLOCKED`.

## 23. Cross-Module Regression

The prior CRM-1B2 bounded suite completed `95 pass, 0 fail` across Customer, POS, Sales, Invoice, Reservation, Gift Voucher, CGP, Loyalty, and Permissions. No CRM-1B3 source was changed, so no new cross-module behavior was introduced.

Country-aware regression remains a future bounded requirement for Customer, POS lookup, invoice contact/snapshot display, reservations, Gift Voucher, CGP, Loyalty, reports, and permissions after the canonical contract is frozen.

`CROSS_MODULE_REGRESSION = LEGACY_BASELINE_PASS; COUNTRY_AWARE_SCOPE_BLOCKED`.

## 24. Typecheck

```text
npm run typecheck
PASS
```

This was a current source baseline check. No CRM-1B3 source or test file was changed.

`TYPECHECK = PASS`.

## 25. Build

```text
npm run build
PASS — Next.js 16.2.9
```

`next-env.d.ts` SHA-256 before and after build:

```text
7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651
7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651
```

No Next dev process was started.

`BUILD = PASS`.

## 26. Main DB Safety

Read-only runtime/database checks:

| Check | Result |
|---|---|
| Main DB | `darfus_erp` |
| DB user | `postgres` |
| PostgreSQL | 16.15 |
| Migration count | 93 |
| CRM-1B2 migration rows | 0 |
| Country-aware customer columns | 0 |
| Official Customer mutation in this control | 0 |
| Official reference/financial/inventory mutation | 0 |
| Historical snapshots rewritten | 0 |
| Migrations executed | 0 |

Runtime health GET evidence:

```text
GET /api/v1/health      200
GET /api/v1/health/db   200
GET /api/v1/health/redis 200
```

No backup, restore, seed, POST, PUT, PATCH, DELETE, or direct SQL write was used in CRM-1B3.

## 27. Owner Decision Packet

The following items require an explicit Owner decision before implementation or main migration:

| Packet item | Current result | Decision required |
|---|---|---|
| `COUNTRY_AUTHORITY` | No proven phone-country authority; explicit selector is absent | Freeze explicit selector vs approved address/company fallback; fail closed otherwise |
| `PHONE_INPUT_MODEL` | Raw free-text phone only | Freeze whether UI sends `{phone, phoneCountry}` or an equivalent authoritative object |
| `CANONICAL_FORMAT` | E.164-style is only a target | Freeze exact parser output and extension policy |
| `NORMALIZATION_LIBRARY_OR_UTILITY` | No existing parser dependency | Approve one maintained parser/metadata authority; do not use custom mapping |
| `RAW_PHONE_STORAGE_POLICY` | Preserve raw `Customer.phone` | Confirm raw display/history remains immutable input evidence |
| `CANONICAL_PHONE_STORAGE_POLICY` | Not frozen | Choose persisted `canonical_phone` vs another proven design |
| `DB_UNIQUENESS_STRATEGY` | CRM-1B2 functional index is old-format only | Decide replacement/superseding unique strategy after parser freeze |
| `EXISTING_DATA_IMPACT` | 3 customers, 0 old collisions; country-aware result uncomputed | Approve read-only preview methodology and collision handling |
| `COLLISION_COUNT` | 0 under old helper; country-aware unknown | Do not merge/delete/select survivor automatically |
| `BACKFILL_REQUIRED` | Unknown until storage/parser are frozen | Decide whether a controlled backfill is allowed and how historical evidence is protected |
| `MIGRATION_PLAN` | Do not promote CRM-1B2 unchanged | Approve replacement/superseding migration plan |
| `ROLLBACK_PLAN` | Old clone `down` evidence exists; final design rollback not defined | Define schema/data rollback before official promotion |
| `POS_IMPACT` | Existing lookup uses old helper | Approve bounded adapter and parity proof |
| `API_IMPACT` | Existing create/update/duplicate-check contracts carry raw phone only | Freeze version-compatible country payload contract |
| `FRONTEND_IMPACT` | One raw phone input; no country selector | Approve minimal accessible selector/input design |
| `REGRESSION_RADIUS` | Customer, POS, invoice snapshots, reservations, GV, CGP, Loyalty, reports, permissions | Approve bounded regression set |
| `OWNER_APPROVAL_REQUIRED` | YES | Required before dependency/migration/main DB gate |

## 28. Gate

The current control cannot pass the country-aware implementation/proof gate because the required authority is unresolved.

```text
READ_FIRST = PASS
MAIN_DB_PHONE_CANONICALIZATION_PREVIEW = COMPLETE
HISTORICAL_PHONE_SNAPSHOTS_REWRITTEN = NO
CRM1B2_MIGRATION_NOT_PROMOTED = YES
OFFICIAL_DB_WRITES = 0
COUNTRY_AUTHORITY = UNRESOLVED
PARSER_AUTHORITY = UNRESOLVED
DISPOSABLE_PROOF = BLOCKED
```

`GATE = BLOCKED_CRM_1B3_COUNTRY_AUTHORITY_UNRESOLVED`

This is a controlled design/evidence block, not a claim that the existing CRM-1B2 same-format uniqueness evidence failed. The old CRM-1B2 proof remains historical and scoped to the old normalization.

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-CRM-1B3-COUNTRY-AWARE-PHONE-AUTHORITY-AND-CANONICAL-INTERNATIONAL-NORMALIZATION-01
OWNER_PHONE_POLICY = ONE_REAL_PHONE_NUMBER_PER_CUSTOMER_PER_COMPANY
SHARED_PHONE_ALLOWED = NO

COUNTRY_AUTHORITY = OWNER_DECISION_REQUIRED_EXPLICIT_PHONE_COUNTRY_VS_APPROVED_FALLBACK
COMPANY_COUNTRY_MODEL = SINGLE_NULLABLE_FREE_TEXT_COMPANIES_COUNTRY; OFFICIAL_VALUE_EMPTY
BRANCH_COUNTRY_MODEL = NONE_PROVEN; BRANCH_HAS_NO_COUNTRY_FIELD
PHONE_INPUT_MODEL = CURRENT_RAW_PHONE_ONLY_NO_PHONE_COUNTRY
CANONICAL_PHONE_FORMAT = E164_STYLE_TARGET_PENDING_OWNER_FREEZE
NORMALIZATION_AUTHORITY = CURRENT_DIGITS_ONLY_LEADING_ZERO_STRIP_ONLY; NOT_INTERNATIONAL

MAIN_DB_PHONE_CANONICALIZATION_PREVIEW = COMPLETE_READ_ONLY_NO_BACKFILL
COUNTRY_AWARE_COLLISIONS = UNDETERMINED_PENDING_AUTHORITY_AND_PARSER
CRM1B2_MIGRATION_DISPOSITION = SUPERSEDE_BEFORE_MAIN_PROMOTION_PENDING_OWNER_DESIGN

DISPOSABLE_PROOF = BLOCKED_COUNTRY_AUTHORITY_UNRESOLVED
CREATE_PHONE_UNIQUENESS = BLOCKED_FOR_COUNTRY_AWARE_SCOPE
UPDATE_PHONE_UNIQUENESS = BLOCKED_FOR_COUNTRY_AWARE_SCOPE
CONCURRENCY_DUPLICATE_PROTECTION = BLOCKED_FOR_COUNTRY_AWARE_SCOPE
SYSTEM_WIDE_IMPACT_REVIEW = LEGACY_CONSUMER_MAP_COMPLETE_COUNTRY_AWARE_BLOCKED

FRONTEND_DESIGN_FREEZE = PRESERVED
SECURITY_INTEGRITY = PRESERVED
TYPECHECK = PASS
BUILD = PASS

MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_MIGRATIONS_EXECUTED = 0
CUSTOMER_ID_MUTATION = 0
MERGE_EXECUTED = NO
HISTORICAL_PHONE_SNAPSHOTS_REWRITTEN = NO

P0 = 0
P1_REGRESSION = 0
COUNTRY_AUTHORITY_GATE_BLOCKER = 1

GATE = BLOCKED_CRM_1B3_COUNTRY_AUTHORITY_UNRESOLVED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_COUNTRY_AWARE_PHONE_AUTHORITY_AND_MAIN_MIGRATION_PACKET
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

Do not run CRM-1B2 or CRM-1B3 phone migration on `darfus_erp`. Do not merge customers, rewrite phone values or historical snapshots, remap references, add a new parser dependency, add a phone-country field, or start CRM-1C until the Owner freezes the decision packet above.

`FULL CRM-1B3 FORENSIC REVIEW COMPLETE → OWNER REVIEW → COUNTRY AUTHORITY DECISION → WAIT FOR EXPLICIT APPROVAL`
