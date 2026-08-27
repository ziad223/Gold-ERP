# DARFUS ERP — Loose Pearl Preimplementation Authority Audit

تم تنفيذ فحص Read‑Only فقط لملف `Pearl.docx` وربطه بالمصدر الحالي، قاعدة `darfus_erp`، Master Data، Tax، Supplier V2، Asset/Barcode/RFID، POS، والواجهة. لم يتم تعديل الكود أو قاعدة البيانات، ولم يتم تنفيذ Receive أو Preview/Checkout أو أي Business POST.

النتيجة الحالية: توجد فجوتان سلطويتان حقيقيتان تحتاجان قرار Owner، لذلك الـGate متوقف ولا تبدأ أي Implementation قبل حسمهما.

## 1. Executive Summary

`Pearl.docx` هو Business Requirements Authority لـLoose Pearl. تمّت قراءة وثيقة العميل كاملة بنيويًا، وفحص القسم الخاص بـLoose Pearl وقواعد Inventory/All Items/Asset المشتركة ذات الصلة. تمّت مراجعة جميع الصفحات المرئية الناتجة من LibreOffice وعددها 74 صفحة؛ لم توجد جداول أو صور أو Shapes مضمّنة. الـControl يذكر 77 صفحة منطقية، ولذلك سُجل فرق الصفحات كفجوة تغطية قابلة للتتبع، وليس كدليل على متطلبات مفقودة.

الواقع الحالي ليس Profile مكتملًا لـLoose Pearl: يوجد `LOOSE_PEARL` في سجل Backend العام وبعض خدمات V2، لكن لا يوجد Frontend route مستقل، ولا خيار مستقل في Intake chooser، ولا specialized contract/preview route. شاشة `/inventory/pearl` الحالية هي Pearl Jewellery وليست Loose Pearl.

قرارا Owner المطلوبان:

1. وثيقة العميل تسمح بتمثيل مجموعة متجانسة من اللآلئ في Record واحد مع Quantity، بينما السلطة المجمدة تمنع Quantity-based physical inventory ويفرض النظام Asset واحدًا لكل قطعة؛ المصدر الحالي يرفض `PRIMARY_SUBJECT componentCount > 1` ولا يملك `assets.quantity`.
2. الوثيقة تجعل Supplier اختياريًا/يدويًا، بينما مسار Supplier Receive V2 الحالي يرفض غياب `supplierId` قبل إنشاء PO/Asset/Payable.

## 2. Control / Read-Only Proof

| Token | Actual |
|---|---|
| MODE | `READ_ONLY_PREIMPLEMENTATION_AUTHORITY_AUDIT` |
| SOURCE_CHANGES | `0` (تغييرات هذا Control مقتصرة على التقرير وملفات الأدلة) |
| MIGRATIONS_CREATED / EXECUTED | `0 / 0` |
| SEEDS_EXECUTED | `0` |
| MASTER_DATA_MUTATIONS | `0` |
| BUSINESS_WRITES | `0` |
| RECEIVE_EXECUTED | `NO` |
| CONFIRM_CLICKS | `0` |
| POS_CHECKOUT | `NO` |
| PRODUCTION_CONTACTED | `NO` |
| Official DB | `darfus_erp`, read-only |

Source/worktree baseline (read-only): branch `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`, `97` tracked-modified entries, `425` untracked entries, `0` deletions. This is pre-existing worktree drift; it was not cleaned, reset, stashed, or claimed as part of this Control. No source file was edited.

## 3. Client Authority File Identity

| Field | Evidence |
|---|---|
| File | `I:/WORK/client-requirements/Pearl.docx` |
| Supplied label | `Pearl(5).docx` |
| Size | `68946` bytes |
| SHA256 | `2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E` |
| Prompt logical pages | `77` |
| Rendered pages | `74` (`Pearl.pdf`, `page-1.png` … `page-74.png`) |
| Structural parse | 947 paragraphs, 0 tables, 0 inline shapes, 0 media files |
| Visual coverage | Complete for all 74 rendered pages; no table/image/shape content found |
| Loose Pearl scope | Starts around document page 32 and contains 8 sections through Audit/System |

