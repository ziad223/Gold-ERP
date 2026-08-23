"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { getDataSourceMode } from "@/lib/data-source";
import { useBranchContext } from "@/contexts/branch-context";

export type InventoryV2ListItem = {
  id: string;
  name: string;
  description?: string | null;
  barcode: string;
  rfid?: string | null;
  inventoryProfile: string;
  operationalStatus: string;
  condition?: string | null;
  tagState?: string | null;
  branchId: string;
  branchName?: string | null;
  locationId?: string | null;
  location?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  purchaseDate?: string | null;
  grossWeight?: string | number | null;
  netWeight?: string | number | null;
  karat?: string | number | null;
  brand?: string | null;
  model?: string | null;
  modelNumber?: string | null;
  createdAt?: string | null;
};

export type InventoryV2ListFilters = {
  search?: string;
  profile?: string;
  status?: string;
  condition?: string;
  tagState?: string;
  locationId?: string;
  supplierId?: string;
  sort?: "createdAt" | "barcode" | "profile" | "status" | "purchaseDate";
  direction?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
};

export type InventoryV2Detail = {
  asset: Record<string, any>;
  origin: Record<string, any> | null;
  currentPurchaseCost: Record<string, any> | null;
  currentValuation: Record<string, any> | null;
  goldDetails: Record<string, any> | null;
  pricingPolicy: Record<string, any> | null;
  components: Record<string, any>[];
  looseDetails: Record<string, any> | null;
  rfidAssignments: Record<string, any>[];
  certificates: Record<string, any>[];
  attachments: Record<string, any>[];
  history: Record<string, any>[];
  movements: Record<string, any>[];
  timeline: Record<string, any>[];
  documentLinks: Record<string, any>[];
  salePricing: Record<string, any> | null;
  returnReviews: Record<string, any>[];
  legalActions: string[];
};

const compact = (value?: string) => value && value !== "all" ? value : undefined;

export function useInventoryV2List(filters: InventoryV2ListFilters) {
  const locale = useLocale();
  const dataSource = getDataSourceMode();
  const { branchId, generation, isReady } = useBranchContext();
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize || 25));

  return useQuery({
    queryKey: ["inventory-v2", "assets", branchId || "required", generation, filters, page, pageSize],
    enabled: dataSource === "api" && isReady,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
      for (const [key, value] of Object.entries({
        search: compact(filters.search?.trim()), profile: compact(filters.profile), status: compact(filters.status),
        condition: compact(filters.condition), tagState: compact(filters.tagState), locationId: compact(filters.locationId),
        supplierId: compact(filters.supplierId), sort: filters.sort || "createdAt", direction: filters.direction || "DESC",
      })) if (value) params.set(key, value);
      const response = await apiClient<any>(`/inventory-v2/assets?${params.toString()}`, { locale, branchId: branchId || undefined, signal });
      const data = response?.data ?? response;
      const total = Number(data?.total || 0);
      return { items: (data?.items || []) as InventoryV2ListItem[], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },
  });
}

export function useInventoryV2Detail(assetId: string) {
  const locale = useLocale();
  const dataSource = getDataSourceMode();
  const { branchId, generation, isReady } = useBranchContext();
  return useQuery({
    queryKey: ["inventory-v2", "asset", assetId, branchId || "required", generation],
    enabled: dataSource === "api" && isReady && Boolean(assetId),
    queryFn: async ({ signal }) => {
      const response = await apiClient<any>(`/inventory-v2/assets/${encodeURIComponent(assetId)}`, { locale, branchId: branchId || undefined, signal });
      return (response?.data ?? response) as InventoryV2Detail;
    },
  });
}
