import { formatCurrency } from "@/lib/utils";
import type { ExchangeDisplayResponse, ExchangeDisplayItem } from "@/lib/types";

/**
 * Phase 30.7-Fix — customer-safe exchange summary for PRINT.
 *
 * Rendered by the invoice print templates (via renderToStaticMarkup) for
 * `invoice.type === "exchange"` in place of the raw item table / totals, so the
 * customer never sees the internal negative return line or negative total.
 *
 * Print-safe by construction:
 *   - `locale` is a PROP (no useLocale / next-intl provider in static print).
 *   - No React Query / no useExchangeDisplay (data is fetched by the parent page
 *     and passed down).
 *   - No screen UI components (Badge, etc.) and no Tailwind classes — inline
 *     styles only, so it renders identically inside the standalone print HTML.
 *   - ALL amounts come from the trusted `ExchangeDisplayResponse`; nothing is
 *     recomputed from raw invoice items. Money is clamped with Math.max(0, …) so
 *     no negative value ever prints.
 *
 * When `exchangeDisplay` is null/undefined (loading/error/unavailable) it renders
 * a conservative warning instead of any raw figures.
 */

export type ExchangePrintVariant = "full" | "compact" | "minimal" | "thermal";

interface ExchangePrintSummaryProps {
  exchangeDisplay?: ExchangeDisplayResponse | null;
  locale: string;
  currency?: string;
  variant?: ExchangePrintVariant;
}

