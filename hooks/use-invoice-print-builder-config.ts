"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { useAppSettings } from "@/contexts/settings-context";
import {
  sanitizeInvoicePrintBuilderConfig,
  type InvoicePrintBuilderConfig,
} from "@/features/printing/lib/print-builder-config";

/**
 * Company-level invoice print template builder configurations (Phase 19Q).
 *
 * Read: from the raw settings map key `invoicePrintBuilderConfig` (sanitized against
 * the Zod schema; falls back to default structure on invalid payload).
 * Write: through the generic `PUT /settings/by-key/invoicePrintBuilderConfig`
 * endpoint, then refresh settings. No new routes, no DB migrations, no localStorage.
 */
export function useInvoicePrintBuilderConfig() {
  const { settings, refreshSettings } = useAppSettings();
  const locale = useLocale();

  // Safely extract and sanitize from general AppSettings. Memoized so `config`
  // keeps a stable reference across renders (the sanitizer/Zod parse returns a
  // NEW object each call, which otherwise makes consumers' effects loop). The
  // raw value's reference is stable between settings reloads.
  const rawBuilderConfig = (settings as any).invoicePrintBuilderConfig;
  const config = useMemo(
    () => sanitizeInvoicePrintBuilderConfig(rawBuilderConfig),
    [rawBuilderConfig],
  );

  const save = useCallback(async (newConfig: InvoicePrintBuilderConfig): Promise<boolean> => {
    const value = sanitizeInvoicePrintBuilderConfig(newConfig);
    try {
      const res = await apiClient<{ success?: boolean }>("/settings/by-key/invoicePrintBuilderConfig", {
        method: "PUT",
        body: JSON.stringify({ value }),
        locale,
        skipBranch: true,
      });
      if (res && res.success === false) return false;
      await refreshSettings();
      return true;
    } catch {
      return false;
    }
  }, [locale, refreshSettings]);

  return { config, save };
}
