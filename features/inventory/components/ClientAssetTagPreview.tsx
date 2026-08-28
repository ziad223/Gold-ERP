"use client";

import { Printer } from "lucide-react";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { ClientBarcodeTagTemplate } from "@/features/printing/components/ClientBarcodeTagTemplate";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { printHtmlDocument } from "@/lib/print/print-service";
import { assetToTagData } from "@/lib/print/barcode-label";
import { DEFAULT_CLIENT_TAG_CONFIG, resolveClientTagProfile } from "@/features/printing/components/barcode-tags/types";
import ux11 from "@/features/printing/components/PrintPreviewUx11.module.css";

type ClientAssetTagPreviewProps = {
  asset: any;
};

export function ClientAssetTagPreview({ asset }: ClientAssetTagPreviewProps) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { isAuthorized } = usePermissions();
  const tagProfile = resolveClientTagProfile(asset?.inventoryProfile);
  const canPrint = isAuthorized("printBarcode");

  if (!asset || !tagProfile) return null;

  const tag = assetToTagData({
    ...asset,
    type: tagProfile,
    inventorySubtype: asset.inventorySubtype || asset.inventoryProfile,
    source: asset.supplierName,
  });
  const config = { ...DEFAULT_CLIENT_TAG_CONFIG, direction: rtl ? ("RTL" as const) : ("LTR" as const) };
  const companyName = company?.businessName || "DARFUS";

  const handlePrint = () => {
    if (!canPrint) return;
    const html = renderPrintDocument(
      <ClientBarcodeTagTemplate
        items={[tag]}
        config={config}
        companyName={companyName}
        companyLogo={company?.logo}
        currency={company?.currency || "AED"}
        locale={locale}
      />,
      { documentType: "barcode", paperSize: "barcode-label", title: `${rtl ? "طباعة تاج" : "Print tag"} ${tag.assetId}`, locale },
    );
    void printHtmlDocument(html, { documentType: "barcode", paperSize: "barcode-label", title: `${rtl ? "طباعة تاج" : "Print tag"} ${tag.assetId}`, locale });
  };

  return (
    <section className={`${ux11.previewSurface} rounded-2xl border border-border p-5`} data-c4-tag-preview={tagProfile}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black text-navy-950 dark:text-white">{rtl ? "معاينة تاج القطعة" : "Asset Tag Preview"}</h2>
        <Button variant="secondary" onClick={handlePrint} disabled={!canPrint} title={!canPrint ? (rtl ? "تحتاج صلاحية طباعة الباركود" : "Barcode print permission required") : undefined}>
          <Printer className="h-4 w-4" />{rtl ? "طباعة التاج" : "Print tag"}
        </Button>
      </div>
      <div className={`${ux11.previewViewport} overflow-x-auto rounded-xl bg-slate-50 p-4 dark:bg-navy-950`}>
        <ClientBarcodeTagTemplate
          items={[tag]}
          config={config}
          companyName={companyName}
          companyLogo={company?.logo}
          currency={company?.currency || "AED"}
          locale={locale}
        />
      </div>
      <p className="mt-3 text-[10px] text-slate-500">{rtl ? "المعاينة والطبـاعة للعرض فقط؛ الهوية الحالية للأصل والباركود لا تتغير." : "Preview and print are read-only; the Asset and active Barcode identity are unchanged."}</p>
    </section>
  );
}
