# DARFUS Customer Canonical Identity and Field Authority

Control: `DARFUS-CLIENT-CRM-1A-CUSTOMER-IDENTITY-AND-FIELD-AUTHORITY-SAFE-FOUNDATION-01`

Status: **FROZEN FOUNDATION CONTRACT**

This document freezes the current proven authority map for later CRM work. It does not create a new schema, a second customer owner, or a new business workflow.

## Canonical identity

| Concern | Frozen authority | Evidence |
|---|---|---|
| Canonical Customer ID | `Customer.id` | `backend/src/models/customer.model.js`; primary-key definition |
| ID format | Server-generated `CUS-####` sequence, scoped by company | `backend/src/controllers/erp.controller.js` (`GENERATED_ID_FORMATS`, `generateScopedSequentialId`, `createCustomerWithContract`) |
| ID mutability | Immutable identity; profile, phone, address, classification, status, archive/reactivate, and branch relationship do not recreate or remap it | Customer update contract and all current customer references use `customerId`/`id`; CRM-1A `CUSTOMER_ID_MUTATION = 0` |
| Tenant owner | `Customer.companyId` | Customer model and company-scoped controller queries |
| Branch relationship | `BranchCustomer(companyId, branchId, customerId, isActive)` | `backend/src/models/branchCustomer.model.js`; `applyBranchReadScope` in `erp.controller.js` |
| Company/branch security | Server-side company context and fail-closed branch relation; the client cannot become the scope authority | `createCustomerWithContract`, `applyBranchReadScope`, `requireBranchCustomerResource` |
| Operational customer lookup | API customer list/detail and the existing POS customer lookup/summary paths | `backend/src/routes/erp.routes.js`, `customer-pos-summary.service.js`, `lib/repositories/api-impl.ts` |

## Canonical customer field matrix

