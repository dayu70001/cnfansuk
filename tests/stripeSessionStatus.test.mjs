import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const statusHelperSource = fs.readFileSync(path.join(projectRoot, "lib", "stripePaymentStatus.ts"), "utf8");
const stripeServerSource = fs.readFileSync(path.join(projectRoot, "lib", "payments", "stripeServer.ts"), "utf8");
const checkoutRouteSource = fs.readFileSync(path.join(projectRoot, "app", "api", "payments", "stripe", "checkout", "route.ts"), "utf8");
const statusRouteSource = fs.readFileSync(path.join(projectRoot, "app", "api", "payments", "stripe", "session-status", "route.ts"), "utf8");
const statusComponentSource = fs.readFileSync(path.join(projectRoot, "components", "StripePaymentStatus.tsx"), "utf8");
const orderSuccessSource = fs.readFileSync(path.join(projectRoot, "app", "order-success", "page.tsx"), "utf8");
const checkoutPageSource = fs.readFileSync(path.join(projectRoot, "app", "checkout", "page.tsx"), "utf8");

const savedOrder = {
  order_number: "CNF-260924-1234",
  email: "qa@example.invalid",
  final_total: 117,
  currency: "GBP",
};

function loadHelper() {
  const loadedModule = { exports: {} };
  const compiled = ts.transpile(statusHelperSource, { module: ts.ModuleKind.CommonJS });
  vm.runInNewContext(compiled, { module: loadedModule, exports: loadedModule.exports });
  return loadedModule.exports;
}

function validSession(overrides = {}) {
  return {
    id: "cs_test_fixture123",
    livemode: false,
    mode: "payment",
    currency: "gbp",
    amount_total: 11700,
    client_reference_id: savedOrder.order_number,
    payment_status: "unpaid",
    status: "complete",
    customer: "cus_sensitive_fixture",
    customer_email: "private@example.test",
    payment_intent: "pi_sensitive_fixture",
    metadata: { private: "must-not-return" },
    payment_method_types: ["customer_balance"],
    url: "https://checkout.stripe.com/c/pay/cs_test_fixture123",
    ...overrides,
  };
}

function loadStripeServer(session) {
  const loadedModule = { exports: {} };
  const calls = { customerCreates: [], sessionCreates: [], sessionRetrieves: 0 };
  const compiled = ts.transpile(stripeServerSource, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  class FakeStripe {
    constructor(secretKey) {
      assert.equal(secretKey, "sk_test_fixture_only");
      this.customers = {
        create: async (params, options) => {
          calls.customerCreates.push({ params, options });
          return { id: "cus_test_created", livemode: false };
        },
      };
      this.checkout = {
        sessions: {
          create: async (params, options) => {
            calls.sessionCreates.push({ params, options });
            return session;
          },
          retrieve: async () => {
            calls.sessionRetrieves += 1;
            return session;
          },
        },
      };
    }
  }
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env: { NODE_ENV: "development", STRIPE_BANK_TRANSFER_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fixture_only" } },
    URL,
    require(id) {
      if (id === "server-only") return {};
      if (id === "stripe") return { __esModule: true, default: FakeStripe };
      if (id === "@/lib/payments/stripeBankTransfer") return { isLocalStripeBankTransferTestEnabled: () => true };
      throw new Error(`Unexpected module import: ${id}`);
    },
  });
  return { ...loadedModule.exports, calls };
}

test("payment presentation depends on payment_status, not Checkout complete status", () => {
  const { getStripePaymentStatusPresentation } = loadHelper();
  assert.equal(getStripePaymentStatusPresentation("unpaid").label, "Waiting for bank transfer confirmation");
  assert.equal(getStripePaymentStatusPresentation("paid").label, "Bank transfer received");
  assert.equal(getStripePaymentStatusPresentation("no_payment_required").label, "No payment confirmation available");
  assert.equal(getStripePaymentStatusPresentation("unpaid").tone, "waiting");
});

