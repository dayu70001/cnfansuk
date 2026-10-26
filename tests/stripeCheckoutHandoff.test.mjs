import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(currentDirectory, "..", "lib", "stripeCheckoutHandoff.ts"), "utf8");
const checkoutFlowSource = fs.readFileSync(path.join(currentDirectory, "..", "components", "CheckoutFlow.tsx"), "utf8");
const startRouteSource = fs.readFileSync(path.join(currentDirectory, "..", "app", "api", "payments", "stripe", "start", "route.ts"), "utf8");
const productSource = fs.readFileSync(path.join(currentDirectory, "..", "components", "ProductDetailClient.tsx"), "utf8");
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

test("normal checkout flow is restored while its final payment step is WhatsApp-only", () => {
  assert.match(checkoutFlowSource, /fetch\("\/api\/orders"/);
  assert.match(checkoutFlowSource, /Online Payment Temporarily Unavailable/);
  assert.match(checkoutFlowSource, /Confirm Order on WhatsApp/);
  assert.doesNotMatch(checkoutFlowSource, /openStripeStartWindow|\/api\/payments\/stripe\/start|\/api\/payments\/stripe\/checkout|payment-submitted/);
  assert.match(startRouteSource, /status: 503/);
  assert.doesNotMatch(startRouteSource, /createStripeBankTransferCheckout|payment-submitted|stripe\.checkout\.sessions\.create/);
  assert.match(productSource, /Order now/);
  assert.match(productSource, /router\.push\("\/checkout"\)/);
  const processingSource = fs.readFileSync(path.join(currentDirectory, "..", "app", "payments", "stripe", "processing", "page.tsx"), "utf8");
  assert.match(processingSource, /<h1>Payment processing<\/h1>/);
  assert.match(processingSource, /Waiting for payment confirmation\./);
  assert.match(processingSource, /Order #\{order\}/);
  assert.match(processingSource, /Confirm order on WhatsApp/);
  assert.match(processingSource, /getOrderAccessTokenFromCookieHeader\([^\n]*"processing"\)/);
  assert.match(processingSource, /loadAuthorizedOrder\(order, accessToken\)/);
  assert.doesNotMatch(processingSource, /Payment successful|Payment completed|Order completed|StripePaymentStatus|session_id/);
  assert.doesNotMatch(checkoutFlowSource, /Open Bank Transfer/);
  assert.doesNotMatch(checkoutFlowSource, /separate secure Stripe page|Keep this page open/);
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
