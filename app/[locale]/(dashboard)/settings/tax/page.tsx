"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Save } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { apiClient } from "@/lib/api/client";

type TaxPolicy = {
  jurisdiction?: string;
  configured?: boolean;
  vatRegistered: boolean | null;
  trn: string | null;
  vatEnabled: boolean | null;
  vatRate: number | string | null;
  enabledTaxTreatments: string[] | null;
  defaultTaxTreatment: string | null;
  preciousGoodsRcmEnabled: boolean | null;
  supportedTaxTreatments: string[];
  legalStandardVatRate?: number;
};

type SettingsResponse = {
  success: boolean;
  data: { taxPolicy: TaxPolicy };
};

type TaxDraft = {
  vatRegistered: boolean | null;
  vatRate: number | string | null;
  enabledTaxTreatments: string[];
  defaultTaxTreatment: string | null;
  preciousGoodsRcmEnabled: boolean | null;
};

const treatmentLabels: Record<string, { ar: string; en: string }> = {
  STANDARD_VAT: { ar: "ضريبة قياسية", en: "Standard VAT" },
  ZERO_RATED: { ar: "ضريبة صفرية", en: "Zero Rated" },
  REVERSE_CHARGE: { ar: "الاحتساب العكسي", en: "Reverse Charge" },
  EXEMPT: { ar: "معفى", en: "Exempt" },
  OUT_OF_SCOPE: { ar: "خارج نطاق الضريبة", en: "Out of Scope" },
};

function emptyDraft(policy: TaxPolicy): TaxDraft {
  return {
    vatRegistered: policy.vatRegistered,
    vatRate: policy.vatRate,
    enabledTaxTreatments: Array.isArray(policy.enabledTaxTreatments) ? [...policy.enabledTaxTreatments] : [],
    defaultTaxTreatment: policy.defaultTaxTreatment,
    preciousGoodsRcmEnabled: policy.preciousGoodsRcmEnabled,
  };
}

