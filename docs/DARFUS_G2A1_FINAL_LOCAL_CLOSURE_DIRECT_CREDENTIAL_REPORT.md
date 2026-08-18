# DARFUS ERP — G2A1 Final Local Closure — Direct Local Credential Report

## 1. Login

PASS against `http://localhost:8000/api/v1/auth/login`:

- HTTP status: `200`
- Existing local user: `admin@admin.com`
- Role: `admin`
- Account type: `super_admin`
- Company context present: YES
- Token/password were kept in process memory only and are not included in this report.

For Super Admin requests, the authenticated Company ID returned by login was sent through the server-supported `X-Company-ID` context header. No client override beyond the authenticated Company context was used.

## 2. Settings GET Before

PASS: authenticated `GET /api/v1/settings` returned `200`.

| Field | Before |
|---|---|
| `jurisdiction` | UAE |
| `legalStandardVatRate` | 5 |
| `supportedTaxTreatments` | STANDARD_VAT, ZERO_RATED, REVERSE_CHARGE, EXEMPT, OUT_OF_SCOPE |
| `vatRegistered` | null |
| `vatRate` | null |
| `vatEnabled` | null |
| `enabledTaxTreatments` | null |
| `defaultTaxTreatment` | null |
| `preciousGoodsRcmEnabled` | null |
| `configured` | false |

The response distinguished persisted explicit policy from runtime fallback metadata.

## 3. PATCH

PASS: authenticated `PATCH /api/v1/settings` returned `200`.

Synthetic values written to the local development database only:

- `vatRegistered=true`
- `vatRate=5`
- enabled: `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`
- default: `STANDARD_VAT`
- `preciousGoodsRcmEnabled=true`

Classification:

`LOCAL_DEVELOPMENT_CONFIGURATION = YES`  
`SYNTHETIC_ONLY = YES`  
`PRODUCT_DEFAULT = NO`  
`REAL_CUSTOMER_DATA = NO`

No TRN, Supplier, Location, PO, Asset, Journal, Payment, or Customer was written.

## 4. Settings GET After

PASS: authenticated post-write `GET /api/v1/settings` returned `200` and matched the persisted policy:

- `vatRegistered=true`
- `vatRate=5`
- enabled treatments exactly `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`
- `defaultTaxTreatment=STANDARD_VAT`
- `preciousGoodsRcmEnabled=true`
- `jurisdiction=UAE`
- `legalStandardVatRate=5`
- supported treatments remained the exact five canonical values
- `configured=true`

## 5. DB Proof

Direct read-only proof on `darfus_erp`:

| Scope | Key | Stored value summary |
|---|---|---|
| Current Company | `vat_registered` | `true` |
| Current Company | `vatRate` | `5` |
| Current Company | `enabledTaxTreatments` | `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE` |
| Current Company | `defaultTaxTreatment` | `STANDARD_VAT` |
| Current Company | `preciousGoodsRcmEnabled` | `true` |

Settings count after: `4`. No `vatEnabled` row was invented or written. The database remains `darfus_erp`; `SequelizeMeta=84`.

## 6. Audit Proof

Audit count increased from `23` to `26`, exactly three rows for the successful PATCH contract:

- `company.vat_registration.updated`
- `company.tax_policy.updated`
- `settings.update`

Each new row had:

- current Company scope
- authenticated local admin user ID
- timestamp
- `before` present where applicable
- `after` present

No audit row was created by the three rejected negative PATCH requests or the rejected by-key request.

## 7. Negative API

All three authenticated invalid requests failed closed without changing the persisted policy:

| Test | HTTP | Safe result |
|---|---:|---|
| Unknown treatment `INVALID_TAX` | 422 | `TAX_TREATMENT_UNSUPPORTED` |
| Default not enabled | 422 | `DEFAULT_TAX_TREATMENT_NOT_ENABLED` |
| `vatRegistered="yes"` | 422 | `VAT_REGISTERED_BOOLEAN_REQUIRED` |

