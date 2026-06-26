"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Star, Truck, Edit2, Trash2, CheckCircle, Eye, Download, AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "@/i18n/navigation";
import { useSuppliers, useSupplierMutations } from "@/hooks/use-suppliers";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import { exportData } from "@/lib/export/export-service";
import { toast } from "sonner";
import type { Supplier } from "@/lib/types";

const initialForm = {
  id: "",
  name: "",
  category: "",
  phone: "",
  email: "",
  due: "",
  rating: "4.5",
  address: "",
  country: "",
  notes: "",
  status: "active" as "active" | "inactive",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function SuppliersPage() {
  const t = useTranslations("Suppliers");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const exportT = useTranslations("PrintExport");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreateSuppliers = hasPermission("suppliers.create");
  const canUpdateSuppliers = hasPermission("suppliers.update");
  const canDeleteSuppliers = hasPermission("suppliers.delete");
  const canDeactivateSuppliers = hasPermission("suppliers.deactivate");
  const canReactivateSuppliers = hasPermission("suppliers.reactivate");

  const [queryState, setQueryState] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  // Custom hook for repository data
  const {
    items: suppliers,
    page: currentPage,
    pageSize: resolvedPageSize,
    total: resultTotal,
    totalPages,
    loading,
    error,
    setQuery,
    refresh,
    fetchAllMatching,
  } = useSuppliers({
    page,
    pageSize,
    search: queryState,
    filters: {
      category: categoryFilter,
      due: dueFilter,
      status: statusFilter,
    },
  });

  const { addSupplier, updateSupplier, deactivateSupplier, reactivateSupplier, deleteSupplier } = useSupplierMutations();

  // Modals state
  const [open, setOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  const categories = useMemo(() => {
    const nextCategories = new Set(suppliers.map((item) => item.category).filter(Boolean));
    if (categoryFilter !== "all") nextCategories.add(categoryFilter);
    return [...nextCategories];
  }, [suppliers, categoryFilter]);

  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const pageSummaryHint = rtl ? "إجمالي الصفحة الحالية فقط" : "Current page only";
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const firstVisibleRecord = resultTotal === 0 ? 0 : ((currentPage - 1) * resolvedPageSize) + 1;
  const lastVisibleRecord = resultTotal === 0 ? 0 : Math.min(resultTotal, firstVisibleRecord + suppliers.length - 1);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setForm(initialForm);
    setOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setIsEdit(true);
    setForm({
      id: sup.id,
      name: sup.name,
      category: sup.category,
      phone: sup.phone,
      email: sup.email || "",
      due: String(sup.due),
      rating: String(sup.rating),
      address: sup.address || "",
      country: sup.country || "",
      notes: sup.notes || "",
      status: sup.status || "active",
    });
    setOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.phone.trim()) {
      toast.error(common("required"));
      return;
    }

    try {
      if (isEdit) {
        const res = await updateSupplier(form.id, {
          name: form.name.trim(),
          category: form.category.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          // Phase 10H: `due` is a reference balance and is NOT manually editable
          // from the UI — omitted so the stored value is never overwritten here.
          rating: Math.min(5, Math.max(1, Number(form.rating) || 4.5)),
          address: form.address.trim(),
          country: form.country.trim(),
          notes: form.notes.trim(),
        });
        if (res.success) {
          toast.success(common("saved"));
          setOpen(false);
          await refresh();
        } else {
          toast.error(res.error?.message || "Error saving supplier");
        }
      } else {
        const res = await addSupplier({
          name: form.name.trim(),
          category: form.category.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          due: 0, // new suppliers start at 0; due is maintained by the system, not the UI
          lastOrder: new Date().toISOString().slice(0, 10),
          rating: Math.min(5, Math.max(1, Number(form.rating) || 4.5)),
          status: "active",
          address: form.address.trim(),
          country: form.country.trim(),
          notes: form.notes.trim(),
        });
        if (res.success) {
          toast.success(common("saved"));
          setOpen(false);
          await refresh();
        } else {
          toast.error(res.error?.message || "Error saving supplier");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving supplier");
    }
  };

  const handleOpenDeactivate = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setDeactivateReason("");
    setDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedSupplier) return;
    try {
      const res = await deactivateSupplier(selectedSupplier.id, deactivateReason.trim());
      if (res.success) {
        toast.success(rtl ? "تم تعطيل المورد بنجاح" : "Supplier deactivated successfully");
        setDeactivateOpen(false);
        setSelectedSupplier(null);
        await refresh();
      } else {
        toast.error(res.error?.message || "Failed to deactivate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate");
    }
  };

  const handleReactivate = async (sup: Supplier) => {
    try {
      const res = await reactivateSupplier(sup.id);
      if (res.success) {
        toast.success(rtl ? "تم إعادة تفعيل المورد" : "Supplier reactivated successfully");
        await refresh();
      } else {
        toast.error(res.error?.message || "Failed to reactivate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate");
    }
  };

  const handleDeleteSupplier = async (sup: Supplier) => {
    if (!window.confirm(common("deleteConfirm"))) return;
    try {
      const res = await deleteSupplier(sup.id);
      if (res.success) {
        toast.success(rtl ? "تم حذف المورد نهائيًا" : "Supplier deleted permanently");
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
          fileName: "suppliers.csv",
          title: t("title"),
          format: "csv",
          rows,
          locale,
          columns: [
            { key: "id", header: exportT("id") },
            { key: "name", header: t("name") },
            { key: "category", header: t("category") },
            { key: "phone", header: t("phone") },
            { key: "email", header: exportT("email"), value: (item) => item.email || "" },
            { key: "due", header: t("referenceBalance") },
            { key: "rating", header: t("rating") },
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

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, category },
    }));
  };

  const handleDueChange = (due: string) => {
    setDueFilter(due);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, due },
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
    setCategoryFilter("all");
    setDueFilter("all");
    setStatusFilter("all");
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      search: "",
      filters: { ...prev.filters, category: "all", due: "all", status: "all" },
    }));
  };

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = Number(value);
    setPageSize(nextPageSize);
    setPage(1);
    setQuery((prev) => ({ ...prev, page: 1, pageSize: nextPageSize }));
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), safeTotalPages);
    setPage(safePage);
    setQuery((prev) => ({ ...prev, page: safePage }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4" /> {common("export")}
            </Button>
            <Link href="/suppliers/purchases">
              <Button variant="secondary">
                {rtl ? "طلبات الشراء والاستلام" : "Purchase Orders"}
              </Button>
            </Link>
            {canCreateSuppliers && (
              <Button onClick={handleOpenAdd}>
                <Plus className="h-4 w-4" />
                {t("newSupplier")}
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={() => refresh()} />}

      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
        {rtl
          ? "هذا الرقم مرجعي وقد لا يعكس المدفوعات المسجلة. راجع كشف حساب المورد للرصيد المحسوب."
          : "This value is a reference only and may not reflect supplier payments. Use the supplier statement for the computed balance."}
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          [t("totalReferenceBalance"), money(suppliers.reduce((sum, item) => sum + item.due, 0))],
          [t("openOrders"), `2`],
          [t("leadTime"), `4.2`],
          [rtl ? "إجمالي الموردين" : "Total Suppliers", suppliers.length],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
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
              id: "category",
              label: t("category"),
              value: categoryFilter,
              onChange: handleCategoryChange,
              options: [
                { value: "all", label: filtersT("allCategories") },
                ...categories.map((item) => ({ value: item, label: item })),
              ],
            },
            {
              id: "due",
              label: t("referenceBalance"),
              value: dueFilter,
              onChange: handleDueChange,
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
        ) : suppliers.length ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="relative flex flex-col justify-between rounded-3xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-panel dark:border-slate-800"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {supplier.rating}
                    </div>
                  </div>

                  <h3 className="mt-4 font-black text-navy-950 dark:text-white">
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      {supplier.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {supplier.category} · {supplier.id}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-navy-950">
                      <p className="text-[10px] text-slate-400">
                        {t("referenceBalance")} <span className="ms-1 rounded bg-slate-200 px-1 text-[8px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{t("referenceBadge")}</span>
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-600 dark:text-slate-300">{money(supplier.due)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-navy-950">
                      <p className="text-[10px] text-slate-400">{t("lastOrder")}</p>
                      <p className="mt-1 text-xs font-bold">{supplier.lastOrder}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">{supplier.phone}</p>
                  <div className="flex gap-1">
                    <Link href={`/suppliers/${supplier.id}`}>
                      <Button variant="ghost" size="sm" title={common("view")}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    {canUpdateSuppliers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(supplier)}
                        title={common("edit")}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {supplier.status !== "inactive" ? (
                      canDeactivateSuppliers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                          onClick={() => handleOpenDeactivate(supplier)}
                          title={common("deactivate")}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </Button>
                      )
                    ) : (
                      canReactivateSuppliers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          onClick={() => handleReactivate(supplier)}
                          title={common("reactivate")}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )
                    )}
                    {canDeleteSuppliers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => handleDeleteSupplier(supplier)}
                        title={common("delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {supplier.status === "inactive" && (
                  <div className="absolute top-2 left-2 rounded bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                    {common("inactive")}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
        )}

        {!loading && resultTotal > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-500">
              {rtl
                ? `عرض ${firstVisibleRecord}-${lastVisibleRecord} من ${resultTotal}`
                : `Showing ${firstVisibleRecord}-${lastVisibleRecord} of ${resultTotal}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
                className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20"
                aria-label={rtl ? "عدد الموردين في الصفحة" : "Suppliers per page"}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {rtl ? `${option} لكل صفحة` : `${option} / page`}
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
                {rtl ? "السابق" : "Previous"}
              </Button>
              <span className="min-w-20 text-center font-bold text-slate-500">
                {rtl ? `صفحة ${currentPage} / ${safeTotalPages}` : `Page ${currentPage} / ${safeTotalPages}`}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage >= safeTotalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                {rtl ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? (rtl ? "تعديل بيانات المورد" : "Edit Supplier Details") : t("addTitle")}
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
            <span className="label-base">{t("category")}</span>
            <input
              required
              className="input-base"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
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
            <span className="label-base">{common("email")}</span>
            <input
              type="email"
              className="input-base"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{t("rating")}</span>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              className="input-base"
              value={form.rating}
              onChange={(event) =>
                setForm((current) => ({ ...current, rating: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="label-base">{rtl ? "الدولة" : "Country"}</span>
            <input
              className="input-base"
              value={form.country}
              onChange={(event) =>
                setForm((current) => ({ ...current, country: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="label-base">{rtl ? "العنوان" : "Address"}</span>
            <input
              className="input-base"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span>
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
        title={rtl ? "تعطيل حساب مورد" : "Deactivate Supplier Account"}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {rtl
              ? `هل أنت متأكد من تعطيل حساب المورد "${selectedSupplier?.name}"؟`
              : `Are you sure you want to deactivate supplier "${selectedSupplier?.name}"?`}
          </p>
          <label className="block">
            <span className="label-base">{rtl ? "سبب التعطيل" : "Deactivation Reason"}</span>
            <input
              required
              placeholder={rtl ? "أدخل سبب التعطيل..." : "Enter reason for deactivation..."}
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
              {rtl ? "تأكيد التعطيل" : "Confirm Deactivate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
