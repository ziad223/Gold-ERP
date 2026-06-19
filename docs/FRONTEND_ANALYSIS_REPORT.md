# DARFUS Jewellery ERP — Frontend Analysis Report
> Audit Date: 2026-06-16 | Version: 2.0.0 | Author: Senior Full-Stack Architect

This report presents a thorough analysis of the Next.js frontend application for the DARFUS Jewellery ERP, detailing all discovered pages, components, forms, tables, mock data formats, authentication flows, and API request/response specifications.

---

## 1. Discovered Pages and Routes

The frontend is built using Next.js with app router and i18n routing (next-intl). The active routes under the `/[locale]` layout include:

| Route | Page Component Location | Status / Purpose |
|---|---|---|
| `/login` | `app/[locale]/login/page.tsx` | Cashier & Admin login, checks credentials locally, saves to sessionStorage/localStorage. |
| `/signup` | `app/[locale]/signup/page.tsx` | 4-step organization signup flow (Company Profile, Admin Credentials, Preferences). |
| `/dashboard` | `app/[locale]/(dashboard)/dashboard/page.tsx` | Central ERP dashboard. Shows sales KPIs, real-time gold rates, pending actions, low stock items. |
| `/pos` | `app/[locale]/(dashboard)/pos/page.tsx` | Point of Sale interface. Add assets via search/barcode/RFID, calculate totals with tax, post sales/returns. |
| `/inventory` | `app/[locale]/(dashboard)/inventory/page.tsx` | Asset inventory list, search, filters (status, type, karat, branch), and asset creation. |
| `/inventory/[id]` | `app/[locale]/(dashboard)/inventory/[id]/page.tsx` | Asset details page, displaying item characteristics, GIA certificates, attachments, event timeline, and lineage tree. |
| `/sales` | `app/[locale]/(dashboard)/sales/page.tsx` | List of invoices and returns. View invoice details. |
| `/customers` | `app/[locale]/(dashboard)/customers/page.tsx` | Customer list (Standard/Gold/VIP) and creation modal. |
| `/suppliers` | `app/[locale]/(dashboard)/suppliers/page.tsx` | Supplier directory and registration modal. |
| `/employees` | `app/[locale]/(dashboard)/employees/page.tsx` | Employee list, status tracking, and onboarding form. |
| `/accounting` | `app/[locale]/(dashboard)/accounting/page.tsx` | Journal entries viewer and creation form. |
| `/reports` | `app/[locale]/(dashboard)/reports/page.tsx` | PDF/Excel reporting catalog (Sales report, Inventory reports, Margin reports). |
| `/audit` | `app/[locale]/(dashboard)/audit/page.tsx` | Global immutable audit logs search and comparison viewer. |
| `/settings` | `app/[locale]/(dashboard)/settings/page.tsx` | System configurations: Karat values, Status transitions, Role management card view. |
| `/approvals` | `app/[locale]/(dashboard)/approvals/page.tsx` | Discount, Price Override, and Transfer requests queue. |

---

## 2. Shared Layout and Components

### Layout Structure
- **Sidebar (`components/layout/Sidebar.tsx`)**: Responsive side navigation with active routes checking, permission check guards, and a collapsible mobile sidebar overlay.
- **Header (`components/layout/Header.tsx`)**: Main header displaying active branch selection, active tenant profile, user dropdown, language switcher, notifications pane, and a dynamic gold price ticker.

### Core Domain Components
- **Asset Timeline (`features/assets/components/AssetTimeline.tsx`)**: Renders timeline events indicating transitions (e.g. Created -> Transferred -> Reserved -> Sold) with audit severity indicators.
- **Asset Lineage Graph (`features/assets/components/AssetLineageGraph.tsx`)**: Displays parent/child relationships of jewelry pieces (e.g. items melted/manufactured from bulk gold).
- **Permission Gate (`components/auth/PermissionGate.tsx`)**: Wrapper hiding UI elements from unauthorized users based on active roles.
- **Sensitive Value (`components/ui/SensitiveValue.tsx`)**: Masks critical margins, costs, and revenues unless the user possesses appropriate permission scopes.

---

## 3. Form and Table Audits

### Forms and Validations
The frontend uses standard HTML forms and `react-hook-form` along with `zod` validations:

1. **Onboarding Form (`app/[locale]/signup/page.tsx`)**:
   - Company: Name, Workspace sub-domain, Country, City, Currency, Tax Number.
   - User: First/Last Name, Email, Password (min 6 chars), Job Title.
2. **Add Asset Form (`features/assets/components/AddAssetModal.tsx`)**:
   - Fields: Name, Type (diamond, gold-piece, watch, etc.), Category, Karat (18, 21, 22, 24), Gross Weight, Net Weight, Price, Cost, Location.
   - Validations: Numerical fields must be positive, gross weight >= net weight.
3. **POS Checkout Form (`app/[locale]/(dashboard)/pos/page.tsx`)**:
   - Select Customer, Payment Method (Cash, Card, Bank Transfer, Split), Splits structure, Discount percentage.
4. **Journal Entry Form (`app/[locale]/(dashboard)/accounting/page.tsx` / `JournalForm`)**:
   - Description, Date, list of debit/credit lines. Total Debit must equal Total Credit.

