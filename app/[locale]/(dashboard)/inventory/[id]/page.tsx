"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Barcode, Box, Building2, Clock3, Gem, GitBranch, MapPin, Pencil, RadioTower, Scale, ShieldCheck, FileText, FileQuestion } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAssetQuery } from "@/features/assets/hooks/use-asset-query";
import { AssetTimeline } from "@/features/assets/components/AssetTimeline";
import { AssetLineageGraph } from "@/features/assets/components/AssetLineageGraph";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { BarcodeLabelPreview } from "@/features/barcodes/components/BarcodeLabelPreview";
import { AssetCostPanel } from "@/features/assets/components/AssetCostPanel";
import { AssetEditModal } from "@/features/assets/components/AssetEditModal";
import { AttachmentsPanel } from "@/features/assets/components/AttachmentsPanel";
import { CertificatePanel } from "@/features/assets/components/CertificatePanel";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { usePermissions } from "@/hooks/use-permissions";
import type { Asset } from "@/lib/types";

export default function AssetDetailsPage() {
  const t = useTranslations("AssetDetails");
  const inventoryT = useTranslations("Inventory");
  const locale = useLocale();
  const rtl = locale === "ar";
  const params = useParams<{ id: string }>();
  const { company } = useAuth();
  const { updateAsset: updateContextAsset } = useErp();
  const { isAuthorized } = usePermissions();
  
  const assetId = decodeURIComponent(params.id);
  const { asset, timeline, isLoading, error, triggerAction, isPendingAction, uploadAttachment, deleteAttachment } = useAssetQuery(assetId);
  const [transferBranch, setTransferBranch] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showPrintTag, setShowPrintTag] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMeltConfirm, setShowMeltConfirm] = useState(false);

  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <Card className="p-10 text-center">
        <h1 className="text-xl font-black">{t("notFound")}</h1>
        <Link href="/inventory" className="mt-4 inline-block font-bold text-brand-700">
          {t("back")}
        </Link>
      </Card>
    );
  }

  const statusTone = asset.status === "available" ? "green" : asset.status === "reserved" ? "amber" : asset.status === "sold" ? "slate" : "blue";
  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);

  const handleAction = async (action: "reserve" | "release" | "repair" | "melt") => {
    await triggerAction(action, { note: `User manual action: ${action.toUpperCase()}` });
  };

  const handleTransfer = async () => {
    if (!transferBranch.trim()) return;
    await triggerAction("transfer", { branch: transferBranch, note: `Transferred to ${transferBranch}` });
    setShowTransfer(false);
  };

  const handleSaveEdit = (updates: Partial<Asset>) => {
    updateContextAsset(asset.id, updates);
  };

  const handleAddAttachment = async (file: File) => {
    try {
      await uploadAttachment(file);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRemoveAttachment = async (id: string) => {
    try {
      await deleteAttachment(id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddCertificate = (certNumber: string, type: string, issuer: string, date: string) => {
    const newCert = {
      id: `CRT-${Date.now()}`,
      certificateNumber: certNumber,
      type,
      issuer,
      issueDate: date,
    };
    const updated = [...(asset.certificates || []), newCert];
    updateContextAsset(asset.id, { certificates: updated });
  };

  const handleRemoveCertificate = (id: string) => {
    const updated = (asset.certificates || []).filter((c) => c.id !== id);
    updateContextAsset(asset.id, { certificates: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/inventory" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{t("back")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">{asset.name}</h1>
            <Badge tone={statusTone}>{inventoryT(asset.status)}</Badge>
          </div>
          <p className="mt-2 font-mono text-xs text-slate-400">{asset.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowPrintTag(true)}>
            <Barcode className="h-4 w-4" />{t("print")}
          </Button>
          {isAuthorized("manageSettings") && (
            <Button onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" />{t("edit")}
            </Button>
          )}
        </div>
      </div>

      {/* Lifecycle Actions Tool Deck */}
      <Card className="p-4 flex flex-wrap gap-2 items-center bg-slate-50/50 dark:bg-navy-950/20 border-dashed border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 mr-2">{t("actionsTitle")}</span>
        {asset.status === "available" && (
          <>
            <Button size="sm" onClick={() => handleAction("reserve")} disabled={isPendingAction}>
              {t("reserve")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleAction("repair")} disabled={isPendingAction}>
              {t("repair")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowTransfer(true)} disabled={isPendingAction}>
              {t("transfer")}
            </Button>
            <Button size="sm" variant="secondary" className="text-rose-600 hover:bg-rose-50" onClick={() => setShowMeltConfirm(true)} disabled={isPendingAction}>
              {t("melt")}
            </Button>
          </>
        )}
        {asset.status === "reserved" && (
          <Button size="sm" onClick={() => handleAction("release")} disabled={isPendingAction}>
            {t("release")}
          </Button>
        )}
        {asset.status === "repair" && (
          <Button size="sm" onClick={() => handleAction("release")} disabled={isPendingAction}>
            {t("returnFromRepair")}
          </Button>
        )}
      </Card>

      {showTransfer && (
        <Card className="p-4 space-y-4 max-w-md">
          <h4 className="text-xs font-black">{t("selectBranch")}</h4>
          <input
            className="input-base"
            value={transferBranch}
            onChange={(e) => setTransferBranch(e.target.value)}
            placeholder={t("branchPlaceholder")}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleTransfer}>{t("confirmTransfer")}</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowTransfer(false)}>{t("cancel")}</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <Card className="p-5 lg:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-black text-navy-950 dark:text-white">{t("data")}</h2>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {timeline.at(-1)?.date ? timeline.at(-1)?.date : ""}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                [Gem, t("type"), inventoryT(asset.type)],
                [Scale, t("grossWeight"), `${asset.grossWeight} g`],
                [ShieldCheck, t("karat"), asset.karat ? `${asset.karat}K` : "—"],
                [Building2, t("branch"), asset.branch],
                [MapPin, t("location"), asset.location],
                [Box, t("salePrice"), money(asset.price)],
                [Barcode, "Barcode", asset.barcode],
                [RadioTower, "RFID", asset.rfid ?? t("notAdded")],
                [Clock3, t("created"), timeline[0]?.date ?? "—"],
                [Gem, t("stonesCount"), asset.stones || 0],
                [Gem, t("pearlsCount"), asset.pearls || 0],
                [FileText, t("sourceDoc"), asset.source || "—"],
              ].map(([IconValue, label, value], index) => {
                const Icon = IconValue as typeof Gem;
                return (
                  <div key={index} className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                    <Icon className="mb-3 h-5 w-5 text-brand-600" />
                    <p className="text-[10px] text-slate-400">{label as string}</p>
                    <p className="mt-1 break-all text-xs font-black text-navy-800 dark:text-slate-100">
                      {value as string}
                    </p>
                  </div>
                );
              })}
            </div>

            {asset.notes && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 text-xs">
                <h4 className="font-black text-amber-900 dark:text-amber-300 mb-1">{t("notes")}</h4>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{asset.notes}</p>
              </div>
            )}
          </Card>

          <PermissionGate permission="viewCosts">
            <AssetCostPanel
              cost={asset.cost}
              price={asset.price}
              currency={currency}
              locale={locale}
            />
          </PermissionGate>

          <Card className="p-5 lg:p-6">
            <h2 className="mb-5 flex items-center gap-2 font-black text-navy-950 dark:text-white">
              <GitBranch className="h-5 w-5 text-brand-600" />{t("lineage")}
            </h2>
            <AssetLineageGraph
              assetId={asset.id}
              assetName={asset.name}
              parentAssetId={asset.parentAssetId}
              childAssetIds={asset.childAssetIds}
              contributionWeight={asset.contributionWeight}
              processLoss={asset.processLoss}
              source={asset.source}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 lg:p-6">
            <div className="mb-6">
              <h2 className="font-black text-navy-950 dark:text-white">{t("timeline")}</h2>
              <p className="mt-1 text-xs text-slate-400">{t("timelineHint")}</p>
            </div>
            <AssetTimeline events={timeline} />
          </Card>

          <CertificatePanel
            certificates={asset.certificates}
            onAddCertificate={handleAddCertificate}
            onRemoveCertificate={handleRemoveCertificate}
          />

          <AttachmentsPanel
            attachments={asset.attachments}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            isUploading={isPendingAction}
          />
        </div>
      </div>

      <Modal open={showPrintTag} onClose={() => setShowPrintTag(false)} title={rtl ? "طباعة ملصق الباركود" : "Print Barcode Sticker"} description={rtl ? "معاينة طباعة ملصق أصل المجوهرات والأسعار" : "Sticker tag label preview for printing physical price tags."}>
        <BarcodeLabelPreview
          assetId={asset.id}
          name={asset.name}
          barcode={asset.barcode}
          rfid={asset.rfid}
          grossWeight={asset.grossWeight}
          karat={asset.karat}
          price={asset.price}
          currency={currency}
          branch={asset.branch}
        />
      </Modal>

      {showEdit && (
        <AssetEditModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          asset={asset}
          onSave={handleSaveEdit}
        />
      )}

      {showMeltConfirm && (
        <Modal open={showMeltConfirm} onClose={() => setShowMeltConfirm(false)} title={t("confirmMelt")}>
          <div className="space-y-5 text-xs text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600">
              <FileQuestion className="h-6 w-6" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
              {t("confirmMeltText")}
            </p>
            <div className="flex justify-center gap-2 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowMeltConfirm(false)}>
                {t("cancel")}
              </Button>
              <Button variant="danger" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => {
                handleAction("melt");
                setShowMeltConfirm(false);
              }}>
                {t("melt")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
