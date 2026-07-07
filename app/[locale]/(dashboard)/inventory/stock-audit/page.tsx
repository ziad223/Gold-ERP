"use client";

import { useState, useMemo, useEffect } from "react";
import { isApiDataSource } from "@/lib/data-source";
import { useLocale } from "next-intl";
import { Radio, ScanLine, AlertTriangle, CheckCircle, Search, RefreshCw, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/contexts/erp-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api/client";
import type { Asset, AuditLog } from "@/lib/types";

export default function StockAuditPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { assets, updateAsset, addAuditLog } = useErp();
  const { activeBranch, user } = useAuth();

  const apiMode = isApiDataSource();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedAssetIds, setScannedAssetIds] = useState<string[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [activeTab, setActiveTab] = useState<"expected" | "scanned" | "missing" | "unexpected">("expected");
  const [auditData, setAuditData] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Expected assets in the current branch
  const expectedAssets = useMemo(() => {
    return assets.filter(
      (asset) => asset.branch === activeBranch && asset.status !== "sold" && asset.status !== "archived"
    );
  }, [assets, activeBranch]);

  // Unexpected assets: registered at other branches but scanned here
  const unexpectedAssets = useMemo(() => {
    return assets.filter(
      (asset) => asset.branch !== activeBranch && scannedAssetIds.includes(asset.id)
    );
  }, [assets, activeBranch, scannedAssetIds]);

  // Missing assets: expected but not scanned
  const missingAssets = useMemo(() => {
    return expectedAssets.filter((asset) => !scannedAssetIds.includes(asset.id));
  }, [expectedAssets, scannedAssetIds]);

  // Scanned assets in current branch
  const scannedAssets = useMemo(() => {
    return expectedAssets.filter((asset) => scannedAssetIds.includes(asset.id));
  }, [expectedAssets, scannedAssetIds]);

  const expectedAssetsList = useMemo(() => {
    if (apiMode) {
      if (!auditData) return [];
      return (auditData.items || [])
        .filter((item: any) => item.status === "matched" || item.status === "missing")
        .map((item: any) => item.asset)
        .filter(Boolean);
    }
    return expectedAssets;
  }, [apiMode, auditData, expectedAssets]);

  const scannedAssetsList = useMemo(() => {
    if (apiMode) {
      if (!auditData) return [];
      return (auditData.items || [])
        .filter((item: any) => item.status === "matched")
        .map((item: any) => item.asset)
        .filter(Boolean);
    }
    return scannedAssets;
  }, [apiMode, auditData, scannedAssets]);

  const missingAssetsList = useMemo(() => {
    if (apiMode) {
      if (!auditData) return [];
      return (auditData.items || [])
        .filter((item: any) => item.status === "missing")
        .map((item: any) => item.asset)
        .filter(Boolean);
    }
    return missingAssets;
  }, [apiMode, auditData, missingAssets]);

  const unexpectedAssetsList = useMemo(() => {
    if (apiMode) {
      if (!auditData) return [];
      return (auditData.items || [])
        .filter((item: any) => item.status === "unexpected")
        .map((item: any) => item.asset)
        .filter(Boolean);
    }
    return unexpectedAssets;
  }, [apiMode, auditData, unexpectedAssets]);

  const startScan = async () => {
    setIsScanning(true);
    setScannedAssetIds([]);
    setHasScanned(false);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (apiMode) {
        // 1. Create a stock audit session
        const sessionRes = await apiClient<any>("/stock-audits", {
          method: "POST",
          body: JSON.stringify({}),
          locale,
        });
        const auditSession = sessionRes.data || sessionRes;

        // 2. Fetch all raw assets to pick what to scan
        const assetsRes = await apiClient<any>("/assets", { locale });
        const allAssets = Array.isArray(assetsRes)
          ? assetsRes
          : Array.isArray(assetsRes?.items)
          ? assetsRes.items
          : Array.isArray(assetsRes?.data?.items)
          ? assetsRes.data.items
          : Array.isArray(assetsRes?.data)
          ? assetsRes.data
          : [];

        const expected = allAssets.filter(
          (a: any) => a.status !== "sold" && a.status !== "archived"
        );

        setTimeout(async () => {
          try {
            // Pick 85% of expected
            const expectedIdsToScan = expected
              .slice(0, Math.ceil(expected.length * 0.85))
              .map((a: any) => a.id);

            // Fetch one asset from another branch
            const skipBranchRes = await apiClient<any>("/assets", { skipBranch: true, locale });
            const allUnscopedAssets = Array.isArray(skipBranchRes)
              ? skipBranchRes
              : Array.isArray(skipBranchRes?.items)
              ? skipBranchRes.items
              : Array.isArray(skipBranchRes?.data?.items)
              ? skipBranchRes.data.items
              : Array.isArray(skipBranchRes?.data)
              ? skipBranchRes.data
              : [];

            const activeBranchId = localStorage.getItem("darfus-active-branch-id-v1") || "";
            const otherBranchAsset = allUnscopedAssets.find(
              (a: any) => a.branchId !== activeBranchId && a.status === "available"
            );

            const finalScanned = otherBranchAsset ? [...expectedIdsToScan, otherBranchAsset.id] : expectedIdsToScan;

            // 3. Post scanned items to backend
            const itemsRes = await apiClient<any>(`/stock-audits/${auditSession.id}/items`, {
              method: "POST",
              body: JSON.stringify({ scannedAssetIds: finalScanned }),
              locale,
            });

            setAuditData(itemsRes.data || itemsRes);
            setIsScanning(false);
            setHasScanned(true);
          } catch (err: any) {
            setErrorMsg(err.message || "Failed to scan RFID items.");
            setIsScanning(false);
          }
        }, 2500);
      } else {
        setTimeout(() => {
          const expectedIdsToScan = expectedAssets
            .slice(0, Math.ceil(expectedAssets.length * 0.85))
            .map((a) => a.id);

          const otherBranchAsset = assets.find((a) => a.branch !== activeBranch && a.status === "available");
          const finalScanned = otherBranchAsset ? [...expectedIdsToScan, otherBranchAsset.id] : expectedIdsToScan;

          setScannedAssetIds(finalScanned);
          setIsScanning(false);
          setHasScanned(true);
        }, 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start RFID stock audit.");
      setIsScanning(false);
    }
  };

  const resolveMissing = async () => {
    try {
      if (apiMode) {
        if (!auditData) return;
        await apiClient(`/stock-audits/${auditData.id}/complete`, {
          method: "POST",
          body: JSON.stringify({}),
          locale,
        });
        setSuccessMsg(
          rtl
            ? "تم تسوية القطع المفقودة واعتبارها ضائعة بنجاح"
            : "Missing assets resolved and marked lost successfully"
        );
        setAuditData(null);
        setHasScanned(false);
      } else {
        if (missingAssets.length === 0) return;

        missingAssets.forEach((asset) => {
          updateAsset(asset.id, { status: "archived" });

          const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
          const auditEntry: AuditLog = {
            id: `AUD-RFID-LOST-${Date.now()}`,
            action: "adjustment",
            description: `${rtl ? "تحديث حالة الأصل المفقود في جرد RFID" : "Marked asset lost in RFID stock count"} ${asset.id}`,
            user: user?.firstName || "System",
            userId: user?.id,
            place: activeBranch,
            branch: activeBranch,
            date: timestamp,
            before: `status:${asset.status}`,
            after: "status:archived",
            device: "RFID Scanner simulation",
            severity: "critical",
          };
          addAuditLog(auditEntry);
        });

        setScannedAssetIds([]);
        setHasScanned(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve missing assets.");
    }
  };

  const resolveUnexpected = async () => {
    try {
      if (apiMode) {
        if (!auditData) return;
        await apiClient(`/stock-audits/${auditData.id}/complete`, {
          method: "POST",
          body: JSON.stringify({}),
          locale,
        });
        setSuccessMsg(
          rtl
            ? "تم تسوية القطع غير المتوقعة وتحديث فرعها الحالي بنجاح"
            : "Unexpected assets resolved and branch locations updated successfully"
        );
        setAuditData(null);
        setHasScanned(false);
      } else {
        if (unexpectedAssets.length === 0) return;

        unexpectedAssets.forEach((asset) => {
          updateAsset(asset.id, { branch: activeBranch });

          const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
          const auditEntry: AuditLog = {
            id: `AUD-RFID-LOC-${Date.now()}`,
            action: "adjustment",
            description: `${rtl ? "تحديث فرع الأصل بعد جرد RFID" : "Updated asset branch after RFID scan location match"} ${asset.id}`,
            user: user?.firstName || "System",
            userId: user?.id,
            place: activeBranch,
            branch: activeBranch,
            date: timestamp,
            before: `branch:${asset.branch}`,
            after: `branch:${activeBranch}`,
            device: "RFID Scanner simulation",
            severity: "warning",
          };
          addAuditLog(auditEntry);
        });

        setScannedAssetIds([]);
        setHasScanned(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve unexpected assets.");
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">
            {rtl ? "جرد المخزون ومطابقة RFID" : "RFID Stock Audit & Matching"}
          </h1>
          <p className="mt-1.5 text-slate-400 font-bold">
            {rtl
              ? "محاكاة جرد المعرض باستخدام موجات RFID لتحديد المفقودات والمطابقات الفورية للفروقات."
              : "Simulate warehouse stock count using RFID tags to find missing items and resolve variances."}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.4fr_1fr]">
        {/* Scanner Panel */}
        <Card className="p-5 flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative">
            <div className={`w-28 h-28 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center border border-brand-100 dark:border-brand-500/20 ${isScanning ? "animate-pulse" : ""}`}>
              <Radio className={`h-12 w-12 text-brand-600 ${isScanning ? "animate-spin" : ""}`} />
            </div>
            {isScanning && (
              <span className="absolute inset-0 rounded-full border border-brand-500 animate-ping" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-black text-navy-900 dark:text-white text-sm">
              {isScanning ? (rtl ? "جاري المسح بالـ RFID..." : "Scanning RFID Tags...") : (rtl ? "جاهز لبدء المسح" : "Scanner Ready")}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              {rtl ? `الفرع الحالي: ${activeBranch}` : `Branch: ${activeBranch}`}
            </p>
          </div>

          <Button onClick={startScan} disabled={isScanning} className="w-full">
            <ScanLine className="h-4 w-4" />
            {rtl ? "بدء عملية جرد RFID" : "Start RFID Audit Scan"}
          </Button>

          {hasScanned && (
            <div className="w-full bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-border space-y-2 text-start font-semibold">
              <p className="text-[10px] text-slate-400 font-bold border-b border-border pb-1 mb-1">{rtl ? "تقرير الجرد الأولي" : "Audit Summary"}</p>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{rtl ? "مطابق" : "Matched"}</span>
                <span className="text-emerald-600 font-bold">{scannedAssetsList.length} / {expectedAssetsList.length}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{rtl ? "مفقود" : "Missing"}</span>
                <span className="text-rose-600 font-bold">{missingAssetsList.length}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{rtl ? "غير متوقع" : "Unexpected"}</span>
                <span className="text-amber-600 font-bold">{unexpectedAssetsList.length}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Audit Lists */}
        <Card className="p-5">
          <div className="flex border-b border-border pb-3 mb-4 gap-4 overflow-x-auto">
            {(["expected", "scanned", "missing", "unexpected"] as const).map((tab) => {
              const getTabCount = () => {
                if (tab === "expected") return expectedAssetsList.length;
                if (tab === "scanned") return scannedAssetsList.length;
                if (tab === "missing") return missingAssetsList.length;
                if (tab === "unexpected") return unexpectedAssetsList.length;
                return 0;
              };

              const getTabLabel = () => {
                if (tab === "expected") return rtl ? "المتوقع بالمخزون" : "Expected";
                if (tab === "scanned") return rtl ? "الممسوح ضوئياً" : "Scanned/Found";
                if (tab === "missing") return rtl ? "مفقودات الفحص" : "Missing";
                if (tab === "unexpected") return rtl ? "موقع غير متطابق" : "Unexpected";
                return "";
              };

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-1 font-bold text-xs border-b-2 px-1 transition whitespace-nowrap ${
                    activeTab === tab
                      ? "border-brand-600 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {getTabLabel()} ({getTabCount()})
                </button>
              );
            })}
          </div>

          {/* Action buttons based on active tab */}
          {hasScanned && activeTab === "missing" && missingAssetsList.length > 0 && (
            <div className="mb-4 bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-4">
              <p className="text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                {rtl
                  ? "عثر نظام الجرد على أصول مفقودة لم يتم رصدها في الفحص الحالي."
                  : "Audit detected expected assets that were missing from the scan."}
              </p>
              <Button size="sm" variant="secondary" className="text-rose-600 hover:bg-rose-50" onClick={resolveMissing}>
                <XCircle className="h-3.5 w-3.5" />
                {rtl ? "اعتبر المفقودات ضائعة" : "Mark Missing as Lost"}
              </Button>
            </div>
          )}

          {hasScanned && activeTab === "unexpected" && unexpectedAssetsList.length > 0 && (
            <div className="mb-4 bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/30 flex items-center justify-between gap-4">
              <p className="text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                {rtl
                  ? "تم رصد قطع مسجلة بفروع أخرى موجودة حالياً في هذا الفرع."
                  : "Scanned items registered in other branches but found at this location."}
              </p>
              <Button size="sm" variant="secondary" className="text-amber-600 hover:bg-amber-50" onClick={resolveUnexpected}>
                <RefreshCw className="h-3.5 w-3.5" />
                {rtl ? "تحديث موقع القطع للفرع الحالي" : "Update Branch Locations"}
              </Button>
            </div>
          )}

          {/* Table display of selected list */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-[11px]" aria-label="Stock Audit Details">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-bold">
                <tr>
                  <th className="px-4 py-2.5 text-start">ID</th>
                  <th className="px-4 py-2.5 text-start">{rtl ? "الأصل" : "Asset"}</th>
                  <th className="px-4 py-2.5 text-start">{rtl ? "النوع" : "Type"}</th>
                  <th className="px-4 py-2.5 text-start">{rtl ? "الموقع بالفرع" : "Location"}</th>
                  <th className="px-4 py-2.5 text-start">{rtl ? "الفرع المسجل" : "Registered Branch"}</th>
                  <th className="px-4 py-2.5 text-start">{rtl ? "الباركود" : "Barcode"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(() => {
                  let list: Asset[] = [];
                  if (activeTab === "expected") list = expectedAssetsList;
                  if (activeTab === "scanned") list = scannedAssetsList;
                  if (activeTab === "missing") list = missingAssetsList;
                  if (activeTab === "unexpected") list = unexpectedAssetsList;

                  if (list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          {rtl ? "لا توجد قطع لعرضها في هذه الفئة." : "No assets to display in this category."}
                        </td>
                      </tr>
                    );
                  }

                  return list.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{item.id}</td>
                      <td className="px-4 py-3 font-semibold">{item.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-bold">{item.type}</td>
                      <td className="px-4 py-3 font-medium">{item.location}</td>
                      <td className="px-4 py-3 text-slate-400 font-semibold">{item.branch}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">{item.barcode}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

