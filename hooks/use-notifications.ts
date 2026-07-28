"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeItems } from "@/lib/api/normalize";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { DATA_SOURCE } from "@/lib/data-source";
import { useAuth } from "@/contexts/auth-context";
import { useOptionalOperator } from "@/contexts/operator-context";
import {
  canStartCompanyScopedNotifications,
  notificationListQueryKey,
  notificationQueryMetadata,
  notificationRequestOptions,
  notificationUnreadCountQueryKey,
  normalizeExplicitCompanyId,
} from "@/lib/notifications/company-scoped-lifecycle";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "approval" | "system";
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export type UseNotificationsOptions = {
  /** Future UX-PRE1 supplies this authoritative, explicitly selected Company. */
  explicitCompanyId?: string | null;
};

export function useNotifications(options: UseNotificationsOptions = {}) {
  const queryClient = useQueryClient();
  const { authReady, isAuthenticated, terminalAuthHandling, user } = useAuth();
  const operator = useOptionalOperator();
  const explicitCompanyId = normalizeExplicitCompanyId(options.explicitCompanyId);
  const enabled = DATA_SOURCE === "api" && canStartCompanyScopedNotifications({
    authResolved: authReady,
    authenticated: isAuthenticated,
    terminalAuthHandling,
    accountType: user?.accountType,
    branchEmployeeReady: user?.accountType !== "branch_shell" || Boolean(operator?.active),
    explicitCompanyId,
  });
  const requestOptions = notificationRequestOptions(explicitCompanyId);
  const metadata = notificationQueryMetadata(explicitCompanyId);
  const listQuery = useQuery({
    queryKey: notificationListQueryKey(explicitCompanyId),
    queryFn: async () => normalizeItems<NotificationItem>(await apiClient("/notifications?limit=20", requestOptions)),
    enabled,
    meta: metadata,
  });
  const countQuery = useQuery({
    queryKey: notificationUnreadCountQueryKey(explicitCompanyId),
    queryFn: async () => {
      const payload: any = await apiClient("/notifications/unread-count", requestOptions);
      return payload?.count ?? payload?.data?.count ?? 0;
    },
    enabled,
    meta: metadata,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST", ...requestOptions }),
    onSuccess: (_data, id) => invalidateAffectedQueries(queryClient, { entity: "Notification", action: "update", id }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient("/notifications/read-all", { method: "POST", ...requestOptions }),
    onSuccess: () => invalidateAffectedQueries(queryClient, { entity: "Notification", action: "update", id: "all" }),
  });

  return {
    notifications: listQuery.data ?? [],
    unreadCount: countQuery.data ?? 0,
    markRead: markRead.mutateAsync,
    markAllRead: markAllRead.mutateAsync,
  };
}
