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
const source = fs.readFileSync(path.join(root, "app", "api", "payments", "stripe", "start", "route.ts"), "utf8");
const processingPageSource = fs.readFileSync(path.join(root, "app", "payments", "stripe", "processing", "page.tsx"), "utf8");
const whatsappClickSource = fs.readFileSync(path.join(root, "components", "MetaPixelEventLink.tsx"), "utf8");
const whatsappClickRouteSource = fs.readFileSync(path.join(root, "app", "api", "orders", "[orderNumber]", "whatsapp-clicked", "route.ts"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "workers", "catalog-api", "src", "index.ts"), "utf8");

function loadHandler(modules) {
  const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  const loadedModule = { exports: {} };
  const response = {
    json(body, init = {}) {
      return { body, status: init.status || 200, headers: new Headers(init.headers || {}) };
    },
    redirect(location, init = {}) {
      return { location: String(location), status: init.status || 307, headers: new Headers() };
    },
  };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env: { NODE_ENV: "production" } },
    URL,
    Headers,
    AbortSignal,
    fetch: modules.__fetch || (async () => new Response(null, { status: 204 })),
    console: modules.__console || console,
    Set,
    Number,
    Object,
    require(id) {
      if (id === "next/server") return { NextResponse: response };
      if (id === "@/lib/catalogApiBase") return { getCatalogApiBase: () => "https://catalog.example.invalid" };
      if (Object.hasOwn(modules, id)) return modules[id];
      throw new Error("Unexpected module import: " + id);
    },
  });
  return loadedModule.exports;
}

test("start route authorizes the Live order, records submission after Session validation, then redirects", async () => {
  const calls = { cookiePurpose: "", order: "", token: "", mode: "", stripe: 0, events: [], workerUrl: "", workerInit: null };
  const handler = loadHandler({
    "@/lib/authorizedOrder": {
      loadAuthorizedOrder: async (number, token) => {
        calls.order = number;
        calls.token = token;
        return {
          ok: true,
          order: { order_number: number, final_total: 117, currency: "GBP", email: "buyer@example.invalid" },
        };
      },
    },
    "@/lib/orderAccessTokenCookie": {
      getOrderAccessTokenFromCookieHeader: (_header, _number, purpose) => {
        calls.cookiePurpose = purpose;
        return "signed-order-token";
      },
    },
    "@/lib/payments/stripeBankTransfer": {
      getStripeBankTransferMode: () => "live",
      isLocalStripeBankTransferTestEnabled: () => false,
      isStripeLiveProductionRequest: (request) => new URL(request.url).hostname === "www.cnfans.co.uk",
    },
    "@/lib/payments/stripeServer": {
      createStripeBankTransferCheckout: async (order, mode) => {
        calls.stripe += 1;
        calls.events.push("stripe-session-created");
        calls.mode = mode;
        assert.equal(order.order_number, "CNF-260924-1234");
        assert.equal(order.final_total, 117);
        assert.equal(order.currency, "GBP");
        return { checkoutUrl: "https://pay.example.test/checkout/session-fixture" };
      },
    },
    "@/lib/stripeCheckoutHandoff": {
      isStripeCheckoutUrl: (value) => {
        try {
          const parsed = new URL(value);
          return parsed.protocol === "https:" && !parsed.username && !parsed.password;
        } catch {
          return false;
        }
      },
    },
    __fetch: async (input, init) => {
      calls.events.push("payment-submitted");
      calls.workerUrl = String(input);
      calls.workerInit = init;
      return new Response(null, { status: 204 });
    },
  });

  const response = await handler.GET(new Request(
    "https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234",
    { headers: { host: "www.cnfans.co.uk", cookie: "order=fixture" } },
  ));
  assert.equal(response.status, 303);
  assert.equal(response.location, "https://pay.example.test/checkout/session-fixture");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(calls.order, "CNF-260924-1234");
  assert.equal(calls.token, "signed-order-token");
  assert.equal(calls.cookiePurpose, "stripe");
  assert.equal(calls.mode, "live");
  assert.equal(calls.stripe, 1);
  assert.equal(calls.workerUrl, "https://catalog.example.invalid/orders/CNF-260924-1234/payment-submitted");
  assert.equal(calls.workerInit.method, "POST");
  assert.equal(calls.workerInit.cache, "no-store");
  assert.ok(calls.workerInit.signal instanceof AbortSignal);
  assert.deepEqual(calls.events, ["stripe-session-created", "payment-submitted"]);
});

