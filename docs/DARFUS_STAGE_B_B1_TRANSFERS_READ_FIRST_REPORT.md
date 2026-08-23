# DARFUS ERP — Stage B / B1 Transfers Read-First Audit Report

**Control:** DARFUS-STAGE-B-B1-TRANSFERS-READ-FIRST-AUDIT

**التنفيذ:** Read-Only Audit فقط. لم يتم إنشاء Transfer، ولم يتم Confirm أو Cancel أو Receive، ولم يتم تعديل الكود أو قاعدة البيانات أو الـmigration أو الـconfig.

## 1. Executive Summary

تمت قراءة مصادر السلطة الحالية، handoff/continuity، مصدر Transfer في الواجهة والـBackend، نموذج قاعدة البيانات، migration الخاصة بـtransfer_items، طبقة Asset lifecycle، صلاحيات المسار، واختبارات/أدوات التحقق المرتبطة.

النتيجة:

- يوجد سطح Transfer مباشر واحد في المصدر: /inventory/transfers، ويستخدم endpoints مخصصة في /transfers و/transfers/:id.
- الـUI غير ظاهر في الـSidebar؛ الوصول الحالي يعتمد على direct route.
- الـBackend يملك transaction وrow-lock وAsset status transition، لكنه لا يثبت branch scope التشغيلي للطلب ولا destination location.
- لا توجد طبقة HTTP idempotency أو request hash لـTransfer. مفاتيح Asset Event الداخلية ليست بديلًا عن idempotency للطلب.
- lifecycle الفعلي لا يطابق lifecycle المتوقع في الواجهة/model بالكامل: طلب approved يحفظ in-transit، وreceived يمكن أن يبدأ مباشرة من pending.
- قيد الـDB الخاص بمنع أكثر من Transfer نشط يستخدم statuses قديمة (REQUESTED/APPROVED/DISPATCHED) بينما الـroute يكتب (PENDING/IN_TRANSIT/RECEIVED/CANCELLED)، ولذلك لا يحمي الحالات النشطة الحالية.
- قاعدة darfus_erp الحالية لا تحتوي Transfers: transfers=0, transfer_items=0, وحركات/أحداث Transfer=0. لذلك لا يوجد فساد بيانات Transfer قائم يمكن إثباته، لكن فجوات المصدر قائمة.

**الحكم:** اكتمال الـRead-First forensic audit مثبت، لكن Transfer غير جاهز لبدء B1 implementation أو runtime acceptance. يلزم Owner decision/approval على نقاط lifecycle، location، scope، idempotency، والـaccounting policy قبل التنفيذ.

## 2. Audit Scope and Safety

نطاق القراءة شمل:

- AGENTS.md, README.md, PROJECT_PROGRESS_HANDOFF.md.
- docs/DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md.
- Transfer page، Sidebar، data hooks، types، local fallback.
- Transfer routes، generic CRUD/controller، permission baseline، model/associations.
- inventory-v2-runtime.service.js.
- migrations 20260804040000-inventory-movement-transfer-workshop-audit-normalization.js و20260804050000-inventory-compatibility-backfill-support-indexes.js.
- transfer references في tests/e2e/helpers/scripts.
- read-only PostgreSQL schema, constraints, indexes, counts, and current service status.

ما لم يحدث:

- لا POST /transfers ولا PATCH /transfers/:id.
- لا INSERT/UPDATE/DELETE/TRUNCATE/seed/backfill/migration.
- لا restart/deployment/build.
- لا تغيير source أو permissions أو config.

## 3. Authority and Continuity Inputs

السلطة المجمدة ذات الصلة:

