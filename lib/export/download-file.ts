import type { ExportResult } from "./export-types";

const RESERVED_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizeFileName(fileName: string, extension?: string) {
  const trimmed = fileName.trim().replace(RESERVED_FILENAME_CHARS, "-").replace(/\s+/g, "-");
  const safeBase = trimmed.replace(/-+/g, "-").replace(/^-|-$/g, "") || "export";
  if (!extension) return safeBase;
  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  return safeBase.toLowerCase().endsWith(normalizedExtension.toLowerCase())
    ? safeBase
    : `${safeBase}${normalizedExtension}`;
}

export function downloadBlob(blob: Blob, fileName: string): ExportResult {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return { ok: false, errorCode: "download-failed", error: "Browser download API is unavailable." };
  }

  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    queueMicrotask(() => URL.revokeObjectURL(url));
    return { ok: true, fileName };
  } catch (error) {
    return {
      ok: false,
      errorCode: "download-failed",
      error: error instanceof Error ? error.message : "Download failed.",
    };
  }
}
