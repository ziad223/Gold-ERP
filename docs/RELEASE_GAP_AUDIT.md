# Release Gap Audit

## OFFICIAL-LOCAL-FINANCIAL-FIX-CONT3 — partial — 2026-07-30

F003 code now validates locked persisted installment state in exact four-decimal units without a float tolerance. Fresh migrated disposable HTTP proof passed rejection, precision, replay, and concurrent serialization; F001/F002 coverage remains pass. Persistent Product-API proof needs a new valid installment because the only retained installment is the immutable over-collected one. No linked supported reversal, refund, or credit workflow was found, so no correction was attempted. Pre-F003 backup and disposable restore passed. Next: `OFFICIAL-LOCAL-FINANCIAL-FIX-CONT3`.

## OFFICIAL-LOCAL-FINANCIAL-FIX-CONT2 — 2026-07-30

`FINANCIAL-ACCEPT-F002` is resolved by code-only event identity: a collection
Payment is created inside the existing transaction before its journal, and the
journal uses `installment_collection` plus that Payment identity. The global
`(company_id, source_type, source_id)` uniqueness index remains unchanged;
legacy aggregate journal rows remain untouched. Fresh and restored-upgrade
disposable proofs passed, as did the pre-change backup restore rehearsal.

Persistent replay proved a second partial collection creates a distinct,
balanced event journal. It then exposed `FINANCIAL-ACCEPT-F003`:
`INSTALLMENT_OVER_COLLECTION_TOLERANCE_ACCEPTED`. A request above the exact
remaining balance by the route tolerance was accepted and settled the retained
installment with a positive overage. No automatic rollback, reset, or data
deletion was performed. Financial acceptance remains partial; next only:
`OFFICIAL-LOCAL-FINANCIAL-FIX-CONT3`.
## OFFICIAL-LOCAL-FINANCIAL-FIX-CONT1 — PARTIAL — 2026-07-30

`FINANCIAL-ACCEPT-F001` is resolved by the narrow installment collection repair:
the route now authorizes the persisted invoice Branch identifier and supplies it
to the mapping-backed posting service; the service no longer treats the
installment display label as authority. The new focused contract failed before
the repair, passed after it, and passed cash/bank mapped posting on a migrated
disposable database with zero residue. A retained local bank collection then
passed with replay and conflicting-payload protection; it wrote one payment,
treasury movement, and balanced installment journal.

Continuation is blocked by newly proven `FINANCIAL-ACCEPT-F002`:
`PARTIAL_INSTALLMENT_SECOND_COLLECTION_JOURNAL_UNIQUENESS_CONFLICT`. The
retained installment remains `partial`, but a second collection returns
canonical `409 STATE_CONFLICT` before any new payment, treasury, or journal
row. The cause is the partial unique journal index over Company, source type,
and source ID, while each collection attempts a new `installment` journal for
the same installment. No reset, restore, or deletion occurred. Next only:
`OFFICIAL-LOCAL-FINANCIAL-FIX-CONT2`.

## OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-CONT1 — PARTIAL — 2026-07-30

Persistent local Product acceptance began at `ce2f8be1` with `52/52/0`,
financial/setup `READY`, 12/12 account roles, and 11/11 Branch mappings.
Pre-backup and disposable restore passed. Product-owned customer/supplier
creation, inventory receipt, supplier cash/bank settlement, cash/bank sales,
and their same-key replays passed and the valid rows are retained.

`FINANCIAL-ACCEPT-F001` is OPEN, P1, release-blocking:
`INSTALLMENT_COLLECTION_BRANCH_MAPPING_CONTEXT_LOSS`. A posted receivable sale
created its installment, but the supported bank collection endpoint returned
canonical `422 FINANCIAL_MAPPING_REQUIRED` twice. The route derives a null
Branch value from an ID-format predicate and calls posting with the installment
Branch display value instead of the validated Branch ID. No collection payment,
treasury row, or collection journal was written. No reset, restore of the
official database, service restart, or Product repair occurred. Exact next
marker: `OFFICIAL-LOCAL-FINANCIAL-FIX-CONT1`.

## OFFICIAL-LOCAL-FIRST-RUN-FIX-CONT1 — COMPLETE — 2026-07-30

`LOCAL-FIRST-RUN-UI-F001` is RESOLVED_BY_RUNTIME_REPLAY. No Product source
bytes changed. Investigation showed that the pre-existing `next dev` route
manifest had registered only the setup/login route subset although the full
source and production route manifests included the dashboard group. A
non-semantic existing-layout hot-reload event registered the dashboard,
Chart-of-Accounts, and settings routes in that same process; each returned
200, and an authenticated dashboard hard refresh had no 404 boundary.

The guarded First Run result remains intact: one active Super Admin, Company,
Branch, 12/12 account roles, 11/11 Branch mappings, and financial/setup
`READY` at `52/52/0`; journals and journal lines remain zero. Typecheck passed
and lint returned zero errors with 18 inherited warnings. No service restart,
database mutation beyond the accepted First Run setup, migration, deployment,
or source-code repair occurred. Exact next marker:
`MANUAL-LOCAL-SMOKE-CONT1`.

## OFFICIAL-LOCAL-FIRST-RUN-HARNESS-FIX-CONT1 continuation 2 — PARTIAL — 2026-07-30

The approved local-only administrator credential passed the exact First Run
policy without retaining its value. The supported guarded bootstrap returned
`201`, then created one active Super Admin, the required Company and Branch,
the complete 12/12 Company account-role catalog, 11/11 required Branch
mappings, and `READY` setup/financial readiness. Same-key replay returned 200
without a duplicate write; fresh-key repeat setup and missing/invalid-token
guards returned canonical 409/403 responses. API login, authenticated profile,
logout, post-logout 401, and a second normal login passed.

`LOCAL-FIRST-RUN-UI-F001` is OPEN, P1, release-blocking:
`DASHBOARD_ROUTE_GROUP_404_AFTER_VALID_ADMIN_LOGIN`. The existing Frontend
runtime accepted the valid administrator login but returned HTTP 404 for the
dashboard, Chart-of-Accounts, and settings routes. The corresponding route
source files exist and the same runtime serves the login route successfully.
No Product repair, service restart, database reset, migration, or deployment
was performed. The local baseline is now `52/52/0`; First Run business setup
is complete but UI acceptance is not. Exact next marker:
`OFFICIAL-LOCAL-FIRST-RUN-FIX-CONT1`.

## FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT4 — COMPLETE — 2026-07-30

Started on `main` at
`957d5374ae0687ebbf56c5bddc9ee827539b4306`
(`docs: record final financial runtime regressions`). Source ownership proved
that treasury transactions, cash-register state, customer deposits/refunds,
supplier payments, reservation settlement, sales returns/exchanges, and
treasury-backed posting helpers still crossed legacy cash/bank account-code
boundaries. The unchanged disposable reproduction returned canonical 422 for
cash, bank, expense, and other-income attempts with zero business, journal,
journal-line, or account delta.

Implementation commit `2b97e6a` (`fix: resolve treasury accounts from branch
mappings`) adds the central required-Branch-mapping resolver and routes cash
through `CASH_TREASURY`, bank through `BANK_ACCOUNT`, expenses through the
selected account or `DEFAULT_EXPENSE`, income through `OTHER_INCOME`, and
deposit/payable/reservation/sale settlement through their canonical roles.
Client return-settlement payloads no longer carry account codes. All required
accounts resolve inside the caller transaction before the business row or
journal is created.

The failing-before contract was 1/15 pass and 14/15 fail; after repair it was
15/15 pass. Complete Node inventory passed 143 with zero failures and three
intentional opt-in skips; permission baseline was 128/128; typecheck passed;
targeted lint had zero errors and two inherited image warnings; diff and
protected hashes passed. Historical verifiers were updated to assert mapped
authority and all focused reservation, customer-credit, ledger, return,
exchange, statement, treasury, and authorization verifiers passed after the
implementation commit.

On the unique disposable `52/52/0` database, supported First Run retained
12/12 roles, 11/11 mappings, and `READY`. Cash, bank, expense-cash,
expense-bank, other-income-cash, and other-income-bank each returned 201.
They created six business rows, six balanced journals, and twelve lines with
zero transaction-time account creation. Same-key replay added zero rows.
An unmapped active synthetic Branch returned
`FINANCIAL_MAPPING_REQUIRED`/422 with zero write delta. An incompatible
expense-to-bank mapping attempt returned
`FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE`/422, preserved the valid bank
mapping, and produced zero business/journal/account delta.

The owned high-port backend, disposable database, and temporary evidence were
removed with zero residue. Official 3000/8000 remained healthy; an
unauthenticated treasury POST returned 401. Official `darfus_erp/public`
remained read-only at `52/51/1`, with unchanged account, role, mapping,
journal, and journal-line baselines and zero idle/waiting locks.
`FINANCIAL-BOOTSTRAP-F005 = RESOLVED`; open release-blocking financial
findings are zero. Full posting/report acceptance remains pending. Exact next
marker: `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT4`.

## FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT3 — PARTIAL — 2026-07-30

Independent acceptance started on `main` at
`aa86fe499ddedf81fb74eaad91a5aa0ebb1f3721`
(`docs: resolve financial account integrity regression`). Git, protected
hashes, package/lockfile, migration 52, owner-managed runtime, and the
read-only official database all matched the accepted baseline. The unchanged
static inventory passed 147 tests with zero failures and three opt-in skips;
permission baseline 128/128, typecheck, and lint with zero errors and 18
inherited warnings also passed.

A unique empty disposable PostgreSQL database had zero Product tables before
migration and reached `52/52/0`. Owned loopback-only backend/frontend
children used high ports. Supported First Run created one synthetic Company
and first Branch, produced 12/12 stable account roles and 11/11 Branch
mappings, and reached setup and financial `READY`. Same-key replay was
idempotent and a new setup request was rejected after completion.

Real Product UI acceptance passed the Chart of Accounts, code search,
independent type filtering, custom operating-expense account creation and
safe display edit, financial readiness display, and all 11 Branch-mapping
rows. `BANK_ACCOUNT` eligibility contained only the compatible stable BANK
account and excluded a generic posting Asset. A semantic BANK account edit
was surfaced as a canonical protected-configuration rejection; generic Asset
to BANK mapping returned canonical 422, preserved the valid mapping, produced
zero financial writes, and retained `READY`.

The mandatory posting gate then reopened `FINANCIAL-BOOTSTRAP-F005`.
Supported cash, bank, operating-expense, and other-income treasury postings
all returned canonical 422 before any business row or journal was created.
The treasury route still resolves cash and bank through legacy fixed account
codes `1110` and `1120`; fresh First Run instead supplies the authoritative
Branch financial mappings and stable system accounts. This exact contract
mismatch prevents the required fresh-database posting lifecycle.

Per the acceptance-only stop rule, deposit, supplier-payable, inventory/COGS,
ledger, statements, financial reports, scope, and end-to-end idempotency
claims were not continued. Product/test/migration/package/configuration files
were unchanged. Logout succeeded. The browser, owned children, disposable
database, temporary secrets, dependencies, and evidence were removed with
zero residue.

Official 3000/8000 remained healthy. Official `darfus_erp/public` remained
`52/51/1`, migration 52 unapplied, with exact preflight account, role,
mapping, journal, and journal-line fingerprints and zero idle transactions or
waiting locks. Classification:
`FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT3 = PARTIAL`; reopened finding:
`FINANCIAL-BOOTSTRAP-F005`; safe cause:
`TREASURY_POSTING_LEGACY_ACCOUNT_CODE_RESOLUTION`. Release, Staging, and
Production remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT4`.

## FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT3 — COMPLETE — 2026-07-30

Started on `main` at `d739150f088ac29700d7d3e0db5179785ba146b2`.
The runtime defect was reproduced only on a disposable database: an active
stable-role/mapped BANK account accepted an incompatible semantic update.

`4fae9fd387a4e0831240d38646b23ecb12d9468e` adds one pure proposed-state
validator and wires it into the canonical account update/deactivation service.
It validates Company, hierarchy, journal references, all stable-role bindings,
and every active Branch mapping before persistence. Type, nature, statement
classification, posting, and active-state violations now return canonical 422
without detaching or rewriting roles/mappings.

Generated catalog tests cover 12/12 account roles and 11/11 mapping roles.
The fresh `52/52/0` PostgreSQL proof passed First Run, a safe BANK display edit,
all protected semantic rejections, unchanged account/role/mapping/journal
state, READY readiness, logout, database removal, and zero residue. Complete
Node inventory: 147 pass, zero fail, three opt-in skips; permission 128/128;
typecheck PASS; lint errors 0 with 18 inherited warnings.

Official runtime remained healthy and official `darfus_erp/public` remained
read-only at `52/51/1`. `FINANCIAL-BOOTSTRAP-F010 = RESOLVED`; open financial
blockers 0. Full posting/report runtime acceptance remains pending. Exact next
marker: `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT3`.

## FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT2 — PARTIAL — 2026-07-30

The phase started on `main` at
`618b2ff5b185668a5235bfbd80444249c3e7b42c`
(`docs: resolve financial runtime acceptance regressions`). Preflight passed:
zero staged/untracked or semantic changes, 11 stashes, no remotes, exact
protected/package/lock/migration hashes, healthy owner-managed services, and
official `darfus_erp/public` unchanged at `52/51/1`.

The complete recursive Node baseline passed 137 tests with zero failures and
two intentional opt-in skips. Permission baseline 128/128, typecheck, lint
with zero errors and 18 inherited warnings, and diff/hash gates passed.

A new empty disposable PostgreSQL database was migrated to `52/52/0`. Owned
loopback backend/frontend children used dynamic high ports and synthetic
memory-only credentials. Supported First Run created one Company and Branch,
12/12 stable account roles, 11/11 Branch mappings, READY setup/financial
state, and no duplicate or cross-scope bindings. A second First Run returned
the canonical already-complete conflict with zero account/role/mapping delta.

Real Chart UI acceptance passed code/name search; type, classification,
active, and posting filters; combined/clear/no-results behavior; ancestor
context; unrelated-branch removal; canonical ordering; zero duplicate nodes;
keyboard labels; and RTL logical indentation. A custom operating-expense
posting account was created and its display field edited through the Product
UI without changing Company or accounting semantics. The eligible-account UI
included the valid BANK role account, excluded a generic posting Asset, and
included the custom operating-expense account for `DEFAULT_EXPENSE`. Direct
generic Asset to BANK mapping returned canonical 422, preserved the valid
mapping, and kept readiness READY with zero financial delta.

The mandatory Account Integrity gate then proved a Product regression. A
supported PATCH changed the active BANK stable-role/mapped account from Asset
classification to Liability and returned 200. The account remained referenced
by one stable role and one active Branch mapping; readiness changed from READY
to BLOCKED with one invalid mapping. Account count remained unchanged.
`financial-account.service.updateAccount` protects type/nature only after
journal lines exist and does not protect stable-role or active-mapping
references; `statementClassification` is also unguarded. This reopens
`FINANCIAL-BOOTSTRAP-F010`.

Posting, ledger, statement, report, scope, and idempotency acceptance were not
executed after the mandatory stop. Owned browser sessions logged out normally
and active sessions reached zero. All owned processes, the disposable
database, temporary dependencies, secrets, and evidence were removed.
Official runtime owners remained continuous and official financial
fingerprints matched preflight exactly.

Classification: `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT2 = PARTIAL`.
Open release-blocking financial findings: 1. Release, Staging, and Production
remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT3`.

## FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT2 — COMPLETE — 2026-07-30

The phase started on `main` at
`cec124afe0d8cdf91e8f3af2a4ae53891f383b48`
(`docs: record financial runtime acceptance regressions`) and produced
implementation commit `0d23ea306a49271ad12d5c67304ad0f5e01cbf57`
(`fix: complete financial account configuration contracts`). Preflight had
zero staged/untracked files, 11 stashes, no remotes, exact package/lock and
protected hashes, healthy owner-managed 3000/8000/5432 services, and official
`darfus_erp/public` at source/applied/pending `52/51/1`. The known generated
`next-env.d.ts` path drift was normalized to exact committed bytes before
work; it was never staged.

F003 was reproduced in source: the Chart list had no search, type,
classification, active-status, or posting-status controls. The combined
pre-repair contract failed `0/6`. The repair adds normalized code/name
search, independent type/classification/active/posting filters, clear-all,
loading/error/empty/no-results states, keyboard-labelled controls, and
logical RTL indentation. A deterministic hierarchy reducer retains only
matching nodes plus required ancestors, removes unrelated branches, prevents
duplicates, and preserves canonical sibling ordering. Account reads remain
Company-scoped and are gated by `accounting.view`.

F010 was reproduced from the accepted boundary: active/posting/type/nature
were the only mapping checks. The canonical Branch-mapping catalog now
declares exact stable account roles for all 11 required mappings and one
explicit `operating_expense` family for `DEFAULT_EXPENSE`. A single backend
compatibility service validates Company/Branch scope, active/posting status,
classification, and stable role authority; it supplies the eligible-account
API, transactional mapping update, readiness, reconciliation, and central
resolver legacy-row defense. Rejections use canonical 422
`FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE` with safe mapping-role/reason fields
and no internal identifier. The frontend removed its broad-type rule table
and consumes the permissioned backend eligibility endpoint.

The new CONT2 contract passes `7/7`; focused financial/First Run coverage
passes `22/22`; the full Node inventory reports 137 pass, zero fail, and two
intentional disposable-DB skips. Permission baseline 128/128, typecheck,
targeted lint, and diff check pass. On a unique disposable database all 52
migrations applied, First Run reached READY with 12 roles and 11 mappings,
a generic posting Asset was rejected as BANK with the prior valid mapping
and all account/mapping/audit/journal counts unchanged, the central resolver
rejected an injected legacy-invalid row, and an explicit operating-expense
family account was accepted and preserved by reconciliation. The database
was dropped with zero residue.

Read-only official smoke returned frontend/chart/backend `200`; the new
endpoint returned unauthenticated `401`. No service was controlled. Official
financial fingerprints exactly matched preflight, idle/waiting locks were
`0/0`, and migration state remained `52/51/1`. F003 and F010 are RESOLVED;
open release-blocking financial findings: 0. Full posting/report runtime
acceptance remains unexecuted after the prior mandatory stop boundary.
Release, Staging, and Production remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT2`.

## FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT1 — PARTIAL — 2026-07-30

Independent acceptance started at exact checkpoint
`894350ace3c410172262b446179ecec32cd58688` on `main`. Git preflight passed
with zero staged/untracked files, 11 stashes, no remotes, exact package and
protected hashes, and only the three inherited CRLF-only backend artifacts.
The official owner-managed listeners remained healthy on 3000/8000/5432 and
official `darfus_erp/public` was read-only at `52/51/1`.

The static baseline passed unchanged: financial/First Run 23/23, `.mjs`
59/59, `.cjs` 58 pass plus one intentional disposable-DB skip, permission
catalog 128/128, typecheck, targeted lint, and diff check.

A unique empty disposable PostgreSQL database was migrated to `52/52/0`.
An owned backend child used a dynamic loopback-only port in the authorized
13000–13999 range. Real First Run through `/setup/bootstrap` succeeded,
created one synthetic Company and Branch, reached setup READY and financial
READY, produced 12/12 system account roles and 11/11 required Branch
mappings, and produced zero duplicate account-code groups. No official rows,
copied rows, seed data, or manual bootstrap SQL were used.

Acceptance then proved two Product regressions and stopped before financial
posting/report execution:

1. `FINANCIAL-BOOTSTRAP-F003` is REOPENED. The Chart-of-Accounts list has no
   search/filter control despite the accepted runtime requirement. Its Branch
   mapping candidate selector also filters only by active, posting, and broad
   account type; it does not enforce stable semantic role compatibility.
2. `FINANCIAL-BOOTSTRAP-F010` is REOPENED. Through the supported API, a
   synthetic active posting Asset with no BANK system-role binding was
   accepted as `BANK_ACCOUNT` with HTTP 200. The endpoint validates only
   Company/Branch, active/posting, type, and nature. It does not require the
   selected account to be the compatible stable role-bound account. The
   original valid mapping was restored through the same API and readiness
   returned to READY before cleanup.

Because Product code is required to close these defects, the phase did not
continue with posting, ledger, statement, or report runtime assertions.
Logout returned 200. The owned backend exited, the disposable database was
dropped, no high-port listener remained, and all temporary secrets remained
process-only.

Official postcheck remained `52/51/1`; account, role, mapping, journal, and
journal-line fingerprints exactly matched preflight; idle transactions and
waiting locks were 0/0. `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT1 = PARTIAL`.
Open release-blocking financial findings: 2. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT2`.

## FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT1 — complete — 2026-07-30

The repair started at exact checkpoint
`387c5f8dfd1e4e15e6d949dafc68504b2a39de8f` on `main` and produced
implementation commit `6fa27b5a01e36ae4425a0f320c6943fb7ecbcb57`
(`feat: complete financial account bootstrap`). Preflight preserved 11
stashes, zero remotes, the protected semantic baseline, the required
`next-env.d.ts` hash, and the owner-managed 3000/8000/5432 runtime.

The implementation establishes versioned catalogs of 12 required Company
account roles and 11 required Branch mapping roles. First Run now reconciles
that complete baseline and evaluates financial readiness before setup can
become READY. Existing environments have an explicit, permissioned,
transactional, idempotent reconciliation API and UI; valid existing mappings
are preserved.

Account administration now uses a dedicated domain service and Chart of
Accounts UI. It enforces Company ownership, unique codes, compatible
hierarchies, cycle prevention, posting status, mapped-account lifecycle
guards, and non-destructive deletion. All posting account resolution is
centralized and fail-closed; business posting no longer creates accounts.
Statement Branch scope uses the shared authorization resolver. GL-backed
Income Statement and Balance Sheet endpoints and UI use posted journal lines
and semantic classifications.

The authorized source migration adds posting/classification/bootstrap
metadata and reference/idempotency safeguards. It was applied, rolled back,
and reapplied only on disposable PostgreSQL databases. Fresh First Run
produced 12 roles, 11 mappings, READY status, and an idempotent no-op replay.
A legacy-shaped disposable installation reconciled without replacing valid
configuration. Missing required mapping caused a canonical failure with zero
business/journal/account writes. Synthetic GL reports reconciled and the
balance-sheet equation held. All disposable databases were dropped.

Validation: the new contract failed 0/8 before repair and passes 8/8 after
repair; the focused financial/First Run suite passes 23/23; all `.mjs` tests
pass 59/59; `.cjs` tests pass 58 with one intentional disposable-DB skip;
permission baseline remains 128/128; typecheck, targeted lint,
`git diff --check`, ledger/reporting verifier, and post-reset bootstrap
verifier pass.

The official database was not migrated or mutated. Its final state is source /
applied / pending `52/51/1`, with exact preflight account, mapping, journal,
and journal-line fingerprints unchanged, zero waiting locks, and no disposable
database residue. The existing runtime remained owner-managed; backend hot
reload was observed without service control.

Disposition: `FINANCIAL-BOOTSTRAP-F001`, `F002`, `F003`, `F005`, `F007`,
`F008`, `F009`, and `F010` are RESOLVED. Open release-blocking financial
findings: 0. Release, Staging, and Production remain unauthorized. Exact next
marker: `FINANCIAL-ACCOUNT-RUNTIME-ACCEPT-CONT1`; it was not started.

## FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1 — fresh-install financial readiness audit — 2026-07-30

