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
