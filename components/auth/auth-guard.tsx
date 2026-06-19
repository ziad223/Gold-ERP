"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { usePathname, useRouter } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/use-permissions";

const ROUTE_PERMISSIONS: Array<[RegExp, string]> = [
  [/^\/dashboard/, "dashboard.view"],
  [/^\/pos/, "sales.create"],
  [/^\/sales/, "sales.view"],
  [/^\/customers/, "customers.view"],
  [/^\/inventory/, "inventory.view"],
  [/^\/gold-center/, "gold.view"],
  [/^\/suppliers/, "suppliers.view"],
  [/^\/accounting\/treasury/, "treasury.view"],
  [/^\/accounting/, "accounting.view"],
  [/^\/employees/, "payroll.view"],
  [/^\/reports/, "reports.view"],
  [/^\/audit/, "audit.view"],
  [/^\/approvals/, "approvals.view"],
  [/^\/settings\/users/, "users.view"],
  [/^\/settings/, "settings.view"],
  [/^\/notifications/, "notifications.view"],
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { hydrated, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  const common = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/login", { locale });
  }, [hydrated, isAuthenticated, locale, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-5 py-4 text-sm font-bold text-foreground shadow-soft">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          {common("loading")}
        </div>
      </div>
    );
  }

  const required = ROUTE_PERMISSIONS.find(([pattern]) => pattern.test(pathname))?.[1];
  if (required && !hasPermission(required)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-3xl border border-border bg-panel p-8 text-center shadow-soft">
          <h1 className="text-xl font-black text-foreground">{locale === "ar" ? "غير مصرح" : "Permission denied"}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {locale === "ar" ? "لا تملك الصلاحية المطلوبة لعرض هذه الصفحة." : "You do not have the required permission to view this page."}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
