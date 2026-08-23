# P5 — Accounting by Karat — Discovery & Implementation Plan (P5.0)
> Discovery + design ONLY. No operational code changed in P5.0.
> Date: 2026-06-20.

## 1. Current posting architecture
`backend/src/services/posting.service.js` is a self-healing double-entry engine:
- A hardcoded **canonical CHART** (code → {name, type, nature, level, parent}).
- `ensureAccount(companyId, code, t)` resolves an account by code, **auto-creating
  it from the CHART if missing** (id `ACC-<code>-<companyId>`). No seeders needed.
- `postEntry(companyId, opts, lines)` writes a balanced JournalEntry + JournalLines
  and `increment`s each account's running `balance` (delta by `nature`). Rejects
  unbalanced/empty entries. Linked via `sourceType`/`sourceId`.
- Builders: `postInvoiceEntry`, `postReturnEntry`, `postDepositEntry`,
  `postVoucherIssue/Redeem`, `postInstallmentPayment`, `postCashEntry`,
  `postPayrollEntry`, `postPurchaseEntry`.

## 2. Accounts used by sale / purchase (current)
**SALE** (`postInvoiceEntry`):
```
Dr  1110 Cash / 1120 Bank / 1300 AR     total (incl VAT)   ← by method/status
Cr  4100 Jewelry Sales                  subtotal (net of VAT)
Cr  2200 VAT Payable                    tax
Dr  5000 COGS                           cost   (sum of item.cost*qty)
Cr  1200 Inventory                      cost
```
**RETURN** (`postReturnEntry`): mirror of the above (4100/2200 Dr, 1110 Cr, 1200 Dr, 5000 Cr).
**PURCHASE RECEIVE** (`postPurchaseEntry`):
```
Dr  1200 Inventory          total
Cr  1110/1120 Cash/Bank      paid
Cr  2100 Accounts Payable    payable (remainder)
```

Relevant CHART codes: `1200` Inventory (ONE), `5000` COGS (ONE), `4100` Jewelry
Sales (ONE), `2200` VAT, `1110/1120/1300/2100`.

## 3. Hardcoded vs configurable
- **Hardcoded** in the CHART (code-level). NOT settings-driven. No `account_mappings`
  table, no karat→account map anywhere. `Account` model has code/type/nature/parent
  (no `category`). No account seeders (all auto-created on first use).

## 4. Is karat available where needed?
| point | karat? |
|---|---|
| `invoice_items.karat` | ✅ yes (INTEGER) — passed to postInvoiceEntry at checkout & post-draft |
| `products.karat` | ✅ yes |
| `assets.karat` | ✅ yes |
| `purchase_order_items` | ❌ no column — BUT the receive route's `normalizedItems` carry `karat`+`cost` at posting time (not currently passed to postPurchaseEntry) |
| `stock_movements` | ❌ no column (derivable from product/asset) |
| `postInvoiceEntry(invoice, items)` | ✅ items have karat + cost + price |
| `postPurchaseEntry(purchaseOrder, …)` | ❌ receives PO HEADER only — NO items → must pass items to split |

So: **sales/returns can split by karat today** (items available). **Purchase needs the
items passed** to postPurchaseEntry. Old `stock_movements`/`purchase_order_items` lack
karat but that doesn't block posting (karat is read from the live item at post time).

## 5. Gap analysis
- ONE Inventory (1200), ONE COGS (5000), ONE Revenue (4100) → no karat granularity.
- COGS/Inventory lines aggregate `cost` across ALL items (single line each).
- Revenue is a single subtotal line (no per-item/karat allocation).
- Purchase posting can't split (no items passed).
- No mapping layer + no activation flag + no fallback rule.

## 6. Proposed account mapping design
**Recommended: extend the CHART with per-karat sub-accounts under the existing
parents + a deterministic `karatAccounts(karat)` helper with fallback.** This needs
**NO migration and NO new table** (accounts auto-create via ensureAccount), and old
reports that read the parent still roll up via `parentId`.

Proposed codes (sub-accounts; parent in brackets):
| karat | Inventory [1200] | COGS [5000] | Revenue [4100] |
|---|---|---|---|
| 18K | 1210 | 5010 | 4110 |
| 21K | 1211 | 5011 | 4111 |
| 22K | 1212 | 5012 | 4112 |
| 24K | 1213 | 5013 | 4113 |
| Other/non-gold | 1219 | 5019 | 4119 |

