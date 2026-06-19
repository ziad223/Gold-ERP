"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DATA_SOURCE } from "@/lib/data-source";
import { useAuth } from "@/contexts/auth-context";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries, type EntityChangedEvent } from "@/lib/realtime/invalidate-affected-queries";

const TOKEN_KEY = "darfus-token-v1";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function parseEventPayload(event: Event): EntityChangedEvent | null {
  try {
    const payload = JSON.parse((event as MessageEvent).data);
    if (!payload || typeof payload !== "object" || !payload.entity) return null;
    return payload as EntityChangedEvent;
  } catch {
    return null;
  }
}

/**
 * Subscribes to backend SSE and invalidates the same query graph used by local
 * mutation success handlers. This keeps other tabs/users live without making SSE
 * the only freshness layer.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const companyId = company?.id;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEventsRef = useRef<EntityChangedEvent[]>([]);

  useEffect(() => {
    if (DATA_SOURCE !== "api") return;
    const token = readToken();
    if (!token) return;

    const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    const url = `${base}/events/stream?token=${encodeURIComponent(token)}`;

    let es: EventSource | null = null;
    let attempts = 0;
    let closed = false;

    const processPendingEvents = () => {
      const events = pendingEventsRef.current;
      pendingEventsRef.current = [];
      events.forEach((event) => {
        if (companyId && event.companyId && event.companyId !== companyId) return;
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[SSE] entity.changed", event);
        }
        invalidateAffectedQueries(queryClient, event);
      });
    };

    const handleEntityChanged = (event: Event) => {
      const payload = parseEventPayload(event);
      if (!payload) return;
      pendingEventsRef.current.push(payload);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(processPendingEvents, 200);
    };

    const connect = () => {
      if (closed) return;
      es = new EventSource(url);

      es.addEventListener("open", () => {
        attempts = 0;
      });

      // Keep compatibility with the current backend and the new standardized event name.
      es.addEventListener("change", handleEntityChanged);
      es.addEventListener("entity.changed", handleEntityChanged);
      es.onmessage = handleEntityChanged;

      es.addEventListener("notification", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          if (!companyId || !payload.companyId || payload.companyId === companyId) {
            toast(payload.title || "Notification", { description: payload.message });
          }
        } catch {
          toast("New notification");
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount });
        queryClient.invalidateQueries({ queryKey: queryKeys.legacyNotificationUnreadCount });
      });

      es.onerror = () => {
        es?.close();
        attempts += 1;
        if (closed || attempts > 8) return;
        setTimeout(connect, Math.min(1000 * attempts, 8000));
      };
    };

    connect();

    return () => {
      closed = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      es?.close();
    };
  }, [queryClient, companyId]);

  return <>{children}</>;
}
