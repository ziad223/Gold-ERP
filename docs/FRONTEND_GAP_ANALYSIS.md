# DARFUS Jewellery ERP — Frontend Gap Analysis
> Audit Date: 2026-06-14 | Auditor: Antigravity AI | Version: 2.0.0

---

## 1. Project Root Identification

| Item | Value |
|---|---|
| **Active Root** | `c:\Users\NEGM\Desktop\jewellery-erp-master\` |
| **Nested Legacy** | `jewellery-erp-master\jewellery-erp-master\` (DO NOT TOUCH) |
| **Framework** | Next.js 16.2.9 + TypeScript 5.7.2 + Tailwind CSS 3.4 |
| **i18n** | next-intl 4.8.4 |
| **State** | React Context + TanStack Query 5.66 |
| **Forms** | react-hook-form 7.54.2 + zod 3.24.1 (installed, barely used) |
| **Tests** | Playwright 1.51.1 (visual regression only) |
| **Data Mode** | Mock/LocalStorage (NEXT_PUBLIC_DATA_SOURCE=mock) |

---

## 2. Existing Routes Audit

| Route | File | Status |
|---|---|---|
| `/[locale]/login` | `login/page.tsx` | ✅ Working |
| `/[locale]/signup` | `signup/page.tsx` | ✅ Working (4-step) |
| `/[locale]/dashboard` | `dashboard/page.tsx` | 🟡 Partial — static mock data, no date filter, no branch filter |
| `/[locale]/pos` | `pos/page.tsx` | 🟡 Partial — basic cart works, missing: barcode scanner UI, RFID, draft save, return/exchange/repair |
| `/[locale]/inventory` | `inventory/page.tsx` | 🟡 Partial — list+add works, missing: transfers, adjustments, RFID audit, stock count |
| `/[locale]/inventory/[id]` | `inventory/[id]/page.tsx` | 🟡 Partial — details+timeline+lineage shown, actions work locally but cause **Direct Mutation** bug |
| `/[locale]/inventory/manufacturing` | `manufacturing/page.tsx` | ❓ Unknown — file exists but not inspected |
| `/[locale]/sales` | `sales/page.tsx` | 🟡 Partial — list+view modal, missing: full return flow, exchange flow |
| `/[locale]/sales/returns` | `returns/page.tsx` | ❓ Route linked in UI, file not verified |
| `/[locale]/sales/exchanges` | `exchanges/page.tsx` | ❓ Route linked in UI, file not verified |
| `/[locale]/sales/reservations` | `reservations/page.tsx` | ❓ Route linked in UI, file not verified |
| `/[locale]/sales/customer-gold` | `customer-gold/page.tsx` | ❓ Route linked in UI, file not verified |
| `/[locale]/customers` | `customers/page.tsx` | 🟡 Partial — list+add works, missing: profile page, history, statements |
| `/[locale]/suppliers` | `suppliers/page.tsx` | 🟡 Partial — list+add works, missing: purchase orders, consignment |
| `/[locale]/suppliers/purchases` | `purchases/page.tsx` | ❓ Route linked in UI, file not verified |
| `/[locale]/employees` | `employees/page.tsx` | 🟡 Partial — list+add works, missing: profile, permissions detail |
| `/[locale]/accounting` | `accounting/page.tsx` | 🟡 Partial — journal list only, missing: chart of accounts, P&L, balance sheet, VAT, period close |
| `/[locale]/reports` | `reports/page.tsx` | 🟡 Partial — catalog with static data, export is dummy |
| `/[locale]/reports/exports` | `exports/page.tsx` | ❓ Route linked in UI, file not verified |
| `/[locale]/audit` | `audit/page.tsx` | 🟡 Partial — static hardcoded logs, no real data |
| `/[locale]/approvals` | `approvals/page.tsx` | ❓ Route exists in nav, file not verified |
| `/[locale]/settings` | `settings/page.tsx` | 🟡 Partial — basic company profile + 4 lists, missing: roles/permissions editor, workflows |

---

## 3. Critical Bugs Found

### 🔴 BUG-001: Direct State Mutation in `use-asset-query.ts`
**File:** `features/assets/hooks/use-asset-query.ts` lines 83–92  
**Problem:** `target.events = [...]` and `target.status = "..."` are **direct mutations** of objects from React state.  
This breaks immutability, causes silent bugs, and bypasses React's re-render cycle.  
**Fix Required:** Use `ErpContext` `updateAsset` action with proper immutable update.

### 🔴 BUG-002: Missing `updateAsset` in ErpContext
**File:** `contexts/erp-context.tsx`  
**Problem:** No `updateAsset`, `updateCustomer`, `updateSupplier` methods exist. Only `add*` methods.  
Actions triggered in `useAssetQuery` have no proper way to persist changes.  
**Fix Required:** Add `updateAsset`, `updateCustomer`, `updateSupplier` with immutable updates.

### 🟠 BUG-003: `apiClient` called directly in `use-assets.ts`
**File:** `features/assets/hooks/use-assets.ts` line 26  
`queryFn: () => apiClient(...)` will **throw** if `NEXT_PUBLIC_API_URL` is not set.  
Currently it's behind `enabled: dataSource === "api"` which protects it — but this is fragile.  
**Fix Required:** Add try/catch or graceful fallback.

### 🟠 BUG-004: `use-asset-query.ts` — `triggerAction` returns `target` but doesn't persist
The function mutates the mock object directly without calling any context updater.  
The change appears to work in the same session but is lost on page reload.  
**Fix Required:** Dispatch to ErpContext after mock action.

### 🟡 BUG-005: `use-assets.ts` filters by `activeBranch` but mock data shows all assets
Mock data has different branches (`فرع دبي مول`, `فرع أبوظبي`, etc.) while default `activeBranch` is `"Main Branch"` — so filtering returns 0 results for new users.  
**Fix Required:** Seed `activeBranch` from the first asset's branch or use "all" as default.

### 🟡 BUG-006: Hard-coded RTL strings in components
Several components use raw `rtl ? "..." : "..."` instead of `t("key")`.  
Examples: `inventory/[id]/page.tsx` lines 97–121, `pos/page.tsx` line 353.  
**Fix Required:** Move all strings to `messages/ar.json` and `messages/en.json`.

### 🟡 BUG-007: `approvals/page.tsx` and other sub-routes — unknown state
Routes linked from sidebar navigation and page buttons but content is unverified.

---

## 4. Missing Features by Domain

### 4.1 Dashboard
| Feature | Status |
|---|---|
| Date range filter | ❌ Missing |
| Branch filter | ❌ Missing |
| Gold price widget — updatable | ❌ Static hardcoded |
| Pending approvals widget | ❌ Static |
| Low stock alerts — real data | ❌ Static |
| Reserved assets widget | ❌ Static |
| Recent activity feed | ❌ Missing |
| Responsive mobile layout | 🟡 Partial |
| Role-based KPI visibility | ❌ Missing |

### 4.2 POS
| Feature | Status |
|---|---|
| Barcode text input (simulation) | ❌ Missing — only search |
| RFID scan simulation | ❌ Missing |
| Draft save / Resume draft | ❌ Missing |
| Return simulation | ❌ Missing |
| Exchange simulation | ❌ Missing |
| Repair intake | ❌ Missing |
| Gold purchase from customer | ❌ Missing |
| Split payment | ❌ Missing |
| Deposit / Reservation | ❌ Missing |
| Gift voucher | ❌ Missing |
| Installment preview | ❌ Missing |
| Discount field | ❌ Missing |
| Making charge field | ❌ Missing |
| Stone value field | ❌ Missing |
| Tax preview label | 🟡 Static label only |
| Receipt print preview | ❌ Missing |
| Keyboard shortcuts | ❌ Missing |
| Confirmation dialog before post | ❌ Missing |
| Double-submit prevention | ❌ Missing (isPosting exists but no UI lock) |

### 4.3 Inventory / Assets
| Feature | Status |
|---|---|
| Asset detail: cost field (permission-gated) | ❌ Missing |
| Asset detail: stones/pearls detail | ❌ Missing |
| Asset detail: source document link | ❌ Missing |
| Asset detail: attachments UI | ❌ Missing |
| Asset detail: certificate UI | ❌ Missing |
| Asset detail: notes | ❌ Missing |
| Transfers management page | ❌ Missing |
| Transfer status steps UI | ❌ Missing |
| Inventory adjustments | ❌ Missing |
| Stock count / RFID audit | ❌ Missing |
| Variance resolution UI | ❌ Missing |
| Returned inventory list | ❌ Missing |
| Sold archive | ❌ Missing |
| Bulk selection + bulk actions | ❌ Missing |
| Grid view toggle | ❌ Missing |
| Manufacturing page | ❓ Unverified |

### 4.4 Asset Timeline
| Feature | Status |
|---|---|
| Event type | 🟡 Basic string only |
| Actor | 🟡 Basic string only |
| Device | ❌ Missing |
| Reason | ❌ Missing |
| Source document | ❌ Missing |
| Before state | ❌ Missing |
| After state | ❌ Missing |
| Correlation ID | ❌ Missing |

### 4.5 Asset Lineage
| Feature | Status |
|---|---|
| One-to-one | 🟡 Basic |
| One-to-many | ❌ Missing |
| Many-to-one | ❌ Missing |
| Contribution weight | ❌ Missing |
| Process loss | ❌ Missing |
| Visual graph (actual nodes) | 🟡 Minimal |

### 4.6 Customers
| Feature | Status |
|---|---|
| Customer profile page | ❌ Missing |
| Sales history per customer | ❌ Missing |
| Returns history | ❌ Missing |
| Reservations per customer | ❌ Missing |
| Repairs per customer | ❌ Missing |
| Customer gold history | ❌ Missing |
| Loyalty points preview | ❌ Missing |
| Account statement preview | ❌ Missing |
| KYC status UI | ❌ Missing |
| AML flags UI | ❌ Missing |
| Attachments UI | ❌ Missing |
| Receivable summary | ❌ Missing |
| Credit limit UI | ❌ Missing |

### 4.7 Suppliers
| Feature | Status |
|---|---|
| Supplier profile page | ❌ Missing |
| Purchase history | ❌ Missing |
| Consignment UI | ❌ Missing |
| Reverse charge UI | ❌ Missing |
| Balances per supplier | ❌ Missing |
| Documents UI | ❌ Missing |

### 4.8 Employees
| Feature | Status |
|---|---|
| Employee profile page | ❌ Missing |
| Permission summary per employee | ❌ Missing |
| Activity preview | ❌ Missing |
| Deactivate flow | ❌ Missing |
| Approval limit UI | ❌ Missing |

### 4.9 Accounting
| Feature | Status |
|---|---|
| Chart of accounts UI | ❌ Missing |
| Journal form with debit/credit lines | ❌ Missing |
| Balanced journal validation (Frontend) | ❌ Missing |
| Trial balance UI | ❌ Missing |
| General ledger UI | ❌ Missing |
| P&L UI | ❌ Missing |
| Balance sheet UI | ❌ Missing |
| VAT report UI | ❌ Missing |
| Period close UI | ❌ Missing |
| Customer ledger | ❌ Missing |
| Supplier ledger | ❌ Missing |

### 4.10 Manufacturing
| File | Status |
|---|---|
| Manufacturing order form | ❓ Unverified |
| Input/output assets | ❓ Unverified |
| Process loss tracking | ❓ Unverified |
| Status flow | ❓ Unverified |
| Lineage preview | ❓ Unverified |

### 4.11 CGP / IGP (Gold Pools)
| Feature | Status |
|---|---|
| Customer Gold Pool list | ❌ Missing |
| IGP list | ❌ Missing |
| Pool balances | ❌ Missing |
| Transfer request UI | ❌ Missing |
| Approval UI | ❌ Missing |
| Conversion preview | ❌ Missing |
| Purity/weight details | ❌ Missing |

### 4.12 Reports
| Feature | Status |
|---|---|
| Real data in report preview | ❌ Static dummy |
| CSV export from real local data | ❌ Dummy data |
| XLSX export | ❌ Missing |
| PDF print view | ❌ Missing |
| Saved filters | ❌ Missing |
| Favorites | ❌ Missing |
| Role-based access per report | ❌ Missing |
| Cost/margin masking | ❌ Missing |
| Branch comparison | ❌ Missing |
| Date range filter | ❌ Missing |

### 4.13 Audit
| Feature | Status |
|---|---|
| Real audit data from context | ❌ Static hardcoded |
| Severity field | ❌ Missing |
| Device field | ❌ Missing |
| Correlation ID | ❌ Missing |
| Export from local data | ❌ Missing |
| Source document reference | ❌ Missing |

### 4.14 Settings
| Feature | Status |
|---|---|
| Asset types with karat config | 🟡 Basic list only |
| Status transitions editor | ❌ Missing |
| Roles and permissions editor | ❌ Missing (3 static info cards) |
| Workflows editor | ❌ Missing |
| Approval thresholds | ❌ Missing |
| Tax rates config | ❌ Missing |
| Currency and rounding | ❌ Missing |
| Barcode format settings | ❌ Missing |
| Invoice templates | ❌ Missing |
| Language settings | ❌ Missing |
| Timezone settings | ❌ Missing |

---

## 5. State Management Issues

| Issue | Severity |
|---|---|
| Direct mutation in `useAssetQuery.triggerAction` | 🔴 Critical |
| Missing `updateAsset` in ErpContext | 🔴 Critical |
| No versioning on localStorage schema | 🟠 High |
| No migration for old localStorage data | 🟠 High |
| No `employees` or `approvals` in ErpContext | 🟠 High |
| No `journals` in ErpContext (uses separate localStorage key) | 🟡 Medium |
| No audit trail context | 🟡 Medium |
| No optimistic UI rollback mechanism | 🟡 Medium |

---

## 6. Permission System Issues

| Issue | Status |
|---|---|
| `PermissionGate` component exists | ✅ |
| `SensitiveValue` component exists | ✅ |
| `usePermissions` hook exists | ✅ |
| `ROLE_PERMISSIONS` table exists | ✅ |
| Route guards applied | ✅ Auth guard exists |
| Action guards on POS buttons | ❌ Missing |
| Permission check on "Melt Asset" | ❌ Missing |
| Permission check on "View Cost" in asset detail | 🟡 SensitiveValue used in inventory list only |
| Manager-only approval actions | ❌ Missing |
| Permission denied page | ❌ Missing |
| Permission denied modal | ❌ Missing |

---

## 7. Validation Issues

| Form | Validation Status |
|---|---|
| Login | ✅ Basic required |
| Signup | ✅ Multi-step with validation |
| Add Asset | 🟡 Basic required only, no numeric precision |
| Add Customer | 🟡 Basic required, no phone format |
| Add Supplier | 🟡 Basic required |
| Add Employee | 🟡 Basic required |
| Add Journal Entry | 🟡 Basic, no debit/credit balance check |
| POS Checkout | 🟡 Cart must not be empty, no payment total check |
| Transfer Form | 🟡 Branch required only |

---

## 8. Translation Issues

| Issue | Status |
|---|---|
| Hard-coded Arabic strings in `inventory/[id]/page.tsx` | ❌ |
| Hard-coded RTL strings in `pos/page.tsx` | ❌ |
| Hard-coded strings in `AssetLineageGraph.tsx` | ❌ |
| Hard-coded strings in `AuditDiffViewer.tsx` | ❌ |
| Missing keys for new features to be added | ❌ |
| `ar.json` and `en.json` generally well-structured | ✅ |
| RTL layout via `dir="rtl"` from next-intl | ✅ |

---

## 9. Test Coverage

| Test Type | Status |
|---|---|
| Unit tests (formatters, validators) | ❌ None |
| Component tests | ❌ None |
| E2E: Login | ✅ Visual regression |
| E2E: Dashboard | ✅ Visual regression |
| E2E: POS flow | ❌ None |
| E2E: Asset CRUD | ❌ None |
| E2E: RTL/LTR | 🟡 Visual only (no interaction) |
| E2E: Mobile responsive | ❌ None |
| E2E: Permission denial | ❌ None |

---

## 10. Summary Score

| Category | Score | Notes |
|---|---|---|
| Auth / Login | 9/10 | Near complete |
| Dashboard | 4/10 | Static data, missing filters |
| POS | 4/10 | Basic cart only |
| Inventory List | 6/10 | List+add works |
| Asset Details | 5/10 | Critical mutation bug |
| Asset Timeline | 4/10 | Basic fields only |
| Asset Lineage | 3/10 | Minimal |
| Sales | 5/10 | List+view only |
| Customers | 3/10 | List+add only |
| Suppliers | 3/10 | List+add only |
| Employees | 3/10 | List+add only |
| Accounting | 2/10 | Journal list only |
| Manufacturing | ❓ | Unverified |
| CGP/IGP | 0/10 | Not started |
| Reports | 2/10 | Static dummy |
| Audit | 2/10 | Static hardcoded |
| Settings | 3/10 | Basic lists only |
| Permissions | 4/10 | System exists, not applied |
| Validation | 3/10 | Basic only |
| Tests | 2/10 | Visual regression only |
| **OVERALL** | **~3.5/10** | Significant work needed |
