"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeEntity, normalizeItems, toFiniteNumber } from "@/lib/api/normalize";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useLocale } from "next-intl";
import type { Asset } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";

const getPurityFromKarat = (karat?: number) => {
  if (!karat) return undefined;
  if (karat === 24) return 1;
  if (karat === 22) return 0.916;
  if (karat === 21) return 0.875;
  if (karat === 18) return 0.75;
  return undefined;
};

const createBarcode = () => String(Date.now()).slice(-13).padStart(13, "6");

export function useAssets() {
  const { activeBranch, activeBranchId, user } = useAuth();
  const { assets: mockAssets, addAsset: addMockAsset, updateAsset: updateMockAsset } = useErp();
  const queryClient = useQueryClient();
  const locale = useLocale();

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

  // ── API query (disabled in mock/local mode) ───────────────────────────────

  const {
    data: apiAssets,
    isLoading,
    error,
    refetch,
  } = useQuery<Asset[]>({
    queryKey: queryKeys.assets(activeBranchId || activeBranch),
    queryFn: async () => {
      try {
        // List all company assets; branch is an optional explicit filter, not forced,
        // so demo data across branches is visible regardless of the active branch.
        // Backend returns a paginated envelope { items, page, total, ... }.
        const res = await apiClient<any>(`/assets`, { locale });
        return normalizeItems<Asset>(res).map((asset) => ({
          ...asset,
          grossWeight: toFiniteNumber(asset.grossWeight),
          netWeight: toFiniteNumber(asset.netWeight),
          goldWeight: toFiniteNumber(asset.goldWeight),
          price: toFiniteNumber(asset.price),
          cost: toFiniteNumber(asset.cost),
          karat: asset.karat === undefined ? undefined : toFiniteNumber(asset.karat),
          purity: asset.purity === undefined ? undefined : toFiniteNumber(asset.purity),
        }));
      } catch {
        // Graceful fallback to empty array if API is not available
        return [];
      }
    },
    enabled: dataSource === "api",
  });

  // ── API mutation (disabled in mock/local mode) ────────────────────────────

  const createMutation = useMutation<Asset, Error, Partial<Asset>>({
    mutationFn: (newAsset) =>
      apiClient<Asset>("/assets", {
        method: "POST",
        body: JSON.stringify(newAsset),
        locale,
    }),
    onSuccess: (data: any) => {
      const created = normalizeEntity<Asset>(data) ?? data?.data ?? data;
      invalidateAffectedQueries(queryClient, {
        entity: "Asset",
        action: "create",
        id: created?.id,
        branchId: created?.branchId || activeBranchId,
        related: { assetId: created?.id },
      });
    },
  });

  // ── Asset list ────────────────────────────────────────────────────────────

  const getAssetsList = (): Asset[] => {
    if (dataSource === "mock" || dataSource === "local") {
      // BUG-005 FIX: If activeBranch is "Main Branch" (default for new accounts)
      // and no assets match that branch, return ALL mock assets so users see data.
      const branchFiltered = mockAssets.filter((item) => item.branch === activeBranch);
      if (branchFiltered.length === 0) {
        // Return all assets when branch filter yields nothing
        return mockAssets;
      }
      return branchFiltered;
    }
    // In API mode: filter by activeBranchId
    return (apiAssets || []).filter((item) => !activeBranchId || item.branchId === activeBranchId);
  };

  const getAssetDetails = (assetId: string) => {
    if (dataSource === "mock" || dataSource === "local") {
      return mockAssets.find((item) => item.id === assetId);
    }
    return apiAssets?.find((item) => item.id === assetId);
  };

  // ── Create asset ──────────────────────────────────────────────────────────

  const createAsset = async (newAsset: Partial<Asset>): Promise<Asset> => {
    const timestamp = Date.now();
    const gross = Number(newAsset.grossWeight) || 0;
    const net = Number(newAsset.netWeight) || gross;
    const priceValue = Number(newAsset.price) || 0;
    const costValue = Number(newAsset.cost) || Math.round(priceValue * 0.72);
    const karat = typeof newAsset.karat === "string" ? Number(newAsset.karat) : newAsset.karat;
    const purity = newAsset.purity ?? getPurityFromKarat(karat);
    const barcode = newAsset.barcode || createBarcode();
    const branch = newAsset.branch || activeBranch || "Main Branch";

    if (dataSource === "mock" || dataSource === "local") {
      const mockAsset: Asset = {
        id: newAsset.id || `AST-2026-${String(mockAssets.length + 200).padStart(5, "0")}`,
        name: newAsset.name || "",
        type: newAsset.type || "gold-piece",
        category: newAsset.category || "",
        karat,
        purity,
        grossWeight: gross,
        netWeight: net,
        goldWeight: purity ? gross * purity : gross,
        price: priceValue,
        cost: costValue,
        branch,
        location: newAsset.location || "Showroom",
        status: "available",
        barcode,
        source: "Manual entry",
        events: [
          {
            id: `EV-${timestamp}`,
            action: "تم إنشاء الأصل",
            date: new Date().toISOString().slice(0, 16).replace("T", " "),
            user: user?.firstName || "System",
            branch,
            note: "Created manually",
            device: "Web Browser",
            severity: "info",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addMockAsset(mockAsset);
      return mockAsset;
    }
    const created = await createMutation.mutateAsync({
      ...newAsset,
      branchId: newAsset.branchId || activeBranchId || undefined,
      karat,
      purity,
      grossWeight: gross,
      netWeight: net,
      goldWeight: purity ? gross * purity : gross,
      price: priceValue,
      cost: costValue,
      branch,
      barcode,
      location: newAsset.location || "Showroom",
      status: newAsset.status || "available",
      source: newAsset.source || "Manual entry",
    });
    return normalizeEntity<Asset>(created) ?? created;
  };

  // ── Update asset ──────────────────────────────────────────────────────────

  const updateAsset = async (id: string, updates: Partial<Asset>): Promise<void> => {
    if (dataSource === "mock" || dataSource === "local") {
      updateMockAsset(id, { ...updates, updatedAt: new Date().toISOString() });
      return;
    }
    await apiClient<Asset>(`/assets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
      locale,
    });
    invalidateAffectedQueries(queryClient, {
      entity: "Asset",
      action: "update",
      id,
      branchId: updates.branchId || activeBranchId,
      related: { assetId: id },
    });
  };

  return {
    assets: getAssetsList(),
    allAssets: dataSource === "api" ? (apiAssets || []) : mockAssets,
    isLoading: dataSource === "api" ? isLoading : false,
    error: dataSource === "api" ? error : null,
    refetch,
    getAssetDetails,
    createAsset,
    updateAsset,
    isCreating: createMutation.isPending,
  };
}
