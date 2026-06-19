"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAppSettings } from "@/contexts/settings-context";
import { useLocale } from "next-intl";
import { generateUUID } from "@/lib/api/client";
import type { Customer, Invoice, Asset } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";

interface PricingPreviewPayload {
  customerId: string;
  assetIds: string[];
  discount?: number;
  makingCharge?: number;
  stoneValue?: number;
}

interface PricingPreviewResult {
  subtotal: string;
  tax: string;
  total: string;
  items: Array<{ assetId: string; price: string }>;
}

export function usePos() {
  const { activeBranch, company } = useAuth();
  const { customers: mockCustomers, invoices: mockInvoices, addInvoice: addMockInvoice } = useErp();
  const { settings } = useAppSettings();
  const queryClient = useQueryClient();
  const locale = useLocale();

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

  // Query customers list
  const { data: apiCustomers } = useQuery<Customer[]>({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      // Backend returns a paginated envelope { items, page, total, ... }.
      const res = await apiClient<{ items: Customer[] }>("/customers", { locale });
      return res.items ?? [];
    },
    enabled: dataSource === "api",
  });

  // Calculate prices preview
  const pricingMutation = useMutation<PricingPreviewResult, Error, PricingPreviewPayload>({
    mutationFn: (payload) =>
      apiClient<PricingPreviewResult>("/pricing/calculate", {
        method: "POST",
        body: JSON.stringify(payload),
        locale,
      }),
  });

  // Post invoice
  const postInvoiceMutation = useMutation<Invoice, Error, { invoice: Partial<Invoice>; idempotencyKey: string }>({
    mutationFn: ({ invoice, idempotencyKey }) =>
      apiClient<Invoice>("/pos/checkout", {
        method: "POST",
        body: JSON.stringify(invoice),
        idempotencyKey,
        locale,
    }),
    onSuccess: (data) => {
      const customerId = data?.customerId;
      const assetIds = data?.items?.map((item: any) => item.assetId).filter(Boolean) || [];
      invalidateAffectedQueries(queryClient, {
        entity: "Invoice",
        action: "create",
        id: data?.id,
        related: { customerId, assetIds },
      });
    },
  });

  const getCustomers = (): Customer[] => {
    if (dataSource === "mock") {
      return mockCustomers;
    }
    return apiCustomers || [];
  };

  return {
    customers: getCustomers(),
    calculatePricing: async (
      customerId: string,
      assets: Asset[],
      discount = 0,
      makingCharge = 0,
      stoneValue = 0
    ) => {
      if (dataSource === "mock") {
        const basePrice = assets.reduce((sum, item) => sum + item.price, 0);
        const subtotal = Math.max(0, basePrice + makingCharge + stoneValue - discount);
        // VAT rate comes from Settings (single source of truth), not a hardcoded value.
        const vatRate = Number(settings?.vatRate) || 0;
        const tax = Math.round(subtotal * (vatRate / 100) * 100) / 100;
        const total = subtotal + tax;
        return {
          subtotal: String(subtotal),
          tax: String(tax),
          total: String(total),
          items: assets.map((item) => ({ assetId: item.id, price: String(item.price) })),
        };
      }
      return pricingMutation.mutateAsync({
        customerId,
        assetIds: assets.map((item) => item.id),
        discount,
        makingCharge,
        stoneValue,
      });
    },
    postInvoice: async (invoice: Partial<Invoice>, idempotencyKey: string) => {
      if (dataSource === "mock") {
        const id = `INV-${10500 + Math.floor(Math.random() * 300)}`;
        const finalInvoice: Invoice = {
          id,
          customerId: invoice.customerId || "",
          customerName: invoice.customerName || "Customer",
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
          total: invoice.total || 0,
          tax: invoice.tax || 0,
          discount: invoice.discount || 0,
          makingCharge: invoice.makingCharge || 0,
          stoneValue: invoice.stoneValue || 0,
          notes: invoice.notes || "",
          status: "paid",
          paymentMethod: invoice.paymentMethod || "Cash",
          branch: activeBranch,
          items: invoice.items || [],
        };
        addMockInvoice(finalInvoice);
        return finalInvoice;
      }
      return postInvoiceMutation.mutateAsync({ invoice, idempotencyKey });
    },
    isPosting: postInvoiceMutation.isPending,
  };
}
