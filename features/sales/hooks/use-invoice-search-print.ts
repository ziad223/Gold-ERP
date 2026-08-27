"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useErp } from "@/contexts/erp-context";
import { apiClient } from "@/lib/api/client";
import { toFiniteNumber } from "@/lib/api/normalize";
import { getDataSourceMode } from "@/lib/data-source";
import type { Invoice, InvoiceItem } from "@/lib/types";

export const SEARCH_PRINT_INVOICE_TYPES = ["sale", "return", "exchange", "installment", "deposit", "customer_gold_purchase"] as const;
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
  employee: string;
  types: SearchPrintInvoiceType[];
  status: SearchPrintStatus | "all";
}

export interface InvoiceProjectionDetail {
  summary: Record<string, any>;
  lines: Array<Record<string, any>>;
  taxSummary?: Record<string, any>;
  paymentSummary?: Record<string, any>;
  sourceLinks?: Record<string, any>;
  audit?: Record<string, any>;
}

export interface SearchPrintInvoice extends Invoice {
  type?: SearchPrintInvoiceType;
  searchPrintStatus: SearchPrintStatus;
  employeeName?: string | null;
  projectionReference?: string | null;
  projectionSummary?: Record<string, any>;
  projectionDetail?: InvoiceProjectionDetail & { goldPurchaseDetails?: Array<Record<string, any>> };
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

function isSearchPrintStatus(value: unknown): value is SearchPrintStatus {
  return typeof value === "string" && (SEARCH_PRINT_STATUSES as readonly string[]).includes(value);
}

function normalizeProjectionStatus(summary: Record<string, any>): SearchPrintStatus {
  if (isSearchPrintStatus(summary.displayStatus)) return summary.displayStatus;
  const businessStatus = String(summary.businessStatus || "").toLowerCase();
  if (businessStatus === "draft") return "draft";
  if (["cancelled", "reversed", "voided"].includes(businessStatus)) return "cancelled";
  if (summary.sourceType === "return" || String(summary.paymentStatus || "").toLowerCase() === "returned") return "returned";
  if (String(summary.paymentStatus || "").toLowerCase() === "paid") return "closed";
  return "posted";
}

function paymentStatus(value: unknown): Invoice["status"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "partial") return "partial";
  if (normalized === "returned") return "returned";
  if (["cancelled", "reversed", "voided"].includes(normalized)) return "cancelled";
  return "due";
}

function postingStatus(value: unknown): Invoice["postingStatus"] {
  const normalized = String(value || "posted").toLowerCase();
  if (normalized === "draft") return "draft";
  if (["cancelled", "reversed", "voided"].includes(normalized)) return "cancelled";
  return "posted";
}

