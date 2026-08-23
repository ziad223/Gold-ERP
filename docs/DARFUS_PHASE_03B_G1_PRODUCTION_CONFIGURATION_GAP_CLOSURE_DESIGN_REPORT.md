# DARFUS ERP — Phase 03B-G1 Production Configuration Gap-Closure Design

Control ID: DARFUS-PHASE-03B-G1-PRODUCTION-CONFIGURATION-GAP-CLOSURE-DESIGN  
Phase: 03B-G1  
Mode: READ_ONLY_GAP_CLOSURE_DESIGN  
Official DB: darfus_erp — READ ONLY  
Date: 2026-08-18

## 1. Executive Summary

تم تنفيذ G1 كتصميم قراءة فقط للفجوات الثلاث المحددة في Phase 03B:

1. Explicit VAT registration authority.
2. Explicit transaction tax treatment authority.
3. Canonical branch-scoped Location management and selection.

كما تم تتبع وإدراج تصميم إزالة الاعتماد الإنتاجي على free-text Location وعلى fallback باسم Showroom.

تم تعريف التصميم الأدنى الآمن للسلطات والتخزين والواجهات والصلاحيات والتدقيق والتوافق التاريخي وخطة الاختبارات والتنفيذ المرحلي. لم يتم تعديل Source أو Test أو Migration أو Config، ولم تتم أي كتابة على Official DB.

الـGate متوقف عمدًا لأن المصدر لا يثبت Accounting mapping مستقلًا لكل ZERO_RATED وEXEMPT وOUT_OF_SCOPE، ولا يثبت شرط VAT_REGISTERED لكل treatment. لا يجوز حسم هذه القواعد بالتخمين.

## 2. Preconditions

| Requirement | Expected | Actual | Evidence | Status |
|---|---|---|---|---|
| Phase 03A closed | YES | YES | docs/DARFUS_PHASE_03A_R3B_R5_FINAL_TRUE_FIRST_RUN_BROWSER_ACCEPTANCE_REPORT.md | PASS |
| 03B readiness gate | PASS_PHASE_03B_PRODUCTION_CONFIGURATION_INPUT_REQUIREMENTS_DEFINED | Matched | docs/DARFUS_PHASE_03B_OWNER_PRODUCTION_CONFIGURATION_READINESS_AND_INPUT_FREEZE_REPORT.md | PASS |
| Production config applied | NO | NO | 03B report final tokens | PASS |
| Real receive allowed | NO | NO | 03B report final tokens | PASS |
| Official DB | darfus_erp | darfus_erp | Read-only current_database() | PASS |
| G1 mutation | 0 | 0 | No mutation command was run | PASS |

Because all preconditions match, the G1 design work proceeded. No implementation work proceeded.

## 3. Frozen Authority

The following authorities were preserved and not reopened:

- VAT engine is server authoritative.
- Production VAT rate is not hardcoded; it comes from Settings.
- VAT_REGISTERED is a Company Setting and must not be inferred from TRN or vatEnabled.
- Transaction tax treatment is required and uses exactly:
  STANDARD_VAT, ZERO_RATED, REVERSE_CHARGE, EXEMPT, OUT_OF_SCOPE.
- VAT amount is server calculated; client VAT amount is never authoritative.
- Rate and VAT amount are snapshotted per transaction; historical transactions are not recalculated.
- Tax-treatment changes are permission-controlled and audited.
- Location is DB master data, branch-scoped, permission-gated for add, and not free text per transaction.
- Used Locations cannot be deleted; disabling is the safe lifecycle operation.
- Supplier, Asset, Barcode, Supplier Receive V2, accounting, and idempotency authorities remain unchanged.
- No Supplier, Location, VAT setting, Purchase Order, Asset, Payment, Journal, or business transaction is created in G1.

## 4. Official DB Read-Only Baseline

| Entity | Current count/state |
|---|---:|
| Database | darfus_erp |
| Companies | 1 |
| Branches | 1 |
| Settings rows | 0 |
| Suppliers | 0 |
| Inventory locations | 0 |
| Purchase orders | 0 |
| Assets | 0 |
| Inventory movements | 0 |
| Journal entries / lines | 0 / 0 |
| Profile master data | 659 |
| Pearl size master data | 39 |
| Barcode item / inventory codes | 20 / 5 |
| Gold market settings | 1 |
| Gold market quotes | 55 |
| Bootstrap state | READY |

The single company is Gold ERP, currency AED, with one branch Branch-1. Company tax_number is NULL. No value was added or inferred from this state.

## 5. VAT_REGISTERED Current Trace

### 5.1 Current authority locations

