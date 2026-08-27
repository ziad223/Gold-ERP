# D2 Browser Search Acceptance

## Runtime

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Routes exercised read-only: /en/sales/search-print and /ar/sales/search-print
- Browser session: authenticated existing local session
- No Print button or business mutation was clicked.

## English evidence

| Check | Observed |
|---|---|
| Page | Invoices Search & Print loaded |
| Direction | LTR |
| Type controls | Sale, Return, Exchange, Installment, Deposit, Customer Gold Purchase; all visible and selectable |
| Employee filter | visible and enabled |
| Branch/date/status filters | visible |
| Rows | CGPD-000001 Customer Gold Purchase and INV-2026-000001 Sale on Branch-2 |
| Detail | View opened canonical read-only detail; CGP showed Barcode/Asset identity, Net weight 10, Stored rate 543.2891 |
| Console | no errors or warnings |

## Arabic evidence

| Check | Observed |
|---|---|
| Page | بحث وطباعة الفواتير loaded |
| Direction | RTL |
| Type controls | مبيعات، مرتجع، استبدال، تقسيط، عربون، شراء ذهب من عميل |
| Employee filter | visible and enabled |
| Branch/date/status filters | visible |
| Rows | same two canonical projection rows |
| Detail | عرض opened read-only CGP detail with Barcode/Asset identity and stored rate |
| Console | no errors or warnings |

## Network evidence

| Request | Result |
|---|---|
| GET /api/v1/health | 200 |
| GET /api/v1/health/db | 200 |
| GET /api/v1/health/redis | 200 |
| GET /api/v1/invoice-projection/sources | 200 in the authenticated D2 journey |
| GET /api/v1/invoice-projection/summaries?sourceTypes=sale,return,exchange,installment,deposit,customer_gold_purchase | initial 200, later browser revalidation 304 |
| GET /api/v1/invoice-projection/customer_gold_purchase/<source-id> | 200 |
| POST /api/v1/purchase-orders/receive | 0 |
| POST invoice/CGP business create route | 0 |
| POST print route | 0 |

The backend logs show the exact GET summary route and 304 revalidation after the backend rebuild. The response is read-only projection data; the only expected persistence side effect is search audit logging.

## Acceptance

D2_AR_BROWSER = PASS
D2_EN_BROWSER = PASS
D2_FILTERS_VISIBLE = PASS
D2_EMPLOYEE_FILTER_VISIBLE = PASS
D2_DETAIL_GET = PASS
D2_BROWSER_CONSOLE = PASS
D2_FINAL_RECEIVE_OR_INVOICE_CREATE_REQUESTS = 0

