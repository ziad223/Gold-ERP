import { getDataSourceMode, assertProductionDataSource } from "@/lib/data-source";
import { ensureAuthFreshness, type AuthFreshnessResult } from "@/lib/api/auth-freshness";
import { canonicalBusinessHash } from "@/lib/api/canonical-business-hash";
import { isPearlConfirmInterceptionActive, recordPearlConfirmDiagnostic } from "@/lib/debug/pearl-confirm-dispatch";

export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  code?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
    details?: Record<string, unknown> | null;
    requestId?: string | null;
  };
}

export class DarfusApiError extends Error {
  status: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
  details?: Record<string, unknown> | null;
  isNetworkError: boolean;
  isAuthError: boolean;
  isPermissionError: boolean;
  isValidationError: boolean;
  isConflictError: boolean;
  isServerError: boolean;

  constructor(status: number, message: string, errors?: Record<string, string[]>, correlationId?: string, errorCode?: string, details?: Record<string, unknown> | null, isNetworkError = false) {
    super(message);
    this.name = "DarfusApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;
    this.correlationId = correlationId;
    this.details = details;
    this.isNetworkError = isNetworkError;
    this.isAuthError = status === 401;
    this.isPermissionError = status === 403;
    this.isValidationError = status === 422;
    this.isConflictError = status === 409;
    this.isServerError = status >= 500 && status <= 599 && !isNetworkError;
  }
}

function parseApiErrorPayload(payload: ApiErrorPayload | null, status: number, locale: string, fallbackRequestId: string): DarfusApiError {
  const error = payload?.error;
  return new DarfusApiError(
    status,
    error?.message || payload?.message || getFallbackErrorMessage(status, locale),
    error?.fields || payload?.errors,
    error?.requestId || payload?.correlationId || fallbackRequestId,
    error?.code || payload?.errorCode || payload?.code,
    error?.details || null,
  );
}

export const AUTH_REFRESHED_RETRY_REQUIRED = "AUTH_REFRESHED_RETRY_REQUIRED";

type TerminalAuthFailureHandler = (error: DarfusApiError) => void;
type CompanyContextFailureHandler = (error: DarfusApiError) => void;
type BranchContextFailureHandler = (error: DarfusApiError) => void;
type CompanyContextAccessor = () => { companyId: string; generation: number } | null;
type BranchContextAccessor = () => { branchId: string; generation: number } | null;

let terminalAuthFailureHandler: TerminalAuthFailureHandler | null = null;
let companyContextFailureHandler: CompanyContextFailureHandler | null = null;
let companyContextAccessor: CompanyContextAccessor | null = null;
let branchContextFailureHandler: BranchContextFailureHandler | null = null;
let branchContextAccessor: BranchContextAccessor | null = null;
let branchContextTransitioning = false;

export function registerTerminalAuthFailureHandler(handler: TerminalAuthFailureHandler): () => void {
  terminalAuthFailureHandler = handler;
  return () => {
    if (terminalAuthFailureHandler === handler) terminalAuthFailureHandler = null;
  };
}

export function reportTerminalTechnicalAuthFailure(error: DarfusApiError): void {
  if (isTerminalTechnicalAuthError(error)) terminalAuthFailureHandler?.(error);
}

export function registerCompanyContextAccessor(accessor: CompanyContextAccessor | null): () => void {
  companyContextAccessor = accessor;
  return () => {
    if (companyContextAccessor === accessor) companyContextAccessor = null;
  };
}

/** Synchronous transition boundary used before Company-scoped children render. */
export function setCompanyContextAccessor(accessor: CompanyContextAccessor | null): void {
  companyContextAccessor = accessor;
}

/** Synchronous transition boundary used before Branch-scoped children render. */
export function setBranchContextAccessor(accessor: BranchContextAccessor | null): void {
  branchContextAccessor = accessor;
}

/**
 * Imperative request guard for the small interval before React consumers
 * observe a Branch transition. This prevents a stale READY render from
 * emitting a headerless Branch-scoped request.
 */
