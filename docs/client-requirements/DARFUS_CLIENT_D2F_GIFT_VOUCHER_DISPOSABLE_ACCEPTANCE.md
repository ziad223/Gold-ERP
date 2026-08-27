# D2F Gate A Re-Entry — Disposable Acceptance

## Gate status

`DISPOSABLE_ACCEPTANCE = NOT_RUN_GATE_A_FINANCIAL_BLOCKED`

No disposable clone was created and no synthetic Voucher was inserted. This is intentional: the current control stops before implementation/runtime mutation when Tax Treatment and Accounting/Liability authority are not proven.

## Deferred acceptance matrix

| Scenario | Required evidence | Status |
|---|---|---|
| GV-A01 stable identity | immutable id, number/code mapping | Not run |
| GV-A02 code uniqueness | duplicate rejected at DB/service boundary | Not run; schema is currently non-unique |
| GV-A03 code immutability | update rejected/audited | Not run |
| GV-A04 issuance | one issuance event and financial posting | Not run; route disabled |
| GV-A05 activation | policy-backed state transition | Not run |
| GV-A06 invalid activation | fail-closed transition | Not run |
| GV-A07 anonymous ownership | issue without customer where allowed | Not run |
| GV-A08 branch eligibility | canonical branch restriction | Not run; current branch is text |
| GV-A09 currency | mismatch rejected | Not run; authority missing |
| GV-A10 value invariants | fixed value/full balance | Not run |
| GV-A11 full redemption | no partial redemption | Not run |
| GV-A12 duplicate redemption | second use rejected | Not run |
| GV-A13-A15 failed atomicity | voucher/accounting/treasury unchanged | Not run |
| GV-A16 successful redemption | exact final state and posting | Not run |
| GV-A17 lifecycle protection | final state immutable | Not run |
| GV-A18 tax authority | Tax Engine invocation/no manual VAT | Blocked by treatment |
| GV-A19 audit | actor/employee/action/state/time | Not run |
| GV-A20 permissions | fail-closed route coverage | Not run |
| GV-A21 print | eligibility and voucher layout | Not run |
| GV-A22-A23 reprint | same identity and audit | Not run |
| GV-A24 projection | source-backed read model | Not run; registry inactive |
| GV-A25 labels | no raw internal IDs as primary labels | Not run |

## Safety

- Official DB writes: `0`.
- Clone writes: `0`.
- Migrations: `0`.
- Business transactions: `0`.
- Print/reprint mutations: `0`.
- No retry or automatic Gate B start.
