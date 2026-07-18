import { getDataSourceMode, assertProductionDataSource } from "@/lib/data-source";

export interface ApiErrorPayload {
  success: boolean;
  message: string;
  code?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}

export class DarfusApiError extends Error {
  status: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;

  constructor(status: number, message: string, errors?: Record<string, string[]>, correlationId?: string, errorCode?: string) {
    super(message);
    this.name = "DarfusApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;
    this.correlationId = correlationId;
  }
}

export const AUTH_REFRESHED_RETRY_REQUIRED = "AUTH_REFRESHED_RETRY_REQUIRED";

type TerminalAuthFailureHandler = (error: DarfusApiError) => void;

let terminalAuthFailureHandler: TerminalAuthFailureHandler | null = null;

export function registerTerminalAuthFailureHandler(handler: TerminalAuthFailureHandler): () => void {
  terminalAuthFailureHandler = handler;
  return () => {
    if (terminalAuthFailureHandler === handler) terminalAuthFailureHandler = null;
  };
}

// Simple UUID generator for correlation IDs
export function generateUUID(): string {
  try {
    return window.crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

interface ApiClientOptions extends RequestInit {
  branchId?: string;
  companyId?: string;
  token?: string;
  locale?: string;
  idempotencyKey?: string;
  skipBranch?: boolean;
}

// Token storage key — must match auth-context.tsx
const TOKEN_KEY = "darfus-token-v1";
const REFRESH_KEY = "darfus-refresh-v1";
const API_SESSION_KEY = "darfus-api-session-v1";
export const DEVICE_SESSION_KEY = "darfus-device-session-id-v1";
const LEGACY_DEVICE_SESSION_KEY = "darfus-device-session-v1";
const DEVICE_SESSION_RE = /^[A-Za-z0-9._:-]{16,128}$/;

function readStoredToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return (
      window.localStorage.getItem(TOKEN_KEY) ??
      window.sessionStorage.getItem(TOKEN_KEY) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

function readStoredRefreshToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return (
      window.localStorage.getItem(REFRESH_KEY) ??
      window.sessionStorage.getItem(REFRESH_KEY) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

function writeStoredApiAuth(data: { token: string; refreshToken: string; user?: unknown; company?: unknown }) {
  if (typeof window === "undefined") return;
  const storage =
    window.localStorage.getItem(REFRESH_KEY) !== null || window.localStorage.getItem(TOKEN_KEY) !== null
      ? window.localStorage
      : window.sessionStorage;
  storage.setItem(TOKEN_KEY, data.token);
  storage.setItem(REFRESH_KEY, data.refreshToken);
  if (data.user && data.company) {
    storage.setItem(API_SESSION_KEY, JSON.stringify({ user: data.user, company: data.company }));
  }
}

function clearStoredApiAuth() {
  if (typeof window === "undefined") return;
  for (const key of [TOKEN_KEY, REFRESH_KEY, API_SESSION_KEY]) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(apiBaseUrl: string, locale: string): Promise<boolean> {
  const refreshToken = readStoredRefreshToken();
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Language": locale,
            "X-Correlation-ID": generateUUID(),
          },
          body: JSON.stringify({ refreshToken }),
        });
        const text = await response.text();
        const payload = text ? JSON.parse(text) : null;
        if (!response.ok || !payload?.data?.token || !payload?.data?.refreshToken) return false;
        writeStoredApiAuth(payload.data);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function isSafeReadMethod(method?: string): boolean {
  const normalized = (method || "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS";
}

function readStoredBranchId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem("darfus-active-branch-id-v1") ?? undefined;
  } catch {
    return undefined;
  }
}

export function getOrCreateDeviceSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = window.localStorage.getItem(DEVICE_SESSION_KEY);
    if (existing && DEVICE_SESSION_RE.test(existing)) return existing;
    if (existing) window.localStorage.removeItem(DEVICE_SESSION_KEY);

    const legacy = window.localStorage.getItem(LEGACY_DEVICE_SESSION_KEY);
    if (legacy && DEVICE_SESSION_RE.test(legacy)) {
      window.localStorage.setItem(DEVICE_SESSION_KEY, legacy);
      window.localStorage.removeItem(LEGACY_DEVICE_SESSION_KEY);
      return legacy;
    }
    if (legacy) window.localStorage.removeItem(LEGACY_DEVICE_SESSION_KEY);

    const next = `DS-${generateUUID()}`;
    window.localStorage.setItem(DEVICE_SESSION_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

export function clearDeviceSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEVICE_SESSION_KEY);
    window.localStorage.removeItem(LEGACY_DEVICE_SESSION_KEY);
  } catch {
    // Ignore storage failures during logout/session cleanup.
  }
}

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  // Phase 22-Fix — loud production guard: a misconfigured production deployment
  // (missing/non-"api" NEXT_PUBLIC_DATA_SOURCE, or missing NEXT_PUBLIC_API_URL)
  // throws here before any business request, so production never silently uses
  // mock/localStorage. No-op in development.
  assertProductionDataSource();
  const dataSource = getDataSourceMode();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

  // In non-API (mock/local) mode the caller workflow must use the local
  // repositories, not this client. Fail loudly instead of hitting a fake base URL.
  if (dataSource !== "api" && !process.env.NEXT_PUBLIC_API_URL) {
    throw new DarfusApiError(
      500,
      "API client called while in mock mode. Use mock state provider instead.",
    );
  }

  const correlationId = generateUUID();
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "X-Correlation-ID": correlationId,
    "Accept-Language": options.locale || "ar",
  };

  if (!(typeof FormData !== "undefined" && options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = options.token ?? readStoredToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    const deviceSessionId = getOrCreateDeviceSessionId();
    if (deviceSessionId) {
      headers["X-Device-Session-ID"] = deviceSessionId;
    }
  }
  const activeBranchId = options.branchId ?? readStoredBranchId();
  if (!options.skipBranch && activeBranchId && activeBranchId.startsWith("BR-")) {
    headers["X-Branch-ID"] = activeBranchId;
  }
  if (options.companyId) {
    headers["X-Company-ID"] = options.companyId;
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const mergedHeaders = { ...headers, ...options.headers };

  try {
    let requestUsedAuth = false;
    const execute = () => {
      const latestToken = readStoredToken() ?? options.token;
      const requestHeaders: Record<string, string> = { ...(mergedHeaders as Record<string, string>) };
      requestUsedAuth = Boolean(latestToken);
      if (latestToken) requestHeaders.Authorization = `Bearer ${latestToken}`;
      return fetch(`${apiBaseUrl}${path}`, { ...options, headers: requestHeaders });
    };
    let response = await execute();

    let text = await response.text();
    let payload: ApiErrorPayload | null = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      // Body is not JSON
    }

    const isAuthEndpoint = path.startsWith("/auth/login") || path.startsWith("/auth/refresh") || path.startsWith("/auth/forgot-password") || path.startsWith("/auth/reset-password") || path.startsWith("/auth/validate-reset-token");
    const errorCode = payload?.errorCode || payload?.code;
    const operatorRecoveryRequired = errorCode ? OPERATOR_RECOVERY_CODES.has(errorCode) : false;
    if (response.status === 401 && requestUsedAuth && !isAuthEndpoint && !operatorRecoveryRequired) {
      const refreshed = await refreshAccessToken(apiBaseUrl, options.locale || "ar");
      if (refreshed) {
        if (!isSafeReadMethod(options.method)) {
          throw new DarfusApiError(
            409,
            options.locale === "en"
              ? "Your session was refreshed. Review the current state and retry this action manually."
              : "تم تحديث الجلسة. راجع الحالة الحالية ثم أعد المحاولة يدويًا.",
            undefined,
            correlationId,
            AUTH_REFRESHED_RETRY_REQUIRED,
          );
        }
        response = await execute();
        text = await response.text();
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          payload = null;
        }
      }
    }

    if (!response.ok) {
      const message = payload?.message || getFallbackErrorMessage(response.status, options.locale || "ar");
      const finalErrorCode = payload?.errorCode || payload?.code;
      const finalOperatorRecoveryRequired = finalErrorCode ? OPERATOR_RECOVERY_CODES.has(finalErrorCode) : false;
      // Employee recovery errors belong to the operator shell, not technical
      // authentication. They must not erase the Branch Account session.
      emitOperatorRecoverySignal(finalErrorCode);
      const apiError = new DarfusApiError(
        response.status,
        message,
        payload?.errors,
        correlationId,
        finalErrorCode,
      );
      if (isTerminalTechnicalAuthError(apiError, requestUsedAuth, isAuthEndpoint, finalOperatorRecoveryRequired)) {
        terminalAuthFailureHandler?.(apiError);
      }
      throw apiError;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DarfusApiError) {
      throw error;
    }
    const netErrorMessage = options.locale === "en" 
      ? "Network error. Please verify server connection." 
      : "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الخادم.";
    throw new DarfusApiError(503, netErrorMessage, undefined, correlationId);
  }
}

