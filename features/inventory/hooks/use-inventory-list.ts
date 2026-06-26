"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { normalizePage } from "@/lib/api/normalize";
import type { Asset, Product } from "@/lib/types";

/**
 * Server-side paginated lists for the Inventory main tabs (Phase 4B).
 *
 * Products and Assets each fetch their own page from the generic CRUD
 * endpoints, which already honour ?page&pageSize&search&filters and return
 * {items,page,pageSize,total,totalPages}. The page slice + the result total
 * come from the server — never from the length of the loaded array — so the
 * lists are no longer silently capped at the backend default page size.
 *
 * Supported server-side filters (real model columns, verified):
 *   Products: stockType, branchName       (search: productName/code/description)
 *   Assets:   type, status, branch        (search: name/barcode/rfid/category/location)
 */

export interface InventoryListQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  /** Dropdown values; "all"/empty are dropped (treated as "no filter"). */
  filters?: Record<string, string | undefined>;
  /** Assets only: opt into the server-side standalone (no parent) filter. */
  standaloneOnly?: boolean;
}

const EXPORT_PAGE_SIZE = 250;

function buildInventoryQueryString(query: InventoryListQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortDirection) params.set("sortDirection", query.sortDirection);
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.standaloneOnly) params.set("standaloneOnly", "true");

  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (value && value !== "all") filters[key] = value;
  }
  if (Object.keys(filters).length) params.set("filters", JSON.stringify(filters));

  return params.toString();
}

interface PaginatedList<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  /** Fetch every row matching the current query (all pages), for export / print-all. */
  fetchAllMatching: () => Promise<T[]>;
}

function usePaginatedInventoryList<T>(
  entity: string,
  endpoint: string,
  queryState: InventoryListQuery,
): PaginatedList<T> {
  const locale = useLocale();
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

  const fetchPage = async (q: InventoryListQuery) => {
    const res = await apiClient<unknown>(`${endpoint}?${buildInventoryQueryString(q)}`, {
      locale,
      skipBranch: true,
    });
    return normalizePage<T>(res, { page: q.page, pageSize: q.pageSize });
  };

  const query = useQuery({
    queryKey: [entity, "paginated", queryState],
    queryFn: () => fetchPage(queryState),
    enabled: dataSource === "api",
  });

  const fetchAllMatching = async (): Promise<T[]> => {
    if (dataSource !== "api") return [];
    const first = await fetchPage({ ...queryState, page: 1, pageSize: EXPORT_PAGE_SIZE });
    if (first.total === 0) return [];

    const rows = [...first.items];
    const totalPages = Math.max(first.totalPages, Math.ceil(first.total / EXPORT_PAGE_SIZE), 1);
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
      const next = await fetchPage({ ...queryState, page: pageNumber, pageSize: EXPORT_PAGE_SIZE });
      rows.push(...next.items);
    }
    return rows.slice(0, first.total);
  };

  return {
    items: query.data?.items ?? [],
    page: query.data?.page ?? queryState.page,
    pageSize: query.data?.pageSize ?? queryState.pageSize,
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    fetchAllMatching,
  };
}

export function useProductsList(queryState: InventoryListQuery) {
  return usePaginatedInventoryList<Product>("products", "/products", queryState);
}

export function useAssetsList(queryState: InventoryListQuery) {
  return usePaginatedInventoryList<Asset>("assets", "/assets", queryState);
}
