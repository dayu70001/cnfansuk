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

test("Stripe test fixture is fixed, fictional, and server-owned", () => {
  const { LOCAL_STRIPE_TEST_FIXTURE } = loadModule({});
  assert.deepEqual(JSON.parse(JSON.stringify(LOCAL_STRIPE_TEST_FIXTURE)), {
    orderNumber: "LOCAL-CNF-TEST",
    amountMinor: 5700,
    currency: "GBP",
    customerEmail: "stripe-test@example.com",
    lineItemName: "Order payment",
  });
});

test("Stripe Test Mode amount stays server-fixed when an untrusted amount is supplied", async () => {
  let capturedSessionParams;
  let createdCustomer = false;

  class FakeStripe {
    constructor(secretKey) {
      assert.equal(secretKey, "sk_test_fixture_only");
      this.customers = {
        list: async () => ({ data: [{ id: "cus_sandbox_fixture", livemode: false }] }),
        create: async () => {
          createdCustomer = true;
          throw new Error("The existing Sandbox Customer should be reused.");
        },
      };
      this.checkout = {
        sessions: {
          create: async (params) => {
            capturedSessionParams = params;
            return {
              id: "cs_test_fixture",
              livemode: false,
              amount_total: 5700,
              currency: "gbp",
              client_reference_id: "LOCAL-CNF-TEST",
              payment_method_types: ["customer_balance"],
              url: "https://checkout.stripe.com/c/pay/cs_test_fixture",
            };
          },
        },
      };
    }
  }

  const loadedModule = { exports: {} };
  const fixture = {
    orderNumber: "LOCAL-CNF-TEST",
    amountMinor: 5700,
    currency: "GBP",
    customerEmail: "stripe-test@example.com",
    lineItemName: "Order payment",
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
        return {
          isLocalStripeBankTransferTestEnabled: () => true,
          LOCAL_STRIPE_TEST_FIXTURE: fixture,
        };
      }
      throw new Error(`Unexpected module import: ${id}`);
    },
  });

  const { createLocalStripeTestCheckout } = loadedModule.exports;
  await createLocalStripeTestCheckout({ amountMinor: 100 });

  assert.equal(createdCustomer, false);
  assert.deepEqual(JSON.parse(JSON.stringify(Object.keys(capturedSessionParams))), [
    "mode",
    "customer",
    "line_items",
    "client_reference_id",
    "success_url",
    "cancel_url",
  ]);
  assert.equal(capturedSessionParams.customer, "cus_sandbox_fixture");
  assert.equal(capturedSessionParams.line_items[0].price_data.unit_amount, 5700);
  assert.equal(capturedSessionParams.line_items[0].price_data.currency, "gbp");
  assert.equal(capturedSessionParams.line_items[0].price_data.product_data.name, "Order payment");
  assert.equal(capturedSessionParams.client_reference_id, "LOCAL-CNF-TEST");
  assert.equal(capturedSessionParams.success_url.startsWith("http://localhost:"), true);
  assert.equal(capturedSessionParams.cancel_url.startsWith("http://localhost:"), true);
  assert.equal(Object.hasOwn(capturedSessionParams, "payment_method_types"), false);
  assert.equal(Object.hasOwn(capturedSessionParams, "allowed_payment_method_types"), false);
  assert.equal(Object.hasOwn(capturedSessionParams, "payment_method_configuration"), false);
  assert.equal(Object.hasOwn(capturedSessionParams, "payment_method_options"), false);

  const testModeRoute = checkoutRouteSource
    .split('if (mode === "test")')[1]
    ?.split("if (!isLocalStripeBankTransferMockEnabled())")[0];
  assert.ok(testModeRoute);
  assert.match(testModeRoute, /createLocalStripeTestCheckout\(\)/);
  assert.doesNotMatch(testModeRoute, /amountMinor/);
});
