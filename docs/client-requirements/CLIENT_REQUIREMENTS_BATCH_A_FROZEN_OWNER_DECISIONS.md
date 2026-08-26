# DARFUS ERP — Batch A Owner / Architecture Decisions

Control ID: `DARFUS-CLIENT-BATCH-A-OWNER-ARCHITECTURE-DECISIONS-01`  
Project: `I:\WORK\jewellery-erp-master`  
Official DB: `darfus_erp`  
Mode: `OWNER_ARCHITECTURE_DECISIONS_ONLY / READ_ONLY`

## Decision Gate Status

This record is an evidence-backed decision request. The six recommendations below are not treated as Owner decisions because no explicit Owner acceptance was supplied in the current control. Therefore the authority is not frozen and Batch B is not authorized.

```text
D01 = BLOCKED_FOR_OWNER_DECISION
D02 = BLOCKED_FOR_OWNER_DECISION
D03 = BLOCKED_FOR_OWNER_DECISION
D04 = BLOCKED_FOR_OWNER_DECISION
D05 = BLOCKED_FOR_OWNER_DECISION
D06 = BLOCKED_FOR_OWNER_DECISION
GATE = BLOCKED_CLIENT_BATCH_A_OWNER_DECISION_INCOMPLETE
```

## Evidence Baseline

- The prior exact-parity matrix contains 191 atomic requirements.
- The existing conflict register explicitly records `CR-EMP-001`, `CR-BC-001`, `CR-BC-002`, `CR-BC-003`, `CR-CGP-001` and `CR-CGP-002`.
- Current source evidence includes the fail-closed User/RBAC + Employee operator model, canonical ERG/NCK barcode master authority, barcode history/replacement concepts and durable CGP compensation/event services.
- No source, test, DB, migration, seed, security, barcode, revision, CGP or invoice implementation was performed for this decision gate.

## Required Owner Response

Each `OWNER_DECISION` must be replaced explicitly with exactly one of the listed frozen values. A recommendation is not an approval.

| Decision | Client wording | Current authority | Owner decision | Frozen authority | Downstream batches |
|---|---|---|---|---|---|
| D01 / CR-EMP-001 | Same-branch employees may use one shared system account/branch-level permission behavior; Employee Role is organizational and Employee Code identifies the responsible employee. | User/Auth/RBAC authorizes; Employee is business/operator identity; Employee Code/PIN provides verified attribution; Company/Branch are server-authoritative and fail-closed. | `NOT_SUPPLIED` — choose `USER_RBAC_PLUS_EMPLOYEE_OPERATOR` or `SHARED_BRANCH_ACCOUNT_MODEL`. | Not frozen. Current security authority remains unchanged pending decision. | B Employee Identity + Attribution |
| D02 / CR-BC-001 | Code table says Earrings=`ERG`; visual example contains `GPERR...`. | Current client-approved barcode master and DARFUS source use `ERG`; official DB has ERG and no ERR. | `NOT_SUPPLIED` — choose `ERG` or `ERR`. | Not frozen. No barcode mapping is changed. | C Barcode Exact Parity |
| D03 / CR-BC-002 | Code table says Necklace=`NCK`; visual example contains `GSNLC...`. | Current client-approved barcode master and DARFUS source use `NCK`; official DB has NCK and no NLC. | `NOT_SUPPLIED` — choose `NCK` or `NLC`. | Not frozen. No barcode mapping is changed. | C Barcode Exact Parity |
| D04 / CR-BC-003 | Same physical item keeps identity while versions v1/v2/v3 record repair/weight/stone/size changes. | One Asset identity, barcode history, replacement/retirement history and `barcodeRevision` concepts exist; separate exact client revision workflow is not proven. | `NOT_SUPPLIED` — choose `CURRENT_HISTORY_FIRST` or `NEW_EXPLICIT_REVISION_MODEL`. | Not frozen. Existing history remains the only active authority. | C Barcode Exact Parity |
| D05 / CR-CGP-001 | Client uses rollback/failure-recovery wording. | Transaction rollback before durable commit; idempotency/outbox/inbox/retry; compensation/reversal after durable publication; audit preserved. | `NOT_SUPPLIED` — choose `TRANSACTION_ROLLBACK_BEFORE_COMMIT_AND_COMPENSATION_AFTER_DURABLE_COMMIT` or an explicitly named alternative. | Not frozen as a client terminology mapping; destructive event deletion remains forbidden. | E CGP Invoice Projection and all CGP changes |
| D06 / CR-CGP-002 | Customer Gold Purchase should expose Invoice Number, Search, Detail, Print, Employee and Historical Reconstruction. | CGP remains DRAFT → VALIDATED → POSTED source authority; settlement/reversal are separate; current unified invoice search excludes CGP. | `NOT_SUPPLIED` — choose `READ_ONLY_PROJECTION_OVER_CURRENT_CGP` or `CONVERT_CGP_TO_GENERIC_INVOICE_DOMAIN`. | Not frozen. Current CGP posting authority remains unchanged. | E CGP Invoice Projection; D2 Invoice Search & Print |

