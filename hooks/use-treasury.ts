"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";

export interface TreasurySummary {
  cash: number;
  bank: number;
  total: number;
  todayIn: number;
  todayOut: number;
  todayTransfers: number;
}

export interface CashTransaction {
  id: string;
  type: "cash_in" | "cash_out" | "transfer" | "closing";
  account: string;
  toAccount?: string;
  amount: number;
  category?: string;
  description?: string;
  branch: string;
  date: string;
  createdBy?: string;
  openingBalance?: number;
  expectedBalance?: number;
  actualBalance?: number;
  variance?: number;
  journalEntryId?: string;
}

export interface NewCashTransaction {
  type: "cash_in" | "cash_out" | "transfer";
  account: string;
  toAccount?: string;
  amount: number;
  category?: string;
  description?: string;
}

const EMPTY_SUMMARY: TreasurySummary = {
  cash: 0,
  bank: 0,
  total: 0,
  todayIn: 0,
  todayOut: 0,
  todayTransfers: 0,
};

/**
 * Treasury data hook — talks to the custom /treasury/* endpoints in API mode.
 * In mock mode it stays empty (treasury is an API-backed module).
 */
export function useTreasury(options: { page?: number; pageSize?: number } = {}) {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;

  const [summary, setSummary] = useState<TreasurySummary>(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [closings, setClosings] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    setLoading(true);
    setError(null);
    try {
      // Phase 6B: transactions are server-side paginated; summary + closings are
      // fetched exactly as before (summary is authoritative ledger balances).
      const txQs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString();
      const [s, txs, cls] = await Promise.all([
        apiClient<{ data: TreasurySummary }>("/treasury/summary", { locale }),
        apiClient<{ items: CashTransaction[]; total?: number; totalPages?: number }>(`/treasury/transactions?${txQs}`, { locale }),
        apiClient<{ items: CashTransaction[] }>("/treasury/closings", { locale }),
      ]);
      setSummary(s.data ?? EMPTY_SUMMARY);
      setTransactions(txs.items ?? []);
      setTransactionsTotal(Number(txs.total ?? (txs.items?.length ?? 0)));
      setTransactionsTotalPages(Math.max(1, Number(txs.totalPages ?? 1)));
      setClosings(cls.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load treasury data");
    } finally {
      setLoading(false);
    }
  }, [isApi, locale, page, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (payload: NewCashTransaction) => {
      const res = await apiClient<CashTransaction>("/treasury/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
        locale,
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const closeTreasury = useCallback(
    async (account: string, actualBalance: number, description?: string) => {
      const res = await apiClient<any>("/treasury/closing", {
        method: "POST",
        body: JSON.stringify({ account, actualBalance, description }),
        locale,
      });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return {
    summary,
    transactions,
    transactionsPage: page,
    transactionsPageSize: pageSize,
    transactionsTotal,
    transactionsTotalPages,
    closings,
    loading,
    error,
    refresh,
    addTransaction,
    closeTreasury,
  };
}
