# Print Export Harness Audit

- `package.json`: `test:print-export = playwright test tests/export-print.spec.ts --project="Desktop Large"`.
- Test: `tests/export-print.spec.ts`; fixture: `/test/print-export`.
- The normal command was attempted and blocked before browser launch because Playwright expected missing bundled executable `chromium_headless_shell-1161`.
- Existing production build was served with `npm start -- -p 3002`; no Next dev server was used.
- An evidence-only runner under the UX11B evidence directory launched verified local Chrome and reproduced route, overflow, print-media, root/template, console/page-error, and mutating-request assertions.
- The runner received 404 after locale redirection; no supported existing fixture path rendered.

Result: `PRINT_EXPORT_HARNESS_AUDIT = COMPLETE`; `PRINT_EXPORT_FIXTURE_EXPOSED_BY_EXISTING_TEST_MECHANISM = NO_IN_THIS_RUNTIME`.
