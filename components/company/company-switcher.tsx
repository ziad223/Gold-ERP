"use client";

import { Building2 } from "lucide-react";
import { useCompanyContext } from "@/contexts/company-context";

/** Display-only Company identity. BranchSwitcher is the operational switcher. */
export function CompanySwitcher() {
  const { isSuperAdmin, isReady, company } = useCompanyContext();
  if (!isSuperAdmin || !isReady || !company) return null;
  return (
    <div className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-xs font-bold text-foreground md:flex" data-company-display="true" aria-label={`Company: ${company.businessName}`}>
      <Building2 className="h-4 w-4 text-brand-600" />
      <span className="max-w-32 truncate">{company.businessName}</span>
    </div>
  );
}
