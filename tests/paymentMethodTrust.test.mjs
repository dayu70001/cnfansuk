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

test("checkout creates the order from Delivery and accurately labels its receipt and WhatsApp step", () => {
  assert.match(checkoutSource, /fetchSiteSettings/);
  assert.match(checkoutFlowSource, /id: "details", label: "Details"/);
  assert.match(checkoutFlowSource, /id: "delivery", label: "Delivery"/);
  assert.match(checkoutFlowSource, /id: "payment", label: "Payment"/);
  assert.match(checkoutFlowSource, /fetch\("\/api\/orders"/);
  assert.match(checkoutFlowSource, /<h2>Order Received<\/h2>/);
  assert.match(checkoutFlowSource, /then choose a delivery method\./);
  assert.doesNotMatch(checkoutFlowSource, /then complete payment\./);
  assert.match(checkoutFlowSource, /"Confirm Order"/);
  assert.match(checkoutFlowSource, /"Placing Order\.\.\."/);
  assert.doesNotMatch(checkoutFlowSource, /Continue to Review &amp; Confirm|Place Order|ReviewStep/);
  assert.match(checkoutFlowSource, /type="email"[\s\S]*?autoComplete="email"/);
  assert.match(checkoutFlowSource, /type="tel" autoComplete="tel" inputMode="tel"/);
  assert.match(checkoutFlowSource, /onSuggestError=\{\(\) => setAutofillUnavailable\(true\)\}/);
  assert.match(checkoutFlowSource, /Find your address/);
  assert.match(checkoutFlowSource, /NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN/);
  assert.match(checkoutFlowSource, /Address lookup is not configured in this local preview\. Enter your address manually below\./);
  assert.doesNotMatch(checkoutFlowSource, /Address suggestions are unavailable\. Enter your address manually below\./);
  assert.match(checkoutFlowSource, /Address suggestions are unavailable\. Enter the address manually below\./);
  assert.match(checkoutFlowSource, /aria-expanded=\{open\}/);
  assert.match(checkoutFlowSource, /aria-controls="checkout-summary-mobile-content"/);
  assert.match(checkoutFlowSource, /aria-current=\{index === currentIndex \? "step" : undefined\}/);
  assert.match(checkoutFlowSource, /Awaiting Payment/);
  assert.match(checkoutFlowSource, /Our online checkout payment service is temporarily unavailable while we carry out maintenance\./);
  assert.match(checkoutFlowSource, /PayPal and bank transfer/);
  assert.match(checkoutFlowSource, /Continue on WhatsApp/);
  assert.match(checkoutFlowSource, /buildPersonalWhatsAppLink/);
  const messageStart = checkoutFlowSource.indexOf("const whatsappMessage = order");
  const messageEnd = checkoutFlowSource.indexOf("const whatsappHref", messageStart);
  const messageSource = checkoutFlowSource.slice(messageStart, messageEnd);
  assert.match(messageSource, /Hi CNFans UK, please confirm my order #\$\{order\.orderNumber\}/);
  assert.doesNotMatch(messageSource, /product|size|quantity|amount|items|subtotal|address|phone|email/i);
  assert.match(checkoutFlowSource, /target="_blank"/);
  assert.doesNotMatch(checkoutFlowSource, /stripe\/start|stripe\/checkout|payment-submitted|clearCart|add_payment_info|rememberSubmittedOrderAnalytics/);
  assert.doesNotMatch(checkoutFlowSource, /Account number|Sort code|checkout-bank-card|I've made the bank transfer/);
  assert.match(checkoutFlowSource, /const \{ items, cartRestored, removeSubmittedItems \} = useCart\(\)/);
  assert.match(checkoutFlowSource, /Your cart is empty/);
  assert.match(checkoutFlowSource, /Add some items to your cart before proceeding to checkout\./);
  assert.match(checkoutFlowSource, /fetch\("\/api\/orders\/quote"/);
  assert.match(checkoutFlowSource, /eligibilityCurrency/);
  assert.match(checkoutFlowSource, /expectedQuote: activeQuote/);
  const detailsTransitionStart = checkoutFlowSource.indexOf("function continueToDelivery()");
  const confirmOrderStart = checkoutFlowSource.indexOf("async function confirmOrder()");
  const completedStart = checkoutFlowSource.indexOf("function goToCompleted(");
  assert.ok(detailsTransitionStart >= 0 && confirmOrderStart > detailsTransitionStart && completedStart > confirmOrderStart);
  assert.doesNotMatch(checkoutFlowSource.slice(detailsTransitionStart, confirmOrderStart), /fetch\("\/api\/orders"/);
  assert.match(checkoutFlowSource.slice(confirmOrderStart, completedStart), /fetch\("\/api\/orders"/);
  assert.match(checkoutFlowSource, /submitLock\.current/);
  assert.match(checkoutFlowSource, /createCheckoutSessionId\(\)/);
  assert.match(productSource, /Order now/);
  assert.match(productSource, /router\.push\("\/checkout\?startNew=1", \{ scroll: false \}\)/);
  assert.match(productSource, /Add to cart/);
  assert.match(cartSource, /href="\/checkout\?startNew=1"/);
  assert.match(cartSource, /trackInitiateCheckout/);
  assert.doesNotMatch(productSource, /Contact on WhatsApp/);
  assert.doesNotMatch(cartSource, /Contact on WhatsApp|clearCart/);
});
