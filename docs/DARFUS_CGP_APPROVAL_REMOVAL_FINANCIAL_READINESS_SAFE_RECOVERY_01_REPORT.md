# DARFUS ERP — CGP Approval Removal + Financial Readiness + Safe Recovery

Control: `DARFUS-CGP-APPROVAL-REMOVAL-FINANCIAL-READINESS-SAFE-RECOVERY-01`  
Date: `2026-08-23`  
Official DB: `darfus_erp`  
Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`

## 1. Executive Summary

تم تنفيذ التغيير الجراحي المعتمد: CGP الجديد ينتقل من `DRAFT → VALIDATED → POSTED` بدون طلب موافقة جديد، مع إبقاء سجل الموافقات التاريخي للقراءة فقط. أضيفت بوابة جاهزية مالية قبل POSTING، وتم تجهيز `CUSTOMER_CREDITOR` عبر السلطة المالية canonical على الفرعين النشطين. حدثت استعادة واحدة للهدف `CGPD-000001` بواسطة Dispatcher الموجود، دون Receive أو Asset جديد.

Passed: source checks, focused CGP tests, typecheck, disposable rehearsal, backup, official financial configuration, target accounting/inventory recovery, balanced journal, one liability, and downstream consumers.  
Failed/blocked: AR/EN browser proof because the browser session was expired; Gold health returned 503; one pre-existing settlement permission-baseline test remains failing.  
Official DB risk: no new CGP document, PO, Asset, Barcode, or inventory receive was created; authorized financial configuration and existing-event accounting recovery did write rows.  
Next: Owner review of the Gate blockers only.

## 2. Owner Decisions Applied

- New CGP approval request/submit/approve/reject is disabled.
- IGP approval and the global approval subsystem remain available.
- Existing CGP approval rows remain readable and non-actionable.
- Canonical financial role authority is used; no hardcoded account ID or manual SQL business insert was used.
- Existing outbox/event and settlement authorities remain separate.
- Official DB mutation was limited to the explicitly authorized financial configuration and existing-event recovery.
- No migration was created or applied; the Docker migration command observed during the unsafe refresh attempt reported no migrations executed.

## 3. Pre-change Baseline

Read-only baseline on `darfus_erp` before the official configuration apply:

| Fact | Actual |
|---|---|
| Database | `darfus_erp` / PostgreSQL 16.15 |
| CGP documents | 2 |
| CGP approval rows | 2 |
| CGP posted outbox events | 2 |
| CGP accounting journals | 0 at baseline |
| CGP customer liabilities | 0 at baseline |
| `CUSTOMER_CREDITOR` roles | 0 |
| Account code `2500` | 0 |
| Target | `CGPD-000001`, already POSTED, existing Asset preserved |
| Worktree | pre-existing drift: 106 tracked modified, 490 untracked; not cleaned |
| `next-env.d.ts` | pre-existing Owner-accepted generated drift; not edited |

## 4. CGP Approval Dependency Audit

`gold-purchase.routes.js` exposed generic submit/approve/reject routes for both CGP and IGP. `gold-purchase-governance.service.js` created approval rows and updated legacy status projections. The canonical CGP posting route already required `businessStatus=VALIDATED` and a posting permission. The minimum safe change blocks only CGP approval mutation routes before idempotency/business work; IGP remains unchanged.

## 5. Global Approval Protection

The global `ApprovalRequest`/approval UI and non-CGP approval consumers were not removed. CGP approval history remains queryable through `/api/v1/gold-purchases/approvals` and document history. `deriveApprovalActionability()` now returns `CGP_APPROVAL_DISABLED` for CGP rows, so historical rows cannot expose an action button. IGP actionability remains pending-based.

## 6. Financial Readiness Audit

The canonical catalog had `CUSTOMER_CREDITOR` as an optional semantic role. Both active branches had the normal catalog and mappings but had zero customer-creditor roles/accounts. Accounting recognition already resolved `INVENTORY_ASSET` and `CUSTOMER_CREDITOR`; therefore the missing role was a proven blocker, not a guessed mapping.

## 7. Branch Readiness Root Cause

First-run branch creation already ran canonical financial bootstrap. There was no generic branch-create route in the current `erp.routes.js`; branch reactivation was a separate mutation path. The source now requires CGP financial readiness before branch reactivation and first-run readiness includes CGP-required roles. The read-only operational readiness endpoint accepts `workflow=CGP` and evaluates the extra role without changing supplier-receive defaults.

## 8. CGP Post Preflight Audit

`cgp-posting.service.js` now calls `assertCgpFinancialReadiness()` before document lock/update, pricing snapshot creation, audit, and outbox enqueue. The caller transaction rolls back the idempotency claim if readiness fails. Stable error: `CGP_FINANCIAL_READINESS_REQUIRED` / HTTP 422. This prevents new `POSTED`, outbox, Asset, movement, journal, and liability side effects when the required role is missing.

## 9. Design

The design is additive and fail-closed:

`CGP_REQUIRED_FINANCIAL_ROLE_CODES = [INVENTORY_ASSET, CUSTOMER_CREDITOR]`

The default global financial catalog is unchanged. `reconcile()` and `evaluateReadiness()` accept an explicit required-role list, and only the CGP/first-run/reactivation callers request the optional role.

## 10. Source Changes

Intentional files changed in this control:

- `backend/src/services/financial-account-catalog.service.js`
- `backend/src/services/financial-bootstrap.service.js`
- `backend/src/services/cgp-posting.service.js`
- `backend/src/services/first-run-bootstrap.service.js`
- `backend/src/services/first-run-setup-state.service.js`
- `backend/src/services/operational-readiness.service.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/routes/gold-purchase.routes.js`
- `backend/src/services/gold-purchase-governance.service.js`
- `features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx`
- `backend/tests/cgp-governance-immutable-actionability.test.cjs`
- `tests/cgp-approval-removal-financial-readiness.test.cjs`

Pre-existing modifications in the same worktree were not claimed or cleaned.

## 11. Tests

- Focused new/updated CGP tests: **PASS**.
- Selected CGP governance, resolver, outbox, payment read-model, settlement-authority, localization, and legacy-isolation tests: **29/29 PASS**.
- `npm run typecheck`: **PASS**.
- `node --check` for all changed backend JavaScript files: **PASS**.
- `backend/tests/cgp-settlement-http-ui-contract.test.cjs`: **FAIL pre-existing** because `permission-baseline-v1.js` does not contain `gold_purchase.cgp.settle`; no unrelated permission change was made.
- Next build: **NOT RUN**, per the active `next-env.d.ts`/acceptance guardrail.

## 12. Backup

The first host backup utility attempt could not find host `pg_dump`; no valid dump was produced by that attempt. The container PostgreSQL tool was then used against the exact official database.

- File: [official CGP control backup](../backend/backups/darfus_erp_official_cgp_control_20260823.dump)
- Format: PostgreSQL custom format
- Size: `746909` bytes
- SHA-256: `D38D33E48E3B5A45C0333A5FF9FC19B5083C2A5BD8BB0B8D3B33CAE85A6A59BD`
- `pg_restore -l`: valid archive catalog read successfully

## 13. Disposable Rehearsal

Clone: `darfus_erp_cgp_rehearsal_20260823_01`.  
Target check: `SELECT current_database()` returned the clone name, never `darfus_erp`.  
Canonical reconcile created one customer-creditor account and one role for the rehearsal branch, created zero mappings, and returned `READY`. The clone was made from a full custom-format dump; no official business rows were used for the rehearsal mutation.

## 14. Main Financial Readiness Apply

Inside one transaction, the active database check returned `darfus_erp`, baseline role/account counts were both zero, and the canonical service reconciled both active branches:

| Branch | Status | Created accounts | Created roles | Created mappings |
|---|---:|---:|---:|---:|
| Branch-2 | READY | 1 | 1 | 0 |
| Branch-1 | READY | 0 | 1 | 0 |

Final official counts: one company account code `2500`, two branch roles, no new CGP document.

## 15. Runtime Parity

The normal Docker command includes `npm run db:migrate && npm start`. A refresh attempt caused the command to run, but its output explicitly reported: `No migrations were executed, database schema was already up to date.` The process was stopped to prevent any further migration command. A no-migration runtime container was then started from the current mounted source on port 8000.

Unauthenticated health proof:

- `/api/v1/health`: HTTP 200
- `/api/v1/health/db`: HTTP 200
- `/api/v1/health/redis`: HTTP 200
- `/api/v1/health/gold`: HTTP 503; provider/config health remains unresolved and was not changed in this control.

## 16. Existing Event Recovery

No `POST /api/v1/purchase-orders/receive`, CGP create, or CGP post request was sent. The existing outbox dispatcher automatically resumed existing events after the financial role became available. Target `CGPD-000001` was recovered once through its existing event; no repost was issued.

An already-existing second event for `CGPD-000002` was also picked up by the enabled background dispatcher during the same window. It was not created by this control and no cleanup/rollback was performed. This scope widening is recorded as a residual operational risk.

## 17. Inventory Exactly-Once Proof

For `CGPD-000001`:

- document: one existing document, still `POSTED`, version 5;
- Asset: exactly 1 existing Asset `CGPA-e7b09e18b14e4649bad9101a14`;
- Barcode: exactly 1 `GWANK24000001`;
- origin: exactly 1 CGP origin;
- movements: 2 lifecycle evidence rows for the same Asset/event source;
- no second Asset, Barcode, or source movement was created.

## 18. Accounting Proof

Target journal `JE-1787503794404` is `posted` with total debit `5432.89100000` and total credit `5432.89100000`. It has two lines and source type `CUSTOMER_GOLD_PURCHASE_ACCOUNTING_RECOGNITION`. Accounting authority and source-event lineage are preserved.

## 19. Liability Proof

Exactly one open `CustomerGoldPurchaseLiability` exists for `CGPD-000001`, linked to the target event and target journal, with original/outstanding amount `5432.8910` and settled amount `0.0000`. No settlement was executed.

## 20. Downstream Integration Proof

For the target event, `INVENTORY`, `ACCOUNTING`, `GOLD_CENTER`, and `CRM` integration statuses are all `SUCCEEDED`, each with one attempt. The outbox event is `PUBLISHED`. The stale `last_error` text retained on the outbox row is historical observability residue and does not change the published status.

## 21. Asset Availability Proof

The target Asset is `AVAILABLE`, belongs to Branch-2, has the CGP profile, and retains its existing barcode and origin. No POS sale or settlement was executed in this control.

## 22. Settlement UI Proof

The source UI now displays a nontechnical state when a posted CGP has no payable: Arabic `لا يمكن إتاحة التسوية لأن التكامل المالي للعملية لم يكتمل بعد.` / English `Settlement is not available because financial integration has not completed yet.` The settlement route remains separate and does not create its own journal or liability math.

Live browser read-only proof could not reach the authenticated CGP screen because the current browser session redirected to `/ar/login`. No credentials were entered and no login data was transmitted.

## 23. Approval Requests Regression

CGP approval rows remain readable. All CGP approval rows are non-actionable with `CGP_APPROVAL_DISABLED`. IGP route and actionability tests passed. The global approvals screen and non-CGP approval permissions remain present.

## 24. `.map` Defensive Hardening

No `.map` code was changed. The prior forensic report did not reproduce the historical `.map` root cause, so no false causal claim or unrelated hardening was introduced.

## 25. AR/EN Browser Proof

**BLOCKED_AUTH_REQUIRED.** A new read-only browser tab loaded the local route, then the application redirected to Arabic login because the existing session was expired. No password, token, or sensitive data was entered. Therefore AR/EN authenticated browser proof is not marked PASS.

## 26. Documentation Sync

This report is the required documentation artifact. No historical forensic report was rewritten. The source comments document the CGP-specific role requirement and fail-closed preflight. Client/end-user manuals were not changed.

## 27. Security

- No secret, API key, password, or token was printed in this report.
- No browser login was attempted.
- Company/branch are resolved server-side.
- No new permission was granted.
- Idempotency and transaction boundaries remain in the canonical route/service.
- No production endpoint was contacted.

## 28. DB Final Integrity

Final official high-level counts:

| Entity | Count |
|---|---:|
| CGP documents | 2 |
| CGP items | 2 |
| CGP Assets | 2 |
| CGP origins | 2 |
| CGP movements | 4 |
| CGP outbox events | 2 |
| CGP journals | 2 |
| CGP liabilities | 2 |
| CGP approval rows | 2 |
| `CUSTOMER_CREDITOR` roles | 2 |
| account code `2500` | 1 |

The extra CGP-000002 journal/liability rows belong to an already-existing event and were created by the background dispatcher, not by a new Receive. No direct SQL business INSERT/UPDATE/DELETE was executed.

## 29. Problem Prevention Lessons

- Approval removal must be enforced at both UI and server route boundaries.
- Optional semantic roles must be requested by the business workflow that needs them.
- Readiness must run before POSTED/outbox effects, inside the caller transaction.
- Background dispatcher scope must be explicitly controlled during one-target recovery.
- A host without `pg_dump` must use a verified database-container backup path before official configuration writes.
- Expired browser sessions must block acceptance evidence rather than be bypassed.

## 30. Remaining Risks

| Risk | Severity | Status |
|---|---|---|
| Authenticated AR/EN browser proof unavailable | P1 acceptance blocker | Owner action required: authenticated session |
| Settlement permission absent from current baseline catalog test | P1 financial readiness gap, pre-existing | Separate owner decision; not changed here |
| Gold health 503 | P2 provider/config risk | Separate Gold Center control |
| Dispatcher processed pre-existing CGPD-000002 as well as target | P2 scope/observability risk | No new business document; no cleanup performed |
| Stale outbox last-error text after publish | P3 observability | Deferred |

## 31. Gate

`GATE = BLOCKED_CGP_AR_EN_BROWSER_AUTH_AND_PREEXISTING_SETTLEMENT_PERMISSION_BASELINE_GAP`

The core authority implementation, financial readiness apply, disposable rehearsal, official backup, and target recovery passed. The success gate is not declared because authenticated AR/EN browser proof is unavailable and the existing settlement permission-baseline regression remains unresolved. This is not a failure of the new CGP approval guard or the target accounting recovery.

## 32. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CGP-APPROVAL-REMOVAL-FINANCIAL-READINESS-SAFE-RECOVERY-01
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_BACKUP = VERIFIED_NONEMPTY_CUSTOM_FORMAT
BACKUP_SIZE_BYTES = 746909
BACKUP_SHA256 = D38D33E48E3B5A45C0333A5FF9FC19B5083C2A5BD8BB0B8D3B33CAE85A6A59BD
DISPOSABLE_REHEARSAL = PASS
DISPOSABLE_REHEARSAL_DB = darfus_erp_cgp_rehearsal_20260823_01
OFFICIAL_FINANCIAL_CONFIG_APPLY = PASS
OFFICIAL_CONFIG_ROWS_CREATED = 3
NEW_CGP_RECEIVE = NO
NEW_CGP_DOCUMENT = NO
NEW_PO = NO
NEW_ASSET = NO
NEW_BARCODE = NO
NEW_INVENTORY_RECEIVE_MOVEMENT = NO
CGP_APPROVAL_NEW_FLOW = DISABLED
CGP_APPROVAL_HISTORY = READ_ONLY_PRESERVED
CGP_LIFECYCLE = DRAFT_TO_VALIDATED_TO_POSTED
CGP_POST_PREFLIGHT = PASS
CGP_REQUIRED_ROLE = CUSTOMER_CREDITOR
TARGET = CGPD-000001
TARGET_RECOVERY = ONE_EXISTING_EVENT_RECOVERED
TARGET_ASSET_COUNT = 1
TARGET_BARCODE_COUNT = 1
TARGET_JOURNAL_COUNT = 1
TARGET_LIABILITY_COUNT = 1
TARGET_JOURNAL_BALANCED = YES
TARGET_DOWNSTREAM_INTEGRATIONS = SUCCEEDED
IDEMPOTENCY_DUPLICATE_BUSINESS_RECORDS = 0
AR_BROWSER_PROOF = BLOCKED_AUTH_REQUIRED
EN_BROWSER_PROOF = BLOCKED_AUTH_REQUIRED
GOLD_HEALTH = FAIL_503_PROVIDER_CONFIG
SETTLEMENT_PERMISSION_BASELINE = PREEXISTING_GAP
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
MIGRATION_COMMAND_OBSERVED = YES_NO_PENDING_MIGRATIONS
DIRECT_SQL_BUSINESS_WRITES = 0
FOCUSED_TESTS = PASS_29_OF_29
TYPECHECK = PASS
P0_COUNT = 0
P1_COUNT = 2
P2_COUNT = 2
P3_COUNT = 1
P4_COUNT = 0
PRODUCTION_CONTACTED = NO
GATE = BLOCKED_CGP_AR_EN_BROWSER_AUTH_AND_PREEXISTING_SETTLEMENT_PERMISSION_BASELINE_GAP
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**Owner review required. Stop. Do not start a new CGP, settlement, Gold, or recovery batch automatically.**
