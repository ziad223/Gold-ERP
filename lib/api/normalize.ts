export interface NormalizedPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function normalizeItems<T>(response: unknown): T[] {
  const res = response as any;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export function normalizeEntity<T>(response: unknown): T | null {
  const res = response as any;
  return (res?.data ?? res ?? null) as T | null;
}

export function normalizePage<T>(
  response: unknown,
  fallback: Partial<Pick<NormalizedPage<T>, "page" | "pageSize">> = {},
): NormalizedPage<T> {
  const res = response as any;
  const items = normalizeItems<T>(response);
  const page = Number(res?.page ?? res?.data?.page ?? fallback.page ?? 1);
  const pageSize = Number(res?.pageSize ?? res?.data?.pageSize ?? fallback.pageSize ?? items.length);
  const total = Number(res?.total ?? res?.data?.total ?? items.length);
  const totalPages = Number(
    res?.totalPages ?? res?.data?.totalPages ?? (pageSize > 0 ? Math.ceil(total / pageSize) : 1),
  );

  return {
    items,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : items.length,
    total: Number.isFinite(total) ? total : items.length,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
  };
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}