## 4. Loose Pearl Business Model

الوثيقة تعرّف Loose Pearl كمخزون مستقل يمكن بيعه مباشرة أو الاحتفاظ به أو استخدامه لاحقًا في التصنيع مع حفظ Asset Lineage. لا توجد بيانات Gold أو Gold Weight أو Gold Cost أو Making Cost في هذا الملف.

الوثيقة تسمح بواحد من شكلين: Pearl واحدة، أو مجموعة متجانسة من Pearls متطابقة تعامل كوحدة Inventory واحدة. Quantity هو عدد المجموعة، Total Pearl Weight وPearl Cost هما الإجماليان للمجموعة ولا يعاد ضربهما في Quantity.

## 5. Eight Client Sections

1. **Item Identification:** Supplier اختياري، Purchase Date مطلوب، Images اختيارية ومتعددة بأسماء مستقلة.
2. **Pearl Information:** Quantity، Total Pearl Weight، Size، Type، Color، Overtone، Orient، Shape، Luster، Surface Quality، Nacre Quality، Origin، Certificate Authority/Number/Images، Remarks، مع إضافة مجموعات متطابقة فقط.
3. **Purchase:** Quantity، Pearl Cost التاريخي الإجمالي، Purchase VAT = Cost × configured VAT، Total Purchase Value = Cost + VAT، مع دقة/منع السالب وقراءة الحسابات فقط.
4. **Current Cost:** Current Quantity، Current Pearl Cost، Current VAT، Current Total، منفصل عن التاريخي.
5. **Sales:** Markup، Selling Price، Maximum Discount، Minimum Selling Price After Discount، Sales VAT، Net Before Tax، Profit Margin.
6. **Tag:** Barcode آلي فريد وأساسي، RFID اختياري وفريد وتكميلي، وإعادة الطباعة مدققة.
7. **Status:** Available، Reserved، Pending Transfer، Workshop، Returned، Missing، Melted، Sold؛ Branch authoritative وLocation.
8. **Audit/System:** Asset ID، actor/timestamps، old/new values، user/employee/branch/device/time/reason، وكل عمليات cost/price/certificate/tag/status/location/lineage.

## 6. Asset Grouping / Quantity Authority

| Authority | Actual |
|---|---|
| Client `ONE_RECORD_CAN_REPRESENT_GROUP` | `YES` |
| Frozen DARFUS `ONE_PHYSICAL_PIECE=ONE_ASSET` | `YES` |
| Frozen `NO_QUANTITY_BASED_INVENTORY` | `YES` |
| Current `assets.quantity` | Column absent |
| Current primary component count | `validateComponent()` rejects count > 1 for `PRIMARY_SUBJECT` |
| Current Loose Pearl runtime | `looseDetailsAsPrimarySubject()` creates one primary component with count 1 |
| Result | `AUTHORITY_CONFLICT` |

لا يمكن تشغيل الخيارين معًا دون تعريف جديد للهوية والكمية والـBarcode والعدّ والبيع الجزئي والاستهلاك الجزئي والتكلفة والوزن والـValuation والـLineage والتحويل والمرتجع والتدقيق. لم يتم اتخاذ قرار أو تنفيذ split/group workaround.

## 7. Supplier Optionality

الوثيقة تقول `CLIENT_SUPPLIER_REQUIRED = NO` وتسمح بـmanual/unknown supplier. أما `POST /api/v1/purchase-orders/receive` فيتحقق من `supplierId` بعد فحص tax/branch وقبل Claim للـIdempotency، ثم يرفض غيابه برسالة Supplier مطلوب. هوية المورد الحالية canonical `Supplier.id` داخل company scope، وليست نصًا حرًا.

التصنيف: `AUTHORITY_CONFLICT`. لا يجوز إنشاء Unknown Supplier أو Default Supplier. يلزم Owner أن يحدد: مسار non-purchase مستقل، أو إلزام Supplier في purchased stock وتحديد معنى optionality خارج هذا المسار.

