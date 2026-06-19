"use client";

import { useCallback, useEffect, useState } from "react";
import { useErp } from "@/contexts/erp-context";
import type { JournalEntry } from "@/lib/types";
import type { ListQuery, PaginatedResult } from "@/lib/repositories/interfaces";

/**
 * Loads real journal entries from the accounting repository.
 * In API mode this hits GET /journal-entries; in mock mode the repository
 * returns an empty set and the page keeps its local demo entries.
 */
export function useJournalEntries(initialQuery: ListQuery = { page: 1, pageSize: 25 }) {
  const { accountingRepository } = useErp();
  const [data, setData] = useState<PaginatedResult<JournalEntry>>({
    items: [],
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ListQuery>(initialQuery);

  const fetchEntries = useCallback(
    async (q: ListQuery) => {
      setLoading(true);
      setError(null);
      try {
        const result = await accountingRepository.listJournalEntries(q);
        setData(result);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch journal entries");
      } finally {
        setLoading(false);
      }
    },
    [accountingRepository],
  );

  useEffect(() => {
    fetchEntries(query);
  }, [query, fetchEntries]);

  return {
    ...data,
    loading,
    error,
    query,
    setQuery,
    refresh: () => fetchEntries(query),
  };
}
