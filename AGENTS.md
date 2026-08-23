# DARFUS ERP acceptance guardrails

- Official persistent database: `darfus_erp` (`CURRENT_POST_RESET_OFFICIAL_BASELINE`).
- Ordinary rehearsal/acceptance work must not write to the official database. Any
  mutating rehearsal must use a disposable clone or an explicitly
  Owner-approved rehearsal target.
- Direct persistent mutation of `darfus_erp` requires explicit Owner approval,
  exact target verification, baseline verification, and an active-business-write
  check immediately before apply.
- **PERSISTENT PRODUCTION PROMOTION EXCEPTION**
  - The default rule above remains binding for rehearsal, acceptance, ordinary verification, fixtures, destructive testing, and normal Codex work.
  - A Persistent write is allowed only for a named, explicit Owner-authorized promotion batch whose exact database, start/end baselines, and migration sequence are stated, and only after a fresh verified backup, restorable disposable rehearsal, exact-sequence rehearsal, business-integrity/data-preservation pass, and an active-business-write check immediately before apply.
  - Historical authorization `AUTHORIZE_PROD_PROMOTION_01_PERSISTENT_WRITE_EXCEPTION` was solely for the now-closed `PROD-PROMOTION-01`: target `darfus_erp`; `61 -> 77`; `EXACT_TESTED_62_TO_77_SEQUENCE_ONLY`. It permitted only approved migration schema metadata and migration-defined system configuration (tables/columns/indexes/constraints/SequelizeMeta, permission definitions, semantic account-role definitions, integration outbox/inbox schema, deterministic backfills, and canonical mappings).
  - It never permits fixtures, fake business transactions, acceptance-data copy/restore, database replacement, truncate/broad cleanup, manual SQL business writes, automatic restore, server work, deployment, or migrations outside that exact sequence. It is not a global Persistent-write authorization.
  - `PROD-PROMOTION-01` ended and this exception is expired. Every later Persistent write, smoke verification, repair, restore, or migration requires a new explicit Owner authorization.
- Historical acceptance database: `darfus_erp_inventory_rehearsal_20260804_160500z`.
  It is retained as historical evidence and is not required by the current
  Owner-approved database authority.
- Before any mutating rehearsal, resolve `SELECT current_database()` and require
  the exact disposable/approved rehearsal target. Never use this rule to permit
  an unapproved write to `darfus_erp`.
- `ONE_PHYSICAL_PIECE = ONE_ASSET` and `NO_QUANTITY_BASED_INVENTORY = YES`.
- `ONE_CANONICAL_WORKFLOW_PER_BUSINESS_ACTION = YES`.
- V2 is an internal architectural name, not a second business system; legacy routes may only be compatibility adapters.
- Do not run Next dev during acceptance. Protect `next-env.d.ts` and stop on unexpected drift.
- KNOWN_NEXT_ENV_DRIFT_AUTO_REPAIR_ALLOWED = YES only for SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`, the exact routes import change from `./.next/dev/types/routes.d.ts` to `./.next/types/routes.d.ts`, and final SHA `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`; otherwise stop for Owner decision.
- Do not use destructive Git commands (`reset`, `restore`, file checkout, clean, stash, `git add .`, or `git add -A`).
- Do not create accounts at transaction time and do not allow hardcoded or fallback financial authority in runtime.
- For ordinary defects: `FIX -> RERUN -> VERIFY -> CONTINUE`.
- Owner reports start in simple Arabic: what was done, what passed, what failed, risk to the persistent DB, and next step.
- After closing current acceptance tests, return priority to the three client-requirements files.
