# UX-12B Build Scope Forensics Recovery

`tsconfig.json` includes `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, and both `.next` type globs. Its `exclude` contains only `node_modules` and `jewellery-erp-master`; it does not exclude `backups`. `npx tsc --showConfig` reported 90 backup files in the effective program.

The failing file is an untracked/ignored evidence copy under `backups/ui-ux/UX11_PRINT_PREVIEW_20260828T223310Z/rollback/before-restored/source/lib/print/print-config.ts`. It imports `./print-types`, which is absent in that copied rollback tree. `git ls-files backups` returned no tracked backup files, `.gitignore` excludes `backups/`, and the product import sweep found no product source importing `backups/**`.

Primary classification: `PREEXISTING_ARCHIVE_ARTIFACT_INCLUDED_IN_COMPILATION`. Secondary: `BUILD_CONFIGURATION_SCOPE_DEFECT`. The failure is unrelated to the accepted DataToolbar `aria-label` line.
