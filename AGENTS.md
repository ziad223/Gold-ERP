# DARFUS ERP acceptance guardrails

- Never write to `darfus_erp` during rehearsal or acceptance work.
- Current acceptance database: `darfus_erp_inventory_rehearsal_20260804_160500z`.
- Before every mutation, run `SELECT current_database()` and require that exact acceptance DB.
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
