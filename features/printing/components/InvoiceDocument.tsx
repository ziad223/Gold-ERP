import {
  InvoicePrintTemplate,
  type InvoicePrintTemplateProps,
} from "@/features/printing/components/InvoicePrintTemplate";
import { CompactInvoicePrintTemplate } from "@/features/printing/components/CompactInvoicePrintTemplate";
import { MinimalInvoicePrintTemplate } from "@/features/printing/components/MinimalInvoicePrintTemplate";
import { ThermalInvoicePrintTemplate } from "@/features/printing/components/ThermalInvoicePrintTemplate";
import type { InvoicePrintTemplateId } from "@/features/printing/lib/invoice-print-options";
import {
  sanitizeInvoicePrintBuilderConfig,
  getBuilderOverridesForTemplate,
  PRINT_BUILDER_THEME_PRESETS,
} from "@/features/printing/lib/print-builder-config";

/**
 * Invoice print renderer selector (Phase 19H / 19R).
 *
 * Chooses the print template component by `templateId`. Every other prop is
 * forwarded unchanged. Incorporates customized section/field visibility overrides
 * from `invoicePrintBuilderConfig` settings (Phase 19R).
 */
interface InvoiceDocumentProps extends InvoicePrintTemplateProps {
  templateId?: InvoicePrintTemplateId;
}

export function InvoiceDocument({ templateId, ...props }: InvoiceDocumentProps) {
  const activeId = templateId || "luxuryGold";

  // Phase 19R: Integrate customized builder settings overrides if present.
  const builderSettings = (props.settings as any)?.invoicePrintBuilderConfig;
  const sanitizedBuilder = sanitizeInvoicePrintBuilderConfig(builderSettings);
  const builderOverrides = getBuilderOverridesForTemplate(activeId, sanitizedBuilder);

  const presetTheme = builderOverrides?.themePreset
    ? PRINT_BUILDER_THEME_PRESETS[builderOverrides.themePreset]
    : undefined;

  // Merge builder configs with any incoming templateConfig overrides.
  // Properties defined at runtime (like dialog language) override builder defaults.
  const mergedConfig = {
    ...builderOverrides,
    ...props.templateConfig,
    theme: {
      ...presetTheme,
      ...builderOverrides?.theme,
      ...props.templateConfig?.theme,
    },
    sections: {
      ...builderOverrides?.sections,
      ...props.templateConfig?.sections,
    },
    fields: {
      ...builderOverrides?.fields,
      ...props.templateConfig?.fields,
    },
  };

  const finalProps = {
    ...props,
    templateConfig: mergedConfig,
  };

  if (activeId === "compactA4") {
    return <CompactInvoicePrintTemplate {...finalProps} />;
  }
  if (activeId === "minimal") {
    return <MinimalInvoicePrintTemplate {...finalProps} />;
  }
  if (activeId === "thermal") {
    return <ThermalInvoicePrintTemplate {...finalProps} />;
  }
  // "luxuryGold" and any unknown/missing id -> Luxury Gold.
  return <InvoicePrintTemplate {...finalProps} />;
}
