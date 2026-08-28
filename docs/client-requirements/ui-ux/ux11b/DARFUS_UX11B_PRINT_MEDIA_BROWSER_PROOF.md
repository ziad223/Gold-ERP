# Print Media Browser Proof

The evidence-only local Chrome runner invoked `page.emulateMedia({ media: 'print' })` successfully (`media = true`) and found no overflow. However, the required print fixture did not render: the requested route redirected to `/ar/test/print-export` and returned HTTP 404, with zero print roots and zero template markers. Therefore direct print-media content proof is blocked, not passed.

`PRINT_MEDIA_DIRECT_BROWSER_PROOF = BLOCKED_FIXTURE_404`.