function normalizeSummary(summary: Record<string, any>): SearchPrintInvoice {
  const sourceType = String(summary.sourceType || "sale") as SearchPrintInvoiceType;
  const operator = summary.operatorAttribution || {};
  return {
    id: String(summary.sourceId || summary.projectionReference || ""),
    type: sourceType,
    customerId: String(summary.partyId || ""),
    customerName: String(summary.partyDisplayName || ""),
    date: String(summary.documentDate || ""),
    total: toFiniteNumber(summary.grandTotal),
    tax: toFiniteNumber(summary.taxTotal),
    subtotal: summary.subtotal == null ? undefined : toFiniteNumber(summary.subtotal),
    discount: summary.discountTotal == null ? undefined : toFiniteNumber(summary.discountTotal),
    status: paymentStatus(summary.paymentStatus),
    postingStatus: postingStatus(summary.businessStatus),
    paymentMethod: "—",
    branch: String(summary.branchName || summary.branchId || ""),
    items: [],
    invoiceNumber: summary.displayNumber ? String(summary.displayNumber) : null,
    paidAmount: undefined,
    remainingAmount: undefined,
    searchPrintStatus: normalizeProjectionStatus(summary),
    employeeName: summary.employeeName || operator.finalizedByEmployeeName || operator.createdByEmployeeName || null,
    projectionReference: summary.projectionReference || null,
    projectionSummary: summary,
  };
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

export function projectionDetailToInvoice(detail: InvoiceProjectionDetail, fallback?: SearchPrintInvoice | null): SearchPrintInvoice {
  const summary = detail.summary || {};
  const tax = detail.taxSummary || {};
  const payment = detail.paymentSummary || {};
  const lines = Array.isArray(detail.lines) ? detail.lines : [];
  const fallbackInvoice = fallback || normalizeSummary(summary);
  const items = lines.map((line, index) => {
    const assetLink = Array.isArray(line.assetLinks) ? line.assetLinks[0] || {} : {};
    const gold = line.goldPurchase || {};
    const lineId = Number(line.lineReference);
    return {
      id: Number.isFinite(lineId) ? lineId : undefined,
      assetId: String(line.assetReference || assetLink.assetId || ""),
      barcode: assetLink.barcode ? String(assetLink.barcode) : undefined,
      name: String(line.description || gold.goldType || `Line ${index + 1}`),
      quantity: toFiniteNumber(line.quantity, 1),
      price: toFiniteNumber(line.lineTotal ?? line.unitPrice),
      weight: line.weight == null ? undefined : toFiniteNumber(line.weight),
      karat: line.karat == null ? undefined : toFiniteNumber(line.karat),
      makingCharge: line.makingCharge == null ? undefined : toFiniteNumber(line.makingCharge),
      stoneValue: line.stoneValue == null ? undefined : toFiniteNumber(line.stoneValue),
    };
  });
  const paymentRows = Array.isArray(payment.rows) ? payment.rows : [];
  const goldPurchaseDetails = lines.map((line) => line.goldPurchase).filter(Boolean);
  return normalizeInvoice({
    ...fallbackInvoice,
    id: String(summary.sourceId || fallbackInvoice.id),
    type: String(summary.sourceType || fallbackInvoice.type || "sale") as SearchPrintInvoiceType,
    customerId: String(summary.partyId || fallbackInvoice.customerId || ""),
    customerName: String(summary.partyDisplayName || fallbackInvoice.customerName || ""),
    date: String(summary.documentDate || fallbackInvoice.date || ""),
    branch: String(summary.branchName || summary.branchId || fallbackInvoice.branch || ""),
    invoiceNumber: summary.displayNumber || fallbackInvoice.invoiceNumber || null,
    total: toFiniteNumber(tax.grandTotal ?? summary.grandTotal),
    tax: toFiniteNumber(tax.tax),
    vatRate: tax.vatRate == null ? undefined : toFiniteNumber(tax.vatRate),
    subtotal: tax.subtotal == null ? undefined : toFiniteNumber(tax.subtotal),
    discount: tax.discount == null ? undefined : toFiniteNumber(tax.discount),
    status: paymentStatus(payment.paymentStatus || summary.paymentStatus),
    postingStatus: postingStatus(summary.businessStatus),
    paymentMethod: paymentRows[0]?.method ? String(paymentRows[0].method) : "—",
    paymentSplits: paymentRows.map((row: any) => ({ method: String(row.method || "—"), amount: toFiniteNumber(row.amount) })),
    paidAmount: payment.paidAmount == null ? undefined : toFiniteNumber(payment.paidAmount),
    remainingAmount: payment.remainingAmount == null ? undefined : toFiniteNumber(payment.remainingAmount),
    items,
    projectionReference: summary.projectionReference || fallbackInvoice.projectionReference || null,
    projectionSummary: summary,
    projectionDetail: { ...detail, goldPurchaseDetails },
    employeeName: summary.employeeName || fallbackInvoice.employeeName || null,
    searchPrintStatus: normalizeProjectionStatus(summary),
  });
}

function buildQueryString(query: InvoiceSearchPrintQuery) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  const { filters } = query;
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.customer.trim()) params.set("partyName", filters.customer.trim());
  if (filters.customerId.trim()) params.set("partyId", filters.customerId.trim());
  if (filters.employee.trim()) params.set("employee", filters.employee.trim());
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.branch !== "all") params.set("branchId", filters.branch);
  if (filters.types.length) params.set("sourceTypes", filters.types.join(","));
  if (filters.status !== "all") params.set("status", filters.status);
  return params.toString();
}

