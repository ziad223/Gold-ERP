# DARFUS ERP — RFID User Workflow + Final Runtime Acceptance

**Control ID:** `DARFUS-RFID-USER-WORKFLOW-FINAL-RUNTIME-ACCEPTANCE`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Date:** 2026-08-19  
**Mode:** Source implementation + read-only runtime inspection; official-DB mutation blocked by standing guardrails

## 1. Executive Summary

تم تنفيذ أقل تغيير آمن لإكمال User Workflow الخاص بـRFID: Assign وReplace داخل Asset Details، وإضافة Unassign canonical في الـbackend مع transaction و`INACTIVE` وحفظ التاريخ وAssetEvent/Audit/idempotency contract.

تمت مراجعة البيئة الرسمية قراءة فقط، واختبار الواجهة بالعربية والإنجليزية. لم تُنفّذ أي mutation على `darfus_erp`: لا Assign أو Scan أو Replace أو Unassign، ولا Receive أو Asset أو Barcode أو Movement أو Journal أو Payment. لذلك لا يمكن اعتماد Runtime Acceptance حي في هذا الـBatch. السبب ليس schema blocker؛ السبب أن الهدف الرسمي يتطلب Owner approval صريحًا للكتابة، وهو غير موجود هنا.

**Gate:** `BLOCKED_RFID_RUNTIME_MUTATION_AUTHORIZATION_REQUIRED`

## 2. Preconditions

| Item | Result | Evidence |
|---|---|---|
| Local frontend | Read-only inspected | `http://localhost:3000/ar|en/inventory/<asset>` |
| Local backend | PASS | `GET /api/v1/health` = 200 / UP |
| DB health | PASS | `GET /api/v1/health/db` = 200 / PostgreSQL connected |
| Redis health | PASS | `GET /api/v1/health/redis` = 200 / Redis connected |
| Official DB | Confirmed | `SELECT current_database()` = `darfus_erp` |
| Online Production | NOT CONTACTED | No production URL or service used |
| Mutation authorization | BLOCKED | Standing AGENTS guardrail requires explicit approval for official DB write |
| Migration | NONE | No migration created or applied |
| Build/Next restart | NOT RUN | Existing main runtime retained; `next-env.d.ts` untouched |

## 3. Read-Only Forensic

| Authority | Actual implementation |
|---|---|
| `Asset.rfid` | Nullable Asset projection in `backend/src/models/asset.model.js` |
| Assignment history | `asset_rfid_assignments` from migration `20260804020000-inventory-components-rfid-history-foundation.js` |
| Scan evidence | `rfid_scan_events` with restrictive foreign keys and immutable scan trigger |
| Assignment | `assignRfid()` in `backend/src/services/inventory-v2-runtime.service.js` |
| Scan | `recordRfidScan()` in the same service |
| Assignment route | `POST /inventory-v2/assets/:id/rfid` |
| Unassign route | Added by this control: `POST /inventory-v2/assets/:id/rfid/unassign` |
| Inventory search | Asset list searches Barcode and RFID; current assignment is joined |
| Detail/history | Asset detail returns `rfidAssignments` and displays current/history |
| Permissions | Assign/replace/unassign use `inventory.adjust`; scan uses `inventory.view` |
| Generic CRUD protection | `rfid` is in `ASSET_IDENTITY_FIELDS`; generic edit cannot bypass lifecycle |

## 4. Current RFID Authority

`ASSET` remains physical inventory authority. Barcode remains the primary serialized identity. RFID is an optional opaque external identifier linked to an Asset. RFID does not create stock, Product quantity, Barcode, branch, location, movement, financial record or Asset.

## 5. UI Design Decision

The only management surface is:

`Inventory → Asset Details → Identity and Traceability → RFID`

The page now shows Current RFID, RFID state, Assigned At and assignment history. With `inventory.adjust`, it shows Assign when there is no current RFID, and Replace/Unassign when one exists. The UI sends only `rfidNumber` and/or `reason` to the canonical endpoints; company, branch, ownership, status and history IDs remain server authorities.

The Inventory list continues to search Barcode/RFID. No separate RFID inventory, stock authority or sidebar workflow was added.

## 6. Unassign Design

The schema already supports safe unassign, so no migration was required. The new operation:

1. authenticates and requires `inventory.adjust`;
2. resolves authorized company/branch and locks the scoped Asset;
3. requires a non-empty reason and an `Idempotency-Key`;
4. locks the current `ACTIVE` assignment;
5. updates it to `INACTIVE`, `is_current=false`, with end actor/time and reason;
6. clears `assets.rfid` in the same transaction;
7. writes `RFID_UNASSIGNED` AssetEvent and audit evidence;
8. commits atomically or rolls back completely.

History is retained. No delete operation was introduced. Same-key replay returns the prior result; changed Asset/reason/event payload is rejected as an idempotency conflict.

## 7. Files Changed

Intentional changes for this control:

| File | Change |
|---|---|
| `backend/src/services/inventory-v2-runtime.service.js` | Added `unassignRfid()` and exported it |
| `backend/src/routes/erp.routes.js` | Added permissioned, scoped, transactional canonical Unassign route |
| `app/[locale]/(dashboard)/inventory/[id]/page.tsx` | Added Assign/Replace/Unassign controls and RFID history panel in AR/EN |
| `tests/rfid-final-closure.test.cjs` | Extended focused proof for Unassign route/service/UI |
| `docs/DARFUS_RFID_USER_WORKFLOW_FINAL_RUNTIME_ACCEPTANCE_REPORT.md` | This report |

No migration, configuration, Git history operation, accepted Asset deletion or official DB write was performed. Existing unrelated worktree drift was preserved.

## 8. Pre-Mutation DB Snapshot

Read-only snapshot before and after source/tests:

| Entity | Count |
|---|---:|
| Database | `darfus_erp` |
| SequelizeMeta | 86 |
| Assets | 6 |
| RFID assignments | 0 |
| RFID scan events | 0 |
| Asset events | 6 |
| Barcode history | 6 |
| Inventory movements | 6 |
| Purchase orders | 6 |
| Journal entries | 6 |
| Journal lines | 18 |
| Payments | 0 |
| Audit logs | 44 |
| Idempotency requests | 6 |

No row count changed during this control.

## 9. Test Asset Selection

Selected read-only safe candidate:

```text
RFID_TEST_ASSET_ID = AST-PUR-1787085524749-1-1-dww3
company = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
branch = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
location = LOC-9a10f58e-4207-4512-8824-7a7b06159151
barcode = GWRNG21000002
rfid = NULL/empty
operational_status = AVAILABLE
```

It is not one of the two protected reference Assets and has no current RFID. It was inspected only; it was not mutated.

## 10. Assign Runtime

**Status:** `BLOCKED_RUNTIME_NOT_AUTHORIZED`

The source/UI path is implemented and the browser rendered the Assign control. The required synthetic assignment `RFID-QA-FINAL-0001` was not submitted because that would write `darfus_erp`, which is prohibited without explicit Owner approval and an active-business-write check.

## 11. Search / Scan Runtime

**Status:** `BLOCKED_RUNTIME_NOT_AUTHORIZED`

Read-only Inventory search and Asset detail loaded. The canonical scan endpoint and service contract are source-proven, but no scan POST was called because it inserts `rfid_scan_events`.

## 12. Idempotency Replay

**Status:** `PASS_SOURCE / BLOCKED_LIVE_RUNTIME`

Assignment and new Unassign code use the existing AssetEvent/idempotency-key convention. Focused isolated service proof passed. Live same-key replay and changed-payload conflict were not sent to the official runtime.

## 13. Cross-Asset Conflict

**Status:** `PASS_SOURCE / BLOCKED_LIVE_RUNTIME`

Global RFID uniqueness, row locking and reuse rejection remain enforced. No second Asset was touched and no conflict request was sent to the official runtime.

## 14. Replacement Runtime

**Status:** `BLOCKED_RUNTIME_NOT_AUTHORIZED`

Existing replacement logic remains canonical and the new UI exposes Replace with a required reason. No replacement mutation was executed.

## 15. Unassign Runtime

**Status:** `BLOCKED_RUNTIME_NOT_AUTHORIZED`

The new route is implemented without a schema change. No Unassign mutation was executed. The expected final state therefore was not manufactured: no current RFID exists in the official DB before or after this control.

## 16. History

Source/UI behavior preserves assignment history and shows current-only RFID separately from historical rows. Unassign uses `INACTIVE`; replacement uses `REPLACED`. No history row was created in the official DB.

## 17. Company / Branch Scope

Source proof: server resolves authorized branch, scopes Asset by `companyId + branchId`, and the assignment/scan services use server context. Cross-company and cross-branch live requests were not executed. Location is carried from Asset context and is not accepted as RFID authority.

## 18. Barcode / Location Preservation

The UI and service do not send or update Barcode, branch or location. The selected Asset baseline still reports Barcode `GWRNG21000002` and the same company/branch/location after the control. No mutation means all deltas are zero.

## 19. DB Reconciliation

| Required delta | Result |
|---|---:|
| Asset count delta | 0 |
| Barcode history delta | 0 |
| Inventory movement delta | 0 |
| Purchase order delta | 0 |
| Journal delta | 0 |
| Payment delta | 0 |
| RFID assignment delta | 0 |
| RFID scan-event delta | 0 |

These are read-only before/after observations, not successful live-lifecycle proof.

## 20. AR / EN Browser

| Surface | Result | Evidence |
|---|---|---|
| `/ar/inventory/<asset>` | PASS_READ_ONLY | Current RFID, state, assigned date, history and Arabic Assign control rendered |
| `/en/inventory/<asset>` | PASS_READ_ONLY | Current RFID, state, assigned date, history and English Assign control rendered |
| Replace/Unassign visible state | SOURCE/UI_READY | Buttons are conditional on current RFID; current official Asset has none |
| Duplicate workflow | PASS | No separate RFID page/sidebar or alternate RFID authority |
| Browser console | PASS_READ_ONLY | No application errors; only React DevTools/HMR informational logs |