| Layer | Current finding | Evidence |
|---|---|---|
| Company model | taxNumber exists; no vatRegistered field | backend/src/models/company.model.js:52 |
| Settings model | Generic company-scoped key/value rows | backend/src/models/setting.model.js |
| Settings service | vatEnabled and vatRate exist; no vatRegistered normalization | backend/src/services/settings.service.js:19-26, 108-133 |
| Settings API | Company whitelist includes taxNumber; settings whitelist includes vatEnabled/vatRate; no vatRegistered | backend/src/routes/erp.routes.js:9168-9230 |
| Settings UI | TRN and VAT Rate controls exist; no VAT_REGISTERED control | app/[locale]/(dashboard)/settings/page.tsx |
| VAT calculation | Reads configured/default rates; no registration-status authority | backend/src/services/gold-valuation.service.js, supplier-acquisition-preview.service.js |
| Supplier Receive V2 | Reads vatEnabled/rates and snapshots calculation results; no registration gate | backend/src/routes/erp.routes.js:7780 onward |
| Posting | Reads PurchaseOrder VAT snapshot flags and amounts | backend/src/services/posting.service.js:760 onward |
| PurchaseOrder snapshot | Has VAT/rate/RCM fields; no registration snapshot | backend/src/models/purchaseOrder.model.js |
| Permission/audit | settings.update and settings.update audit event exist | backend/src/routes/erp.routes.js:9127-9250 |

### 5.2 Answers to required questions

1. vatRegistered is not present in the current model, settings normalization, API whitelist, UI, or Official DB schema.
2. vatEnabled has a different meaning: it is a generic VAT processing switch/default, not proof of legal registration.
3. The canonical authority should live at Company scope, alongside company tax identity.
4. The recommended storage is a nullable boolean company column, not inference from TRN and not reuse of vatEnabled.
5. Server-side Company/settings policy service is the authority consumed by preview and commit.
6. The safest API is a read projection and an explicitly validated Company VAT configuration write through the existing settings authorization path, with the new field separately audited.
7. UI needs an explicit VAT Registered yes/no control, separate from VAT Enabled and TRN.
8. Existing settings.update is the proven permission key. Its role mapping must be checked so only Admin/Accounting actors can change this field; no new permission is added in G1.
9. Recommended audit action: company.vat_registration.updated, using the existing auditService and before/after snapshots without secrets.
10. Existing companies receive NULL/unset after migration. No default makes an existing company registered.
11. Before production receive, an unset status is fail-closed with a stable validation/business error. The exact behavior for false plus each treatment remains an Owner decision where the mapping table says so.

## 6. VAT_REGISTERED Options

| Option | Advantages | Risks | Migration impact | Company scope | API/UI impact | Audit impact | Receive/history impact |
|---|---|---|---|---|---|---|---|
| A: companies.vat_registered | Semantically belongs to company legal identity; simple indexed read; no generic-key ambiguity; easy to snapshot policy | Requires a schema column and model/API update | Add nullable boolean, no default, no backfill | Direct | Add read/write field to company configuration; add explicit UI control | Existing audit framework records field change | New receive reads it; old rows remain unchanged |
| B: settings.vatRegistered | Uses existing key/value table and settings route; no table-column migration | Legal identity is hidden in generic settings; type/validation depends on key; easy to confuse with vatEnabled; weak discoverability | No new table column, but settings key contract/UI must be added | Company-scoped by row | Add key whitelist/normalization/UI | Generic settings.update only unless more granular audit is added | New receive reads settings; historical policy provenance is less explicit |
| C: reuse vatEnabled or taxNumber | No schema change | Violates frozen authority; conflates operational enablement or TRN with registration; unsafe | None | Ambiguous | No honest UI contract | Cannot audit the actual decision | Incorrect fail-open/inference risk |

## 7. VAT_REGISTERED Recommended Design

RECOMMENDED_VAT_REGISTERED_AUTHORITY = companies.vat_registered

Design:

- Add nullable boolean companies.vat_registered in a future migration.
- No default and no backfill.
- Expose it in the server company configuration read contract.
- Accept only boolean values in the authorized Company configuration write.
- Keep companies.tax_number as the TRN authority.
- Keep settings.vatEnabled as the operational processing flag; never infer one from the other.
- Include before/after values in the existing auditService event company.vat_registration.updated.
- Return an explicit unset state to UI and API until Owner configures it.
- New production receive fails closed when the field is unset.
- Do not rewrite or recalculate old PurchaseOrder rows.

This design satisfies company scope, server authority, permission control, audit, and no inference from TRN/vatEnabled.

## 8. Tax Treatment Current Trace

### 8.1 Current request and UI inputs

The current Supplier Purchases UI keeps:

- applyVat
- vatRate
- taxIncluded
- isRecoverable
- useReverseCharge
- drcVerified

It sends combinations of applyVat, vatRate, taxIncluded, isRecoverable, and reverse-charge flags in the receive payload. The UI preview is display-only; the backend recomputes totals.

### 8.2 Current server behavior

supplier-acquisition-preview.service.js currently:

- Computes rcmRequested from isRcm/isDRC/reverseVat/useReverseCharge.
- Computes ordinary VAT from applyVat and settings.
- Resolves rates from request values or Settings.
- Supports taxIncluded.
- Supports recoverable/non-recoverable input VAT.
- Produces taxBase, vatRate, inputVatAmount, taxIncluded, isRecoverable, isRcm, rcmVatAmount, and rcmRate.
- Rejects contradictory RCM combinations such as non-recoverable RCM, ordinary input VAT with RCM, and invalid rates.

The receive route stores the resulting values on PurchaseOrder and sends the snapshot to postingService.

### 8.3 Current posting branches

