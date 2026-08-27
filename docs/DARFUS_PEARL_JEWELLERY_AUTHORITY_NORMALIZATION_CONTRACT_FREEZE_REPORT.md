# DARFUS ERP — Pearl Jewellery Authority Normalization + Minimum Implementation Contract Freeze

## 1. Executive Summary

تم تنفيذ مرحلة تطبيع السلطة وتجميد عقد التنفيذ فقط. تمت إعادة التحقق من ملف العميل `Pearl.docx`، وتثبيت القرار النهائي بأن `PEARL_JEWELLERY` هو ملف مجوهرات مستقل، وأن `LOOSE_PEARL` ملف canonical منفصل. لا توجد Owner Decisions متبقية في نطاق هذا الـControl.

لم يتم تعديل source أو قاعدة البيانات أو migrations أو master data، ولم يتم تنفيذ Receive. التقرير يجمّد contract التنفيذ للـBatch التالي فقط، ولا يمنح صلاحية التنفيذ تلقائيًا.

`GATE = PASS_PEARL_JEWELLERY_AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE`

## 2. Control Mode

| Control | Result |
|---|---|
| Control ID | `DARFUS-PEARL-JEWELLERY-AUTHORITY-NORMALIZATION-CONTRACT-FREEZE` |
| Mode | `AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE` |
| Primary scope | `PEARL_JEWELLERY` |
| Loose Pearl scope | Separate profile reference only |
| Official DB | `darfus_erp` |
| Source changes | `0` |
| Migrations executed | `0` |
| Seeds executed | `0` |
| Business writes | `0` |
| Receive executed | `NO` |
| Implementation authorized | `NO` |

### Distinction of supplied materials

- The pasted Prompt is the execution/control instruction.
- `Pearl.docx` is the read-only Business Requirements Authority for Pearl Jewellery.
- The Prompt explicitly overrides the earlier unresolved conflict by a frozen Owner decision; no new interpretation was added.

## 3. Client Authority

| Field | Value |
|---|---|
| File | `I:\WORK\client-requirements\Pearl.docx` |
| Size | `68,946` bytes |
| SHA-256 | `2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E` |
| Expected SHA | Exact match |
| Version check | `PASS` |
| Reference mode | `READ_ONLY` |
| Other profile documents | Not used as Pearl business authority |

Relevant Pearl Jewellery sections were re-read from the previously rendered/extracted document. The prior renderer variance of 74 actual pages versus the Prompt’s historical expected 77 pages is not treated as an authority change because the file hash matches exactly.

## 4. Owner Decision Resolution

`PEARL_CONFLICT_001 = RESOLVED`.

Frozen resolution:

```text
PEARL_JEWELLERY_SCOPE = JEWELLERY_ONLY
LOOSE_PEARL_SCOPE = SEPARATE_CANONICAL_PROFILE
LOOSE_PEARL_IN_PEARL_JEWELLERY_ITEM_DESCRIPTION = NO
LOOSE_PEARL_ROUTE = LOOSE_PEARL_PROFILE_ONLY
TRUE_OWNER_DECISIONS_REMAINING = 0
UNRESOLVED_P1_CONTRACT_DECISIONS = 0
```

The earlier document inconsistency is classified explicitly and is no longer an implementation blocker: the `Loose Pearl` row must be filtered out of Pearl Jewellery Item Description even if historical master data still contains that value.

## 5. Lessons-Learned Guardrails

The following are frozen requirements for the next implementation/acceptance batch:

- Capture the exact prepared request, canonical business hash, and rollback request to disk before any Confirm.
- Do not use browser memory as the only historical evidence.
- Re-authenticate through the normal login flow before official Confirm.
- Perform an authenticated protected GET returning HTTP 200 in the same browser session immediately before Confirm.
- Never disable authentication, extend tokens as a workaround, hard-code tokens, or bypass middleware.
- If Confirm returns 401/403, stop, inspect DB delta, and do not retry automatically.
- Tax Engine remains the sole tax authority; VAT must be applied exactly once.
- Historical purchase values and current valuation values remain separate.
- Selling price authority is `assets.price`; no Product or frontend fallback.
- Barcode is server-generated from `PL`, exact server Item Code, actual two-digit karat, and six-digit serial.
- Preserve unrelated worktree changes; no reset/clean/restore/stash.
- Try the existing schema first. A proven schema gap stops the batch; no official DB migration is allowed automatically.
- One official acceptance means at most one distinct successful Receive. Same-key exact replay is allowed only as replay of that transaction.

## 6. Product Identity

