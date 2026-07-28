import { AuthGuard } from "@/components/auth/auth-guard";
import { CompanyDashboardShell } from "@/components/company/company-dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard><CompanyDashboardShell>{children}</CompanyDashboardShell></AuthGuard>
  );
}
