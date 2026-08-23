export type NotificationAccountType = "legacy" | "super_admin" | "branch_shell" | undefined;

export type CompanyScopedNotificationReadiness = {
  authResolved: boolean;
  authenticated: boolean;
  terminalAuthHandling: boolean;
  accountType: NotificationAccountType;
  branchEmployeeReady: boolean;
  explicitCompanyId?: string | null;
};

export type NotificationQueryMetadata = {
  notificationLifecycle: true;
  notificationErrorScope: string;
};

export const NOTIFICATION_TOAST_DEDUPE_WINDOW_MS = 5_000;

/**
 * The Company returned for display at login is deliberately not used here.
 * Super Admin notification traffic starts only when a caller supplies an
 * explicit Company authority (the future UX-PRE1 integration point).
 */
export function normalizeExplicitCompanyId(companyId?: string | null): string | undefined {
  const normalized = companyId?.trim();
  return normalized || undefined;
}

export function canStartCompanyScopedNotifications(input: CompanyScopedNotificationReadiness): boolean {
  if (!input.authResolved || !input.authenticated || input.terminalAuthHandling || !input.branchEmployeeReady) return false;
  return input.accountType !== "super_admin" || Boolean(normalizeExplicitCompanyId(input.explicitCompanyId));
}

export function notificationListQueryKey(explicitCompanyId?: string | null) {
  const companyId = normalizeExplicitCompanyId(explicitCompanyId);
  return companyId ? (["notifications", "company", companyId] as const) : (["notifications"] as const);
}

export function notificationUnreadCountQueryKey(explicitCompanyId?: string | null) {
  const companyId = normalizeExplicitCompanyId(explicitCompanyId);
  return companyId
    ? (["notifications", "unread-count", "company", companyId] as const)
    : (["notifications", "unread-count"] as const);
}

export function notificationQueryMetadata(explicitCompanyId?: string | null): NotificationQueryMetadata {
  return {
    notificationLifecycle: true,
    notificationErrorScope: normalizeExplicitCompanyId(explicitCompanyId) || "server-derived",
  };
}

export function isNotificationQueryMetadata(value: unknown): value is NotificationQueryMetadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Partial<NotificationQueryMetadata>;
  return metadata.notificationLifecycle === true && typeof metadata.notificationErrorScope === "string";
}

export function notificationRequestOptions(explicitCompanyId?: string | null): { skipBranch: true; companyId?: string } {
  const companyId = normalizeExplicitCompanyId(explicitCompanyId);
  return companyId ? { skipBranch: true, companyId } : { skipBranch: true };
}

export function notificationSseHeaders(token: string, explicitCompanyId?: string | null): Record<string, string> {
  const companyId = normalizeExplicitCompanyId(explicitCompanyId);
  return {
    Accept: "text/event-stream",
    Authorization: `Bearer ${token}`,
    ...(companyId ? { "X-Company-ID": companyId } : {}),
  };
}

export type NotificationSseFailure = "terminal" | "transient";

/** Permanent client/auth/context rejections must wait for a state change. */
export function classifyNotificationSseFailure(status?: number): NotificationSseFailure {
  if (typeof status !== "number" || status < 400) return "transient";
  return status >= 400 && status < 500 ? "terminal" : "transient";
}

export type NotificationErrorShape = { status?: number; errorCode?: string };

export function isNotificationTerminalAuthOrContextError(error: NotificationErrorShape): boolean {
  return error.status === 401 || error.status === 403 || error.status === 422;
}

export function notificationErrorDedupeKey(error: NotificationErrorShape, metadata: NotificationQueryMetadata): string {
  return `notification:${metadata.notificationErrorScope}:${error.errorCode || `HTTP_${error.status || "UNKNOWN"}`}`;
}

export function shouldShowNotificationTerminalToast(
  lastShownAt: Map<string, number>,
  error: NotificationErrorShape,
  metadata: NotificationQueryMetadata,
  now = Date.now(),
): boolean {
  if (!isNotificationTerminalAuthOrContextError(error)) return false;
  const key = notificationErrorDedupeKey(error, metadata);
  const previous = lastShownAt.get(key);
  if (previous !== undefined && now - previous < NOTIFICATION_TOAST_DEDUPE_WINDOW_MS) return false;
  lastShownAt.set(key, now);
  return true;
}

export function notificationTerminalToastMessage(error: NotificationErrorShape): string {
  switch (error.status) {
    case 401:
      return "Notification access requires an active session.";
    case 403:
      return "Notification access is unavailable for the selected Company.";
    case 422:
      return "Notification access requires an explicit Company context.";
    default:
      return "Notification access is temporarily unavailable.";
  }
}
