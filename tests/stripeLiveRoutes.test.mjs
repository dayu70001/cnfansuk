import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodeRequire = createRequire(import.meta.url);
const orderRouteSource = fs.readFileSync(path.join(root, "app", "api", "orders", "route.ts"), "utf8");
const checkoutRouteSource = fs.readFileSync(path.join(root, "app", "api", "payments", "stripe", "checkout", "route.ts"), "utf8");
const statusRouteSource = fs.readFileSync(path.join(root, "app", "api", "payments", "stripe", "session-status", "route.ts"), "utf8");
const confirmationRouteSource = fs.readFileSync(path.join(root, "app", "api", "orders", "[orderNumber]", "confirmation", "route.ts"), "utf8");
const confirmationComponentSource = fs.readFileSync(path.join(root, "components", "OrderConfirmationDetails.tsx"), "utf8");
const cookieHelperSource = fs.readFileSync(path.join(root, "lib", "orderAccessTokenCookie.ts"), "utf8");
const orderAccessTokenSource = fs.readFileSync(path.join(root, "lib", "orderAccessToken.ts"), "utf8");

class StripeCheckoutSessionMismatchError extends Error {
  constructor(checks) {
    super("Stripe returned a Checkout Session that does not match the saved order.");
    this.checks = checks;
  }
}

function loadHandler(source, { modules = {}, env = { NODE_ENV: "production" }, fetch = async () => { throw new Error("Unexpected fetch"); } } = {}) {
  const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  const loadedModule = { exports: {} };
  const cookies = [];
  const logs = [];
  const nextResponse = {
    json(body, init = {}) {
      return {
        body,
        status: init.status || 200,
        headers: init.headers || {},
        cookieValues: cookies,
        cookies: { set(cookie) { cookies.push(cookie); } },
      };
    },
  };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env },
    URL,
    console: { error(...args) { logs.push(args); } },
    fetch,
    require(id) {
      if (id === "next/server") return { NextResponse: nextResponse };
      if (Object.hasOwn(modules, id)) return modules[id];
      throw new Error(`Unexpected module import: ${id}`);
    },
  });
  return { ...loadedModule.exports, cookies, logs };
}

test("Live order creation issues narrowly scoped payment and processing access cookies", async () => {
  const calls = { worker: 0, cookieName: "", cookieValue: "" };
  const route = loadHandler(orderRouteSource, {
    modules: {
      "@/lib/catalogApiBase": { getCatalogApiBase: () => "https://catalog.example.invalid" },
      "@/lib/orderAccessToken": { createOrderAccessToken: () => "scoped-order-token-fixture" },
      "@/lib/payments/stripeBankTransfer": {
        getStripeBankTransferMode: () => "live",
        isStripeLiveProductionRequest: () => true,
      },
      "@/lib/orderAccessTokenKey": {
        getOrderAccessTokenCookieName: (number, purpose) => `cnfans-order-access-${purpose}-${number}`,
        getOrderAccessTokenCookiePath: (number, purpose) => purpose === "stripe"
          ? "/api/payments/stripe"
          : purpose === "processing"
            ? "/payments/stripe/processing"
            : `/api/orders/${number}/confirmation`,
      },
      "@/lib/orderAccessTokenCookie": {
        buildOrderAccessTokenCookie(name, value, cookiePath) {
          calls.cookieName = name;
          calls.cookieValue = value;
          return { name, value, httpOnly: true, secure: true, sameSite: "lax", path: cookiePath, maxAge: 604800 };
        },
      },
    },
    fetch: async () => {
      calls.worker += 1;
      return { ok: true, status: 201, json: async () => ({ order: { orderNumber: "CNF-260924-1234", finalTotal: 117 } }) };
    },
  });
  const response = await route.POST({ text: async () => "{}", headers: new Headers({ host: "www.cnfans.co.uk", origin: "https://www.cnfans.co.uk" }) });
  assert.equal(calls.worker, 1);
  assert.equal(calls.cookieName, "cnfans-order-access-processing-CNF-260924-1234");
  assert.equal(calls.cookieValue, "scoped-order-token-fixture");
  assert.equal(response.cookieValues.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(response.cookieValues)), [
    {
      name: "cnfans-order-access-stripe-CNF-260924-1234",
      value: "scoped-order-token-fixture",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/payments/stripe",
      maxAge: 604800,
    },
    {
      name: "cnfans-order-access-confirmation-CNF-260924-1234",
      value: "scoped-order-token-fixture",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/orders/CNF-260924-1234/confirmation",
      maxAge: 604800,
    },
    {
      name: "cnfans-order-access-processing-CNF-260924-1234",
      value: "scoped-order-token-fixture",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/payments/stripe/processing",
      maxAge: 604800,
    },
  ]);
  assert.equal(response.body.order.orderAccessToken, undefined);
  assert.equal(JSON.stringify(response.body).includes("scoped-order-token-fixture"), false);
});

