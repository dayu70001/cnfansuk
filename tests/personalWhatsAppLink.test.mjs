import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helperSource = fs.readFileSync(path.join(root, "lib/personalWhatsAppLink.ts"), "utf8");
const detailSource = fs.readFileSync(path.join(root, "components/ProductDetailClient.tsx"), "utf8");
const cartSource = fs.readFileSync(path.join(root, "components/CartDrawer.tsx"), "utf8");
const loadedModule = { exports: {} };
vm.runInNewContext(ts.transpile(helperSource, { module: ts.ModuleKind.CommonJS }), {
  module: loadedModule,
  exports: loadedModule.exports,
  URL,
});
const { buildPersonalWhatsAppLink } = loadedModule.exports;

test("personal WhatsApp URL keeps the configured customer-service number and adds only the requested message", () => {
  const link = buildPersonalWhatsAppLink(
    { personalWhatsappUrl: "https://api.whatsapp.com/send?phone=85251200580", personalWhatsappNumber: "85251200580" },
    "Hi, help please.",
  );
  const url = new URL(link);
  assert.equal(url.hostname, "api.whatsapp.com");
  assert.equal(url.searchParams.get("phone"), "85251200580");
  assert.equal(url.searchParams.get("text"), "Hi, help please.");
});

test("WhatsApp helper rejects public channel links and safely falls back to the personal number", () => {
  const link = buildPersonalWhatsAppLink(
    { personalWhatsappUrl: "https://whatsapp.com/channel/12345", personalWhatsappNumber: "+44 7700 900123" },
    "Cart question",
  );
  const url = new URL(link);
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/447700900123");
  assert.equal(url.searchParams.get("text"), "Cart question");
  assert.equal(buildPersonalWhatsAppLink({ personalWhatsappNumber: "not a number" }, "Hello"), null);
});

test("product and cart WhatsApp messages include the chosen product/cart details without changing cart or payment state", () => {
  assert.match(detailSource, /Product: \$\{product\.name\}/);
  assert.match(detailSource, /Product Code: \$\{publicProductCode\}/);
  assert.match(detailSource, /Size: \$\{size/);
  assert.match(detailSource, /Quantity: \$\{quantity\}/);
  assert.match(cartSource, /Product Code: \$\{item\.productCode \|\| item\.productId\}/);
  assert.match(cartSource, /Size: \$\{item\.size/);
  assert.match(cartSource, /Quantity: \$\{item\.quantity\}/);
  assert.match(cartSource, /updateSize\(item, size\)/);
  assert.doesNotMatch(cartSource, /clearCart|trackInitiateCheckout|href="\/checkout"/);
  assert.doesNotMatch(detailSource, /addSelectedItem\(false\)|router\.push\("\/checkout"\)|trackInitiateCheckout/);
});
