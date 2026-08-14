# PHASE RESET-1 — Post-Reset Operational Recovery

## Closure status

`RESET1_POST_RESET_BROWSER_QA_PASSED`

RESET-1 was verified locally on `main`; production was not accessed or changed.
The local target was `localhost:5433 / darfus_erp`. The final state is 45
migrations, 128 permissions, 65 verifier files, and a clean-tree `65/65 PASS`
suite.

## Commit chain

1. `988a063 docs: record post-reset readiness audit`
2. `074964e fix: establish post-reset operational bootstrap`
3. `f0f5a3a test: align migration verifier after reset bootstrap`
4. `cd13598 test: align reservation and lifecycle guard verifiers`
5. This closure commit: `docs: close post-reset operational recovery`

CONT1 aligned the migration verifier after the bootstrap change. CONT2 found
the POS reservation verifier still asserting the retired settings-only design.
CONT3 additionally found `backend/scripts/verify-posting-status.js` asserting
the obsolete generic-invoice lifecycle text and a stale `403` expectation for
a posted invoice update.

## Reservation deposit contract

The retired contract treated `reservationAdvancesAccountId` as the sole
runtime source of truth and expected a settings-only reservation-deposit
failure. The exact current blocker is HTTP `422` with
`CUSTOMER_DEPOSIT_ROLE_NOT_CONFIGURED`.

### Retired Reservation Deposit Error Contract

Retired historical contract identifiers:

- `RESERVATION_ADVANCES_ACCOUNT_NOT_CONFIGURED`
- `RESERVATION_ADVANCES_ACCOUNT_INVALID`

These were active assertions for the retired settings-only reservation deposit
account contract. They are no longer current Product error codes and must not
be reintroduced as active runtime behavior; they remain here only for
historical traceability and verifier-migration evidence.

Active replacement: HTTP `422`, stable code
`CUSTOMER_DEPOSIT_ROLE_NOT_CONFIGURED`, protected role
`CUSTOMER_DEPOSIT_LIABILITY`.

The transition is settings-only account configuration → protected,
company-scoped account-role resolution. The deposit liability account is
resolved server-side: the client cannot choose or override it and no
business-user ledger-account selector exists, while cash-register, bank, and
payment destination selection remains user-selectable. A valid legacy company
setting is preserved/adopted; missing, invalid, inactive, or cross-company role
mapping blocks before any reservation/deposit/journal write. There is no
first-account fallback, Arabic/English account-name lookup, Demo-ID dependency,
or partial write. Verifier alignment removed active assertions for the retired
codes without changing Product logic.

This omission was documentation-only. It did not affect RESET-1 Product
behavior, the 65/65 verifier result, Browser/API QA, backups, database state,
or Production.

The current implementation resolves the protected, company-scoped
`CUSTOMER_DEPOSIT_LIABILITY` role before reservation creation; valid legacy
`reservationAdvancesAccountId` configuration is adopted and preserved during
explicit bootstrap. The resolver validates company, liability/credit
classification and active state, rejects missing, invalid, and cross-company
mappings, and has no first-account, localized-name, or Demo-ID fallback. The
POS client sends payment destination/method data but cannot select or override
the liability account. Cash, card, transfer, split, installment, and deposit
destination choices remain visible.

The readiness endpoint is company-scoped and reports the related blocker in
the reservation area. The frontend maps this stable condition to a safe
localized state rather than exposing raw ORM/backend internals. Resolution
happens before the reservation/deposit/journal transaction writes; the service
uses transaction rollback and does not retry or replay a mutation.

Classification: `STALE_VERIFIER_ONLY`. No Product logic changed in CONT2 or
CONT3.

### Stale-assertion matrix

| Assertion | Old contract | Current contract | Stale? | Replacement evidence |
| --- | --- | --- | --- | --- |
| Reservation error | settings-only code/source | `422 CUSTOMER_DEPOSIT_ROLE_NOT_CONFIGURED` role resolver | Yes | bootstrap service, reservation transaction, current verifier |
| Liability selection | business-user/settings account choice | server-resolved protected role; payment destination still selectable | Yes | POS payload/UI and resolver assertions |
| Generic invoice create text | lifecycle-fields-only message | generic Invoice create is forbidden with a safe `403` response | Yes | direct controller runtime verifier |
| Posted invoice PATCH | generic guard `403` | posted-record guard `409`, before write | Yes | direct runtime verifier |

The active verifier search found no other stale reservation-deposit assertion.
The only exact obsolete posting-message occurrence was the permitted
`backend/scripts/verify-posting-status.js` assertion. Other active inventory
guard verifiers assert the current `GENERIC_INVENTORY_MUTATION_FORBIDDEN`
contract; historical phase material and comments were not changed.

