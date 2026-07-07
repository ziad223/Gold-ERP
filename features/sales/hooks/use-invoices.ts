"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useErp } from "@/contexts/erp-context";
import { apiClient } from "@/lib/api/client";
import { getDataSourceMode } from "@/lib/data-source";
import { normalizePage, toFiniteNumber } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import type { Invoice, InvoiceItem } from "@/lib/types";

interface InvoiceListResponse {
  items?: Invoice[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  data?: {
    items?: Invoice[];
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface InvoiceListQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
  filters?: {
    status?: string;
    branch?: string;
  };
}

const EXPORT_PAGE_SIZE = 250;

const normalizeInvoiceItem = (item: Partial<InvoiceItem>): InvoiceItem => ({
  assetId: item.assetId || "",
  name: item.name || "",
  quantity: toFiniteNumber(item.quantity, 1),
  price: toFiniteNumber(item.price),
  cost: item.cost === undefined ? undefined : toFiniteNumber(item.cost),
  weight: item.weight === undefined ? undefined : toFiniteNumber(item.weight),
  karat: item.karat === undefined ? undefined : toFiniteNumber(item.karat),
  discount: item.discount === undefined ? undefined : toFiniteNumber(item.discount),
  makingCharge: item.makingCharge === undefined ? undefined : toFiniteNumber(item.makingCharge),
  stoneValue: item.stoneValue === undefined ? undefined : toFiniteNumber(item.stoneValue),
});

const normalizeInvoice = (invoice: Invoice): Invoice => ({
  ...invoice,
  total: toFiniteNumber(invoice.total),
  tax: toFiniteNumber(invoice.tax),
  subtotal: invoice.subtotal === undefined ? undefined : toFiniteNumber(invoice.subtotal),
  discount: invoice.discount === undefined ? undefined : toFiniteNumber(invoice.discount),
  makingCharge: invoice.makingCharge === undefined ? undefined : toFiniteNumber(invoice.makingCharge),
  stoneValue: invoice.stoneValue === undefined ? undefined : toFiniteNumber(invoice.stoneValue),
  deposit: invoice.deposit === undefined ? undefined : toFiniteNumber(invoice.deposit),
  items: Array.isArray(invoice.items) ? invoice.items.map(normalizeInvoiceItem) : [],
});

function buildInvoiceQueryString(query: InvoiceListQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("sortBy", query.sortBy || "createdAt");
  params.set("sortDirection", query.sortDirection || "desc");
  if (query.search?.trim()) params.set("search", query.search.trim());

  const filters: Record<string, string> = {};
  if (query.filters?.status && query.filters.status !== "all") filters.status = query.filters.status;
  if (query.filters?.branch && query.filters.branch !== "all") filters.branch = query.filters.branch;
  if (Object.keys(filters).length) params.set("filters", JSON.stringify(filters));

  return params.toString();
}

function filterLocalInvoices(invoices: Invoice[], query: InvoiceListQuery) {
  const search = query.search?.trim().toLowerCase();
  return invoices.filter((invoice) => {
    const matchesSearch = !search || [
      invoice.id,
      invoice.invoiceNumber || "",
      invoice.customerName,
      invoice.paymentMethod,
      invoice.branch,
    ].some((field) => String(field || "").toLowerCase().includes(search));
    const matchesStatus = !query.filters?.status || query.filters.status === "all" || invoice.status === query.filters.status;
    const matchesBranch = !query.filters?.branch || query.filters.branch === "all" || invoice.branch === query.filters.branch;
    return matchesSearch && matchesStatus && matchesBranch;
  });
}

export function useInvoices(queryState: InvoiceListQuery = { page: 1, pageSize: 20 }) {
  const { invoices: localInvoices } = useErp();
  const locale = useLocale();
  const dataSource = getDataSourceMode();

  const fetchInvoicePage = async (pageQuery: InvoiceListQuery) => {
    const res = await apiClient<InvoiceListResponse>(`/invoices?${buildInvoiceQueryString(pageQuery)}`, { locale });
    const page = normalizePage<Invoice>(res, { page: pageQuery.page, pageSize: pageQuery.pageSize });
    return {
      ...page,
      items: page.items.map(normalizeInvoice),
    };
  };

  const query = useQuery({
    queryKey: [...queryKeys.invoices, queryState],
    queryFn: () => fetchInvoicePage(queryState),
    enabled: dataSource === "api",
  });

  const fetchAllMatching = async () => {
    if (dataSource !== "api") {
      return filterLocalInvoices(localInvoices.map(normalizeInvoice), { ...queryState, page: 1, pageSize: localInvoices.length || 1 });
    }

    const firstPage = await fetchInvoicePage({ ...queryState, page: 1, pageSize: EXPORT_PAGE_SIZE });
    if (firstPage.total === 0) return [];

    const rows = [...firstPage.items];
    const exportTotalPages = Math.max(firstPage.totalPages, Math.ceil(firstPage.total / EXPORT_PAGE_SIZE), 1);

    for (let pageNumber = 2; pageNumber <= exportTotalPages; pageNumber += 1) {
      const nextPage = await fetchInvoicePage({ ...queryState, page: pageNumber, pageSize: EXPORT_PAGE_SIZE });
      rows.push(...nextPage.items);
    }

    return rows.slice(0, firstPage.total);
  };

  if (dataSource !== "api") {
    const filtered = filterLocalInvoices(localInvoices.map(normalizeInvoice), queryState);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / queryState.pageSize));
    const offset = (queryState.page - 1) * queryState.pageSize;
    const pageItems = filtered.slice(offset, offset + queryState.pageSize);
    return {
      invoices: pageItems,
      page: queryState.page,
      pageSize: queryState.pageSize,
      total,
      totalPages,
      isLoading: false,
      error: null,
      refetch: async () => ({ data: pageItems }),
      fetchAllMatching,
    };
  }

  return {
    invoices: query.data?.items ?? [],
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