| Authority | Current rule | Transfer implication |
|---|---|---|
| Physical identity | ONE_PHYSICAL_PIECE = ONE_ASSET | النقل يحرّك Asset موجودًا، ولا ينشئ Product quantity |
| Physical stock | Asset is authority; Product.quantity is not serialized authority | assetIds يجب أن تكون المصدر الفيزيائي الوحيد |
| Location | DB master, branch-aware, no free text | destination/source location يجب أن يكونا IDs صالحين ومقيدين بالفرع |
| Status | PENDING_TRANSFER هو status التشغيلي المجمد | route يجب أن يطابقه ولا يخترع transferred كحالة تشغيلية |
| Branch/company | server-authoritative and fail-closed | لا يكفي اعتماد branch IDs من payload دون scope server check |
| Barcode/RFID | identity preserved; no replacement by transfer | النقل لا يغير barcode/RFID |
| Cost/valuation | historical cost immutable; current valuation separate | النقل الحالي لا يجب أن يعيد تقييم الأصل تلقائيًا |
| Workflow | one canonical workflow per business action | dedicated transfer path هو المسار الوحيد للتنفيذ |

لم يُعثر على Problem Prevention Register مستقل باسم مطابق في ملفات المشروع. تم استخدام AGENTS والـOwner Freeze باعتبارهما القيود السارية، مع اعتبار handoff التاريخي سياقًا لا runtime proof.

## 4. Current Transfer Surfaces

| Surface | Current evidence | Authority status |
|---|---|---|
| UI direct route | app/[locale]/(dashboard)/inventory/transfers/page.tsx | existing transfer UI |
| Sidebar | components/layout/sidebar.tsx لا يحتوي /inventory/transfers | not discoverable through normal navigation |
| Read API | generic GET /transfers, GET /transfers/:id | company-only in current generic controller |
| Create API | dedicated POST /transfers | canonical current mutation entry point |
| Lifecycle API | dedicated PATCH /transfers/:id | canonical current lifecycle entry point, but state rules are inconsistent |
| Generic mutation routes | generated routes are blocked by GENERIC_TRANSFER_MUTATION_FORBIDDEN | blocked adapter, not a second mutation authority |
| Local/demo fallback | contexts/erp-context.tsx + local-impl.ts | non-authoritative compatibility path; not equivalent to API behavior |
| Dashboard/test references | runtime/e2e route lists and dashboard transfer data | references, not separate mutation workflows |

## 5. UI Entry Points and Current UX

الـUI الحالي يعرض:

- اختيار الفرع المستهدف من فروع الشركة باستثناء الفرع الحالي.
- اختيار Assets متاحة من الفرع الحالي عبر checkbox.
- Shipping notes.
- جدول Transfers يعرض ID، branches، status، dates، وactions.
- actions: pending → Approve، approved → Ship، in-transit → Receive، pending → Cancel.

فجوات UI المثبتة:

- لا source location selector.
- لا destination location selector.
- لا عرض واضح لفرع/موقع الأصل من DB location authority.
- لا idempotency key lifecycle أو retry safety indicator.
- لا permission-specific rendering لمسارات الإنشاء/التحديث.
- الصفحة direct route وليست مدخلة من Sidebar.

## 6. Backend Endpoint Map

| Method | Endpoint | Auth/permission | Current behavior | Main risk |
|---|---|---|---|---|
| GET | /transfers | authMiddleware؛ guardFor has no transfer permission mapping | generic company filter; no branch filter because Transfer has no branchId model attribute | cross-branch same-company visibility |
| GET | /transfers/:id | authenticated generic guard | same company lookup; no branch scope | cross-branch detail access |
| POST | /transfers | inventory.adjust | validates branches/assets/status, creates header/items, moves Assets to PENDING_TRANSFER | no HTTP idempotency; incomplete location/scope |
| PATCH | /transfers/:id | inventory.adjust | lifecycle actions plus unrestricted fallback update | arbitrary field mutation and lifecycle ambiguity |
| generic POST/PUT/PATCH | /transfers* | auth then stable forbidden | blocked by GENERIC_TRANSFER_MUTATION_FORBIDDEN | permission is not applied before the generic block |

### POST current payload

    {
      "assetIds": ["..."],
      "fromBranchId": "...",
      "toBranchId": "...",
      "notes": "..."
    }

لا توجد fromLocationId, toLocationId, request idempotency key، أو request fingerprint في العقد الحالي.

### PATCH current payload

    { "status": "in-transit | received | cancelled | ..." }

في status غير المعروفة يدخل المسار العام transfer.update(req.body)، وهو ليس allowlist lifecycle-safe.

## 7. Model and Database Map

