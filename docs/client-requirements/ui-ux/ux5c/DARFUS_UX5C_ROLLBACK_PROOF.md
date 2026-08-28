# DARFUS ERP — UX5C Rollback Proof

Rollback was rehearsed on an isolated copy only.

| Check | SHA-256 | Result |
|---|---|---|
| Pre-UX5C source | `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A` | baseline |
| Restored-before rehearsal copy | `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A` | PASS |
| UX5C source | `3B787189C7F75007F0C32B2114456783036D292C8DC66107034BFB3BC1814EC7` | after |
| Reapplied-after rehearsal copy | `3B787189C7F75007F0C32B2114456783036D292C8DC66107034BFB3BC1814EC7` | PASS |

Rehearsal location: `backups/ui-ux/UX5C_OWNER_VISUAL_20260828_090140Z/rollback-rehearsal/`.

`UX5C_ROLLBACK_REHEARSAL = PASS`
`UX5C_RESTORED_HASH_PARITY = PASS`

The live dirty worktree was not reset, cleaned, stashed, or globally restored.
