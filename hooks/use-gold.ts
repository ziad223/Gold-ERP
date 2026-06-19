"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";

export interface KaratPrice {
  karat: number;
  purity: number;
  pricePerGram: number;
  currency: string;
  source?: "manual" | "live";
  updatedBy?: string;
}

export interface KaratPriceSnapshot {
  currency: string;
  ouncePrice: number;
  finePricePerGram: number;
  updatedAt: string;
  isFallback: boolean;
  prices: KaratPrice[];
}

export interface GoldQuote {
  currency: string;
  karat: number;
  purity: number;
  perGram: number;
  grossWeight: number;
  fineWeight: number;
  metalValue: number;
  makingCharge: number;
  stoneValue: number;
  subtotal: number;
  vat: number;
  total: number;
}

export interface GoldFixing {
  id: string;
  customerId?: string;
  customerName?: string;
  direction: "buy" | "sell";
  karat: number;
  grossWeight: number;
  fineWeight: number;
  ratePerGram: number;
  value: number;
  currency: string;
  status: "fixed" | "unfixed" | "settled";
  fixedAt?: string;
  unfixedAt?: string;
  notes?: string;
}

/**
 * Gold Center hook — karat prices, item quoting and rate fixing (API mode).
 */
export function useGold(currency = "AED") {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";
  const [snapshot, setSnapshot] = useState<KaratPriceSnapshot | null>(null);
  const [fixings, setFixings] = useState<GoldFixing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    setLoading(true);
    setError(null);
    try {
      const [snap, fx] = await Promise.all([
        apiClient<KaratPriceSnapshot>(`/gold/karat-prices?currency=${currency}`, { locale }),
        apiClient<{ items: GoldFixing[] }>("/gold/fixings", { locale }),
      ]);
      setSnapshot(snap);
      setFixings(fx.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load gold data");
    } finally {
      setLoading(false);
    }
  }, [isApi, currency, locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveKaratPrices = useCallback(
    async (prices: { karat: number; pricePerGram: number }[]) => {
      const res = await apiClient("/gold/karat-prices", {
        method: "POST",
        body: JSON.stringify({ currency, prices }),
        locale,
      });
      await refresh();
      return res;
    },
    [currency, locale, refresh],
  );

  const quote = useCallback(
    async (payload: { grossWeight: number; karat: number; makingCharge?: number; stoneValue?: number }) => {
      return apiClient<GoldQuote>("/gold/quote", {
        method: "POST",
        body: JSON.stringify({ currency, ...payload }),
        locale,
      });
    },
    [currency, locale],
  );

  const createFixing = useCallback(
    async (payload: Partial<GoldFixing>) => {
      const res = await apiClient<GoldFixing>("/gold/fixings", {
        method: "POST",
        body: JSON.stringify({ currency, ...payload }),
        locale,
      });
      await refresh();
      return res;
    },
    [currency, locale, refresh],
  );

  const unfix = useCallback(
    async (id: string) => {
      const res = await apiClient<GoldFixing>(`/gold/fixings/${id}/unfix`, { method: "POST", locale });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return { snapshot, fixings, loading, error, refresh, saveKaratPrices, quote, createFixing, unfix };
}