### Transfer header

backend/src/models/transfer.model.js يعرّف جدول transfers بالحقول:

- id, companyId, assetIds JSONB.
- fromBranch, toBranch, fromBranchId, toBranchId.
- requested/approved/received actor and timestamps.
- enum status: pending, approved, in-transit, received, cancelled.
- notes, cancelReason, timestamps.

لا توجد location fields، dispatch header audit fields، reject fields، أو idempotency/request hash fields.

### Transfer items

Migration 20260804040000... أنشأت transfer_items مع:

- transfer_id, asset_id, company_id.
- from_branch_id, to_branch_id.
- from_location_id, to_location_id nullable.
- status, dispatch/receive actor/timestamps.

لا يوجد Sequelize TransferItem model/association في models/index.js؛ route يكتب table عبر raw SQL.

### Constraints and indexes

- FK إلى transfers/assets/companies/branches/locations موجودة.
- unique (transfer_id, asset_id) موجود.
- unique active index الحالي predicate هو REQUESTED, APPROVED, DISPATCHED.
- statuses التي يكتبها route هي PENDING, IN_TRANSIT, RECEIVED, CANCELLED.

## 8. State Machine Reality

### Model enum

pending → approved → in-transit → received، مع cancelled.

### UI expectation

الواجهة تعرض approve منفصلًا، ثم ship، ثم receive.

### Route behavior

- status=in-transit أو status=approved يتطلب header pending، ثم يحفظ header كـin-transit؛ لا يبقى approved كحالة persisted.
- status=received مسموح من pending أو approved أو in-transit؛ إذن يمكن تجاوز dispatch.
- status=cancelled يعيد Asset من PENDING_TRANSFER إلى AVAILABLE.
- status غير المذكور يسلك transfer.update(req.body) دون allowlist صريح.

**Conclusion:** lifecycle المطلوب من UI ليس lifecycle الذي يثبته backend؛ transition authority غير موحدة.

## 9. Asset / Barcode / RFID Behavior

### Create

لكل Asset مختار:

- inventoryV2.transitionAsset ينقل AVAILABLE → PENDING_TRANSFER.
- يتم إنشاء AssetEvent وinventory movement من نوع TRANSFER_REQUEST.
- لا يتم إنشاء Asset جديد، Product quantity، barcode، أو RFID.

### Dispatch

- يتم تسجيل TRANSFER_OUT وmovement TRANSFER_OUT.
- status قبل/بعد event كلاهما PENDING_TRANSFER في route.
- transfer item يصبح IN_TRANSIT.

### Receive

- Asset يصبح AVAILABLE.
- branchId يتغير إلى toBranchId عبر transitionAsset.
- route يحدّث legacy asset.branch إلى اسم الفرع.
- لا يمرر toLocationId؛ لذلك locationId يحتفظ بالقيمة السابقة.
- لا barcode/RFID mutation.

### Cancel

- Asset يعود PENDING_TRANSFER → AVAILABLE.
- لا branch/location movement.

الحفاظ على identity مثبت source-level، لكن destination location غير مثبت.

## 10. Branch / Company / Location Scope

### Company

POST/PATCH يستخدمان req.companyId في branch lookup وAsset lookup وTransfer lookup. هذا يثبت company filter للمسار الحالي.

### Branch

- POST لا يثبت أن fromBranchId يساوي branch context للمستخدم، ولا يطلب explicit cross-branch authority.
- PATCH يحمّل Transfer بالـcompany فقط، دون branch scope.
- generic controller لا يطبق branch scope على Transfer لأن Transfer.rawAttributes.branchId غير موجود.
- GET list/detail لذلك company-only في الواقع، رغم أن e2e helper يصف transfers بأنها BRANCH_REQUIRED.

### Location

- UI لا يرسل locations.
- POST لا يتحقق من source/destination location.
- raw insert يترك location columns NULL.
- receive يترك Asset على location السابقة.

**Classification:** branch and location authority are not fully enforced for Transfer.

## 11. Permission and RBAC Map

