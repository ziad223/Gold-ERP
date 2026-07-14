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
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: mergedHeaders,
    });

    const text = await response.text();
    let payload: ApiErrorPayload | null = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      // Body is not JSON
    }

    if (!response.ok) {
      const message = payload?.message || getFallbackErrorMessage(response.status, options.locale || "ar");
      const errorCode = payload?.errorCode || payload?.code;
      emitOperatorRecoverySignal(errorCode);
      throw new DarfusApiError(
        response.status,
        message,
        payload?.errors,
        correlationId,
        errorCode,
      );
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
  "OPERATOR_SESSION_STALE",
  "OPERATOR_BRANCH_MISMATCH",
  "OPERATOR_PERMISSION_DENIED",
  "OPERATOR_STEP_UP_REQUIRED",
  "OPERATOR_STEP_UP_EXPIRED",
]);

export const OPERATOR_ACTION_REQUIRED_EVENT = "darfus-operator-action-required";

function emitOperatorRecoverySignal(errorCode?: string) {
  if (!errorCode || typeof window === "undefined" || !OPERATOR_RECOVERY_CODES.has(errorCode)) return;
  const mode = errorCode.includes("STEP_UP") ? "step-up" : "verify";
  try {
    window.dispatchEvent(new CustomEvent(OPERATOR_ACTION_REQUIRED_EVENT, { detail: { errorCode, mode, at: Date.now() } }));
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
