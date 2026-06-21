import bwipjs from "bwip-js/browser";
import type { CSSProperties } from "react";

/**
 * Shared, SSR-safe renderer for a REAL scannable barcode / QR — used by BOTH
 * the print template and the on-screen previews so they can never drift.
 *
 * bwip-js `toSVG` is synchronous and DOM-free, so it works inside
 * renderToStaticMarkup (print) and in client components (preview). Output is a
 * viewBox SVG (black on transparent → print-safe). On any generation failure it
 * falls back to a clearly-marked, NON-scannable text box (data-scannable="false")
 * — never a fake/decorative barcode passed off as real.
 *
 * Default symbology is CODE128 (accepts digits, letters, dashes — works for
 * product codes / asset ids), not EAN13 (digits-only, fixed length).
 */
interface ScannableBarcodeProps {
  value: string;
  type?: "barcode" | "qr";
  className?: string;
  style?: CSSProperties;
}

export function ScannableBarcode({ value, type = "barcode", className, style }: ScannableBarcodeProps) {
  const text = (value ?? "").toString().trim() || " ";
  let svg = "";
  try {
    svg = type === "qr"
      ? bwipjs.toSVG({ bcid: "qrcode", text, scale: 3 })
      : bwipjs.toSVG({ bcid: "code128", text, height: 8, includetext: false, scale: 2 });
  } catch {
    svg = "";
  }

  if (!svg || !svg.startsWith("<svg")) {
    return (
      <div
        className={`barcode-fallback ${className || ""}`}
        data-scannable="false"
        aria-label={`unscannable code ${text}`}
        style={{ fontFamily: "monospace", fontSize: "8px", border: "1px dashed #999", padding: "2px", textAlign: "center", ...style }}
      >
        {text}
      </div>
    );
  }

  // Make the SVG fill its container. Barcodes stretch (uniform per bar, still
  // scannable); QR keeps its square aspect ratio.
  const aspect = type === "qr" ? "xMidYMid meet" : "none";
  const styledSvg = svg.replace(
    "<svg ",
    `<svg preserveAspectRatio="${aspect}" style="width:100%;height:100%;display:block;" `
  );

  return (
    <div
      className={`scannable-barcode ${className || ""}`}
      data-symbology={type === "qr" ? "qrcode" : "code128"}
      data-scannable="true"
      style={{ display: "flex", width: "100%", height: "100%", ...style }}
      dangerouslySetInnerHTML={{ __html: styledSvg }}
    />
  );
}
