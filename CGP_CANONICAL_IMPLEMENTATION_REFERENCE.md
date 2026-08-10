# CGP Canonical Implementation Reference

> **Project:** DARFUS ERP  
> **Domain:** Customer Gold Purchase (CGP)  
> **Purpose:** Canonical implementation reference for AI/tool-assisted analysis and implementation  
> **Status:** ARCHITECTURE REFERENCE — IMPLEMENTATION MUST FOLLOW STAGE GATES  
> **Language:** English identifiers + Arabic operational notes  
> **Rule:** This file is the primary implementation guide for CGP work inside the project.  
> **Important:** Do not infer missing business rules. Do not bypass stage gates.

---

## 0. How This File Must Be Used

This document exists to prevent implementation drift, conflicting interpretations, and accidental reuse of legacy CGP behavior.

Any tool, developer, or AI working on Customer Gold Purchase must:

1. Read this file before analyzing or modifying CGP code.
2. Read the source documents listed in **Section 2** when verification is required.
3. Treat the canonical decisions in this file as the implementation baseline.
4. Never silently replace a canonical decision with an older legacy behavior.
5. Never invent missing accounting, tax, payment, pricing, or compliance rules.
6. Never skip a Stage Gate.
7. Record each completed phase and its evidence before starting the next phase.
8. Preserve historical data and avoid direct mutation of posted business truth.
9. Prefer event-driven integration and domain ownership over cross-module direct writes.
10. Stop and report a conflict if code, database, or another document contradicts this reference.

---

# 1. Scope

This reference covers:

- Customer Gold Purchase Invoice
- CGP physical asset creation
- CGP Inventory operational lifecycle
- Pricing and valuation boundary
- Accounting integration boundary
- Customer payable / settlement design boundary
- Gold Center integration
- CRM history integration
- Audit integration
- Reversal / compensation
- Idempotency
- Failure recovery
- Acceptance strategy
- Implementation phases

This reference does **not** automatically define:

- UAE VAT treatment
- AML / KYC regulatory workflow
- Cash transaction regulatory thresholds
- Exact General Ledger account numbers
- Exact bank integration protocol
- Tax invoice behavior
- Refund legal policy
- External market price provider contract

Those subjects require separate approved requirements.

---

# 2. Authoritative Source Documents

The following client documents are the source documents for CGP:

## 2.1 Customer Gold Purchase Invoice

**File:**
`7- Customer Gold Purchase Invoice.docx`

Primary authority for:

- Sales entry point
- Invoice lifecycle
- Draft / Validated / Posted behavior
- Validation
- Pricing boundary
- Posting boundary
- No Asset before Posting
- No Accounting before Posting
- Invoice immutability after Posting
- Base asset creation trigger
- Accounting impact requirement
- Gold Center integration requirement
- Event-driven architecture
- Audit / traceability
- Security and permissions
- Reversal through compensating events

## 2.2 CGP / IGP Master Documentation

**File:**
`Gold Purchase (CGP - IGP)(1).docx`

Primary authority for CGP after successful Invoice Posting:

- Inventory CGP ownership
- Operational lifecycle
- Asset status
- Asset location
- Asset lineage
- Operational commands
- Operational events
- Cross-module ownership
- Inventory projections
- Accounting ownership
- Gold Center ownership
- CRM ownership
- Audit ownership
- Integration boundaries
- Saga / retry / recovery concepts
- Idempotency requirements
- Pending Integration state
- Operational screen behavior

## 2.3 Source-of-Truth Precedence

When the two documents use different wording:

### Before and including Posting

`Customer Gold Purchase Invoice` is the primary business authority.

### After Posting / Physical Asset lifecycle

`CGP Master Documentation` is the primary operational authority.

### Domain ownership has higher priority than generic wording

Example:

If a generic sentence says:

`Posting Engine generates accounting entries`

but domain ownership says:

`Accounting owns all accounting entries`

the canonical interpretation is:

`Posting triggers the Accounting domain through an approved event.`

Posting must not directly own Accounting data.

---

# 3. Canonical Business Definition

Customer Gold Purchase is a reverse asset acquisition process.

The company is the buyer.

The customer supplies physical gold.

The system provides monetary consideration in exchange for the physical gold.

The canonical business flow is:

```text
Customer
   ↓
Sales
   ↓
Customer Gold Purchase Invoice
   ↓
Validation
   ↓
Pricing / Valuation
   ↓
Validated
   ↓
Posting
   ↓
CustomerGoldPurchasePostedEvent
   ↓
------------------------------------------------
Inventory     → Physical Asset
Accounting    → Financial Impact / Liability
Gold Center   → Gold Truth
CRM           → Customer History
Audit         → Audit Trail
------------------------------------------------
   ↓
CGP Operational Lifecycle
```

---

# 4. Absolute Invariants

The following rules are mandatory.

## INV-001 — No Asset Before Posting

```text
NO SUCCESSFUL POSTING
=
NO CGP PHYSICAL ASSET
```

## INV-002 — No Inventory Impact Before Posting

No live Inventory stock record may be created from a CGP Draft or Validated invoice.

## INV-003 — No Accounting Impact Before Posting

No final CGP journal or financial liability may exist before successful Posting.

## INV-004 — No Gold Center Impact Before Posting

Gold Center must not be updated from Draft or Validated CGP input.

## INV-005 — Posting Is the Acquisition Boundary

Successful Posting is the canonical business boundary after which the acquisition becomes final.

## INV-006 — Posted Invoice Is Immutable

After Posting:

- no direct field modification
- no price recalculation
- no direct deletion
- no overwrite of historical values

Corrections use approved reversal / compensating events.

## INV-007 — One Domain Owns One Business Truth

- Sales owns Invoice truth
- Inventory owns physical Asset truth
- Accounting owns financial truth
- Gold Center owns gold truth
- CRM owns customer relationship history
- Audit owns audit history

## INV-008 — No Cross-Domain Direct Mutation

One module must not directly edit another module's owned state.

## INV-009 — Event Driven Integration

Cross-module changes must originate from approved business events / contracts.

## INV-010 — Idempotency

The same business event must not create duplicate:

- Assets
- Journals
- Gold records
- Customer history entries
- Business processing results

## INV-011 — No Historical Deletion

Posted business history must never be deleted to "fix" a transaction.

## INV-012 — Legacy Gold Deposit Is Not Canonical CGP

The legacy flow:

`/customers/:id/gold/deposit`

must not be treated as the canonical Customer Gold Purchase workflow.

## INV-013 — Supplier Receive Is Not the CGP Entry Point

Supplier Receive must not be used as the official Customer Gold Purchase acquisition path.

---

# 5. Module Ownership Matrix

| Domain / Data | Canonical Owner | CGP Access |
|---|---|---|
| Customer Gold Purchase Invoice | Sales | Source transaction |
| Invoice Posting | Sales / Posting Engine | Command boundary |
| Physical Gold Asset | Inventory | Operational management |
| Asset Status | Inventory | Projection / commands |
| Asset Location | Inventory | Projection / commands |
| Asset Lineage | Inventory | Read / operational |
| Purchase Value financial representation | Accounting | Reference only in CGP |
| Journal Entries | Accounting | Reference only |
| Customer Payable | Accounting | Reference / settlement |
| Gold Balance | Gold Center | Reference only |
| Gold Record | Gold Center | Reference only |
| Gold Movement | Gold Center | Reference only |
| Customer Relationship History | CRM | Reference only |
| Audit Trail | Audit | Read only |
| Business Event persistence | Event Store / Event Infrastructure | Publish / consume |

---

# 6. Canonical Invoice Lifecycle

```text
DRAFT
  ↓
VALIDATION
  ↓
PRICING VALIDATED
  ↓
VALIDATED
  ↓
POSTING
  ↓
POSTED
```

## 6.1 Draft

Allowed:

- Create
- Edit
- Add / remove physical-piece lines
- Modify weight inputs
- Modify allowed pricing inputs
- Validate

Forbidden:

- Asset creation
- Journal creation
- Gold Center update
- Final settlement posting

## 6.2 Validated

Required:

- Customer reference valid
- Weight validation passed
- Karat / purity valid
- Pricing result valid
- Required business rules passed

Critical pricing fields should be locked.

## 6.3 Posted

Posting:

- runs final validation
- freezes the invoice
- allocates immutable business references
- creates exactly one canonical posting event
- must be idempotent
- must reject duplicate posting

Canonical event:

`CustomerGoldPurchasePostedEvent`

---

# 7. Posting Engine Contract

## 7.1 Posting Engine Is Allowed To

- validate final invoice state
- validate authorization
- atomically mark invoice as Posted
- allocate Posting reference
- create / publish canonical Posting event
- store idempotency reference
- write Posting audit metadata

## 7.2 Posting Engine Must NOT Directly Own

- Inventory Asset records
- Accounting Journal records
- Gold Center balances
- CRM customer history projections

## 7.3 Canonical Interpretation

```text
Posting Engine
   ↓
CustomerGoldPurchasePostedEvent
   ↓
Domain Handlers
```

Not:

```text
Posting Engine
   ├─ writes Inventory directly
   ├─ writes Accounting directly
   ├─ writes Gold Center directly
   └─ writes CRM directly
```

---

# 8. Physical Piece Model

## 8.1 Canonical Decision

```text
1 Physical Piece
=
1 CGP Invoice Item
=
1 Physical Asset
```

This is the default CGP physical identity model.

## 8.2 Rules

Each separately identifiable physical piece must preserve independent:

- weight
- karat
- purity
- barcode
- RFID when applicable
- Asset ID
- location
- status
- lifecycle
- lineage
- audit history

## 8.3 Quantity

A CGP physical-piece invoice item should not use product-style quantity to represent multiple independent physical pieces.

Example:

