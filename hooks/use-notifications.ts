"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeItems } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";

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

export function useNotifications() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => normalizeItems<NotificationItem>(await apiClient("/notifications?limit=20", { skipBranch: true })),
  });
  const countQuery = useQuery({
    queryKey: queryKeys.notificationUnreadCount,
    queryFn: async () => {
      const payload: any = await apiClient("/notifications/unread-count", { skipBranch: true });
      return payload?.count ?? payload?.data?.count ?? 0;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST", skipBranch: true }),
    onSuccess: (_data, id) => invalidateAffectedQueries(queryClient, { entity: "Notification", action: "update", id }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient("/notifications/read-all", { method: "POST", skipBranch: true }),
    onSuccess: () => invalidateAffectedQueries(queryClient, { entity: "Notification", action: "update", id: "all" }),
  });

  return {
    notifications: listQuery.data ?? [],
    unreadCount: countQuery.data ?? 0,
    markRead: markRead.mutateAsync,
    markAllRead: markAllRead.mutateAsync,
  };
}
