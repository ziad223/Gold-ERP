"use client";

import { useEffect, useState } from "react";
import { Gem } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getPublicFileUrl } from "@/lib/api/files";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { company } = useAuth();
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = getPublicFileUrl(company?.logo || "");

  useEffect(() => {
    setLogoFailed(false);
  }, [company?.logo]);

  return (
    <div className="flex min-w-0 items-center gap-3">
      {logoUrl && !logoFailed ? (
        <img
          src={logoUrl}
          alt={company?.businessName || "Company Logo"}
          className="h-11 w-11 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm dark:border-slate-700"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lg shadow-brand-700/20">
          <Gem className="h-6 w-6" />
        </div>
      )}
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-black text-white">
            {company?.businessName ?? "DARFUS"}
          </div>
          <div className="mt-1 truncate text-[9px] font-bold tracking-[0.12em] text-brand-300">
            POWERED BY DARFUS
          </div>
        </div>
      )}
    </div>
  );
}
