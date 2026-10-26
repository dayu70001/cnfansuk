import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const orderRouteSource = read("app/api/orders/route.ts");
const checkoutRouteSource = read("app/api/payments/stripe/checkout/route.ts");
const startRouteSource = read("app/api/payments/stripe/start/route.ts");
const configRouteSource = read("app/api/payments/stripe/config/route.ts");
const statusRouteSource = read("app/api/payments/stripe/session-status/route.ts");
const confirmationRouteSource = read("app/api/orders/[orderNumber]/confirmation/route.ts");
const confirmationComponentSource = read("components/OrderConfirmationDetails.tsx");

function loadHandler(source, { fetch = async () => { throw new Error("Unexpected network request"); } } = {}) {
  const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    fetch,
    require(id) {
      if (id === "next/server") return {
        NextResponse: {
          json(body, init = {}) { return { body, status: init.status || 200, headers: init.headers || {} }; },
        },
      };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

function loadOrderRoute({ env, fetch, getCatalogApiBase = () => "https://production-worker.invalid" }) {
  const compiled = ts.transpile(orderRouteSource, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    fetch,
    process: { env },
    URL,
    require(id) {
      if (id === "next/server") return {
        NextResponse: {
          json(body, init = {}) {
            return { body, status: init.status || 200, headers: new Headers(init.headers || {}), cookies: { set() {} } };
          },
        },
      };
      if (id === "@/lib/catalogApiBase") return { getCatalogApiBase };
      if (id === "@/lib/orderAccessToken") return { createOrderAccessToken: () => "local-test-token" };
      if (id === "@/lib/payments/stripeBankTransfer") return {
        getStripeBankTransferMode: () => env.STRIPE_BANK_TRANSFER_MODE || "disabled",
        isStripeLiveProductionRequest: () => false,
      };
      if (id === "@/lib/orderAccessTokenKey") return {
        getOrderAccessTokenCookieName: () => null,
        getOrderAccessTokenCookiePath: () => null,
      };
      if (id === "@/lib/orderAccessTokenCookie") return { buildOrderAccessTokenCookie: () => ({}) };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

test("development order creation fails closed unless its upstream is a loopback-only local Worker", async () => {
  let networkCalls = 0;
  let productionBaseLookups = 0;
  const forbiddenFetch = async () => { networkCalls += 1; throw new Error("Unexpected network request"); };
  const noLocalBase = loadOrderRoute({
    env: { NODE_ENV: "development", STRIPE_BANK_TRANSFER_MODE: "disabled" },
    fetch: forbiddenFetch,
    getCatalogApiBase() { productionBaseLookups += 1; return "https://production-worker.invalid"; },
  });
  const missingConfig = await noLocalBase.POST(new Request("http://localhost:4000/api/orders", { method: "POST", body: "{}" }));
  assert.equal(missingConfig.status, 503);

  const remoteBase = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "https://production-worker.invalid" },
    fetch: forbiddenFetch,
  });
  const rejectedRemote = await remoteBase.POST(new Request("http://localhost:4000/api/orders", { method: "POST", body: "{}" }));
  assert.equal(rejectedRemote.status, 503);

  const localOnly = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787", STRIPE_BANK_TRANSFER_MODE: "disabled" },
    fetch: forbiddenFetch,
  });
  const rejectedRemoteRequest = await localOnly.POST(new Request("https://www.cnfans.co.uk/api/orders", { method: "POST", body: "{}" }));
  assert.equal(rejectedRemoteRequest.status, 403);
  assert.equal(networkCalls, 0);
  assert.equal(productionBaseLookups, 0);
});

test("development order creation uses only the configured loopback Worker and production keeps its normal proxy", async () => {
  const fetched = [];
  const fetch = async (url, init) => {
    fetched.push({ url, init });
    return new Response(JSON.stringify({ order: { orderNumber: "CNF-LOCAL-0001", status: "pending", finalTotal: 42 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const local = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787/", STRIPE_BANK_TRANSFER_MODE: "disabled" },
    fetch,
  });
  const localResponse = await local.POST(new Request("http://localhost:4000/api/orders", { method: "POST", body: "{}" }));
  assert.equal(localResponse.status, 200);
  assert.equal(fetched[0].url, "http://127.0.0.1:8787/orders");
  assert.equal(localResponse.body.order.status, "pending");
  assert.equal(localResponse.body.order.orderNumber, "CNF-LOCAL-0001");

  fetched.length = 0;
  const production = loadOrderRoute({ env: { NODE_ENV: "production" }, fetch });
  const productionResponse = await production.POST(new Request("https://www.cnfans.co.uk/api/orders", { method: "POST", body: "{}" }));
  assert.equal(productionResponse.status, 200);
  assert.equal(fetched[0].url, "https://production-worker.invalid/orders");
});

test("Stripe Session endpoints stay disabled while normal order creation can be restored", async () => {
  let networkCalls = 0;
  const fetch = async () => { networkCalls += 1; throw new Error("must not call a backend"); };
  const checkout = loadHandler(checkoutRouteSource, { fetch });
  const start = loadHandler(startRouteSource, { fetch });

  for (const response of [
    await checkout.POST(new Request("https://www.cnfans.co.uk/api/payments/stripe/checkout", { method: "POST", body: "{}" })),
    await start.GET(new Request("https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234")),
  ]) {
    assert.equal(response.status, 503);
    assert.match(response.body.error, /temporarily paused/);
  }
  assert.equal(networkCalls, 0);
  for (const route of [checkoutRouteSource, startRouteSource]) {
    assert.doesNotMatch(route, /createStripeBankTransferCheckout|createLocalStripeTestCheckout|stripe\.checkout\.sessions\.create|payment-submitted|fetch\(/);
  }
  assert.match(orderRouteSource, /LOCAL_ORDER_API_BASE/);
  assert.match(orderRouteSource, /process\.env\.NODE_ENV === "development"/);
  assert.match(orderRouteSource, /baseUrl = getCatalogApiBase\(\)/);
  assert.doesNotMatch(orderRouteSource, /payment-submitted|stripe\.checkout\.sessions\.create/);
});

test("Stripe config explicitly reports disabled and never exposes configured mode", async () => {
  const route = loadHandler(configRouteSource);
  const response = await route.GET(new Request("https://www.cnfans.co.uk/api/payments/stripe/config"));
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), { enabled: false, mode: "disabled" });
});

test("historical payment-status and order-confirmation reads remain present and read-only", () => {
  assert.match(statusRouteSource, /export async function GET/);
  assert.match(statusRouteSource, /loadAuthorizedOrder\(orderNumber, orderAccessToken\)/);
  assert.match(statusRouteSource, /retrieveStripeSessionSummary\(sessionId, loadedOrder\.order, mode\)/);
  assert.doesNotMatch(statusRouteSource, /method:\s*["']POST|payment-confirmed|payment-submitted|\.update\(|DB\./);
  assert.match(confirmationRouteSource, /export async function GET/);
  assert.match(confirmationRouteSource, /loadAuthorizedOrder\(/);
  assert.match(confirmationComponentSource, /\/api\/orders\/\$\{encodeURIComponent\(orderNumber\)\}\/confirmation/);
  assert.doesNotMatch(confirmationRouteSource, /method:\s*["']POST|payment_confirmed_at|\.update\(|DB\./);
});
