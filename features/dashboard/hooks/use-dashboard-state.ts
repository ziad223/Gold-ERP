"use client";

/**
 * DARFUS Dashboard — Main State Hook (PRODUCTION)
 * Manages the full dashboard state: overview data, loading, preferences.
 * Uses LocalDashboardProvider to read from ErpContext (no direct ERP access in widgets).
 * Caches data in offline snapshot store.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { LocalDashboardProvider } from "../providers/local-provider";
import { LocalStorageOfflineStore } from "../offline/snapshot-store";
import type { DashboardOverview, DashboardQueryContext } from "../contracts/data-contracts";
import type {
  DashboardPreferences,
  DashboardWorkspace,
  DashboardMode,
} from "../contracts/widget-types";
import { DEFAULT_DASHBOARD_PREFERENCES } from "../contracts/widget-types";

const PREFS_KEY = "darfus-dashboard-prefs-v2";

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseDashboardStateReturn {
  overview: DashboardOverview | null;
  isLoading: boolean;
  isOffline: boolean;
  isCached: boolean;
  snapshotAgeMs: number | null;
  preferences: DashboardPreferences;
  setWorkspace: (workspace: DashboardWorkspace) => void;
  setMode: (mode: DashboardMode) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  setWidgetOrder: (ids: string[]) => void;
  toggleLightMode: () => void;
  resetPreferences: () => void;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardState(): UseDashboardStateReturn {
  const { invoices, assets, customers, transfers, reservations, approvals, purchaseOrders, goldPrice, isLoading: dataLoading } = useCoreErpData();
  const { user, company, activeBranch } = useAuth();
  const { viewCosts, viewMargins } = usePermissions();

  const [prefs, setPrefs, prefsHydrated] = useLocalStorageState<DashboardPreferences>(
    PREFS_KEY,
    DEFAULT_DASHBOARD_PREFERENCES
  );

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const offlineStore = useMemo(() => new LocalStorageOfflineStore(), []);
  const loadingRef = useRef(false);

  const queryContext = useMemo<DashboardQueryContext>(
    () => ({
      branch: activeBranch,
      userId: user?.id ?? "anonymous",
      role: user?.role ?? "sales",
      workspace: prefs.workspace,
      locale: "ar",
      currency: company?.currency ?? "AED",
    }),
    [activeBranch, user, company, prefs.workspace]
  );

  const provider = useMemo(
    () =>
      new LocalDashboardProvider(
        { invoices, assets, customers, transfers, reservations, approvals, purchaseOrders, goldPrice },
        viewCosts,
        viewMargins
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, assets, customers, transfers, reservations, approvals, purchaseOrders, goldPrice, viewCosts, viewMargins]
  );

  const loadOverview = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setIsLoading(true);
      const data = await provider.getOverview(queryContext);
      setOverview(data);
      setIsCached(false);
      setIsOffline(false);
      // Save snapshot for offline use
      offlineStore.saveSnapshot(data);
    } catch {
      // Attempt to load from offline cache
      const snapshot = offlineStore.loadSnapshot();
      if (snapshot) {
        setOverview(snapshot);
        setIsCached(true);
        setIsOffline(true);
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [provider, queryContext, offlineStore]);

  // Initial load
  useEffect(() => {
    if (!prefsHydrated || dataLoading) return;
    void loadOverview();
  }, [loadOverview, prefsHydrated, dataLoading]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void loadOverview();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadOverview]);

  // Preferences helpers
  const setWorkspace = useCallback(
    (workspace: DashboardWorkspace) => setPrefs((p) => ({ ...p, workspace })),
    [setPrefs]
  );
  const setMode = useCallback(
    (mode: DashboardMode) => setPrefs((p) => ({ ...p, mode })),
    [setPrefs]
  );
  const toggleWidgetVisibility = useCallback(
    (widgetId: string) =>
      setPrefs((p) => ({
        ...p,
        hiddenWidgetIds: p.hiddenWidgetIds.includes(widgetId)
          ? p.hiddenWidgetIds.filter((id) => id !== widgetId)
          : [...p.hiddenWidgetIds, widgetId],
      })),
    [setPrefs]
  );
  const setWidgetOrder = useCallback(
    (ids: string[]) => setPrefs((p) => ({ ...p, widgetOrder: ids })),
    [setPrefs]
  );
  const toggleLightMode = useCallback(
    () => setPrefs((p) => ({ ...p, isLightMode: !p.isLightMode })),
    [setPrefs]
  );
  const resetPreferences = useCallback(
    () => setPrefs(DEFAULT_DASHBOARD_PREFERENCES),
    [setPrefs]
  );

  const snapshotAgeMs = isCached ? offlineStore.getSnapshotAge() : null;

  return {
    overview,
    isLoading: isLoading || dataLoading,
    isOffline,
    isCached,
    snapshotAgeMs,
    preferences: prefs,
    setWorkspace,
    setMode,
    toggleWidgetVisibility,
    setWidgetOrder,
    toggleLightMode,
    resetPreferences,
    refresh: () => void loadOverview(),
  };
}
