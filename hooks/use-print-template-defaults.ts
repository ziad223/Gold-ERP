"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { useAppSettings } from "@/contexts/settings-context";
import {
  sanitizePrintTemplateDefaults,
  type InvoicePrintOptions,
} from "@/features/printing/lib/invoice-print-options";

/**
 * Company-level default invoice print options (Phase 19G).
 *
 * Read: from the raw settings map key `printTemplateDefaults` (sanitized against
 * the 19F enums; falls back to Auto / Luxury Gold / Bilingual when missing or
 * invalid). Write: through the generic `PUT /settings/by-key/printTemplateDefaults`
 * endpoint (no new route, no whitelist, no migration), then refresh the shared
 * settings so the value propagates. No localStorage / no hidden persistence.
 *
 * Display-only: these defaults never affect invoice data, totals, or posting.
 */
export function usePrintTemplateDefaults() {
  const { settings, refreshSettings } = useAppSettings();
  const locale = useLocale();

  const defaults = sanitizePrintTemplateDefaults(settings.printTemplateDefaults);

  const save = useCallback(async (options: InvoicePrintOptions): Promise<boolean> => {
    const value = sanitizePrintTemplateDefaults(options);
    try {
      const res = await apiClient<{ success?: boolean }>("/settings/by-key/printTemplateDefaults", {
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

  return { defaults, save };
}