```text
Customer provides 5 bracelets
=
5 CGP physical-piece lines
=
5 Assets
```

unless an explicitly approved future batch model is introduced.

---

# 9. Gold Weight Model

## 9.1 Gross Weight

Physical gross measured weight.

## 9.2 Stone Weight

Weight excluded from gold net weight when applicable.

## 9.3 Net Weight

```text
Net Weight = Gross Weight - Stone Weight
```

## 9.4 Purity Factor

Derived from approved karat / purity conversion.

Example:

```text
24K ≈ 1.000
22K ≈ approved factor
21K ≈ approved factor
18K ≈ approved factor
```

Actual factors must come from approved master data.

## 9.5 Pure Gold Weight

```text
Pure Gold Weight = Net Weight × Purity Factor
```

All weight calculations must use controlled decimal precision.

---

# 10. Pricing & Valuation Contract

The client documents define:

- approved market price source
- net weight
- purity adjustment
- deductions
- controlled override rules

However, wording in the source may create ambiguity if purity is applied twice.

Therefore implementation must use one explicit valuation basis.

## 10.1 Canonical Proposed Formula

When the approved rate is a **fine-gold / 999.9 rate**:

```text
Net Weight
=
Gross Weight - Stone Weight

Pure Gold Weight
=
Net Weight × Purity Factor

Base Purchase Value
=
Pure Gold Weight × Approved Fine Gold Rate

Final Purchase Value
=
Base Purchase Value
- Approved Deductions
+/- Authorized Adjustments
```

## 10.2 Mandatory Pricing Snapshot

Store immutable pricing context used for Posting:

- Rate
- Rate Basis
- Rate Source
- Rate Timestamp
- Currency
- Purity Factor
- Gross Weight
- Stone Weight
- Net Weight
- Pure Gold Weight
- Deductions
- Adjustments
- Final Purchase Value
- Pricing Version

## 10.3 Important Gate

The exact production pricing formula must be confirmed against existing DARFUS Gold Center / Pricing rules before implementation.

Do not implement a new pricing authority if one already exists.

---

# 11. Asset Creation Contract

After `CustomerGoldPurchasePostedEvent`:

```text
Inventory Event Handler
   ↓
CreateCGPAsset
   ↓
CGPAssetCreatedEvent
```

Each Asset must permanently reference:

- Invoice ID
- Invoice Item ID
- Purchase Transaction ID when available
- Customer reference
- Branch
- acquisition source = `CUSTOMER_GOLD_PURCHASE`
- original weight data
- original purity / karat
- creation event reference

Manual CGP Asset creation is forbidden.

---

# 12. Initial Asset State

Source documentation contains different wording:

- Active Inventory
- Available
- Pending Integration

Canonical implementation decision:

## 12.1 Technical Initial State

`PENDING_INTEGRATION`

Use this while required downstream projections / integrations are not complete.

## 12.2 Operational Available State

`AVAILABLE`

The Asset becomes operationally available only after required integration completion.

## 12.3 Active Inventory

Treat `Active Inventory` as a broad classification, not the canonical state-machine value.

---

# 13. CGP Operational State Machine

Canonical states:

```text
PENDING_INTEGRATION
AVAILABLE
RESERVED
IN_TRANSFER
IN_REFINERY
IN_MANUFACTURING
IN_MELTING
CONSUMED
CLOSED
REVERSED
VOIDED
```

Canonical transitions include:

```text
PENDING_INTEGRATION
→ AVAILABLE

AVAILABLE
→ RESERVED
→ IN_TRANSFER
→ IN_REFINERY
→ IN_MANUFACTURING
→ IN_MELTING
→ CLOSED (only if approved by business rule)

RESERVED
→ AVAILABLE

IN_TRANSFER
→ AVAILABLE

IN_REFINERY
→ AVAILABLE

IN_MANUFACTURING
→ AVAILABLE

IN_MELTING
→ CONSUMED

CONSUMED
→ CLOSED

ACTIVE STATE
→ REVERSED

PENDING_INTEGRATION
→ VOIDED
```

Every transition requires:

```text
Permission Validation
↓
Business Rule Validation
↓
Operational Validation
↓
Business Command
↓
Business Event
↓
State Update
↓
Projection Update
↓
Audit
```

Direct status editing is forbidden.

---

# 14. Accounting Contract

## 14.1 Ownership

Accounting owns:

- journal generation
- journal reversal
- financial valuation representation
- payable
- settlement
- reconciliation

CGP does not directly write Accounting journals.

## 14.2 Canonical Purchase Recognition

Recommended canonical model:

At successful purchase Posting:

```text
Dr  Gold Inventory / Gold Asset
Cr  Customer Gold Purchase Payable
```

The exact GL accounts must come from the approved Chart of Accounts.

Do not hardcode legacy account IDs.

## 14.3 Why Payable Is Preferred

Separating purchase recognition from payment supports:

- immediate payment
- delayed payment
- partial payment
- bank transfer
- cash payment
- mixed settlement
- payment reversal

without coupling Asset creation to payment timing.

---

# 15. Customer Payment / Settlement

The client files do not fully define the payment workflow.

Therefore the following is a **canonical implementation proposal**, not a direct client-document statement.

## 15.1 Payment Boundary

```text
Purchase Posting
↓
Customer Payable Created
↓
Settlement
```

Payment must not control whether the Asset exists.

Asset existence depends on successful Purchase Posting.

## 15.2 Proposed Payment Status

```text
UNPAID
PARTIALLY_PAID
PAID
REVERSED
```

## 15.3 Proposed Payment Methods

Initial supported methods may include:

```text
CASH
BANK_TRANSFER
```

Optional future support:

```text
MIXED
OTHER_APPROVED_METHOD
```

## 15.4 Payment Accounting

Cash:

```text
Dr Customer Gold Purchase Payable
Cr Cash
```

Bank:

```text
Dr Customer Gold Purchase Payable
Cr Bank
```

Exact accounts are configuration-owned.

## 15.5 Payment Must Have

- Payment / Settlement ID
- Invoice ID
- Customer ID
- amount
- currency
- method
- treasury / cash / bank reference
- payment timestamp
- user
- branch
- accounting reference
- status
- idempotency key
- audit reference

---

# 16. Gold Center Contract

Gold Center owns gold truth.

CGP / Inventory must not directly update Gold Center tables.

Canonical input after acquisition includes only required acquisition data, such as:

- Asset ID
- Invoice ID
- Gold Weight
- Pure Gold Weight
- Karat / Purity
- Branch / location context
- acquisition source
- Posting event reference

Gold Center owns:

- gold balances
- gold records
- gold movement
- gold ownership record
- gold exposure where applicable
- official gold position

---

# 17. CRM Contract

CRM owns customer history.

After successful CGP Posting, CRM may record:

- Customer ID
- Invoice ID
- Purchase Date
- Purchase Value
- Branch
- relevant customer activity reference

CGP must not mutate customer master profile data unless a separately approved CRM command exists.

---

# 18. Audit Contract

Every successful business operation must be auditable.

Audit record should preserve:

- Event ID
- Command ID
- Aggregate / Entity ID
- Invoice ID
- Asset ID where applicable
- User ID
- Branch
- Timestamp
- Action Type
- Before State
- After State
- Result
- Correlation ID
- Causation ID

Audit history is immutable.

---

# 19. Reversal / Void Contract

## 19.1 Posted Transactions

A Posted CGP transaction must never be deleted.

Correction requires an approved reversal process.

Canonical concept:

```text
Reverse Customer Gold Purchase
        ↓
Reversal Event
        ↓
Accounting Reversal
        ↓
Gold Center Reversal
        ↓
Asset → REVERSED
        ↓
CRM History Update
        ↓
Audit
```

## 19.2 Void

`VOIDED` is intended for approved compensation / invalid incomplete integration scenarios where business rules allow it.

Do not use Void as a hidden delete.

## 19.3 Reversal Must Be Idempotent

Repeating the same reversal request must not create duplicate reversal effects.

---

# 20. Integration Reliability

Required implementation concepts:

- transactional boundary for Posting
- Transactional Outbox where appropriate
- Inbox / processed-event tracking
- idempotent consumers
- correlation IDs
- causation IDs
- retries
- retry backoff
- timeout handling
- terminal failure handling
- compensating commands
- Saga / Process Manager where cross-domain coordination requires it

---

# 21. Pending Integration Contract

`PENDING_INTEGRATION` exists to represent a valid Posted acquisition whose required downstream operational integration is incomplete.

During `PENDING_INTEGRATION`:

Allowed:

- view
- integration retry
- recovery
- audit inspection

Forbidden:

- transfer
- reserve
- refinery
- manufacturing
- melting
- normal operational consumption

After required integration is complete:

```text
PENDING_INTEGRATION
→ AVAILABLE
```

---

# 22. Legacy Compatibility Rules

Existing legacy CGP-related implementations must be classified as:

```text
KEEP
ADAPT
DEPRECATE
BLOCK_FOR_CGP
REMOVE_LATER
```

Do not delete legacy code during early analysis.

Known legacy path:

`/customers/:id/gold/deposit`

Canonical decision:

`BLOCK_FOR_CANONICAL_CGP / DEPRECATE AS CGP ENTRY`

Known Supplier Receive CGP behavior:

Supplier Receive is not the official CGP acquisition path.

Backend must eventually enforce the same boundary as frontend.

---

# 23. Current Known Implementation Areas

Current code previously identified includes:

- `backend/src/routes/gold-purchase.routes.js`
- `backend/src/services/gold-purchase-draft.service.js`
- `backend/src/services/gold-purchase-governance.service.js`
- `backend/src/routes/erp.routes.js`
- `inventory-v2-runtime.service.js`
- CGP Inventory / disposition routes
- Gold-related services
- current permissions under `gold_purchase.cgp.*`