function matchesLocalFilters(invoice: SearchPrintInvoice, filters: InvoiceSearchPrintFilters) {
  const invoiceType = (invoice.type || "sale") as SearchPrintInvoiceType;
  if (!filters.types.includes(invoiceType)) return false;
  const invoiceNumberSearch = filters.search.trim().toLowerCase();
  const customerSearch = filters.customer.trim().toLowerCase();
  const customerIdSearch = filters.customerId.trim().toLowerCase();
  const employeeSearch = filters.employee.trim().toLowerCase();
  const matchesInvoiceNumber = !invoiceNumberSearch || [invoice.id, invoice.invoiceNumber || ""]
    .some((value) => String(value).toLowerCase().includes(invoiceNumberSearch));
  const matchesCustomer = !customerSearch || String(invoice.customerName || "").toLowerCase().includes(customerSearch);
  const matchesCustomerId = !customerIdSearch || String(invoice.customerId || "").toLowerCase().includes(customerIdSearch);
  const matchesEmployee = !employeeSearch || String(invoice.employeeName || "").toLowerCase().includes(employeeSearch);
  const invoiceDate = String(invoice.date || "").slice(0, 10);
  const matchesDateFrom = !filters.dateFrom || invoiceDate >= filters.dateFrom;
  const matchesDateTo = !filters.dateTo || invoiceDate <= filters.dateTo;
  const matchesBranch = filters.branch === "all" || invoice.branch === filters.branch;
  const matchesStatus = filters.status === "all" || invoice.searchPrintStatus === filters.status;
  return matchesInvoiceNumber && matchesCustomer && matchesCustomerId && matchesEmployee && matchesDateFrom
    && matchesDateTo && matchesBranch && matchesStatus;
}

export function useInvoiceProjectionDetail(invoice: SearchPrintInvoice | null) {
  const locale = useLocale();
  return useQuery({
    queryKey: ["invoice-projection", "detail", invoice?.type, invoice?.id],
    queryFn: async () => {
      const response = await apiClient<{ data: InvoiceProjectionDetail }>(`/invoice-projection/${invoice?.type}/${invoice?.id}`, { locale });
      return projectionDetailToInvoice(response.data, invoice);
    },
    enabled: getDataSourceMode() === "api" && Boolean(invoice?.type && invoice?.id),
    staleTime: 30_000,
  });
}

export function useInvoiceSearchPrint(queryState: InvoiceSearchPrintQuery) {
  const { invoices: localInvoices } = useErp();
  const locale = useLocale();
  const dataSource = getDataSourceMode();
  const query = useQuery({
    queryKey: ["invoice-projection", "summaries", queryState],
    queryFn: async () => {
      const response = await apiClient<{ data: { items: Record<string, any>[]; page: number; pageSize: number; total: number; totalPages: number } }>(`/invoice-projection/summaries?${buildQueryString(queryState)}`, { locale });
      const page = response.data;
      return { ...page, items: (page.items || []).map(normalizeSummary) };
    },
    enabled: dataSource === "api",
  });

  if (dataSource !== "api") {
    const filtered = localInvoices
      .map((invoice) => normalizeInvoice({ ...invoice, searchPrintStatus: deriveSearchPrintStatus(invoice), employeeName: null } as SearchPrintInvoice))
      .filter((invoice) => matchesLocalFilters(invoice, queryState.filters))
      .sort((left, right) => `${right.date}|${right.id}`.localeCompare(`${left.date}|${left.id}`));
    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / queryState.pageSize), 1);
    const offset = (queryState.page - 1) * queryState.pageSize;
    return { invoices: filtered.slice(offset, offset + queryState.pageSize), page: queryState.page, pageSize: queryState.pageSize, total, totalPages, isLoading: false, error: null, refetch: query.refetch };
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
