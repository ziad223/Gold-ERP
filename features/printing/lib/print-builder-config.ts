import { z } from "zod";
import type { InvoicePrintTemplateId } from "@/features/printing/lib/invoice-print-options";
import {
  resolveInvoicePrintTemplateConfig,
  type PrintTemplateConfig,
  type PrintTemplateConfigOverrides,
  type PrintTemplateLanguageMode,
  type PrintTemplatePaperSize,
} from "@/features/printing/lib/print-template-config";

/**
 * Zod Schemas for Print Template Config Overrides (Phase 19Q).
 * Wraps features/printing/lib/print-template-config.ts structures to ensure
 * strict validation, stripping any unknown keys or properties.
 */

const LanguageModeSchema = z.enum(["bilingual", "ar", "en"]);
const PaperSizeSchema = z.enum(["A4", "A5", "80mm"]);

const ThemeConfigSchema = z.object({
  gold: z.string().optional(),
  goldDark: z.string().optional(),
  goldSoft: z.string().optional(),
  text: z.string().optional(),
  muted: z.string().optional(),
  ivory: z.string().optional(),
  fontFamily: z.string().optional(),
  titleFontFamily: z.string().optional(),
  watermarkOpacity: z.number().min(0).max(1).optional(),
});

const SectionConfigSchema = z.object({
  header: z.boolean().optional(),
  clientDetails: z.boolean().optional(),
  invoiceDetails: z.boolean().optional(),
  itemsTable: z.boolean().optional(),
  specialSummary: z.boolean().optional(),
  paymentMethod: z.boolean().optional(),
  amountDetails: z.boolean().optional(),
  notes: z.boolean().optional(),
  terms: z.boolean().optional(),
  welcomeMessage: z.boolean().optional(),
  headerNote: z.boolean().optional(),
  footerMessage: z.boolean().optional(),
  signatures: z.boolean().optional(),
  footer: z.boolean().optional(),
});

const FieldVisibilitySchema = z.object({
  companyLogo: z.boolean().optional(),
  companyTrn: z.boolean().optional(),
  watermark: z.boolean().optional(),
  customerPhone: z.boolean().optional(),
  customerTrn: z.boolean().optional(),
  customerAddress: z.boolean().optional(),
  itemKarat: z.boolean().optional(),
  itemWeight: z.boolean().optional(),
  itemAssetId: z.boolean().optional(),
  salesperson: z.boolean().optional(),
  originalInvoiceRef: z.boolean().optional(),
  footerPhone: z.boolean().optional(),
  footerEmail: z.boolean().optional(),
  footerAddress: z.boolean().optional(),
});

const ThemePresetSchema = z.enum(["classicGold", "modernDark", "softGold", "minimalGray", "thermalMono"]);

export const PRINT_BUILDER_THEME_PRESETS: Record<string, {
  gold: string;
  goldDark: string;
  goldSoft: string;
  text: string;
  muted: string;
  ivory: string;
  watermarkOpacity: number;
}> = {
  classicGold: {
    gold: "#af842f",
    goldDark: "#7c5a18",
    goldSoft: "#f6edd7",
    text: "#231f18",
    muted: "#6e6149",
    ivory: "#fffdf7",
    watermarkOpacity: 0.04,
  },
  modernDark: {
    gold: "#4a5568",
    goldDark: "#1a202c",
    goldSoft: "#edf2f7",
    text: "#1a202c",
    muted: "#718096",
    ivory: "#ffffff",
    watermarkOpacity: 0.02,
  },
  softGold: {
    gold: "#c5a880",
    goldDark: "#947a50",
    goldSoft: "#faf8f5",
    text: "#3d362e",
    muted: "#8c7e6d",
    ivory: "#fffcf9",
    watermarkOpacity: 0.05,
  },
  minimalGray: {
    gold: "#718096",
    goldDark: "#2d3748",
    goldSoft: "#f7fafc",
    text: "#2d3748",
    muted: "#a0aec0",
    ivory: "#ffffff",
    watermarkOpacity: 0.0,
  },
  thermalMono: {
    gold: "#000000",
    goldDark: "#000000",
    goldSoft: "#ffffff",
    text: "#000000",
    muted: "#000000",
    ivory: "#ffffff",
    watermarkOpacity: 0.0,
  },
};

