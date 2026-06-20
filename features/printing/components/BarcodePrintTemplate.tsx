import { formatCurrency } from "@/lib/utils";
import type { BarcodeLabelConfig } from "@/lib/print/print-types";
import type { BarcodeLabelData } from "@/lib/print/barcode-label";
import type { CSSProperties } from "react";

// The printed item is the canonical shared label payload (P7.1 unification).
export type BarcodePrintItem = BarcodeLabelData;

interface BarcodePrintTemplateProps {
  items: BarcodePrintItem[];
  config: BarcodeLabelConfig;
  companyAbbreviation: string;
  currency: string;
  locale: string;
}

export function BarcodePrintTemplate({ items, config, companyAbbreviation, currency, locale }: BarcodePrintTemplateProps) {
  const isRtl = config.direction === "RTL";
  return (
    <section
      className="print-document barcode-sheet"
      data-print-root
      style={{
        "--label-width": `${config.widthMm || 62}mm`,
        "--label-height": `${config.heightMm || 28}mm`,
        "--label-columns": config.columns || 2,
        "--label-row-gap": `${config.rowGapMm ?? 3}mm`,
        "--label-column-gap": `${config.columnGapMm ?? 3}mm`,
      } as CSSProperties}
    >
      {items.map((item, idx) => (
        <article
          className="barcode-label"
          key={`${item.assetId || item.barcode}-${idx}`}
          style={{
            direction: isRtl ? "rtl" : "ltr",
            fontSize: `${config.fontSizePx || 8}px`,
            border: config.showBorder ? "1px solid #111827" : "none",
            gridTemplateColumns: config.showQrCode ? "1fr 18mm" : "1fr 22mm"
          } as CSSProperties}
        >
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
            {config.showCompanyName && (
              <div style={{ fontWeight: 900, fontSize: "1.1em", borderBottom: "1px solid #eee", paddingBottom: "1px" }}>
                {companyAbbreviation}
              </div>
            )}
            {config.showName && (
              <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.name}
              </strong>
            )}
            {config.showAssetId && <div className="print-muted">{item.assetId || item.barcode}</div>}
            
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {config.showKarat && item.karat && <span>{item.karat}K</span>}
              {config.showWeight && item.grossWeight > 0 && (
                <span>{(Number(item.grossWeight) || 0).toFixed(2)}g</span>
              )}
            </div>

            {config.showType && item.stockType && (
              <div className="print-muted">{item.stockType}</div>
            )}
            
            {config.showBranch && item.branch && (
              <div className="print-muted">{item.branch}</div>
            )}

            {config.showSupplier && item.supplierName && (
              <div className="print-muted">{item.supplierName}</div>
            )}

            {config.showDate && item.createdAt && (
              <div className="print-muted" style={{ fontSize: "0.9em" }}>
                {new Date(item.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
              </div>
            )}

            {config.showPrice && (
              <strong style={{ fontSize: "1.2em", color: "#000" }}>
                {formatCurrency(item.price, currency, locale)}
              </strong>
            )}

            {config.customText && (
              <div style={{ fontSize: "0.9em", fontStyle: "italic", marginTop: "auto" }}>
                {config.customText}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1px" }}>
            {config.showQrCode ? (
              <div style={{ width: "16mm", height: "16mm", border: "1px solid #111827", display: "grid", placeItems: "center", fontSize: "7px" }}>
                QR
              </div>
            ) : (
              <>
                <BarcodeBars value={item.barcode} />
                <div className="barcode-text" style={{ fontSize: "0.9em" }}>{item.barcode}</div>
              </>
            )}
            {item.rfid && <div className="print-muted" style={{ fontSize: "0.8em" }}>RFID</div>}
          </div>
        </article>
      ))}
    </section>
  );
}

function BarcodeBars({ value }: { value: string }) {
  const seed = value.split("").map((char) => char.charCodeAt(0));
  return (
    <div className="barcode-visual" aria-label={value}>
      {Array.from({ length: 24 }).map((_, index) => {
        const code = seed[index % Math.max(seed.length, 1)] ?? index;
        const width = (code + index) % 3 === 0 ? 3 : (code + index) % 2 === 0 ? 2 : 1;
        return <span key={index} className="barcode-bar" style={{ width }} />;
      })}
    </div>
  );
}
