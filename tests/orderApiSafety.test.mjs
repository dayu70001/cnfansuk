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
const confirmationRouteSource = read("app/api/orders/[orderNumber]/confirmation/route.ts");
const orderByNumberRouteSource = read("app/api/orders/[orderNumber]/route.ts");
const whatsappClickedRouteSource = read("app/api/orders/[orderNumber]/whatsapp-clicked/route.ts");

function loadOrderRoute({ env, fetch, catalogBase = "https://production-worker.invalid", token = "order-token" }) {
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
  const response = await route.POST(new Request("http://localhost:4000/api/orders", { method: "POST", body: "{}" }));
  assert.equal(response.status, 503);
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
  const response = await route.POST(new Request("http://localhost:4000/api/orders", { method: "POST", body: "{}" }));
  assert.equal(response.status, 200);
  assert.equal(target, "http://127.0.0.1:8787/orders");
  assert.equal(response.body.order.status, "pending");
  assert.equal(response.body.order.orderAccessToken, "order-token");
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
