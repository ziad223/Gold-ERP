# DARFUS ERP — D2F Gate B Large-Data Performance Benchmark Report

## Executive Summary

تم تنفيذ benchmark للقراءة فقط على Backend مؤقت معزول مربوط بالـDisposable Clone، ولم تتم أي كتابة على `darfus_erp`. تم قياس 21 سيناريوًّا، مع ثلاث قراءات detail داخل S21، عند checkpoints إجمالية 1,000 و10,000 و50,000 سجل اصطناعي. كل الطلبات النهائية أعادت HTTP 200 بلا timeout أو application error.

| Checkpoint | Total synthetic records | Requests | Successful requests | Errors/timeouts |
|---:|---:|---:|---:|---:|
| 1,000 | 1,000 | 230 | 230 | 0 |
| 10,000 | 10,000 | 230 | 230 | 0 |
| 50,000 | 50,000 | 230 | 230 | 0 |
| **Total** | — | **690** | **690** | **0** |

Decision: لا يوجد bottleneck تشغيلي مادي مثبت ضمن نطاق 50k والـrepetition المحدد. ظهرت scans/sorts في query plans، لكنها لم تتجاوز حدودًا تشغيلية تعطل السيناريوهات؛ لذلك لم يتم إضافة index/cache أو تعديل source.

## 1. Control and Safety Boundary

- `CURRENT_CONTROL = DARFUS-CLIENT-D2F-GATE-B-LARGE-DATA-PERFORMANCE-BENCHMARK-01`
- `MODE = DISPOSABLE_CLONE_PERFORMANCE_BENCHMARK_ONLY`
- Official DB: `darfus_erp`, read-only.
- Disposable Clone: `darfus_d2f_invoice_perf_20260830_01`.
- Temporary backend: port `8010`, stopped after evidence collection.
- Main frontend `localhost:3000`: not touched.
- Main backend `localhost:8000`: not restarted; final health remained UP.
- No migration, source edit, test edit, official write, index creation, cache change, or optimization was performed.
- A first harness attempt used the incomplete `/invoice-projection` path and produced excluded 404s; the harness was corrected to `/invoice-projection/summaries` before the official benchmark files were generated. Final benchmark evidence contains only the corrected run.

## 2. Official DB Read-Only Baseline and Final Delta

Before and after evidence came from read-only `SELECT` queries. Both identity checks returned `current_database=darfus_erp` and `current_user=postgres`.

| Entity | Before | After | Delta | Result |
|---|---:|---:|---:|---|
| invoices | 10 | 10 | 0 | MATCH |
| invoice_items | 10 | 10 | 0 | MATCH |
| customer_gold_purchase_documents | 4 | 4 | 0 | MATCH |
| gift_vouchers | 5 | 5 | 0 | MATCH |
| payments | 20 | 20 | 0 | MATCH |
| journal_entries | 73 | 73 | 0 | MATCH |
| journal_lines | 200 | 200 | 0 | MATCH |
| audit_logs | 328 | 328 | 0 | MATCH |

`OFFICIAL_DB_BUSINESS_DELTA = 0` and `OFFICIAL_DB_MUTATIONS = 0`. The benchmark endpoint's existing audit side effect occurred only in the disposable clone.

Evidence: `backups/client-requirements/d2f-gate-b/20260829T211630Z/main_baseline_readonly.txt`, `main_final_readonly.txt`, `main_final_delta_comparison.txt`.

## 3. Clone Creation and Dataset Fidelity

Template cloning was attempted read-only first and was refused by PostgreSQL because the source database had one active session. No session was terminated. The safe fallback was a custom-format `pg_dump`, creation of the named disposable database, and `pg_restore`.

| Source family | 1k | 10k | 50k |
|---|---:|---:|---:|
| Sale | 140 | 1,400 | 7,000 |
| Return | 140 | 1,400 | 7,000 |
| Exchange | 140 | 1,400 | 7,000 |
| Installment | 140 | 1,400 | 7,000 |
| Deposit | 140 | 1,400 | 7,000 |
| Customer Gold Purchase | 150 | 1,500 | 7,500 |
| Gift Voucher | 150 | 1,500 | 7,500 |
| **Total** | **1,000** | **10,000** | **50,000** |

All synthetic rows used the existing clone company, customers, and two active branches. Final distribution was 25,000 Branch-1 and 25,000 Branch-2. Final source counts were 35,000 invoice rows, 7,500 CGP rows, and 7,500 Gift Voucher rows.

