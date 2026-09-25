import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helperSource = fs.readFileSync(path.join(root, "lib", "payments", "stripeLiveDiagnostics.ts"), "utf8");
const routeSource = fs.readFileSync(path.join(root, "app", "api", "admin", "payment-diagnostics", "live-session", "route.ts"), "utf8");
const checkoutSource = fs.readFileSync(path.join(root, "lib", "payments", "stripeServer.ts"), "utf8");

const targetOrder = { order_number: "CNF-260925-9135", final_total: 23, currency: "GBP" };
const start = Math.floor(Date.parse("2026-09-25T11:25:00.000Z") / 1000);

function liveSession(overrides = {}) {
  return {
    id: "cs_live_sensitive123",
    created: start + 353,
    livemode: true,
    mode: "payment",
    client_reference_id: targetOrder.order_number,
    amount_total: 2300,
    currency: "gbp",
    status: "open",
    payment_status: "unpaid",
    payment_intent: "pi_sensitive123",
    customer: "cus_sensitive123",
    customer_email: "private.person@example.test",
    customer_details: { name: "Private Name", address: { line1: "Private Address" }, phone: "0000000000" },
    payment_method_types: ["card", "customer_balance"],
    payment_method_configuration_details: { id: "pmc_sensitive123", parent: null },
    payment_method_options: { customer_balance: { funding_type: "bank_transfer", bank_transfer: { type: "gb_bank_transfer" } }, card: {} },
    url: "https://checkout.stripe.com/c/pay/cs_live_sensitive123",
    ...overrides,
  };
}

function liveConfiguration(overrides = {}) {
  return {
    id: "pmc_sensitive123",
    object: "payment_method_configuration",
    name: "Private Configuration Name",
    active: true,
    is_default: true,
    livemode: true,
    application: "ca_sensitive123",
    customer_balance: {
      available: true,
      display_preference: { preference: "on", value: "on", overridable: true },
    },
    card: { available: true, display_preference: { preference: "on", value: "on", overridable: true } },
    ...overrides,
  };
}

function loadHelper({ sessionPages = [], sessionToRetrieve = liveSession(), configuration = liveConfiguration(), configurationPages = [] } = {}) {
  const calls = [];
  class FakeStripe {
    constructor(key, options) {
      calls.push({ operation: "client.init", key, options });
      this.checkout = { sessions: {
        list: async (params) => {
          calls.push({ operation: "sessions.list", params });
          return sessionPages.shift() ?? { data: [], has_more: false };
        },
        retrieve: async (id) => {
          calls.push({ operation: "sessions.retrieve", id });
          return sessionToRetrieve;
        },
      } };
      this.paymentMethodConfigurations = {
        retrieve: async (id) => {
          calls.push({ operation: "configurations.retrieve", id });
          return configuration;
        },
        list: async (params) => {
          calls.push({ operation: "configurations.list", params });
          return configurationPages.shift() ?? { data: [], has_more: false };
        },
      };
    }
  }
  const loadedModule = { exports: {} };
  const compiled = ts.transpile(helperSource, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env: {} },
    Date,
    Math,
    URL,
    require(id) {
      if (id === "server-only") return {};
      if (id === "stripe") return { __esModule: true, default: FakeStripe };
      throw new Error(`Unexpected helper dependency: ${id}`);
    },
  });
  return { ...loadedModule.exports, calls };
}

function exactPage(...sessions) {
  return { data: sessions, has_more: false };
}

function createLiveTestClient(helper) {
  return helper.createLiveStripeDiagnosticsClient({
    NODE_ENV: "production",
    VERCEL: "1",
    VERCEL_ENV: "production",
    STRIPE_BANK_TRANSFER_MODE: "live",
    STRIPE_SECRET_KEY: "sk_live_fixture_only",
  });
}