| Operation | Current guard | Evidence | Assessment |
|---|---|---|---|
| Read list/detail | authenticated generic route | no transfers entry in CRUD_PERMISSIONS | too broad; no transfer-specific/branch read permission |
| Create | inventory.adjust | dedicated POST | one broad mutation permission |
| Approve/dispatch/receive/cancel | inventory.adjust | dedicated PATCH | no lifecycle separation |
| Bypass unavailable status | isAdmin or raw string transfers.bypassStatus | route source | bypass is not in permission catalog/baseline |
| Generic mutation | stable forbidden after auth/guard | lifecycle block | no alternate mutation authority, but guard order is weak |

No evidence of permission weakening in the frozen inventory Asset authority, but transfer-specific least privilege is not proven.

## 12. Movement and Event Effects

inventory-v2-runtime.service.js provides row lock, allowed status transitions, AssetEvent creation, and inventory_asset_movements insert. Current transfer source/event mapping:

| Action | Asset transition | Event | Movement | Financial effect |
|---|---|---|---|---|
| request | AVAILABLE → PENDING_TRANSFER | TRANSFER_REQUEST | TRANSFER_REQUEST | none in route |
| dispatch | PENDING_TRANSFER → PENDING_TRANSFER | TRANSFER_OUT | TRANSFER_OUT | none in route |
| receive | PENDING_TRANSFER → AVAILABLE | TRANSFER_IN | TRANSFER_IN | none in route |
| cancel | PENDING_TRANSFER → AVAILABLE | TRANSFER_CANCELLED | TRANSFER_CANCEL | none in route |

There is no transfer-specific journal, payable, tax, PO, purchase-cost, or valuation mutation in the current route. This is a source observation, not a separate Owner-approved accounting policy.

## 13. Concurrency and Idempotency

### Existing protections

- DB transaction around each dedicated route.
- row lock on selected Assets/Transfer lifecycle lookup.
- Asset status validation.
- deterministic Asset Event idempotencyKey strings for action/transfer/asset.
- (transfer_id, asset_id) uniqueness.

### Missing protections

- no HTTP Idempotency-Key contract.
- no persisted request hash/result for Transfer mutation.
- no same-key/same-payload replay contract.
- no same-key/changed-payload conflict contract.
- deterministic event key is not proven to be unique-enforced/deduplicating at route level.
- active unique index does not cover actual active statuses.
- admin/status bypass can defeat ordinary status protection under concurrent requests.

**Conclusion:** retry/concurrency safety is not proven and should be treated as a P1 implementation gap before live transfer acceptance.

## 14. Accounting / Cost / Valuation

Current implementation does not post accounting for an intra-company Asset transfer and does not update:

- purchase cost revisions;
- current valuations;
- supplier payable;
- VAT/tax;
- invoices/payments/journals.

The source does preserve Asset identity and does not explicitly change cost/valuation. However, the policy “transfer is non-financial” is not separately encoded in a transfer authority document or dedicated test. This is an Owner policy confirmation item, not evidence to invent accounting behavior.

## 15. Barcode / RFID / Audit Trail

- Barcode is carried by the Asset and is not regenerated/replaced.
- RFID is not touched by the transfer route.
- AssetEvents and movements include actor/source/event links.
- Transfer header lacks a request/correlation/idempotency key.
- Header lacks explicit dispatch actor/timestamp and rejection actor/timestamp/reason.
- Item table has dispatch/receive actor/timestamps, but the route does not populate location fields.

Result: physical identity preservation is structurally plausible; complete transfer audit reconstruction is incomplete.

## 16. Database Forensic Snapshot — Official DB

Read-only connection evidence:

| Check | Actual |
|---|---:|
| current_database() | darfus_erp |
| SequelizeMeta count | 88 |
| Companies | 1 |
| Branches | 1 |
| Inventory locations | 2 |
| Assets | 14 |
| Transfers | 0 |
| Transfer items | 0 |
| Transfer-source movements | 0 |
| Transfer-source Asset events | 0 |
| Transfer-scoped idempotency rows | 0 |

Current service observation: darfus-backend is Up on port 8000; darfus-postgres is healthy on host port 5433; darfus-redis is healthy on port 6379. No restart was performed.

## 17. Database Integrity Checks