test("Stripe amount and currency come from the persisted order, with only minimal payment data sent", async () => {
  const stripe = loadStripeServer(validSession());
  const checkout = await stripe.createLocalStripeTestCheckout(savedOrder, "http://localhost:4000");
  assert.equal(checkout.livemode, false);
  assert.equal(checkout.amountTotal, 11700);
  assert.equal(checkout.currency, "gbp");
  assert.equal(checkout.clientReferenceId, savedOrder.order_number);
  assert.equal(stripe.calls.customerCreates.length, 1);
  assert.equal(stripe.calls.customerCreates[0].params.email, "qa@example.invalid");
  assert.deepEqual(Object.keys(stripe.calls.customerCreates[0].params), ["email"]);
  assert.deepEqual(Object.keys(stripe.calls.sessionCreates[0].params).sort(), [
    "cancel_url", "client_reference_id", "customer", "line_items", "mode", "success_url",
  ].sort());
  const sessionParams = stripe.calls.sessionCreates[0].params;
  assert.equal(sessionParams.mode, "payment");
  assert.equal(sessionParams.client_reference_id, savedOrder.order_number);
  assert.equal(sessionParams.line_items[0].price_data.unit_amount, 11700);
  assert.equal(sessionParams.line_items[0].price_data.currency, "gbp");
  assert.equal(sessionParams.line_items[0].price_data.product_data.name, "Order payment");
  assert.equal("payment_method_types" in sessionParams, false);
  assert.equal("payment_method_options" in sessionParams, false);
  assert.equal("payment_method_configuration" in sessionParams, false);
  assert.equal("allowed_payment_method_types" in sessionParams, false);
  assert.equal("shipping_address_collection" in sessionParams, false);
  assert.equal("customer_email" in sessionParams, false);
  assert.equal("metadata" in sessionParams, false);
});

test("same order uses deterministic Customer and Checkout Session idempotency keys", async () => {
  const stripe = loadStripeServer(validSession());
  await stripe.createLocalStripeTestCheckout(savedOrder, "http://localhost:4000");
  await stripe.createLocalStripeTestCheckout(savedOrder, "http://localhost:4000");
  assert.equal(stripe.calls.customerCreates.length, 2);
  assert.equal(stripe.calls.sessionCreates.length, 2);
  assert.deepEqual(
    stripe.calls.customerCreates.map(({ options }) => options.idempotencyKey),
    ["cnfans-stripe-customer:CNF-260924-1234", "cnfans-stripe-customer:CNF-260924-1234"],
  );
  assert.deepEqual(
    stripe.calls.sessionCreates.map(({ options }) => options.idempotencyKey),
    ["cnfans-stripe-checkout:CNF-260924-1234", "cnfans-stripe-checkout:CNF-260924-1234"],
  );
});

test("read-only Stripe session status validates the real saved order and returns no sensitive fields", async () => {
  const stripe = loadStripeServer(validSession());
  const summary = await stripe.retrieveLocalStripeTestSessionSummary("cs_test_fixture123", savedOrder);
  assert.equal(stripe.calls.sessionRetrieves, 1);
  assert.deepEqual(Object.keys(summary).sort(), [
    "amountTotal", "clientReferenceId", "currency", "id", "livemode", "mode", "paymentStatus", "status",
  ].sort());
  assert.equal(summary.paymentStatus, "unpaid");
  assert.equal(summary.status, "complete");
  assert.equal(
    loadHelper().getStripePaymentStatusPresentation(summary.paymentStatus).label,
    "Waiting for bank transfer confirmation",
    "A completed Checkout Session must not be treated as proof of payment.",
  );
  assert.equal(Object.hasOwn(summary, "customer"), false);
  assert.equal(Object.hasOwn(summary, "paymentIntent"), false);
  assert.equal(Object.hasOwn(summary, "email"), false);
});

