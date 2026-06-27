"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download, Mail, Phone, UserPlus, Edit2, Trash2, CheckCircle, AlertTriangle, Eye, Gift } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { exportData } from "@/lib/export/export-service";
import { formatCurrency } from "@/lib/utils";
import { useCustomers, useCustomerMutations } from "@/hooks/use-customers";
import { usePermissions } from "@/hooks/use-permissions";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import type { Customer, CustomerTier } from "@/lib/types";

const initialCustomer = {
  id: "",
  name: "",
  phone: "",
  email: "",
  tier: "Standard" as CustomerTier,
  notes: "",
  status: "active" as "active" | "inactive",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function CustomersPage() {
  const t = useTranslations("Customers");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const exportT = useTranslations("PrintExport");
  const locale = useLocale();
  const { company } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreateCustomers = hasPermission("customers.create");
  const canUpdateCustomers = hasPermission("customers.update");
  const canDeleteCustomers = hasPermission("customers.delete");
  const canDeactivateCustomers = hasPermission("customers.deactivate");
  const canReactivateCustomers = hasPermission("customers.reactivate");

  const [queryState, setQueryState] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  // Custom hook for repository data
  const {
    items: customers,
    page: currentPage,
    pageSize: resolvedPageSize,
    total: resultTotal,
    totalPages,
    loading,
    error,
    setQuery,
    refresh,
    fetchAllMatching,
  } = useCustomers({
    page,
    pageSize,
    search: queryState,
    filters: {
      tier: tierFilter,
      balance: balanceFilter,
      status: statusFilter,
    },
  });

  const { addCustomer, updateCustomer, deactivateCustomer, reactivateCustomer, deleteCustomer } = useCustomerMutations();

  // Modals state
  const [open, setOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [form, setForm] = useState(initialCustomer);
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setForm(initialCustomer);
    setOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setIsEdit(true);
    setForm({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      tier: c.tier,
      notes: c.notes || "",
      status: c.status || "active",
    });
    setOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(common("required"));
      return;
    }

    try {
      if (isEdit) {
        const res = await updateCustomer(form.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          tier: form.tier,
          notes: form.notes.trim(),
        });
        if (res.success) {
          toast.success(common("saved"));
          setOpen(false);
          await refresh();
        } else {
          toast.error(res.error?.message || "Error saving customer");
        }
      } else {
        const res = await addCustomer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          tier: form.tier,
          balance: 0,
          purchases: 0,
          lastVisit: new Date().toISOString().slice(0, 10),
          status: "active",
          notes: form.notes.trim(),
        });
        if (res.success) {
          toast.success(common("saved"));
          setOpen(false);
          await refresh();
        } else {
          toast.error(res.error?.message || "Error saving customer");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving customer");
    }
  };

  const handleOpenDeactivate = (c: Customer) => {
    setSelectedCustomer(c);
    setDeactivateReason("");
    setDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await deactivateCustomer(selectedCustomer.id, deactivateReason.trim());
      if (res.success) {
        toast.success(locale === "ar" ? "تم تعطيل الحساب بنجاح" : "Account deactivated successfully");
        setDeactivateOpen(false);
        setSelectedCustomer(null);
        await refresh();
      } else {
        toast.error(res.error?.message || "Failed to deactivate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate");
    }
  };

  const handleReactivate = async (c: Customer) => {
    try {
      const res = await reactivateCustomer(c.id);
      if (res.success) {
        toast.success(locale === "ar" ? "تم إعادة تنشيط الحساب" : "Account reactivated successfully");
        await refresh();
      } else {
        toast.error(res.error?.message || "Failed to reactivate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate");
    }
  };

  const handleDeleteCustomer = async (c: Customer) => {
    if (!window.confirm(common("deleteConfirm"))) return;
    try {
      const res = await deleteCustomer(c.id);
      if (res.success) {
        toast.success(locale === "ar" ? "تم حذف العميل نهائيًا" : "Customer deleted permanently");
        await refresh();
      } else {
        toast.error(res.error?.message || "Failed to delete");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    fetchAllMatching()
      .then((rows) => {
        const result = exportData({
          fileName: "customers.csv",
          title: t("title"),
          format: "csv",
          rows,
          locale,
          columns: [
            { key: "id", header: exportT("id") },
            { key: "name", header: t("name") },
            { key: "phone", header: exportT("phone") },
            { key: "email", header: exportT("email"), value: (item) => item.email || "" },
            { key: "tier", header: exportT("tier") },
            { key: "balance", header: t("balance") },
            {
              key: "status",
              header: exportT("status"),
              value: (item) => item.status === "inactive" ? common("inactive") : common("active"),
            },
          ],
        });

        if (result.ok) toast.success(exportT("exportReady"));
        else toast.error(result.errorCode === "empty-data" ? exportT("noDataToExport") : exportT("exportFailed"));
      })
      .catch(() => toast.error(exportT("exportFailed")))
      .finally(() => setIsExporting(false));
  };

  const handleQueryChange = (q: string) => {
    setQueryState(q);
    setPage(1);
    setQuery((prev) => ({ ...prev, page: 1, search: q }));
  };

  const handleTierChange = (tier: string) => {
    setTierFilter(tier);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, tier },
    }));
  };

  const handleBalanceChange = (balance: string) => {
    setBalanceFilter(balance);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, balance },
    }));
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, status },
    }));
  };

  const handleResetFilters = () => {
    setQueryState("");
    setTierFilter("all");
    setBalanceFilter("all");
    setStatusFilter("all");
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: "",
      filters: { ...prev.filters, tier: "all", balance: "all", status: "all" },
    }));
  };

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = Number(value);
    setPageSize(nextPageSize);
    setPage(1);
    setQuery((prev) => ({ ...prev, page: 1, pageSize: nextPageSize }));
  };

  const goToPage = (nextPage: number) => {
    const safeTotalPages = Math.max(totalPages || 1, 1);
    const safePage = Math.min(Math.max(nextPage, 1), safeTotalPages);
    setPage(safePage);
    setQuery((prev) => ({ ...prev, page: safePage }));
  };

  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const pageSummaryHint = locale === "ar" ? "إجمالي الصفحة الحالية فقط" : "Current page only";
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const firstVisibleRecord = resultTotal === 0 ? 0 : ((currentPage - 1) * resolvedPageSize) + 1;
  const lastVisibleRecord = resultTotal === 0 ? 0 : Math.min(resultTotal, firstVisibleRecord + customers.length - 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/customers/loyalty"><Button variant="secondary"><Gift className="h-4 w-4" />{t("loyaltyAndSegments")}</Button></Link>
            <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4" /> {common("export")}
            </Button>
            {canCreateCustomers && (
              <Button onClick={handleOpenAdd}>
                <UserPlus className="h-4 w-4" /> {t("newCustomer")}
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={() => refresh()} />}

      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
        {t("referenceBalanceHint")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t("totalCustomers"), customers.length],
          [t("vipCustomers"), customers.filter((item) => item.tier === "VIP").length],
          [t("totalReferenceBalance"), money(customers.reduce((sum, item) => sum + (Number(item.balance) || 0), 0))],
          [locale === "ar" ? "عملاء نشطون" : "Active Customers", customers.filter((item) => item.status !== "inactive").length],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{value}</p>
            <p className="mt-2 text-[11px] text-slate-400">{pageSummaryHint}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <DataToolbar
          query={queryState}
          onQueryChange={handleQueryChange}
          placeholder={t("search")}
          resultCount={resultTotal}
          resultLabel={filtersT("results")}
          resetLabel={filtersT("reset")}
          onReset={handleResetFilters}
          filters={[
            {
              id: "tier",
              label: t("tier"),
              value: tierFilter,
              onChange: handleTierChange,
              options: [
                { value: "all", label: filtersT("allTiers") },
                { value: "VIP", label: "VIP" },
                { value: "Gold", label: t("gold") },
                { value: "Standard", label: t("standard") },
              ],
            },
            {
              id: "balance",
              label: t("referenceBalance"),
              value: balanceFilter,
              onChange: handleBalanceChange,
              options: [
                { value: "all", label: common("all") },
                { value: "due", label: t("hasReferenceBalance") },
                { value: "clear", label: t("noReferenceBalance") },
              ],
            },
            {
              id: "status",
              label: common("status"),
              value: statusFilter,
              onChange: handleStatusChange,
              options: [
                { value: "all", label: filtersT("allStatuses") },
                { value: "active", label: common("active") },
                { value: "inactive", label: common("inactive") },
              ],
            },
          ]}
        />

        {loading ? (
          <LoadingState message={common("loading")} />
        ) : customers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-start text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                <tr>
                  <th className="px-5 py-4 text-start">{t("customer")}</th>
                  <th className="px-5 py-4 text-start">{t("tier")}</th>
                  <th className="px-5 py-4 text-start">{t("contact")}</th>
                  <th className="px-5 py-4 text-start">{t("purchases")}</th>
                  <th className="px-5 py-4 text-start">{t("referenceBalance")} <span className="ms-1 rounded bg-slate-200 px-1 text-[8px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{t("referenceBadge")}</span></th>
                  <th className="px-5 py-4 text-start">{common("status")}</th>
                  <th className="px-5 py-4 text-end">{common("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-navy-950/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          {customer.name.slice(0, 1)}
                        </span>
                        <div>
                          <Link
                            href={`/customers/${customer.id}`}
                            className="font-extrabold text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                          >
                            {customer.name}
                          </Link>
                          <p className="mt-1 text-[10px] text-slate-400">{customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          customer.tier === "VIP"
                            ? "violet"
                            : customer.tier === "Gold"
                            ? "amber"
                            : "slate"
                        }
                      >
                        {customer.tier}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Phone className="h-3.5 w-3.5" />
                        {customer.phone}
                      </p>
                      {customer.email && (
                        <p className="mt-1 flex items-center gap-2 text-slate-400">
                          <Mail className="h-3.5 w-3.5" />
                          {customer.email}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-extrabold">{money(customer.purchases)}</td>
                    <td className="px-5 py-4">
                      <span className={customer.balance ? "font-bold text-slate-600 dark:text-slate-300" : "text-slate-400"}>
                        {money(customer.balance)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {customer.status !== "inactive" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {common("active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                          {common("inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <div className="flex justify-end gap-1">
                        <Link href={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm" title={common("view")}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {canUpdateCustomers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(customer)}
                            title={common("edit")}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {customer.status !== "inactive" ? (
                          canDeactivateCustomers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                              onClick={() => handleOpenDeactivate(customer)}
                              title={common("deactivate")}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </Button>
                          )
                        ) : (
                          canReactivateCustomers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              onClick={() => handleReactivate(customer)}
                              title={common("reactivate")}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}
                        {canDeleteCustomers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            onClick={() => handleDeleteCustomer(customer)}
                            title={common("delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
        )}

        {!loading && resultTotal > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-500">
              {locale === "ar"
                ? `عرض ${firstVisibleRecord}-${lastVisibleRecord} من ${resultTotal}`
                : `Showing ${firstVisibleRecord}-${lastVisibleRecord} of ${resultTotal}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
                className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20"
                aria-label={locale === "ar" ? "عدد العملاء في الصفحة" : "Customers per page"}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {locale === "ar" ? `${option} لكل صفحة` : `${option} / page`}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="min-w-20 text-center font-bold text-slate-500">
                {locale === "ar" ? `صفحة ${currentPage} / ${safeTotalPages}` : `Page ${currentPage} / ${safeTotalPages}`}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage >= safeTotalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? (locale === "ar" ? "تعديل بيانات العميل" : "Edit Customer Details") : t("addTitle")}
        description={t("addDescription")}
      >
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label-base">{t("name")}</span>
            <input
              required
              className="input-base"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{t("phone")}</span>
            <input
              required
              className="input-base"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{t("email")}</span>
            <input
              type="email"
              className="input-base"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label-base">{t("tier")}</span>
            <select
              className="input-base"
              value={form.tier}
              onChange={(event) =>
                setForm((current) => ({ ...current, tier: event.target.value as CustomerTier }))
              }
            >
              <option value="Standard">{t("standard")}</option>
              <option value="Gold">{t("gold")}</option>
              <option value="VIP">VIP</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label-base">{locale === "ar" ? "ملاحظات" : "Notes"}</span>
            <textarea
              className="input-base"
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {common("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title={locale === "ar" ? "تعطيل حساب عميل" : "Deactivate Customer Account"}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {locale === "ar"
              ? `هل أنت متأكد من تعطيل حساب العميل "${selectedCustomer?.name}"؟`
              : `Are you sure you want to deactivate customer "${selectedCustomer?.name}"?`}
          </p>
          <label className="block">
            <span className="label-base">{locale === "ar" ? "سبب التعطيل" : "Deactivation Reason"}</span>
            <input
              required
              placeholder={locale === "ar" ? "أدخل سبب التعطيل..." : "Enter reason for deactivation..."}
              className="input-base"
              value={deactivateReason}
              onChange={(event) => setDeactivateReason(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeactivateOpen(false)}>
              {common("cancel")}
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleConfirmDeactivate}
              disabled={!deactivateReason.trim()}
            >
              {locale === "ar" ? "تأكيد التعطيل" : "Confirm Deactivate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
