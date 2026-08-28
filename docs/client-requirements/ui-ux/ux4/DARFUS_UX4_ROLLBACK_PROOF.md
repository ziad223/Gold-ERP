# DARFUS UX4 — Rollback Proof

The exact before snapshot is `backups/ui-ux/PRE_UX4_CORE_COMPONENTS_20260828_030413/`. The after snapshot is `backups/ui-ux/UX4_CORE_COMPONENTS_20260828_031122/`. Every changed source file has a copied snapshot with a non-compiling `.ux4snapshot` suffix. `DARFUS_UX4_CORE_COMPONENT_RESTORE_MAP.md` maps each changed file to its source snapshot.

Rollback rehearsal was performed as a non-destructive hash exercise: each after hash was resolved against its corresponding after snapshot, and each before hash was resolved against its before snapshot. No active production worktree rollback was performed. UX2 classic/semantic rollback artifacts and UX3 shell rollback artifacts remain present.

`UX4_ROLLBACK_REHEARSAL = PASS`.
`UX4_RESTORED_HASH_PARITY = PASS` (manifest-to-snapshot parity; active worktree was not rolled back).
`UX2_ROLLBACK_STILL_AVAILABLE = YES`.
`UX3_ROLLBACK_STILL_AVAILABLE = YES`.
