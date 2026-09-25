import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(currentDirectory, "..", "lib", "stripeCheckoutHandoff.ts"), "utf8");
const checkoutSource = fs.readFileSync(path.join(currentDirectory, "..", "app", "checkout", "page.tsx"), "utf8");
const fallbackComponentSource = fs.readFileSync(
  path.join(currentDirectory, "..", "components", "StripeBankTransferFallback.tsx"),
  "utf8",
);
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  URL,
});
const {
  getLocalStripeFallbackStorageKey,
  getLiveStripeSessionId,
  getLocalStripeTestSessionId,
  isStripeCheckoutUrl,
  isStripeLiveSuccessReturnUrl,
  isStripeTestSuccessReturnUrl,
  parseLocalStripeFallback,
  serializeLocalStripeFallback,
  shouldShowLocalStripeFallback,
} = loadedModule.exports;

test("uses the explicit server-returned Session ID and accepts secure hosted URLs, including custom domains", () => {
  assert.equal(getLocalStripeTestSessionId("cs_test_example123"), "cs_test_example123");
  assert.equal(getLocalStripeTestSessionId("cs_live_example123"), null);
  assert.equal(getLiveStripeSessionId("cs_live_example123"), "cs_live_example123");
  assert.equal(getLiveStripeSessionId("cs_test_example123"), null);
  assert.equal(isStripeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_live_example123"), true);
  assert.equal(isStripeCheckoutUrl("https://pay.example.test/c/pay/cs_live_example123"), true);
  assert.equal(isStripeCheckoutUrl("http://checkout.stripe.com/c/pay/cs_live_example123"), false);
  assert.equal(isStripeCheckoutUrl("https://user:pass@pay.example.test/c/pay/cs_live_example123"), false);
  assert.equal(getLocalStripeTestSessionId(undefined), null);
});

test("Test and Live fallback validators accept only their matching session prefixes", () => {
  assert.equal(isStripeLiveSuccessReturnUrl(
    "https://www.cnfans.co.uk/order-success?order=CNF-260924-1234&payment=stripe_live&session_id=cs_live_example123",
    "cs_live_example123",
    "CNF-260924-1234",
  ), true);
  assert.equal(isStripeLiveSuccessReturnUrl(
    "https://cnfansuk.vercel.app/order-success?order=CNF-260924-1234&payment=stripe_live&session_id=cs_live_example123",
    "cs_live_example123",
    "CNF-260924-1234",
  ), false);
  assert.equal(isStripeLiveSuccessReturnUrl(
    "https://www.cnfans.co.uk:443/order-success?order=CNF-260924-1234&payment=stripe_live&session_id=cs_live_example123",
    "cs_live_example123",
    "CNF-260924-1234",
  ), false);
  assert.equal(isStripeLiveSuccessReturnUrl(
    "https://www.cnfans.co.uk/order-success?order=CNF-260924-1234&payment=stripe_live&session_id=cs_live_example123&extra=x",
    "cs_live_example123",
    "CNF-260924-1234",
  ), false);
});

test("Test return URL is server supplied, loopback scoped and bound to the explicit Session ID", () => {
  const returnUrl = "http://localhost:4000/order-success?order=CNF-260924-1234&payment=stripe_test&session_id=cs_test_example123";
  assert.equal(isStripeTestSuccessReturnUrl(returnUrl, "cs_test_example123", "CNF-260924-1234", "http://localhost:4000"), true);
  assert.equal(isStripeTestSuccessReturnUrl(returnUrl, "cs_test_other456", "CNF-260924-1234", "http://localhost:4000"), false);
  assert.equal(isStripeTestSuccessReturnUrl(returnUrl, "cs_test_example123", "CNF-260924-1234", "https://www.cnfans.co.uk"), false);
  assert.equal(isStripeTestSuccessReturnUrl("https://evil.example/order-success?order=CNF-260924-1234&payment=stripe_test&session_id=cs_test_example123", "cs_test_example123", "CNF-260924-1234", "http://localhost:4000"), false);
  assert.equal(isStripeTestSuccessReturnUrl(returnUrl, "cs_test_example123", "LOCAL-CNF-TEST", "http://localhost:4000"), false);
});

test("fallback reuses only the same explicit Session, mode, order and secure existing Checkout URL", () => {
  const value = JSON.stringify({
    orderNumber: "CNF-260924-1234",
    sessionId: "cs_test_example123",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_example123",
    mode: "test",
  });
  assert.equal(parseLocalStripeFallback(value, "cs_test_example123", "CNF-260924-1234"), "https://checkout.stripe.com/c/pay/cs_test_example123");
  assert.equal(parseLocalStripeFallback(value, "cs_test_example123", "CNF-260924-9999"), null);
  assert.equal(parseLocalStripeFallback(value, "cs_test_other456", "CNF-260924-1234"), null);
  assert.equal(parseLocalStripeFallback(JSON.stringify({
    orderNumber: "CNF-260924-1234",
    sessionId: "cs_test_example123",
    checkoutUrl: "https://evil.example/c/pay/cs_test_example123",
  }), "cs_test_example123", "CNF-260924-1234"), null);
  assert.equal(parseLocalStripeFallback("not-json", "cs_test_example123", "CNF-260924-1234"), null);
  assert.equal(
    serializeLocalStripeFallback("https://checkout.stripe.com/c/pay/cs_test_example123", "cs_test_example123", "CNF-260924-1234"),
    value,
  );
  const customDomainValue = serializeLocalStripeFallback("https://pay.example.test/c/pay/cs_live_example123", "cs_live_example123", "CNF-260924-1234", "live");
  assert.equal(parseLocalStripeFallback(customDomainValue, "cs_live_example123", "CNF-260924-1234", "live"), "https://pay.example.test/c/pay/cs_live_example123");
  const liveValue = serializeLocalStripeFallback("https://checkout.stripe.com/c/pay/cs_live_example123", "cs_live_example123", "CNF-260924-1234", "live");
  assert.equal(parseLocalStripeFallback(liveValue, "cs_live_example123", "CNF-260924-1234", "live"), "https://checkout.stripe.com/c/pay/cs_live_example123");
  assert.equal(parseLocalStripeFallback(value, "cs_test_example123", "CNF-260924-1234", "live"), null);
  assert.equal(parseLocalStripeFallback(liveValue, "cs_live_example123", "CNF-260924-1234", "test"), null);
  assert.equal(serializeLocalStripeFallback("http://checkout.stripe.com/c/pay/cs_test_example123", "cs_test_example123", "CNF-260924-1234"), null);
  assert.equal(serializeLocalStripeFallback("https://user:pass@pay.example.test/c/pay/cs_test_example123", "cs_test_example123", "CNF-260924-1234"), null);
  assert.equal(serializeLocalStripeFallback("https://checkout.stripe.com/c/pay/cs_test_example123", "cs_live_example123", "CNF-260924-1234"), null);
  assert.equal(serializeLocalStripeFallback("https://checkout.stripe.com/c/pay/cs_test_example123", "cs_test_example123", "LOCAL-CNF-TEST"), null);
  assert.equal(getLocalStripeFallbackStorageKey("CNF-260924-1234"), "cnfansuk-local-stripe-bank-transfer-fallback:CNF-260924-1234");
  assert.equal(getLocalStripeFallbackStorageKey("LOCAL-CNF-TEST"), null);
});

test("paid hides the saved fallback while unpaid keeps it available", () => {
  assert.equal(shouldShowLocalStripeFallback("unpaid", "https://pay.example.test/c/pay/cs_test_example123"), true);
  assert.equal(shouldShowLocalStripeFallback("paid", "https://pay.example.test/c/pay/cs_test_example123"), false);
  assert.equal(shouldShowLocalStripeFallback("unpaid", null), false);
});

test("Stripe tab is opened synchronously before creating its Checkout Session", () => {
  const start = checkoutSource.indexOf("async function continueToLocalBankPayment()");
  const end = checkoutSource.indexOf("const isLocalStripeOrder", start);
  const handler = checkoutSource.slice(start, end);
  const openTab = handler.indexOf('window.open("about:blank", "_blank")');
  const createSession = handler.indexOf('await fetch("/api/payments/stripe/checkout"');
  assert.ok(openTab >= 0 && createSession > openTab);
  const persistFallback = handler.indexOf('window.sessionStorage.setItem(fallbackKey, serializedFallback)');
  const navigateOriginalTab = handler.indexOf("window.location.assign(localReturnUrl || liveReturnUrl!)");
  assert.ok(persistFallback >= createSession && navigateOriginalTab > persistFallback);
  assert.doesNotMatch(handler, /window\.location\.assign\(result\.checkoutUrl\)/);
  assert.match(handler, /getStripeSessionId\(result\.sessionId, localStripeMode\)/);
  assert.match(handler, /serializeLocalStripeFallback\(result\.checkoutUrl, sessionId, order\.orderNumber, localStripeMode\)/);
  assert.doesNotMatch(handler, /getStripeSessionId\(result\.checkoutUrl/);
  assert.match(handler, /window\.location\.assign\(localReturnUrl \|\| liveReturnUrl!/);
  assert.equal((handler.match(/await fetch\("\/api\/payments\/stripe\/checkout"/g) || []).length, 1);
});

test("blocked-popup fallback links to the stored same-session URL", () => {
  assert.match(fallbackComponentSource, /target="_blank" rel="noopener noreferrer"/);
  assert.match(fallbackComponentSource, /parseLocalStripeFallback\(serialized, sessionId, orderNumber, mode\)/);
  assert.match(fallbackComponentSource, /shouldShowLocalStripeFallback\(paymentStatus, checkoutUrl \|\| null\)/);
  assert.match(fallbackComponentSource, /href=\{checkoutUrl\}/);
  assert.doesNotMatch(fallbackComponentSource, /fetch\(["']\/api\/payments\/stripe\/checkout/);
  assert.match(fallbackComponentSource, /getLocalStripeFallbackStorageKey\(orderNumber\)/);
});