posting.service.js proves these accounting branches:

- RCM: inventory debit equals taxBase; input VAT debit and RCM output VAT credit are posted; supplier payable equals taxBase.
- Recoverable ordinary VAT: inventory debit equals taxBase; input VAT debit is posted; supplier payable equals gross total.
- No VAT or non-recoverable VAT: inventory debit equals total; no separate VAT line.
- Account-code inputs are inputVatAccountCode and rcmOutputAccountCode; source fallback values are 1400 and 2210 when settings are absent.

### 8.4 Current gaps

There is no single transaction tax-treatment field or enum. Client booleans can describe overlapping or contradictory states. There is no proven dedicated posting mapping for ZERO_RATED, EXEMPT, or OUT_OF_SCOPE. The current code therefore cannot be treated as the final canonical treatment authority.

## 9. Tax Treatment Canonical Contract

### 9.1 Storage authority

Recommended transaction authority:

- Future PurchaseOrder column: tax_treatment, nullable for historical compatibility.
- Allowed values exactly: STANDARD_VAT, ZERO_RATED, REVERSE_CHARGE, EXEMPT, OUT_OF_SCOPE.
- The PurchaseOrder row is the immutable treatment snapshot for that transaction.
- No default is written by migration.
- Optional future company default may be stored in Settings only after Owner approval; it must never replace an explicit request in a transaction that requires a choice.

### 9.2 Request and preview

Future canonical request:

~~~json
{
  "taxTreatment": "STANDARD_VAT"
}
~~~

The client sends the treatment identifier only. It must not author VAT amount, inputVatAmount, rcmVatAmount, or an accounting account code.

Preview must:

1. Require taxTreatment for new canonical receive requests.
2. Validate exact enum membership.
3. Load Company VAT_REGISTERED, Settings rate, purchase VAT policy, and financial mappings server-side.
4. Derive rate, tax base, tax included, recoverability, RCM flags, and amounts.
5. Return a non-authoritative preview plus the resolved policy metadata.
6. Reject contradictory legacy flags rather than allowing them to override treatment.

### 9.3 Commit

Commit repeats all validation inside the receive transaction. It does not trust the preview, browser state, or client amounts. It persists the treatment and calculated snapshot atomically with the existing PO, Asset, movement, payable, and journal flow. If treatment, rate, location, or financial mapping is not valid, it fails before persistent business mutation where possible, otherwise the transaction rolls back.

### 9.4 Legacy compatibility

Existing callers without taxTreatment remain readable and are classified as legacy. They must not silently become a new treatment. A future compatibility adapter may accept old flags only when they resolve unambiguously to an approved treatment; contradictory or incomplete combinations must fail closed. New canonical receive UI sends taxTreatment and does not send client VAT amounts.

## 10. Tax Treatment Mapping

The table distinguishes proven current behavior from unresolved business/accounting decisions. OWNER_DECISION_REQUIRED is intentional and blocks implementation of that mapping.

| Treatment | VAT registered prerequisite | VAT rate | Recoverable | RCM | Tax included behavior | Posting path |
|---|---|---|---|---|---|---|
| STANDARD_VAT | OWNER_DECISION_REQUIRED | Persisted Settings rate | Current ordinary branch uses Settings/default recoverability; final policy OWNER_DECISION_REQUIRED | No | Current ordinary branch supports configured taxIncluded; final policy OWNER_DECISION_REQUIRED | Existing recoverable-input or non-recoverable branch, subject to approved policy |
| ZERO_RATED | OWNER_DECISION_REQUIRED | 0 is implied by the treatment label, but final policy/source enum mapping is not implemented | OWNER_DECISION_REQUIRED | No | OWNER_DECISION_REQUIRED / likely not applicable, not assumed | No dedicated proven posting mapping; OWNER_DECISION_REQUIRED |
| REVERSE_CHARGE | OWNER_DECISION_REQUIRED | Current RCM branch uses configured purchase/RCM rate; client rate must not remain authoritative | Current code requires recoverable=true | Yes | Current RCM branch sets supplier total to tax base; no tax-included supplier VAT | Proven current Case D: input VAT debit + RCM output VAT credit, inventory/taxBase and payable split |
| EXEMPT | OWNER_DECISION_REQUIRED | OWNER_DECISION_REQUIRED | OWNER_DECISION_REQUIRED | No | OWNER_DECISION_REQUIRED | No dedicated proven posting mapping; OWNER_DECISION_REQUIRED |
| OUT_OF_SCOPE | OWNER_DECISION_REQUIRED | OWNER_DECISION_REQUIRED | OWNER_DECISION_REQUIRED | No | OWNER_DECISION_REQUIRED | No dedicated proven posting mapping; OWNER_DECISION_REQUIRED |

No accounting line, rate, recoverability rule, or registration prerequisite is invented in this G1 report. Owner resolution is required for the unresolved cells before an implementation gate can pass.

## 11. Historical Compatibility