function loadRoute({ authenticated = true, mode = "live", workerOrder = targetOrder, diagnosticResult, requestIsProduction = true } = {}) {
  const calls = { worker: 0, client: 0, diagnosis: 0 };
  const loadedModule = { exports: {} };
  const response = {
    json(body, init = {}) { return { body, status: init.status || 200, headers: init.headers || {} }; },
  };
  const compiled = ts.transpile(routeSource, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    URL,
    Response,
    encodeURIComponent,
    fetch: async (url, init) => {
      calls.worker += 1;
      assert.match(url, /\/admin\/orders\/CNF-260925-9135$/);
      assert.equal(init.method, "GET");
      assert.equal(init.cache, "no-store");
      return { ok: true, status: 200, json: async () => ({ order: workerOrder }) };
    },
    require(id) {
      if (id === "next/server") return { NextResponse: response };
      if (id === "@/lib/adminAuth") return {
        isAdminAuthenticated: async () => authenticated,
        getAdminWorkerToken: () => "worker-token-fixture",
      };
      if (id === "@/lib/catalogApiBase") return { getCatalogApiBase: () => "https://catalog.example.test" };
      if (id === "@/lib/payments/stripeBankTransfer") return {
        getStripeBankTransferMode: () => mode,
        isStripeLiveProductionRequest: () => requestIsProduction,
      };
      if (id === "@/lib/payments/stripeLiveDiagnostics") return {
        createLiveStripeDiagnosticsClient: () => { calls.client += 1; return {}; },
        diagnoseExistingLiveStripeSession: async (_client, order) => {
          calls.diagnosis += 1;
          assert.deepEqual(JSON.parse(JSON.stringify(order)), targetOrder);
          return diagnosticResult ?? { kind: "SESSION_NOT_FOUND" };
        },
      };
      throw new Error(`Unexpected route dependency: ${id}`);
    },
  });
  return { ...loadedModule.exports, calls };
}

test("unauthenticated diagnostic GET is rejected before Worker or Stripe access", async () => {
  const route = loadRoute({ authenticated: false });
  const result = await route.GET(new Request("https://www.cnfans.co.uk/api/admin/stripe-diagnostics/live-session"));
  assert.equal(result.status, 401);
  assert.equal(result.body.error, "ADMIN_AUTH_REQUIRED");
  assert.equal(route.calls.worker + route.calls.client + route.calls.diagnosis, 0);
  assert.match(result.headers["Cache-Control"], /no-store/);
});

test("fixed endpoint rejects order query overrides and HEAD without backend access", async () => {
  const route = loadRoute();
  const queryResult = await route.GET(new Request("https://www.cnfans.co.uk/api/admin/stripe-diagnostics/live-session?order=another"));
  assert.equal(queryResult.status, 400);
  const headResult = route.HEAD();
  assert.equal(headResult.status, 405);
  assert.equal(route.calls.worker + route.calls.client + route.calls.diagnosis, 0);
});

test("Test Mode, alternate host, and wrong saved order fail closed before Stripe", async () => {
  for (const options of [{ mode: "test" }, { requestIsProduction: false }]) {
    const route = loadRoute(options);
    const result = await route.GET(new Request("https://www.cnfans.co.uk/api/admin/stripe-diagnostics/live-session"));
    assert.equal(result.status, 503);
    assert.equal(route.calls.client, 0);
  }
  const wrongOrder = loadRoute({ workerOrder: { ...targetOrder, final_total: 24 } });
  const mismatch = await wrongOrder.GET(new Request("https://www.cnfans.co.uk/api/admin/stripe-diagnostics/live-session"));
  assert.equal(mismatch.status, 409);
  assert.equal(wrongOrder.calls.client, 0);
});

test("zero matching Sessions returns a safe not-found result and makes no retrieve call", async () => {
  const helper = loadHelper({ sessionPages: [exactPage()] });
  const result = await helper.diagnoseExistingLiveStripeSession(createLiveTestClient(helper), targetOrder);
  assert.equal(result.kind, "SESSION_NOT_FOUND");
  assert.deepEqual(helper.calls.map((call) => call.operation).filter((operation) => operation !== "client.init"), ["sessions.list"]);
});

test("multiple matching Sessions are reported as ambiguous without retrieving either", async () => {
  const helper = loadHelper({ sessionPages: [exactPage(liveSession(), liveSession({ id: "cs_live_sensitive456" }))] });
  const result = await helper.diagnoseExistingLiveStripeSession(createLiveTestClient(helper), targetOrder);
  assert.equal(result.kind, "SESSION_AMBIGUOUS");
  assert.deepEqual(helper.calls.map((call) => call.operation).filter((operation) => operation !== "client.init"), ["sessions.list"]);
});

