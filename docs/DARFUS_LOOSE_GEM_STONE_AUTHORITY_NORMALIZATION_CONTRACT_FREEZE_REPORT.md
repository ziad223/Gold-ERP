# DARFUS ERP — Loose Gem Stone Authority Normalization + Minimum Implementation Contract Freeze

تم تنفيذ مرحلة تثبيت العقد فقط. تم اعتماد قرار Owner بأن `Stone Carat Weight` هو سلطة الوزن الوحيدة، وأن الجرام قيمة مشتقة من النظام وليست إدخالًا ثانيًا. تم تثبيت نموذج Asset الواحد، ومسار Inventory canonical، وعقد الأقسام الثمانية، وMaster Data، والضريبة، والتكلفة، والتسعير، والباركود، والأدلة المطلوبة قبل أي Receive. لم يتم تعديل الكود أو قاعدة البيانات، ولم يتم تنفيذ Receive أو Migration أو Seed. الخطر على `darfus_erp` = صفر. المرحلة التالية المسموح بها هي Implementation منفصلة بعد Owner Review، وليست تنفيذًا تلقائيًا.

## 1. Executive Summary

| Area | Frozen result | Evidence / consequence |
|---|---|---|
| Owner weight decision | FROZEN | Carat is required; gram weight is derived at 0.20 g/CT; no duplicate gross-weight input |
| Physical identity | FROZEN | One physical loose gemstone = one Asset; Product.quantity is not authority |
| Canonical UI | FROZEN | Inventory → Add / Receive Inventory → Loose Gem Stone; no Supplier duplicate workflow |
| Eight-section form | FROZEN | Exactly the eight client sections; no Gold or Making section |
| Master Data | FROZEN | DB-backed selectors; permissioned add/edit; no free-text master authority |
| Finance | FROZEN | Purchase Cost is historical authority; Additional Cost is one optional aggregate; VAT is server-derived |
| Current value | FROZEN | Current Stone Value is explicit and required; no historical fallback |
| Barcode | FROZEN | Server maps `LOOSE_GEMSTONE` explicitly to `GS/LOS/00` plus six digits |
| Evidence | FROZEN | Exact request, rollback, hash, backup, rollback-zero-delta, then exactly one live Receive |
| Implementation | NOT AUTHORIZED HERE | This control is contract freeze only |

The prior audit’s only true Owner decision is resolved. The former P1 items are now implementation directions, not open contract questions.

## 2. Control Mode

| Key | Value |
|---|---|
| Control ID | `DARFUS-LOOSE-GEM-STONE-AUTHORITY-NORMALIZATION-CONTRACT-FREEZE` |
| Mode | `AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE` |
| Primary scope | `LOOSE_GEM_STONE` |
| Official local main DB | `darfus_erp` |
| Implementation authorized | NO |
| Receive authorized/executed | NO |
| Migration/seed | Not authorized/executed |
| Next batch | `NO_AUTOMATIC_START` |

## 3. Client Authority

| Item | Value |
|---|---|
| Business authority | `I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx` |
| Expected SHA-256 | `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3` |
| Rechecked actual SHA-256 | `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3` |
| File size | 60,496 bytes |
| Authority status | PASS |
| Read status | Complete from first page to final page in the prior audit; current hash rechecked |

The client DOCX remains the business authority for Loose Gem Stone only. Its copied multi-stone wording remains classified as `CLIENT_DOC_COPY_ARTIFACT` and cannot override the frozen one-Asset model.

## 4. Owner Decision Freeze

The Owner-approved resolution is binding:

```text
LOOSE_GEM_STONE_WEIGHT_AUTHORITY = STONE_CARAT_WEIGHT
STONE_CARAT_WEIGHT = REQUIRED
GROSS_WEIGHT_USER_INPUT = NOT_REQUIRED
CT_TO_GRAMS = 1_CT_EQUALS_0.20_GRAM
DERIVED_STONE_WEIGHT_GRAMS = SYSTEM_CALCULATED
DUPLICATE_MANUAL_WEIGHT_AUTHORITIES = NO
```

