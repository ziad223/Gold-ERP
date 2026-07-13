"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useErp } from "@/contexts/erp-context";
import { apiClient } from "@/lib/api/client";
import { normalizePage, toFiniteNumber } from "@/lib/api/normalize";
import { getDataSourceMode } from "@/lib/data-source";
import type { Invoice, InvoiceItem } from "@/lib/types";

export const SEARCH_PRINT_INVOICE_TYPES = ["sale", "return", "exchange", "installment", "deposit"] as const;
export const SEARCH_PRINT_STATUSES = ["draft", "posted", "closed", "cancelled", "returned"] as const;

export type SearchPrintInvoiceType = (typeof SEARCH_PRINT_INVOICE_TYPES)[number];
export type SearchPrintStatus = (typeof SEARCH_PRINT_STATUSES)[number];

export interface InvoiceSearchPrintFilters {
  search: string;
  customer: string;
  customerId: string;
  dateFrom: string;
  dateTo: string;
  branch: string;
  type: SearchPrintInvoiceType | "all";
  status: SearchPrintStatus | "all";
}

export interface SearchPrintInvoice extends Invoice {
  type?: SearchPrintInvoiceType;
  searchPrintStatus: SearchPrintStatus;
  employeeName?: string | null;
}

export interface InvoiceSearchPrintQuery {
  page: number;
  pageSize: number;
  filters: InvoiceSearchPrintFilters;
}

function normalizeItem(item: InvoiceItem): InvoiceItem {
  return {
    ...item,
    quantity: toFiniteNumber(item.quantity, 1),
    price: toFiniteNumber(item.price),
    cost: item.cost === undefined ? undefined : toFiniteNumber(item.cost),
    weight: item.weight === undefined ? undefined : toFiniteNumber(item.weight),
    karat: item.karat === undefined ? undefined : toFiniteNumber(item.karat),
    discount: item.discount === undefined ? undefined : toFiniteNumber(item.discount),
    makingCharge: item.makingCharge === undefined ? undefined : toFiniteNumber(item.makingCharge),
    stoneValue: item.stoneValue === undefined ? undefined : toFiniteNumber(item.stoneValue),
  };
}

export function deriveSearchPrintStatus(invoice: Invoice): SearchPrintStatus {
  const postingStatus = invoice.postingStatus ?? "posted";
  if (postingStatus === "cancelled" || invoice.status === "cancelled") return "cancelled";
  if (postingStatus === "draft") return "draft";
  if (invoice.type === "return" || invoice.status === "returned") return "returned";
  if (postingStatus === "posted" && invoice.status === "paid") return "closed";
  return "posted";
}

function normalizeInvoice(invoice: SearchPrintInvoice): SearchPrintInvoice {
  return {
    ...invoice,
    type: (invoice.type || "sale") as SearchPrintInvoiceType,
    total: toFiniteNumber(invoice.total),
    tax: toFiniteNumber(invoice.tax),
    subtotal: invoice.subtotal === undefined ? undefined : toFiniteNumber(invoice.subtotal),
    discount: invoice.discount === undefined ? undefined : toFiniteNumber(invoice.discount),
    makingCharge: invoice.makingCharge === undefined ? undefined : toFiniteNumber(invoice.makingCharge),
    stoneValue: invoice.stoneValue === undefined ? undefined : toFiniteNumber(invoice.stoneValue),
    deposit: invoice.deposit === undefined ? undefined : toFiniteNumber(invoice.deposit),
    paidAmount: invoice.paidAmount === undefined ? undefined : toFiniteNumber(invoice.paidAmount),
    remainingAmount: invoice.remainingAmount === undefined ? undefined : toFiniteNumber(invoice.remainingAmount),
    items: Array.isArray(invoice.items) ? invoice.items.map(normalizeItem) : [],
    searchPrintStatus: invoice.searchPrintStatus || deriveSearchPrintStatus(invoice),
    employeeName: invoice.employeeName ?? null,
  };
}

function buildQueryString(query: InvoiceSearchPrintQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  const { filters } = query;
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.customer.trim()) params.set("customer", filters.customer.trim());
  if (filters.customerId.trim()) params.set("customerId", filters.customerId.trim());
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.branch !== "all") params.set("branch", filters.branch);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.status !== "all") params.set("status", filters.status);
  return params.toString();
}

function matchesLocalFilters(invoice: SearchPrintInvoice, filters: InvoiceSearchPrintFilters) {
  const invoiceType = (invoice.type || "sale") as SearchPrintInvoiceType;
  if (!SEARCH_PRINT_INVOICE_TYPES.includes(invoiceType)) return false;

  const invoiceNumberSearch = filters.search.trim().toLowerCase();
  const customerSearch = filters.customer.trim().toLowerCase();
  const customerIdSearch = filters.customerId.trim().toLowerCase();
  const matchesInvoiceNumber = !invoiceNumberSearch || [invoice.id, invoice.invoiceNumber || ""]
    .some((value) => String(value).toLowerCase().includes(invoiceNumberSearch));
  const matchesCustomer = !customerSearch || String(invoice.customerName || "").toLowerCase().includes(customerSearch);
  const matchesCustomerId = !customerIdSearch || String(invoice.customerId || "").toLowerCase().includes(customerIdSearch);
  const invoiceDate = String(invoice.date || "").slice(0, 10);
  const matchesDateFrom = !filters.dateFrom || invoiceDate >= filters.dateFrom;
  const matchesDateTo = !filters.dateTo || invoiceDate <= filters.dateTo;
  const matchesBranch = filters.branch === "all" || invoice.branch === filters.branch;
  const matchesType = filters.type === "all" || invoiceType === filters.type;
  const matchesStatus = filters.status === "all" || deriveSearchPrintStatus(invoice) === filters.status;

  return matchesInvoiceNumber && matchesCustomer && matchesCustomerId && matchesDateFrom
    && matchesDateTo && matchesBranch && matchesType && matchesStatus;
}

export function useInvoiceSearchPrint(queryState: InvoiceSearchPrintQuery) {
  const { invoices: localInvoices } = useErp();
  const locale = useLocale();
  const dataSource = getDataSourceMode();

  const query = useQuery({
    queryKey: ["invoices", "search-print", queryState],
    queryFn: async () => {
      const response = await apiClient<unknown>(`/invoices/search-print?${buildQueryString(queryState)}`, { locale });
      const page = normalizePage<SearchPrintInvoice>(response, queryState);
      return { ...page, items: page.items.map(normalizeInvoice) };
    },
    enabled: dataSource === "api",
  });

  if (dataSource !== "api") {
    const filtered = localInvoices
      .map((invoice) => normalizeInvoice({
        ...invoice,
        searchPrintStatus: deriveSearchPrintStatus(invoice),
        employeeName: null,
      } as SearchPrintInvoice))
      .filter((invoice) => matchesLocalFilters(invoice, queryState.filters))
      .sort((left, right) => String(right.date).localeCompare(String(left.date)));
    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / queryState.pageSize), 1);
    const offset = (queryState.page - 1) * queryState.pageSize;
    return {
      invoices: filtered.slice(offset, offset + queryState.pageSize),
      page: queryState.page,
      pageSize: queryState.pageSize,
      total,
      totalPages,
      isLoading: false,
      error: null,
      refetch: query.refetch,
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
  };
}
