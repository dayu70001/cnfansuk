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
const quoteRouteSource = read("app/api/orders/quote/route.ts");
const orderApiProxySource = read("lib/orderApiProxy.ts");
const confirmationRouteSource = read("app/api/orders/[orderNumber]/confirmation/route.ts");
const orderByNumberRouteSource = read("app/api/orders/[orderNumber]/route.ts");
const whatsappClickedRouteSource = read("app/api/orders/[orderNumber]/whatsapp-clicked/route.ts");

function loadOrderRoute({ env, fetch, catalogBase = "https://production-worker.invalid", token = "order-token" }) {
  const orderApiProxy = loadOrderApiProxy({ env, catalogBase });
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpile(orderRouteSource, { module: ts.ModuleKind.CommonJS }), {
    module: loadedModule,
    exports: loadedModule.exports,
    fetch,
    process: { env },
    URL,
    require(id) {
      if (id === "next/server") return {
        NextResponse: { json(body, init = {}) { return { body, status: init.status || 200 }; } },
      };
      if (id === "@/lib/catalogApiBase") return { getCatalogApiBase: () => catalogBase };
      if (id === "@/lib/orderAccessToken") return { createOrderAccessToken: () => token };
      if (id === "@/lib/orderApiProxy") return orderApiProxy;
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

function loadQuoteRoute({ env, fetch, catalogBase = "https://production-worker.invalid" }) {
  const orderApiProxy = loadOrderApiProxy({ env, catalogBase });
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpile(quoteRouteSource, { module: ts.ModuleKind.CommonJS }), {
    module: loadedModule,
    exports: loadedModule.exports,
    fetch,
    process: { env },
    URL,
    require(id) {
      if (id === "next/server") return {
        NextResponse: { json(body, init = {}) { return { body, status: init.status || 200, headers: init.headers || {} }; } },
      };
      if (id === "@/lib/orderApiProxy") return orderApiProxy;
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

function loadOrderApiProxy({ env, catalogBase }) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpile(orderApiProxySource, { module: ts.ModuleKind.CommonJS }), {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env },
    URL,
    Set,
    require(id) {
      if (id === "@/lib/catalogApiBase") return { getCatalogApiBase: () => catalogBase };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

function loadConfirmationRoute({ allowedToken = "order-token" } = {}) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpile(confirmationRouteSource, { module: ts.ModuleKind.CommonJS }), {
    module: loadedModule,
    exports: loadedModule.exports,
    URL,
    require(id) {
      if (id === "next/server") return {
        NextResponse: { json(body, init = {}) { return { body, status: init.status || 200, headers: init.headers || {} }; } },
      };
      if (id === "@/lib/authorizedOrder") return {
        loadAuthorizedOrder: async (orderNumber, token) => token === allowedToken
          ? { ok: true, order: {
              order_number: orderNumber,
              status: "pending",
              payment_stage: "awaiting_payment",
              subtotal: 30,
              shipping_fee: 5,
              final_total: 35,
              currency: "GBP",
              email: "customer@example.invalid",
              shipping_method_label: "DHL",
              shipping_estimate: "",
              items: [],
            } }
          : { ok: false, status: 401, error: "Invalid order token" },
      };
      if (id === "@/lib/orderAccessTokenCookie") return {
        getOrderAccessTokenFromCookieHeader: (cookieHeader, orderNumber, purpose) =>
          cookieHeader?.includes(`cnfans-order-access-${purpose}-${orderNumber}=order-token`) ? "order-token" : "",
      };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

function loadWhatsappClickedRoute({ env, fetch, catalogBase = "https://production-worker.invalid" }) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(ts.transpile(whatsappClickedRouteSource, { module: ts.ModuleKind.CommonJS }), {
    module: loadedModule,
    exports: loadedModule.exports,
    fetch,
    process: { env },
    URL,
    Set,
    require(id) {
      if (id === "next/server") return {
        NextResponse: class {
          constructor(body, init = {}) { this.body = body; this.status = init.status || 200; }
          static json(body, init = {}) { return { body, status: init.status || 200 }; }
        },
      };
      if (id === "@/lib/catalogApiBase") return { getCatalogApiBase: () => catalogBase };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return loadedModule.exports;
}

test("development order creation fails closed without a loopback Worker", async () => {
  let calls = 0;
  const route = loadOrderRoute({
    env: { NODE_ENV: "development" },
    fetch: async () => { calls += 1; throw new Error("unexpected request"); },
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", quantity: 1 }] }),
  }));
  assert.equal(response.status, 503);
  assert.equal(response.body.error, "We couldn't process your order. Please try again.");
  assert.equal(calls, 0);
});

test("development order creation uses only a configured local Worker and returns the order token", async () => {
  let target = "";
  const route = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787/" },
    fetch: async (url) => {
      target = url;
      return new Response(JSON.stringify({ order: { orderNumber: "CNF-LOCAL-0001", status: "pending" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", quantity: 1 }] }),
  }));
  assert.equal(response.status, 200);
  assert.equal(target, "http://127.0.0.1:8787/orders");
  assert.equal(response.body.order.status, "pending");
  assert.equal(response.body.order.orderAccessToken, "order-token");
});

test("order route translates known Worker validation errors and fails safely on local network errors", async () => {
  const translatedRoute = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({ error: "订单包含不存在或已下架商品" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }),
  });
  const translated = await translatedRoute.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }] }),
  }));
  assert.equal(translated.status, 400);
  assert.equal(translated.body.code, "ITEM_UNAVAILABLE");
  assert.match(translated.body.error, /no longer available/i);

  const invalidSessionRoute = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({
      error: "Your checkout session is invalid. Please refresh checkout and try again.",
      code: "CHECKOUT_SESSION_ID_INVALID",
    }), { status: 400, headers: { "Content-Type": "application/json" } }),
  });
  const invalidSession = await invalidSessionRoute.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }] }),
  }));
  assert.equal(invalidSession.status, 400);
  assert.equal(invalidSession.body.code, "CHECKOUT_SESSION_ID_INVALID");
  assert.match(invalidSession.body.error, /refresh checkout/i);

  const legacyProtocolRoute = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({
      error: "This checkout page is out of date. Please refresh checkout to review your delivery options and confirm the latest total.",
      code: "QUOTE_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/json" } }),
  });
  const legacyProtocol = await legacyProtocolRoute.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }] }),
  }));
  assert.equal(legacyProtocol.status, 409);
  assert.equal(legacyProtocol.body.code, "QUOTE_REQUIRED");
  assert.match(legacyProtocol.body.error, /out of date.*refresh checkout/i);

  const invalidQuoteRoute = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({
      error: "This checkout page is out of date. Please refresh checkout to review your delivery options and confirm the latest total.",
      code: "QUOTE_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/json" } }),
  });
  const invalidQuote = await invalidQuoteRoute.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }] }),
  }));
  assert.equal(invalidQuote.status, 409);
  assert.equal(invalidQuote.body.code, "QUOTE_REQUIRED");
  assert.match(invalidQuote.body.error, /out of date.*refresh checkout/i);

  const internalFailureRoute = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({ error: "D1 internal error: private database detail" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }),
  });
  const internalFailure = await internalFailureRoute.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }] }),
  }));
  assert.equal(internalFailure.status, 500);
  assert.equal(internalFailure.body.error, "We couldn't process your order. Please try again.");
  assert.doesNotMatch(JSON.stringify(internalFailure.body), /D1 internal error|private database detail/);

  const networkRoute = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => { throw new Error("connection refused"); },
  });
  const network = await networkRoute.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }] }),
  }));
  assert.equal(network.status, 502);
  assert.match(network.body.error, /couldn't reach the order service/i);
});

