export const REVISION_EDITABLE_FIELDS = ["name", "description", "category", "brand", "notes"] as const;

export type RevisionEditableField = (typeof REVISION_EDITABLE_FIELDS)[number];
export type RevisionLocale = "ar" | "en";

export type RevisionDraft = Record<RevisionEditableField, string>;

export const REVISION_FIELD_LABELS: Record<RevisionEditableField, Record<RevisionLocale, string>> = {
  name: { ar: "اسم الأصل", en: "Asset name" },
  description: { ar: "الوصف", en: "Description" },
  category: { ar: "الفئة", en: "Category" },
  brand: { ar: "الماركة", en: "Brand" },
  notes: { ar: "ملاحظات", en: "Notes" },
};

export const REVISION_ERROR_MESSAGES: Record<string, Record<RevisionLocale, string>> = {
  ASSET_NOT_FOUND: { ar: "الأصل غير موجود أو لم يعد متاحًا في النطاق الحالي.", en: "The Asset was not found in the current scope." },
  ASSET_SCOPE_INVALID: { ar: "لا يمكن تعديل أصل خارج الفرع الحالي.", en: "This Asset is outside the current branch scope." },
  REVISION_PERMISSION_DENIED: { ar: "لا تملك صلاحية Revision المطلوبة.", en: "You do not have the required Revision permission." },
  REVISION_FIELD_NOT_ALLOWED: { ar: "لا يمكن تعديل هذا الحقل من خلال Revision.", en: "This field is not editable through Revision." },
  REVISION_NO_EFFECTIVE_CHANGE: { ar: "لم يتم اكتشاف تغيير فعلي.", en: "No effective change was detected." },
  REVISION_IDEMPOTENCY_CONFLICT: { ar: "تعذر إكمال الطلب بنفس مفتاح العملية؛ راجع الحالة الحالية.", en: "The submission key conflicts with a different Revision request." },
  REVISION_CONCURRENT_CONFLICT: { ar: "تم تحديث الأصل في جلسة أخرى. حدّث الصفحة ثم راجع التغييرات قبل الإرسال.", en: "The Asset changed in another session. Refresh and review before submitting." },
  REVISION_DEDICATED_OPERATION_REQUIRED: { ar: "هذا الحقل له مسار تشغيلي مستقل ولا يُعدّل من Revision.", en: "This field requires its dedicated operation and cannot be changed through Revision." },
  REVISION_INVALID_VALUE: { ar: "قيمة Revision غير صالحة.", en: "The Revision value is invalid." },
  REVISION_SOURCE_INVALID: { ar: "مصدر عملية Revision غير صالح.", en: "The Revision source is invalid." },
  REVISION_VALUE_TYPE_INVALID: { ar: "نوع إحدى القيم غير مدعوم.", en: "One of the values has an unsupported type." },
  REVISION_REASON_REQUIRED: { ar: "سبب التعديل مطلوب.", en: "A reason is required for the Revision." },
};

export function revisionErrorMessage(code: string | undefined, locale: RevisionLocale): string | undefined {
  return code ? REVISION_ERROR_MESSAGES[code]?.[locale] : undefined;
}

export function effectiveRevisionChanges(asset: Record<string, unknown>, draft: RevisionDraft): Partial<RevisionDraft> {
  const changes: Partial<RevisionDraft> = {};
  for (const field of REVISION_EDITABLE_FIELDS) {
    const next = draft[field].trim();
    const previous = asset[field] == null ? "" : String(asset[field]).trim();
    if (next !== previous) changes[field] = next;
  }
  return changes;
}

export function revisionDiffEntries(asset: Record<string, unknown>, draft: RevisionDraft, locale: RevisionLocale) {
  const changes = effectiveRevisionChanges(asset, draft);
  return Object.entries(changes).map(([field, value]) => ({
    field: field as RevisionEditableField,
    label: REVISION_FIELD_LABELS[field as RevisionEditableField][locale],
    oldValue: asset[field] == null || asset[field] === "" ? "—" : String(asset[field]),
    newValue: value == null || value === "" ? "—" : String(value),
  }));
}
