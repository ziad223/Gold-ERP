/**
 * DARFUS Jewellery ERP — Data Source Configuration
 * Frontend only — Controls which data layer is active.
 *
 * Modes:
 *  "api"   — Real backend API (PostgreSQL is the source of truth)
 *  "mock"  — In-memory demo data (development / demo only)
 *  "local" — LocalStorage persistence (development / demo only)
 *
 * Phase 22-Fix — PRODUCTION HARDENING:
 *  In production (NODE_ENV === "production") the data source is ALWAYS "api";
 *  mock/local are forbidden. A misconfigured production environment is surfaced
 *  loudly by assertProductionDataSource() (called by the API client before any
 *  request), so production can never silently run business flows on
 *  mock/localStorage. This module stays import-safe (never throws in production
 *  just from being imported) so `next build` succeeds; the loud failure happens
 *  at the API boundary, before any business read/write.
 */

export type DataSourceMode = "api" | "mock" | "local";

const ALLOWED_MODES: readonly DataSourceMode[] = ["api", "mock", "local"];

/** Raw, trimmed NEXT_PUBLIC_DATA_SOURCE (inlined at build time). */
function rawDataSource(): string {
  return (process.env.NEXT_PUBLIC_DATA_SOURCE || "").trim();
}

/** Trimmed NEXT_PUBLIC_API_URL. */
function rawApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "").trim();
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * The effective data-source mode.
 *
 * - Production: ALWAYS "api" (mock/local are never returned). A misconfigured
 *   production env is surfaced by assertProductionDataSource() before any
 *   business request — this getter itself never throws in production, so
 *   `next build` never fails purely from importing the module.
 * - Development: the validated env value, defaulting to "mock" when unset.
 *   An unrecognized value throws loudly (a real misconfiguration).
 */
export function getDataSourceMode(): DataSourceMode {
  if (isProduction()) return "api";
  const raw = rawDataSource();
  if (!raw) return "mock";
  const normalized = raw.toLowerCase();
  if ((ALLOWED_MODES as readonly string[]).includes(normalized)) {
    return normalized as DataSourceMode;
  }
  throw new Error(
    `Invalid NEXT_PUBLIC_DATA_SOURCE="${raw}". Allowed values: ${ALLOWED_MODES.join(", ")}.`,
  );
}

/**
 * Loud production guard — call before any business use of the API client. Throws
 * when a production deployment is misconfigured, so business flows never silently
 * fall back to mock/localStorage. No-op in development.
 */
export function assertProductionDataSource(): void {
  if (!isProduction()) return;
  const raw = rawDataSource();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_DATA_SOURCE=api is required in production.");
  }
  if (raw.toLowerCase() !== "api") {
    throw new Error(
      `Mock/local data source is forbidden in production (NEXT_PUBLIC_DATA_SOURCE="${raw}"). Set NEXT_PUBLIC_DATA_SOURCE=api.`,
    );
  }
  if (!rawApiUrl()) {
    throw new Error("NEXT_PUBLIC_API_URL is required in production API mode.");
  }
}

/**
 * Active data source mode (evaluated once at import). Kept for the many callers
 * that compare `DATA_SOURCE === "api"`. In production this is always "api".
 */
export const DATA_SOURCE: DataSourceMode = getDataSourceMode();

/** True when the real backend API is the source of truth. */
export const isApiDataSource = (): boolean => getDataSourceMode() === "api";

/** True when using demo data (no persistence). Never true in production. */
export const isMock = (): boolean => getDataSourceMode() === "mock";

/** True when using LocalStorage persistence. Never true in production. */
export const isLocal = (): boolean => getDataSourceMode() === "local";

/**
 * True only when backend API is configured AND a base URL is set.
 * Returns false if NEXT_PUBLIC_API_URL is not set.
 */
export const isApiReady = (): boolean =>
  getDataSourceMode() === "api" && Boolean(rawApiUrl());

/**
 * Whether to persist to LocalStorage. True for "local"/"mock" modes; always
 * false in production (api mode).
 */
export const shouldPersist = (): boolean => getDataSourceMode() !== "api";

/**
 * Feature flag: whether double-entry journal preview is visible.
 * Always true in frontend-only mode.
 */
export const FEATURE_JOURNAL_PREVIEW = true;

/**
 * Feature flag: whether RFID simulation UI is shown.
 * True in mock/local mode.
 */
export const FEATURE_RFID_SIMULATION = !isApiReady();

/**
 * Current localStorage schema version.
 * Increment this when the data structure changes.
 * A migration function will handle upgrading old data.
 */
export const STORAGE_SCHEMA_VERSION = 4;
