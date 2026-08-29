# UX-12B Build Final Result Recovery

The dedicated build compiled successfully in 44 seconds, then failed TypeScript with `BUILD_EXIT_CODE = 1`. Exact first failure: `backups/ui-ux/UX11_PRINT_PREVIEW_20260828T223310Z/rollback/before-restored/source/lib/print/print-config.ts:1:71`, missing `./print-types`. The build worker explicitly reported code 1. This is a pre-existing ignored archive artifact, not product source. No fix was applied.
