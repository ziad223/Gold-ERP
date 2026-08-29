# UX-12B Build Final Result

Next.js 16.2.9 compiled successfully, then TypeScript failed with exit code 1 at the pre-existing rollback artifact `backups/ui-ux/UX11_PRINT_PREVIEW_20260828T223310Z/rollback/before-restored/source/lib/print/print-config.ts` because `./print-types` was missing. No product source caused this error. `BUILD = FAIL_PREEXISTING_WORKTREE_ARTIFACT`; no cleanup or source workaround was applied. The direct outer shell exit was not separately returned by the Windows tool, but the Next build worker reported code 1 explicitly.
