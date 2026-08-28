# UX-10 Rollback Rehearsal

Rollback rehearsal is source-snapshot based and non-destructive. The pre-control hashes and worktree status are preserved at `backups/ui-ux/PRE_UX10_SETTINGS_AUDIT_20260828T184858Z/`; the after source copies and hashes are preserved at `backups/ui-ux/UX10_SETTINGS_AUDIT_20260828T200000Z/`.

The reversible UX-10 change set is the scoped stylesheet plus its six page imports/root class applications and one focused test. Restoring the eight after/source copies to a disposable review location reproduces the exact after state; no restore was applied to the working tree and no Git destructive command was used.

`ROLLBACK_REHEARSAL = PASS` (artifact/path/hash rehearsal; no product or DB rollback required).