Because the Transfer tables are empty, all current-row checks returned zero:

| Check | Count | State |
|---|---:|---|
| orphan transfer item → transfer | 0 | no current data defect |
| orphan transfer item → Asset | 0 | no current data defect |
| item company ≠ Asset company | 0 | no current data defect |
| invalid from branch FK target | 0 | no current data defect |
| invalid to branch FK target | 0 | no current data defect |
| invalid from location FK target | 0 | no current data defect |
| invalid to location FK target | 0 | no current data defect |
| duplicate active Asset transfer item | 0 | vacuous; no rows |
| header asset JSON without item | 0 | vacuous; no rows |
| item not present in header asset JSON | 0 | vacuous; no rows |

This is not runtime proof. It only proves the official DB currently has no Transfer data to reconcile.

## 18. Data State versus Source Defects

| Area | Current DB state | Source state | Classification |
|---|---|---|---|
| Transfer rows | empty | create path exists | NO_ISSUE for current data; readiness gap in source |
| Asset identity | no transfer examples | route uses Asset IDs | architecture aligned, untested runtime |
| Locations | master rows exist | transfer ignores them | IMPLEMENTATION_GAP |
| Branch scope | one branch currently reduces observable exposure | route lacks fail-closed scope | SECURITY_GAP |
| Idempotency | no transfer rows/keys | no request contract | IMPLEMENTATION_GAP |
| Active uniqueness | no rows | predicate stale vs runtime status | DATA_INTEGRITY_GAP |
| Accounting | no transfer postings | route posts none | policy confirmation required |

## 19. Legacy and Duplicate Paths

- Generic CRUD mutation paths are explicitly blocked with GENERIC_TRANSFER_MUTATION_FORBIDDEN.
- The dedicated route is the only current API mutation authority.
- The local/demo repository has a compatibility createTransfer and an asset status mutation to transferred; this does not match frozen operational status PENDING_TRANSFER. It is not authoritative when API mode is active but remains a drift risk if local/demo mode is used.
- No second production Transfer route was found.
- The Sidebar does not expose the existing direct route; this is a discoverability issue, not proof of a second workflow.
- Raw SQL transfer_items writes alongside a Sequelize header with no TransferItem model; this is a duplicated persistence representation, not a separate business route.

## 20. Test and Verification Coverage

Found evidence:

- tests/e2e/single-company-runtime.acceptance.spec.mjs includes /transfers route and expects branch-scoped evidence.
- tests/e2e/helpers/module-runtime-evidence.mjs declares Transfer paths as BRANCH_REQUIRED.
- tests/e2e/helpers/runtime-evidence.mjs normalizes Transfer paths.
- scripts/verify-employee-permission-enforcement.js statically checks inventory.adjust usage.
- scripts/verify-branch-operational-isolation.js has generic guard assertions.
- Asset/status closure tests only constrain status vocabulary; they are not Transfer lifecycle tests.

No dedicated Transfer test was found for:

- create/approve/dispatch/receive/cancel state matrix;
- cross-company/cross-branch denial;
- source/destination location validation;
- duplicate active Asset transfer;
- HTTP idempotency/replay/conflict;
- concurrent mutation;
- generic patch field allowlist;
- barcode/RFID preservation runtime;
- cost/valuation/accounting non-mutation;
- end-to-end Asset movement reconciliation.

The e2e helper expectation BRANCH_REQUIRED conflicts with the current generic controller behavior for a model without branchId; it is test intent, not proof of enforcement.

## 21. Confirmed Findings Register