## 8. Pearl Technical Master Data

| Category | Active DB count | Client baseline | Result |
|---|---:|---:|---|
| PEARL_TYPE | 10 | 10 | Match |
| PEARL_COLOR | 17 | 17 | Match |
| PEARL_OVERTONE | 19 | 19 | Match |
| PEARL_ORIENT | 6 | 6 | Match |
| PEARL_SHAPE | 10 | 10 | Match |
| PEARL_LUSTER | 26 | 26 | Match |
| PEARL_SURFACE_QUALITY | 18 | 18 | Match |
| PEARL_NACRE_QUALITY | 27 | 27 | Match |
| PEARL_ORIGIN | 20 | 20 | Match |
| CERTIFICATE_AUTHORITY | 16 | 14 listed in client file | Master-data drift to reconcile |
| PEARL_ITEM_DESCRIPTION | 18 | Client Pearl list includes Loose Pearl plus jewellery descriptions | Present, but no Loose Pearl UI binding |

Pearl Size: 39 rows، 39 active، 39 distinct، min 1، max 20، step 0.5، display `<value> mm`. Read service and permissioned admin paths exist؛ لا تظهر IDs للمستخدم في binding الموجود. لا يوجد تعديل.

## 9. Historical Purchase

المصدر المالي الحالي يثبت أن `loose-profile-finance.service.js` يعالج Loose Pearl ضمن Profiles الثلاثة، ويقرأ `purchasePricePreTax / purchasePrice / purchaseCost / baseCost`، ويحسب VAT مرة واحدة على base. في Supplier V2، `purchaseCost` هو الناتج الاقتصادي قبل تحويلات PO، بينما PO tax snapshot هو السلطة المحاسبية.

المشكلة ليست إثبات Formula جديدة الآن؛ المشكلة أن Loose Pearl لا يملك profile screen/preview مستقلًا ولا قبولًا نهائيًا يثبت Quantity-group semantics أو Supplier optionality أو unit mapping.

## 10. Current Cost

المصدر يوفر `looseProfileFinance.calculateCurrent()` ويحفظ `asset_current_valuations` كسلطة مستقلة. الـDB يحتوي 13 purchase-cost revisions و13 current valuations. لا توجد واجهة Loose Pearl لتحديث current value وفق permissions ولا acceptance proof خاص بها.

`HISTORICAL_CURRENT_SEPARATION = PARTIAL`: architecture موجودة، لكن Loose Pearl profile flow غير مكتمل وغير مثبت.

## 11. Sales / Asset.price

السلطة المجمدة هي `Asset.price`. توجد خدمة Sale Pricing وتضم `LOOSE_PEARL` في التصنيف العام، لكن POS لديه fallback صريح لـ`PEARL_JEWELLERY` وليس Loose Pearl. لا يوجد Loose Pearl Asset حاليًا لإثبات السعر أو minimum/discount behavior.

`LOOSE_PEARL_POS_SUPPORT = IMPLEMENTATION_GAP`.

## 12. Tax

Tax architecture موجود: UAE Tax Engine → Company Tax Policy → Transaction Tax Context → immutable snapshot → Accounting. القراءة الحالية من `darfus_erp`:

- `vatRate = 14`
- `defaultTaxTreatment = STANDARD_VAT`
- Enabled: `STANDARD_VAT`, `EXEMPT`, `REVERSE_CHARGE`, `OUT_OF_SCOPE`
- `preciousGoodsRcmEnabled = true`

الـ14% إعداد حالي وليس قاعدة hardcoded. لا توجد mutation ولا Preview POST. `VAT_APPLICATION_ON_PURCHASE_EXPECTED = 1`; إثبات Loose Pearl runtime مؤجل بعد حسم سلطتي group/Supplier.

## 13. Accounting

