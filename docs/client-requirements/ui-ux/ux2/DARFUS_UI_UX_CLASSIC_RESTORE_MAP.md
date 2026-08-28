# DARFUS UI/UX Classic Restore Map

Restore is file-scoped and manifest-based. Never use `git reset`, `git clean`, broad checkout or blind revert.

| Production path | Classic snapshot path | Before hash | Restore procedure | Risk |
|---|---|---|---|---|
| `app/globals.css` | `source/app/globals.css` (logical path; stored as `source/app/globals.css.ux2snapshot` to stay outside TypeScript compilation) | See manifest | Copy only this file from snapshot, then typecheck/build | Global visual regression if partial |
| `tailwind.config.ts` | `source/tailwind.config.ts.ux2snapshot` | See manifest | Restore exact file if changed | Token utility mismatch |
| `contexts/theme-context.tsx` | `source/contexts/theme-context.tsx.ux2snapshot` | See manifest | Restore exact file if changed | Theme class behavior |
| `app/[locale]/layout.tsx` | `source/app/[locale]/layout.tsx.ux2snapshot` | See manifest | Restore exact file if changed | Locale root behavior |
| `components/layout/*` | Matching `source/components/layout/*` | See manifest | Restore only explicitly changed path | Shell/navigation impact |
| Other inventoried files | Matching snapshot path | See manifest | Restore exact individual file only | Surface-specific visual impact |

Procedure: stop active visual acceptance, compare current SHA with the ledger, copy the selected `.ux2snapshot` file to its production path, recompute SHA-256, run focused checks, then record the result. The classic snapshot remains available and is never deleted by UX-2. All 44 TypeScript snapshot files use the same suffix; non-TypeScript files retain their logical file name.

`CLASSIC_RESTORE_MAP = PASS`