## Verifier alignment and validation

`cd13598` changed only:

- `scripts/verify-pos-reservation-deposit-configuration.js`
- `backend/scripts/verify-posting-status.js`

The POS verifier now proves server-side company-role resolution, no client
override/account selector, valid legacy-setting adoption, account validation,
no fallback/name/Demo dependence, exact safe blocker, readiness mapping,
permissions, atomicity, and no replay. The posting verifier retains lifecycle
and transaction assertions and now proves the structured generic inventory
guard (`403`, `success:false`, `code` and `errorCode` both
`GENERIC_INVENTORY_MUTATION_FORBIDDEN`), dedicated receiving route, safe generic
invoice block, and posted-record `409` guard.

Targeted POS, post-reset bootstrap, permission catalog, reservation accounting,
journal/posting, ACC-1 accounting, treasury, POS, inventory, purchase-route,
AUTH-1, HF6E, branch/employee authorization, and Super Admin verifiers passed.
`verify-ledger-reporting-foundation` was initially blocked only by its
dirty-tree scope guard while the authorized verifier files were uncommitted;
it passed from the clean committed tree. The full suite then completed
`65/65 PASS`.

## Browser and API QA

Local browser QA used only `http://localhost:3000` and
`http://localhost:8000/api/v1`, with existing safe data and no write-capable
fixture. Arabic RTL and English LTR POS rendered on desktop and mobile; no
horizontal overflow, crash, infinite loading, or console error was observed.
The POS shows payment-destination choices and no liability-account selector.
The empty cart intentionally disabled checkout, so valid-role and missing-role
mutation paths were source/API-proven rather than forcing unsafe business
writes. The exact `422 CUSTOMER_DEPOSIT_ROLE_NOT_CONFIGURED` contract,
pre-write resolution, and no-partial-write behavior are covered by the runtime
verifier and service transaction evidence.

Supplier master data was present locally (four suppliers); the visible
supplier-recovery action is available, while empty-selector and unauthorized
states remain source-proven by the post-reset verifier. The inventory screen
has no fictional/first-row fallback. Its Arabic “Receive New Supply” action
was visibly confirmed to route to `/ar/suppliers/purchases`, whose supplier
receiving form is the supported intake workflow. Generic `/assets` mutation
remains rejected before controller writes. Supported receiving is transaction
backed; no receiving write was performed for QA.

Notification architecture was not changed. No duplicate toast was reproduced;
the known duplicate-toast item remains deferred and is not a RESET-1 closure
blocker.

API/reset-safety reconfirmation was source- and refusal-proven:

| Scenario | Endpoint/command | Evidence | Result |
| --- | --- | --- | --- |
| Company readiness | `GET /readiness/operations` | authenticated company-scoped route plus role resolver | safe blocker retained |
| Reservation account | reservation service | resolver before `Reservation.create`, transaction | no override or partial write |
| Generic inventory | generic `/assets` mutation route | stable `403` guard before controller | preserved |
| Supplier intake | `/supplier-purchases/receive` | dedicated transaction route | preserved |
| Reset protection | `node backend/scripts/reset-database.js --dry-run` | primary-name and production-environment refusal | no SQL, no demo seed |
| Startup data safety | server bootstrap and post-reset verifier | no automatic runtime admin/demo business data | preserved |

## Cleanup, data, and backups

All local services and the QA browser tab were closed. Ports 3000/8000 are
quiet. No temporary script or RESET1-BQA fixture remains; the isolated
`darfus_erp_reset1_qa` database remains absent. The primary local baseline is
unchanged: companies/suppliers/assets/journal entries = `9/4/20/53`; no Demo
company record was added. No auth/security counter was intentionally changed.

- Start archive: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_reset1_start_20260720_093812.dump` — 498,818 bytes; `pg_restore -l` valid (678 TOC entries).
- Final archive: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_reset1_final_20260720_110256.dump` — 501,936 bytes; `pg_restore -l` valid against local `darfus_erp` (custom archive, 685 TOC entries).

Typecheck passed. Lint passed with the existing 18 warnings and zero errors.
Production build passed. `git diff --check` passed. The known generated
`next-env.d.ts` development-path drift was restored only after all Next
processes stopped.

## Handoff

Production confirmation: **NO RESET, SEED, MIGRATION, CONFIGURATION,
DEPLOYMENT, OR DATA CHANGE**.

NEXT TOOL START HERE

RESET-DEPLOY1 — Controlled Production Bootstrap Recovery Deployment & Read-Only
Validation

Do not start deployment automatically. `NOTIF-PRE1` remains paused until
RESET-DEPLOY1 is closed.
