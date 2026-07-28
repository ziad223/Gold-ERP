"use client";

import { useCompanyContext } from "@/contexts/company-context";
import { CompanyContextGate } from "@/components/company/company-context-gate";
import { AppShell } from "@/components/layout/app-shell";
import { RealtimeProvider } from "@/components/realtime-provider";

export function CompanyDashboardShell({ children }: { children: React.ReactNode }) {
  const { companyId } = useCompanyContext();
  return <CompanyContextGate><RealtimeProvider explicitCompanyId={companyId}><AppShell>{children}</AppShell></RealtimeProvider></CompanyContextGate>;
}
