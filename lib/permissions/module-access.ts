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
  return Array.isArray(requirement)
    ? requirement.some((permission) => hasPermission(permission))
    : hasPermission(requirement);
}

export function routeRuleForPath(pathname: string) {
  return ROUTE_PERMISSION_RULES.find((rule) => rule.pattern.test(pathname)) ?? null;
}
