"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient, DarfusApiError } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";

export interface DarfusUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: "admin" | "owner" | "manager" | "accountant" | "sales";
  roles?: Array<{ id: string; name: string; slug: string; isAdmin?: boolean }>;
  permissions?: string[];
}

export interface DarfusCompany {
  id: string;
  businessName: string;
  workspace: string;
  companySize: string;
  country: string;
  currency: string;
  city: string;
  region: string;
  address1: string;
  address2?: string;
  postalCode: string;
  commercialRegister?: string;
  taxNumber?: string;
  logo?: string;
  branchName: string;
}

export interface RegistrationPayload {
  businessName: string;
  email: string;
  phone: string;
  workspace: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  role: DarfusUser["role"];
  companySize: string;
  country: string;
  currency: string;
  city: string;
  region: string;
  address1: string;
  address2?: string;
  postalCode: string;
  commercialRegister?: string;
  taxNumber?: string;
  logo?: string;
}

type RegisterError = "emailExists" | "workspaceExists";

interface AuthContextValue {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: DarfusUser | null;
  company: DarfusCompany | null;
  token: string | null;
  activeBranch: string;
  activeBranchId: string;
  switchBranch: (branchId: string, branchName?: string) => void;
  login: (email: string, password: string, remember?: boolean) => Promise<{ ok: boolean; message?: string }>;
  register: (payload: RegistrationPayload) => Promise<{ ok: boolean; message?: RegisterError }>;
  logout: () => void;
  updateCompany: (updates: Partial<DarfusCompany>) => void;
  updateUser: (updates: Partial<DarfusUser>) => void;
}

// ─── Mock mode (localStorage) ───────────────────────────────────────────────

interface StoredAccount {
  user: DarfusUser;
  company: DarfusCompany;
  password: string;
}

const ACCOUNTS_KEY = "darfus-accounts-v3";
const SESSION_KEY = "darfus-session-v3";
const SESSION_BROWSER_KEY = "darfus-browser-session-v3";

const defaultAccount: StoredAccount = {
  user: {
    id: "USR-ADMIN",
    firstName: "Admin",
    lastName: "DARFUS",
    email: "admin@admin.com",
    phone: "+20 100 000 0000",
    jobTitle: "System Administrator",
    role: "admin",
  },
  company: {
    id: "CMP-DEMO",
    businessName: "DARFUS Jewellery",
    workspace: "demo",
    companySize: "11-50",
    country: "AE",
    currency: "AED",
    city: "Dubai",
    region: "Dubai",
    address1: "Main Jewellery District",
    postalCode: "00000",
    commercialRegister: "CN-2026-001",
    taxNumber: "100000000000001",
    branchName: "Main Branch",
  },
  password: "123456",
};

function readAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const saved = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    const custom = saved.filter((a) => a.user.email.toLowerCase() !== defaultAccount.user.email);
    return [defaultAccount, ...custom];
  } catch {
    return [defaultAccount];
  }
}

function persistAccounts(accounts: StoredAccount[]) {
  const custom = accounts.filter((a) => a.user.email.toLowerCase() !== defaultAccount.user.email);
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(custom));
}

// ─── API mode helpers ────────────────────────────────────────────────────────

interface ApiAuthResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    user: DarfusUser;
    company: DarfusCompany & { branchName: string };
  };
}

const TOKEN_KEY = "darfus-token-v1";
const REFRESH_KEY = "darfus-refresh-v1";
const API_SESSION_KEY = "darfus-api-session-v1";

function saveApiSession(data: ApiAuthResponse["data"], remember: boolean) {
  const session = JSON.stringify({ user: data.user, company: data.company });
  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, data.token);
    window.localStorage.setItem(REFRESH_KEY, data.refreshToken);
    window.localStorage.setItem(API_SESSION_KEY, session);
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, data.token);
    window.sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
    window.sessionStorage.setItem(API_SESSION_KEY, session);
  }
}

function loadApiSession(): { token: string; user: DarfusUser; company: DarfusCompany } | null {
  try {
    const token =
      window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
    const raw =
      window.localStorage.getItem(API_SESSION_KEY) ?? window.sessionStorage.getItem(API_SESSION_KEY);
    if (!token || !raw) return null;
    const { user, company } = JSON.parse(raw);
    return { token, user, company };
  } catch {
    return null;
  }
}

