"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";

export interface SegmentStat {
  count: number;
  purchases: number;
  points: number;
}

export interface SegmentsResponse {
  segments: Record<string, SegmentStat>;
  thresholds: Record<string, number>;
}

export interface LoyaltyTxn {
  id: string;
  customerId: string;
  customerName?: string;
  type: "earn" | "redeem" | "adjust";
  points: number;
  value?: number;
  balanceAfter: number;
  invoiceId?: string;
  date?: string;
}

/**
 * Loyalty & segmentation hook (API mode).
 */
export function useLoyalty() {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";
  const [segments, setSegments] = useState<SegmentsResponse | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    setLoading(true);
    setError(null);
    try {
      const [seg, tx] = await Promise.all([
        apiClient<SegmentsResponse>("/loyalty/segments", { locale }),
        apiClient<{ items: LoyaltyTxn[] }>("/loyalty/transactions", { locale }),
      ]);
      setSegments(seg);
      setTransactions(tx.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load loyalty data");
    } finally {
      setLoading(false);
    }
  }, [isApi, locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recalculateSegments = useCallback(async () => {
    const res = await apiClient<{ updated: number; total: number }>("/loyalty/recalculate-segments", { method: "POST", locale });
    await refresh();
    return res;
  }, [locale, refresh]);

  const earn = useCallback(
    async (customerId: string, payload: { amount?: number; points?: number; notes?: string }) => {
      const res = await apiClient(`/customers/${customerId}/loyalty/earn`, { method: "POST", body: JSON.stringify(payload), locale });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const redeem = useCallback(
    async (customerId: string, points: number) => {
      const res = await apiClient(`/customers/${customerId}/loyalty/redeem`, { method: "POST", body: JSON.stringify({ points }), locale });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return { segments, transactions, loading, error, refresh, recalculateSegments, earn, redeem };
}
