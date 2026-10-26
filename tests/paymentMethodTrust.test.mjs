import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(projectRoot, file), "utf8");

const checkoutSource = read("app/checkout/page.tsx");
const checkoutFlowSource = read("components/CheckoutFlow.tsx");
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

test("checkout restores Details and Delivery and shows the approved WhatsApp-only Payment copy", () => {
  assert.match(checkoutSource, /fetchSiteSettings/);
  assert.match(checkoutFlowSource, /id: "details", label: "Details"/);
  assert.match(checkoutFlowSource, /id: "delivery", label: "Delivery"/);
  assert.match(checkoutFlowSource, /id: "payment", label: "Payment"/);
  assert.match(checkoutFlowSource, /fetch\("\/api\/orders"/);
  assert.match(checkoutFlowSource, /<h2>Online Payment Temporarily Unavailable<\/h2>/);
  assert.match(checkoutFlowSource, /We&apos;re currently updating our payment arrangements, so online payment is temporarily unavailable\./);
  assert.match(checkoutFlowSource, /Your order has been created, but no payment has been taken\. Please contact us on WhatsApp to confirm your order and receive the next steps\./);
  assert.match(checkoutFlowSource, /<strong>Awaiting Confirmation<\/strong>/);
  assert.match(checkoutFlowSource, /Confirm Order on WhatsApp/);
  assert.match(checkoutFlowSource, /buildPersonalWhatsAppLink/);
  assert.match(checkoutFlowSource, /Product Code: \$\{item\.productCode \|\| item\.productId\}/);
  assert.match(checkoutFlowSource, /Size: \$\{item\.size/);
  assert.match(checkoutFlowSource, /Quantity: \$\{item\.quantity\}/);
  assert.match(checkoutFlowSource, /Order amount: \$\{formatMoney\(order\.finalTotal/);
  assert.match(checkoutFlowSource, /target="_blank"/);
  assert.doesNotMatch(checkoutFlowSource, /stripe\/start|stripe\/checkout|payment-submitted|clearCart|add_payment_info|rememberSubmittedOrderAnalytics/);
  assert.doesNotMatch(checkoutFlowSource, /Account number|Sort code|checkout-bank-card|I've made the bank transfer/);
  assert.match(productSource, /Order now/);
  assert.match(productSource, /router\.push\("\/checkout"\)/);
  assert.match(productSource, /Add to cart/);
  assert.match(cartSource, /href="\/checkout"/);
  assert.match(cartSource, /trackInitiateCheckout/);
  assert.doesNotMatch(productSource, /Contact on WhatsApp/);
  assert.doesNotMatch(cartSource, /Contact on WhatsApp|clearCart/);
});
