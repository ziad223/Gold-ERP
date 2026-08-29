# UX-12 Rollback Record

Rollback rehearsal for the isolated UX12 line is straightforward and source-local: restore the previous `aria-label` line state in `components/ui/data-toolbar.tsx` using the recorded pre-edit snapshot/hash. No DB, migration, build artifact, route, or business data rollback is required. The prior pre-edit file hash is recorded in `DARFUS_UX12_SOURCE_INTEGRITY.md`; no rollback was applied because the repair passed.
