# DARFUS — Technical Decisions Log

## TD-001: `inventory-columns` excluded from the audit chain (P2.1, approved 2026-06-19)

The `PUT /settings/by-key/:key` route audits settings mutations via
`auditService.record`, EXCEPT keys in `SETTINGS_AUDIT_EXCLUDED_KEYS`
(currently `inventory-columns`).

**Rationale**
- `inventory-columns` is a **UI view preference** (which table columns are
  visible), saved on every checkbox toggle. Auditing each toggle would flood
  the tamper-evident financial audit chain with high-volume, low-value rows.
- It has **low audit value**: no financial, security, or sensitive operational
  meaning.

**Guarantees / scope limits**
- This exclusion is **NOT** used to hide any financial, security, or sensitive
  operational change. It is scoped to a single, explicitly-listed view-pref key.
- All operational settings (VAT, currency, payment methods, barcode print
  config, gold prices, company profile, …) remain fully audited.

**Future improvement (preferred)**
- Move column visibility to **user-level** preferences (out of company settings).
- Or audit only **preset changes** (compact/detailed/sales/warehouse), not every
  individual checkbox toggle.

---

## TD-002: `gold_prices` is not tenant-scoped yet — deferred to P2.3 (noted 2026-06-19)

The `gold_prices` table currently has no `companyId` and no `source` column
(every row is an implicit manual fixing; the latest row per karat wins). This is
accepted as a **foundation** for now (the live company is single-tenant CMP-DEMO),
but it MUST be addressed before production or multi-tenant use.

**P2.3 (deferred — do NOT implement yet):**
- Add `companyId` to `gold_prices` (additive, backfill existing rows to CMP-DEMO).
- Add `source` (`manual` | `live`) column.
- Add optional `branchId`.
- Make all gold-price queries tenant-safe (scope by `companyId`), incl.
  `effectiveKaratPrice`, `GET/POST /gold/karat-prices`.

Additive migration only; no data reset; gated approval before any write.

---

## TD-003: `Invoice.type` enum is missing `installment` — follow-up before installment testing (found in P4.1a, 2026-06-19)

`backend/src/routes/erp.routes.js` `/pos/checkout` (~line 311) sets
`type: paymentMethod === "installment" ? "installment" : …`, but the
`Invoice.type` ENUM is `("sale","return","exchange","deposit","repair")` —
**`installment` is not a valid value**. An installment POS sale would therefore
hit a Postgres "invalid input value for enum" error and roll back.

**Status:** RESOLVED (TD-003 preflight, commit `align invoice type enum with checkout flows`).
- Migration `20260619070000-add-invoice-type-installment.js`:
  `ALTER TYPE "enum_invoices_type" ADD VALUE IF NOT EXISTS 'installment'` (additive).
- `invoice.model.js` type enum now includes `installment`.
- No checkout/posting/reports logic changed. Verified by `scripts/verify-invoice-type.js`.

**Side note (documented, NOT changed):** the DB `enum_invoices_type` also carries a
legacy value **`giftVoucher`** (from an earlier migration). NO route creates an
invoice with that type (the `/gift-vouchers/issue` route writes a `GiftVoucher`
model, not an Invoice), so it is intentionally left OUT of the model enum. If a
gift-voucher-as-invoice flow is ever added, add it to the model then.
