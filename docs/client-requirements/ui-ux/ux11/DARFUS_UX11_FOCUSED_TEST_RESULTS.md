# UX-11 Focused Test Results

Command:

```text
node --test tests/ux11-print-preview-presentation.test.cjs tests/ux6b-asset-tag-preview-theme.test.cjs tests/barcode-final-closure.test.cjs tests/c4-tag-profile-exact-parity.test.cjs tests/d2-final-invoice-search-print.test.cjs tests/pos-journal-preview-p2.test.cjs tests/pos-gift-voucher-i18n.test.cjs tests/pos-gift-voucher-payment-ui-composition.test.cjs tests/pos-gift-voucher-visual-ux-correction.test.cjs
```

Result: 42 tests passed, 0 failed.

`npm run typecheck`: PASS.

`npm run build`: PASS (Next.js production build completed; no migration or business runtime operation).

The existing Playwright print-export command was also attempted without changing its command or configuration. All 17 tests were blocked before browser launch because the local Playwright Chromium executable was absent (`ms-playwright/chromium_headless_shell-1161`). This is an environment/test-runner limitation; the in-app real-browser evidence below was completed, and no product or DB change was made to bypass it.
