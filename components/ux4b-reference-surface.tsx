"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { Checkbox, Radio, Switch } from "@/components/ui/form-controls";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
import { Popover } from "@/components/ui/popover";
import { Select, Combobox } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";

type Locale = "en" | "ar";

const copy = {
  en: {
    title: "UX4 Core Components Reference",
    subtitle: "Static visual and accessibility evidence surface · no API · no business write",
    dark: "Dark",
    light: "Light",
    switchToArabic: "العربية",
    switchToEnglish: "English",
    buttons: "Buttons",
    buttonPrimary: "Primary",
    buttonSecondary: "Secondary",
    buttonGhost: "Ghost",
    buttonDanger: "Danger",
    buttonDisabled: "Disabled",
    buttonLoading: "Loading",
    iconButton: "Icon only",
    inputs: "Inputs",
    textInput: "Text input",
    searchInput: "Search input",
    textarea: "Textarea",
    readonly: "Readonly",
    disabled: "Disabled",
    error: "Error",
    success: "Success",
    select: "Select",
    combobox: "Combobox",
    choose: "Choose a profile",
    gold: "Gold By Piece",
    diamond: "Diamond",
    pearl: "Pearl",
    formControls: "Form controls",
    agree: "I agree to the static reference condition",
    optionOne: "Option A",
    optionTwo: "Option B",
    enabled: "Enabled",
    cards: "Cards, badges and status",
    baseCard: "Base card",
    selectedCard: "Selected summary",
    warning: "Warning",
    danger: "Danger",
    info: "Info",
    neutral: "Neutral",
    alerts: "Alerts and toast",
    information: "Static information",
    attention: "Static warning",
    errorAlert: "Static error",
    showToast: "Show toast",
    overlay: "Modal, drawer, popover and tooltip",
    openModal: "Open modal",
    openDrawer: "Open drawer",
    openPopover: "Open popover",
    tooltipLabel: "More information",
    tooltipText: "This is a local visual reference. It is available by hover, focus and click.",
    overlayText: "Overlays are presentation-only fixtures. Escape closes the active surface.",
    tabs: "Tabs",
    firstTab: "Overview",
    secondTab: "Details",
    thirdTab: "History",
    pagination: "Pagination",
    previous: "Previous",
    next: "Next",
    states: "Empty, loading and error states",
    empty: "No reference rows",
    emptyDescription: "The empty state is static and does not query a service.",
    loading: "Loading static preview…",
    errorTitle: "Reference error state",
    errorDescription: "This error is intentionally local and has no retry side effect.",
    table: "Table foundation",
    reference: "Reference",
    value: "Value",
    state: "State",
    rowOne: "Asset identity",
    rowTwo: "Barcode",
    rowThree: "Availability",
    default: "Default",
    selected: "Selected",
    helper: "Helper text remains visible beside the control.",
    validation: "Validation text is visible and associated with the field.",
    staticNote: "STATIC · READ-ONLY · NO FETCH · NO FORM ACTION · NO BUSINESS API",
  },
  ar: {
    title: "مرجع مكونات UX4 الأساسية",
    subtitle: "سطح إثبات بصري وإتاحة ثابت · بلا API · بلا كتابة تجارية",
    dark: "داكن",
    light: "فاتح",
    switchToArabic: "العربية",
    switchToEnglish: "English",
    buttons: "الأزرار",
    buttonPrimary: "أساسي",
    buttonSecondary: "ثانوي",
    buttonGhost: "شفاف",
    buttonDanger: "خطر",
    buttonDisabled: "معطل",
    buttonLoading: "جارٍ التحميل",
    iconButton: "زر بأيقونة فقط",
    inputs: "حقول الإدخال",
    textInput: "حقل نصي",
    searchInput: "حقل بحث",
    textarea: "منطقة نص",
    readonly: "للقراءة فقط",
    disabled: "معطل",
    error: "خطأ",
    success: "نجاح",
    select: "قائمة اختيار",
    combobox: "قائمة بحث واختيار",
    choose: "اختر ملفًا",
    gold: "ذهب بالقطعة",
    diamond: "ألماس",
    pearl: "لؤلؤ",
    formControls: "عناصر النماذج",
    agree: "أوافق على حالة المرجع الثابتة",
    optionOne: "الخيار أ",
    optionTwo: "الخيار ب",
    enabled: "مفعل",
    cards: "البطاقات والشارات والحالات",
    baseCard: "بطاقة أساسية",
    selectedCard: "ملخص محدد",
    warning: "تحذير",
    danger: "خطر",
    info: "معلومات",
    neutral: "محايد",
    alerts: "التنبيهات والإشعار",
    information: "معلومة ثابتة",
    attention: "تحذير ثابت",
    errorAlert: "خطأ ثابت",
    showToast: "إظهار الإشعار",
    overlay: "النافذة والدرج والمنبثق والتلميح",
    openModal: "فتح النافذة",
    openDrawer: "فتح الدرج",
    openPopover: "فتح المنبثق",
    tooltipLabel: "معلومات إضافية",
    tooltipText: "هذا مرجع بصري محلي. يعمل بالتمرير والتركيز والنقر.",
    overlayText: "الأسطح المنبثقة ثابتة للعرض فقط. اضغط Escape لإغلاق السطح النشط.",
    tabs: "علامات التبويب",
    firstTab: "نظرة عامة",
    secondTab: "التفاصيل",
    thirdTab: "السجل",
    pagination: "التقسيم إلى صفحات",
    previous: "السابق",
    next: "التالي",
    states: "حالات الفراغ والتحميل والخطأ",
    empty: "لا توجد صفوف مرجعية",
    emptyDescription: "الحالة الفارغة ثابتة ولا تستعلم من خدمة.",
    loading: "جارٍ تحميل المعاينة الثابتة…",
    errorTitle: "حالة خطأ مرجعية",
    errorDescription: "هذا الخطأ محلي عمدًا ولا يسبب أثرًا عند إعادة المحاولة.",
    table: "أساس الجدول",
    reference: "المرجع",
    value: "القيمة",
    state: "الحالة",
    rowOne: "هوية الأصل",
    rowTwo: "الباركود",
    rowThree: "التوافر",
    default: "افتراضي",
    selected: "محدد",
    helper: "يبقى النص المساعد ظاهرًا بجانب عنصر التحكم.",
    validation: "نص التحقق ظاهر ومرتبط بالحقل.",
    staticNote: "ثابت · للقراءة فقط · بلا جلب · بلا إجراء نموذج · بلا API تجاري",
  },
} as const;

