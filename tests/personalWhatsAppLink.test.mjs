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
const checkoutFlowSource = fs.readFileSync(path.join(root, "components/CheckoutFlow.tsx"), "utf8");
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

test("checkout WhatsApp message contains only the current saved order number", () => {
  const messageStart = checkoutFlowSource.indexOf("const whatsappMessage = order");
  const messageEnd = checkoutFlowSource.indexOf("const whatsappHref", messageStart);
  const messageSource = checkoutFlowSource.slice(messageStart, messageEnd);
  assert.match(messageSource, /Hi CNFans UK, please confirm my order #\$\{order\.orderNumber\}/);
  assert.doesNotMatch(messageSource, /product|size|quantity|amount|items|subtotal|address|phone|email/i);
  assert.match(checkoutFlowSource, /target="_blank" rel="noopener noreferrer"/);
  assert.match(detailSource, /Order now/);
  assert.match(detailSource, /router\.push\("\/checkout"\)/);
  assert.match(cartSource, /href="\/checkout"/);
  assert.match(cartSource, /updateSize\(item, size\)/);
  assert.doesNotMatch(checkoutFlowSource, /clearCart|payment-submitted|add_payment_info|stripe\/start|stripe\/checkout/);
  assert.doesNotMatch(cartSource, /Contact on WhatsApp|clearCart/);
  assert.doesNotMatch(detailSource, /Contact on WhatsApp/);
});