These paths must be re-verified against the current working tree before modification.

Do not assume previous analysis remains exact if code has changed.

---

# 24. Database Safety

## 24.1 Persistent Database

Persistent / real project database must remain read-only during design and acceptance planning unless an explicit implementation rollout stage authorizes mutation.

## 24.2 Rehearsal / Acceptance Database

Use an isolated rehearsal / acceptance database for:

- schema rehearsal
- migration rehearsal
- integration fixtures
- posting tests
- reversal tests
- concurrency tests
- idempotency tests

## 24.3 Migration Rule

No migration may be created until the DB Delta phase explicitly proves it is needed.

Do not create speculative migrations.

---

# 25. Implementation Phases

The project must be executed progressively.

---

## PHASE 1 — Architecture Freeze

### Objective

Convert client requirements and agreed decisions into one canonical implementation contract.

### Deliverables

- canonical workflow
- ownership matrix
- invariants
- physical piece model
- state model
- pricing boundary
- accounting boundary
- payment boundary
- Gold Center contract
- reversal contract
- integration rules

### Stage Gate P1

Do not start code changes until:

- [ ] Source files reviewed
- [ ] Conflicts documented
- [ ] Canonical decisions recorded
- [ ] Open assumptions clearly marked
- [ ] No unresolved architectural contradiction blocks implementation

**Current reference file satisfies the initial Architecture Freeze baseline, but implementation-specific verification is still required.**

---

## PHASE 2 — Current System Gap Analysis

### Objective

Compare current code and database with this canonical reference.

### Required Output

For every requirement:

| ID | Requirement | Current State | Gap | Action | Risk |
|---|---|---|---|---|---|

Classify each implementation area as:

- compliant
- partial
- conflicting
- missing
- legacy
- unknown

### Required Review

- routes
- services
- models
- database schema
- permissions
- frontend workflow
- accounting integration
- Gold Center integration
- event infrastructure
- current CGP data
- legacy paths

### Stage Gate P2

No implementation until:

- [ ] Gap Matrix complete
- [ ] affected files known
- [ ] affected DB objects known
- [ ] legacy impact identified
- [ ] backward-compatibility risks documented
- [ ] no production mutation performed

---

## PHASE 3 — Technical Contract & DB Delta

### Objective

Define the exact target interfaces before coding.

### Deliverables

- target entities
- DB Delta
- indexes
- unique constraints
- foreign keys
- idempotency keys
- event schema
- API contracts
- command contracts
- permission changes
- status constants
- reconciliation strategy

### Stage Gate P3

No migration / code implementation until:

- [ ] DB Delta approved
- [ ] Event contracts approved
- [ ] API contracts approved
- [ ] Accounting integration contract approved
- [ ] Gold Center contract approved
- [ ] Payment contract approved or explicitly deferred
- [ ] Reversal contract approved

---

## PHASE 4 — Invoice / Pre-Posting Implementation

### Objective

Implement:

```text
Draft
→ Physical Pieces
→ Weight
→ Purity
→ Pricing
→ Validation
→ Ready To Post
```

### Must Prove

- no Asset created
- no Accounting created
- no Gold Center mutation
- draft remains editable
- validation is deterministic

### Stage Gate P4

- [ ] Draft tests pass
- [ ] Validation tests pass
- [ ] Pricing snapshot tests pass
- [ ] No pre-posting downstream mutation verified

---

## PHASE 5 — Canonical Posting

### Objective

Implement safe, idempotent Posting.

### Must Produce

`CustomerGoldPurchasePostedEvent`

### Must Prove

- exactly one Posting
- duplicate Posting rejected / idempotent
- invoice frozen
- event persisted safely
- failure does not create invalid partial acquisition

### Stage Gate P5

- [ ] Posting tests pass
- [ ] duplicate Posting tests pass
- [ ] concurrency test passes
- [ ] transactional failure test passes
- [ ] event durability proven

---

## PHASE 6 — Inventory Asset Creation

### Objective

Create one Asset per physical piece through Inventory domain processing.

### Must Prove

- no manual CGP Asset creation path
- one piece creates one Asset
- duplicate event does not duplicate Asset
- Invoice ↔ Item ↔ Asset traceability
- initial integration state correct
- projection correct

### Stage Gate P6

- [ ] Asset idempotency proven
- [ ] lineage proven
- [ ] state initialization proven
- [ ] Inventory ownership preserved

---

## PHASE 7 — Accounting Integration

### Objective

Create financial impact through Accounting ownership.

### Must Prove

- balanced journals
- unique accounting reference
- no direct CGP journal mutation
- purchase value reconciles with acquisition value
- reversal supported

### Stage Gate P7

- [ ] Accounting entries balanced
- [ ] duplicate processing safe
- [ ] reconciliation passes
- [ ] reversal test passes

---

## PHASE 8 — Customer Settlement

### Objective

Implement approved customer payment workflow.

Target proposal:

```text
Customer Payable
→ Cash / Bank
→ Partial / Full Settlement
```

### Must Prove

- payment does not create Asset
- payment does not alter original Posted purchase value
- outstanding balance accurate
- payment idempotent
- accounting reference linked
- reversal handled correctly

### Stage Gate P8

- [ ] payment method contract approved
- [ ] payment tests pass
- [ ] partial payment tests pass if enabled
- [ ] treasury/cash integration reconciles

---

## PHASE 9 — Gold Center / CRM / Audit

### Objective

Complete downstream business projections.

### Must Prove

Gold Center:

- gold record created once
- balance correct
- movement traceable

CRM:

- customer history created once

Audit:

- complete event / command history

### Stage Gate P9

- [ ] Gold Center reconciliation passes
- [ ] CRM history verified
- [ ] Audit chain verified

---

## PHASE 10 — Operational Lifecycle

### Objective

Enable:

- Reserve
- Release
- Transfer
- Refinery
- Manufacturing
- Melting
- Consume
- Close
- Reverse
- Void where applicable

### Must Prove

- illegal transitions rejected
- direct status mutation impossible
- every command audited
- every state change event-driven
- lineage preserved

### Stage Gate P10

- [ ] State machine tests complete
- [ ] permission tests complete
- [ ] illegal-transition tests complete
- [ ] history preservation verified

---

## PHASE 11 — Failure Recovery & Reversal

### Objective

Prove resilience.

Test:

- duplicate event
- handler failure
- Accounting failure
- Gold Center failure
- projection failure
- timeout
- retry
- terminal failure
- reversal
- compensation

### Stage Gate P11

- [ ] idempotency proven
- [ ] retry behavior proven
- [ ] Saga / compensation proven
- [ ] no orphan records
- [ ] no unbalanced journals
- [ ] no duplicate Assets
- [ ] no duplicate gold balances

---

## PHASE 12 — Acceptance

Use isolated acceptance/rehearsal environment.

Acceptance must prove at minimum:

```text
No Asset before Posting
One physical piece = one Asset
Posting exactly once
Balanced Accounting
Gold Center update
Customer History
Full Audit
Payment / Settlement
Partial payment if supported
Reversal
Idempotency
Concurrency
Retry
Failure recovery
No legacy CGP entry bypass
```

### Stage Gate P12

Persistent rollout is forbidden until acceptance evidence is complete.

---

## PHASE 13 — Persistent Rollout

Only after explicit approval.

Required:

- backup / rollback strategy
- migration plan
- production pre-check
- controlled deployment
- post-deploy verification
- financial reconciliation
- Inventory reconciliation
- Gold Center reconciliation
- audit verification

---

# 26. Tool Operating Rules

When an AI / automation tool is asked to work on CGP:

## Before Any Change

It must output:

```text
CURRENT_PHASE=
REQUESTED_ACTION=
FILES_TO_TOUCH=
DB_OBJECTS_TO_TOUCH=
EXPECTED_MUTATIONS=
RISK_LEVEL=
STAGE_GATE_STATUS=
```

## If Stage Gate Is Not Closed

Tool must not continue with mutating work.

It should perform analysis only and report blockers.

## After Each Phase

Update this file with a Phase Execution Record.

---

# 27. Phase Execution Record Template

Append one record per completed phase.

```md
## EXECUTION RECORD — PHASE X

Date:
Git Branch:
Git Commit Before:
Database:
Mode: READ_ONLY / REHEARSAL_WRITE / APPROVED_IMPLEMENTATION
Scope:

### Files Reviewed
-

### Files Changed
-

### DB Objects Reviewed
-

### DB Objects Changed
-

### Findings
-

### Tests
-

### Evidence
-

### Open Risks
-

### Gate Result
PASS / BLOCKED

### Next Allowed Phase
-
```

---

# 28. Current Decision Register

| Decision | Status | Canonical Decision |
|---|---|---|
| CGP Entry Point | CLOSED | Sales → Customer Gold Purchase Invoice |
| Asset Before Posting | CLOSED | Forbidden |
| Accounting Before Posting | CLOSED | Forbidden |
| Gold Center Before Posting | CLOSED | Forbidden |
| Physical Piece Model | CLOSED | 1 Piece = 1 Item = 1 Asset |
| Posting Event | CLOSED | CustomerGoldPurchasePostedEvent |
| Asset Owner | CLOSED | Inventory |
| Accounting Owner | CLOSED | Accounting |
| Gold Truth Owner | CLOSED | Gold Center |
| CRM Owner | CLOSED | CRM |
| Audit Owner | CLOSED | Audit |
| Legacy Gold Deposit as CGP | CLOSED | Forbidden |
| Supplier Receive as CGP Entry | CLOSED | Forbidden |
| Posted Data Mutation | CLOSED | Forbidden |
| Reversal | CLOSED | Event-driven compensation |
| Initial Technical Asset State | CLOSED | Pending Integration |
| Operable Asset State | CLOSED | Available |
| Weight Formula | CLOSED | Gross - Stone = Net |
| Pure Weight | CLOSED | Net × Purity Factor |
| Pricing Formula | NEEDS IMPLEMENTATION VERIFICATION | Must align with existing pricing authority; prevent double purity application |
| Exact GL Accounts | OPEN | Accounting / COA owner decision |
| Payment Workflow | PROPOSED | Payable → Settlement |
| Payment Methods | PROPOSED | Cash / Bank initially |
| Partial Payment | PROPOSED | Allowed if Accounting/Treasury approves |
| UAE VAT | OUTSIDE CURRENT CLIENT CONTRACT | Separate compliance requirement |
| AML / KYC | OUTSIDE CURRENT CLIENT CONTRACT | Separate compliance requirement |