function clearApiSession() {
  [TOKEN_KEY, REFRESH_KEY, API_SESSION_KEY].forEach((k) => {
    window.localStorage.removeItem(k);
    window.sessionStorage.removeItem(k);
  });
}

function updateStoredApiSession(updates: { user?: DarfusUser; company?: DarfusCompany }) {
  if (typeof window === "undefined") return;
  const storage =
    window.localStorage.getItem(API_SESSION_KEY) !== null
      ? window.localStorage
      : window.sessionStorage.getItem(API_SESSION_KEY) !== null
        ? window.sessionStorage
        : null;
  if (!storage) return;

  try {
    const raw = storage.getItem(API_SESSION_KEY);
    if (!raw) return;
    const current = JSON.parse(raw) as { user: DarfusUser; company: DarfusCompany };
    storage.setItem(API_SESSION_KEY, JSON.stringify({
      user: updates.user || current.user,
      company: updates.company || current.company,
    }));
  } catch {
    storage.removeItem(API_SESSION_KEY);
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isApiMode = DATA_SOURCE === "api";

  // Shared state
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<DarfusUser | null>(null);
  const [company, setCompany] = useState<DarfusCompany | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>("فرع دبي مول");
  const [activeBranchId, setActiveBranchId] = useState<string>("BR-DXB");

  // Mock-only state
  const [accounts, setAccounts] = useState<StoredAccount[]>([defaultAccount]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = window.localStorage.getItem("darfus-active-branch-id-v1");
      const savedName = window.localStorage.getItem("darfus-active-branch-name-v1");
      if (savedId && !savedId.startsWith("BR-")) {
        window.localStorage.removeItem("darfus-active-branch-id-v1");
        window.localStorage.removeItem("darfus-active-branch-name-v1");
      } else {
        if (savedId) setActiveBranchId(savedId);
        if (savedName) setActiveBranch(savedName);
      }
    }
  }, []);

  useEffect(() => {
    if (company?.branchName) {
      // Don't overwrite if user has already chosen a branch
      let savedId = typeof window !== "undefined" ? window.localStorage.getItem("darfus-active-branch-id-v1") : null;
      if (savedId && !savedId.startsWith("BR-")) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("darfus-active-branch-id-v1");
          window.localStorage.removeItem("darfus-active-branch-name-v1");
        }
        savedId = null;
      }
      if (!savedId) {
        setActiveBranch(company.branchName);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("darfus-active-branch-name-v1", company.branchName);
        }
      }
    }
  }, [company]);

  const switchBranch = useCallback(
    (branchId: string, branchName?: string) => {
      const id = branchId;
      const name = branchName || branchId;
      setActiveBranch(name);
      setActiveBranchId(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("darfus-active-branch-id-v1", id);
        window.localStorage.setItem("darfus-active-branch-name-v1", name);
      }
      queryClient.clear();
    },
    [queryClient],
  );

  // Hydrate on mount
  useEffect(() => {
    if (isApiMode) {
      const session = loadApiSession();
      if (session) {
        setToken(session.token);
        setUser(session.user);
        setCompany(session.company);
      }
    } else {
      const loaded = readAccounts();
      setAccounts(loaded);
      try {
        const raw =
          window.localStorage.getItem(SESSION_KEY) ??
          window.sessionStorage.getItem(SESSION_BROWSER_KEY);
        if (raw) {
          const { email } = JSON.parse(raw) as { email: string };
          const account = loaded.find((a) => a.user.email.toLowerCase() === email.toLowerCase());
          if (account) {
            setUser(account.user);
            setCompany(account.company);
          }
        }
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(SESSION_BROWSER_KEY);
      }
    }
    setHydrated(true);
  }, [isApiMode]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      queryClient.clear();

      if (isApiMode) {
        try {
          const res = await apiClient<ApiAuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          if (!res.success) return { ok: false, message: "بيانات الدخول غير صحيحة" };
          saveApiSession(res.data, remember);
          setToken(res.data.token);
          setUser(res.data.user);
          setCompany(res.data.company);
          return { ok: true };
        } catch (err) {
          const msg = err instanceof DarfusApiError ? err.message : "خطأ في الاتصال بالخادم";
          return { ok: false, message: msg };
        }
      }

      // Mock mode
      const account = accounts.find(
        (a) => a.user.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
      );
      if (!account) return { ok: false, message: "invalid" };
      setUser(account.user);
      setCompany(account.company);
      const serialized = JSON.stringify({ email: account.user.email });
      if (remember) {
        window.localStorage.setItem(SESSION_KEY, serialized);
        window.sessionStorage.removeItem(SESSION_BROWSER_KEY);
      } else {
        window.sessionStorage.setItem(SESSION_BROWSER_KEY, serialized);
        window.localStorage.removeItem(SESSION_KEY);
      }
      return { ok: true };
    },
    [accounts, isApiMode, queryClient],
  );

  // ── Register ───────────────────────────────────────────────────────────────

  const register = useCallback(
    async (payload: RegistrationPayload): Promise<{ ok: boolean; message?: RegisterError }> => {
      queryClient.clear();

      if (isApiMode) {
        try {
          const res = await apiClient<ApiAuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          if (!res.success) return { ok: false };
          saveApiSession(res.data, true);
          setToken(res.data.token);
          setUser(res.data.user);
          setCompany(res.data.company);
          return { ok: true };
        } catch (err) {
          if (err instanceof DarfusApiError) {
            if (err.errors?.email) return { ok: false, message: "emailExists" };
            if (err.errors?.workspace) return { ok: false, message: "workspaceExists" };
          }
          return { ok: false };
        }
      }

      // Mock mode
      const email = payload.email.trim().toLowerCase();
      const workspace = payload.workspace.trim().toLowerCase();
      if (accounts.some((a) => a.user.email.toLowerCase() === email))
        return { ok: false, message: "emailExists" };
      if (accounts.some((a) => a.company.workspace.toLowerCase() === workspace))
        return { ok: false, message: "workspaceExists" };

      const ts = Date.now();
      const account: StoredAccount = {
        user: {
          id: `USR-${ts}`,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email,
          phone: payload.phone.trim(),
          jobTitle: payload.jobTitle,
          role: payload.role,
        },
        company: {
          id: `CMP-${ts}`,
          businessName: payload.businessName.trim(),
          workspace,
          companySize: payload.companySize,
          country: payload.country,
          currency: payload.currency,
          city: payload.city.trim(),
          region: payload.region.trim(),
          address1: payload.address1.trim(),
          address2: payload.address2?.trim(),
          postalCode: payload.postalCode.trim(),
          commercialRegister: payload.commercialRegister?.trim(),
          taxNumber: payload.taxNumber?.trim(),
          logo: payload.logo,
          branchName: payload.city.trim() || "Main Branch",
        },
        password: payload.password,
      };

      const next = [...accounts, account];
      setAccounts(next);
      persistAccounts(next);
      setUser(account.user);
      setCompany(account.company);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email: account.user.email }));
      window.sessionStorage.removeItem(SESSION_BROWSER_KEY);
      return { ok: true };
    },
    [accounts, isApiMode, queryClient],
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    queryClient.clear();
    setUser(null);
    setCompany(null);
    setToken(null);
    if (isApiMode) {
      clearApiSession();
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_BROWSER_KEY);
    }
  }, [isApiMode, queryClient]);

  // ── Profile updates ────────────────────────────────────────────────────────

  const updateCompany = useCallback(
    (updates: Partial<DarfusCompany>) => {
      if (!company) return;
      const updated = { ...company, ...updates };
      setCompany(updated);
      if (!isApiMode && user) {
        setAccounts((prev) => {
          const next = prev.map((a) =>
            a.user.email === user.email ? { ...a, company: updated } : a,
          );
          persistAccounts(next);
          return next;
        });
      } else if (isApiMode) {
        updateStoredApiSession({ company: updated });
      }
    },
    [company, isApiMode, user],
  );

  const updateUser = useCallback(
    (updates: Partial<DarfusUser>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      setUser(updated);
      if (!isApiMode) {
        setAccounts((prev) => {
          const next = prev.map((a) =>
            a.user.email === user.email ? { ...a, user: updated } : a,
          );
          persistAccounts(next);
          return next;
        });
      } else {
        updateStoredApiSession({ user: updated });
      }
    },
    [isApiMode, user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      isAuthenticated: Boolean(user),
      user,
      company,
      token,
      activeBranch,
      activeBranchId,
      switchBranch,
      login,
      register,
      logout,
      updateCompany,
      updateUser,
    }),
    [hydrated, user, company, token, activeBranch, activeBranchId, switchBranch, login, register, logout, updateCompany, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