- Existing PurchaseOrder rows are not rewritten.
- Existing VAT snapshots remain immutable.
- Existing fields tax_base, vat_rate, input_vat_amount, tax_included, is_recoverable, is_rcm, rcm_vat_amount, and rcm_rate remain readable.
- Future tax_treatment is nullable for old rows.
- A legacy-derived display may show a non-authoritative label only when existing flags map unambiguously; otherwise display Legacy/Unclassified.
- No backfill is allowed if it requires inferring a legal treatment from booleans.
- No rate or amount is recalculated after settings change.
- New canonical receive requires the explicit treatment contract after implementation.

Recommended historical policy: nullable snapshot field, no backfill, legacy display adapter only.

## 12. Location Current Schema/Source Trace

### 12.1 Existing schema

The existing migration creates inventory_locations with:

| Column | Type/constraint |
|---|---|
| id | STRING primary key, non-null |
| company_id | STRING non-null FK to companies, RESTRICT delete |
| branch_id | STRING non-null FK to branches, RESTRICT delete |
| code | STRING(32) non-null |
| name | STRING(120) non-null |
| location_type | STRING(24) non-null, default GENERAL |
| is_active | BOOLEAN non-null, default true |
| created_at | DATE non-null |
| updated_at | DATE non-null |

Unique index: company_id + branch_id + code.

### 12.2 Current references

- Asset has nullable location_id FK to inventory_locations.
- Asset location_id and operational_status are indexed together.
- Inventory movements have from_location_id and to_location_id.
- Workshop, audit, transfer, manufacturing, CGP, and receive paths carry location IDs or null.
- GBW and GBP profile contract routes read active locations by server company and branch.
- Supplier Receive V2 writes Asset locationId and movement toLocationId when supplied.
- No Location model or dedicated Location CRUD route was found.
- Generic CRUD resources do not register inventory-locations.
- The Official DB has zero location rows.
- Supplier purchase UI exposes locationId as a text input, labelled optional.

### 12.3 Required answers

1. Exact table columns are listed above.
2. Uniqueness is company/branch/code.
3. Scope is company plus branch.
4. Active/disabled behavior is is_active; profile contracts filter active=true.
5. No hard-delete Location route was found; the future design must explicitly forbid delete when used.
6. Assets, movements, workshop/audit/transfer/manufacturing/CGP and Supplier Receive reference location IDs.
7. Receive accepts perPiece.locationId and also normalizes a legacy location display string.
8. Free text enters through suppliers/purchases/page.tsx locationId input.
9. Receive normalization uses item.location || Showroom at erp.routes.js:7888; frontend local/mock branches also use Showroom.
10. Missing API: branch-scoped Location list/create/update/disable with authorization and audit.
11. Missing UI: canonical Location management and selector-only receive control.

## 13. Canonical Location Management Design

Use a dedicated service/route over the existing inventory_locations table. Do not use generic unrestricted CRUD.

Fields from the existing schema only:

- id: server generated.
- companyId/company_id: server context, never client authority.
- branchId/branch_id: selected/validated branch context.
- code: required, normalized, max 32, unique within company and branch.
- name: required, trimmed, max 120.
- locationType/location_type: existing field, default GENERAL only as schema representation; no new business types.
- isActive/is_active: server-managed lifecycle state.
- createdAt/updatedAt: server-managed.

Operations:

- List active/all locations within authorized company and branch scope.
- Add a location with exact field validation.
- Edit code/name/locationType only under safe rules; company and branch are immutable through normal edit.
- Disable by setting isActive=false.
- Do not delete a row referenced by assets, movements, audits, workshop records, or any historical source. Prefer no DELETE endpoint at all.

## 14. Location API Design

Recommended dedicated endpoints, subject to existing route naming conventions:

| Endpoint | Permission | Scope | Validation | Audit/response |
|---|---|---|---|---|
| GET /inventory-locations?branchId=... | inventory.view or settings.view | req.companyId; allowed branch only | active filter optional; branch must be authorized | 200 list with id/code/name/type/isActive |
| POST /inventory-locations | settings.update for current permission model | company server context; branch validated | code/name required; code unique per company/branch; no duplicate active/inactive code | 201 row plus audit event |
| PATCH /inventory-locations/:id | settings.update | company and branch scoped | no company/branch reassignment; code uniqueness; validate mutable fields | 200 row plus before/after audit |
| POST /inventory-locations/:id/disable | settings.update | company and branch scoped | id must exist; no delete; disabling is idempotent or conflict by project convention | 200 row plus audit |

Existing permission authority is settings.update for configuration writes and inventory.view/settings.view for reads. No exact inventory.locations.manage key currently exists. A narrower inventory.locations.manage key may be proposed in a future security review, but it is not added in G1.

Error behavior:

- Wrong company: not found or scoped 404, without leaking existence.
- Wrong branch: scoped 404 or branch-scope validation error.
- Duplicate code: stable 409.
- Invalid code/name/type: stable 422.
- Disable nonexistent location: scoped 404.
- Attempt to delete/transfer a used location: stable 409; no destructive delete.

## 15. Location UI Design

### Management

Use an existing Settings or Inventory administration area, not a second business workflow:

- active branch selector when the user may manage more than one branch;
- active/all Location list;
- Add Location;
- Edit safe fields;
- Disable action;
- no Delete action for used data;
- permission-gated controls;
- audit-visible confirmation.

### Receive

