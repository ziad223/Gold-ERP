import type { EmployeeAuthorizationSummary } from "@/lib/types";

export type PermissionRequirement = string | readonly string[];

export interface RoutePermissionRule {
  pattern: RegExp;
  permission: PermissionRequirement;
  branchBusiness: boolean;
}

export const EMPLOYEE_ROUTE_PERMISSIONS = [
  "payroll.view",
  "employees.credentials.manage",
  "employees.permissions.manage",
  "employees.branches.manage",
  "employees.verification.view",
] as const;

export const ROUTE_PERMISSION_RULES: readonly RoutePermissionRule[] = [
  { pattern: /^\/dashboard/, permission: "dashboard.view", branchBusiness: true },
  { pattern: /^\/pos/, permission: ["pos.view", "pos.sell"], branchBusiness: true },
  { pattern: /^\/sales/, permission: "sales.view", branchBusiness: true },
  { pattern: /^\/customers/, permission: "customers.view", branchBusiness: true },
  { pattern: /^\/inventory/, permission: "inventory.view", branchBusiness: true },
  { pattern: /^\/gold-center/, permission: "gold.view", branchBusiness: true },
  { pattern: /^\/suppliers/, permission: "suppliers.view", branchBusiness: true },
  { pattern: /^\/accounting\/treasury/, permission: "treasury.view", branchBusiness: true },
  { pattern: /^\/accounting/, permission: "accounting.view", branchBusiness: true },
  { pattern: /^\/reports/, permission: "reports.view", branchBusiness: true },
  { pattern: /^\/notifications/, permission: "notifications.view", branchBusiness: true },
  { pattern: /^\/employees/, permission: EMPLOYEE_ROUTE_PERMISSIONS, branchBusiness: false },
  { pattern: /^\/audit/, permission: "audit.view", branchBusiness: false },
  { pattern: /^\/approvals/, permission: "approvals.view", branchBusiness: false },
  { pattern: /^\/settings\/users/, permission: "users.view", branchBusiness: false },
  { pattern: /^\/settings/, permission: "settings.view", branchBusiness: false },
] as const;

export const BUSINESS_ROUTE_PRIORITY = [
  "/pos",
  "/sales",
  "/customers",
  "/inventory",
  "/gold-center",
  "/suppliers",
  "/accounting/treasury",
  "/accounting",
  "/reports",
  "/dashboard",
] as const;

export function permissionMatches(
  requirement: PermissionRequirement | undefined,
  hasPermission: (permission: string) => boolean,
) {
  if (!requirement) return true;
  return typeof requirement === "string"
    ? hasPermission(requirement)
    : requirement.some((permission) => hasPermission(permission));
}

export function routeRuleForPath(pathname: string) {
  return ROUTE_PERMISSION_RULES.find((rule) => rule.pattern.test(pathname)) ?? null;
}

export function firstAllowedBusinessRoute(permissionNames: readonly string[]) {
  const permissionSet = new Set(permissionNames);
  return BUSINESS_ROUTE_PRIORITY.find((pathname) => {
    const rule = routeRuleForPath(pathname);
    return Boolean(rule?.branchBusiness && permissionMatches(rule.permission, (permission) => permissionSet.has(permission)));
  }) ?? null;
}

export interface EmployeeWorkspaceRoute {
  pathname: string;
  hasAssignedBusinessAccess: boolean;
}

// This consumes the backend-resolved authorization summary. It never derives
// permissions from technical-account state or from a stale provider snapshot.
export function resolveEmployeeWorkspaceRoute(authorization: EmployeeAuthorizationSummary | null): EmployeeWorkspaceRoute {
  const effectivePermissions = authorization?.effectivePermissionNames
    ?? authorization?.effectivePermissions
    ?? [];
  const pathname = firstAllowedBusinessRoute(effectivePermissions);
  return {
    pathname: pathname ?? "/dashboard",
    hasAssignedBusinessAccess: Boolean(pathname),
  };
}