The current generic profile’s `grossWeight` requirement is therefore an implementation normalization target. It must be removed from the user-facing Loose request contract or satisfied only by a server-derived value. No fake UI field or duplicate manual weight may be introduced.

## 5. Product Model

```text
ONE_PHYSICAL_LOOSE_GEM_STONE = ONE_ASSET
PRODUCT_QUANTITY_IS_NOT_PHYSICAL_INVENTORY_AUTHORITY
LOOSE_GEMSTONE_ASSET_TYPE = GEMSTONE
MOUNTED_COMPONENT_MODEL = NOT_APPLICABLE_AS_BUSINESS_IDENTITY
MULTIPLE_LOOSE_STONES_IN_ONE_ASSET = FORBIDDEN
```

The existing runtime may reuse a `PRIMARY_SUBJECT` detail row internally. That row is technical gemstone detail only; the top-level Asset remains the physical identity. The client’s “unlimited stones/Add/Delete” wording is frozen as a copy artifact and is not a multi-stone Loose requirement.

## 6. Canonical UI

The only approved user path is:

`Inventory → + Add / Receive Inventory → Loose Gem Stone`

Rules:

- One canonical receive entry point.
- No Supplier-created duplicate receive workflow.
- No direct-only route that bypasses the chooser.
- A user-discoverable chooser entry is required.
- The Loose form must be dedicated; the existing Gem Stone Jewellery page must not be reused as the Loose form.
- Project route conventions may use `/ar/inventory/loose-gem-stone` and `/en/inventory/loose-gem-stone`.

## 7. Eight-Section Contract

The future canonical form must contain exactly these business sections:

1. Item Identification Information
2. Gem Stone Information
3. Purchase Information
4. Current Cost Information
5. Sales Information
6. Tag Information
7. Item Status Information
8. Audit & System Information

There is no Gold Information section and no Making section. Jewellery-only fields are excluded unless a later Owner-approved authority explicitly adds them.

## 8. Identification Contract

| Field | Contract |
|---|---|
| Supplier | Required; DB master; no direct transaction free text; permissioned add/edit only |
| Purchase Date | Required; UI defaults to current date; editable; server validated |
| Item Images | Optional; multiple images; each can have a name; Asset-owned |
| Attachment storage | Reuse existing Asset attachment architecture; no new subsystem |

The server must resolve Supplier and Company/Branch context. Supplier creation remains a separate permissioned master-data action, not a transaction-time fallback.

## 9. Gem Field Contract

| Field | Requiredness | Authority |
|---|---|---|
| Stone Carat Weight | Required | Manual CT input; positive decimal |
| Stone Name | Required | Active `GEMSTONE_NAME` DB master |
| Stone Type | Optional | Active `GEMSTONE_TYPE` DB master |
| Stone Shape | Optional | Active `GEMSTONE_SHAPE` DB master |
| Stone Color | Optional | Active `GEMSTONE_COLOR` DB master |
| Stone Tone | Optional | Active `GEMSTONE_TONE` DB master |
| Tone Level | Optional | Active `GEMSTONE_TONE_LEVEL` DB master |
| Saturation | Optional | Active `GEMSTONE_SATURATION` DB master |
| Optical Effect | Optional | Active `GEMSTONE_OPTICAL_EFFECT` DB master |
| Origin | Optional | Active `GEMSTONE_ORIGIN` DB master |
| Certificate Authority | Optional | Active `CERTIFICATE_AUTHORITY` DB master |
| Certificate Number | Optional | Manual; if supplied, authority becomes required |
| Certificate Images | Optional, multiple | Existing Asset attachments/certificate architecture |
| Gem Stone Notes | Optional | Asset/technical detail notes with audit |

Explicitly excluded from this contract: Position, Setting, Treatment, Gold Color, Gold Karat, Net Gold, Pure Gold, and Making Cost.

For a value labeled “Other”, the UI must require a description and the server must preserve the controlled selection plus its explanation; it must not invent a new master value automatically.

## 10. Weight Contract