Post-test DB values remained the same synthetic policy and audit count remained `26`.

## 8. by-key Regression

PASS: one invalid request was sent to `PUT /api/v1/settings/by-key/vatRate` with an invalid rate value. It returned `422` with `UAE_VAT_RATE_INVALID`.

This proves the by-key path did not bypass the Tax Policy validation/authority. No by-key value was persisted.

## 9. Health/Browser

Health PASS after the authenticated run:

- `GET /api/v1/health` = 200
- `GET /api/v1/health/db` = 200
- `GET /api/v1/health/redis` = 200
- `GET http://localhost:3000` = 200

Browser smoke on the existing local authenticated session:

| URL | Result |
|---|---|
| `/ar/dashboard` | PASS; rendered without crash |
| `/ar/settings` | PASS; rendered Settings UI |
| `/ar/inventory` | PASS; rendered empty inventory state |

Console error/warning capture was empty for the three pages. No visible 5xx or fatal frontend error was observed. No new Tax Policy UI was expected.

## 10. Final DB State

| Entity | Final count/state |
|---|---:|
| Database | `darfus_erp` |
| SequelizeMeta | 84 |
| G2A1 migration row | 1 |
| `companies.vat_registered` | true for current Company |
| Tax Policy Settings | 4 intended keys |
| Audit logs | 26 |
| Suppliers | 0 |
| Locations | 0 |
| Purchase Orders | 0 |
| Assets | 0 |
| Asset Movements | 0 |
| Stock Movements | 0 |
| Journal Entries | 0 |
| Journal Lines | 0 |
| Payments | 0 |
| Customers | 0 |
| Receive | NOT RUN |

The only intentional persistent writes were the approved local synthetic Company Tax Policy and its three audit rows.

## 11. Gate

`GATE = PASS_DARFUS_G2A1_FINAL_LOCAL_CLOSURE`

`G2A1_LOCAL_MAIN_FINAL_CLOSED = YES`

All required local Main authenticated Settings, persistence, audit, negative validation, by-key, health, and browser compatibility checks passed. Online Production was not contacted.

## 12. Final Tokens

```text
CURRENT_CONTROL = DARFUS-G2A1-FINAL-LOCAL-CLOSURE-DIRECT-CREDENTIAL
LOCAL_MAIN_DB = darfus_erp
LOCAL_MAIN_BACKEND = http://localhost:8000
LOCAL_MAIN_FRONTEND = http://localhost:3000
LOCAL_AUTH_USER = admin@admin.com
LOGIN = PASS
SETTINGS_GET_BEFORE = PASS
SETTINGS_PATCH = PASS
SETTINGS_GET_AFTER = PASS
DB_PERSISTENCE = PASS
AUDIT = PASS
NEGATIVE_API = PASS
BY_KEY_REGRESSION = PASS
MAIN_HEALTH = PASS
MAIN_BROWSER = PASS
LOCAL_DEVELOPMENT_CONFIGURATION = YES
PRODUCT_DEFAULT = NO
REAL_CUSTOMER_DATA_USED = NO
SUPPLIER_CREATED = 0
LOCATION_CREATED = 0
PURCHASE_ORDER_CREATED = 0
ASSET_CREATED = 0
MOVEMENT_CREATED = 0
JOURNAL_CREATED = 0
PAYMENT_CREATED = 0
CUSTOMER_CREATED = 0
RECEIVE_RUN = NO
G2A2_IMPLEMENTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
GATE = PASS_DARFUS_G2A1_FINAL_LOCAL_CLOSURE
G2A1_LOCAL_MAIN_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = 03B-G2A2-TRANSACTION-TAX-TREATMENT-SNAPSHOT-AND-PRECIOUS-GOODS-RCM-ELIGIBILITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**G2A1 FINAL LOCAL CLOSURE COMPLETE → OWNER REVIEW → STOP.**
