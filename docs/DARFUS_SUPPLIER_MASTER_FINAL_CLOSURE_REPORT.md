# DARFUS ERP — Supplier Master Final Closure

Control ID: `DARFUS-SUPPLIER-MASTER-FINAL-CLOSURE`

## 1 Executive Summary

تم فحص Supplier Master في المصدر، الـBackend، المتصفح، وقاعدة `darfus_erp` قراءة فقط. تم استكمال نموذج الإنشاء/التعديل بثلاثة حقول موجودة أصلًا في الـschema (`taxNumber`, `commercialRegister`, `paymentTerms`) دون تغيير Business Logic أو schema أو قاعدة البيانات.

النتيجة: إدارة المورد الأساسية مغلقة وظيفيًا ضمن المسار الحالي. المورد authority هو `Supplier` على مستوى الشركة، وليس كيانًا مستقلًا لكل فرع. مسار إنشاء الاستلام الوحيد هو Inventory؛ رابط Supplier القديم يعيد التوجيه إلى Inventory ولا ينشئ Receive.

لا توجد كتابات رسمية في هذه المهمة: لا Supplier جديد، لا Update، لا Disable، لا Delete، لا Receive، لا Payment، لا Journal، ولا Migration.

## 2 Read-Only Forensic

| Check | Result | Evidence |
|---|---|---|
| Source baseline | Dirty worktree pre-existed; unrelated changes preserved | `git status --short --branch` قبل التعديل أظهر تغييرات واسعة في ملفات أخرى |
| Official DB target | Confirmed `darfus_erp` | `SELECT current_database(), current_user` → `darfus_erp`, `postgres` |
| Official DB write | 0 | لا توجد أوامر INSERT/UPDATE/DELETE/TRUNCATE/DDL في هذه المهمة |
| Migrations | Read-only observed count 86 | `SequelizeMeta` count = 86 |
| Runtime | Existing localhost runtime used | Browser pages loaded on `localhost:3000`; no restart/build |
| Online production | Not contacted | Scope restricted to local runtime and official local DB read-only |

## 3 Supplier Authority

| Concern | Current authority | Classification | Evidence |
|---|---|---|---|
| Supplier record | `Supplier` model/table | PASS | `backend/src/models/supplier.model.js:5-76` |
| Supplier code | Backend generates `SUP-###` by default; UI does not accept an ID | PASS for canonical UI; P2 API hardening gap noted | `backend/src/controllers/erp.controller.js:133-135, 189-219, 592-602` |
| Company scope | `companyId` server scope | PASS | Model `companyId` and generic CRUD predicates use `req.companyId` |
| Branch scope | Supplier is company-global; no `branchId` column | PASS / design authority | Supplier model has no `branchId`; branch-specific operational data remains in Receive/Location/Asset flows |
| Reference due | System-managed/reference only | PASS | Controller strips Supplier `due` on create/update; statement is the calculated authority |
| Status | `active` / `inactive` | PASS | Model enum and lifecycle routes |
| Delete | Physical delete only when no linked records | PASS | Linked-record guard in `erp.routes.js:4715-4726` |
| Audit | Central audit service and supplier lifecycle audit actions | PASS | Generic CRUD audit plus `supplier.deactivate`, `supplier.reactivate`, `supplier.delete` routes |

## 4 UI/API Classification

| Capability | UI | API/source | Result |
|---|---|---|---|
| List/search/filter/pagination | Present | `GET /suppliers` generic CRUD | PASS |
| Create | Present and permission-gated | `POST /suppliers` | PASS for canonical UI; no mutation run |
| Edit | Present and permission-gated | `PUT /suppliers/:id` | PASS for canonical UI; no mutation run |
| Deactivate/reactivate | Present and permission-gated | Dedicated POST routes | PASS source + browser controls; no mutation run |
| Delete | Present and permission-gated | `DELETE /suppliers/:id` | PASS safe guard; linked supplier deletion is blocked |
| Details | Present | `GET /suppliers/:id` | PASS |
| Purchase history | Present, read-only history view | `GET /suppliers/:id/purchase-orders` | PASS |
| Statement/balance | Present, read-only statement | `GET /suppliers/:id/statement` | PASS |
| Receive creation from Supplier screen | Not present | Legacy page redirects | PASS — no duplicate workflow |

## 5 Company / Branch Scope

Supplier rows are company-scoped and globally available to branches in the company. The model has `companyId` and no `branchId`. The generic controller overwrites/sets company scope from the authenticated request and applies it to list, get, create, update, and delete paths.

The canonical Inventory receive screen resolves supplier selection through the active company/branch context. Location remains DB-backed and branch-scoped in the operational receive path; this does not turn Supplier itself into a branch-owned record.

## 6 Supplier CRUD

The list screen exposes search, category/reference-balance/status filters, pagination, export, details, edit, deactivate/reactivate, and delete actions. The create/edit form requires name, category, and phone. It now also exposes the model-supported optional fields:

- tax number
- commercial register
- payment terms
- email, country, address, notes, and rating

`due` is deliberately not editable and is not accepted as the Supplier balance authority.