Evidence: `dataset_generation_log.txt`, `clone_identity_fidelity_distribution.txt`.

## 4. Runtime and API Proof

The temporary backend started from the current backend source with `DB_NAME=darfus_d2f_invoice_perf_20260830_01`, PostgreSQL on the local published port, Redis on the local Redis service, and port `8010`. Startup logs showed database connection established and listening on `8010`.

| Endpoint | Method | Result |
|---|---|---|
| `/api/v1/health` | GET | 200 / UP |
| `/api/v1/health/db` | GET | 200 / UP |
| `/api/v1/invoice-projection/sources` | GET | 200 / 7 active projection source types (9 registry entries including inactive extension points) |
| `/api/v1/invoice-projection/summaries` | GET | 200 |

Authentication and company/branch context were supplied to the isolated API without recording credentials or tokens. The temporary process was stopped with SIGINT; `8010` no longer responded. The normal `8000` endpoint remained UP.

Evidence: `isolated_runtime_health_and_api_contract.txt`, `cleanup_process_stop.txt`.

## 5. Measurement Method

- Ten sequential iterations per scenario and checkpoint.
- S21 is a detail bundle containing Sale, Gift Voucher, and Customer Gold Purchase detail reads; therefore it has 30 requests per checkpoint.
- Client-observed duration was measured from request dispatch through response parsing.
- Recorded per request: checkpoint, scenario, iteration, HTTP status, duration, returned rows, total, and error.
- p50/p95/max were calculated from successful observations only; errors would have been retained as failed observations.
- `pageSize=25`; middle and deep page cases used page 50 and page 200.
- No POST/PUT/PATCH/DELETE business request was used for benchmark data.

## 6. Scenario Coverage and 50k Results

| Scenario | Coverage | Iterations | p50 ms | p95 ms | Max ms | Errors |
|---|---|---:|---:|---:|---:|---:|
| S01 | default/all projection | 10 | 237.05 | 257.85 | 301.78 | 0 |
| S02 | exact document search | 10 | 55.46 | 58.25 | 59.91 | 0 |
| S03 | customer name | 10 | 82.64 | 101.92 | 145.70 | 0 |
| S04 | customer ID | 10 | 60.32 | 65.27 | 91.58 | 0 |
| S05 | date range | 10 | 62.40 | 65.15 | 67.50 | 0 |
| S06 | branch | 10 | 72.08 | 82.17 | 85.86 | 0 |
| S07 | employee filter | 10 | 39.93 | 40.88 | 42.30 | 0 |
| S08 | sale | 10 | 69.27 | 71.60 | 71.94 | 0 |
| S09 | return | 10 | 72.91 | 86.01 | 96.76 | 0 |
| S10 | exchange | 10 | 70.56 | 80.13 | 81.40 | 0 |
| S11 | installment | 10 | 73.13 | 77.97 | 78.31 | 0 |
| S12 | deposit | 10 | 67.12 | 75.25 | 76.16 | 0 |
| S13 | customer gold purchase | 10 | 59.66 | 63.84 | 69.00 | 0 |
| S14 | gift voucher | 10 | 66.39 | 71.93 | 75.54 | 0 |
| S15 | multi-invoice source types | 10 | 81.63 | 88.08 | 96.54 | 0 |
| S16 | all seven source families | 10 | 213.18 | 226.13 | 265.86 | 0 |
| S17 | status | 10 | 49.03 | 51.03 | 53.39 | 0 |
| S18 | combined filters | 10 | 59.68 | 61.07 | 64.12 | 0 |
| S19 | middle page | 10 | 73.81 | 76.10 | 80.02 | 0 |
| S20 | deep page | 10 | 62.47 | 63.34 | 63.80 | 0 |
| S21 | Sale + Gift Voucher + CGP detail | 30 | 27.88 | 31.93 | 44.41 | 0 |

Full p50/p95/max values for all checkpoints and every raw iteration are preserved in `summary_benchmark_all_checkpoints.md`, `summary_benchmark_all_checkpoints.csv`, and the three `raw_benchmark_*.csv` files.

## 7. Scaling Classification