## Decision Details

### D01 — Employee / User / Permission Model

```text
DECISION_ID = CR-EMP-001
CLIENT_REQUIREMENT = Same-branch employees may use one shared system account; Employee Role is organizational; Employee Code identifies the responsible employee.
CURRENT_AUTHORITY = User/Auth/RBAC is authorization; Employee/operator identity and Employee Code/PIN are attribution; Company/Branch are fail-closed server context.
CURRENT_IMPLEMENTATION = Technical User plus optional branch-shell account, verified Employee operator session, server-side operator policy and branch checks.
EXACT_CONFLICT = Literal shared-account/branch-permission wording conflicts with current dual-identity least-privilege authority.
RISK_IF_WRONG = Shared credentials can weaken least privilege, attribution and auditability; changing current authority can block existing operations.
OPTION_A = USER_RBAC_PLUS_EMPLOYEE_OPERATOR
OPTION_B = SHARED_BRANCH_ACCOUNT_MODEL
RECOMMENDATION = OPTION_A
OWNER_DECISION = NOT_SUPPLIED
WHY = Option A preserves current fail-closed User/RBAC, server attribution and audit identity without shared credentials.
FROZEN_AUTHORITY = NOT_FROZEN_PENDING_OWNER_DECISION
IMPLEMENTATION_IMPACT = If A, B may implement attribution without security-model replacement. If B, a separate threat review, audit redesign and explicit security gate are required.
DECISION_STATUS = BLOCKED_FOR_OWNER_DECISION
```

### D02 — Earrings Barcode Code

```text
DECISION_ID = CR-BC-001
CLIENT_REQUIREMENT = Earrings code is ERG in the code table; the GP mockup contains GPERR.
CURRENT_AUTHORITY = Client-approved barcode master and current DARFUS source/DB use ERG.
CURRENT_IMPLEMENTATION = ERG is active; ERR is not the current master authority.
EXACT_CONFLICT = Client table and visual example disagree.
RISK_IF_WRONG = Changing to ERR can invalidate item identity, sequences, history and downstream references.
OPTION_A = EARRINGS_CODE_ERG
OPTION_B = EARRINGS_CODE_ERR
RECOMMENDATION = OPTION_A
OWNER_DECISION = NOT_SUPPLIED
WHY = The table and current system agree; ERR is only present in an illustrative example.
FROZEN_AUTHORITY = NOT_FROZEN_PENDING_OWNER_DECISION; CURRENT_ERG_REMAINS_OPERATIONAL
IMPLEMENTATION_IMPACT = No implementation now. A future decision for ERR would require compatibility analysis before any mapping or migration.
DECISION_STATUS = BLOCKED_FOR_OWNER_DECISION
```

### D03 — Necklace Barcode Code