export function ExchangePrintSummary({ exchangeDisplay, locale, currency, variant = "full" }: ExchangePrintSummaryProps) {
  const rtl = locale === "ar";
  const thermal = variant === "thermal";
  const baseFont = thermal ? 11 : 12;

  const wrap: React.CSSProperties = {
    border: "1px solid #d8d8d8",
    borderRadius: thermal ? 4 : 8,
    padding: thermal ? "6px 8px" : "10px 14px",
    margin: thermal ? "6px 0" : "10px 0",
    fontSize: baseFont,
    color: "#111",
    direction: rtl ? "rtl" : "ltr",
    textAlign: rtl ? "right" : "left",
  };
  const title: React.CSSProperties = { fontWeight: 800, fontSize: baseFont + 2, marginBottom: thermal ? 4 : 8 };
  const sectionTitle: React.CSSProperties = { fontWeight: 700, marginTop: thermal ? 4 : 8, marginBottom: 2 };
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" };
  const strongRow: React.CSSProperties = { ...row, fontWeight: 800 };
  const note: React.CSSProperties = { marginTop: thermal ? 4 : 8, fontSize: baseFont - 1, color: "#555" };
  const warnBox: React.CSSProperties = { ...wrap, borderColor: "#e0b400", background: "#fff8e1", color: "#7a5a00" };

  const L = (en: string, ar: string) => (rtl ? ar : en);

  // ── Fallback: no trusted data → warn, print nothing misleading. ────────────
  if (!exchangeDisplay) {
    return (
      <section aria-label={L("Exchange summary", "ملخص الاستبدال")} style={warnBox}>
        <div style={title}>{L("Exchange", "استبدال")}</div>
        <div>
          {L(
            "Exchange print summary is unavailable. Please review the invoice detail before customer-facing print.",
            "ملخص طباعة الاستبدال غير متاح. يرجى مراجعة تفاصيل الفاتورة قبل الطباعة للعميل.",
          )}
        </div>
      </section>
    );
  }

  const cur = currency || exchangeDisplay.currency;
  const money = (v: number | null | undefined) => formatCurrency(Math.max(0, Number(v) || 0), cur, locale);

  const figures = exchangeDisplay.figures;
  const cf = exchangeDisplay.customerFacing;
  const settlement = exchangeDisplay.settlementSummary;
  const isTarget = exchangeDisplay.policyStatus === "target_policy";
  const isLegacy = exchangeDisplay.policyStatus === "legacy_or_unknown";
  const amountDue = Math.max(0, Number(figures.amountDueFromCustomer) || 0);
  const balanceDue = Math.max(0, Number(figures.excessDueToCustomer) || 0);

  const ItemList = ({ heading, items }: { heading: string; items: ExchangeDisplayItem[] }) => (
    <div>
      <div style={sectionTitle}>{heading}</div>
      {items && items.length ? (
        items.map((it, i) => (
          <div key={it.invoiceItemId ?? `${it.assetId || "line"}-${i}`} style={row}>
            <span>{it.name || it.assetId || "—"}{it.quantity > 1 ? ` × ${it.quantity}` : ""}</span>
            <span>{money(it.amount)}</span>
          </div>
        ))
      ) : (
        <div style={{ ...row, color: "#888" }}>{L("None", "لا يوجد")}</div>
      )}
    </div>
  );

  return (
    <section aria-label={L("Exchange summary", "ملخص الاستبدال")} style={wrap}>
      <div style={title}>{L("Exchange Summary", "ملخص الاستبدال")}</div>

      {isLegacy && (
        <div style={{ ...note, color: "#7a5a00" }}>
          {exchangeDisplay.legacyFallback.message ||
            L(
              "Stored historical values are shown without recalculating tax.",
              "تُعرض القيم التاريخية المحفوظة دون إعادة احتساب الضريبة.",
            )}
        </div>
      )}

      <ItemList heading={L("Replacement items", "القطع البديلة")} items={cf.replacementSection} />

      {isTarget && (
        <div style={{ marginTop: thermal ? 4 : 8 }}>
          <div style={row}>
            <span>{L("Replacement subtotal", "إجمالي القطع البديلة")}</span>
            <span>{money(figures.newSubtotal)}</span>
          </div>
          <div style={row}>
            <span>{L("VAT on replacement items", "ضريبة القيمة المضافة")}</span>
            <span>{money(figures.newTax)}</span>
          </div>
          <div style={strongRow}>
            <span>{L("Replacement total", "إجمالي الاستبدال")}</span>
            <span>{money(figures.newGross)}</span>
          </div>
        </div>
      )}

      <ItemList heading={L("Returned item value / credit", "قيمة القطع المرتجعة / الرصيد")} items={cf.returnedCreditSection} />

      <div style={{ ...strongRow, marginTop: thermal ? 6 : 10, fontSize: baseFont + 2 }}>
        <span>
          {amountDue > 0
            ? L("Amount due from customer", "المبلغ المستحق من العميل")
            : balanceDue > 0
              ? L("Balance due to customer", "الرصيد المستحق للعميل")
              : L("Even exchange — no amount due", "استبدال متعادل — لا يوجد مبلغ مستحق")}
        </span>
        <span>{money(amountDue || balanceDue)}</span>
      </div>

      {settlement && settlement.source !== "unavailable" && (settlement.cashAmount > 0 || settlement.bankAmount > 0 || settlement.creditAmount > 0) && (
        <div style={{ marginTop: thermal ? 4 : 8 }}>
          <div style={sectionTitle}>
            {L("Settlement", "التسوية")}
            {settlement.source === "best_effort"
              ? ` — ${L("estimated", "تقديرية")}`
              : settlement.source === "linked_records"
                ? ` — ${L("confirmed", "مؤكدة")}`
                : ""}
          </div>
          {settlement.cashAmount > 0 && (
            <div style={row}><span>{L("Cash refund", "استرداد نقدي")}</span><span>{money(settlement.cashAmount)}</span></div>
          )}
          {settlement.bankAmount > 0 && (
            <div style={row}><span>{L("Bank refund", "استرداد بنكي")}</span><span>{money(settlement.bankAmount)}</span></div>
          )}
          {settlement.creditAmount > 0 && (
            <div style={row}><span>{L("Customer credit", "رصيد العميل")}</span><span>{money(settlement.creditAmount)}</span></div>
          )}
        </div>
      )}

      {isTarget && cf.policyNote && <div style={note}>{cf.policyNote}</div>}
    </section>
  );
}
