# DARFUS ERP — Stage B / B4 Item Lifecycle Final Closure Report

تم تنفيذ خريطة B4، إصلاح UI المحدود، الاختبارات، وإثبات runtime القراءة فقط. نجحت اختبارات دورة الحياة وAR/EN، ولم تُنفّذ أي mutation على `darfus_erp`. توقّف التنفيذ قبل أي lifecycle mutation لأن الأصل الآمن المتاح حالته `AVAILABLE` ولا يوجد انتقال B4 مملوك وقابل للعكس يمكن اختياره دون قرار Owner حرفي.

## 1. Current Reality Summary

| Concern | Actual evidence | Result |
|---|---|---|
| Official DB | `SELECT current_database()` = `darfus_erp` | Confirmed |
| Schema | `SequelizeMeta` = 91 | Unchanged |
| Asset authority | `assets.operational_status` with legacy `assets.status` normalization | Confirmed |
| Physical identity | One Asset per physical piece; barcode history remains Asset-scoped | Preserved |
| Current DB counts | Assets 14; barcode history 14; events 22; movements 19; journals 17; journal lines 48; cash transactions 3; idempotency 33 | Before/after equal |
| B1/B2/B3 | Closed historical controls | Not reopened |
| Current UI surface | Existing Asset Details page | Single read/action surface |
| Generic lifecycle mutation | No generic `/assets/:id/lifecycle` or `/assets/:id/status` route | Correctly absent |

The existing worktree was already dirty before B4. The Asset Details file was already a modified worktree file; this batch only added the lifecycle-path label mapping and translated lifecycle-history display to that current file. No unrelated drift was cleaned or reverted.

## 2. Canonical Lifecycle Matrix

Source authority: `backend/src/services/inventory-v2-runtime.service.js`, `OPERATIONAL_STATUS`, `TRANSITIONS`, `operationalStatusOf()`, and transactional `transitionAsset()`.

| From | Allowed target(s) | Owner / classification | B4 live status |
|---|---|---|---|
| `PENDING_INTEGRATION` | `AVAILABLE`, `REVERSAL_PENDING` | Supplier/CGP integration | Not B4-owned |
| `AVAILABLE` | `RESERVED`, `PENDING_TRANSFER`, `WORKSHOP`, `MISSING`, `MELTED`, `SOLD`, `REVERSAL_PENDING` | Reservation, Transfer, Workshop, Missing Case, Manufacturing, POS, CGP | No generic action |
| `RESERVED` | `AVAILABLE`, `SOLD`, `MISSING` | Reservation/POS/Missing Case | Not B4-owned |
| `PENDING_TRANSFER` | `AVAILABLE`, `MISSING` | Transfer | Not B4-owned |
| `WORKSHOP` | `AVAILABLE`, `MISSING`, `MELTED` | Workshop / Manufacturing | Not B4-owned |
| `SOLD` | `RETURNED` | Sales Return | Financial workflow required |
| `RETURNED` | `AVAILABLE` | Return Review + `inventory.returns.approve_restock` | Requires returned-review evidence |
| `MISSING` | `RETURNED` | Missing Case recovery / return workflow | Controlled; no live action |
| `MELTED` | none | Terminal manufacturing state | Terminal |
| `REVERSAL_PENDING` | `REVERSED` | CGP reversal saga | CGP-owned |
| `REVERSED` | none | Terminal CGP reversal state | Terminal |

Unknown and non-allowlisted transitions fail closed. `transitionAsset()` requires a transaction, re-reads the Asset with `FOR UPDATE`, verifies Company scope, and records the Asset Event plus linked movement.

## 3. Cross-Module Ownership

| Status/action | Canonical owner | Evidence |
|---|---|---|
| Transfer request/dispatch/receive/cancel | Transfer routes and `transfer-policy.service.js` | `inventory.transfer.*`; B1 tests |
| `AVAILABLE → WORKSHOP → AVAILABLE` | Workshop routes and `workshop-policy.service.js` | `inventory.workshop.*`; B2 tests |
| Count observation/completion | Inventory Count | B3 service explicitly does not transition Asset state |
| `SOLD` | POS/Sales | canonical sale calls `transitionAsset(... SOLD ...)` |
| `SOLD → RETURNED → AVAILABLE` | Sales Return + Return Review | `return-review` and `approve-restock` routes |
| `RESERVED` | Reservation service | reservation service owns `RESERVED` transitions |
| `MELTED` | Manufacturing | manufacturing route owns melt/consume transition |
| `REVERSAL_PENDING/REVERSED` | CGP reversal saga | module-private capabilities in runtime service |
| Generic B4 status update | None | No route exists; no duplicate authority added |

