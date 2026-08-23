"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import type { GiftVoucher } from "@/lib/types";

export interface NewVoucher {
  value: number;
  customerName?: string;
  customerId?: string;
  paymentMethod?: string;
  expiryDate?: string;
  code?: string;
}

/**
 * Gift vouchers hook — issue, list and redeem vouchers (API mode).
 */
export function useGiftVouchers() {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";
  const [items, setItems] = useState<GiftVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ items: GiftVoucher[] }>("/gift-vouchers", { locale });
      setItems(res.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }, [isApi, locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const issueVoucher = useCallback(
    async (payload: NewVoucher) => {
      const res = await apiClient<GiftVoucher>("/gift-vouchers/issue", {
        method: "POST",
        body: JSON.stringify(payload),
        locale,
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const redeemVoucher = useCallback(
    async (code: string, amount?: number) => {
      const res = await apiClient<GiftVoucher>("/gift-vouchers/redeem", {
        method: "POST",
        body: JSON.stringify({ code, ...(amount ? { amount } : {}) }),
        locale,
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return { items, loading, error, refresh, issueVoucher, redeemVoucher };
}
