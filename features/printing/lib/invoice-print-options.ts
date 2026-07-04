import type { Invoice } from "@/lib/types";
import type { PrintTemplateConfigOverrides, PrintTemplateLanguageMode } from "@/features/printing/lib/print-template-config";

/**
 * Invoice print options — Phase 19F.
 *
 * Runtime/UI-only choices collected by the print options dialog before printing.
 * These options NEVER mutate the invoice, call the API, or persist anywhere
 * (no DB / no localStorage / no settings save). They only shape how the
 * read-only print template displays the already-stored invoice truth.
 */

/**
 * Which document title the printed page shows. "auto" derives the title from
 * the stored invoice type + tax data (ViewModel behaviour). Every other mode is
 * a DISPLAY-ONLY title override — it does not change the invoice type, items,
 * totals, VAT, or any stored data.
 */
export type InvoicePrintDocumentMode =
  | "auto"
  | "taxInvoice"
  | "salesInvoice"
  | "returnInvoice"
  | "exchangeInvoice"
  | "installmentInvoice"
  | "depositInvoice"
  | "giftVoucher"
  | "customerGoldPurchase";

/** Print templates. Luxury Gold, Compact A4, Minimal A4 and Thermal are implemented. */
export type InvoicePrintTemplateId = "luxuryGold" | "compactA4" | "minimal" | "thermal";

export interface InvoicePrintOptions {
  documentMode: InvoicePrintDocumentMode;
  templateId: InvoicePrintTemplateId;
  languageMode: PrintTemplateLanguageMode;
}

export function getDefaultInvoicePrintOptions(): InvoicePrintOptions {
  return {
    documentMode: "auto",
    templateId: "luxuryGold",
    languageMode: "bilingual",
  };
}

/** Allowed values (kept identical to the Phase 19F dialog). */
const ALLOWED_DOCUMENT_MODES: InvoicePrintDocumentMode[] = [
  "auto", "taxInvoice", "salesInvoice", "returnInvoice", "exchangeInvoice",
  "installmentInvoice", "depositInvoice", "giftVoucher", "customerGoldPurchase",
];
const ALLOWED_TEMPLATE_IDS: InvoicePrintTemplateId[] = ["luxuryGold", "compactA4", "minimal", "thermal"];
const ALLOWED_LANGUAGE_MODES: PrintTemplateLanguageMode[] = ["bilingual", "ar", "en"];

/**
 * Validate an untrusted stored/raw value against the 19F enums. Missing or
 * invalid fields fall back to the defaults (Auto / Luxury Gold / Bilingual).
 * Display-only — never touches invoice data.
 */
export function sanitizePrintTemplateDefaults(raw: unknown): InvoicePrintOptions {
  const defaults = getDefaultInvoicePrintOptions();
  const r = (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : {};
  return {
    documentMode: ALLOWED_DOCUMENT_MODES.includes(r.documentMode as InvoicePrintDocumentMode)
      ? (r.documentMode as InvoicePrintDocumentMode)
      : defaults.documentMode,
    templateId: ALLOWED_TEMPLATE_IDS.includes(r.templateId as InvoicePrintTemplateId)
      ? (r.templateId as InvoicePrintTemplateId)
      : defaults.templateId,
    languageMode: ALLOWED_LANGUAGE_MODES.includes(r.languageMode as PrintTemplateLanguageMode)
      ? (r.languageMode as PrintTemplateLanguageMode)
      : defaults.languageMode,
  };
}

/** Map dialog options onto the 19E template config overrides. */
export function buildTemplateConfigFromPrintOptions(
  options: InvoicePrintOptions,
): PrintTemplateConfigOverrides {
  return { languageMode: options.languageMode };
}

/**
 * Display-only document title per mode. Mirrors the ViewModel titles so a
 * manual selection prints the same wording auto mode would produce for that
 * type. Returns undefined for "auto" (ViewModel decides).
 */
export function getPrintDocumentTitleOverride(
  mode: InvoicePrintDocumentMode,
): { titleAr: string; titleEn: string } | undefined {
  switch (mode) {
    case "taxInvoice":
      return { titleAr: "فاتورة ضريبية", titleEn: "TAX INVOICE" };
    case "salesInvoice":
      return { titleAr: "فاتورة مبيعات", titleEn: "SALES INVOICE" };
    case "returnInvoice":
      return { titleAr: "فاتورة مرتجع", titleEn: "RETURN INVOICE" };
    case "exchangeInvoice":
      return { titleAr: "فاتورة استبدال", titleEn: "EXCHANGE INVOICE" };
    case "installmentInvoice":
      return { titleAr: "فاتورة أقساط", titleEn: "INSTALLMENT INVOICE" };
    case "depositInvoice":
      return { titleAr: "فاتورة عربون", titleEn: "DEPOSIT INVOICE" };
    case "giftVoucher":
      return { titleAr: "فاتورة قسيمة هدية", titleEn: "GIFT VOUCHER INVOICE" };
    case "customerGoldPurchase":
      return { titleAr: "فاتورة شراء ذهب من عميل", titleEn: "CUSTOMER GOLD PURCHASE INVOICE" };
    case "auto":
    default:
      return undefined;
  }
}

/** Raw invoice types each manual mode naturally corresponds to. */
const MODE_RAW_TYPES: Record<Exclude<InvoicePrintDocumentMode, "auto">, string[]> = {
  taxInvoice: ["sale"],
  salesInvoice: ["sale"],
  returnInvoice: ["return"],
  exchangeInvoice: ["exchange"],
  installmentInvoice: ["installment"],
  depositInvoice: ["deposit"],
  giftVoucher: ["giftVoucher"],
  customerGoldPurchase: ["customerGoldPurchase"],
};

/**
 * Light advisory check for the dialog warning only — never blocks printing and
 * never validates/changes data.
 */
export function printModeMatchesInvoice(mode: InvoicePrintDocumentMode, invoice: Invoice): boolean {
  if (mode === "auto") return true;
  const rawType = String((invoice as Invoice & { type?: string }).type || "sale");
  return MODE_RAW_TYPES[mode].includes(rawType);
}
