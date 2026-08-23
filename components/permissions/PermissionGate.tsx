"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { PermissionSet } from "@/lib/permissions/permissions";

interface PermissionGateProps {
  permission: keyof PermissionSet;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { isAuthorized } = usePermissions();

  if (!isAuthorized(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
