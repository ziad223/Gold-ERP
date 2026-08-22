export const AUTH_FRESHNESS_SAFETY_MARGIN_SECONDS = 60;

export type AuthFreshnessStatus = "FRESH" | "REFRESHED" | "BLOCKED_AUTH";

export type AuthFreshnessResult = {
  status: AuthFreshnessStatus;
  refreshAttempted: boolean;
  remainingSeconds?: number;
};

type TokenClassification = {
  fresh: boolean;
  remainingSeconds?: number;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function classifyAccessToken(token: string | undefined, nowMs: number, safetyMarginSeconds = AUTH_FRESHNESS_SAFETY_MARGIN_SECONDS): TokenClassification {
  if (!token) return { fresh: false };
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" && Number.isFinite(payload.exp) ? payload.exp : null;
  if (exp === null) return { fresh: false };
  const remainingSeconds = Math.floor(exp - nowMs / 1000);
  return { fresh: remainingSeconds > safetyMarginSeconds, remainingSeconds };
}

export async function ensureAuthFreshness({
  readToken,
  refresh,
  now = () => Date.now(),
  safetyMarginSeconds = AUTH_FRESHNESS_SAFETY_MARGIN_SECONDS,
}: {
  readToken: () => string | undefined;
  refresh: () => Promise<boolean>;
  now?: () => number;
  safetyMarginSeconds?: number;
}): Promise<AuthFreshnessResult> {
  const initial = classifyAccessToken(readToken(), now(), safetyMarginSeconds);
  if (initial.fresh) return { status: "FRESH", refreshAttempted: false, remainingSeconds: initial.remainingSeconds };

  const refreshed = await refresh();
  if (!refreshed) return { status: "BLOCKED_AUTH", refreshAttempted: true };

  const afterRefresh = classifyAccessToken(readToken(), now(), safetyMarginSeconds);
  if (!afterRefresh.fresh) return { status: "BLOCKED_AUTH", refreshAttempted: true, remainingSeconds: afterRefresh.remainingSeconds };
  return { status: "REFRESHED", refreshAttempted: true, remainingSeconds: afterRefresh.remainingSeconds };
}