test("order route preserves a safe updated quote after the Worker rejects a stale snapshot", async () => {
  const quote = {
    subtotal: 60,
    shippingFee: 5,
    finalTotal: 65,
    currency: "GBP",
    eligibilityCurrency: "GBP",
    eligibilitySubtotal: 60,
    freeShippingApplied: false,
    lineItems: [{ productCode: "LOCAL-TEST", size: "M", quantity: 1, unitPrice: 60, lineTotal: 60 }],
  };
  const route = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({
      error: "Order totals changed. Please review the updated total before placing your order.",
      code: "QUOTE_CHANGED",
      quote,
    }), { status: 409, headers: { "Content-Type": "application/json" } }),
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "LOCAL-TEST", size: "M", quantity: 1 }] }),
  }));
  assert.equal(response.status, 409);
  assert.equal(response.body.code, "QUOTE_CHANGED");
  assert.equal(response.body.error, "Your order total has changed. Please review the updated amount before confirming.");
  assert.equal(response.body.quote.finalTotal, 65);
  assert.equal(response.body.quote.lineItems[0].productCode, "LOCAL-TEST");
});

test("empty cart order POST is rejected in the Next route before any Worker request", async () => {
  let calls = 0;
  const route = loadOrderRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => { calls += 1; throw new Error("must not fetch"); },
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders", {
    method: "POST",
    body: JSON.stringify({ items: [] }),
  }));
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("order quote is read-only and fails closed to Production when local Worker is not configured", async () => {
  let calls = 0;
  const route = loadQuoteRoute({ env: { NODE_ENV: "development" }, fetch: async () => { calls += 1; } });
  const response = await route.POST(new Request("http://localhost:4000/api/orders/quote", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", quantity: 1 }], shippingMethodId: "royal-mail-tracked", eligibilityCurrency: "GBP" }),
  }));
  assert.equal(response.status, 503);
  assert.equal(calls, 0);
});

