"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient, generateUUID } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import type { GiftVoucher } from "@/lib/types";

export interface NewVoucher {
  faceValue: number;
  customerId?: string;
  paymentMethod: "cash" | "card" | "transfer" | "bank";
  branchId?: string;
  branchEligibilityMode: "ALL_BRANCHES" | "SELECTED_BRANCHES";
  eligibleBranchIds?: string[];
}

/**
 * Gift vouchers hook — purchased issuance, activation and print-audit commands.
 * Redemption intentionally remains inside canonical POS checkout.
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
        idempotencyKey: generateUUID(),
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const activateVoucher = useCallback(
    async (voucherCode: string, branchId?: string) => {
      const res = await apiClient<GiftVoucher>(`/gift-vouchers/${encodeURIComponent(voucherCode)}/activate`, {
        method: "POST",
        body: JSON.stringify({ branchId }),
        locale,
        branchId,
        idempotencyKey: generateUUID(),
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const recordPrintEvent = useCallback(
    async (voucherCode: string, branchId?: string) => {
      const res = await apiClient<{ voucher: GiftVoucher }>(`/gift-vouchers/${encodeURIComponent(voucherCode)}/print-events`, {
        method: "POST",
        body: JSON.stringify({ branchId }),
        locale,
        branchId,
        idempotencyKey: generateUUID(),
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return { items, loading, error, refresh, issueVoucher, activateVoucher, recordPrintEvent };
}
