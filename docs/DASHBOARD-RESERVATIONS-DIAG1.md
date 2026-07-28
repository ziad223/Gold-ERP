# DASHBOARD-RESERVATIONS-DIAG1 — Partial diagnosis (2026-07-21)

## Scope and checkpoint

Diagnosis only at `main` / `6c5cec87324a57fbd91f30d22eb4711ab70bdfee`
(`docs: define full-at-sale deposit application contract`). The pre-existing
uncommitted DEPOSIT-1 receipt work was preserved; no Product, test, migration,
configuration, database, fixture, or deployment change was made. There were no
staged files and all 11 pre-existing stashes remained present.

## Proven render-loop chain — DASHRES-F001 (P1)

`useDashboardState` calls `useCoreErpData`. In API mode, every unresolved or
failed core query returns a newly allocated fallback array (`query.data ?? []`).
The dashboard hook passes eight of those arrays to the `LocalDashboardProvider`
`useMemo`. New fallback-array references recreate `provider`; `loadOverview`
depends on `provider`; the initial-load effect depends on `loadOverview`; and
the effect writes a newly-created overview object through `setOverview`.

```
Render after a query has no data
-> query.data ?? [] allocates fresh array(s)
-> provider useMemo changes identity
-> loadOverview useCallback changes identity
-> initial-load useEffect reruns
-> LocalDashboardProvider.getOverview returns a new overview object
-> setOverview(data)
-> render
```

`loadingRef` prevents overlapping calls but resets in `finally`; it does not
prevent this sequential effect cycle. `LocalDashboardProvider.getOverview` is
local computation over its snapshot; it does not issue the reservations request.
The provider is unstable in the failed/no-data state. `queryContext` is not the
proven changing dependency in this cycle: its scalar values remain stable during
the loop, though it unnecessarily depends on whole `user` and `company` objects.

## Reservations request and 422 status

The request originates in `useCoreErpData` through
`useApiItems("reservations", "/reservations")`. It is enabled when API mode,
technical auth readiness, technical authentication, no terminal-auth transition,
and (for a Branch Account) an active Employee operator are true. `apiClient`
uses stored branch state and emits `X-Branch-ID` only for values beginning
`BR-`; it does not use the React `activeBranchId` directly.

`GET /reservations` is routed through `authMiddleware` and
`requireAnyBusinessPermission(reservationPerms.view)` before
`reservationService.list`. The list endpoint itself has no query validation that
returns 422. Source-confirmed 422 candidates before the list include Branch
Account assignment/inactive/company-mismatch validation in `auth.middleware.js`
and a database validation error normalized by `error.middleware.js`; the exact
observed response cannot be selected from source alone.

The bounded unauthenticated control returned the expected HTTP 401 envelope:
`UNAUTHORIZED`, with the requested correlation ID. It does not reproduce the
reported 422 and is not used as a substitute for it.

## Retry and relationship classification

`shouldRetryApiQuery` explicitly returns false for a `DarfusApiError` 422.
Therefore TanStack Query's standard retry policy is not the request storm.
No dashboard provider retry, recursive reload, or direct reservations fetch was
found. The loop may amplify a failed query only through React error recovery or
component remounting; that runtime transition was not observable in the available
session. The relationship is **not yet classified** as A–D.

## Runtime blocker

The existing local frontend (`localhost:3000`) and backend
(`localhost:8000`) were observed but not started or stopped. The in-app browser
briefly rendered the authenticated Dashboard shell, then redirected to `/en/login`
before an authenticated request body, initiator stack, or update-depth error could
be captured. No credentials, storage values, browser session data, or write
fixture/session creation were read or used. Browser resource-timing access is not
available in this automation surface. The exact 422 code/message/correlation
body remains required evidence.

## Evidence-backed continuation contract

1. Preserve the current deposit work and use an owner-approved, existing,
   non-mutating authenticated context to capture one failing `/reservations`
   request: URL, headers excluding secrets, status, complete JSON body,
   correlation ID, initiator, and bounded count.
2. Determine the 422 producer from that correlation ID and classify the
   relationship to the render loop.