---

# 29. Immediate Next Action

The next permitted phase is:

```text
PHASE 2 — CURRENT SYSTEM GAP ANALYSIS
```

The tool must **not modify code or database yet**.

It must:

1. Re-read this reference.
2. Inspect the current Git working tree.
3. Inspect current CGP routes/services/models.
4. Inspect current DB schema in read-only mode.
5. Inspect current permissions.
6. Inspect current frontend CGP / Sales workflow.
7. Inspect Accounting integration.
8. Inspect Gold Center integration.
9. Inspect legacy gold deposit behavior.
10. Produce the Gap Matrix.
11. Append the Phase 2 Execution Record.
12. Stop before implementation.

---

# 30. Final Canonical Summary

```text
Customer enters with physical gold
        ↓
Sales creates Customer Gold Purchase Invoice
        ↓
Each physical piece is recorded independently
        ↓
Weight / Karat / Purity / Pricing
        ↓
Validation
        ↓
Posting
        ↓
CustomerGoldPurchasePostedEvent
        ↓
Inventory creates physical Asset
        ↓
Accounting records purchase liability
        ↓
Gold Center records gold truth
        ↓
CRM records customer history
        ↓
Audit records complete history
        ↓
Asset becomes operationally Available
        ↓
Customer settlement occurs through Accounting / Treasury
        ↓
Asset operational lifecycle continues in CGP Inventory
        ↓
Corrections use Reversal / Compensation
        ↓
No history is deleted
```

---

# END OF CGP CANONICAL IMPLEMENTATION REFERENCE

---

# PHASE 2 — CURRENT SYSTEM GAP ANALYSIS RESULT

## 1. Execution Record

Date: 2026-08-08
Git Branch: `main`
Git Commit Before: `1657b0e9ba580faef69be48f04637835c201b521`
Database: persistent `darfus_erp` and acceptance `darfus_erp_inventory_rehearsal_20260804_160500z`, read-only
Mode: `READ_ONLY`
Scope: Current CGP route, service, model, frontend, accounting, event, permission, and database gap analysis only.

### Files Reviewed

- `backend/src/routes/gold-purchase.routes.js`
- `backend/src/services/gold-purchase-draft.service.js`
- `backend/src/services/gold-purchase-governance.service.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/inventory-v2-runtime.service.js`
- `backend/src/services/posting.service.js`
- `backend/src/services/gold-purchase-measurement.service.js`
- `backend/src/services/gold-valuation.service.js`
- `backend/src/services/events.service.js`
- CGP models, `Invoice`, `AssetEvent`, `IdempotencyRequest`, and related model associations
- CGP frontend pages, draft workspace, approvals page, Supplier Receive, Inventory, and printing helpers
- `H:\WORK\client-requirements\7- Customer Gold Purchase Invoice.docx`
- `H:\WORK\client-requirements\Gold Purchase (CGP - IGP).docx`

### Files Changed

- `CGP_CANONICAL_IMPLEMENTATION_REFERENCE.md` — this Phase 2 result was appended only, as explicitly authorized.

### DB Objects Reviewed

`customer_gold_purchase_documents`, `customer_gold_purchase_items`, `customer_gold_pools`, `inventory_gold_pools`, `cgp_item_dispositions`, `gold_purchase_approval_requests`, `assets`, `invoices`, `journal_entries`, `journal_lines`, `cash_transactions`, permissions, Asset events, idempotency records, and relevant foreign keys.

### DB Objects Changed

None.

### Findings

- The canonical reference and the two source documents agree on the entry boundary: Sales Customer Gold Purchase Invoice, not Supplier Receive and not the legacy gold deposit route.
- Draft and governance support exists, but a canonical CGP Invoice entity/posting path does not.
- The legacy deposit path directly creates Pool, Asset, Journal, payout Invoice, Treasury, and Audit records and is therefore conflicting as a CGP entry.
- No persisted `CustomerGoldPurchasePostedEvent`, transactional CGP outbox/inbox, Gold Center projection, customer payable linkage, or CGP reversal contract exists.
- Supplier Receive blocks CGP in the frontend, while the backend V2 receive contract still accepts the CGP profile from a direct caller.

### Tests / Evidence

- Source and static repository inspection only.
- Read-only `SELECT current_database()` was verified for both databases before inspection.
- No runtime mutation, migration, seed, fixture, posting, payment, or reversal was executed.

### Gate Result

`BLOCKED`

### Next Allowed Phase

`PHASE_2_BLOCKER_RESOLUTION_ANALYSIS_ONLY`

## 2. Git / Worktree Evidence

- Branch: `main`
- HEAD: `1657b0e9ba580faef69be48f04637835c201b521`
- Tracked modified files before this append: 22
- Untracked files before this append: 43
- Stashes: 11
- Remotes: none
- All pre-existing worktree changes were preserved.
- No destructive Git command, commit, push, deploy, or Next dev was run.

## 3. Canonical Invariants Compared With Current System

| Invariant | Current result | Evidence |
|---|---|---|
| No successful posting = no CGP Asset | `CONFLICTING` | Legacy deposit creates an Asset; disposition can create an Asset without a posted Invoice. |
| No successful posting = no final Accounting impact | `CONFLICTING` | Legacy deposit calls `postingService.postEntry` directly. |
| No successful posting = no Gold Center impact | `PARTIAL` | No Gold Center CGP integration exists, but no pre-post Gold Center write was found. |
| Sales Customer Gold Purchase Invoice is the entry point | `CONFLICTING` | Draft route exists, but legacy deposit and disposition are alternative entry/conversion paths. |
| One piece = one item = one Asset | `CONFLICTING` | Draft items have no piece identity contract; pools and disposition allow line/pool semantics. |
| `CustomerGoldPurchasePostedEvent` | `MISSING` | No persisted or published CGP business event was found. |
| Domain ownership separation | `PARTIAL` | Generic services exist, but legacy CGP route directly writes Inventory and Accounting. |
| Posted Invoice immutable | `PARTIAL` | Approved drafts are immutable; no canonical Posted CGP Invoice exists. |
| Reversal/compensation instead of delete | `PARTIAL` | Generic invoice/asset mechanisms exist; CGP-specific reversal is absent. |
| Cross-module idempotency | `PARTIAL` | Draft/disposition idempotency exists; no posting event consumer contract exists. |
| Manual CGP Asset creation forbidden | `CONFLICTING` | Legacy deposit and disposition create Assets directly. |
| Direct operational state mutation forbidden | `PARTIAL` | V2 state authority is canonical, but the disposition route inserts a new Asset directly. |

## 4. Current CGP Route Inventory

| Method | Path | Auth / Permission | Handler / Service | DB objects | Classification | Risk |
|---|---|---|---|---|---|---|
| `POST` | `/gold-purchases/cgp/drafts` | auth; `gold_purchase.cgp.create` or legacy sales permission | `goldPurchaseDraftService.create` | CGP document/items, Audit, IdempotencyRequest | `CANONICAL_PREPOSTING` | No Posting boundary. |
| `GET` | `/gold-purchases/cgp/drafts` | auth; scoped CGP view | `goldPurchaseDraftService.list` | CGP documents/items | `CANONICAL_PREPOSTING` | Read-only draft projection only. |
| `GET` | `/gold-purchases/cgp/drafts/:id` | auth; scoped CGP view | `findScoped`, governance history | CGP documents/items/approvals | `CANONICAL_PREPOSTING` | No posted invoice read-back. |
| `PATCH` | `/gold-purchases/cgp/drafts/:id` | auth; update-draft permission | `draftService.update` | CGP document/items, Audit | `CANONICAL_PREPOSTING` | Version protected, but not Posted. |
| `POST` | `/gold-purchases/cgp/drafts/:id/validate` | auth; validate permission | `draftService.validate` | CGP document, Audit, IdempotencyRequest | `CANONICAL_PREPOSTING` | Validation is not Posting. |
| `POST` | `/gold-purchases/cgp/drafts/:id/submit` | auth; submit permission | `governanceService.submit` | Approval request, document, Audit, IdempotencyRequest | `CANONICAL_PREPOSTING` | Creates review request only. |
| `POST` | `/gold-purchases/cgp/drafts/:id/approve` | auth; approve permission | `governanceService.review` | Approval request, document, Audit, IdempotencyRequest | `CANONICAL_GOVERNANCE_ONLY` | Approval does not equal Posting. |
| `POST` | `/gold-purchases/cgp/drafts/:id/reject` | auth; reject permission | `governanceService.review` | Approval request, document, Audit, IdempotencyRequest | `CANONICAL_GOVERNANCE_ONLY` | Returns document to draft. |
| `POST` | `/gold-purchases/cgp/drafts/:id/void` | auth; void permission | `draftService.voidDraft` | CGP document, Audit, IdempotencyRequest | `CANONICAL_PREPOSTING` | No posted reversal. |
| `POST` | `/customers/:id/gold/deposit` | auth only | Inline legacy handler | CustomerGoldPool, Asset, AssetEvent, Journal, Invoice, InvoiceItem, CashTransaction, Audit | `LEGACY` / `CONFLICTING_AS_CGP_ENTRY` | Creates business effects without canonical CGP Posting. |
| `POST` | `/customers/:id/gold/payout` | auth; idempotency key | Inline legacy handler | CustomerGoldPool, Journal, Audit | `LEGACY` | Direct gold-pool payout. |
| `POST` | `/customers/:id/gold/use-in-sale` | auth; idempotency key | Inline legacy handler | CustomerGoldPool, Journal, Audit | `LEGACY` | Legacy pool consumption. |
| `POST` | `/inventory-v2/cgp-items/:id/disposition` | auth; `inventory.adjust` | Inline disposition handler plus `inventoryV2Runtime` | CGP item/disposition, Asset, AssetEvent, Movement, origin evidence, Audit | `TEMPORARY_CONVERSION` | Can create an Asset from an approved line without a posted Invoice event. |
| `POST` | `/sales/invoices/:id/post` | Sales invoice authorization | Generic Invoice posting path | Invoice, InvoiceItem, Journal, Asset transitions | `CANONICAL_GENERIC_SALES` | No CGP-specific Invoice type or event. |

