import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("complete sale applies only deterministic remaining deposit availability", async () => {
  const service = await source("backend/src/services/reservation.service.js");
  assert.match(service, /const availability = await sourcePaymentAvailability\(reservation\.id, companyId, transaction\);/);
  assert.match(service, /const applicableDepositUnits = availability\.reduce/);
  assert.match(service, /if \(applicableDepositUnits > agreedTotalUnits\)/);
  assert.match(service, /const applicationAllocations = allocateAcrossPayments\(availability, applicableDepositUnits\);/);
  assert.match(service, /appliedAmount: formatMoney\(allocation\.units\)/);
  assert.match(service, /remainingCustomerDue: formatMoney\(remainingCustomerDueUnits\)/);
  assert.doesNotMatch(service, /for \(const payment of payments\) \{\s*await models\.ReservationPaymentApplication\.create[\s\S]*appliedAmount: payment\.amount/);
});

test("deposit commands reject raw financial authority and derive branch context", async () => {
  const [service, resolver, routes] = await Promise.all([
    source("backend/src/services/reservation.service.js"),
    source("backend/src/services/reservation-financial-resolver.service.js"),
    source("backend/src/routes/erp.routes.js"),
  ]);
  assert.match(service, /LEGACY_BRANCHLESS_RESERVATION_MANUAL_REVIEW/);
  assert.match(service, /reservationFinancialResolver\.assertNoRawFinancialAuthority\(body\);/);
  assert.match(service, /resolveRequiredFinalSaleAccounts\(/);
  assert.match(service, /finalSaleAccounts,/);
  assert.match(resolver, /requireTreasury = true/);
  assert.match(routes, /router\.post\("\/reservations\/:id\/complete-sale"[\s\S]*resolveAuthorizedBranchId\(req, req\.headers\["x-branch-id"\], \{ required: true \}\)/);
  assert.doesNotMatch(routes, /completeSale\([\s\S]{0,500}branchId: req\.branchId \|\| req\.body\?\.branchId/);
});

test("refund and branch-settings contracts retain bounded branch-owned authority", async () => {
  const [service, settings, page] = await Promise.all([
    source("backend/src/services/reservation.service.js"),
    source("backend/src/services/reservation-deposit-settings.service.js"),
    source("app/[locale]/(dashboard)/sales/reservations/page.tsx"),
  ]);
  assert.match(service, /if \(requestedAmount > refundableUnits\)/);
  assert.match(service, /const allocations = allocateAcrossPayments\(availability, refundUnits\);/);
  assert.match(service, /refundStatus: "partial_executed"/);
  assert.match(settings, /DEPOSIT_CHANNEL_DUPLICATE/);
  assert.match(settings, /assertPostingAccount/);
  assert.match(page, /body: JSON\.stringify\(\{ amount, reason, refundMethod \}\)/);
  assert.doesNotMatch(page, /body: JSON\.stringify\(\{ treasuryAccountCode \}\)/);
});
