"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";

type ReceiptRow = { id: string; receiptNumber: string; postedAt: string; currentPaymentAmount: string; cumulativeReceivedTotal: string; currency?: string; status: string };
const label = (locale: string, ar: string, en: string) => locale === "ar" ? ar : en;

export default function ReservationDepositReceiptHistoryPage() {
  const locale = useLocale();
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reservationId = typeof window === "undefined" ? "" : window.location.pathname.split("/").filter(Boolean).at(-2) || "";

  useEffect(() => {
    if (!reservationId) return;
    apiClient<{ data?: ReceiptRow[] }>(`/reservations/${encodeURIComponent(reservationId)}/deposit-receipts?limit=50`, { locale })
      .then((response) => setRows(response.data || []))
      .catch(() => setError(label(locale, "تعذر تحميل سجل الإيصالات.", "The receipt history could not be loaded.")));
  }, [locale, reservationId]);

  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-4xl space-y-4 p-6">
    <Link href="/sales/reservations" className="text-sm text-muted-foreground hover:text-foreground">{label(locale, "العودة للحجوزات", "Back to reservations")}</Link>
    <h1 className="text-2xl font-bold">{label(locale, "سجل إيصالات العربون", "Deposit receipt history")}</h1>
    {error && <p className="text-destructive">{error}</p>}
    {!error && rows.length === 0 && <p className="text-muted-foreground">{label(locale, "لا توجد إيصالات عربون ثابتة لهذا الحجز.", "No immutable deposit receipts exist for this reservation.")}</p>}
    <div className="space-y-2">{rows.map((row) => <Link key={row.id} href={`/sales/reservations/receipts/${row.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4 hover:bg-muted/40"><span className="font-mono font-semibold">{row.receiptNumber}</span><span>{new Date(row.postedAt).toLocaleString(locale === "ar" ? "ar" : "en-GB")}</span><span>{row.currentPaymentAmount} {row.currency || "AED"}</span><span className="text-sm text-muted-foreground">{label(locale, "الإجمالي", "Cumulative")}: {row.cumulativeReceivedTotal}</span></Link>)}</div>
  </main>;
}
