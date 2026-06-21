"use client";

import { Printer, Barcode, Radio } from "lucide-react";
import { toast } from "sonner";
import { BarcodePrintTemplate } from "@/features/printing/components/BarcodePrintTemplate";
import { ScannableBarcode } from "@/features/printing/components/ScannableBarcode";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { DEFAULT_BARCODE_LABEL_CONFIG } from "@/lib/print/print-config";
import { printHtmlDocument } from "@/lib/print/print-service";
import { getPublicFileUrl } from "@/lib/api/files";
import type { BarcodeLabelConfig } from "@/lib/print/print-types";
import type { BarcodeLabelData } from "@/lib/print/barcode-label";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale, useTranslations } from "next-intl";

interface BarcodeLabelPreviewProps {
  /** Canonical label payload — shared with the print template (P7.1). */
  item: BarcodeLabelData;
  currency: string;
  config?: BarcodeLabelConfig;
}

export function BarcodeLabelPreview({
  item,
  currency,
  config = DEFAULT_BARCODE_LABEL_CONFIG,
}: BarcodeLabelPreviewProps) {
  const { assetId, name, barcode, rfid, grossWeight, karat, price } = item;
  const { company } = useAuth();
  const { isAuthorized } = usePermissions();
  const canPrintBarcode = isAuthorized("printBarcode");
  const companyName = company?.businessName || "DARFUS";
  const logoUrl = config.showLogo && company?.logo ? getPublicFileUrl(company.logo) : "";
  const locale = useLocale();
  const printT = useTranslations("PrintExport");
  const rtl = locale === "ar";

  const handlePrint = () => {
    // Permission gate — guard the handler, not just the button.
    if (!canPrintBarcode) {
      toast.error(rtl ? "ليس لديك صلاحية طباعة الباركود" : "You don't have barcode print permission");
      return;
    }
    const html = renderPrintDocument(
      <BarcodePrintTemplate
        items={[item]}
        config={config}
        companyAbbreviation={companyName}
        companyLogo={company?.logo}
        currency={currency}
        locale={locale}
      />,
      {
        documentType: "barcode",
        paperSize: "barcode-label",
        title: `${printT("printBarcode")} ${assetId}`,
        locale,
      },
    );
    const result = printHtmlDocument(html, {
      documentType: "barcode",
      paperSize: "barcode-label",
      title: `${printT("printBarcode")} ${assetId}`,
      locale,
    });

    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
        {rtl ? "معاينة بطاقة السعر والباركود المطبوعة" : "Sticker Tag Print Preview"}
      </h3>

      {/* Jewellery Tag Layout */}
      <div className="flex flex-col items-center justify-center p-8 bg-background rounded-3xl border border-border">
        <div className="w-[340px] border border-slate-300 bg-white rounded-lg shadow-sm p-4 relative font-mono text-[10px] text-slate-800 flex gap-4 items-stretch select-none">
          
          {/* Left part of the sticker tag — fields honour the same config gates as print */}
          <div className="flex-1 flex flex-col justify-between border-r border-dashed border-slate-200 pr-4">
            <div>
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-5 max-w-[120px] object-contain mb-1" />
              )}
              {config.showCompanyName && <p className="font-sans font-black text-[10px] text-slate-900">{companyName}</p>}
              {config.showName && <p className="font-sans font-bold text-xs text-slate-900 truncate max-w-[150px]">{name}</p>}
              {config.showAssetId && <p className="mt-1 text-slate-500 font-bold">{assetId}</p>}
            </div>

            <div className="mt-3 space-y-1">
              {(config.showKarat || config.showWeight) && (
                <p className="font-bold">
                  {config.showKarat && karat ? `${karat}K` : ""}{config.showKarat && config.showWeight && karat ? " · " : ""}{config.showWeight ? `${grossWeight.toFixed(2)}g` : ""}
                </p>
              )}
              {config.showPrice && (
                <p className="font-sans font-black text-brand-700 text-xs">
                  {formatCurrency(price, currency, locale)}
                </p>
              )}
              {config.customText && <p className="text-[8px] italic text-slate-500">{config.customText}</p>}
            </div>
          </div>

          {/* Right part of the sticker tag - Barcode & RFID */}
          <div className="w-[120px] flex flex-col items-center justify-between text-center pl-2">
            <div className="w-full flex items-center justify-between text-slate-400">
              <Barcode className="h-4 w-4 shrink-0 text-slate-600" />
              {rfid ? (
                <Radio className="h-3.5 w-3.5 text-emerald-600 shrink-0 animate-pulse" />
              ) : (
                <span className="text-[8px] text-slate-400">NO RFID</span>
              )}
            </div>

            {/* Real scannable barcode / QR — SAME renderer as print (P7.3). */}
            <div className="my-2 w-full flex flex-col items-center gap-1">
              {config.showQrCode ? (
                <div style={{ width: 56, height: 56 }}><ScannableBarcode type="qr" value={barcode} /></div>
              ) : (
                <div style={{ width: "100%", height: 28 }}><ScannableBarcode type="barcode" value={barcode} /></div>
              )}
              <p className="text-[8px] tracking-[0.2em] font-bold text-slate-900 truncate max-w-full">{barcode}</p>
            </div>

            <p className="text-[7px] text-slate-500 uppercase tracking-widest truncate max-w-full">{companyName}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          disabled={!canPrintBarcode}
          title={canPrintBarcode ? undefined : (rtl ? "تحتاج صلاحية طباعة الباركود" : "Barcode print permission required")}
          className="inline-flex items-center gap-1.5 px-4 h-9 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="h-4 w-4" />
          {rtl ? "طباعة الملصق الآن" : "Print Sticker Tag"}
        </button>
      </div>
    </div>
  );
}
