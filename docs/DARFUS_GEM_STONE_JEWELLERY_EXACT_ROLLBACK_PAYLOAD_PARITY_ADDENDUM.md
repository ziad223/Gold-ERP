# DARFUS ERP — Gem Stone Jewellery Exact Rollback Payload Parity Addendum

## 1. Executive Summary

تم تنفيذ فحص Evidence-only لهذا الـAddendum. تم تأكيد أن `darfus_erp` لم تتغير، وأن حالة Gem المقبولة ما زالت محفوظة. لكن لم يتم العثور على artifact يحفظ جسم الطلب الكامل للـAccepted Live Receive أو جسم طلب Disposable Clone Rollback. الموجود هو DB idempotency hash/response، وPO/Asset/Journal snapshots، والتقرير السابق؛ وهذه لا تكفي لإثبات exact request parity field-by-field.

لذلك لم يتم إعادة Receive أو Rollback أو تعديل كود، وتم إيقاف التنفيذ عند Gate المطلوب.

## 2. Scope

- Control: `DARFUS-GEM-STONE-JEWELLERY-EXACT-ROLLBACK-PAYLOAD-PARITY-ADDENDUM`
- Evidence recovery and comparison only.
- No new Receive, PO, Asset, Barcode, Movement, Journal, payment, RFID, migration, seed, cleanup, or production contact.
- Official DB: read-only.

## 3. Accepted Live Request Source

Recovered evidence sources:

1. Official `idempotency_requests` row for key `a231a335-d1cc-4255-a985-73f22f1ed499`.
2. Its request hash: `66e1c684e233467a88bac54c5d8589057965c257d07d08f16d299113f7679026`.
3. Its persisted response body, containing the accepted PO, Asset, Journal, tax snapshot, and identity values.
4. Prior Gem acceptance report containing the prepared-request summary.

Finding: the exact original request body is **not persisted** in the available artifacts. The idempotency row stores a hash and response, not the original request object. Therefore:

`ACCEPTED_LIVE_REQUEST_RECOVERED = NO — EXACT BODY UNAVAILABLE; BUSINESS EVIDENCE PARTIAL`

## 4. Rollback Clone Request Source

The prior rollback report proves that a synthetic request was submitted to the temporary backend and that the route staged a balanced journal before forced rollback. It does not include a durable full request-body artifact or request capture. The temporary backend was stopped after the prior control, and no request fixture/body was found in the repository, reports, logs, or current workspace search.

Therefore:

`ROLLBACK_CLONE_REQUEST_RECOVERED = NO — EXACT BODY UNAVAILABLE`

The prior report's summary is not treated as a substitute for an exact artifact, and no business fields are reconstructed from memory.

## 5. Allowed Harness-Only Differences

The approved non-business difference set would have been:

| Difference | Allowed |
|---|---|
| Idempotency key | Yes |
| Request/correlation ID | Yes |
| Temporary backend port | Yes |
| Clone database target | Yes |
| Forced rollback marker | Yes |
| Harness-generated timestamps not supplied as business data | Yes |
| Profile, supplier, branch, location, financial inputs, tax flags, components, pricing, notes | No |

The set is explicit, but it cannot be applied to a complete pair of request bodies because neither exact body is available.

## 6. Full Business Field Parity Matrix

The matrix below records what is provable from persisted evidence. `UNAVAILABLE` means the corresponding request-body field was not recovered; it is not a claim of equality.

