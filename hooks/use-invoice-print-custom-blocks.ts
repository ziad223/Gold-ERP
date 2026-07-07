"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { useAppSettings } from "@/contexts/settings-context";
import {
  sanitizeInvoicePrintCustomBlocksConfig,
  type InvoicePrintCustomBlocksConfig,
} from "@/features/printing/lib/invoice-print-custom-blocks-config";

/**
 * Company-level custom print text blocks.
 *
 * Stored separately from legacy `receipt` messages under
 * `invoicePrintCustomBlocks`. Blocks are plain text only and display-only; they
 * never affect invoice data, totals, payments, stock, or accounting.
 */
export function useInvoicePrintCustomBlocks() {
  const { settings, refreshSettings } = useAppSettings();
  const locale = useLocale();

  const rawConfig = (settings as any).invoicePrintCustomBlocks;
  const config = useMemo(
    () => sanitizeInvoicePrintCustomBlocksConfig(rawConfig),
    [rawConfig],
  );

  const save = useCallback(async (newConfig: InvoicePrintCustomBlocksConfig): Promise<boolean> => {
    const value = sanitizeInvoicePrintCustomBlocksConfig(newConfig);
    try {
      const res = await apiClient<{ success?: boolean }>("/settings/by-key/invoicePrintCustomBlocks", {
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
