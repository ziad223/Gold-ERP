"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DarfusApiError,
  registerBranchContextFailureHandler,
  setBranchContextAccessor,
  setBranchContextTransitioning,
} from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import {
  beginBranchTransition,
  initialBranchContextState,
  isBranchContextReady,
  isBranchScopedQueryKey,
  resolveBranchContext,
  type BranchContextState,
  type BranchContextStatus,
} from "@/lib/branch-context-state";
import { useAuth } from "@/contexts/auth-context";
import { useCompanyContext } from "@/contexts/company-context";
import { useAppSettings } from "@/contexts/settings-context";

type BranchContextValue = {
  status: BranchContextStatus;
  branchId: string | null;
  branchName: string | null;
  generation: number;
  isReady: boolean;
  selectBranch: (branchId: string) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchContextProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { authReady, isAuthenticated, user, activeBranchId, switchBranch, clearBranch } = useAuth();
  const { isSuperAdmin, isReady: companyReady } = useCompanyContext();
  const { branches, branchesLoaded, branchesError } = useAppSettings();
  const [state, setState] = useState<BranchContextState>(initialBranchContextState);
  const generationRef = useRef(0);

  const clearOperationalWork = useCallback(() => {
    setBranchContextAccessor(null);
    void queryClient.cancelQueries({ predicate: (query) => isBranchScopedQueryKey(query.queryKey) });
    queryClient.removeQueries({ predicate: (query) => isBranchScopedQueryKey(query.queryKey) });
  }, [queryClient]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      generationRef.current += 1;
      setBranchContextTransitioning(true);
      setBranchContextAccessor(null);
      setState({ ...initialBranchContextState, generation: generationRef.current });
      return;
    }
    if (DATA_SOURCE === "api" && isSuperAdmin && !companyReady) {
      generationRef.current += 1;
      setBranchContextTransitioning(true);
      setBranchContextAccessor(null);
      setState({ status: "UNRESOLVED", branchId: null, branch: null, generation: generationRef.current });
      return;
    }
    if (!branchesLoaded) {
      setBranchContextTransitioning(true);
      setBranchContextAccessor(null);
      setState((previous) => previous.status === "VALIDATING" || previous.status === "UNRESOLVED"
        ? previous
        : { status: "UNRESOLVED", branchId: null, branch: null, generation: previous.generation });
      return;
    }
    if (branchesError) {
      setBranchContextTransitioning(true);
      setBranchContextAccessor(null);
      setState((previous) => ({ status: "ERROR", branchId: null, branch: null, generation: previous.generation + 1 }));
      return;
    }

    const next = resolveBranchContext(
      branches,
      activeBranchId || null,
      generationRef.current,
      user?.accountType === "branch_shell" ? user.accountScope?.branchId ?? null : null,
    );
    generationRef.current = next.generation;
    if (next.status === "READY" && next.branchId && next.branch) {
      setBranchContextAccessor(() => ({ branchId: next.branchId as string, generation: next.generation }));
      if (activeBranchId !== next.branchId) switchBranch(next.branchId, next.branch.name, { bootstrap: true });
      setState(next);
      setBranchContextTransitioning(false);
    } else {
      setBranchContextTransitioning(true);
      setBranchContextAccessor(null);
      if (next.status === "INVALID" && activeBranchId) clearBranch();
      setState(next);
    }
  }, [activeBranchId, authReady, branches, branchesError, branchesLoaded, clearBranch, companyReady, isAuthenticated, isSuperAdmin, switchBranch, user?.accountScope?.branchId, user?.accountType]);

  useEffect(() => registerBranchContextFailureHandler((error: DarfusApiError) => {
    setBranchContextTransitioning(true);
    clearOperationalWork();
    clearBranch();
    generationRef.current += 1;
    setState({ status: "INVALID", branchId: null, branch: null, generation: generationRef.current });
  }), [clearBranch, clearOperationalWork]);

  const selectBranch = useCallback((branchId: string) => {
    const branch = branches.find((item) => item.id === branchId && item.isActive);
    if (!branch || state.status === "TRANSITIONING" || branch.id === state.branchId) return;
    const transition = beginBranchTransition(state, generationRef.current);
    generationRef.current = transition.generation;
    // This state update deliberately precedes accessor retirement. The
    // imperative API guard closes the render-to-effect interval as well.
    setState(transition);
    setBranchContextTransitioning(true);
    clearOperationalWork();
    switchBranch(branch.id, branch.name);
  }, [branches, clearOperationalWork, state, switchBranch]);

  const value = useMemo<BranchContextValue>(() => ({
    status: state.status,
    branchId: state.branchId,
    branchName: state.branch?.name ?? null,
    generation: state.generation,
    isReady: DATA_SOURCE !== "api" || isBranchContextReady(state),
    selectBranch,
  }), [selectBranch, state]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranchContext(): BranchContextValue {
  const value = useContext(BranchContext);
  if (!value) throw new Error("useBranchContext must be used within BranchContextProvider");
  return value;
}
