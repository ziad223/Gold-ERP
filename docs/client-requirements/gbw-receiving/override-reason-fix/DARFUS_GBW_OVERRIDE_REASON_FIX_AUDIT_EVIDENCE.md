# Audit evidence

The backend records successful override evidence through `auditService.record` with reference rate, approved rate, reason, actor, company, branch, permission, and operator reason (`erp.routes.js:9034–9061`). Current official DB read-only query found zero `supplier_purchase_rate.override` audit rows at inspection time. No successful override was created by this control.

`OVERRIDE_AUDIT_EVIDENCE = PASS_OR_DOCUMENTED_NOT_EXPOSED`

