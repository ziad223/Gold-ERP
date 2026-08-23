# FIRST-RUN-PRE1 — Super Admin bootstrap and first-installation contract

## FIRST-RUN-FIX-CONT1 resolved — PostgreSQL lock and PII logging acceptance — 2026-07-28

`FIRST-RUN-FIX-CONT1 = COMPLETE`; `FIRST-RUN-ACCEPT = COMPLETE`; `FIRST-RUN = COMPLETE`. The global PostgreSQL transaction advisory lock remains the only bootstrap concurrency boundary. State classification now performs plain aggregate reads; its optional row lock applies only to the durable singleton marker and bootstrap invokes classification without a row-lock request. This removes PostgreSQL's illegal aggregate `FOR UPDATE` while preserving advisory-lock serialization, rollback, idempotency and one-winner concurrency.

Development no longer prints Sequelize-rendered SQL. Query logging is disabled by default; an explicit safe-shape mode can emit only operation, table target and duration. Central Winston redaction strips PII/secrets from messages, metadata and stack output, and database failures now return a safe `500 INTERNAL_SERVER_ERROR` rather than a validation response. No raw SQL or SQLSTATE reaches the client.

Real PostgreSQL coverage passed on clean disposable databases migrated to all 51 source migrations: injected rollback left zero rows; concurrent bootstrap had one success and one deterministic rejection; replay/conflict behavior was deterministic; and the HTTP flow proved `SETUP_REQUIRED`, guarded negatives, `201 READY`, direct login, Company/Branch context smoke, logout, registration closure and post-READY rejection. Exact-value scans for generated email, password, setup token, idempotency key, access token and refresh token each returned zero in owned logs/evidence. All disposable databases and temporary evidence were removed. Official `darfus_erp` stayed at 50 applied / 1 pending source migration with unchanged aggregate fingerprint. Browser UI runtime remains deferred.

## FIRST-RUN-ACCEPT isolated PostgreSQL regression — 2026-07-28

`FIRST-RUN-ACCEPT = BLOCKED`; no Product change is authorized in this acceptance phase. A clean, disposable local PostgreSQL database received all 51 source migrations while the official `darfus_erp` database remained read-only at 50 applied / 1 pending source migration. `GET /api/v1/setup/status` correctly returned `SETUP_REQUIRED`; missing and invalid setup authorization failed closed (`403`), weak-password validation failed (`422`), and public registration remained `410`.

The valid guarded bootstrap is not executable on real PostgreSQL. `bootstrapFirstRun` calls `resolveSetupState(models, { transaction, lock: true })`; the resolver passes `FOR UPDATE` through `Company.count` and `User.count`. PostgreSQL rejects those aggregate statements with `SQLSTATE 0A000: FOR UPDATE is not allowed with aggregate functions`, which is surfaced by the API as `422 VALIDATION_FAILED`. The transaction rolls back; the disposable database remained at zero users, Companies, Branches, financial mappings, first-run audits, and setup markers before it was dropped.

Focused tests still pass because their fake transaction accepts the aggregate-lock shape; they do not exercise PostgreSQL's aggregate-lock restriction. A second security blocker was also observed: development Sequelize query logging wrote the generated acceptance email into the owned backend log during the attempted login query. The temporary evidence/log files were removed without entering Git. Therefore `SECRET_LEAKAGE_COUNT = NOT_ACCEPTED`, `FIRST-RUN-FIX-CONT1_AUTHORIZED = YES`, and the exact next marker is `FIRST-RUN-FIX-CONT1` for these two defects only. Browser and notification runtime gates remain deferred and unwaived.

Status: **IMPLEMENTED — PENDING FIRST-RUN-ACCEPT**
Date: 2026-07-28  
Scope: approved contract plus implementation record. The `FIRST-RUN-FIX` code, tests and forward-only migration are now present; no official local DB migration/data change, credential persistence, deployment, or remote action occurred.

## FIRST-RUN-FIX implementation record — 2026-07-28