المسار الحالي يربط Supplier Receive بإنشاء PO وtax snapshot وpayable/journal داخل transaction؛ expected standard VAT shape هو Inventory/Asset debit pre-tax + Recoverable VAT debit + AP credit inclusive، مع Debit=Credit. لم يتم إنشاء Journal أو تعديل Accounting في هذا Control.

## 14. Supplier Receive V2

`POST /api/v1/purchase-orders/receive` هو المسار canonical. `supplier-receive-contract.service.js` يفرض taxTreatment صريحًا، branch server authority، locationId active داخل branch، ويرفض free-text location. `inventory-v2-runtime.service.js` يفرض `perPiece.length === document quantity` ويمنع quantity fields داخل piece.

Loose Pearl موجود في `PROFILE_REGISTRY` و`normalizeReceiptPiece` و`loose-profile-finance`، لكن لا يوجد specialized `/inventory-v2/loose-pearl/contract` أو `/preview` ولا UI يجهز payload. النتيجة: `LOOSE_PEARL_SUPPLIER_RECEIVE_V2 = PARTIAL`.

## 15. Barcode / RFID

الـDB لديه code `PL`، لكن `barcode-identity.service.js` يفرض `DD/LOS/00` للـLoose Diamond و`GS/LOS/00` للـLoose Gemstone فقط. لا يوجد enforcement مماثل لـ`LOOSE_PEARL`، و`LOS` ليس item code مفروضًا لهذا profile. الحالي توجد sequence `PL/RNG/18` لـPearl Jewellery، ولا توجد `PL/LOS/00` sequence.

`LOOSE_PEARL_BARCODE_MAPPING = IMPLEMENTATION_GAP`، وليس سببًا لإنشاء barcode الآن. RFID tables/services موجودة، لكن لا يوجد Loose Pearl proof.

## 16. Status / Branch / Location

Runtime status authority يدعم الحالات الثمانية المطلوبة، وAll Items يعرض Asset-only rows. Branch server-authoritative. Location في Supplier V2 يجب أن تكون `locationId` من `inventory_locations` داخل company/branch، ولا يسمح النص الحر. هذا اختلاف صياغة لا تعارض أعمال: أمثلة العميل مثل Main Safe/Workshop تُعامل كأسماء Master Data لا كنص حر لكل transaction.

حالة DB: 2 location rows، واحدة active في branch الحالي. لا يوجد Loose Pearl Asset.

## 17. Certificates / Images

`asset_certificates` و`asset_attachments` موجودان. Certificate master الحالي 16 active مقابل 14 في القائمة العميلية؛ يلزم reconciliation قبل provisioning، وليس قرارًا في هذا Control. Attachment count حاليًا 0، ولا يوجد Loose Pearl UI يحقق multiple named images.

## 18. Audit

Asset Events، barcode history، tag print، RFID assignment، وhistory queries موجودة. DB counts: `asset_events=16`, `asset_barcode_history=13`, `asset_rfid_assignments=2`. لا يوجد Loose Pearl acceptance لإثبات كل events المطلوبة، خصوصًا group/partial lineage.

## 19. Manufacturing / Asset Lineage

`asset_lineage_links` موجود وcountه 0. وجود الجدول ليس proof لتشغيل Loose Pearl في Workshop. هذه `FUTURE_LIFECYCLE_DEPENDENCY`؛ لا يجب أن تتحول إلى Implementation في هذا الـControl، لكنها يجب أن تدخل عقد التنفيذ بعد حسم group semantics.

## 20. Partial Quantity / Group Operations

لا يوجد نموذج مثبت لبيع جزء من المجموعة أو استهلاك جزء منها في التصنيع أو نقل جزء أو توزيع cost/weight أو إصدار barcode بعد split. هذا سبب إضافي لقرار `LP-OD-001` وليس permission لإضافة split logic.

## 21. Current Frontend Reality