```text
USER_WEIGHT_AUTHORITY = STONE_CARAT_WEIGHT
STONE_CARAT_WEIGHT = REQUIRED
CARAT_VALIDATION = > 0, NON-NEGATIVE, DECIMAL-SAFE
CT_TO_GRAMS = 0.20
DERIVED_STONE_WEIGHT_GRAMS = STONE_CARAT_WEIGHT * 0.20
GROSS_WEIGHT_USER_INPUT = NO
GROSS_WEIGHT_REQUIRED_BY_GENERIC_PROFILE = MUST_BE_NORMALIZED_AWAY
DERIVED_GRAMS_MAY_BE_PERSISTED = YES_IF_SCHEMA_REQUIRES
DERIVED_GRAMS_MUST_NOT_BECOME_MANUAL_AUTHORITY = YES
```

The implementation must not ask the user for both carat and gross grams. If an existing runtime requires `grossWeight`, the server contract must derive it from CT or adapt the internal input before normalization.

## 11. Master Data Contract

Required DB-master categories:

`GEMSTONE_NAME`, `GEMSTONE_TYPE`, `GEMSTONE_SHAPE`, `GEMSTONE_COLOR`, `GEMSTONE_TONE`, `GEMSTONE_TONE_LEVEL`, `GEMSTONE_SATURATION`, `GEMSTONE_OPTICAL_EFFECT`, `GEMSTONE_ORIGIN`, `CERTIFICATE_AUTHORITY`.

Rules:

- Runtime source is DB.
- Direct free-text master authority is prohibited.
- Add and edit are permission-gated.
- A historically used value cannot be destructively deleted.
- All master changes are audited.
- `GEMSTONE_POSITION`, `GEMSTONE_SETTING`, and `GEMSTONE_TREATMENT` are non-applicable for the current Loose Add contract.

Current read-only DB evidence from the prior audit remains: Name 67, Type 6, Shape 19, Color 45, Tone 14, Tone Level 9, Saturation 10, Optical Effect 11, Origin 25, and Certificate Authority 16 shared values. No provisioning is authorized by this freeze.

## 12. Stone Cost/Purchase Cost Normalization

```text
LOOSE_STONE_HISTORICAL_COST_AUTHORITY = PURCHASE_COST
STONE_COST_AS_SEPARATE_DUPLICATE_INPUT = NO
```

The copied client Stone Cost wording must not become a second editable field. If technical component storage needs a cost value, it may be mapped internally from the single Purchase Cost authority, but the user must not edit two costs for one loose stone.

## 13. Purchase Financial Contract

User inputs:

- Purchase Cost: required, nonnegative historical acquisition base.
- Additional Cost: optional, nonnegative aggregate scalar.

Server-derived:

`Purchase VAT = Tax Engine output`.

`Displayed Total Purchase Cost = Purchase Cost + Additional Cost + Purchase VAT`.

Accounting normalization:

- Client display total is not automatically Asset acquisition cost.
- Asset acquisition cost follows canonical DARFUS tax/accounting authority.
- Recoverable VAT is not capitalized into the Asset acquisition cost.
- Supplier payable uses the correct tax-inclusive payable amount.
- Additional Cost remains one aggregate scalar; no itemized rows or per-row taxability may be invented.

## 14. Historical Snapshot

The future receive must persist immutable evidence for:

`Purchase Cost`, `Additional Cost`, `Tax Treatment`, `VAT Rate`, `VAT Amount`, `Displayed Purchase Total`, `Asset Acquisition Cost`, `Supplier`, `Purchase Date`, `PO/Receive source`, and `Actor/Company/Branch`.

`HISTORICAL_PURCHASE_IMMUTABLE = YES`. Current valuation changes must never rewrite historical purchase data.

## 15. Current Valuation

User input:

- Current Stone Value: required and explicit.

Server-derived:

- Current VAT through the Tax Engine.
- Current Total Cost = Current Stone Value + Current VAT.

Rules:

- Current Stone Value, VAT, and total are nonnegative.
- An absent Current Stone Value is a fail-closed validation error.
- Purchase Cost must never be substituted as a historical fallback.

`CURRENT_VALUATION_HISTORY_FALLBACK = FORBIDDEN`.

