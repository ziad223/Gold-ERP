"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { useOptionalOperator } from "@/contexts/operator-context";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { queryKeys } from "@/lib/query-keys";

export interface AccountingDashboardSummary {
  currency: string;
  scope: { companyId: string; branchId: string | null };
  period: { mode: "all_time"; from: null; to: null };
  balances: { cash: number; bank: number };
  activity: { receipts: number; payments: number; semantics: "net_external_cash_activity" };
  source: "reportable_ledger_journal_lines";
}

export function useAccountingDashboardSummary() {
  const locale = useLocale();
  const { authReady, isAuthenticated, terminalAuthHandling, user, company, activeBranchId } = useAuth();
  const operator = useOptionalOperator();
  const operatorReady = user?.accountType !== "branch_shell" || Boolean(operator?.active);
  const enabled = DATA_SOURCE === "api" && authReady && isAuthenticated && !terminalAuthHandling && operatorReady;

  return useQuery({
    queryKey: queryKeys.accountingDashboardSummary(company?.id, activeBranchId),
    queryFn: async () => {
      const response = await apiClient<{ data: AccountingDashboardSummary }>("/accounting/dashboard-summary", { locale });
      return response.data;
    },
    enabled,
  });
}