## 4. Confirmed Gaps

### Fixed in this batch

The Asset Details page previously displayed raw internal lifecycle tokens in both the “legal next transitions” field and the event history, e.g. `PENDING_TRANSFER` and `operational_status:WORKSHOP`. The UI now:

- maps actual server-provided transitions to business labels in Arabic and English;
- shows the owning canonical workflow beside each path;
- translates history status values without changing stored events;
- states that this page does not perform a generic status mutation;
- preserves the existing Return Review permission-gated controls.

### Intentionally not implemented

No generic B4 lifecycle mutation route or new permission was added. The current authority has no safe B4-owned reversible action for the available candidate Asset. Adding a generic status writer would violate cross-module ownership and create an unsafe bypass.

## 5. Source Changes

| File | Change | Classification |
|---|---|---|
| `app/[locale]/(dashboard)/inventory/[id]/page.tsx` | Added AR/EN lifecycle path labels, owner labels, and translated lifecycle-history states | Intentional B4 UI-only change on a pre-existing dirty file |
| `backend/tests/stage-b-b4-item-lifecycle.test.cjs` | Added read-only source-contract tests for the real matrix, ownership, identity, financial non-effects, idempotency hashing, and AR/EN UI | Intentional B4 test file |
| Backend routes/services/models | None | Unchanged |
| Config/secrets | None | Unchanged |
| Git cleanup | None | Not performed |

## 6. Migration / RBAC

`MIGRATION = NOT_REQUIRED`.

No status enum, table, column, permission, role link, or master data was added. Existing permissions remain authoritative:

- `inventory.view` for detail reads;
- Transfer-specific permissions for Transfer actions;
- Workshop-specific permissions for Workshop actions;
- `inventory.returns.approve_restock` for returned-item restock approval;
- existing POS/Sales and Manufacturing permissions for their owned states.

## 7. Focused Tests

| Test group | Result |
|---|---:|
| B4 lifecycle contract tests | `29/29 PASS` |
| B1 Transfer regression | PASS |
| B2 Workshop regression | PASS |
| B3 Inventory Count regression | PASS |
| POS status guard regression | PASS |
| Combined focused/regression run | `75/75 PASS` |
| `npm run typecheck` | PASS |

The tests are read-only source/contract tests. No test inserted or altered official business data.

## 8. Runtime Freshness

| Runtime | Evidence | Result |
|---|---|---|
| Backend | `http://localhost:8000/api/v1/health` = 200 | PASS |
| DB health | `http://localhost:8000/api/v1/health/db` = 200 | PASS |
| Redis health | `http://localhost:8000/api/v1/health/redis` = 200 | PASS |
| Frontend | Port 3000 has one owner after refresh; current owner PID 18080 | PASS |
| Frontend AR | Asset Details GET = 200; no error state; lifecycle labels visible | PASS |
| Frontend EN | Asset Details GET = 200; no error state; lifecycle labels visible | PASS |
| Browser console | React DevTools/HMR informational messages only; no application exception | PASS |

## 9. One Real Lifecycle Action

`LIVE_LIFECYCLE_MUTATION = NOT_RUN`.

Read-only candidate selection:

