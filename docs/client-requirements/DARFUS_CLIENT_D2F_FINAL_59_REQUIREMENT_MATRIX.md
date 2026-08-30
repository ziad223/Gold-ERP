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

## Gate D current recheck

This section is the current Gate D result. The preceding table is preserved as historical pre-Gate-A evidence and is not deleted. The client DOCX was re-read completely and rendered to eight pages; no embedded media or additional table requirement was present. Evidence keys used below:

- `S1` = current `invoice-projection.service.js` registry, adapters, scope guards, stable ordering, bounded page size, and read-only projection mapping.
- `S2` = current projection routes, Search & Print hook/UI, canonical detail path, and print-event boundaries.
- `R1` = accepted Gate C disposable-clone AR/EN browser and network evidence, including all seven print sources and reprint identity preservation.
- `R2` = accepted Gate B disposable-clone benchmark: 1k, 10k, and 50k checkpoints; 690 requests; 0 errors; 0 timeouts.
- `D1` = current official read-only identity/count evidence: `current_database=darfus_erp`; no business, financial, inventory, or print-event mutation by this control.
- `T1` = current focused existing tests: 53 passed, 0 failed; `npm run typecheck` passed; no test edits.

| Row ID | Client Section/Page | Exact Client Requirement | Previous Status | Current Source | Runtime Evidence | Test Evidence | Final Status | Gap Type / Root Cause | Proposed Next Control |
|---|---|---|---|---|---|---|---|---|---|
| INV-001 | 1.1 / pp.1-2 | Fully read-only intelligence layer. | EXACT_MATCH | S1,S2 | R1,D1 | T1 | EXACT_MATCH | None. | Preserve. |
| INV-002 | 1.1,1.3 / pp.1-2 | Event-driven layer. | IMPLEMENTED_DIFFERENTLY | S1 relational source projection and history links. | R1 shows stable result; no event-store replay is claimed. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; DARFUS source rows and links are the authority. | No product change; revisit only if Owner requires a new event-store authority. |
| INV-003 | 1.1 / pp.1-2 | Search includes classification, filtering, reconstruction, and rendering. | EXACT_MATCH | S1,S2 | R1 | T1 | EXACT_MATCH | None. | Preserve. |
| INV-004 | 1.2 / p.1 | Module covers all Sales-domain invoice types. | PARTIAL | S1 registry now has seven `SUPPORTED_NOW` sources. | R1 exercised all seven source families. | T1 | EXACT_MATCH | None within the current seven-source D2F scope. | Preserve seven-source registry. |
| INV-005 | 1.2 / p.1 | Sales Invoice supported. | EXACT_MATCH | S1 invoice adapter. | R1 official and reprint. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-006 | 1.2 / p.1 | Return Invoice supported. | EXACT_MATCH | S1 invoice adapter. | R1 clone fixture official and reprint. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-007 | 1.2 / p.1 | Exchange Invoice supported. | EXACT_MATCH | S1 invoice adapter. | R1 clone fixture official and reprint. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-008 | 1.2 / p.1 | Installments Invoice supported. | EXACT_MATCH | S1 invoice adapter. | R1 official and reprint. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-009 | 1.2 / p.1 | Deposit Invoice supported. | EXACT_MATCH | S1 invoice adapter. | R1 clone fixture official and reprint. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-010 | 1.2 / p.1 | Gift Voucher Invoice supported. | MISSING | S1 dedicated read-only Gift Voucher adapter. | R1 Gift Voucher detail/display print and dedicated print-event proof. | T1 | EXACT_MATCH | None; print authority remains source-specific and read-only at projection level. | Preserve dedicated Gift Voucher authority. |
| INV-011 | 1.2 / p.1 | Customer Gold Purchase Invoice supported. | EXACT_MATCH | S1 CGP projection adapter. | R1 CGP projection print proof. | T1 | EXACT_MATCH | None; CGP remains its own aggregate and projection. | Preserve CGP authority. |
| INV-012 | 1.3 / p.2 | System is read-only and does not modify data. | EXACT_MATCH | S2 GET projection paths; print is explicit authorization/audit boundary. | R1 no business mutation; D1 main DB unchanged. | T1 | EXACT_MATCH | None. | Preserve read-only boundary. |
| INV-013 | 1.4 / p.2 | Search is classification, filtering, reconstruction, and rendering, not simple retrieval. | IMPLEMENTED_DIFFERENTLY | S1 relational projection and source history, not event-store replay. | R1 detail and print output stable. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; current safe implementation uses source projections. | No product change; architecture review only if required. |
| INV-014 | 2.1 / p.2 | Unified search model across all invoice types. | PARTIAL | S1 seven-source registry and `listSummaries`. | R1 unified AR/EN search and all seven source families. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-015 | 2.2 / p.2-3 | Filter by Invoice Number. | EXACT_MATCH | S1 search predicate and S2 filter UI. | R1 exact-number search/detail. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-016 | 2.2 / p.2-3 | Filter by Customer ID. | EXACT_MATCH | S1 partyId predicate. | R2 scenario coverage and R1 detail. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-017 | 2.2 / p.2-3 | Filter by Customer Name. | EXACT_MATCH | S1 partyName predicate. | R2 scenario coverage. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-018 | 2.2 / p.2-3 | Filter by Date From. | EXACT_MATCH | S1 date range predicate. | R2 scenario coverage. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-019 | 2.2 / p.2-3 | Filter by Date To. | EXACT_MATCH | S1 date range predicate through end of day. | R2 scenario coverage. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-020 | 2.2 / p.2-3 | Filter by Branch. | IMPLEMENTED_DIFFERENTLY | S1 authenticated branch context is authority; requested out-of-scope branch fails closed. | R1 branch-specific AR/EN; R2 branch scenarios. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; server context is authoritative instead of event-store filtering. | Preserve fail-closed scope. |
| INV-021 | 2.2 / p.2-3 | Filter by Employee. | EXACT_MATCH | S1 employee ID/name resolution. | R1 UI employee filter; R2 scenario. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-022 | 2.3 / p.3 | Invoice Type is a primary search dimension. | EXACT_MATCH | S1 `sourceTypes` normalization and validation. | R1 seven-type UI and API. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-023 | 2.3 / p.3 | Support Sales, Return, Exchange, Installments, Deposit. | EXACT_MATCH | S1 active invoice types. | R1 API/browser proof. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-024 | 2.3 / p.3 | Support Gift Voucher and Customer Gold Purchase. | PARTIAL | S1 Gift Voucher and CGP adapters active. | R1 both sources searched and rendered. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-025 | 2.3 / p.3 | Support single or multi-selection. | EXACT_MATCH | S1 type list and mixed merge path. | R1 mixed source search; R2 S15/S16. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-026 | 2.4 / p.3-4 | Support Draft status. | EXACT_MATCH | S1 status mapping. | R2 status scenario. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-027 | 2.4 / p.3-4 | Support Posted status. | EXACT_MATCH | S1 status mapping. | R2 status scenario. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-028 | 2.4 / p.3-4 | Support Closed status. | IMPLEMENTED_DIFFERENTLY | S1 maps paid posted invoices and redeemed/expired vouchers to closed display. | R1 detail/status evidence. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; display mapping is not a new lifecycle state. | No status-schema change. |
| INV-029 | 2.4 / p.3-4 | Support Cancelled status. | EXACT_MATCH | S1 status mapping for cancelled/reversed/voided source evidence. | R1 detail/status evidence. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-030 | 2.4 / p.3-4 | Support Returned status. | IMPLEMENTED_DIFFERENTLY | S1 return/status display mapping from source rows. | R1 return fixture/detail. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; no new status transition is introduced. | No status-schema change. |
| INV-031 | 3.1 / p.4 | Event Store Selection precedes Invoice Type Filtering. | IMPLEMENTED_DIFFERENTLY | S1 selects source adapter and source rows; no event store. | R2 source/type scenarios successful. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; relational source authority. | No event-store implementation in D2F. |
| INV-032 | 3.1 / p.4 | Invoice Type Filtering precedes Date Filtering. | IMPLEMENTED_DIFFERENTLY | S1 applies source type and predicates in canonical source query. | R2 date/type scenarios. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; same safe bounded outcome with different physical query authority. | Preserve query authority. |
| INV-033 | 3.1 / p.4 | Date Filtering precedes Entity Filtering. | IMPLEMENTED_DIFFERENTLY | S1 composes predicates in one source query. | R2 combined/date/entity scenarios. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; no separate event-store pipeline. | No refactor. |
| INV-034 | 3.1 / p.4 | Entity Filtering precedes Projection Reconstruction. | IMPLEMENTED_DIFFERENTLY | S1 source query then adapter mapping. | R1 detail result; R2 filter scenarios. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; adapter projection is canonical. | Preserve. |
| INV-035 | 3.1 / p.4 | Projection Reconstruction precedes Result Aggregation. | IMPLEMENTED_DIFFERENTLY | S1 per-source mappings then mixed merge. | R1 mixed seven-source search; R2 S15/S16. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; application merge is the accepted current design. | Separate capacity review only if needed. |
| INV-036 | 3.2 / p.4-5 | Type filtering occurs before reconstruction to reduce load. | IMPLEMENTED_DIFFERENTLY | S1 type-bounded source queries and page limits. | R2 S16 and 50k bounded performance. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; measured result is bounded, but not event-store reconstruction. | No unmeasured cache/index change. |
| INV-037 | 4.1 / p.5 | Results displayed in one unified grid. | EXACT_MATCH | S2 unified grid. | R1 AR/EN populated grid. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-038 | 4.2 / p.5 | Grid columns: date, number, type, customer ID/name, branch, employee, total, status. | EXACT_MATCH | S1 mapping and S2 table. | R1 AR/EN grid/detail. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-039 | 4.3 / p.5-6 | Each row represents one invoice. | EXACT_MATCH | S1 one projection item per source record. | R1 row/detail identity; R2 stable paging. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-040 | 4.3 / p.5-6 | Clicking a row opens full reconstructed invoice. | EXACT_MATCH | S2 canonical detail route/modal. | R1 AR/EN detail journeys. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-041 | 5.1 / p.6 | Reconstruct invoices from event history. | IMPLEMENTED_DIFFERENTLY | S1 reconstructs from source records and stored history/links. | R1 full detail and print identity. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; no new event-store authority. | No event-store rewrite. |
| INV-042 | 5.1 / p.6 | Restore full lifecycle including financial and operational data. | IMPLEMENTED_DIFFERENTLY | S1 detail enriches payments, journals, assets, and source-specific evidence where present. | R1 detail/print and DB unchanged. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; lifecycle is read from canonical source links. | Preserve source authorities. |
| INV-043 | 6.1 / p.6 | All print outputs generated from projection data only. | EXACT_MATCH | S2 print view models consume projection/detail data. | R1 seven-source print proof. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-044 | 6.2 / p.6-7 | Print Sales, Return, Exchange, Installment, Deposit. | EXACT_MATCH | S2 generic invoice print route and templates. | R1 official/reprint for all five. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-045 | 6.2 / p.6-7 | Print Gift Voucher and Customer Gold Purchase. | PARTIAL | S1/S2 source-specific Gift Voucher display print and CGP projection print authority. | R1 both proven; reprint identity preserved. | T1 | EXACT_MATCH | None; source-specific authority is accepted. | Preserve separate source print authorities. |
| INV-046 | 7.1 / p.7 | Read-only with role-based access control. | EXACT_MATCH | S2 auth and `sales.view`/print permission guards. | R1 authenticated AR/EN journeys. | T1 permission coverage. | EXACT_MATCH | None. | Preserve. |
| INV-047 | 7.2 / p.7 | All search and print operations logged. | EXACT_MATCH | S2 `auditService.record` for search and print event/audit routes. | R1 expected audit deltas only. | T1 | EXACT_MATCH | None. | Preserve audit. |
| INV-048 | 7.2 / p.7 | Log User ID. | EXACT_MATCH | S2 command actor context and audit actor. | R1 authenticated actor evidence. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-049 | 7.2 / p.7 | Log filters used. | EXACT_MATCH | S2 search audit stores filter payload. | R1 search audit evidence. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-050 | 7.2 / p.7 | Log timestamp. | EXACT_MATCH | S2 audit event timestamps. | R1 print/search audit evidence. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-051 | 7.2 / p.7 | Log result count. | EXACT_MATCH | S2 search audit stores `resultCount`. | R1 populated search evidence. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-052 | 8 / p.8 | No direct database access allowed. | EXACT_MATCH | S2 client uses API; no direct DB path. | R1 API/browser only; D1 DB was inspected separately by audit tooling. | T1 | EXACT_MATCH | None. | Preserve boundary. |
| INV-053 | 8 / p.8 | No manual modification allowed. | EXACT_MATCH | S2 projection UI is read-only; mutations are separate explicit print audit actions. | R1 no business/financial/inventory mutation. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-054 | 8 / p.8 | All data is event driven. | IMPLEMENTED_DIFFERENTLY | S1 current canonical source is relational source rows plus history links. | R1 output stable; no event-store claim. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; frozen source authority differs from literal wording. | No event-store migration. |
| INV-055 | 8 / p.8 | All results are projection based. | EXACT_MATCH | S1 adapters and S2 projection routes. | R1 search/detail/print all through projection paths. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-056 | 8 / p.8 | All outputs are immutable. | EXACT_MATCH | S2 read-only projections and append-only print/audit events. | R1 source identity and reprint behavior. | T1 | EXACT_MATCH | None. | Preserve. |
| INV-057 | 9 / p.8 | Use indexed event storage and cached projections. | DATA_CONFIG_GAP | S1 uses indexed relational source queries and bounded projections; no separate event store/cache is claimed. | R2 measured 50k boundary: 690 requests, 0 errors/timeouts; query-plan scans are advisory. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; capacity intent is met within measured boundary without unproven cache authority. | Optional measured capacity/cache control; no automatic index/cache change. |
| INV-058 | 9 / p.8 | Optimize search for high-speed large datasets. | DATA_CONFIG_GAP | S1 bounded page/order; R2 measured performance. | R2 p95 remained below 260ms at 50k for final scenarios, 0 errors/timeouts. | T1 | IMPLEMENTED_DIFFERENTLY_WITH_ACCEPTED_AUTHORITY | ACCEPTED_AUTHORITY_DIFFERENCE; no production SLA or beyond-50k claim. | Optional capacity control using a new measured target. |
| INV-059 | Final statement / p.8 | Provide consistency, auditability, and performance optimization. | PARTIAL | S1/S2 plus Gate B/C evidence. | R1 seven-source print/reprint; R2 50k benchmark; D1 zero main business delta. | T1 | EXACT_MATCH | None within the measured and accepted scope; limits are recorded separately. | Preserve and do not claim beyond measured boundary. |

### Gate D matrix cardinality

`ALL_59_ROWS_AUDITED = YES`; `FINAL_EXACT_MATCH = 43`; `FINAL_IMPLEMENTED_DIFFERENTLY = 16`; all other gap-status counts are zero. The 16 differences are accepted, non-blocking architecture/capacity differences and are individually registered in the Gate D Gap Register.
