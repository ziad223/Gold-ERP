# UX-3 Shell Restore Map

## Existing production files

Restore each file from the matching snapshot in `backups/ui-ux/PRE_UX3_SHELL_20260828_023226/source/` after renaming `.ux3snapshot` back to its logical source name. Verify the restored SHA-256 against `manifests/ux3-before-sha256.txt`.

## UX-3 additions

`components/layout/breadcrumbs.tsx` and `tests/ux3-shell-navigation.test.cjs` did not exist in the pre-UX3 source set. Rollback removes these two files in an isolated copy; it does not touch unrelated worktree files.

## UX-3 modified source set

- `app/globals.css`
- `components/layout/app-shell.tsx`
- `components/layout/header.tsx`
- `components/layout/sidebar.tsx`
- `components/ui/page-header.tsx`
- `components/layout/breadcrumbs.tsx` (new)
- `tests/ux3-shell-navigation.test.cjs` (new)

No backend, API route, database, migration, auth, permission catalog, or module implementation file is part of the restore map.