No new supplier was created because the existing official fixture `SUP-001` was sufficient for read-only UI/API/DB proof.

## 7 Validation

| Rule | Result | Evidence |
|---|---|---|
| Required name/category/phone in canonical UI | PASS | Form `required` attributes and client guard in `suppliers/page.tsx` |
| Database not-null for name/category/phone/company | PASS | `supplier.model.js:9-37` |
| Server company override | PASS | Generic controller assigns `companyId: req.companyId` |
| Supplier due cannot be manually overwritten through generic UI/API | PASS | Controller Supplier-specific due stripping; UI omits it on update |
| Tax number/commercial register/payment terms are available when schema supports them | PASS | `suppliers/page.tsx:29-31, 125-127, 152-177, 647-668` |
| Field-format validation beyond required/non-null | NOT PROVEN | No mutation or negative API request was run; no owner-approved write target was provided |

The last item is an acceptance limitation, not an observed data corruption. No new validation rule was invented.

## 8 Disable / Delete Policy

Disable is a status transition to `inactive`, within a transaction, with an audit record. Reactivation is the inverse transition and also audited.

Delete is not a substitute for disable. The server checks purchase orders, supplier documents, consignments, and linked assets. A linked supplier returns `SUPPLIER_HAS_LINKED_RECORDS` and is not destroyed. The existing official supplier has six purchase orders and six linked assets, so deletion was not attempted.

## 9 Details / History / Balance

Supplier details exposes identity, contact, payment terms, country, tax number, commercial register, notes, POs/receipts, statement, consignments, RCM view, and documents.

Purchase history is read-only as a history view. Payment controls exist in the details page as a separate accounting/payment action; no payment was clicked or executed.

The statement is the calculated balance authority from received purchase orders less supplier payments. `Supplier.due` is displayed as a reference only and is not treated as the computed payable balance.

## 10 Supplier Receive Separation

`app/[locale]/(dashboard)/suppliers/purchases/page.tsx:1-5` is a redirect-only legacy adapter to `/inventory`.

Browser proof:

- `/ar/suppliers/purchases` redirected to `/ar/inventory`.
- `/ar/inventory` displayed `إضافة / استلام مخزون`.
- No Supplier page receive-create button was used or accepted as authority.
- `/ar/inventory/gold-by-piece` displayed the DB-backed supplier selector and `QA-G2C-SUPPLIER-01` option.

There is no second Supplier receive workflow.

## 11 Inventory Selector

The Supplier is available in the canonical Inventory/Gold By Piece selector from DB. Supplier selection was inspected only; no profile data was submitted and no Asset/Barcode/Movement was created.

## 12 Permissions

The Supplier UI uses explicit permissions:

`suppliers.view`, `suppliers.create`, `suppliers.update`, `suppliers.delete`, `suppliers.deactivate`, and `suppliers.reactivate`.

The backend routes use the same business permission authority. A denied-role runtime attempt was not executed because it would require authentication/session manipulation outside the read-only evidence requirement.

## 13 Audit

Supplier create/update/lifecycle/delete actions are routed through the application audit authority. Existing DB evidence for `SUP-001` contains one direct `CREATE` audit row. Deactivate/reactivate/delete routes record before/after or before-state data inside their transaction.

No audit row was created by this task.

## 14 Browser AR/EN

| Journey | Arabic | English | Mutation |
|---|---|---|---|
| Supplier list | PASS | PASS | None |
| New Supplier form opens | PASS; model-supported fields visible | Source-verified; no submit | None |
| Supplier details | PASS | Source/API contract verified | None |
| Purchase/history view | PASS | Source/API contract verified | None |
| Legacy Supplier receive URL | Redirects to Inventory | Same route contract | None |
| Canonical Inventory entry | PASS | Route preserved | None |
| Gold By Piece supplier selector | PASS; DB supplier option visible | Route preserved | None |
| Browser console errors | None observed in final read-only journey | None observed in final read-only journey | None |

## 15 API Evidence

Authenticated UI/API reads rendered successfully for:

| Read path | Result |
|---|---|
| `GET /suppliers` | PASS — list rendered with `SUP-001` |
| `GET /suppliers/SUP-001` | PASS — details rendered |
| `GET /suppliers/SUP-001/purchase-orders` | PASS — six historical POs rendered |
| `GET /suppliers/SUP-001/statement` | PASS — statement panel contract/source present; no write action executed |
| Canonical Inventory supplier selector read | PASS — active supplier option visible |

No POST/PUT/DELETE Supplier endpoint was called in this task.

## 16 DB Reconciliation

Read-only query target: `darfus_erp`.

| Entity | Count | Notes |
|---|---:|---|
| Suppliers | 1 | `SUP-001`, active, company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Purchase orders | 6 | All linked to the observed supplier in the current official baseline |
| Assets | 6 | Six linked assets by supplier/company |
| Journal entries | 6 | Six PO-linked journal rows observed |
| Payments | 0 | No payment in current baseline |
| Audit logs | 40 | One direct `SUP-001` audit row; action `CREATE` |
| SequelizeMeta | 86 | Read-only migration metadata count |

