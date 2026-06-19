"use client";

import { FileText, Image as ImageIcon, File, Plus, Trash2, Paperclip, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AssetAttachment } from "@/lib/types";
import { getPublicFileUrl } from "@/lib/files";

interface AttachmentsPanelProps {
  attachments?: AssetAttachment[];
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  isUploading?: boolean;
}

export function AttachmentsPanel({
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  isUploading = false,
}: AttachmentsPanelProps) {
  const t = useTranslations("AssetDetails");
  const [showAdd, setShowAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.startsWith("image/") || lower === "photo") {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    }
    if (lower === "application/pdf" || lower === "invoice" || lower === "certificate") {
      return <FileText className="h-4 w-4 text-emerald-500" />;
    }
    return <File className="h-4 w-4 text-slate-500" />;
  };

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setSelectedPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setSelectedPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const file = selectedFile || fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMsg(t("fileRequired") || "الملف مطلوب");
      return;
    }

    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(t("fileTooLarge") || "حجم الملف كبير جداً. الحد الأقصى 10 ميغابايت");
      return;
    }

    // MIME type validation
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg(t("fileTypeUnsupported") || "نوع الملف غير مدعوم. المسموح به: صور، PDF، Excel، CSV.");
      return;
    }

    onAddAttachment(file);
    setShowAdd(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-border p-4 bg-panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
          <Paperclip className="h-4 w-4 text-brand-600" />
          {t("attachments")}
        </h3>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(!showAdd)} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          {t("addAttachment")}
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 dark:bg-navy-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">{t("selectFile") || "اختر الملف"}</label>
            <input
              type="file"
              ref={fileInputRef}
              required
              accept="image/jpeg,image/png,image/webp,application/pdf,.xlsx,.xls,.csv"
              onChange={(event) => {
                setErrorMsg("");
                setSelectedFile(event.target.files?.[0] || null);
              }}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          {selectedFile && (
            <div className="rounded-xl border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-navy-950">
              <p className="truncate text-[10px] font-bold text-foreground">{selectedFile.name}</p>
              {selectedPreviewUrl && (
                <img
                  src={selectedPreviewUrl}
                  alt={selectedFile.name}
                  className="mt-2 h-28 w-full rounded-lg border border-slate-200 bg-white object-contain dark:border-slate-700"
                />
              )}
            </div>
          )}
          {errorMsg && (
            <p className="text-[10px] text-rose-500 font-bold">{errorMsg}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="secondary" type="button" onClick={() => setShowAdd(false)}>
              {t("cancel")}
            </Button>
            <Button size="sm" type="submit">
              {t("add")}
            </Button>
          </div>
        </form>
      )}

      {attachments.length === 0 ? (
        <p className="text-center text-[10px] text-slate-400 py-3">{t("noAttachments")}</p>
      ) : (
        <ul className="divide-y divide-border text-xs">
          {attachments.map((file) => {
            const url = file.url ? getPublicFileUrl(file.url) : "";
            const isImage = file.type?.startsWith("image/");
            const imageFailed = !!url && failedImageUrls.has(url);
            return (
            <li key={file.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 min-w-0">
                {isImage && url && !imageFailed ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={url}
                      alt={file.name}
                      className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-cover dark:border-slate-700"
                      onError={() => setFailedImageUrls((current) => new Set(current).add(url))}
                    />
                  </a>
                ) : (
                  getIcon(file.type)
                )}
                <div className="min-w-0">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-foreground hover:underline hover:text-brand-600 transition truncate block max-w-[150px] sm:max-w-[200px]"
                      title={file.name}
                    >
                      {file.name}
                    </a>
                  ) : (
                    <p className="font-bold text-foreground truncate block max-w-[150px] sm:max-w-[200px]">{file.name}</p>
                  )}
                  <p className="text-[9px] text-slate-400">
                    {file.uploadedAt} · {file.uploadedBy}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveAttachment(file.id)}
                className="text-rose-500 hover:text-rose-700 transition p-1"
                disabled={isUploading}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
          })}
        </ul>
      )}
    </div>
  );
}