`FIRST-RUN-FIX = COMPLETE` at code and focused-test level. The implementation adds `first_run_setup_states` (a secret-free singleton marker migration, deliberately **not applied** to the official local database), `GET /api/v1/setup/status`, and guarded `POST /api/v1/setup/bootstrap`. The status response exposes only authoritative state/action; it never exposes counts, user existence, tokens, passwords, IDs, or financial payloads.

Bootstrap uses `FIRST_RUN_SETUP_TOKEN` only from process environment, compares it in constant time, accepts it only in `SETUP_REQUIRED`, requires `Idempotency-Key`, and is rate-limited. A PostgreSQL transaction-scoped advisory lock plus the durable GLOBAL marker serialize cross-process requests. The same key/payload safely replays the secret-free READY response; a reused key with different input conflicts; any later different request receives `FIRST_RUN_ALREADY_COMPLETE`.

Within one transaction the service creates exactly one Company, canonical `admin` role/128-permission baseline, an active direct `accountType=super_admin` User with the existing password-policy/bcrypt path, its canonical `UserRole`, one active Branch, six required branch-scoped System Account Roles (AR, sales, VAT, inventory, COGS, customer-deposit liability), and cash/deposit BranchFinancialMappings. It verifies these rows, records a secret-free audit event, then marks READY. Current architecture represents Company access through `User.companyId`; Super Admin Branch authority is server-derived rather than a separate user-branch table. No legacy intermediary, Company selector, Company fallback, automatic login, or public registration was added.

The UI is `/{locale}/setup`: it reads server state, retains the setup token/password only in component memory, sends the token only in a request header, clears fields after a successful submit, and hands off to normal login. Login routes a genuine `SETUP_REQUIRED` installation to this route and no longer pre-fills or displays default credentials. `POST /auth/register` remains 410 and `/signup` remains a login redirect.

Focused tests cover empty/recovery/conflict classification, missing/invalid authorization, direct account creation, canonical password hashing, exact Company/Branch/financial rows, idempotent replay/conflict, transaction rollback, setup routing, ephemeral UI secret handling, and registration closure. Focused regression: 21/21 pass; `typecheck`, targeted lint, production build, `git diff --check`, and the required `next-env.d.ts` hash pass. The official DB remains at 50 applied migrations; this repository now has one intentionally un-applied forward migration for the isolated `FIRST-RUN-ACCEPT` topology. That phase must apply/test it and execute clean bootstrap/recovery/concurrency acceptance. Deferred browser N5/N8 and `NOTIF-ACCEPT` remain untouched.

## Executive design decision

Fresh installation has no supported Product path that creates the first privileged operator. `POST /auth/register` is intentionally hard-disabled with `410`; normal server startup skips bootstrap unless a non-production opt-in is supplied; and System Accounts requires an already authenticated Super Admin. Directly changing a legacy user in the database is therefore an unsupported workaround.

`FIRST-RUN-F001` through `FIRST-RUN-F004` require a single guarded first-run implementation. Public registration remains disabled. The future flow must create the first active Super Admin directly through canonical password, role, permission, Company-access, and Branch-access services, together with one Company, one Branch, and required financial mappings in one atomic transaction.

## Current source evidence

| Layer | Current path | Current behavior | Fresh-install usability |
|---|---|---|---|
| Login | `POST /auth/login`; `app/[locale]/login` | Authenticates an existing active user; requires an existing Company row. | No first-user path. |
| Public registration | `POST /auth/register` | Explicit `410`; old controller implementation is unreachable. | Disabled by design. |
| Password recovery | `POST /auth/forgot-password`, `/auth/reset-password`; public pages | Token-based reset for an existing user; local delivery only outside production. | Cannot create/recover a missing first Super Admin. |
| System Accounts | `/system-accounts/*`; Settings users UI | Requires authenticated Super Admin and Company context. | Bootstrap circularity: unavailable with zero Super Admin. |
| Accessible Company bootstrap | `GET /auth/accessible-companies` | Authenticated, context-free list; client auto-adopts exactly one. | Cannot be reached before first login. |
| Runtime legacy bootstrap | `backend/src/bootstrap/ensureAdmin.js` | Disabled on ordinary startup; non-production opt-in only; legacy/demo-oriented and non-transactional. | Not an approved production or one-time setup contract. |