test("configured local quote uses only the loopback Worker and POSTs the read-only quote request", async () => {
  let target = "";
  let body = "";
  const route = loadQuoteRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787/" },
    fetch: async (url, init) => {
      target = String(url);
      body = String(init?.body);
      return new Response(JSON.stringify({ quote: { subtotal: 50, shippingFee: 5, finalTotal: 55, currency: "GBP" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders/quote", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", quantity: 1 }], shippingMethodId: "royal-mail-tracked", eligibilityCurrency: "EUR" }),
  }));
  assert.equal(response.status, 200);
  assert.equal(target, "http://127.0.0.1:8787/orders/quote");
  assert.match(body, /"eligibilityCurrency":"EUR"/);
  assert.equal(response.headers["Cache-Control"], "no-store");
});

test("quote distinguishes missing local QA products from unavailable Production products", async () => {
  const route = loadQuoteRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({ error: "订单包含不存在或已下架商品" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }),
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders/quote", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }], shippingMethodId: "royal-mail-tracked", eligibilityCurrency: "GBP" }),
  }));
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "LOCAL_QA_ITEM_UNAVAILABLE");
  assert.equal(response.body.error, "This item isn't available in the local QA catalogue yet. Prepare it locally before testing checkout.");

  const productionRoute = loadQuoteRoute({
    env: { NODE_ENV: "production", LOCAL_ORDER_API_BASE: "https://orders.example.test" },
    fetch: async () => new Response(JSON.stringify({ error: "订单包含不存在或已下架商品" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }),
  });
  const productionResponse = await productionRoute.POST(new Request("https://www.cnfans.co.uk/api/orders/quote", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }], shippingMethodId: "royal-mail-tracked", eligibilityCurrency: "GBP" }),
  }));
  assert.equal(productionResponse.status, 400);
  assert.equal(productionResponse.body.code, "ITEM_UNAVAILABLE");
  assert.equal(productionResponse.body.error, "One or more items in your cart are no longer available. Please review your cart.");

  const otherFailureRoute = loadQuoteRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787" },
    fetch: async () => new Response(JSON.stringify({ error: "Unable to verify the current order total." }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    }),
  });
  const otherFailure = await otherFailureRoute.POST(new Request("http://localhost:4000/api/orders/quote", {
    method: "POST",
    body: JSON.stringify({ items: [{ productCode: "test-product", size: "M", quantity: 1 }], shippingMethodId: "royal-mail-tracked", eligibilityCurrency: "GBP" }),
  }));
  assert.equal(otherFailure.status, 502);
  assert.equal(otherFailure.body.error, "Unable to verify the current order total.");
  assert.equal(otherFailure.body.code, undefined);
});