- `app/[locale]/(dashboard)/inventory/pearl/page.tsx` موجود ويعرض **Pearl Jewellery** مع Gold Information وKarat وMaking/Gold rates؛ لا يجوز استخدامه كـLoose Pearl screen.
- لا يوجد `app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx`.
- `components/inventory/inventory-intake-chooser.tsx` يحتوي `PEARL` فقط ويربطه بـ`/inventory/pearl`؛ `LOOSE_PEARL` غير موجود.
- `/en/inventory/loose-pearl` و`/ar/inventory/loose-pearl` عُرضا في Browser read-only، وانتهيا إلى shell مع `An error occurred / حدث خطأ في العملية` بدل شاشة Loose Pearl. الـlogs أثبتت محاولة قراءة asset id `loose-pearl` و404؛ لم يحدث POST.
- `/en/inventory/pearl` عرض شاشة Pearl Jewellery الصحيحة مع Supplier/Location/Tax Summary وأقسام Gold/Pearl Jewellery، وليس Loose Pearl.

## 22. Current Backend Reality

الموجود: generic profile registry، loose finance، V2 normalizer، Asset components/details، Pearl Size resolution، All Items read route، Supplier Receive V2. المفقود: dedicated Loose Pearl contract/preview route، frontend builder، specialized master-data binding، browser acceptance path، readback proof profile-specific.

## 23. Current DB / Schema Reality

| Entity | Count |
|---|---:|
| purchase_orders | 13 |
| purchase_order_items | 13 |
| assets | 13 |
| PEARL_JEWELLERY assets | 1 |
| LOOSE_PEARL assets | 0 |
| asset_components | 10 |
| asset_pearl_component_details | 1 |
| asset_origins | 13 |
| asset_purchase_cost_revisions | 13 |
| asset_current_valuations | 13 |
| inventory_asset_movements | 13 |
| asset_barcode_history | 13 |
| asset_rfid_assignments | 2 |
| journal_entries | 16 |
| journal_lines | 45 |
| idempotency_requests | 17 |
| cash_transactions | 3 |
| suppliers | 2 |
| inventory_locations | 2 |

Current DB is confirmed `darfus_erp`. No writes were run. `MIGRATION_NEEDED = UNPROVEN_DESIGN_ONLY`; schema proof must precede any migration. The existing schema can represent one Pearl detail on one Asset, but not the unresolved grouped/partial contract.

## 24. POS Readiness

`GET /api/v1/pos/search` reads both Product and Asset candidates. Final serialized inventory authority must be Asset-only, but current source does not prove a Loose Pearl-specific exclusion of Product rows or a Loose Pearl-specific price fallback. With no Loose Pearl Asset, runtime selectability cannot be proven.

`LOOSE_PEARL_POS_SUPPORT = NOT_READY_FOR_ACCEPTANCE`.

## 25. Idempotency / Acceptance Channel

Canonical receive uses `purchase.receive` scope and `idempotencyService.hashRequest()` and claims only after supplier/branch/location validation. The Pearl Jewellery debug/replay helper is profile-specific and must not be generalized blindly. No Receive, replay, conflict POST, or mutation was run. Future acceptance must retain the exact request/key/hash input before any controlled mutation.

## 26. Shared All Items / Readback

All Items is Asset-only and supports branch/profile/status/location/supplier/search filters, barcode/RFID identity and Asset Details. The shared read path is structurally reusable, but no Loose Pearl row exists and no AR/EN Loose Pearl readback can be proven. Current Pearl Jewellery row `PLRNG18000001` is evidence for Pearl Jewellery only.

## 27. Documentation Copy Artifacts

The Loose Pearl material includes copy/paste traces such as `Delete Diamond`/`Add Diamond`, Section 9 wording inside an eight-section contract, and Pearl Jewellery terminology. These are classified as documentation artifacts or non-applicable shared wording; they do not authorize Diamond fields, a ninth screen section, Gold fields, or new workflows.

## 28. Full Authority Matrix

The complete machine-readable matrix is in:
[03-authority-matrix.json](../backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-PREIMPLEMENTATION-AUTHORITY-AUDIT/03-authority-matrix.json)

Core classifications:

| Area | Classification | Severity |
|---|---|---:|
| Standalone screen/route | IMPLEMENTATION_GAP | P1 |
| Group quantity/cardinality | AUTHORITY_CONFLICT | P1 |
| Supplier optionality | AUTHORITY_CONFLICT | P1 |
| Pearl Size | IMPLEMENTED | P2 |
| Pearl master lists | PARTIAL / data drift | P2 |
| Historical/current separation | PARTIAL | P1 |
| Tax engine | DESIGN READY, runtime unproven | P1 |
| Barcode PL/LOS/00 | IMPLEMENTATION_GAP | P1 |
| Status/branch/location | AUTHORITY_NORMALIZATION / mostly present | P2 |
| POS / Asset-only Loose Pearl proof | IMPLEMENTATION_GAP | P1 |
| Lineage/partial operations | FUTURE_LIFECYCLE_DEPENDENCY | P2 |

## 29. Implementation Gaps

1. No Loose Pearl frontend route/form.
2. No Loose Pearl chooser entry.
3. No dedicated Loose Pearl contract/preview endpoint.
4. No profile-specific Supplier V2 builder/readiness proof.
5. No proof for group quantity/partial operations.
6. No enforced `PL/LOS/00` barcode mapping.
7. No Loose Pearl POS price/fallback proof.
8. No AR/EN Asset Details proof for Loose Pearl.
9. No multiple named image flow for Loose Pearl.

## 30. Authority Normalizations

- Location examples are normalized to branch-scoped DB Master Data; free-text transaction Location is not accepted.
- Pearl Size IDs remain internal; user sees `<value> mm`.
- Pearl Jewellery rules are not imported into Loose Pearl; the current `/inventory/pearl` route is explicitly excluded from Loose Pearl authority.
- Tax rate remains dynamic from Company Tax Policy; current 14% is not hardcoded.

## 31. Authority Conflicts

### LP-OD-001 — Group Asset vs one physical piece per Asset

- **Reference says:** one Loose Pearl record may be one pearl or a homogeneous group with Quantity.
- **Frozen system says:** one physical piece = one Asset; quantity-based inventory is forbidden.
- **Current source/DB:** no `assets.quantity`; primary component count >1 is rejected; no split semantics.
- **Option A:** normalize to one physical Pearl per Asset and handle grouping only as a future reporting/aggregation concept.
- **Option B:** approve a Group Asset authority and define quantity, barcode, split, cost, weight, valuation, sale, transfer, return, manufacturing and lineage semantics.
- **Recommendation:** Owner decision required; no implementation.

### LP-OD-002 — Optional Supplier vs Supplier Receive V2 required Supplier

- **Reference says:** Supplier Name optional/manual and unknown supplier may be absent.
- **Frozen receive says:** purchased stock enters Supplier Receive V2; current route requires canonical `supplierId`.
- **Current source/DB:** 2 suppliers exist; receive rejects missing supplier before PO/Asset/Payable.
- **Option A:** require Supplier for purchased stock and define optionality only for a separate approved non-purchase intake.
- **Option B:** approve a separate non-supplier acquisition path with explicit accounting/source authority.
- **Recommendation:** Owner decision required; never create a fake supplier.

## 32. Future Lifecycle Dependencies

Manufacturing use, Asset Lineage, partial consumption, split barcode identity, partial return, and cost/weight allocation are future lifecycle dependencies. They are not implemented or tested here. The current `asset_lineage_links` table is present but empty.

## 33. True Owner Decisions

`TRUE_OWNER_DECISIONS_REMAINING = 2`. See `17-owner-decisions.json`; no implementation gap was incorrectly converted into an Owner question.

## 34. Migration Need

`MIGRATION_NEEDED = UNPROVEN_DESIGN_ONLY`. A migration is not authorized or justified by this audit. First resolve the two authority conflicts, then prove whether existing Asset/component tables can represent the approved contract.

## 35. Risk / Regression Matrix

