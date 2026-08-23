import type { PrintOptions, PrintResult } from "./print-types";

const PRINT_FRAME_ID = "darfus-print-frame";

export function printHtmlDocument(html: string, options: PrintOptions): PrintResult {
  if (!html.trim()) {
    return { ok: false, errorCode: "missing-document", error: "Missing printable document." };
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return { ok: false, errorCode: "print-failed", error: "Printing is only available in the browser." };
  }

  const printFrame = createPrintFrame(options.title);
  const printWindow = printFrame.contentWindow;

  try {
    if (!printWindow) {
      throw new Error("Unable to create a print frame.");
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => cleanupPrintFrame(printFrame);
    printWindow.print();
    window.setTimeout(() => cleanupPrintFrame(printFrame), 60_000);
    return { ok: true };
  } catch (error) {
    cleanupPrintFrame(printFrame);
    return {
      ok: false,
      errorCode: "print-failed",
      error: error instanceof Error ? error.message : "Print failed.",
    };
  }
}

function createPrintFrame(title?: string) {
  document.getElementById(PRINT_FRAME_ID)?.remove();

  const frame = document.createElement("iframe");
  frame.id = PRINT_FRAME_ID;
  frame.title = title ?? "Print";
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  document.body.appendChild(frame);
  return frame;
}

function cleanupPrintFrame(frame: HTMLIFrameElement) {
  if (frame.parentNode) {
    frame.parentNode.removeChild(frame);
  }
}