export function setBranchContextTransitioning(transitioning: boolean): void {
  branchContextTransitioning = transitioning;
}

function createBranchTransitionAbort(): Error {
  const error = new Error("Branch context transition in progress");
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function registerBranchContextFailureHandler(handler: BranchContextFailureHandler): () => void {
  branchContextFailureHandler = handler;
  return () => {
    if (branchContextFailureHandler === handler) branchContextFailureHandler = null;
  };
}

export function registerCompanyContextFailureHandler(handler: CompanyContextFailureHandler): () => void {
  companyContextFailureHandler = handler;
  return () => {
    if (companyContextFailureHandler === handler) companyContextFailureHandler = null;
  };
}

export function reportCompanyContextFailure(error: DarfusApiError): void {
  if (error.errorCode === "COMPANY_SCOPE_INVALID" || error.errorCode === "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED") {
    companyContextFailureHandler?.(error);
  }
}

export function reportBranchContextFailure(error: DarfusApiError): void {
  if (error.errorCode === "BRANCH_CONTEXT_REQUIRED" || error.errorCode === "BRANCH_SCOPE_INVALID") {
    branchContextFailureHandler?.(error);
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

export interface ApiClientOptions extends RequestInit {
  branchId?: string;
  companyId?: string;
  token?: string;
  locale?: string;
  idempotencyKey?: string;
  skipBranch?: boolean;
  /** Explicitly suppresses the selected Company for context-free endpoints. */
  companyScope?: "auto" | "none";
  /** Development-only redacted diagnostics for the Pearl confirm dispatch path. */
  pearlConfirmDiagnostic?: { correlationId: string };
  /** Local acceptance-only response status observation; never carries auth material. */
  onResponseStatus?: (status: number) => void;
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

export function getStoredAccessToken(): string | undefined {
  return readStoredToken();
}

/** Mirrors the server's purchase.receive request hash without exposing auth material. */
export { canonicalBusinessHash };

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

function isContextFreePath(path: string): boolean {
  return path.startsWith("/auth/") || path.startsWith("/health") || path.startsWith("/setup/");
}

export function resolvedCompanyIdForRequest(path: string, options: Pick<ApiClientOptions, "companyId" | "companyScope"> = {}): string | undefined {
  if (options.companyId) return options.companyId;
  if (options.companyScope === "none" || isContextFreePath(path)) return undefined;
  return companyContextAccessor?.()?.companyId;
}

export function resolvedBranchIdForRequest(options: Pick<ApiClientOptions, "branchId" | "skipBranch"> = {}): string | undefined {
  if (options.skipBranch) return undefined;
  if (options.branchId) return options.branchId;
  return branchContextAccessor?.()?.branchId;
}

export function requestContextSnapshot(path: string, options: Pick<ApiClientOptions, "companyId" | "companyScope" | "branchId" | "skipBranch"> = {}): { companyId?: string; branchId?: string } {
  return {
    companyId: resolvedCompanyIdForRequest(path, options),
    branchId: resolvedBranchIdForRequest(options),
  };
}

export async function preConfirmAuthFreshness(locale = "ar"): Promise<AuthFreshnessResult> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  return ensureAuthFreshness({
    readToken: readStoredToken,
    refresh: () => refreshAccessToken(apiBaseUrl, locale),
  });
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
  if (branchContextTransitioning && !options.skipBranch && !isContextFreePath(path)) {
    throw createBranchTransitionAbort();
  }
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
  const activeBranchId = resolvedBranchIdForRequest(options);
  if (activeBranchId) {
    headers["X-Branch-ID"] = activeBranchId;
  }
  const selectedCompanyId = resolvedCompanyIdForRequest(path, options);
  if (selectedCompanyId) {
    headers["X-Company-ID"] = selectedCompanyId;
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const mergedHeaders = { ...headers, ...options.headers };

  try {
    let requestUsedAuth = false;
    const execute = async () => {
      const latestToken = readStoredToken() ?? options.token;
      const requestHeaders: Record<string, string> = { ...(mergedHeaders as Record<string, string>) };
      requestUsedAuth = Boolean(latestToken);
      if (latestToken) requestHeaders.Authorization = `Bearer ${latestToken}`;
      if (options.pearlConfirmDiagnostic && path === "/purchase-orders/receive" && String(options.method || "GET").toUpperCase() === "POST") {
        recordPearlConfirmDiagnostic({
          correlationId: options.pearlConfirmDiagnostic.correlationId,
          eventName: "PEARL_CONFIRM_FETCH_ATTEMPT",
          method: "POST",
          path: "/purchase-orders/receive",
          fetchAttempted: true,
        });
      }
      if (options.pearlConfirmDiagnostic && isPearlConfirmInterceptionActive() && path === "/purchase-orders/receive" && String(options.method || "GET").toUpperCase() === "POST") {
        recordPearlConfirmDiagnostic({
          correlationId: options.pearlConfirmDiagnostic.correlationId,
          eventName: "PEARL_CONFIRM_BROWSER_NETWORK_INTERCEPTED",
          method: "POST",
          path: "/purchase-orders/receive",
          browserRequestObserved: true,
          outcome: "RETURNED",
          status: 200,
        });
        return new Response(JSON.stringify({ success: true, data: { diagnosticIntercepted: true } }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      try {
        const fetched = await fetch(`${apiBaseUrl}${path}`, { ...options, headers: requestHeaders });
        options.onResponseStatus?.(fetched.status);
        if (options.pearlConfirmDiagnostic && path === "/purchase-orders/receive" && String(options.method || "GET").toUpperCase() === "POST") {
          recordPearlConfirmDiagnostic({
            correlationId: options.pearlConfirmDiagnostic.correlationId,
            eventName: "PEARL_CONFIRM_FETCH_RETURNED_OR_REJECTED",
            method: "POST",
            path: "/purchase-orders/receive",
            fetchAttempted: true,
            outcome: "RETURNED",
            status: fetched.status,
          });
        }
        return fetched;
      } catch (error) {
        if (options.pearlConfirmDiagnostic && path === "/purchase-orders/receive" && String(options.method || "GET").toUpperCase() === "POST") {
          recordPearlConfirmDiagnostic({
            correlationId: options.pearlConfirmDiagnostic.correlationId,
            eventName: "PEARL_CONFIRM_FETCH_RETURNED_OR_REJECTED",
            method: "POST",
            path: "/purchase-orders/receive",
            fetchAttempted: true,
            outcome: "REJECTED",
          });
        }
        throw error;
      }
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
    const errorCode = payload?.error?.code || payload?.errorCode || payload?.code;
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
      const finalErrorCode = payload?.error?.code || payload?.errorCode || payload?.code;
      const finalOperatorRecoveryRequired = finalErrorCode ? OPERATOR_RECOVERY_CODES.has(finalErrorCode) : false;
      // Employee recovery errors belong to the operator shell, not technical
      // authentication. They must not erase the Branch Account session.
      emitOperatorRecoverySignal(finalErrorCode);
      const apiError = parseApiErrorPayload(payload, response.status, options.locale || "ar", correlationId);
      if (isTerminalTechnicalAuthError(apiError, requestUsedAuth, isAuthEndpoint, finalOperatorRecoveryRequired)) {
        reportTerminalTechnicalAuthFailure(apiError);
      }
      reportCompanyContextFailure(apiError);
      reportBranchContextFailure(apiError);
      throw apiError;
    }

    return payload as T;
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (error instanceof DarfusApiError) {
      throw error;
    }
    const netErrorMessage = options.locale === "en" 
      ? "Network error. Please verify server connection." 
      : "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الخادم.";
    throw new DarfusApiError(503, netErrorMessage, undefined, correlationId, "NETWORK_ERROR", null, true);
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
  if (isAbortError(error)) return false;
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
