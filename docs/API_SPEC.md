# DARFUS REST API Contract — v1

Base URL: `/api/v1`

## Authentication

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Dashboard

- `GET /dashboard/summary?branch_id=&from=&to=`
- `GET /dashboard/sales-chart`
- `GET /dashboard/alerts`

## Assets

- `GET /assets`
- `POST /assets`
- `GET /assets/{assetId}`
- `PATCH /assets/{assetId}` for draft/non-posted metadata only
- `GET /assets/{assetId}/timeline`
- `GET /assets/{assetId}/lineage`
- `POST /assets/{assetId}/reserve`
- `POST /assets/{assetId}/release`
- `POST /assets/{assetId}/transfer`
- `POST /assets/{assetId}/repair`
- `POST /assets/{assetId}/convert`
- `POST /assets/{assetId}/melt`

## Sales

- `GET /sales/invoices`
- `POST /sales/invoices/draft`
- `POST /sales/invoices/{id}/items`
- `POST /sales/invoices/{id}/post`
- `POST /sales/invoices/{id}/payment`
- `POST /sales/invoices/{id}/return`
- `POST /sales/invoices/{id}/exchange`
- `POST /sales/reservations`
- `POST /sales/deposits`
- `POST /sales/installments`
- `POST /sales/gold-purchases`

All posting endpoints require an `Idempotency-Key` header.

## Inventory

- `GET /inventory/balances`
- `GET /inventory/movements`
- `POST /inventory/transfers`
- `POST /inventory/adjustments`
- `POST /inventory/audits`
- `POST /inventory/audits/{id}/freeze-snapshot`
- `POST /inventory/audits/{id}/scan`
- `POST /inventory/audits/{id}/reconcile`

## Customers

- `GET /customers`
- `POST /customers`
- `GET /customers/{id}`
- `GET /customers/{id}/statement`
- `GET /customers/{id}/purchases`
- `POST /customers/{id}/notes`

## Suppliers and purchasing

- `GET /suppliers`
- `POST /suppliers`
- `GET /purchase-orders`
- `POST /purchase-orders`
- `POST /purchase-orders/{id}/approve`
- `POST /purchase-orders/{id}/receive`

## Accounting

- `GET /accounting/chart-of-accounts`
- `GET /accounting/journal-entries`
- `POST /accounting/journal-entries`
- `POST /accounting/journal-entries/{id}/post`
- `GET /accounting/trial-balance`
- `GET /accounting/general-ledger`
- `GET /accounting/profit-and-loss`
- `GET /accounting/balance-sheet`

## Configuration

- `GET /settings/{listKey}`
- `POST /settings/{listKey}`
- `PATCH /settings/{listKey}/{itemId}`
- `DELETE /settings/{listKey}/{itemId}`
- `GET /workflows`
- `POST /workflows`

## Audit

- `GET /audit-logs`
- `GET /audit-logs/{id}`

Audit endpoints must be read-only. Audit records must never expose a delete endpoint.

## Standard response

```json
{
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": {},
  "meta": {}
}
```

## Standard validation error

```json
{
  "success": false,
  "message": "بيانات غير صحيحة",
  "errors": {
    "field": ["رسالة الخطأ"]
  }
}
```
