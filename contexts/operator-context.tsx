"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { OperatorSessionState, OperatorStepUpInput, OperatorVerifyInput } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";

interface OperatorContextValue {
  state: OperatorSessionState | null;
  active: boolean;
  loading: boolean;
  reason?: string | null;
  refresh: () => Promise<void>;
  verify: (input: OperatorVerifyInput) => Promise<void>;
  authorizeAction: (input: OperatorStepUpInput) => Promise<void>;
  lock: (reason?: string) => Promise<void>;
}

const OperatorContext = createContext<OperatorContextValue | null>(null);

const inactiveState: OperatorSessionState = {
  state: "inactive",
  reason: "NOT_VERIFIED",
  sessionId: null,
  employee: null,
  verificationLevel: 0,
};

export function OperatorProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { operatorRepository } = useErp();
  const [state, setState] = useState<OperatorSessionState | null>(inactiveState);
  const [active, setActive] = useState(false);
  const [reason, setReason] = useState<string | null>("NOT_VERIFIED");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setState(inactiveState);
      setActive(false);
      setReason("NOT_AUTHENTICATED");
      return;
    }
    setLoading(true);
    try {
      const result = await operatorRepository.current();
      setState(result.operatorSession);
      setActive(Boolean(result.active));
      setReason(result.reason || result.operatorSession?.reason || null);
    } catch (error) {
      setState(inactiveState);
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
      setActive(true);
      setReason(null);
    } finally {
      setLoading(false);
    }
  }, [operatorRepository]);

  const authorizeAction = useCallback(async (input: OperatorStepUpInput) => {
    setLoading(true);
    try {
      const result = await operatorRepository.authorizeAction(input);
      if (!result.success || !result.data) throw new Error(result.error?.message || "Operator step-up failed");
      setState(result.data.operatorSession);
      setActive(true);
      setReason(null);
    } finally {
      setLoading(false);
    }
  }, [operatorRepository]);

  const lock = useCallback(async (lockReason = "manual_lock") => {
    setLoading(true);
    try {
      const result = await operatorRepository.lock(lockReason);
      if (result.success && result.data) {
        setState(result.data.operatorSession);
        setActive(false);
        setReason(result.data.operatorSession.reason || "OPERATOR_SESSION_LOCKED");
      }
    } finally {
      setLoading(false);
    }
  }, [operatorRepository]);

  const value = useMemo(() => ({
    state,
    active,
    loading,
    reason,
    refresh,
    verify,
    authorizeAction,
    lock,
  }), [state, active, loading, reason, refresh, verify, authorizeAction, lock]);

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) throw new Error("useOperator must be used inside OperatorProvider");
  return context;
}