| Field / concept | Client meaning | Current canonical field or source | Scope | Owner / writers | Readers | CRM-1A decision |
|---|---|---|---|---|---|---|
| Customer ID | Permanent identity | `customers.id` | Company-wide | Server customer contract only | Customer, POS, invoices, reservations, installments, GV, CGP, loyalty, history, audit, reports | `EXISTING_CANONICAL`; no mutation |
| Name | Customer identity attribute | `customers.name` | Company-wide | Customer contract | Customer UI and domain projections | `EXISTING_CANONICAL` |
| Phone | Contact attribute and duplicate-check input | `customers.phone`; comparison uses `normalizePhone` | Company-wide | Customer contract | Customer, POS lookup, search, invoice/customer selectors | `EXISTING_CANONICAL`; normalized value is a validation helper, not a second stored authority |
| Email | Contact attribute | `customers.email` | Company-wide | Customer contract | Customer UI, search, snapshots/selectors | `EXISTING_CANONICAL` |
| Addresses | Customer-owned address collection with one explicit primary | `customers.addresses` JSONB; `customer-address.service.js` | Company-wide customer profile | Customer contract | Detail, invoice contact snapshot, POS summary | `EXISTING_CANONICAL` with service normalization |
| Nationality | Optional profile/KYC attribute | `customers.nationality` | Company-wide | Narrow customer profile contract | Customer detail/KYC | `EXISTING_CANONICAL` |
| Customer type | A business type distinct from classification if the client requires both | No proven separate `customerType` column/API/UI contract | Owner/domain decision | None | None | `MISSING_REQUIRES_BUSINESS_DECISION`; do not map silently to tier |
| Customer status | Company customer lifecycle status | `customers.status` enum `active/inactive` | Company-wide | Customer lifecycle contract | Customer UI and domain guards | `EXISTING_CANONICAL`; separate from branch membership |
| Classification | Client segmentation/classification meaning | Current visible classification is `Customer.tier` (`VIP/Gold/Standard`) | Company-wide | Customer profile contract | Customer, loyalty/segment display, POS summary | `EXISTING_DIFFERENT_NAME/PARTIAL`; no new classification authority |
| Tier | Current tier value | `customers.tier` enum | Company-wide | Customer profile contract | Customer and loyalty views | `EXISTING_CANONICAL_FOR_CURRENT_TIER`; not a promise that it satisfies a distinct future customer type |
| Preferences | Customer preferences | No separate proven field or owner | Company-wide | None | None | `MISSING_REQUIRES_SCHEMA_AND_BUSINESS_DECISION` |
| Tags | Manual/dynamic CRM tags | No separate proven field or tag owner | Company-wide | None | None | `MISSING_REQUIRES_SCHEMA_AND_BUSINESS_DECISION` |
| Notes | Free-form customer notes | `customers.notes` | Company-wide | Customer contract | Customer list/detail and profile flows | `EXISTING_CANONICAL` |
| Documents / attachments | Customer-linked files and metadata | `customer_attachments` / `CustomerAttachment` | Company/customer | Attachment route and customer detail actions | Customer detail, audit metadata | `EXISTING_CANONICAL_AS_SEPARATE_MODEL` |
| Alerts | Customer alerts/follow-up indicators | No separate proven alert model or API | Company/branch decision required | None | None | `MISSING_REQUIRES_BUSINESS_DECISION` |
| Communication preferences | Consent/contact preference data | No separate proven field/model | Company-wide, privacy-sensitive | None | None | `MISSING_REQUIRES_PRIVACY_DECISION_AND_SCHEMA` |
| Consent relationship | Privacy/consent lifecycle | No separate proven consent authority | Company-wide, privacy-sensitive | None | None | `MISSING_REQUIRES_PRIVACY_DECISION_AND_SCHEMA` |
| Loyalty relationship | Loyalty balance and movement history | `customers.loyaltyPoints` is a read value; `loyalty_transactions` is the append-only movement ledger | Company-wide, with business-event scope | Loyalty service/domain events | Loyalty, POS summary, customer detail, reports | `EXISTING_CANONICAL_RELATION`; do not create CRM ledger |
| KYC | Identity verification details/status | `customers.kycStatus`, `customers.kycDetails` JSONB and KYC route | Company-wide | Customer KYC contract with permission | Customer detail/KYC | `EXISTING_CANONICAL` |
| AML | AML status | `customers.amlStatus`, `customers.kycDetails.amlStatus` | Company-wide | Customer KYC contract with permission | Customer detail/KYC | `EXISTING_CANONICAL` |
| Credit references | Credit limit and credit movements | `customers.creditLimit`/reference `balance`; authoritative movement ledger is `customer_credit_transactions`; statement/reconciliation services own computed views | Company/branch for transactions | Credit/treasury domain | Customer statement, POS summary, accounting projections | `EXISTING_WITH_SEPARATE_AUTHORITIES`; do not merge balance and ledger |
| Created/updated audit metadata | Record timestamps and auditable changes | Sequelize timestamps plus centralized audit service/log; no proven `createdBy`/`updatedBy` columns on Customer | Company/customer | Customer controller + audit service | Customer detail/audit | `EXISTING_PARTIAL`; do not invent actor columns |
| Company ownership | Tenant boundary | `Customer.companyId` | Company-wide | Server context | All customer-domain reads/writes | `EXISTING_CANONICAL` |
| Branch relationship | Availability/operational branch membership | `BranchCustomer` relation, including `isActive` | Branch relationship | Customer create/branch relation authority | Customer detail, branch-scoped customer resources, POS/operations | `EXISTING_CANONICAL_RELATION`; not a Customer status alias |

## Alias and secondary-field rules

