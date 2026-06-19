/**
 * DARFUS Dashboard — Realtime Client Implementations (PRODUCTION)
 * NoopDashboardRealtimeClient: Active in current (no-backend) mode.
 * WebSocketDashboardClient: Contract-ready for future backend.
 */

import type { DashboardRealtimeClient, DashboardRealtimeEvent } from "../providers/provider-interface";

// ─── Noop Client (current mode) ───────────────────────────────────────────────

/**
 * Used when no WebSocket backend is available.
 * Emits no events but maintains the correct interface.
 */
export class NoopDashboardRealtimeClient implements DashboardRealtimeClient {
  private handlers: Array<(event: DashboardRealtimeEvent) => void> = [];
  private connected = false;

  connect(): void {
    this.connected = true;
  }

  disconnect(): void {
    this.connected = false;
    this.handlers = [];
  }

  subscribe(handler: (event: DashboardRealtimeEvent) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ─── WebSocket Client (future backend) ───────────────────────────────────────

/**
 * WebSocket-based realtime client.
 * Activated when NEXT_PUBLIC_WS_URL is set in the environment.
 * - Deduplicates events by eventId.
 * - Batches updates (max 200ms delay).
 * - Falls back gracefully on disconnect.
 */
export class WebSocketDashboardClient implements DashboardRealtimeClient {
  private ws: WebSocket | null = null;
  private handlers: Array<(event: DashboardRealtimeEvent) => void> = [];
  private seenEventIds = new Set<string>();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingBatch: DashboardRealtimeEvent[] = [];
  private connected = false;
  private readonly wsUrl: string;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  connect(): void {
    if (this.ws) return;
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
      };

      this.ws.onmessage = (ev: MessageEvent) => {
        try {
          const event = JSON.parse(ev.data as string) as DashboardRealtimeEvent;
          // Deduplicate
          if (this.seenEventIds.has(event.eventId)) return;
          this.seenEventIds.add(event.eventId);
          // Keep dedup set bounded
          if (this.seenEventIds.size > 500) {
            const first = this.seenEventIds.values().next().value;
            if (first) this.seenEventIds.delete(first);
          }

          // Batch within 200ms window
          this.pendingBatch.push(event);
          if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
              const batch = [...this.pendingBatch];
              this.pendingBatch = [];
              this.batchTimer = null;
              batch.forEach((e) => this.handlers.forEach((h) => h(e)));
            }, 200);
          }
        } catch {
          // silently ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
      };

      this.ws.onerror = () => {
        this.connected = false;
        this.ws = null;
      };
    } catch {
      // WebSocket not supported or blocked — fail silently
    }
  }

  disconnect(): void {
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.ws?.close();
    this.ws = null;
    this.connected = false;
    this.handlers = [];
  }

  subscribe(handler: (event: DashboardRealtimeEvent) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRealtimeClient(): DashboardRealtimeClient {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrl && typeof WebSocket !== "undefined") {
    return new WebSocketDashboardClient(wsUrl);
  }
  return new NoopDashboardRealtimeClient();
}