The User model requires `companyId`, has `accountType` (`legacy`, `super_admin`, `branch_shell`), and has active/lock/password-version fields. Canonical password policy is `backend/src/utils/password-policy.js`. Canonical role/permission setup is `backend/src/bootstrap/accessControl.js`; existing system-account actions are in `backend/src/services/system-account.service.js`. `legacy` is an account-type compatibility state, not a secure privilege-creation workflow. Existing users are intentionally not auto-converted.

The read-only local metadata snapshot has one active Super Admin, one Company, five Branches, five roles, 128 permissions, and no `system_account_roles` or `branch_financial_mappings`. This demonstrates that current local operational data is not a fresh-install guarantee; it must not be generalized into a bootstrap seed or mutated by this phase.

## Findings

| ID | Severity | Finding and evidence | Target |
|---|---|---|---|
| `FIRST-RUN-F001` | P1 | A migration-only fresh installation has no supported route to create its first active Super Admin. Public registration is disabled and System Accounts needs an existing Super Admin. | `FIRST-RUN-FIX` |
| `FIRST-RUN-F002` | P1 | Manually promoting a `legacy` user bypasses canonical account creation, audit, role/access and account-status invariants. | `FIRST-RUN-FIX` |
| `FIRST-RUN-F003` | P2 | Password reset is for an existing account and production delivery remains unavailable; it is not a first-operator or no-admin recovery path. | `FIRST-RUN-FIX` recovery handoff |
| `FIRST-RUN-F004` | P1 | Company, Branch and financial-role readiness are not one atomic first-install operation. Existing branch-account bootstrap is an authenticated, later operational route. | `FIRST-RUN-FIX` |

## Authoritative server state machine

The backend, not frontend storage or route visibility, classifies setup state from locked current database facts and a durable setup marker:

| State | Exact classification |
|---|---|
| `UNINITIALIZED` | Schema/baseline prerequisites are unavailable; no setup attempt may proceed. |
| `SETUP_REQUIRED` | Zero active `super_admin` users and zero Companies, with no conflicting marker. |
| `SETUP_IN_PROGRESS` | A durable, locked setup attempt exists and has not committed or timed out under explicit recovery rules. |
| `READY` | At least one active authenticable Super Admin, exactly one Company, at least one active Branch, canonical role/access relations, and mandatory financial mappings all validate. |
| `RECOVERY_REQUIRED` | Partial or unsafe state, e.g. Company with no active Super Admin, missing Branch/mapping, or interrupted marker. Bootstrap must not guess or overwrite it. |
| `CONFIGURATION_CONFLICT` | More than one Company, duplicate/contradictory markers, or incompatible role/permission baseline. |

Only `SETUP_REQUIRED` can enter normal first-run bootstrap. `RECOVERY_REQUIRED` and `CONFIGURATION_CONFLICT` fail closed and hand off to separately guarded recovery.

## Bootstrap authorization and public policy

`PUBLIC_REGISTRATION = DISABLED` permanently. Use one unauthenticated but non-sensitive status endpoint plus one guarded bootstrap endpoint protected by a deployment-provided, single-use setup secret:

- Provision a high-entropy `FIRST_RUN_SETUP_TOKEN` through the deployment secret channel; never provide a default.
- Store only a keyed hash/fingerprint or token-version/consumption record; compare in constant time; never log the token or body.
- Accept it only while state is `SETUP_REQUIRED`, rate-limit, CSRF-protect browser use, use generic failures, and invalidate atomically on success.
- Local may use an explicitly supplied process-scoped token and loopback-only setup origin; Staging/Production require deployment-secret injection and HTTPS. Production fails closed when missing.
- A token does not authorize recovery once data exists. No persistent public sign-up endpoint, default administrator credential, or first-Company fallback is allowed.

## Minimum API and UI contract

| Endpoint | Contract |
|---|---|
| `GET /setup/status` | Context-free, non-sensitive classification only: state, whether setup is allowed, opaque next action. No IDs/counts/internal details. |
| `POST /setup/bootstrap` | Accepts setup token, idempotency key, Super Admin profile/password, Company, Branch, and approved finance-default selection. Valid only in `SETUP_REQUIRED`; no Company header or authenticated user. |

