export type CompanyContextStatus = "UNRESOLVED" | "VALIDATING" | "READY" | "SETUP_REQUIRED" | "CONFIGURATION_CONFLICT" | "INVALID" | "ERROR";
export type CompanyContextSource = "BOOTSTRAP" | "NONE";

export type AccessibleCompany = {
  id: string;
  businessName: string;
  workspace: string;
  currency: string;
  logo: string;
};

export type CompanyContextState = {
  status: CompanyContextStatus;
  companyId: string | null;
  company: AccessibleCompany | null;
  source: CompanyContextSource;
  hydrated: boolean;
  generation: number;
  messageKey: string | null;
};

/** Retained only to clear legacy user-selection persistence during logout/upgrades. */
export const COMPANY_CONTEXT_STORAGE_KEY = "darfus-super-admin-company-context-v1";

export const initialCompanyContextState: CompanyContextState = {
  status: "UNRESOLVED",
  companyId: null,
  company: null,
  source: "NONE",
  hydrated: false,
  generation: 0,
  messageKey: null,
};

export function clearPersistedCompanyContext(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(COMPANY_CONTEXT_STORAGE_KEY);
}

/**
 * The authenticated bootstrap is the sole Company authority. A legacy stored
 * selection cannot choose, override, or restore a Company context.
 */
export function resolveSingleCompanyContext(companies: AccessibleCompany[], previousGeneration = 0): CompanyContextState {
  if (companies.length === 0) {
    return {
      status: "SETUP_REQUIRED",
      companyId: null,
      company: null,
      source: "NONE",
      hydrated: true,
      generation: previousGeneration + 1,
      messageKey: "company.setup_required",
    };
  }
  if (companies.length !== 1) {
    return {
      status: "CONFIGURATION_CONFLICT",
      companyId: null,
      company: null,
      source: "NONE",
      hydrated: true,
      generation: previousGeneration + 1,
      messageKey: "company.configuration_conflict",
    };
  }
  const [company] = companies;
  return {
    status: "READY",
    companyId: company.id,
    company,
    source: "BOOTSTRAP",
    hydrated: true,
    generation: previousGeneration + 1,
    messageKey: null,
  };
}

export function invalidCompanyContext(previousGeneration = 0, messageKey = "company.access_revoked"): CompanyContextState {
  return {
    status: "INVALID",
    companyId: null,
    company: null,
    source: "NONE",
    hydrated: true,
    generation: previousGeneration + 1,
    messageKey,
  };
}

export function isSuperAdminAccount(accountType?: string | null): boolean {
  return accountType === "super_admin";
}
