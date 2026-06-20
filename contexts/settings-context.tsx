"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { useLocale } from "next-intl";
import { useAuth } from "./auth-context";

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  type: "store" | "warehouse" | "factory";
  address?: string;
  phone?: string;
  managerId?: string | null;
  isActive: boolean;
}

export interface AppSettings {
  businessName: string;
  logo: string;
  currency: string;
  vatRate: number;
  lowStockThreshold: number;
  decimalPrecision: number;
  dateFormat: string;
  invoicePrefix: string;
  invoiceNumbering: string;
  paymentMethods: string[];
  theme: string;
  language: string;
  allowZeroDownPayment?: boolean;
  installmentEnabled?: boolean;
  installmentDefaultFrequency?: string;
  installmentMaxCount?: number;
  installmentMinDownPaymentPercent?: number;
  receipt?: any;
  barcode?: any;
  /** Pricing mode foundation (default manual_sale_price; dynamic modes are not yet wired into POS). */
  goldPricingMode?: "manual_sale_price" | "dynamic_by_karat" | "dynamic_by_karat_plus_making";
  /** P5.1 foundation flag (default false). Split-by-karat posting is NOT enabled yet. */
  accountingByKarat?: boolean;
}

interface SettingsContextValue {
  settings: AppSettings;
  branches: Branch[];
  loading: boolean;
  /** True once settings have been confirmed loaded (from API in api mode, or local in mock mode). */
  loaded: boolean;
  /** True when an API-mode settings load failed — consumers must NOT trust fallback business values (e.g. VAT). */
  error: boolean;
  refreshSettings: () => Promise<void>;
  refreshBranches: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<boolean>;
  saveBranch: (branch: Partial<Branch>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
  deactivateBranch: (id: string) => Promise<boolean>;
  reactivateBranch: (id: string) => Promise<boolean>;
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: "DARFUS Jewellery",
  logo: "",
  currency: "AED",
  vatRate: 5,
  lowStockThreshold: 3,
  decimalPrecision: 2,
  dateFormat: "YYYY-MM-DD",
  invoicePrefix: "INV-2026",
  invoiceNumbering: "sequence",
  paymentMethods: ["cash", "card", "transfer", "installment", "deposit"],
  theme: "light",
  language: "ar",
  allowZeroDownPayment: false,
  installmentEnabled: true,
  installmentDefaultFrequency: "monthly",
  installmentMaxCount: 24,
  installmentMinDownPaymentPercent: 0,
  goldPricingMode: "manual_sale_price",
  accountingByKarat: false,
  receipt: {
    showLogo: true,
    welcomeMessage: "أهلاً بكم في متجرنا",
    headerNote: "مجوهرات وأحجار كريمة",
    footerMessage: "شكراً لتسوقكم معنا",
    termsMessage: "لا يستبدل ولا يرد إلا خلال 3 أيام",
    phone: "",
    address: "",
    showCashier: true,
    showBarcode: true,
    showVatNumber: true,
    vatNumber: "",
    showCompanyName: true,
    showTaxNumber: true,
    showAddress: true,
    showPhone: true,
    showQrCode: true,
    showVatBreakdown: true,
    showCustomerInfo: true,
    showBranchInfo: true,
    paperSize: "thermal",
    layout: "standard"
  },
  barcode: {
    showCompanyName: true,
    showLogo: true,
    showAssetId: true,
    showName: true,
    showKarat: true,
    showWeight: true,
    showPrice: true,
    showType: true,
    showBranch: true,
    showSupplier: false,
    showDate: false,
    customText: "",
    showQrCode: false,
    widthMm: 62,
    heightMm: 28,
    fontSizePx: 8,
    direction: "RTL",
    columns: 2,
    copies: 1,
    showBorder: true,
    template: "detailed"
  }
};

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("darfus-token-v1") ??
    window.sessionStorage.getItem("darfus-token-v1")
  );
}