| Risk | Severity | Impact | Gate |
|---|---:|---|---|
| Group record treated as one Asset without split authority | P1 | wrong stock count, sale/consume/transfer/lineage and cost basis | Blocked |
| Optional Supplier forced through Supplier V2 | P1 | invalid source/payable or fake supplier pressure | Blocked |
| Missing Loose Pearl UI/route | P1 | client cannot enter profile through canonical workflow | Blocked |
| Barcode fallback not PL/LOS/00 | P1 | wrong primary identity format | Fix after authority freeze |
| POS Product fallback not proven for Loose Pearl | P1 | quantity-based physical stock risk | Fix/test before acceptance |
| Certificate master extras | P2 | selector drift vs client list | Reconcile before provisioning |
| Current valuation/Tax runtime unproven | P1 | financial acceptance risk | Future controlled proof |
| Dirty worktree | P2 | source authority cannot be inferred from HEAD alone | Preserve and re-baseline |

## 36. Lessons Applied

Applied LL-001 exact evidence, LL-002 auth freshness, LL-003 taxable base, LL-004 historical/current separation, LL-005 POS fallback, LL-006 barcode fallback, LL-007 dirty worktree, LL-008 schema proof before migration, LL-009 environment failure vs business change, LL-010 no repeated live Receive, LL-011 auth preflight, LL-012 internal IDs hidden, LL-013 click/dispatch distinction, LL-014 diagnostics/interception independence, LL-015 post-success channel pre-proof, LL-016 invalid pricing must not zero Asset.price, and LL-017 accepted product state replacing stale tests.

No new lesson was required; the grouped-record conflict is an explicit authority conflict already required by this Control.

## 37. Draft Normalized Implementation Contract

This is a draft only and is not frozen:

- Asset cardinality: unresolved between one physical Pearl per Asset and approved group Asset.
- Group quantity: client-defined combined count; partial operations unresolved.
- Total weight: combined group weight; no multiplication by Quantity; unit mapping needs explicit reconciliation with current CT/GRAM source behavior.
- Historical Pearl Cost: combined pre-tax cost; VAT once; immutable historical snapshot.
- Current Pearl Value: separate current valuation and VAT snapshot.
- Supplier: unresolved optionality; canonical Supplier.id for Supplier V2 unless Owner approves non-purchase path.
- Receive: one Inventory → Add/Receive → Loose Pearl → Supplier Receive V2 path.
- Tax: dynamic Company Tax Policy and enabled treatment only; no hardcoded rate.
- Selling price: Asset.price authority plus approved sale policy.
- Barcode: client-required `PLLOS00XXXXXX`, enforcement pending.
- RFID: optional supplementary unique identity.
- Status: V2 transition authority.
- Branch: server authoritative.
- Location: active branch-scoped DB master ID only.
- Master data: profile registry/DB master; internal IDs hidden.
- Certificates/images: optional client-defined fields with audit and duplicate/history controls.
- Audit: Asset event/history with actor, branch, device, old/new, time, reason.
- Lineage/partial quantity: future dependencies, unresolved for grouped records.
- POS: Asset-only final-profile result, status/branch/price checks.
- Idempotency: canonical receive hash/key, exact request retention before future mutation.
- AR/EN: future browser/readback proof required.

## 38. P0 / P1 / P2

- `P0_COUNT = 0`: no data mutation, security breach, or financial corruption was introduced or observed by this audit.
- `P1_COUNT = 8`: two authority conflicts plus missing route/contract/barcode/POS/readback/financial-proof blockers.
- `P2_COUNT = 6`: master-data drift, attachment/audit/readback completeness, and future lifecycle dependencies.

## 39. Gate