There is no dedicated Customer Gold Purchase Invoice entity and no canonical CGP Posting route.

## 5. Draft, Validation, and Approval

- CGP drafts are created by `GoldPurchaseDraftWorkspace` and `/gold-purchases/cgp/drafts`.
- Validation computes and persists karat, fineness, purity factor, gross, stone, net, and pure weight.
- Submit creates an approval request with a snapshot and hash.
- Approve changes draft status to `approved` and records governance audit.
- Approval does **not** create an Invoice, Posting reference, Asset, Journal, Gold Center record, payable, or settlement.
- Therefore `APPROVAL_EQUALS_POSTING = NO`.

## 6. Frontend Workflow

- `/sales/customer-gold`: Legacy customer scrap-gold screen; API mode calls `/customers/:id/gold/deposit`; local/demo mode fabricates an in-memory Asset and payout Invoice.
- `/sales/customer-gold/drafts`: Draft-only CGP workspace.
- `/approvals`: Displays CGP approval requests and performs approve/reject only.
- Supplier Receive: displays CGP in the canonical profile selector but blocks submission and disables the save action.
- Backend Supplier Receive: still accepts `CGP_CUSTOMER_GOLD_PURCHASE` if a direct caller bypasses the frontend guard. This is `FRONTEND_BACKEND_ENFORCEMENT_GAP`.
- Inventory screens can label/filter the CGP profile, but there are no canonical posted CGP Assets in the inspected databases.
- Printing contains a `customerGoldPurchase` view model/template option, but no canonical CGP Invoice record feeds it.

## 7. Current Database Inventory

Persistent `darfus_erp` was verified read-only:

| Object | Count |
|---|---:|
| SequelizeMeta / migrations | 61 |
| assets | 52 |
| products | 3 |
| customer_gold_purchase_documents | 2 |
| customer_gold_purchase_items | 4 |
| cgp_item_dispositions | 4 |
| customer_gold_pools | 0 |
| inventory_gold_pools | 0 |
| gold_purchase_approval_requests | 1 |
| invoices | 10 |
| journal_entries | 60 |
| journal_lines | 156 |
| cash_transactions | 44 |
| Assets with CGP profile | 0 |

Acceptance `darfus_erp_inventory_rehearsal_20260804_160500z` was also read-only:

- migrations = 61
- assets = 462
- CGP documents = 2
- CGP items = 4
- CGP dispositions = 4
- customer_gold_pools = 0
- inventory_gold_pools = 0
- journal_entries = 490
- journal_lines = 1408

No database mutation occurred in this phase.

## 8. CGP Table Model Findings

| Table | Current purpose | Financial / Posting / Asset / Event linkage |
|---|---|---|
| `customer_gold_purchase_documents` | Draft/governance header | Has company, branch, customer, status, version, approval/revision fields; no Invoice ID, Posting ID, event ID, payable, settlement, or Asset reference. |
| `customer_gold_purchase_items` | Draft line measurements | Has karat, fineness, purity factor, gross, stone, net, pure, proposed/reference rate, deductions metadata; no quantity/piece identity, Invoice item posting reference, Asset reference, or event reference. |
| `gold_purchase_approval_requests` | Submit/review governance | Has snapshot/hash and reviewer fields; no Posting event, accounting, settlement, or Asset linkage. |
| `cgp_item_dispositions` | Immutable later line disposition | Has CGP item, branch/company, disposition, optional Asset/pool, evidence, decision actor/time; no posted Invoice or event linkage. |
| `customer_gold_pools` | Legacy customer gold pool | Has customer, weight, purity, assay and transfer fields; no canonical Invoice/Posting event contract. |
| `inventory_gold_pools` | Generic inventory pool | Has `cgp_id`, weight, purity, available/allocated/status; no Gold Center contract and no canonical event reference. |
| `invoices` | Generic sales/return/deposit invoices | Supports generic lifecycle and idempotency, but its type enum has no canonical Customer Gold Purchase type. |
| `journal_entries` / `journal_lines` | Accounting truth | Generic source type/source ID and balanced posting support; no CGP-specific owner contract. |
| `asset_events` | Asset lifecycle audit/event evidence | Has event type, source type/source ID, correlation and idempotency fields; it is not a system-wide CGP Event Store. |
| `idempotency_requests` | Generic request idempotency | Reusable for a future CGP Posting boundary; no CGP Posting scope currently exists. |

## 9. Required Linkage Status

| Linkage | Status |
|---|---|
| CGP Invoice ID | `MISSING` |
| CGP Invoice Item ID | `PARTIAL` — draft item ID exists, not a Posted Invoice Item identity |
| Purchase Transaction ID | `MISSING` |
| Posted Event ID | `MISSING` |
| Asset ID | `PARTIAL` — only disposition-side optional link |
| Accounting Reference ID | `MISSING` |
| Gold Center Reference ID | `MISSING` |
| Settlement Reference ID | `MISSING` |
| Reversal Reference ID | `MISSING` |
| Correlation ID | `PARTIAL` — AssetEvent support exists, not CGP posting-wide |
| Causation ID | `MISSING` |
| Idempotency Key | `PARTIAL` — generic/draft/disposition support exists |

## 10. Weight, Purity, and Pricing

`gold-purchase-measurement.service.js` is the current measurement authority for draft lines:

- Net = Gross − Stone.
- Pure Gold Weight = Net × Purity Factor.
- Supported karats are 18, 21, 22, and 24 with fixed factors.
- Decimal storage is six places for draft measurement fields.
- Gross must be positive; stone must be non-negative and less than gross.
- Purity factor and karat/fineness must agree.

The canonical reference requires a fine-gold-rate basis when the rate is 999.9, with one explicit purity application and immutable pricing snapshot. Current CGP drafts only store proposed/reference rates and deduction metadata; they do not calculate or freeze a final Posted valuation.

`gold-valuation.service.js` is limited to `GOLD_BY_WEIGHT_JEWELLERY` and `GOLD_BAR_24K`, not CGP. No CGP-specific double-purity safeguard exists because no CGP valuation engine exists. Status: `PARTIAL`.

## 11. Posting and Event Infrastructure

- Generic `posting.service.js` creates balanced journals for existing sales, returns, deposits, purchases, and treasury actions.
- No CGP-specific `post` method, Invoice aggregate, Posting reference, or Posting idempotency scope exists.
- `AssetEvent` is an Asset audit/lifecycle table, not a system-wide event store.
- `events.service.js` is an in-memory Server-Sent Events broadcaster, not durable business event infrastructure.
- No CGP outbox, inbox, processed-event table, Saga, or Process Manager was found.
- Generic `IdempotencyRequest` is reusable, but no CGP Posting consumer chain exists.

Therefore:

```text
CURRENT_CGP_POSTING_EXISTS = NO
APPROVAL_EQUALS_POSTING = NO
POSTING_IDEMPOTENT = UNKNOWN
POSTING_CONCURRENCY_PROTECTED = UNKNOWN
POSTING_EVENT_EXISTS = NO
```

## 12. Asset-Creation Path Analysis

| Path | Trigger | Current result | Canonical result |
|---|---|---|---|
| Legacy deposit | `/customers/:id/gold/deposit` | Creates CustomerGoldPool, Asset, AssetEvent, Journal, optional payout Invoice, InvoiceItem, CashTransaction, Audit | Forbidden as canonical CGP entry |
| Supplier Receive | V2 per-piece receive | Frontend blocks CGP; backend normalization/creation can accept CGP direct | Must remain blocked for CGP |
| Disposition conversion | Approved CGP draft item + physical evidence + proposedRate | Creates a target-profile Asset, Barcode, AssetEvent, Movement, origin evidence; reports `financialEffect: NONE_DEFINED` | Temporary workaround, not canonical posting |
| Posted CGP Invoice | No route | No Asset | Required future trigger |

Current system therefore permits Asset creation before the canonical Posting event.

## 13. Initial State

The canonical reference closes the technical initial state as `PENDING_INTEGRATION`, followed by `AVAILABLE` only after required integrations complete.

Current Asset creation paths use `AVAILABLE`/`operationalStatus=AVAILABLE` directly. No `PENDING_INTEGRATION` CGP state or canonical transition exists in the current CGP path.

## 14. Accounting and Settlement

Current reusable components:

- `posting.service.js` for balanced journals and branch mapping resolution.
- Treasury mapping roles for cash and bank.
- Generic Accounts Receivable / Accounts Payable roles.
- `CashTransaction` and payment/idempotency services.
- Generic invoice settlement and reversal patterns.

Current gaps:

- No CGP Customer Payable reference.
- No CGP accounting source type contract.
- No immutable Purchase Transaction ID linking invoice, journal, Asset, and settlement.
- Legacy deposit writes journals directly from a CGP-like route.
- No canonical CGP partial settlement or reversal workflow.

```text
PAYMENT_MODEL_CURRENT = LEGACY_PAYOUT_PLUS_GENERIC_TREASURY
PAYABLE_SUPPORT = GENERIC_ACCOUNTS_PAYABLE / RECEIVABLE ONLY
CASH_SUPPORT = YES
BANK_SUPPORT = YES
PARTIAL_PAYMENT_SUPPORT = GENERIC, NOT CGP-CONTRACTED
REVERSAL_SUPPORT = GENERIC INVOICE/TREASURY PATTERNS, NOT CGP-CONTRACTED
REUSABLE_COMPONENTS = posting.service, Treasury mappings, CashTransaction, IdempotencyRequest, Audit
GAPS = CGP payable, settlement reference, payment contract, reversal linkage
```

## 15. Gold Center, CRM, and Audit

- Gold Center current code provides live price/quote/foundation valuation services, not a CGP posted-gold record or event projection.
- CGP currently does not update Gold Center balances or movements.
- Customer and CRM entities exist, but no canonical Posted CGP activity reference was found.
- Draft, approval, disposition, legacy deposit, and Asset events can be audited separately.
- There is no complete CGP event chain linking Invoice → Posting Event → Asset → Accounting → Gold Center → CRM → Audit.

## 16. Permissions and Security

Current `gold_purchase.cgp.*` permissions are:

`view`, `view_all`, `view_branch`, `view_own`, `create`, `update_draft`, `validate`, `submit`, `approve`, `reject`, `self_approve`, `void`.

Missing future capabilities:

`post`, `settle/pay`, `reverse`, `retry integration`, and CGP operational transition permissions.

Backend security is stronger than frontend visibility for drafts, with authentication, company/branch scope, role permissions, snapshot checks, and self-approval controls. The legacy deposit endpoint has authentication but no dedicated CGP permission boundary. Frontend Supplier Receive blocking is therefore not sufficient as a backend boundary.

## 17. Legacy Classification

| Component | Classification | Reason |
|---|---|---|
| CGP draft routes/services | `KEEP` | Useful pre-Posting foundation after contract alignment. |
| Governance approval service | `ADAPT` | Approval must remain distinct from Posting. |
| Generic `posting.service.js` | `ADAPT` | Reuse Accounting mechanics behind domain-owned event contracts. |
| Generic `IdempotencyRequest` | `ADAPT` | Reuse for Posting and consumers. |
| `AssetEvent` / Asset lifecycle runtime | `ADAPT` | Reuse for downstream Asset events, not as the system-wide Event Store. |
| `/customers/:id/gold/deposit` | `BLOCK_FOR_CGP` / `DEPRECATE` | Directly creates CGP-like business effects and conflicts with the frozen entry boundary. |
| `/customers/:id/gold/payout` | `DEPRECATE` | Legacy pool payout, not canonical CGP settlement. |
| `/customers/:id/gold/use-in-sale` | `DEPRECATE` | Legacy pool consumption path. |
| `/inventory-v2/cgp-items/:id/disposition` | `ADAPT` or `REMOVE_LATER` | Temporary conversion evidence path; must not become canonical Posting. |
| Supplier Receive CGP profile acceptance | `BLOCK_FOR_CGP` | Must remain unavailable for CGP. |
| CustomerGoldPool / InventoryGoldPool | `UNKNOWN` pending owner semantic decision | Existing pool concepts conflict with the frozen one-piece model unless explicitly re-scoped. |

## 18. Required Gap Matrix

| ID | Canonical Requirement | Current Implementation | Status | Gap | Required Future Action | Risk | Evidence |
|---|---|---|---|---|---|---|---|
| CGP-G001 | Sales Customer Gold Purchase Invoice entry | Draft workspace plus legacy deposit | `CONFLICTING` | No posted CGP Invoice entry | Define Sales-owned Invoice aggregate and route | High | Invoice source; route inventory |
| CGP-G002 | Editable physical-piece Draft | CGP document/items draft | `COMPLIANT` | Draft lacks final piece identity contract | Align item schema with one-piece rule | Medium | Draft service/model |
| CGP-G003 | Deterministic pre-Posting validation | Measurement and document validation | `PARTIAL` | No canonical Invoice validation boundary | Define final validation contract | Medium | Measurement/draft service |
| CGP-G004 | Canonical pricing snapshot | Proposed/reference rate only | `PARTIAL` | No final CGP valuation/snapshot | Approve rate basis, deductions, precision, snapshot | High | Draft item; reference pricing contract |
| CGP-G005 | Canonical Posting | None | `MISSING` | No CGP post route/service | Define Posting command and transaction boundary | Critical | Route inventory |
| CGP-G006 | `CustomerGoldPurchasePostedEvent` | None | `MISSING` | No durable event | Define event schema and persistence | Critical | Event search |
| CGP-G007 | One piece = one item = one Asset | Pools and line disposition | `CONFLICTING` | Line/pool/quantity semantics unresolved in code | Enforce one-piece item identity | Critical | Draft model; pool models |
| CGP-G008 | Asset after Posting only | Legacy/disposition Asset creation | `CONFLICTING` | Asset can exist without canonical Posting | Route all creation through event handler | Critical | Legacy/disposition code |
| CGP-G009 | Initial `PENDING_INTEGRATION` | Direct `AVAILABLE` | `MISSING` | No CGP integration state | Add approved state contract in Phase 3 | High | Runtime/disposition |
| CGP-G010 | Inventory projection | Generic Asset tables only | `MISSING` | No event-derived CGP projection | Define projection/read model | High | No CGP projection found |
| CGP-G011 | Accounting-owned integration | Legacy route posts directly | `CONFLICTING` | Cross-domain direct journal mutation | Publish accounting impact contract | Critical | Legacy deposit/posting service |
| CGP-G012 | Customer Payable | Generic roles only | `PARTIAL` | No CGP payable reference | Define Accounting payable contract | High | Posting service/COA |
| CGP-G013 | Settlement | Legacy payout/generic payments | `PARTIAL` | No CGP settlement contract | Define payment boundary and references | High | Legacy payout/Treasury |
| CGP-G014 | Gold Center projection | No CGP integration | `MISSING` | No gold record/balance update | Define event-driven Gold Center handler | Critical | Gold service search |
| CGP-G015 | CRM history | Customer exists, no posted CGP link | `PARTIAL` | Missing canonical activity reference | Define CRM event projection | Medium | Models/route audit |
| CGP-G016 | Complete Audit | Separate draft/Asset audit | `PARTIAL` | No full event chain | Define event/command audit fields | High | Audit/AssetEvent |
| CGP-G017 | Reversal/compensation | Generic patterns only | `PARTIAL` | No CGP reversal event | Define reversal and compensation contract | Critical | Reference/route inventory |
| CGP-G018 | Cross-module idempotency | Draft/disposition/generic idempotency | `PARTIAL` | No Posting event consumer keys | Define aggregate/event/consumer idempotency | Critical | Idempotency service |
| CGP-G019 | Posting concurrency | Draft locks only | `UNKNOWN` | No Posting race proof or path | Define row lock/version contract | High | No CGP Posting route |
| CGP-G020 | Outbox/Inbox | SSE plus AssetEvent only | `MISSING` | No durable delivery/processed-event infrastructure | Reuse or extend approved event infrastructure | Critical | Event search |
| CGP-G021 | Permissions | Draft/governance permissions | `PARTIAL` | Missing post/pay/reverse/retry permissions | Define least-privilege additions in Phase 3 | High | Permission catalog |
| CGP-G022 | Backend CGP Receive block | Frontend blocks; backend accepts profile | `CONFLICTING` | Direct caller bypass remains possible | Add server boundary without Supplier Receive semantics | Critical | Supplier Receive route/UI |
| CGP-G023 | Legacy deposit isolation | Direct legacy route remains | `LEGACY` | Can bypass canonical CGP entry | Block/deprecate as CGP entry | Critical | `/customers/:id/gold/deposit` |
| CGP-G024 | Invoice→Item→Asset lineage | Disposition cgpItemId only | `PARTIAL` | No posted invoice/item lineage | Define immutable lineage references | High | Disposition/runtime |
| CGP-G025 | Payment reversal | Legacy/generic reversal only | `PARTIAL` | No CGP payable settlement reversal | Define compensating settlement events | Critical | Posting/Treasury |
| CGP-G026 | Posted immutability | Approved draft immutability | `PARTIAL` | No Posted CGP Invoice state | Freeze Posted aggregate and use compensation | High | Governance service |

## 19. Open Technical Gaps

The following gaps block safe Phase 3 contract design:

1. Exact CGP Invoice aggregate and relationship to existing `Invoice`.
2. One-piece item identity versus pool semantics.
3. Posting reference, event identity, correlation, causation, and consumer idempotency.
4. Fine-gold rate basis, purity application, deductions, adjustments, currency, and precision.
5. Accounting payable and exact source/reference contract without hardcoded account IDs.
6. Gold Center record, balance, movement, and reconciliation contract.
7. Customer settlement, partial payment, treasury reference, and reversal contract.
8. Handling of the existing legacy deposit and disposition data paths.

No unresolved source conflict exists between the two client documents after applying the canonical precedence rules. The invoice document's wording that Posting "generates" downstream records is interpreted by the canonical reference as event triggering, while domain-owned handlers retain ownership.

## 20. Exact Phase 3 Technical Contracts Required

Phase 3 must define and obtain approval for:

- CGP Invoice and Invoice Item entities, statuses, immutability, and one-piece identity.
- Final validation and pricing snapshot DTOs.
- Posting command, authorization, transaction, unique Posting reference, and duplicate behavior.
- `CustomerGoldPurchasePostedEvent` schema with correlation/causation and immutable payload.
- Outbox/inbox or equivalent durable event delivery and processed-event contract.
- Inventory Asset creation handler, lineage, acquisition source, and `PENDING_INTEGRATION` state.
- Accounting impact interface and Customer Payable reference; no direct CGP journal writes.
- Gold Center projection and reconciliation interface.
- CRM history projection and Audit event contract.
- Customer settlement/payment/reversal contracts.
- Permission additions for post, settle, reverse, retry, and operational lifecycle.
- Server-side prohibition of CGP through Supplier Receive and isolation/deprecation of the legacy deposit route.
- Acceptance-only migration delta, only after the contracts prove it is necessary.

## 21. P2 Stage Gate

`PHASE_2_GAP_MATRIX_COMPLETE = YES`

`PHASE_2_AFFECTED_CODE_AREAS_KNOWN = YES`

`PHASE_2_AFFECTED_DB_OBJECTS_KNOWN = YES`

`PHASE_2_LEGACY_IMPACT_KNOWN = YES`

`PHASE_2_EVENT_INFRASTRUCTURE_ASSESSED = YES`

`PHASE_2_ACCOUNTING_REUSE_ASSESSED = YES`

`PHASE_2_GOLD_CENTER_REUSE_ASSESSED = YES`

`PHASE_2_PAYMENT_GAP_ASSESSED = YES`

`PHASE_2_PERMISSIONS_GAP_ASSESSED = YES`

`PHASE_2_GATE = BLOCKED`

Reason: the current system has no canonical CGP Posting/Event/Gold Center/settlement path, and the missing contracts block safe DB/API design. No implementation may begin until Phase 2 blocker-resolution analysis and Phase 3 contracts are approved.

## 22. Phase 2 Required Tokens

```text
CURRENT_PHASE = PHASE_2_CURRENT_SYSTEM_GAP_ANALYSIS
CGP_CANONICAL_REFERENCE_READ = YES
CGP_CLIENT_INVOICE_DOCUMENT_READ = YES
CGP_MASTER_DOCUMENT_READ = YES

PRODUCT_CODE_MUTATIONS_THIS_PHASE = 0
MIGRATIONS_THIS_PHASE = 0
PERSISTENT_DB_MUTATIONS_THIS_PHASE = 0
ACCEPTANCE_DB_MUTATIONS_THIS_PHASE = 0

CGP_ENTRY_POINT_CURRENT = DRAFT_WORKSPACE_PLUS_LEGACY_DEPOSIT; NO_CANONICAL_POSTED_INVOICE
CGP_CANONICAL_POSTING_EXISTS = NO
CGP_CANONICAL_POSTED_EVENT_EXISTS = NO
CGP_ONE_PIECE_ONE_ASSET_CURRENT = CONFLICTING
CGP_ACCOUNTING_INTEGRATION_CURRENT = LEGACY_DIRECT_JOURNAL_PLUS_GENERIC_ENGINE
CGP_PAYMENT_MODEL_CURRENT = LEGACY_PAYOUT_PLUS_GENERIC_TREASURY
CGP_GOLD_CENTER_INTEGRATION_CURRENT = MISSING
CGP_REVERSAL_CURRENT = GENERIC_ONLY_NOT_CGP_CONTRACTED
CGP_IDEMPOTENCY_CURRENT = PARTIAL
CGP_LEGACY_DEPOSIT_STATUS = LEGACY_CONFLICTING_AS_CGP_ENTRY
CGP_SUPPLIER_RECEIVE_STATUS = FRONTEND_BLOCKED_BACKEND_BYPASS_GAP

PHASE_2_GAP_MATRIX_COMPLETE = YES
PHASE_2_GATE = BLOCKED
NEXT_ALLOWED_PHASE = PHASE_2_BLOCKER_RESOLUTION_ANALYSIS_ONLY
```

No Phase 3 implementation was started.

---

# PHASE 2 — FINAL APPROVED DECISION REGISTER

## 1. Scope, authority, and formal closure

This append-only register records the approved, source-verified decisions that
close Phase 2. It supersedes only the historical `PHASE_2_GATE = BLOCKED`
assessment in section 21 above. It does not erase the recorded current-system
gaps, authorize code/database work, or make Phase 3 implementation executable.

### Classification vocabulary

- `CLIENT_SOURCE_RULE` — a business rule directly supported by client source.
- `OWNER_DECISION` — a business decision expressly fixed by the Owner.
- `TECHNICAL_VERIFICATION` — a fact verified from the current system during
  Phase 2.
- `TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3` — a contract required before any
  implementation, with no database field, API shape, or code mechanism fixed
  here.
- `LATER_PHASE_OWNER_DECISION` — a deliberately deferred Owner decision that
  must fail closed and does not block the present Phase 2 closure.

### Provenance keys

`CLIENT_CGP_INVOICE`, `CLIENT_CGP_MASTER`, `CLIENT_ACCOUNTING`,
`CLIENT_GOLD_CENTER`, `CLIENT_CUSTOMERS_CRM`, `OWNER_DECISION`, and
`PHASE_2_TECHNICAL_VERIFICATION`.

## 2. Approved decisions

### CGP-DEC-ENTRY-01 — canonical entry boundary

`CGP_ENTRY_POINT = Sales → Customer Gold Purchase Invoice`

- Customer Gold Purchase begins in Sales and not in Supplier Receive.
- `/customers/:id/gold/deposit` is not a canonical CGP entry point.
- Legacy deposit and Supplier Receive records/history remain preserved; they
  are not to be deleted or silently reinterpreted.
- Phase 3 must add server-side, fail-closed enforcement for this boundary and
  provide read compatibility/deprecation treatment for legacy paths.

Classification: `CLIENT_SOURCE_RULE` +
`OWNER_CONFIRMED_CANONICAL_DIRECTION` + `TECHNICAL_VERIFICATION`.

### CGP-DEC-LIFECYCLE-01 — invoice lifecycle and immutability

`CGP_LIFECYCLE = DRAFT → VALIDATED → POSTED`

- `CGP_APPROVAL_REQUIRED = NO`. Approval may be an optional governance control
  where separately configured, but approval is not Posting and is not a
  substitute for the validated Posting gate.
- Posting produces an immutable CGP Invoice, immutable pricing snapshot, one
  durable primary event, and downstream domain work.
- A Posted Invoice is never deleted or silently edited. Corrections use
  reversal/compensation events while preserving historical truth.

Classification: `CLIENT_SOURCE_RULE` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-POSTING-01 — posting boundary

No successful Posting means no final CGP Asset, no final Accounting impact, and
no Gold Center impact. Posting publishes
`CustomerGoldPurchasePostedEvent`; it must not directly become the owner of
Inventory, Accounting, Gold Center, CRM, or Audit records.

Classification: `CLIENT_SOURCE_RULE` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-PIECE-ASSET-01 — physical-piece and lineage rule

`ONE_PHYSICAL_PIECE = ONE_CGP_INVOICE_ITEM = ONE_ASSET`

- No canonical CGP Asset exists before successful Posting.
- Direct manual CGP Asset creation and direct manual operational-state mutation
  are forbidden; Inventory state authority owns every later state transition.
- Physical ownership is Inventory-owned after creation.
- Required lineage concepts are Invoice, Invoice Item, Posted Event, Asset,
  Accounting reference, Gold Center reference, settlement/reversal references,
  correlation, causation, and idempotency. This register does not select
  database column names or relationship implementation.

Classification: `CLIENT_SOURCE_RULE` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-PRICING-01 — pricing authority and rate basis

`CGP_PRICING_AUTHORITY = GOLD_CENTER_APPROVED_PRICE_SNAPSHOT`

`CURRENT_VERIFIED_RATE_BASIS = KARAT_SPECIFIC_RATE_BASIS`

The current verified pricing implementation computes an effective karat price
per gram with purity already incorporated. The monetary basis for this CGP
contract is therefore:

`MONETARY_VALUE = NET_WEIGHT × APPROVED_KARAT_RATE`

The current draft `proposedRate` and `referenceMarketRate` do not constitute a
canonical approved snapshot or a complete rate-basis/provenance record. Phase 3
must define the snapshot conceptually (approved source, basis, timestamp,
currency, precision, deductions/adjustments, and immutable linkage) without
this register fixing a schema field name.

Classification: `CLIENT_SOURCE_RULE` + `TECHNICAL_VERIFICATION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-PRICING-02 — purity application and gold truth

`PURITY_APPLICATION_COUNT = EXACTLY_ONCE`

Because the verified rate basis is karat-specific, monetary valuation must not
apply purity a second time. Pure Gold Weight remains a separate Gold Center
truth calculated from net weight and approved purity/karat rules; it is not a
second monetary valuation multiplier.

Classification: `CLIENT_SOURCE_RULE` + `OWNER_DECISION` +
`TECHNICAL_VERIFICATION`.

### CGP-DEC-ACCOUNTING-01 — domain ownership

The ownership boundary is fixed as follows:

- Sales owns the CGP Invoice.
- Inventory owns the Physical Asset and operational lifecycle.
- Accounting owns financial recognition, Customer Creditor/payable position,
  balances, journals, ledger, and Treasury representation.
- Gold Center owns gold truth, approved price snapshots, positions/quantities,
  and gold economic projections.
- CRM owns customer identity and customer-history projections.
- Audit owns immutable audit history.

CGP must not manufacture a journal directly. The contract is:

`CGP Event → Financial Impact → Posting → Accounting`.

Classification: `CLIENT_SOURCE_RULE` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-CUSTOMER-CREDITOR-01 — accounting role direction

`CGP_GOLD_ASSET_ROLE = REUSE_EXISTING_INVENTORY_ASSET_ROLE`

The verified existing Inventory asset account role is `INVENTORY_ASSET`. A CGP
purchase customer is not a supplier; when unpaid, the customer is a Creditor to
whom the company owes value. No current Customer Creditor account role was
verified. Phase 3 must define a generic Accounting role if needed; it must not
reuse Supplier Payable or Customer Deposit and must not introduce a
CGP-specific role unless the generic contract is proven insufficient.

Classification: `CLIENT_ACCOUNTING` + `OWNER_DECISION` +
`TECHNICAL_VERIFICATION` + `TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-PAYMENT-01 — settlement model