```text
ONE_PHYSICAL_PEARL_JEWELLERY_PIECE = ONE_TOP_LEVEL_ASSET
PRODUCT_QUANTITY_IS_NOT_PHYSICAL_INVENTORY_AUTHORITY
PEARL_COMPONENTS = CHILD_COMPONENTS
DIAMOND_COMPONENTS = CHILD_COMPONENTS_IF_PRESENT
GEMSTONE_COMPONENTS = CHILD_COMPONENTS_IF_PRESENT
MIXED_PEARL_DIAMOND_GEM_COMPONENTS = ALLOWED
MOUNTED_COMPONENTS = NOT_TOP_LEVEL_ASSETS
```

The top-level Pearl Jewellery piece is serialized as one Asset. Component `Quantity` is only group metadata and must never create Product quantity stock or additional top-level Assets.

## 7. Canonical UI

```text
Inventory
→ + Add / Receive Inventory
→ Pearl Jewellery
```

Required next-batch UI outcome:

- dedicated Arabic page;
- dedicated English page;
- enabled chooser entry only after implementation proof;
- one canonical receive workflow;
- no Supplier duplicate receive workflow;
- no reuse of the Loose Pearl form;
- no Pearl sidebar receive entry.

## 8. Nine-Section Contract

The Pearl Jewellery form must contain exactly these business sections:

1. Item Identification
2. Gold Information
3. Pearl Information
4. Purchase Information
5. Current Cost Information
6. Sales Information
7. Tag Information
8. Item Status Information
9. Audit & System Information

Loose Pearl fields and Loose Pearl formulas must not be copied into this profile.

## 9. Item Identification

| Field | Authority/behavior |
|---|---|
| Item Description | Required; server resolves Item Code; `Loose Pearl` excluded |
| Gold Karat | Required system contract; actual karat retained |
| Gold Color | Required controlled DB master value |
| Supplier | Required company-scoped DB master; no receive-time free text |
| Purchase Date | Required; default may be today, editable only by permission |
| Brand | Optional |
| Model Name | Optional |
| Model Number | Optional |
| Named item images | Optional, multiple |
| Location | Branch-scoped DB master; no free-text operational authority |

The existing profile/master registry may be reused only after filtering the `Loose Pearl` item value from the Pearl Jewellery selection contract.

## 10. Gold Contract

Inputs and formulas are frozen:

```text
Gross Weight = REQUIRED
Pearl Weight = SUM(Pearl Group Total Weight)
Other Stones Weight = SUM(Diamond Weight + Gemstone Weight)
Net Gold Weight = Gross Weight - Pearl Weight - Other Stones Weight
Pure Gold Weight = Net Gold Weight * Karat / 24
```

Validation:

- Gross Weight > 0.
- Pearl Weight + Other Stones Weight <= Gross Weight.
- Net Gold Weight >= 0.
- Pure Gold Weight >= 0.
- Calculated fields are server-derived and read-only.
- No manual override of calculated weight fields.

## 11. Pearl Group Contract

One Pearl row may represent one pearl or multiple identical pearls.

```text
PEARL_GROUP_QUANTITY = OPTIONAL
DEFAULT = 1
QUANTITY > 0
PEARL_GROUP_TOTAL_WEIGHT = COMBINED_WEIGHT_OF_GROUP
PEARL_GROUP_COST = COMBINED_COST_OF_GROUP
```

The implementation must not multiply an already combined group weight or cost by Quantity a second time. Any differing controlled specification creates a separate Pearl row. This Quantity remains component metadata only.

## 12. Pearl Field Contract

Each Pearl row/group contains:

| Field | Requirement |
|---|---|
| Quantity | Optional; positive if supplied |
| Total Pearl Weight | Required; positive combined group weight |
| Pearl Size | Optional controlled master value |
| Pearl Type | Optional controlled master value |
| Pearl Color | Optional one primary controlled value per group |
| Pearl Overtone | Optional one controlled secondary value per group |
| Pearl Orient | Optional controlled master value |
| Pearl Shape | Optional controlled master value |
| Pearl Luster | Optional controlled master value |
| Pearl Surface Quality | Optional controlled master value |
| Nacre Quality | Optional controlled master value |
| Pearl Origin | Optional controlled master value |
| Certificate Authority | Optional; required when certificate number exists |
| Certificate Number | Optional |
| Certificate Images | Optional multiple |
| Remarks | Optional |
| Pearl Cost | Optional nonnegative group cost |

Pearl Color is one primary color per identical group. Pearl Overtone is one secondary value per group. Different primary colors require separate groups; no Pearl Color multi-select array is required.

