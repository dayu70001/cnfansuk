import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageRoute = fs.readFileSync(path.join(root, "app/api/admin/orders/[orderNumber]/confirmation-image/route.tsx"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "workers/catalog-api/src/index.ts"), "utf8");

test("order confirmation image uses shared customer, address, and delivery snapshot mapping", () => {
  assert.match(imageRoute, /getOrderContactFields\(displaySnapshot\)/);
  assert.match(imageRoute, /getOrderAddressFields\(displaySnapshot\)/);
  assert.match(imageRoute, /getOrderDeliveryFields\(displaySnapshot\)/);
  assert.match(imageRoute, /SHIPPING ADDRESS/);
  assert.match(imageRoute, /ORDER_ADDRESS_FIELD_LABELS\[field\.key\]/);
  assert.match(imageRoute, /ORDER_CONTACT_FIELD_LABELS\[field\.key\]/);
  assert.match(imageRoute, /ORDER_DELIVERY_FIELD_LABELS\[field\.key\]/);
  assert.doesNotMatch(imageRoute, /const address\s*=\s*\[order\.address_line1/);
  assert.match(imageRoute, /objectFit:\s*"contain"/);
  assert.match(imageRoute, /const height = 1120 \+ Math\.max\(0, items\.length - 1\) \* 190 \+ wrappedAddressLines \* 28/);
});

test("receipt API keeps the persisted creation time instead of fabricating one in the UI", () => {
  assert.match(workerSource, /SELECT created_at FROM orders WHERE id = \? LIMIT 1/);
  assert.match(workerSource, /created_at: createdAt/);
  assert.match(workerSource, /createdAt: order\.created_at \|\| undefined/);
});
