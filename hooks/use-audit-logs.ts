"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
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

/**
 * Fetches the real, append-only audit log from the backend (API mode only).
 * The page keeps its static demo array as a mock/local fallback.
 */
export function useAuditLogs() {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";

  const query = useQuery<AuditLogRow[]>({
    queryKey: queryKeys.auditLogs,
    queryFn: async () => {
      const res = await apiClient<{ items: any[] }>(
        "/audit-logs?pageSize=200&sortBy=createdAt&sortDirection=desc",
        { locale },
      );
      return (res.items ?? []).map(normalize);
    },
    enabled: isApi,
  });

  return {
    isApi,
    logs: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