## 13. Master Data

Runtime source categories are frozen as:

```text
PEARL_SIZE
PEARL_TYPE
PEARL_COLOR
PEARL_OVERTONE
PEARL_ORIENT
PEARL_SHAPE
PEARL_LUSTER
PEARL_SURFACE_QUALITY
PEARL_NACRE_QUALITY
PEARL_ORIGIN
CERTIFICATE_AUTHORITY
PEARL_ITEM_DESCRIPTION
```

Rules:

- DB runtime source only.
- Add/edit/disable is permissioned and audited.
- Used values cannot be destructively deleted.
- No fake production defaults.
- No master-data mutation in this freeze.
- `Loose Pearl` is excluded from Pearl Jewellery UI selection even if present in historical master data.

Current official DB evidence remains suitable as a source foundation: 39 Pearl Size rows; Pearl category counts match the client lists; no Pearl Asset or Pearl component rows exist. The historical overall manifest count discrepancy is not reopened as a contract decision.

## 14. Mixed Components

Allowed combinations:

- Pearl + Diamond
- Pearl + Gemstone
- Pearl + Diamond + Gemstone

Reuse the closed component architecture. Do not redesign Diamond or Gemstone. Every included component contributes its weight, technical detail, cost/current value, and certificate metadata where applicable. Other Stones Weight and Other Stone Cost are server-derived aggregates.

## 15. Purchase Contract

Required inputs:

```text
Purchase Gold Price Per Gram
Making Charge Per Gram
```

Derived values:

```text
Gold Purchase Value = Net Gold Weight * Purchase Gold Price Per Gram
Making Total = Net Gold Weight * Making Charge Per Gram
Pearl Cost Total = SUM(Pearl Group Costs)
Other Stone Cost Total = SUM(Diamond + Gemstone Costs)
PURCHASE_PRE_TAX_BASE = Gold Purchase Value + Making Total + Pearl Cost Total + Other Stone Cost Total
Purchase VAT = Tax Engine(PURCHASE_PRE_TAX_BASE, transaction context)
Purchase Total = PURCHASE_PRE_TAX_BASE + VAT
```

VAT is applied exactly once. The frontend may display the result but cannot be the tax authority.

## 16. Gold Rate Snapshot

Initial source:

```text
Provider = GOLDAPI_IO
Currency = AED
Unit = per gram
Source = DARFUS Gold Center
```

Purchase-time override is allowed only when the existing DARFUS authority supports it, with permission, reason, and audit. The historical snapshot becomes immutable after Receive. No new provider or hidden fallback may be introduced.

## 17. Accounting

For standard VAT:

```text
Dr Inventory / Asset       PURCHASE_PRE_TAX_BASE
Dr Recoverable Input VAT   VAT
Cr Supplier AP             PURCHASE_TOTAL
Cash delta                 0
```

The journal must balance. Receive creates no payment. Recoverable VAT is not capitalized into Asset acquisition cost. Historical purchase evidence and current valuation remain separate.

## 18. Current Cost

```text
Current Gold Rate = current approved Gold Center rate for Asset karat
Current Gold Value = Current Gold Rate * Net Gold Weight
Current Making = historical making total
Current Pearl Cost = persisted/current Pearl component value authority
Current Other Stone Cost = current Diamond/Gem component value authority
Current Item Cost = Current Gold Value + Current Making + Current Pearl Cost + Current Other Stone Cost
```

Current valuation must not rewrite the historical purchase rate, purchase base, VAT snapshot, or purchase total.

## 19. Sales / Pricing

Required business outputs:

- Markup %
- Selling Price
- Maximum Discount %
- Minimum Selling Price
- Sales VAT
- Net Selling Price Before Tax
- Profit
- Profit Margin

Frozen authority:

```text
SELLING_PRICE_AUTHORITY = assets.price
```

If only markup is supplied, the server derives selling price. If only selling price is supplied, the server derives markup for display. If both are supplied, the server validates parity. Before final Receive, `Asset.price > 0` is required. Pearl Jewellery must be explicitly included in canonical profile-aware sale pricing, with no Product fallback and no gold-only fallback.

## 20. Barcode / RFID

Barcode contract:

```text
Inventory Code = PL
Item Code = exact server mapping from Item Description
Karat = actual two-digit karat
Serial = six digits
```

No first-compatible fallback, frontend generation, label guessing, or barcode reuse. One Asset has at most one active Barcode; history is preserved. RFID is optional and must reuse the existing Asset RFID lifecycle.