### Data Tables
Tables are managed via vanilla Tailwind grids and `@tanstack/react-table` (where applicable) providing:
- Column sorting (sortBy, sortDirection).
- Page size and Page Index queries.
- Global text search matching IDs or names.
- Filters (e.g. status: "available", tier: "VIP", role: "sales").

---

## 4. State Management and Flow

The application utilizes three main contexts for state management:

1. **`AuthContext` (`contexts/auth-context.tsx`)**:
   - Active user profile, business company structure.
   - Login, logout, registration, and active branch switching.
   - Persists session in `localStorage` (`darfus-session-v3`) or `sessionStorage` (`darfus-browser-session-v3`).
2. **`ErpContext` (`contexts/erp-context.tsx`)**:
   - Houses states for Assets, Customers, Invoices, Suppliers, Employees, Transfers, Manufacturing Orders, Gold Pools (CGP, IGP), Journals, and Reservations.
   - Dynamically selects repository implementation (`LocalRepository` vs. `ApiRepository`) based on `process.env.NEXT_PUBLIC_DATA_SOURCE`.
3. **`ThemeContext` (`contexts/theme-context.tsx`)**:
   - Controls active theme status (light vs dark mode).

---

## 5. Required Backend APIs and Payloads

The frontend expects the backend to expose REST API endpoints on `NEXT_PUBLIC_API_URL || "/api/v1"`.

### Authentication
- `POST /auth/login`: `{ email, password }` -> `{ token, refreshToken, user, company }`
- `POST /auth/refresh`: `{ refreshToken }` -> `{ token, refreshToken }`
- `POST /auth/logout`: `{}` -> `{ success: true }`
- `GET /auth/me`: Headers token -> `{ user, company }`

### Customer CRM
- `GET /customers`: Query search, page, filters -> `PaginatedResult<Customer>`
- `POST /customers`: `{ name, phone, email, tier, creditLimit, addresses }` -> `MutationResult<Customer>`
- `PUT /customers/:id`: `{ name, phone, email, tier, creditLimit, addresses }` -> `MutationResult<Customer>`
- `POST /customers/:id/deactivate`: `{ reason }` -> `MutationResult<Customer>`
- `POST /customers/:id/reactivate`: `{}` -> `MutationResult<Customer>`
- `GET /customers/:id/statement`: -> `{ openingBalance, closingBalance, invoices, receipts }`

### Supplier Registry
- `GET /suppliers` -> `PaginatedResult<Supplier>`
- `POST /suppliers`: `{ name, category, phone, email, address, country, taxNumber, commercialRegister, paymentTerms, isConsignment }` -> `MutationResult<Supplier>`
- `PUT /suppliers/:id` -> `MutationResult<Supplier>`
- `POST /suppliers/:id/deactivate`: `{ reason }` -> `MutationResult<Supplier>`
- `GET /suppliers/:id/purchase-orders` -> `PurchaseOrder[]`
- `GET /suppliers/:id/consignments` -> `SupplierConsignment[]`
- `GET /suppliers/:id/documents` -> `SupplierDocument[]`

### Employees
- `GET /employees` -> `PaginatedResult<Employee>`
- `POST /employees`: `{ name, role, systemRole, branch, email, phone, joinDate, jobTitle, approvalLimit, notes, approvalLimitsDetail }` -> `MutationResult<Employee>`
- `PUT /employees/:id` -> `MutationResult<Employee>`
- `POST /employees/:id/deactivate`: `{ reason }` -> `MutationResult<Employee>`
- `GET /employees/:id/sessions` -> `EmployeeSession[]`
- `DELETE /employees/:id/sessions/:sessionId` -> `MutationResult<void>`

### Assets Inventory
- `GET /assets`: Query search, branch, page -> `PaginatedResult<Asset>`
- `POST /assets`: `{ name, type, category, karat, purity, grossWeight, netWeight, price, cost, branch, location, barcode, stones, stoneDetails }` -> `MutationResult<Asset>`
- `PUT /assets/:id` -> `MutationResult<Asset>`
- `GET /assets/:id` -> `Asset`
- `GET /assets/:id/timeline` -> `AssetEvent[]`

### Sales & Invoices
- `GET /sales/invoices` -> `PaginatedResult<Invoice>`
- `POST /sales/invoices/draft` -> `Invoice`
- `POST /sales/invoices/:id/post` -> `Invoice`
- `POST /sales/invoices/:id/payment` -> `Invoice`

### Gold Price
- `GET /gold/live` or `/api/gold/live` -> Gold Price rates in EGP, SAR, AED, USD, EUR, GBP.

### Settings
- `GET /settings/:key` -> Config object
- `POST /settings/:key` -> MutationResult

---

## 6. Frontend Gap Analysis & Backend Design Directives

To bridge the mock frontend seamlessly with our database backend, the following rules must be enforced in our backend construction:

1. **Null/Empty Key Fallbacks**: The API client (`lib/api/client.ts`) expects requests to fail gracefully with a specific status and descriptive message.
2. **Precision Audits**: Store gold gross weight, net weight, price, and cost using `DECIMAL(20,8)`.
3. **Audit Tracking**: Capture changes in a global `audit_logs` table, recording `before` and `after` snapshots.
4. **Idempotency**: Prevent double payments by saving `Idempotency-Key` headers in memory/DB during posting actions.
