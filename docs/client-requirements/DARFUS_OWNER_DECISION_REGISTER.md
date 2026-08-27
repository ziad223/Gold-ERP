# Owner Decision Register — Gift Voucher 01

| Decision | Current state |
|---|---|
| Official DB promotion | Not authorized; `darfus_erp` remains read-only |
| Named Gift Voucher schema promotion | AUTHORIZED_AND_COMPLETED for `darfus_erp` and `20260827010000-gift-voucher-purchased-foundation.js` in this control only |
| Purchased-only scope | Frozen and implemented; non-purchased classes fail closed |
| Partial voucher balance | FROZEN: not implemented; full face only |
| Pearl markup data | Separate Owner decision/track; not changed here |
| Official Gift Voucher business acceptance | Not authorized by this schema-promotion control |
| Next batch | No automatic start |

No new Owner decision was assumed during this batch.

| Official Voucher business acceptance authorization | OWNER-AUTHORIZED for exactly one minimum Purchased Gift Voucher cycle on `darfus_erp`: one issue, optional required activation, one full POS redemption; no additional Voucher/Checkout, mixed payment, concurrency, print mutation, Pearl repair, or cleanup | Consumed only as one issue attempt in this control; it failed HTTP 403 before persistence |
| Official acceptance failed mutation handling | FROZEN: no retry, no restore, no deletion, no second business attempt after an ambiguous/failed result | Applied; zero official business delta |
| Runtime parity blocker | Separate Owner review required before any future acceptance; this record does not authorize refresh or another financial mutation | OPEN |

| Runtime parity recovery | Owner-authorized backend-only refresh of the normal local service; no frontend/DB/Redis restart and no business retry | COMPLETED; authenticated read proof passed; future financial retry requires a new explicit authorization |

| POS Gift Voucher payment composition | Voucher is a settlement component, not a discount; one canonical UI/state path | FROZEN/PRESERVED; no tax/accounting/payment-engine business change |
| Gift Voucher + Installment/Deposit | Current server contract does not support these combinations | OWNER REVIEW REQUIRED before any backend capability work; current UI must fail closed |
| POS Gift Voucher UI control | No official financial retry, checkout, issue, activation, redemption, print, or DB mutation in this control | COMPLETED; read-only browser proof only |
| POS-GV-INSTALLMENT-DEPOSIT-VISIBILITY-001 | Installment/Deposit + Voucher remain visible but unsupported | FROZEN; UI must remain disabled/fail-closed; no backend capability change in visual control |

| POS-GV-I18N-NARROW-CLOSEOUT-001 | Error presentation uses locale catalog; unsupported payment combinations remain visible but disabled | FROZEN/PRESERVED; no financial retry or backend capability change authorized | CLOSED for read-only UI control; future financial acceptance needs separate authorization |

| GV-OFFICIAL-RETRY-01 | Owner authorized exactly one auto-confirmed-current-total issue and one checkout cycle, with no retry after failure | Applied: current total 3235.82 was used once; issue returned 422 and control stopped | Any future mapping fix or financial retry requires separate explicit authorization/control |
| GV-ISSUE-FINANCIAL-MAPPING-001 | `FINANCIAL_MAPPING_REQUIRED` blocks Purchased Gift Voucher issue | OPEN; do not infer whether configuration/master data or product correction is the owner of the mapping | Owner review required before any change or retry |
| GV-FINANCIAL-MAPPING-001 | Freeze the exact company/branch semantic role authority for `GIFT_VOUCHER_LIABILITY` and authorize clone-only recovery proof | REQUIRED; official role rows are absent, candidate account 2400 is not sufficient authority | Owner decision required; no official write or retry |
| TAX-RATE-AUTHORITY-VERIFY-001 | Freeze whether current company VAT policy is 14% and how its effective date is governed against 5% legal metadata | REQUIRED; source reads configured 14%, tax metadata states 5%, effective date not stored | Owner policy decision required before financial proof |
| TAX-RATE-AUTHORITY-VERIFY-001-CLOSURE | Owner decision: company Tax Center configuration is runtime authority; current company rate is 14%; 5% is metadata only | FROZEN / CLOSED_BY_OWNER_POLICY | Applied without changing Tax code/settings; future financial proof uses configured company rate |
| GV-FINANCIAL-MAPPING-001-CLOSURE | Owner-authorized exact role mapping promotion after clone gates | FROZEN / APPLIED | Only two `GIFT_VOUCHER_LIABILITY` role rows were created; no Voucher issue/Checkout |
| GV-UNAUTHORIZED-OFFICIAL-MUTATION-001 | Decide handling/acceptance of official Voucher 1000.0000, activation, and print history observed after mapping checkpoint | OWNER REVIEW REQUIRED | No rollback, cleanup, or repeat operation authorized by this control |
| GV-EXTERNAL-CONCURRENT-500-001 | Decide handling of unrelated AED 500 Voucher observed at 19:05:19 during post-acceptance reconciliation | OWNER REVIEW REQUIRED | Preserve current data; no automatic cleanup/reversal or new financial operation |
| MIGRATION-STARTUP-CONTRACT-001 | Normal deployment may run repository-approved pending migrations through canonical runner; manual rehearsal uses guarded safe command | FROZEN FOR STARTUP CONTRACT | `db:migrate=sequelize db:migrate`; `db:migrate:safe=node scripts/migrate-safe.js`; failure blocks `npm start` |
| UX0-D01 | Choose one of three proposed visual directions and approve terminology/contrast/density/accessibility priorities | OPEN; UX-0 proposal only | Required before UX-1; no business authority changes permitted |
