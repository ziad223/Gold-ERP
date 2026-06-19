/**
 * DARFUS Jewellery ERP — Data Source Configuration
 * Frontend only — Controls which data layer is active.
 *
 * Modes:
 *  "mock"  — In-memory demo data (default, always works)
 *  "local" — LocalStorage persistence (same as mock but persists)
 *  "api"   — Real backend API (disabled until backend is ready)
 */

export type DataSourceMode = "mock" | "local" | "api";

/**
 * Active data source mode.
 * Defaults to "mock" if not configured.
 * Set NEXT_PUBLIC_DATA_SOURCE=local or NEXT_PUBLIC_DATA_SOURCE=api in .env
 */
export const DATA_SOURCE: DataSourceMode =
  (process.env.NEXT_PUBLIC_DATA_SOURCE as DataSourceMode) || "mock";

/** True when using demo data (no persistence) */
export const isMock = (): boolean => DATA_SOURCE === "mock";

/** True when using LocalStorage persistence */
export const isLocal = (): boolean => DATA_SOURCE === "local";

/**
 * True only when backend API is configured AND reachable.
 * Returns false if NEXT_PUBLIC_API_URL is not set.
 * This is intentionally conservative — prefer graceful degradation.
 */
export const isApiReady = (): boolean =>
  DATA_SOURCE === "api" && Boolean(process.env.NEXT_PUBLIC_API_URL);

/**
 * Whether to persist to LocalStorage.
 * True for both "local" and "mock" modes (mock also uses localStorage
 * so data survives page refreshes during demos).
 */
export const shouldPersist = (): boolean => DATA_SOURCE !== "api";

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