test("session status rejects a wrong order, amount, currency or live-mode Session", async () => {
  await assert.rejects(loadStripeServer(validSession({ amount_total: 100 })).retrieveLocalStripeTestSessionSummary("cs_test_fixture123", savedOrder));
  await assert.rejects(loadStripeServer(validSession({ client_reference_id: "CNF-OTHER-0000" })).retrieveLocalStripeTestSessionSummary("cs_test_fixture123", savedOrder));
  await assert.rejects(loadStripeServer(validSession({ currency: "eur" })).retrieveLocalStripeTestSessionSummary("cs_test_fixture123", savedOrder));
  await assert.rejects(loadStripeServer(validSession({ livemode: true })).retrieveLocalStripeTestSessionSummary("cs_test_fixture123", savedOrder));
  await assert.rejects(loadStripeServer(validSession()).retrieveLocalStripeTestSessionSummary("cs_live_fixture123", savedOrder));
});

test("Test Mode ignores no client price input and requires the order access token", () => {
  const testBranch = checkoutRouteSource.slice(checkoutRouteSource.indexOf('if (mode === "test")'), checkoutRouteSource.indexOf("if (!isLocalStripeBankTransferMockEnabled())"));
  assert.match(testBranch, /loadAuthorizedOrder\(orderNumber, input\.orderAccessToken\)/);
  assert.match(testBranch, /forbiddenClientAmounts/);
  assert.doesNotMatch(testBranch, /input\.amountMinor|input\.currency|input\.subtotal|input\.shippingFee|input\.price/);
  assert.match(testBranch, /createLocalStripeTestCheckout\(loadedOrder\.order, origin\)/);
  assert.doesNotMatch(testBranch, /LOCAL-CNF-TEST|5700/);
});

test("session-status authenticates the order, is local-only, and returns only payment and checkout status", () => {
  assert.match(statusRouteSource, /isLocalStripeBankTransferTestEnabled\(\)/);
  assert.match(statusRouteSource, /isLoopbackRequest\(request\)/);
  assert.match(statusRouteSource, /X-Order-Access-Token/);
  assert.match(statusRouteSource, /loadAuthorizedOrder\(orderNumber, accessToken\)/);
  assert.match(statusRouteSource, /\{ paymentStatus: session\.paymentStatus, checkoutStatus: session\.status \}/);
  assert.match(statusRouteSource, /Cache-Control/);
  assert.doesNotMatch(statusRouteSource, /payment-confirmed|payment-submitted|\.update\(|DB\./);
});

test("status refresh uses the saved order token, is read-only and pauses polling while hidden", () => {
  assert.match(statusComponentSource, /getOrderAccessTokenStorageKey\(order\)/);
  assert.match(statusComponentSource, /X-Order-Access-Token/);
  assert.match(statusComponentSource, /addEventListener\("focus"/);
  assert.match(statusComponentSource, /addEventListener\("visibilitychange"/);
  assert.match(statusComponentSource, /document\.visibilityState === "visible"/);
  assert.match(statusComponentSource, /}, 10_000\)/);
  assert.doesNotMatch(statusComponentSource, /Check payment status|refreshStatus\(true\)/);
  assert.match(statusComponentSource, /method: "GET"/);
  assert.doesNotMatch(statusComponentSource, /\/api\/payments\/stripe\/checkout|\/api\/orders|method: "POST"/);
});

test("order success keeps one concise WhatsApp prompt and omits duplicate Stripe instructions", () => {
  assert.match(orderSuccessSource, /We(?:'|&apos;)ll verify your order with you on WhatsApp before processing\./);
  assert.match(orderSuccessSource, /Confirm order on WhatsApp/);
  assert.doesNotMatch(orderSuccessSource, /Payment is not confirmed automatically|Your transfer status is checked securely|Your bank transfer opens in a separate secure Stripe page|We'll check your size, delivery details and payment/);
});

test("normal Test Mode copy is customer-facing and the Payment step has no WhatsApp CTA", () => {
  assert.doesNotMatch(checkoutPageSource, /This local test creates no CNFANS order|cannot collect a live payment|fixed £57/i);
  const paymentStep = checkoutPageSource.slice(checkoutPageSource.indexOf("function LocalStripeBankTransferStep"), checkoutPageSource.indexOf("function LocalCheckoutGuardStep"));
  assert.doesNotMatch(paymentStep, /href=.*whatsapp|WhatsApp.*button/i);
  assert.match(orderSuccessSource, /Confirm order on WhatsApp/);
});
