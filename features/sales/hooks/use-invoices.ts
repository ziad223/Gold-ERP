"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useErp } from "@/contexts/erp-context";
import { apiClient } from "@/lib/api/client";
import { normalizeItems, toFiniteNumber } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import type { Invoice, InvoiceItem } from "@/lib/types";

interface InvoiceListResponse {
  items?: Invoice[];
  data?: {
    items?: Invoice[];
  };
}

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

export function useInvoices() {
  const { invoices: localInvoices } = useErp();
  const locale = useLocale();
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

  const query = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices,
    queryFn: async () => {
      const res = await apiClient<InvoiceListResponse>("/invoices", { locale });
      const items = normalizeItems<Invoice>(res);
      return items.map(normalizeInvoice);
    },
    enabled: dataSource === "api",
  });

  if (dataSource !== "api") {
    return {
      invoices: localInvoices,
      isLoading: false,
      error: null,
      refetch: async () => ({ data: localInvoices }),
    };
  }

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
