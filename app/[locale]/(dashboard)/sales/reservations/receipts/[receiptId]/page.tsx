"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { depositReceiptByIdPath } from "@/lib/api/reservation-deposit-receipt-contract";
import { formatDateTime } from "@/lib/dates/dates";

type Receipt = {
  id: string;
  receiptNumber: string;
  postedAt: string;
  status: string;
  snapshot: any;
};

const text = (locale: string, ar: string, en: string) => locale === "ar" ? ar : en;
const value = (input: unknown, fallback = "—") => input === null || input === undefined || input === "" ? fallback : String(input);

export default function ReservationDepositReceiptPage() {
  const locale = useLocale();
  const params = useParams<{ receiptId?: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const receiptId = typeof params.receiptId === "string" ? params.receiptId : "";
  const rtl = locale === "ar";

  useEffect(() => {
    let active = true;
    setReceipt(null);
    setError(null);
    if (!receiptId) return;
    let path: string;
    try {
      path = depositReceiptByIdPath(receiptId);
    } catch {
      if (active) setError(text(locale, "معرف الإيصال غير صالح.", "The receipt identifier is invalid."));
      return () => { active = false; };
    }
    apiClient<{ data?: Receipt }>(path, { locale })
      .then((response) => { if (active) setReceipt(response.data || null); })
      .catch(() => { if (active) setError(text(locale, "تعذر تحميل الإيصال الثابت.", "The immutable receipt could not be loaded.")); });
    return () => { active = false; };
  }, [locale, receiptId]);

  if (error) return <main className="p-6 text-destructive">{error}</main>;
  if (!receipt) return <main className="p-6 text-muted-foreground">{text(locale, "جارٍ تحميل الإيصال…", "Loading receipt…")}</main>;

  const snapshot = receipt.snapshot || {};
  const company = snapshot.company || {};
  const branch = snapshot.branch || {};
  const customer = snapshot.customer || {};
  const payment = snapshot.payment || {};
  const financial = snapshot.financialSummary || {};
  const products = Array.isArray(snapshot.products) ? snapshot.products : [];
  const notices = snapshot.notices || {};
  const currency = payment.currency || "AED";

  return (
    <main data-print-page="true" dir={rtl ? "rtl" : "ltr"} className="mx-auto max-w-4xl space-y-4 p-4 print:max-w-none print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/sales/reservations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className={rtl ? "rotate-180" : ""} size={16} />
          {text(locale, "العودة للحجوزات", "Back to reservations")}
        </Link>
        <Button onClick={() => window.print()} className="gap-2"><Printer size={16} />{text(locale, "طباعة", "Print")}</Button>
      </div>

      <article data-print-root="true" className="space-y-6 rounded-xl border bg-background p-6 shadow-sm print:border-0 print:shadow-none">
        <header className="flex flex-wrap justify-between gap-6 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold">{value(company.name, text(locale, "شركة دارفوس للمجوهرات", "DARFUS Jewellery"))}</h1>
            <p className="text-sm text-muted-foreground">{value(company.address)} · {value(company.phone)}</p>
            {company.taxNumber && <p className="text-sm text-muted-foreground">{text(locale, "الرقم الضريبي", "Tax number")}: {company.taxNumber}</p>}
          </div>
          <div className={rtl ? "text-right" : "text-left"}>
            <h2 className="text-xl font-bold">{text(locale, "إيصال استلام عربون", "Reservation Deposit Receipt")}</h2>
            <p className="font-mono text-lg font-semibold">{receipt.receiptNumber}</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(receipt.postedAt, "Asia/Dubai", locale)}</p>
            <p className="text-sm text-muted-foreground">{value(branch.name)} · {value(branch.code)}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div><h3 className="font-semibold">{text(locale, "العميل", "Customer")}</h3><p>{value(customer.name)}</p><p className="text-sm text-muted-foreground">{value(customer.phone)}</p></div>
          <div><h3 className="font-semibold">{text(locale, "تفاصيل الاستلام", "Collection details")}</h3><p>{text(locale, "الطريقة", "Method")}: {value(payment.method)}</p><p>{text(locale, "الموظف", "Employee")}: {value(snapshot.employee?.name)}</p><p>{text(locale, "المرجع", "Reference")}: {value(payment.externalReference)}</p></div>
        </section>

        <section>
          <h3 className="mb-2 font-semibold">{text(locale, "الأصناف المحجوزة", "Reserved products")}</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-start text-muted-foreground"><th className="py-2 text-start">{text(locale, "الصنف", "Product")}</th><th className="py-2 text-start">{text(locale, "الكود", "Code")}</th><th className="py-2 text-start">{text(locale, "الوزن/العيار", "Weight/Karat")}</th><th className="py-2 text-end">{text(locale, "السعر المتفق عليه", "Agreed price")}</th></tr></thead><tbody>{products.map((product: any) => <tr key={product.id} className="border-b"><td className="py-2">{value(product.name)}</td><td className="py-2">{value(product.code)}</td><td className="py-2">{[product.weight, product.karat].filter(Boolean).join(" / ") || "—"}</td><td className="py-2 text-end">{value(product.agreedPrice)} {currency}</td></tr>)}</tbody></table></div>
        </section>

        <section className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
          <div className="text-lg font-bold">{text(locale, "العربون المستلم الآن", "Deposit received now")}: {value(payment.amount, "0.0000")} {currency}</div>
          <div>{text(locale, "إجمالي المستلم بعد العملية", "Cumulative received")}: {value(financial.cumulativeReceived, "0.0000")} {currency}</div>
          <div>{text(locale, "إجمالي العربون المحتفظ به", "Net retained deposit")}: {value(financial.netRetained, "0.0000")} {currency}</div>
          <div>{text(locale, "المتبقي عند الإتمام", "Remaining due at completion")}: {value(financial.remainingAmountDue, "0.0000")} {currency}</div>
        </section>

        <aside className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" lang={rtl ? "ar" : "en"}>{rtl ? notices.ar : notices.en}</aside>
        {company.footer && <footer className="border-t pt-4 text-center text-sm text-muted-foreground">{company.footer}</footer>}
      </article>
    </main>
  );
}
