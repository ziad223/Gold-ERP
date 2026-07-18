"use client";

import { LogOut } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import { EmployeeVerificationForm } from "@/components/operator/employee-verification-form";
import { firstAllowedBusinessRoute } from "@/lib/permissions/module-access";
import type { EmployeeAuthorizationSummary } from "@/lib/types";

export function EmployeeVerificationShell() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const router = useRouter();
  const { logout } = useAuth();

  const handleVerified = (authorization: EmployeeAuthorizationSummary | null) => {
    const permissionNames = authorization?.effectivePermissionNames ?? authorization?.effectivePermissions ?? [];
    const firstRoute = firstAllowedBusinessRoute(permissionNames);
    if (firstRoute) router.replace(firstRoute);
  };

  const signOut = () => {
    void logout();
    router.replace("/login");
  };

  return (
    <div className="grid min-h-[calc(100vh-10rem)] place-items-center p-1 sm:p-6" data-employee-verification-shell="true">
      <section className="w-full max-w-md rounded-2xl border border-border bg-panel p-5 shadow-soft sm:p-8">
        <h1 className="text-xl font-black text-foreground">{rtl ? "اختر موظفًا للبدء" : "Select an Employee to Start"}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{rtl ? "أدخل كود الموظف والرقم السري للمتابعة." : "Enter the Employee Code and PIN to continue."}</p>
        <div className="mt-6">
          <EmployeeVerificationForm presentation="inline" onVerified={handleVerified} />
        </div>
        <button type="button" onClick={signOut} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:underline">
          <LogOut className="h-4 w-4" /> {rtl ? "تسجيل الخروج" : "Log out"}
        </button>
      </section>
    </div>
  );
}
