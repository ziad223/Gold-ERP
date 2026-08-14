"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useErp } from "@/contexts/erp-context";
import type { JournalEntry } from "@/lib/types";
import type { ListQuery, PaginatedResult } from "@/lib/repositories/interfaces";

export type JournalStatusGroup = "all" | "balanced" | "pending";

export interface JournalEntriesQuery {
  page: number;
  pageSize: number;
  search?: string;
  statusGroup?: JournalStatusGroup;
}

const STATUS_GROUPS: Record<Exclude<JournalStatusGroup, "all">, JournalEntry["status"][]> = {
  balanced: ["balanced", "posted"],
  pending: ["pending", "draft", "reversed"],
};

/**
 * Loads real journal entries from the accounting repository.
 * In API mode this hits GET /journal-entries; in mock mode the repository
 * returns an empty set and the page keeps its local demo entries.
 */
export function useJournalEntries({
  page,
  pageSize,
  search = "",
  statusGroup = "all",
}: JournalEntriesQuery) {
  const { accountingRepository } = useErp();
  const [data, setData] = useState<PaginatedResult<JournalEntry>>({
    items: [],
    page,
    pageSize,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchEntries = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const query: ListQuery = {
      page,
      pageSize,
      search: search.trim() || undefined,
      filters: statusGroup === "all" ? undefined : { status: STATUS_GROUPS[statusGroup] },
    };

    setLoading(true);
    setError(null);
    try {
      const result = await accountingRepository.listJournalEntries(query);
      if (requestId.current === currentRequest) {
        setData(result);
      }
    } catch (err: any) {
      if (requestId.current === currentRequest) {
        setError(err?.message || "Failed to fetch journal entries");
      }
    } finally {
      if (requestId.current === currentRequest) {
        setLoading(false);
      }
    }
  }, [accountingRepository, page, pageSize, search, statusGroup]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries: data.items,
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    totalPages: data.totalPages,
    loading,
    error,
    refetch: fetchEntries,
  };
}
