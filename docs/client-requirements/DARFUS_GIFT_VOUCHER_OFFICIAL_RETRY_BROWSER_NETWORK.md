# Gift Voucher Official Retry 01 — Browser and Network

The internal controllable browser was authenticated as the existing local
operator in company `Gold ERP`, Branch-1 after selecting the Asset's branch.
The official Gift Voucher form was used.

| Browser-originated operation | Method/status | Result |
|---|---|---|
| Gift Voucher list | GET /api/v1/gift-vouchers, 304 (authenticated cache revalidation) | PASS read-side |
| Asset search | GET /api/v1/pos/search, 200/304 | PASS, one Asset result |
| Pricing preview | POST /api/v1/pricing/calculate, 200 | PASS, current total 3,235.82 |
| Voucher issue | POST /api/v1/gift-vouchers/issue, 422 | STOPPED at financial mapping |
| Activation / redemption / checkout | not sent | STOPPED |

Backend request ID for the failed issue: `ded2e4a2-4e74-4abf-a3fa-dc59d5becc50`.
No credentials, cookies, tokens, or full secrets were recorded.

The clean internal-browser log query returned zero console error entries after
the failed request. The visible error matched the server's safe failure
message; no extra business action was invoked.

