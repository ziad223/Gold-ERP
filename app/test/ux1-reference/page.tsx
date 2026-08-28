"use client";

import { useState } from "react";
import styles from "./ux1-reference.module.css";

type Locale = "ar" | "en";
type Theme = "dark" | "light";
type PrototypeKey = "pos" | "inventory" | "finance";

const copy = {
  en: {
    eyebrow: "DESIGN REFERENCE · READ-ONLY",
    breadcrumb: "DARFUS / Reference workspace",
    title: "Obsidian Atelier",
    subtitle: "A calm, precise operating surface for jewellery, gold and financial work.",
    surface: "Reference surface",
    locale: "Locale",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    pos: "POS reference",
    inventory: "Inventory / Asset",
    finance: "Accounting + Gold",
    operate: "01 / OPERATE",
    trace: "02 / TRACE",
    reconcile: "03 / RECONCILE",
    customer: "Customer",
    customerValue: "Elsayed Negm · CUS-0001",
    search: "Search by barcode, Asset or SKU",
    searchValue: "GWRNG21000002",
    invoiceItems: "Invoice items",
    itemType: "Item type",
    asset: "Asset",
    weight: "Net weight",
    making: "Making / g",
    tax: "VAT",
    voucher: "Gift Voucher",
    payment: "Payment",
    paymentMethods: "Payment methods",
    cash: "Cash",
    card: "Card",
    stoneValue: "Stone value",
    discount: "Discount",
    discountValue: "AED 0.00",
    remaining: "Remaining due",
    total: "Total",
    checkout: "Complete checkout",
    disabledHint: "Add a sellable Asset to enable checkout.",
    error: "Example error: barcode is not available in this branch.",
    loading: "Loading current availability…",
    status: "Available",
    barcode: "Barcode",
    branch: "Branch",
    location: "Location",
    supplier: "Supplier",
    gross: "Gross weight",
    karat: "Karat",
    currentCost: "Current cost",
    salePrice: "Sale price",
    marketRate: "Gold rate",
    journal: "Journal preview",
    reference: "Reference",
    account: "Account",
    inventoryAcquisition: "Inventory acquisition",
    accountsPayable: "Accounts payable",
    debit: "Debit",
    credit: "Credit",
    balance: "Balance",
    filter: "Filter: Posted",
    notes: "Read-only fixture. No business action is connected.",
    focusHint: "Focus the outline with Tab; controls are named and keyboard reachable.",
    liveReference: "Live reference · 12s ago",
    motionDemo: "Motion demo: tab transition · focus · status feedback · detail surface",
    staticFooter: "STATIC · READ-ONLY · NO API · NO BUSINESS WRITE",
    behaviorFooter: "DESIGN MAY CHANGE · SYSTEM BEHAVIOR MUST NOT CHANGE",
  },
  ar: {
    eyebrow: "مرجع التصميم · للعرض فقط",
    breadcrumb: "دارفوس / مساحة العمل المرجعية",
    title: "Obsidian Atelier",
    subtitle: "مساحة تشغيل هادئة ودقيقة للمجوهرات والذهب والأعمال المالية.",
    surface: "سطح مرجعي",
    locale: "اللغة",
    theme: "المظهر",
    dark: "داكن",
    light: "فاتح",
    pos: "مرجع نقطة البيع",
    inventory: "المخزون / الأصل",
    finance: "المحاسبة + الذهب",
    operate: "01 / تشغيل",
    trace: "02 / تتبّع",
    reconcile: "03 / مطابقة",
    customer: "العميل",
    customerValue: "Elsayed Negm · CUS-0001",
    search: "البحث بالباركود أو الأصل أو SKU",
    searchValue: "GWRNG21000002",
    invoiceItems: "بنود الفاتورة",
    itemType: "نوع الصنف",
    asset: "الأصل",
    weight: "الوزن الصافي",
    making: "المصنعية / جم",
    tax: "ضريبة القيمة المضافة",
    voucher: "قسيمة هدية",
    payment: "الدفع",
    paymentMethods: "طرق الدفع",
    cash: "نقدي",
    card: "بطاقة",
    stoneValue: "قيمة الحجر",
    discount: "الخصم",
    discountValue: "AED 0.00",
    remaining: "المتبقي",
    total: "الإجمالي",
    checkout: "إتمام البيع",
    disabledHint: "أضف أصلًا متاحًا لتفعيل البيع.",
    error: "خطأ توضيحي: الباركود غير متاح في هذا الفرع.",
    loading: "جارٍ تحميل التوافر الحالي…",
    status: "متاح",
    barcode: "الباركود",
    branch: "الفرع",
    location: "الموقع",
    supplier: "المورد",
    gross: "الوزن الإجمالي",
    karat: "العيار",
    currentCost: "التكلفة الحالية",
    salePrice: "سعر البيع",
    marketRate: "سعر الذهب",
    journal: "معاينة القيد",
    reference: "المرجع",
    account: "الحساب",
    inventoryAcquisition: "اقتناء مخزون",
    accountsPayable: "حسابات دائنة",
    debit: "مدين",
    credit: "دائن",
    balance: "الرصيد",
    filter: "التصفية: مرحّل",
    notes: "بيانات ثابتة للعرض فقط. لا يوجد إجراء تجاري متصل.",
    focusHint: "استخدم Tab لرؤية التركيز؛ كل عناصر التحكم مسماة وقابلة للوحة المفاتيح.",
    liveReference: "مرجع مباشر · منذ 12 ثانية",
    motionDemo: "عرض الحركة: انتقال التبويب · التركيز · حالة التشغيل · سطح التفاصيل",
    staticFooter: "ثابت · للعرض فقط · بلا API · بلا كتابة تجارية",
    behaviorFooter: "قد يتغير التصميم · لا يتغير سلوك النظام",
  },
} as const;

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "gold" | "positive" }) {
  return (
    <div className={`${styles.metric} ${styles[`metric${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
      <span>{label}</span>
      <strong dir="ltr">{value}</strong>
    </div>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <span>{label}</span>
      <input aria-label={label} value={value} readOnly />
    </label>
  );
}

function PosPrototype({ t }: { t: (typeof copy)[Locale] }) {
  const items = [
    { name: t.asset, id: "AST-PUR-1787085524749-1-1-dww3", value: "AED 2,377.79", meta: `${t.weight} · 4.2500 g` },
    { name: "Gold piece", id: "AST-PUR-1787085524749-1-2-gp21", value: "AED 1,184.00", meta: `${t.weight} · 2.1000 g` },
    { name: "Diamond accent", id: "AST-PUR-1787085524749-1-3-dd07", value: "AED 640.00", meta: `${t.stoneValue} · AED 640.00` },
  ];
  return (
    <section className={styles.prototype} data-testid="ux1-prototype-pos" aria-labelledby="ux1-pos-title">
      <div className={styles.prototypeHeader}>
        <div>
          <span className={styles.kicker}>{t.operate}</span>
          <h2 id="ux1-pos-title">{t.pos}</h2>
        </div>
        <span className={`${styles.status} ${styles.statusPositive}`}>{t.status}</span>
      </div>
      <div className={styles.posGrid}>
        <div className={styles.stack}>
          <div className={styles.sectionLabel}>{t.customer}</div>
          <Field label={t.customer} value={t.customerValue} wide />
          <div className={styles.searchField}>
            <label htmlFor="ux1-pos-search">{t.search}</label>
            <input id="ux1-pos-search" aria-label={t.search} value={t.searchValue} readOnly />
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          </div>
          <div className={styles.readonlyNote}>{t.notes}</div>
        </div>
        <div className={styles.stack}>
          <div className={styles.sectionLabel}>{t.invoiceItems}</div>
          <div className={styles.itemList}>
            {items.map((item) => <div className={styles.itemRow} key={item.id}>
              <div><strong>{item.name}</strong><small dir="ltr">{item.id}</small><small>{item.meta}</small></div>
              <strong dir="ltr">{item.value}</strong>
            </div>)}
          </div>
          <div className={styles.detailLine}><span>{t.making}</span><strong dir="ltr">AED 120.00</strong></div>
          <div className={styles.detailLine}><span>{t.stoneValue}</span><strong dir="ltr">AED 640.00</strong></div>
          <div className={styles.detailLine}><span>{t.discount}</span><strong dir="ltr">{t.discountValue}</strong></div>
          <div className={styles.detailLine}><span>{t.tax}</span><strong dir="ltr">AED 332.89</strong></div>
          <div className={styles.divider} />
          <div className={styles.sectionLabel}>{t.paymentMethods}</div>
          <div className={styles.paymentGrid}>
            <button type="button" className={styles.optionButton} aria-pressed="true">{t.cash}</button>
            <button type="button" className={styles.optionButton} aria-pressed="false">{t.card}</button>
            <button type="button" className={styles.optionButton} aria-pressed="false">{t.voucher}</button>
          </div>
        </div>
        <aside className={styles.totalPanel} aria-label={t.total}>
          <Metric label={t.remaining} value="AED 2,710.68" />
          <Metric label={t.tax} value="AED 332.89" />
          <Metric label={t.total} value="AED 2,710.68" tone="gold" />
          <button type="button" className={styles.primaryButton} disabled>{t.checkout}</button>
          <p className={styles.disabledHint}>{t.disabledHint}</p>
          <p className={styles.errorState} role="alert">{t.error}</p>
          <p className={styles.loadingState} aria-live="polite">{t.loading}</p>
        </aside>
      </div>
    </section>
  );
}

function InventoryPrototype({ t }: { t: (typeof copy)[Locale] }) {
  return (
    <section className={styles.prototype} data-testid="ux1-prototype-inventory" aria-labelledby="ux1-inventory-title">
      <div className={styles.prototypeHeader}>
          <div><span className={styles.kicker}>{t.trace}</span><h2 id="ux1-inventory-title">{t.inventory}</h2></div>
        <span className={`${styles.status} ${styles.statusPositive}`}>{t.status}</span>
      </div>
      <div className={styles.inventoryLayout}>
        <div className={styles.assetHero}>
          <div className={styles.assetMark} aria-hidden="true">A</div>
          <div><span className={styles.muted}>{t.asset}</span><h3 dir="ltr">AST-PUR-1787085524749-1-1-dww3</h3><span className={styles.code} dir="ltr">GWRNG21000002</span></div>
        </div>
        <div className={styles.fieldGrid}>
          <Field label={t.barcode} value="GWRNG21000002" />
          <Field label={t.branch} value="Branch-2" />
          <Field label={t.location} value="Main showroom" />
          <Field label={t.supplier} value="Approved Supplier" />
          <Field label={t.gross} value="4.5000 g" />
          <Field label={t.weight} value="4.2500 g" />
          <Field label={t.karat} value="21K" />
          <Field label={t.making} value="AED 120.00" />
        </div>
        <div className={styles.summaryStrip}>
          <Metric label={t.currentCost} value="AED 2,090.00" />
          <Metric label={t.salePrice} value="AED 2,377.79" tone="gold" />
          <Metric label={t.marketRate} value="AED 491.20 / g" />
        </div>
      </div>
    </section>
  );
}

function FinancePrototype({ t }: { t: (typeof copy)[Locale] }) {
  return (
    <section className={styles.prototype} data-testid="ux1-prototype-finance" aria-labelledby="ux1-finance-title">
      <div className={styles.prototypeHeader}>
          <div><span className={styles.kicker}>{t.reconcile}</span><h2 id="ux1-finance-title">{t.finance}</h2></div>
        <span className={styles.timestamp}>08:42:18 · AED</span>
      </div>
      <div className={styles.financeTop}>
        <div><span className={styles.muted}>{t.marketRate}</span><strong className={styles.rate} dir="ltr">AED 491.20 <small>/ g</small></strong><span className={styles.fresh}>● {t.liveReference}</span></div>
        <div className={styles.filterBox} role="group" aria-label={t.filter}><span>{t.filter}</span><span aria-hidden="true">⌄</span></div>
      </div>
      <div className={styles.tableWrap} role="region" aria-label={t.journal} tabIndex={0}>
        <table>
          <caption>{t.journal}</caption>
          <thead><tr><th scope="col">{t.reference}</th><th scope="col">{t.account}</th><th scope="col">{t.debit}</th><th scope="col">{t.credit}</th><th scope="col">{t.balance}</th></tr></thead>
          <tbody>
            <tr><th scope="row" dir="ltr">JE-1787085524749</th><td>{t.inventoryAcquisition}</td><td dir="ltr">2,090.00</td><td dir="ltr">—</td><td dir="ltr">2,090.00</td></tr>
            <tr><th scope="row" dir="ltr">VAT-1787085524749</th><td>{t.tax}</td><td dir="ltr">292.60</td><td dir="ltr">—</td><td dir="ltr">2,382.60</td></tr>
            <tr><th scope="row" dir="ltr">AP-1787085524749</th><td>{t.accountsPayable}</td><td dir="ltr">—</td><td dir="ltr">2,382.60</td><td dir="ltr">0.00</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function UX1ReferencePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  const [prototype, setPrototype] = useState<PrototypeKey>("pos");
  const t = copy[locale];

  return (
    <main className={`${styles.app} ${theme === "light" ? styles.light : styles.dark}`} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-testid="ux1-reference-root" data-theme={theme}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.brandGlyph} aria-hidden="true">◆</span><span>DARFUS</span><span className={styles.brandSub}>OBSIDIΑN ATELIER</span></div>
        <div className={styles.controls}>
          <span className={styles.controlLabel}>{t.locale}</span>
          <button type="button" className={styles.controlButton} aria-label="العربية" aria-pressed={locale === "ar"} onClick={() => setLocale("ar")}>AR</button>
          <button type="button" className={styles.controlButton} aria-label="English" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
          <span className={styles.controlDivider} aria-hidden="true" />
          <span className={styles.controlLabel}>{t.theme}</span>
          <button type="button" className={styles.controlButton} aria-label={t.dark} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>◐</button>
          <button type="button" className={styles.controlButton} aria-label={t.light} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>☼</button>
        </div>
      </header>
      <div className={styles.pageShell}>
        <section className={styles.hero}>
          <div><div className={styles.breadcrumb}>{t.breadcrumb}</div><span className={styles.eyebrow}>{t.eyebrow}</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
          <div className={styles.heroNote}><span>UX-1</span><strong>{t.surface}</strong><small>{t.focusHint}</small></div>
        </section>
        <nav className={styles.prototypeNav} aria-label={t.surface} role="tablist">
          {([["pos", t.pos], ["inventory", t.inventory], ["finance", t.finance]] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={prototype === key} className={prototype === key ? styles.navActive : ""} onClick={() => setPrototype(key)}>{label}<span aria-hidden="true">→</span></button>
          ))}
        </nav>
        <div className={styles.motionDemo} data-testid="ux1r-motion-demo" aria-label={t.motionDemo}><span>↗</span>{t.motionDemo}</div>
        <div className={styles.prototypeStage}>
          {prototype === "pos" && <PosPrototype t={t} />}
          {prototype === "inventory" && <InventoryPrototype t={t} />}
          {prototype === "finance" && <FinancePrototype t={t} />}
        </div>
        <footer className={styles.footer}><span>{t.staticFooter}</span><span>{t.behaviorFooter}</span></footer>
      </div>
    </main>
  );
}
