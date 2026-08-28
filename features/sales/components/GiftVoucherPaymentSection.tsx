"use client";

import { CheckCircle2, Ticket, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { GiftVoucher } from "@/lib/types";

interface GiftVoucherPaymentSectionProps {
  rtl: boolean;
  code: string;
  voucher: GiftVoucher | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
  currency: string;
  formatAmount: (value: number | string) => string;
  remainingDue: number;
  onCodeChange: (value: string) => void;
  onValidate: () => void;
  onRemove: () => void;
}

export function GiftVoucherPaymentSection({
  rtl,
  code,
  voucher,
  loading,
  error,
  supported,
  currency,
  formatAmount,
  remainingDue,
  onCodeChange,
  onValidate,
  onRemove,
}: GiftVoucherPaymentSectionProps) {
  const t = useTranslations("POS");
  const labels = {
    title: t("giftVoucher.title"),
    description: t("giftVoucher.description"),
    code: t("giftVoucher.code"),
    placeholder: t("giftVoucher.placeholder"),
    validate: t("giftVoucher.validate"),
    remove: t("giftVoucher.remove"),
    active: t("giftVoucher.active"),
    faceValue: t("giftVoucher.faceValue"),
    applied: t("giftVoucher.applied"),
    remaining: t("giftVoucher.remaining"),
    unavailable: t("giftVoucher.unavailable"),
    validating: t("giftVoucher.validating"),
  };

  return (
    <section
      data-testid="gift-voucher-payment-section"
      data-gift-voucher-supported={supported ? "true" : "false"}
      className="mb-4 space-y-4 rounded-2xl border border-gold-200 bg-gold-50/50 p-4 sm:p-5 dark:border-gold-500/30 dark:bg-gold-500/5"
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
          <Ticket className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black leading-5 text-navy-950 dark:text-white">{labels.title}</h3>
          <p className="mt-1 text-xs leading-4 text-slate-600 dark:text-slate-300">{labels.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pos-gift-voucher-code" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
          {labels.code}
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="pos-gift-voucher-code"
            data-testid="gift-voucher-code-input"
            value={code}
            onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter" && supported && !loading) {
                event.preventDefault();
                onValidate();
              }
            }}
            className="input-base min-h-10 min-w-0 w-full flex-1 font-mono tracking-wide [direction:ltr]"
            placeholder={labels.placeholder}
            aria-describedby={error ? "pos-gift-voucher-error" : undefined}
            aria-invalid={error ? "true" : undefined}
            disabled={!supported}
            autoComplete="off"
            inputMode="text"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onValidate}
            disabled={!supported || loading || !code.trim()}
            className="min-h-10 shrink-0"
            style={{ width: "max-content", maxWidth: "100%", minWidth: "7rem" }}
          >
            {loading ? labels.validating : labels.validate}
          </Button>
        </div>
      </div>

      {!supported && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{labels.unavailable}</p>}

      {voucher && supported ? (
        <div className="space-y-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-950/35 dark:text-emerald-50">
          <div className="flex items-start justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-xs font-black leading-5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />{labels.active}</p>
            <button type="button" onClick={onRemove} className="grid min-h-9 min-w-9 shrink-0 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 dark:text-emerald-200 dark:hover:bg-emerald-500/20" aria-label={labels.remove} title={labels.remove}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2">
            <div className="rounded-xl border border-emerald-200/80 bg-white/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-900/20">
              <span className="block text-[11px] font-semibold leading-4 text-emerald-800 dark:text-emerald-200">{labels.faceValue}</span>
              <bdi dir="ltr" className="numeric-token mt-1 block text-sm font-black leading-5">{formatAmount(voucher.faceValue)} {currency}</bdi>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-white/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-900/20">
              <span className="block text-[11px] font-semibold leading-4 text-emerald-800 dark:text-emerald-200">{labels.applied}</span>
              <bdi dir="ltr" className="numeric-token mt-1 block text-sm font-black leading-5">{formatAmount(voucher.faceValue)} {currency}</bdi>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-white/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-900/20">
              <span className="block text-[11px] font-semibold leading-4 text-emerald-800 dark:text-emerald-200">{labels.remaining}</span>
              <bdi dir="ltr" className="numeric-token mt-1 block text-sm font-black leading-5">{formatAmount(remainingDue)} {currency}</bdi>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p id="pos-gift-voucher-error" role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold leading-5 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/35 dark:text-rose-100">{error}</p> : null}
    </section>
  );
}
