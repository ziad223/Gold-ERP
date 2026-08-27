# DARFUS ERP — Loose Pearl Controlled Fresh Clone Receive Retry Report

## 1. Executive Summary

تم تنفيذ محاولة Receive واحدة فقط على Disposable Clone جديد، ونجحت بـ `201`. تم إثبات سلسلة Supplier V2 كاملة، ثم Exact Replay بـ `201` وSame-key changed payload بـ `409` بدون تكرار PO أو Asset أو Barcode أو Journal. قاعدة `darfus_erp` بقيت قراءة فقط ولم تُنفّذ عليها أي معاملة.

The scoped controlled-retry gate passes. A separate P2 readback gap was found: the requested `pearlColor` was not persisted and read back as `null`. No automatic fix was made.

## 2. Prior Blocked Gate

- Prior gate: `BLOCKED_LOOSE_PEARL_CLONE_RECEIVE_NOT_COMPLETED`.
- Prior response: `422 FINAL_CLIENT_PROFILE_V2_REQUIRED`.
- Prior database delta: `0`.
- Classification: invalid acceptance-request construction; the prior request omitted required `perPiece[]`.

## 3. Scope

This control used only a fresh Disposable Clone and one distinct Receive POST. No source, migration, seed, master data, official DB, production runtime, or business rollback route was changed.

Evidence directory: `backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-CONTROLLED-FRESH-CLONE-RECEIVE-RETRY/`.

## 4. Previous 422 Root Cause

The previous acceptance harness did not send the required physical-piece array. The current production builder was inspected and proven to produce `quantity: 1` at the document item level and `perPiece: [piece]` with one physical piece.

## 5. Prior Successful Request Authority

The current request was derived from the prior successful Loose Pearl canonical contract. Business parity passed for supplier, company/branch, location, purchase date, tax treatment, quantity, pre-tax unit cost, current valuation input, selling price, profile, loose details, and master-data references. Only the clone identity and idempotency key were new.

## 6. Current Builder Proof

Source inspected: `app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx`.

The real builder produces:

```text
{ ...piece, quantity: 1, perPiece: [piece] }
```

Result: `CURRENT_REAL_BUILDER_PERPIECE = PASS`; `source changes this control = 0`.

## 7. Exact Request Parity

The saved exact body is `06-exact-request.json`. Key facts:

