import { apiClient, canonicalBusinessHash, preConfirmAuthFreshness, requestContextSnapshot } from "@/lib/api/client";

const REPLAY_QUERY_PARAM = "pearlReplayTest";
const RECEIVE_PATH = "/purchase-orders/receive";

export type PearlReplayMode = "exact" | "changed";

export type PearlReplayResult = {
  mode: PearlReplayMode;
  status: number;
  authStatus: "FRESH" | "REFRESHED";
  companyContextMatch: boolean;
  branchContextMatch: boolean;
  hash: string;
  keyPresent: boolean;
  responseState: "EXISTING_RESPONSE" | "CONFLICT";
  responseSummary: {
    success: boolean;
    hasData: boolean;
    replayed: boolean;
  };
};

function isLocalReplayEnvironment(): boolean {
  if (typeof window === "undefined" || window.location.hostname !== "localhost") return false;
  return new URLSearchParams(window.location.search).get(REPLAY_QUERY_PARAM) === "1";
}

function cloneRequest<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertSavedRequest(request: Record<string, any>): string {
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new Error("Saved replay request is invalid");
  const key = String(request.idempotencyKey || "").trim();
  if (!key) throw new Error("Saved replay request has no idempotency key");
  return key;
}

/**
 * Local acceptance-only replay seam. It is query-gated, host-gated, uses the
 * existing authenticated apiClient, and returns metadata only. It is not a
 * customer workflow and deliberately never reads or returns auth material.
 */
export async function runPearlReplayFromSavedRequest({
  request,
  mode,
  locale,
  branchId,
}: {
  request: Record<string, any>;
  mode: PearlReplayMode;
  locale: string;
  branchId?: string;
}): Promise<PearlReplayResult> {
  if (!isLocalReplayEnvironment()) throw new Error("Pearl replay helper is unavailable outside the approved local test environment");
  const exactRequest = cloneRequest(request);
  const key = assertSavedRequest(exactRequest);
  const contextBefore = requestContextSnapshot(RECEIVE_PATH, { branchId: branchId || undefined });
  const auth = await preConfirmAuthFreshness(locale);
  if (auth.status === "BLOCKED_AUTH") throw new Error("Pearl replay blocked: authentication is not fresh");
  const contextAfter = requestContextSnapshot(RECEIVE_PATH, { branchId: branchId || undefined });
  const hash = await canonicalBusinessHash("purchase.receive", exactRequest);
  const companyContextMatch = contextBefore.companyId === contextAfter.companyId;
  const branchContextMatch = contextBefore.branchId === contextAfter.branchId;
  if (!companyContextMatch || !branchContextMatch) throw new Error("Pearl replay blocked: company or branch context changed");

  let status = 0;
  let response: any = null;
  try {
    response = await apiClient<any>(RECEIVE_PATH, {
      method: "POST",
      locale,
      branchId: branchId || undefined,
      headers: { "Idempotency-Key": key },
      body: JSON.stringify(exactRequest),
      onResponseStatus: (nextStatus) => { status = nextStatus; },
    });
  } catch (error: any) {
    if (mode === "changed" && error?.status === 409) {
      return {
        mode,
        status: 409,
        authStatus: auth.status,
        companyContextMatch,
        branchContextMatch,
        hash,
        keyPresent: true,
        responseState: "CONFLICT",
        responseSummary: { success: false, hasData: false, replayed: false },
      };
    }
    throw error;
  }
  return {
    mode,
    status: status || 200,
    authStatus: auth.status,
    companyContextMatch,
    branchContextMatch,
    hash,
    keyPresent: true,
    responseState: mode === "changed" ? "CONFLICT" : "EXISTING_RESPONSE",
    responseSummary: {
      success: response?.success === true,
      hasData: Boolean(response?.data),
      replayed: response?.replayed === true,
    },
  };
}

export { isLocalReplayEnvironment };
