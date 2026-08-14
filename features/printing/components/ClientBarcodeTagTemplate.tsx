/**
 * Phase 32.3-Fix — client front/back barcode tag template for serialized Assets.
 *
 * ADDITIVE: this does NOT replace or modify the generic BarcodePrintTemplate
 * (still used for Product labels and generic Asset labels). It renders two
 * logical faces (front + type-specific back) per tag through the same print
 * pipeline (ScannableBarcode → renderPrintDocument → printHtmlDocument).
 *
 * The physical duplex method (true two-sided vs paired panels) is left to the
 * printer and is pending client confirmation; faces are rendered as adjacent
 * panels so either workflow can be used. Dimensions stay configurable.
 */

import type { CSSProperties } from "react";
import type { AssetTagData } from "@/lib/print/barcode-label";
import type { ClientTagConfig } from "./barcode-tags/types";
import { DEFAULT_CLIENT_TAG_CONFIG } from "./barcode-tags/types";
import { BarcodeTagFront } from "./barcode-tags/BarcodeTagFront";
import { BarcodeTagBack } from "./barcode-tags/BarcodeTagBacks";

interface ClientBarcodeTagTemplateProps {
  items: AssetTagData[];
  config?: Partial<ClientTagConfig>;
  companyName?: string;
  companyLogo?: string;
  currency: string;
  locale: string;
}

const TAG_CSS = `
  .client-tag-sheet {
    display: grid;
    grid-template-columns: repeat(var(--tag-columns), calc(var(--tag-width) * 2 + 4mm));
    gap: 4mm 6mm;
    align-items: start;
    justify-content: start;
  }
  .client-tag-pair {
    display: grid;
    grid-template-columns: var(--tag-width) var(--tag-width);
    gap: 4mm;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .barcode-tag-face {
    width: var(--tag-width);
    height: var(--tag-height);
    padding: 1.5mm 2mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.5mm;
    font-size: var(--tag-font);
    line-height: 1.25;
    border: 1px solid #111827;
  }
  .client-tag-sheet.no-border .barcode-tag-face { border: none; }
  .barcode-tag-head { display: flex; align-items: center; justify-content: space-between; gap: 2mm; }
  .barcode-tag-company { font-weight: 900; font-size: 1.05em; }
  .barcode-tag-provisional { font-size: 0.8em; font-weight: 800; color: #b45309; letter-spacing: 0.08em; }
  .barcode-tag-symbol { display: flex; flex-direction: column; align-items: center; gap: 0.5mm; }
  .barcode-tag-price { font-weight: 900; font-size: 1.25em; text-align: center; }
  .barcode-tag-title {
    font-weight: 800; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5mm; margin-bottom: 0.5mm;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .barcode-tag-row { display: flex; justify-content: space-between; gap: 2mm; }
  .barcode-tag-row-label { font-weight: 700; color: #374151; }
  .barcode-tag-row-value { font-weight: 700; overflow-wrap: anywhere; text-align: end; }
  .barcode-tag-rfid { margin-top: auto; font-size: 0.85em; color: #64748b; direction: ltr; }
`;

export function ClientBarcodeTagTemplate({ items, config: configOverride, companyName, companyLogo, currency, locale }: ClientBarcodeTagTemplateProps) {
  const config: ClientTagConfig = { ...DEFAULT_CLIENT_TAG_CONFIG, ...(configOverride || {}) };
  const isRtl = config.direction === "RTL";

  return (
    <section
      className={`print-document client-tag-sheet${config.showBorder ? "" : " no-border"}`}
      data-print-root
      style={{
        "--tag-width": `${config.widthMm}mm`,
        "--tag-height": `${config.heightMm}mm`,
        "--tag-columns": config.columns,
        "--tag-font": `${config.fontSizePx}px`,
      } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: TAG_CSS }} />
      {items.map((item, idx) => (
        <article
          className="client-tag-pair"
          key={`${item.assetId || item.barcode}-${idx}`}
          style={{ direction: isRtl ? "rtl" : "ltr" }}
        >
          <BarcodeTagFront item={item} config={config} companyName={companyName} companyLogo={companyLogo} currency={currency} locale={locale} />
          <BarcodeTagBack item={item} config={config} />
        </article>
      ))}
    </section>
  );
}
