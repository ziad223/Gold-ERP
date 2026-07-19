# AUTH-1 - Auth Security Containment

## Closure

AUTH-1 is locally verified. No Production deployment, configuration, or data
change was performed.

- Starting commit: `a3a033b2e947135dc278b54df2dd0dcbe6e4ce24`
- Core containment commit: `6177dbb4256c7c5239a6f2b59d669f4c5dbfd9cf`
- Realtime security commit: `cafbb4a53614fd8e166b28df01e5ebdbdfda6632`
- Regression correction commit: `4c5063b705608a950adceae99802fa97afd8cc6a`
- Final closure commit: recorded after this document is committed.

## Implemented Containment

- Added an explicit auth-readiness boundary so protected queries wait for
  technical authentication to settle.
- Added terminal technical-401 coordination: protected queries are cancelled,
  state is cleared once, and navigation performs one login transition without a
  document reload loop.
- Retried only safe read requests after a successful refresh. POST, PUT, PATCH,
  and DELETE are never automatically replayed and return a controlled explicit
  retry-required error after refresh.
- Logout now revokes the persisted technical session before local auth state is
  cleared. Employee operator recovery preserves the Branch Account technical
  session.
- Replaced token-in-URL SSE with fetch streaming using an Authorization header.
  Query-token authentication is rejected. SSE now rechecks the full persisted
  technical session during heartbeats and closes on revocation, inactive account,
  session version, or password version invalidation.
- Added abortable single-stream lifecycle handling with bounded reconnects and
  redaction of sensitive URL query values in application request logs.

## Proven Corrections

The local Next concern was first-route compilation timing only; there was no
AUTH-1 runtime defect. During real terminal-401 regression QA, a separate P1 was
proven: QueryCache displayed a per-query error before checking whether the error
was terminal. The correction moved that check ahead of toast handling. The
follow-up browser case observed 15 concurrent terminal 401 responses, zero
per-query toast elements, one auth clear, and one login transition.

## Local QA Evidence

`AUTH1_CORE_BROWSER_QA_PASSED` and `AUTH1_SSE_BROWSER_QA_PASSED` were recorded
against local services only. Coverage included unauthenticated loading, invalid
login, Super Admin reload/logout, Branch Account inline Employee verification,
Employee stale recovery, terminal 401 coordination, 403 and network boundaries,
safe GET refresh replay, unsafe mutation non-replay, Bearer SSE, query-token SSE
rejection, stream closure after session revocation, and log-redaction behavior.

The focused verifier emitted `AUTH SECURITY CONTAINMENT PASSED`. Targeted
regressions passed, and the clean committed verifier suite passed `63/63`.
`npm run typecheck` and `npm run build` passed. `npm run lint` passed with 18
pre-existing warnings and no errors. `git diff --check` passed.

## Local Data Safety

- Local database only: `localhost:5433 / darfus_erp`.
- Start backup validated with `pg_restore -l`:
  `backend/backups/darfus_erp_auth1_start_20260718_232028.dump` (497449 bytes).
- Final backup validated with `pg_restore -l`:
  `backend/backups/darfus_erp_auth1_final_20260719_205017.dump` (497611 bytes).
- `AUTH1-BQA-*` fixtures and associated technical/operator sessions were cleaned
  to zero. No plaintext credentials, tokens, or temporary QA scripts remain.
- Migrations remain 44; permissions remain 128; verifier files total 63.

## Deferred

`AUTH-DEPLOY1 - Controlled Production Auth Security Deployment & Validation` is
the next phase and requires owner approval. `NOTIF-PRE1`, `UX-PRE1`, and Phase
35E remain paused. Production was not contacted or changed.
