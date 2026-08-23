"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeItems } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/auth-context";

export interface ManagedRole {
  id: string;
  name: string;
  slug: string;
  isAdmin?: boolean;
}

export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: string;
  accountType?: "legacy" | "super_admin" | "branch_shell";
  branchId?: string | null;
  recoveryEmailMasked?: string | null;
  lockedUntil?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  lastPasswordChangeAt?: string | null;
  activeSessions?: number;
  forcePasswordChange?: boolean;
  defaultEmployeeId?: string | null;
  branch?: { id: string; name?: string | null; code?: string | null } | null;
  defaultEmployee?: { id: string; employeeCode?: string | null; name?: string | null; status?: string | null } | null;
  roles?: ManagedRole[];
}

export interface SystemAccountReadiness {
  superAdmins: number;
  superAdminsWithRecovery: number;
  finalAdminProtected: boolean;
  branchShells: number;
  eligibleAdminEmployees: number;
  localDevRecoveryDelivery: boolean;
  productionEmailReady: boolean;
  deferred: string[];
}

export interface BranchOption {
  id: string;
  name?: string | null;
  code?: string | null;
}

export function useUserManagement() {
  const queryClient = useQueryClient();
  const { authReady, isAuthenticated, terminalAuthHandling } = useAuth();
  const enabled = authReady && isAuthenticated && !terminalAuthHandling;

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches,
    queryFn: async () => normalizeItems<BranchOption>(await apiClient("/branches?page=1&pageSize=100", { skipBranch: true })),
    enabled,
  });

  const systemAccountsQuery = useQuery({
    queryKey: ["system-accounts"],
    queryFn: async () => normalizeItems<ManagedUser>(await apiClient("/system-accounts", { skipBranch: true })),
    enabled,
  });

  const readinessQuery = useQuery({
    queryKey: ["system-accounts", "readiness"],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: SystemAccountReadiness }>("/system-accounts/readiness", { skipBranch: true });
      return res.data;
    },
    enabled,
  });

  const createSystemAccount = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient("/system-accounts", {
        method: "POST",
        body: JSON.stringify(payload),
        skipBranch: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["system-accounts"] });
    },
  });

  const createBranchAccount = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient("/system-accounts/branch-accounts", {
        method: "POST",
        body: JSON.stringify(payload),
        skipBranch: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["system-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["system-accounts", "readiness"] });
    },
  });

  const updateSystemAccount = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiClient(`/system-accounts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        skipBranch: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["system-accounts"] });
    },
  });

  const systemAccountAction = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: Record<string, unknown> }) =>
      apiClient(`/system-accounts/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        body: JSON.stringify(body || {}),
        skipBranch: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["system-accounts"] });
    },
  });

  return {
    systemAccounts: systemAccountsQuery.data ?? [],
    readiness: readinessQuery.data,
    branches: branchesQuery.data ?? [],
    isLoading: systemAccountsQuery.isLoading || branchesQuery.isLoading,
    createSystemAccount: createSystemAccount.mutateAsync,
    createBranchAccount: createBranchAccount.mutateAsync,
    updateSystemAccount: updateSystemAccount.mutateAsync,
    systemAccountAction: systemAccountAction.mutateAsync,
    isSaving: createSystemAccount.isPending || createBranchAccount.isPending || updateSystemAccount.isPending || systemAccountAction.isPending,
  };
}