- Replace Location free-text input with a selector backed by the authenticated profile contract/API.
- Send locationId only.
- Display only active Locations for the server branch.
- Do not send a free-text location display value as authority.
- Do not invent an automatic default.
- If the approved UX allows + Add Location from selector, it must be permission-gated, create through the canonical endpoint, refresh the selector, and return the created ID to the same workflow.
- If no active Location exists and Location is required, fail closed with actionable validation.

## 16. Showroom/Free-Text Trace

| Occurrence | Classification | Design treatment |
|---|---|---|
| backend/src/routes/erp.routes.js:7888, item.location || Showroom in Supplier Receive normalization | PRODUCTION_AUTHORITY | Remove from canonical receive target; require validated locationId where policy says required |
| app/[locale]/(dashboard)/suppliers/purchases/page.tsx:1458, Location optional text input | PRODUCTION_AUTHORITY | Replace with selector-only locationId |
| app/[locale]/(dashboard)/suppliers/purchases/page.tsx:853,925 local asset object location Showroom | LEGACY_COMPATIBILITY / LOCAL MOCK | Keep out of API authority; remove or isolate only in the later UI cleanup batch |
| backend/src/controllers/erp.controller.js:79 payload.location default Showroom | LEGACY_COMPATIBILITY / GENERIC ASSET PATH | Trace separately; do not widen G1 unless it feeds canonical Supplier Receive |
| backend/src/routes/erp.routes.js:3220,3369,4243,4312 place/location Showroom values | DISPLAY_ONLY or legacy audit/display context | Do not treat as Location master authority; review separately if it writes operational inventory location |
| app/[locale]/(dashboard)/inventory/manufacturing/page.tsx:212 | TEST_FIXTURE / LEGACY UI DEFAULT | Outside G1 Supplier Receive scope |
| app inventory transfers descriptive showroom text | DISPLAY_ONLY | No Location ID authority |
| CGP inventory consumer locationId=null | SEPARATE ACQUISITION PATH | Not a Showroom fallback; outside G1 unless direct coupling is proven |

The critical production occurrences are the receive normalization and Supplier Purchases text input. No new fallback is permitted.

## 17. Showroom/Free-Text Removal Design

Target behavior:

1. Canonical receive accepts locationId, not a user-supplied location string.
2. Server loads the location by id, company, branch, and active status inside the receive validation/transaction.
3. A missing locationId returns LOCATION_REQUIRED when the profile/transaction policy requires one.
4. An inactive location returns LOCATION_INACTIVE.
5. A cross-company or cross-branch location returns a scoped not-found or stable validation error.
6. The server never maps missing input to Showroom, Main Warehouse, or any invented default.
7. Existing legacy compatibility must be explicitly classified; it cannot silently become authority for final serialized inventory.
8. The UI never submits free text as a location ID.

If the Owner later decides Location is optional for a specific non-operational draft, null may remain a deliberate value. It must not be converted to a display name or default.

## 18. Receive V2 Target Contract

Target precondition:

| Authority | Target |
|---|---|
| Company context | Server authoritative req.companyId |
| Branch context | Server authoritative active branch |
| Supplier | Existing active company-scoped Supplier |
| Location | Existing active branch-scoped Location ID |
| VAT_REGISTERED | Explicit Company authority |
| Tax Treatment | Explicit approved enum |
| VAT rate | Persisted Settings, not client authority |
| VAT amount | Server calculated |
| Financial mapping | Validated before commit |

Preview:

- validate company/branch/supplier/location/treatment;
- resolve server settings and permissions;
- calculate treatment result without persistence;
- return resolved snapshot values;
- reject missing/contradictory inputs.

Commit:

- repeat validation inside the transaction;
- persist tax treatment and immutable tax snapshot;
- persist Location ID on Asset and movement;
- preserve existing Asset/Barcode/Movement/Payable/Journal/idempotency chain;
- rollback all writes on validation/posting failure.

Fail-closed errors:

- VAT_REGISTERED_REQUIRED
- VAT_RATE_REQUIRED
- TAX_TREATMENT_REQUIRED
- TAX_TREATMENT_INVALID
- TAX_TREATMENT_FLAGS_CONFLICT
- LOCATION_REQUIRED
- LOCATION_INACTIVE
- LOCATION_COMPANY_MISMATCH
- LOCATION_BRANCH_MISMATCH
- NO_ACTIVE_LOCATION_AVAILABLE
- FINANCIAL_MAPPING_NOT_READY

Proposed names reuse the existing ValidationError/ForbiddenError/NotFoundError/ConflictError architecture; they are not implemented in G1.

## 19. Migration Design

No migration is created in G1. The minimum future shape is:

| Future change | Table | Type/default | Constraint | Backfill | Rollback/data impact |
|---|---|---|---|---|---|
| Explicit VAT registration | companies | vat_registered BOOLEAN NULL, no default | company row; no inference | None; existing rows remain NULL | Additive; rollback only after approved backup/rehearsal |
| Tax treatment snapshot | purchase_orders | tax_treatment VARCHAR(24) NULL, no default | CHECK against the five frozen values | None; old rows remain NULL | Additive; no historical rewrite |
| Location management | inventory_locations | No schema migration proven necessary | Existing FK/index/columns are sufficient | None; do not seed | API/model/audit only |
| Optional company default treatment, if Owner approves | settings | Existing JSONB key, no schema migration | Validate exact enum; no implicit default | None | Configuration-only, not required for transaction snapshot |