| Field | Value |
|---|---|
| Test Asset | `AST-PUR-1787434485744-1-1-9kp0` |
| Profile | `LOOSE_PEARL` |
| Barcode | `PLLOS00000001` |
| Pre-status | `AVAILABLE` |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151` |
| Active Transfer | 0 |
| Active Workshop | 0 |
| Active Reservation | 0 |
| Active Barcode | 1 |
| Current RFID | none |

No safe reversible B4-owned target exists for this candidate:

- `AVAILABLE → PENDING_TRANSFER` is Transfer-owned.
- `AVAILABLE → WORKSHOP` is Workshop-owned.
- `AVAILABLE → RESERVED` is Reservation-owned.
- `AVAILABLE → SOLD` is POS/Sales-owned and financial.
- `AVAILABLE → MELTED` is terminal/manufacturing-owned.
- `AVAILABLE → MISSING` is a high-risk missing-case mutation and requires literal Owner confirmation; it was not executed.
- `RETURNED → AVAILABLE` cannot be tested because no suitable returned Asset exists and the canonical path requires return-review evidence.

Per the B4 control, execution stopped before live mutation instead of manufacturing a destructive event or forging another module’s state.

## 10. Asset / Barcode / Branch / Location

The selected candidate read-only baseline has:

- one Asset row;
- one barcode-history row and exactly one active barcode;
- known Company, Branch, and active Location;
- no active Transfer, Workshop, or Reservation conflict;
- no RFID assignment;
- one origin, one purchase-cost revision, one current-valuation row, one event, and one movement.

The B4 UI change does not write or replace any of these identities.

## 11. Idempotency / Concurrency

The canonical runtime uses:

- transactional Asset row locking with `FOR UPDATE`;
- existing `idempotency.service.js` stable canonical hashing;
- route-specific idempotency scopes in Transfer, Workshop, Count, Return Review, and other owning modules;
- changed-payload conflict behavior through the existing hash/claim contract.

Focused proof passed:

- exact canonical body hashes equal on replay;
- changed body hashes differ;
- idempotency key itself is excluded from the body hash;
- no second lifecycle business effect was created.

Live replay was not run because no live lifecycle mutation was authorized or executed.

## 12. Financial Proof

No B4 business mutation was executed.

Official DB read-only counts before/after the B4 work are unchanged:

| Financial/inventory evidence | Before | After | Delta |
|---|---:|---:|---:|
| Assets | 14 | 14 | 0 |
| Asset Events | 22 | 22 | 0 |
| Inventory Movements | 19 | 19 | 0 |
| Journal Entries | 17 | 17 | 0 |
| Journal Lines | 48 | 48 | 0 |
| Cash Transactions | 3 | 3 | 0 |
| Idempotency Requests | 33 | 33 | 0 |

No historical cost, current valuation, Asset price, purchase origin, VAT, AP, AR, Cash, or Journal row was mutated by B4.

## 13. DB Integrity

`current_database() = darfus_erp` was verified before and after the B4 read-only/runtime work. Migration count remained 91. No INSERT/UPDATE/DELETE/TRUNCATE/seed/receive/migration occurred in this B4 batch.

`OFFICIAL_DB_WRITES = 0`.

## 14. UI / RBAC

AR and EN Asset Details both passed:

- current operational status visible;
- branch and location visible;
- barcode visible;
- lifecycle paths shown with business labels and owning workflow;
- no raw `PENDING_TRANSFER`, `REVERSAL_PENDING`, or `operational_status:*` shown in the tested page;
- no generic lifecycle status control;
- Return Review controls remain permission-gated;
- no duplicate lifecycle page or sidebar entry introduced.

## 15. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| P0 | 0 | No data loss, security, or financial corruption evidence |
| P1 | 0 | No critical regression introduced; live action was not forced |
| P2 blocking | 0 | No blocking product defect remains in the tested read surface |
| Owner gate | 1 | A literal Owner decision is required before any high-risk official lifecycle mutation |

The Owner gate is a safety stop, not permission to select a target status implicitly.

## 16. Gate

`GATE = BLOCKED_B4_PRELIVE_OWNER_CONFIRMATION_REQUIRED`

The implementation/readiness portion passes, but the B4 final closure gate is not marked `PASS_STAGE_B_B4_ITEM_LIFECYCLE_FINAL_CLOSURE` because no safe reversible B4-owned lifecycle action was available for one controlled live proof.

Permanent prevention gates registered for B4:

- `B4-PREVENT-001` — only explicit allowlisted transitions are valid;
- `B4-PREVENT-002` — cross-module-owned states cannot be forged through Item Lifecycle;
- `B4-PREVENT-003` — status changes never replace Asset identity;
- `B4-PREVENT-004` — barcode preserve/retire/replace rules are explicit;
- `B4-PREVENT-005` — Company/Branch scope and idempotency are fail-closed;
- `B4-PREVENT-006` — terminal/high-risk actions require explicit authority and literal confirmation;
- `B4-PREVENT-007` — lifecycle status does not rewrite cost, valuation, price, origin, or accounting;
- `B4-PREVENT-008` — runtime freshness is proven before critical browser acceptance.

## 17. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-B-B4-ITEM-LIFECYCLE-MINIMUM-SAFE-IMPLEMENTATION-AND-CLOSURE
LOCAL_MAIN_DB = darfus_erp

LIFECYCLE_UI_AUTHORITY = Existing Asset Details page; status/history read surface; canonical owner workflows remain separate
LIFECYCLE_API_AUTHORITY = inventoryV2Runtime.transitionAsset plus owning Transfer/Workshop/POS/Return/Reservation/Manufacturing/CGP routes
LIFECYCLE_STATUS_AUTHORITY = assets.operational_status normalized by inventory-v2-runtime.service.js; legacy assets.status compatibility field
LIFECYCLE_TRANSITION_MATRIX = Runtime TRANSITIONS allowlist; unknown/skipped transitions rejected
CROSS_MODULE_OWNERSHIP = Transfer, Workshop, Count-observation, POS/Sales, Return Review, Reservation, Manufacturing, CGP retain ownership

TEST_ASSET_ID = AST-PUR-1787434485744-1-1-9kp0
TEST_ASSET_BARCODE = PLLOS00000001
PRE_STATUS = AVAILABLE
ACTION = NOT_RUN; no safe B4-owned reversible action available
TARGET_STATUS = NOT_SELECTED
REVERSIBLE = NOT_APPLICABLE; high-risk alternatives require Owner confirmation
FINANCIAL_EFFECT = NONE; no mutation executed

SOURCE_CHANGES = Asset Details UI labels/history mapping + B4 focused contract test
MIGRATION = NOT_REQUIRED
PERMISSIONS = Existing module-specific permissions preserved; no new lifecycle permission
FOCUSED_B4_TESTS = PASS 29/29
RELEVANT_REGRESSION = PASS 46/46; combined 75/75
TYPECHECK = PASS
BACKEND_RUNTIME_FRESH = PASS; health/db/redis 200; backend unchanged
FRONTEND_RUNTIME_FRESH = PASS; single frontend owner after approved refresh; AR/EN 200
LIFECYCLE_HTTP = NOT_RUN_LIVE_MUTATION_BLOCKED_BEFORE_REQUEST

FINAL_ASSET_STATUS = AVAILABLE (candidate unchanged)
FINAL_ASSET_BRANCH = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
FINAL_ASSET_LOCATION = LOC-9a10f58e-4207-4512-8824-7a7b06159151
BARCODE_STATUS = ACTIVE; one active barcode
BARCODE_UNCHANGED = YES
RFID_UNCHANGED = YES; no RFID assigned

IDEMPOTENCY_EXACT_REPLAY = FOCUSED_HASH_PROOF_PASS; live replay NOT_RUN
IDEMPOTENCY_CHANGED_PAYLOAD = FOCUSED_HASH_CONFLICT_PROOF_PASS; live conflict NOT_RUN
JOURNAL_DELTA = 0
CASH_DELTA = 0
HISTORICAL_COST_CHANGE = 0
CURRENT_VALUATION_CHANGE = 0
ASSET_PRICE_CHANGE = 0
PRODUCT_QUANTITY_MUTATION = 0

P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
GATE = BLOCKED_B4_PRELIVE_OWNER_CONFIRMATION_REQUIRED
B4_STATUS = PRELIVE_BLOCKED_NOT_CLOSED
NEXT_RECOMMENDED_STEP = Owner must provide one literal confirmation naming the exact high-risk lifecycle action/target, or approve leaving B4 at non-mutating readiness
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Owner Confirmation Required Before Any Live Mutation

If the Owner wants a high-risk lifecycle proof, the next instruction must name exactly one target transition. The current candidate is:

```text
ASSET = AST-PUR-1787434485744-1-1-9kp0
BARCODE = PLLOS00000001
CURRENT_STATUS = AVAILABLE
BRANCH = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
LOCATION = LOC-9a10f58e-4207-4512-8824-7a7b06159151
TARGET_STATUS = <must be explicitly named by Owner>
FINANCIAL_EFFECT = none for a non-financial action; exact effect must be rechecked for any terminal/financial action
REVERSIBLE = <must be explicitly accepted by Owner>
```

No mutation was performed while preparing this request. No second lifecycle action, B-Final start, deployment, or production contact occurred.

**STOP — OWNER REVIEW REQUIRED — NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START**
