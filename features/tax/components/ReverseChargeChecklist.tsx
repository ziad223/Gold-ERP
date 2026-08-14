"use client";

import { useState } from "react";
import { CheckSquare, Square, ShieldCheck, AlertCircle, FileText } from "lucide-react";

interface ReverseChargeChecklistProps {
  supplierName: string;
  trn: string;
  onVerifyStatusChange: (verified: boolean) => void;
  locale?: string;
}

export function ReverseChargeChecklist({
  supplierName,
  trn,
  onVerifyStatusChange,
  locale = "ar"
}: ReverseChargeChecklistProps) {
  const rtl = locale === "ar";
  
  const [checkedTrn, setCheckedTrn] = useState(false);
  const [checkedDeclaration, setCheckedDeclaration] = useState(false);
  const [checkedInvoice, setCheckedInvoice] = useState(false);

  const toggleTrn = () => {
    const nextVal = !checkedTrn;
    setCheckedTrn(nextVal);
    onVerifyStatusChange(nextVal && checkedDeclaration && checkedInvoice);
  };

  const toggleDeclaration = () => {
    const nextVal = !checkedDeclaration;
    setCheckedDeclaration(nextVal);
    onVerifyStatusChange(checkedTrn && nextVal && checkedInvoice);
  };

  const toggleInvoice = () => {
    const nextVal = !checkedInvoice;
    setCheckedInvoice(nextVal);
    onVerifyStatusChange(checkedTrn && checkedDeclaration && nextVal);
  };

  const isVerified = checkedTrn && checkedDeclaration && checkedInvoice;

  return (
    <div className="rounded-3xl border border-dashed border-border p-5 bg-surface-muted/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          {rtl ? "التحقق من آلية الاحتساب العكسي (DRC)" : "Domestic Reverse Charge Compliance (DRC)"}
        </h4>
        <Badge status={isVerified} rtl={rtl} />
      </div>

      <p className="text-[11px] leading-5 text-muted">
        {rtl 
          ? "بموجب قوانين الهيئة الاتحادية للضرائب بدولة الإمارات، يجب استيفاء الشروط التالية لاعتماد التوريد الخاضع للاحتساب العكسي للذهب دون سداد الضريبة للمورد."
          : "Under UAE FTA regulations, the following conditions must be verified before applying Reverse Charge rules on gold imports/purchases."}
      </p>

      <div className="space-y-3 pt-2">
        {/* Verification Check 1 */}
        <button
          type="button"
          onClick={toggleTrn}
          className="flex items-start gap-3 text-start w-full text-xs transition hover:text-brand-700"
        >
          {checkedTrn ? (
            <CheckSquare className="h-4.5 w-4.5 text-brand-750 shrink-0" />
          ) : (
            <Square className="h-4.5 w-4.5 text-muted/40 shrink-0" />
          )}
          <div>
            <p className="font-bold text-foreground">
              {rtl ? "التحقق من الرقم الضريبي للمورد (TRN)" : "Supplier TRN Verification"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              {rtl 
                ? `الرقم الضريبي المستهدف: ${trn || "غير محدد"}. تم التحقق من تسجيل المورد لدى الهيئة.`
                : `Target TRN: ${trn || "Not specified"}. Verified supplier is active with FTA.`}
            </p>
          </div>
        </button>

        {/* Verification Check 2 */}
        <button
          type="button"
          onClick={toggleDeclaration}
          className="flex items-start gap-3 text-start w-full text-xs transition hover:text-brand-700"
        >
          {checkedDeclaration ? (
            <CheckSquare className="h-4.5 w-4.5 text-brand-750 shrink-0" />
          ) : (
            <Square className="h-4.5 w-4.5 text-muted/40 shrink-0" />
          )}
          <div>
            <p className="font-bold text-foreground">
              {rtl ? "استلام إقرار المشتري المكتوب" : "Written Declaration Received"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              {rtl 
                ? "يقر المشتري بأن نيته هي استخدام السلع لإنتاج ذهب آخر أو إعادة بيعه."
                : "Declaration stating the buyer's intention to produce other gold or resell it."}
            </p>
          </div>
        </button>

        {/* Verification Check 3 */}
        <button
          type="button"
          onClick={toggleInvoice}
          className="flex items-start gap-3 text-start w-full text-xs transition hover:text-brand-700"
        >
          {checkedInvoice ? (
            <CheckSquare className="h-4.5 w-4.5 text-brand-750 shrink-0" />
          ) : (
            <Square className="h-4.5 w-4.5 text-muted/40 shrink-0" />
          )}
          <div>
            <p className="font-bold text-foreground">
              {rtl ? "إرفاق فاتورة ضريبية تحتوي على تصريح DRC" : "Tax Invoice with DRC Statement Attached"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              {rtl 
                ? "يجب أن توضح الفاتورة الصادرة التزام المشتري باحتساب الضريبة العكسية."
                : "The invoice must state that the buyer is liable to account for VAT."}
            </p>
          </div>
        </button>
      </div>

      {!isVerified && (
        <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-warning/10 p-2.5 rounded-xl">
          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
          <span>
            {rtl 
              ? "يجب تحديد جميع بنود التحقق أعلاه لتفعيل خيار الشراء بالاحتساب العكسي."
              : "All compliance checks must be verified before completing DRC transaction."}
          </span>
        </div>
      )}
    </div>
  );
}

function Badge({ status, rtl }: { status: boolean; rtl: boolean }) {
  if (status) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
        {rtl ? "مستوفٍ" : "Compliant"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20">
      {rtl ? "معلق" : "Pending"}
    </span>
  );
}
