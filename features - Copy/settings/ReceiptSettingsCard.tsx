"use client";

import { useEffect, useState } from "react";
import { Receipt, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReceiptSettings, type ReceiptConfig } from "@/hooks/use-receipt-settings";
import { toEnglishDigits } from "@/lib/formatters/numbers";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold dark:border-slate-800">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-0.5" : "left-[22px]"}`} />
      </button>
    </label>
  );
}

/**
 * Receipt customization — logo, greeting, footer, terms and visible fields.
 */
export function ReceiptSettingsCard() {
  const t = useTranslations("Settings");
  const { config, save, saving, loading } = useReceiptSettings();
  const [form, setForm] = useState<ReceiptConfig>(config);
  const [saved, setSaved] = useState(false);

  // Sync local form when the persisted config loads.
  useEffect(() => {
    setForm(config);
  }, [config]);

  const set = <K extends keyof ReceiptConfig>(key: K, value: ReceiptConfig[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaved(false);
    await save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const textField = (key: keyof ReceiptConfig, label: string, placeholder = "") => (
    <label className="block">
      <span className="label-base">{label}</span>
      <input
        className="input-base"
        value={key === "phone" || key === "vatNumber" ? toEnglishDigits(form[key]) : ((form[key] as string) ?? "")}
        placeholder={placeholder}
        inputMode={key === "phone" ? "tel" : key === "vatNumber" ? "numeric" : undefined}
        dir={key === "phone" || key === "vatNumber" ? "ltr" : undefined}
        onChange={(e) => set(key, (key === "phone" || key === "vatNumber" ? toEnglishDigits(e.target.value) : e.target.value) as ReceiptConfig[typeof key])}
      />
    </label>
  );

  return (
    <Card className="p-5 lg:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-black text-navy-950 dark:text-white">{t("receiptTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("receiptDesc")}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {textField("welcomeMessage", t("welcomeMessage"), t("welcomeMessagePh"))}
        {textField("headerNote", t("headerNote"), t("headerNotePh"))}
        {textField("footerMessage", t("footerMessage"), t("footerMessagePh"))}
        {textField("termsMessage", t("termsMessage"), t("termsMessagePh"))}
        {textField("phone", t("receiptPhone"))}
        {textField("vatNumber", t("vatNumber"))}
        <label className="block lg:col-span-2">
          <span className="label-base">{t("receiptAddress")}</span>
          <input className="input-base" value={toEnglishDigits(form.address ?? "")} onChange={(e) => set("address", toEnglishDigits(e.target.value))} />
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Toggle label={t("showLogo")} checked={form.showLogo} onChange={(v) => set("showLogo", v)} />
        <Toggle label={t("showCashier")} checked={form.showCashier} onChange={(v) => set("showCashier", v)} />
        <Toggle label={t("showBarcode")} checked={form.showBarcode} onChange={(v) => set("showBarcode", v)} />
        <Toggle label={t("showVatNumber")} checked={form.showVatNumber} onChange={(v) => set("showVatNumber", v)} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="h-4 w-4" />{t("saveReceipt")}
        </Button>
        {saved && <span className="text-xs font-bold text-emerald-600">{t("receiptSaved")}</span>}
      </div>
    </Card>
  );
}
