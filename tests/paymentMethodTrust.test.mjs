import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(projectRoot, file), "utf8");

const checkoutSource = read("app/checkout/page.tsx");
const productSource = read("components/ProductDetailClient.tsx");
const cartSource = read("components/CartDrawer.tsx");

test("obsolete Payment Trust blocks and payment badges are absent from Checkout, PDP and Cart", () => {
  for (const source of [checkoutSource, productSource, cartSource]) {
    assert.doesNotMatch(source, /PaymentMethodTrust|payment-trust|payment-method-mark/i);
    assert.doesNotMatch(source, /Cards and other secure payment methods accepted\.|Available payment methods may vary by country and device\.|Secure checkout with Stripe|Secure payments with Stripe/i);
    assert.doesNotMatch(source, /\bVisa\b|\bMastercard\b|Apple Pay|Google Pay/);
  }
  assert.doesNotMatch(checkoutSource, /Checkout and bank transfer are completed in GBP\./);
});

test("approved Stripe payment copy and pre-payment WhatsApp remain intact", () => {
  assert.match(checkoutSource, /<h2>Secure payment<\/h2>/);
  assert.match(checkoutSource, /Pay securely with Stripe/);
  assert.match(checkoutSource, /<strong>Payment pending<\/strong>/);
  assert.match(checkoutSource, /Continue to Secure Payment/);
  assert.match(checkoutSource, /Need help with sizing or anything else before paying\?/);
  assert.match(checkoutSource, /Chat on WhatsApp/);
  assert.match(checkoutSource, /href=\{whatsappHref\} target="_blank" rel="noopener noreferrer"/);
});