## 16. Sales/Pricing

| Field | Authority |
|---|---|
| Markup % | Optional input/policy value |
| Stone Selling Price | Required; Asset.price authority |
| Maximum Discount % | Optional policy/input value |
| Minimum Allowed Selling Price | Server-derived policy |
| Expected Profit | Stone Selling Price - Current Total Cost |
| Profit Margin | Server-derived |

Reuse the existing Asset Selling Price Management, minimum-price policy, discount policy, below-minimum approval, permissions, audit, idempotency, and POS price resolution. Do not create a second Loose pricing endpoint or authority.

## 17. Barcode

The future backend must explicitly resolve:

```text
LOOSE_GEMSTONE -> inventoryCode GS, itemCode LOS, karatCode 00
serial -> six digits
family -> GSLOS00xxxxxx
```

Requirements:

- No first-compatible-item fallback for Loose Gem.
- No UI label-to-code authority.
- No frontend barcode generation.
- Asset barcode and permanent history remain the identity authorities.

The prior audit found GS and LOS master rows and loose `00` normalization capability, but not explicit Loose Gem LOS enforcement. This contract closes the direction: the implementation must add the server mapping before acceptance.

## 18. RFID

RFID remains optional. Reuse the existing Asset RFID lifecycle for Generate, Assign, Replace, Remove, History, and Audit. No second RFID subsystem or mandatory RFID field is authorized.

## 19. Status/Branch/Location

Approved statuses:

`Available`, `Reserved`, `Pending Transfer`, `Workshop`, `Returned`, `Missing`, `Melted`, `Sold`.

Branch is server-authoritative and required. Location is an active branch-scoped DB master. Direct free-text location per transaction is prohibited. Permissioned “add from selector” may use the existing location-management authority. Client example locations must not be copied as production defaults.

## 20. Certificate/Image Contract

Fields:

- Certificate Authority: optional; DB master.
- Certificate Number: optional; if supplied, Certificate Authority is required.
- Certificate Images: optional, multiple.
- Item Images: optional, multiple, named.

Reuse `AssetCertificate` and `AssetAttachment`. Do not create Loose-specific tables unless implementation proves the existing schema inadequate and a separate reversible migration is explicitly approved. Certificate/image ownership, readback, and audit must be Asset-based.

## 21. Audit

The existing append-only audit architecture must cover:

- Asset creation and gem-data edits.
- Purchase cost and current valuation changes.
- Selling price changes.
- Certificate add/edit/delete.
- Barcode reprint/replacement.
- RFID actions.
- Status, location, and branch changes.
- Below-minimum sale.

Where available, each event preserves old value, new value, user, employee code, company, branch, device, date, time, and reason. No parallel Loose audit system is permitted.

## 22. Validation

Server-side required validations:

`Supplier required`, `Purchase Date required`, `Stone Name required`, `Stone Carat Weight required`, `Stone Carat Weight > 0`, `Purchase Cost required`, `Purchase Cost >= 0`, `Additional Cost >= 0`, `Current Stone Value required`, `Current Stone Value >= 0`, `Selling Price required`, `Selling Price > 0`, `Asset ID unique`, `Barcode unique`, `Company/Branch fail closed`, `Location valid for Branch`, and `Master values active`.

Frontend validation is supplementary. The server must remain authoritative and must fail closed when required business data is missing.

## 23. Profile Contract

```text
INTERNAL_PROFILE = LOOSE_GEMSTONE
TOP_LEVEL_ASSET_TYPE = GEMSTONE
CARAT = CANONICAL_WEIGHT_INPUT
GROSS_WEIGHT = NOT_USER_REQUIRED
DERIVED_GRAMS = INTERNAL_DERIVED_VALUE
PRIMARY_SUBJECT_COMPONENT_COUNT = 1
PRIMARY_SUBJECT = TECHNICAL_DETAIL_ONLY
ASSET = PHYSICAL_INVENTORY_IDENTITY
MOUNTED_COMPONENT_SEMANTICS = FORBIDDEN
```

Required user fields must match the client contract. The current generic `grossWeight` requirement is not allowed to leak into the final Loose user request.

