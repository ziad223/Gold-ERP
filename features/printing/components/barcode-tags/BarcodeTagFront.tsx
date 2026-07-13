/**
 * Phase 32.3-Fix — client tag FRONT face. Reuses the existing ScannableBarcode
 * (CODE128 default, QR optional). The printed barcode value is the STORED
 * asset.barcode; the human-readable value is always LTR monospace.
 */

import { formatCurrency } from "@/lib/utils";
import { getPublicFileUrl } from "@/lib/api/files";
import { ScannableBarcode } from "@/features/printing/components/ScannableBarcode";
import type { AssetTagData } from "@/lib/print/barcode-label";
import type { ClientTagConfig } from "./types";
import { isWatch, shouldShowPrice } from "./types";

interface BarcodeTagFrontProps {
  item: AssetTagData;
  config: ClientTagConfig;
  companyName?: string;
  companyLogo?: string;
  currency: string;
  locale: string;
}

export function BarcodeTagFront({ item, config, companyName, companyLogo, currency, locale }: BarcodeTagFrontProps) {
  const showPrice = shouldShowPrice(item.type, config);
  const provisional = isWatch(item) && config.showProvisionalWatchMarker;
  const logoUrl = config.showLogo && companyLogo ? getPublicFileUrl(companyLogo) : "";

  return (
    <div className="barcode-tag-face barcode-tag-front" data-tag-face="front">
      <div className="barcode-tag-head">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" style={{ maxHeight: "5mm", maxWidth: "100%", objectFit: "contain" }} />
        )}
        {config.showCompanyName && companyName && <div className="barcode-tag-company">{companyName}</div>}
        {provisional && <div className="barcode-tag-provisional">PROVISIONAL</div>}
      </div>

      <div className="barcode-tag-symbol" style={{ direction: "ltr" }}>
        {config.showQrCode ? (
          <div style={{ width: "14mm", height: "14mm", margin: "0 auto" }}>
            <ScannableBarcode type="qr" value={item.barcode} />
          </div>
        ) : (
          <div style={{ width: "100%", height: "8mm" }}>
            <ScannableBarcode type="barcode" value={item.barcode} />
          </div>
        )}
        <div className="barcode-text" style={{ direction: "ltr" }}>{item.barcode}</div>
      </div>

      {showPrice && (
        <div className="barcode-tag-price">{formatCurrency(item.price, currency, locale)}</div>
      )}

      {config.rfidMode !== "hidden" && item.rfid && (
        <div className="barcode-tag-rfid" style={{ direction: "ltr" }}>
          {config.rfidMode === "value" ? `RFID: ${item.rfid}` : "RFID"}
        </div>
      )}
    </div>
  );
}