## 21. API / Network / Console

| Check | Result |
|---|---|
| Backend health | 200 / UP |
| DB health | 200 / connected |
| Redis health | 200 / connected |
| Inventory detail GET | PASS_READ_ONLY |
| Assignment/Unassign POST | NOT CALLED |
| Scan POST | NOT CALLED |
| Console errors | None observed |
| Online production | Not contacted |

## 22. Concurrency / Validation

| Rule | Result |
|---|---|
| Empty/whitespace RFID | Source rejects with required-value error |
| Unknown scan | Source rejects with not-found error |
| Existing RFID reuse | Source rejects with conflict; row lock present |
| One current assignment per Asset | Partial unique index and row lock |
| Unassign reason required | Backend and UI validation |
| Unassign atomicity | One transaction; assignment and Asset projection updated together |
| Concurrent live proof | BLOCKED; no uncontrolled Main DB concurrency run |
| Hardware/reader | Not implemented and not required here |
| POS RFID | Deferred; not changed |

## 23. Focused Tests

`node --test tests/rfid-final-closure.test.cjs`: **15/15 passed**. The test now covers the Unassign service, `INACTIVE`, `RFID_UNASSIGNED`, canonical route and UI controls using isolated fakes/source assertions; it does not write the official DB.

Relevant regression command: **84/84 passed, 0 failed**.

`npm run typecheck`: **PASS** (`tsc --noEmit`).

## 24. Gate

The source/UI change is complete and no P0/P1 RFID authority defect remains known. However, the control’s mandatory live lifecycle cannot be claimed because the requested target is the official persistent DB and the standing safety gate does not authorize its mutation. No disposable target or explicit Owner-approved rehearsal target was supplied.

```text
GATE = BLOCKED_RFID_RUNTIME_MUTATION_AUTHORIZATION_REQUIRED
RFID_FINAL_CLOSED = NO
OWNER_APPROVAL_REQUIRED = YES
```

The blocker is runtime authorization, not a schema blocker. No rollback or cleanup is required because no mutation occurred.

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-RFID-USER-WORKFLOW-FINAL-RUNTIME-ACCEPTANCE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
RFID_TEST_ASSET_ID = AST-PUR-1787085524749-1-1-dww3

RFID_UI_ASSIGN = PASS_SOURCE_UI / BLOCKED_LIVE_RUNTIME
RFID_UI_REPLACE = PASS_SOURCE_UI / BLOCKED_LIVE_RUNTIME
RFID_UI_UNASSIGN = PASS_SOURCE_UI / BLOCKED_LIVE_RUNTIME

RFID_ASSIGN_RUNTIME = BLOCKED
RFID_SCAN_RUNTIME = BLOCKED
INVENTORY_RFID_SEARCH_RUNTIME = PASS_READ_ONLY / BLOCKED_RFID_DATA
RFID_ASSIGN_REPLAY = BLOCKED
RFID_CROSS_ASSET_CONFLICT = BLOCKED
RFID_REPLACE_RUNTIME = BLOCKED
RFID_REPLACEMENT_LOOKUP = BLOCKED
RFID_UNASSIGN_RUNTIME = BLOCKED
RFID_POST_UNASSIGN_LOOKUP = BLOCKED
RFID_HISTORY_UI = PASS_READ_ONLY / BLOCKED_LIFECYCLE_DATA

RFID_COMPANY_SCOPE = PASS_SOURCE / BLOCKED_LIVE_RUNTIME
RFID_BRANCH_SCOPE = PASS_SOURCE / BLOCKED_LIVE_RUNTIME
RFID_LOCATION_NON_AUTHORITY = PASS_SOURCE
RFID_BARCODE_PRESERVATION = PASS_READ_ONLY

GENERIC_RFID_BYPASS = BLOCKED
RFID_CONCURRENCY_SAFETY = BLOCKED_LIVE_RUNTIME
INVALID_RFID_SAFE = PASS_SOURCE

ASSET_COUNT_DELTA = 0
BARCODE_HISTORY_DELTA = 0
INVENTORY_MOVEMENT_DELTA = 0
PO_DELTA = 0
JOURNAL_DELTA = 0
PAYMENT_DELTA = 0

AR_UI = PASS_READ_ONLY
EN_UI = PASS_READ_ONLY
NETWORK = PASS_READ_ONLY
CONSOLE = PASS_READ_ONLY
PERMISSIONS = PASS_SOURCE
FOCUSED_TESTS = PASS
TYPECHECK = PASS

RFID_HARDWARE_INTEGRATION = NOT_IMPLEMENTED_NOT_REQUIRED
POS_RFID_INTEGRATION = DEFERRED

NEW_RECEIVES = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = BLOCKED_RFID_RUNTIME_MUTATION_AUTHORIZATION_REQUIRED
RFID_FINAL_CLOSED = NO

GBW_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER_APPROVE_CONTROLLED_RFID_RUNTIME_TARGET
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP. Await explicit Owner approval and an authorized controlled runtime target before any RFID mutation proof. Do not start Gold By Weight automatically.**
