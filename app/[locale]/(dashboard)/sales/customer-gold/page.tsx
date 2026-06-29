"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, DollarSign, Plus, CheckCircle2, AlertCircle, Scale, Coins } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import type { Customer, Asset, Invoice, CustomerGoldDepositRequest } from "@/lib/types";

export default function CustomerGoldPage() {
  const t = useTranslations("Sales");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, activeBranch, user } = useAuth();
  const { customers, assets, addAsset, addInvoice } = useErp();

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";
  const apiMode = dataSource === "api";

  const [apiCustomers, setApiCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [karat, setKarat] = useState("21");
  const [weight, setWeight] = useState("");
  const [ratePerGram, setRatePerGram] = useState("255"); // mock initial buy rate
  const [payMethod, setPayMethod] = useState("cash");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  // Load customers if in API mode
  useEffect(() => {
    if (apiMode) {
      apiClient<{ items: Customer[] }>("/customers", { locale })
        .then((res) => {
          setApiCustomers(res.items || []);
        })
        .catch(() => {});
    }
  }, [apiMode, locale]);

  const activeCustomers = useMemo(() => {
    return apiMode ? apiCustomers : customers;
  }, [apiMode, apiCustomers, customers]);

  // Set default customer
  useEffect(() => {
    if (activeCustomers.length > 0 && !customerId) {
      setCustomerId(activeCustomers[0].id);
    }
  }, [activeCustomers, customerId]);

  const purityPercent = useMemo(() => {
    switch (karat) {
      case "18": return "75.0%";
      case "21": return "87.5%";
      case "22": return "91.6%";
      case "24": return "99.9%";
      default: return "0%";
    }
  }, [karat]);

  const calculatedValue = useMemo(() => {
    const w = Number(weight) || 0;
    const r = Number(ratePerGram) || 0;
    return w * r;
  }, [weight, ratePerGram]);

  const handlePostPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const weightNum = Number(weight) || 0;
    const targetCustomer = activeCustomers.find((c) => c.id === customerId);

    if (!targetCustomer || !description.trim() || weightNum <= 0 || calculatedValue <= 0) {
      setErrorMsg(rtl ? "يرجى التحقق من صحة المدخلات واستكمال البيانات." : "Please verify inputs and complete the form.");
      return;
    }

    try {
      if (apiMode) {
        // Intent only: server computes value = weight × ratePerGram and ignores
        // any client cost/price/total (see CustomerGoldDepositRequest).
        const depositRequest: CustomerGoldDepositRequest = {
          description,
          karat: Number(karat),
          weight: weightNum,
          ratePerGram: Number(ratePerGram),
          payout: true,
          payMethod,
        };
        await apiClient(`/customers/${customerId}/gold/deposit`, {
          method: "POST",
          body: JSON.stringify(depositRequest),
          locale,
        });

        setSuccessMsg(
          rtl
            ? `تم استلام الذهب المستعمل بنجاح وتسجيل عملية الصرف للعميل ${targetCustomer.name}!`
            : `Scrap gold purchase registered and payout processed successfully for customer ${targetCustomer.name}!`
        );
      } else {
        const timestamp = Date.now();
        const dateStr = new Date().toISOString().slice(0, 10);
        const timeStr = new Date().toISOString().slice(0, 16).replace("T", " ");

        // 1. Create a scrap gold asset in the ERP registry
        const scrapAsset: Asset = {
          id: `SCRAP-${timestamp.toString().slice(-6)}`,
          name: `${rtl ? "ذهب كسر من عميل - " : "Customer Scrap Gold - "} ${description}`,
          type: "gold-weight",
          category: rtl ? "ذهب مستعمل كسر" : "Customer Scrap Gold",
          karat: Number(karat),
          grossWeight: weightNum,
          netWeight: weightNum,
          cost: calculatedValue,
          price: calculatedValue, // Price snapshot equals scrap value
          branch: activeBranch,
          location: "Melt Room",
          status: "available",
          barcode: String(timestamp).slice(-13).padStart(13, "6"),
          source: `${rtl ? "شراء مستعمل من: " : "Purchased scrap from: "} ${targetCustomer.name}`,
          events: [
            {
              id: `EV-SCRAP-${timestamp}`,
              action: "SCRAP_PURCHASED",
              date: timeStr,
              user: user?.firstName || "System",
              branch: activeBranch,
              note: `${rtl ? "شراء ذهب مستعمل بمعدل سعر " : "Bought scrap gold at rate: "} ${ratePerGram} /g`,
            },
          ],
        };

        addAsset(scrapAsset);

        // 2. Generate a payout receipt / partial invoice
        const receiptInvoice: Invoice = {
          id: `PAY-${10000 + Math.floor(Math.random() * 9000)}`,
          customerId: targetCustomer.id,
          customerName: targetCustomer.name,
          date: timeStr,
          total: -calculatedValue, // negative representing payout cash outflow
          tax: 0, // Customer gold purchases from unregistered individuals typically have no VAT
          status: "paid",
          paymentMethod: payMethod.toUpperCase(),
          branch: activeBranch,
          items: [
            {
              assetId: scrapAsset.id,
              name: scrapAsset.name,
              quantity: 1,
              price: -calculatedValue,
            },
          ],
        };

        addInvoice(receiptInvoice);

        setSuccessMsg(
          rtl
            ? `تم استلام الذهب المستعمل بنجاح! رقم الأصل المصدر: ${scrapAsset.id} بقيمة ${money(calculatedValue)}`
            : `Scrap gold purchase registered! Asset ID: ${scrapAsset.id} for value of ${money(calculatedValue)}`
        );
      }

      // Reset
      setDescription("");
      setWeight("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register scrap gold purchase.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/sales" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{t("back") || "Back to sales"}
          </Link>
          <h1 className="text-2xl font-black text-foreground lg:text-3xl">
            {rtl ? "شراء الذهب المستعمل من العملاء" : "Customer Scrap Gold Purchase"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {rtl ? "شراء الذهب والكسر المستعمل من الأفراد وتسجيله كأصل مخزني غير مصنع" : "Buy scrap and second-hand gold directly from customers and log inventory inputs."}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-6">
          <form onSubmit={handlePostPurchase} className="space-y-5">
            <h3 className="text-sm font-black text-foreground border-b border-border pb-3">
              {rtl ? "تفاصيل الذهب المستعمل وعقد الشراء" : "Scrap Consignment Details"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-base">{rtl ? "اختر العميل" : "Select Customer"}</span>
                <NativeSelect value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  {activeCustomers.filter(c => c.status !== "inactive").map((c) => (
                    <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
                  ))}
                </NativeSelect>
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "وصف القطعة / الحلي" : "Item Description"}</span>
                <input type="text" required placeholder={rtl ? "سوار قديم، عقد مكسور..." : "Old bracelet, broken necklace..."} className="input-base" value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "العيار" : "Karat"}</span>
                <NativeSelect value={karat} onChange={(e) => setKarat(e.target.value)}>
                  <option value="18">18K</option>
                  <option value="21">21K</option>
                  <option value="22">22K</option>
                  <option value="24">24K</option>
                </NativeSelect>
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "نسبة النقاء التقريبية" : "Purity Percentage"}</span>
                <input type="text" disabled className="input-base bg-surface-muted text-muted font-bold" value={purityPercent} />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "الوزن القائم (جم)" : "Gross Weight (g)"}</span>
                <input type="number" step="0.01" required placeholder="0.00" className="input-base" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "سعر شراء الغرام اليومي للعيار" : "Buy Rate per Gram"}</span>
                <input type="number" required placeholder="255" className="input-base" value={ratePerGram} onChange={(e) => setRatePerGram(e.target.value)} />
              </label>

              <label className="block sm:col-span-2">
                <span className="label-base">{rtl ? "طريقة صرف النقد للعميل" : "Payout Method"}</span>
                <NativeSelect value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="cash">{rtl ? "نقداً من الصندوق" : "Cash from Till"}</option>
                  <option value="transfer">{rtl ? "تحويل مصرفي" : "Bank Transfer"}</option>
                </NativeSelect>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-500/5 mt-4">
              <div>
                <p className="text-xs text-muted">{rtl ? "قيمة المستحقات الإجمالية للعميل" : "Total Customer Payout"}</p>
                <p className="text-lg font-black text-brand-700 dark:text-brand-300">
                  {money(calculatedValue)}
                </p>
              </div>
              <Button type="submit">
                <Coins className="h-4.5 w-4.5" />
                {rtl ? "تسجيل المشتريات وصرف المبلغ" : "Register Purchase & Disburse"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Guidelines */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-brand-600" />
              {rtl ? "ضوابط شراء الذهب الكسر" : "Scrap Purchasing Regulation"}
            </h3>
            <div className="text-xs space-y-3 leading-5 text-muted">
              <p>
                {rtl
                  ? "● الهوية الوطنية: يجب التحقق من هوية بائع الذهب المستعمل وتسجيل بيانات بطاقة الهوية الإماراتية في ملف العميل."
                  : "● ID Check: Always verify customer national ID or Passport and log detailed credentials in the system profile."}
              </p>
              <p>
                {rtl
                  ? "● خلو من الضريبة: توريد الذهب المستعمل من أفراد غير مسجلين معفى من ضريبة القيمة المضافة للإمارات ولا يترتب عليه احتساب مخرجات."
                  : "● Tax Treatment: Gold bought from unregistered individuals is not subject to VAT and does not produce taxable outputs."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
