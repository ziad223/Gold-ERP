"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { getDataSourceMode } from "@/lib/data-source";
import type { ExchangeDisplayApiResponse } from "@/lib/types";

export function useExchangeDisplay(invoiceId?: string | number, enabled = true) {
  const locale = useLocale();
  const dataSource = getDataSourceMode();

  return useQuery({
    queryKey: ["invoice-exchange-display", invoiceId],
    queryFn: async () => {
      const response = await apiClient<ExchangeDisplayApiResponse>(
        `/invoices/${encodeURIComponent(String(invoiceId))}/exchange-display`,
        { locale },
      );
      return response.data;
    },
    enabled: Boolean(invoiceId) && enabled && dataSource === "api",
  });
}