## 21. Status / Branch / Location

Allowed statuses:

```text
Available, Reserved, Pending Transfer, Workshop,
Returned, Missing, Melted, Sold
```

Branch is server-authoritative and required. Location is a branch-scoped DB master. Location add/disable is permissioned; used locations cannot be deleted. Direct status mutation from a generic page is not allowed; status changes come from authorized actions and preserve history.

## 22. Audit / Validation

Audit coverage must include:

- Asset create;
- Gold edits;
- Pearl group add/edit/remove;
- Diamond/Gem component add/edit/remove;
- purchase gold-rate override;
- cost/current valuation changes;
- selling price;
- certificate;
- barcode/RFID;
- status/location/branch;
- below-minimum sale.

Where available, retain old value, new value, user, employee, branch, device, date, time, and reason. Do not create a parallel Pearl audit subsystem.

## 23. Preview Contract

Both Pearl Profile Preview and Shared Receive Preview must agree on:

- profile and identity;
- supplier and location;
- description/item-code semantics;
- karat and gross weight;
- pearl/other-stone weights;
- net and pure-gold weights;
- group quantity, weight, and cost;
- Diamond/Gem totals;
- purchase gold rate, gold value, making, components, tax, purchase total;
- current gold rate, current value, current cost;
- selling price and minimum price;
- barcode family semantics.

Any mismatch is a hard stop and does not authorize Receive.

## 24. P1 Resolution

The previous P1 implementation directions are now normalized as scope, not completed code:

| Previous gap | Frozen next-batch requirement |
|---|---|
| `P1-PEARL-001` | Dedicated chooser, AR/EN page, profile contract, Profile Preview, Shared Preview |
| `P1-PEARL-002` | Pearl financial calculator, explicit tax branch, explicit sale-pricing support |
| `P1-PEARL-003` | Grouped Pearl semantics, mixed component persistence/reconciliation |
| `P1-PEARL-004` | Accounting, barcode, idempotency, rollback, auth, and runtime proof |

`UNRESOLVED_P1_CONTRACT_DECISIONS = 0`; implementation gaps remain and are intentionally deferred to the next batch.

## 25. P2 Resolution

No P2 business-rule decision remains open. The historical page-count variance and overall master-data count discrepancy remain evidence/observability notes only; they do not change the frozen Pearl contract because the client SHA matches and Pearl category counts are present.

## 26. Schema / Migration Policy

```text
MIGRATION_ASSUMED = NO
```

The next implementation must first test the existing schema. If a genuine schema gap is proven, stop and report the exact gap. Do not create or apply a migration in that batch automatically. Any future migration requires a versioned reversible migration, disposable-clone rehearsal, backup, and explicit Owner approval.

## 27. Evidence Contract

Future implementation/acceptance artifacts must be written under:

`backend/acceptance-artifacts/pearl-jewellery/<control-id>/`

Required artifacts before live Confirm:

```text
01-pre-implementation-db-baseline.json
02-profile-preview.json
03-shared-preview.json
04-exact-prepared-request.json
05-canonical-business-payload.sha256
06-rollback-request.json
07-rollback-result.json
08-rollback-db-before.json
09-rollback-db-after.json
10-pre-receive-db-baseline.json
11-auth-session-proof.json
12-pre-receive-backup-metadata.json
13-live-receive-network.json
14-post-receive-db-reconciliation.json
15-idempotency-replay-proof.json
16-idempotency-conflict-proof.json
17-ar-asset-readback.json
18-en-asset-readback.json
19-pos-read-proof.json
```

No secrets may be written to these artifacts.

## 28. Auth-Safety Contract

Immediately before any future official Confirm:

1. Re-authenticate through the supported login path.
2. Perform a protected read from the same browser session.
3. Prove HTTP 200.
4. Refresh/reopen Preview if needed.
5. Recheck exact request and business-hash parity.
6. Only then allow Confirm.

Any 401/403 is a stop condition. No automatic retry and no auth bypass.

## 29. Rollback Contract

Rollback rehearsal must stage and verify all affected layers:

- PO and PO Item;
- top-level Asset;
- Pearl component/detail rows;
- Diamond/Gem rows when included;
- purchase-cost revision;
- current valuation;
- barcode/history;
- origin;
- movement;
- journal/AP;
- audit;
- idempotency.

Required result:

```text
ROLLBACK_PERSISTENT_BUSINESS_DELTA = 0
BUSINESS_FIELD_MISMATCH_COUNT = 0
BUSINESS_PAYLOAD_HASH_PARITY = PASS
```