test("exactly one Session is retrieved and only read APIs are called; response is sanitized", async () => {
  const helper = loadHelper({ sessionPages: [exactPage(liveSession())] });
  const result = await helper.diagnoseExistingLiveStripeSession(createLiveTestClient(helper), targetOrder);
  assert.equal(result.kind, "diagnosed");
  if (result.kind !== "diagnosed") return;
  assert.equal(result.diagnosis.customerBalanceInSession, true);
  assert.deepEqual(result.diagnosis.paymentMethodTypes, ["card", "customer_balance"]);
  assert.equal(result.diagnosis.paymentMethodConfiguration.customerBalanceAvailable, true);
  assert.equal(result.diagnosis.paymentMethodConfiguration.customerBalancePreference, "on");
  assert.equal(result.diagnosis.paymentMethodConfiguration.customerBalanceValue, "on");
  assert.equal(result.diagnosis.paymentMethodConfigurationResolution, "SESSION_CONFIGURATION");
  assert.equal(result.diagnosis.case, "D");
  assert.equal(result.diagnosis.rootCauseLayer, "STRIPE_CHECKOUT_DISPLAY_OR_ELIGIBILITY");
  assert.equal(result.diagnosis.customerBalanceOptionPresent, true);
  assert.equal(result.diagnosis.customerBalanceFundingType, "bank_transfer");
  assert.equal(result.diagnosis.customerBalanceBankTransferType, "gb_bank_transfer");
  assert.deepEqual(JSON.parse(JSON.stringify(result.diagnosis.missingStripeFields)), []);
  assert.deepEqual(JSON.parse(JSON.stringify(result.diagnosis.paymentMethodOptionKeys)), ["customer_balance", "card"]);
  assert.deepEqual(helper.calls.map((call) => call.operation).filter((operation) => operation !== "client.init"), [
    "sessions.list", "sessions.retrieve", "configurations.retrieve",
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(helper.calls.find((call) => call.operation === "sessions.list").params.created)), { gte: start, lt: start + 660 });

  const json = JSON.stringify(result.diagnosis);
  for (const forbidden of ["cs_live_", "cus_", "pi_", "pmc_", "sk_live_", "@example", "Private Name", "Private Address", "0000000000", "checkout.stripe.com"]) {
    assert.equal(json.includes(forbidden), false, `diagnostic must not contain ${forbidden}`);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(result.diagnosis.paymentMethodConfiguration.methods)), [
    { method: "customer_balance", available: true, displayPreferenceValue: "on" },
    { method: "card", available: true, displayPreferenceValue: "on" },
  ]);
});

test("missing Session configuration resolves only one active Live default configuration", async () => {
  const helper = loadHelper({
    sessionPages: [exactPage(liveSession({ payment_method_configuration_details: null }))],
    sessionToRetrieve: liveSession({ payment_method_configuration_details: null }),
    configurationPages: [exactPage(liveConfiguration())],
  });
  const result = await helper.diagnoseExistingLiveStripeSession(createLiveTestClient(helper), targetOrder);
  assert.equal(result.kind, "diagnosed");
  if (result.kind !== "diagnosed") return;
  assert.equal(result.diagnosis.paymentMethodConfigurationResolution, "LIVE_DEFAULT_CONFIGURATION");
  assert.equal(helper.calls.some((call) => call.operation === "configurations.list"), true);
  assert.equal(helper.calls.some((call) => call.operation === "configurations.retrieve"), false);
});

test("wrong amount/currency/reference and Test Sessions cannot match", async () => {
  const invalidSessions = [
    liveSession({ amount_total: 2400 }),
    liveSession({ currency: "eur" }),
    liveSession({ client_reference_id: "CNF-OTHER" }),
    liveSession({ livemode: false }),
    liveSession({ mode: "setup" }),
  ];
  for (const session of invalidSessions) {
    const helper = loadHelper({ sessionPages: [exactPage(session)] });
    assert.equal((await helper.diagnoseExistingLiveStripeSession(createLiveTestClient(helper), targetOrder)).kind, "SESSION_NOT_FOUND");
  }
});