The audit started at exact checkpoint
`1a490b4ecb937bb3ed17a6238fae15c65489bc01` on `main`
(`docs: accept final employee authorization runtime`). Preflight confirmed zero
staged files, 11 stashes, no remotes, the protected semantic baseline, the
required `next-env.d.ts` hash, owner-managed listeners on 3000/8000/5432, and
official `darfus_erp/public` at source/applied/pending `51/51/0`. The three
inherited backend CRLF-only artifacts remained unstaged.

### Ownership and supported-flow map

- `backend/src/services/first-run-bootstrap.service.js` owns the atomic initial
  Company/Branch/account creation. Its current template creates seven
  Branch-owned accounts, six final-sale system roles, and two reservation/cash
  mappings.
- `backend/src/services/first-run-setup-state.service.js` marks setup READY
  against that same narrow minimum. It does not require bank, supplier payable,
  opening equity, operating expense, or other-income readiness.
- `backend/src/services/company-bootstrap.service.js` validates the strict
  final-sale roles and can bootstrap only the reservation-liability role for a
  Branch; it is not a complete financial onboarding flow.
- `backend/src/services/posting.service.js` contains a broader canonical chart
  but lazily creates missing Company-scoped accounts while a transaction is
  posting. Most legacy posting flows therefore self-heal instead of failing
  closed on missing explicit Branch financial authority.
- `backend/src/models/account.model.js`,
  `systemAccountRole.model.js`, and `branchFinancialMapping.model.js` own the
  account and mapping records. Account code uniqueness, parent-account foreign
  keys, circular-hierarchy protection, and a posting/non-posting contract are
  not enforced by the schema.
- `backend/src/routes/erp.routes.js` exposes generic account CRUD, strict
  reservation mapping settings, account statements, trial balance, and ledger
  reports. `app/[locale]/dashboard/accounting/page.tsx` consumes accounts for
  journals/statements/reports but provides no supported Chart-of-Accounts
  create/edit/deactivate/hierarchy workflow.

### Read-only official baseline

The official database contains 19 active Company-scoped accounts and no
Branch-scoped accounts, system-role rows, or Branch financial mapping rows.
All five active Branches fail the accepted six-role/two-mapping readiness
minimum. Existing journal headers and lines are balanced by the observed
aggregate checks, with no cross-Company line or duplicate source group found.
These are anonymized counts only; no account names, identifiers, balances, or
business payloads were retained.

### Disposable PostgreSQL proof

A uniquely named local disposable database was target-proven on PostgreSQL
5432, migrated through all 51 source migrations, and exercised with
`tests/first-run-postgres.integration.test.cjs`. Rollback, advisory-lock
concurrency, replay idempotency, and setup-state acceptance passed. The fresh
result contained one Company, one active Branch, seven Branch-scoped accounts,
six system roles, two active Branch mappings, one setup-state row, and zero
duplicate account-code groups. The database was dropped and prefix residue was
verified as zero. No migration or write-capable test targeted official
`darfus_erp`.

### Capability decision

| Area | Classification | Evidence |
| --- | --- | --- |
| Chart of Accounts schema | PARTIAL | Core account fields exist; structural and posting-account invariants are absent. |
| Default account bootstrap | PARTIAL | Seven Branch accounts are created; required bank/AP/equity/expense/other-income categories are absent. |
| First Run integration | PARTIAL | Atomic/idempotent and real-PostgreSQL PASS, but READY uses an incomplete financial minimum. |
| Manual account management API | PARTIAL | Generic CRUD exists but lacks accounting-specific scope, reference, hierarchy, and destructive-change guards. |
| Manual account management UI | MISSING | No supported Chart-of-Accounts administration flow was found. |
| Branch mapping model | PARTIAL | Six system roles and two mapping types exist; coverage is not complete for required posting families. |
| Branch mapping API/UI | PARTIAL | Reservation deposit/cash settings exist; no complete financial mapping workflow exists. |
| Fail-closed posting | PARTIAL | Strict reservation completion fails closed; legacy posting can lazily create missing accounts. |
| Deposit posting | COMPLETE | Focused deposit and strict resolver contracts passed. |
| Cash posting | PARTIAL | Posting exists but can depend on code-based lazy account creation. |
| Bank posting | PARTIAL | Posting exists but the fresh bootstrap does not create/map the required bank account. |
| Expense posting | PARTIAL | Posting exists but missing accounts can be created at transaction time. |
| Other-income posting | PARTIAL | Posting exists but missing accounts can be created at transaction time. |
| Ledger visibility | COMPLETE | Posted journal ledger and trial-balance routes/UI are present and verifier passed. |
| Account statement visibility | COMPLETE | Opening/running/closing balance statement exists, subject to the scope defect below. |
| Financial statements | MISSING | No GL-backed balance sheet and income statement acceptance surface was found. |
| Idempotency | PARTIAL | First Run and mapping uniqueness pass; general journal source uniqueness is not a DB invariant. |
| Security/scope | PARTIAL | Accounting permissions exist, but one statement path and generic account mutations bypass uniform Branch/domain guards. |
| Fresh-environment portability | MISSING | A fresh setup becomes READY before complete financial setup and relies on later transaction-triggered creation. |

### Findings

Eight release-blocking findings are proven:
`FINANCIAL-BOOTSTRAP-F001`, `F002`, `F003`, `F005`, `F007`, `F008`, `F009`,
and `F010`. `F004` is not opened because disposable PostgreSQL proved atomic
idempotency without duplicates. `F006` is not opened because representative
posting implementations exist; their missing-account authority defect is
classified under F005/F009 rather than duplicated.

Focused contracts passed 19/19, real PostgreSQL First Run passed, the ledger
foundation and post-reset operational bootstrap verifiers passed, permission
baseline remained 128/128, typecheck passed, lint errors were zero, and
`git diff --check` passed. No Product, schema, migration, configuration,
runtime, or official database change was made.

`FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1 = COMPLETE`.
`FINANCIAL_BOOTSTRAP_CLASSIFICATION = PARTIAL_OR_MISSING`.
`NEW_FINANCIAL_FINDINGS = F001,F002,F003,F005,F007,F008,F009,F010`;
`OPEN_RELEASE_BLOCKING_FINANCIAL_FINDINGS = 8`. `RELEASE_READY = NO`;
Staging and Production remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-FIX-CONT1`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT3 — final independent employee runtime acceptance — 2026-07-29

The phase started at exact Product checkpoint
`215db1b3bc319ce4e996f5c6d5d56c3158994f7e` on `main` (`docs: resolve
operator restore verification flash`). Required authorization repair history
through `0c48bd2ff29b7f10c161ecabe91e86d143a4b066` was present. Preflight retained
zero staged files, 11 stashes, no remotes, the protected semantic baseline,
the exact `next-env.d.ts` hash, the same restricted encrypted-package hashes
and ACL, the existing 3000/8000/5432 listeners, and official
`darfus_erp/public` at source/applied/pending `51/51/0`. The three inherited
backend CRLF-only artifacts remained unstaged.

The encrypted loader passed a presence-only child check and left all parent
credential variables absent. A fresh owned Chromium process with one
non-persistent context then completed one Branch-shell login and one Employee
PIN verification, both `200`. The active non-admin Employee remained distinct
from the technical shell, the backend returned an active authorization with a
current authorization version and effective permissions, the server-validated
single Company was correct, and the fixed Branch/default matched the sole
active explicit assignment. The allowed navigation and read API passed; the
privileged navigation was absent, and the single deliberate read-only denied
probe returned a canonical correlated `403` with no protected data or side
effect.

Automatic unauthorized request counts before refresh were zero for settings,
Branches, notifications, customers, assets, invoices, suppliers, products,
stock movements, purchase orders, approvals, and reservations. On hard
refresh, neutral protected loading mounted once before the Branch-scoped
operator request; no operator-current request lacked validated Branch
authority, exactly one Branch-authorized operator-current request completed
`200`, and the allowed route restored. Verification-shell, PIN-form, and
Employee-selector mount counts were `0/0/0`; protected data exposure during
the unresolved interval, duplicate restore, restore loop, pending work, and
unauthorized UI flash were all zero. Post-refresh automatic unauthorized
requests and notification list/unread/SSE ownership remained zero.

The owned completed request set retained numeric client-observed durations,
request IDs, and one terminal response outcome per request; undefined
durations and duplicate terminal summaries were zero. Static terminal-logging
coverage preserves completed, aborted, and client-disconnected classification.
Before Product logout, the exact-owned technical/operator sessions were
fingerprint-linked `1/1`; normal logout returned `200` and changed them to
`0/0` without manual cleanup or unrelated-session revocation. Post-logout
protected traffic, notification traffic, reconnects, and `401` storms were
zero.

Final validation passed CONT4 `3/3`, CONT3 `5/5`, the complete focused Node
inventory `59/59`, canonical permission baseline `128/128`, typecheck,
targeted lint with zero errors, and diff check. Cleanup removed the owned
browser context/process and all temporary evidence, retained the encrypted
package byte-identical outside Git, and left parent credentials absent. The
owner-managed listeners retained PIDs 15532/21644, official migrations stayed
`51/51/0`, fixture authorization stayed unchanged, idle transactions and
waiting locks were zero, and owned sessions remained `0/0`.

`AUTHORIZATION-RUNTIME-ACCEPT-CONT3 = COMPLETE`; F004–F010 and
`OBSERVABILITY-F001` are resolved; the authorization runtime workstream is
complete. `OPEN_RELEASE_BLOCKING_AUTHORIZATION_FINDINGS = 0` and
`OPEN_RELEASE_BLOCKING_PRODUCT_REGRESSIONS = 0`. `RELEASE_READY = NO`;
Staging and Production remain unauthorized. Exact next marker:
`FINANCIAL-ACCOUNT-BOOTSTRAP-AUDIT-CONT1`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-FIX-CONT4 — operator verification fallback flash resolved — 2026-07-29

Starting from `6e054bb3872bd73fc73829e56c59aed51efdd741` on `main`, preflight retained
zero staged files, 11 stashes, no remotes, the protected semantic baseline,
the exact `next-env.d.ts` hash, unchanged encrypted-package hashes/ACL, reused
3000/8000/5432, and official `darfus_erp/public` at `51/51/0` with zero idle
transactions and waiting locks. The three inherited backend CRLF-only artifacts
remained unstaged.

The unchanged secure replay reproduced F008: valid operator restoration and the
allowed route succeeded, but the verification shell and its PIN form each
mounted once during hard-refresh hydration. Source ownership traced the flash
to `contexts/operator-context.tsx` exposing only independent `loading` and
`active` values, while `components/auth/auth-guard.tsx` treated `!active` as
authoritative absence after a transient loading drop.

`0c48bd2` adds explicit internal restore states (`uninitialized`, `deferred`,
`restoring`, `active`, `absent`, `invalid`, `error`). The guard now renders a
neutral protected loading shell until restoration is authoritative, renders
verification only for authoritative absent/invalid states, and keeps a safe
retry boundary for restore failure. No backend, session, logout, notification,
request-logging, migration, package, fixture, or configuration path changed.

The new focused contract failed before the repair and passed afterward. Final
validation passed CONT3 `5/5`, complete Node inventory `59/59`, permission
baseline `128/128`, typecheck, targeted lint with zero errors, and diff check.
Post-commit secure replay produced one successful operator-current restore,
restored the allowed route, completed normal logout `200`, and recorded zero
verification-shell, PIN-form, and employee-selector mounts. The final owned
technical/operator session counts were `0/0`; services and the official
database remained preserved. `AUTHORIZATION-RUNTIME-FIX-CONT4 = COMPLETE`;
`FULL-REGRESSION-F008 = RESOLVED_BY_CODE_AND_RUNTIME_REPLAY`.

`RELEASE_READY = NO`; Staging and Production remain unauthorized. Exact next
marker: `AUTHORIZATION-RUNTIME-ACCEPT-CONT3`. Do not start it automatically.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT2 — independent runtime acceptance partial — 2026-07-29

The phase started at exact checkpoint `fbac02c6dd4b58da4e9d17d787c756ba2fd72083`
on `main`. Preflight retained zero staged files, 11 stashes, no remotes, the
protected semantic baseline and declaration hash, the existing 3000/8000/5432
runtime, official `darfus_erp/public` at `51/51/0`, and the unchanged restricted
current-user encrypted fixture package. The dedicated fixture remained active,
non-admin, and distinct from its fixed Branch shell, with one explicit
active/default Branch, one effective read capability, one denied administration
capability, and a valid authorization version.

A fresh non-persistent owned browser process completed one Branch-shell login
and one employee-code/PIN verification (`200` each). The active operator had
one backend-resolved effective permission, the fixed Branch control was
disabled, the allowed dashboard route and safe allowed GET passed, and the
privileged employee-administration route was absent. One deliberate safe denied
route rendered no protected data, and its GET returned canonical correlated
`403` without partial data. The fixed one-assignment shell makes Branch
switching `NOT_APPLICABLE`.

F010 remained closed: automatic unauthorized requests before and after refresh
were both zero; notification list, unread, and SSE ownership were all zero.
Hard refresh observed the non-ready interval, emitted zero operator-current
requests while explicitly transitioning, then exactly one Branch-scoped
operator-current request after validated authority; it returned `200`, restored
the operator and allowed route, retained the denied navigation boundary, and
settled with zero pending work. Independent replay nevertheless observed the
employee-verification shell mount once during that restoration window. This
reproducible unauthorized fallback flash reopens `FULL-REGRESSION-F008` as
`OPERATOR_VERIFICATION_FALLBACK_FLASH_DURING_READY_RESTORE`; the repair restored
the final state but did not keep the guard non-fallback for the whole hydration
interval.

F009 independently passed. Immediately before logout, the exact owned
technical/operator counts were `1/1` and the operator carried the stable
technical-session fingerprint. One normal Product logout returned `200`; both
owned counts became `0/0`, protected post-logout traffic stayed zero, and no
manual cleanup API was required. Thirteen completed owned request lifecycles
had numeric durations and request IDs, with zero undefined duration. The
pre-existing runtime terminal buffer was not exported or copied; the exact
terminal-logger regression and aborted/client-disconnected classifications
passed the focused static suite.

Final static validation passed the CONT3 suite `5/5`, complete Node inventory
`56/56`, permission baseline `128/128`, typecheck, diff check, and lint with
zero errors and 18 inherited warnings. Runtime services stayed healthy, fixture
authorization remained unchanged, sessions ended at zero, and the official
database remained `51/51/0` with zero idle transactions and waiting locks.
`AUTHORIZATION-RUNTIME-ACCEPT-CONT2 = PARTIAL`; F009, F010, and
`OBSERVABILITY-F001` remain resolved, while F008 is open. `RELEASE_READY = NO`;
exact next marker: `AUTHORIZATION-RUNTIME-FIX-CONT4`.

## AUTHORIZATION-RUNTIME-FIX-CONT3 — employee runtime regressions resolved — 2026-07-29

Preflight at `da2e07f` retained `main`, zero staged files, 11 stashes, no
remotes, the protected hashes, the unchanged encrypted fixture package, the
existing 3000/8000/5432 runtime, and official `darfus_erp` at `51/51/0`.

`FULL-REGRESSION-F008` was reproduced as an operator-current request attempted
before Branch READY, followed by premature provider clearing and the employee
verification fallback. `428e9dd` makes restoration Branch-generation aware,
waits for READY, performs one restore per authenticated READY generation, and
keeps the guard in a loading state until that decision is authoritative. A
fresh secure replay retained the operator and allowed route across hard refresh
without showing the verification fallback.

`FULL-REGRESSION-F009` was reproduced with one active technical session and one
active operator session before logout, followed by an orphaned operator session.
The login-time technical session could lack a device association, while logout
used that association as its only linkage. `44f9964` introduces a stable,
non-secret technical-session fingerprint and transactional exact-owned logout;
`25c0d45` preserves explicit user-wide revocation for security changes. The
secure replay ended with both owned active-session counts at zero.

The F010 candidate was confirmed: fixed-shell bootstrap requested Branch
metadata before operator authorization, and core module plus notification
lifecycles were gated by operator activity rather than effective permission.
`3fabf5b` derives fixed-shell Branch metadata from the authenticated shell and
permission-gates module, notification REST, and notification SSE ownership.
The deliberate denied acceptance probe still returned canonical `403`.

`OBSERVABILITY-F001` was confirmed because the previous response-time token
could not classify aborted/client-disconnected terminal paths and could emit an
undefined duration. `3bb60c0` adds one explicit terminal record with monotonic
numeric duration and `completed`, `aborted`, or `client_disconnected` outcome.
The protected `backend/src/app.js` change is limited to installing that
middleware.

New regression coverage passed `5/5`; the complete Node test set passed `56/56`;
permission baseline passed `128/128`; typecheck passed; lint reported zero
errors and 18 inherited warnings. Secure runtime replay passed login, employee
verification, operator restoration, permission denial, hard refresh, and
logout. The fixture authorization relationships and encrypted package remained
unchanged, owned sessions ended at zero, and no migration or business/config
mutation occurred. `AUTHORIZATION-RUNTIME-FIX-CONT3 = COMPLETE`;
`FULL-REGRESSION-F008`, `F009`, `F010`, and `OBSERVABILITY-F001` are resolved.
`RELEASE_READY = NO`; exact next marker:
`AUTHORIZATION-RUNTIME-ACCEPT-CONT2`.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT1 — real employee runtime findings — 2026-07-29

Starting at `ef1093b`, the protected Git/runtime/database preflight passed. The
external current-user encrypted package was present, ACL-restricted, unchanged,
and exposed the three required variables only to its child. The dedicated
fixture was active and non-admin, with one explicit active/default Branch, one
effective read capability, one denied administration capability, and a valid
authorization version.

The owned runtime session completed Branch-shell login, employee-code/PIN
verification, operator bootstrap, the allowed dashboard route, a safe allowed
GET (`200`), a denied frontend route, and a safe denied GET (`403`) with the
canonical correlated envelope and no partial data. The fixed one-Branch shell
made assigned-Branch switching `NOT_APPLICABLE`; its current-Branch control was
fixed and unassigned Branches were not offered.

Hard refresh then reproduced a release-blocking operator-bootstrap race.
`ApiOperatorRepository.current()` uses the default Branch-aware client while
the transport rejects non-skipped requests during Branch transition.
`OperatorProvider` records `CURRENT_FAILED` but does not depend on Branch READY,
so the still-valid operator session was replaced by the employee-verification
gate. This is `FULL-REGRESSION-F008`.

Logout also exposed `FULL-REGRESSION-F009`: the technical login session did not
store a device-session association, so technical logout revoked that session
but did not revoke the active operator session. A fixture-scoped cleanup used
the supported login/end-session/logout APIs and left zero active technical or
operator sessions; no fixture configuration or business row was changed.
Focused contracts passed `30/30`, permission baseline `128/128`, typecheck,
targeted lint, and diff check. `AUTHORIZATION-RUNTIME-ACCEPT-CONT1 = PARTIAL`;
`RELEASE_READY = NO`; exact next marker:
`AUTHORIZATION-RUNTIME-FIX-CONT3`.

## AUTHORIZATION-RUNTIME-TEST-FIXTURE-CONT1 — dedicated local employee fixture ready — 2026-07-29

At `34d3de6`, the operator authorized one narrow local-only fixture in
`darfus_erp`. `QA_EMPLOYEE_AUTH_RUNTIME_001` was created identity-first and
verified with zero implicit Branch mappings before its single explicit active
assignment and explicit default were set. The default belongs to that active
set; no administrator, Company-label, first-Branch, or persisted-candidate
fallback was used.

The fixture has a dedicated non-admin QA role, one safe effective read
capability, one safe denied capability, a valid PIN credential, and a dedicated
fixed-Branch shell account. A Windows current-user DPAPI/SecureString package
outside Git passed a presence-only loader round trip and restricted ACL check.
The fixed Branch-shell contract makes in-session Branch switching not applicable
for this one-assignment credential package; an unassigned active Branch
candidate exists for denial evidence. No Product code, migration, configuration,
or unrelated business row changed. Static contracts, permission baseline,
typecheck, targeted lint, and diff check passed. Exact next marker:
`AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-ACCEPT-CONT1 — employee credential availability boundary — 2026-07-29

At `4564b37`, read-only preflight retained the accepted checkpoint, protected
semantic baseline, required generated declaration hash, live 3000/8000
listeners, and official `darfus_erp` baseline `51/51/0` with zero idle
transactions and waiting locks. The three required process-scoped employee
Branch-shell credential variables were absent. No login session, browser
context, account selection, PIN attempt, or database mutation was performed.

