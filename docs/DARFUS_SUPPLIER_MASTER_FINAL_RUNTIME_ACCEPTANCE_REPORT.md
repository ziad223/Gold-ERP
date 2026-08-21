# DARFUS ERP — Supplier Master Final Runtime Acceptance + Supplier ID Hardening

Control ID: `DARFUS-SUPPLIER-MASTER-FINAL-RUNTIME-ACCEPTANCE`

Environment: `localhost:3000` / `localhost:8000` / `darfus_erp`

## 1. Executive Summary

تم تنفيذ إغلاق Supplier Master runtime على البيئة المحلية الأساسية فقط. تم تطبيق hardening صغير ومحدد يمنع العميل من فرض Supplier ID؛ يتم حذف `payload.id` عند إنشاء Supplier ثم يولّد الخادم `SUP-###` كسلطة نهائية.

تم تنفيذ مورد اصطناعي واحد فقط عبر الواجهة العربية:

- `SUP-002` — `QA-SUPPLIER-FINAL-RUNTIME-01`
- Create → Update → Disable → Reactivate

نجحت جميع إثباتات lifecycle المطلوبة. المورد المعطل لم يظهر في Inventory supplier selector، وبعد إعادة التفعيل ظهر مرة أخرى. لم يتغير `SUP-001` أو أي PO/Asset/StockMovement/Barcode history/Journal/Payment.

لا يوجد Receive أو Asset أو Barcode أو Movement أو Journal أو Payment جديد. لم تُنشأ Migration ولم يتم لمس Online Production.

## 2. Preconditions

| Precondition | Result | Evidence |
|---|---|---|
| Official DB target | PASS | `SELECT current_database()` → `darfus_erp` |
| Existing fixture preserved | PASS | `SUP-001` بقي active؛ 6 POs و6 Assets |
| Initial DB baseline | PASS | Suppliers 1, POs 6, Assets 6, Journals 6, Payments 0, AuditLogs 40 |
| SequelizeMeta | PASS | 86 before and after |
| Online Production | NOT TOUCHED | Only local runtime used |
| Build/restart | NOT RUN | Existing runtime retained; typecheck only |
| Worktree safety | PASS | No reset/clean/stash/restore; unrelated dirty files preserved |

## 3. Supplier ID Root Cause

Before the change, the generic controller only generated an ID when `payload.id` was absent. A direct Supplier API payload containing `id: CLIENT-SUP-999` could therefore reach the model as the primary key.

Evidence:

- `backend/src/controllers/erp.controller.js:592-605` generated only when `!payload.id`.
- `backend/src/models/supplier.model.js:5-8` defines Supplier `id` as the primary key.
- The canonical UI has no Supplier ID input.

This was the previously recorded P2 gap: UI authority was server-side, but the generic API boundary did not enforce the same authority.

## 4. Minimum Safe Hardening

Changed only the Supplier branch in `backend/src/controllers/erp.controller.js:572-605`:

```text
if (this.model.name === "Supplier") {
  delete payload.due;
  delete payload.id;
}
```

The existing `SUP-###` generator remains unchanged. Other models are not widened or altered. No migration, table, ID format, or accounting logic changed.

Chosen contract: Option A — a client-provided Supplier ID is ignored/stripped and the request receives a server-generated ID.

Focused proof is in `backend/tests/supplier-master-id-hardening.test.cjs`:

- client ID cannot become Supplier authority;
- `due` remains non-client-authoritative;
- company scope remains server-authoritative;
- server generation remains `SUP-###`;
- hardening is Supplier-specific.

The negative `CLIENT-SUP-999` request was not sent to the persistent DB because the control permits exactly one synthetic Supplier and the selected Option A contract would create a row. Static focused coverage proves the boundary without creating a second Supplier.

## 5. Pre-Mutation DB Snapshot

Target: `darfus_erp`.

| Snapshot A | Count |
|---|---:|
| Suppliers | 1 |
| Purchase Orders | 6 |
| Assets | 6 |
| Stock Movements | 0 |
| Barcode History | 6 |
| Journal Entries | 6 |
| Payments | 0 |
| Audit Logs | 40 |
| SequelizeMeta | 86 |

