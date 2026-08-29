# DARFUS ERP — D2F Gate A Gift Voucher Read-Only Projection Adapter Report

Control: \`DARFUS-CLIENT-D2F-GATE-A-GIFT-VOUCHER-READ-ONLY-PROJECTION-ADAPTER-01\`  
Mode: \`OWNER_APPROVED_MINIMUM_SAFE_READ_ONLY_PROJECTION_IMPLEMENTATION\`  
Date: 2026-08-29  
Official DB: \`darfus_erp\`

## 1. Executive Summary

تم تنفيذ أقل نطاق معتمد لتفعيل Gift Voucher داخل طبقة العرض الموحدة D1/D2 فقط. أصبح \`gift_voucher\` مدعومًا للقراءة مع البحث والتفصيل وعرض طباعة مبني على البيانات المخزنة في \`gift_vouchers\`، دون تغيير دورة الإصدار أو التفعيل أو الاسترداد أو الدفع أو المحاسبة أو المخزون.

الاختبارات المركزة نجحت \`35/35\`، ونجح \`npm run typecheck\` و\`npm run build\`. تم تحديث backend runtime عبر restart طبيعي لأن الخدمة كانت قديمة عن source الحالي؛ لم تُشغّل migrations ولم تُنفّذ business mutations. إثبات AR/EN نجح مع 5 سجلات Gift Voucher.

\`GATE_A = PASS_GIFT_VOUCHER_INVOICE_PROJECTION\`  
\`D2F_GATE_A = CLOSED\`

## 2. Accepted Upstream State

- D1 unified invoice projection وD2 unified invoice search/print هما authority السابقة المقبولة.
- Gift Voucher command/lifecycle routes وTax وPayment وAccounting وTreasury وInventory ظلت بلا تغيير.
- مصدر الحقيقة هو \`gift_vouchers\`.
- طباعة Gift Voucher في هذا المسار display-only؛ لا يتم إرسال print-event POST.
- المسارات المفتوحة بقيت كما هي: financial mapping persistence، CGP print recovery، وUX11C stale-navigation test maintenance.

## 3. Authority Map

| Concern | Authority | Evidence |
|---|---|---|
| Identity | \`gift_vouchers.id/voucher_number/voucher_code\` | model and adapter |
| Value/currency | \`face_value/currency\` | current model and adapter |
| Lifecycle | \`gift_vouchers.status\` | \`giftVoucherDisplayStatus()\` |
| Company/branch/customer | associations and scoped query | service/model |
| Payment | \`payments.gift_voucher_id\` | detail read query |
| Issue accounting | \`sourceType=gift_voucher_issue\` | detail read query |
| Print history | immutable \`gift_voucher_print_events\` | read-only detail |
| Authorization | auth + \`sales.view\` | unchanged route |

## 4. Baseline / Provenance

| Item | Evidence |
|---|---|
| Branch | \`main\` |
| HEAD before control | \`1657b0e9ba580faef69be48f04637835c201b521\` |
| Worktree | Dirty before control; drift preserved |
| Final status snapshot | 141 tracked-like entries, 5,745 untracked entries |
| Stashes | 11 |
| \`next-env.d.ts\` | unchanged; SHA-256 \`7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651\` |
| Control prompt SHA-256 | \`72E00462F7ACD554FB8BF1A7FE8FC94E55C65DFFADA70EB8194666EFA93E722C\` |

No cleanup, reset, restore, stash, staging, or automatic next-env repair was used.

## 5. Change Map

| Area | Minimum change | Mutation? |
|---|---|---:|
| Projection registry/service | Activate read-only Gift Voucher adapter, summaries, detail, scope | No |
| Search hook/types/UI | Add supported source, labels, detail evidence | No |
| Print model/template | Display stored voucher fields; no calculation | No |
| Tests | Update stale inactive assertions and add adapter test | No |
| Command/lifecycle/tax/accounting/schema | Unchanged | No |

## 6. Files / Hashes

| File | Final SHA-256 | Pre-control SHA-256 / provenance |
|---|---|---|
| \`backend/src/services/invoice-projection.service.js\` | \`34E740647AF7EA9FA80D581C954C6EE8DDA3CDA89DB3FBF273BC526446741548\` | \`2DAADB27A0FF73E848EA0A3DDD3CF1FEF246E68B2750CA4156BDDC08C269DA88\` |
| \`features/sales/hooks/use-invoice-search-print.ts\` | \`AA63859B7158F3443502AA0A35EAD0EBF5D61C6D9A62AC7D700F7E231E76866E\` | \`2CDAB26118BB4863956339174BCE415EFEF6D5B9A5AFE64DCC240393FBF8E436\` |
| \`app/[locale]/(dashboard)/sales/search-print/page.tsx\` | \`BBFC0DB87CD0086BF14F6414F5FE42D4A5563ECD705A064493018711BB4F6765\` | \`69BC46B3BE42FEC1C77F028780B8E2714B4A9BC969B6DAF9ACB8A3C89EB3DF26\` |
| \`features/printing/lib/invoice-print-view-model.ts\` | \`8369D029E30CCCE3A4812175EC5EF49384842F73F3614AD931F770864107C856\` | \`0085DE914F1A1CB3BCB609E49C2048B1342669EBF0DF7EADF856DBF3FA2F9B28\` |
| \`features/printing/components/InvoicePrintTemplate.tsx\` | \`356BBA53576F0B1C2D3438254EBA6636E1B4575DE9E26360DD7FF583BC485DFA\` | Pre-existing modified file; separate pre-control hash unavailable; only GV hunk in scope |
| \`lib/types.ts\` | \`D36E132F3FA449334C7AFDED204AC0F37E88DB04DF325475B71B60251E042914\` | \`F933A33FFD47DEBBB45D456B000A9053FDB8AECEEF98DA6890247B8030314A89\` |
| \`backend/tests/d2f-gift-voucher-projection-adapter.test.cjs\` | \`EC0A349AD11C29EC7D8129CEA841FBFAC8737769A2885164F91731E812D8E83E\` | Created by this control |
| \`backend/tests/e-cgp-invoice-projection.test.cjs\` | \`0F9C75AC5671BFABC10ED7DBE6A977F68EA721D81791F09CF29D03FD71BD7302\` | \`345DD38D1B77538AF4C5954AB64D9203884A1279A9C71F1E0CDAD9E3981755E1\` |
| \`backend/tests/d1-unified-invoice-projection.test.cjs\` | \`9361820C4071B9EC6F184820C13F633CD37E64C903808F60E54BF4125793DFDA\` | \`BE4C2172273C7663CC30C605173690E4EC1723436552772D64B6800AE0E41E54\` |
| \`tests/d2-final-invoice-search-print.test.cjs\` | \`13270768D924560D7CD12896505C557379F1AAD9ECC4CD37D9166C6F8EB195AC\` | \`DBE15ED181A76D86938064BE5276A97468414473B1312625D75A406700AA7F40\` |
| \`backend/tests/gift-voucher-full-redemption-contract.test.cjs\` | \`FEA3B1DC1F688A5F8F85BD32DC4AFDDB277A066A0E886DC07F09518CEE4DEEDA\` | \`C3A11B2B5505FF8F8CEEFAD08229861C0DAE0355F71255F0E6E6E58EBE1A260B\` |

No changes were made to command routes, tax, payment, accounting, treasury, inventory, migrations, or configuration.

## 7. Adapter / Search / Detail

Registry declares \`gift_voucher\` with source table \`gift_vouchers\`, display number \`voucher_number\`, \`SUPPORTED_NOW\`, adapter \`gift_voucher\`, detail support and display print support. Summary/detail dispatch to the adapter; company and fail-closed branch scope are applied. Mixed searches query only requested source families.

Detail preserves voucher number/code, face value/currency, status, dates, customer, branch, related payment evidence, cash/journal evidence, and existing print-event history. No field is recalculated.

## 8. Print / No Recalculation

The print model/template renders Voucher Number, Voucher Code, Value, Currency, Issue Date, Status, optional Expiry Date, and the existing full-redemption note. \`grandTotal\` is stored face value presentation; tax fields are not applicable. The Gift Voucher branch exits to display-only printing before print-event authorization.

## 9. Security / Scope

Existing auth middleware and \`sales.view\` remain required. Company scope is applied to reads. Branch scope allows issue branch, \`ALL_BRANCHES\`, or selected eligibility; otherwise it fails closed. No role, permission, user, auth, or fallback authority changed.

## 10. Focused Tests / Typecheck / Build

Command:

\`\`\`text
node --test backend/tests/d2f-gift-voucher-projection-adapter.test.cjs backend/tests/e-cgp-invoice-projection.test.cjs backend/tests/d1-unified-invoice-projection.test.cjs tests/d2-final-invoice-search-print.test.cjs backend/tests/gift-voucher-full-redemption-contract.test.cjs
\`\`\`

Result: \`35 pass, 0 fail\`.

| Proof | Result |
|---|---|
| Focused projection/D1/D2/GV tests | PASS — 35/35 |
| \`npm run typecheck\` | PASS — exit 0 |
| \`npm run build\` | PASS — Next 16.2.9, TypeScript pass, 130/130 pages |
| \`next-env.d.ts\` protection | PASS — SHA unchanged |
| Migration created/executed | NO / NO |

## 11. Runtime Parity

Before refresh, the frontend showed the new selector while the long-running backend returned \`PROJECTION_UNSUPPORTED_SOURCE_TYPE\`. Container inspection showed a bind-mounted backend process with 3-day uptime. A normal backend restart restored parity; no migration or business request was run.

After refresh, health endpoints returned 200: \`/api/v1/health\`, \`/api/v1/health/db\`, \`/api/v1/health/redis\`, and \`/api/v1/health/gold\`; Gold reported a healthy/fresh provider response. Frontend \`/en/sales/search-print\` returned 200 and authenticated projection search/detail rendered Gift Vouchers.

## 12. AR Browser Proof

URL: \`http://localhost:3000/ar/sales/search-print\`; branch: \`Branch-1\`.

- Gift Voucher-only search returned \`5 فاتورة مطابقة\`.
- Detail opened for existing \`GVN-0A687006914B45A5\`.
- Number, code, \`1000 AED\`, redeemed/closed status, issue date, customer and branch were visible.
- Print options opened and the stale inactive-source message was removed.
- Console error/warning capture: empty.

## 13. EN Browser Proof

URL: \`http://localhost:3000/en/sales/search-print\`; branch: \`Branch-1\`.

- Gift Voucher-only search returned \`5 matching invoices\`.
- Detail opened for the same existing voucher.
- The same canonical identity, value/currency, status, issue date, customer and branch were visible.
- Print options opened with the identity-preserving display-only notice.
- Console error/warning capture: empty.

## 14. Network / Console Proof

The route contract is GET-only for \`/api/v1/invoice-projection/sources\`, \`/summaries\`, and \`/:sourceType/:sourceId\`; print-event POST is a separate explicit route. The Gift Voucher UI returns to display-only printing before authorization. No command, payment, checkout, issue, activation, redemption, or print-event mutation request was made.

The selected browser API does not expose raw page-level HTTP interception. Therefore response status for projection GETs is not overstated as raw interception; rendered authenticated results, route source, focused tests, health endpoints, and empty console error/warning capture are the combined evidence.

## 15. Database Safety / Delta

\`\`\`text
current_database = darfus_erp
current_user = postgres
\`\`\`

| Table | Prior baseline | Final | Delta |
|---|---:|---:|---:|
| \`gift_vouchers\` | 5 | 5 | 0 |
| \`payments\` | 20 | 20 | 0 |
| \`journal_entries\` | 73 | 73 | 0 |
| \`journal_lines\` | 200 | 200 | 0 |
| \`idempotency_requests\` | 161 | 161 | 0 |
| \`invoice_print_events\` | 9 | 9 | 0 |
| \`gift_voucher_print_events\` | 5 | 5 | 0 |
| \`audit_logs\` | 317 | 322 | +5 expected read-audit entries |

\`BUSINESS_DB_DELTA = 0\`  
\`FINANCIAL_DB_DELTA = 0\`  
\`INVENTORY_DB_DELTA = 0\`  
\`PRINT_MUTATION_DELTA = 0\`

No INSERT/UPDATE/DELETE/TRUNCATE/seed/migration was run against \`darfus_erp\`.

## 16. Diff / Rollback Safety

No destructive Git command, cleanup, reset, restore, stash, staging, or automatic next-env repair was used. The worktree remains dirty and pre-existing drift remains preserved. The controlled hunks are narrow and reversible in a separately approved process.

## 17. Open Tracks / Risks

Not implemented: financial mapping persistence, Gift Voucher command/lifecycle changes, POS checkout/payment changes, tax/accounting/treasury/inventory changes, D2F B/C/D, CGP print recovery, CRM/HR, and print-event redesign.

Residual evidence limitation: raw page-level HTTP response interception is unavailable in the selected browser API. Print template provenance is mixed because that file was already modified before this control; only the Gift Voucher rendering hunk is attributed here. No P0/P1 issue was introduced or observed.

## 18. Gate A

The authorized read-only adapter, search, detail and display-only print integration are complete. Canonical identity/value are preserved, AR/EN proof passed, focused tests/typecheck/build passed, business authorities are unchanged, and official database business/financial/inventory/print writes are zero.

\`GATE_A = PASS_GIFT_VOUCHER_INVOICE_PROJECTION\`  
\`D2F_GATE_A = CLOSED\`

## 19. Final Tokens

\`\`\`text
CURRENT_CONTROL = DARFUS-CLIENT-D2F-GATE-A-GIFT-VOUCHER-READ-ONLY-PROJECTION-ADAPTER-01
MODE = OWNER_APPROVED_MINIMUM_SAFE_READ_ONLY_PROJECTION_IMPLEMENTATION
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_BUSINESS_WRITES = 0
OFFICIAL_DB_FINANCIAL_WRITES = 0
OFFICIAL_DB_INVENTORY_WRITES = 0
OFFICIAL_DB_PRINT_MUTATION_WRITES = 0
GIFT_VOUCHER_PROJECTION_ADAPTER = ACTIVE
GIFT_VOUCHER_SOURCE_OF_TRUTH = gift_vouchers
GIFT_VOUCHER_SEARCH = PASS
GIFT_VOUCHER_DETAIL = PASS
GIFT_VOUCHER_PRINT_VIEW = PASS_DISPLAY_ONLY
GIFT_VOUCHER_RECALCULATION = NONE
GIFT_VOUCHER_TAX_RECALCULATION = NONE
GIFT_VOUCHER_COMMAND_LIFECYCLE_CHANGED = NO
COMPANY_SCOPE = PASS_FAIL_CLOSED
BRANCH_SCOPE = PASS_FAIL_CLOSED
RBAC = PRESERVED
D1_COMPATIBILITY = PASS
D2_COMPATIBILITY = PASS
AR_BROWSER = PASS
EN_BROWSER = PASS
BROWSER_CONSOLE_ERRORS = 0
BROWSER_CONSOLE_WARNINGS = 0
FOCUSED_TESTS = PASS_35_OF_35
TYPECHECK = PASS
BUILD = PASS
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
BUSINESS_DB_DELTA = 0
FINANCIAL_DB_DELTA = 0
INVENTORY_DB_DELTA = 0
PRINT_MUTATION_DELTA = 0
EXPECTED_READ_AUDIT_DELTA = +5
SOURCE_CHANGES_OUTSIDE_AUTHORIZED_SCOPE = 0_CONTROL_OWNED
PREEXISTING_WORKTREE_DRIFT = PRESERVED
NEXT_ENV_D_TS_CHANGED = NO
GATE_A = PASS_GIFT_VOUCHER_INVOICE_PROJECTION
D2F_GATE_A = CLOSED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_FOR_D2F_GATE_B_ONLY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
\`\`\`

## 20. Stop

No D2F B/C/D, CRM, HR, financial mapping persistence, lifecycle change, or production work was started. Stop for Owner review.
