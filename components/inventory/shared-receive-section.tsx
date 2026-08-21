"use client";

import { ExternalLink } from "lucide-react";
import { useLocale } from "next-intl";
import { ReverseChargeChecklist } from "@/features/tax/components/ReverseChargeChecklist";
import { Link } from "@/i18n/navigation";

export type SharedReceiveSupplier = {
  id: string;
  name: string;
  status?: string;
  taxNumber?: string | null;
};

export type SharedReceiveLocation = {
  id: string;
  code: string;
  name: string;
  isActive?: boolean;
};

export type SharedReceiveTaxPolicy = {
  enabledTaxTreatments?: string[];
  vatRate?: number | string | null;
  vatRegistered?: boolean | null;
};

export type SharedReceiveTaxSummary = {
  taxBase?: number | string | null;
  taxableBase?: number | string | null;
  vatRate?: number | string | null;
  inputVatAmount?: number | string | null;
  vatAmount?: number | string | null;
  total?: number | string | null;
  isRcm?: boolean;
  rcmVatAmount?: number | string | null;
  rcmRate?: number | string | null;
  taxTreatment?: string | null;
};

export type SharedReceiveState = {
  supplierId: string;
  locationId: string;
  purchaseDate: string;
  taxTreatment: string;
  notes: string;
  rcmEvidence: Record<string, boolean>;
};

type Props = {
  state: SharedReceiveState;
  suppliers: SharedReceiveSupplier[];
  locations: SharedReceiveLocation[];
  taxPolicy?: SharedReceiveTaxPolicy | null;
  taxSummary?: SharedReceiveTaxSummary | null;
  onChange: (key: keyof SharedReceiveState, value: string) => void;
  onRcmVerified: (verified: boolean) => void;
  onRcmEvidenceChange: (evidence: Record<string, boolean>) => void;
  rcmVerified: boolean;
  disabled?: boolean;
};

const money = (value: unknown, locale: string) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 8,
  }).format(Number(value));
};

const display = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);

export function buildSharedTaxRequest(state: SharedReceiveState, taxPolicy?: SharedReceiveTaxPolicy | null) {
  const treatment = state.taxTreatment;
  const isRcm = treatment === "REVERSE_CHARGE";
  const appliesVat = treatment === "STANDARD_VAT" || isRcm;
  const rate = Number(taxPolicy?.vatRate ?? 0);
  return {
    taxTreatment: treatment,
    applyVat: appliesVat,
    vatRate: rate,
    taxIncluded: false,
    isRecoverable: true,
    ...(isRcm ? {
      isRcm: true,
      isDRC: true,
      reverseVat: true,
      useReverseCharge: true,
      rcmRate: rate,
      taxContext: state.rcmEvidence,
    } : {}),
  };
}

