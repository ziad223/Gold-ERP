# DARFUS ERP — C2C3M Manual / Alternative Real-Browser Revision Acceptance Report

بالعربي المختصر: تم تنفيذ قبول حقيقي على المتصفح للـDisposable clone. نجحت B1 وB2 وB3 وB4 وB5 وB8 من حيث النتائج المقصودة، لكن حدث POST 201 غير مقصود من مسار AR وأنشأ Revision v11 على الـClone أثناء إغلاق إثبات المراجعة. لم يحدث أي write على `darfus_erp`. الإغلاق الكامل متوقف عند B6/B7 وNetwork wire-capture وشرح هذه الـdelta، لذلك لا أضع PASS نهائيًا.

## 1. Control, authority, and safety

| Item | Actual |
|---|---|
| Control | `DARFUS-CLIENT-C2C3M-MANUAL-ALTERNATIVE-REAL-BROWSER-REVISION-ACCEPTANCE-01` |
| Frontend | `http://localhost:3002` |
| Backend | `http://localhost:8001` |
| Mutation DB | `darfus_c2c2_revision_runtime_02` only |
| Official DB | `darfus_erp`, read-only |
| Product source files changed by C2C3M | 0 |
| Test files changed by C2C3M | 0 |
| Migrations | 0 |
| Official DB writes | 0 |
| C3 started | NO |
| Credentials/secrets recorded | NO |
| Unplanned disposable-clone mutation | 1 AR Revision v11; preserved, not cleaned |

The repository was already dirty before this control. Read-only Git inspection found HEAD `1657b0e9ba580faef69be48f04637835c201b521`, branch `main`, 111 tracked modifications and 591 untracked paths. These were not cleaned, reset, restored, stashed, or attributed to C2C3M. The C2C3M deliverables are documentation outputs.

## 2. Runtime preflight

The normal frontend was not restarted and Next dev was not started. The disposable backend was recreated with runtime-only CORS values so the isolated frontend on port 3002 could authenticate. Health and database/Redis probes returned 200, and the database identity was exact. `/health/gold` returned 503 and remains unrelated to this Revision control.

## 3. Browser scenarios

### B1 — Notes-only

One browser submission produced 201 and `Revision saved`. Revision v7 recorded one `notes` change, one `ASSET_REVISION_RECORDED` event, one audit row, and one succeeded idempotency row. Asset ID, barcode, status, branch, and location remained unchanged.

### B2 — Name + Description

One browser submission produced 201 and exactly two changes in revision v8. The refreshed detail heading reflected the new description. No dedicated field changed.

### B3 — No-op

With no effective diff the review modal did not proceed to submit. No POST was logged and database counts remained unchanged after B2.

### B4 — Rapid double submit

Two concurrent UI click calls were issued against the same submit control. Server evidence shows one POST 201, one revision v9, one change/event/audit/idempotency row, and no duplicate.

### B5 — Stale revision

A stale tab prepared a description change. A fresh tab first committed category as revision v10 with 201. The stale tab then received 409 `REVISION_CONCURRENT_CONFLICT`; the stale value did not overwrite the asset and no durable stale row was created.

### B6/B7 — Permission variants

The clone contains the permission catalog and a synthetic `sales` user with no revision permission, but no usable credential was available for that user. There is also no pre-seeded view-only role assignment. Admin has all permissions. No role, user, employee, or permission setup was created during this control. These scenarios are blocked prerequisites, not assumed passes.

### B8 — Dedicated fields

The real EN and AR editors expose only the five general metadata fields. Source and UI copy explicitly protect price, cost, barcode, weights, karat, status, branch, and location behind dedicated workflows. No dedicated operation was triggered.

### AR read-only closeout deviation

After the AR review interaction, server evidence showed one additional POST 201 at `06:42:32`, creating revision v11 with the single notes change `C2C3M-B1-NOTES-ONLY` → `C2C3M-AR-REVIEW-ONLY`. The mechanism that caused the submit is not proven from the available browser driver trace. This is classified as `UNEXPECTED_DISPOSABLE_MUTATION / ROOT_CAUSE_UNKNOWN`; the row remains preserved and no cleanup or reverse mutation was attempted.

## 4. Source and contract proof

| Authority | Evidence |
|---|---|
| Server permission authority | `backend/src/routes/asset-revision.routes.js:12-48` |
| Field allowlist/dedicated rejection | `backend/src/services/asset-revision.service.js:51-76` |
| Transaction and evidence creation | `backend/src/services/asset-revision.service.js:141-199` |
| UI request and idempotency header | `app/[locale]/(dashboard)/inventory/[id]/page.tsx:157-174` |
| Dedicated UI separation | same page `:270-275`, plus source test `tests/c2c3-revision-ui.test.cjs` |