| ID | Layer | Expected | Actual | Evidence | Impact | Severity | Classification | Confidence |
|---|---|---|---|---|---|---|---|---|
| TRF-001 | API/security | branch-scoped read and mutation, or explicit cross-branch authority | GET is company-only; POST/PATCH do not enforce authenticated branch against source/transfer | erp.controller.js applyBranchReadScope; erp.routes.js dedicated routes; Transfer has no branchId | cross-branch exposure/mutation risk | P1 | SECURITY_GAP | High |
| TRF-002 | API/data | source and destination locations from DB master and branch validated | payload/UI omit locations; receive does not pass toLocationId; item location columns remain null | page.tsx; POST raw insert; receive transitionAsset call | destination location cannot be proven; Asset may retain source location | P1 | INVENTORY_GAP | High |
| TRF-003 | API/reliability | retry-safe transfer mutation with exact replay/conflict semantics | no HTTP idempotency key/hash/result; only event key strings | dedicated POST/PATCH and runtime service | duplicate or ambiguous retry risk | P1 | IMPLEMENTATION_GAP | High |
| TRF-004 | DB/concurrency | active Asset can belong to at most one active transfer | index covers old statuses only; runtime writes different statuses | migration and live index definition | duplicate active transfer possible under race/bypass | P1 | DATA_INTEGRITY_GAP | High |
| TRF-005 | lifecycle | persisted state follows pending→approved→in-transit→received | approved request persists in-transit; receive allowed from pending | PATCH branches in erp.routes.js; model enum/UI | audit/lifecycle state cannot be trusted | P1 | IMPLEMENTATION_GAP | High |
| TRF-006 | API/security | lifecycle fields allowlisted | unknown PATCH falls through to transfer.update(req.body) | PATCH else branch | assetIds/branches/audit fields can diverge from items/movements | P1 | SECURITY_GAP | High |
| TRF-007 | UX | canonical Transfer path discoverable | direct page exists but no Sidebar item | page.tsx; sidebar.tsx | users may not find the workflow | P2 | UI_ONLY_GAP | High |
| TRF-008 | RBAC | least privilege per read/create/approve/dispatch/receive/cancel | generic read auth-only; all lifecycle actions use inventory.adjust; bypass permission is unregistered | CRUD map, routes, permission catalog/baseline | excessive authority and incomplete audit | P1 | SECURITY_GAP | High |
| TRF-009 | audit | complete request/dispatch/reject/cancel evidence | no transfer request key/correlation; no header dispatch/reject fields | model/migration/route | difficult forensic reconstruction | P2 | OBSERVABILITY_GAP | High |
| TRF-010 | tests | lifecycle and safety contracts proven | no dedicated Transfer test suite; generic helper expectations are not enforcement | tests/e2e/scripts search | regressions can pass unnoticed | P2 | ACCEPTANCE_GAP | High |
| TRF-011 | compatibility | demo path preserves frozen status vocabulary | local fallback uses transferred, while canonical status is PENDING_TRANSFER | transfers page + erp context/local repo | mode-dependent behavior drift | P3 | DESIGN_DRIFT | High |
| TRF-012 | schema/architecture | one authoritative item representation | JSONB header plus raw SQL item table without model association | Transfer model, models/index, migration, route | duplicated source of truth risk | P2 | DESIGN_LIMITATION | High |

## 22. Strengths

| Strength | Evidence | Why it matters | Operational impact |
|---|---|---|---|
| Asset authority retained | route accepts assetIds; no Product quantity creation | preserves one-piece identity | aligns with frozen inventory authority |
| Company filter present | POST branch/asset/Transfer lookups use req.companyId | prevents obvious cross-company selection | useful baseline, but not sufficient for branch isolation |
| Transaction boundary exists | POST/PATCH start Sequelize transaction and rollback on error | avoids many partial writes | good foundation for controlled lifecycle |
| Asset row lock/status transition | transitionAsset locks Asset and validates allowed transition | reduces ordinary race errors | supports safe future concurrency hardening |
| Movement/event evidence exists | recordMovement + recordAssetEvent per transition | physical audit trail is structurally present | supports future reconciliation |
| Generic mutations blocked | GENERIC_TRANSFER_MUTATION_FORBIDDEN | prevents broad CRUD bypass | preserves dedicated route authority |
| Current DB has no transfer contamination | all Transfer-related counts zero | no historical Transfer rows need cleanup | safe starting data baseline |

## 23. Weaknesses

