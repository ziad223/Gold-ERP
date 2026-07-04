"use client";

/**
 * Test-only fixture page for print export smoke testing (Phase 19O-Fix).
 *
 * Renders every invoice print template with fixture data across language modes.
 * Used exclusively by `tests/export-print.spec.ts` via Playwright.
 *
 * NOT a production route. No backend, DB, or API access.
 * No financial logic. All data is static/hardcoded test fixture data.
 */

import { InvoiceDocument } from "@/features/printing/components/InvoiceDocument";
import type { InvoicePrintTemplateId } from "@/features/printing/lib/invoice-print-options";
import type { PrintTemplateLanguageMode } from "@/features/printing/lib/print-template-config";
import {
  FIXTURE_INVOICE,
  FIXTURE_COMPANY,
  FIXTURE_LABELS,
  FIXTURE_SETTINGS,
} from "@/features/printing/lib/invoice-print-fixture";

const TEMPLATE_IDS: InvoicePrintTemplateId[] = [
  "luxuryGold",
  "compactA4",
  "minimal",
  "thermal",
];

const LANGUAGE_MODES: PrintTemplateLanguageMode[] = [
  "bilingual",
  "ar",
  "en",
];

export default function PrintExportTestPage() {
  return (
    <div data-testid="print-export-fixture-root">
      {TEMPLATE_IDS.map((templateId) =>
        LANGUAGE_MODES.map((languageMode) => (
          <section
            key={`${templateId}-${languageMode}`}
            data-testid={`print-fixture-${templateId}-${languageMode}`}
            data-template-id={templateId}
            data-language-mode={languageMode}
            style={{ marginBottom: "20px", borderBottom: "3px solid #ccc" }}
          >
            <InvoiceDocument
              templateId={templateId}
              invoice={FIXTURE_INVOICE}
              company={FIXTURE_COMPANY}
              cashierName="Test Cashier"
              locale="en"
              labels={FIXTURE_LABELS}
              settings={FIXTURE_SETTINGS}
              templateConfig={{ languageMode }}
            />
          </section>
        )),
      )}

      {/* Invalid template ID fallback test: should render Luxury Gold */}
      <section
        data-testid="print-fixture-invalid-fallback"
        data-template-id="unknownTemplate"
        data-language-mode="bilingual"
        style={{ marginBottom: "20px", borderBottom: "3px solid #ccc" }}
      >
        <InvoiceDocument
          templateId={"unknownTemplate" as InvoicePrintTemplateId}
          invoice={FIXTURE_INVOICE}
          company={FIXTURE_COMPANY}
          cashierName="Test Cashier"
          locale="en"
          labels={FIXTURE_LABELS}
          settings={FIXTURE_SETTINGS}
          templateConfig={{ languageMode: "bilingual" }}
        />
      </section>

      {/* Theme preset render test case: modernDark */}
      <section
        data-testid="print-fixture-theme-preset-modernDark"
        data-template-id="luxuryGold"
        style={{ marginBottom: "20px", borderBottom: "3px solid #ccc" }}
      >
        <InvoiceDocument
          templateId="luxuryGold"
          invoice={FIXTURE_INVOICE}
          company={FIXTURE_COMPANY}
          cashierName="Test Cashier"
          locale="en"
          labels={FIXTURE_LABELS}
          settings={FIXTURE_SETTINGS}
          templateConfig={{
            languageMode: "bilingual",
            themePreset: "modernDark",
          }}
        />
      </section>
    </div>
  );
}