This is an acceptance-evidence boundary, not a new Product finding. The
isolated closures for `FULL-REGRESSION-F004` through `F007` remain unchanged;
real employee runtime authorization is not proven. `RELEASE_READY = NO`; exact
next marker remains `AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-FIX-CONT2 — Branch readiness financial regression resolved — 2026-07-29

Starting at `d621460`, the unchanged reuse-only browser harness reproduced
`FULL-REGRESSION-F007`: two normalized customer-invoice reads began before its
observed Branch-B READY boundary during A→B. Statement-v2 and credit were not
affected. Request ownership remained exact to the Branch-switch scenario.

The root cause was in `contexts/branch-context.tsx`: it installed the new
Branch accessor and opened the imperative transport guard before committing the
validated READY state. `80b9909` keeps the transport closed through the
transition and uses a layout effect to publish the accessor only after the READY
DOM commit, before passive query effects. Branch-scoped financial query keys and
the existing cancellation boundary remain unchanged; notification resources
remain Company-scoped.

The new ordering test failed before the repair and passes afterward. Focused
context/error/notification/employee coverage passed `42/42`, permission
baseline `128/128`, typecheck and targeted lint passed. The unchanged reused
runtime harness now passes with `preReadyFinancialRequests = 0`, validated
A→B, zero context errors, and a controlled Branch-B scoped absence only after
READY with both context headers. No migration or official data mutation occurred.
Real employee runtime acceptance remains credential-blocked. `RELEASE_READY =
NO`; exact next marker: `AUTHORIZATION-RUNTIME-ACCEPT-CONT1`.

## AUTHORIZATION-RUNTIME-FIX-CONT1 — employee repair partial; Branch regression found — 2026-07-29

Starting at `7387ac2`, the authorized committed-byte recovery restored only the
generated `next-env.d.ts` baseline; it was never staged. Product commits
`0e72f28` and `56c0538` resolve the employee findings without a migration.
Employee creation is identity-only, never uses Company metadata or the
administrator's active Branch, and visibly directs the operator to the explicit
Branch-assignment step. A Branch mapping is created only by an explicit choice.

The existing nullable primary-Branch field and `EmployeeBranchAccess` mapping
are sufficient: a non-null primary is now transactionally required to belong to
the active selected mappings; revoking it requires an explicit replacement.
Operator verification and live sessions fail closed without an active mapping,
reject unassigned Branches, and re-check authorization version. Effective
permissions remain backend-resolved active role grants plus direct grants minus
active denials; no normal Employee `/auth/login` account was introduced.

Focused contracts, context/error/notification regression coverage, permission
baseline, typecheck, lint and a real PostgreSQL disposable-DB lifecycle pass.
The disposable DB was dropped. The preserved administrator runtime reached the
employee route but did not expose its create control, so it supplied no form
evidence and made no write. No approved employee credential exists, so real
employee runtime acceptance remains blocked. The unchanged reuse-only browser
replay then observed two customer-financial requests before Branch-B READY
during A→B, where the accepted contract requires zero. This is new
release-blocking Product evidence, `FULL-REGRESSION-F007`; it was not repaired
in this employee-scoped phase. Official `darfus_erp` remains `51/51/0`.
`RELEASE_READY = NO`; exact next marker: `AUTHORIZATION-RUNTIME-FIX-CONT2`.

## AUTHORIZATION-RUNTIME-AUDIT-CONT1 — employee Branch and authorization audit — 2026-07-29

`FULL-REGRESSION-F004` through `F006` are proven static/schema Product
defects. Employee creation pre-fills the required primary-Branch *label* from
Company session metadata without an explicit assignment choice. The creation
request does not carry a Branch identifier, while the backend creates an
`EmployeeBranchAccess` row only when such an identifier is supplied. The
resulting identity metadata and operational Branch authorization are separate
but the creation flow neither makes that distinction visible nor completes the
required second step.

The current model has no employee default-Branch invariant: `employees.branch_id`
is nullable and no database constraint requires it to occur in active
`employee_branch_access`. The separate Branch editor supports multiple explicit
assignments and invalidates authorization versions, but it neither selects nor
validates a default from that set. Employee credentials are PIN credentials for
operator verification; normal authentication is a separate User/technical
account flow. Employee permissions are evaluated server-side only for a
Branch-shell account with an active operator session, so direct employee login
and permission propagation are not a complete Product contract.

No employee credential was approved for this phase, so employee-login runtime
evidence is blocked. The static/schema defects independently block release.
The official database was queried read-only only; current aggregate consistency
showed no existing duplicate mappings or active primary/mapping mismatch.
`RELEASE_READY = NO`. Exact next marker: `AUTHORIZATION-RUNTIME-FIX-CONT1`.

## FULL-REGRESSION-FIX-CONT1 — Product regression closure — 2026-07-29

Starting from `a2fd04e`, the narrow Product repairs resolve both release
findings without changing the backend, schema, packages, configuration or
official data. F002 had separate ownership causes: Header-wide core preloads,
an imperative supplier refetch, a reservations page/core overlap, and
Company-only core keys that varied by Branch generation. Core resources are now
explicitly requested, Company-only keys are Branch-independent, Suppliers has
one declarative owner, and Reservations owns its list. F003 traced to the
inventory asset list bypassing the Branch contract with `skipBranch`; asset and
inventory reads now wait for validated Branch READY, use the canonical client,
include the validated Branch in their query identity, and forward cancellation.

Focused lifecycle/context tests (`24/24`), typecheck and lint (zero errors;
18 inherited warnings) pass. The unchanged reuse-mode browser replay exited
`0/PASS`, started no service child, and retained zero secret leakage. Every
required module passed with terminal pending and duplicate lifecycle counts of
zero. Assets retained both context-presence booleans, including an explicit
Branch-B capture; N5/N8, A→B, hard refresh, notification/SSE and logout remain
non-regressed. The official database stayed `51/51/0` with no phase mutation.

`FULL-REGRESSION-F002 = RESOLVED`; `FULL-REGRESSION-F003 = RESOLVED`; and
`FULL-REGRESSION = COMPLETE`. `RELEASE_READY = NO`; Staging and Production
remain prohibited. Exact next marker: `MIGRATION-STAGING-REHEARSAL`.

## FULL-REGRESSION-HARNESS-FIX-CONT1 — browser evidence closure and findings — 2026-07-29

Starting at `af90f95`, the harness-only commits `d660ea8`, `9dec085`,
`5b05719`, and `d54d3ba` added a sanitized per-module reducer and read-only
navigation/refresh capture. It preserves Playwright Request-object correlation,
normalizes dynamic paths, retains only booleans/status categories/counts, and
does not retain payloads, raw headers, identifiers, credentials or browser
storage. Focused helper tests (`13/13`), the current Node suite (`43/43`), the
permission guard, typecheck and lint (zero errors; 18 inherited warnings) pass.

The reused `localhost:3000/8000` runtime was not started, stopped or restarted.
N5/N8 each retained exactly one bootstrap, Branch bootstrap, notification
list/unread/SSE lifecycle, with zero observed 401/403/422, reconnect and
notification-error-toast counts. Branch A→B executed and logout retained zero
protected notification traffic. The harness coverage gap is resolved, but the
terminal module matrix proves F002 duplicate lifecycles and F003 headerless
asset reads. `FULL-REGRESSION = PARTIAL`; `RELEASE_READY = NO`; exact next
marker is `FULL-REGRESSION-FIX-CONT1`.

## FULL-REGRESSION — bounded read-only result and coverage boundary — 2026-07-29

Starting from `27c9259` (`docs: accept notification runtime lifecycle`), the
repository and reused local runtime passed all safe checks: the accepted
history is present; `git diff --check` passed; protected semantic drift is
zero; tracked generated evidence and high-confidence key material are zero;
and `next-env.d.ts` has its required hash. The selected cross-domain
contract/isolation suite passed `99/99`; the canonical permission guard passed
at `128/128`; environment/bootstrap and local-database guard tests passed;
typecheck passed; and lint reported zero errors with the inherited 18
warnings. The real-PostgreSQL First Run test correctly skipped without an
explicit disposable target, so it could not target the official database.

The unchanged credential-clean reuse harness exited `0/PASS` against the
pre-existing `localhost:3000/8000` runtime. N5 and N8 each observed one
Company bootstrap, Branch bootstrap, notification list, unread count and SSE;
all observed 401/403/422, reconnect and notification-error-toast counts were
zero. Branch A→B observed non-ready before Branch-B READY, no pre-ready
financial traffic, no Branch-context-required error and no notification
restart. The controlled Branch-B customer absence retained both contexts and
Branch READY; logout produced zero protected notification traffic.

This is not a Product regression, but it is not a complete full-module browser
matrix: the accepted harness tracks dashboard resources but does not retain
per-module endpoint/status evidence for suppliers, inventory/products,
transfers, reservations, purchase orders, approvals and invoices. No unsafe
ad-hoc browser flow was substituted. `FULL-REGRESSION = PARTIAL` with
`HARNESS_DEFECT = FULL_MODULE_READ_ONLY_BROWSER_MATRIX_NOT_CAPTURED` and
`RELEASE_READY = NO`. Exact next marker:
`FULL-REGRESSION-HARNESS-FIX-CONT1`.

## NOTIF-ACCEPT — authenticated reused-runtime lifecycle accepted — 2026-07-29

The unchanged reuse-mode harness completed with sanitized `0/PASS`, no owned
service child, zero secret leakage and removed cleanup. N5 and N8 each observed
one Company bootstrap, one Branch bootstrap, one notification list, one unread
count and one SSE lifecycle; context was present on Company-only notification
traffic and no Branch header was sent there. Observed 401/403/422, Company
context-required, SSE reconnect and notification-error-toast counts were all
zero. Branch A→B created no notification list/unread/SSE lifecycle; the bounded
controlled Branch-B `RESOURCE_NOT_FOUND` retained both headers and Branch
`READY` without notification impact. Logout left zero protected notification
traffic. `NOTIF-ACCEPT = COMPLETE`; this does not authorize release, Staging or
Production.

## NOTIF-ACCEPT — reused runtime unavailable — 2026-07-29

The operator-mediated credential wrapper removed its own process-scoped
credentials and emitted only a sanitized result: exit `1`,
`HARNESS_EXECUTION_FAILED`, no started child, no runtime fingerprint, no
evidence, zero secret leakage and removed owned cleanup. Read-only follow-up
confirmed the pre-existing frontend 3000 and backend 8000 listeners are no
longer available; PostgreSQL 5432 remains healthy. The harness therefore did
not reach login, N5/N8, Branch switch or notification observation. No process
was stopped or restarted, and no Product, database, migration or harness change
is authorized. `NOTIF-ACCEPT = BLOCKED` with
`BLOCKER = PREEXISTING_RUNTIME_UNAVAILABLE`; retain the authorization for a
future unchanged reuse-mode run only.

## BRANCH-CONTEXT-HARNESS-FIX-CONT1 — authenticated replay accepted — 2026-07-29

The supplied sanitized operator-mediated replay exited `0` with `PASS` while
reusing the existing local runtime. It completes the earlier harness boundary:
N5/N8, safe customer discovery, Branch-A invoice/statement/credit, atomic
Branch A→B, controlled Branch-B scoped absence, refresh and logout all pass.
Branch-B `RESOURCE_NOT_FOUND` retained Company and Branch context, Branch
`READY`, zero `BRANCH_CONTEXT_REQUIRED` and no retry loop; it is not a context
failure. Secret leakage is zero and harness cleanup is removed. Therefore
`BRANCH-CONTEXT-HARNESS-FIX-CONT1 = COMPLETE`,
`BRANCH-CONTEXT-RUNTIME-FIX = COMPLETE`,
`BRANCH-CONTEXT-RUNTIME-F001 = RESOLVED`, and
`NOTIF_ACCEPT_AUTHORIZED = YES`. This authorizes `NOTIF-ACCEPT` only; release,
Staging and Production remain blocked.

## BRANCH-CONTEXT-HARNESS-FIX-CONT1 — exact response correlation repaired / runtime rerun pending — 2026-07-29

`26d25a2` replaces the reverse method/path pending-record lookup with a
`WeakMap` keyed by the exact Playwright `Request` object. A request now owns one
sanitized record and one terminal outcome (`RESPONSE`, `FAILED`, or `ABORTED`);
late response metadata cannot move it across scenario boundaries, and
`requestfinished` cannot manufacture a success. Financial summaries now count
responses, aborts, failures and pending records separately, and their bounded
settle barrier requires a qualifying response with no pending short-lived
financial record.

Focused static validation passes 39 tests, including out-of-order same-path
response, aborted peer, distinct failed/successful credit, terminal-event
idempotency, scenario ownership, correlation cleanup, and redaction coverage;
typecheck and targeted lint also pass. No Product, backend, package, migration,
database or pre-existing runtime process changed. The secure operator-mediated
authenticated rerun remains required; do not infer A→B, refresh, logout, or
notification acceptance from static evidence. `NOTIF_ACCEPT_AUTHORIZED = NO`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1 — authenticated financial evidence / harness boundary — 2026-07-29

The unchanged operator-mediated harness reused verified local 3000/8000 DARFUS services and authenticated without retaining credentials. N5 and N8 each observed one Company bootstrap, Branch bootstrap, notification list, unread and SSE lifecycle; context was present where required, the Company gate was absent, and observed 401/403/422, reconnect and notification-error-toast counts were zero.

Read-only discovery found a safe customer profile (`MANY` category), confirming the earlier discrepancy was an immediate post-navigation selector check, not missing customer data. Branch-A invoice, statement-v2 and credit each had an observed `200` with Company and Branch context and zero `BRANCH_CONTEXT_REQUIRED`. The scenario stopped before A→B, refresh and logout because the evidence collector pairs concurrent same-method/same-path responses through a reverse scan of pending records. An older request can remain `status: null` while a later request receives `200`, falsely producing zero statement/credit successes. This is a harness evidence-correlation defect, not a proven Product regression.

`BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1 = PARTIAL`; `BRANCH-CONTEXT-RUNTIME-F001 = OPEN — harness response correlation prevents customer-financial acceptance`; `NOTIF_ACCEPT_AUTHORIZED = NO`. No Product, database, migration, package or runtime-process change occurred. Exact next marker: `BRANCH-CONTEXT-HARNESS-FIX-CONT1`, limited to one-to-one Playwright request/response correlation and the same sanitized capture.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT3 — authenticated customer evidence boundary — 2026-07-29

Starting at `fa0d04a`, `013b388` improves the repository-local acceptance
harness only: it waits for the existing customer-list response and a visible
profile route before declaring discovery, records only the list count category,
and adds sanitized A→B/refresh ordering assertions. The prior immediate check
after `domcontentloaded` is therefore a credible H7 harness deficiency, but
the customer discrepancy is not yet runtime-proven.

This execution environment rejected every process-scoped credential injection
attempt before `npm run test:single-company-runtime` could start. The browser
surface was not used as a bypass because the phase requires process-scoped
credentials. No login, customer discovery, customer-financial request,
refresh, logout, browser profile, or API request occurred. Static Branch,
Company, notification, error, harness/redaction tests and typecheck pass.
`BRANCH-CONTEXT-RUNTIME-FIX-CONT3 = BLOCKED` only by
`AUTHENTICATED_HARNESS_CREDENTIAL_INJECTION_UNAVAILABLE`; the existing 3000/
8000 runtime was preserved and no DB data or migration changed. Keep
`BRANCH-CONTEXT-RUNTIME-F001` open and `NOTIF_ACCEPT_AUTHORIZED = NO`. Exact
next marker: `BRANCH-CONTEXT-RUNTIME-FIX-CONT3-CONT1`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT2 — atomic Branch transition repair — 2026-07-29

Starting from `e559d1f`, the frontend race was repaired without changing the
fail-closed backend contract. `TRANSITIONING` is now a non-ready Branch state;
the provider enters it before retiring the canonical accessor, the shared API
client blocks a stale Branch-scoped request in the render/effect interval, and
only query keys with a concrete Branch discriminator are cancelled/removed.
Customer invoices, statement-v2/v3, credit and core Branch reads now forward
React Query abort signals, so cancelled Branch-A work cannot overwrite
Branch-B results. The selector remains usable in `SELECTION_REQUIRED` and is
locked only while actually transitioning.

The reused localhost 3000/8000 browser harness passed N5 and N8 (one Company
bootstrap, Branch bootstrap, notification list, unread and SSE each; zero
401/403/422, reconnects and notification error toasts). Its isolated A→B
window recorded Branch-aware core reads with headers, zero
`BRANCH_CONTEXT_REQUIRED`, and zero new list/unread/SSE/error-toast lifecycle.
No safe existing customer profile was visible to this authorized identity, so
customer invoice/statement/credit A→B and refresh evidence is
`NOT_OBSERVED`; no data was created. Thus `BRANCH-CONTEXT-RUNTIME-FIX-CONT2 =
PARTIAL`, `BRANCH-CONTEXT-RUNTIME-F001` remains open only for that evidence,
and `NOTIF_ACCEPT_AUTHORIZED = NO`. The official DB remains 51 applied / 0
pending with zero phase mutation. Exact next marker:
`BRANCH-CONTEXT-RUNTIME-FIX-CONT3`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT2-CONT1 — user-applied migration reconciliation — 2026-07-28

The user explicitly ran the local migration command before this reconciliation.
The historical official baseline was 50 applied / 1 pending; it is preserved as
historical evidence. The newly verified official local baseline is **51 applied
/ 0 pending**. Reconciliation performed no migration, rollback, schema change,
data change, or runtime restart.

Migration 51 is `20260728010000-create-first-run-setup-state.js`
(`SHA-256 D9D576E89625A78402C0DD06570104905A1E7D6CDB192D89E42692237101A024`).
It is schema-only: it creates `first_run_setup_states` with its nine declared
columns and `id` primary key. Read-only registry comparison found 51 source
names = 51 applied names, no missing/unknown/duplicate rows, and migration 51
exactly once. PostgreSQL catalog inspection confirmed the table, types,
nullability, primary key and zero invalid indexes. No partial application or
migration-owned state row was observed.

The active runtime is the same repository: Next parent/child serve localhost
3000 and Nodemon/server serve localhost 8000 from this workspace. The newer
backend PID is an accepted same-project process replacement; it has an
established local PostgreSQL 5432 connection and `/health/db` reports UP.
The official database is `darfus_erp`, schema `public`, PostgreSQL 18.4, with
zero idle-in-transaction and waiting-lock counts. Local migration application
does not complete Staging rehearsal or authorize Production.

`BRANCH-CONTEXT-RUNTIME-FIX-CONT2-CONT1 = COMPLETE`;
`OFFICIAL_LOCAL_DATABASE_BASELINE = 51 APPLIED / 0 PENDING`; and
`BRANCH-CONTEXT-RUNTIME-FIX-CONT2 = AUTHORIZED_TO_RESUME`. The Branch fix has
not run and `NOTIF_ACCEPT_AUTHORIZED = NO`. Exact next marker:
`BRANCH-CONTEXT-RUNTIME-FIX-CONT2`.

## BRANCH-CONTEXT-RUNTIME-FIX-CONT1 — customer-financial evidence, Branch switch not accepted — 2026-07-28

The existing localhost 3000/8000 runtime was reused with its original PIDs;
the harness owned only a temporary browser context and sanitized evidence.
The authenticated customer list yielded a safe read-only `CUSTOMER_A`. Its
profile retained Company and Branch `READY`; invoice, statement-v2 and credit
each completed one `200` with both context headers, and none started before
Branch readiness. Empty data would have been accepted, but no contents were
retained.

The bounded normal A→B switch from that profile exposed a new release-blocking
transition race. `selectBranch` clears old client context/work while the
provider's published state remains ready for a render. Statement-v2 and credit
therefore begin without Branch context; three total
`BRANCH_CONTEXT_REQUIRED` responses invoke the invalidation path and leave the
Branch `INVALID`. One ordinary new-Branch profile `404` was also observed.
No Product repair, data mutation, migration, process restart, or notification
acceptance occurred. Refresh-on-profile and final profile-route logout were not
run after the failure. Official aggregate fingerprints, migration boundary
(50 applied / 1 pending), and lock counts remained unchanged.

`BRANCH-CONTEXT-RUNTIME-FIX-CONT1 = PARTIAL`; `NOTIF_ACCEPT_AUTHORIZED = NO`.
Next only: `BRANCH-CONTEXT-RUNTIME-FIX-CONT2`, to correct the exact Branch
state/accessor ordering and repeat the customer financial evidence.

## BRANCH-CONTEXT-RUNTIME-FIX — implementation accepted; customer-financial runtime evidence bounded — 2026-07-28

Starting checkpoint `62e140b9934375eef54b1d5165c6126417811542` exposed the
manual `BRANCH_CONTEXT_REQUIRED` finding as a frontend authority and query
gating defect. The former display/storage Branch value was not the API-client
authority; customer invoice history explicitly suppressed the Branch header;
statement and credit queries were ungated; and each fixed-Company bootstrap
cleared the persisted Branch candidate before refresh validation.

`2b000ff` introduces one validated Branch state machine
(`UNRESOLVED`, `READY`, `SETUP_REQUIRED`, `SELECTION_REQUIRED`, `INVALID`,
`ERROR`), a canonical API-client Branch accessor, Branch-aware cache keys and
customer-financial readiness gates. Persisted Branch storage is now only a
candidate validated against the current accessible Branch list; no arbitrary
multi-Branch fallback exists. `2e687ab` adds lifecycle and sanitized browser
coverage. Notifications intentionally retain their completed Company-only
`skipBranch` contract; the observed list/unread/SSE lifecycle did not regress.

The externally reused 3000/8000 harness passed: N5 and N8 each observed one
context-free Company bootstrap, one Branch bootstrap, one notification list,
one unread request and one SSE connection; all observed status counts for
401/403/422, reconnects and notification error toasts were zero. N8 restored
the server-validated Branch to READY after hard refresh. Five existing
Branches allowed an A→B run with Branch context on observed Branch-scoped
resources and zero `BRANCH_CONTEXT_REQUIRED`. Logout then had zero protected
list/unread/SSE traffic. The safe identity had no existing customer profile,
so invoices, statement-v2 and credit navigation was not executed and is not
claimed as accepted runtime evidence.

| Scenario | Resource | Requests | Status | Company context | Branch context | Outcome |
| --- | --- | ---: | --- | --- | --- | --- |
| N5 | accessible Companies | 1 | 200 | absent as required | absent | PASS |
| N5 | Branch bootstrap / list / unread / SSE | 1 / 1 / 1 / 1 | 200 | present / present / present / present | Branch bootstrap absent; notifications intentionally absent | PASS |
| N8 | accessible Companies | 1 | 200 | absent as required | absent | PASS |
| N8 | Branch bootstrap / list / unread / SSE | 1 / 1 / 1 / 1 | 200 | present / present / present / present | Branch bootstrap absent; notifications intentionally absent | PASS |
| Branch A→B | observed Branch-scoped core reads | observed | 200 where completed | present | present after READY | PASS |
| Customer financial | invoices / statement-v2 / credit | 0 | NOT_OBSERVED | — | — | no safe existing customer |
| Logout | notification list / unread / SSE | 0 / 0 / 0 | — | — | — | PASS |

`BRANCH-CONTEXT-RUNTIME-FIX = PARTIAL` only for the missing existing-customer
read-only runtime observation. `BRANCH-CONTEXT-RUNTIME-F001 = IMPLEMENTED —
PENDING CUSTOMER-FINANCIAL RUNTIME EVIDENCE`; `NOTIF_ACCEPT_AUTHORIZED = NO`.
No backend, migration, package, `.env`, data or pre-existing runtime process
changed. The official database remains `darfus_erp`, 50 applied / 1 pending
source migration, with zero idle transactions and waiting locks. Exact next
marker: `BRANCH-CONTEXT-RUNTIME-FIX-CONT1`.

## COMPANY-CONTEXT-RUNTIME-FIX — accepted external-runtime repair — 2026-07-28

Starting at `cca5502`, the root cause was a pre-READY `/operator/current`
request from the globally mounted Operator provider. Its expected backend `422`
was routed to Company-context invalidation, repeatedly restarting the
context-free bootstrap. The provider now remains inactive with
`COMPANY_CONTEXT_PENDING` until the authoritative single-Company context is
READY. A second defect cleared the entire query cache during a Branch switch,
evicting the retained `accessible-companies` bootstrap; Branch switching now
cancels/removes only non-bootstrap queries. Development Strict Mode also now
defers the first SSE connect by one microtask, avoiding an aborted duplicate
connection.

The unchanged localhost-only harness passed using the existing 3000/8000
services: N5 and N8 each recorded one `accessible-companies`, Branch,
notification-list, unread and SSE lifecycle; all successful observed resources
carried Company context except the context-free bootstrap. Both paths had zero
401/403/422, zero `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED`, zero SSE reconnects
and zero notification error toasts. Five existing Branches permitted an A→B
run; Company context remained present and scoped reads reloaded. Logout made
one normal logout request and then recorded zero protected list/unread/SSE
traffic. The run owned no service process and left the pre-existing runtime
running. `COMPANY-CONTEXT-RUNTIME-F001 = RESOLVED`; `NOTIF_ACCEPT_AUTHORIZED =
YES`. This authorizes `NOTIF-ACCEPT`, not release, Staging or Production.

**Phase:** `RELEASE-GAP-AUDIT`
**Date:** 2026-07-28
**Starting checkpoint:** `399badcec4cc03f3ae59d1fbcabfe4d2310164bd` — `docs: record error contract implementation`
**Decision:** `RELEASE-GAP-AUDIT = COMPLETE`, `RELEASE_READY = NO`, `RELEASE_BLOCKERS_FOUND = YES`.

## RELEASE-GAP-FIX-1-CONT2 — external-runtime browser evidence — 2026-07-28

`6a16e18` adds an explicit, localhost-only reuse mode to the existing browser
harness. In that mode it fingerprints `localhost:3000` and `localhost:8000`,
starts no backend or frontend child, registers neither existing service as
owned, and closes only its own browser/context. Focused launcher/redaction
tests (21), typecheck and targeted lint pass. The pre-existing frontend and
backend listeners remained reachable with their original PIDs after browser
cleanup; port 8000 was never targeted.

The authenticated browser run reached normal login (`200`) and made five
context-free `GET /auth/accessible-companies` calls (`200`, Company header
absent). It made one `GET /branches` call (`200`, Company header present), but
never reached the read-only Company display within the bounded 30-second wait.
No notification list, unread-count, SSE, dashboard-resource or logout record
was observed; no tracked `401`, `403` or `422` response and no tracked
notification toast was observed. The existing UI observation remains the
controlled Company-context gate ("Preparing workspace" / context validation);
the harness did not fabricate an unobserved stable error code.

This is a Product runtime regression, not a reuse-mode defect:
`COMPANY_CONTEXT_RUNTIME = FAIL`, `N5 = FAIL`, and `N8 = NOT_OBSERVED` because
N5 never established READY. `RELEASE-GAP-F001 = RESOLVED_BY_REUSE_MODE`, while
`COMPANY-CONTEXT-RUNTIME-F001` is open. `NOTIF_ACCEPT_AUTHORIZED = NO`.
Exact next marker: `COMPANY-CONTEXT-RUNTIME-FIX`.

| Scenario | Endpoint/resource | Requests | Status | Company context | Outcome |
| --- | --- | ---: | --- | --- | --- |
| N5 login | `/auth/login` | 1 | 200 | Not applicable | PASS |
| N5 bootstrap | `/auth/accessible-companies` | 5 | 200 | Absent, as required | Repeated; READY not observed |
| N5 Branch bootstrap | `/branches` | 1 | 200 | Present | No Company display followed |
| N5 notifications / SSE | list, unread, stream | 0 observed | — | — | Blocked before lifecycle |
| N8 / Branch A→B / logout | runtime scenarios | NOT_OBSERVED | — | — | N5 did not reach READY |

## RELEASE-GAP-FIX-1-CONT1 — Windows launcher repair, next harness boundary — 2026-07-28

Sanitized real-child diagnostics proved that the backend direct-Node launch was
already valid. The exact `EINVAL` was a synchronous Windows failure from the
frontend's `npm.cmd` shim under `shell: false`; it reproduced independently
with stream, numeric-fd and `ignore` stdio. Commit `dd568d5` replaces the
frontend and Playwright shims with their installed direct Node CLI entrypoints,
validates an absolute directory cwd and supported stdio, and filters child
environment values to strings only. A real Next CLI child-process test plus
failure-path coverage pass. The owned backend reached readiness on 8001 and
cleaned its log/temp root; `HARNESS_CHILD_SPAWN_EINVAL = RESOLVED`.

The unchanged authenticated harness then started backend and frontend but the
owned frontend exited before port-3300 readiness because a pre-existing,
unknown local Next development process holds the workspace development lock.
The harness returned `HARNESS_READINESS_FAILED_OWNED_FRONTEND`; cleanup was
`REMOVED`, credentials were absent afterward, and no Product/browser/login/N5/
N8/REST/SSE/notification/Branch/logout evidence was collected. No unknown
process was stopped and this is not a Product regression.

`RELEASE-GAP-F001` is now **OPEN — FRONTEND_NEXT_DEV_LOCK_CONFLICT**. Exact
next marker: `RELEASE-GAP-FIX-1-CONT2`, limited to safe resolution of that
owned-frontend workspace-lock boundary.

## RELEASE-GAP-FIX-1 / HARNESS-LOG-STREAM-FIX result — 2026-07-28

The original pre-spawn defect is repaired in `96c7094`, `09013d9` and
`1372c31`: owned logs now await a real `open` event before their stream is
passed to `spawn`; close is idempotent; owned children end before log closure;
and known temporary files are removed only from a verified harness root. The
focused lifecycle suite includes a real child-process stream acceptance and
passes. The safe no-credential path still exits before listeners start.

The unchanged authenticated harness was then run once with process-scoped
local-only credentials. It no longer throws `ERR_INVALID_ARG_VALUE` from a
null descriptor, but the attempted backend child emits the separately classified
`HARNESS_CHILD_SPAWN_EINVAL` before readiness. Cleanup returned `REMOVED`,
credential variables were absent afterward, and the in-memory log scan found
zero credential occurrences. No owned listener, login, N5, N8, REST/SSE,
notification, Branch, or logout observation occurred. This is harness
infrastructure, not a Product regression.

`RELEASE-GAP-F001` remains **OPEN — HARNESS_CHILD_SPAWN_EINVAL (original
null-stream defect fixed)**. Exact next marker: `RELEASE-GAP-FIX-1-CONT1`,
limited to the backend-child `EINVAL` launcher cause.

This is a read-only assessment. It made no Product, test, package, migration,
environment, database, process, Staging, Production, remote, or deployment
change. It is not a release authorization.

## Evidence standard

| Label | Meaning |
| --- | --- |
| `SOURCE_AND_TEST_PROVEN` | Current source and focused automated evidence agree. |
| `ISOLATED_RUNTIME_PROVEN` | A prior bounded disposable/owned runtime acceptance is recorded. |
| `NOT_OBSERVED` | Required live/browser/operational evidence was not collected and is not inferred. |
| `UNKNOWN` | The repository contains no current evidence sufficient to make a release claim. |

The audit distinguishes historical register entries from current evidence. A
later accepted checkpoint supersedes an older “open” row only where its scope
and test evidence actually cover the same fault.

## Safety and boundary

| Item | Result |
| --- | --- |
| Repository / branch / checkpoint | `H:\WORK\jewellery-erp-master`, `main`, exact starting HEAD above. |
| Worktree | No staged paths. The inherited changes in `backend/package-lock.json`, `backend/package.json`, and `backend/src/controllers/erp.controller.js` are CRLF-only; protected semantic diff is zero. |
| Stashes / remotes | 11 preserved stashes; no remotes. |
| `next-env.d.ts` | SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`. |
| Official DB | `darfus_erp` on local PostgreSQL 5432 only; read-only audit. Applied source migrations: 50. Source migrations: 51. Pending: 1. |
| DB safety | Idle transactions: 0. Waiting locks: 0. No owned DB connection or listener was created. |
| Runtime ports | Existing 8000 and PostgreSQL 5432 were inspected only. No owned listener ran on 3300 or 8001. |

