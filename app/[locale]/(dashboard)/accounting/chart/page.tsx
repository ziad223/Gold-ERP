"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { apiClient } from "@/lib/api/client";

type Account = {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: string;
  nature: "debit" | "credit";
  parentId?: string | null;
  statementClassification?: string | null;
  isPosting: boolean;
  isActive: boolean;
};

type AccountList = { success: true; data: { items: Account[]; total: number } };
type Readiness = { success: boolean; data: { status: string; missingRoles: string[]; missingMappings: string[] } };
type MappingList = { success: true; data: { required: string[]; mappings: Array<{ mappingType: string; accountId: string }> } };

export default function ChartOfAccountsPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("accounting.post");
  const canConfigure = hasPermission("settings.update");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [readiness, setReadiness] = useState<Readiness["data"] | null>(null);
  const [mappings, setMappings] = useState<MappingList["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mappingRole, setMappingRole] = useState("");
  const [mappingAccountId, setMappingAccountId] = useState("");
  const [form, setForm] = useState({
    code: "",
    name: "",
    nameAr: "",
    type: "asset",
    nature: "debit",
    statementClassification: "asset",
    isPosting: true,
    parentId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountResult, readinessResult, mappingResult] = await Promise.all([
        apiClient<AccountList>("/accounts?pageSize=500"),
        apiClient<Readiness>("/financial/readiness"),
        apiClient<MappingList>("/financial/branch-mappings"),
      ]);
      setAccounts(accountResult.data.items);
      setReadiness(readinessResult.data);
      setMappings(mappingResult.data);
    } catch (error: any) {
      toast.error(error?.message || (ar ? "تعذر تحميل دليل الحسابات" : "Unable to load the chart of accounts"));
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    try {
      await apiClient(editingId ? `/accounts/${encodeURIComponent(editingId)}` : "/accounts", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      setEditingId(null);
      setForm({ code: "", name: "", nameAr: "", type: "asset", nature: "debit", statementClassification: "asset", isPosting: true, parentId: "" });
      toast.success(ar ? "تم حفظ الحساب" : "Account saved");
      await load();
    } catch (error: any) {
      toast.error(error?.message || (ar ? "تعذر إنشاء الحساب" : "Unable to create account"));
    }
  };

  const edit = (account: Account) => {
    setEditingId(account.id);
    setForm({
      code: account.code,
      name: account.name,
      nameAr: account.nameAr,
      type: account.type,
      nature: account.nature,
      statementClassification: account.statementClassification || account.type,
      isPosting: account.isPosting,
      parentId: account.parentId || "",
    });
  };

  const setAccountActive = async (account: Account) => {
    try {
      await apiClient(`/accounts/${encodeURIComponent(account.id)}/${account.isActive ? "deactivate" : "reactivate"}`, { method: "POST" });
      await load();
    } catch (error: any) {
      toast.error(error?.message || (ar ? "تعذر تغيير حالة الحساب" : "Unable to change account status"));
    }
  };

  const roleAccountType: Record<string, string> = {
    CASH_TREASURY: "asset",
    BANK_ACCOUNT: "asset",
    ACCOUNTS_RECEIVABLE: "asset",
    SUPPLIER_PAYABLE: "liability",
    INVENTORY_ASSET: "asset",
    COST_OF_GOODS_SOLD: "expense",
    SALES_REVENUE: "revenue",
    RESERVATION_ADVANCE_LIABILITY: "liability",
    DEFAULT_EXPENSE: "expense",
    OTHER_INCOME: "revenue",
    VAT_PAYABLE: "liability",
  };
  const eligibleMappingAccounts = accounts.filter((account) =>
    account.isActive && account.isPosting && (!mappingRole || account.type === roleAccountType[mappingRole]));

  const saveMapping = async () => {
    if (!canConfigure || !mappingRole || !mappingAccountId) return;
    try {
      await apiClient(`/financial/branch-mappings/${encodeURIComponent(mappingRole)}`, {
        method: "PUT",
        body: JSON.stringify({ accountId: mappingAccountId }),
      });
      toast.success(ar ? "تم حفظ ربط الفرع" : "Branch mapping saved");
      await load();
    } catch (error: any) {
      toast.error(error?.message || (ar ? "تعذر حفظ الربط" : "Unable to save mapping"));
    }
  };

  const reconcile = async () => {
    if (!canConfigure) return;
    try {
      await apiClient("/financial/reconcile", { method: "POST", body: JSON.stringify({ dryRun: false }) });
      toast.success(ar ? "اكتملت مطابقة الحسابات المطلوبة" : "Required accounts reconciled");
      await load();
    } catch (error: any) {
      toast.error(error?.message || (ar ? "تعذرت المطابقة" : "Reconciliation failed"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "دليل الحسابات" : "Chart of Accounts"}
        description={ar ? "حسابات الشركة، جاهزية الإقلاع، وربط الحسابات بالفروع." : "Company accounts, bootstrap readiness, and Branch mappings."}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "الجاهزية المالية" : "Financial readiness"}</p>
              <p className="mt-1 text-xl font-bold">{readiness?.status || (loading ? "…" : "BLOCKED")}</p>
            </div>
            {canConfigure && <Button onClick={reconcile}>{ar ? "مطابقة آمنة" : "Safe reconcile"}</Button>}
          </div>
          {readiness?.status !== "READY" && (
            <p className="mt-3 text-sm text-destructive">
              {ar ? "يتطلب الإعداد إكمال الأدوار والربط قبل الترحيل." : "Posting remains blocked until roles and mappings are complete."}
            </p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">{ar ? "ربط الفرع" : "Branch mapping"}</p>
          <p className="mt-1 text-xl font-bold">
            {mappings ? `${mappings.mappings.length}/${mappings.required.length}` : "…"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {ar ? "كل ربط يحدد حساب ترحيل صريحًا للفرع الحالي." : "Each mapping explicitly authorizes a posting account for the current Branch."}
          </p>
          {mappings && mappings.mappings.length < mappings.required.length && (
            <p className="mt-2 text-xs font-semibold text-destructive">
              {ar ? "توجد روابط إلزامية غير مكتملة." : "Required Branch mappings are incomplete."}
            </p>
          )}
        </Card>
      </div>

      {canConfigure && mappings && (
        <Card className="p-5">
          <h2 className="mb-4 font-bold">{ar ? "ربط حسابات الفرع" : "Branch account mappings"}</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              className="rounded-xl border bg-background px-3 py-2"
              value={mappingRole}
              onChange={(event) => { setMappingRole(event.target.value); setMappingAccountId(""); }}
            >
              <option value="">{ar ? "اختر نوع الربط" : "Choose mapping role"}</option>
              {mappings.required.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select className="rounded-xl border bg-background px-3 py-2" value={mappingAccountId} onChange={(event) => setMappingAccountId(event.target.value)}>
              <option value="">{ar ? "اختر حسابًا مؤهلًا" : "Choose eligible account"}</option>
              {eligibleMappingAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} — {ar ? account.nameAr : account.name}</option>)}
            </select>
            <Button type="button" onClick={saveMapping} disabled={!mappingRole || !mappingAccountId}>{ar ? "حفظ الربط" : "Save mapping"}</Button>
          </div>
          <div className="mt-4 grid gap-2 text-xs md:grid-cols-2">
            {mappings.required.map((role) => (
              <div key={role} className="flex justify-between rounded-lg border px-3 py-2">
                <span>{role}</span>
                <span className={mappings.mappings.some((item) => item.mappingType === role) ? "text-emerald-600" : "text-destructive"}>
                  {mappings.mappings.some((item) => item.mappingType === role) ? (ar ? "مكتمل" : "Mapped") : (ar ? "مفقود" : "Missing")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {canManage && (
        <Card className="p-5">
          <h2 className="mb-4 font-bold">{editingId ? (ar ? "تعديل الحساب" : "Edit account") : (ar ? "حساب يدوي جديد" : "New manual account")}</h2>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
            <input className="rounded-xl border bg-background px-3 py-2" placeholder={ar ? "الرمز" : "Code"} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="rounded-xl border bg-background px-3 py-2" placeholder="English name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="rounded-xl border bg-background px-3 py-2" placeholder="الاسم العربي" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            <select className="rounded-xl border bg-background px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {["asset", "liability", "equity", "revenue", "expense"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select className="rounded-xl border bg-background px-3 py-2" value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value })}>
              <option value="debit">debit</option><option value="credit">credit</option>
            </select>
            <select className="rounded-xl border bg-background px-3 py-2" value={form.statementClassification} onChange={(e) => setForm({ ...form, statementClassification: e.target.value })}>
              {["asset", "liability", "equity", "revenue", "cost_of_goods_sold", "operating_expense", "other_income"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select className="rounded-xl border bg-background px-3 py-2" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">{ar ? "بدون حساب أب" : "No parent account"}</option>
              {accounts.filter((account) => !account.isPosting && account.id !== editingId).map((account) => (
                <option key={account.id} value={account.id}>{account.code} — {ar ? account.nameAr : account.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              <input type="checkbox" checked={form.isPosting} onChange={(e) => setForm({ ...form, isPosting: e.target.checked })} />
              {ar ? "حساب ترحيل" : "Posting account"}
            </label>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? (ar ? "حفظ" : "Save") : (ar ? "إنشاء" : "Create")}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm({ code: "", name: "", nameAr: "", type: "asset", nature: "debit", statementClassification: "asset", isPosting: true, parentId: "" }); }}>{ar ? "إلغاء" : "Cancel"}</Button>}
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-bold">{ar ? "حسابات الشركة" : "Company accounts"} ({accounts.length})</h2>
        </div>
        <div className="divide-y">
          {accounts.map((account) => (
            <div key={account.id} className="grid gap-2 p-4 text-sm md:grid-cols-[120px_1fr_180px_100px_auto]">
              <span className="font-mono font-bold">{account.code}</span>
              <span>{ar ? account.nameAr : account.name}</span>
              <span className="text-muted-foreground">{account.statementClassification || account.type}</span>
              <span>{account.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}</span>
              {canManage && (
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => edit(account)}>{ar ? "تعديل" : "Edit"}</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAccountActive(account)}>
                    {account.isActive ? (ar ? "إلغاء تنشيط" : "Deactivate") : (ar ? "إعادة تنشيط" : "Reactivate")}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {!loading && !accounts.length && <p className="p-6 text-muted-foreground">{ar ? "لا توجد حسابات." : "No accounts."}</p>}
        </div>
      </Card>
    </div>
  );
}