3. Only after step 1, implement a narrow fix. The currently proven slice is
   `hooks/use-core-erp-data.ts`: make every no-data fallback reference stable so
   provider identity does not change merely because an API query has no data.
   Do not change error status semantics or broaden backend authorization without
   the captured 422 evidence.
4. Add focused hook tests covering failed/no-data render stability, one overview
   load per stable context, and no change across a 422 result; add API/browser
   acceptance only after the actual 422 contract is known.

## DASHBOARD-LOOP-FIX1 — stability correction (2026-07-25)

Product commit `593b84c` (`fix: stabilize dashboard overview dependencies`)
changes only `hooks/use-core-erp-data.ts`. The six direct API-mode no-data
fallbacks that are passed to `LocalDashboardProvider` now use module-level typed
constants: Customers, Suppliers, Transfers, Reservations, Approvals, and
Purchase Orders. A valid API `[]` remains query data and is not replaced or
reinterpreted. The already memoized mapped collections, provider construction,
overview effect, calculations, API paths, query keys, headers, auth policy, and
backend are unchanged.

The resulting failure path is stable: an unresolved or 422 query supplies the
same fallback reference across rerenders, so the provider, `loadOverview`, and
initial effect retain their identities for an unchanged semantic context. The
API error remains visible; this phase does not claim to resolve its 422 status
or producer.

`node --test tests/dashboard-loop-stability.test.mjs` passed (2/2). Its focused
regression contracts assert the six module-level fallbacks and retain the
provider/effect dependency boundary. `npm run typecheck`, targeted ESLint for
the changed files, `npm run build`, and `git diff --check` all passed. Local dev
processes used for the prior diagnostic attempt were stopped; only the adopted
local PostgreSQL listener remained. No authenticated runtime capture was
available in this fix phase, so Browser/request-count evidence remains pending.

## DASHBOARD-RESERVATIONS-DIAG1-CONT2 — payment schema diagnosis (2026-07-25)

The owner-captured authenticated `GET /api/v1/reservations` response is exactly
explained by PostgreSQL `42703` (`errorMissingColumn`):
`column payments.cash_transaction_id does not exist`. The active source target
is development `::1:5432/darfus_erp`, schema `public`, search path `"$user",
public`, with no `DATABASE_URL` override and SSL disabled. Both `payments` and
`reservation_payments` are public base tables, but neither has a cash-related
column. The owner-visible `payments` identifier is the Sequelize include alias:
the generated SQL joins `reservation_payments AS payments` and selects
`payments.cash_transaction_id`.

The exact source path is `GET /reservations` → `reservationService.list` →
`Reservation.findAndCountAll` → `ReservationPayment` include `as: "payments"`.
The same include exists in reservation detail. Current uncommitted
`reservationPayment.model.js` defines `cashTransactionId` mapped to
`cash_transaction_id`, so Sequelize selects it by default. Current uncommitted
forward-only migration `20260721020000-branch-reservation-deposit-financial-settings.js`
adds that exact nullable FK column to `reservation_payments`; its irreversible
down path refuses destructive rollback.

The official local history contains 48 migrations and the source contains 50;
the only source-not-history entries are `20260721020000` and the dependent
receipt-document `20260721030000`. No history entry lacks a source file. The
cash-link model field and its migration are not present at committed HEAD and
the migration has no Git history because it is untracked preserved Deposit work.
Earlier committed reservation migrations created the base payment model and the
separate `reservation_refunds.cash_transaction_id`, not the missing payment
column.

Read-only reproduction used an explicit `SET TRANSACTION READ ONLY`, selected
no business rows, received the same PostgreSQL error, and rolled back. The
middleware maps every `SequelizeDatabaseError` to HTTP 422
`VALIDATION_FAILED`, Arabic generic validation text, and `errors.body`; this
misclassifies a server schema fault as client validation but was not changed.

## Status

**DASHRES-F001 FIXED — STATIC/BUILD PROVEN; RUNTIME ACCEPTANCE PENDING.**
**DASHRES-F002 ROOT CAUSE PROVEN — PENDING MIGRATION CONFIRMED.** No migration,
schema, Product, test, or preserved Deposit change was made in this diagnosis.

