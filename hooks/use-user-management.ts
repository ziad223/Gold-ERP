"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeItems } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";

export interface ManagedPermission {
  id: string;
  name: string;
  module: string;
  action: string;
}

export interface ManagedRole {
  id: string;
  name: string;
  slug: string;
  isAdmin?: boolean;
  permissions?: ManagedPermission[];
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

export interface EmployeeOption {
  id: string;
  employeeCode?: string | null;
  name?: string | null;
  status?: string | null;
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => normalizeItems<ManagedUser>(await apiClient("/users", { skipBranch: true })),
  });

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => normalizeItems<ManagedRole>(await apiClient("/roles", { skipBranch: true })),
  });

  const permissionsQuery = useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async () => normalizeItems<ManagedPermission>(await apiClient("/permissions", { skipBranch: true })),
  });

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches,
    queryFn: async () => normalizeItems<BranchOption>(await apiClient("/branches?page=1&pageSize=100", { skipBranch: true })),
  });

  const employeesQuery = useQuery({
    queryKey: ["employees-system-account-options"],
    queryFn: async () => normalizeItems<EmployeeOption>(await apiClient("/employees?page=1&pageSize=100", { skipBranch: true })),
  });

  const createUser = useMutation({
    mutationFn: (payload: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
      jobTitle?: string;
      roleIds: string[];
    }) => apiClient("/users", { method: "POST", body: JSON.stringify(payload), skipBranch: true }),
    onSuccess: (data: any) => {
      invalidateAffectedQueries(queryClient, {
        entity: "User",
        action: "create",
        id: data?.id || data?.data?.id,
      });
    },
  });

  const systemAccountsQuery = useQuery({
    queryKey: ["system-accounts"],
    queryFn: async () => normalizeItems<ManagedUser>(await apiClient("/system-accounts", { skipBranch: true })),
  });

  const readinessQuery = useQuery({
    queryKey: ["system-accounts", "readiness"],
    queryFn: async () => {
      const res = await apiClient<{ success: boolean; data: SystemAccountReadiness }>("/system-accounts/readiness", { skipBranch: true });
      return res.data;
    },
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

  const updateRolePermissions = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      apiClient(`/roles/${encodeURIComponent(roleId)}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
        skipBranch: true,
      }),
    onSuccess: (_data, variables) => {
      invalidateAffectedQueries(queryClient, {
        entity: "Permission",
        action: "update",
        id: variables.roleId,
      });
    },
  });

  return {
    users: usersQuery.data ?? [],
    systemAccounts: systemAccountsQuery.data ?? [],
    readiness: readinessQuery.data,
    branches: branchesQuery.data ?? [],
    employees: employeesQuery.data ?? [],
    roles: rolesQuery.data ?? [],
    permissions: permissionsQuery.data ?? [],
    isLoading: usersQuery.isLoading || rolesQuery.isLoading || permissionsQuery.isLoading || systemAccountsQuery.isLoading || branchesQuery.isLoading || employeesQuery.isLoading,
    createUser: createUser.mutateAsync,
    createSystemAccount: createSystemAccount.mutateAsync,
    createBranchAccount: createBranchAccount.mutateAsync,
    updateSystemAccount: updateSystemAccount.mutateAsync,
    systemAccountAction: systemAccountAction.mutateAsync,
    updateRolePermissions: updateRolePermissions.mutateAsync,
    isSaving: createUser.isPending || createSystemAccount.isPending || createBranchAccount.isPending || updateSystemAccount.isPending || updateRolePermissions.isPending || systemAccountAction.isPending,
  };
}