test("bank transfer option details use a strict whitelist and unknown transfer types stay masked", async () => {
  const allowed = loadHelper({ sessionPages: [exactPage(liveSession())] });
  const allowedResult = await allowed.diagnoseExistingLiveStripeSession(createLiveTestClient(allowed), targetOrder);
  assert.equal(allowedResult.kind, "diagnosed");
  if (allowedResult.kind === "diagnosed") {
    assert.equal(allowedResult.diagnosis.customerBalanceBankTransferType, "gb_bank_transfer");
    assert.equal(allowedResult.diagnosis.rootCauseLayer, "STRIPE_CHECKOUT_DISPLAY_OR_ELIGIBILITY");
  }

  const unknown = loadHelper({
    sessionPages: [exactPage(liveSession({
      payment_method_options: { customer_balance: { funding_type: "bank_transfer", bank_transfer: { type: "sensitive_future_value" } } },
    }))],
    sessionToRetrieve: liveSession({
      payment_method_options: { customer_balance: { funding_type: "bank_transfer", bank_transfer: { type: "sensitive_future_value" } } },
    }),
  });
  const unknownResult = await unknown.diagnoseExistingLiveStripeSession(createLiveTestClient(unknown), targetOrder);
  assert.equal(unknownResult.kind, "diagnosed");
  if (unknownResult.kind === "diagnosed") {
    assert.equal(unknownResult.diagnosis.customerBalanceBankTransferType, "unknown");
    assert.equal(unknownResult.diagnosis.rootCauseLayer, "WRONG_BANK_TRANSFER_TYPE");
    assert.equal(JSON.stringify(unknownResult.diagnosis).includes("sensitive_future_value"), false);
  }
});

test("root-cause cases A through D and missing-field reporting follow the approved matrix", async () => {
  const cases = [
    {
      session: liveSession(),
      configuration: liveConfiguration({ customer_balance: { available: true, display_preference: { preference: "on", value: "off" } } }),
      expectedCase: "A",
      expectedRoot: "LIVE_PAYMENT_METHOD_CONFIGURATION_OFF",
    },
    {
      session: liveSession(),
      configuration: liveConfiguration({ customer_balance: { available: false, display_preference: { preference: "on", value: "on" } } }),
      expectedCase: "B",
      expectedRoot: "STRIPE_ACCOUNT_METHOD_UNAVAILABLE",
    },
    {
      session: liveSession({ payment_method_types: ["card"] }),
      configuration: liveConfiguration(),
      expectedCase: "C",
      expectedRoot: "STRIPE_DYNAMIC_SESSION_FILTERING",
    },
    {
      session: liveSession({ payment_method_options: {} }),
      configuration: liveConfiguration(),
      expectedCase: "D",
      expectedRoot: "CUSTOMER_BALANCE_SESSION_OPTIONS_MISSING",
    },
    {
      session: liveSession({ payment_method_options: { customer_balance: { funding_type: "cash" } } }),
      configuration: liveConfiguration(),
      expectedCase: "D",
      expectedRoot: "CUSTOMER_BALANCE_NOT_CONFIGURED_AS_BANK_TRANSFER",
    },
    {
      session: liveSession({ payment_method_options: { customer_balance: { funding_type: "bank_transfer", bank_transfer: { type: "future_value" } } } }),
      configuration: liveConfiguration(),
      expectedCase: "D",
      expectedRoot: "WRONG_BANK_TRANSFER_TYPE",
    },
  ];

  for (const { session, configuration, expectedCase, expectedRoot } of cases) {
    const helper = loadHelper({ sessionPages: [exactPage(session)], sessionToRetrieve: session, configuration });
    const result = await helper.diagnoseExistingLiveStripeSession(createLiveTestClient(helper), targetOrder);
    assert.equal(result.kind, "diagnosed");
    if (result.kind === "diagnosed") {
      assert.equal(result.diagnosis.case, expectedCase);
      assert.equal(result.diagnosis.rootCauseLayer, expectedRoot);
    }
  }

  const missing = liveConfiguration({ customer_balance: { display_preference: { preference: "none", value: null } } });
  const missingHelper = loadHelper({
    sessionPages: [exactPage(liveSession({ payment_method_types: ["card"] }))],
    sessionToRetrieve: liveSession({ payment_method_types: ["card"] }),
    configuration: missing,
  });
  const missingResult = await missingHelper.diagnoseExistingLiveStripeSession(createLiveTestClient(missingHelper), targetOrder);
  assert.equal(missingResult.kind, "diagnosed");
  if (missingResult.kind === "diagnosed") {
    assert.equal(missingResult.diagnosis.case, "UNKNOWN");
    assert.equal(missingResult.diagnosis.rootCauseLayer, "STRIPE_API_DOES_NOT_EXPOSE_ENOUGH_DETAIL");
    assert.deepEqual(JSON.parse(JSON.stringify(missingResult.diagnosis.missingStripeFields)), [
      "customerBalanceConfigValue", "customerBalanceConfigAvailable",
    ]);
  }
});