| Path | Accepted Live | Rollback Clone | Match | Classification |
|---|---|---|---|---|
| profile | GEMSTONE_JEWELLERY from persisted Asset | GEMSTONE_JEWELLERY stated in rollback log/report | UNPROVEN | partial evidence |
| supplierId | SUP-001 | synthetic request summary only | UNPROVEN | request body unavailable |
| locationId | LOC-9a10f58e-4207-4512-8824-7a7b06159151 | synthetic request summary only | UNPROVEN | request body unavailable |
| branch/company context | persisted Branch-1/company | clone context stated | UNPROVEN | transport/context not full body |
| purchaseDate | 2026-08-21 | synthetic request summary only | UNPROVEN | request body unavailable |
| taxTreatment | STANDARD_VAT | synthetic request summary only | UNPROVEN | request body unavailable |
| applyVat | prepared summary says true | not captured | UNPROVEN | request body unavailable |
| taxIncluded | prepared summary says false | not captured | UNPROVEN | request body unavailable |
| items[0].itemCode | RNG | synthetic request summary says RNG | NOT EXACTLY PROVEN | summary only |
| items[0].unitCost | 2692 | synthetic request summary says 2692 | NOT EXACTLY PROVEN | summary only |
| perPiece[0].purchaseCost | 2692 | synthetic request summary says 2692 | NOT EXACTLY PROVEN | summary only |
| perPiece[0].sellingPrice | 7000 from Asset/response | synthetic request summary says 7000 | NOT EXACTLY PROVEN | summary only |
| perPiece[0].grossWeight | 10 from Asset/response | synthetic request summary says 10 | NOT EXACTLY PROVEN | summary only |
| perPiece[0].netGoldWeight | 9.60 from Asset/response | derived/stated in prior proof | UNPROVEN as request field | summary only |
| perPiece[0].karat | 21 from Asset/response | synthetic request summary says 21 | NOT EXACTLY PROVEN | summary only |
| declared totalGemCarat | 2 CT in prior acceptance evidence | synthetic request summary says 2 CT | NOT EXACTLY PROVEN | summary only |
| components length | 1 in prior acceptance evidence | synthetic request summary says 1 | NOT EXACTLY PROVEN | summary only |
| component[0].name | Ruby in prior acceptance evidence | synthetic request summary says Ruby Natural | NOT EXACTLY PROVEN | summary only |
| component[0].carat | 2 CT in prior acceptance evidence | synthetic request summary says 2 CT | NOT EXACTLY PROVEN | summary only |
| component[0].cost | 100 in prior acceptance evidence | synthetic request summary says 100 | NOT EXACTLY PROVEN | summary only |
| component master references | not present in persisted response | not captured | UNPROVEN | request body unavailable |
| settings | empty in prior acceptance summary | not durably captured | UNPROVEN | request body unavailable |
| purchase gold rate | historical snapshot/summary available | not durably captured | UNPROVEN | request body unavailable |
| making rate/current making | persisted derived values available | not durably captured | UNPROVEN | request body unavailable |
| current diamond/gem value | current component valuation 150 | not durably captured | UNPROVEN | request body unavailable |
| current valuation fields | persisted current valuation available | clone used a controlled fresh quote adapter | NOT EXACTLY PROVEN | harness exception plus missing body |
| notes/fingerprint fields | persisted PO notes available | not captured | UNPROVEN | request body unavailable |
| RFID | null in persisted Asset | not captured | UNPROVEN | request body unavailable |

`BUSINESS_FIELD_COUNT_COMPARED = 0 exact pairs`.

`BUSINESS_FIELD_MISMATCH_COUNT = UNDETERMINED`.

This is intentionally not converted to zero.

## 7. Business Payload Hash/Fingerprint Parity

The accepted idempotency hash is available: `66e1c684e233467a88bac54c5d8589057965c257d07d08f16d299113f7679026`.

The rollback request body and its canonical hash are unavailable. The existing idempotency implementation was not changed and no second canonicalizer was created.

`BUSINESS_PAYLOAD_HASH_PARITY = NOT_AVAILABLE — EXACT ROLLBACK BODY MISSING`

## 8. Gold Quote / Harness Exception Analysis

The prior rollback proof explicitly used a controlled disposable Gold freshness adapter because the restored clone quote was stale. Official main Gold health was separately read-only verified as `HTTP 200`, `HEALTHY`, `GOLDAPI_IO`, `LIVE_PROVIDER`, `AED`, fresh, and non-mock.

The prior rollback evidence recorded the controlled rate `477.33584119`, matching the accepted current valuation rate, but the original request body and the clone request body are not available for exact comparison.

`CURRENT_VALUATION_REQUEST_PARITY = GOLD_QUOTE_HARNESS_EXCEPTION — FULL REQUEST PARITY UNPROVEN`

