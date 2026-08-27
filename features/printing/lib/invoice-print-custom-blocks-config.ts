import type { InvoicePrintTemplateId } from "@/features/printing/lib/invoice-print-options";

export const CUSTOM_PRINT_BLOCK_PLACEMENTS = [
  "afterHeader",
  "afterInvoiceDetails",
  "beforeItems",
  "afterItems",
  "afterTotals",
  "beforeSignatures",
  "beforeFooter",
] as const;

export const CUSTOM_PRINT_BLOCK_MAX_BLOCKS = 5;
export const CUSTOM_PRINT_BLOCK_TITLE_MAX = 120;
export const CUSTOM_PRINT_BLOCK_CONTENT_MAX = 1000;

export const CUSTOM_PRINT_BLOCK_FONT_SIZES = ["xs", "sm", "base", "lg", "xl"] as const;
export const CUSTOM_PRINT_BLOCK_ALIGNMENTS = ["left", "center", "right"] as const;

export type CustomPrintBlockPlacement = (typeof CUSTOM_PRINT_BLOCK_PLACEMENTS)[number];
export type CustomPrintBlockFontSize = (typeof CUSTOM_PRINT_BLOCK_FONT_SIZES)[number];
export type CustomPrintBlockAlignment = (typeof CUSTOM_PRINT_BLOCK_ALIGNMENTS)[number];

export type CustomPrintBlockStyle = {
  fontSize: CustomPrintBlockFontSize;
  align: CustomPrintBlockAlignment;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type InvoicePrintCustomBlock = {
  id: string;
  enabled: boolean;
  title?: string;
  content: string;
  placement: CustomPrintBlockPlacement;
  templates?: InvoicePrintTemplateId[];
  sortOrder: number;
  style: CustomPrintBlockStyle;
};

export type InvoicePrintCustomBlocksConfig = {
  version: 1;
  blocks: InvoicePrintCustomBlock[];
};

export type InvoicePrintCustomBlockView = {
  id: string;
  title?: string;
  content: string;
  style: CustomPrintBlockStyle;
};

export type CustomPrintBlocksByPlacement = Partial<
  Record<CustomPrintBlockPlacement, InvoicePrintCustomBlockView[]>
>;

export const DEFAULT_INVOICE_PRINT_CUSTOM_BLOCKS_CONFIG: InvoicePrintCustomBlocksConfig = {
  version: 1,
  blocks: [],
};

export const DEFAULT_CUSTOM_PRINT_BLOCK_STYLE: CustomPrintBlockStyle = {
  fontSize: "base",
  align: "left",
  bold: false,
  italic: false,
  underline: false,
};

const PRINT_TEMPLATE_IDS: InvoicePrintTemplateId[] = ["luxuryGold", "compactA4", "minimal", "thermal"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const trimText = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
};

const isPlacement = (value: unknown): value is CustomPrintBlockPlacement =>
  typeof value === "string" && CUSTOM_PRINT_BLOCK_PLACEMENTS.includes(value as CustomPrintBlockPlacement);

const isTemplateId = (value: unknown): value is InvoicePrintTemplateId =>
  typeof value === "string" && PRINT_TEMPLATE_IDS.includes(value as InvoicePrintTemplateId);

const isFontSize = (value: unknown): value is CustomPrintBlockFontSize =>
  typeof value === "string" && CUSTOM_PRINT_BLOCK_FONT_SIZES.includes(value as CustomPrintBlockFontSize);

const isAlignment = (value: unknown): value is CustomPrintBlockAlignment =>
  typeof value === "string" && CUSTOM_PRINT_BLOCK_ALIGNMENTS.includes(value as CustomPrintBlockAlignment);

function sanitizeTemplates(value: unknown): InvoicePrintTemplateId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const templates = value.filter(isTemplateId).filter((templateId, index, arr) => arr.indexOf(templateId) === index);
  return templates.length > 0 && templates.length < PRINT_TEMPLATE_IDS.length ? templates : undefined;
}

function sanitizeSortOrder(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

export function sanitizeCustomPrintBlockStyle(raw: unknown): CustomPrintBlockStyle {
  const style = isRecord(raw) ? raw : {};
  return {
    fontSize: isFontSize(style.fontSize) ? style.fontSize : DEFAULT_CUSTOM_PRINT_BLOCK_STYLE.fontSize,
    align: isAlignment(style.align) ? style.align : DEFAULT_CUSTOM_PRINT_BLOCK_STYLE.align,
    bold: typeof style.bold === "boolean" ? style.bold : DEFAULT_CUSTOM_PRINT_BLOCK_STYLE.bold,
    italic: typeof style.italic === "boolean" ? style.italic : DEFAULT_CUSTOM_PRINT_BLOCK_STYLE.italic,
    underline: typeof style.underline === "boolean" ? style.underline : DEFAULT_CUSTOM_PRINT_BLOCK_STYLE.underline,
  };
}

export function sanitizeInvoicePrintCustomBlocksConfig(raw: unknown): InvoicePrintCustomBlocksConfig {
  if (!isRecord(raw) || !Array.isArray(raw.blocks)) {
    return DEFAULT_INVOICE_PRINT_CUSTOM_BLOCKS_CONFIG;
  }

  const blocks = raw.blocks
    .map((block, index): InvoicePrintCustomBlock | undefined => {
      if (!isRecord(block) || !isPlacement(block.placement)) return undefined;

      const content = trimText(block.content, CUSTOM_PRINT_BLOCK_CONTENT_MAX);
      if (!content) return undefined;

      const id = trimText(block.id, 80) ?? `block-${index + 1}`;
      const title = trimText(block.title, CUSTOM_PRINT_BLOCK_TITLE_MAX);
      const sortOrder = sanitizeSortOrder(block.sortOrder, index);
      const style = sanitizeCustomPrintBlockStyle(block.style);

      return {
        id,
        enabled: typeof block.enabled === "boolean" ? block.enabled : true,
        title,
        content,
        placement: block.placement,
        templates: sanitizeTemplates(block.templates),
        sortOrder,
        style,
      };
    })
    .filter((block): block is InvoicePrintCustomBlock => Boolean(block))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .slice(0, CUSTOM_PRINT_BLOCK_MAX_BLOCKS);

  return {
    version: 1,
    blocks,
  };
}

export function getCustomPrintBlocksForTemplate(
  config: InvoicePrintCustomBlocksConfig,
  templateId?: InvoicePrintTemplateId,
): InvoicePrintCustomBlock[] {
  return config.blocks.filter((block) => {
    if (!block.enabled) return false;
    if (!block.templates || block.templates.length === 0) return true;
    return templateId ? block.templates.includes(templateId) : true;
  });
}

export function groupCustomPrintBlocksByPlacement(
  blocks: InvoicePrintCustomBlock[],
): CustomPrintBlocksByPlacement {
  return blocks.reduce<CustomPrintBlocksByPlacement>((acc, block) => {
    const nextBlock: InvoicePrintCustomBlockView = {
      id: block.id,
      title: block.title,
      content: block.content,
      style: block.style,
    };
    acc[block.placement] = [...(acc[block.placement] ?? []), nextBlock];
    return acc;
  }, {});
}
