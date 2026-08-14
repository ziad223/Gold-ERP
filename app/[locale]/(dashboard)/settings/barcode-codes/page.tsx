"use client";

import { FormEvent, useState } from "react";
import { Barcode, Edit2, LockKeyhole, Plus, Power } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { useBarcodeSettings } from "@/features/settings/hooks/use-barcode-settings";
import type { AssetType, BarcodeInventoryCode, BarcodeItemCode } from "@/lib/types";

type EditorKind = "inventory" | "item";
type EditorState = {
  id?: string;
  kind: EditorKind;
  locked: boolean;
  code: string;
  displayName: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isClientApproved: boolean;
  isProvisional: boolean;
  assetType: AssetType;
  requiresKarat: boolean;
  defaultKaratCode: string;
  defaultItemCode: string;
  allowedInventoryCodes: string[];
};

const emptyEditor = (kind: EditorKind): EditorState => ({
  kind,
  locked: false,
  code: "",
  displayName: "",
  description: "",
  sortOrder: 0,
  isActive: true,
  isClientApproved: false,
  isProvisional: false,
  assetType: "gold-piece",
  requiresKarat: true,
  defaultKaratCode: "",
  defaultItemCode: "",
  allowedInventoryCodes: [],
});

export default function BarcodeCodesSettingsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { hasPermission } = usePermissions();
  const { inventoryCodes, itemCodes, usage, isLoading, error, saveInventoryCode, saveItemCode, isSaving } = useBarcodeSettings();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const canView = hasPermission("settings.view") || hasPermission("inventory.view");
  const canManage = hasPermission("settings.update") || hasPermission("inventory.manage") || hasPermission("inventory.adjust");

  const openInventory = (row?: BarcodeInventoryCode) => {
    if (!row) return setEditor(emptyEditor("inventory"));
    setEditor({
      ...emptyEditor("inventory"),
      ...row,
      description: row.description || "",
      defaultKaratCode: row.defaultKaratCode || "",
      defaultItemCode: row.defaultItemCode || "",
      locked: usage.inventory[row.code]?.used === true,
    });
  };

  const openItem = (row?: BarcodeItemCode) => {
    if (!row) return setEditor(emptyEditor("item"));
    setEditor({
      ...emptyEditor("item"),
      ...row,
      description: row.description || "",
      locked: usage.item[row.code]?.used === true,
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || !canManage) return;
    try {
      const common = {
        displayName: editor.displayName,
        description: editor.description,
        sortOrder: Number(editor.sortOrder) || 0,
        isActive: editor.isActive,
        isClientApproved: editor.isClientApproved,
        isProvisional: editor.isProvisional,
      };
      if (editor.kind === "inventory") {
        await saveInventoryCode(editor.locked ? common : {
          ...common,
          code: editor.code,
          assetType: editor.assetType,
          requiresKarat: editor.requiresKarat,
          defaultKaratCode: editor.defaultKaratCode || null,
          defaultItemCode: editor.defaultItemCode || null,
        }, editor.id);
      } else {
        await saveItemCode(editor.locked ? common : {
          ...common,
          code: editor.code,
          allowedInventoryCodes: editor.allowedInventoryCodes,
        }, editor.id);
      }
      toast.success(rtl ? "تم حفظ إعدادات الكود" : "Barcode code settings saved");
      setEditor(null);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : (rtl ? "فشل حفظ الكود" : "Failed to save code"));
    }
  };

  const toggleActive = async (kind: EditorKind, row: BarcodeInventoryCode | BarcodeItemCode) => {
    if (!canManage) return;
    try {
      if (kind === "inventory") await saveInventoryCode({ isActive: !row.isActive }, row.id);
      else await saveItemCode({ isActive: !row.isActive }, row.id);
      toast.success(rtl ? "تم تحديث حالة الكود" : "Code status updated");
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Failed to update code");
    }
  };

  if (!canView) {
    return <PageHeader title={rtl ? "أكواد الباركود" : "Barcode Codes"} description={rtl ? "ليست لديك صلاحية لعرض هذه الإعدادات." : "You do not have permission to view these settings."} />;
  }

  const statusBadges = (row: BarcodeInventoryCode | BarcodeItemCode, locked: boolean) => (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={row.isActive ? "green" : "slate"}>{row.isActive ? (rtl ? "نشط" : "Active") : (rtl ? "غير نشط" : "Inactive")}</Badge>
      {row.isProvisional && <Badge tone="amber">{rtl ? "مؤقت" : "Provisional"}</Badge>}
      <Badge tone={row.isClientApproved ? "blue" : "rose"}>{row.isClientApproved ? (rtl ? "معتمد من العميل" : "Client approved") : (rtl ? "بانتظار اعتماد العميل" : "Pending client confirmation")}</Badge>
      {locked && <Badge tone="violet"><LockKeyhole className="me-1 h-3 w-3" />{rtl ? "مستخدم / مقفل" : "Used / Locked"}</Badge>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "إعدادات أكواد الباركود" : "Barcode Code Settings"}
        description={rtl ? "إدارة أكواد المخزون والقطع المستخدمة لإنشاء هوية الباركود التشغيلية." : "Manage the database-backed inventory and item taxonomy used for operational barcode identities."}
        actions={<Badge tone="blue"><Barcode className="me-1 h-3.5 w-3.5" />INV + ITEM + KT + SERIAL</Badge>}
      />

      <Card className="border-amber-200 bg-amber-50/70 p-4 text-xs font-bold text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        {rtl ? "الأكواد المستخدمة تكون مقفلة لحماية الباركودات التاريخية والتاجات المطبوعة. أنشئ كودًا جديدًا وأوقف القديم عند الحاجة إلى الاستبدال." : "Used codes are locked to protect historical barcodes and printed tags. Create a new code and deactivate the old one when replacement is required."}
      </Card>

      {error && <Card className="p-5 text-sm text-rose-600">{error instanceof Error ? error.message : "Failed to load barcode settings"}</Card>}

      <CodeTable
        title={rtl ? "أكواد المخزون" : "Inventory Codes"}
        loading={isLoading}
        columns={[rtl ? "الكود" : "Code", rtl ? "الاسم / النوع" : "Name / Asset Type", rtl ? "الخيارات" : "Policy", rtl ? "الحالة" : "Status", rtl ? "إجراءات" : "Actions"]}
        onAdd={() => openInventory()}
        canManage={canManage}
      >
        {inventoryCodes.map((row) => {
          const locked = usage.inventory[row.code]?.used === true;
          return (
            <tr key={row.id} className="border-t border-border">
              <td className="px-4 py-3 font-mono text-base font-black">{row.code}</td>
              <td className="px-4 py-3"><div className="font-bold">{row.displayName}</div><div className="text-[11px] text-muted-foreground">{row.assetType}</div></td>
              <td className="px-4 py-3 text-xs"><div>{row.requiresKarat ? "Karat required" : `Default KT: ${row.defaultKaratCode || "—"}`}</div><div className="text-muted-foreground">Default item: {row.defaultItemCode || "—"}</div></td>
              <td className="px-4 py-3">{statusBadges(row, locked)}</td>
              <td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!canManage} onClick={() => openInventory(row)}><Edit2 className="h-3.5 w-3.5" />{rtl ? "تعديل" : "Edit"}</Button><Button size="sm" variant="ghost" disabled={!canManage || isSaving} onClick={() => toggleActive("inventory", row)}><Power className="h-3.5 w-3.5" /></Button></div></td>
            </tr>
          );
        })}
      </CodeTable>

      <CodeTable
        title={rtl ? "أكواد القطع" : "Item Codes"}
        loading={isLoading}
        columns={[rtl ? "الكود" : "Code", rtl ? "الاسم" : "Name", rtl ? "أنواع المخزون المسموحة" : "Allowed Inventory Codes", rtl ? "الحالة" : "Status", rtl ? "إجراءات" : "Actions"]}
        onAdd={() => openItem()}
        canManage={canManage}
      >
        {itemCodes.map((row) => {
          const locked = usage.item[row.code]?.used === true;
          return (
            <tr key={row.id} className="border-t border-border">
              <td className="px-4 py-3 font-mono text-base font-black">{row.code}</td>
              <td className="px-4 py-3 font-bold">{row.displayName}</td>
              <td className="px-4 py-3 text-xs">{row.allowedInventoryCodes.join(", ") || "—"}</td>
              <td className="px-4 py-3">{statusBadges(row, locked)}</td>
              <td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!canManage} onClick={() => openItem(row)}><Edit2 className="h-3.5 w-3.5" />{rtl ? "تعديل" : "Edit"}</Button><Button size="sm" variant="ghost" disabled={!canManage || isSaving} onClick={() => toggleActive("item", row)}><Power className="h-3.5 w-3.5" /></Button></div></td>
            </tr>
          );
        })}
      </CodeTable>

      <Modal open={Boolean(editor)} onClose={() => setEditor(null)} title={editor?.kind === "inventory" ? (rtl ? "كود مخزون" : "Inventory Code") : (rtl ? "كود قطعة" : "Item Code")} description={editor?.locked ? (rtl ? "الكود مستخدم؛ يمكن تعديل البيانات الوصفية والحالة فقط." : "This code is used; only descriptive fields and status flags remain editable.") : undefined}>
        {editor && <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 text-xs">
          <label><span className="label-base">{rtl ? "الكود" : "Code"}</span><input className="input-base uppercase" value={editor.code} disabled={editor.locked} required onChange={(e) => setEditor({ ...editor, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></label>
          <label><span className="label-base">{rtl ? "اسم العرض" : "Display Name"}</span><input className="input-base" value={editor.displayName} required onChange={(e) => setEditor({ ...editor, displayName: e.target.value })} /></label>
          <label className="sm:col-span-2"><span className="label-base">{rtl ? "الوصف" : "Description"}</span><textarea className="input-base min-h-20" value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} /></label>
          <label><span className="label-base">{rtl ? "الترتيب" : "Sort Order"}</span><input className="input-base" type="number" value={editor.sortOrder} onChange={(e) => setEditor({ ...editor, sortOrder: Number(e.target.value) })} /></label>
          {editor.kind === "inventory" && <>
            <label><span className="label-base">Asset Type</span><select className="input-base" disabled={editor.locked} value={editor.assetType} onChange={(e) => setEditor({ ...editor, assetType: e.target.value as AssetType })}>{["gold-weight", "gold-piece", "diamond", "gemstone", "pearl", "watch"].map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span className="label-base">{rtl ? "كود KT الافتراضي" : "Default KT Code"}</span><input className="input-base" maxLength={2} disabled={editor.locked} value={editor.defaultKaratCode} placeholder="00" onChange={(e) => setEditor({ ...editor, defaultKaratCode: e.target.value.replace(/\D/g, "") })} /></label>
            <label><span className="label-base">{rtl ? "كود القطعة الافتراضي" : "Default Item Code"}</span><input className="input-base uppercase" disabled={editor.locked} value={editor.defaultItemCode} placeholder="WCH" onChange={(e) => setEditor({ ...editor, defaultItemCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></label>
            <Toggle label={rtl ? "يتطلب عيارًا" : "Requires Karat"} checked={editor.requiresKarat} disabled={editor.locked} onChange={(checked) => setEditor({ ...editor, requiresKarat: checked })} />
          </>}
          {editor.kind === "item" && <div className="sm:col-span-2 rounded-2xl border border-border p-4"><div className="mb-2 font-bold">{rtl ? "أكواد المخزون المسموحة" : "Allowed Inventory Codes"}</div><div className="flex flex-wrap gap-3">{inventoryCodes.map((inventory) => <label key={inventory.code} className="flex items-center gap-2"><input type="checkbox" disabled={editor.locked} checked={editor.allowedInventoryCodes.includes(inventory.code)} onChange={(e) => setEditor({ ...editor, allowedInventoryCodes: e.target.checked ? [...editor.allowedInventoryCodes, inventory.code] : editor.allowedInventoryCodes.filter((code) => code !== inventory.code) })} />{inventory.code}</label>)}</div></div>}
          <Toggle label={rtl ? "نشط" : "Active"} checked={editor.isActive} onChange={(checked) => setEditor({ ...editor, isActive: checked })} />
          <Toggle label={rtl ? "معتمد من العميل" : "Client Approved"} checked={editor.isClientApproved} onChange={(checked) => setEditor({ ...editor, isClientApproved: checked })} />
          <Toggle label={rtl ? "مؤقت" : "Provisional"} checked={editor.isProvisional} onChange={(checked) => setEditor({ ...editor, isProvisional: checked })} />
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => setEditor(null)}>{rtl ? "إلغاء" : "Cancel"}</Button><Button type="submit" disabled={isSaving || !canManage}>{rtl ? "حفظ" : "Save"}</Button></div>
        </form>}
      </Modal>
    </div>
  );
}

function CodeTable({ title, loading, columns, onAdd, canManage, children }: { title: string; loading: boolean; columns: string[]; onAdd: () => void; canManage: boolean; children: React.ReactNode }) {
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border p-5"><h2 className="font-black">{title}</h2><Button size="sm" onClick={onAdd} disabled={!canManage}><Plus className="h-4 w-4" />Add</Button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-surface-muted text-xs text-muted-foreground"><tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-start">{column}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={columns.length} className="p-6 text-center text-muted-foreground">Loading...</td></tr> : children}</tbody></table></div></Card>;
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-2xl border border-border p-3 font-bold"><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
