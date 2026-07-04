"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { useAppSettings } from "@/contexts/settings-context";
import {
  sanitizePrintCompanyInfoConfig,
  type PrintCompanyInfoConfig,
} from "@/features/printing/lib/print-company-info-config";

/**
 * Company-level print company info (Phase 19X-Fix).
 *
 * Read: from the raw settings map key `printCompanyInfo` (sanitized against the
 * Zod schema; falls back to the default structure on invalid payload). Memoized
 * so `config` keeps a stable reference across renders (the sanitizer returns a
 * NEW object each call, which otherwise makes consumers' effects loop).
 * Write: through the generic `PUT /settings/by-key/printCompanyInfo` endpoint,
 * then refresh settings. No new routes, no DB migrations, no localStorage.
 *
 * Display-only: these values never affect invoice data, totals, or posting.
 */
export function usePrintCompanyInfo() {
  const { settings, refreshSettings } = useAppSettings();
  const locale = useLocale();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawConfig = (settings as any).printCompanyInfo;
  const config = useMemo(
    () => sanitizePrintCompanyInfoConfig(rawConfig),
    [rawConfig],
  );

  const saveConfig = useCallback(
    async (next: PrintCompanyInfoConfig): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      const value = sanitizePrintCompanyInfoConfig(next);
      try {
        const res = await apiClient<{ success?: boolean }>(
          "/settings/by-key/printCompanyInfo",
          {
            method: "PUT",
            body: JSON.stringify({ value }),
            locale,
            skipBranch: true,
          },
        );
        if (res && res.success === false) {
          setError("save_failed");
          return false;
        }
        await refreshSettings();
        return true;
      } catch (e: any) {
        setError(e?.message || "save_failed");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [locale, refreshSettings],
  );

  return { config, isSaving, error, saveConfig };
}
