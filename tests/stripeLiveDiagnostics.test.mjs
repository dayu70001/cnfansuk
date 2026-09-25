import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
      if (id === "node:crypto") return { createHash };
      if (id === "server-only") return {};
      if (id === "stripe") return { __esModule: true, default: FakeStripe };
      throw new Error(`Unexpected helper dependency: ${id}`);
    },
  });
  return { ...loadedModule.exports, calls };
}

const comparisonWindowStart = Math.floor(Date.parse("2026-09-25T00:00:00.000Z") / 1000);

function comparisonSession(id, amountTotal, overrides = {}) {
  return {
    id,
    created: comparisonWindowStart + 11 * 60 * 60 + 30 * 60,
    livemode: true,
    mode: "payment",
    client_reference_id: amountTotal === 2300 ? targetOrder.order_number : "CNF-CONTROL-ORDER",
    amount_total: amountTotal,
    currency: "gbp",
    status: "open",
    payment_status: "unpaid",
    payment_intent: null,
    customer: `customer-${id}`,
    payment_method_types: ["customer_balance"],
    payment_method_configuration_details: { id: "config-shared-fixture" },
    payment_method_options: {
      customer_balance: { funding_type: "bank_transfer", bank_transfer: { type: "gb_bank_transfer" } },
    },
    locale: "en-GB",
    ui_mode: "hosted",
    payment_method_collection: "always",
    billing_address_collection: "auto",
    customer_creation: "if_required",
    submit_type: "auto",
    ...overrides,
  };
}

function comparisonConfiguration(id = "config-shared-fixture", overrides = {}) {
  return {
    id,
    active: true,
    is_default: true,
    livemode: true,
    customer_balance: {
      available: true,
      display_preference: { preference: "on", value: "on", overridable: true },
    },
    ...overrides,
  };
}