## Product and architecture inventory

The repository contains 9 route modules, 5 controller modules, 47 service
modules, 88 model modules, 51 migrations, 17 test files and 69 documentation
files. The architecture is Next.js frontend plus Express/Sequelize/PostgreSQL,
with optional Redis-assisted queue/realtime services. Runtime database
configuration is ENV-driven and fails closed for conflicting or incomplete
Production/Staging configuration. Health endpoints, request IDs, Helmet, CORS
allowlisting and canonical error normalization are source/test-proven.

| Area | Current evidence | Release conclusion |
| --- | --- | --- |
| Auth, token/session and logout | `SOURCE_AND_TEST_PROVEN`; public registration remains `410`. | Requires browser role/session acceptance before RC. |
| Roles, permissions and audit | 128-slug canonical baseline and role tests are recorded. | No current cross-role browser matrix. |
| Single Company / operational Branch model | Auto-adopt-one Company, zero/many fail-closed, Branch switcher and scoped keys are tested. | N5/N8 browser/runtime chronology is `NOT_OBSERVED`. |
| First Run | Isolated PostgreSQL acceptance passed direct Super Admin/Company/Branch/mapping creation, locking, rollback and redaction. | Source migration 51 is intentionally not applied to the official DB; deployment migration gate remains open. |
| Error contract | Canonical envelope, safe 5xx mapping, frontend parser and redaction are `SOURCE_AND_TEST_PROVEN`. | Historical `DASHRES-F004` is covered; see finding disposition. |
| Notifications / SSE | Lifecycle and terminal-error contract tests pass. | Real N5/N8 list/unread/SSE/header/toast counts are `NOT_OBSERVED`. |
| Sales, reservations and deposits | Local technical acceptance and rollback/reconciliation evidence are recorded. | Product-wide regression and browser workflows remain unrun. |
| Inventory, purchases, treasury and accounting | Source, permission and focused static/service suites exist. | Full RC integration, performance and operational reporting evidence is `UNKNOWN`. |
| Reports and dashboard | Source/static behavior exists; historical local evidence is recorded. | Responsive Arabic/English browser acceptance is `NOT_OBSERVED`. |
| Files/uploads | 10 MB MIME allowlist and local/Cloudinary driver abstraction are source-proven. | Antivirus/content inspection, production storage retention and recovery evidence are `UNKNOWN`. |
| UI, accessibility and RTL | Component/localization conventions are present. | Full keyboard, screen-reader, mobile and RTL browser matrix is `NOT_OBSERVED`. |
| Observability | Safe query metadata, request IDs and redaction are tested. | Alerting, retention, central aggregation and incident runbook exercise are `UNKNOWN`. |
| Backups / restore | A backup utility and historical local backup evidence exist. | No current end-to-end restore drill or production retention/provenance acceptance. |
| Performance | No load, capacity, query-plan or SSE fan-out acceptance was located. | `UNKNOWN`; must be bounded before Production. |

### Domain-by-domain release inventory

| Domain | Evidence classification | Release-readiness conclusion |
| --- | --- | --- |
| Authentication, refresh and logout | SOURCE_AND_TEST_PROVEN | Browser session lifecycle remains unobserved. |
| Users, roles, permissions and audit | SOURCE_AND_TEST_PROVEN | Cross-role operational Browser matrix remains a full-regression gate. |
| Company setup/profile | SOURCE_AND_TEST_PROVEN | Single Company model is fail-closed; production migration and deployment material are blocked. |
| Branch management/switching | SOURCE_AND_TEST_PROVEN | Real Branch A→B browser acceptance is not observed. |
| System settings, currency and fiscal configuration | SOURCE_AND_TEST_PROVEN | First Run isolated acceptance covers mandatory defaults; operational settings regression remains pending. |
| Dashboard | SOURCE_AND_TEST_PROVEN | Browser/RTL/mobile dashboard acceptance is not observed. |
| Notifications and SSE | SOURCE_AND_TEST_PROVEN | N5/N8 integrated runtime counts and reconnection evidence are not observed. |
| Customers and customer documents | SOURCE_AND_TEST_PROVEN | Production upload scanning/storage and browser accessibility remain unaccepted. |
| Suppliers and supplier documents | SOURCE_AND_TEST_PROVEN | Same storage/operational evidence gap applies. |
| Products, assets and stock movements | SOURCE_AND_TEST_PROVEN | Full end-user/browser and performance coverage is pending. |
| Inventory/audits/transfers | SOURCE_AND_TEST_PROVEN | Cross-branch operational acceptance is pending. |
| Purchases | SOURCE_AND_TEST_PROVEN | Product-wide regression has not run. |
| Sales, POS and invoices | SOURCE_AND_TEST_PROVEN | Full current-head end-to-end/browser acceptance has not run. |
| Reservations | ISOLATED_RUNTIME_PROVEN | Error semantics are now resolved; browser acceptance remains pending. |
| Deposits, refunds and completion | ISOLATED_RUNTIME_PROVEN | Local financial technical acceptance is not release/staging approval. |
| Cash, bank, treasury and sessions | SOURCE_AND_TEST_PROVEN | Operational reconciliation/performance acceptance remains a full-regression gate. |
| GL, journals, accounts and reports | SOURCE_AND_TEST_PROVEN | End-user reporting/printing and performance evidence is not observed. |
| Approvals, operator/employee controls | SOURCE_AND_TEST_PROVEN | Full role/browser workflow remains pending. |
| Localization, RTL, printing and responsive UI | NOT_OBSERVED | Required Browser acceptance before RC. |
| Security, CORS, headers and rate limits | SOURCE_AND_TEST_PROVEN | Current dependency/security assessment remains required. |
| Logging, request IDs and error reporting | SOURCE_AND_TEST_PROVEN | Alerting, retention and incident-operation evidence is unknown. |
| Database migrations and readiness | ISOLATED_RUNTIME_PROVEN | Official 50/1 boundary and Staging rehearsal block deployment. |
| Build, tests and CI-like verification | SOURCE_AND_TEST_PROVEN | Complete full-regression aggregate has not run at this head. |
| Backup, recovery and operational deployment | NOT_OBSERVED | Restore, rollback and release procedure must be accepted before Production. |

## Current release blockers

| ID | Severity | Evidence | RC / Staging / Production effect | Required closure |
| --- | --- | --- | --- | --- |
| `RELEASE-GAP-F001` | P1 | `scripts/run-single-company-browser-acceptance.mjs` passes a newly created `WriteStream` before its file descriptor is open to `spawn`; the recorded run fails with `ERR_INVALID_ARG_VALUE` before any child starts. | Blocks RC. N5/N8, REST header, list/unread, SSE, reconnect and toast counts remain unobserved. | `HARNESS-LOG-STREAM-FIX`: repair only log-stream opening/owned-temp cleanup, test it, then rerun the unchanged safe harness. |
| `NOTIF-PRE1-CONT1-CONT1-CONT1-CONT1-F001` | P2, release-blocking evidence gap | Existing finding is currently `OPEN — HARNESS EXECUTION FAILURE / P2`. `NOTIF-ACCEPT` is not authorized. | Blocks RC and notification acceptance. | After F001, capture normal authenticated N5/N8 and logout evidence; then run `NOTIF-ACCEPT`. |
| `RELEASE-GAP-F002` | P1 | `README_DEPLOYMENT.md` and `docker-compose.yml` still describe legacy `ADMIN_*` automatic first-admin behavior/default credentials, whereas current `backend/src/server.js` only permits legacy runtime bootstrap when explicitly enabled outside Production and the guarded First Run flow is authoritative. | Blocks Staging and Production: deployment material can lead operators to use a superseded, unsafe installation path. | Replace legacy deployment/bootstrap instructions and development defaults with the guarded First Run contract; add a release runbook validation. |
| `RELEASE-GAP-F003` | P1 | Official local DB is 50 applied / 1 source migration pending; First Run was accepted only on disposable migrated databases. | Blocks Staging/Production migration authorization. | Pre-deploy migration plan, backup/restore compatibility, staging migration rehearsal and owner approval; do not mutate the official DB in this audit. |
| `RELEASE-GAP-F004` | P1 | `FULL-REGRESSION` has not run at the Error Contract checkpoint. Browser role/RTL/mobile, cross-branch and integrated financial/reporting workflows are not fully observed. | Blocks RC. | Run the defined complete static/API/financial/browser matrix after browser evidence and notification acceptance. |
| `RELEASE-GAP-F005` | P1 | `backend/scripts/backup.js` defaults to pruning beyond 14 archives; current runbook has no accepted restore drill, RPO/RTO, retention ownership or immutable backup evidence. | Blocks Production. | Execute a safe restore drill and approve retention, provenance, rollback and recovery ownership. |
| `RELEASE-GAP-F006` | P1 | No current dependency-security review was performed in this audit; historical `MR1-F007` is not current vulnerability evidence and was not revalidated. | Blocks RC until assessed; no claim about current vulnerabilities is made. | Run an authorized dependency/security review, triage direct and transitive exposure, and record remediation/owner risk decisions. |
| `RELEASE-GAP-F007` | P2 | Upload MIME/size checks exist, but malware scanning, production object-storage access policy, retention and restore acceptance are not evidenced. | Blocks Production file-handling approval. | Define and test production storage, scanning, retention and recovery controls. |
| `RELEASE-GAP-F008` | P2 | No controlled load, query-plan, capacity or SSE fan-out acceptance evidence is recorded. | Blocks Production performance sign-off. | Establish bounded representative-load and observability thresholds before production go/no-go. |

No new Product behavior defect was proven by this audit. These are release
readiness, deployment-material, infrastructure, or acceptance gaps unless a
future bounded reproduction proves otherwise.

## Finding reconciliation

`DASHRES-F004` is **RESOLVED — superseded by `ERROR-CONTRACT`**. The historical
finding described database/schema failures being exposed as `422
VALIDATION_FAILED`. The current central error middleware and its focused HTTP
tests map unexpected ORM/database/query failures to safe `500
INTERNAL_SERVER_ERROR`, without SQL text or SQLSTATE. The history stays
preserved; this is not a claim that every reservation browser workflow passed.

Historic `MR1-F004`, `MR1-F005`, `MR1-F007`, and `MR1-F008` are not copied as
unverified current findings. Their still-applicable release risks are captured
by `RELEASE-GAP-F002`, `F005`, and `F006`; the obsolete 5433 verifier target is
an input to the required full-regression strategy, not proof that the current
release has executed it.

## Required evidence before each boundary

| Boundary | Must fix / prove before crossing |
| --- | --- |
| Release candidate | F001 harness repair; N5/N8 authenticated browser chronology; `NOTIF-ACCEPT`; full regression; dependency review; no P1 open finding. |
| Staging | All RC evidence plus migration rehearsal for migration 51, corrected guarded-First-Run deployment material, configured origins/secrets, backup and rollback plan, owner approval. |
| Production | Staging acceptance, backup/restore drill, retention/RPO/RTO ownership, monitoring/alerting/incident evidence, upload-storage controls, performance/capacity evidence and explicit owner go/no-go. |

## Acceptance scorecard

| Contract | Status | Evidence / limitation |
| --- | --- | --- |
| Build, typecheck and lint | PASS | Re-run in this audit; no lint errors. |
| Focused cross-domain regression | PASS | 56/56 selected tests: Error Contract, First Run, Company, notification and deposit rollback. |
| Clean migration / First Run isolated acceptance | PASS | Prior disposable PostgreSQL acceptance; official DB remains unmodified. |
| Error-envelope and PII redaction | PASS | Current source/tests; raw email/token/password/SQL binds are redacted by central logger/query logger. |
| Notification N4/N7 contract | PASS | Focused lifecycle tests. |
| Notification N5/N8 browser acceptance | NOT_OBSERVED | Harness cannot start due to F001. |
| Company REST/SSE runtime consistency | NOT_OBSERVED | No authenticated browser instrumentation. |
| Branch A→B runtime acceptance | NOT_OBSERVED | Available identity/branch count was not safely observed after harness failure. |
| First Run UI browser acceptance | DEFERRED | Static/UI tests passed; browser automation remains deferred. |
| Zero/multiple Company fail-closed states | PASS | Focused lifecycle tests. |
| Backup / restore | NOT_OBSERVED | Utility exists; restore drill has not been accepted. |
| Security dependency assessment | NOT_OBSERVED | No live advisory database consulted in this audit. |

## Release sequence and next work

```text
RELEASE-GAP-AUDIT = COMPLETE
→ RELEASE-GAP-FIX-1 (only F001: harness pre-spawn log stream and owned-temp cleanup)
→ HARNESS-LOG-STREAM-FIX
→ N5/N8 RUNTIME ACCEPTANCE
→ NOTIF-ACCEPT
→ FULL-REGRESSION
→ STAGING/RC
→ PRODUCTION
```

`RELEASE_GATE_WAIVED = NO`. `NOTIF_ACCEPT_AUTHORIZED = NO`.
`STAGING_AUTHORIZED = NO`. `PRODUCTION_AUTHORIZED = NO`.

### Arabic client-readable summary / ملخص عربي للعميل

حالة النظام ليست جاهزة للإصدار بعد. الاختبارات البرمجية الأساسية ومرحلة الإعداد
الأولي نجحت، لكن دليل التشغيل الحقيقي في المتصفح لم يُجمع لأن أداة الاختبار تتوقف
قبل تشغيل التطبيق. كما أن دليل النشر والنسخ الاحتياطي والاستعادة يحتاجان إلى
تحديث واختبار قبل أي بيئة تجريبية أو إنتاجية. لا توجد موافقة على النشر أو الإنتاج
حالياً، ولا يُسمح بتجاوز هذه البوابات.

## Audit boundaries

This document does not assert a security certification, production performance,
browser accessibility, restore capability, or Staging readiness. It records
what current source/test evidence supports and makes every missing release
claim an explicit gate.

## PRE-RESET-BACKUP-RESTORE-REHEARSAL-CONT1 — 2026-07-30

Stage 1 is complete. A custom full backup and schema-only backup were retained outside Git in `pre-reset-rehearsal-20260730092845779`. The local `darfus_erp/public` source remained read-only at `52/51/1`. The archive restored into a unique disposable local database and passed public schema inventory, row-count and financial fingerprints, migration metadata, constraint validity, foreign-key orphan checks, sequence alignment, and read-only smoke checks. The disposable database was dropped with zero residue. This authorizes only `OFFICIAL-LOCAL-DB-RESET-AND-FIRST-RUN-CONT1`.

## OFFICIAL-LOCAL-DB-RESET-AND-FIRST-RUN-CONT1 — 2026-07-30

The authorized local `darfus_erp/public` schema reset completed and all 52 migrations applied successfully. Backend 8000 and Frontend 3000 are running. First Run remains blocked at `SETUP_REQUIRED`: the supported endpoint requires `FIRST_RUN_SETUP_TOKEN`, which is absent from the running local environment and returns 403 when missing. No administrator, Company, Branch, financial roles/mappings, journals, or business rows were created. The verified backup remains retained. Exact next marker: `OFFICIAL-LOCAL-FIRST-RUN-HARNESS-FIX-CONT1`.

## OFFICIAL-LOCAL-FIRST-RUN-HARNESS-FIX-CONT1 — 2026-07-30

The exact setup-token contract was configured locally in ignored Backend
environment and verified by an authorized single Backend reload. Missing and
invalid tokens fail closed with canonical 403 and zero setup/business deltas.
The supported valid-token bootstrap then reaches the existing first-run
password policy and rejects the operator-specified administrator credential
with 422 before the transaction opens. No password, token, setup data, or
Product change is retained in documentation or Git. The database remains an
empty `52/52/0` baseline and the next marker remains
`OFFICIAL-LOCAL-FIRST-RUN-HARNESS-FIX-CONT1`.

## OFFICIAL-LOCAL-FIRST-RUN-HARNESS-FIX-CONT1 continuation — 2026-07-30

The approved local administrator replacement was evaluated through the exact
First Run password validator before an HTTP call. It passes the structural
requirements but fails the account-identity-substring guard. First Run was not
attempted, database mutation is zero, and no Product behavior was changed.
The existing ignored setup token, empty migrated `52/52/0` baseline, verified
backup, and services remain preserved. Exact next marker remains
`OFFICIAL-LOCAL-FIRST-RUN-HARNESS-FIX-CONT1`.

## MANUAL-LOCAL-SMOKE-CONT1 — 2026-07-30

The persistent local baseline passed a normal-login, read-only UI smoke.
`darfus_erp/public` remained `52/52/0`; setup and financial readiness remained
`READY`; the fixed one Company/one Branch context remained intact; and roles
and mappings remained `12/12` and `11/11`. Twenty-five source-defined safe
routes passed, covering Dashboard, accounting/chart/readiness/mappings,
settings, users, business lists, reports, notifications, and audit. The
customer-loyalty route rendered after its controlled direct replay and was not
a reproducible 404. Six direct hard refreshes passed; browser console errors
and warnings were zero.

Whole-public-table fingerprints prove zero BUSINESS, CONFIGURATION, FINANCIAL,
and SYSTEM deltas. The expected AUTH_SESSION effect was one technical-session
row and the normal successful-login timestamp update; normal logout revoked
the owned session. Permission baseline, typecheck, diff/hash gates, and lint
(zero errors, 18 inherited warnings) passed. Exact next marker:
`OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-CONT1`.
## OFFICIAL-LOCAL-FINANCIAL-FIX-CONT3 — persistent Product-API proof boundary — 2026-07-30