`SUP-001`: active, same company as the authenticated context, 6 linked POs, 6 linked Assets.

## 6. Create Runtime Proof

Path: `/ar/suppliers` → `مورد جديد` → one save.

Synthetic data used only:

- Name: `QA-SUPPLIER-FINAL-RUNTIME-01`
- Category: `QA Synthetic Supplier`
- Phone: `0500000991`
- Payment terms: `NET-0`
- Notes: `FINAL-RUNTIME-SYNTHETIC-01`

Result:

- `CREATE_RUNTIME = PASS`
- UI returned to the supplier list with the new row.
- Server-assigned ID was `SUP-002`.
- No client ID was supplied by the UI.

## 7. Create DB/Audit

Snapshot B:

| Entity | A | B | Delta |
|---|---:|---:|---:|
| Suppliers | 1 | 2 | +1 |
| Purchase Orders | 6 | 6 | 0 |
| Assets | 6 | 6 | 0 |
| Stock Movements | 0 | 0 | 0 |
| Barcode History | 6 | 6 | 0 |
| Journal Entries | 6 | 6 | 0 |
| Payments | 0 | 0 | 0 |
| Audit Logs | 40 | 41 | +1 |

`SUP-002` DB proof:

```text
id = SUP-002
company_id = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
name = QA-SUPPLIER-FINAL-RUNTIME-01
status = active
phone = 0500000991
```

Create audit:

```text
action = CREATE
source_document = SUP-002
company_id = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
actor_user_id = USR-2c71b1b5-477b-4f00-a097-de0488339b41
```

- `CREATE_DB = PASS`
- `CREATE_AUDIT = PASS`

## 8. Update Runtime Proof

From the Supplier list, only the synthetic supplier was edited. The safe field changed was:

```text
notes: FINAL-RUNTIME-SYNTHETIC-01
→ FINAL-RUNTIME-SYNTHETIC-01-UPDATED
```

No ID, companyId, due, or financial history was changed.

- `UPDATE_RUNTIME = PASS`

## 9. Update DB/Audit

Snapshot C:

| Entity | Count |
|---|---:|
| Suppliers | 2 |
| Purchase Orders | 6 |
| Assets | 6 |
| Stock Movements | 0 |
| Barcode History | 6 |
| Journal Entries | 6 |
| Payments | 0 |
| Audit Logs | 42 |

DB confirms the new Notes value and unchanged supplier ID/company scope.

Audit event:

```text
action = UPDATE
source_document = SUP-002
company_id = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
```

- `UPDATE_DB = PASS`
- `UPDATE_AUDIT = PASS`

## 10. Disable Runtime Proof

From the Supplier list, the synthetic row only was disabled with reason `FINAL-RUNTIME-LIFECYCLE-TEST`.

- UI showed the supplier as `غير نشط`.
- Supplier row remained present.
- Supplier details route remained readable.
- `DISABLE_RUNTIME = PASS`

## 11. Disabled Inventory Selector

Path:

`/ar/inventory` → `إضافة / استلام مخزون` → `ذهب بالقطعة`

During the inactive state:

- `QA-G2C-SUPPLIER-01` was visible.
- `QA-SUPPLIER-FINAL-RUNTIME-01` was not visible as an option.
- No preview or receive was submitted.

`DISABLED_SUPPLIER_EXCLUDED_FROM_SELECTOR = PASS`

## 12. Historical Preservation

While `SUP-002` was inactive:

- `/ar/suppliers/SUP-002` loaded successfully.
- Supplier identity, inactive status, Notes, and history tab remained readable.
- No historical rows were attached to the synthetic supplier.

The preserved fixture remained unchanged:

```text
SUP-001 = active
Purchase Orders = 6
Assets = 6
```

`HISTORICAL_PRESERVATION = PASS`

## 13. Reactivate Runtime Proof

The same `SUP-002` row was reactivated from the Supplier list. No new Supplier was created and no ID changed.

