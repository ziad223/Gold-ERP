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
  return normalized.replace(/^(\/customers)\/[^/]+(?=\/|$)/, "$1/:id");
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

  function begin(nextScenario) {
    scenario = nextScenario;
    startedAt = now();
  }

  function request({ method, url, headers }) {
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
      ...context,
      retryOrReconnect: 0,
    };
    entries.push(entry);
    return entry;
  }

  function response({ method, url, status, stableErrorCode = null }) {
    const path = normalizePath(url);
    const entry = [...entries].reverse().find(
      (candidate) => candidate.scenario === scenario
        && candidate.method === method
        && candidate.path === path
        && candidate.status === null,
    );
    if (entry) {
      entry.status = status;
      if (stableErrorCode) entry.stableErrorCode = stableErrorCode;
    }
  }

  function records(path, selectedScenario = scenario) {
    return entries.filter((entry) => entry.scenario === selectedScenario && entry.path === path);
  }

  function snapshot(selectedScenario = scenario) {
    const scoped = entries.filter((entry) => entry.scenario === selectedScenario);
    return scoped.map(({ sequence: itemSequence, relativeMs, scenario: itemScenario, method, path, status, companyContextPresent, branchContextPresent, retryOrReconnect, stableErrorCode }) => ({
      sequence: itemSequence,
      relativeMs,
      scenario: itemScenario,
      method,
      path,
      status,
      companyContextPresent,
      branchContextPresent,
      retryOrReconnect,
      ...(stableErrorCode ? { stableErrorCode } : {}),
    }));
  }

  return { begin, request, response, records, snapshot };
}