test("local WhatsApp click tracking fails closed without a local Worker", async () => {
  let calls = 0;
  const route = loadWhatsappClickedRoute({
    env: { NODE_ENV: "development" },
    fetch: async () => { calls += 1; throw new Error("unexpected request"); },
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders/CNF-LOCAL-0001/whatsapp-clicked", { method: "POST" }), {
    params: Promise.resolve({ orderNumber: "CNF-LOCAL-0001" }),
  });
  assert.equal(response.status, 503);
  assert.equal(calls, 0);
});

test("local WhatsApp click tracking uses only the configured loopback Worker", async () => {
  let target = "";
  const route = loadWhatsappClickedRoute({
    env: { NODE_ENV: "development", LOCAL_ORDER_API_BASE: "http://127.0.0.1:8787/" },
    fetch: async (url) => {
      target = url;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  const response = await route.POST(new Request("http://localhost:4000/api/orders/CNF-LOCAL-0001/whatsapp-clicked", { method: "POST" }), {
    params: Promise.resolve({ orderNumber: "CNF-LOCAL-0001" }),
  });
  assert.equal(response.status, 200);
  assert.equal(target, "http://127.0.0.1:8787/orders/CNF-LOCAL-0001/whatsapp-clicked");
});

test("order confirmation reads current client tokens and scoped historical Production cookies", async () => {
  const route = loadConfirmationRoute();
  const orderNumber = "CNF-260924-0001";

  const clientTokenResponse = await route.GET(new Request(`http://localhost:4000/api/orders/${orderNumber}/confirmation`, {
    headers: { "X-Order-Access-Token": "order-token" },
  }), { params: Promise.resolve({ orderNumber }) });
  assert.equal(clientTokenResponse.status, 200);
  assert.equal(clientTokenResponse.body.order.status, "pending");

  const legacyCookieResponse = await route.GET(new Request(`https://www.cnfans.co.uk/api/orders/${orderNumber}/confirmation`, {
    headers: {
      host: "www.cnfans.co.uk",
      origin: "https://www.cnfans.co.uk",
      cookie: `cnfans-order-access-confirmation-${orderNumber}=order-token`,
    },
  }), { params: Promise.resolve({ orderNumber }) });
  assert.equal(legacyCookieResponse.status, 200);

  const untrustedHostCookieResponse = await route.GET(new Request(`https://preview.example/api/orders/${orderNumber}/confirmation`, {
    headers: {
      host: "preview.example",
      cookie: `cnfans-order-access-confirmation-${orderNumber}=order-token`,
    },
  }), { params: Promise.resolve({ orderNumber }) });
  assert.equal(untrustedHostCookieResponse.status, 401);
});

test("order detail proxy remains read-only; payment-submitted mutation is no longer exposed by the frontend", () => {
  assert.match(orderByNumberRouteSource, /export async function GET/);
  assert.doesNotMatch(orderByNumberRouteSource, /export async function POST|payment-submitted/);
  assert.match(confirmationRouteSource, /loadAuthorizedOrder\(/);
  assert.doesNotMatch(confirmationRouteSource, /payment_confirmed_at|\.update\(|method:\s*["']POST/);
});