- UI returned the action to `تعطيل`, indicating active status.
- `REACTIVATE_RUNTIME = PASS`

## 14. Reactivated Inventory Selector

After reloading the canonical Inventory path and reopening Gold By Piece:

- `QA-G2C-SUPPLIER-01` was visible.
- `QA-SUPPLIER-FINAL-RUNTIME-01` / `SUP-002` was visible and selectable.
- No receive was submitted.

`REACTIVATED_SUPPLIER_IN_SELECTOR = PASS`

## 15. Supplier Receive Separation

| Path | Result |
|---|---|
| `/ar/suppliers` | Supplier Master only; no Receive create authority |
| `/ar/suppliers/purchases` | Redirects to `/ar/inventory` |
| `/ar/inventory` | Canonical `إضافة / استلام مخزون` entry remains present |
| `/ar/inventory/gold-by-piece` | Supplier selector is active-status filtered |

No Supplier Receive, PO, Asset, Barcode, Stock Movement, Cost Revision, Journal, or Payment action was executed.

`SUPPLIER_RECEIVE_SEPARATION = PASS`
`LEGACY_SUPPLIER_RECEIVE_REDIRECT = PASS`

## 16. Permissions / Validation

Focused source coverage proves the catalog and route authority for:

`suppliers.view`, `suppliers.create`, `suppliers.update`, `suppliers.delete`, `suppliers.deactivate`, `suppliers.reactivate`.

The server routes use explicit business permission guards. The existing UI requires name, category, and phone; the DB enforces non-null company/name/category/phone; Supplier `due` and ID are server-controlled.

- `PERMISSIONS = PASS`
- `VALIDATION = PASS`

No denied-role mutation was attempted. No unsupported validation rule was invented.

## 17. Browser AR/EN

| Journey | Result |
|---|---|
| `/ar/suppliers` list | PASS |
| `/ar/suppliers/SUP-002` details | PASS |
| `/en/suppliers` list | PASS |
| `/en/suppliers/SUP-002` details | PASS |
| Locale-preserving routes | PASS |
| Arabic lifecycle | PASS |
| English duplicate lifecycle | NOT RUN by design |
| Final browser console Supplier errors | 0 |

`AR_UI = PASS`
`EN_UI = PASS`

## 18. Network / Console

The lifecycle used the existing API contracts; no alternate route was introduced.

| Operation | Endpoint | Source status contract | Runtime evidence |
|---|---|---:|---|
| Create | `POST /api/v1/suppliers` | 201 | UI success, `SUP-002` row, DB + CREATE audit |
| Update | `PUT /api/v1/suppliers/SUP-002` | 200 | UI success, Notes changed, DB + UPDATE audit |
| Disable | `POST /api/v1/suppliers/SUP-002/deactivate` | 200 | UI inactive state, DB + lifecycle audit |
| Reactivate | `POST /api/v1/suppliers/SUP-002/reactivate` | 200 | UI active action restored, DB + lifecycle audit |

The in-app browser telemetry available in this runtime exposes console logs but not raw response-status events. Therefore status values above are the route’s actual response contracts corroborated by successful UI completion and DB/audit effects; no related 4xx/5xx or console error was observed.

`NETWORK = PASS`
`CONSOLE = PASS`

## 19. DB Reconciliation

| Snapshot | Suppliers | POs | Assets | Stock Movements | Barcode History | Journals | Payments | Audit Logs | `SUP-002` status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A before | 1 | 6 | 6 | 0 | 6 | 6 | 0 | 40 | absent |
| B create | 2 | 6 | 6 | 0 | 6 | 6 | 0 | 41 | active |
| C update | 2 | 6 | 6 | 0 | 6 | 6 | 0 | 42 | active |
| D disable | 2 | 6 | 6 | 0 | 6 | 6 | 0 | 43 | inactive |
| E reactivate | 2 | 6 | 6 | 0 | 6 | 6 | 0 | 44 | active |

Final synthetic audit actions:

```text
CREATE
UPDATE
supplier.deactivate
supplier.reactivate
```

No Supplier delete was performed. `SUP-001` remained active with 6 POs and 6 Assets.