test("payment-submitted tracking failure does not block a valid Stripe redirect", async () => {
  for (const failure of [
    { name: "Worker HTTP failure", fetch: async () => new Response(null, { status: 503 }), loggedStatus: 503 },
    { name: "Worker network failure", fetch: async () => { throw new Error("network unavailable"); }, loggedStatus: null },
  ]) {
    const logs = [];
    const handler = loadHandler({
      "@/lib/authorizedOrder": {
        loadAuthorizedOrder: async (orderNumber) => ({ ok: true, order: { order_number: orderNumber, final_total: 117, currency: "GBP" } }),
      },
      "@/lib/orderAccessTokenCookie": { getOrderAccessTokenFromCookieHeader: () => "signed-order-token" },
      "@/lib/payments/stripeBankTransfer": {
        getStripeBankTransferMode: () => "live",
        isLocalStripeBankTransferTestEnabled: () => false,
        isStripeLiveProductionRequest: () => true,
      },
      "@/lib/payments/stripeServer": {
        createStripeBankTransferCheckout: async () => ({ checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_fixture" }),
      },
      "@/lib/stripeCheckoutHandoff": { isStripeCheckoutUrl: () => true },
      __fetch: failure.fetch,
      __console: { error: (...args) => logs.push(args) },
    });

    const response = await handler.GET(new Request(
      "https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234",
      { headers: { host: "www.cnfans.co.uk", cookie: "order=fixture" } },
    ));
    assert.equal(response.status, 303, failure.name);
    assert.equal(response.location, "https://checkout.stripe.com/c/pay/cs_live_fixture", failure.name);
    assert.equal(logs.length, 1, failure.name);
    assert.equal(logs[0][0], "Stripe payment-submitted event could not be recorded", failure.name);
    assert.deepEqual(JSON.parse(JSON.stringify(logs[0][1])), { status: failure.loggedStatus }, failure.name);
    assert.equal(JSON.stringify(logs).includes("CNF-260924-1234"), false, failure.name);
  }
});

test("Stripe Session creation failure never records payment submitted", async () => {
  let workerCalls = 0;
  const handler = loadHandler({
    "@/lib/authorizedOrder": {
      loadAuthorizedOrder: async (orderNumber) => ({ ok: true, order: { order_number: orderNumber, final_total: 117, currency: "GBP" } }),
    },
    "@/lib/orderAccessTokenCookie": { getOrderAccessTokenFromCookieHeader: () => "signed-order-token" },
    "@/lib/payments/stripeBankTransfer": {
      getStripeBankTransferMode: () => "live",
      isLocalStripeBankTransferTestEnabled: () => false,
      isStripeLiveProductionRequest: () => true,
    },
    "@/lib/payments/stripeServer": {
      createStripeBankTransferCheckout: async () => { throw new Error("Stripe session creation failed"); },
    },
    "@/lib/stripeCheckoutHandoff": { isStripeCheckoutUrl: () => true },
    __fetch: async () => { workerCalls += 1; return new Response(null, { status: 204 }); },
  });

  const response = await handler.GET(new Request(
    "https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234",
    { headers: { host: "www.cnfans.co.uk", cookie: "order=fixture" } },
  ));
  assert.equal(response.status, 502);
  assert.equal(workerCalls, 0);
});

test("start route refuses client-supplied values and missing order cookie before Stripe", async () => {
  const calls = { load: 0, stripe: 0, cookie: 0 };
  const handler = loadHandler({
    "@/lib/authorizedOrder": {
      loadAuthorizedOrder: async () => {
        calls.load += 1;
        return { ok: true, order: { order_number: "CNF-260924-1234", final_total: 117, currency: "GBP" } };
      },
    },
    "@/lib/orderAccessTokenCookie": {
      getOrderAccessTokenFromCookieHeader: () => {
        calls.cookie += 1;
        return "";
      },
    },
    "@/lib/payments/stripeBankTransfer": {
      getStripeBankTransferMode: () => "live",
      isLocalStripeBankTransferTestEnabled: () => false,
      isStripeLiveProductionRequest: () => true,
    },
    "@/lib/payments/stripeServer": {
      createStripeBankTransferCheckout: async () => {
        calls.stripe += 1;
        throw new Error("must not reach Stripe");
      },
    },
    "@/lib/stripeCheckoutHandoff": { isStripeCheckoutUrl: () => false },
  });

  const extraParameter = await handler.GET(new Request(
    "https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234&amount=1",
    { headers: { host: "www.cnfans.co.uk" } },
  ));
  assert.equal(extraParameter.status, 400);
  assert.equal(calls.cookie, 0);

  const missingCookie = await handler.GET(new Request(
    "https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234",
    { headers: { host: "www.cnfans.co.uk" } },
  ));
  assert.equal(missingCookie.status, 401);
  assert.equal(calls.load, 0);
  assert.equal(calls.stripe, 0);
});

test("local Test start route remains loopback-only and uses the local return origin", async () => {
  let receivedOrigin = "";
  let receivedMode = "";
  const handler = loadHandler({
    "@/lib/authorizedOrder": {
      loadAuthorizedOrder: async (number) => ({
        ok: true,
        order: { order_number: number, final_total: 117, currency: "GBP", email: "buyer@example.invalid" },
      }),
    },
    "@/lib/orderAccessTokenCookie": {
      getOrderAccessTokenFromCookieHeader: () => "signed-order-token",
    },
    "@/lib/payments/stripeBankTransfer": {
      getStripeBankTransferMode: () => "test",
      isLocalStripeBankTransferTestEnabled: () => true,
      isStripeLiveProductionRequest: () => false,
    },
    "@/lib/payments/stripeServer": {
      createStripeBankTransferCheckout: async (_order, mode, origin) => {
        receivedMode = mode;
        receivedOrigin = origin;
        return { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_fixture" };
      },
    },
    "@/lib/stripeCheckoutHandoff": {
      isStripeCheckoutUrl: (value) => value.startsWith("https://checkout.stripe.com/"),
    },
  });
  const response = await handler.GET(new Request(
    "http://localhost:4000/api/payments/stripe/start?order=CNF-260924-1234",
    { headers: { host: "localhost:4000" } },
  ));
  assert.equal(response.status, 303);
  assert.equal(receivedMode, "test");
  assert.equal(receivedOrigin, "http://localhost:4000");
});

test("start endpoint is GET-only, no-store, server-authorized, and has no client amount input", () => {
  assert.match(source, /export async function GET\(request: Request\)/);
  assert.doesNotMatch(source, /export async function (POST|PUT|PATCH|DELETE)/);
  assert.match(source, /getOrderAccessTokenFromCookieHeader\([^\n]*"stripe"\)/);
  assert.match(source, /loadAuthorizedOrder\(orderNumber, accessToken\)/);
  assert.match(source, /createStripeBankTransferCheckout\(/);
  assert.match(source, /NextResponse\.redirect\(checkout\.checkoutUrl, \{ status: 303 \}\)/);
  assert.match(source, /no-store, max-age=0/);
  assert.match(source, /Referrer-Policy/);
  assert.doesNotMatch(source, /amountMinor|finalTotal|items|line_items/);
});

test("processing page requires its scoped cookie, reloads the order, and renders pending plus WhatsApp", async () => {
  const calls = { purpose: "", token: "", order: "", mode: "test" };
  const loadedModule = { exports: {} };
  const notFound = () => { throw new Error("NOT_FOUND"); };
  const metaPixelLink = function MetaPixelEventLink() {};
  const nextLink = function Link() {};
  const orderConfirmationDetails = function OrderConfirmationDetails() {};
  const compiled = ts.transpile(processingPageSource, {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  });
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    URL,
    Headers,
    Set,
    process: { env: { NODE_ENV: "development" } },
    require(id) {
      if (id === "react/jsx-runtime") return nodeRequire("react/jsx-runtime");
      if (id === "next/headers") return {
        headers: async () => new Headers({
          host: calls.mode === "live" ? "www.cnfans.co.uk" : "localhost:4000",
          "x-forwarded-proto": calls.mode === "live" ? "https" : "http",
          cookie: "order=fixture",
        }),
      };
      if (id === "next/navigation") return { notFound };
      if (id === "next/link") return { __esModule: true, default: nextLink };
      if (id === "@/components/MetaPixelEventLink") return { MetaPixelEventLink: metaPixelLink };
      if (id === "@/components/OrderConfirmationDetails") return { OrderConfirmationDetails: orderConfirmationDetails };
      if (id === "@/lib/orderAccessTokenCookie") return {
        getOrderAccessTokenFromCookieHeader: (_cookie, number, purpose) => {
          calls.order = number;
          calls.purpose = purpose;
          return "signed-processing-token";
        },
      };
      if (id === "@/lib/contactLinks") return { getDirectWhatsappLinkFromSettings: () => "https://wa.me/447700900000" };
      if (id === "@/lib/authorizedOrder") return {
        loadAuthorizedOrder: async (number, token) => {
          calls.order = number;
          calls.token = token;
          return { ok: true, order: { order_number: number } };
        },
      };
      if (id === "@/lib/payments/stripeBankTransfer") return {
        getStripeBankTransferMode: () => calls.mode,
        isLocalStripeBankTransferTestEnabled: () => true,
        isStripeLiveBankTransferEnabled: () => true,
      };
      if (id === "@/lib/siteSettings") return { fetchSiteSettings: async () => ({ links: {} }) };
      throw new Error("Unexpected module import: " + id);
    },
  });

  const page = loadedModule.exports.default;
  const result = await page({ searchParams: Promise.resolve({ order: "CNF-260924-1234" }) });
  assert.equal(calls.purpose, "processing");
  assert.equal(calls.token, "signed-processing-token");
  assert.equal(calls.order, "CNF-260924-1234");

  const text = [];
  const elements = [];
  function visit(node) {
    if (typeof node === "string" || typeof node === "number") {
      text.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    elements.push(node);
    visit(node.props?.children);
  }
  visit(result);
  assert.match(text.join(" "), /Payment processing/);
  assert.match(text.join(" "), /Order #\s*CNF-260924-1234/);
  assert.match(text.join(" "), /Waiting for payment confirmation/);
  assert.match(text.join(" "), /We.ll verify your order with you on WhatsApp before processing/);
  assert.match(text.join(" "), /Confirm order on WhatsApp/);
  assert.match(text.join(" "), /Track order/);
  assert.match(text.join(" "), /Continue shopping/);
  assert.doesNotMatch(text.join(" "), /Order placed|Payment successful|Payment completed|Order completed|\bPaid\b/);
  assert.equal(elements.some((element) => element.props?.className === "success-check"), false);
  const whatsappLink = elements.find((element) => element.type === metaPixelLink);
  assert.ok(whatsappLink);
  assert.equal(whatsappLink.props.target, "_blank");
  assert.equal(whatsappLink.props.rel, "noopener noreferrer");
  assert.equal(whatsappLink.props.recordWhatsappClickForOrder, "CNF-260924-1234");
  assert.equal(new URL(whatsappLink.props.href).searchParams.get("text"), "Hi, I'd like to confirm my order #CNF-260924-1234.");
  assert.ok(elements.some((element) => element.props?.className === "success-whatsapp-icon"));
  const links = elements.filter((element) => element.type === nextLink);
  assert.ok(links.some((element) => element.props.href === "/track-order"));
  assert.ok(links.some((element) => element.props.href === "/"));
  const details = elements.find((element) => element.type === orderConfirmationDetails);
  assert.equal(details.props.orderNumber, "CNF-260924-1234");
  assert.equal(details.props.useLiveAccessCookie, false);

  calls.mode = "live";
  const liveResult = await page({ searchParams: Promise.resolve({ order: "CNF-260924-1234" }) });
  const liveDetails = [];
  function visitLive(node) {
    if (Array.isArray(node)) return node.forEach(visitLive);
    if (!node || typeof node !== "object") return;
    liveDetails.push(node);
    visitLive(node.props?.children);
  }
  visitLive(liveResult);
  const liveOrderDetails = liveDetails.find((element) => element.type === orderConfirmationDetails);
  assert.equal(liveOrderDetails.props.useLiveAccessCookie, true);

  await assert.rejects(
    page({ searchParams: Promise.resolve({ order: ["CNF-260924-1234", "CNF-260924-9999"] }) }),
    /NOT_FOUND/,
  );
});

test("Processing WhatsApp click keeps the existing event path through the Worker timestamp write", () => {
  assert.match(processingPageSource, /recordWhatsappClickForOrder=\{order\}/);
  assert.match(whatsappClickSource, /fetch\(`\/api\/orders\/\$\{encodeURIComponent\(recordWhatsappClickForOrder\)\}\/whatsapp-clicked`/);
  assert.match(whatsappClickRouteSource, /fetch\(`\$\{baseUrl\}\/orders\/\$\{encodeURIComponent\(orderNumber\)\}\/whatsapp-clicked`/);
  assert.match(workerSource, /UPDATE orders SET whatsapp_clicked_at = COALESCE\(whatsapp_clicked_at, CURRENT_TIMESTAMP\)/);
  assert.doesNotMatch(workerSource, /UPDATE orders SET[^\n]*payment_confirmed_at[^\n]*whatsapp_clicked_at/);
});
