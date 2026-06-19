"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/i18n/navigation";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { hydrated, isAuthenticated } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/dashboard", { locale });
  }, [hydrated, isAuthenticated, locale, router]);

  if (!hydrated || isAuthenticated) return null;
  return children;
}