No default makes an existing company VAT registered. No default treatment changes an old or new transaction. A migration must not backfill treatment by inferring booleans.

## 20. Official DB Impact

Current Official DB facts remain unchanged in design:

- companies = 1: future nullable vat_registered remains unset until Owner input.
- settings = 0: no settings are written in G1.
- suppliers = 0: no fake Supplier is created.
- inventory_locations = 0: no Location is created.
- purchase_orders = 0 and assets = 0: no business transaction is created.

After an approved future schema migration, the safe state is still unset/empty until an explicitly approved configuration/apply batch supplies values. G1 does not apply them.

## 21. Owner Input Boundary

Still Owner-controlled after source gap closure:

- VAT_REGISTERED.
- COMPANY_TRN, or N/A under Owner policy.
- STANDARD_VAT_RATE.
- DEFAULT_TRANSACTION_TAX_TREATMENT only if the Owner elects to configure a default; explicit transaction treatment remains safer.
- Supplier name and any required supplier values remain outside G1.
- Supplier TRN/payment terms remain outside G1.
- Location name/code remain Owner values if a future provisioning batch is approved.
- Accounting mapping and tax semantics for ZERO_RATED, EXEMPT, and OUT_OF_SCOPE.
- Whether VAT_REGISTERED false permits STANDARD_VAT, ZERO_RATED, REVERSE_CHARGE, EXEMPT, or OUT_OF_SCOPE.
- Whether standard VAT is recoverable and tax-included by default when not explicitly configured.

No pricing threshold or minimum-making input is requested by G1.

## 22. Due Days Deferral

DUE_DAYS = P2 / OWNER_DECISION_REQUIRED  
Status: DEFER

There is no proven current Receive dependency on due days. Supplier payment state is based on PurchaseOrder total and supplier-purchase cash-out transactions. No Due Days field or calculation is implemented or designed in this control.

## 23. Security/Permissions

| Capability | Existing authority | G1 design |
|---|---|---|
| VAT_REGISTERED change | settings.update | Reuse existing permission; enforce Admin/Accounting role policy; audit every change |
| VAT rate/tax configuration | settings.update | Reuse existing permission and settings audit; no new key |
| Tax treatment policy change | settings.update | Permission-controlled and audited; no client bypass |
| Location list | inventory.view or settings.view | Company/branch scoped |
| Location create/edit/disable | settings.update is the proven write key | Permission-gated; propose narrower inventory.locations.manage only for future review, do not add |
| Receive | suppliers.create plus existing business guards | Server validates all Company/Branch/Supplier/Location/VAT/treatment authorities |

No permission is weakened or added in G1.

## 24. Audit Design

Use the existing auditService/AuditLog framework. Proposed future actions:

| Event | Required audit fields |
|---|---|
| company.vat_registration.updated | companyId, actor, before/after boolean or NULL, source settings screen |
| company.trn.updated | companyId, actor, masked or policy-safe before/after; no secrets |
| settings.vat_rate.updated | companyId, actor, before/after rate, permission |
| settings.tax_treatment.updated | companyId, actor, before/after policy, permission |
| inventory_location.created | companyId, branchId, locationId, code/name, actor |
| inventory_location.updated | companyId, branchId, locationId, before/after mutable fields, actor |
| inventory_location.disabled | companyId, branchId, locationId, prior active state, actor, reason if required |
| purchase.tax_treatment.snapshot | PO/source document, treatment, calculated snapshot metadata, actor |

The existing purchase.receive event can be extended in a future implementation with treatment/location IDs, but no second audit subsystem is proposed.

## 25. Error Contract

| Error | When | Safe response |
|---|---|---|
| VAT_REGISTERED_REQUIRED | Company registration status is unset before protected receive/config operation | 422 stable business validation |
| VAT_RATE_REQUIRED | Treatment needs a configured rate and none is persisted | 422 stable business validation |
| TAX_TREATMENT_REQUIRED | New canonical request omits treatment | 422 |
| TAX_TREATMENT_INVALID | Value outside frozen enum | 422 |
| TAX_TREATMENT_FLAGS_CONFLICT | Legacy flags contradict selected treatment | 422; no client flag wins |
| LOCATION_REQUIRED | Required locationId absent | 422 |
| LOCATION_INACTIVE | Selected row is disabled | 422 |
| LOCATION_COMPANY_MISMATCH | Cross-company ID | scoped 404/422 without disclosure |
| LOCATION_BRANCH_MISMATCH | Cross-branch ID | scoped 404/422 |
| NO_ACTIVE_LOCATION_AVAILABLE | Branch has no selectable active Locations | 422 actionable setup message |
| FINANCIAL_MAPPING_NOT_READY | Required posting mapping is not approved/configured | 422/409 fail-closed |

Use existing error classes and response envelope. Do not leak internal SQL, company IDs, or secrets.

## 26. Future Test Plan