## 24. Frontend Contract

The future page must exist in AR and EN and match the eight-section contract. It must use DB-backed selectors, correct RTL/LTR behavior, readable numeric LTR presentation, and project-standard searchable selectors where available.

Normal customer UI must not expose technical/debug wording such as Supplier V2, Server Preview, Shared Preview, Backend, Request Fingerprint, Idempotency, PRIMARY_SUBJECT, or GS/LOS/00 architecture language. Business help may use `ⓘ`; `!` is reserved for actionable warnings. Validation belongs beside the relevant field.

## 25. Preview Contract

Before confirmation, both Profile Preview and Shared Receive Preview are mandatory. They must agree on:

`profile`, `supplier`, `location`, `purchase cost`, `additional cost`, `tax treatment`, `VAT`, `purchase total`, `current value`, `current VAT`, `current total`, `selling price`, `minimum allowed price`, and barcode-family preview semantics.

Required gates:

```text
PROFILE_PREVIEW_PARITY = PASS
SHARED_PREVIEW_PARITY = PASS
MISMATCH = STOP_AND_NO_RECEIVE
```

The browser must not recompute authoritative VAT or silently repair a mismatch.

## 26. Exact Evidence Contract

Before any future live Receive, create the control-specific directory:

`backend/acceptance-artifacts/loose-gem-stone/<control-id>/`

Required artifacts:

`preview-response.json`, `exact-prepared-request.json`, `canonical-business-payload.sha256`, `rollback-request.json`, `rollback-result.json`, `pre-receive-db-baseline.json`, `pre-receive-backup-metadata.json`, `live-receive-network.json`, and `post-receive-db-reconciliation.json`.

Required sequence:

1. Capture the exact prepared browser request.
2. Hash the canonical business payload.
3. Save the exact rollback request.
4. Prove business-field parity.
5. Run full-route forced rollback.
6. Prove persistent business delta = 0.
7. Create and verify a fresh backup.
8. Execute exactly one live UI Receive only after all gates pass.
9. Save the exact live network evidence.
10. Reconcile DB, accounting, and idempotency.

## 27. Rollback Contract

Before live Receive:

```text
EXACT_PREPARED_REQUEST_RECOVERED = YES
ROLLBACK_REQUEST_RECOVERED = YES
BUSINESS_FIELD_MISMATCH_COUNT = 0
BUSINESS_PAYLOAD_HASH_PARITY = PASS
```

The forced-rollback route must stage the full canonical path—PO, PO Item, Asset, primary gem detail, purchase revision, current valuation, barcode, origin, movement, journal/AP, audit, and idempotency—and then roll back all persistent business effects.

`ROLLBACK_PERSISTENT_BUSINESS_DELTA = 0` is mandatory. A failure stops the batch; it is not repaired by a second Receive.

## 28. Backup Contract

Before live Receive, create only after explicit authorization:

`backend/backups/darfus_erp_PRE_LOOSE_GEM_STONE_RECEIVE_<UTCSTAMP>.dump`

Proof required:

- File exists.
- Bytes > 0.
- SHA-256 recorded.
- `pg_restore -l` passes.
- Backup timestamp precedes the live Receive.

There is no backup or live Receive in this contract-freeze control.

## 29. Live Acceptance Contract

Only after all contract, preview, evidence, rollback, and backup gates pass may a separately authorized batch execute exactly one real-browser Receive through the canonical Inventory UI to `darfus_erp`.

No API-only final acceptance is valid. No second Receive is allowed for diagnosis. Any unexpected partial state requires immediate stop and no retry.

## 30. DB/Accounting/Idempotency Contract

Expected one-Receive deltas are exactly:

| Entity | Expected delta |
|---|---:|
| purchase_orders | +1 |
| purchase_order_items | +1 |
| assets | +1 |
| primary gem detail | +1 |
| barcode/history | +1 |
| origin | +1 |
| purchase revision | +1 |
| current valuation | +1 |
| movement | +1 |
| journal | +1 |
| idempotency request | +1 |
| RFID | 0 unless explicitly supplied |
| Product quantity physical stock | 0 |

