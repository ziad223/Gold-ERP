export interface ApiErrorPayload {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}

export class DarfusApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  correlationId?: string;

  constructor(status: number, message: string, errors?: Record<string, string[]>, correlationId?: string) {
    super(message);
    this.name = "DarfusApiError";
    this.status = status;
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

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

  // If mock mode is active, the caller workflow is responsible for using the mock context.
  // The API client will throw an error if called in mock mode without a real API URL.
  if (dataSource === "mock" && !process.env.NEXT_PUBLIC_API_URL) {
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
      throw new DarfusApiError(
        response.status,
        message,
        payload?.errors,
        correlationId,
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