`GOLD_QUOTE_HARNESS_EXCEPTION = YES; disposable clone freshness adapter only`

## 9. Rollback Staged Business Evidence

The prior rollback log/report proves the route reached the full transaction path and staged a balanced journal before the forced commit failure. The following values are supported by the prior staged evidence, but are not sufficient to prove request parity:

| Evidence | Staged value |
|---|---:|
| Profile | GEMSTONE_JEWELLERY |
| Selling price | 7000 |
| Component count | 1 |
| Gem detail count | 1 |
| Purchase base | 2692 |
| VAT | 376.88 |
| PO total | 3068.88 |
| Journal | Dr 3068.88 = Cr 3068.88 |

## 10. Selling Price Proof

Accepted persisted Asset price is `7000.00000000`. The prior rollback staged request summary recorded `7000`. Exact request-body parity remains unproven.

## 11. Component / CT / Weight Proof

Accepted evidence records one Ruby component, declared 2 CT, derived 0.40 g, gross 10 g, and net gold 9.60 g. The prior rollback proof records the same business summary. No exact clone request artifact exists to prove every component field byte-for-byte or field-by-field.

## 12. Purchase / VAT / Total Proof

Accepted Official DB snapshot:

- Base: `2692.00000000`
- VAT: `376.88000000`
- Total: `3068.88000000`
- Treatment: `STANDARD_VAT`
- Rate: `14%`

Prior rollback staged evidence recorded the same base/VAT/total and one VAT application. This proves staged financial behavior, not exact request parity.

## 13. Current Valuation Proof

Accepted current valuation remains:

| Field | Value |
|---|---:|
| Gold rate | 477.33584119 |
| Gold value | 4582.42407542 |
| Making value | 240.00 |
| Component value | 150.00 |
| VAT | 696.13937056 |
| Total | 5668.56344598 |

The clone used a disposable freshness adapter. Because exact request bodies are unavailable, current valuation request parity is not promoted to FULL.

## 14. Barcode Format Proof

Accepted barcode: `GSRNG21000001`. The prior rollback evidence proved the clone used the GS inventory code, RNG item code, karat 21, unique serial semantics. Clone serial equality was not required. Format behavior is PASS; exact request parity is still blocked.

## 15. Journal Balance Proof

Prior rollback staged journal was balanced at `3068.88 / 3068.88`. The accepted Official journal remains balanced at the same amount. No journal was created in this Addendum.

## 16. Undefined Replacement Proof

No named replacement, fallback business field, or silent substitution was introduced by this Addendum. `ROLLBACK_UNDEFINED_NAMED_REPLACEMENTS = 0` for the Addendum itself. This does not cure the missing request artifacts.

## 17. Official DB Immutability

Read-only recheck returned:

| Entity | Count |
|---|---:|
| purchase_orders | 11 |
| purchase_order_items | 11 |
| assets | 11 |
| asset_components | 8 |
| asset_gemstone_component_details | 1 |
| asset_gemstone_component_settings | 0 |
| journal_entries | 14 |
| journal_lines | 39 |
| idempotency_requests | 15 |
| profile_master_data | 660 |

Official identity was `darfus_erp`. Target Asset remained `AST-PUR-1787330905253-1-1-zo5f`, barcode `GSRNG21000001`, price `7000.00000000`, journal `JE-1787330905329`, balanced.

`OFFICIAL_DB_WRITES = 0`

`OFFICIAL_BUSINESS_DELTA = 0`

## 18. Existing Accepted Gem State

`EXISTING_ACCEPTED_GEM_STATE_CHANGED = NO`.

No Receive, rollback, cleanup, or business correction was run in this Addendum. The accepted state remains preserved.

## 19. P0/P1

- New P0: 0.
- New P1: 0.
- Evidence blocker: exact accepted and rollback request bodies are unavailable.
- The inherited accounting anomaly `JE-1787090870905` remains outside this Addendum and unchanged.

## 20. Closure Gate

The exact parity gate cannot pass because the required complete request pair was not recovered. The Addendum explicitly forbids reconstructing missing fields and forbids a new proof run without another Owner authorization.

