const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-company-id",
  "x-branch-id",
]);

export function normalizePath(rawUrl) {
  const parsed = new URL(rawUrl);
  const normalized = parsed.pathname.replace(/^\/api\/v1/, "") || "/";
  return normalized
    .replace(/^(\/(?:customers|suppliers|products|assets|transfers|reservations|purchase-orders|approval-requests|invoices))\/[^/]+(?=\/|$)/, "$1/:id");
}

export function contextPresence(headers = {}) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    companyContextPresent: Boolean(normalized["x-company-id"]),
    branchContextPresent: Boolean(normalized["x-branch-id"]),
  };
}

export function redactHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => !SENSITIVE_HEADER_NAMES.has(key.toLowerCase()))
      .map(([key]) => [key.toLowerCase(), "REDACTED"]),
  );
}

export function createEvidenceCollector(now = () => Date.now()) {
  let sequence = 0;
  let startedAt = now();
  let scenario = "UNSET";
  const entries = [];
  const requestRecords = new WeakMap();
  let correlationCount = 0;

  function begin(nextScenario) {
    scenario = nextScenario;
    startedAt = now();
  }

  function request({ request: playwrightRequest, method, url, headers }) {
    if (!playwrightRequest || typeof playwrightRequest !== "object") {
      throw new TypeError("runtime evidence requires a request object for one-to-one correlation");
    }
    const context = contextPresence(headers);
    const entry = {
      sequence: ++sequence,
      relativeMs: now() - startedAt,
      // Retained in-memory only for transition-order assertions. Snapshots
      // deliberately omit it so evidence contains no absolute timestamps.
      observedAt: now(),
      scenario,
      method,
      path: normalizePath(url),
      status: null,
      terminalOutcome: "PENDING",
      ...context,
      retryOrReconnect: 0,
    };
    entries.push(entry);
    requestRecords.set(playwrightRequest, entry);
    correlationCount += 1;
    return entry;
  }

  function finish(playwrightRequest, terminalOutcome, { status = null, stableErrorCode = null } = {}) {
    const entry = requestRecords.get(playwrightRequest);
    if (!entry || entry.terminalOutcome !== "PENDING") return entry || null;
    entry.terminalOutcome = terminalOutcome;
    if (status !== null) entry.status = status;
    if (stableErrorCode) entry.stableErrorCode = stableErrorCode;
    requestRecords.delete(playwrightRequest);
    correlationCount -= 1;
    return entry;
  }

  function response({ request: playwrightRequest, status, stableErrorCode = null }) {
    return finish(playwrightRequest, "RESPONSE", { status, stableErrorCode });
  }

  function requestFailed({ request: playwrightRequest, aborted = false }) {
    return finish(playwrightRequest, aborted ? "ABORTED" : "FAILED");
  }

  function requestFinished({ request: playwrightRequest }) {
    // A response event owns success. This event cannot manufacture success or
    // erase correlation before asynchronous response metadata is recorded.
    return requestRecords.get(playwrightRequest) || null;
  }

  function annotateResponse(entry, { stableErrorCode = null } = {}) {
    if (entry && stableErrorCode && entry.terminalOutcome === "RESPONSE") {
      entry.stableErrorCode = stableErrorCode;
    }
    return entry || null;
  }

  function records(path, selectedScenario = scenario) {
    return entries.filter((entry) => entry.scenario === selectedScenario && entry.path === path);
  }

  function snapshot(selectedScenario = scenario) {
    const scoped = entries.filter((entry) => entry.scenario === selectedScenario);
    return scoped.map(({ sequence: itemSequence, relativeMs, scenario: itemScenario, method, path, status, terminalOutcome, companyContextPresent, branchContextPresent, retryOrReconnect, stableErrorCode }) => ({
      sequence: itemSequence,
      relativeMs,
      scenario: itemScenario,
      method,
      path,
      status,
      terminalOutcome,
      companyContextPresent,
      branchContextPresent,
      retryOrReconnect,
      ...(stableErrorCode ? { stableErrorCode } : {}),
    }));
  }

  return {
    begin,
    request,
    response,
    requestFailed,
    requestFinished,
    annotateResponse,
    records,
    snapshot,
    correlationCount: () => correlationCount,
  };
}