```text
DECISION_ID = CR-BC-002
CLIENT_REQUIREMENT = Necklace code is NCK in the code table; the Gem Stone mockup contains GSNLC.
CURRENT_AUTHORITY = Client-approved barcode master and current DARFUS source/DB use NCK.
CURRENT_IMPLEMENTATION = NCK is active; NLC is not the current master authority.
EXACT_CONFLICT = Client table and visual example disagree.
RISK_IF_WRONG = Changing to NLC can invalidate item identity, sequences and historical references.
OPTION_A = NECKLACE_CODE_NCK
OPTION_B = NECKLACE_CODE_NLC
RECOMMENDATION = OPTION_A
OWNER_DECISION = NOT_SUPPLIED
WHY = The table and current system agree; NLC appears only in an illustrative mockup.
FROZEN_AUTHORITY = NOT_FROZEN_PENDING_OWNER_DECISION; CURRENT_NCK_REMAINS_OPERATIONAL
IMPLEMENTATION_IMPACT = No implementation now. A future NLC decision requires compatibility analysis before any mapping or migration.
DECISION_STATUS = BLOCKED_FOR_OWNER_DECISION
```

### D04 — Item Revision v1/v2

```text
DECISION_ID = CR-BC-003
CLIENT_REQUIREMENT = Same Asset/physical item keeps identity while changes are represented as v1/v2/v3 history.
CURRENT_AUTHORITY = One physical piece = one Asset; barcode identity/history and replacement/retirement history are current authorities.
CURRENT_IMPLEMENTATION = Asset events, barcode history, replacement and barcodeRevision concepts exist; a separate client revision workflow is not proven.
EXACT_CONFLICT = It is not proven that current replacement/history carries every requested version number, changed field, old value, new value, actor, timestamp and reason as one revision contract.
RISK_IF_WRONG = A new parallel revision model could duplicate identity; treating incomplete history as exact could lose audit meaning.
OPTION_A = CURRENT_HISTORY_FIRST
OPTION_B = NEW_EXPLICIT_REVISION_MODEL
RECOMMENDATION = OPTION_A
OWNER_DECISION = NOT_SUPPLIED
WHY = Simple-first proof of current history avoids unnecessary schema/UI and preserves one Asset authority.
FROZEN_AUTHORITY = NOT_FROZEN_AS_CLIENT_EQUIVALENCE; EXISTING_HISTORY_REMAINS_OPERATIONAL
IMPLEMENTATION_IMPACT = Batch C must first map current history fields; only a proven gap may justify a minimum revision layer.
DECISION_STATUS = BLOCKED_FOR_OWNER_DECISION
```

### D05 — CGP Rollback Meaning

```text
DECISION_ID = CR-CGP-001
CLIENT_REQUIREMENT = Rollback/failure recovery must avoid partial business damage.
CURRENT_AUTHORITY = DB transaction before durable commit; idempotency and outbox/inbox; compensation/reversal after durable publication; audit preserved.
CURRENT_IMPLEMENTATION = CGP posting/reversal/compensation and durable event services exist.
EXACT_CONFLICT = Client rollback wording is ambiguous against durable post-publication recovery.
RISK_IF_WRONG = Destructive event deletion can orphan inventory/accounting/gold evidence and destroy audit history.
OPTION_A = TRANSACTION_ROLLBACK_BEFORE_COMMIT_AND_COMPENSATION_AFTER_DURABLE_COMMIT
OPTION_B = DESTRUCTIVE_ROLLBACK_AFTER_DURABLE_EVENTS
RECOMMENDATION = OPTION_A
OWNER_DECISION = NOT_SUPPLIED
WHY = Option A preserves durable evidence, idempotency and accounting/inventory reconciliation.
FROZEN_AUTHORITY = NOT_FROZEN_AS_CLIENT_TERMINOLOGY_MAPPING; DESTRUCTIVE_DELETION REMAINS FORBIDDEN
IMPLEMENTATION_IMPACT = Future CGP projection must display safe recovery states without adding destructive rollback.
DECISION_STATUS = BLOCKED_FOR_OWNER_DECISION
```

### D06 — CGP Invoice Architecture

