# Gift Voucher Official AED 1000 — Preflight

Control: `DARFUS-GIFT-VOUCHER-OFFICIAL-END-TO-END-ACCEPTANCE-1000-01`

- Official database identity was verified as `darfus_erp` with `current_database()` / `current_user`.
- Runtime was the normal local backend on port 8000, connected to `darfus_erp`; health, DB, and Redis endpoints returned HTTP 200.
- Current company: Gold ERP, AED. Branch: Branch-1 (`BRA-1787464306683`).
- Financial resolver readiness: one valid branch Treasury mapping and one valid `GIFT_VOUCHER_LIABILITY` mapping to account 2400.
- Tax authority: company-configured Tax Center rate 14%; no Tax setting was changed.
- Official DB mutation was authorized for exactly one AED 1000 purchased voucher, one activation, and one POS checkout. No additional business action was authorized.
- Cash register preflight reported CLOSED through the read-only register endpoint, so the supported Card remainder method was selected.
- Fresh backup was completed and verified before mutation. No migration, seed, cleanup, or production action was performed.

Result: `PREFLIGHT = PASS`.
