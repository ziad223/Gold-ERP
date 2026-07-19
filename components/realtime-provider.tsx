"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DATA_SOURCE } from "@/lib/data-source";
import { DarfusApiError, getStoredAccessToken, reportTerminalTechnicalAuthFailure } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useOptionalOperator } from "@/contexts/operator-context";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries, type EntityChangedEvent } from "@/lib/realtime/invalidate-affected-queries";

type SseFrame = { event: string; data: string };

function parseFrames(chunk: string, buffer: string): { frames: SseFrame[]; buffer: string } {
  const parts = (buffer + chunk).split(/\r?\n\r?\n/);
  const rest = parts.pop() || "";
  const frames = parts.map((part) => ({
    event: part.match(/^event:\s?(.*)$/m)?.[1] || "message",
    data: part.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n"),
  })).filter((frame) => frame.data);
  return { frames, buffer: rest };
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { authReady, company, isAuthenticated, terminalAuthHandling, user } = useAuth();
  const operator = useOptionalOperator();
  const companyId = company?.id;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<EntityChangedEvent[]>([]);
  const branchEmployeeReady = user?.accountType !== "branch_shell" || Boolean(operator?.active);

  useEffect(() => {
    if (DATA_SOURCE !== "api" || !authReady || !isAuthenticated || terminalAuthHandling || !branchEmployeeReady) return;
    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    let closed = false;
    let attempts = 0;
    const flush = () => {
      const events = pendingRef.current;
      pendingRef.current = [];
      events.forEach((event) => {
        if (!companyId || !event.companyId || event.companyId === companyId) invalidateAffectedQueries(queryClient, event);
      });
    };
    const handleFrame = (frame: SseFrame) => {
      if (frame.event === "notification") {
        try {
          const payload = JSON.parse(frame.data);
          if (!companyId || !payload.companyId || payload.companyId === companyId) toast(payload.title || "Notification", { description: payload.message });
        } catch { toast("New notification"); }
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount });
        return;
      }
      if (!["message", "change", "entity.changed"].includes(frame.event)) return;
      try {
        const event = JSON.parse(frame.data) as EntityChangedEvent;
        if (!event?.entity) return;
        pendingRef.current.push(event);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(flush, 200);
      } catch { /* ignore malformed event payloads */ }
    };
    const connect = async () => {
      const token = getStoredAccessToken();
      if (closed || !token) return;
      try {
        const response = await fetch(`${base}/events/stream`, {
          headers: { Accept: "text/event-stream", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          if (response.status === 401) reportTerminalTechnicalAuthFailure(new DarfusApiError(401, "Session expired."));
          scheduleReconnect();
          return;
        }
        attempts = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          const parsed = parseFrames(decoder.decode(value, { stream: true }), buffer);
          buffer = parsed.buffer;
          parsed.frames.forEach(handleFrame);
        }
        if (!closed) scheduleReconnect();
      } catch (error) {
        if (!closed && (error as { name?: string }).name !== "AbortError") scheduleReconnect();
      }
    };
    const scheduleReconnect = () => {
      if (closed || attempts >= 8) return;
      attempts += 1;
      reconnectRef.current = setTimeout(() => void connect(), Math.min(attempts * 1000, 8000));
    };
    void connect();
    return () => {
      closed = true;
      controller.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [authReady, branchEmployeeReady, companyId, isAuthenticated, queryClient, terminalAuthHandling]);

  return <>{children}</>;
}