const OPERATOR_RECOVERY_CODES = new Set([
  "OPERATOR_SESSION_REQUIRED",
  "OPERATOR_SESSION_EXPIRED",
  "OPERATOR_SESSION_REVOKED",
  "OPERATOR_SESSION_STALE",
  "OPERATOR_SESSION_STALE_CREDENTIAL",
  "OPERATOR_SESSION_STALE_AUTHORIZATION",
  "OPERATOR_BRANCH_MISMATCH",
  "BRANCH_ACCOUNT_EMPLOYEE_REQUIRED",
  "EMPLOYEE_BRANCH_ACCESS_DENIED",
  "EMPLOYEE_CREDENTIAL_REQUIRED",
]);

export function isOperatorRecoveryError(error: unknown): boolean {
  return error instanceof DarfusApiError && Boolean(error.errorCode && OPERATOR_RECOVERY_CODES.has(error.errorCode));
}

export function isTerminalTechnicalAuthError(
  error: unknown,
  requestUsedAuth = true,
  isAuthEndpoint = false,
  operatorRecoveryRequired?: boolean,
): boolean {
  if (!(error instanceof DarfusApiError) || error.status !== 401 || !requestUsedAuth || isAuthEndpoint) return false;
  if (error.errorCode === AUTH_REFRESHED_RETRY_REQUIRED) return false;
  return operatorRecoveryRequired === undefined ? !isOperatorRecoveryError(error) : !operatorRecoveryRequired;
}