## 20. Focused Tests

| Command | Result |
|---|---|
| Supplier Master + ID hardening + canonical UI regressions | 18/18 PASS |
| G2B location, G2C receive contract, G2D readiness | 13/13 PASS |
| `npm run typecheck` | PASS |
| Build | Not required / not run |

Primary focused files:

- `tests/supplier-master-final-closure.test.cjs`
- `backend/tests/supplier-master-id-hardening.test.cjs`
- `tests/unified-inventory-intake-ux-02-r3.test.cjs`
- `backend/tests/phase-03b-g2c-receive-tax-location.test.cjs`
- `backend/tests/phase-03b-g2d-operational-readiness.test.cjs`
- `tests/tax-vat-settings-ui-discoverability.test.cjs`

## 21. Files Changed

Intentional files for this control:

- `backend/src/controllers/erp.controller.js` — Supplier-only ID stripping.
- `backend/tests/supplier-master-id-hardening.test.cjs` — focused ID hardening coverage.
- `tests/supplier-master-final-closure.test.cjs` — permission assertion added to the existing Supplier Master regression file.
- `docs/DARFUS_SUPPLIER_MASTER_FINAL_RUNTIME_ACCEPTANCE_REPORT.md` — this report.

`backend/src/controllers/erp.controller.js` was already dirty before this control; the only intentional delta for this control is the Supplier-specific `delete payload.id` guard.

No Supplier UI, Receive UI, Tax/VAT, Accounting, Inventory, Barcode, Asset, POS, migration, or config files were changed for this control.

Runtime data intentionally retained as required:

- `SUP-002` remains active as synthetic local test data.

## 22. Gate

`GATE = PASS_SUPPLIER_MASTER_FINAL_RUNTIME_ACCEPTANCE`

All required runtime lifecycle, selector, preservation, source, test, typecheck, and reconciliation gates passed. The one synthetic Supplier was preserved; no cleanup or delete was performed.

`SUPPLIER_MASTER_FINAL_CLOSED = YES`

## 23. Final Tokens

```text
CURRENT_CONTROL = DARFUS-SUPPLIER-MASTER-FINAL-RUNTIME-ACCEPTANCE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86

SUPPLIER_ID_SERVER_AUTHORITY = PASS
CLIENT_PROVIDED_SUPPLIER_ID_PROTECTION = PASS
SYNTHETIC_SUPPLIER_ID = SUP-002

CREATE_RUNTIME = PASS
CREATE_DB = PASS
CREATE_AUDIT = PASS

UPDATE_RUNTIME = PASS
UPDATE_DB = PASS
UPDATE_AUDIT = PASS

DISABLE_RUNTIME = PASS
DISABLE_DB = PASS
DISABLE_AUDIT = PASS

DISABLED_SUPPLIER_EXCLUDED_FROM_SELECTOR = PASS
HISTORICAL_PRESERVATION = PASS

REACTIVATE_RUNTIME = PASS
REACTIVATE_DB = PASS
REACTIVATE_AUDIT = PASS
REACTIVATED_SUPPLIER_IN_SELECTOR = PASS

SUPPLIER_COMPANY_SCOPE = PASS
SUPPLIER_RECEIVE_SEPARATION = PASS
LEGACY_SUPPLIER_RECEIVE_REDIRECT = PASS
PERMISSIONS = PASS
VALIDATION = PASS
AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS

NEW_SYNTHETIC_SUPPLIERS = 1
NEW_RECEIVES = 0
NEW_POS = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_MOVEMENTS = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_SUPPLIER_MASTER_FINAL_RUNTIME_ACCEPTANCE
SUPPLIER_MASTER_FINAL_CLOSED = YES

SUPPLIER_RECEIVE_FINAL_CLOSED = NO
ASSET_FINAL_CLOSED = NO
BARCODE_FINAL_CLOSED = NO
RFID_FINAL_CLOSED = NO
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO

NEXT_RECOMMENDED_STEP = SUPPLIER_RECEIVE_V2_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Do not begin Supplier Receive V2 Final Closure automatically.