VAT (`2200`), cash/bank/AR/AP unchanged.

`karatAccounts(karat)` → `{ inventory, cogs, revenue }`, mapping 18/21/22/24 to the
codes above, everything else (incl. null, diamonds/watches) → the `*9` "Other" codes.

**Mapping storage options (pick in P5.1):**
- (A) **CHART extension + helper** — recommended. No migration, self-healing.
- (B) Optional `settings` key `accountingKaratAccounts` to OVERRIDE the default map
  per company (key/value JSONB, no migration). Layer on top of (A) later if needed.
- (C) Dedicated `account_mappings` table (karat, inventoryAccountId, cogsAccountId,
  revenueAccountId, companyId, fallback) — most flexible but needs a migration + UI.
  Defer unless multi-scheme mapping is actually required.

**Activation flag (critical):** `settings.accountingByKarat` (default **false**). When
OFF → posting uses today's single accounts (ZERO change). When ON → split by karat.
Safe, gated rollout; historical entries untouched.

**Fallback (must not break a sale):** if karat is null/unknown OR an override is
missing → use the `*9` "Other" sub-account (or, if karat accounting is off, the parent
1200/5000/4100). Optionally log an audit/warning. Rounding remainder on revenue
allocation goes to the last karat group so the entry always balances.

## 7. Do we need a migration?
- **Recommended path (A): NO migration.** CHART extension + helper + settings flag
  (settings is key/value JSONB). Accounts auto-create on first karat post.
- Only path (C) (dedicated mapping table) needs an additive migration. Not recommended
  for the foundation.

## 8. Phased implementation
### P5.1 — Account mapping foundation (no posting change)
- Extend CHART with the per-karat sub-accounts (additive).
- Add `karatAccounts(karat)` helper + `accountingByKarat` settings flag (default false).
- **Acceptance:** flag off → posting byte-identical to today; sub-accounts resolvable;
  helper unit-tested; no migration; tsc green.

### P5.2 — Sales/return posting by karat (behind the flag)
- When flag ON: group `items` by karat; emit per-karat COGS+Inventory lines (cost) and
  per-karat Revenue lines (allocate subtotal by item net-price share; last group absorbs
  rounding). VAT + cash/AR lines unchanged. Fallback to "Other". Mirror in postReturnEntry.
- **Acceptance:** entry still balanced; flag off unchanged; mixed-karat invoice splits
  correctly; null-karat → Other; sum of per-karat lines == old single line; E2E + reversal.

### P5.3 — Purchase receive posting by karat
- Pass the receive route's normalized items (karat+cost) to `postPurchaseEntry`; debit
  per-karat Inventory; cash/AP unchanged. Fallback to Other. Flag-gated.
- **Acceptance:** balanced; flag off unchanged; per-karat inventory debits sum to total.

### P5.4 — Inventory valuation report (read-only)
- Report grouping by karat: value-at-cost, market value (gold.service.valuationFor from
  P2.2 using current karat price), unrealized gain/loss. NO posting, NO data change.
- **Acceptance:** numbers reconcile to inventory cost; permission-gated; export parity.

### P5.5 — Optional manual revaluation (separate, gated)
- Manual, permission-based, audited revaluation JE (adjust Inventory vs a revaluation
  reserve/gain-loss account). NO automatic revaluation. Own approval before build.

## 9. Risks
- **Unbalanced entry** from revenue-allocation rounding → mitigate: last karat group
  absorbs the remainder; reuse postEntry's balance guard.
- **Reports reading 1200/5000/4100 directly** would miss sub-accounts → mitigate: keep
  sub-accounts under the parent (parentId) and have reports roll up parent+children;
  audit the accounting/report pages in P5.2.
- **Account balance integrity** — new sub-accounts start at 0; old balances stay on the
  parents. A trial-balance must sum parent+children consistently.
- **Historical data** — never auto-reclassified; karat accounting applies from activation.
- **Flag risk** — must guarantee flag-off == current behavior (regression-test it).
- Purchase: `purchase_order_items` has no karat column (not needed — karat read from the
  live normalized item at post time); a future PO-item karat column is optional.

## 10. Recommendation
Start with **P5.1** (CHART extension + `karatAccounts` helper + `accountingByKarat` flag,
default OFF) — fully additive, zero behavior change while off, no migration. It unblocks
P5.2/P5.3 behind the flag. Keep each later phase gated and reversible. No historical
reclassification without a separate, explicitly-approved phase.