- Posting is not payment and payment is not Asset creation.
- Supported target settlement modes are immediate or later Cash, Bank, or
  mixed settlement; partial payment is allowed.
- Accounting/Treasury remains the owner of settlement.
- Bank settlement requires a bank reference; cash settlement does not require
  a bank reference.
- Approval is configurable/rule-driven, not a hardcoded title or role.
- The Customer Creditor lifecycle must support open, partially paid, fully
  paid, and disputed states. Written-off status triggers no automatic business
  action; written-off status triggers no automatic business action.

Classification: `OWNER_DECISION` + `CLIENT_ACCOUNTING` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-PAYMENT-02 — payment history and compensation

Payment history is immutable. A Phase 3 Payment Sent equivalent is required
for durable payment evidence. A reversal after payment is compensating, never
a destructive edit; any unrecovered amount becomes a Customer Receivable under
Accounting authority.

Classification: `OWNER_DECISION` + `CLIENT_ACCOUNTING` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-EVENTING-01 — durable event and recovery contract

Posting must atomically persist the Invoice Posted result, pricing snapshot,
durable event, and transactional outbox or an approved equivalent. Downstream
Inventory, Accounting, Gold Center, CRM, and Audit projections must use
idempotent consumer/inbox-or-equivalent processing with correlation,
causation, retry, duplicate protection, and recoverability. Exact command,
event, outbox, inbox, consumer, and concurrency designs are reserved for Phase
3.

Classification: `CLIENT_SOURCE_RULE` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-INTEGRATION-01 — initial Asset state and readiness gates

The canonical initial CGP Asset state is `PENDING_INTEGRATION`, not immediate
`AVAILABLE`. It is visible, traceable, recoverable, and non-usable. Sale,
reservation, transfer, refinery, manufacturing, melting, and other operational
consumption remain blocked until all hard gates pass:

For avoidance of doubt, Sale, reservation, transfer, refinery, manufacturing,
melting, and every other operational consumption are blocked while the Asset is
`PENDING_INTEGRATION`.

1. durable Posting;
2. valid Inventory Asset creation;
3. Accounting recognition and Customer Creditor representation;
4. durable core Gold Center projection; and
5. durable Audit evidence.

After the hard gates, the canonical transition to `AVAILABLE` may occur through
the Inventory state authority. Soft asynchronous work includes CRM history,
timeline/analytics projections, Gold Center dashboard reads, and audit read
indexes; durable Audit and core Gold Center facts are hard, not soft. The
verified legacy immediate-Available behavior is non-canonical.

Classification: `CLIENT_CGP_MASTER` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-CRM-01 — customer identity and history

CRM owns the permanent Customer ID, identity, and history/timeline projection.
CGP references that identity and must not create a duplicate customer. CRM does
not own the Invoice, Asset, Journal, or Gold Center truth. Customer financial
balance display is an Accounting projection, not a CRM-owned balance.

Classification: `CLIENT_CGP_MASTER` + `CLIENT_CUSTOMERS_CRM` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-GOLD-CENTER-01 — gold-domain separation

Gold Center is an independent domain and owns approved pricing, gold truth,
pure-weight/position/quantity facts, movements, and gold economic projections.
It does not own journals, monetary liabilities, or generic cash/bank payment.
Gold liability is not financial liability. CGP supplies approved acquisition
data/events and never directly mutates Gold Center balances.

Classification: `CLIENT_GOLD_CENTER` + `CLIENT_CGP_MASTER` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-LEGACY-01 — isolation of legacy paths

The customer gold deposit, payout/use-in-sale, direct CGP disposition, and
Supplier Receive CGP bypass are legacy/conflicting paths, not alternative
canonical CGP creation mechanisms. Their historical data remains preserved.
Phase 3 must fail closed for new canonical-CGP use, preserve read
compatibility/auditability, and define staged deprecation; it must not erase or
rewrite history.

Classification: `TECHNICAL_VERIFICATION` + `OWNER_DECISION` +
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`.

### CGP-DEC-REVERSAL-01 — corrections and unresolved irreversible state

All CGP corrections use reversal/compensation with permanent lineage, audit,
and idempotency. The one known deferred decision is:

`CGP_REVERSAL_AFTER_IRREVERSIBLE_PHYSICAL_TRANSFORMATION`

This is a `LATER_PHASE_OWNER_DECISION`; it does not block Phase 3 technical
contract design. Until resolved, Phase 3 must fail closed for any irreversible
physical transformation that would require an undefined CGP reversal.

## 3. Permissions and security direction

The future authorization surface must cover Post, View Integration Status,
Retry Integration, Reverse, Settlement/Payment (Accounting/Treasury), and
operational Asset transitions (Inventory). Exact permission strings, roles,
assignment policy, and server enforcement points are
`TECHNICAL_DESIGN_RESERVED_FOR_PHASE_3`. Frontend visibility never replaces
backend authorization.

## 4. Phase 3 contract boundary

Phase 3 may design the technical contract and a candidate additive database
delta for the approved rules above. It may not implement code, migrations,
routes, API payloads, permissions, event tables, posting, payment, Asset
creation, Gold Center projection, CRM projection, legacy cleanup, or database
mutation without a separate Owner authorization.

## 5. Formal Phase 2 closure gate

```text
PHASE_2_GATE = PASSED
PHASE_2_BLOCKING_OWNER_DECISIONS = 0
PHASE_2_SOURCE_CONFLICTS = 0
NEXT_ALLOWED_PHASE = PHASE_3_TECHNICAL_CONTRACT_AND_DB_DELTA
PHASE_3_IMPLEMENTATION_ALLOWED = NO
```

## 6. Non-CGP deferred follow-up

`JEWELLERY_MAKING_CHARGE_PER_GRAM_CALCULATION` is a non-CGP deferred issue.
No binding approved deferred-issue section was found in
`PROJECT_PROGRESS_HANDOFF.md`; therefore this documentation-only Phase 2
closure does not add it there. It remains a separately tracked follow-up and
does not alter the CGP gate.

---

# CGP END-TO-END FINAL ACCEPTANCE — PASS_CONFIRMED

## Implemented lifecycle witness

The implemented canonical lifecycle has now been proven in one disposable
acceptance clone:

`DRAFT → VALIDATED → POSTED → CustomerGoldPurchasePostedEvent v1 → Inventory Asset → Accounting recognition → Gold acquisition → AVAILABLE hard gate → CRM purchase projection → settlement → reversal hold → REVERSAL_PENDING → Accounting compensation → Gold compensation → atomic finalizer → REVERSED → CustomerGoldPurchaseReversedEvent v1 → CRM reversal projection`.

The witness had one physical piece, one CGP item, and one Asset.  Its gross,
stone, net, and pure weights were calculated under the existing canonical
services.  Monetary value used the immutable approved karat-specific snapshot
once; Gold pure weight remains a separate Gold Center truth.

## Posting and hard integrations

- No Asset, final Accounting fact, or Gold Center fact existed before
  successful Posting.
- Posting produced exactly one durable `CustomerGoldPurchasePostedEvent v1`.
- Inventory, Accounting, and Gold Center are explicit idempotent consumers;
  the global dispatcher remains unregistered and historical backlog was not
  processed.
- `PENDING_INTEGRATION → AVAILABLE` occurs only after the hard integration
  facts; CRM is a soft retryable projection and does not own financial truth.

## Settlement and reversal

- Settlement is Accounting/Treasury-owned and supports executed Cash, Bank,
  and mixed allocations; bank allocations require their reference.
- Reversal is compensation, never deletion.  The hold is technical and places
  the linked Asset in `REVERSAL_PENDING` while the CGP remains `POSTED`.
- Finalization requires successful hard Accounting and Gold compensation, then
  atomically transitions the same Asset to `REVERSED`, the CGP to `REVERSED`,
  and the request to `COMPLETED`.
- Accounting compensation debits Customer Creditor for the outstanding amount,
  debits Accounts Receivable only for the immutable total of executed paid
  allocations, and credits Inventory Asset for the original acquisition.  It
  never creates automatic Cash/Bank recovery.
- Gold compensation is one additive immutable historical-snapshot event; it
  does not perform a current price lookup.  CRM reversal is soft, retryable,
  and idempotent after the durable final event.

## Guarantees and final baseline

- Replays created no duplicate Asset, Journal, Gold event, final event, or CRM
  history.  A forced hard Accounting failure blocked finalization until retry;
  a forced CRM failure did not undo final hard facts and retried once.
- Original acceptance remains migrations `77`; witness `CGPD-000071` remains
  `REVERSED / COMPLETED / REVERSED` with one final event, one balanced
  compensation Journal, one Gold compensation event, and zero Treasury
  reversal effects.
- The final E2E clone was deleted.  Persistent `darfus_erp` remained read-only
  at migrations `61`, Assets `52`, Products `3`.

`CGP_END_TO_END_FINAL_ACCEPTANCE = PASS`

`CGP_END_TO_END_GATE = PASS_CONFIRMED`

`CGP_PROJECT_STATUS = BACKEND_END_TO_END_COMPLETE_FOR_IMPLEMENTED_CGP_SCOPE`

No follow-up implementation starts without a separate explicit Owner choice.
