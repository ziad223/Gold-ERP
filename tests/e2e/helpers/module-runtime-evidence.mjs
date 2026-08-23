export const REQUIRED_MODULE_KEYS = [
  "dashboard",
  "suppliers",
  "products",
  "assets",
  "stockMovements",
  "transfers",
  "reservations",
  "purchaseOrders",
  "approvalRequests",
  "invoices",
];

const MODULES = {
  suppliers: { paths: ["/suppliers", "/suppliers/:id"], scope: "COMPANY_ONLY" },
  products: { paths: ["/products", "/products/:id"], scope: "BRANCH_REQUIRED" },
  assets: { paths: ["/assets", "/assets/:id"], scope: "BRANCH_REQUIRED" },
  stockMovements: { paths: ["/stock-movements"], scope: "BRANCH_REQUIRED" },
  transfers: { paths: ["/transfers", "/transfers/:id"], scope: "BRANCH_REQUIRED" },
  reservations: { paths: ["/reservations", "/reservations/:id"], scope: "BRANCH_REQUIRED" },
  purchaseOrders: { paths: ["/purchase-orders", "/purchase-orders/:id"], scope: "COMPANY_ONLY" },
  approvalRequests: { paths: ["/approval-requests", "/approval-requests/:id"], scope: "BRANCH_REQUIRED" },
  invoices: { paths: ["/invoices", "/invoices/:id"], scope: "BRANCH_REQUIRED" },
};

const MODULE_KEYS = Object.keys(MODULES);

export function moduleKeyForPath(pathname) {
  return MODULE_KEYS.find((key) => MODULES[key].paths.includes(pathname)) || null;
}

function counts(records, predicate) {
  return records.filter(predicate).length;
}

function duplicateSuccessfulLifecycles(records) {
  const perScenarioPath = new Map();
  for (const record of records) {
    if (record.terminalOutcome !== "RESPONSE" || record.status < 200 || record.status >= 300) continue;
    const key = `${record.scenario}:${record.path}`;
    perScenarioPath.set(key, (perScenarioPath.get(key) || 0) + 1);
  }
  return [...perScenarioPath.values()].reduce((total, value) => total + Math.max(0, value - 1), 0);
}

function terminalSummary(records, { scope, routeObserved = records.length > 0, hardRefreshObserved = false } = {}) {
  const statuses = [...new Set(records.map((record) => record.status).filter((status) => status !== null))].sort((a, b) => a - b);
  const stableErrorCodes = [...new Set(records.map((record) => record.stableErrorCode).filter(Boolean))].sort();
  const completedResponses = counts(records, (record) => record.terminalOutcome === "RESPONSE");
  const successes = counts(records, (record) => record.terminalOutcome === "RESPONSE" && record.status >= 200 && record.status < 300);
  const aborts = counts(records, (record) => record.terminalOutcome === "ABORTED");
  const failures = counts(records, (record) => record.terminalOutcome === "FAILED");
  const pending = counts(records, (record) => record.terminalOutcome === "PENDING");
  const companyHeaderPresent = records.length > 0 && records.every((record) => record.companyContextPresent);
  const branchHeaderPresent = records.length > 0 && records.every((record) => record.branchContextPresent);
  const branchContextRequired = counts(records, (record) => record.stableErrorCode === "BRANCH_CONTEXT_REQUIRED");
  const http401 = counts(records, (record) => record.status === 401);
  const http403 = counts(records, (record) => record.status === 403);
  const http422 = counts(records, (record) => record.status === 422);
  const http500 = counts(records, (record) => record.status === 500);
  const retryOrReconnectCount = records.reduce((total, record) => total + (record.retryOrReconnect || 0), 0);
  const duplicateLogicalLifecycleCount = duplicateSuccessfulLifecycles(records);
  const scopeValid = companyHeaderPresent && (scope !== "BRANCH_REQUIRED" || branchHeaderPresent);
  const controlledDomainEmpty = completedResponses > 0
    && successes === 0
    && statuses.length === 1
    && statuses[0] === 404
    && stableErrorCodes.includes("RESOURCE_NOT_FOUND")
    && scopeValid
    && branchContextRequired === 0
    && pending === 0
    && failures === 0
    && retryOrReconnectCount === 0;
  const hasUnexpectedError = http401 > 0 || http403 > 0 || http422 > 0 || http500 > 0 || branchContextRequired > 0;
  let outcome = "NOT_OBSERVED";
  if (records.length > 0) {
    if (controlledDomainEmpty) outcome = "CONTROLLED_DOMAIN_EMPTY";
    else if (successes > 0 && pending === 0 && failures === 0 && !hasUnexpectedError && scopeValid && duplicateLogicalLifecycleCount === 0) outcome = "PASS";
    else outcome = "FAIL";
  }
  return {
    outcome,
    routeObserved,
    requestCount: records.length,
    completedResponses,
    successes,
    statuses,
    stableErrorCodes,
    aborts,
    failures,
    pending,
    companyHeaderPresent,
    branchHeaderPresent,
    branchContextRequired,
    http401,
    http403,
    http422,
    http500,
    retryOrReconnectCount,
    duplicateLogicalLifecycleCount,
    hardRefreshObserved,
    expectedScope: scope,
    scopeValid,
    scenarioOwnershipValid: records.every((record) => typeof record.scenario === "string" && record.scenario.length > 0),
  };
}

export function summarizeModuleEvidence(moduleKey, records, { routeObserved, hardRefreshObserved } = {}) {
  if (moduleKey === "dashboard") {
    const moduleRecords = records.filter((record) => moduleKeyForPath(record.path));
    const summary = terminalSummary(moduleRecords, {
      scope: "MIXED",
      routeObserved: Boolean(routeObserved),
      hardRefreshObserved: Boolean(hardRefreshObserved),
    });
    return {
      ...summary,
      outcome: summary.routeObserved && summary.successes > 0 && summary.pending === 0 && summary.failures === 0 && !summary.http401 && !summary.http403 && !summary.http422 && !summary.http500 && summary.scopeValid && summary.duplicateLogicalLifecycleCount === 0
        ? "PASS"
        : summary.outcome,
    };
  }
  const definition = MODULES[moduleKey];
  if (!definition) throw new TypeError(`Unknown module evidence key: ${moduleKey}`);
  const moduleRecords = records.filter((record) => moduleKeyForPath(record.path) === moduleKey);
  const refreshed = hardRefreshObserved ?? moduleRecords.some((record) => /_HARD_REFRESH$/.test(record.scenario) && record.terminalOutcome === "RESPONSE");
  return terminalSummary(moduleRecords, {
    scope: definition.scope,
    routeObserved,
    hardRefreshObserved: Boolean(refreshed),
  });
}

export function summarizeModules(records, { dashboardRouteObserved = false } = {}) {
  const resources = Object.fromEntries(MODULE_KEYS.map((key) => [key, summarizeModuleEvidence(key, records)]));
  const dashboard = summarizeModuleEvidence("dashboard", records, {
    routeObserved: dashboardRouteObserved,
    hardRefreshObserved: MODULE_KEYS.every((key) => resources[key].hardRefreshObserved),
  });
  return Object.fromEntries(REQUIRED_MODULE_KEYS.map((key) => [key, key === "dashboard" ? dashboard : resources[key]]));
}