| Field | Value |
|---|---|
| Profile | `LOOSE_PEARL` |
| Supplier | `SUP-001` |
| Company / Branch | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` / `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151` |
| Tax treatment | `STANDARD_VAT`, `taxIncluded=false`, `applyVat=true` |
| Document quantity | `1` |
| Pre-tax purchase cost | `100` |
| Current value | `120` |
| Selling price | `200` |
| Per-piece length | `1` |

## 8. perPiece Proof

`perPiece[0]` was present before dispatch, had profile `LOOSE_PEARL`, `itemIndex=0`, `pieceIndex=0`, and did not carry a physical-stock `quantity`. The outer item carried `quantity=1`; therefore `perPiece.length == document quantity`.

## 9. Official DB Baseline

Read-only proof returned `current_database() = darfus_erp`.

Baseline counts included: PO `13`, PO items `13`, Assets `13`, Asset components `10`, Pearl detail rows `1`, origins `13`, cost revisions `13`, valuations `13`, movements `13`, barcode history `13`, journal entries `16`, journal lines `45`, idempotency rows `17`, cash transactions `3`.

## 10. Clone Baseline

Clone: `darfus_erp_loose_pearl_retry_20260822_01`.

The temporary backend was bound to port `18002` and its DB target was proven with `SELECT current_database()`. Health and contract preflight passed. The clone was created from a fresh read-only dump of `darfus_erp`.

## 11. Auth/Context Preflight

All passed without printing credentials or tokens:

- `AUTH_FRESHNESS = PASS`
- `COMPANY_CONTEXT = PASS`
- `BRANCH_CONTEXT = PASS`
- `SUPPLIER_CONTEXT = VALID_CANONICAL_SUPPLIER`
- `LOCATION_CONTEXT = ACTIVE_BRANCH_SCOPED_LOCATION`
- `TAX_CONTEXT = VALID_STANDARD_VAT_DYNAMIC_POLICY`

## 12. Controlled Retry

Exactly one distinct POST was sent to `/api/v1/purchase-orders/receive` on the clone.

- HTTP: `201`
- PO: `PO-1787422781358`
- Asset: `AST-PUR-1787422781365-1-1-w2zl`
- Barcode: `PLLOS00000001`
- Journal: `JE-1787422781456`
- Controlled retry count: `1`

## 13. Business Chain

The resulting chain was one PO item → one physical Loose Pearl → one Asset → one `PRIMARY_SUBJECT` component → one origin → one cost revision → one current valuation → one movement → one barcode → one journal.

`ONE_PHYSICAL_PEARL_ONE_ASSET = PASS`.

## 14. Tax

The request used a pre-tax purchase base of `100` with dynamic configured VAT rate `14%`. The authoritative transaction result was:

- Tax base: `100`
- VAT: `14`
- PO total: `114`
- VAT application count: `1`
- No double-VAT path observed.

Current valuation was separately persisted as base `120`, VAT `16.8`, total `136.8`.

## 15. Accounting

Journal `JE-1787422781456` was posted with total debit `114` and total credit `114`. The expected three journal lines were present. Accounting remained balanced.

## 16. Supplier/AP

Supplier linkage was preserved through `SUP-001`; source PO and branch context were preserved. Cash delta was `0`; the receive created the payable-side accounting entry without a payment.

## 17. AR Readback

Authenticated readback returned `200` for the created Asset in Arabic context:

- Profile: `LOOSE_PEARL`
- Barcode: `PLLOS00000001`
- Status: `AVAILABLE`
- Net weight: `1.25`
- Pearl type: `Abalone`
- Pearl size: `1.0`

## 18. EN Readback

Authenticated readback returned `200` for the same Asset in English context with the same identity, status, weight, type, size, and location. No second Asset was created.

## 19. POS Read-only

Barcode search returned exactly one result:

- `isProduct = false`
- Profile `LOOSE_PEARL`
- Available Asset count `1`
- Correct branch
- Asset price `200`
- No Product fallback result

No checkout was executed.

## 20. Idempotency Exact Replay

The exact saved body and exact key were replayed once after the successful `201`. The response was `201` and returned the same PO, Asset, and Barcode. Business delta after replay was `0`.

The persisted idempotency record remained `purchase.receive / succeeded / 201` with request hash:

`08748221bf79886609655eabc5b4db90d09678ff0f6f56148ea0f269de043d4a`

## 21. Idempotency Changed Payload Conflict

The same key with `items[0].sellingPrice` changed from `200` to `201` was sent once. Backend evidence recorded HTTP `409`. No PO, Asset, Barcode, Journal, or other business row was added.

## 22. Failure/Retry Governance

There was no failed Receive POST in this control. A preflight-only artifact construction error initially placed a forbidden nested `quantity` inside `perPiece[0]`; the exact artifact was corrected before the single Receive POST. The resulting shared preview passed, and no persistence occurred during the correction.

`AUTOMATIC_RETRY = NO`; `SECOND_RETRY = NO`; `THIRD_ATTEMPT = BLOCKED`.

## 23. Business Rollback Authority

`BUSINESS_ROLLBACK_ROUTE = NOT_SUPPORTED` remains unchanged. Recovery authority is transaction atomicity before commit, idempotency protection, evidence-first stop, and any future Owner-approved explicit Supplier Receive reversal workflow. Dropping the clone was environment cleanup, not business rollback.

## 24. Clone Cleanup

The temporary backend container was stopped/removed and the exact disposable database was dropped after all evidence was captured. `DROP_CLONE = ENVIRONMENT_CLEANUP`.

## 25. Official DB Zero Delta

Final read-only proof returned `current_database() = darfus_erp` and the same baseline counts. Official PO, Asset, barcode, journal, idempotency, and cash deltas were all `0`.

## 26. New Lessons

One P2 readback gap was found and not fixed:

- Requested `looseDetails.pearlColor = Black` was present in the exact builder payload.
- `normalizeLooseDetails` currently normalizes `color` / `stoneColor`, not `pearlColor`.
- The Asset detail readback returned `pearlColor = null`.
- This is recorded as `LP003` in `22-new-lessons.json`.

This did not affect the one-Asset, barcode, tax, payable, journal, replay, or official-DB safety proofs, but it must be owner-reviewed before treating all Loose Pearl field persistence as closed.

## 27. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| P0 | 0 | None |
| P1 | 0 | None |
| P2 | 1 | `pearlColor` request-to-Asset readback persistence gap |

## 28. Gate

`GATE = PASS_LOOSE_PEARL_CONTROLLED_FRESH_CLONE_RECEIVE_RETRY`

This is a scoped pass for the single fresh-clone retry, business chain, accounting/tax, AR/EN, POS, exact replay, conflict, and official zero-delta requirements. The P2 field gap remains open for Owner review; no official receive is authorized by this report.

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-CONTROLLED-FRESH-CLONE-RECEIVE-RETRY
LOCAL_MAIN_DB = darfus_erp
PRIOR_GATE = BLOCKED_LOOSE_PEARL_CLONE_RECEIVE_NOT_COMPLETED
PRIOR_FAILURE = 422_FINAL_CLIENT_PROFILE_V2_REQUIRED
PRIOR_FAILURE_DB_DELTA = 0
CURRENT_REAL_BUILDER_PERPIECE = PASS
REQUEST_PERPIECE_PRESENT = YES
REQUEST_PERPIECE_LENGTH = 1
DOCUMENT_QUANTITY = 1
PRIOR_SUCCESSFUL_CONTRACT_PARITY = PASS
AUTH_FRESHNESS = PASS
COMPANY_CONTEXT = PASS
BRANCH_CONTEXT = PASS
SUPPLIER_CONTEXT = VALID_CANONICAL_SUPPLIER
LOCATION_CONTEXT = ACTIVE_BRANCH_SCOPED_LOCATION
CONTROLLED_RETRY_COUNT = 1
CONTROLLED_RETRY_HTTP = 201
SAME_CAUSE_REPEAT = 0
THIRD_ATTEMPT = BLOCKED
ONE_PHYSICAL_PEARL_ONE_ASSET = PASS
BARCODE = PASS_PLLOS00000001
ACCOUNTING = PASS
TAX_APPLICATION_COUNT = 1
AR_READBACK = PASS
EN_READBACK = PASS
POS_READ_ONLY = PASS
IDEMPOTENCY_EXACT_REPLAY = PASS_201_ZERO_DELTA
IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS_409_ZERO_DELTA
BUSINESS_ROLLBACK_ROUTE = NOT_SUPPORTED
PRODUCT_SOURCE_CHANGE_THIS_CONTROL = 0
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
OFFICIAL_LOCAL_MAIN_RECEIVE_EXECUTED = NO
OFFICIAL_DB_BUSINESS_DELTA = 0
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1
GATE = PASS_LOOSE_PEARL_CONTROLLED_FRESH_CLONE_RECEIVE_RETRY
LOOSE_PEARL_MODULE_STATUS = PRE_OFFICIAL_SAFETY_GATES_PASS_READY_FOR_OWNER_REVIEW_WITH_P2_READBACK_GAP
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_LP003_BEFORE_ANY_OFFICIAL_RECEIVE_AUTHORIZATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 30. STOP

No official Receive, second retry, third attempt, source fix, migration, deployment, cleanup of official data, or next batch was started.

**FULL CONTROLLED FRESH-CLONE RETRY COMPLETE → OWNER REVIEW → WAIT FOR EXPLICIT AUTHORIZATION**