## Exact follow-up contract (not implemented)

`DASHBOARD-RESERVATIONS-FIX1` must first prove the same local target, create and
validate a local `pg_dump` archive, then run only the ordered pending migration
set beginning with `20260721020000`; it must never issue manual `ALTER TABLE` or
remove the model field. Before any later `20260721030000` application, the phase
must record whether the receipt-document model/service is part of the approved
release set and retain migration ordering. It must verify the resulting nullable
FKs/indexes, migration-history rows, and no duplicate column.

Acceptance must prove a successful authenticated reservations list and detail,
no `42703` or schema-derived 422, intact reservation payment/history and cash
linkage, no cross-company/branch regression, dashboard stability, focused
backend regression, typecheck/lint/build, an upgrade-from-current-baseline path,
and no Production/Staging access. Error classification must remain unchanged
unless a separately authorized semantics repair is included.

NEXT TOOL START HERE

`DASHBOARD-RESERVATIONS-FIX1` — Apply only the evidence-backed pending-migration
correction with a local backup, exact migration gate, and focused read acceptance.
Do not start automatically.

## DASHBOARD-RESERVATIONS-FIX1 — local schema repair complete (2026-07-25)

The approved local development target was re-proven as `::1:5432/darfus_erp`,
schema `public`, with a read-only preflight: 48 applied migrations, both cash
link columns absent, and no partial cash FK/index state. An external validated
custom-format backup was created at `C:\Users\NEGM\AppData\Local\DARFUS-backups\darfus_erp-before-20260721020000-2026-07-25T18-57-46-532Z.dump`
(371,594 bytes; `pg_dump` and `pg_restore -l` exit 0).

Only `npx sequelize-cli db:migrate --env development --to
20260721020000-branch-reservation-deposit-financial-settings.js` was run. It
completed once; history is now 49, the receipt migration `20260721030000`
remains pending, and receipt-document tables remain absent. The two nullable
`varchar(255)` fields now exist on `reservation_payments` with the intended
`CASCADE/RESTRICT` FKs. The pre/post reservation-payment row count and ID
checksum are both zero/empty-set; no business rows were created or changed.

An explicit read-only ORM transaction proved default `ReservationPayment`,
reservation list include, and reservation-detail include queries no longer
raise `42703`. An owner-authorized Arabic Administrator session loaded the
dashboard and reservations screen after reload with zero console warnings,
schema errors, or `Maximum update depth` errors during bounded observation.
The visible authorized context contained no reservations, so a real detail
record and non-null cash/session association require later controlled formal
acceptance, not fixtures in this phase. `DASHRES-F004` remains open and was not
changed. Static dashboard test 2/2, typecheck, lint (18 warnings/0 errors), and
production build passed.

NEXT TOOL START HERE

`DASHBOARD-RESERVATIONS-ACCEPT1` — Formally accept the repaired
reservation-payment schema and dashboard behavior through controlled regression
and release-readiness checks. Do not start automatically.

## DASHBOARD-RESERVATIONS-ACCEPT1 — partial local acceptance (2026-07-25)

Local target/history/schema remain correct: 49 migrations, `20260721020000`
once, receipt migration pending, and both nullable cash-link FKs present. An
owner-authorized Arabic Admin session loaded the reservations empty state and
Arabic/English dashboards after bounded reloads with zero `42703`, schema-422,
or `Maximum update depth` evidence. One transient stale Next development chunk
recovered on reload; remaining generic console objects were paired with a
Chrome extension entry and carried no application schema message.

A rollback-only, zero-value `ACC-DASHRES-*` fixture graph proved null scalar
links, linked scalar IDs, FK company/branch integrity, and list/detail payment
includes; customer, reservation, two payments, draft cash row, and closed
zero-value session all had zero residue after rollback. However, source defines
no `ReservationPayment` association to `CashTransaction` or
`CashRegisterSession`; both attempted includes raise `SequelizeEagerLoadingError`.
Thus linked ORM-object hydration cannot be accepted without an out-of-scope
Product integration. Account/Employee/direct-deny/cross-company matrices were
unavailable from the single authorized Admin session and one-company local data.

