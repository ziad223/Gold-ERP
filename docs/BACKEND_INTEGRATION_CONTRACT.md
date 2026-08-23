# DARFUS Jewellery ERP — Backend Integration Contract

This document defines the REST API contract between the DARFUS Jewellery ERP Frontend and any future Backend system.

## 1. Unified Response Envelope

All API endpoints must return data wrapped in this envelope:

### Successful Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 120,
    "totalPages": 5
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Response Envelope (Unified API Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The input data is invalid.",
    "fieldErrors": {
      "phone": ["Phone number is already registered."]
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "status": 422
  }
}
```

---

## 2. Common Standards

### Data Scopes & Multi-Tenancy
- **Tenant Scope**: Identified via subdomains or the header `X-Tenant-ID`.
- **Branch Scope**: Identified via the header `X-Branch-ID`.
- **Idempotency**: All mutations must support a unique `Idempotency-Key` header to prevent double submission.
- **Access Authorization**: Sent via standard `Authorization: Bearer <token>` header. Token refresh is handled via a `/auth/refresh` endpoint.

### Decimal and Weight Serialization
To prevent floating-point inaccuracies, decimal values (prices, stones carat weights, gold gross/net weights) must be serialized as strings or Decimal DTOs:
```json
{
  "amount": "1250.50",
  "currency": "AED"
}
```
```json
{
  "value": "18.750",
  "unit": "g"
}
```

### Date and Time Serialization
All dates must use ISO 8601 UTC format:
```json
"createdAt": "2026-06-14T11:20:28Z"
```

---

## 3. Module Endpoints

### 3.1. Customers Module

#### `GET /api/v1/customers`
- **Purpose**: Get a paginated, filterable list of customers.
- **Query Parameters**:
  - `page`: default `1`
  - `pageSize`: default `25`
  - `search`: search query (IDs, name, phone, email)
  - `sortBy`: sorting property (`name`, `purchases`, `balance`)
  - `sortDirection`: `"asc"` or `"desc"`
  - `filters`: JSON string (e.g. `{"tier": "VIP", "balance": "due", "status": "active"}`)

#### `GET /api/v1/customers/{id}`
- **Purpose**: Retrieve detailed profile of a single customer.

#### `POST /api/v1/customers`
- **Purpose**: Create a new customer.
- **Request Body**:
```json
{
  "name": "Mariam Salem",
  "phone": "+971550010001",
  "email": "mariam@salem.ae",
  "tier": "VIP",
  "notes": "VIP gold jewelry enthusiast",
  "addresses": [
    {
      "line1": "Flat 402, Marina Heights",
      "city": "Dubai",
      "country": "UAE",
      "postalCode": "00000"
    }
  ]
}
```

#### `PUT /api/v1/customers/{id}`
- **Purpose**: Update customer details.

#### `POST /api/v1/customers/{id}/deactivate`
- **Purpose**: Deactivate customer account with a reason.
- **Request Body**: `{"reason": "Customer requested account suspension"}`

#### `POST /api/v1/customers/{id}/reactivate`
- **Purpose**: Reactivate customer account.

#### `GET /api/v1/customers/{id}/statement`
- **Purpose**: Retrieve localized ledger statement preview.

---

### 3.2. Suppliers Module

#### `GET /api/v1/suppliers`
- **Purpose**: Get paginated list of suppliers.

#### `POST /api/v1/suppliers`
- **Purpose**: Create supplier.

#### `PUT /api/v1/suppliers/{id}`
- **Purpose**: Update supplier details.

#### `POST /api/v1/suppliers/{id}/deactivate`
- **Purpose**: Deactivate supplier.

#### `POST /api/v1/suppliers/{id}/reactivate`
- **Purpose**: Reactivate supplier.

#### `GET /api/v1/suppliers/{id}/purchase-orders`
- **Purpose**: Get all purchase orders associated with a supplier.

#### `GET /api/v1/suppliers/{id}/consignments`
- **Purpose**: Get list of consignment inventory.

#### `GET /api/v1/suppliers/{id}/documents`
- **Purpose**: Get list of legal documents/licenses.

---

### 3.3. Employees Module

#### `GET /api/v1/employees`
- **Purpose**: Get paginated list of employees.

#### `POST /api/v1/employees`
- **Purpose**: Create employee record.

#### `PUT /api/v1/employees/{id}`
- **Purpose**: Update employee details.

#### `POST /api/v1/employees/{id}/deactivate`
- **Purpose**: Deactivate employee (with reason). Expels them from active Cashier, Approver, and Assignee lists.

#### `POST /api/v1/employees/{id}/reactivate`
- **Purpose**: Reactivate employee.

#### `GET /api/v1/employees/{id}/sessions`
- **Purpose**: Get active devices/sessions.

#### `DELETE /api/v1/employees/{id}/sessions/{sessionId}`
- **Purpose**: Force revoke an active session.

---

## 4. Attachment Upload Protocol

File uploads are fully decoupled from entity mutations. The frontend uploads files directly through the storage API client, receiving an `AttachmentMetadata` response.

#### `POST /api/v1/attachments/upload`
- **Request Headers**:
  - `Content-Type: multipart/form-data`
  - `X-Purpose: "customer-kyc" | "supplier-document" | "asset-attachment"`
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "ATT-992813",
    "name": "passport_scan.pdf",
    "type": "PDF",
    "size": 1824100,
    "uploadedAt": "2026-06-14T11:20:28Z"
  }
}
```
The returned metadata is then saved with the parent entity (Customer, Supplier, etc.) via its corresponding `PUT` update endpoint.