function clearActiveBranchIfRemoved(branches: Branch[]) {
  if (typeof window === "undefined") return;
  const savedId = window.localStorage.getItem("darfus-active-branch-id-v1");
  if (!savedId) return;
  const stillActive = branches.some((branch) => branch.id === savedId && branch.isActive);
  if (!stillActive) {
    window.localStorage.removeItem("darfus-active-branch-id-v1");
    window.localStorage.removeItem("darfus-active-branch-name-v1");
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const isApi = DATA_SOURCE === "api";
  const queryClient = useQueryClient();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!isApi) {
      try {
        const saved = localStorage.getItem("darfus-central-settings-v1");
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error("Failed to load local settings", e);
      }
      // In mock/local mode the defaults are authoritative — treat as loaded.
      setLoaded(true);
      setError(false);
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await apiClient<{
        success: boolean;
        data: {
          company: any;
          settings: any;
          currency: string;
          vatRate: number;
          lowStockThreshold: number;
          decimalPrecision: number;
        };
      }>("/settings", { locale, skipBranch: true });

      if (res.success) {
        const raw = res.data.settings || {};
        const parsed: Partial<AppSettings> = {};

        // Parse JSON strings from settings table
        const keys: (keyof AppSettings)[] = ["paymentMethods", "receipt", "barcode"];
        keys.forEach(k => {
          if (raw[k]) {
            try {
              parsed[k] = typeof raw[k] === "string" ? JSON.parse(raw[k]) : raw[k];
            } catch {
              parsed[k] = raw[k];
            }
          }
        });

        const numKeys: (keyof AppSettings)[] = ["vatRate", "lowStockThreshold", "decimalPrecision", "installmentMaxCount", "installmentMinDownPaymentPercent"];
        numKeys.forEach(k => {
          if (raw[k] !== undefined) parsed[k] = Number(raw[k]);
        });

        const strKeys: (keyof AppSettings)[] = ["language", "theme", "invoicePrefix", "invoiceNumbering", "dateFormat", "installmentDefaultFrequency", "goldPricingMode"];
        strKeys.forEach(k => {
          if (raw[k] !== undefined) parsed[k] = String(raw[k]);
        });

        const boolKeys: (keyof AppSettings)[] = ["allowZeroDownPayment", "installmentEnabled", "accountingByKarat"];
        boolKeys.forEach(k => {
          if (raw[k] !== undefined) parsed[k] = raw[k] === "true" || raw[k] === true;
        });
 
        setSettings({
          ...DEFAULT_SETTINGS,
          businessName: res.data.company?.businessName || DEFAULT_SETTINGS.businessName,
          logo: res.data.company?.logo || DEFAULT_SETTINGS.logo,
          currency: res.data.currency || DEFAULT_SETTINGS.currency,
          vatRate: res.data.vatRate ?? DEFAULT_SETTINGS.vatRate,
          lowStockThreshold: res.data.lowStockThreshold ?? DEFAULT_SETTINGS.lowStockThreshold,
          decimalPrecision: res.data.decimalPrecision ?? DEFAULT_SETTINGS.decimalPrecision,
          ...parsed
        });
        setLoaded(true);
        setError(false);
      } else {
        setError(true);
        setLoaded(false);
      }
    } catch (err) {
      console.error("Failed to fetch settings from API", err);
      setError(true);
      setLoaded(false);
    }
  }, [isApi, locale, isAuthenticated]);

  const refreshBranches = useCallback(async () => {
    if (!isApi) {
      try {
        const saved = localStorage.getItem("darfus-local-branches-v1");
        if (saved) {
          setBranches(JSON.parse(saved));
        } else {
          const defaults: Branch[] = [
            { id: "BR-DXB", companyId: "CMP-DEMO", name: "فرع دبي مول", code: "DXB-MALL", type: "store", address: "Dubai Mall", phone: "+97140000000", isActive: true },
            { id: "BR-AUH", companyId: "CMP-DEMO", name: "فرع أبوظبي", code: "AUH-GALLERY", type: "store", address: "Abu Dhabi", phone: "+97120000000", isActive: true },
            { id: "BR-SHJ", companyId: "CMP-DEMO", name: "فرع الشارقة", code: "SHJ-MALL", type: "store", address: "Sharjah", phone: "+97160000000", isActive: true },
            { id: "BR-WH", companyId: "CMP-DEMO", name: "المستودع الرئيسي", code: "MAIN-WH", type: "warehouse", address: "Warehouse District", phone: "+97149999999", isActive: true },
            { id: "BR-FAC", companyId: "CMP-DEMO", name: "المصنع", code: "GOLD-FACTORY", type: "factory", address: "Industrial Area", phone: "+97148888888", isActive: true }
          ];
          setBranches(defaults);
          localStorage.setItem("darfus-local-branches-v1", JSON.stringify(defaults));
        }
      } catch (e) {
        console.error("Failed to load local branches", e);
      }
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await apiClient<{ success: boolean; items: Branch[] }>("/branches", { locale, skipBranch: true });
      if (res.success) {
        const nextBranches = res.items || [];
        setBranches(nextBranches);
        clearActiveBranchIfRemoved(nextBranches);
      }
    } catch (err) {
      console.error("Failed to fetch branches from API", err);
    }
  }, [isApi, locale, isAuthenticated]);

  // Initial load
  useEffect(() => {
    async function loadAll() {
      if (!isApi || isAuthenticated) {
        setLoading(true);
        await Promise.all([refreshSettings(), refreshBranches()]);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
    loadAll();
  }, [refreshSettings, refreshBranches, isAuthenticated, isApi]);

  const updateSettings = async (updates: Partial<AppSettings>): Promise<boolean> => {
    const next = { ...settings, ...updates };
    setSettings(next);

    if (!isApi) {
      localStorage.setItem("darfus-central-settings-v1", JSON.stringify(next));
      return true;
    }

    try {
      const payload: Record<string, any> = {};
      
      // Separate company properties from settings properties
      if (updates.businessName !== undefined) payload.businessName = updates.businessName;
      if (updates.logo !== undefined) payload.logo = updates.logo;
      if (updates.currency !== undefined) payload.currency = updates.currency;

      const keys: (keyof AppSettings)[] = [
        "language", "theme", "vatRate", "invoicePrefix", "invoiceNumbering",
        "dateFormat", "decimalPrecision", "paymentMethods", "lowStockThreshold", "receipt", "allowZeroDownPayment",
        "installmentEnabled", "installmentDefaultFrequency", "installmentMaxCount", "installmentMinDownPaymentPercent", "barcode",
        "goldPricingMode", "accountingByKarat"
      ];
      
      keys.forEach(k => {
        if (updates[k] !== undefined) {
          payload[k] = updates[k];
        }
      });

      const res = await apiClient<{ success: boolean }>("/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
        locale,
        skipBranch: true
      });

      if (res.success) {
        await refreshSettings();
        invalidateAffectedQueries(queryClient, { entity: "Settings", action: "update", id: "settings" });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update settings", err);
      return false;
    }
  };

  const saveBranch = async (branch: Partial<Branch>): Promise<boolean> => {
    if (!isApi) {
      let nextBranches = [...branches];
      if (branch.id) {
        nextBranches = nextBranches.map(b => b.id === branch.id ? { ...b, ...branch } as Branch : b);
      } else {
        const newBranch: Branch = {
          id: `BR-${Date.now()}`,
          companyId: "CMP-DEMO",
          name: branch.name || "New Branch",
          code: branch.code || "CODE",
          type: branch.type || "store",
          address: branch.address,
          phone: branch.phone,
          isActive: branch.isActive ?? true
        };
        nextBranches.push(newBranch);
      }
      setBranches(nextBranches);
      localStorage.setItem("darfus-local-branches-v1", JSON.stringify(nextBranches));
      return true;
    }

    try {
      let res;
      if (branch.id) {
        res = await apiClient<{ success: boolean }>(`/branches/${branch.id}`, {
          method: "PATCH",
          body: JSON.stringify(branch),
          locale,
          skipBranch: true
        });
      } else {
        res = await apiClient<{ success: boolean }>("/branches", {
          method: "POST",
          body: JSON.stringify(branch),
          locale,
          skipBranch: true
        });
      }
      if (res.success) {
        await refreshBranches();
        invalidateAffectedQueries(queryClient, {
          entity: "Branch",
          action: branch.id ? "update" : "create",
          id: branch.id || (res as any).data?.id || (res as any).id,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save branch", err);
      return false;
    }
  };

  const deleteBranch = async (id: string): Promise<boolean> => {
    if (!isApi) {
      const nextBranches = branches.filter(b => b.id !== id);
      setBranches(nextBranches);
      localStorage.setItem("darfus-local-branches-v1", JSON.stringify(nextBranches));
      return true;
    }

    try {
      await apiClient<{ success: boolean; data?: { action?: string } }>(`/branches/${id}`, {
        method: "DELETE",
        locale,
        skipBranch: true
      });
      setBranches((prev) => {
        const next = prev.filter((branch) => branch.id !== id);
        clearActiveBranchIfRemoved(next);
        return next;
      });
      await refreshBranches();
      invalidateAffectedQueries(queryClient, { entity: "Branch", action: "delete", id });
      return true;
    } catch (err: any) {
      if (err?.status === 404) {
        console.warn(`Branch ${id} was already deleted.`);
        setBranches((prev) => {
          const next = prev.filter((branch) => branch.id !== id);
          clearActiveBranchIfRemoved(next);
          return next;
        });
        await refreshBranches();
        invalidateAffectedQueries(queryClient, { entity: "Branch", action: "delete", id });
        return true;
      }
      console.error("Failed to delete branch", err);
      throw err;
    }
  };

  const deactivateBranch = async (id: string): Promise<boolean> => {
    if (!isApi) {
      const activeCount = branches.filter((branch) => branch.isActive).length;
      const branch = branches.find((item) => item.id === id);
      if (branch?.isActive && activeCount <= 1) return false;
      const nextBranches = branches.map((branch) => branch.id === id ? { ...branch, isActive: false } : branch);
      setBranches(nextBranches);
      localStorage.setItem("darfus-local-branches-v1", JSON.stringify(nextBranches));
      clearActiveBranchIfRemoved(nextBranches);
      return true;
    }

    try {
      await apiClient<{ success: boolean }>(`/branches/${id}/deactivate`, {
        method: "POST",
        locale,
        skipBranch: true
      });
      await refreshBranches();
      invalidateAffectedQueries(queryClient, { entity: "Branch", action: "deactivate", id, related: { branchId: id } });
      return true;
    } catch (err) {
      console.error("Failed to deactivate branch", err);
      throw err;
    }
  };

  const reactivateBranch = async (id: string): Promise<boolean> => {
    if (!isApi) {
      const nextBranches = branches.map((branch) => branch.id === id ? { ...branch, isActive: true } : branch);
      setBranches(nextBranches);
      localStorage.setItem("darfus-local-branches-v1", JSON.stringify(nextBranches));
      return true;
    }

    try {
      await apiClient<{ success: boolean }>(`/branches/${id}/reactivate`, {
        method: "POST",
        locale,
        skipBranch: true
      });
      await refreshBranches();
      invalidateAffectedQueries(queryClient, { entity: "Branch", action: "reactivate", id, related: { branchId: id } });
      return true;
    } catch (err) {
      console.error("Failed to reactivate branch", err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        branches,
        loading,
        loaded,
        error,
        refreshSettings,
        refreshBranches,
        updateSettings,
        saveBranch,
        deleteBranch,
        deactivateBranch,
        reactivateBranch
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useAppSettings must be used inside SettingsProvider");
  return context;
}