```text
DECISION_ID = CR-CGP-002
CLIENT_REQUIREMENT = Customer Gold Purchase exposes Invoice Number, Search, Detail, Print, Employee and Historical Reconstruction.
CURRENT_AUTHORITY = CGP aggregate and DRAFT → VALIDATED → POSTED remain source authority; settlement/reversal are separate.
CURRENT_IMPLEMENTATION = CGP document/business view exists; unified Invoice Search & Print currently excludes Customer Gold Purchase.
EXACT_CONFLICT = Client invoice artifact vocabulary could be implemented as a safe projection or could incorrectly duplicate generic Invoice authority.
RISK_IF_WRONG = Converting CGP into generic Invoice risks duplicate posting, lifecycle/status confusion and accounting mismatch.
OPTION_A = KEEP_CGP_AGGREGATE_PLUS_ADD_READ_ONLY_INVOICE_PROJECTION
OPTION_B = CONVERT_CGP_TO_GENERIC_INVOICE_DOMAIN
RECOMMENDATION = OPTION_A
OWNER_DECISION = NOT_SUPPLIED
WHY = Option A satisfies the read/search/print surface without moving CGP business ownership or posting authority.
FROZEN_AUTHORITY = NOT_FROZEN_AS_CLIENT_PROJECTION_DECISION; CURRENT_CGP_POSTING_REMAINS_OPERATIONAL
IMPLEMENTATION_IMPACT = Future E/D2 work may build a read-only adapter only after the Owner chooses A or B.
DECISION_STATUS = BLOCKED_FOR_OWNER_DECISION
```

## Cross-Decision Consistency

| Authority check | Result |
|---|---|
| SECURITY_AUTHORITY_PRESERVED | YES — no security change performed; current User/RBAC remains active. |
| BARCODE_IDENTITY_AUTHORITY_PRESERVED | YES — no barcode code or sequence changed. |
| ASSET_IDENTITY_AUTHORITY_PRESERVED | YES — no Asset/revision implementation performed. |
| CGP_POSTING_AUTHORITY_PRESERVED | YES — no CGP flow or posting route changed. |
| ACCOUNTING_AUTHORITY_PRESERVED | YES — no accounting change or DB write performed. |

## Safety Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-BATCH-A-OWNER-ARCHITECTURE-DECISIONS-01
CURRENT_BATCH = A
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
DB_WRITES = 0
MIGRATIONS = 0
BUSINESS_FEATURES_IMPLEMENTED = 0
SECURITY_CHANGE = NO
BARCODE_CHANGE = NO
REVISION_IMPLEMENTATION = NO
CGP_CHANGE = NO
INVOICE_IMPLEMENTATION = NO
CRM_IMPLEMENTATION = NO
PRODUCTION_CONTACTED = NO
```

## Gate

```text
D01_EMPLOYEE_SECURITY = NOT_FROZEN; RECOMMENDATION USER_RBAC_PLUS_EMPLOYEE_OPERATOR
D02_EARRINGS_CODE = NOT_FROZEN; RECOMMENDATION ERG
D03_NECKLACE_CODE = NOT_FROZEN; RECOMMENDATION NCK
D04_ITEM_REVISION = NOT_FROZEN; RECOMMENDATION CURRENT_HISTORY_FIRST
D05_CGP_ROLLBACK = NOT_FROZEN; RECOMMENDATION TRANSACTION_ROLLBACK_BEFORE_COMMIT_AND_COMPENSATION_AFTER_DURABLE_COMMIT
D06_CGP_INVOICE = NOT_FROZEN; RECOMMENDATION READ_ONLY_PROJECTION_OVER_CURRENT_CGP

SECURITY_AUTHORITY_PRESERVED = YES
BARCODE_IDENTITY_AUTHORITY_PRESERVED = YES
ASSET_IDENTITY_AUTHORITY_PRESERVED = YES
CGP_POSTING_AUTHORITY_PRESERVED = YES
ACCOUNTING_AUTHORITY_PRESERVED = YES

D01 = BLOCKED_FOR_OWNER_DECISION
D02 = BLOCKED_FOR_OWNER_DECISION
D03 = BLOCKED_FOR_OWNER_DECISION
D04 = BLOCKED_FOR_OWNER_DECISION
D05 = BLOCKED_FOR_OWNER_DECISION
D06 = BLOCKED_FOR_OWNER_DECISION
GATE = BLOCKED_CLIENT_BATCH_A_OWNER_DECISION_INCOMPLETE
NEXT_BATCH = B_EMPLOYEE_IDENTITY_ATTRIBUTION_ONLY_IF_PASS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No implementation, security change, barcode change, revision implementation, CGP change, invoice implementation, CRM implementation, DB mutation, migration, seed, production action or automatic Batch B was started. Owner decisions are required before this record can become a frozen authority record.
