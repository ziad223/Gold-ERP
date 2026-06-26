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
  roles?: ManagedRole[];
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
    roles: rolesQuery.data ?? [],
    permissions: permissionsQuery.data ?? [],
    isLoading: usersQuery.isLoading || rolesQuery.isLoading || permissionsQuery.isLoading,
    createUser: createUser.mutateAsync,
    updateRolePermissions: updateRolePermissions.mutateAsync,
    isSaving: createUser.isPending || updateRolePermissions.isPending,
  };
}
