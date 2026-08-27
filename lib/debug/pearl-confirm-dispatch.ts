export type PearlConfirmDiagnosticEvent = {
  correlationId: string;
  eventName: string;
  timestamp: string;
  method?: string;
  path?: string;
  guardName?: string;
  guardResult?: "PASS" | "FAIL" | "NOT_REACHED";
  authStatus?: "FRESH" | "REFRESHED" | "BLOCKED_AUTH";
  contextMatch?: boolean;
  hashMatch?: boolean;
  preparedRequestPresent?: boolean;
  apiClientEntered?: boolean;
  fetchAttempted?: boolean;
  browserRequestObserved?: boolean;
  backendObserved?: boolean;
  blockReason?: string;
  outcome?: "RETURNED" | "REJECTED";
  status?: number;
  runtimeMode?: string;
  hostname?: string;
  diagnosticsEnabled?: boolean;
  interceptionEnabled?: boolean;
};

type DiagnosticSink = (event: PearlConfirmDiagnosticEvent) => void;
const SINK_KEY = "__DARFUS_PEARL_CONFIRM_DIAGNOSTIC_SINK__";
const EVENTS_KEY = "__DARFUS_PEARL_CONFIRM_DIAGNOSTIC_EVENTS__";

function diagnosticsEnabled(): boolean {
  const nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : undefined;
  if (nodeEnv !== "production") return true;
  const explicitLocalAcceptance = typeof process !== "undefined" && process.env.NEXT_PUBLIC_PEARL_CONFIRM_DIAGNOSTICS === "true";
  const localHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  return explicitLocalAcceptance && localHost;
}

function interceptionEnabled(): boolean {
  const explicitIntercept = typeof process !== "undefined" && process.env.NEXT_PUBLIC_PEARL_CONFIRM_INTERCEPT === "true";
  const localHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  return explicitIntercept && localHost && diagnosticsEnabled();
}

function sink(): DiagnosticSink | undefined {
  if (!diagnosticsEnabled() || typeof globalThis === "undefined") return undefined;
  const candidate = (globalThis as Record<string, unknown>)[SINK_KEY];
  return typeof candidate === "function" ? candidate as DiagnosticSink : undefined;
}

export function isPearlConfirmDiagnosticActive(): boolean {
  return diagnosticsEnabled();
}

export function isPearlConfirmInterceptionActive(): boolean {
  return interceptionEnabled();
}

export function createPearlConfirmDiagnosticCorrelation(): string {
  const randomUuid = typeof globalThis !== "undefined" && typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  return `PEARL-DISPATCH-${randomUuid}`;
}

export function recordPearlConfirmDiagnostic(event: Omit<PearlConfirmDiagnosticEvent, "timestamp">): void {
  if (!diagnosticsEnabled()) return;
  const payload = { ...event, timestamp: new Date().toISOString() };
  const activeSink = sink();
  activeSink?.(payload);
  if (!activeSink && diagnosticsEnabled() && typeof console !== "undefined") console.debug("PEARL_CONFIRM_DIAGNOSTIC", JSON.stringify(payload));
  if (typeof globalThis !== "undefined") {
    const target = globalThis as Record<string, unknown>;
    const existing = target[EVENTS_KEY];
    if (Array.isArray(existing)) existing.push(payload);
    else target[EVENTS_KEY] = [payload];
  }
}
