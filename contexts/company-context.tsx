"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, DarfusApiError, registerCompanyContextFailureHandler, setCompanyContextAccessor } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import {
  clearPersistedCompanyContext,
  type AccessibleCompany,
  type CompanyContextState,
  type CompanyContextStatus,
  initialCompanyContextState,
  invalidCompanyContext,
  isSuperAdminAccount,
  resolveSingleCompanyContext,
} from "@/lib/company-context-state";

type AccessibleCompaniesResponse = { success: boolean; data?: { items?: AccessibleCompany[] }; items?: AccessibleCompany[] };

type CompanyContextValue = {
  isSuperAdmin: boolean;
  status: CompanyContextStatus;
  companyId: string | null;
  company: AccessibleCompany | null;
  companies: AccessibleCompany[];
  hydrated: boolean;
  generation: number;
  messageKey: string | null;
  isReady: boolean;
  retryBootstrap: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);
const BOOTSTRAP_KEY = "accessible-companies";

function bootstrapItems(response: AccessibleCompaniesResponse): AccessibleCompany[] {
  const items = response?.data?.items ?? response?.items ?? [];
  return Array.isArray(items) ? items : [];
}

export function CompanyContextProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { authReady, isAuthenticated, user, clearBranch } = useAuth();
  const isSuperAdmin = isSuperAdminAccount(user?.accountType);
  const [state, setState] = useState<CompanyContextState>(initialCompanyContextState);
  const stateRef = useRef(state);
  const processedIdentityRef = useRef<string | null>(null);
  const authenticatedUserRef = useRef<string | null>(null);
  stateRef.current = state;

  const bootstrap = useQuery({
    queryKey: [BOOTSTRAP_KEY, user?.id || "anonymous"],
    queryFn: async () => bootstrapItems(await apiClient<AccessibleCompaniesResponse>("/auth/accessible-companies", {
      companyScope: "none",
      skipBranch: true,
    })),
    enabled: DATA_SOURCE === "api" && authReady && isAuthenticated && isSuperAdmin && Boolean(user?.id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const clearScopedWork = useCallback(() => {
    setCompanyContextAccessor(null);
    void queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] !== BOOTSTRAP_KEY });
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== BOOTSTRAP_KEY });
    clearBranch();
  }, [clearBranch, queryClient]);

  const adoptBootstrapCompany = useCallback((companies: AccessibleCompany[]) => {
    const before = stateRef.current;
    setCompanyContextAccessor(null);
    clearScopedWork();
    setState({ ...before, status: "VALIDATING", hydrated: true, messageKey: null });
    const next = resolveSingleCompanyContext(companies, before.generation);
    if (next.status === "READY" && next.companyId) {
      setCompanyContextAccessor(() => ({ companyId: next.companyId as string, generation: next.generation }));
    }
    setState(next);
  }, [clearScopedWork]);

  const invalidateCompany = useCallback((messageKey = "company.access_revoked") => {
    processedIdentityRef.current = null;
    clearPersistedCompanyContext();
    clearScopedWork();
    setState((previous) => invalidCompanyContext(previous.generation, messageKey));
    void queryClient.invalidateQueries({ queryKey: [BOOTSTRAP_KEY, user?.id || "anonymous"] });
  }, [clearScopedWork, queryClient, user?.id]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      processedIdentityRef.current = null;
      authenticatedUserRef.current = null;
      setCompanyContextAccessor(null);
      setState(initialCompanyContextState);
      return;
    }
    if (authenticatedUserRef.current && authenticatedUserRef.current !== user.id) {
      clearPersistedCompanyContext();
      processedIdentityRef.current = null;
      clearScopedWork();
    }
    authenticatedUserRef.current = user.id;
    if (!isSuperAdmin) {
      processedIdentityRef.current = user.id;
      setCompanyContextAccessor(null);
      setState({ ...initialCompanyContextState, status: "READY", hydrated: true });
      return;
    }
    if (bootstrap.isPending) {
      setState((previous) => ({ ...previous, status: "UNRESOLVED", hydrated: false, messageKey: null }));
      return;
    }
    if (bootstrap.isError) {
      setCompanyContextAccessor(null);
      setState((previous) => ({ ...previous, status: "ERROR", hydrated: true, messageKey: "company.bootstrap_failed" }));
      return;
    }
    if (!bootstrap.isSuccess || processedIdentityRef.current === user.id) return;
    processedIdentityRef.current = user.id;
    // Legacy selection is intentionally ignored and cleared: the bootstrap is
    // authoritative for the single-Company product model on every refresh.
    clearPersistedCompanyContext();
    adoptBootstrapCompany(bootstrap.data || []);
  }, [adoptBootstrapCompany, authReady, bootstrap.data, bootstrap.isError, bootstrap.isPending, bootstrap.isSuccess, clearScopedWork, isAuthenticated, isSuperAdmin, user]);

  useEffect(() => registerCompanyContextFailureHandler((error: DarfusApiError) => {
    if (isSuperAdmin) invalidateCompany(error.errorCode === "COMPANY_SCOPE_INVALID" ? "company.access_revoked" : "company.context_required");
  }), [invalidateCompany, isSuperAdmin]);

  const retryBootstrap = useCallback(async () => {
    processedIdentityRef.current = null;
    await bootstrap.refetch();
  }, [bootstrap]);

  const value = useMemo<CompanyContextValue>(() => ({
    isSuperAdmin,
    status: state.status,
    companyId: state.companyId,
    company: state.company,
    companies: bootstrap.data || [],
    hydrated: state.hydrated,
    generation: state.generation,
    messageKey: state.messageKey,
    isReady: !isSuperAdmin || state.status === "READY",
    retryBootstrap,
  }), [bootstrap.data, isSuperAdmin, retryBootstrap, state]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompanyContext(): CompanyContextValue {
  const value = useContext(CompanyContext);
  if (!value) throw new Error("useCompanyContext must be used within CompanyContextProvider");
  return value;
}