`GATE = BLOCKED_GEM_STONE_EXACT_PAYLOAD_PARITY_UNPROVEN`

`GEM_STONE_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO — ADDENDUM PARITY GATE OPEN`

No next batch was started.

## 21. Final Tokens

```text
CURRENT_CONTROL = DARFUS-GEM-STONE-JEWELLERY-EXACT-ROLLBACK-PAYLOAD-PARITY-ADDENDUM
LOCAL_MAIN_DB = darfus_erp
TARGET_PO = PO-1787330905244
TARGET_ASSET = AST-PUR-1787330905253-1-1-zo5f
TARGET_BARCODE = GSRNG21000001
TARGET_JOURNAL = JE-1787330905329
ACCEPTED_LIVE_REQUEST_RECOVERED = NO_EXACT_BODY_AVAILABLE
ACCEPTED_LIVE_REQUEST_SOURCE = IDEMPOTENCY_HASH_AND_RESPONSE_PLUS_PRIOR_ACCEPTANCE_REPORT; ORIGINAL_BODY_NOT_PERSISTED
ROLLBACK_CLONE_REQUEST_RECOVERED = NO_EXACT_BODY_AVAILABLE
ROLLBACK_CLONE_REQUEST_SOURCE = PRIOR_ROLLBACK_REPORT_ONLY; REQUEST_CAPTURE_NOT_PERSISTED
BUSINESS_FIELD_COUNT_COMPARED = 0_EXACT_PAIRS
BUSINESS_FIELD_MISMATCH_COUNT = UNDETERMINED
ALLOWED_NON_BUSINESS_DIFFERENCES = KEY_REQUEST_ID_CORRELATION_ID_TEMP_PORT_CLONE_TARGET_ROLLBACK_MARKER_HARNESS_TIMESTAMPS
ACCEPTED_BUSINESS_PAYLOAD_HASH = 66e1c684e233467a88bac54c5d8589057965c257d07d08f16d299113f7679026_FULL_REQUEST_HASH
ROLLBACK_BUSINESS_PAYLOAD_HASH = NOT_AVAILABLE
BUSINESS_PAYLOAD_HASH_PARITY = NOT_AVAILABLE_EXACT_ROLLBACK_BODY_MISSING
ROLLBACK_REQUEST_BUSINESS_PAYLOAD_MATCHES_ACCEPTED_REQUEST = UNPROVEN
CURRENT_VALUATION_REQUEST_PARITY = GOLD_QUOTE_HARNESS_EXCEPTION_FULL_PARITY_UNPROVEN
GOLD_QUOTE_HARNESS_EXCEPTION = YES_DISPOSABLE_FRESHNESS_ADAPTER
ROLLBACK_STAGED_SELLING_PRICE = 7000
ROLLBACK_STAGED_COMPONENT_COUNT = 1
ROLLBACK_STAGED_GEM_DETAIL_COUNT = 1
ROLLBACK_STAGED_PURCHASE_BASE = 2692
ROLLBACK_STAGED_VAT = 376.88
ROLLBACK_STAGED_VAT_APPLICATION_COUNT = 1
ROLLBACK_STAGED_PO_TOTAL = 3068.88
ROLLBACK_STAGED_JOURNAL_BALANCED = YES
ROLLBACK_STAGED_GS_BARCODE_FORMAT = PASS
ROLLBACK_UNDEFINED_NAMED_REPLACEMENTS = 0
OFFICIAL_DB_WRITES = 0
OFFICIAL_BUSINESS_DELTA = 0
EXISTING_ACCEPTED_GEM_STATE_CHANGED = NO
NEW_RECEIVE_EXECUTED = NO
PRODUCT_CODE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS_CHANGED = 0
P0_NEW = 0
P1_NEW = 0
GATE = BLOCKED_GEM_STONE_EXACT_PAYLOAD_PARITY_UNPROVEN
GEM_STONE_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
GEM_STONE_JEWELLERY_MODULE_STATUS = OPEN_PENDING_EXACT_PARITY_EVIDENCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — Addendum evidence review complete. No Receive, no rollback rerun, no source change, and no next batch started.**
