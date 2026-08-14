import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("client navigation resolves canonical route params before receipt effects run", async () => {
  const [detail, history, contract, reservationPage] = await Promise.all([
    source("app/[locale]/(dashboard)/sales/reservations/receipts/[receiptId]/page.tsx"),
    source("app/[locale]/(dashboard)/sales/reservations/[id]/receipt-history/page.tsx"),
    source("lib/api/reservation-deposit-receipt-contract.ts"),
    source("app/[locale]/(dashboard)/sales/reservations/page.tsx"),
  ]);

  assert.match(detail, /useParams<\{ receiptId\?: string \}>\(\)/);
  assert.match(detail, /depositReceiptByIdPath\(receiptId\)/);
  assert.doesNotMatch(detail, /window\.location\.pathname/);
  assert.match(detail, /setReceipt\(null\);\s*setError\(null\);/);
  assert.match(detail, /return \(\) => \{ active = false; \};/);

  assert.match(history, /useParams<\{ id\?: string \}>\(\)/);
  assert.match(history, /reservationDepositReceiptHistoryPath\(reservationId\)/);
  assert.match(history, /depositReceiptDetailPagePath\(row\.id\)/);
  assert.doesNotMatch(history, /window\.location\.pathname/);
  assert.match(reservationPage, /reservationDepositReceiptHistoryPagePath\(selectedReservation\.id\)/);

  assert.match(contract, /const RDR_ID = \/\^RDR-/);
  assert.match(contract, /const RESERVATION_ID = \/\^RES-/);
  assert.match(contract, /const RECEIPT_NUMBER = \/\^DEP-/);
  assert.doesNotMatch(contract, /reservation-deposit-receipts\/receipt-history/);
});