Stable errors: `FIRST_RUN_SETUP_REQUIRED`, `FIRST_RUN_ALREADY_COMPLETE`, `FIRST_RUN_TOKEN_REQUIRED`, `FIRST_RUN_TOKEN_INVALID`, `FIRST_RUN_TOKEN_EXPIRED`, `FIRST_RUN_IN_PROGRESS`, `FIRST_RUN_CONFIGURATION_CONFLICT`, `FIRST_RUN_RECOVERY_REQUIRED`, and `FIRST_RUN_VALIDATION_FAILED`. Responses must avoid account/database enumeration.

The UI is a short protected wizard: setup authorization; Super Admin account/password confirmation; Company; first Branch; financial defaults; review; one atomic submit; readiness result; normal-login handoff. It needs keyboard/focus management, Arabic/English-ready message keys, disabled duplicate submit, accessible loading/error states, and no secret persistence. Company is fixed/display-only after setup; Branch is the operational selector.

## Atomic operation and financial readiness

Inside one serializable or appropriately locked transaction, with a durable marker/unique singleton guard:

1. Lock and reclassify first-run state.
2. Verify token, idempotency key, password/email policy, role/permission baseline and unique email/workspace/branch-code constraints.
3. Create one Company, ensure canonical roles/permissions, and create an active direct `super_admin` user with canonical password hashing/access. Never create a legacy intermediary.
4. Create one active Branch and required Branch access/default operational association.
5. Create approved account templates and explicit branch-scoped mappings; validate with the operational readiness service.
6. Audit without secrets, consume/disable bootstrap authorization, set marker `READY`, and commit.

Rollback on every failure must leave no orphan user, Company, Branch, account or mapping. Concurrent requests serialize on the marker/database constraint; exactly one can commit. Same idempotency key gives deterministic replay; a new request after success gets `FIRST_RUN_ALREADY_COMPLETE`.

The defined branch financial roles include accounts receivable, sales revenue, VAT payable, inventory asset, cost of goods sold, and customer-deposit liability. `FIRST-RUN-FIX` must inventory all launch-required accounting services and explicitly classify cash/bank, fiscal/currency and mapping policy. It must never map an arbitrary first account. Missing or ambiguous required mappings are `RECOVERY_REQUIRED`.

## Recovery, tests, and release gates

Company-without-admin, disabled/locked sole admin, missing Branch/mapping, interrupted marker and multi-Company data are not normal First Run. They require a separately authorized local/deployment recovery command or recovery API using canonical password/role/account services, strict environment/database identity guards, audit and explicit confirmation. Never use direct SQL, public reset, automatic legacy promotion or open registration.

Mandatory tests: all state classifications; missing/invalid/expired/consumed token; direct canonical Super Admin creation; no legacy intermediate state; one Company/Branch only; financial readiness; rollback at every step; single-winner concurrency; idempotent retry; rejection after `READY`; recovery/conflict behavior; disabled public registration; audit redaction; Local/Staging/Production fail-closed policy; login/refresh/logout; and Company-context/notification gating until readiness. Runtime acceptance covers a clean wizard, first login, Company/Branch readiness, refresh/logout, repeat-bootstrap rejection and no secret in logs/storage.

Roadmap: `FIRST-RUN-PRE1 → FIRST-RUN-FIX → FIRST-RUN-ACCEPT → ERROR-CONTRACT → RELEASE-GAP-AUDIT → HARNESS-LOG-STREAM-FIX → N5/N8 RUNTIME ACCEPTANCE → NOTIF-ACCEPT → FULL-REGRESSION → STAGING/RC → PRODUCTION`.

`CURRENT_BROWSER_RUNTIME_ACCEPTANCE = DEFERRED`; `RELEASE_GATE_WAIVED = NO`; `PRODUCT_WORK_MAY_CONTINUE = YES`; `STAGING_AUTHORIZED = NO`; `PRODUCTION_AUTHORIZED = NO`.

Exact next marker: **`FIRST-RUN-FIX`**. Implement only this guarded bootstrap and its tests; do not reopen deferred browser runtime acceptance in that phase.
