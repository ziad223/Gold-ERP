"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { PermissionSet } from "@/lib/permissions/permissions";
import { useLocale } from "next-intl";

interface SensitiveValueProps {
  permission?: keyof PermissionSet;
  value: string | React.ReactNode;
  mask?: string;
}

export function SensitiveValue({
  permission = "viewCosts",
  value,
  mask,
}: SensitiveValueProps) {
  const { isAuthorized } = usePermissions();
  const locale = useLocale();

  const isEn = locale === "en";
  const defaultMask = mask || (isEn ? "[Restricted]" : "[غير مصرّح]");

  if (!isAuthorized(permission)) {
    return (
      <span className="font-semibold text-slate-400 select-none cursor-not-allowed">
        {defaultMask}
      </span>
    );
  }

  return <>{value}</>;
}
