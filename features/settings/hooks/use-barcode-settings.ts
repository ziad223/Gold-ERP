"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { getDataSourceMode } from "@/lib/data-source";
import type { BarcodeInventoryCode, BarcodeItemCode, BarcodeSettingsResponse } from "@/lib/types";

const barcodeSettingsKey = ["barcode-settings"] as const;

type ApiEnvelope<T> = { success: boolean; data: T };

export function useBarcodeSettings() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const enabled = getDataSourceMode() === "api";
  const query = useQuery<BarcodeSettingsResponse>({
    queryKey: barcodeSettingsKey,
    enabled,
    queryFn: async () => {
      const response = await apiClient<ApiEnvelope<BarcodeSettingsResponse>>("/barcode-settings", { locale, skipBranch: true });
      return response.data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: barcodeSettingsKey });
  const inventoryMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<BarcodeInventoryCode> }) => {
      const response = await apiClient<ApiEnvelope<BarcodeInventoryCode>>(
        id ? `/barcode-settings/inventory-codes/${encodeURIComponent(id)}` : "/barcode-settings/inventory-codes",
        { method: id ? "PATCH" : "POST", body: JSON.stringify(payload), locale, skipBranch: true },
      );
      return response.data;
    },
    onSuccess: refresh,
  });
  const itemMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<BarcodeItemCode> }) => {
      const response = await apiClient<ApiEnvelope<BarcodeItemCode>>(
        id ? `/barcode-settings/item-codes/${encodeURIComponent(id)}` : "/barcode-settings/item-codes",
        { method: id ? "PATCH" : "POST", body: JSON.stringify(payload), locale, skipBranch: true },
      );
      return response.data;
    },
    onSuccess: refresh,
  });

  return {
    ...query,
    inventoryCodes: query.data?.inventoryCodes ?? [],
    itemCodes: query.data?.itemCodes ?? [],
    usage: query.data?.usage ?? { inventory: {}, item: {} },
    saveInventoryCode: (payload: Partial<BarcodeInventoryCode>, id?: string) => inventoryMutation.mutateAsync({ id, payload }),
    saveItemCode: (payload: Partial<BarcodeItemCode>, id?: string) => itemMutation.mutateAsync({ id, payload }),
    isSaving: inventoryMutation.isPending || itemMutation.isPending,
  };
}