Release classification: `APPLIED_LOCALLY_BUT_SOURCE_UNCOMMITTED`. Required
coherent integration is `DEPOSIT-1-FIX-CONT4C`, covering the modified
`reservationPayment.model.js`, untracked `20260721020000` migration,
branch-financial mapping/resolver contract, and any required association wiring.
Staging/Production remain blocked until `APPLIED_LOCALLY_AND_SOURCE_COMMITTED`.

NEXT TOOL START HERE

`DASHBOARD-RESERVATIONS-ACCEPT1-CONT2` — Resolve only the named missing
ReservationPayment cash/session ORM-association and source-integration gap; do
not broaden financial behavior or start automatically.

## DASHBOARD-RESERVATIONS-ACCEPT1-CONT2 — source integration closed (2026-07-25)

Commit `9d391c4` coherently records the locally applied `20260721020000`
schema slice. Its migration SHA-256 is
`A95A8EC158412FFD436E4FF6A81A0C6E936CA12C46A1DB88E661A016B6FFE31E`,
which matches the applied local source. The commit contains the migration,
ReservationPayment and application fields, BranchFinancialMapping model/index
wiring, branch-scoped resolver, and focused test; it excludes the pending
receipt migration, receipt models/services, routes, UI, refund, and complete-sale
work.

`ReservationPayment` now has explicit nullable `belongsTo` aliases
`cashTransaction` and `cashRegisterSession`. A zero-value rollback-only
`ACC-DASHRES2-*` graph proved null and non-null hydration, nested reservation
payment hydration, scalar-ID agreement, no duplicate payments, same-company and
same-branch references, and zero residue. Existing service list/detail reads
remain scalar-only and backward-compatible. Missing branch mappings fail closed;
no company fallback and no client financial authority are accepted.

`DASHRES-F006` is closed. Migration history remains 49 with receipt migration
`20260721030000` pending. The local source/database classification is now
`APPLIED_LOCALLY_AND_SOURCE_COMMITTED`. `DASHRES-F004` remains open separately.
The current browser surface had no authorized session, so a fresh multi-account
company/branch/Employee/direct-deny matrix remains unavailable; prior bounded
dashboard stability evidence is retained.

NEXT TOOL START HERE

`DASHBOARD-RESERVATIONS-ACCEPT1-CONT3` — Complete only the missing multi-account
company/branch/Employee/direct-deny acceptance matrix. Do not start automatically.

## DASHBOARD-RESERVATIONS-ACCEPT1-CONT3 — authenticated API acceptance (2026-07-25)

Local development remained `localhost/::1:5432/darfus_erp`, public schema,
49 migrations; `20260721020000` is applied once and receipt migration
`20260721030000` remains pending. A new validated backup was created outside
Git before fixtures (377,367 bytes; `pg_dump`/`pg_restore -l` exit 0).

Disposable owned principals used real login and Employee verification. Company
Admin own-scope list/detail passed; selected other-branch detail was 404;
foreign-company header was 403 `COMPANY_SCOPE_FORBIDDEN`; foreign detail was
404. A Branch Account without an Employee was 401
`BRANCH_ACCOUNT_EMPLOYEE_REQUIRED`; a verified Employee was limited to its
branch; a direct denial over a grant was 403
`EMPLOYEE_PERMISSION_DENIED`; and selected-company/branch Super Admin reads
passed without bypassing selected branch scope. No unauthorized reservation,
payment, cash/session, or mapping data appeared.

All owned rows, sessions, verification attempts and exact owned audit events
were removed with zero residue. `DASHRES-F007` is CLOSED for authenticated API
authorization/isolation. Multi-account Browser UI remains
`UNAVAILABLE_WITH_SAFE_EVIDENCE` because no authorized browser session exists
and credentials were not injected or exposed; this is not a Product defect.
`DASHRES-F004` remains separately open.
