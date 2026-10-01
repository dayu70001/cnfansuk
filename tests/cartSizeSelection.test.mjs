import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.join(currentDirectory, "..");
const cartSource = fs.readFileSync(path.join(rootDirectory, "lib", "cart.ts"), "utf8");
const cardSource = fs.readFileSync(path.join(rootDirectory, "components", "ProductCard.tsx"), "utf8");
const drawerSource = fs.readFileSync(path.join(rootDirectory, "components", "CartDrawer.tsx"), "utf8");
const detailSource = fs.readFileSync(path.join(rootDirectory, "components", "ProductDetailClient.tsx"), "utf8");
const cssSource = fs.readFileSync(path.join(rootDirectory, "app", "globals.css"), "utf8");
const compiled = ts.transpile(cartSource, { module: ts.ModuleKind.CommonJS });
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, { module: loadedModule, exports: loadedModule.exports });
const { ensureCartLineIds, getCartLineKey, updateCartItemSize } = loadedModule.exports;

const item = (size, quantity = 1, color = "Black") => ({
  productId: "product-1",
  slug: "product-1",
  name: "Test product",
  priceGBP: 20,
  color,
  size,
  quantity,
});

test("card additions stay unselected while product detail still requires and passes its chosen size", () => {
  assert.match(cardSource, /const size = "";/);
  assert.doesNotMatch(cardSource, /product\.sizes\[0\]/);
  assert.match(detailSource, /if \(!size\)\s*\{\s*setSizeError\(true\)/);
  assert.match(detailSource, /size,\s*quantity,/);
});

test("cart size selection uses the fixed customer sizes and blocks checkout only while a size is missing", () => {
  assert.match(drawerSource, /const CUSTOMER_SIZES = \["M", "L", "XL", "XXL"\]/);
  assert.match(drawerSource, /const isCustomerSize = \(size: string\) => CUSTOMER_SIZES\.includes\(size\)/);
  assert.match(drawerSource, /items\.some\(\(item\) => !isCustomerSize\(item\.size\)\)/);
  assert.match(drawerSource, /updateSize\(item, size\)/);
  assert.match(drawerSource, /if \(hasMissingSize\)\s*\{\s*event\.preventDefault\(\)/);
  assert.match(drawerSource, /Please select a size for all items\./);
});

test("changing a size updates one line and merges quantity with an existing identical variant", () => {
  const blank = item("");
  const changed = updateCartItemSize([blank], blank, "L");
  assert.equal(changed.length, 1);
  assert.equal(changed[0].size, "L");
  assert.equal(changed[0].quantity, 1);

  const existing = item("L", 2);
  const unselected = item("");
  const merged = updateCartItemSize([unselected, existing], unselected, "L");
  assert.equal(merged.length, 1);
  assert.equal(merged[0].size, "L");
  assert.equal(merged[0].quantity, 3);
});

test("a size edit preserves the cart row identity and does not affect another same-variant legacy line", () => {
  const first = { ...item("XL"), cartLineId: "line-first" };
  const second = { ...item("XL"), cartLineId: "line-second" };
  const resized = updateCartItemSize([first, second], second, "L");

  assert.equal(resized.length, 2);
  assert.equal(resized[0].size, "XL");
  assert.equal(resized[1].size, "L");
  assert.equal(resized[1].cartLineId, "line-second");
});

test("cart row keys remain stable when the selected size changes", () => {
  const before = { ...item("XL"), cartLineId: "stable-line" };
  const after = updateCartItemSize([before], before, "M")[0];

  assert.equal(getCartLineKey(before), "stable-line");
  assert.equal(getCartLineKey(after), "stable-line");
});

test("restored legacy cart rows receive unique persistent identities", () => {
  const legacy = [item("M"), item("M")];
  const restored = ensureCartLineIds(legacy);

  assert.ok(restored.every((cartItem) => cartItem.cartLineId));
  assert.notEqual(restored[0].cartLineId, restored[1].cartLineId);
  assert.equal(legacy[0].cartLineId, undefined);
});

test("mobile product sticky bar markup and styling are removed without removing normal product-page controls", () => {
  assert.doesNotMatch(detailSource, /pdp-mobile-bar/);
  assert.doesNotMatch(cssSource, /pdp-mobile-bar/);
  assert.match(detailSource, /Add to cart/);
  assert.match(detailSource, /Order now/);
  assert.match(cssSource, /\.pdp\s*\{[^}]*padding-bottom:\s*24px/s);
});
