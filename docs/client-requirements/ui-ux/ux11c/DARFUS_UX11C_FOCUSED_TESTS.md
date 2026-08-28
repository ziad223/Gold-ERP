# UX-11C Focused Tests

- `node --test tests/ux11-print-preview-presentation.test.cjs`: 4 passed, 0 failed.
- `node --test tests/ux6b-asset-tag-preview-theme.test.cjs tests/c4-tag-profile-exact-parity.test.cjs`: 8 passed, 0 failed.
- Disposable build: PASS; TypeScript completed successfully.
- `tests/export-print.spec.ts` through local Chrome config: 16 passed, 1 failed.

The one failure is the existing `renders modernDark theme preset on luxuryGold without crashing` test. Its test body has no `page.goto()` and therefore its locator never reaches the fixture; the same fixture marker is present in the browser runner and HTTP response. The test was not changed or weakened. `PRINT_EXPORT_TEST = 16_OF_17_STALE_TEST_CONTRACT_FAILURE`.
