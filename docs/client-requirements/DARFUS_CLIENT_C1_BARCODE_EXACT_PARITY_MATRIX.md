# DARFUS C1 — Barcode Exact Parity Matrix

Control: `DARFUS-CLIENT-C1-BARCODE-EXACT-PARITY-READ-FIRST-01`  
Mode: `READ_ONLY_IDENTITY_CRITICAL_AUDIT`  
Business authority: client Barcode document, constrained by the frozen Owner decisions D02=`ERG`, D03=`NCK`, D04=`CURRENT_HISTORY_FIRST`.

Evidence levels used below: `PROVEN_SOURCE`, `PROVEN_DB`, `PRIOR_ACCEPTED_RUNTIME`, and `NOT_PROVEN`. A `PASS` in this read-first matrix means the current contract is evidenced; it does not authorize a mutation proof.

| ID | Client requirement | Current source / DB evidence | Status | Exact gap / C2 note | Risk | Owner decision? |
|---|---|---|---|---|---|---|
| BC-001 | Gold By Weight inventory code is `GW`. | `backend/src/config/barcode-defaults.js`; active DB row `barcode_inventory_codes=GW`, client-approved. | EXACT_MATCH | None. | Low | No |
| BC-002 | Gold By Piece inventory code is `GP`. | Defaults and active DB row `GP`. | EXACT_MATCH | None. | Low | No |
| BC-003 | Diamond inventory code is `DD`. | Defaults and active DB row `DD`. | EXACT_MATCH | None. | Low | No |
| BC-004 | Gem Stone inventory code is `GS`. | Defaults and active DB row `GS`. | EXACT_MATCH | None. | Low | No |
| BC-005 | Pearl inventory code is `PL`. | Defaults and active DB row `PL`. | EXACT_MATCH | None. | Low | No |
| BC-006 | Item code `ANK` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-007 | Item code `BGL` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-008 | Item code `BAR` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-009 | Item code `BRC` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-010 | Item code `BRH` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-011 | Item code `CHN` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-012 | Item code `CHK` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-013 | Item code `CON` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-014 | Item code `CRW` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-015 | Earrings item code is `ERG`. | Frozen D02; defaults, active DB row, server validators, and Asset barcodes use `ERG`; no active `ERR` row. | EXACT_MATCH | The separate mockup conflict is tracked at BC-043 and is no longer an open Owner choice. | Critical identity | No; D02 frozen |
| BC-016 | Item code `FST` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-017 | Item code `LOS` is supported. | Defaults plus active client-approved DB row; loose generator forces it. | EXACT_MATCH | None. | Low | No |
| BC-018 | Necklace item code is `NCK`. | Frozen D03; defaults, active DB row, server taxonomy use `NCK`; no active `NLC` row. | EXACT_MATCH | The separate mockup conflict is tracked at BC-044 and is no longer an open Owner choice. | Critical identity | No; D03 frozen |
| BC-019 | Item code `PND` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-020 | Item code `PCH` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-021 | Item code `RNG` is supported. | Defaults plus active client-approved DB item row and current Assets. | EXACT_MATCH | None. | Low | No |
| BC-022 | Item code `TRN` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-023 | Item code `WRN` is supported. | Defaults plus active client-approved DB item row. | EXACT_MATCH | None. | Low | No |
| BC-024 | Barcode format is inventory code + item code + 2-digit karat + 6-digit serial. | `formatBarcode()` validates codes, normalizes karat, and pads serial; 18/18 current Asset/history values parse to their stored fields. | EXACT_MATCH | None for format. | Critical identity | No |
| BC-025 | Karat is two digits and serial is six digits. | `normalizeKaratCode()` and `formatBarcode()` use `padStart(2)` / `padStart(6)`; DB format check returned 0 invalid rows. | EXACT_MATCH | None. | High | No |
| BC-026 | Serial allocation is authoritative, unique, and collision-safe. | `barcode_sequences` UPSERT on `(company_id, inventory_code, item_code, karat_code)` plus unique indexes and Asset/history collision checks. | IMPLEMENTED_DIFFERENTLY | Scope is a documented implementation contract rather than a client-defined dimension; no C1 concurrency mutation proof. | Critical identity | No |
| BC-027 | Sequence/company scope and branch effect must be resolved without guessing. | Source and sequence key are company-scoped; branch is not encoded. The client does not specify a branch component. | IMPLEMENTED_DIFFERENTLY | `BRANCH_EFFECT_CLIENT_SPECIFIED=NOT_SPECIFIED`; preserve company scope. | High | No |
| BC-028 | Barcode uniqueness and reuse prevention. | 0 duplicate Asset barcodes, 0 duplicate history values, 0 active/history orphan or mismatch; `asset_barcode_history_barcode_uq` prevents historical reuse. | EXACT_MATCH | None in current read-only baseline. | Critical identity | No |
| BC-029 | Return/exchange preserves the same physical identity, Barcode, RFID, and history. | Return source resolves Asset and uses `transitionAsset(... RETURNED)`; no Barcode replacement in transition; prior accepted closure evidence covers read/runtime path. | IMPLEMENTED_DIFFERENTLY | Full mutation proof is not safe in C1; RFID replacement is independently governed and not assumed to follow Barcode. | Critical identity | No |
| BC-030 | Reprint uses the same Barcode. | `POST /inventory-v2/assets/:id/tags/print`; `REPRINT` requires reason, calls `recordTagPrint()`, and returns `asset.barcode`; no generator call. | EXACT_MATCH | No C1 print mutation executed. | High | No |
| BC-031 | Replacement retires old Barcode, preserves history, and prevents reuse. | `replaceAssetBarcode()` locks active history, retires it, updates same Asset, inserts next active history row, and runs in one transaction. | IMPLEMENTED_DIFFERENTLY | Current mechanism is canonical replacement history, not a separate client revision screen; mutation proof deferred. | Critical identity | No |
| BC-032 | Same physical item supports Item Revision v1/v2 history. | `barcodeRevision` and `asset_barcode_history` provide ordered Barcode revisions, actor/time/reason for replacement; no separate changed-field old/new revision record or v1/v2 API/UI. | PARTIAL | Minimum gap: revision facts for arbitrary item changes (`what/old/new/version/reason/source`) are not all represented as one client revision contract. | High identity | D04 says history first; C2 only if approved |
| BC-033 | Item Type and Karat cannot be casually edited after Barcode creation. | Generic Asset controller identity guard covers `type`, `karat`, `inventoryCode`, `itemCode`, `karatCode`, Barcode, serial, generated time, revision, RFID; metadata allowlist excludes them; DB trigger protects identity. | EXACT_MATCH | Evidence is source/DB; no forbidden mutation was attempted. | Critical identity | No |
| BC-034 | Image, description, making, price, supplier, and notes may be edited under permission. | Metadata service allowlist covers name/description/category/brand/notes/location; selling price has a dedicated permission/idempotency route. | PARTIAL | Image, supplier, making, and a complete field-by-field permission/audit matrix are not proven in the current Barcode scope. | High | No |
| BC-035 | Common profile fields include Barcode, SKU, RFID, Item Type, Description, Brand, Supplier, Purchase Date, Image, Status, Branch, Created By/Date, Audit Log. | Asset model/list/detail expose many fields; history/events/RFID are separate projections; current list/detail does not prove every field as a consistent UI/tag contract for every profile. | PARTIAL | Common-field parity is not exact across all profiles; SKU/image and profile-specific visibility need a separate read-only design. | High | No |
| BC-036 | Lifecycle vocabulary includes Created, In Stock, Reserved, Sold, Returned, Repair, Melted, Lost, Archived. | `OPERATIONAL_STATUS` has PENDING_INTEGRATION/AVAILABLE/RESERVED/SOLD/RETURNED/WORKSHOP/MELTED/MISSING etc.; event-only terms are explicit; legacy mapping preserves compatibility. | IMPLEMENTED_DIFFERENTLY | Returned/repair/lost/created are not all identical durable enum labels; status mapping must remain documented. | Critical | Yes only for future status parity |
| BC-037 | Loose profile karat handling is defined separately. | `resolveKaratCodeForProfile()` forces `LOOSE_*` to `00`, rejects supplied non-00, and generator forces item `LOS`; DB check found 0 violations. | IMPLEMENTED_DIFFERENTLY | Concrete `00/LOS` implementation is stronger than the client’s unspecified loose cases; no change needed. | High | No |
| BC-038 | GBW tag contains barcode and GW/ST/NT/MC semantics. | `BarcodeTagBacks.tsx` renders GW/ST/NT/MC; net weight is stored value; front renders stored Barcode. | IMPLEMENTED_DIFFERENTLY | Business fields present, but exact physical dimensions/order are not frozen by evidence. | Medium | No |
| BC-039 | GBP tag contains barcode, price, karat/type, optional brand, WT, DIS. | GBP back renders brand/WT/DIS; front renders stored Barcode/price according to config. | IMPLEMENTED_DIFFERENTLY | Exact client visual layout and all optional-field rules are not proven as an exact print artifact. | Medium | No |
| BC-040 | Diamond tag contains barcode, price, karat/type, carat, color/clarity, discount. | Diamond back renders Carat/CC/Cut/DIS and optional certificate; front renders stored Barcode/price. | IMPLEMENTED_DIFFERENTLY | Current renderer includes extra Cut/Cert fields; exact client subset/layout remains unproven. | High | No |
| BC-041 | Gem Stone tag contains barcode, price, karat/type, multiple stone rows, discount. | Gemstone back uses `resolveStones()` and renders multiple ST rows/DIS; source retains canonical NCK and does not use the mockup prefix as identity. | IMPLEMENTED_DIFFERENTLY | Exact visual layout and mockup prefix conflict are not a current identity authority. | High | No; D03 frozen |
| BC-042 | Pearl tag contains barcode, price, karat/type, pearl type and discount. | Pearl back renders Type/Size/Quality/DIS; front uses stored Barcode/price. | IMPLEMENTED_DIFFERENTLY | Current renderer includes Size/Quality; exact mockup layout is not frozen. | Medium | No |
| BC-043 | Client internal conflict: table `ERG` vs visual example `GPERR...`. | Conflict was documented; D02 froze `ERG`; active DB has ERG and no ERR; current code does not use ERR as authority. | IMPLEMENTED_DIFFERENTLY | Client artifact conflict remains historically visible; architecture decision resolves runtime authority. | Critical identity | No; D02 frozen |
| BC-044 | Client internal conflict: table `NCK` vs visual example `GSNLC...`. | Conflict was documented; D03 froze `NCK`; active DB has NCK and no NLC; current code does not use NLC as authority. | IMPLEMENTED_DIFFERENTLY | Client artifact conflict remains historically visible; architecture decision resolves runtime authority. | Critical identity | No; D03 frozen |

## C1 Triage Results

| Token | Result | Evidence |
|---|---|---|
| BARCODE_FORMAT_PARITY | EXACT | Source formatter plus DB parsing: 0 invalid patterns and 0 field mismatches. |
| SEQUENCE_AUTHORITY | Company + inventory + item + karat UPSERT; Asset/history unique backstops | Service, model/indexes, DB constraints. |
| BRANCH_ENCODED_IN_BARCODE | NO | Barcode contains no branch segment. |
| BRANCH_EFFECT_CLIENT_SPECIFIED | NOT_SPECIFIED | Client contract does not define branch encoding/effect. |
| ERG_RUNTIME_AUTHORITY_CONSISTENT | YES | Frozen D02, source defaults/validators, DB active row, no active ERR. |
| NCK_RUNTIME_AUTHORITY_CONSISTENT | YES | Frozen D03, source defaults/validators, DB active row, no active NLC. |
| BARCODE_MUTATIONS_IN_C1 | 0 | No POST/PUT/PATCH/DELETE business request was issued. |