| Weakness | Evidence | Impact | Severity | Category |
|---|---|---|---|---|
| branch scope not fail-closed | no branch filter for Transfer model; dedicated routes do not compare request branch context | unauthorized branch access/mutation risk | P1 | Security |
| location not part of contract | nullable schema fields unused; UI/body omit location | wrong physical destination authority | P1 | Inventory |
| no request idempotency | no transfer idempotency persistence/hash | duplicate/ambiguous retry | P1 | Reliability |
| stale active uniqueness predicate | old status values differ from runtime values | concurrency protection ineffective | P1 | Data |
| lifecycle mismatch | approved collapses to in-transit; receive bypass | workflow/audit ambiguity | P1 | Architecture |
| unrestricted PATCH fallback | transfer.update(req.body) | unsynchronized field corruption risk | P1 | Security/Data |
| broad permission | auth-only reads and inventory.adjust for all writes | least privilege not proven | P1 | Security |
| no discoverable menu entry | no Sidebar transfer item | route is hidden from normal users | P2 | UX |
| no dedicated test coverage | only generic/static references | safety claims cannot be accepted | P2 | Observability/Acceptance |
| local/API behavior drift | local transferred vs API PENDING_TRANSFER | environment-specific semantic drift | P3 | Architecture |

## 24. Decision Register — Owner Review Required

| Decision ID | Question | Evidence | Safe decision boundary |
|---|---|---|---|
| DEC-TRF-001 | هل كل transfer cross-branch مسموح أم يحتاج permission منفصل؟ | current source accepts fromBranchId without user branch equality | لا implementation قبل تحديد branch authority |
| DEC-TRF-002 | هل source/destination location مطلوبان في كل transfer؟ | frozen location authority says DB master/branch-aware; current route omits them | لا قبول runtime بدون contract واضح |
| DEC-TRF-003 | هل lifecycle approval حالة persisted مستقلة؟ | model/UI تقول approved؛ route يحفظ in-transit مباشرة | يجب اعتماد state machine واحد |
| DEC-TRF-004 | ما policy المحاسبي؟ | route لا ينشئ journal/cost/VAT changes | يجب توثيق non-financial transfer أو متطلبات القيود قبل acceptance |
| DEC-TRF-005 | ما permission matrix؟ | current single inventory.adjust؛ generic read auth-only | owner/RBAC authority مطلوب قبل hardening |
| DEC-TRF-006 | هل local/demo fallback مطلوب؟ | fallback diverges from frozen status | إما تطابقه أو تصنيفه رسميًا غير تشغيلي |

لا توجد Owner decisions جديدة تم تطبيقها في هذا control.

## 25. Classification Summary

| Classification | Count / state |
|---|---:|
| PRODUCT_DEFECT | 0 proven |
| SECURITY_GAP | confirmed (TRF-001, TRF-006, TRF-008) |
| INVENTORY_GAP | confirmed (TRF-002, TRF-004) |
| IMPLEMENTATION_GAP | confirmed (TRF-003, TRF-005) |
| DATA_INTEGRITY_GAP | confirmed source constraint mismatch (TRF-004) |
| UI_ONLY_GAP | confirmed (TRF-007) |
| OBSERVABILITY_GAP | confirmed (TRF-009) |
| ACCEPTANCE_GAP | confirmed (TRF-010) |
| DESIGN_LIMITATION/DRIFT | confirmed (TRF-011, TRF-012) |
| current DB row corruption | none observed; Transfer tables empty |

## 26. Minimal Future B1 Plan — Not Started

| Group | Objective | Prerequisites | Risk | Suggested order |
|---|---|---|---|---:|
| B1-A | authority/duplicate cleanup | Owner decisions on branch/location/lifecycle and single item authority | schema/source drift | 1 |
| B1-B | core guards/lifecycle | final permission matrix, location contract, allowlisted transitions | incorrect rejection or accidental cross-branch behavior | 2 |
| B1-C | idempotency/concurrency | canonical hash/key contract and approved DB schema strategy if required | duplicate physical moves | 3 |
| B1-D | UI alignment | B1-B contract, discoverability decision, no second workflow | users send incomplete transfer | 4 |
| B1-E | tests/runtime proof | all guards implemented; disposable rehearsal target and owner approval | false acceptance from empty DB | 5 |

هذه خطة design-only. لم يبدأ أي stream.

## 27. Gate

**GATE = PASS_AUDIT_COMPLETE** for the Read-First audit only.

