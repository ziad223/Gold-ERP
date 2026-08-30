"use client";

import { ChevronRight, Home } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const labels: Record<string, [string, string]> = {
  dashboard: ["Dashboard", "لوحة التحكم"],
  pos: ["Point of sale", "نقطة البيع"],
  sales: ["Invoices & sales", "الفواتير والمبيعات"],
  customers: ["Customers & CRM", "العملاء وCRM"],
  "customer-gold": ["Customer Gold Purchase", "شراء الذهب من العميل"],
  inventory: ["Assets & inventory", "الأصول والمخزون"],
  transfers: ["Branch transfers", "تحويلات الفروع"],
  workshop: ["Workshop", "الورشة"],
  "stock-audit": ["Inventory Count", "جرد المخزون"],
  "gold-center": ["Gold Center", "مركز الذهب"],
  suppliers: ["Suppliers & purchases", "الموردون والمشتريات"],
  accounting: ["Accounting", "الحسابات"],
  chart: ["Chart of accounts", "دليل الحسابات"],
  reports: ["Reports & analytics", "التقارير والتحليلات"],
  treasury: ["Treasury", "الخزنة"],
  employees: ["Employees", "الموظفون"],
  settings: ["Settings", "الإعدادات"],
  users: ["System accounts", "حسابات النظام"],
  audit: ["Audit log", "سجل التدقيق"],
  approvals: ["Approvals inbox", "طلبات الاعتماد"],
  notifications: ["Notifications", "الإشعارات"],
  "gift-vouchers": ["Gift Vouchers", "قسائم الهدايا"],
  installments: ["Installments", "الأقساط"],
  reservations: ["Reservations", "الحجوزات"],
  "search-print": ["Search & print", "البحث والطباعة"],
  "gold-by-weight": ["Gold By Weight", "ذهب بالوزن"],
  "gold-by-piece": ["Gold By Piece", "ذهب بالقطعة"],
  "diamond-jewellery": ["Diamond Jewellery", "مجوهرات الألماس"],
  "loose-diamond": ["Loose Diamond", "ألماس حر"],
  "gem-stone": ["Gem Stone Jewellery", "مجوهرات الأحجار الكريمة"],
  "loose-gem-stone": ["Loose Gem Stone", "حجر كريم حر"],
  pearl: ["Pearl Jewellery", "مجوهرات اللؤلؤ"],
  locations: ["Inventory Locations", "مواقع المخزون"],
  onboarding: ["Onboarding", "الإعداد الأولي"],
  tax: ["Tax Settings", "إعدادات الضرائب"],
  "barcode-codes": ["Barcode Codes", "أكواد الباركود"],
  history: ["History", "السجل"],
  drafts: ["Drafts", "المسودات"],
};

function getLabel(segment: string, locale: string) {
  const known = labels[segment];
  if (known) return known[locale === "ar" ? 1 : 0];
  if (/^[0-9a-f-]{12,}$/i.test(segment)) return locale === "ar" ? "التفاصيل" : "Details";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const locale = useLocale();
  const pathname = usePathname();
  const rtl = locale === "ar";
  const segments = pathname.split("/").filter(Boolean);
  const items = segments[0] === "dashboard" ? segments : ["dashboard", ...segments];

  return (
    <nav aria-label={rtl ? "مسار الصفحة" : "Page breadcrumb"} className="ux3-breadcrumbs" data-shell-breadcrumbs="true">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
        {items.map((segment, index) => {
          const isLast = index === items.length - 1;
          // `dashboard` is a display-only home crumb for non-dashboard pages.
          // Build descendants from the actual pathname segments so the
          // synthetic crumb never leaks into public URLs.
          const href = index === 0 ? "/dashboard" : `/${segments.slice(0, index).join("/")}`;
          return (
            <li key={`${segment}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-muted ${rtl ? "rotate-180" : ""}`} />}
              {isLast ? (
                <span aria-current="page" className="ux3-breadcrumb-current max-w-[min(70vw,28rem)] truncate font-bold">
                  {getLabel(segment, locale)}
                </span>
              ) : (
                <Link href={href} className="ux3-breadcrumb-link inline-flex min-w-0 items-center gap-1.5 truncate">
                  {index === 0 && <Home aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{getLabel(segment, locale)}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
