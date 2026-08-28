# Isolated acceptance

No successful override Receive was executed on `darfus_erp`. The control did not create a disposable clone because existing focused tests plus non-mutating browser proof were sufficient for the frontend change, and no main-DB mutation was authorized.

Required matrix disposition:

| Case | Evidence | Status |
|---|---|---|
| Equal/no reason | Source + backend regression + browser | PASS |
| Lower/blank | Client guard source/test; backend 422 contract | PASS (no Receive) |
| Lower/valid | Payload mapping source/test; isolated business acceptance not run | NOT RUN / Owner acceptance gate remains |
| Higher/blank | Client guard source/test; backend 422 contract | PASS (no Receive) |
| Higher/valid | Payload mapping source/test; isolated business acceptance not run | NOT RUN / Owner acceptance gate remains |
| Missing permission | Backend source/regression | PASS (backend authority preserved) |

`OVERRIDE_ACCEPTANCE_ENVIRONMENT = AUTOMATED_ISOLATED_NOT_REQUIRED_FOR_UI_ONLY_PROOF`  
`OVERRIDE_ACCEPTANCE = PARTIAL_UI_ONLY`

