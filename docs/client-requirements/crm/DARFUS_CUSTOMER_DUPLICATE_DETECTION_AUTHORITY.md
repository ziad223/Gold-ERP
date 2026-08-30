# DARFUS Customer Duplicate Detection Authority

Status: CRM-1B/1B2 deterministic detection, review, and phone uniqueness contract

This document defines the narrow, review-safe duplicate behavior implemented by
CRM-1B and the Owner-approved phone uniqueness invariant proven by CRM-1B2. It
does not change the canonical Customer identity, merge policy, or any financial,
inventory, POS, reservation, voucher, or CGP authority.

## Frozen Owner phone policy

- `PHONE_UNIQUENESS_POLICY = ONE_PHONE_PER_CUSTOMER_PER_COMPANY`.
- `SHARED_PHONE_ALLOWED = NO`.
- `EMAIL_HARD_UNIQUENESS = NO`.
- `MERGE = NOT_PART_OF_CRM_1B`.

One deterministic canonical phone may belong to only one Customer identity in a
company. Branch membership does not widen this identity scope.

## Identity authority

- `Customer.id` remains the permanent canonical identity.
- `company_id` remains the tenant boundary.
- `BranchCustomer` is a company/branch relationship and is not a second
  customer identity.
- No merge, remap, renumbering, deletion, or history rewrite is performed by
  duplicate detection.

## Deterministic signals

### Strong pre-create signal: exact normalized phone

The server reuses `backend/src/services/customer-phone.service.js`:

1. convert the value to a string;
2. remove non-digit characters;
3. remove leading zeroes.

An exact match within the same company is a hard pre-create conflict. The
server returns HTTP `409` with
`CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` before opening the Customer create
transaction. This aligns with the existing local repository's exact normalized
phone duplicate behavior.

This normalizer does **not** perform country-code mapping. A local number and
the same number written with a country code are not treated as equivalent by
this contract unless the existing normalizer produces the same value. Country
code normalization is intentionally deferred to an Owner decision and a
separate authority change.

### Weak review signal: exact case-folded name

Names are trimmed and case-folded for an exact equality signal. A name match is
never a hard uniqueness key. It presents a minimized review list and requires
an explicit user acknowledgement that the new person is not a duplicate before
the create request can be sent.

### Email

Email is not a duplicate signal in CRM-1B. The current source does not prove a
canonical trim/case/uniqueness contract, and no hard email rule is introduced.

### Other fields

Customer ID is server-generated and is not an input signal. Address, notes,
tier, balances, KYC/AML data, loyalty, and transaction history are not used as
duplicate keys.

## Scope and candidate policy

- Detection scope is company-wide because Customer identity is company-owned.
- Branch membership is returned only as a minimized relationship summary; it
  does not narrow or widen the identity scope.
- Active and inactive customers are candidates. This preserves the possibility
  that an inactive identity must be reviewed before a new identity is created.
- Soft-deleted rows are excluded by the current paranoid Customer query.
- Results are capped at 25 candidates and ordered by Customer ID for stable
  review behavior.
- Candidate DTO fields are limited to Customer ID, name, phone, email, status,
  tier, and `{branchId,isActive}` relationship summaries. Balances, KYC/AML,
  addresses, private notes, and transaction history are excluded.

## Server and UI behavior

The read-only endpoint is:

`GET /api/v1/customers/duplicate-check?name=...&phone=...`

It requires authentication and either `customers.view` or `customers.create`,
uses the server-resolved company context, and is registered before the generic
`/customers/:id` route.

The create path performs the same server-side check before beginning its DB
transaction. A client bypass cannot create a second identity with an exact
normalized phone match.

The Customer create modal calls the read-only check first. A hard phone match
stops the flow. Name-only candidates are shown in the modal with links to the
existing records and an explicit review acknowledgement. There is no merge or
“create anyway” override in CRM-1B.

## Security and authority preservation

- Existing User/Auth/RBAC remains authorization authority.
- Existing company and branch scope checks remain in force.
- No permission is added, removed, or weakened.
- The duplicate endpoint is read-only and does not write audit, Customer,
  BranchCustomer, or financial data.

## Concurrency status

CRM-1B2 adds a migration-defined database invariant on disposable rehearsal
targets: a functional unique index named
`customers_company_id_canonical_phone_uq` over
`(company_id, ltrim(regexp_replace(phone, '[^0-9]', '', 'g'), '0'))`.
The migration fails closed if existing rows contain a null/empty canonical phone
or a duplicate canonical group. The application precheck remains a review/UX
guard; the database index is the concurrency authority. Customer create/update
maps that index's PostgreSQL unique violation to the stable
`CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` 409 contract. Customer create also
serializes its existing company-scoped sequential-ID scan on the company row so
an ID race cannot abort the transaction before the phone conflict is reported.

The main `darfus_erp` database has not received this migration. The disposable
clone proof demonstrated one successful concurrent create/update at most and a
stable duplicate failure for the loser. Main migration remains a separate Owner
approval gate.

The current normalizer is unchanged and does not map local numbers to country
codes. No Egypt/+20 assumption is introduced. Soft-deleted rows remain excluded
from the review candidate query, while the proposed full-company database index
prevents reuse of a canonical phone held by a soft-deleted identity; a current
main-data conflict was not observed (`soft_deleted_rows = 0`).

## Explicitly deferred

Country-code normalization, hard email uniqueness, shared-email policy,
fuzzy/phonetic matching, automatic merge, override policy, and override audit
events are not implemented. Main-database migration application is not
authorized by CRM-1B2; only the disposable proof is complete.

## CRM-1B4 country-aware supersession

CRM-1B4 freezes the missing country authority and supersedes the old phone
expression for future implementation/promotion decisions. A new or changed
Customer phone must carry an explicit supported ISO-3166-1 alpha-2
`phoneCountry`; the server resolves the raw value with
`libphonenumber-js/max` (package version `1.13.12`) and persists the result as
`phone_country` plus E.164 `canonical_phone`. Customer `phone` remains the raw
display/audit input. The company `default_phone_country` value is a UI default
only and never infers or rewrites a Customer phone country.

The superseding migration
`20260830020000-customer-phone-country-canonical.js` drops the unqualified
CRM-1B2 index on the disposable migration sequence and creates the same named
unique index over `(company_id, canonical_phone)`. It does not backfill legacy
rows. Existing rows without country/canonical values remain unresolved and are
listed in the CRM-1B4 reconciliation preview until an Owner-approved
reconciliation.

CRM-1B4 disposable proof demonstrated EG/AE/SA local, `+` and `00` forms,
cross-country separation, fail-closed invalid input, company-scoped canonical
duplicate detection, one-winner/one-409 concurrent create, and one-winner/one
409 stale concurrent update. Main `darfus_erp` remains read-only and the old
CRM-1B2 migration file remains historical; no official migration or backfill
was performed.