Accounting must prove a balanced journal, correct Asset acquisition debit, correct Input VAT, correct Supplier AP, and cash delta = 0. Receive creates no payment; Supplier payment remains separate.

Idempotency must prove exact replay with the same key and payload produces the same logical success with zero duplicate rows. Same key plus changed payload must return HTTP 409 and create no second business rows.

## 31. POS Contract

After a separately authorized accepted Receive, perform only read-only barcode search. Expected result:

```text
one Asset result
profile = LOOSE_GEMSTONE
barcode = GSLOS00xxxxxx
price = exact Asset.price
available = true
quantity = 1 physical Asset
```

No sale is part of first module acceptance. Product.quantity, Gold-only pricing, and legacy Product price fallback are forbidden.

## 32. Implementation Boundary

The next implementation batch may include only:

1. Dedicated Loose Gem AR/EN page.
2. Chooser entry.
3. Loose request/schema normalization.
4. Removal of grossWeight as a user-required field.
5. CT-derived gram logic.
6. Explicit GS/LOS/00 barcode mapping.
7. Loose purchase mapper.
8. Loose current valuation mapper.
9. Existing selling-price integration.
10. Existing certificate/image reuse.
11. Exact evidence artifact capture.
12. Focused/shared tests.
13. Preview parity.
14. Rollback-only acceptance.
15. Backup proof.
16. Exactly one live UI Receive after separate authorization.
17. Final DB/accounting/idempotency/POS proof.

Not authorized: Loose multi-stone Assets, Gem Jewellery changes, Diamond, Pearl, transfers, workshop, inventory-count redesign, unrelated master-data redesign, a new Tax Engine, a new pricing engine, or production deployment.

## 33. Migration Policy

No migration is assumed by this contract. If implementation proves a schema change necessary, stop and document the exact schema gap. A versioned reversible migration requires fresh disposable rehearsal and backup before any official apply. No ad hoc SQL patch is allowed. This freeze created or executed no migration.

## 34. Test Contract

Focused tests must cover:

- `LOOSE_GEMSTONE` profile and carat required.
- `grossWeight` not user-required.
- CT-to-gram derivation.
- One Asset and one primary subject.
- Active master validation and permission behavior.
- Purchase Cost and Additional Cost.
- VAT exactly once.
- Historical/current separation and explicit Current Stone Value.
- Asset.price, minimum price, and below-min approval.
- GS/LOS/00 mapping with no compatible-item fallback.
- Certificates/images and Asset ownership.
- Exact request artifact capture.
- Idempotency and rollback zero delta.

Shared regressions must cover Loose Diamond, Gem Stone Jewellery, Diamond Jewellery, GBW, GBP, Supplier Receive V2, Asset, Barcode, Tax, Selling Price, POS, Master Data, and Idempotency. Tests must not be weakened.

## 35. P1 Resolution Matrix

| Prior P1 | Frozen direction | Status |
|---|---|---|
| P1-01 Dedicated UI | One Inventory chooser entry and one dedicated AR/EN Loose page; no Gem Jewellery reuse | CONTRACT FROZEN |
| P1-02 GS/LOS/00 | Server explicitly maps `LOOSE_GEMSTONE -> GS/LOS/00`; no first-compatible fallback | CONTRACT FROZEN |
| P1-03 Finance/Tax | Purchase Cost and Additional Cost inputs; Tax Engine VAT; explicit historical/current/accounting mapping | CONTRACT FROZEN |
| P1-04 Exact request evidence | Required artifact directory and exact request/hash/rollback sequence before live Receive | CONTRACT FROZEN |
| P1-05 Attachments/Certificates | Reuse AssetCertificate and AssetAttachment with multiple named images and audit | CONTRACT FROZEN |
| P1-06 Gross Weight | Owner decision resolved: carat-only user authority; grams derived; generic grossWeight normalized away | OWNER DECISION RESOLVED/FROZEN |

`UNRESOLVED_P1_CONTRACT_DECISIONS = 0`.

## 36. Remaining Owner Decisions

