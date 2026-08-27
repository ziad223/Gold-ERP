# Gift Voucher Official Promotion — Migration Apply

| Field | Actual |
|---|---|
| Target | `darfus_erp` |
| Wrapper | `node scripts/migrate-safe.js` inside the backend container |
| Target mode | `official` |
| Approval | Process-scoped `DARFUS_OFFICIAL_MIGRATION_APPROVED=YES` for this invocation only |
| Migration | `20260827010000-gift-voucher-purchased-foundation.js` |
| Pre-meta | `92` |
| Pending count | `1` |
| Apply result | `SAFE_MIGRATION_EXECUTED_COUNT=1` |
| Post-meta | `93` |
| Official migration executed | YES |
| Business commands | None |

The exact command completed successfully and was not retried. No migration source,
backend source, frontend source, tests, configuration, seed, or backfill was changed.
