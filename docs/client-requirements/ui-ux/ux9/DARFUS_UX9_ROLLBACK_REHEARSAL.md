# UX-9 Rollback Rehearsal

`ROLLBACK_REHEARSAL = PASS_NON_MUTATING`

The rehearsal verified the UX9-owned restore boundary: only the four Accounting/Treasury page hooks, `JournalPreview` presentation hook, the UX9 CSS module, and the focused UX9 test are in scope. The pre-edit hash manifest remains available at `backups/ui-ux/PRE_UX9_ACCOUNTING_TREASURY_20260828T211831+0300/`; the after copies are under `backups/ui-ux/UX9_ACCOUNTING_TREASURY_20260828T183500Z/source/`. A restore was not applied to the working tree. No destructive Git command, reset, restore, stash, or cleanup was run.

This is intentionally a rehearsal/readiness proof, preserving the user's pre-existing dirty worktree and generated Next files.