Supplier link reconciliation: `SUP-001 → 6 POs → 6 Assets → 6 linked Journal Entries → 1 direct AuditLog`. No DB delta was produced by this task.

## 17 Focused Tests

| Command | Result |
|---|---|
| `node --test tests/supplier-master-final-closure.test.cjs tests/unified-inventory-intake-ux-02-r3.test.cjs tests/settings-onboarding-discoverability.test.cjs tests/tax-vat-settings-ui-discoverability.test.cjs` | 15/15 PASS |
| `node --test tests/phase-03b-g2c-receive-tax-location.test.cjs tests/phase-03b-g2b-location-management.test.cjs tests/phase-03b-g2d-operational-readiness.test.cjs` from `backend` | 13/13 PASS |
| `npm run typecheck` | PASS |
| Build | NOT RUN per guardrail |

## 18 Files Changed

Intentional changes for this closure:

- `app/[locale]/(dashboard)/suppliers/page.tsx` — minimum UI completeness for fields already supported by the Supplier model. This file was already modified before this task; only the Supplier field additions listed above belong to this closure.
- `tests/supplier-master-final-closure.test.cjs` — focused static/source regression tests.
- `docs/DARFUS_SUPPLIER_MASTER_FINAL_CLOSURE_REPORT.md` — this report.

Not changed for this closure:

- Backend source
- Database schema or data
- Migrations
- Tax/VAT engine
- Receive logic
- Inventory, Asset, Barcode, POS, Accounting, Payment, or Journal logic
- `next-env.d.ts`

## 19 Gate

`PASS_SUPPLIER_MASTER_FINAL_CLOSURE`

Rationale: the Supplier Master canonical UI/API authority, company scope, lifecycle protection, details/history/statement views, permission checks, audit path, and single receive-entry separation are proven by source, focused tests, read-only browser evidence, and official DB reconciliation. No P0/P1 defect was introduced or observed in this closure.

The following are explicitly not claimed as runtime mutations: create-before/after, edit-before/after, disable-before/after, or delete execution. Existing official fixture plus source/API/browser read evidence was sufficient; official DB remained untouched.

## 20 Final Tokens

```text
CURRENT_BATCH = DARFUS-SUPPLIER-MASTER-FINAL-CLOSURE
MODE = READ_ONLY_SUPPLIER_MASTER_FINAL_CLOSURE

OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
ONLINE_PRODUCTION_CONTACTED = NO
NEW_SUPPLIERS = 0
NEW_RECEIVES = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
MIGRATION_CREATED = NO

SUPPLIER_MASTER_AUTHORITY = Supplier
SUPPLIER_SCOPE = COMPANY_GLOBAL
SUPPLIER_CODE_AUTHORITY = SERVER_GENERATED_BY_DEFAULT
SUPPLIER_MASTER_UI = FULL_FOR_CANONICAL_WORKFLOW
SUPPLIER_MASTER_API = FULL
SUPPLIER_CREATE = NOT_REQUIRED_EXISTING_FIXTURE
SUPPLIER_UPDATE = PASS_STATIC_UI_API_PROOF_NO_MUTATION
SUPPLIER_DISABLE = PASS_STATIC_UI_API_PROOF_NO_MUTATION
SUPPLIER_REACTIVATE = PASS_STATIC_UI_API_PROOF_NO_MUTATION
SUPPLIER_DELETE_REFERENCED = BLOCKED_BY_SERVER
SUPPLIER_DELETE_UNREFERENCED = SERVER_ALLOWED
SUPPLIER_BALANCE_AUTHORITY = READ_ONLY_STATEMENT_AP
SUPPLIER_PURCHASE_HISTORY = PASS
SUPPLIER_AUDIT = PASS
SUPPLIER_RECEIVE_DUPLICATION = NO
SUPPLIER_RECEIVE_CANONICAL_ENTRY = INVENTORY
SUPPLIER_INVENTORY_SELECTOR = PASS
SUPPLIER_PERMISSION_AUTHORITY = PASS_STATIC
SUPPLIER_VALIDATION = PASS_UI_DB_REQUIRED_FIELDS; FORMAT_NEGATIVE_RUNTIME_NOT_RUN
SUPPLIER_MASTER_DB_RECONCILIATION = PASS_READ_ONLY

SUPPLIER_RECEIVE_FINAL_CLOSED = NO
ASSET_FINAL_CLOSED = NO
BARCODE_FINAL_CLOSED = NO
RFID_FINAL_CLOSED = NO
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1
P3_COUNT = 0
P4_COUNT = 0
P2_ISSUE = Generic Supplier API accepts a client-provided id; canonical UI does not expose it and server generation is the default.

SUPPLIER_MASTER_FINAL_CLOSED = YES
GATE = PASS_SUPPLIER_MASTER_FINAL_CLOSURE
NEXT_RECOMMENDED_STEP = SUPPLIER_RECEIVE_V2_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

Boundaries remain unchanged: Supplier Receive, Asset, Barcode, RFID, GBW, GBP, Supplier Accounts, and POS are not final-closed by this task.

STOP.
