/**
 * Print template configuration shape — Phase 19D-CLEAN groundwork.
 *
 * TYPES + SAFE DEFAULTS ONLY. This module is intentionally NOT wired to any
 * settings UI, backend, or the current `InvoicePrintTemplate` render path yet.
 * It exists so the upcoming Print Template Builder / Print Settings work can be
 * built on a stable, agreed shape instead of ad-hoc props.
 *
 * Hard rules (mirrors docs/AI_HANDOFF.md):
 *  - No financial recalculation (no VAT/subtotal/total/COGS logic here).
 *  - No hardcoded company/customer/invoice/TRN data — only generic style flags
 *    and neutral label defaults.
 *  - Read-only/presentation config; the invoice financial truth stays in the
 *    system-provided InvoicePrintViewModel.
 */

/** Which language(s) a bilingual template renders. */
export type PrintTemplateLanguageMode = "bilingual" | "ar" | "en";

/** Paper sizes the print layer targets today. */
export type PrintTemplatePaperSize = "A4" | "A5" | "80mm";

/**
 * Per-field visibility (display toggles only — hiding a field never changes any
 * computed value, it only omits it from the printed document).
 */
export interface PrintTemplateFieldVisibility {
  companyLogo: boolean;
  companyTrn: boolean;
  watermark: boolean;
  customerPhone: boolean;
  customerTrn: boolean;
  customerAddress: boolean;
  itemKarat: boolean;
  itemWeight: boolean;
  itemAssetId: boolean;
  salesperson: boolean;
  originalInvoiceRef: boolean;
  footerPhone: boolean;
  footerEmail: boolean;
  footerAddress: boolean;
}

/**
 * Per-section visibility. Sections with no backing data still collapse at render
 * time; these flags let a future builder additionally opt sections out.
 */
export interface PrintTemplateSectionConfig {
  header: boolean;
  clientDetails: boolean;
  invoiceDetails: boolean;
  itemsTable: boolean;
  specialSummary: boolean;
  paymentMethod: boolean;
  amountDetails: boolean;
  notes: boolean;
  terms: boolean;
  signatures: boolean;
  footer: boolean;
}

/** Visual theme (colors/fonts). Defaults mirror the current luxury gold style. */
export interface PrintTemplateThemeConfig {
  gold: string;
  goldDark: string;
  goldSoft: string;
  text: string;
  muted: string;
  ivory: string;
  fontFamily: string;
  titleFontFamily: string;
  /** 0..1 opacity for the watermark image (display only). */
  watermarkOpacity: number;
}

/** Full print-template config used by a future builder/settings layer. */
export interface PrintTemplateConfig {
  languageMode: PrintTemplateLanguageMode;
  paperSize: PrintTemplatePaperSize;
  themePreset?: string;
  theme: PrintTemplateThemeConfig;
  sections: PrintTemplateSectionConfig;
  fields: PrintTemplateFieldVisibility;
}

export const DEFAULT_PRINT_TEMPLATE_THEME: PrintTemplateThemeConfig = {
  gold: "#af842f",
  goldDark: "#7c5a18",
  goldSoft: "#f6edd7",
  text: "#231f18",
  muted: "#6e6149",
  ivory: "#fffdf7",
  fontFamily: '"Times New Roman", "Noto Naskh Arabic", "Arial", serif',
  titleFontFamily: '"Times New Roman", "Noto Naskh Arabic", "Arial", serif',
  watermarkOpacity: 0.04,
};

export const DEFAULT_PRINT_TEMPLATE_SECTIONS: PrintTemplateSectionConfig = {
  header: true,
  clientDetails: true,
  invoiceDetails: true,
  itemsTable: true,
  specialSummary: true,
  paymentMethod: true,
  amountDetails: true,
  notes: true,
  terms: true,
  signatures: true,
  footer: true,
};

export const DEFAULT_PRINT_TEMPLATE_FIELDS: PrintTemplateFieldVisibility = {
  companyLogo: true,
  companyTrn: true,
  watermark: true,
  customerPhone: true,
  customerTrn: true,
  customerAddress: true,
  itemKarat: true,
  itemWeight: true,
  itemAssetId: true,
  salesperson: true,
  originalInvoiceRef: true,
  footerPhone: true,
  footerEmail: true,
  footerAddress: true,
};

export const DEFAULT_PRINT_TEMPLATE_CONFIG: PrintTemplateConfig = {
  languageMode: "bilingual",
  paperSize: "A4",
  theme: DEFAULT_PRINT_TEMPLATE_THEME,
  sections: DEFAULT_PRINT_TEMPLATE_SECTIONS,
  fields: DEFAULT_PRINT_TEMPLATE_FIELDS,
};

/**
 * Overrides accepted by the resolver / template prop. Nested groups are partial
 * so callers can tweak a single color or toggle without restating the whole config.
 */
export type PrintTemplateConfigOverrides = {
  languageMode?: PrintTemplateLanguageMode;
  paperSize?: PrintTemplatePaperSize;
  theme?: Partial<PrintTemplateThemeConfig>;
  sections?: Partial<PrintTemplateSectionConfig>;
  fields?: Partial<PrintTemplateFieldVisibility>;
  themePreset?: string;
};

/**
 * Merge optional overrides onto the safe defaults. Dependency-free shallow merge
 * per group; missing/undefined overrides never break the template. Passing
 * nothing returns the exact current default look.
 */
export function resolveInvoicePrintTemplateConfig(
  overrides?: PrintTemplateConfigOverrides | null,
): PrintTemplateConfig {
  const o = overrides ?? {};
  return {
    languageMode: o.languageMode ?? DEFAULT_PRINT_TEMPLATE_CONFIG.languageMode,
    paperSize: o.paperSize ?? DEFAULT_PRINT_TEMPLATE_CONFIG.paperSize,
    themePreset: o.themePreset,
    theme: { ...DEFAULT_PRINT_TEMPLATE_THEME, ...(o.theme ?? {}) },
    sections: { ...DEFAULT_PRINT_TEMPLATE_SECTIONS, ...(o.sections ?? {}) },
    fields: { ...DEFAULT_PRINT_TEMPLATE_FIELDS, ...(o.fields ?? {}) },
  };
}

/** Language-mode helpers (display only). Bilingual shows both scripts. */
export const shouldShowArabic = (config: PrintTemplateConfig): boolean =>
  config.languageMode === "bilingual" || config.languageMode === "ar";

export const shouldShowEnglish = (config: PrintTemplateConfig): boolean =>
  config.languageMode === "bilingual" || config.languageMode === "en";
