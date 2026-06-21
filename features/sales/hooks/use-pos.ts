"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAppSettings } from "@/contexts/settings-context";
import { useLocale } from "next-intl";
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
  const { activeBranch } = useAuth();
  const { customers: mockCustomers, addInvoice: addMockInvoice } = useErp();
  const { settings } = useAppSettings();
  const queryClient = useQueryClient();
  const locale = useLocale();

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";
  const isApiMode = dataSource === "api";

  // Query customers list
  const { data: apiCustomers } = useQuery<Customer[]>({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      // Backend returns a paginated envelope { items, page, total, ... }.
      const res = await apiClient<{ items: Customer[] }>("/customers", { locale });
      return res.items ?? [];
    },
    enabled: isApiMode,
  });

  // Calculate prices preview
  const { mutateAsync: runPricingCalculation } = useMutation<
    PricingPreviewResult,
    Error,
    PricingPreviewPayload
  >({
    mutationFn: (payload) =>
      apiClient<PricingPreviewResult>("/pricing/calculate", {
        method: "POST",
        body: JSON.stringify(payload),
        locale,
      }),
  });

  // Post invoice
  const { mutateAsync: runPostInvoice, isPending: isPosting } = useMutation<
    Invoice,
    Error,
    { invoice: Partial<Invoice>; idempotencyKey: string }
  >({
    mutationFn: ({ invoice, idempotencyKey }) =>
      apiClient<Invoice>("/pos/checkout", {
        method: "POST",
        body: JSON.stringify(invoice),
        idempotencyKey,
        locale,
      }),
    onSuccess: (data) => {
      const customerId = data?.customerId;
      const assetIds =
        data?.items?.map((item: any) => item.assetId).filter(Boolean) || [];

      invalidateAffectedQueries(queryClient, {
        entity: "Invoice",
        action: "create",
        id: data?.id,
        related: { customerId, assetIds },
      });
    },
  });

  const getCustomers = useCallback((): Customer[] => {
    if (!isApiMode) {
      return mockCustomers;
    }

    return apiCustomers || [];
  }, [apiCustomers, isApiMode, mockCustomers]);

  // ── Draft invoice lifecycle (API mode) — the POS calls these for the
  // Save-as-Draft / load / update / cancel / post flow. /pos/checkout is NOT
  // used here; drafts go through the dedicated lifecycle endpoints.
  const createDraftInvoice = useCallback(
    (payload: any, idempotencyKey: string) =>
      apiClient<any>("/sales/invoices/drafts", {
        method: "POST",
        body: JSON.stringify(payload),
        idempotencyKey,
        locale,
      }),
    [locale]
  );

  const updateDraftInvoice = useCallback(
    (id: string, payload: any) =>
      apiClient<any>(`/sales/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        locale,
      }),
    [locale]
  );

  const cancelDraftInvoice = useCallback(
    (id: string, reason: string) =>
      apiClient<any>(`/sales/invoices/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
        locale,
      }),
    [locale]
  );

  const postDraftInvoice = useCallback(
    async (id: string, idempotencyKey: string) => {
      const result = await apiClient<any>(`/sales/invoices/${id}/post`, {
        method: "POST",
        body: JSON.stringify({}),
        idempotencyKey,
        locale,
      });

      // Posting touches inventory, accounting, treasury, customers — invalidate broadly.
      invalidateAffectedQueries(queryClient, {
        entity: "Invoice",
        action: "create",
        id: result?.id,
        related: {
          customerId: result?.customerId,
          assetIds: (result?.items || [])
            .map((item: any) => item.assetId)
            .filter(Boolean),
        },
      });

      return result;
    },
    [locale, queryClient]
  );

  const fetchDraftInvoices = useCallback(async () => {
    const res = await apiClient<{ items?: any[]; data?: any }>(
      "/invoices?postingStatus=draft&pageSize=100&sortBy=createdAt&sortDirection=desc",
      { locale }
    );

    return (res as any).items ?? (res as any).data?.items ?? (res as any).data ?? [];
  }, [locale]);

  const calculatePricing = useCallback(
    async (
      customerId: string,
      assets: Asset[],
      discount = 0,
      makingCharge = 0,
      stoneValue = 0
    ) => {
      const safeAssets = Array.isArray(assets) ? assets : [];

      if (!isApiMode) {
        const basePrice = safeAssets.reduce(
          (sum, item) => sum + (Number(item.price) || 0),
          0
        );

        const subtotal = Math.max(
          0,
          basePrice + makingCharge + stoneValue - discount
        );

        // VAT rate comes from Settings (single source of truth), not a hardcoded value.
        const vatRate = Number(settings?.vatRate) || 0;
        const tax = Math.round(subtotal * (vatRate / 100) * 100) / 100;
        const total = subtotal + tax;

        return {
          subtotal: String(subtotal),
          tax: String(tax),
          total: String(total),
          items: safeAssets.map((item) => ({
            assetId: item.id,
            price: String(Number(item.price) || 0),
          })),
        };
      }

      return runPricingCalculation({
        customerId,
        assetIds: safeAssets.map((item) => item.id).filter(Boolean),
        discount,
        makingCharge,
        stoneValue,
      });
    },
    [isApiMode, runPricingCalculation, settings?.vatRate]
  );

  const postInvoice = useCallback(
    async (invoice: Partial<Invoice>, idempotencyKey: string) => {
      if (!isApiMode) {
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

      return runPostInvoice({ invoice, idempotencyKey });
    },
    [activeBranch, addMockInvoice, isApiMode, runPostInvoice]
  );

  return {
    customers: getCustomers(),
    isApiMode,
    createDraftInvoice,
    updateDraftInvoice,
    cancelDraftInvoice,
    postDraftInvoice,
    fetchDraftInvoices,
    calculatePricing,
    postInvoice,
    isPosting,
  };
}