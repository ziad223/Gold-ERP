"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useLocale } from "next-intl";
import type { Asset, AssetEvent, AssetAttachment } from "@/lib/types";
import { normalizeEntity, normalizeItems } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";

export function useAssetQuery(assetId: string) {
  const { activeBranch, activeBranchId, user } = useAuth();
  const { assets: mockAssets, updateAssetWithEvent, addAuditLog } = useErp();
  const queryClient = useQueryClient();
  const locale = useLocale();

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

  // ── API query (disabled in mock/local mode) ───────────────────────────────

  const {
    data: apiAsset,
    isLoading: isAssetLoading,
    error: assetError,
  } = useQuery<Asset | null>({
    queryKey: queryKeys.asset(assetId),
    queryFn: async () =>
      normalizeEntity<Asset>(
        await apiClient(`/assets/${encodeURIComponent(assetId)}`, { locale })
      ),
    enabled: dataSource === "api" && !!assetId,
  });

  const { data: apiTimeline } = useQuery<AssetEvent[]>({
    queryKey: queryKeys.assetTimeline(assetId),
    queryFn: async () =>
      normalizeItems<AssetEvent>(
        await apiClient(`/assets/${encodeURIComponent(assetId)}/timeline`, { locale })
      ),
    enabled: dataSource === "api" && !!assetId,
  });

  const { data: apiAttachments } = useQuery<AssetAttachment[]>({
    queryKey: queryKeys.assetAttachments(assetId),
    queryFn: async () => {
      const res = await apiClient<any>(`/assets/${encodeURIComponent(assetId)}/attachments`, { locale });
      return normalizeItems<AssetAttachment>(res);
    },
    enabled: dataSource === "api" && !!assetId,
  });

  // ── API mutation (disabled in mock/local mode) ────────────────────────────

  const actionMutation = useMutation<Asset | undefined, Error, { action: string; body?: Record<string, unknown> }>({
    mutationFn: async ({ action, body }) =>
      normalizeEntity<Asset>(
        await apiClient(`/assets/${encodeURIComponent(assetId)}/${action}`, {
          method: "POST",
          body: JSON.stringify(body || {}),
          locale,
        })
      ) ?? undefined,
    onSuccess: () => {
      invalidateAffectedQueries(queryClient, {
        entity: "Asset",
        action: "update",
        id: assetId,
        branchId: activeBranchId,
        related: { assetId },
      });
    },
  });

  const uploadAttachmentMutation = useMutation<AssetAttachment | undefined, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return normalizeEntity<AssetAttachment>(
        await apiClient(`/assets/${encodeURIComponent(assetId)}/attachments`, {
          method: "POST",
          body: formData,
          locale,
        })
      ) ?? undefined;
    },
    onSuccess: (attachment) => {
      queryClient.setQueryData<AssetAttachment[]>(
        queryKeys.assetAttachments(assetId),
        (old = []) => attachment ? [attachment, ...old.filter((item) => item.id !== attachment.id)] : old
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.assetAttachments(assetId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) });
      invalidateAffectedQueries(queryClient, {
        entity: "Attachment",
        action: "upload",
        id: attachment?.id,
        branchId: activeBranchId,
        related: { assetId, assetIds: [assetId] },
      });
    },
  });

  const deleteAttachmentMutation = useMutation<{ success: boolean; message: string } | undefined, Error, string>({
    mutationFn: async (attachmentId: string) => {
      return normalizeEntity<{ success: boolean; message: string }>(
        await apiClient(
          `/assets/${encodeURIComponent(assetId)}/attachments/${encodeURIComponent(attachmentId)}`,
          {
            method: "DELETE",
            locale,
          }
        )
      ) ?? undefined;
    },
    onSuccess: (_data, attachmentId) => {
      queryClient.setQueryData<AssetAttachment[]>(
        queryKeys.assetAttachments(assetId),
        (old = []) => old.filter((item) => item.id !== attachmentId)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.assetAttachments(assetId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) });
      invalidateAffectedQueries(queryClient, {
        entity: "Attachment",
        action: "delete",
        id: attachmentId,
        branchId: activeBranchId,
        related: { assetId, assetIds: [assetId] },
      });
    },
  });

  // ── Data getters ──────────────────────────────────────────────────────────

  const getAsset = (): Asset | undefined => {
    if (dataSource === "mock" || dataSource === "local") {
      return mockAssets.find((item) => item.id === assetId);
    }
    if (apiAsset) {
      return {
        ...apiAsset,
        attachments: apiAttachments || apiAsset.attachments || [],
      };
    }
    return apiAsset ?? undefined;
  };

  const getTimeline = (): AssetEvent[] => {
    if (dataSource === "mock" || dataSource === "local") {
      return getAsset()?.events || [];
    }
    return apiTimeline || [];
  };

  // ── Lifecycle action trigger ──────────────────────────────────────────────
  /**
   * Triggers an asset lifecycle action.
   * In mock/local mode: updates state via ErpContext (NO direct mutation).
   * In api mode: calls the backend API.
   */
  const triggerAction = async (
    action: "reserve" | "release" | "transfer" | "repair" | "melt" | "convert",
    body?: Record<string, unknown>,
  ): Promise<Asset | undefined> => {
    if (dataSource === "mock" || dataSource === "local") {
      const currentAsset = mockAssets.find((item) => item.id === assetId);
      if (!currentAsset) return undefined;

      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const eventId = `EV-${Date.now()}`;

      // Build the event with rich metadata
      const event: AssetEvent = {
        id: eventId,
        action: action.toUpperCase(),
        date: timestamp,
        user: user?.firstName || "System",
        branch: body?.branch as string || activeBranch,
        note: (body?.note as string) || `Action: ${action}`,
        device: "Web Browser",
        reason: body?.reason as string,
        sourceDocument: body?.sourceDocument as string,
        severity: action === "melt" ? "warning" : "info",
      };

      // Build the status update (immutable)
      let statusUpdate: Partial<Asset> = {};
      let beforeState = `status:${currentAsset.status}`;
      let afterState = "";

      switch (action) {
        case "reserve":
          statusUpdate = { status: "reserved" };
          afterState = "status:reserved";
          event.beforeState = beforeState;
          event.afterState = afterState;
          event.action = "حجز الأصل";
          break;
        case "release":
          statusUpdate = { status: "available" };
          afterState = "status:available";
          event.beforeState = beforeState;
          event.afterState = afterState;
          event.action = currentAsset.status === "repair" ? "إعادة من التصليح" : "إلغاء الحجز";
          break;
        case "repair":
          statusUpdate = { status: "repair" };
          afterState = "status:repair";
          event.beforeState = beforeState;
          event.afterState = afterState;
          event.action = "إرسال للتصليح";
          event.severity = "warning";
          break;
        case "melt":
          statusUpdate = { status: "melted" };
          afterState = "status:melted";
          event.beforeState = beforeState;
          event.afterState = afterState;
          event.action = "صهر الأصل";
          event.severity = "critical";
          break;
        case "transfer":
          if (body?.branch) {
            statusUpdate = { status: "transferred", branch: body.branch as string };
            afterState = `branch:${body.branch}`;
            event.beforeState = `branch:${currentAsset.branch}`;
            event.afterState = afterState;
            event.action = "نقل إلى فرع";
          }
          break;
        case "convert":
          statusUpdate = { status: "melted" };
          event.action = "تحويل الأصل";
          break;
      }

      // ✅ No direct mutation — dispatches to ErpContext reducer
      updateAssetWithEvent(assetId, statusUpdate, event);

      // Also add to audit log
      addAuditLog({
        id: `AUD-${Date.now()}`,
        action: "transfer",
        description: `${event.action} · ${assetId}`,
        user: user?.firstName || "System",
        userId: user?.id,
        place: body?.branch as string || activeBranch,
        branch: activeBranch,
        date: timestamp,
        before: beforeState,
        after: afterState || "—",
        device: "Web Browser",
        severity: event.severity,
        sourceDocument: body?.sourceDocument as string,
      });

      // Return updated asset shape for caller
      return { ...currentAsset, ...statusUpdate, events: [...currentAsset.events, event] };
    }

    // API mode
    return actionMutation.mutateAsync({ action, body });
  };

  const uploadAttachment = async (file: File): Promise<AssetAttachment | undefined> => {
    if (dataSource === "mock" || dataSource === "local") {
      const currentAsset = mockAssets.find((item) => item.id === assetId);
      if (!currentAsset) return undefined;
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const attachment: AssetAttachment = {
        id: `ATT-${Date.now()}`,
        name: file.name,
        type: file.type,
        uploadedAt: timestamp,
        uploadedBy: user?.firstName || "System User",
      };
      const updated = [...(currentAsset.attachments || []), attachment];
      updateAssetWithEvent(assetId, { attachments: updated }, {
        id: `EV-ATT-ADD-${Date.now()}`,
        action: "ADD_ATTACHMENT",
        date: timestamp,
        user: user?.firstName || "System User",
        branch: activeBranch,
        note: `Added attachment: ${file.name}`,
        beforeState: `attachments:${(currentAsset.attachments || []).length}`,
        afterState: `attachments:${updated.length}`,
        severity: "info",
      });
      return attachment;
    }
    return uploadAttachmentMutation.mutateAsync(file);
  };

  const deleteAttachment = async (attachmentId: string): Promise<void> => {
    if (dataSource === "mock" || dataSource === "local") {
      const currentAsset = mockAssets.find((item) => item.id === assetId);
      if (!currentAsset) return;
      const attachment = (currentAsset.attachments || []).find((a) => a.id === attachmentId);
      const updated = (currentAsset.attachments || []).filter((a) => a.id !== attachmentId);
      updateAssetWithEvent(assetId, { attachments: updated }, {
        id: `EV-ATT-DEL-${Date.now()}`,
        action: "REMOVE_ATTACHMENT",
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
        user: user?.firstName || "System User",
        branch: activeBranch,
        note: `Removed attachment: ${attachment?.name || attachmentId}`,
        beforeState: `attachments:${(currentAsset.attachments || []).length}`,
        afterState: `attachments:${updated.length}`,
        severity: "info",
      });
      return;
    }
    await deleteAttachmentMutation.mutateAsync(attachmentId);
  };

  return {
    asset: getAsset(),
    timeline: getTimeline(),
    isLoading: dataSource === "api" ? isAssetLoading : false,
    error: dataSource === "api" ? assetError : null,
    triggerAction,
    isPendingAction: actionMutation.isPending || uploadAttachmentMutation.isPending || deleteAttachmentMutation.isPending,
    uploadAttachment,
    deleteAttachment,
  };
}