test("local Test order creation scopes the start and processing cookies to loopback", async () => {
  const route = loadHandler(orderRouteSource, {
    env: { NODE_ENV: "development" },
    modules: {
      "@/lib/catalogApiBase": { getCatalogApiBase: () => "https://catalog.example.invalid" },
      "@/lib/orderAccessToken": { createOrderAccessToken: () => "local-signed-order-token" },
      "@/lib/payments/stripeBankTransfer": {
        getStripeBankTransferMode: () => "test",
        isStripeLiveProductionRequest: () => false,
      },
      "@/lib/orderAccessTokenKey": {
        getOrderAccessTokenCookieName: (number, purpose) => `cnfans-order-access-${purpose}-${number}`,
        getOrderAccessTokenCookiePath: (number, purpose) => purpose === "stripe"
          ? "/api/payments/stripe"
          : purpose === "processing"
            ? "/payments/stripe/processing"
            : `/api/orders/${number}/confirmation`,
      },
      "@/lib/orderAccessTokenCookie": {
        buildOrderAccessTokenCookie: (name, value, cookiePath) => ({ name, value, httpOnly: true, secure: false, sameSite: "lax", path: cookiePath, maxAge: 604800 }),
      },
    },
    fetch: async () => ({
      ok: true,
      status: 201,
      json: async () => ({ order: { orderNumber: "CNF-260924-1235", finalTotal: 117 } }),
    }),
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    headers: { host: "localhost:4000", origin: "http://localhost:4000" },
    body: "{}",
  }));
  assert.equal(response.status, 201);
  assert.equal(response.cookieValues.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(response.cookieValues.map(({ name, path, httpOnly }) => ({ name, path, httpOnly })))), [
    { name: "cnfans-order-access-stripe-CNF-260924-1235", path: "/api/payments/stripe", httpOnly: true },
    { name: "cnfans-order-access-processing-CNF-260924-1235", path: "/payments/stripe/processing", httpOnly: true },
  ]);
  assert.equal(response.body.order.orderAccessToken, "local-signed-order-token");
});

test("Live Checkout authorizes from the HttpOnly order cookie and rejects client-supplied totals", async () => {
  const calls = { order: null, accessToken: "", stripe: 0 };
  const route = loadHandler(checkoutRouteSource, {
    modules: {
      "@/lib/authorizedOrder": {
        loadAuthorizedOrder: async (orderNumber, token) => {
          calls.order = orderNumber;
          calls.accessToken = token;
          return { ok: true, order: { order_number: orderNumber, email: "buyer@example.invalid", final_total: 117, currency: "GBP" } };
        },
      },
      "@/lib/orderAccessTokenCookie": { getOrderAccessTokenFromCookieHeader: () => "scoped-order-token-fixture" },
      "@/lib/payments/stripeBankTransfer": {
        buildStripeBankTransferSessionDraft() {},
        getStripeBankTransferMode: () => "live",
        isStripeLiveProductionRequest: () => true,
        isLocalStripeBankTransferTestEnabled: () => false,
        isLocalStripeBankTransferMockEnabled: () => false,
      },
      "@/lib/payments/stripeServer": {
        StripeCheckoutSessionMismatchError,
        createLocalStripeTestCheckout: async () => { throw new Error("Test path should not run"); },
        createStripeBankTransferCheckout: async (order, mode) => {
          calls.stripe += 1;
          assert.equal(order.final_total, 117);
          assert.equal(order.currency, "GBP");
          assert.equal(mode, "live");
          return {
            sessionId: "cs_live_fixture123",
            checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_fixture123",
            returnUrl: "https://www.cnfans.co.uk/order-success?order=CNF-260924-1234&payment=stripe_live&session_id=cs_live_fixture123",
          };
        },
      },
    },
  });
  const request = new Request("https://www.cnfans.co.uk/api/payments/stripe/checkout", {
    method: "POST",
    headers: { host: "www.cnfans.co.uk", origin: "https://www.cnfans.co.uk", cookie: "fixture=1" },
    body: JSON.stringify({ orderNumber: "CNF-260924-1234" }),
  });
  const response = await route.POST(request);
  assert.equal(response.status, 200);
  assert.equal(calls.order, "CNF-260924-1234");
  assert.equal(calls.accessToken, "scoped-order-token-fixture");
  assert.equal(calls.stripe, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), {
    mode: "live",
    sessionId: "cs_live_fixture123",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_fixture123",
    returnUrl: "https://www.cnfans.co.uk/order-success?order=CNF-260924-1234&payment=stripe_live&session_id=cs_live_fixture123",
  });

  const invalidRequest = new Request("https://www.cnfans.co.uk/api/payments/stripe/checkout", {
    method: "POST",
    headers: { host: "www.cnfans.co.uk", origin: "https://www.cnfans.co.uk" },
    body: JSON.stringify({ orderNumber: "CNF-260924-1234", amount: 1 }),
  });
  assert.equal((await route.POST(invalidRequest)).status, 400);
  assert.equal(calls.stripe, 1);
});