هذا لا يعني أن Transfer جاهز للتشغيل أو أن فجوات B1 مغلقة.

**TRANSFER_RUNTIME_READINESS = NOT_READY_FOR_ACCEPTANCE** بسبب فجوات P1 أعلاه.

**No implementation gate passed.** لا يُسمح ببدء B1-A/B/C/D/E أو أي Transfer runtime proof تلقائيًا.

## 28. Final Tokens

    CURRENT_CONTROL = DARFUS-STAGE-B-B1-TRANSFERS-READ-FIRST-AUDIT
    MODE = READ_ONLY_CURRENT_REALITY_GAP_MAP_DECISION_STOP
    OFFICIAL_DATABASE = darfus_erp
    DATABASE_TARGET_VERIFIED = YES_READ_ONLY
    TRANSFER_SURFACE_COUNT = 1_DEDICATED_API_SURFACE_PLUS_GENERIC_READ_ADAPTERS
    CANONICAL_TRANSFER_CREATE_ENDPOINT = POST /transfers
    CANONICAL_TRANSFER_LIFECYCLE_ENDPOINT = PATCH /transfers/:id
    TRANSFER_UI_ROUTE = /inventory/transfers
    TRANSFER_UI_SIDEBAR_ENTRY = NO
    TRANSFER_MODEL_HAS_LOCATION_FIELDS = NO
    TRANSFER_ITEM_LOCATION_COLUMNS_EXIST = YES_NULLABLE
    TRANSFER_LOCATION_PAYLOAD_SUPPORTED = NO
    TRANSFER_BRANCH_SCOPE = INCOMPLETE
    TRANSFER_COMPANY_SCOPE = PRESENT
    TRANSFER_PERMISSION_MATRIX = INCOMPLETE
    TRANSFER_STATE_MACHINE = INCONSISTENT
    TRANSFER_ASSET_AUTHORITY = ASSET
    TRANSFER_PRODUCT_QUANTITY_AUTHORITY = NO
    TRANSFER_BARCODE_MUTATION = NONE_IN_CURRENT_SOURCE
    TRANSFER_RFID_MUTATION = NONE_IN_CURRENT_SOURCE
    TRANSFER_ACCOUNTING_EFFECT = NONE_IN_CURRENT_ROUTE_POLICY_UNCONFIRMED
    TRANSFER_COST_VALUATION_MUTATION = NONE_IN_CURRENT_ROUTE
    TRANSFER_IDEMPOTENCY = NOT_IMPLEMENTED_FOR_HTTP_MUTATIONS
    TRANSFER_CONCURRENCY_GUARD = INCOMPLETE_STALE_ACTIVE_INDEX
    TRANSFER_CURRENT_DB_ROWS = 0
    TRANSFER_ITEM_CURRENT_DB_ROWS = 0
    TRANSFER_MOVEMENT_CURRENT_DB_ROWS = 0
    TRANSFER_EVENT_CURRENT_DB_ROWS = 0
    TRANSFER_DATA_CORRUPTION_OBSERVED = NO_CURRENT_ROWS
    P0_COUNT = 0
    P1_COUNT = 7
    P2_COUNT = 4
    P3_COUNT = 1
    P4_COUNT = 0
    SOURCE_CHANGE_THIS_CONTROL = NO
    DB_WRITE_THIS_CONTROL = 0
    TRANSFER_MUTATION_THIS_CONTROL = 0
    MIGRATION_CREATED = 0
    MIGRATION_EXECUTED = 0
    REPORT_CREATED = YES_ONLY_ARTIFACT_CHANGE
    NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
    GATE = PASS_AUDIT_COMPLETE
    NEXT_RECOMMENDED_STEP = OWNER_REVIEW_DEC-TRF-001_THROUGH_DEC-TRF-006_THEN_EXPLICIT_B1_APPROVAL

## Stop

FULL READ-FIRST TRANSFER AUDIT COMPLETE → OWNER REVIEW → PRIORITY/DECISION → WAIT FOR EXPLICIT APPROVAL

لا تبدأ Transfer implementation أو runtime mutation أو أي Batch لاحق تلقائيًا.
