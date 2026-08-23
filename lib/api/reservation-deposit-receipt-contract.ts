const RDR_ID = /^RDR-[A-Za-z0-9-]+$/;
const RESERVATION_ID = /^RES-[A-Za-z0-9-]+$/;
const RECEIPT_NUMBER = /^DEP-[A-Za-z0-9-]+$/;

const requiredIdentifier = (value: unknown, label: string, pattern: RegExp) => {
  const normalized = String(value || "").trim();
  if (!pattern.test(normalized)) throw new Error(`Invalid ${label}.`);
  return normalized;
};

export function depositReceiptIdFromRouteParam(value: unknown) {
  return requiredIdentifier(value, "Deposit receipt ID", RDR_ID);
}

export function reservationIdFromRouteParam(value: unknown) {
  return requiredIdentifier(value, "Reservation ID", RESERVATION_ID);
}

/** Uses the immutable receipt document identifier (`RDR-...`). */
export function depositReceiptByIdPath(receiptId: string) {
  return `/reservation-deposit-receipts/${encodeURIComponent(depositReceiptIdFromRouteParam(receiptId))}`;
}

/** Uses the human-readable immutable receipt number (`DEP-...`). */
export function depositReceiptByNumberPath(receiptNumber: string) {
  return `/reservation-deposit-receipts/number/${encodeURIComponent(requiredIdentifier(receiptNumber, "Deposit receipt number", RECEIPT_NUMBER))}`;
}

/** Receipt history is owned by the reservation (`RES-...`), never a receipt pseudo-ID. */
export function reservationDepositReceiptHistoryPath(reservationId: string, limit = 50) {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.trunc(limit) : 50, 1), 200);
  return `/reservations/${encodeURIComponent(reservationIdFromRouteParam(reservationId))}/deposit-receipts?limit=${safeLimit}`;
}

export function depositReceiptDetailPagePath(receiptId: string) {
  return `/sales/reservations/receipts/${encodeURIComponent(depositReceiptIdFromRouteParam(receiptId))}`;
}

export function reservationDepositReceiptHistoryPagePath(reservationId: string) {
  return `/sales/reservations/${encodeURIComponent(reservationIdFromRouteParam(reservationId))}/receipt-history`;
}
