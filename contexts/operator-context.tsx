"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { EmployeeAuthorizationSummary, OperatorSessionState, OperatorVerifyInput } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";

interface OperatorContextValue {
  state: OperatorSessionState | null;
  authorization: EmployeeAuthorizationSummary | null;
  active: boolean;
  loading: boolean;
  reason?: string | null;
  refresh: () => Promise<void>;
  verify: (input: OperatorVerifyInput) => Promise<EmployeeAuthorizationSummary | null>;
  lock: (reason?: string) => Promise<void>;
  endSession: (reason?: string) => Promise<void>;
}

const OperatorContext = createContext<OperatorContextValue | null>(null);
const OPERATOR_CHANNEL = "darfus-operator-session-v1";
export const OPERATOR_LIFECYCLE_EVENT = "darfus-operator-lifecycle";

const inactiveState: OperatorSessionState = {
  state: "inactive",
  reason: "NOT_VERIFIED",
  sessionId: null,
  employee: null,
};

export function OperatorProvider({ children }: { children: React.ReactNode }) {
  const { token, activeBranchId } = useAuth();
  const { operatorRepository } = useErp();
  const [state, setState] = useState<OperatorSessionState | null>(inactiveState);
  const [authorization, setAuthorization] = useState<EmployeeAuthorizationSummary | null>(null);
  const [active, setActive] = useState(false);
  const [reason, setReason] = useState<string | null>("NOT_VERIFIED");
  const [loading, setLoading] = useState(false);

  const broadcast = useCallback((event: string) => {
    if (typeof window === "undefined") return;
    const payload = { event, at: Date.now() };
    try {
      window.dispatchEvent(new CustomEvent(OPERATOR_LIFECYCLE_EVENT, { detail: payload }));
    } catch {
      // Same-tab event dispatch is best-effort and carries no secrets.
    }
    try {
      const channel = new BroadcastChannel(OPERATOR_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    } catch {
      // Storage events are the cross-tab fallback. They carry no secrets.
    }
    try {
      window.localStorage.setItem(OPERATOR_CHANNEL, JSON.stringify(payload));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      setState(inactiveState);
      setAuthorization(null);
      setActive(false);
      setReason("NOT_AUTHENTICATED");
      return;
    }
    setLoading(true);
    try {
      const result = await operatorRepository.current();
      setState(result.operatorSession);
      setActive(Boolean(result.active));
      setAuthorization(result.active ? result.authorization ?? null : null);
      setReason(result.reason || result.operatorSession?.reason || null);
    } catch (error) {
      setState(inactiveState);
      setAuthorization(null);
      setActive(false);
      setReason("CURRENT_FAILED");
    } finally {
      setLoading(false);
    }
  }, [operatorRepository, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const verify = useCallback(async (input: OperatorVerifyInput) => {
    setLoading(true);
    try {
      const result = await operatorRepository.verify(input);
      if (!result.success || !result.data) throw new Error(result.error?.message || "Operator verification failed");
      setState(result.data.operatorSession);
      setAuthorization(result.data.authorization ?? null);
      setActive(true);
      setReason(null);
      broadcast("operator:verified");
      return result.data.authorization ?? null;
    } finally {
      setLoading(false);
    }
  }, [broadcast, operatorRepository]);

  const lock = useCallback(async (lockReason = "manual_lock") => {
    setLoading(true);
    try {
      const result = await operatorRepository.lock(lockReason);
      if (result.success && result.data) {
        setState(result.data.operatorSession);
        setAuthorization(null);
        setActive(false);
        setReason(result.data.operatorSession.reason || "OPERATOR_SESSION_LOCKED");
        broadcast("operator:locked");
      }
    } finally {
      setLoading(false);
    }
  }, [broadcast, operatorRepository]);

  const endSession = useCallback(async (endReason = "operator_session_ended") => {
    setLoading(true);
    try {
      const result = await operatorRepository.endSession(endReason);
      if (result.success && result.data) {
        setState(result.data.operatorSession);
        setAuthorization(null);
        setActive(false);
        setReason(result.data.operatorSession.reason || "OPERATOR_SESSION_ENDED");
        broadcast("operator:ended");
      }
    } finally {
      setLoading(false);
    }
  }, [broadcast, operatorRepository]);

  useEffect(() => {
    if (!token) {
      broadcast("auth:logout");
      setState(inactiveState);
      setAuthorization(null);
      setActive(false);
      setReason("NOT_AUTHENTICATED");
    }
  }, [broadcast, token]);

  useEffect(() => {
    if (!token) return;
    setState(inactiveState);
    setAuthorization(null);
    setActive(false);
    setReason("BRANCH_CHANGED");
    broadcast("operator:branch-changed");
    void refresh();
  }, [activeBranchId, broadcast, refresh, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleEvent = () => {
      void refresh();
      try {
        window.dispatchEvent(new CustomEvent(OPERATOR_LIFECYCLE_EVENT, { detail: { event: "operator:remote-refresh", at: Date.now() } }));
      } catch {
        // No secrets are emitted; this only invalidates UI state.
      }
    };
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(OPERATOR_CHANNEL);
      channel.onmessage = handleEvent;
    } catch {
      channel = null;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === OPERATOR_CHANNEL) handleEvent();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
    };
  }, [refresh]);

  const value = useMemo(() => ({
    state,
    authorization,
    active,
    loading,
    reason,
    refresh,
    verify,
    lock,
    endSession,
  }), [state, authorization, active, loading, reason, refresh, verify, lock, endSession]);

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) throw new Error("useOperator must be used inside OperatorProvider");
  return context;
}

export function useOptionalOperator() {
  return useContext(OperatorContext);
}
