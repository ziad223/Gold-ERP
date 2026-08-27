# DARFUS GV Financial Mapping — Read-First Record

Control: `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-AUTHORITY-RECOVERY-01`
Mode: `READ_FIRST_PLUS_FINANCIAL_AUTHORITY_FORENSIC_AND_SAFE_RECOVERY_DESIGN`

## Scope and safety

- The failed official issue request was not replayed.
- No source, test, migration, configuration, master-data, or database record was changed.
- `darfus_erp` was inspected read-only and verified with `current_database()`.
- The prior HTTP 422 is preserved as evidence: `FINANCIAL_MAPPING_REQUIRED`, request `ded2e4a2-4e74-4abf-a3fa-dc59d5becc50`.

## Authority order

1. Frozen purchased Gift Voucher contract: debit resolved Treasury; credit resolved `GIFT_VOUCHER_LIABILITY`; Revenue and Output VAT are zero.
2. Current resolver and posting implementation.
3. Official DB state.
4. Previous reports as supporting evidence only.

## Read sources

The current resolver, financial catalog, compatibility checks, bootstrap/readiness services, Gift Voucher service, posting service, settings/tax policy, UAE tax engine, transaction tax context, sales service, ERP routes, idempotency service, relevant models, prior runtime/financial/tax/DB-delta reports, and all six required registers were read before this record was prepared.

## Initial conclusion

The canonical issue path resolves both required financial authorities before creating a Voucher. Branch Treasury mapping is present and unique. The required semantic role `GIFT_VOUCHER_LIABILITY` is absent in the official DB, so the route fails closed before persistence. The configured company VAT setting is `14%`, while tax-engine legal metadata identifies `5%`; the current policy has no stored effective date. This makes the Tax Authority ambiguous and requires Owner policy decision before any financial mapping recovery.

## Required next authorization

Only after the Tax Authority is frozen and a disposable clone is authorized may the missing semantic role be provisioned through the approved application/bootstrap path and a controlled proof be run. No official DB write is authorized by this control.

