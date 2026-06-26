/**
 * DARFUS Dashboard — Offline Snapshot Store (PRODUCTION)
 * Stores the last valid dashboard overview in localStorage.
 * Shows human-friendly "last known data" messaging on reconnect.
 * Dashboard is READ-ONLY: no offline transaction queue here.
 */

import type { DashboardOfflineStore } from "../providers/provider-interface";
import type { DashboardOverview } from "../contracts/data-contracts";

const SNAPSHOT_KEY = "darfus-dashboard-snapshot-v1";
const SNAPSHOT_TS_KEY = "darfus-dashboard-snapshot-ts-v1";

export class LocalStorageOfflineStore implements DashboardOfflineStore {
  saveSnapshot(overview: DashboardOverview): void {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(overview));
      localStorage.setItem(SNAPSHOT_TS_KEY, String(Date.now()));
    } catch {
      // Silently fail if storage is full
    }
  }

  loadSnapshot(): DashboardOverview | null {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as DashboardOverview;
    } catch {
      return null;
    }
  }

  clearSnapshot(): void {
    try {
      localStorage.removeItem(SNAPSHOT_KEY);
      localStorage.removeItem(SNAPSHOT_TS_KEY);
    } catch {
      // noop
    }
  }

  getSnapshotAge(): number | null {
    try {
      const ts = localStorage.getItem(SNAPSHOT_TS_KEY);
      if (!ts) return null;
      return Date.now() - parseInt(ts, 10);
    } catch {
      return null;
    }
  }
}
