# DARFUS Jewellery ERP — REST API Contract
> API Version: v1 | Base URL: `/api/v1`

All responses are wrapped in a unified JSON envelope.

---

## 1. Request / Response Envelope

### Standard Response Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 120,
    "totalPages": 5
  },
  "requestId": "uuid-correlation-id"
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "message": "Error Message (عربي أو إنجليزي)",
  "errors": {
    "field_name": ["Validation error details"]
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error Message",
    "fieldErrors": {
      "field_name": ["Validation error details"]
    },
    "requestId": "uuid-correlation-id",
    "status": 400
  }
}
```

---

## 2. Common Headers

| Header | Required | Description | Example |
|---|---|---|---|
| `Authorization` | Yes (for protected endpoints) | Bearer JWT access token | `Bearer eyJhbGciOiJIUz...` |
| `X-Company-ID` | No / Inherited | Multi-tenant company context scope | `CMP-DEMO` |
| `X-Branch-ID` | No / Inherited | Active physical branch location scope | `Main Branch` |
| `X-Correlation-ID` | No | Unique request identifier for logging | `550e8400-e29b-41d4-a716-446655440000` |
| `Idempotency-Key` | For post actions | Unique identifier for POST requests to block double submission | `post-inv-12345-idemp` |

---

## 3. Endpoints Details

### 3.1. Authentication

#### `POST /auth/login`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "admin@admin.com",
    "password": "123456",
    "remember": true
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "access_token_jwt",
      "refreshToken": "refresh_token_jwt",
      "user": {
        "id": "USR-ADMIN",
        "firstName": "Admin",
        "lastName": "DARFUS",
        "email": "admin@admin.com",
        "phone": "+20 100 000 0000",
        "jobTitle": "System Administrator",
        "role": "admin"
      },
      "company": {
        "id": "CMP-DEMO",
        "businessName": "DARFUS Jewellery",
        "workspace": "demo",
        "currency": "AED",
        "branchName": "Main Branch"
      }
    }
  }
  ```

#### `POST /auth/refresh`
- **Request Body**: `{ "refreshToken": "jwt_token" }`
- **Success Response (200)**: `{ "success": true, "data": { "token": "new_access_token", "refreshToken": "new_refresh_token" } }`

#### `POST /auth/logout`
- **Request Body**: `{}`
- **Success Response (200)**: `{ "success": true, "data": { "message": "Logged out successfully" } }`

#### `GET /auth/me`
- **Success Response (200)**: `{ "success": true, "data": { "user": { ... }, "company": { ... } } }`

---

### 3.2. Gold Price Feed

#### `GET /gold/live` or `/api/gold/live`
- **Authentication**: Optional
- **Success Response (200)**:
  ```json
  {
    "gold_24k": {
      "USD": 2330,
      "EUR": 2150,
      "GBP": 1840,
      "EGP": 111000,
      "SAR": 8740,
      "AED": 8560
    },
    "last_update": "2026-06-16T17:30:00Z"
  }
  ```

---

### 3.3. Asset Registry

#### `GET /assets`
- **Query Params**: `page`, `pageSize`, `search`, `sortBy`, `sortDirection`, `filters`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "AST-2026-00184",
          "name": "خاتم ألماس سوليتير",
          "type": "diamond",
          "category": "خواتم",
          "karat": 18,
          "purity": "0.75000000",
          "grossWeight": "6.42000000",
          "netWeight": "5.91000000",
          "goldWeight": "2.91000000",
          "price": "12800.00000000",
          "cost": "8450.00000000",
          "branch": "فرع دبي مول",
          "location": "خزنة A · رف 04",
          "status": "available",
          "barcode": "6291001840138",
          "rfid": "E280-1160-6000-0209-1840"
        }
      ],
      "total": 1
    }
  }
  ```

#### `POST /assets`
- **Request Body**:
  ```json
  {
    "id": "AST-2026-00184",
    "name": "خاتم ألماس سوليتير",
    "type": "diamond",
    "category": "خواتم",
    "karat": 18,
    "grossWeight": 6.42,
    "netWeight": 5.91,
    "price": 12800,
    "cost": 8450,
    "location": "خزنة A · رف 04"
  }
  ```

#### `GET /assets/:id`
- **Success Response (200)**: `{ "success": true, "data": { ...Asset } }`

#### `GET /assets/:id/timeline`
- **Success Response (200)**: `{ "success": true, "data": [ ...AssetEvents ] }`

---

### 3.4. Customers CRM

#### `GET /customers`
- **Query Params**: `page`, `pageSize`, `search`
- **Success Response (200)**: `{ "success": true, "data": { "items": [ ...Customers ], "total": 5 } }`

#### `POST /customers`
- **Request Body**:
  ```json
  {
    "name": "مريم سالم",
    "phone": "+971 50 123 8890",
    "email": "mariam@example.com",
    "tier": "VIP",
    "addresses": [{"line1": "Villa 12", "city": "Dubai", "country": "AE"}]
  }
  ```

---

### 3.5. Suppliers and Purchase Orders

#### `GET /suppliers`
- **Success Response (200)**: `{ "success": true, "data": { "items": [ ...Suppliers ], "total": 4 } }`

#### `GET /purchase-orders`
- **Success Response (200)**: `{ "success": true, "data": { "items": [ ...PurchaseOrders ], "total": 2 } }`

---

### 3.6. Health Status Monitoring

#### `GET /health`
- **Success Response (200)**: `{ "success": true, "data": { "status": "UP", "timestamp": "..." } }`

#### `GET /health/db`
- **Success Response (200)**: `{ "success": true, "data": { "status": "UP", "database": "PostgreSQL connected" } }`

#### `GET /health/redis`
- **Success Response (200)**: `{ "success": true, "data": { "status": "UP", "redis": "Redis connected" } }`