export default function TaxVatSettingsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { hasPermission, role, accountType } = usePermissions();
  const canView = hasPermission("settings.view");
  const canUpdate = hasPermission("settings.update") || accountType === "super_admin" || ["admin", "owner", "accountant"].includes(role || "");
  const [policy, setPolicy] = useState<TaxPolicy | null>(null);
  const [draft, setDraft] = useState<TaxDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient<SettingsResponse>("/settings", { locale, skipBranch: true });
      setPolicy(response.data.taxPolicy);
      setDraft(emptyDraft(response.data.taxPolicy));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (rtl ? "تعذر تحميل إعدادات الضرائب." : "Unable to load tax settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView) void load(); }, [canView]);

  const defaultIsEnabled = useMemo(() => {
    if (!draft?.defaultTaxTreatment) return true;
    return draft.enabledTaxTreatments.includes(draft.defaultTaxTreatment);
  }, [draft]);

  const toggleTreatment = (value: string) => {
    if (!draft) return;
    const enabled = draft.enabledTaxTreatments.includes(value)
      ? draft.enabledTaxTreatments.filter((item) => item !== value)
      : [...draft.enabledTaxTreatments, value];
    setDraft({ ...draft, enabledTaxTreatments: enabled });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !canUpdate) return;
    if (!defaultIsEnabled) {
      toast.error(rtl ? "يجب أن تكون المعالجة الافتراضية مفعلة." : "The default treatment must be enabled.");
      return;
    }
    setSaving(true);
    try {
      await apiClient<{ success: boolean }>("/settings", {
        method: "PATCH",
        locale,
        skipBranch: true,
        body: JSON.stringify(draft),
      });
      toast.success(rtl ? "تم حفظ سياسة الضرائب" : "Tax policy saved");
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : (rtl ? "فشل حفظ سياسة الضرائب." : "Failed to save tax policy."));
    } finally {
      setSaving(false);
    }
  };

  if (!canView) return <PageHeader title={rtl ? "إعدادات الضرائب" : "Tax Settings"} description={rtl ? "ليست لديك صلاحية عرض إعدادات الضرائب." : "You do not have permission to view tax settings."} />;
  if (loading) return <LoadingState variant="skeleton" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!policy || !draft) return null;

  return <div className="space-y-6 text-xs">
    <PageHeader
      title={rtl ? "إعدادات الضرائب وضريبة القيمة المضافة" : "Tax & VAT Settings"}
      description={rtl ? "سياسة ضريبة الشركة من السلطة الخلفية المعتمدة." : "Company tax policy from the existing server authority."}
    />
    <Card className="p-5 lg:p-6">
      <form onSubmit={save} className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">{rtl ? "سياسة الشركة" : "Company tax policy"}</h2>
            <p className="mt-1 text-slate-500">{rtl ? "القيم مملوكة للخادم ولا تنشئ أهلية قانونية تلقائيًا للمعاملات." : "The server owns these values; they do not automatically grant legal transaction eligibility."}</p>
          </div>
          {policy.configured ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label={rtl ? "مهيأ" : "Configured"} /> : <CircleAlert className="h-5 w-5 text-amber-600" aria-label={rtl ? "غير مكتمل" : "Not configured"} />}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="label-base">{rtl ? "هل الشركة مسجلة في ضريبة القيمة المضافة؟" : "VAT Registered"}</span>
            <select className="input-base mt-1" value={draft.vatRegistered === null ? "" : String(draft.vatRegistered)} onChange={(event) => setDraft({ ...draft, vatRegistered: event.target.value === "" ? null : event.target.value === "true" })} disabled={!canUpdate}>
              <option value="">{rtl ? "غير محدد" : "Not set"}</option>
              <option value="true">{rtl ? "نعم" : "Yes"}</option>
              <option value="false">{rtl ? "لا" : "No"}</option>
            </select>
          </label>
          <label className="block">
            <span className="label-base">{rtl ? "الرقم الضريبي (TRN)" : "TRN"}</span>
            <input className="input-base mt-1" value={policy.trn || ""} readOnly aria-describedby="tax-trn-note" />
            <span id="tax-trn-note" className="mt-1 block text-[10px] text-slate-500">{rtl ? "مصدره سجل الشركة. لتعديله افتح بيانات الشركة." : "Sourced from Company.taxNumber. Edit it from Company Profile."} <Link href="/settings" className="text-brand-700 hover:underline">{rtl ? "بيانات الشركة" : "Company Profile"}</Link></span>
          </label>
          <label className="block">
            <span className="label-base">{rtl ? "نسبة ضريبة القيمة المضافة (%)" : "VAT Rate (%)"}</span>
            <input className="input-base mt-1" type="number" min="0" max="100" step="any" value={draft.vatRate ?? ""} onChange={(event) => setDraft({ ...draft, vatRate: event.target.value === "" ? null : Number(event.target.value) })} disabled={!canUpdate} />
          </label>
        </div>

        <fieldset>
          <legend className="label-base">{rtl ? "المعالجات الضريبية المفعلة" : "Enabled Tax Treatments"}</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {policy.supportedTaxTreatments.map((value) => {
              const label = treatmentLabels[value] || { ar: value, en: value };
              return <label key={value} className="flex items-center gap-2 rounded-lg border border-border p-3">
                <input type="checkbox" checked={draft.enabledTaxTreatments.includes(value)} onChange={() => toggleTreatment(value)} disabled={!canUpdate} />
                <span>{rtl ? label.ar : label.en}</span>
                <span className="ms-auto text-[10px] text-slate-400">{value}</span>
              </label>;
            })}
          </div>
        </fieldset>

        <label className="block max-w-xl">
          <span className="label-base">{rtl ? "المعالجة الضريبية الافتراضية" : "Default Tax Treatment"}</span>
          <select className="input-base mt-1" value={draft.defaultTaxTreatment || ""} onChange={(event) => setDraft({ ...draft, defaultTaxTreatment: event.target.value || null })} disabled={!canUpdate}>
            <option value="">{rtl ? "غير محدد" : "Not set"}</option>
            {draft.enabledTaxTreatments.map((value) => <option key={value} value={value}>{treatmentLabels[value]?.[rtl ? "ar" : "en"] || value}</option>)}
          </select>
          {!defaultIsEnabled && <span className="mt-1 block text-rose-600">{rtl ? "المعالجة الافتراضية يجب أن تكون ضمن المعالجات المفعلة." : "The default treatment must be one of the enabled treatments."}</span>}
        </label>

        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{rtl ? "تفعيل الاحتساب العكسي للسلع الثمينة" : "Precious Goods Reverse Charge Enabled"}</p>
              <p className="mt-1 text-slate-500">{rtl ? "هذا يفعّل القدرة فقط ولا يجعل كل معاملة مؤهلة تلقائيًا للاحتساب العكسي." : "This enables the capability only; it does not make every transaction RCM-eligible."}</p>
            </div>
            <select className="input-base w-32" value={draft.preciousGoodsRcmEnabled === null ? "" : String(draft.preciousGoodsRcmEnabled)} onChange={(event) => setDraft({ ...draft, preciousGoodsRcmEnabled: event.target.value === "" ? null : event.target.value === "true" })} disabled={!canUpdate}>
              <option value="">{rtl ? "غير محدد" : "Not set"}</option>
              <option value="true">{rtl ? "نعم" : "Yes"}</option>
              <option value="false">{rtl ? "لا" : "No"}</option>
            </select>
          </div>
        </div>

        {canUpdate && <Button type="submit" disabled={saving || !defaultIsEnabled}><Save className="me-2 h-4 w-4" />{saving ? (rtl ? "جارٍ الحفظ..." : "Saving...") : (rtl ? "حفظ سياسة الضرائب" : "Save Tax Policy")}</Button>}
      </form>
    </Card>
  </div>;
}
