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
const providerSource = fs.readFileSync(path.join(rootDirectory, "components", "CartProvider.tsx"), "utf8");
const detailSource = fs.readFileSync(path.join(rootDirectory, "components", "ProductDetailClient.tsx"), "utf8");
const sizeLookupRouteSource = fs.readFileSync(path.join(rootDirectory, "app", "api", "cart", "product-sizes", "route.ts"), "utf8");
const cssSource = fs.readFileSync(path.join(rootDirectory, "app", "globals.css"), "utf8");
const checkoutSource = fs.readFileSync(path.join(rootDirectory, "components", "CheckoutFlow.tsx"), "utf8");
const productSizesSource = fs.readFileSync(path.join(rootDirectory, "lib", "productSizes.ts"), "utf8");
const productSizesModule = { exports: {} };
vm.runInNewContext(ts.transpile(productSizesSource, { module: ts.ModuleKind.CommonJS }), {
  module: productSizesModule,
  exports: productSizesModule.exports,
});
const compiled = ts.transpile(cartSource, { module: ts.ModuleKind.CommonJS });
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  require: (specifier) => {
    if (specifier === "./productSizes") return productSizesModule.exports;
    throw new Error(`Unexpected test module: ${specifier}`);
  },
});
const { ensureCartLineIds, getCartItemLookupSlug, getCartItemSizeLookupKey, getCartItemSizeOptions, getCartLineKey, hasValidCartItemSize, mergeCartItemSizeOptions, removeSubmittedCartItems, updateCartItemSize } = loadedModule.exports;

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
  assert.match(cardSource, /availableSizes:\s*product\.sizes/);
  assert.match(detailSource, /if \(!size\)\s*\{\s*setSizeError\(true\)/);
  assert.match(detailSource, /availableSizes:\s*purchaseSizes/);
  assert.match(detailSource, /size,\s*availableSizes:\s*purchaseSizes,\s*quantity,/);
  assert.match(cssSource, /\.product \.add\s*\{[^}]*display:\s*block;[^}]*opacity:\s*1;[^}]*transform:\s*none;/s);
  assert.doesNotMatch(cssSource, /\.product \.add\s*\{\s*display:\s*none;/);
});

test("cart uses one compact native select populated from each product's current options", () => {
  assert.match(drawerSource, /<select[\s\S]*?className=\{`cart-size-select/);
  assert.match(drawerSource, /aria-label=\{hasValidCartItemSize\(item\) \? `Change size for \$\{item\.name\}` : "Select size"\}/);
  assert.match(drawerSource, /<option value="">Select<\/option>/);
  assert.match(drawerSource, /getCartItemSizeOptions\(item\)\.map\(\(size\)/);
  assert.match(drawerSource, /onChange=\{\(event\) => updateSize\(item, event\.currentTarget\.value\)\}/);
  assert.doesNotMatch(drawerSource, /cart-size-options|openSizeLine|CUSTOMER_SIZES/);
  assert.doesNotMatch(cssSource, /cart-size-options/);
  assert.match(cartSource, /item\.availableSizes/);
  assert.doesNotMatch(cartSource, /FIXED_CLOTHING_PURCHASE_SIZES/);
  assert.deepEqual(Array.from(getCartItemSizeOptions({ ...item(""), availableSizes: ["XS", "S", "L"] })), ["XS", "S", "L"]);
  assert.deepEqual(Array.from(getCartItemSizeOptions(item(""))), []);
  assert.deepEqual(Array.from(getCartItemSizeOptions(item("XL"))), []);
  assert.equal(hasValidCartItemSize({ ...item("L"), availableSizes: ["S", "M", "L"] }), true);
  assert.equal(hasValidCartItemSize({ ...item("L"), availableSizes: ["S", "M"] }), false);
  assert.match(cssSource, /\.cart-size-select\s*\{[^}]*width:\s*82px;[^}]*height:\s*36px;/s);
  assert.match(cssSource, /text-align-last:\s*center/);
  assert.doesNotMatch(cssSource.match(/\.cart-size-select\s*\{([^}]+)\}/s)?.[1] || "", /flex:\s*1|width:\s*100%/);
});

test("legacy cart size options restore through one read-only lookup per product", () => {
  const legacy = item("L");
  assert.equal(getCartItemLookupSlug(legacy), "product-1");
  assert.equal(getCartItemSizeLookupKey(legacy), "product-1");
  assert.match(providerSource, /sizeLookupRequests\.current\.has\(key\)/);
  assert.match(providerSource, /fetch\(`\/api\/cart\/product-sizes\?slug=/);
  assert.match(sizeLookupRouteSource, /export async function GET/);
  assert.match(sizeLookupRouteSource, /fetchCatalogSizeOptionsBySlug\(slug\)/);
  assert.match(fs.readFileSync(path.join(rootDirectory, "lib", "catalogApi.ts"), "utf8"), /return response\?\.product \? getSupplierSizes\(response\.product\.options\) : null/);
  assert.doesNotMatch(sizeLookupRouteSource, /export async function (?:POST|PUT|DELETE)/);

  const restored = mergeCartItemSizeOptions(legacy, ["S", "M", "XL"]);
  assert.equal(restored.size, "L");
  assert.equal(restored.sizeOptionsResolved, true);
  assert.deepEqual(Array.from(restored.availableSizes), ["S", "M", "XL"]);
  assert.equal(hasValidCartItemSize(restored), false);
  assert.match(drawerSource, /\{item\.size\} \(\{item\.sizeOptionsResolved \|\| item\.sizeOptionsFailed \? "unavailable" : "checking"\}\)/);

  const unavailable = mergeCartItemSizeOptions(item(""), []);
  assert.deepEqual(Array.from(unavailable.availableSizes), []);
  assert.equal(unavailable.size, "");
  assert.equal(unavailable.sizeOptionsResolved, true);
  assert.match(drawerSource, /Size options unavailable\. Open the product page to check\./);
  assert.doesNotMatch(cartSource, /\["M",\s*"L",\s*"XL",\s*"XXL"\]/);
});

test("quantity and remove controls keep compact visuals and accessible hit areas", () => {
  assert.match(drawerSource, /className="cart-quantity-control" role="group"/);
  assert.match(drawerSource, /aria-label="Remove item"/);
  assert.match(cssSource, /\.cart-quantity-control\s*\{[^}]*height:\s*38px;[^}]*border:\s*1px solid/s);
  assert.match(cssSource, /\.quantity-row \.cart-quantity-control button\s*\{[^}]*flex:\s*0 0 44px;[^}]*width:\s*44px;/s);
  assert.match(cssSource, /\.quantity-row \.cart-remove\s*\{[^}]*flex:\s*0 0 44px/s);
  assert.match(cssSource, /\.cart-summary\s*\{[^}]*env\(safe-area-inset-bottom/s);
  assert.match(cssSource, /\.cart-continue\s*\{[^}]*min-height:\s*44px/s);
});