| Canonical field | Secondary / legacy representation | Current consumers | Safe compatibility rule |
|---|---|---|---|
| `Customer.status` | `BranchCustomer.isActive` | Customer lifecycle vs branch membership | Keep separate: customer may be active while a branch relation is inactive; never substitute one for the other |
| `Customer.tier` | Client “classification” wording | Customer list/detail and loyalty segmentation | Expose current tier as current classification-compatible value only where the existing UI says so; do not add a second classification owner |
| Customer credit ledger | `Customer.balance` reference value and statement totals | POS summary, customer list, credit/statement services | Label/reference the stored value honestly; computed credit remains in the credit ledger/statement authority |
| Stored phone | `normalizePhone(phone)` comparison result | Customer create/update duplicate validation and lookup helpers | Normalization prevents duplicate phones; it is not a second persisted phone identity |
| `Customer.addresses` JSONB | Primary-address resolver and invoice contact snapshot | Customer detail, invoice snapshot, POS summary | Customer addresses own profile data; document/invoice snapshots are immutable copies owned by their source documents |
| `Customer.loyaltyPoints` | `LoyaltyTransaction` ledger/balanceAfter | Customer/POS displays and loyalty history | Customer value is a current read value; ledger remains the movement authority |

## Writer and reader ownership

| Domain | Customer reference | Write owner | Read owner / adapter | CRM rule |
|---|---|---|---|---|
| Sales / invoices | `Invoice.customerId` and customer contact snapshot | Sales/invoice command | Invoice projection and customer views | CRM may link/read; it must not rewrite invoice truth |
| Returns / exchanges | Original/new invoice customer reference | Sales return/exchange command | Sales and customer history projections | Preserve original customer ID and source history |
| Installments / deposits | `Installment.customerId`, invoice and deposit source references | Sales/treasury command | Statement/projection | No CRM financial posting |
| Reservations | `Reservation.customerId` and reservation payments/refunds | Reservation command | Reservation/customer views | No duplicate reservation authority |
| Gift Voucher | `GiftVoucher.customerId` | Gift voucher issue/redemption workflow | GV projection/POS/customer reads | CRM links the customer only |
| CGP | CGP document/pool/liability/customer references | CGP lifecycle/posting | CGP projection and customer history | CGP remains source/business authority |
| Credit / treasury | `CustomerCreditTransaction.customerId`, settlement/liability references | Credit/treasury services | Customer statement/reconciliation | No Customer.balance direct correction |
| Loyalty | `LoyaltyTransaction.customerId` | Loyalty/business-event services | Loyalty views and POS summary | No CRM loyalty ledger |
| Timeline / history | `CustomerTimeline.customerId`, `CustomerTransactionHistory.customerId` | Owning business-event consumers | Customer detail/reporting | Read projection/history; source documents remain authoritative |
| Attachments | `CustomerAttachment.customerId` | Customer attachment command | Customer detail/audit | Separate attachment model is retained |
| POS | Customer ID in lookup and POS summary | POS command owns sale linkage | POS read-only customer summary | Customer ID must be selected and server-validated |
| Audit / notifications | Related customer ID metadata where present | Central audit/event producers | Audit/notification/report readers | CRM does not rewrite event history |
| Inventory / workshop | Customer reference only when an owning source document carries it | Inventory/workshop/CGP source workflow | Projection/report | No customer-owned inventory or workshop truth |

## Fields intentionally not owned by CRM

CRM does not own sales totals, invoice status, tax, payments, treasury balances, inventory assets, barcodes, gold rates, workshop state, reservation state, gift voucher lifecycle, CGP posting, accounting journals, or settlement. CRM may display an explicit read projection or source link, but each owning domain remains authoritative.

The following are explicitly deferred rather than guessed: customer type distinct from tier, tags, preferences, alerts, communication/consent, merge, full 360 projections, offline synchronization, CQRS/event-store work, and cross-domain integrations.

## Frozen safety rules

- `ONE_CUSTOMER = ONE_PERMANENT_CANONICAL_CUSTOMER_IDENTITY`.
- Existing customer IDs and references are not regenerated, remapped, merged, deleted, or backfilled by CRM-1A.
- User/Auth/RBAC remains authorization authority; Customer remains business identity.
- Company and branch scope remain server authoritative and fail closed.
- No CRM-1A migration, schema change, seed, customer mutation, financial mutation, inventory mutation, or permission widening is authorized.
- Any later field addition requires a new control with field meaning, scope, owner, writers, readers, compatibility, and impact proof.