test("Stripe read failures are reduced to safe diagnostic stages", async () => {
  const listFailure = loadHelper();
  const listClient = createLiveTestClient(listFailure);
  listClient.checkout.sessions.list = async () => { throw new Error("sensitive Stripe detail"); };
  await assert.rejects(
    listFailure.diagnoseExistingLiveStripeSession(listClient, targetOrder),
    (error) => error.stage === "STRIPE_SESSION_LIST_FAILED" && error.message === "STRIPE_SESSION_LIST_FAILED",
  );

  const configFailure = loadHelper({ sessionPages: [exactPage(liveSession())] });
  const configClient = createLiveTestClient(configFailure);
  configClient.paymentMethodConfigurations.retrieve = async () => { throw new Error("sensitive configuration detail"); };
  await assert.rejects(
    configFailure.diagnoseExistingLiveStripeSession(configClient, targetOrder),
    (error) => error.stage === "PAYMENT_METHOD_CONFIGURATION_READ_FAILED" && error.message === "PAYMENT_METHOD_CONFIGURATION_READ_FAILED",
  );
});

test("Stripe client refuses non-Production/non-Live env and disables automatic retry", () => {
  const helper = loadHelper();
  assert.throws(() => helper.createLiveStripeDiagnosticsClient({
    NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "preview", STRIPE_BANK_TRANSFER_MODE: "live", STRIPE_SECRET_KEY: "sk_live_fixture_only",
  }));
  const stripe = helper.createLiveStripeDiagnosticsClient({
    NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "production", STRIPE_BANK_TRANSFER_MODE: "live", STRIPE_SECRET_KEY: "sk_live_fixture_only",
  });
  assert.ok(stripe);
  assert.equal(helper.calls.at(-1).operation, "client.init");
  assert.deepEqual(JSON.parse(JSON.stringify(helper.calls.at(-1).options)), { maxNetworkRetries: 0, timeout: 15_000 });
});

test("checkout creation remains free of Dynamic Payment Method overrides", () => {
  assert.match(checkoutSource, /Do not pass payment-method overrides/);
  assert.doesNotMatch(checkoutSource, /payment_method_types\s*:/);
  assert.doesNotMatch(checkoutSource, /payment_method_configuration\s*:/);
  assert.doesNotMatch(checkoutSource, /payment_method_options\s*:/);
});

test("route returns only the fixed-order sanitized diagnostic with no-store headers", async () => {
  const route = loadRoute({
    diagnosticResult: { kind: "diagnosed", diagnosis: {
      sessionFound: true,
      livemode: true,
      mode: "payment",
      status: "open",
      paymentStatus: "unpaid",
      amountTotal: 2300,
      sessionCurrency: "gbp",
      paymentIntent: "PRESENT",
      customer: "PRESENT",
      clientReferenceMatch: true,
      paymentMethodTypes: ["customer_balance"],
      customerBalanceInSession: true,
      paymentMethodConfiguration: {
        present: true, active: true, isDefault: true, livemode: true,
        customerBalanceAvailable: true, customerBalancePreference: "on", customerBalanceValue: "on",
        methods: [{ method: "customer_balance", available: true, displayPreferenceValue: "on" }],
      },
      paymentMethodConfigurationResolution: "SESSION_CONFIGURATION",
      paymentMethodConfigurationDetailsPresent: true,
      paymentMethodOptionKeys: ["customer_balance"],
      case: "D",
    } } });
  const response = await route.GET(new Request("https://www.cnfans.co.uk/api/admin/stripe-diagnostics/live-session"));
  assert.equal(response.status, 200);
  assert.equal(response.body.orderMatch, true);
  assert.equal(response.body.amount, 2300);
  assert.equal(response.body.currency, "gbp");
  assert.match(response.headers["Cache-Control"], /no-store/);
  const json = JSON.stringify(response.body);
  for (const forbidden of ["cs_live_", "cus_", "pi_", "pmc_", "sk_live_", "@", "address", "phone"]) {
    assert.equal(json.includes(forbidden), false, `route response must not contain ${forbidden}`);
  }
});