User statement accepted the six recent local open installments as intentional
local data. Read-only integrity checks classified all six as usable before the
proof began. The retained F003 implementation passed through the persistent
Product API: exact over-limit rejection returned canonical 422 with zero
command write, partial and exact settlement succeeded, replay returned 200,
same-key changed payload returned 409, and concurrent collections serialized
as 200 plus 422. New payment, treasury, and event-journal records reconcile;
there are no duplicate event journals or unbalanced/orphan journals.

The historical over-collected installment, its original payment, treasury
movement, journal, lines, and audit fingerprint stayed unchanged. However, the
selected valid proof data shared that historical customer, so the legitimate
collection updated the same customer receivable. This violates the required
historical-data isolation boundary. No automatic restore, correction, deletion,
or further financial command was performed. `FINANCIAL-ACCEPT-F003` is proven
in Product and persistent API behavior, while `LOCAL-FINANCIAL-DATA-F001` is
OPEN: `HISTORICAL_CUSTOMER_RECEIVABLE_SHARED_WITH_PROOF_DATA`. The post-proof
custom/schema backup and disposable restore passed. Next only:
`OFFICIAL-LOCAL-FINANCIAL-DATA-REMEDIATION-CONT1`.

Postcheck also found one open cash-register session, but comparison with the
pre-proof backup proves it pre-existed and the Product-API proof did not change
that count. It is retained for the same controlled data-remediation boundary.

## OFFICIAL-LOCAL-FINANCIAL-DATA-REMEDIATION-CONT1 — resolved — 2026-07-30

`LOCAL-FINANCIAL-DATA-F001` is resolved. A deterministic source ledger isolated
one historical collection event as the first cumulative collection to cross its
installment's scheduled collectible amount; later proof invoices and collections
were excluded from that calculation. The Product now accepts only that original
collection reference, calculates the exact DECIMAL(15,4) overage on the server,
posts one receivable-to-`CUSTOMER_DEPOSIT_LIABILITY` reclassification, and creates
no Treasury movement. The original payment, Treasury entry, journal, journal
lines and the separate valid proof records retained their fingerprints.

The derived installment applied amount is now capped at its collectible amount;
the excess exists once as customer credit. Pre- and post-remediation custom/schema
backups each passed disposable restore verification. Product API create/replay and
duplicate-effect prevention, source-boundary rehearsal, Journal balance, and the
F001/F002/F003 regression contracts passed. The inherited open cash-register
session remains unchanged. Next only: `OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-CONT2`.

## OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-CONT2 — valid precondition boundary — 2026-07-30

Preflight and post-remediation backup comparison passed: migration state,
permission baseline, remediation event/Journals, Journal integrity, and the
pre-existing cash-register session matched the accepted boundary. The remaining
cash financial matrix is blocked safely: the sole operational Branch has one
pre-existing open cash-register session, and the Product rejects a second open
session for that Branch. This phase does not own that user session and may not
close, alter, or use it. No new acceptance transaction, configuration change, or
final backup was created. Next only: `OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-HARNESS-CONT2`.

## OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-HARNESS-CONT2 — invalid session boundary — 2026-07-31

The inherited open cash-register session has a valid active cash account, linked
movement journals, no foreign movement, no duplicate idempotency linkage, and
no orphaned cash movement. Its source-derived current cash calculation is
nonetheless invalid for an open session: opening counted cash plus the linked
cash-ledger movement is below the valid non-negative boundary. Ownership is an
active local Super Admin, not an employee/operator fixture, and the session has
financial activity. It was not adopted, closed, or changed. Exact next marker:
`OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-HARNESS-CONT2`.

## OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-HARNESS-CONT2 — root-cause design boundary — 2026-07-31

Chronological cash-ledger analysis identifies the first negative crossing as a
valid posted `purchase_order` cash outflow. The session opening amount matches
the pre-session cash ledger, so this is not a pre-session inclusion or opening
count mismatch. The all-time cash Treasury/GL balance is also negative, proving
an economic cash deficit rather than a session-only/report-linkage defect.
The Product supports a variance close, but this phase has no independently
observed physical cash count or truthful funding source. No fake income, expense,
capital, refund, transfer, reversal, or variance was created. Resolution path is
`F`: no safe supported Product path. Next:
`OFFICIAL-LOCAL-FINANCIAL-CASH-SESSION-REMEDIATION-DESIGN-CONT1`.

## OFFICIAL-LOCAL-FINANCIAL-CASH-SESSION-BASELINE-AUDIT-CONT1 — unstable baseline boundary — 2026-07-31

This strict read-only audit reconfirmed the historical temporary negative
crossing: a posted purchase-order cash outflow changed the running balance from
`111.3800` to `-388.6200`. During the same observation window, the stored
cash-account balance moved from the previously observed `3798.3900` to
`13184.7900` without an action by this phase. The latter amount matches the
Product service's opening-plus-reportable-ledger calculation and the current
cash GL, but the independently changing persistent baseline prevents a safe
financial reclassification. No session, Treasury, Journal, source document, or
configuration row was written. `UNRECORDED_PERSISTENT_DB_DELTA = YES`; next
remains `OFFICIAL-LOCAL-FINANCIAL-CASH-SESSION-BASELINE-AUDIT-CONT1`.

## OFFICIAL-LOCAL-FINANCIAL-CASH-SESSION-BASELINE-AUDIT-CONT1 — stable window and precision boundary — 2026-08-03

The repaired protected-file gate passed at `main` / `bfb5c9c072b8052ea8bd5a0d1f1027b1916e20c0`; `next-env.d.ts` matched its required SHA-256, with no Product, test, migration, package, lockfile, or environment semantic delta. Snapshot A (`20:10:43.637–20:10:43.672 +03`, repeatable-read read-only, snapshot `46913:46913:`) recorded stored cash `13184.7900`, session-service cash `13184.7900`, and GL cash `13184.7900`; fingerprint root was `a09c62563912bcaf724360010aad61d8`. Snapshots B/C/D at approximately 60-second intervals were identical: root `a09c62563912bcaf724360010aad61d8`, Treasury rows `28`, Journals `41`, cash Journal lines `28`, Payments `26`, reservation payments `3`, audit rows `76`, and one open Main Branch session.

Writer isolation found one expected backend under nodemon (port 8000), one expected Next dev frontend (port 3000), no duplicate backend, no test runner, no relevant Windows task, BullMQ configured but Redis unset/in-memory with no financial worker, and the reservation-expiry scheduler explicitly disabled. PostgreSQL showed only one expected idle backend connection, no writer class, no idle transaction, and no waiting lock. No triggers or database cash/balance routines exist. Reads use reportable `posted`/`reversed` journal lines; `Account.balance` is a mirror updated atomically by posting, not a read-endpoint source.

The prior `3798.3900` value was the running GL/session value after the `02:31:19` reservation payment and before eight later authenticated Product requests. The exact delta was new activity, not recomputation: one reservation payment `600.0000` at `02:37:11`, one POS cash receipt `5000.0000` at `02:40:49`, and six successful installment collections (`631.0700` five times and `631.0500` once) from `02:40:55` through `02:41:00`. Their total is exactly `9386.4000`; audit actions and successful idempotency scopes identify normal Product requests by a technical user. `DELTA_NATURE = NEW_EVENTS`; `DELTA_SOURCE = ACTIVE_USER_PRODUCT_REQUEST`. No unknown delta amount remains.

The historical session timeline confirms the purchase-order crossing from `111.3800` to `-388.6200`, minimum `-388.6200`, and first return to non-negative at `3798.3900`. Current GL/session book balance is positive `13184.7900`, but raw linked Treasury movements total `13184.7730`. Four older installment collections (first `20:03:33`, last `20:55:39`) are `0.0170` lower in Treasury than their cent-rounded journal cash legs. This is a supported Product precision-accounting defect: installment/payment/Treasury data accepts four decimals while the current installment posting path rounds before journal posting. `UNKNOWN_MOVEMENT_AMOUNT = 0`; `INVALID_OR_DUPLICATE_AMOUNT = 0.0170`.

`STABLE_OBSERVATION_WINDOW = PASS`; session-to-GL reconciliation passes, raw Treasury-to-GL reconciliation fails by `0.0170`; movement integrity therefore fails. `CURRENT_SESSION_CLASSIFICATION = INVALID_SESSION_DUE_TO_INVALID_EVENT`; `CLOSURE_OR_ADOPTION_READINESS = NOT_SAFE`. `PRIOR_HARNESS_DEFECT = YES` because the earlier conclusion used an unstable observation window; `PRODUCT_DEFECT_PROVEN = YES` for the precision-accounting path. Audit-caused writes, session changes, Treasury changes, Journal changes, login, and financial acceptance writes were all zero. Financial acceptance remains blocked. Exact next marker: `OFFICIAL-LOCAL-FINANCIAL-DATA-AUDIT-CONT1`.

## OFFICIAL-LOCAL-FINANCIAL-DATA-AUDIT-CONT1 — precision scope and remediation boundary — 2026-08-03

