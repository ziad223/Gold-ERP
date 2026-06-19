"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-xs font-extrabold text-foreground shadow-sm transition hover:border-brand-500 hover:text-brand-600"
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      <span>{locale === "ar" ? "EN" : "AR"}</span>
    </button>
  );
}