| Scenario family | p95 at 1k | p95 at 10k | p95 at 50k | Classification |
|---|---:|---:|---:|---|
| Default/all | 160.75 | 196.07 | 257.85 | Moderate growth; no timeout/error |
| All seven sources | 158.86 | 156.62 | 226.13 | Stable to moderate growth; no timeout/error |
| Exact document | 39.03 | 46.64 | 58.25 | Good bounded growth |
| Customer name | 53.89 | 61.37 | 101.92 | Moderate filter growth |
| Customer ID | 58.18 | 63.45 | 65.27 | Bounded |
| Date range | 51.38 | 56.86 | 65.15 | Bounded |
| Branch | 55.93 | 56.38 | 82.17 | Moderate but bounded |
| Middle/deep page | 38.31/39.14 | 41.54/39.82 | 76.10/63.34 | Moderate offset growth; no timeout/error |
| Detail trio | 39.55 | 31.18 | 31.93 | Bounded |

Within the tested 50k boundary, no scenario demonstrated a material operational failure. This is not a claim for unmeasured datasets beyond 50k.

## 8. Query Plans and Resource Observation

Clone-only `EXPLAIN (ANALYZE, BUFFERS)` was run for representative invoice default, invoice customer/date, CGP branch, and Gift Voucher branch-scope queries.

Observed facts:

- Invoice default used a branch index followed by a bitmap heap scan and top-N sort; execution was approximately 81ms at the representative 50k plan.
- Invoice customer/date used the company/customer index but filtered remaining type/date rows; execution was approximately 11ms.
- CGP used a sequential scan on the 7,500-row source table plus joins and sort; execution was approximately 17ms.
- Gift Voucher used a sequential scan on the 7,500-row source table plus joins and sort; execution was approximately 31ms.
- Mixed/all-source application behavior reads per-source pages and merges in application code; its measured p95 was 226.13ms at 50k.
- PostgreSQL, Redis, and normal backend resource snapshots were low at observation time; no resource exhaustion was observed.

These are optimization candidates, not a proven blocking bottleneck at the measured boundary. No index, query, cache, or application optimization was applied. Any future optimization requires a separately approved control and before/after benchmark.

Evidence: `query_plans_50k.txt`, `resource_observations.txt`.

## 9. Source and Worktree Safety

The repository was already dirty before this control. The recorded pre-control state was branch `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`, 5,886 status lines, 141 tracked-like entries, 5,745 untracked entries, and 11 stashes. After evidence artifacts, status was 5,887 lines and 5,746 untracked entries; the change is the evidence directory only.

No product source, test source, `next-env.d.ts`, configuration, migration, or Git history was modified by this control. No build was run because there was no source/test change; current accepted build evidence remains upstream.

Evidence: `source_worktree_state.txt`, `evidence_sha256.txt`.

## 10. Tests and Typecheck

- `node --test tests/d2-final-invoice-search-print.test.cjs tests/cont53-d01-d11-contract.test.cjs`: **8 passed, 0 failed**.
- `npm run typecheck`: **PASS**.
- Build: **NOT RUN — no source or test change in this control**.
- Existing D1/D2/Gift Voucher authorities were not reopened or altered.

Evidence: `tests_typecheck.txt`.

## 11. Findings and Classification

| ID | Finding | Classification | Severity | Priority | Blocks inventory work? |
|---|---|---|---|---|---|
| D2F-B-001 | Projection queries show sequential scans/sorts at 50k, while API p95 remains below 260ms and error-free. | DESIGN_LIMITATION / ACCEPTANCE_GAP | P3 | P3 | No |
| D2F-B-002 | Mixed seven-source read merges per-source results in application code, as documented in current source. | DESIGN_LIMITATION | P3 | P3 | No |
| D2F-B-003 | Benchmark harness first used an invalid incomplete path; corrected before final measurements. | TEST_HARNESS | P3 | P3 | No |

No P0/P1 issue was introduced or proven. D2F-B-001 and D2F-B-002 are recorded for future capacity planning only; this control does not authorize optimization.

## 12. Strengths

- All seven active projection source families were represented in the synthetic dataset and served through the canonical projection API.
- Detail reads for Sale, Gift Voucher, and CGP remained bounded and successful at the 50k checkpoint.
- Company/branch scoping was exercised in headers and branch-filter scenarios; no cross-branch result error was observed.
- The clone was created without terminating the active official DB session and without changing the official DB.
- The existing focused D2 projection contract tests and typecheck passed unchanged.

## 13. Limitations