test("Live Session mismatch logs booleans only and returns the generic checkout error", async () => {
  const checks = {
    livemodeMatch: true,
    modeMatch: true,
    amountMatch: false,
    currencyMatch: true,
    referenceMatch: true,
    sessionIdMatch: true,
    urlPresent: true,
    urlHttps: true,
    urlCredentialsAbsent: true,
  };
  const route = loadHandler(checkoutRouteSource, {
    modules: {
      "@/lib/authorizedOrder": {
        loadAuthorizedOrder: async () => ({ ok: true, order: { order_number: "CNF-260924-1234", email: "buyer@example.invalid", final_total: 117, currency: "GBP" } }),
      },
      "@/lib/orderAccessTokenCookie": { getOrderAccessTokenFromCookieHeader: () => "scoped-order-token-fixture" },
      "@/lib/payments/stripeBankTransfer": {
        buildStripeBankTransferSessionDraft() {},
        getStripeBankTransferMode: () => "live",
        isStripeLiveProductionRequest: () => true,
        isLocalStripeBankTransferTestEnabled: () => false,
        isLocalStripeBankTransferMockEnabled: () => false,
      },
      "@/lib/payments/stripeServer": {
        StripeCheckoutSessionMismatchError,
        createLocalStripeTestCheckout: async () => { throw new Error("Unexpected test path"); },
        createStripeBankTransferCheckout: async () => { throw new StripeCheckoutSessionMismatchError(checks); },
      },
    },
  });
  const response = await route.POST(new Request("https://www.cnfans.co.uk/api/payments/stripe/checkout", {
    method: "POST",
    headers: { host: "www.cnfans.co.uk", origin: "https://www.cnfans.co.uk", cookie: "fixture=1" },
    body: JSON.stringify({ orderNumber: "CNF-260924-1234" }),
  }));
  assert.equal(response.status, 502);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), { error: "Bank transfer is temporarily unavailable. Please try again." });
  assert.equal(route.logs.length, 1);
  assert.equal(route.logs[0][0], "Stripe Live Checkout Session validation failed");
  assert.deepEqual(JSON.parse(JSON.stringify(route.logs[0][1])), checks);
  assert.equal(JSON.stringify(route.logs).includes("cs_live_"), false);
  assert.equal(JSON.stringify(route.logs).includes("checkout.stripe.com"), false);
});

