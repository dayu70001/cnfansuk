import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDirectory, "..", "lib", "payments", "stripeBankTransfer.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const stripeServerSourcePath = path.join(currentDirectory, "..", "lib", "payments", "stripeServer.ts");
const stripeServerSource = fs.readFileSync(stripeServerSourcePath, "utf8");
const checkoutRouteSource = fs.readFileSync(
  path.join(currentDirectory, "..", "app", "api", "payments", "stripe", "checkout", "route.ts"),
  "utf8",
);
const compiledStripeServer = ts.transpile(stripeServerSource, {
  module: ts.ModuleKind.CommonJS,
  esModuleInterop: true,
});

function loadModule(env) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env },
  });
  return loadedModule.exports;
}

test("Stripe mock mode remains enabled only for local development mock configuration", () => {
  const imported = loadModule({ NODE_ENV: "development", STRIPE_BANK_TRANSFER_MODE: "mock" });
  assert.equal(imported.isLocalStripeBankTransferMockEnabled(), true);
  assert.equal(imported.isLocalStripeBankTransferTestEnabled(), false);
});

test("Stripe Test Mode requires development, test mode, and an sk_test key", () => {
  const imported = loadModule({
    NODE_ENV: "development",
    STRIPE_BANK_TRANSFER_MODE: "test",
    STRIPE_SECRET_KEY: "sk_test_fixture_only",
  });
  assert.equal(imported.getLocalStripeBankTransferMode(), "test");
  assert.equal(imported.isLocalStripeBankTransferTestEnabled(), true);
});

test("Stripe Test Mode is disabled for missing or live keys and outside development", () => {
  assert.equal(loadModule({ NODE_ENV: "development", STRIPE_BANK_TRANSFER_MODE: "test" }).getLocalStripeBankTransferMode(), "disabled");
  assert.equal(loadModule({ NODE_ENV: "development", STRIPE_BANK_TRANSFER_MODE: "test", STRIPE_SECRET_KEY: "sk_live_fixture_only" }).getLocalStripeBankTransferMode(), "disabled");
  assert.equal(loadModule({ NODE_ENV: "production", STRIPE_BANK_TRANSFER_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fixture_only" }).getLocalStripeBankTransferMode(), "disabled");
});

test("real Stripe Test Mode has no fixed LOCAL-CNF-TEST or £57 runtime fixture", () => {
  assert.doesNotMatch(source, /LOCAL-CNF-TEST|5700|57\.00/);
});

test("Stripe Test Mode amount and currency come from the persisted order, not an untrusted amount", async () => {
  let capturedSessionParams;
  let capturedCustomerParams;
  let capturedCustomerOptions;
  let capturedSessionOptions;

  class FakeStripe {
    constructor(secretKey) {
      assert.equal(secretKey, "sk_test_fixture_only");
      this.customers = {
        create: async (params, options) => {
          capturedCustomerParams = params;
          capturedCustomerOptions = options;
          return { id: "cus_sandbox_fixture", livemode: false };
        },
      };
      this.checkout = {
        sessions: {
          create: async (params, options) => {
            capturedSessionParams = params;
            capturedSessionOptions = options;
            return {
              id: "cs_test_fixture",
              livemode: false,
              mode: "payment",
              amount_total: 11700,
              currency: "gbp",
              client_reference_id: "CNF-TEST-ORDER",
              payment_method_types: ["customer_balance"],
              url: "https://checkout.stripe.com/c/pay/cs_test_fixture",
            };
          },
        },
      };
    }
  }

  const loadedModule = { exports: {} };
  const persistedOrder = {
    order_number: "CNF-TEST-ORDER",
    email: "customer@example.invalid",
    final_total: 117,
    currency: "GBP",
    amountMinor: 100,
  };
  vm.runInNewContext(compiledStripeServer, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env: { NODE_ENV: "development", STRIPE_BANK_TRANSFER_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fixture_only" } },
    URL,
    require(id) {
      if (id === "server-only") return {};
      if (id === "stripe") return { __esModule: true, default: FakeStripe };
      if (id === "@/lib/payments/stripeBankTransfer") {
        return { isLocalStripeBankTransferTestEnabled: () => true };
      }
      throw new Error(`Unexpected module import: ${id}`);
    },
  });

  const { createLocalStripeTestCheckout } = loadedModule.exports;
  const checkout = await createLocalStripeTestCheckout(persistedOrder, "http://localhost:4000");

  assert.deepEqual(JSON.parse(JSON.stringify(capturedCustomerParams)), { email: "customer@example.invalid" });
  assert.deepEqual(JSON.parse(JSON.stringify(capturedCustomerOptions)), { idempotencyKey: "cnfans-stripe-customer:CNF-TEST-ORDER" });
  assert.deepEqual(JSON.parse(JSON.stringify(capturedSessionOptions)), { idempotencyKey: "cnfans-stripe-checkout:CNF-TEST-ORDER" });
  assert.deepEqual(JSON.parse(JSON.stringify(Object.keys(capturedSessionParams))), [
    "mode",
    "customer",
    "line_items",
    "client_reference_id",
    "success_url",
    "cancel_url",
  ]);
  assert.equal(capturedSessionParams.customer, "cus_sandbox_fixture");
  assert.equal(capturedSessionParams.line_items[0].price_data.unit_amount, 11700);
  assert.equal(capturedSessionParams.line_items[0].price_data.currency, "gbp");
  assert.equal(capturedSessionParams.line_items[0].price_data.product_data.name, "Order payment");
  assert.equal(capturedSessionParams.client_reference_id, "CNF-TEST-ORDER");
  assert.equal(capturedSessionParams.success_url.startsWith("http://localhost:"), true);
  assert.equal(capturedSessionParams.cancel_url.startsWith("http://localhost:"), true);
  assert.equal(checkout.amountTotal, 11700);
  assert.equal(checkout.currency, "gbp");
  assert.equal(checkout.clientReferenceId, "CNF-TEST-ORDER");
  assert.deepEqual(JSON.parse(JSON.stringify(checkout.paymentMethodTypes)), ["customer_balance"]);
  assert.equal(Object.hasOwn(capturedSessionParams, "payment_method_types"), false);
  assert.equal(Object.hasOwn(capturedSessionParams, "allowed_payment_method_types"), false);
  assert.equal(Object.hasOwn(capturedSessionParams, "payment_method_configuration"), false);
  assert.equal(Object.hasOwn(capturedSessionParams, "payment_method_options"), false);

  const testModeRoute = checkoutRouteSource
    .split('if (mode === "test")')[1]
    ?.split("if (!isLocalStripeBankTransferMockEnabled())")[0];
  assert.ok(testModeRoute);
  assert.match(testModeRoute, /loadAuthorizedOrder\(orderNumber, input\.orderAccessToken\)/);
  assert.match(testModeRoute, /createLocalStripeTestCheckout\(loadedOrder\.order, origin\)/);
  assert.match(testModeRoute, /forbiddenClientAmounts/);
  assert.doesNotMatch(testModeRoute, /input\.amountMinor/);
});