None. The prior `grossWeight` question is explicitly resolved by the Owner. Any future change to this contract requires a new Owner authority; it must not be inferred during implementation.

`TRUE_OWNER_DECISIONS_REMAINING = 0`.

## 37. Gate

`GATE = PASS_LOOSE_GEM_STONE_AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE`

All prior P1 items have a frozen implementation direction. The client authority hash remains valid, the eight-section contract is frozen, and the Owner decision is resolved. This gate does not authorize code changes, migrations, master-data provisioning, official DB mutation, or Receive.

`LOOSE_GEM_STONE_IMPLEMENTATION_CONTRACT = FROZEN`.

`LOOSE_GEM_STONE_IMPLEMENTATION_AUTHORIZED = NO`.

## 38. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-GEM-STONE-AUTHORITY-NORMALIZATION-CONTRACT-FREEZE
MODE = AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE
PRIMARY_SCOPE = LOOSE_GEM_STONE
CLIENT_AUTHORITY_FILE = I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx
CLIENT_AUTHORITY_SHA256 = F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3
LOOSE_GEM_STONE_WEIGHT_AUTHORITY = STONE_CARAT_WEIGHT
STONE_CARAT_WEIGHT = REQUIRED
GROSS_WEIGHT_USER_INPUT = NOT_REQUIRED
CT_TO_GRAMS = 1_CT_EQUALS_0.20_GRAM
DERIVED_STONE_WEIGHT_GRAMS = SYSTEM_CALCULATED
ONE_PHYSICAL_LOOSE_GEM_STONE = ONE_ASSET
MULTI_STONE_LOOSE_ASSET = FORBIDDEN
CANONICAL_UI = INVENTORY_ADD_RECEIVE_LOOSE_GEM_STONE
LOOSE_GEMSTONE_8_SECTION_CONTRACT = FROZEN
LOOSE_REQUIRED_MASTER_CATEGORIES = GEMSTONE_NAME,GEMSTONE_TYPE,GEMSTONE_SHAPE,GEMSTONE_COLOR,GEMSTONE_TONE,GEMSTONE_TONE_LEVEL,GEMSTONE_SATURATION,GEMSTONE_OPTICAL_EFFECT,GEMSTONE_ORIGIN,CERTIFICATE_AUTHORITY
LOOSE_NOT_APPLICABLE_MASTER_CATEGORIES = GEMSTONE_POSITION,GEMSTONE_SETTING,GEMSTONE_TREATMENT
LOOSE_HISTORICAL_COST_AUTHORITY = PURCHASE_COST
LOOSE_ADDITIONAL_COST = OPTIONAL_AGGREGATE
LOOSE_CURRENT_VALUE = REQUIRED_EXPLICIT
CURRENT_VALUATION_HISTORY_FALLBACK = FORBIDDEN
LOOSE_SELLING_PRICE_AUTHORITY = ASSET_PRICE
LOOSE_BARCODE_AUTHORITY = GS_LOS_00_6DIGIT
RFID = OPTIONAL
LOCATION_AUTHORITY = DB_MASTER_BRANCH_SCOPED
EXACT_REQUEST_ARTIFACT_GATE = REQUIRED_BEFORE_LIVE_RECEIVE
ROLLBACK_BEFORE_LIVE_RECEIVE = REQUIRED
PRE_RECEIVE_BACKUP = REQUIRED
LIVE_RECEIVE_LIMIT = ONE
UNRESOLVED_P1_CONTRACT_DECISIONS = 0
TRUE_OWNER_DECISIONS_REMAINING = 0
SOURCE_CHANGES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_WRITES = 0
RECEIVE_EXECUTED = NO
GATE = PASS_LOOSE_GEM_STONE_AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE
LOOSE_GEM_STONE_IMPLEMENTATION_CONTRACT = FROZEN
LOOSE_GEM_STONE_IMPLEMENTATION_AUTHORIZED = NO
NEXT_RECOMMENDED_STEP = LOOSE_GEM_STONE_MINIMUM_SAFE_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — Contract Freeze complete. Owner review required. Do not start Loose Gem Stone implementation automatically.**
