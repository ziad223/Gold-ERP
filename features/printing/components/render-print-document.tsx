import { renderToStaticMarkup } from "react-dom/server";
import { getPrintDocumentCss } from "@/lib/print/print-config";
import type { PrintOptions } from "@/lib/print/print-types";

export function renderPrintDocument(element: React.ReactElement, options: PrintOptions) {
  const locale = options.locale ?? "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const body = renderToStaticMarkup(element);

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title ?? "Print")}</title>
    <style>${getPrintDocumentCss({ ...options, locale })}</style>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#039;";
    }
  });
}