test("Live session status is cookie-authorized, read-only and exposes only two status fields", async () => {
  const calls = { token: "", read: 0 };
  const route = loadHandler(statusRouteSource, {
    modules: {
      "@/lib/authorizedOrder": {
        loadAuthorizedOrder: async (_orderNumber, token) => {
          calls.token = token;
          return { ok: true, order: { order_number: "CNF-260924-1234", email: "buyer@example.invalid", final_total: 117, currency: "GBP" } };
        },
      },
      "@/lib/orderAccessTokenCookie": { getOrderAccessTokenFromCookieHeader: (_header, _order, purpose) => {
        assert.equal(purpose || "stripe", "stripe");
        return "scoped-order-token-fixture";
      } },
      "@/lib/payments/stripeBankTransfer": {
        getStripeBankTransferMode: () => "live",
        isStripeLiveProductionRequest: () => true,
      },
      "@/lib/payments/stripeServer": {
        retrieveStripeSessionSummary: async (sessionId, _order, mode) => {
          calls.read += 1;
          assert.equal(sessionId, "cs_live_fixture123");
          assert.equal(mode, "live");
          return {
            paymentStatus: "paid",
            status: "complete",
            customer: "must-not-leak",
            paymentIntent: "must-not-leak",
            email: "must-not-leak",
          };
        },
        StripeSessionOrderMismatchError: class StripeSessionOrderMismatchError extends Error {},
      },
    },
  });
  const request = new Request("https://www.cnfans.co.uk/api/payments/stripe/session-status?order=CNF-260924-1234&session_id=cs_live_fixture123", {
    headers: { host: "www.cnfans.co.uk", cookie: "fixture=1" },
  });
  const response = await route.GET(request);
  assert.equal(response.status, 200);
  assert.equal(calls.token, "scoped-order-token-fixture");
  assert.equal(calls.read, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), { paymentStatus: "paid", checkoutStatus: "complete" });
  assert.match(statusRouteSource, /export async function GET/);
  assert.doesNotMatch(statusRouteSource, /fetch\(.+method:\s*["']POST|payment_confirmed|\.update\(|DB\./s);
});

test("Live Order Success details remain readable with the HttpOnly cookie, without browser token storage", async () => {
  let receivedToken = "";
  const route = loadHandler(confirmationRouteSource, {
    modules: {
      "@/lib/authorizedOrder": {
        loadAuthorizedOrder: async (_orderNumber, token) => {
          receivedToken = token;
          return {
            ok: true,
            order: {
              order_number: "CNF-260924-1234",
              status: "pending",
              subtotal: 100,
              shipping_fee: 17,
              final_total: 117,
              currency: "GBP",
              email: "buyer@example.invalid",
              shipping_method_label: "Standard",
              shipping_estimate: "5–8 days",
              items: [],
            },
          };
        },
      },
      "@/lib/orderAccessTokenCookie": { getOrderAccessTokenFromCookieHeader: (_header, _order, purpose) => {
        assert.equal(purpose, "confirmation");
        return "scoped-order-token-fixture";
      } },
      "@/lib/payments/stripeBankTransfer": {
        getStripeBankTransferMode: () => "live",
        isStripeLiveProductionRequest: () => true,
      },
    },
  });
  const response = await route.GET(
    new Request("https://www.cnfans.co.uk/api/orders/CNF-260924-1234/confirmation", { headers: { host: "www.cnfans.co.uk" } }),
    { params: Promise.resolve({ orderNumber: "CNF-260924-1234" }) },
  );
  assert.equal(response.status, 200);
  assert.equal(receivedToken, "scoped-order-token-fixture");
  assert.equal(response.body.order.orderNumber, "CNF-260924-1234");
  assert.match(confirmationComponentSource, /useLiveAccessCookie/);
  assert.match(confirmationComponentSource, /credentials: "same-origin"/);
  assert.doesNotMatch(confirmationComponentSource, /sessionStorage\.setItem/);
});

test("Live access cookie reader selects only the order-specific cookie and cookie options stay HttpOnly", () => {
  const compiled = ts.transpile(cookieHelperSource, { module: ts.ModuleKind.CommonJS });
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env: { NODE_ENV: "production" } },
    require(id) {
      if (id === "server-only") return {};
      if (id === "@/lib/orderAccessTokenKey") return {
        getOrderAccessTokenCookieName: (number, purpose = "stripe") => `cnfans-order-access-${purpose}-${number}`,
        getOrderAccessTokenCookiePath: (number, purpose = "stripe") => purpose === "stripe"
          ? "/api/payments/stripe"
          : purpose === "processing"
            ? "/payments/stripe/processing"
            : `/api/orders/${number}/confirmation`,
      };
      throw new Error(`Unexpected module import: ${id}`);
    },
  });
  const helper = loadedModule.exports;
  assert.equal(helper.getOrderAccessTokenFromCookieHeader(
    "other=value; cnfans-order-access-stripe-CNF-260924-1234=order-token; another=value",
    "CNF-260924-1234",
  ), "order-token");
  assert.equal(helper.getOrderAccessTokenFromCookieHeader("cnfans-order-access-stripe-CNF-OTHER=wrong", "CNF-260924-1234"), "");
  assert.deepEqual(JSON.parse(JSON.stringify(helper.buildOrderAccessTokenCookie("cookie-name", "cookie-value", "/api/payments/stripe"))), {
    name: "cookie-name",
    value: "cookie-value",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/payments/stripe",
    maxAge: 604800,
  });
});

test("Order access authorization remains scoped to the signed order number", () => {
  const compiled = ts.transpile(orderAccessTokenSource, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    Buffer,
    Date,
    require(id) {
      if (id === "server-only") return {};
      if (id === "node:crypto") return nodeRequire("node:crypto");
      if (id === "@/lib/adminAuth") return { getAdminWorkerToken: () => "unit-test-signing-secret" };
      throw new Error(`Unexpected module import: ${id}`);
    },
  });
  const { createOrderAccessToken, verifyOrderAccessToken } = loadedModule.exports;
  const token = createOrderAccessToken("CNF-260924-1234");
  assert.equal(typeof token, "string");
  assert.equal(verifyOrderAccessToken(token, "CNF-260924-1234"), true);
  assert.equal(verifyOrderAccessToken(token, "CNF-260924-9999"), false);
  assert.equal(verifyOrderAccessToken(`${token}x`, "CNF-260924-1234"), false);
});
