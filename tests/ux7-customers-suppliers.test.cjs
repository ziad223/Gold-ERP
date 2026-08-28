const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const root = "I:/WORK/jewellery-erp-master";
const read = (relative) => fs.readFileSync(`${root}/${relative}`, "utf8");

const customerList = read("app/[locale]/(dashboard)/customers/page.tsx");
const customerDetail = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");
const supplierList = read("app/[locale]/(dashboard)/suppliers/page.tsx");
const supplierDetail = read("app/[locale]/(dashboard)/suppliers/[id]/page.tsx");
const styles = read("app/globals.css");

test("UX7 scopes presentation classes to Customer and Supplier surfaces", () => {
  for (const source of [customerList, customerDetail, supplierList, supplierDetail]) {
    assert.match(source, /ux7-page/);
    assert.match(source, /ux7-detail-page|ux7-stat-card|ux7-data-card|ux7-form-grid/);
  }
  assert.match(styles, /\.ux7-page \.ux7-stat-card/);
  assert.match(styles, /\.ux7-page \.ux7-data-table/);
});

test("UX7 preserves current search, mutation handlers, and identity authorities", () => {
  assert.match(customerList, /useCustomers\(/);
  assert.match(customerList, /useCustomerMutations\(/);
  assert.match(customerList, /handleQueryChange/);
  assert.match(customerList, /customer\.id/);
  assert.match(supplierList, /useSuppliers\(/);
  assert.match(supplierList, /useSupplierMutations\(/);
  assert.match(supplierList, /handleQueryChange/);
  assert.match(supplierList, /supplier\.id/);
  assert.match(customerDetail, /useCustomer\(id\)/);
  assert.match(supplierDetail, /useSupplier\(id\)/);
});

test("UX7 keeps financial displays and status/action behavior sourced from existing values", () => {
  assert.match(customerList, /money\(customer\.purchases\)/);
  assert.match(customerList, /money\(customer\.balance\)/);
  assert.match(customerList, /customer\.status !== "inactive"/);
  assert.match(supplierList, /money\(supplier\.due\)/);
  assert.match(supplierList, /supplier\.status !== "inactive"/);
  assert.match(supplierDetail, /accountingRepository\.payPurchaseOrder/);
  assert.match(supplierDetail, /accountingRepository\.reverseSupplierPayment/);
});

test("UX7 adds safe RTL/LTR readability and responsive presentation hooks only", () => {
  assert.match(customerList, /ux7-contact-value/);
  assert.match(customerList, /ux7-identifier/);
  assert.match(supplierList, /ux7-contact-value/);
  assert.match(supplierList, /ux7-identifier/);
  assert.match(styles, /unicode-bidi: plaintext/);
  assert.match(styles, /@media \(max-width: 640px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