The existing C2C3 UI contract test passed 4/4. The C2C3R policy test ran 3/4: one failure classified as pre-existing generated `next-env.d.ts` variant drift (`.next/dev` observed while the test expected build content). Per the owner/AGENTS policy, that generated file was not edited or reverted.

## 5. AR/EN browser proof

EN was observed as `ltr` and AR as `rtl`. Both routes loaded authenticated, displayed company/branch context, revision history, and the appropriate editor. EN executed B1–B5. AR opened and reviewed a temporary diff, but the final server evidence includes the unplanned v11 POST described above. Both browser error/warn logs were empty. Permission-specific proof remains blocked with B6/B7.

## 6. DB, event, audit, and identity proof

| Entity | Clone before | Clone after | Delta |
|---|---:|---:|---:|
| Assets | 18 | 18 | 0 |
| Revisions | 6 | 11 | +5, including one unplanned AR revision |
| Revision changes | 7 | 13 | +6 |
| Asset events | 71 | 76 | +5 |
| Movements | 62 | 62 | 0 |
| Journal entries | 25 | 25 | 0 |

The final candidate asset remained `AST-PUR-1787083585731-1-1-plz5` with barcode `GWRNG21000001`, status `AVAILABLE`, Branch-1, the same location, weights, karat, cost, and price. Accepted revision events/audits link the same company, branch, technical user, source operation, and old/new values. Idempotency keys and request hashes were checked and redacted in this report.

The official database was re-read as `darfus_erp`; observed counts remained assets 18, revisions 0, changes 0, events 65, movements 62, journals 25. No official mutation, cleanup, or repair occurred.

## 7. Known limitations and risks

| Item | Classification | Impact |
|---|---|---|
| No disposable view-only identity | Acceptance precondition | B6 cannot be proven |
| No usable credential for synthetic no-permission account | Acceptance precondition | B7 cannot be proven in browser |
| Browser tool exposes no Network domain | Tool limitation | only server access-log correlation, not full wire capture |
| Generated `.next/dev` next-env variant | Environment/test drift | C2C3R test remains 1 failure; file intentionally untouched |
| `/health/gold` 503 | Unrelated provider/runtime scope | not opened or changed by C2C3M |
| Unplanned AR Revision v11 | Acceptance safety / root cause unknown | preserved on Clone; no official impact |

No persistent P0/P1 data corruption was observed. However, the unplanned AR 201 is an acceptance-safety deviation with root cause not proven; it prevents a read-only acceptance claim and remains an explicit disposable delta.

## 8. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C3M-MANUAL-ALTERNATIVE-REAL-BROWSER-REVISION-ACCEPTANCE-01
FRONTEND_TARGET = http://localhost:3002
BACKEND_TARGET = http://localhost:8001
DISPOSABLE_DB = darfus_c2c2_revision_runtime_02
OFFICIAL_DB = darfus_erp

REAL_BROWSER_PREFLIGHT = PASS
B1_NOTES = PASS
B2_NAME_DESCRIPTION = PASS
B3_NO_OP = PASS
B4_DOUBLE_SUBMIT = PASS
B5_STALE_CONFLICT = PASS
B6_VIEW_ONLY = BLOCKED_PRESEEDED_IDENTITY_UNAVAILABLE
B7_NO_PERMISSION = BLOCKED_AUTHENTICATED_CREDENTIAL_UNAVAILABLE
B8_DEDICATED_FIELDS = PASS
AR_BROWSER = FAIL_UNEXPECTED_DISPOSABLE_MUTATION
EN_BROWSER = PASS_WITH_PERMISSION_VARIANT_BLOCKED
SERVER_NETWORK_CORRELATION = PASS
BROWSER_NETWORK_WIRE_CAPTURE = NOT_AVAILABLE_IN_TOOL
CONSOLE_BLOCKERS = 0
OFFICIAL_DB_WRITES = 0
DISPOSABLE_DB_WRITES = ACCEPTED_C2C3M_REVISION_EVIDENCE_PLUS_ONE_UNPLANNED_AR_REVISION
UNEXPECTED_DISPOSABLE_MUTATIONS = 1
PRODUCT_CODE_FILES_CHANGED_BY_C2C3M = 0
TEST_FILES_CHANGED_BY_C2C3M = 0
MIGRATIONS = 0
P0 = 0
P1 = 0
P2 = 1

GATE = BLOCKED_C2C3M_REQUIRED_PERMISSION_VARIANTS_NETWORK_WIRE_PROOF_AND_UNEXPECTED_CLONE_MUTATION
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_UNPLANNED_AR_CLONE_MUTATION_THEN_USE_ISOLATED_PERMISSION_IDENTITIES_AND_NETWORK_CAPTURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No C3, no source fix, no DB cleanup, no new revision, and no further permission setup was started.
