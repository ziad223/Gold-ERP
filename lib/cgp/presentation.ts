import { formatAppMoney } from "@/lib/formatters/currency";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { formatDate, formatDateTime } from "@/lib/dates/dates";

const CGP_TIMEZONE = "Asia/Dubai";

export function formatCgpDate(value: string | Date | null | undefined, locale: string): string {
  return formatDate(value, locale);
}

export function formatCgpDateTime(value: string | Date | null | undefined, locale: string): string {
  return formatDateTime(value, CGP_TIMEZONE, locale);
}

export function formatCgpMoney(value: number | string | null | undefined, currency: string): string {
  if (value === null || value === undefined || value === "") return "—";
  // CGP evidence and liabilities use four fractional digits. Keep the
  // presentation precise without changing the stored/accounting amount.
  return formatAppMoney(value, currency, 4);
}

export function formatCgpNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return toEnglishDigits(String(value));
}

export function cgpBusinessStatusLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    DRAFT: ["مسودة", "Draft"],
    VALIDATED: ["تم التحقق", "Validated"],
    POSTED: ["تم الترحيل", "Posted"],
    REVERSED: ["تم العكس", "Reversed"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}

export function cgpGovernanceLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    NONE: ["بدون مراجعة إدارية", "No governance review"],
    PENDING: ["مراجعة إدارية معلقة", "Governance review pending"],
    APPROVED: ["اعتماد إداري", "Governance approved"],
    REJECTED: ["مراجعة مرفوضة", "Governance rejected"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}

export function cgpIntegrationStatusLabel(
  consumer: "INVENTORY" | "ACCOUNTING" | "GOLD_CENTER" | "CRM",
  value: unknown,
  locale: string,
): string {
  const normalized = String(value || "PENDING").toUpperCase();
  if (normalized === "SUCCEEDED") return locale === "ar" ? "تم بنجاح" : "Succeeded";
  if (normalized === "FAILED") return locale === "ar" ? "فشل التكامل" : "Integration failed";
  if (normalized === "PROCESSING") return locale === "ar" ? "جارٍ التنفيذ" : "Processing";
  if (normalized === "RETRYABLE_FAILED") return locale === "ar" ? "تعذر مؤقتًا — قابل لإعادة المحاولة" : "Retryable failure";
  if (normalized === "TERMINAL_FAILED") return locale === "ar" ? "فشل نهائي" : "Terminal failure";
  if (consumer === "CRM" && normalized === "PENDING") return locale === "ar" ? "معلّق — عرض إسقاطي" : "Pending — soft projection";
  if (normalized === "PENDING") return locale === "ar" ? "معلّق" : "Pending";
  return locale === "ar" ? "غير معروف" : "Unknown";
}

export function cgpPaymentMethodLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    CASH: ["نقدي", "Cash"],
    BANK: ["بنكي", "Bank"],
    BANK_TRANSFER: ["تحويل بنكي", "Bank transfer"],
    MIXED: ["مختلط", "Mixed"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}

export function cgpPaymentStatusLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    UNPAID: ["مستحق", "Due"],
    PARTIALLY_PAID: ["مدفوع جزئيًا", "Partially paid"],
    FULLY_PAID: ["مدفوع بالكامل", "Fully paid"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}

export function cgpSettlementStatusLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    EXECUTED: ["تم التنفيذ", "Executed"],
    PENDING: ["معلّق", "Pending"],
    FAILED: ["فشل", "Failed"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}

export function cgpOperationalStatusLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    AVAILABLE: ["متاح", "Available"],
    RESERVED: ["محجوز", "Reserved"],
    SOLD: ["مباع", "Sold"],
    RETURNED: ["مرتجع", "Returned"],
    PENDING_INTEGRATION: ["بانتظار التكامل", "Pending integration"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}

export function cgpReversalStatusLabel(value: unknown, locale: string): string {
  const normalized = String(value || "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    REQUESTED: ["مطلوب عكسه", "Requested"],
    HELD: ["قيد الحجز للعكس", "Held for reversal"],
    COMPENSATING: ["جارٍ تنفيذ التعويض", "Compensating"],
    REVERSED: ["تم العكس", "Reversed"],
  };
  return labels[normalized]?.[locale === "ar" ? 0 : 1] || "—";
}
