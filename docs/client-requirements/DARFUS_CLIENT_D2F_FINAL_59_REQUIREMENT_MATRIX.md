# D2F — Final 59-Row Requirement Recheck

Control: DARFUS-CLIENT-D2F-FULL-INVOICE-SCOPE-CLOSURE-01
Client authority: I:\WORK\client-requirements\8- Invoices Search & Print.docx

Sequential stop rule: Gate A blocked before activation, benchmark, print mutation, or final closure. The current D2 classifications are preserved as evidence; no row is relabeled as final exact parity.

| ID | Client section/page | Atomic requirement | Current D2 status | D2F status | Evidence / disposition |
|---|---|---|---|---|---|
| INV-001 | 1.1 / pp.1-2 | Invoices Search and Print is a fully read-only intelligence layer. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-002 | 1.1, 1.3 / pp.1-2 | The layer is event driven. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-003 | 1.1 / pp.1-2 | Search includes classification, filtering, reconstruction, and rendering. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-004 | 1.2 / pp.2-3 | The module operates across all Sales-domain invoice types. | PARTIAL | PARTIAL / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-005 | 1.2 / p.3 | Sales Invoice is supported. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-006 | 1.2 / p.3 | Return Invoice is supported. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-007 | 1.2 / p.3 | Exchange Invoice is supported. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-008 | 1.2 / p.3 | Installments Invoice is supported. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-009 | 1.2 / p.3 | Deposit Invoice is supported. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-010 | 1.2 / p.3 | Gift Voucher Invoice is supported. | MISSING | MISSING / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-011 | 1.2 / p.3 | Customer Gold Purchase Invoice is supported. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-012 | 1.3 / p.3 | The system is read-only and does not modify data. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-013 | 1.4 / p.3 | Search is classification, filtering, reconstruction, and rendering, not simple retrieval. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-014 | 2.1 / p.4 | One unified search model spans all invoice types. | PARTIAL | PARTIAL / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-015 | 2.2 / p.4 | Filter by Invoice Number. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-016 | 2.2 / p.4 | Filter by Customer ID. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-017 | 2.2 / p.4 | Filter by Customer Name. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-018 | 2.2 / p.4 | Filter by Date From. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-019 | 2.2 / p.4 | Filter by Date To. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-020 | 2.2 / p.4 | Filter by Branch. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-021 | 2.2 / p.4 | Filter by Employee. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-022 | 2.3 / p.5 | Invoice Type is a primary search dimension. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-023 | 2.3 / p.5 | Support Sales/Return/Exchange/Installments/Deposit types. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-024 | 2.3 / p.5 | Support Gift Voucher and Customer Gold Purchase types. | PARTIAL | PARTIAL / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-025 | 2.3 / p.5 | Support single or multi-selection of Invoice Type. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-026 | 2.4 / p.5 | Support Draft status. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-027 | 2.4 / p.5 | Support Posted status. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-028 | 2.4 / p.5 | Support Closed status. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-029 | 2.4 / p.5 | Support Cancelled status. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-030 | 2.4 / p.5 | Support Returned status. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-031 | 3.1 / p.6 | Event Store Selection precedes Invoice Type Filtering. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-032 | 3.1 / p.6 | Invoice Type Filtering precedes Date Filtering. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-033 | 3.1 / p.6 | Date Filtering precedes Entity Filtering. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-034 | 3.1 / p.6 | Entity Filtering precedes Projection Reconstruction. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-035 | 3.1 / p.6 | Projection Reconstruction precedes Result Aggregation. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-036 | 3.2 / p.6 | Type filtering occurs before reconstruction to reduce load. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-037 | 4.1 / p.7 | Results use one unified grid. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-038 | 4.2 / p.7 | Grid includes Invoice Date, Number, Type, Customer ID, Customer Name, Branch, Employee, Total Amount, Status. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-039 | 4.3 / p.7 | Each row represents one invoice. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-040 | 4.3 / p.7 | Clicking a row opens the full reconstructed invoice. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-041 | 5.1 / p.8 | Reconstruct invoices from event history. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-042 | 5.1 / p.8 | Restore full lifecycle including financial and operational data. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-043 | 6.1 / p.9 | All print outputs come from projection data only. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-044 | 6.2 / p.9 | Print Sales, Return, Exchange, Installment, Deposit. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-045 | 6.2 / p.9 | Print Gift Voucher and Customer Gold Purchase. | PARTIAL | PARTIAL / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-046 | 7.1 / p.10 | Read-only with role-based access control. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-047 | 7.2 / p.10 | All search and print operations are logged. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-048 | 7.2 / p.10 | Log User ID. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-049 | 7.2 / p.10 | Log filters used. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-050 | 7.2 / p.10 | Log timestamp. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-051 | 7.2 / p.10 | Log result count. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-052 | 8 / p.11 | No direct database access is allowed. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-053 | 8 / p.11 | No manual modification is allowed. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-054 | 8 / p.11 | All data is event driven. | IMPLEMENTED_DIFFERENTLY | IMPLEMENTED_DIFFERENTLY / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-055 | 8 / p.11 | All results are projection based. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-056 | 8 / p.11 | All outputs are immutable. | EXACT_MATCH | EXACT_MATCH / FINAL_GATE_NOT_REACHED | D2 evidence remains valid; final full-scope closure not reached because Gate A blocked. |
| INV-057 | 9 / p.12 | Use indexed event storage and cached projections. | DATA_CONFIG_GAP | DATA_CONFIG_GAP / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-058 | 9 / p.12 | Optimize search for high-speed large datasets. | DATA_CONFIG_GAP | DATA_CONFIG_GAP / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |
| INV-059 | Final statement / p.12 | Provide consistency, auditability and performance optimization. | PARTIAL | PARTIAL / FINAL_GATE_NOT_REACHED | Current D2 gap remains open; D2F did not skip the sequential Gate A stop. |

## Current unresolved cardinality carried into the blocked gate

- Total rows: 59
- MISSING: 1
- PARTIAL: 5
- DATA_CONFIG_GAP: 2
- UI_ONLY_GAP: 0
- BACKEND_GAP: 0
- Final closure status: BLOCKED_GIFT_VOUCHER_AUTHORITY_AMBIGUOUS

A future rerun may convert only proven rows to EXACT_MATCH or IMPLEMENTED_DIFFERENTLY_ACCEPTED after Gate A, Gate B, and Gate C pass. No unsupported final PASS claim is made.
