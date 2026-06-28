"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import type { Installment } from "@/lib/types";

/**
 * Installments hook — lists schedule rows and collects payments (API mode).
 */
export function useInstallments() {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";
  const [items, setItems] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ items: Installment[] }>("/installments", { locale });
      setItems(res.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load installments");
    } finally {
      setLoading(false);
    }
  }, [isApi, locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const payInstallment = useCallback(
    async (id: string, paymentMethod = "Cash", amount?: number) => {
      // Send `amount` whenever it is a finite number (backend requires amount > 0
      // and no longer treats a missing amount as a full payment). Only omit it
      // when the caller genuinely passed nothing.
      const payload: { paymentMethod: string; amount?: number } = { paymentMethod };
      if (Number.isFinite(amount as number)) payload.amount = amount;
      const res = await apiClient<Installment>(`/installments/${id}/pay`, {
        method: "POST",
        body: JSON.stringify(payload),
        locale,
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return { items, loading, error, refresh, payInstallment };
}