Design only; no tests were executed.

### VAT_REGISTERED

- unset blocks protected production receive;
- false plus each treatment follows the approved mapping;
- true plus persisted rate permits only approved treatments;
- TRN NULL behavior follows Owner policy and is not used to infer registration;
- unauthorized write rejected;
- authorized change is audited;
- existing company remains NULL after migration until explicit configuration.

### Tax Treatment

- all five enum values;
- missing and invalid values;
- contradictory legacy flags rejected or ignored as non-authority;
- client VAT amounts ignored/rejected;
- server rate/amount calculation;
- snapshot persistence;
- snapshot immutability after Settings changes;
- RCM balanced posting;
- unresolved non-RCM mappings remain blocked until approved.

### Location

- list is company/branch scoped;
- create;
- duplicate code same branch rejected;
- code behavior across branches follows existing unique index;
- edit safe fields;
- disable;
- used-location deletion blocked or no delete endpoint;
- wrong company/branch rejected;
- inactive selection rejected;
- free text rejected;
- no Showroom fallback.

### Receive

- preview and commit agree;
- missing configuration fails before mutation;
- idempotency replay does not duplicate records;
- rollback leaves zero business writes;
- Asset/location/movement/tax snapshot/accounting reconciliation remains intact.

## 27. Future Browser Acceptance

Future implementation acceptance must prove:

1. Admin sees and sets explicit VAT Registered.
2. Admin sees and persists approved VAT rate.
3. Admin manages a branch-scoped Location.
4. Receive selector shows only active Locations for authenticated branch.
5. No free-text Location field remains in canonical receive.
6. No Showroom or other invented default appears.
7. Tax Treatment selector exposes exactly the approved enum.
8. Browser request sends treatment and locationId.
9. Backend validates server context and ignores client VAT amount.
10. Database snapshots treatment, rate, amount, and location correctly.
11. Accounting mapping is balanced for every approved treatment.

No browser mutation was run in G1.

## 28. Minimum Safe Implementation Batches

| Batch | Objective | Prerequisites | Stop condition |
|---|---|---|---|
| 03B-G2A | VAT_REGISTERED storage/API/policy and tax_treatment storage/validation/tests | Owner resolves treatment mapping and VAT registration prerequisites; approved migration design | Any unresolved accounting mapping or schema conflict |
| 03B-G2B | Canonical Location service/API/permissions/audit/tests | Existing table verified; permission decision | Cross-scope or used-location behavior unresolved |
| 03B-G2C | Receive/UI cleanup: explicit treatment, selector-only location, remove production fallback | G2A/G2B complete | Any legacy path can still author location/tax |
| 03B-G3 | Disposable/isolated and browser/DB/accounting acceptance | Approved implementation, safe target, backup/rehearsal policy | Official DB mutation or failed reconciliation |
| 03B-R1 | Apply Owner-approved production values | Owner values, exact target, approved apply control | Missing value, unsafe target, or unauthorized write |

No batch is started automatically.

## 29. Decision Matrix

| Gap | Current problem | Recommended authority | Migration? | Backend change? | Frontend change? | Tests? | Risk |
|---|---|---|---|---|---|---|---|
| VAT_REGISTERED | Absent; vatEnabled is not registration | companies.vat_registered nullable | Yes, additive | Yes | Yes | Yes | High financial/policy risk if inferred |
| Tax Treatment | Booleans/flags, no single enum | PurchaseOrder.tax_treatment snapshot plus server policy | Yes, additive | Yes | Yes | Yes | High accounting ambiguity |
| Location CRUD | Table exists, no canonical management path | Dedicated service/routes over inventory_locations | No schema migration proven | Yes | Yes | Yes | High scope/branch integrity risk |
| Location selector | Current receive UI accepts free text | Active branch-scoped locationId selector | No | Yes | Yes | Yes | High wrong-location risk |
| Showroom fallback | Receive can invent display location | No fallback; fail closed when required | No | Yes | Yes where applicable | Yes | High silent data-authority risk |

## 30. Files Changed

| File | Change |
|---|---|
| docs/DARFUS_PHASE_03B_G1_PRODUCTION_CONFIGURATION_GAP_CLOSURE_DESIGN_REPORT.md | Created this read-only design report |

No source, test, migration, .env, configuration, or runtime file was changed.

## 31. DB Mutation Proof

~~~
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
INSERT = 0
UPDATE = 0
DELETE = 0
TRUNCATE = 0
ALTER = 0
DROP = 0
CREATE_TABLE = 0
MIGRATION = 0
SEED = 0
SETTINGS_WRITE = 0
LOCATION_WRITE = 0
RECEIVE = 0
BUSINESS_TRANSACTIONS = 0
~~~

## 32. Gate

The VAT storage authority, Location management/selector design, fallback-removal design, migration shape, permission model, audit model, compatibility model, and test plan are defined.

However, the essential Tax Treatment accounting/business mapping is not fully provable from the frozen authority and current source for ZERO_RATED, EXEMPT, and OUT_OF_SCOPE. The VAT_REGISTERED prerequisite behavior for each treatment is also not frozen. The report therefore does not guess and does not declare implementation readiness.

