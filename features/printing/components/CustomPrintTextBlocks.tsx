import type { CSSProperties } from "react";
import {
  DEFAULT_CUSTOM_PRINT_BLOCK_STYLE,
  type CustomPrintBlockAlignment,
  type CustomPrintBlockFontSize,
  type InvoicePrintCustomBlockView,
} from "@/features/printing/lib/invoice-print-custom-blocks-config";

type CustomPrintTextBlocksProps = {
  blocks?: InvoicePrintCustomBlockView[];
  compact?: boolean;
  className?: string;
};

export function CustomPrintTextBlocks({ blocks, compact = false, className }: CustomPrintTextBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  const wrapperStyle: CSSProperties = compact
    ? {
        margin: "1.5mm 0",
        padding: "1.3mm 0",
        borderTop: "1px dashed currentColor",
        borderBottom: "1px dashed currentColor",
      }
    : {
        margin: "3mm 0",
        padding: "2.2mm 3mm",
        border: "1px solid rgba(175, 132, 47, 0.35)",
        background: "rgba(255, 255, 255, 0.72)",
      };

  return (
    <section className={className} style={wrapperStyle}>
      {blocks.map((block) => {
        const safeStyle = block.style ?? DEFAULT_CUSTOM_PRINT_BLOCK_STYLE;
        const blockStyle = getBlockTextStyle(safeStyle, compact);
        const titleStyle: CSSProperties = {
          ...blockStyle,
          margin: 0,
          fontWeight: safeStyle.bold ? 900 : 800,
        };
        const contentStyle: CSSProperties = {
          ...blockStyle,
          margin: block.title ? "0.6mm 0 0" : 0,
          whiteSpace: "pre-line",
        };

        return (
          <div key={block.id} style={{ marginTop: compact ? "1mm" : "1.8mm" }}>
            {block.title && (
              <p style={titleStyle}>
                {block.title}
              </p>
            )}
            <p style={contentStyle}>
              {block.content}
            </p>
          </div>
        );
      })}
    </section>
  );
}

const FONT_SIZE_MAP: Record<CustomPrintBlockFontSize, { regular: string; compact: string }> = {
  xs: { regular: "8px", compact: "7.6px" },
  sm: { regular: "9px", compact: "8.1px" },
  base: { regular: "9.8px", compact: "8.6px" },
  lg: { regular: "11px", compact: "9.4px" },
  xl: { regular: "12.2px", compact: "10.2px" },
};

const ALIGN_MAP: Record<CustomPrintBlockAlignment, CSSProperties["textAlign"]> = {
  left: "left",
  center: "center",
  right: "right",
};

function getBlockTextStyle(
  style = DEFAULT_CUSTOM_PRINT_BLOCK_STYLE,
  compact: boolean,
): CSSProperties {
  const fontSize = FONT_SIZE_MAP[style.fontSize] ?? FONT_SIZE_MAP.base;
  return {
    fontSize: compact ? fontSize.compact : fontSize.regular,
    textAlign: ALIGN_MAP[style.align] ?? ALIGN_MAP.left,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    overflowWrap: "anywhere",
  };
}