export default function UX4ComponentsReferencePage({ locale }: { locale: Locale }) {
  const hasLocaleProvider = true;
  const t = copy[locale];
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedProfile, setSelectedProfile] = useState("gold");
  const [query, setQuery] = useState("");
  const [switchOn, setSwitchOn] = useState(true);
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState("overview");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const initialHtmlClassName = useRef<string | null>(null);

  useEffect(() => {
    if (initialHtmlClassName.current === null) initialHtmlClassName.current = document.documentElement.className;
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => {
      if (initialHtmlClassName.current !== null) document.documentElement.className = initialHtmlClassName.current;
    };
  }, [theme]);

  return (
    <main className={`${theme} min-h-screen bg-background text-foreground`} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-testid="ux4b-reference-root" data-theme={theme}>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">UX4B · READ-ONLY REFERENCE</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Reference controls">
            <Button type="button" size="sm" variant={locale === "ar" ? "primary" : "secondary"} aria-pressed={locale === "ar"}>{t.switchToArabic}</Button>
            <Button type="button" size="sm" variant={locale === "en" ? "primary" : "secondary"} aria-pressed={locale === "en"}>{t.switchToEnglish}</Button>
            <Button type="button" size="sm" variant={theme === "dark" ? "primary" : "secondary"} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>{t.dark}</Button>
            <Button type="button" size="sm" variant={theme === "light" ? "primary" : "secondary"} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>{t.light}</Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="Core component evidence">
          <Card className="space-y-4 p-5" data-testid="ux4b-buttons">
            <h2 className="text-lg font-black">{t.buttons}</h2>
            <div className="flex flex-wrap gap-2">
              <Button type="button">{t.buttonPrimary}</Button>
              <Button type="button" variant="secondary">{t.buttonSecondary}</Button>
              <Button type="button" variant="ghost">{t.buttonGhost}</Button>
              <Button type="button" variant="danger">{t.buttonDanger}</Button>
              <Button type="button" disabled>{t.buttonDisabled}</Button>
              <Button type="button" aria-busy="true"><span aria-hidden="true">◌</span>{t.buttonLoading}</Button>
              <Button type="button" variant="secondary" aria-label={t.iconButton}>◆</Button>
            </div>
          </Card>

          <Card className="space-y-4 p-5" data-testid="ux4b-inputs">
            <h2 className="text-lg font-black">{t.inputs}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold"><span>{t.textInput}</span><Input defaultValue="Example text" /></label>
              <label className="space-y-1 text-xs font-bold"><span>{t.searchInput}</span><Input type="search" placeholder={t.searchInput} /></label>
              <label className="space-y-1 text-xs font-bold"><span>{t.readonly}</span><Input value="Read-only value" readOnly /></label>
              <label className="space-y-1 text-xs font-bold"><span>{t.disabled}</span><Input value="Disabled value" disabled readOnly /></label>
              <label className="space-y-1 text-xs font-bold"><span>{t.textarea}</span><Textarea defaultValue="Long text remains readable and wraps safely in both directions." /></label>
              <div className="space-y-2"><label className="space-y-1 text-xs font-bold"><span>{t.error}</span><Input aria-invalid="true" defaultValue="Invalid example" /></label><p className="text-xs text-destructive" role="alert">{t.validation}</p></div>
            </div>
            <p className="text-xs text-muted-foreground">{t.helper}</p>
          </Card>
        </section>

        <section aria-label="Data toolbar evidence" data-testid="ux4b-toolbar">
          <Card className="space-y-3 overflow-hidden p-0">
            <h2 className="px-5 pt-5 text-lg font-black">Data toolbar / filter presentation</h2>
            <DataToolbar query={query} onQueryChange={setQuery} placeholder={t.searchInput} filters={[{ id: "state", label: t.state, value: "all", options: [{ value: "all", label: t.default }, { value: "selected", label: t.selected }], onChange: () => undefined }]} resultCount={3} resultLabel={t.reference} onReset={() => setQuery("")} resetLabel={t.default} />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="Selection and form control evidence">
          <Card className="space-y-4 p-5" data-testid="ux4b-selects">
            <h2 className="text-lg font-black">{t.select} / {t.combobox}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold"><span>{t.select}</span><Select aria-label={t.select} defaultValue="gold"><option value="gold">{t.gold}</option><option value="diamond">{t.diamond}</option><option value="pearl">{t.pearl}</option></Select></label>
              <label className="space-y-1 text-xs font-bold"><span>{t.choose}</span><Combobox aria-label={t.combobox} value={selectedProfile} options={[{ value: "gold", label: t.gold }, { value: "diamond", label: t.diamond }, { value: "pearl", label: t.pearl, disabled: true }]} onValueChange={setSelectedProfile} placeholder={t.choose} /></label>
              <label className="space-y-1 text-xs font-bold"><span>{t.select} · disabled</span><NativeSelect aria-label={`${t.select} disabled`} disabled defaultValue="gold"><option value="gold">{t.gold}</option></NativeSelect></label>
            </div>
          </Card>

          <Card className="space-y-4 p-5" data-testid="ux4b-form-controls">
            <h2 className="text-lg font-black">{t.formControls}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-h-10 items-center gap-3 text-sm"><Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} />{t.agree}</label>
              <div className="flex items-center gap-3 text-sm"><Radio name="static-choice" defaultChecked />{t.optionOne}<Radio name="static-choice" />{t.optionTwo}</div>
              <label className="flex items-center gap-3 text-sm"><Switch checked={switchOn} onCheckedChange={setSwitchOn} aria-label={t.enabled} />{t.enabled}: {switchOn ? t.success : t.disabled}</label>
              <label className="flex items-center gap-3 text-sm opacity-60"><Switch checked={false} onCheckedChange={() => undefined} aria-label={`${t.enabled} disabled`} disabled />{t.disabled}</label>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="Status and feedback evidence">
          <Card className="space-y-4 p-5" data-testid="ux4b-status">
            <h2 className="text-lg font-black">{t.cards}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-4"><p className="text-xs text-muted-foreground">{t.baseCard}</p><p className="mt-2 font-bold">{t.default}</p></div>
              <div className="rounded-2xl border-2 border-brand-500 bg-brand-500/5 p-4"><p className="text-xs text-muted-foreground">{t.selectedCard}</p><p className="mt-2 font-bold">{t.selected}</p></div>
            </div>
            <div className="flex flex-wrap gap-2"><Badge tone="green">{t.success}</Badge><Badge tone="amber">{t.warning}</Badge><Badge tone="rose">{t.danger}</Badge><Badge tone="blue">{t.info}</Badge><Badge tone="slate">{t.neutral}</Badge></div>
          </Card>

          <Card className="space-y-3 p-5" data-testid="ux4b-alerts">
            <h2 className="text-lg font-black">{t.alerts}</h2>
            <Alert tone="info" title={t.information}>{t.helper}</Alert>
            <Alert tone="warning" title={t.attention}>{t.overlayText}</Alert>
            <Alert tone="danger" title={t.errorAlert}>{t.validation}</Alert>
            <Button type="button" variant="secondary" onClick={() => setToastOpen(true)}>{t.showToast}</Button>
            {toastOpen && <div className="space-y-2"><Toast>{t.information}</Toast><Button type="button" size="sm" variant="ghost" onClick={() => setToastOpen(false)}>{t.default}</Button></div>}
          </Card>
        </section>

        <section className="space-y-4" aria-label="Overlay evidence" data-testid="ux4b-overlays">
          <h2 className="text-lg font-black">{t.overlay}</h2>
          <Card className="flex flex-wrap items-center gap-3 p-5">
            <Button type="button" onClick={() => setModalOpen(true)}>{t.openModal}</Button>
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(true)}>{t.openDrawer}</Button>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen} label={t.openPopover} trigger={<span className="px-2">◈</span>}><p className="text-xs leading-5">{t.overlayText}</p></Popover>
            <Tooltip label={t.tooltipLabel} content={t.tooltipText}><span className="grid h-10 w-10 place-items-center rounded-full border border-border text-sm">ⓘ</span></Tooltip>
            <InfoTooltip label={t.tooltipLabel} text={t.tooltipText} />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="Tabs and pagination evidence">
          <Card className="space-y-4 p-5" data-testid="ux4b-tabs"><h2 className="text-lg font-black">{t.tabs}</h2><Tabs aria-label={t.tabs} value={tab} onValueChange={setTab} items={[{ value: "overview", label: t.firstTab }, { value: "details", label: t.secondTab }, { value: "history", label: t.thirdTab }, { value: "disabled", label: t.disabled, disabled: true }]} /><p className="text-sm text-muted-foreground">{tab === "overview" ? t.firstTab : tab === "details" ? t.secondTab : t.thirdTab}</p></Card>
          <Card className="space-y-4 p-5" data-testid="ux4b-pagination"><h2 className="text-lg font-black">{t.pagination}</h2><Pagination page={page} pageCount={3} onPageChange={setPage} previousLabel={t.previous} nextLabel={t.next} /></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="State and table evidence">
          <Card className="space-y-3 p-5" data-testid="ux4b-states"><h2 className="text-lg font-black">{t.states}</h2><EmptyState title={t.empty} description={t.emptyDescription} /><LoadingState message={t.loading} />{hasLocaleProvider ? <ErrorState title={t.errorTitle} message={t.errorDescription} /> : <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{t.errorTitle}: {t.errorDescription}</div>}</Card>
          <Card className="space-y-3 p-5" data-testid="ux4b-table"><h2 className="text-lg font-black">{t.table}</h2><Table caption={t.table}><TableHeader><TableRow><TableHead>{t.reference}</TableHead><TableHead>{t.value}</TableHead><TableHead>{t.state}</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>{t.rowOne}</TableCell><TableCell><span dir="ltr">AST-REFERENCE-01</span></TableCell><TableCell><Badge tone="green">{t.success}</Badge></TableCell></TableRow><TableRow><TableCell>{t.rowTwo}</TableCell><TableCell><span dir="ltr">BAR-REFERENCE-01</span></TableCell><TableCell><Badge tone="blue">{t.info}</Badge></TableCell></TableRow><TableRow><TableCell>{t.rowThree}</TableCell><TableCell>{t.selected}</TableCell><TableCell><Badge tone="amber">{t.warning}</Badge></TableCell></TableRow></TableBody></Table></Card>
        </section>

        <footer className="rounded-2xl border border-border bg-surface-muted p-4 text-center text-[11px] font-black tracking-wide text-muted-foreground">{t.staticNote}</footer>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t.openModal} description={t.overlayText}><p className="text-sm text-muted-foreground">{t.tooltipText}</p><Button type="button" variant="secondary" className="mt-4" onClick={() => setModalOpen(false)}>{t.openModal}</Button></Modal>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t.openDrawer} description={t.overlayText} side={locale === "ar" ? "start" : "end"}><p className="text-sm text-muted-foreground">{t.tooltipText}</p><Button type="button" variant="secondary" className="mt-4" onClick={() => setDrawerOpen(false)}>{t.openDrawer}</Button></Drawer>
    </main>
  );
}