test("cart size selection remains optional until Checkout and preserves the established validation", () => {
  assert.match(drawerSource, /items\.some\(\(item\) => !hasValidCartItemSize\(item\)\)/);
  assert.match(drawerSource, /onChange=\{\(event\) => updateSize\(item, event\.currentTarget\.value\)\}/);
  assert.match(drawerSource, /if \(hasMissingSize\)\s*\{\s*event\.preventDefault\(\)/);
  assert.match(drawerSource, /Please select a size for all items\./);
  assert.match(drawerSource, /Checkout/);
  assert.match(drawerSource, /href="\/checkout\?startNew=1"/);
  assert.match(drawerSource, /trackInitiateCheckout/);
  assert.doesNotMatch(drawerSource, /Contact on WhatsApp|clearCart/);
  assert.match(checkoutSource, /size:\s*item\.size,/);
  assert.doesNotMatch(checkoutSource.match(/items:\s*items\.map\(\(item\) => \(\{[\s\S]*?\}\)\),/)?.[0] || "", /availableSizes/);
});

test("changing a size updates one line and merges quantity with an existing identical variant", () => {
  const blank = item("");
  const sizedBlank = { ...blank, availableSizes: ["M", "L", "XL"] };
  const changed = updateCartItemSize([sizedBlank], sizedBlank, "L");
  assert.equal(changed.length, 1);
  assert.equal(changed[0].size, "L");
  assert.equal(changed[0].quantity, 1);

  const existing = { ...item("L", 2), availableSizes: ["M", "L", "XL"] };
  const unselected = { ...item(""), availableSizes: ["M", "L", "XL"] };
  const merged = updateCartItemSize([unselected, existing], unselected, "L");
  assert.equal(merged.length, 1);
  assert.equal(merged[0].size, "L");
  assert.equal(merged[0].quantity, 3);
  assert.deepEqual(Array.from(merged[0].availableSizes), ["M", "L", "XL"]);
});

test("submitted cart cleanup removes only the submitted quantity and preserves later additions or edits", () => {
  const submitted = { ...item("M", 2), cartLineId: "line-submitted", productCode: "CNF-ITEM-1" };
  const quantityAfterNewAddition = { ...submitted, quantity: 5 };
  const changedSize = { ...submitted, size: "L", quantity: 1 };
  const removedAndReadded = { ...submitted, cartLineId: "line-readded", quantity: 1 };
  const unrelated = { ...item("XL"), productId: "product-2", cartLineId: "line-other" };

  const remaining = removeSubmittedCartItems(
    [quantityAfterNewAddition, changedSize, removedAndReadded, unrelated],
    [submitted],
  );

  assert.equal(remaining.length, 4);
  assert.equal(remaining.find((line) => line.cartLineId === "line-submitted")?.quantity, 3);
  assert.equal(remaining.find((line) => line.cartLineId === "line-submitted" && line.size === "L")?.quantity, 1);
  assert.equal(remaining.find((line) => line.cartLineId === "line-readded")?.quantity, 1);
  assert.equal(remaining.find((line) => line.cartLineId === "line-other")?.quantity, 1);

  assert.deepEqual(removeSubmittedCartItems([{ ...submitted }], [submitted]), []);
});

test("a size edit preserves row identity when current product options are available", () => {
  const first = { ...item("XL"), availableSizes: ["M", "L", "XL"], cartLineId: "line-first" };
  const second = { ...item("XL"), availableSizes: ["M", "L", "XL"], cartLineId: "line-second" };
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
  assert.match(detailSource, /trackInitiateCheckout/);
  assert.match(detailSource, /router\.push\("\/checkout\?startNew=1", \{ scroll: false \}\)/);
  assert.match(cssSource, /\.pdp\s*\{[^}]*padding-bottom:\s*24px/s);
});