Rollback proof is disposable-clone proof first; it does not authorize official DB cleanup.

## 30. Backup / Live Receive Contract

The future fixed sequence is:

1. Implementation and focused/shared tests pass.
2. Typecheck/build pass.
3. AR/EN Preview pass.
4. Save exact request, hash, and rollback artifacts.
5. Disposable-clone rollback pass with zero persistent delta.
6. Fresh authenticated session and protected GET 200.
7. Fresh verified official backup with nonzero size, SHA, and `pg_restore -l` pass.
8. One browser Confirm from the canonical Inventory path.
9. DB, accounting, idempotency, AR/EN, and POS read-only proof.
10. Stop.

No step is reordered for convenience. Maximum successful distinct official Receives is one. Same-key exact replay is not a second distinct Receive.

## 31. True Owner Decisions

```text
TRUE_OWNER_DECISIONS_REMAINING = 0
PEARL_CONFLICT_001 = RESOLVED
```

No new Owner question is raised. Frozen system decisions such as Asset authority, DB-backed Supplier/Location, Tax Engine authority, `Asset.price`, barcode identity, and Product quantity isolation are not reopened.

## 32. Gate

```text
GATE = PASS_PEARL_JEWELLERY_AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE
PEARL_JEWELLERY_IMPLEMENTATION_CONTRACT = FROZEN
PEARL_JEWELLERY_IMPLEMENTATION_AUTHORIZED = NO
```

This PASS means the business/architecture contract is normalized and frozen. It does not mean Pearl Jewellery is implemented or accepted at runtime.

## 33. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-JEWELLERY-AUTHORITY-NORMALIZATION-CONTRACT-FREEZE
MODE = AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE
CLIENT_AUTHORITY_SHA256 = 2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E
CLIENT_AUTHORITY_VERSION_CHECK = PASS

PEARL_CONFLICT_001 = RESOLVED
PEARL_JEWELLERY_SCOPE = JEWELLERY_ONLY
LOOSE_PEARL_SCOPE = SEPARATE_CANONICAL_PROFILE
LOOSE_PEARL_IN_PEARL_JEWELLERY_ITEM_DESCRIPTION = NO
TRUE_OWNER_DECISIONS_REMAINING = 0
UNRESOLVED_P1_CONTRACT_DECISIONS = 0

ONE_PHYSICAL_PEARL_JEWELLERY_PIECE_ONE_ASSET = FROZEN
PEARL_GROUP_QUANTITY = FROZEN
PEARL_GROUP_TOTAL_WEIGHT = FROZEN
PEARL_GROUP_COST = FROZEN
MIXED_COMPONENTS = PEARL_DIAMOND_GEMSTONE_ALLOWED
GOLD_FORMULAS = FROZEN
PURCHASE_FINANCIAL_CONTRACT = FROZEN
CURRENT_COST_CONTRACT = FROZEN
SELLING_PRICE_AUTHORITY = ASSET_PRICE
BARCODE_AUTHORITY = PL_ITEM_KARAT_6DIGIT

EXACT_REQUEST_BEFORE_CONFIRM = REQUIRED
CANONICAL_HASH_BEFORE_CONFIRM = REQUIRED
ROLLBACK_REQUEST_BEFORE_CONFIRM = REQUIRED
AUTHENTICATED_READ_IMMEDIATELY_BEFORE_CONFIRM = REQUIRED
AUTOMATIC_RETRY_AFTER_AUTH_FAILURE = FORBIDDEN
ROLLBACK_BEFORE_LIVE_RECEIVE = REQUIRED
ROLLBACK_PERSISTENT_DELTA = MUST_BE_ZERO
FRESH_BACKUP_BEFORE_CONFIRM = REQUIRED
LIVE_DISTINCT_RECEIVE_MAX = ONE

MIGRATION_ASSUMED = NO
SOURCE_CHANGES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_WRITES = 0
RECEIVE_EXECUTED = NO

GATE = PASS_PEARL_JEWELLERY_AUTHORITY_NORMALIZATION_AND_IMPLEMENTATION_CONTRACT_FREEZE
PEARL_JEWELLERY_IMPLEMENTATION_CONTRACT = FROZEN
PEARL_JEWELLERY_IMPLEMENTATION_AUTHORIZED = NO
NEXT_RECOMMENDED_STEP = PEARL_JEWELLERY_MINIMUM_SAFE_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

توقف التقرير هنا. لا يبدأ Pearl implementation ولا Loose Pearl ولا أي Receive تلقائيًا. يلزم Owner approval صريح للـBatch التالي.