This strict read-only phase started at `main` / `aba826fd90ba8b742afcb6e316fe376d003b635f` (`docs: stabilize cash session audit baseline`). The Git gate passed: staged/untracked `0/0`, stashes `11`, remotes `0`, required `next-env.d.ts` SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`, and only the three accepted CRLF-only backend artifacts were dirty and semantically equal to HEAD. Ports `3000/8000/5432` were healthy; `darfus_erp/public` was `52/52/0`, setup and financial readiness were `READY`, roles/mappings/permissions were `12/11/128`, and one Main Branch session remained open.

The schema already supports the domain contract: Payment/Treasury/Installment/session money is `numeric(15,4)`, Journal headers/lines and Account balance are `numeric(20,8)`, Customer balances and invoice/source-document totals are `numeric(20,8)`, customer credit is `numeric(15,4)`, and reservation, amendment, refund, transfer, supplier and purchase money is `numeric(20,8)` or an explicitly narrower `numeric(15,4)` cost/rate field. VAT rates are `numeric(6,3)`; gold exchange rates are `numeric(24,8)`, price proposals `numeric(20,4)`, and weights/purity six decimals. Optional snapshots/components are nullable; non-null money defaults are zero where defined. No migration is required.

The source trace is `TREASURY_4DP_JOURNAL_2DP`. The route validates at most four decimal places, converts to integer ten-thousandths, locks the Installment, compares exact outstanding units, and writes Payment, Treasury, Installment, Invoice, and Customer mirrors atomically. It uses trusted `Invoice.branchId`, durable Payment `source_id`, central idempotency, and audit linkage. `posting.service.postInstallmentPayment` calls cent `round(amount)` and the default `postEntry`, which rounds both Journal lines and updates `Account.balance` from those rounded lines; the exact-four-decimal posting branch is not selected.

The database-wide exact-decimal scan found only one affected source class: `installment_collection`. It has `18/18/18` source/Treasury/Journal-linked events, exact Payment and Treasury sum `3934.6580`, Journal cash/AR sum `3934.6800`, five mismatches, maximum row delta `0.0050`, and signed/absolute GL-over-Treasury delta `0.0220`. Other present classes (`cash_transaction` 3, `customer_credit` 2, legacy `installment` 1, `invoice` 8 with seven Treasury-linked cash effects `5166.5000`, `purchase_order` 4 with two linked payments net `-550.0000`, `reservation_payment` 3 at `4784.0000`, `reservation_settlement` 1 with no Treasury, and prior `installment_overpayment_reclassification` 1 at `0.0100` with no Treasury) have zero precision mismatch. Named absent expense, settlement, income, return, deposit, POS-specific, and transfer classes have zero events. Exactly five current Payment/Treasury amounts have more than two decimals, all five affected events.

Safe affected fingerprints and exact deltas are:

| Fingerprint | Business time (+03) | Target | Payment/Treasury | Journal target / AR | Signed delta | Current-session subset |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `b2ac8ef1d41e` | `2026-07-30 20:03:33.762` | cash | `5.3750` | `5.3800 / 5.3800` | `+0.0050` | yes |
| `d4c943da56ea` | `2026-07-30 20:03:33.848` | bank | `5.3850` | `5.3900 / 5.3900` | `+0.0050` | no |
| `4502aece6bc2` | `2026-07-30 20:55:39.605` | cash | `4.4150` | `4.4200 / 4.4200` | `+0.0050` | yes |
| `250ba47f8864` | `2026-07-30 20:55:39.677` | cash | `4.4150` | `4.4200 / 4.4200` | `+0.0050` | yes |
| `46eed78deb0b` | `2026-07-30 20:55:39.722` | cash | `5.2980` | `5.3000 / 5.3000` | `+0.0020` | yes |

Every row has Payment-to-Treasury equality, equal balanced Journal legs, durable source identity, and linked idempotency/audit evidence. The four current-session cash rows compose exactly `0.0050 + 0.0050 + 0.0050 + 0.0020 = 0.0170`. The economic event is correct and the defect is an accounting-representation mismatch. `Account.balance` is a `JOURNAL_MIRROR`: stored account values exactly equal reportable Journal calculations. Current cash is stored/GL `13184.7900` versus Treasury `13184.7730`; bank is stored/GL `-28.8600` versus Treasury `-28.8650`. GL, account statement, trial balance, accounting dashboard, balance sheet and Treasury balance summary follow Journal; raw Treasury/source views follow operational data; cash reconciliation exposes the difference; Income Statement is unaffected. Overall report impact is `REPORT_MIXED_SOURCE`.

F001 trusted Invoice Branch authority, F002 durable Payment identity, and F003 locked exact comparison remain intact and distinct. The prior overpayment remediation remains one active `0.0100` credit and one balanced exact reclassification Journal with zero Treasury rows/delta; original and persistent-proof records are unchanged.

Canonical policy is `BUSINESS_4DP_POSTING_4DP_DISPLAY_2DP`: validate at most four decimals; store/compare/post exact ten-thousandths; allow two-decimal display only as presentation; never feed display rounding into storage, comparison or posting; and require Payment = Treasury = Journal target leg = opposing AR leg at exact four-decimal precision. Future scope is `CODE_PLUS_DATA_REMEDIATION` plus tests: change `backend/src/services/posting.service.js` to use exact posting for installment collections and `backend/src/services/cash-register.service.js` to retain four-decimal session calculations. No migration 53 is justified.

Preferred historical pattern is `SOURCE_LINKED_ROUNDING_REMEDIATION`: one idempotent Product-owned correction Journal per affected Payment, debiting AR and crediting the original mapped cash/bank account by the exact row delta, with audit evidence and no Treasury, Payment, Invoice, Installment, Customer, or original Journal rewrite. Total correction is `0.0220` (cash `0.0170`, bank `0.0050`). After the complete repair, cash Treasury/GL/stored should be `13184.7730` and bank `-28.8650`; the open session can then be re-audited without invented cash, but a physical count remains required before closure/adoption.

Typecheck, targeted lint, F001/F002/F003, overpayment-remediation contract, permission baseline, live migration/permission inventory and diff check passed. Unbalanced/orphan/duplicate/unlinked-Treasury/transaction-time-account/idle/waiting/disposable counts are zero. Audit-caused writes are zero. Financial acceptance, release, Staging, Production, session action, migration, deployment and push remain blocked. Exact next marker: `OFFICIAL-LOCAL-FINANCIAL-FIX-CONT4`.

## OFFICIAL-LOCAL-FINANCIAL-FIX-CONT4 — Product/data repair result — 2026-08-03

The authorized code repair is committed as `e9d7bbffed26d93346b1c201b5b4f4a5c46d5380` (`fix: preserve installment posting precision`). Posting and register calculations preserve four decimals; the source-linked route validates immutable evidence and posts one exact correction Journal per Payment under idempotency/audit controls. Five events were remediated: total `0.0220` (`cash 0.0170`, `bank 0.0050`), no CashTransaction, and no original source-row rewrite. The pre-write dump and disposable restore rehearsal passed; focused tests and replay/duplicate guards passed.

Stored Account, posted GL, Treasury summary, dashboard, and cash reconciliation now agree at cash `13184.7730` and bank `-28.8650`; movement difference is zero. The prior `0.0100` overpayment reclassification remains with zero Treasury effect, integrity counts are clean, and migrations remain `52/52`. The open session was deliberately untouched; physical count evidence is still required before closure/adoption. This phase is local-only with no deployment or push. Next: `OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-HARNESS-CONT2`.

## OFFICIAL-LOCAL-FINANCIAL-ACCEPTANCE-HARNESS-CONT2 — physical-count boundary — 2026-08-03

The read-only harness started at `main` / `ea8213ac99d6d3190b65211aa99ba431ef7edc6f`. CONT4 remains intact: five remediation Journals, zero remediation Treasury rows, effective correction `0.0220` (`cash 0.0170`, `bank 0.0050`), and zero active precision mismatches. Cash stored/GL/Treasury/session-service are `13184.7730`; bank stored/GL/Treasury is `-28.8650`.

The sole Main Branch session is `INHERITED_PRE_CONT2`, open since `2026-07-30 19:38:12 +03` by a local Super Admin, with opening amount `1.5000`. Exact reconstruction is opening `1.5000` plus 29 valid posted session movements net `13183.2730`, yielding `13184.7730`. Source classes are 18 installment collections, four invoices, three reservation payments, two purchase orders, and two customer-credit bank movements. All 29 safe fingerprints have valid Company/Branch/account/source/Journal/Treasury linkage; `UNKNOWN_MOVEMENT_AMOUNT = 0` and `INVALID_ACTIVE_MOVEMENT_AMOUNT = 0`.

The accepted original historical trace remains `111.3800 - 500.0000 = -388.6200`, first returning non-negative at `3798.3900`. CONT4's exact historical corrections make the effective ledger view `111.3750 -> -388.6250` and first return `3798.3730` at the same later reservation event; this remains a historical crossing, not a current deficit.

No owner-supplied physical count was provided. Therefore `PHYSICAL_CASH_COUNT_AVAILABLE = NO`, comparison is `NOT_TESTED`, session readiness is `ACCOUNTING_RECONCILED_AWAITING_PHYSICAL_COUNT`, and financial acceptance remains `BLOCKED_BY_PHYSICAL_COUNT`. No financial, cash-session, Inventory, source, test, migration, deployment, or push action occurred. Exact next marker: `OFFICIAL-LOCAL-FINANCIAL-CASH-COUNT-CONFIRMATION-CONT1`.

## OFFICIAL-LOCAL-INVENTORY-MASTER-CURRENT-SYSTEM-AUDIT-CONT1 — read-only completed audit — 2026-08-03

### A–H — decision, boundary, checkpoints, and authority

**A Executive decision.** The current implementation is a hybrid serialized-Asset plus legacy quantity-Product system. It is not the locked piece-only target. This audit is complete as a dependency/gap baseline; no target refactor is implemented and release/staging/production remain unauthorized.

**B Authorization boundary.** Product source, frontend/backend, schema, data, migration, package, environment, Inventory, financial and cash-session writes were forbidden and measured as zero. Only the seven existing documentation files were eligible for a docs-only checkpoint.

**C Starting/final checkpoints.** Start: `main`, `03fc7c69415397c2f1d1667917bac5fb7c6148c4`, `docs: record physical cash count boundary`, staged `0`, untracked `0`, stashes `11`, remotes `0`. Required `next-env.d.ts` SHA-256 remains `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`.

**D Git/protected-file preflight.** Only inherited CRLF materialization remains in `backend/package-lock.json`, `backend/package.json`, and `backend/src/controllers/erp.controller.js`; ignore-EOL diffs are empty. Protected semantic equality passed for `backend/src/app.js`, `backend/src/routes/events.routes.js`, and `next-env.d.ts`. No reset, restore, checkout, clean, stash, broad staging, push, deployment, or service restart was used.

**E Requirement-source access and complete-read proof.** Exact sources read are `H:\WORK\client-requirements\Gold By Weight.docx` (1161 paragraphs, 879 non-empty, 0 tables, SHA-256 `271023241f284d7e69a3e6d992cc2a87d7a3044c5e2e1d21e4d35d20b7221869`), `H:\WORK\client-requirements\Gold By Piece.docx` (481 paragraphs, 442 non-empty, 0 tables, SHA-256 `93fafc2b71d4d1e7ff73ef1761b3cffb69ea974f838a2335f2cd925a0cf8629c`), and `H:\WORK\client-requirements\Add Item Pages.xlsx` (10 populated sheets, SHA-256 `c8826790b0f2ae3f34c7ea02f02630a4ce2278e5a9f24635c17588a465c0fb2b`). Structural reads completed for both Word files. Spreadsheet inspection covered every sheet's populated cells, merged headings, classifications, notes, and formulas; all sheets contain zero formulas and zero cell comments. LibreOffice rendering was unavailable (`soffice` not installed), so visual QA is recorded as unavailable, not as a source-read failure.

**F Updated requirement authority.** Locked precedence is `OWNER > PROFILE_SPECIFIC_WORD > EXCEL > GENERAL_WORD > EXISTING_PRODUCT`. The superseded UUID filename was not required or substituted.

**G Owner overrides.** `UNIQUE_PHYSICAL_ASSET_PER_PIECE = YES`; quantity stock is removed (not hidden); one piece owns one Asset ID, primary Barcode, weight, state, branch/location, cost context and lifecycle. Gold Bar VAT base is `CERTIFICATE_ONLY`; VAT rate is manual with optional settings default; no hard-coded rate.

**H Canonical requirements summary.** Ten profiles share one Asset core plus strategies/components: Gold-by-Weight jewellery, 24K bar, Gold-by-Piece, diamond jewellery/loose diamond, gemstone jewellery/loose gemstone, pearl jewellery/loose pearl, and CGP. Target strategies are `WEIGHT_BASED_MAKING_STRATEGY`, `BAR_CERTIFICATE_STRATEGY`, `PIECE_MARKUP_STRATEGY`, and profile-specific stone/pearl/loose strategies.

### I–L — profile contracts and Excel matrix

**I Gold By Weight.** The Word contract has eight sections. Jewellery uses `net = gross - stone`, `pure999.9 = net × karat / 24`, historical gold rate snapshot, making-per-gram and separate current valuation; selling uses current global/retail gold rate, selling making per gram, minimum making and manager approval below minimum. Excel additionally lists optional Pure Gold 995.

**J 24K Gold Bar.** Specialized weight profile with certificate name/number/cost. Purchase/current totals are gold value + certificate + certificate VAT; VAT is certificate-only and the rate is operator/settings supplied. Sales uses certificate charge per piece and minimum certificate charge with manager approval below minimum. Any current formula taxing gold value is a future gap.

**K Gold By Piece.** Weight fields remain, but sales is markup over current cost. Total selling price, maximum discount, minimum allowed price, VAT, net-before-VAT and profit margin are derived; manual selling-price/discount protection overrides require audit and permission.

**L Excel remaining-profile summary.** Diamond/gemstone/pearl jewellery sheets contain shared gold/cost/pricing fields plus stone/pearl attributes, certificate fields and dynamic component rows. Loose sheets explicitly repeat a component group with `Quantity` and component cost; that quantity is component metadata, not stock quantity. CGP is source-transaction-derived (invoice/customer/mobile/date/barcode/karat/weights/evaluation/rates/deduction/paid cost/current value/disposition/conversion/transfer/transit/melt/missing). Sheet ranges observed: `ذهب بالوزن A1:E64`, `ذهب بالوزن عيار 24 A1:E65`, `ذهب بالقطعة A1:E68`, `مجوهرات الماس A1:E88`, `فقط احجار الماس A1:E70`, `مجوهرات الاحجار الكريمة A1:E89`, `فقط احجار كريمة A1:E68`, `مجوهرات الؤلؤ A1:E89`, `فقط لؤلؤ A1:E71`, `CGP - Customer Gold Purchase A1:E39`.

### M–T — current architecture, schema, quantity, identity, weights, components

**M Current Inventory architecture.** `assets` is a serialized core with `type` enum (`gold-piece`, `gold-weight`, `diamond`, `gemstone`, `pearl`, `watch`), identity/taxonomy, weights, legacy price/cost, JSON metadata and soft delete. `products` is a separate quantity stock ledger. Direct generic mutations are fail-closed (`GENERIC_INVENTORY_MUTATION_FORBIDDEN`); supplier receiving is the authoritative intake path.

**N Current DB relationship graph.** `assets` links to Company/Branch, AssetEvents, AssetAttachments, AssetCertificates, StockMovements, PurchaseOrderItems, InvoiceItems and ReservationItems. `products` links to Company/Branch, StockMovements and PurchaseOrderItems. Transfers store `asset_ids` as JSONB (no FK child table). Manufacturing stores input/output assets as JSONB. Stock audits use `stock_audits` + `stock_audit_items` with Asset/Branch FKs. CGP uses document/item tables; `inventory_gold_pools` is currently empty. Schema migrations are 52/52/0.

**O Quantity-model elimination audit.** True stock quantity exists in `products.quantity_*`, `stock_movements.quantity_in/out`, purchase-order line `quantity/received_quantity`, product POS/exchange/return paths, supplier receiving, inventory valuation and the Products tab/grid. Document-line quantity remains valid for invoice lines and purchase lines; component `Quantity` remains component metadata. Target disposition: Product stock fields `REMOVE_AFTER_DEPENDENCIES_MIGRATED`; document quantities `KEEP_AS_DOCUMENT_METADATA`; component quantities `KEEP_AS_COMPONENT_METADATA`; totals become Asset/status counts. Current DB has 50 Assets and 3 Products; Product `GOLD-PES` has on-hand 100, proving the legacy quantity path is live.

**P Identity model.** Asset PK is `assets.id`; `barcode` is persisted primary lookup; taxonomy fields support generated identity. `product_code` is a quantity SKU. RFID is nullable. Certificate/model numbers are metadata or certificate relations, not universal identity. `invoice_items.asset_id` also stores `product.id` for quantity sales, a semantic compatibility conflict.

**Q Barcode.** `barcode-identity.service.js` allocates company-scoped sequence rows atomically and prevents reuse/collision; partial unique indexes prove zero duplicate groups. Generic Asset PATCH rejects identity changes. Reprint UI/template exists, but durable print-history entity is absent; print/reprint history is a gap.

**R RFID.** Current `assets.rfid` is one nullable column; no assignment/history/scan table or route was found. Duplicate RFID protection exists when populated. Required RFID states/history/scan metadata are `MISSING/NEW_RELATION`; Barcode remains primary.

**S Weight engine.** Assets have gross/net/gold/net-gold weights at DECIMAL(10,4)/(15,4); source code does not persist stone-weight or pure-999.9/995 as first-class columns. `netWeight`, `goldWeight`, `totalWeight`, and `averageUnitWeight` are overloaded across serialized and quantity paths. Profile-specific units/precision/provenance are a target gap.

**T Stone/Pearl component model.** `stone_details` and `pearl_details` JSONB columns exist, but all 50 local Assets have empty arrays and no normalized child rows. Target is repeatable `StoneComponents`/`PearlComponents`; loose independently inventoried stones/pearls become separate Assets.

### U–Y — costs, VAT, pricing, and states

**U Purchase-cost model.** Supplier receiving creates one Asset per serialized quantity unit and stores `Asset.cost` plus gold-cost snapshot fields; quantity lines update weighted-average Product cost. PurchaseOrderItems retain historical unit/total and snapshots. Classification: `PARTIAL_SEPARATION`.

**V Current-valuation model.** `/reports/inventory-valuation` computes live valuation from active Assets and Product quantity rows and is explicitly not a historical snapshot. Asset price/cost and Product averageCost/salePrice mix current and historical semantics. Target must isolate immutable purchase and current valuation layers.

**W VAT/tax model.** Settings expose VAT rate/purchase defaults/recoverability/RCM; posting routes input VAT/RCM and non-recoverable capitalisation. Gold By Piece taxes gold plus making; legacy Excel text contains hard-coded 5% and ambiguous parentheses; Owner overrides 24K to certificate-only/manual-rate. Classification: `VAT_RULE_CONFLICT` until profile formulas are isolated.

**X Pricing-strategy model.** POS uses shared `salesService.computeTotals` and accepts line price/discount/making/stone values; no persisted profile strategy/minimum layer was found. Classification: `PRICING_STRATEGY_CONFLICT`.

**Y Status/state dimensions.** Asset enum includes available/reserved/sold/repair/transferred/melted/archived/pending_transfer/returned/in_workshop/pending_tag. Gold By Piece adds Available/Used, Pending Tag and Exchanged. Target splits operational status, condition, tag state, lifecycle event and transaction state. Classification: `STATE_MODEL_CONFLICT`; Returned-to-Available approval semantics remain `REQUIREMENT_OPEN`.

### Z–AJ — integrations and surfaces

**Z Purchase integration.** Supplier receive loops serialized line quantity into individual Assets with barcode, branch, event and PO-item FK; product-coded lines update Product quantity, create StockMovement and product-linked PO item. Accounting and optional Treasury payment are transactional. Quantity support remains a target conflict.

**AA Sales integration.** POS/sales-post resolve Product first (quantity) then Asset (specific identity). Product sales decrement counters; Asset sales set `sold`, create InvoiceItem and AssetEvent. Returns/exchanges mirror both branches. Target requires Asset links for each physical piece.

**AB Reservation integration.** Reservation is Asset-specific (`ReservationItem.asset_id`) with branch/status guards, AssetEvents and AuditLog. Legacy header retains one asset id; no quantity reservation target is accepted.

**AC Return/Exchange integration.** Routes preserve source invoice/line and Asset identity for serialized items; Product paths restock quantities. Exchange supports mixed asset/product payloads. Target requires explicit source/returned/replacement Asset lineage.

**AD Transfer/Workshop integration.** Transfers use JSONB `asset_ids`, reserve at request, then update branch/status on approval/receipt. Manufacturing/workshop uses JSONB input/output and can mark parent melted. Normalized transfer/workshop history is missing.

**AE Melted/Missing.** Melted status is terminal in current guards but lacks a dedicated melting record; stock audit can mark missing but investigation fields are absent. Returned can reset to available. Permanent identity/history and approved return workflow are future gaps.

**AF Inventory Audit.** `stock_audits`/`stock_audit_items` support branch-scoped Asset matching/missing/unexpected. Required Draft/In Progress/Completed/Closed, audit number/date/location/method, RFID scan and immutable close are only partial; local audit rows are zero.

**AG Asset History.** 60 AssetEvents are only `PURCHASE_RECEIVED` (50), `RESERVED` (4), and `SALE` (6). Required extension/cancellation, transfer, workshop, return/exchange, audit/adjustment, RFID and tag/melt/conversion events are not comprehensive.

**AH Audit logging.** 81 AuditLog rows use a tamper-evident hash chain and dual technical/employee actor fields. AuditLog is separate from immutable AssetEvent history and cannot alone satisfy the lifecycle timeline.

**AI All Items/Grid/Search.** Inventory UI has separate Products/Assets tabs, server pagination, filters, column visibility persistence, barcode print/tag templates, bulk asset status and export. Product quantity columns and valuation are live; Asset grid lacks required saved views, pin/reorder/resize/filter totals and complete smart-search/profile columns.

**AJ CGP.** CGP draft/submit/approve/validate governance exists with 2 documents/4 items; no Asset or InventoryGoldPool rows are created. Target must derive per-piece lifecycle identity from approved CGP source lines without duplicate manual entry.

### AK–BA — financial/API/UI/permission/legacy, disposition, safety, and closure

**AK Accounting/financial dependencies.** Purchase posts inventory/payable/VAT/RCM and optional Treasury; sales posts revenue/VAT/AR/COGS/inventory; returns/exchanges reverse or restock; reservations post liability/advance without quantity stock. Any migration requires exact COGS/VAT/source/branch/journal regression. Financial readiness is READY; cash session is open and untouched.

**AL API compatibility map.** Read/list: `/assets`, `/assets/:id`, `/assets/:id/timeline`, `/inventory/products`, `/products/:id/{movements,sales,purchases}`, `/stock-audits`, `/reports/inventory-valuation`, barcode settings. Mutations: supplier receive, POS/sales post/return/exchange, reservation lifecycle, transfers, stock audits, attachments and barcode taxonomy settings. Generic Asset/Product/StockMovement/Transfer CRUD mutations are fail-closed. Highest breaking risk is `asset_id`/Product quantity semantics and mixed exchange payloads.

**AM Frontend dependency map.** Inventory main page consumes Product and Asset repositories, quantity counters, filters and print templates; supplier purchases creates intake; POS/exchanges consume Product quantity or Asset IDs; reservations, transfers, audits, valuation reports and Asset detail/timeline consume Asset status/branch/barcode. Future field replacement must update all consumers in one workstream.

**AN Permission map.** Existing guards cover `inventory.view/create/update/delete/adjust/export/print`, attachment management, sales/return/exchange, POS discount approval, reservations and transfer/audit adjustment. Barcode taxonomy writes use settings/inventory adjust; no dedicated RFID, profile pricing, VAT/making/certificate minimum, melt or missing permissions were found.

**AO Legacy/test-data classification.** Rows with purchase/invoice/reservation/event/journal links are `MUST_PRESERVE_IDENTITY` and `FINANCIAL_REFERENCE_PRESENT`; Product/quantity rows are `REQUIRES_MAPPING`; empty component/CGP pool surfaces are `LEGACY_INCOMPLETE`; recreation is allowed only after disposable rehearsal. No deletion/backfill occurred.

**AP Profile gap matrix.** Weight core `EXISTS_NEEDS_EXTENSION`; bar VAT/certificate `EXISTS_DIFFERENT_SEMANTICS` + `VAT_RULE_CONFLICT`; piece pricing `EXISTS_DIFFERENT_SEMANTICS`; diamond/gemstone/pearl `EXISTS_NEEDS_EXTENSION`; loose components `NEW_RELATION`; CGP-to-Asset `NEW_WORKFLOW`; RFID/history/grid/state `NEW_RELATION/NEW_WORKFLOW`; quantity `QUANTITY_MODEL_CONFLICT`.

**AQ Target disposition matrix.** Keep/extend `assets`; split stone/pearl JSON to child relations; keep AssetEvent/AuditLog with richer immutable lifecycle events; remove Product stock only after all dependencies migrate; keep document/component quantities in scope; replace transfer JSONB with normalized asset links; migrate/deprecate overloaded valuation fields.

**AR Future refactor boundary.** Design only: lock requirements, design shared Asset core/profile strategies, schema/compatibility/migration rehearsal, then controlled backend/frontend/integration refactor, local backfill, acceptance and financial regression. No implementation is authorized here.

**AS Future migration safety plan.** Backup first; restore disposable clone; rehearse schema/backfill; validate FKs/orphans, barcode uniqueness/non-reuse, Asset identity, financial references, API/UI regression and rollback; only then apply locally. Preserve IDs and journal source links.

**AT Requirement-open items.** Owner certificate-only/manual VAT supersedes legacy 5% text. Returned-to-Available approval/condition semantics, exact component units/precision and CGP line-versus-piece identity remain open but do not block this architecture map.

**AU Static validation.** Read-only source searches, model/migration inventory, schema introspection, barcode index/duplicate preflight, typecheck/lint/diff-check contracts were used. No mutating tests ran against `darfus_erp`.

**AV Final DB/financial postcheck baseline.** Migrations `52/52/0`, setup `READY`, financial readiness `READY`; cash `13184.7730`, bank `-28.8650`, active precision mismatch `0`, unbalanced/orphan/duplicate/unlinked/idle/waiting/disposable counts `0`. Inventory fingerprints before documentation: assets `50 / 05b87d94d28183c66dadab77b10b41fa`; AssetEvents `60 / 940a8d0164ac8d7541fc30ec22210c2e`; Products `3 / a41a93115d45fc8de2166e6fd9e36c99`; StockMovements `11 / 022b52105d167e88042fb0bb493a12dc`; PO items `53 / 2386602fc42aba2e96159a40975389fe`; Invoice items `12 / 23affc15d54600bfcbceb0122ac97ec8`; Reservations `2 / 19a50544009a9d06e3501384aabf0`; Reservation items `4 / 1a9a52d0c3689a9d06e3501384aabf78`; CGP documents `2 / a8591c4a236c6bf13256bc6ed6e7c225`; CGP items `4 / 384de4825d2f8b75dbc6731ce2c9e4ca`. Audit-owned writes: `0`.

**AW Documentation.** This A–BA report is the detailed evidence package in the repository's existing release-audit convention. The same checkpoint, authority, quantity elimination, target boundary and marker are summarized in the other six authorized docs.

**AX Documentation commit.** If final postchecks remain unchanged, exact docs-only commit subject is `docs: map updated inventory master dependencies`; stage only the seven authorized paths and do not push.

**AY Final Git safety.** Final required state: branch `main`, staged `0` before exact-path staging, untracked `0`, stashes `11`, remotes `0`, protected semantic equality preserved, no deployment/push.

**AZ Final classification.** `OFFICIAL-LOCAL-INVENTORY-MASTER-CURRENT-SYSTEM-AUDIT-CONT1 = COMPLETE`; `ALL_REQUIREMENT_SOURCES_READ_COMPLETELY = YES`; target `PIECE_BASED_ONLY`; quantity stock target `REMOVE`; Product/database/Inventory/financial/cash-session writes `0`; current financial baseline and physical-count boundary preserved; release/staging/production unauthorized.

**BA Exact next marker.** `OFFICIAL-LOCAL-INVENTORY-MASTER-TARGET-DESIGN-CONT1` (do not start automatically).

## OFFICIAL-LOCAL-INVENTORY-MASTER-TARGET-DESIGN-CONT1 — executable target architecture (2026-08-03)

**A Executive decision.** The existing `assets` table is the canonical inventory identity and will be kept and extended. The approved target is `PIECE_BASED_ASSET_ONLY`: one independent physical piece, including each loose stone or pearl, is one Asset with one permanent ID, one permanent primary Barcode, its own state, location, cost/valuation context and lifecycle. Legacy Product stock is `MIGRATE_THEN_DEPRECATE`. The reversible foundation is approved for disposable rehearsal, with three non-blocking requirements isolated in extension points rather than guessed.

**B Authorization boundary.** This phase is documentation/design only. Product, frontend, backend, schema, migration, test, package, environment, database, Inventory, financial and cash-session writes are forbidden and are `0`. No push, deployment, release, Staging or Production action is authorized.

**C Starting/final checkpoints.** Start and design postcheck are `main` at `1d21e95e5cf148ffbf0edc0d6e43f123fd9c540d`, subject `docs: map updated inventory master dependencies`; staged/untracked `0/0` before documentation, stashes `11`, remotes `0`. Frontend `:3000` and backend health `:8000` returned HTTP `200` at preflight.

**D Git/protected-file preflight.** Required `next-env.d.ts` SHA-256 is `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`. Only the three accepted CRLF materializations (`backend/package-lock.json`, `backend/package.json`, `backend/src/controllers/erp.controller.js`) differ bytewise and they compare semantically equal to `HEAD`; `backend/src/app.js`, `backend/src/routes/events.routes.js` and `next-env.d.ts` compare exactly. No destructive Git command was used.

**E Requirement authority.** The locked order is `OWNER > PROFILE_SPECIFIC_WORD > EXCEL > GENERAL_WORD > CURRENT_PRODUCT`. Owner rules control piece identity, quantity elimination, 24K certificate-only VAT and manual/settings VAT rate. Profile Word controls workflows/formulas/status/history; Excel controls field presence and input/derived classification. Unresolved semantics remain `REQUIREMENT_OPEN`.

**F Accepted current-system baseline.** The accepted input is the hybrid 50-Asset/3-Product system, including `GOLD-PES` on-hand `100`; serialized relations already reach events, attachments, certificates, movements, PO/invoice/reservation items, while Product quantity remains live. Transfers and manufacturing use JSONB references, RFID is a nullable Asset column, component JSON is empty locally, AssetEvents are incomplete, stock-audit and gold-pool tables exist, and supplier receiving is the only authoritative intake path.

**G Target architecture principles.** Extend rather than replace `assets`; preserve every existing ID, Barcode, document and financial source link; keep Company/Branch authority server-side; make state, components, document links and custody relations normalized; use decimal-safe domain strategies; separate immutable purchase facts from current valuation; append history instead of rewriting it; dual-read/dual-write only behind measured compatibility gates; and never infer per-piece facts from aggregate quantity.

**H Canonical Asset Core.** `CANONICAL_ASSET_CORE = EXISTING_ASSETS_KEEP_AND_EXTEND`. Target core fields are:

| Field | Target contract |
| --- | --- |
| `id` | Existing `varchar` PK, non-null, permanent, server-generated, never edited/reused; all history uses `RESTRICT`. |
| `company_id` | Existing `varchar` FK Company, non-null, immutable after creation, authority-derived; indexed with operational queries. |
| `branch_id` | Existing nullable `varchar` becomes required for active Assets after backfill; server-authoritative, changed only through receipt/transfer/approved adjustment. |
| `location_id` | New nullable `varchar` FK `inventory_locations` during compatibility, then required for non-terminal Assets; state workflow only; indexed. Legacy `location` remains read-only until cutover. |
| `inventory_profile` | New non-null `varchar(40)` after classified backfill; one of the ten registry codes; immutable except audited correction; indexed. Legacy `type`/`inventory_subtype` dual-read until removal. |
| `name`, `category`, `description`, `brand`, `model`, `model_number`, `notes` | Keep `name/category/notes`; add nullable descriptive text fields. User-editable with validation; material edits create `ASSET_MODIFIED`; model/model-number searchable. |
| `barcode` | Existing non-null `varchar`, server-generated, company-scoped unique including soft-deleted rows, immutable and never reused. Existing component/sequence fields remain generation metadata. |
| `operational_status` | New non-null `varchar(24)`, default only on service creation (`AVAILABLE` or `RETURNED` by source); state-machine-only; indexed. |
| `condition` | New non-null `varchar(8)` (`NEW`,`USED`), no guessed DB default during backfill; audited edit. |
| `tag_state` | New non-null `varchar(8)` (`PENDING`,`PRINTED`), state-machine-only; default `PENDING` for new receipt. |
| `purchase_date`, `supplier_id` | New nullable date/FK convenience projections populated from immutable origin/cost revision; server-derived and not independent economic authority; indexed for list filters. |
| `created_by`, `updated_by` | New nullable technical-user FKs/snapshots according to existing identity convention; server-derived. `updated_by` never substitutes for Asset History. |
| `retired_at`, `retired_by`, `retirement_reason` | New nullable terminal administrative metadata; terminal state is not deletion. Existing `deleted_at` remains compatibility only; Barcodes remain reserved. |
| `created_at`, `updated_at` | Existing timestamps; `updated_at` is not lifecycle history. |

No redundant `asset_code` is added: `id` is the permanent system identity and `barcode` is the operational lookup. Weight, cost, valuation, VAT, price, origin, component and RFID facts live in typed child relations. Existing overloaded fields remain compatibility projections until their consumers migrate.

**I Asset identity.** Asset identity begins at authoritative receipt/conversion/manufacturing output. Creation is one transactional operation: validate Company/Branch/profile/per-piece input; lock the Barcode sequence; insert Asset, origin, initial cost revision, profile details, state event and receipt movement; attach the source item; commit once. Independent pieces can never share an Asset row. IDs and Barcodes survive return, transfer, workshop, missing, sale, melt, retirement and soft deletion.

**J Barcode.** Keep `barcode_inventory_codes`, `barcode_item_codes`, `barcode_sequences` and the current atomic generator. Retain `assets_company_barcode_uq` and the component unique index, but rehearsal must prove the unique index exists after duplicate preflight. Lookups use `paranoid:false` collision checks so terminal/deleted identities reserve their Barcode. New `asset_tag_print_events` records initial print and every reprint; reprint needs `inventory.barcode.reprint`, reason, operator/device context, AuditLog and `TAG_REPRINTED` history. Reprint never changes Barcode.

**K RFID.** Replace the single-column authority with `asset_rfid_assignments` plus `rfid_scan_events`. At most one current assignment may exist per Asset; a company/RFID pair is permanently unique and never reassigned. Replacement closes the current row as `REPLACED`, records actor/time/reason, inserts a new current row and emits history/audit in one transaction. `INACTIVE` or `MISSING` RFID never invalidates the Asset; Barcode remains primary. Existing nonblank `assets.rfid` is copied to an initial historical assignment in rehearsal, verified, then becomes read-only compatibility data.

**L Profile storage model.** Use a shared Asset core plus typed extensions: `asset_gold_details`, normalized components/subtypes, purchase-cost revisions, current valuation and pricing policy. `InventoryProfileRegistry` owns the ten profile definitions, required fields, component roles, weight/tax/pricing strategies and legal operations. JSONB is allowed for UI saved-view definitions and immutable old/new event context, not for authoritative weights, components, costs, state, source identity or custody.

**M Weight engine.** `asset_gold_details` stores `weight_unit='GRAM'`, `gross_weight`, `stone_weight`, `net_gold_weight`, `karat`, `purity_ratio`, `pure_gold_9999` and optional `pure_gold_995`, all `decimal(20,8)`. Server formulas are `net = gross - stone` and `pure9999 = net * karat / 24`; `pure995` is nullable and enabled only by a profile rule. Gross/stone/karat are validated inputs; net/pure are server-derived, persisted for stable reporting, recomputed atomically on authorized correction, and old/new values enter History/Audit. No float arithmetic. Legacy `gross_weight`, `net_weight`, `gold_weight`, `net_gold_weight`, `weight`, `totalWeight` and `averageUnitWeight` are mapped by profile and never treated as interchangeable; unexplained values block that row's backfill.

**N Stone/Gem/Pearl components.** `asset_components` provides stable `[0..n]` ordering, `role` (`EMBEDDED`,`PRIMARY_SUBJECT`), `component_kind`, name/type, quantity, weight/carat/unit, cost/current value, certificate link and notes. Jewellery may group identical embedded components with count greater than one. A loose Asset must have exactly one `PRIMARY_SUBJECT` representing the one physical item; independent loose pieces are separate Assets and component quantity is one. One-to-one subtype tables store Excel fields: diamond treatment/color/tone/saturation/clarity/cut/shape/origin/position/setting; gemstone shape/color/tone/level/saturation/optical-effect/origin/position/setting; pearl size/type/color/overtone/orient/shape/luster/surface/nacre/origin. Component edits affecting material or money create History/Audit. Legacy `stone_details`/`pearl_details` are classified and copied only when deterministic; empty arrays become no rows.

**O Historical purchase-cost layer.** `asset_purchase_cost_revisions` is append-only, not a mutable Asset column. Each revision stores currency, purchase gold-rate source/rate/value, making-per-gram/total, certificate cost, component cost, VAT enabled/rate/source/base/amount, total, supplier/date, PO/CGP source item, manual-override reason/actor and full provenance. Receipt creates revision 1. Corrections insert revision N with `supersedes_id`, close `is_current` in the same locked transaction, and create Audit/History; prior revisions never update economically. Existing cost snapshot columns are migration sources/read-only projections until consumers cut over.

**P Current-valuation layer.** `asset_current_valuations` is a one-to-one cache of the current server-calculated view: rate source (`GLOBAL`,`RETAIL`,`MANUAL_OVERRIDE`), rate, gold/making/certificate/component values, VAT rate/source/base/amount, total, `as_of`, input version and override provenance. Detail/quote services may compute live; list/report uses a versioned cache and rejects stale input versions where necessary. Automated refresh may replace cache values, but never purchase history. Manual override requires permission, reason and old/new Audit/History.

**Q VAT engine.** `InventoryVatService` receives profile, economic context (`PURCHASE`,`CURRENT_VALUATION`,`SALE`), typed inputs and a server-resolved rate. Rate is `decimal(9,6)`, source `SETTINGS_DEFAULT` or `MANUAL`, constrained `0..100`; amount is decimal-safe `base * rate / 100`, rounded only by the established monetary policy. Users may select/enter an authorized rate but never authoritative amount. Every economic snapshot persists enabled/rate/source/base/amount. Controllers do not contain profile formulas.

**R 24K Gold Bar VAT.** `GOLD_BAR_24K_VAT_BASE = CERTIFICATE_ONLY`. Purchase VAT base is purchase certificate cost; current VAT base is current certificate cost; sale base follows the certificate charge defined by the Bar strategy. Gold value is excluded. Rate remains manual with optional settings default and amount remains system-calculated; zero certificate cost produces zero base/amount without silently disabling the rule.

**S Pricing strategy architecture.** A registry selects `WEIGHT_BASED_MAKING_STRATEGY`, `BAR_CERTIFICATE_STRATEGY`, `PIECE_MARKUP_STRATEGY`, `DIAMOND_PROFILE_STRATEGY`, `GEMSTONE_PROFILE_STRATEGY`, `PEARL_PROFILE_STRATEGY` or `LOOSE_ASSET_STRATEGY`. Each strategy validates typed policy inputs, derives gold/component/making/certificate subtotal, VAT, net/total price, profit and threshold result, then returns a quote plus approval requirement. A sale stores the accepted quote snapshot. Below-minimum/manual overrides are server-authorized, reasoned and audited; the client never supplies authoritative totals.

**T Gold By Weight strategy.** Inputs: current/selling gold rate and source, net gold weight, selling making per gram, minimum making per gram, optional permitted discount and VAT context. Outputs: gold value, making value, net before VAT, VAT, total, cost basis and profit. Below-minimum making requires `inventory.price.approve_below_minimum`; sale-time revalidation prevents stale quotes.

**U 24K Bar strategy.** Inputs: bar gold weight/purity/rate, certificate charge per piece, minimum certificate charge and VAT rate/source. Outputs separate gold and certificate values; VAT base is certificate only. Below-minimum certificate charge needs manager approval. Document quantity may present multiple selected bars, but quote and sale link each Asset.

**V Gold By Piece strategy.** Inputs: current cost basis, markup percent, maximum discount percent, minimum selling price, permitted manual price and VAT context. Outputs net before VAT, VAT, total, discount, cost/profit/margin and threshold result. Excess discount or below-minimum price requires manager approval; one formula is not shared with Weight or Bar profiles.

**W Diamond/Gemstone/Pearl/Loose strategies.** Jewellery strategies use the profile's gold details plus normalized embedded-component values and configured making/markup rules. Loose strategies price the single primary-subject component and prohibit inventory quantity. Their exact optional profile inputs come from the registry/Excel field contract; unsupported calculations fail validation rather than fall back to another profile. All return the common quote envelope while retaining strategy-specific inputs and audit evidence.

**X State dimensions.** `STATE_MODEL = OPERATIONAL_STATUS_PLUS_CONDITION_PLUS_TAG_STATE_PLUS_LIFECYCLE_EVENTS`. Operational is exactly `AVAILABLE, RESERVED, PENDING_TRANSFER, WORKSHOP, RETURNED, MISSING, MELTED, SOLD`; condition is `NEW, USED`; tag is `PENDING, PRINTED`. `EXCHANGED` is a transaction/history fact. The state machine is sole writer. `MELTED` and `SOLD` are terminal for availability; missing/workshop/pending-transfer cannot sell. The legacy `status` enum is dual-written only where an exact mapping exists, then retired.

**Y State transition matrix.** All rows lock the Asset and require matching Company/Branch; every successful lifecycle change appends Asset History.

| From | Action | To / dimension | Preconditions and block conditions | Permission / approval | Side effects |
| --- | --- | --- | --- | --- | --- |
| none | receive/create | AVAILABLE or RETURNED; tag PENDING | one-piece facts, valid origin, Barcode/cost/profile; retry key unused | `inventory.create` | origin, cost rev1, receipt movement, print pending |
| any non-retired | tag print/reprint | tag PRINTED | printer result; reprint reason | `inventory.print`; reprint dedicated | print event; reprint Audit |
| AVAILABLE | reserve | RESERVED | active specific reservation; no competing lock | `reservations.create` | reservation item/event |
| RESERVED | extend | RESERVED | same active reservation | `reservations.extend_expiry` | expiry/history only |
| RESERVED | cancel/expire | AVAILABLE | reservation released; refund rules pass | cancel/expiry authority | reservation event |
| AVAILABLE or RESERVED | sell | SOLD | selected Asset, quote current; reservation must match | `sales.create`; threshold approval | invoice link, sale movement, financial posting unchanged |
| SOLD | return | RETURNED; condition USED unless inspected otherwise | source invoice/Asset link, return idempotency | `sales.returns.execute` | return doc/movement/history/financial reversal |
| SOLD | exchange-return leg | RETURNED | source invoice and replacement selection | `sales.exchanges.execute` | exchange event links both legs; normal sale for replacement |
| AVAILABLE | transfer request | PENDING_TRANSFER | normalized target branch/location; no competing workflow | inventory transfer authority | transfer item/history |
| PENDING_TRANSFER | dispatch | PENDING_TRANSFER | approved request, origin custody matches | transfer dispatch authority | `TRANSFER_OUT` movement |
| PENDING_TRANSFER | receive | AVAILABLE | destination receipt and item lock | transfer receive authority | branch/location update + `TRANSFER_IN` movement |
| AVAILABLE or RETURNED | send workshop | WORKSHOP | workshop order and custody destination | `inventory.workshop.manage` | workshop item/movement |
| WORKSHOP | workshop return | prior safe state or RETURNED | matching open workshop item, inspection facts | `inventory.workshop.manage` | return movement and close item |
| AVAILABLE/RESERVED/PENDING_TRANSFER/WORKSHOP/RETURNED | mark missing | MISSING | reason/case; active workflow reconciled or explicitly referenced | `inventory.missing.mark`; manager | missing case, movement/history/Audit |
| MISSING | resolve found | prior safe state or RETURNED | open case, found location and inspection | `inventory.missing.resolve`; manager | close case, location movement |
| AVAILABLE or RETURNED | melt | MELTED | normalized manufacturing/melt order, inputs locked, weights captured | `inventory.melt.execute`; manager | input movement, lineage; output is new Asset(s) |
| RETURNED | approve available | AVAILABLE | inspection and owner-configured approval policy | `inventory.return_to_available`; approval extension | state event; no automatic financial effect |
| any nonterminal | RFID assign/replace | state unchanged | unique tag; replace reason for current row | dedicated RFID permission | assignment + scan/history/Audit |
| any | stock-audit observation | unchanged | audit open; scan belongs to scope | `inventory.audit.manage` | audit item/history; never auto-adjust |
| allowed by approved request | apply adjustment | explicit old→new | approved adjustment, reason, optimistic version | request/approve/apply separation | movement/history/Audit; no quantity |

**Z Asset History.** Extend `asset_events` in place into the immutable lifecycle stream. Add Company/Branch, typed event, timestamptz occurrence, technical user, employee code/name snapshot, operator/device sessions, source type/ID, old/new context, reason/notes, correlation and idempotency key. Preserve legacy action/date/user/branch fields through backfill. Service and later DB guards prohibit update/delete after migration validation. Required creation, modification, reservation, transfer, workshop, sale, return, exchange, audit, adjustment, RFID, tag, melt and conversion events are registered and versioned.

**AA AuditLog.** Generic `audit_logs` remains the privileged/security/economic-change ledger and its hash-chain contract remains intact. Asset History answers “what happened to this piece”; AuditLog answers “who invoked or overrode a privileged operation.” Cost/valuation/VAT/price overrides, reprint, RFID replacement, missing/melt and adjustment approvals create both when lifecycle/material context is involved. Neither table substitutes for financial Journals.

**AB Attachments/Certificates.** Keep/extend existing tables. Add Company/Branch scope and attachment category; archive with actor/time instead of deleting evidence. Certificates keep stable identity and can link versioned attachments; certificate number/issuer indexes serve search. Certificate cost remains in purchase/valuation layers, not on mutable certificate metadata.

**AC Supplier purchase intake.** Extend the existing authoritative receive workflow. A PO line may retain document quantity, but the request supplies/collects one `perPiece` record for each independent item. Transaction locks the PO line, enforces remaining document count, creates one Asset bundle per piece, inserts `purchase_order_item_asset_links`, and posts the same economic purchase effect once at document level. Retry returns the original result; partial duplicate creation is impossible.

**AD Sales.** Add `invoice_item_asset_links`; serialized sale requires explicit Asset IDs, locks each row and validates sellable state. One invoice line may present document quantity N only when it links exactly N distinct Assets. Accepted strategy quote, VAT and cost basis are immutable invoice snapshots. Existing financial service/source identity remains unchanged; the Product adapter is feature-gated until cutover.

**AE Reservation.** Keep existing Asset-specific `reservation_items` and governance. New creation cannot accept quantity without exact Asset links. State and reservation row change atomically; extension affects reservation/history, not identity/cost. Cancellation/expiry returns only its own reserved Asset to `AVAILABLE`, subject to existing refund/financial contracts.

**AF Return.** Return is source-linked to original invoice-item/Asset link, replay-safe, and creates return document, reversal under the existing financial contract, return movement and `RETURNED` event in one transaction. It never manufactures Product quantity or automatically makes the piece sellable.

**AG Exchange.** Exchange is an immutable transaction relating returned and replacement Assets; it is not an operational state. The old Asset follows the Return transition and the replacement follows the normal Sale transition. The financial delta continues through current exchange accounting with exact source links and no client-selected account.

**AH Transfer.** Keep/extend `transfers`; add `transfer_items` with one Asset per row, origin/destination Branch/Location, status and dispatch/receipt facts. Accept legacy `assetIds` requests temporarily, normalize server-side and dual-write JSONB only during compatibility. Backfill and equality proof precede JSONB retirement.

**AI Workshop/Manufacturing.** Add `inventory_workshop_orders/items` for custody-only external/internal work. Extend existing manufacturing orders with normalized `manufacturing_order_inputs/outputs`; JSONB remains compatibility only. Processing consumes specific Asset identities; every output physical piece gets a new Asset/Barcode. `asset_lineage_links` preserves transformed-from/converted-from relationships without reusing an input identity.

**AJ Melted/Missing.** Melt uses the normalized manufacturing order as melt number/date and captures each input's pre-process weight/disposition; input becomes terminal `MELTED`, outputs are new Assets and process loss is explicit. Missing uses `asset_missing_cases` with open/resolved lifecycle, last custody, reason, discovery/resolution actors and outcome extension. No invented write-off/accounting behavior is encoded.

**AK Inventory Audit.** Extend `stock_audits/items` with audit number/date, Company/Branch/Location, method, DRAFT/IN_PROGRESS/COMPLETED/CLOSED states, expected/found Asset identity and close metadata. Barcode/RFID scans are observations. Completion reports matches/missing/unexpected/duplicate scans; it never mutates Asset state or posts an adjustment.

**AL Inventory Adjustment.** New `inventory_adjustments/items` implement request→approve→apply separation. Each item names one Asset and explicit old/new field context; reason, evidence, approvers and idempotency are mandatory. Apply locks the Asset, verifies its version, runs the state/location correction through domain services, writes movement/history/Audit and creates no stock quantity. Requester/approver separation is enforced for sensitive fields.

**AM All Items/Grid.** One Asset query endpoint replaces the Product/Asset split after cutover. It supports company/authorized branch, profile, operational status, condition, tag, Barcode/RFID, location, supplier, certificate, model and purchase-date filters with cursor/page semantics. `inventory_saved_views` stores user-owned UI column/filter/sort JSON only; it never stores authority or calculated inventory facts.

**AN Details/Status/History.** Asset detail composes core, typed profile, components, origin, current purchase revision, current valuation, pricing policy, RFID current/history, attachments/certificates, custody and immutable timeline. Status actions come from server-returned legal transitions and permissions, not client inference. Compatibility fields are clearly marked deprecated and cannot silently override typed facts.

**AO CGP architecture.** Keep CGP documents/items and existing gold-pool tables as source/material governance. Add `cgp_item_dispositions` linking each source item to `PENDING`, `CONVERTED_TO_ASSET`, `TRANSFER`, `TRANSIT`, `MELTED` or `MISSING`, with optional Asset or existing material-pool link and actor/time/source evidence. Default preserves a CGP line as a source lot until per-piece evidence exists; conversion creates only evidenced individual Assets and lineage, never clones aggregate weight or purchase accounting. Exact line-versus-piece semantics remain an extension point.

**AP Profile registry/rule engine.** A versioned registry entry defines profile code, required/optional fields, allowed component roles/kinds, weight strategy, VAT strategy, pricing strategy, allowed operations and validator. Database check constraints protect stable enums; changing calculation policy creates a new registry version, while purchase/sale snapshots retain the applied version. No controller fallback to a “generic” formula is permitted.

**AQ Company/Branch scope.** Every new operational row carries `company_id`; branch-sensitive rows carry `branch_id` or explicit from/to Branch. Services derive Company and permitted Branch from authenticated context and verify all joined entities share Company. Client-selected Company/account/branch authority is rejected. Transfer is the only normal branch ownership change; history preserves both sides.

**AR Permission/approval model.** Reuse `inventory.view/create/update/adjust/export/print`, sales, reservation and existing audit permissions. Add a new immutable permission-baseline version for `inventory.cost.override`, `inventory.valuation.override`, `inventory.vat.override`, `inventory.price.override`, `inventory.price.approve_below_minimum`, `inventory.return_to_available`, `inventory.melt.execute`, `inventory.missing.mark`, `inventory.missing.resolve`, `inventory.workshop.manage`, `inventory.barcode.reprint`, `inventory.rfid.assign`, `inventory.rfid.replace`, `inventory.audit.manage`, `inventory.adjustment.request`, `.approve`, `.apply`. Built-in grants are explicit; custom roles are never broadened automatically. Sensitive approvals require level-2 identity and AuditLog; self-approval is denied unless an authoritative rule later permits it.

**AS API compatibility.** `GET /assets`, `/assets/:id`, `/assets/:id/timeline` are `KEEP_AND_EXTEND` with additive/versioned response fields. Asset create is internal to authoritative receipt/conversion workflows. `/inventory/products` and `/products/:id/*` are `DEPRECATE` behind telemetry/feature gate, removed only after zero consumers/rows requiring Product stock. Supplier receiving, POS/sales, return/exchange and valuation are `VERSION_AND_EXTEND` for Asset links and profile quotes. Reservations are `KEEP_AND_EXTEND`; transfers accept `assetIds` then normalize; stock audits are `EXTEND`. Old responses remain stable during dual-read, with deprecation headers and explicit removal gate.

**AT Frontend transition.** Sequence: introduce an additive Asset query/repository and feature flags; build profile-aware receive/Add Item forms; move All Items/grid/detail/status/history/Barcode/RFID; migrate POS/reservation/transfer/return/exchange selectors to exact Assets; migrate valuation/reports and audits; show legacy Products read-only during reconciliation; then remove Product tabs and adapters after acceptance. Each slice deploys only with both old and new backend compatibility; no big-bang switch.

**AU Legacy Product-to-Asset migration.** Create `legacy_product_asset_map` and classify every Product: A known individual pieces from durable evidence → create mapped Assets; B operator per-piece identity/weight required → block pending capture; C proven disposable local test data with no business/financial links → recreate only in disposable rehearsal and later explicit local phase; D financial/business links → preserve Product and source mapping while creating only evidenced Assets; E unsafe/ambiguous → block. Never clone one average/aggregate weight into N Assets. Product rows, quantities and historical movements remain read-only until all linked documents, reports and APIs reconcile; only then deprecate, never silently delete.

**AV Document quantity boundary.** `INVENTORY_STOCK_QUANTITY = FORBIDDEN`; availability is a count/query of Asset state, not quantity arithmetic. `PurchaseOrderItem.quantity` and invoice presentation quantity may remain document facts, and component count may describe multiple embedded components inside one Asset. A serialized document line's quantity must equal its distinct Asset-link count; reservations/transfers/sales cannot submit quantity without Asset identities.

**AW Stock movement replacement.** New `inventory_asset_movements` is the authoritative physical custody ledger: one row per Asset movement, no quantity columns, typed from/to Branch/Location, source and linked AssetEvent. Receipt, transfer, sale, return, workshop, melt/conversion and applied adjustment create movement+event atomically. Existing `stock_movements` is immutable historical evidence and remains queryable until Product removal; it is never rewritten into fabricated per-piece movement.

**AX Inventory valuation.** Active inventory is individual Assets in `AVAILABLE`, `RESERVED`, `PENDING_TRANSFER`, `WORKSHOP`, and conditionally `RETURNED` as a separately disclosed bucket; `SOLD` and `MELTED` are excluded, `MISSING` is separately disclosed and not silently written off. Company/Branch/Location scope uses current custody. Current valuation reports use `asset_current_valuations`; historical reports use purchase revisions or document snapshots by report purpose. CGP material-pool value remains its own source bucket until conversion. No Product quantity valuation remains after cutover.

**AY Financial compatibility.** Inventory refactoring cannot change economic effects or account authority. Regressions must prove purchase Inventory/Input VAT/RCM/payable/Treasury, sale revenue/Output VAT/AR/COGS/Inventory credit, return/exchange reversals, reservation liabilities/advances, Branch mapping, Company context and Journal source identity. Every slice compares entry count, source keys, debit/credit amounts and mapped accounts before/after on a disposable clone. No transaction-time account creation, fallback mapping, duplicate posting or client-selected account is allowed.

**AZ Target table blueprint.** PostgreSQL types follow the current string-ID/`decimal(20,8)` convention. All mutable tables retain `created_at/updated_at`; immutable event/revision tables have `created_at` only or reject updates. FKs are `RESTRICT` for evidence and `CASCADE` only for child cleanup before any immutable/economic use.

| Classification / table | Key fields, constraints, indexes, immutability and backfill |
| --- | --- |
| `EXISTING_EXTEND assets` | PK `id varchar`; add core fields in H. Checks for profile/status/condition/tag; company+barcode unique across deleted rows; indexes `(company_id,branch_id,inventory_profile,operational_status)`, location, supplier/purchase-date, model. No physical delete once referenced. Backfill from Asset/type/status/source only when deterministic. |
| `NEW_TABLE inventory_locations` | `id varchar` PK; Company/Branch FKs; `code varchar(32)`, `name varchar(120)`, `location_type varchar(24)`, `is_active boolean default true`; unique `(company_id,branch_id,code)`; RESTRICT delete. Backfill distinct validated legacy locations. |
| `NEW_TABLE asset_origins` | PK `id`; unique Asset FK; Company/Branch; `origin_type varchar(32)`; nullable PO-item/CGP-item/legacy-Product/manufacturing-output FKs; `received_at timestamptz`, actor. Check exactly the source required by origin type; immutable. |
| `NEW_TABLE asset_gold_details` | Asset PK/FK; Company; `weight_unit varchar(8) default 'GRAM'`; all weights/purity `decimal(20,8)`; karat `decimal(9,6)`; nonnegative and formula-tolerance checks. One-to-one, audited correction; backfill only mapped legacy facts. |
| `NEW_TABLE asset_components` | `id varchar` PK; Asset/Company FKs; role/kind, `sequence int`, quantity `decimal(20,8)`, weight/carat `decimal(20,8)`, unit, name/type, cost/current-value `decimal(20,8)`, certificate FK, notes; unique `(asset_id,sequence)`; checks quantity>0 and allowed roles. Soft delete prohibited after economic use; correction audited. |
| `NEW_TABLE asset_diamond_component_details` | Component PK/FK; typed nullable treatment/color/tone/saturation/clarity/cut/shape/origin/position/setting. Check parent kind in service/constraint trigger. |
| `NEW_TABLE asset_gemstone_component_details` | Component PK/FK; typed nullable shape/color/tone/level/saturation/optical-effect/origin/position/setting. |
| `NEW_TABLE asset_pearl_component_details` | Component PK/FK; typed nullable size/type/color/overtone/orient/shape/luster/surface/nacre/origin. |
| `NEW_TABLE asset_purchase_cost_revisions` | `id varchar` PK; Asset/Company/Branch/currency; revision `int`; monetary/rate fields `decimal(20,8)`, VAT rate `decimal(9,6)`; supplier/date/source FKs; `supersedes_id`, `is_current`, reason/actor. Unique `(asset_id,revision_no)` and partial unique current. Append-only; legacy cost columns are source. |
| `NEW_TABLE asset_current_valuations` | Asset PK/FK; Company/Branch; source/rates/parts/VAT/total `decimal`; `as_of timestamptz`, policy/input versions, override reason/actor/version. Index company/branch/as-of; optimistic version; replaceable cache with Audit/History for manual override. |
| `NEW_TABLE asset_pricing_policies` | Asset PK/FK; Company; strategy code/version; weight-making/bar-certificate/markup/discount/minimum inputs `decimal`; `manual_price_allowed boolean`; checks by strategy; manual change audited. |
| `NEW_TABLE asset_rfid_assignments` | `id varchar` PK; Asset/Company/Branch FKs; RFID `varchar(128)`, status, `is_current`, assign/replace actor/time/reason. Unique `(company_id,rfid_number)` for permanent non-reuse; partial unique current Asset; indexed lookup. Historical rows immutable after closure. |
| `NEW_TABLE rfid_scan_events` | `id varchar` PK; assignment/Asset/Company/Branch FKs; `scanned_at timestamptz`, device/operator identities/snapshots, source/method/result. Append-only; indexes RFID assignment/time and Asset/time. |
| `NEW_TABLE asset_tag_print_events` | `id varchar` PK; Asset/Company/Branch; print kind, template/version, printer/device/operator, reason, `printed_at`, result, idempotency key; unique scoped idempotency; append-only. |
| `EXISTING_EXTEND asset_events` | Add typed event/context/provenance fields described in Z; unique `(company_id,idempotency_key)` when non-null; indexes Asset/occurred-at, source, correlation. Append-only after verified backfill; legacy columns preserved temporarily. |
| `EXISTING_EXTEND asset_attachments` / `asset_certificates` | Add Company/Branch, category/version/archive provenance and search indexes; retain Asset FK and evidence. Archive, do not hard delete used evidence. |
| `NEW_TABLE purchase_order_item_asset_links` | `id varchar` PK; PO-item/Asset/Company FKs, ordinal, received-at/by; unique Asset, unique `(po_item_id,ordinal)`; immutable source link. Backfill existing PO-item `asset_id`. |
| `NEW_TABLE invoice_item_asset_links` | `id varchar` PK; invoice-item/Asset/Company FKs, ordinal, quote/cost snapshot refs; unique sale link under active/non-reversed semantics and `(invoice_item_id,asset_id)`; immutable, reversal via document state. Backfill only IDs proven to be Assets. |
| `EXISTING_KEEP reservation_items` | Asset-specific authority retained; add missing company/idempotency/index fields only if rehearsal catalog proves absent. Unique active reservation per Asset enforced with state lock/constraint. |
| `EXISTING_EXTEND transfers` + `NEW_TABLE transfer_items` | Item PK; transfer/Asset/Company FKs; from/to Branch/Location, status, dispatch/receive actor/time; unique `(transfer_id,asset_id)` and partial one active transfer per Asset. Backfill JSONB then compare. |
| `NEW_TABLE inventory_workshop_orders/items` | Order identity/status/provider/Company/Branch/dates; item links one Asset, from/to location, prior state, send/return facts. Unique active workshop item per Asset; history retained. |
| `EXISTING_EXTEND manufacturing_orders` + `NEW_TABLE manufacturing_order_inputs/outputs` | Normalize input Asset and output Asset links, ordinal, pre/post weights `decimal(20,8)`, disposition/loss; each input/output linked once per order. JSONB compatibility until proof. |
| `NEW_TABLE asset_lineage_links` | PK; Company; parent/child Asset FKs; relation type, source order, occurred-at; unique `(parent_asset_id,child_asset_id,relation_type)`; append-only; parent != child. |
| `NEW_TABLE asset_missing_cases` | PK; Asset/Company/Branch; status, discovered/resolved times/actors, prior state/location, reason, resolution code/notes, audit source. Partial unique open case per Asset; no automatic financial effect. |
| `EXISTING_EXTEND stock_audits/stock_audit_items` | Add audit number/date/location/method/status/count summaries and found/expected Asset observations, scan provenance; unique audit number per Company and `(audit_id,asset_id)`. Closed audits immutable. |
| `NEW_TABLE inventory_adjustments/items` | Header Company/Branch/status/reason/request/approve/apply identities/idempotency; item Asset FK and old/new context. Unique scoped idempotency, one applied effect; immutable after apply. |
| `NEW_TABLE inventory_asset_movements` | PK; Asset/Company; movement type, from/to Branch/Location, source type/ID, event FK unique, occurred-at/operator. No quantity. Append-only; indexes Asset/time and custody/time. |
| `NEW_TABLE cgp_item_dispositions` | PK; CGP-item/Company/Branch; disposition, optional Asset FK or existing pool FK, source/actor/time; uniqueness preventing duplicate conversion; append-only corrections. |
| `NEW_TABLE legacy_product_asset_map` | PK; Product/Asset/Company FKs; ordinal, classification A–E, mapping status, evidence/reason; unique `(product_id,asset_id)` and Asset; permanent compatibility evidence. |
| `NEW_TABLE inventory_saved_views` | PK; Company, owner user/employee, name, `definition jsonb`, default flag; unique owner/name and partial one default; owner-editable/soft-deletable UI configuration only. |
| `LEGACY_DEPRECATE_LATER products/stock_movements` | Preserve rows and financial/document references read-only. Remove stock authority only after zero-consumer/data gates; do not rewrite history. |

**BA Relationship diagram.** The actual target cardinality is:

```text
Company --< Branch --< InventoryLocation
   |          |             |
   +--< Asset (existing canonical identity; one physical piece)
          |--1 AssetOrigin --0..1 POItem / CGPItem / LegacyProduct / ManufacturingOutput
          |--0..1 AssetGoldDetails
          |--< AssetComponent --0..1 DiamondDetails/GemstoneDetails/PearlDetails
          |--< PurchaseCostRevision (exactly one current)
          |--0..1 CurrentValuation
          |--0..1 PricingPolicy
          |--< RFIDAssignment --< RFIDScanEvent
          |--< TagPrintEvent
          |--< Attachment / Certificate
          |--< AssetEvent (immutable lifecycle)
          |--< InventoryAssetMovement (immutable custody)
          |--0..1 active ReservationItem / TransferItem / WorkshopItem / MissingCase
          |--< POItemAssetLink / InvoiceItemAssetLink / StockAuditItem / AdjustmentItem
          |--< ManufacturingInput/Output --< AssetLineageLink >-- Asset
          `--< CGPItemDisposition

Product --< LegacyProductAssetMap >-- Asset    (compatibility only)
StockMovement                              (historical read-only only)
```

**BB Domain service map.** `InventoryProfileRegistry` returns validators and strategy codes. `AssetIdentity/BarcodeService` owns permanent identity/sequence. `InventoryReceiptService` orchestrates source lock, Asset bundle and idempotent document posting. `WeightCalculationService`, `InventoryVatService` and `PricingStrategyService` are pure decimal-safe calculators. `PurchaseCostService` appends revisions; `CurrentValuationService` computes/caches current values. `AssetStateMachine` validates/locks/transitions and calls `AssetHistoryService`; `RFIDService`, `AssetTransferService`, `WorkshopManufacturingService`, `InventoryAuditService` and `InventoryAdjustmentService` own their normalized workflows. Each mutating service accepts authenticated Company/Branch/operator context and idempotency key, returns typed result/source IDs, runs one DB transaction, and never chooses financial accounts; existing posting services remain financial authority.

**BC Idempotency/concurrency.** Supplier receipt has scoped request uniqueness plus PO-line lock; Barcode uses locked sequence and unique indexes; RFID uses company/RFID and current-Asset uniqueness; sale/reservation/transfer/workshop use `SELECT ... FOR UPDATE`, state/version checks and partial active-link uniqueness; return/exchange use original-document effect uniqueness; melt has one terminal transition/input link; adjustment has request/effect uniqueness. Same key/same body returns original, same key/different body conflicts, and a different key cannot repeat a durable source effect.

**BD Index/performance design.** Required query-backed indexes are company+Barcode unique; company+RFID unique; `(company_id,branch_id,inventory_profile,operational_status,id)` for All Items; location/status; supplier/purchase-date; lower/search indexes for model/model-number/certificate where measured; AssetEvent and movement `(asset_id,occurred_at desc)`; source type/ID; active transfer/workshop/reservation partial indexes; audit `(company_id,branch_id,status,audit_date)`; saved-view owner/name. Trigram/full-text is added only after real smart-search plans justify it; rehearsal records `EXPLAIN` for the main list and lookup paths.

**BE Security/validation.** Company/Branch, operator and accounting context are server-derived. Every input uses schema validation, profile whitelist and decimal strings; authoritative totals/state are recomputed server-side. Manual fields require explicit permission, reason and Audit. Manager approval is a durable server record, not a client flag. FKs/checks/unique constraints fail closed; no implicit Company fallback, client-selected protected account, transaction-time account creation or generic mutation bypass is introduced.

**BF Migration sequence.** Follow the repository's timestamped transactional Sequelize convention; do not force all work into “migration 53.” Proposed future files, numbered only at implementation time to avoid collision: (1) `inventory-master-core-profile-foundation` adds nullable core/location/profile/cost/valuation/pricing structures; (2) `inventory-components-rfid-history-foundation`; (3) `inventory-source-document-asset-links`; (4) `inventory-movement-transfer-workshop-audit-normalization`; (5) `inventory-compatibility-backfill-support-indexes` adds only post-preflight constraints/indexes. Application dual-read/write slices follow. A later separate `inventory-legacy-product-cleanup` may run only after acceptance and is not part of the foundation rehearsal. Every `down` is rehearsed where safe; evidence tables use non-destructive rollback policy.

**BG Disposable rehearsal.** Take a timestamped `pg_dump` of `darfus_erp`; restore into an explicitly named disposable DB; record source SHA/checkpoint; run migrations and backfill there only; classify every Asset/Product/CGP row; verify FKs/orphans, core constraints, Barcode permanent uniqueness, RFID uniqueness, component/cardinality, event/source counts, PO/invoice/reservation links and Product mappings; compare financial Journals/source keys/Account/Treasury totals; run API and frontend smoke against disposable endpoints; exercise same-key/conflict/concurrency negatives; rehearse rollback/forward recovery; run final fingerprints; disconnect and drop only the verified disposable target. Persistent local apply remains separately unauthorized.

**BH Acceptance matrix.** Every row also requires one-piece receive/create; required/optional validation; immutable purchase/current valuation split; permanent Barcode; optional RFID lifecycle; state/history/Audit; list/search/detail; sell/return/transfer/audit; applicable reservation/workshop/missing/melt; server-derived totals; override permission/reason; and unchanged financial source/account effects.

| Profile | Profile-specific mandatory proof |
| --- | --- |
| `GOLD_BY_WEIGHT_JEWELLERY` | Gross/stone/net/pure decimal formulas; embedded components; selling-making-per-gram and below-minimum approval. |
| `GOLD_BAR_24K` | One bar per Asset; purity/weight; certificate charge/minimum; purchase/current/sale VAT base excludes gold and equals certificate only. |
| `GOLD_BY_PIECE` | One piece; markup, max discount, minimum price, net/VAT/total/profit and approval thresholds. |
| `DIAMOND_JEWELLERY` | Gold core plus ordered embedded diamonds and typed diamond details; diamond strategy without quantity stock. |
| `LOOSE_DIAMOND` | One Asset and exactly one primary-subject diamond; ten independent stones produce ten Assets. |
| `GEMSTONE_JEWELLERY` | Gold core plus typed ordered embedded gemstones and gemstone strategy. |
| `LOOSE_GEMSTONE` | One Asset/primary gemstone, explicit unit and no aggregate-to-piece weight cloning. |
| `PEARL_JEWELLERY` | Gold/shared core plus typed ordered embedded pearls and pearl strategy. |
| `LOOSE_PEARL` | One Asset/primary pearl and full typed pearl fields; no stock quantity. |
| `CGP_CUSTOMER_GOLD_PURCHASE` | Approved source document/item, disposition/pool-or-evidenced-Asset lineage, no duplicate accounting or automatic piece inference. |

Negative tests reject Asset stock quantity >1, quantity sale/reservation/transfer without distinct Asset links, duplicate Barcode/RFID, double sale/reserve/transfer/melt, client totals/accounts and unauthorized overrides. Financial before/after source/amount/account equality is mandatory.

**BI Requirement-open items.** (1) Returned→Available exact approval semantics is `STILL_OPEN`; foundation provides a disabled/dedicated transition with configurable approval and no automatic availability. (2) Exact component unit/precision is `STILL_OPEN`; foundation stores explicit unit plus `decimal(20,8)` without conversion, and registry rules can narrow later. (3) CGP line-versus-piece/material-pool identity is `STILL_OPEN`; disposition supports either source-lot/pool or evidenced Assets and forbids automatic cloning. These are reversible, nullable/configurable foundation choices and do not encode unresolved economics.

**BJ Static validation.** Read-only model/migration/API/frontend/permission inspection confirmed existing string IDs, `decimal(20,8)` schema precision, timestamped transactional migrations, Barcode sequence/index contract, immutable v1 permission baseline and the legacy dependencies. `git diff --check` and exact-path diff inspection are required before commit; no mutating Product test is authorized.

**BK Final DB/financial postcheck.** Design-owned DB writes are `0`. Required postcheck remains migrations `52/52/0`, Setup `READY`, Financial readiness `READY`; cash `13184.7730`, bank `-28.8650`, active precision mismatch `0`; one inherited session OPEN with opening `1.5000` and no close/adopt/edit. Inventory fingerprints remain Assets `50 / 05b87d94d28183c66dadab77b10b41fa`, AssetEvents `60 / 940a8d0164ac8d7541fc30ec22210c2e`, Products `3 / a41a93115d45fc8de2166e6fd9e36c99`, StockMovements `11 / 022b52105d167e88042fb0bb493a12dc`, PO items `53 / 2386602fc42aba2e96159a40975389fe`, Invoice items `12 / 23affc15d54600bfcbceb0122ac97ec8`, Reservations `2 / 19a50544009a9d06e3501384aabf0`, Reservation items `4 / 1a9a52d0c3689a9d06e3501384aabf78`, CGP docs `2 / a8591c4a236c6bf13256bc6ed6e7c225`, CGP items `4 / 384de4825d2f8b75dbc6731ce2c9e4ca`. Unbalanced Journals, orphan lines, duplicate source keys, unlinked posted Treasury, idle transactions, waiting locks and disposable DB residue are all `0`.

**BL Documentation.** This A–BP section is the implementation-ready design authority. The six companion authorized docs record finding, roadmap, acceptance, release, runbook and handoff summaries. No other path is authorized or changed.

**BM Documentation commit.** After final invariants pass, exact-path stage only the seven authorized docs and commit exactly `docs: design inventory master target architecture`. Do not push.

**BN Final Git safety.** Required after commit: branch `main`; staged/untracked `0/0`; stashes `11`; remotes `0`; next-env hash unchanged; inherited protected files semantically equal; Product/frontend/backend/test/migration/package/lockfile/environment changes `0`; DB/Inventory/financial/session writes `0`; push/deployment `0`.

**BO Final classification.** `OFFICIAL-LOCAL-INVENTORY-MASTER-TARGET-DESIGN-CONT1 = COMPLETE_WITH_REQUIREMENT_OPEN_ITEMS`; `TARGET_ARCHITECTURE = APPROVED_FOR_REHEARSAL`; `INVENTORY_TARGET_MODEL = PIECE_BASED_ASSET_ONLY`; `CANONICAL_ASSET_CORE = EXISTING_ASSETS_KEEP_AND_EXTEND`; `LEGACY_PRODUCT_STOCK_PATH = MIGRATE_THEN_DEPRECATE`; Inventory stock quantity `FORBIDDEN`; document quantity and one-Asset component metadata counts `PRESERVED`; strategies Weight/Bar/Piece are exactly `WEIGHT_BASED_MAKING_STRATEGY`, `BAR_CERTIFICATE_STRATEGY`, `PIECE_MARKUP_STRATEGY`; 24K VAT base `CERTIFICATE_ONLY`; VAT rate `MANUAL_WITH_OPTIONAL_SETTINGS_DEFAULT`; VAT amount `SYSTEM_CALCULATED`; purchase cost `IMMUTABLE_LAYER`; current valuation `SEPARATE_LAYER`; Barcode `PERMANENT_PRIMARY_IDENTITY`; RFID `OPTIONAL_HISTORY_RELATION`; Asset History `IMMUTABLE_APPEND_ONLY`; state model `OPERATIONAL_STATUS_PLUS_CONDITION_PLUS_TAG_STATE_PLUS_LIFECYCLE_EVENTS`. Blueprint, diagram, service map, legacy migration, API/frontend/financial/rehearsal/acceptance plans are `COMPLETE`. `RELEASE_READY=NO`; Staging/Production unauthorized.

**BP Exact next marker.** `OFFICIAL-LOCAL-INVENTORY-MASTER-MIGRATION-REHEARSAL-CONT1` (do not start automatically).

## OFFICIAL-LOCAL-INVENTORY-MASTER-MIGRATION-REHEARSAL-CONT1 — disposable checkpoint (2026-08-04)

| Required report field(s) | Evidence / result |
| --- | --- |
| A. Executive decision; B. Authorization boundary | Additive Inventory Master V2 foundation rehearsed only on `darfus_erp_inventory_rehearsal_20260804_073138z`; persistent migration/backfill/financial writes remain forbidden and observed zero. |
| C. Starting/final checkpoints; D. Git/protected preflight | Started `main@f309951b87a71ae714ec9896b1b45e6e4a526b2d`; code checkpoint `b0e5fa720eba4d02eaa2773e22654a9cb0b8cffa`. Staged `0`, stashes `11`, remotes `0`; three inherited CRLF-only files remained semantically equal. `next-env.d.ts` was owner-approved for the exact one-line repair and stayed at SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`. |
| E. Accepted target design; F. Mandatory design overrides; G. Requirement source verification | Piece-based Asset-only model retained. Location nullable, Branch required after safe backfill, Barcode global/immutable/non-reusable, Condition profile-controlled, and `component_count INTEGER` is non-stock metadata. Word/Word/Excel authority was rechecked without editing source artifacts. |
| H. Persistent baseline; I. Pre-rehearsal backup; J. Restore rehearsal; K. Disposable DB identity | Persistent `darfus_erp` stayed at 52 applied migrations, Assets 50, Products 3, Cash `13184.7730`, Bank `-28.8650`, one open session. Backup `backend/backups/darfus_erp_development_2026-08-04T07-31-38-212Z.dump`, 441680 bytes, SHA-256 `CC0491439A500C68F0340272B58B9C7F04EA85B5136A2E5232EAC7D2B9C5A8AE`, restored repeatedly only to the exact disposable target. |
| L. Migration sequence implemented; M. Assets extension; N. Location optional proof; O. Branch requirement proof | Five ordered migrations applied `52→57` from a fresh restore. All 50 Assets received deterministic profile/status/Branch; all 50 current locations mapped while `location_id` remains nullable. |
| P. Global Barcode proof; Q. Profile-controlled condition proof; R. Component-count integer/non-stock proof | Global duplicate groups `0`; cross-scope collision, Barcode update and hard-delete fixtures rejected. Existing 50 conditions remain NULL/unknown, not `NEW`; required/N-A profile negatives passed. Zero/fraction policy/loose-primary multi-piece negatives passed. |
| S. Weight engine; T. Purchase-cost revisions; U. Current valuation; V. VAT engine; W. 24K Certificate-only VAT; X. Pricing strategies | Decimal.js policy and decimal(20,8) schema passed `10.25-1.525=8.725` and pure 21K `7.634375`. Fifty immutable revision-1 rows were mapped; valuation is separate. Bar fixture `100000 + 1000`, rate 15%, produced VAT base `1000`, VAT `150`, gold VAT contribution `0`. Weight, Bar, Piece strategies passed and generic fallback rejected. |
| Y. RFID; Z. Asset History; AA. Tag print history | Global RFID reuse and multiple-current constraints passed. Asset identity/history/cost/origin/scan/print/movement evidence is append-only by trigger; existing 60 event IDs are preserved. |
| AB. Source-document Asset links; AC. Supplier receiving; AD. Sales; AE. Reservation; AF. Return; AG. Exchange | Backfill created 50 PO links and six proven invoice-Asset links; six Product-valued invoice rows remain explicitly `PRODUCT_LINK_LEGACY`. Legacy insert compatibility and one-piece source contract passed. Authenticated mutating endpoint smoke for receive/sale/reservation/return/exchange was not run and is not claimed PASS. |
| AH. Transfer; AI. Workshop/Manufacturing; AJ. Melted/Missing; AK. Inventory Audit; AL. Inventory Adjustment; AM. CGP | Additive normalized tables, FK/check/index/state separation and lineage foundations migrated successfully. CGP four source items remain material-pool/pending-evidence dispositions; no piece or weight was invented. End-to-end mutating workflow smoke remains not run. |
| AN. Legacy Product A-E classification; AO. Legacy Product mapping; AP. Asset movement ledger; AQ. All Items query | All three Products, including on-hand 100, are `D / PRESERVED_UNMAPPED`; zero Product-to-Asset mappings and zero Product deletions. Eleven evidenced Asset movements were backfilled. All Items counts Asset rows (50), never Product quantity. |
| AR. API compatibility; AS. Frontend smoke; AT. Permissions/approvals | Existing legacy Asset insert shape is accepted on the migrated schema and barcode foundation verifier passed. Isolated backend process launch was blocked by the execution environment; frontend smoke was deliberately not attempted because Next dev previously regenerated protected `next-env.d.ts`. Permission/approval schema guards exist, but authenticated endpoint smoke remains not run. |
| AU. Quantity negative tests; AV. Barcode negative tests; AW. Condition negative tests; AX. Component negative tests; AY. Constraint/index proof | Rehearsal verifier passed 24/24 focused gates, including stock-quantity rejection, global identity, condition registry, integer component policy, RFID uniqueness, immutable evidence, FK/orphan and constraint scans. |
| AZ. Backfill report; BA. Orphan/integrity scan | Profiles: 50 `GOLD_BY_WEIGHT_JEWELLERY`. Branch/location/status/gold/cost/origin/PO link `50/50/50/50/50/50/50`; condition known/unknown `0/50`; components/RFID `0/0`; invoice Asset/Product classification `6/6`; all listed orphan/duplicate/invalid counters `0`. |
| BB. Financial regression | Migration/backfill before/after invariant passed: Cash `13184.7730`, Bank `-28.8650`, mirror differences `0/0`, one unchanged open session, unbalanced posted Journals `0`, and no Journal/Treasury source mutation. Full authenticated purchase/sale/return/exchange transaction matrix remains not run and is not claimed. |
| BC. Forward/rollback rehearsal; BD. Disposable cleanup | Fresh restore→migrate→validate was repeated. `db:migrate:undo` failed as designed with `NON_DESTRUCTIVE_FORWARD_ONLY`; all 57 entries remained. Recovery is exact backup restore. Disposable cleanup is pending final evidence handoff. |
| BE. Persistent DB preservation; BF. Static validation | Persistent counts and row-by-row backup comparison passed; the five migrations are absent from `darfus_erp`. Typecheck, targeted ESLint, node syntax, barcode foundation and 24/24 verifier passed. Two older UI verifiers stopped only at stale phase scope guards that forbid any migration. |
| BG. Product/migration commit; BH. Documentation; BI. Documentation commit; BJ. Final Git safety | Focused code commit `b0e5fa720eba4d02eaa2773e22654a9cb0b8cffa`. Seven authorized docs record this checkpoint. Docs commit and final safety follow this update; no push. |
| BK. Final classification; BL. Exact next marker | `MIGRATION_FOUNDATION=PASS`, `BACKFILL_REHEARSAL=PASS`, `CONSTRAINT_SCAN=PASS`, `PERSISTENT_MUTATIONS=0`, but the official phase remains `IN_PROGRESS_WITH_AUTHENTICATED_WORKFLOW_SMOKE_NOT_RUN`. Resume the same marker `OFFICIAL-LOCAL-INVENTORY-MASTER-MIGRATION-REHEARSAL-CONT1`; do not start implementation. |

## OFFICIAL-LOCAL-INVENTORY-MASTER-MIGRATION-REHEARSAL-CONT1 — authenticated workflow blocker (2026-08-04)

An in-process authenticated HTTP harness was run only on fresh disposable `darfus_erp_inventory_rehearsal_20260804_120001z` after restore and migration `52→57`. It created an isolated legacy-admin User, issued a normal technical access session, supplied explicit Company/Branch headers, configured branch financial roles/mappings and barcode codes, and called `POST /purchase-orders/receive` with an idempotency key.

The real route passed its legacy transaction: first request `201`, same-key replay `201`, altered-body same-key `409`; two distinct Asset IDs and global Barcodes were created, two `PURCHASE_RECEIVED` events were created, profile/status were `DIAMOND_JEWELLERY`/`AVAILABLE`, and purchase Journal `JE-1785832507522` is source-linked and balanced `200/200`. However V2 target evidence was absent for both Assets: `asset_origins=0`, `purchase_order_item_asset_links=0`, and `inventory_asset_movements=0`.

Runtime source search finds these V2 structures only in migrations and the foundation verifier, not in application routes/services. The receive route also has no `perPiece` contract; it materializes repeated legacy quantity input. This is `BLOCKER=INVENTORY_REHEARSAL_PRODUCT_DEFECT`, not a harness or authentication failure. Wiring receive, sale, reservation, return and exchange to the V2 evidence model is cross-cutting implementation and is not started by this rehearsal. Preserve the disposable evidence; full mandatory workflow and transaction-financial closure cannot be claimed.