export const PrintTemplateConfigOverridesSchema = z.object({
  languageMode: LanguageModeSchema.optional(),
  paperSize: PaperSizeSchema.optional(),
  themePreset: ThemePresetSchema.optional(),
  theme: ThemeConfigSchema.optional(),
  sections: SectionConfigSchema.optional(),
  fields: FieldVisibilitySchema.optional(),
});

/**
 * Master Invoice Print Builder Schema
 */
export const InvoicePrintBuilderConfigSchema = z.object({
  version: z.literal(1),
  templates: z.object({
    luxuryGold: PrintTemplateConfigOverridesSchema.optional(),
    compactA4: PrintTemplateConfigOverridesSchema.optional(),
    minimal: PrintTemplateConfigOverridesSchema.optional(),
    thermal: PrintTemplateConfigOverridesSchema.optional(),
  }),
});

export type InvoicePrintBuilderConfig = z.infer<typeof InvoicePrintBuilderConfigSchema>;

/**
 * Default Builder Config (version 1, empty template overrides)
 */
export const DEFAULT_INVOICE_PRINT_BUILDER_CONFIG: InvoicePrintBuilderConfig = {
  version: 1,
  templates: {},
};

/**
 * Safely parse and sanitize builder config.
 * Never throws; returns DEFAULT_INVOICE_PRINT_BUILDER_CONFIG on invalid payload.
 */
export function sanitizeInvoicePrintBuilderConfig(raw: unknown): InvoicePrintBuilderConfig {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_INVOICE_PRINT_BUILDER_CONFIG;
  }

  const rawObj = raw as any;
  const version = rawObj.version === 1 ? 1 : 1;
  const templates: any = {};

  if (rawObj.templates && typeof rawObj.templates === "object") {
    const keys: (keyof InvoicePrintBuilderConfig["templates"])[] = ["luxuryGold", "compactA4", "minimal", "thermal"];
    for (const key of keys) {
      if (rawObj.templates[key] !== undefined) {
        const parseResult = PrintTemplateConfigOverridesSchema.safeParse(rawObj.templates[key]);
        if (parseResult.success) {
          templates[key] = parseResult.data;
        }
      }
    }
  }

  return {
    version,
    templates,
  };
}

/**
 * Extract overrides for a specific template.
 */
export function getBuilderOverridesForTemplate(
  templateId: InvoicePrintTemplateId,
  builderConfig: InvoicePrintBuilderConfig,
): PrintTemplateConfigOverrides | undefined {
  return builderConfig.templates[templateId];
}

/**
 * Merge builder config overrides with template defaults.
 * Calls resolveInvoicePrintTemplateConfig behind the scenes.
 * Never throws.
 */
export function mergeBuilderConfigWithTemplateDefaults(
  templateId: InvoicePrintTemplateId,
  builderConfig: InvoicePrintBuilderConfig,
): PrintTemplateConfig {
  const overrides = getBuilderOverridesForTemplate(templateId, builderConfig);
  if (!overrides) {
    return resolveInvoicePrintTemplateConfig(null);
  }

  // If a theme preset is defined, resolve its colors and merge them
  const presetColors = overrides.themePreset
    ? PRINT_BUILDER_THEME_PRESETS[overrides.themePreset]
    : undefined;

  const mergedOverrides: PrintTemplateConfigOverrides = {
    ...overrides,
    theme: {
      ...presetColors,
      ...overrides.theme,
    },
  };

  return resolveInvoicePrintTemplateConfig(mergedOverrides);
}
