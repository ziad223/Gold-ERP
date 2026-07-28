const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  requestId?: string | null;
};

export async function apiClient<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Language": "ar",
      ...init.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: payload?.error?.message ?? payload?.message ?? "حدث خطأ غير متوقع",
      code: payload?.error?.code ?? payload?.code ?? payload?.errorCode,
      errors: payload?.error?.fields ?? payload?.errors,
      requestId: payload?.error?.requestId ?? payload?.correlationId,
    };
    throw error;
  }

  return payload as T;
}