```text
GATE = BLOCKED_LOOSE_PEARL_TRUE_OWNER_DECISION_REQUIRED
CLIENT_AUTHORITY = READ_AND_NORMALIZED
TRUE_OWNER_DECISIONS_REMAINING = 2
IMPLEMENTATION_GAPS = 9
MIGRATION_NEEDED = UNPROVEN_DESIGN_ONLY
OFFICIAL_DB_BUSINESS_DELTA = 0
NEXT_RECOMMENDED_STEP = OWNER_RESOLUTION_OF_EXACT_LISTED_CONFLICTS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 40. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-PREIMPLEMENTATION-AUTHORITY-AUDIT
MODE = READ_ONLY_PREIMPLEMENTATION_AUTHORITY_AUDIT
LOCAL_MAIN_DB = darfus_erp
CLIENT_AUTHORITY_FILE = Pearl(5).docx
CLIENT_AUTHORITY_SIZE_BYTES = 68946
CLIENT_AUTHORITY_SHA256 = 2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E
CLIENT_DOCUMENT_PAGES = 77 logical / 74 rendered
LOOSE_PEARL_AUTHORITY_READ = YES
LOOSE_PEARL_SECTIONS = 8
LOOSE_PEARL_STANDALONE_INVENTORY = YES
LOOSE_PEARL_HAS_GOLD = NO
LOOSE_PEARL_HAS_MAKING = NO
CLIENT_ONE_RECORD_CAN_REPRESENT_GROUP = YES
LOOSE_PEARL_ASSET_GROUPING_AUTHORITY = AUTHORITY_CONFLICT
GROUP_QUANTITY_SEMANTICS = HOMOGENEOUS_GROUP_COUNT; PARTIAL_OPERATIONS_UNRESOLVED
TOTAL_WEIGHT_SEMANTICS = COMBINED_GROUP_WEIGHT
HISTORICAL_PEARL_COST_SEMANTICS = COMBINED_GROUP_COST
SUPPLIER_CLIENT_REQUIRED = NO
SUPPLIER_OPTIONALITY_CONTRACT = AUTHORITY_CONFLICT
PEARL_SIZE_MASTER = READY_39_ACTIVE_1_TO_20_STEP_0_5
PEARL_MASTER_DATA_READINESS = PARTIAL_CERTIFICATE_COUNT_DRIFT
HISTORICAL_CURRENT_SEPARATION = PARTIAL
CURRENT_PEARL_VALUE_AUTHORITY = asset_current_valuations / loose current-value calculation
LOOSE_PEARL_SUPPLIER_RECEIVE_V2 = PARTIAL
LOOSE_PEARL_BARCODE_MAPPING = IMPLEMENTATION_GAP
EXPECTED_LOOSE_PEARL_BARCODE_SHAPE = PLLOS00XXXXXX
LOOSE_PEARL_POS_SUPPORT = NOT_READY_FOR_ACCEPTANCE
ASSET_LINEAGE_READINESS = FUTURE_DEPENDENCY_UNPROVEN
GROUPED_LOOSE_PEARL_PARTIAL_OPERATION_MODEL = AUTHORITY_CONFLICT / NOT_DEFINED
DOCUMENTATION_COPY_ARTIFACT_COUNT = 3
IMPLEMENTED_REQUIREMENTS = 7 major authorities / source foundations
IMPLEMENTATION_GAPS = 9
AUTHORITY_NORMALIZATIONS = 4
AUTHORITY_CONFLICTS = 2
FUTURE_LIFECYCLE_DEPENDENCIES = 1 major dependency
TRUE_OWNER_DECISIONS_REMAINING = 2
MIGRATION_NEEDED = UNPROVEN_DESIGN_ONLY
SOURCE_CHANGES = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
MASTER_DATA_MUTATIONS = 0
BUSINESS_WRITES = 0
BUSINESS_POST_COUNT = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
P0_COUNT = 0
P1_COUNT = 8
P2_COUNT = 6
GATE = BLOCKED_LOOSE_PEARL_TRUE_OWNER_DECISION_REQUIRED
LOOSE_PEARL_MODULE_STATUS = PREIMPLEMENTATION_AUDIT_ONLY
NEXT_RECOMMENDED_STEP = OWNER_RESOLUTION_OF_EXACT_LISTED_CONFLICTS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 41. STOP

لا Implementation، لا Migration، لا Receive، لا Confirm، لا Master mutation، ولا Batch تالٍ تلقائيًا. التقرير والأدلة جاهزة لمراجعة Owner وحسم القرارين المحددين فقط.
