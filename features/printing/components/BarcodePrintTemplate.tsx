import { formatCurrency } from "@/lib/utils";
import { getPublicFileUrl } from "@/lib/api/files";
import { ScannableBarcode } from "@/features/printing/components/ScannableBarcode";
import { sanitizeBarcodeConfig } from "@/lib/print/barcode-label";
import type { BarcodeLabelConfig } from "@/lib/print/print-types";
import type { BarcodeLabelData } from "@/lib/print/barcode-label";
import type { CSSProperties } from "react";

// The printed item is the canonical shared label payload (P7.1 unification).
export type BarcodePrintItem = BarcodeLabelData;

interface BarcodePrintTemplateProps {
  items: BarcodePrintItem[];
  config: BarcodeLabelConfig;
  companyAbbreviation: string;
  /** Company logo path/URL — rendered as an <img> when config.showLogo is on. */
  companyLogo?: string;
  currency: string;
  locale: string;
}

export function BarcodePrintTemplate({ items, config: rawConfig, companyAbbreviation, companyLogo, currency, locale }: BarcodePrintTemplateProps) {
  // Clamp sizes so a bad/empty setting can never break printing.
  const config = sanitizeBarcodeConfig(rawConfig);
  const isRtl = config.direction === "RTL";
  const logoUrl = config.showLogo && companyLogo ? getPublicFileUrl(companyLogo) : "";
  return (
    <section
      className="print-document barcode-sheet"
      data-print-root
      style={{
        "--label-width": `${config.widthMm}mm`,
        "--label-height": `${config.heightMm}mm`,
        "--label-columns": config.columns,
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
            fontSize: `${config.fontSizePx}px`,
            border: config.showBorder ? "1px solid #111827" : "none",
            gridTemplateColumns: config.showQrCode ? "1fr 18mm" : "1fr 22mm"
          } as CSSProperties}
        >
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ maxHeight: "6mm", maxWidth: "100%", objectFit: "contain", alignSelf: isRtl ? "flex-end" : "flex-start" }} />
            )}
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
              <div style={{ width: "16mm", height: "16mm" }}>
                <ScannableBarcode type="qr" value={item.barcode} />
              </div>
            ) : (
              <>
                <div style={{ width: "100%", height: "9mm" }}>
                  <ScannableBarcode type="barcode" value={item.barcode} />
                </div>
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
