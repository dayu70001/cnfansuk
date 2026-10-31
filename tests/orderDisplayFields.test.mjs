import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "lib", "orderDisplayFields.ts"), "utf8");
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, { module: loadedModule, exports: loadedModule.exports });
const { formatOrderAddressForCopy, formatOrderCustomerDetailsForCopy, getOrderAddressFields, getOrderContactFields, getOrderDeliveryFields } = loadedModule.exports;

test("customer, address, and delivery displays share persisted order fields and omit empty optionals", () => {
  const order = {
    customerName: "QA Recipient",
    email: "qa@example.invalid",
    phone: "07700000000",
    addressLine1: "10 Long Street, Building B",
    addressLine2: "",
    city: "Testford",
    county: null,
    postcode: "ZZ99 9ZZ",
    countryName: "United Kingdom",
    shippingMethodLabel: "Royal Mail Tracked",
    shippingEstimate: "7–12 business days",
  };

  assert.deepEqual(JSON.parse(JSON.stringify(getOrderContactFields(order))), [
    { key: "name", value: "QA Recipient" },
    { key: "email", value: "qa@example.invalid" },
    { key: "phone", value: "07700000000" },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(getOrderAddressFields(order))), [
    { key: "recipient", value: "QA Recipient" },
    { key: "addressLine1", value: "10 Long Street, Building B" },
    { key: "city", value: "Testford" },
    { key: "postcode", value: "ZZ99 9ZZ" },
    { key: "country", value: "United Kingdom" },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(getOrderDeliveryFields(order))), [
    { key: "shippingMethod", value: "Royal Mail Tracked" },
    { key: "estimatedDelivery", value: "7–12 business days" },
  ]);
});

test("blank required and optional snapshot values are omitted without modifying non-empty values", () => {
  const addressLine = "  Flat 2, 10 Example Road  ";
  const order = { customerName: "  Recipient  ", addressLine1: addressLine, addressLine2: "   " };
  assert.deepEqual(JSON.parse(JSON.stringify(getOrderAddressFields(order))), [
    { key: "recipient", value: "  Recipient  " },
    { key: "addressLine1", value: addressLine },
  ]);
});

test("complete address copy uses each saved address field on its own line and omits blank optionals", () => {
  const order = {
    customerName: "  QA Recipient  ",
    addressLine1: "  10 Long Street, Building B  ",
    addressLine2: "Flat 2",
    city: "Testford",
    county: "Testshire",
    postcode: "ZZ9 9ZZ",
    countryName: "United Kingdom",
  };
  assert.equal(formatOrderAddressForCopy(order), [
    "  QA Recipient  ",
    "  10 Long Street, Building B  ",
    "Flat 2",
    "Testford",
    "Testshire",
    "ZZ9 9ZZ",
    "United Kingdom",
  ].join("\n"));
  assert.equal(formatOrderAddressForCopy({ customerName: "Recipient", addressLine1: "1 Main Road", addressLine2: "  ", city: "Town", county: null, postcode: "AB1 2CD", countryName: "GB" }), [
    "Recipient", "1 Main Road", "Town", "AB1 2CD", "GB",
  ].join("\n"));
});

test("complete customer details copy includes labelled contact and original address fields in order", () => {
  const order = {
    customerName: "  QA Recipient  ",
    phone: "+44 7700 900000",
    email: "qa@example.test",
    addressLine1: "  24 Example Road  ",
    addressLine2: "Flat 2B",
    city: "London",
    county: "Greater London",
    postcode: "SW1A 1AA",
    countryName: "United Kingdom",
  };
  assert.equal(formatOrderCustomerDetailsForCopy(order), [
    "收件人：  QA Recipient  ",
    "电话：+44 7700 900000",
    "邮箱：qa@example.test",
    "地址 1：  24 Example Road  ",
    "地址 2：Flat 2B",
    "城市：London",
    "郡 / 省 / 州：Greater London",
    "邮编：SW1A 1AA",
    "国家：United Kingdom",
  ].join("\n"));
});

test("complete customer details copy omits blank optional address fields without adding unrelated values", () => {
  assert.equal(formatOrderCustomerDetailsForCopy({
    customerName: "QA Recipient",
    phone: "  ",
    email: "qa@example.test",
    addressLine1: "1 Main Road",
    addressLine2: "\t",
    city: "Town",
    county: null,
    postcode: "AB1 2CD",
    countryName: "GB",
  }), [
    "收件人：QA Recipient",
    "邮箱：qa@example.test",
    "地址 1：1 Main Road",
    "城市：Town",
    "邮编：AB1 2CD",
    "国家：GB",
  ].join("\n"));
});