export function shouldRetryApiQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (!(error instanceof DarfusApiError)) return true;
  return error.status >= 500 && error.status <= 599;
}

export const OPERATOR_ACTION_REQUIRED_EVENT = "darfus-operator-action-required";

function emitOperatorRecoverySignal(errorCode?: string) {
  if (!errorCode || typeof window === "undefined" || !OPERATOR_RECOVERY_CODES.has(errorCode)) return;
  try {
    window.dispatchEvent(new CustomEvent(OPERATOR_ACTION_REQUIRED_EVENT, { detail: { errorCode, mode: "verify", at: Date.now() } }));
  } catch {
    // UI recovery is best-effort; the API error still surfaces to the caller.
  }
}

function getFallbackErrorMessage(status: number, locale: string): string {
  const isEn = locale === "en";
  switch (status) {
    case 401:
      return isEn ? "Session expired. Please login again." : "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
    case 403:
      return isEn ? "Access denied. Insufficient permissions." : "تم رفض الدخول. لا تملك الصلاحيات الكافية.";
    case 404:
      return isEn ? "Resource not found." : "المورد غير موجود.";
    case 409:
      return isEn ? "State conflict or concurrent update occurred." : "حدث تعارض في الحالة أو تحديث متزامن.";
    case 422:
      return isEn ? "Validation error. Incorrect input data." : "خطأ في التحقق من البيانات. المدخلات غير صحيحة.";
    default:
      return isEn ? "An unexpected server error occurred." : "حدث خطأ غير متوقع في الخادم.";
  }
}
