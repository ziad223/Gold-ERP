"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/normalize";
import { DATA_SOURCE } from "@/lib/data-source";
import { queryKeys } from "@/lib/query-keys";
import { useLocale } from "next-intl";

export interface AuditLogRow {
  id: string;
  action: string;
  description: string;
  user: string;
  place: string;
  branch?: string;
  date: string;
  before: string;
  after: string;
  severity: string;
  sourceDocument: string;
}

function normalize(r: any): AuditLogRow {
  const rawDate = (r.date || r.createdAt || "").toString();
  return {
    id: r.id,
    action: r.action || "",
    description: r.description || "",
    user: r.user || "System",
    place: r.place || r.branch || "—",
    branch: r.branch || undefined,
    date: rawDate.replace("T", " ").slice(0, 16),
    before: r.before ?? "",
    after: r.after ?? "",
    severity: r.severity || "info",
    sourceDocument: r.sourceDocument || "",
  };
}

export interface AuditLogsQuery {
  page: number;
  pageSize: number;
  search?: string;
  action?: string;
  severity?: string;
  /** Relative window: "today" | "week" | "month" | "all". Sent as a server-side createdAt `from`. */
  period?: string;
}

const PERIOD_DAYS: Record<string, number> = { today: 1, week: 7, month: 30 };

function buildAuditQueryString(q: AuditLogsQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(q.page));
  params.set("pageSize", String(q.pageSize));
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "desc");
  if (q.search?.trim()) params.set("search", q.search.trim());

  const filters: Record<string, string> = {};
  if (q.action && q.action !== "all") filters.action = q.action;
  if (q.severity && q.severity !== "all") filters.severity = q.severity;
  if (Object.keys(filters).length) params.set("filters", JSON.stringify(filters));

  // Period → server-side createdAt range (from = now - N days). No client-side
  // date filtering: the server applies the bound, so totals/pages stay correct.
  const days = q.period ? PERIOD_DAYS[q.period] : undefined;
  if (days) params.set("from", new Date(Date.now() - days * 86400000).toISOString());

  return params.toString();
}

/**
 * Fetches the real, append-only audit log from the backend (API mode only),
 * server-side paginated/filtered. The page keeps its static demo array as a
 * mock/local fallback. Search + action + severity are applied server-side;
 * the page slice and total come from the server (never the loaded length).
 */
export function useAuditLogs(queryState: AuditLogsQuery = { page: 1, pageSize: 20 }) {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";

  const query = useQuery({
    queryKey: [...queryKeys.auditLogs, queryState],
    queryFn: async () => {
      const res = await apiClient<unknown>(`/audit-logs?${buildAuditQueryString(queryState)}`, { locale });
      const pageData = normalizePage<any>(res, { page: queryState.page, pageSize: queryState.pageSize });
      return { ...pageData, items: pageData.items.map(normalize) };
    },
    enabled: isApi,
  });

  return {
    isApi,
    logs: query.data?.items ?? [],
    page: query.data?.page ?? queryState.page,
    pageSize: query.data?.pageSize ?? queryState.pageSize,
    total: query.data?.total ?? 0,
    totalPages: Math.max(1, query.data?.totalPages ?? 1),
    isLoading: query.isLoading,
    error: query.error,
  };
}
