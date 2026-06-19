"use client";

import { useCallback, useState } from "react";
import { useAppSettings } from "@/contexts/settings-context";

export interface ReceiptConfig {
  showLogo: boolean;
  welcomeMessage: string; // greeting shown under the store name
  headerNote: string; // small line under the name (e.g. tagline)
  footerMessage: string; // thank-you / custom footer line
  termsMessage: string; // returns/terms line
  showCashier: boolean;
  showBarcode: boolean;
  showVatNumber: boolean;
  vatNumber: string;
  phone: string;
  address: string;
  // new settings
  showCompanyName: boolean;
  showTaxNumber: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showQrCode: boolean;
  showVatBreakdown: boolean;
  showCustomerInfo: boolean;
  showBranchInfo: boolean;
  paperSize: "A4" | "A5" | "thermal";
  layout: "standard" | "compact" | "detailed";
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  showLogo: true,
  welcomeMessage: "",
  headerNote: "",
  footerMessage: "",
  termsMessage: "",
  showCashier: true,
  showBarcode: true,
  showVatNumber: false,
  vatNumber: "",
  phone: "",
  address: "",
  showCompanyName: true,
  showTaxNumber: true,
  showAddress: true,
  showPhone: true,
  showQrCode: true,
  showVatBreakdown: true,
  showCustomerInfo: true,
  showBranchInfo: true,
  paperSize: "thermal",
  layout: "standard",
};

/**
 * Receipt customization settings. Integrates directly with the centralized
 * SettingsProvider to ensure changes persist to the backend/localStorage
 * and propagate reactively across all print/layout previews in the app.
 */
export function useReceiptSettings() {
  const { settings, updateSettings, loading } = useAppSettings();
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (next: ReceiptConfig) => {
      setSaving(true);
      try {
        await updateSettings({ receipt: next });
      } finally {
        setSaving(false);
      }
    },
    [updateSettings],
  );

  const config: ReceiptConfig = {
    ...DEFAULT_RECEIPT_CONFIG,
    ...(settings?.receipt || {}),
  };

  return {
    config,
    setConfig: () => {}, // Setter no-op as settings provider manages reactivity
    save,
    load: async () => {}, // Loaded automatically by SettingsProvider
    loading,
    saving,
  };
}