- The benchmark used synthetic records derived from the current clone schema; it did not create realistic large `invoice_items`, asset links, journals, or payments for every synthetic invoice. Detail measurements used valid source rows with source-specific related-data behavior, so they are projection-read measurements, not a full transaction-density simulation.
- No frontend instance was started on 3010 because the measured control is the read-only projection/API performance gate and the existing build's public API target could not be independently promoted without a source/build mutation. Main UI 3000 was intentionally untouched.
- Results are local-machine measurements and do not represent network or production infrastructure latency.
- No cache warm/cold comparison was declared; the benchmark observed the running service under sequential request order.

## 14. Gate

| Gate item | Result |
|---|---|
| Main DB identity and read-only baseline | PASS |
| Disposable clone identity | PASS |
| Dataset checkpoints 1k/10k/50k | PASS |
| Seven source families represented | PASS |
| 21 scenario IDs / 23 endpoint variants | PASS |
| Minimum 10 iterations | PASS |
| HTTP errors/timeouts in final benchmark | 0 |
| Query plans clone-only | PASS |
| P0/P1 introduced | 0 |
| Official DB business delta | 0 |
| Source/test/migration/index/cache mutation | 0 |
| Focused tests | PASS |
| Typecheck | PASS |

`GATE = PASS_DARFUS_CLIENT_D2F_GATE_B_LARGE_DATA_PERFORMANCE_BENCHMARK`

The PASS is bounded to the measured disposable-clone performance scope. It does not authorize optimization, production deployment, or a new D2F batch.

## 15. Evidence Index

Directory: `backups/client-requirements/d2f-gate-b/20260829T211630Z/`

- Main baseline/final/delta: `main_baseline_readonly.txt`, `main_final_readonly.txt`, `main_final_delta_comparison.txt`
- Clone identity/distribution: `dataset_generation_log.txt`, `clone_identity_fidelity_distribution.txt`
- Runtime/API: `isolated_runtime_health_and_api_contract.txt`, `cleanup_process_stop.txt`
- Raw measurements: `raw_benchmark_1000.csv`, `raw_benchmark_10000.csv`, `raw_benchmark_50000.csv`
- Summaries: `summary_benchmark_1000.csv`, `summary_benchmark_10000.csv`, `summary_benchmark_50000.csv`, `summary_benchmark_all_checkpoints.csv`, `summary_benchmark_all_checkpoints.md`
- Query plans/resources: `query_plans_50k.txt`, `resource_observations.txt`
- Tests/worktree: `tests_typecheck.txt`, `source_worktree_state.txt`, `evidence_sha256.txt`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-D2F-GATE-B-LARGE-DATA-PERFORMANCE-BENCHMARK-01
MODE = DISPOSABLE_CLONE_PERFORMANCE_BENCHMARK_ONLY
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_READ_ONLY = YES
DISPOSABLE_CLONE = darfus_d2f_invoice_perf_20260830_01
CLONE_MUTATION_ONLY = YES
DATASET_CHECKPOINTS = 1000, 10000, 50000
FINAL_SYNTHETIC_RECORDS = 50000
ACTIVE_SOURCE_FAMILIES = 7
SCENARIO_IDS = 21
ENDPOINT_VARIANTS = 23
REQUESTS_PER_CHECKPOINT = 230
TOTAL_BENCHMARK_REQUESTS = 690
FINAL_BENCHMARK_HTTP_ERRORS = 0
FINAL_BENCHMARK_TIMEOUTS = 0
QUERY_PLANS = CLONE_ONLY
INDEX_CACHE_APP_CHANGE = NO
OFFICIAL_DB_BUSINESS_DELTA = 0
OFFICIAL_DB_WRITES = 0
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS = 0
FOCUSED_TESTS = PASS_8_OF_8
TYPECHECK = PASS
BUILD = NOT_RUN_NO_SOURCE_CHANGE
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
P3_COUNT = 3_ADVISORY_FINDINGS
GATE = PASS_DARFUS_CLIENT_D2F_GATE_B_LARGE_DATA_PERFORMANCE_BENCHMARK
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY; CONSIDER_SEPARATE_CAPACITY_OPTIMIZATION_CONTROL_IF_REQUIRED
```

STOP. Do not start D2F Gate C/D, CRM, HR, print recovery, financial mapping persistence, migration, deployment, or production work automatically.
