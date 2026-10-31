import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const provider = read("components/CartProvider.tsx");
const drawer = read("components/CartDrawer.tsx");
const product = read("components/ProductDetailClient.tsx");
const css = read("app/globals.css");

test("cart checkout entry leaves the old page in place and positions Checkout after navigation", () => {
  assert.match(drawer, /href="\/checkout\?startNew=1"[\s\S]*?scroll=\{false\}[\s\S]*?closeCart\(\)/);
  assert.match(provider, /closeCart: \(\) => setIsOpen\(false\)/);
  assert.doesNotMatch(provider, /scrollToTop|skipScrollRestoreOnClose/);
  assert.match(provider, /window\.scrollTo\(\{ top: lockedScrollY\.current, left: 0, behavior: "instant" \}\)/);
  assert.match(css, /html\s*\{\s*scroll-behavior:\s*smooth;/);
  assert.match(read("components/CheckoutFlow.tsx"), /const shouldPositionFreshEntry = startNewCheckout && !startEntryTopHandled\.current/);
});
test("product Order now navigates without pre-scrolling the source page", () => {
  assert.doesNotMatch(product, /scrollPageInstantlyToTop|window\.scrollTo/);
  assert.match(product, /router\.push\("\/checkout\?startNew=1", \{ scroll: false \}\)/);
  assert.match(read("components/CheckoutFlow.tsx"), /window\.scrollTo\(\{ top, left: 0, behavior: "instant" \}\)/);
});