function loadComparisonHelper({ sessions, sessionsToRetrieve = sessions, configurations = {}, balances = {}, intents = {}, events = [] }) {
  const calls = [];
  class FakeStripe {
    constructor(key, options) {
      calls.push({ operation: "client.init", key, options });
      this.checkout = { sessions: {
        list: async (params) => {
          calls.push({ operation: "sessions.list", params });
          return { data: sessions, has_more: false };
        },
        retrieve: async (id) => {
          calls.push({ operation: "sessions.retrieve", id });
          return sessionsToRetrieve.find((session) => session.id === id);
        },
      } };
      this.paymentMethodConfigurations = {
        retrieve: async (id) => {
          calls.push({ operation: "configurations.retrieve", id });
          return configurations[id];
        },
        list: async () => ({ data: [], has_more: false }),
      };
      this.customers = {
        retrieveCashBalance: async (id) => {
          calls.push({ operation: "customers.retrieveCashBalance", id });
          return balances[id];
        },
      };
      this.paymentIntents = {
        retrieve: async (id) => {
          calls.push({ operation: "paymentIntents.retrieve", id });
          return intents[id];
        },
      };
      this.events = {
        list: async (params) => {
          calls.push({ operation: "events.list", params });
          return { data: events, has_more: false };
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
      if (id === "node:crypto") return { createHash };
      if (id === "server-only") return {};
      if (id === "stripe") return { __esModule: true, default: FakeStripe };
      throw new Error(`Unexpected helper dependency: ${id}`);
    },
  });
  const fingerprints = {
    control: createHash("sha256").update(sessions[0].id).digest("hex"),
    failed: createHash("sha256").update(sessions[1].id).digest("hex"),
  };
  return { ...loadedModule.exports, calls, fingerprints };
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

test("hashed control and failed Session fingerprints match exactly and compare safe fields only", async () => {
  const control = comparisonSession("fixture-control-session", 4100);
  const failedReference = "actual-failed-order-reference-fixture";
  const failed = comparisonSession("fixture-failed-session", 2300, {
    client_reference_id: failedReference,
    payment_intent: "fixture-failed-intent",
  });
  const noise = comparisonSession("fixture-unrelated-session", 9999, { client_reference_id: "CNF-NOISE" });
  const failedIntent = {
    id: "fixture-failed-intent",
    status: "requires_payment_method",
    livemode: true,
    amount: 2300,
    currency: "gbp",
    payment_method_types: ["customer_balance"],
    last_payment_error: {
      type: "invalid_request_error",
      code: "payment_intent_payment_attempt_failed",
      decline_code: "bank_account_declined",
      param: "payment_method_data",
      message: "The bank declined payment for person@example.test. Reference 1234567890; https://private.example.test/x",
    },
    next_action: null,
    latest_charge: null,
  };
  const sharedConfiguration = comparisonConfiguration();
  const helper = loadComparisonHelper({
    sessions: [control, failed, noise],
    configurations: { "config-shared-fixture": sharedConfiguration },
    balances: {
      "customer-fixture-control-session": {
        livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" },
      },
      "customer-fixture-failed-session": {
        livemode: true, available: { gbp: 1750 }, settings: { reconciliation_mode: "manual" },
      },
      "customer-fixture-unrelated-session": {
        livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" },
      },
    },
    intents: { "fixture-failed-intent": failedIntent },
  });
  const stripe = createLiveTestClient(helper);
  const result = await helper.compareExistingLiveStripeSessions(stripe, helper.fingerprints);

  assert.equal(result.kind, "diagnosed");
  if (result.kind !== "diagnosed") return;
  assert.equal(result.control.role, "CONTROL_METHOD_VISIBLE");
  assert.equal(result.failed.role, "FAILED_AFTER_PAY_CLICK");
  assert.equal(result.control.amountTotal, 4100);
  assert.equal(result.failed.amountTotal, 2300);
  assert.equal(result.control.clientReference, "PRESENT");
  assert.equal(result.failed.clientReference, "PRESENT");
  assert.equal(result.clientReferencesSame, "NO");
  assert.equal(result.samePaymentMethodConfiguration, true);
  assert.equal(result.sessionPaymentMethodSetupDifference, false);
  assert.equal(result.customerCashBalanceDifference, true);
  assert.equal(result.failed.paymentIntent?.lastPaymentErrorPresent, true);
  assert.equal(result.failed.paymentIntent?.status, "requires_payment_method");
  assert.equal(result.bankTransferConfirmationRejected, true);
  assert.equal(result.rootCauseConfirmed, true);
  assert.equal(result.rootCauseLayer, "FAILED_PAYMENT_INTENT_LAST_ERROR");
  assert.ok(result.differences.some((value) => value.startsWith("amount_total:")));
  assert.ok(result.differences.some((value) => value.startsWith("cash_balance_gbp:")));
  assert.ok(result.differences.some((value) => value.startsWith("cash_balance_reconciliation_mode:")));

  const output = JSON.stringify(result);
  for (const forbidden of [
    "fixture-control-session", "fixture-failed-session", "fixture-failed-intent", "customer-fixture-",
    "config-shared-fixture", "cs_live_", "cus_", "pi_", "pm_", "pmc_", "evt_", "sk_live_",
    "client_secret", "person@example.test", "1234567890", "https://private.example.test",
    failedReference, targetOrder.order_number,
  ]) assert.equal(output.includes(forbidden), false, `comparison response must not contain ${forbidden}`);

  const operations = helper.calls.map((call) => call.operation).filter((value) => value !== "client.init");
  assert.deepEqual(operations, [
    "sessions.list", "sessions.retrieve", "sessions.retrieve",
    "configurations.retrieve", "configurations.retrieve",
    "customers.retrieveCashBalance", "customers.retrieveCashBalance", "paymentIntents.retrieve",
  ]);
  assert.equal(operations.some((operation) => /create|update|confirm|fund/i.test(operation)), false);
  assert.equal(JSON.stringify(helper.calls).includes(failedReference), false);
});

test("comparison enforces each Session's amount, currency, livemode, mode, and fingerprint without an order reference", async () => {
  const cases = [
    { name: "control amount", control: comparisonSession("control-bad-amount", 4000), failed: comparisonSession("failed-valid-amount", 2300), side: "CONTROL" },
    { name: "failed amount", control: comparisonSession("control-valid-amount", 4100), failed: comparisonSession("failed-bad-amount", 2400), side: "FAILED" },
    { name: "currency", control: comparisonSession("control-valid-currency", 4100), failed: comparisonSession("failed-bad-currency", 2300, { currency: "eur" }), side: "FAILED" },
    { name: "livemode", control: comparisonSession("control-valid-livemode", 4100), failed: comparisonSession("failed-test-mode", 2300, { livemode: false }), side: "FAILED" },
    { name: "mode", control: comparisonSession("control-valid-mode", 4100), failed: comparisonSession("failed-setup-mode", 2300, { mode: "setup" }), side: "FAILED" },
  ];

  for (const sample of cases) {
    const helper = loadComparisonHelper({
      sessions: [sample.control, sample.failed],
      configurations: { "config-shared-fixture": comparisonConfiguration() },
    });
    const result = await helper.compareExistingLiveStripeSessions(createLiveTestClient(helper), helper.fingerprints);
    assert.equal(result.kind, "SESSION_EXPECTATION_MISMATCH", `${sample.name} must fail closed`);
    if (result.kind === "SESSION_EXPECTATION_MISMATCH") {
      assert.equal(result.side, sample.side);
      assert.equal(result.clientReference, "PRESENT");
    }
    const operations = helper.calls.map((call) => call.operation).filter((value) => value !== "client.init");
    assert.deepEqual(operations, ["sessions.list", "sessions.retrieve", "sessions.retrieve"]);
  }
});

test("a wrong Session fingerprint is rejected before either Session is retrieved", async () => {
  const control = comparisonSession("fixture-control-session", 4100);
  const failed = comparisonSession("fixture-failed-session", 2300, { client_reference_id: "different-failed-reference" });
  const helper = loadComparisonHelper({ sessions: [control, failed] });
  const result = await helper.compareExistingLiveStripeSessions(createLiveTestClient(helper), {
    control: helper.fingerprints.control,
    failed: "f".repeat(64),
  });
  assert.equal(result.kind, "SESSION_MATCH_COUNT_MISMATCH");
  if (result.kind === "SESSION_MATCH_COUNT_MISMATCH") {
    assert.equal(result.controlMatchCount, 1);
    assert.equal(result.failedMatchCount, 0);
  }
  assert.deepEqual(helper.calls.map((call) => call.operation).filter((value) => value !== "client.init"), ["sessions.list"]);
});

test("different customer cash-balance settings are reported without treating missing PaymentIntents as proof", async () => {
  const control = comparisonSession("fixture-control-session", 4100);
  const failed = comparisonSession("fixture-failed-session", 2300);
  const helper = loadComparisonHelper({
    sessions: [control, failed],
    configurations: { "config-shared-fixture": comparisonConfiguration() },
    balances: {
      "customer-fixture-control-session": {
        livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" },
      },
      "customer-fixture-failed-session": {
        livemode: true, available: { gbp: 900 }, settings: { reconciliation_mode: "manual" },
      },
    },
  });
  const result = await helper.compareExistingLiveStripeSessions(createLiveTestClient(helper), helper.fingerprints);
  assert.equal(result.kind, "diagnosed");
  if (result.kind === "diagnosed") {
    assert.equal(result.control.paymentIntentPresent, false);
    assert.equal(result.failed.paymentIntentPresent, false);
    assert.equal(result.customerCashBalanceDifference, true);
    assert.equal(result.rootCauseConfirmed, false);
    assert.equal(result.rootCauseLayer, "INSUFFICIENT_STRIPE_EVIDENCE");
    assert.deepEqual(JSON.parse(JSON.stringify(result.failedRelevantEvents)), []);
  }
});

test("requires_action plus display_bank_transfer_instructions proves instructions were created", async () => {
  const control = comparisonSession("fixture-control-session", 4100);
  const failed = comparisonSession("fixture-failed-session", 2300, { payment_intent: "fixture-failed-intent" });
  const intent = {
    id: "fixture-failed-intent", status: "requires_action", livemode: true, amount: 2300, currency: "gbp",
    payment_method_types: ["customer_balance"], last_payment_error: null,
    next_action: { type: "display_bank_transfer_instructions", display_bank_transfer_instructions: { hosted_instructions_url: "https://private.example.test" } },
    latest_charge: null,
  };
  const helper = loadComparisonHelper({
    sessions: [control, failed],
    configurations: { "config-shared-fixture": comparisonConfiguration() },
    balances: {
      "customer-fixture-control-session": { livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" } },
      "customer-fixture-failed-session": { livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" } },
    },
    intents: { "fixture-failed-intent": intent },
  });
  const result = await helper.compareExistingLiveStripeSessions(createLiveTestClient(helper), helper.fingerprints);
  assert.equal(result.kind, "diagnosed");
  if (result.kind === "diagnosed") {
    assert.equal(result.bankTransferWasCreated, true);
    assert.equal(result.failed.paymentIntent?.nextActionType, "display_bank_transfer_instructions");
    assert.equal(result.rootCauseLayer, "STRIPE_CHECKOUT_DISPLAY_OR_SESSION_PRESENTATION");
  }
  assert.equal(JSON.stringify(result).includes("hosted_instructions_url"), false);
  assert.equal(JSON.stringify(result).includes("private.example.test"), false);
});

test("failed Session actual reference links allowlisted events without leaking references or event IDs", async () => {
  const control = comparisonSession("fixture-control-session", 4100);
  const failedReference = "private-failed-reference-fixture";
  const failed = comparisonSession("fixture-failed-session", 2300, {
    client_reference_id: failedReference,
    payment_intent: "fixture-linked-intent",
  });
  const helper = loadComparisonHelper({
    sessions: [control, failed],
    configurations: { "config-shared-fixture": comparisonConfiguration() },
    balances: {
      "customer-fixture-control-session": { livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" } },
      "customer-fixture-failed-session": { livemode: true, available: { gbp: 0 }, settings: { reconciliation_mode: "automatic" } },
    },
    intents: {
      "fixture-linked-intent": {
        id: "fixture-linked-intent", status: "processing", livemode: true, amount: 2300, currency: "gbp",
        payment_method_types: ["customer_balance"], last_payment_error: null, next_action: null, latest_charge: null,
      },
    },
    events: [
      { id: "event-sensitive-one", type: "checkout.session.async_payment_failed", data: { object: { id: failed.id } } },
      { id: "event-sensitive-two", type: "payment_intent.payment_failed", data: { object: { id: "unlinked-intent", client_reference_id: failedReference } } },
      { id: "event-sensitive-four", type: "payment_intent.created", data: { object: { id: "another-unlinked-intent", metadata: { order_number: failedReference } } } },
      { id: "event-sensitive-six", type: "payment_intent.requires_action", data: { object: { id: "fixture-linked-intent" } } },
      { id: "event-sensitive-five", type: "payment_intent.processing", data: { object: { id: "wrong-reference-intent", client_reference_id: "different-reference-fixture" } } },
      { id: "event-sensitive-three", type: "customer.updated", data: { object: { id: failed.id } } },
    ],
  });
  const result = await helper.compareExistingLiveStripeSessions(createLiveTestClient(helper), helper.fingerprints);
  assert.equal(result.kind, "diagnosed");
  if (result.kind === "diagnosed") {
    assert.equal(result.failed.clientReference, "PRESENT");
    assert.equal(result.clientReferencesSame, "NO");
    assert.deepEqual(JSON.parse(JSON.stringify(result.failedRelevantEvents)), [
      "checkout.session.async_payment_failed",
      "payment_intent.payment_failed",
      "payment_intent.created",
      "payment_intent.requires_action",
    ]);
    assert.equal(result.failedEventSearchComplete, true);
    assert.equal(result.rootCauseConfirmed, false);
    assert.equal(result.rootCauseLayer, "STRIPE_EVENT_EVIDENCE_WITHOUT_PAYMENT_ERROR_DETAIL");
  }
  for (const forbidden of ["event-sensitive-one", "event-sensitive-two", "event-sensitive-three", "event-sensitive-four", "event-sensitive-five", "event-sensitive-six", "unlinked-intent", "fixture-linked-intent", failedReference]) {
    assert.equal(JSON.stringify(result).includes(forbidden), false);
  }
  assert.equal(JSON.stringify(helper.calls).includes(failedReference), false);
});

test("two exact fingerprint matches are required; search and read failures stay sanitized", async () => {
  const control = comparisonSession("fixture-control-session", 4100);
  const failed = comparisonSession("fixture-failed-session", 2300);
  const helper = loadComparisonHelper({
    sessions: [control, failed, control],
    configurations: { "config-shared-fixture": comparisonConfiguration() },
    balances: {},
  });
  const result = await helper.compareExistingLiveStripeSessions(createLiveTestClient(helper), helper.fingerprints);
  assert.equal(result.kind, "SESSION_MATCH_COUNT_MISMATCH");
  if (result.kind === "SESSION_MATCH_COUNT_MISMATCH") {
    assert.equal(result.controlMatchCount, 2);
    assert.equal(result.failedMatchCount, 1);
  }

  const listFailure = loadComparisonHelper({ sessions: [control, failed], configurations: {}, balances: {} });
  const stripe = createLiveTestClient(listFailure);
  stripe.checkout.sessions.list = async () => { throw new Error("private session detail"); };
  await assert.rejects(
    listFailure.compareExistingLiveStripeSessions(stripe, listFailure.fingerprints),
    (error) => error.stage === "STRIPE_SESSION_LIST_FAILED" && error.message === "STRIPE_SESSION_LIST_FAILED",
  );
});