export function SharedReceiveSection({
  state,
  suppliers,
  locations,
  taxPolicy,
  taxSummary,
  onChange,
  onRcmVerified,
  onRcmEvidenceChange,
  rcmVerified,
  disabled = false,
}: Props) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const enabledTreatments = Array.isArray(taxPolicy?.enabledTaxTreatments) ? taxPolicy.enabledTaxTreatments : [];
  const selectedSupplier = suppliers.find((supplier) => supplier.id === state.supplierId);
  const isRcm = state.taxTreatment === "REVERSE_CHARGE";
  const hasLocations = locations.length > 0;

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/30 p-5 dark:border-brand-900 dark:bg-brand-950/10">
      <h2 className="text-sm font-black text-navy-950 dark:text-white">
        {rtl ? "بيانات الاستلام المشتركة" : "Shared Receive Details"}
      </h2>
      <p className="mt-1 text-[10px] text-slate-500">
        {rtl ? "هذه البيانات مشتركة لكل ملفات الاستلام، ومصدرها الخادم وسياسة الشركة." : "These fields are shared by every receive profile and remain server-backed."}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <span className="block text-[11px] font-bold text-slate-500">{rtl ? "المورد" : "Supplier"} *</span>
          <select className="input-base w-full" value={state.supplierId} required disabled={disabled} onChange={(event) => onChange("supplierId", event.target.value)}>
            <option key="empty-supplier" value="">{rtl ? "اختر موردًا من DB" : "Select a DB Supplier"}</option>
            {suppliers.filter((supplier) => supplier.status !== "inactive").map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-[11px] font-bold text-slate-500">{rtl ? "الموقع" : "Location"} *</span>
          <select className="input-base w-full" value={state.locationId} required disabled={disabled || !hasLocations} onChange={(event) => onChange("locationId", event.target.value)}>
            <option key="empty-location" value="">{hasLocations ? (rtl ? "اختر موقعًا نشطًا" : "Select an active Location") : (rtl ? "لا توجد مواقع نشطة" : "No active Locations")}</option>
            {locations.filter((location) => location.isActive !== false).map((location) => <option key={location.id} value={location.id}>{location.code} — {location.name}</option>)}
          </select>
          {!hasLocations && <span className="block text-[10px] text-amber-700 dark:text-amber-300"><ExternalLink className="me-1 inline h-3 w-3" /><Link className="underline" href="/inventory/locations">{rtl ? "إدارة المواقع" : "Manage Locations"}</Link></span>}
          <span className="block text-[10px] text-slate-500">{rtl ? "الموقع من DB داخل الشركة والفرع الحالي فقط." : "Location is DB-backed and scoped to the current company and branch."}</span>
        </label>

        <label className="space-y-1">
          <span className="block text-[11px] font-bold text-slate-500">{rtl ? "تاريخ الشراء" : "Purchase Date"} *</span>
          <input className="input-base w-full" type="date" value={state.purchaseDate} required disabled={disabled} onChange={(event) => onChange("purchaseDate", event.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="block text-[11px] font-bold text-slate-500">{rtl ? "المعاملة الضريبية" : "Tax Treatment"} *</span>
          <select className="input-base w-full" value={state.taxTreatment} required disabled={disabled || enabledTreatments.length === 0} onChange={(event) => onChange("taxTreatment", event.target.value)}>
            <option key="empty-tax-treatment" value="">{rtl ? "اختر من سياسة الشركة" : "Select from company policy"}</option>
            {enabledTreatments.map((treatment) => <option key={treatment} value={treatment}>{treatment}</option>)}
          </select>
          <span className="block text-[10px] text-slate-500">{rtl ? "لا يوجد افتراض ضريبي على الواجهة." : "No frontend tax default is used."}</span>
        </label>
      </div>

      <label className="mt-3 block space-y-1">
        <span className="block text-[11px] font-bold text-slate-500">{rtl ? "ملاحظات" : "Notes"}</span>
        <textarea className="input-base min-h-20 w-full" value={state.notes} disabled={disabled} onChange={(event) => onChange("notes", event.target.value)} />
      </label>

      <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
        <h3 className="text-xs font-black text-foreground">{rtl ? "ملخص الضريبة من معاينة الخادم" : "Server Tax Summary"}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><p className="text-[10px] text-slate-500">{rtl ? "الأساس الخاضع" : "Taxable Base"}</p><p className="font-black">{money(taxSummary?.taxBase ?? taxSummary?.taxableBase, locale)}</p></div>
          <div><p className="text-[10px] text-slate-500">{rtl ? "نسبة الضريبة" : "VAT Rate"}</p><p className="font-black">{display(taxSummary?.vatRate ?? taxSummary?.rcmRate)}%</p></div>
          <div><p className="text-[10px] text-slate-500">{isRcm ? (rtl ? "ضريبة RCM" : "RCM VAT") : (rtl ? "ضريبة المدخلات" : "Input VAT")}</p><p className="font-black">{money(isRcm ? taxSummary?.rcmVatAmount : (taxSummary?.inputVatAmount ?? taxSummary?.vatAmount), locale)}</p></div>
          <div><p className="text-[10px] text-slate-500">{rtl ? "المعاملة" : "Treatment"}</p><p className="font-black">{display(taxSummary?.taxTreatment ?? state.taxTreatment)}</p></div>
        </div>
        {!taxSummary && <p className="mt-3 text-[10px] font-bold text-amber-700 dark:text-amber-300">{rtl ? "أدخل البيانات المطلوبة لعرض ملخص الخادم." : "Complete the required fields to load the server summary."}</p>}
      </div>

      {isRcm && selectedSupplier && <div className="mt-4"><ReverseChargeChecklist supplierName={selectedSupplier.name} trn={selectedSupplier.taxNumber || ""} locale={locale} onVerifyStatusChange={onRcmVerified} onEvidenceChange={onRcmEvidenceChange} /></div>}
      {isRcm && !rcmVerified && <p className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">{rtl ? "يجب استيفاء أدلة الاحتساب العكسي قبل الاستلام." : "Reverse-charge evidence must be complete before receiving."}</p>}
    </section>
  );
}
