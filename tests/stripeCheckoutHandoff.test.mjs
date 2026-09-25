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
const statusComponentSource = fs.readFileSync(path.join(currentDirectory, "..", "components", "StripePaymentStatus.tsx"), "utf8");
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  URL,
});
const {
  getLiveStripeSessionId,
  getLocalStripeTestSessionId,
  isStripeCheckoutUrl,
  isStripeLiveSuccessReturnUrl,
  isStripeTestSuccessReturnUrl,
  openStripeStartWindow,
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

test("Live return URL validator accepts only the canonical success destination and matching Live session", () => {
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

test("opens a real same-origin Stripe start URL and severs opener synchronously", () => {
  const handle = { opener: {}, close() { this.closed = true; } };
  let call;
  const opened = openStripeStartWindow(
    "/api/payments/stripe/start?order=CNF-260924-1234",
    (url, target) => {
      call = { url, target };
      return handle;
    },
  );
  assert.equal(opened, true);
  assert.deepEqual(call, {
    url: "/api/payments/stripe/start?order=CNF-260924-1234",
    target: "_blank",
  });
  assert.equal(handle.opener, null);
  assert.equal(handle.closed, undefined);
});

test("popup blocked or opener isolation failure keeps the original checkout available", () => {
  let calls = 0;
  assert.equal(openStripeStartWindow("/api/payments/stripe/start?order=CNF-260924-1234", () => {
    calls += 1;
    return null;
  }), false);
  assert.equal(calls, 1);

  const handle = { get opener() { return {}; }, set opener(_value) { throw new Error("blocked"); }, close() { this.closed = true; } };
  assert.equal(openStripeStartWindow("/api/payments/stripe/start?order=CNF-260924-1234", () => handle), false);
  assert.equal(handle.closed, true);
});

test("Live/Test checkout opens the start route before async work and processing is pending-only", () => {
  const start = checkoutSource.indexOf("async function continueToLocalBankPayment()");
  const end = checkoutSource.indexOf("const isLocalStripeOrder", start);
  const handler = checkoutSource.slice(start, end);
  const startWindow = handler.indexOf("openStripeStartWindow(startUrl");
  const processingNavigation = handler.indexOf("router.replace(`/payments/stripe/processing?order=");
  const mockRequest = handler.indexOf('await fetch("/api/payments/stripe/checkout"');
  assert.ok(startWindow >= 0 && processingNavigation > startWindow);
  assert.ok(mockRequest > processingNavigation);
  assert.match(handler, /window\.open\(url, target\)/);
  assert.match(handler, /Unable to open payment page\. Please try again\./);
  assert.match(handler, /if \(!opened\)[\s\S]*?return;/);
  assert.doesNotMatch(handler, /about:blank|paymentWindow|sessionStorage|fallbackCheckoutUrl|serializeLocalStripeFallback|window\.location\.assign/);
  assert.equal((handler.match(/await fetch\("\/api\/payments\/stripe\/checkout"/g) || []).length, 1);
  assert.match(handler, /localStripeRequestInFlight\.current/);
  assert.match(handler, /localStripeRequestInFlight\.current = false;\s*setSubmitting\(false\);\s*setSubmitError\("Unable to open payment page/);
  assert.match(checkoutSource, /<button className="btn btn-solid" type="button" onClick=\{onContinue\} disabled=\{submitting\}>/);
  const processingSource = fs.readFileSync(path.join(currentDirectory, "..", "app", "payments", "stripe", "processing", "page.tsx"), "utf8");
  assert.match(processingSource, /<h1>Payment processing<\/h1>/);
  assert.match(processingSource, /Waiting for payment confirmation\./);
  assert.match(processingSource, /Order #\{order\}/);
  assert.match(processingSource, /Confirm order on WhatsApp/);
  assert.match(processingSource, /getOrderAccessTokenFromCookieHeader\([^\n]*"processing"\)/);
  assert.match(processingSource, /loadAuthorizedOrder\(order, accessToken\)/);
  assert.doesNotMatch(processingSource, /Payment successful|Payment completed|Order completed|StripePaymentStatus|session_id/);
  assert.doesNotMatch(checkoutSource, /Open Bank Transfer/);
  assert.doesNotMatch(checkoutSource, /separate secure Stripe page|Keep this page open/);
  assert.doesNotMatch(source, /Fallback|fallback|sessionStorage/);
  assert.doesNotMatch(statusComponentSource, /StripeBankTransferFallback/);
  assert.match(statusComponentSource, /session-status/);
  assert.match(statusComponentSource, /setInterval/);
  assert.match(statusComponentSource, /addEventListener\("focus"/);
  assert.match(statusComponentSource, /addEventListener\("visibilitychange"/);
});

test("new-tab checkout navigation does not affect server Session creation or Dynamic Payment Methods", () => {
  const stripeServerSource = fs.readFileSync(path.join(currentDirectory, "..", "lib", "payments", "stripeServer.ts"), "utf8");
  const sessionCreator = stripeServerSource.slice(
    stripeServerSource.indexOf("export async function createStripeBankTransferCheckout"),
    stripeServerSource.indexOf("export async function createLocalStripeTestCheckout"),
  );
  assert.match(sessionCreator, /stripe\.customers\.create\(/);
  assert.match(sessionCreator, /stripe\.checkout\.sessions\.create\(/);
  assert.match(sessionCreator, /stripeCustomerIdempotencyKey/);
  assert.match(sessionCreator, /stripeCheckoutIdempotencyKey/);
  assert.doesNotMatch(sessionCreator, /payment_method_types\s*:|payment_method_configuration\s*:|payment_method_options\s*:/);
  assert.match(sessionCreator, /product_data:\s*\{\s*name:\s*"Order payment"\s*\}/);
  assert.match(sessionCreator, /client_reference_id:\s*orderNumber/);
  assert.match(sessionCreator, /success_url:\s*returnUrls\.successUrl/);
  assert.match(sessionCreator, /cancel_url:\s*returnUrls\.cancelUrl/);
});