GATE = BLOCKED_PHASE_03B_G1_OWNER_DECISION_REQUIRED

Exact blocking decisions:

1. Whether VAT_REGISTERED true/false is a prerequisite for each of the five treatments.
2. Accounting and VAT behavior for ZERO_RATED.
3. Accounting and VAT behavior for EXEMPT.
4. Accounting and VAT behavior for OUT_OF_SCOPE.
5. Standard VAT recoverability/tax-included policy where no persisted setting is present.
6. Whether a company default tax treatment is required or every receive must select one explicitly.

## 33. Next Recommended Control

OWNER REVIEW OF G1 DESIGN AND TAX-TREATMENT DECISIONS

Then, only after explicit approval:

NEXT_RECOMMENDED_STEP = APPROVE_FIRST_MINIMUM_SAFE_IMPLEMENTATION_BATCH

The next control must not apply production values or run a business transaction until the exact decisions above are resolved. No G2A/G2B/G2C/G3/R1 control is started automatically.

## 34. Final Tokens

~~~
CURRENT_CONTROL = DARFUS-PHASE-03B-G1-PRODUCTION-CONFIGURATION-GAP-CLOSURE-DESIGN
PHASE = 03B-G1
MODE = READ_ONLY_GAP_CLOSURE_DESIGN
OFFICIAL_DB = darfus_erp

VAT_REGISTERED_CURRENT_CAPABILITY = MISSING
RECOMMENDED_VAT_REGISTERED_AUTHORITY = companies.vat_registered_nullable_company_scoped_server_authoritative

TAX_TREATMENT_CURRENT_CAPABILITY = MISSING_SINGLE_AUTHORITATIVE_ENUM_CURRENT_FLAGS_ONLY
RECOMMENDED_TAX_TREATMENT_AUTHORITY = purchase_orders.tax_treatment_nullable_immutable_snapshot_with_server_policy
TAX_TREATMENT_ENUM = STANDARD_VAT,ZERO_RATED,REVERSE_CHARGE,EXEMPT,OUT_OF_SCOPE

LOCATION_SCHEMA_PRESENT = YES
LOCATION_CANONICAL_WRITE_PATH_PRESENT = NO
RECOMMENDED_LOCATION_WRITE_PATH = DEDICATED_COMPANY_AND_BRANCH_SCOPED_SERVICE_API_OVER_inventory_locations
LOCATION_FREE_TEXT_CURRENT = YES
SHOWROOM_FALLBACK_CURRENT = YES
SHOWROOM_FALLBACK_REMOVAL_TARGET = NO_PRODUCTION_FALLBACK_FAIL_CLOSED_WHEN_LOCATION_REQUIRED

MIGRATIONS_REQUIRED_FUTURE = ADD_NULLABLE_companies.vat_registered_AND_NULLABLE_purchase_orders.tax_treatment_NO_DEFAULT_NO_BACKFILL; LOCATION_SCHEMA_MIGRATION_NOT_PROVEN_NEEDED

OWNER_DECISIONS_STILL_REQUIRED = VAT_REGISTERED_PREREQUISITES_BY_TREATMENT; ZERO_RATED_MAPPING; EXEMPT_MAPPING; OUT_OF_SCOPE_MAPPING; STANDARD_VAT_RECOVERABILITY_AND_TAX_INCLUDED_POLICY; DEFAULT_TAX_TREATMENT_OPTIONAL_OR_EXPLICIT_PER_RECEIVE

DUE_DAYS = DEFERRED_UNLESS_PROVEN_BLOCKING
PRICING_THRESHOLD = OUT_OF_SCOPE
MINIMUM_MAKING = OUT_OF_SCOPE

OFFICIAL_DB_WRITES_THIS_CONTROL = 0
SOURCE_CODE_CHANGED = NO
TEST_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
BUILD_RUN = NO
MAIN_RUNTIME_RESTARTED = NO
PRODUCTION_CONFIGURATION_APPLIED = NO
REAL_RECEIVE_ALLOWED = NO

VAT_REGISTERED_AUTHORITY_DEFINED = YES
TAX_TREATMENT_AUTHORITY_DEFINED = YES_DESIGN_ONLY_BLOCKED_BY_MAPPING_DECISIONS
LOCATION_CANONICAL_MANAGEMENT_DEFINED = YES
LOCATION_SELECTOR_ONLY_TARGET_DEFINED = YES
SHOWROOM_FALLBACK_REMOVAL_DEFINED = YES
MIGRATION_DESIGN_DEFINED = YES
HISTORICAL_COMPATIBILITY_DEFINED = YES
PERMISSIONS_DEFINED = YES
AUDIT_DEFINED = YES
TEST_PLAN_DEFINED = YES
IMPLEMENTATION_BATCHES_DEFINED = YES

GATE = BLOCKED_PHASE_03B_G1_OWNER_DECISION_REQUIRED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_G1_DESIGN_AND_RESOLVE_EXACT_TAX_TREATMENT_DECISIONS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
~~~

توقف هنا — OWNER REVIEW مطلوب. لا يتم إنشاء Migration أو تعديل VAT أو Tax Treatment أو Location أو Receive UI تلقائيًا.
