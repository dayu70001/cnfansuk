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
    Set,
    Number,
    Object,
    console,
    require(id) {
      if (id === "next/server") return { NextResponse: response };
      if (Object.hasOwn(modules, id)) return modules[id];
      throw new Error("Unexpected module import: " + id);
    },
  });
  return loadedModule.exports;
}

test("start route authorizes the persisted Live order and redirects directly to authenticated Stripe URL", async () => {
  const calls = { cookiePurpose: "", order: "", token: "", mode: "", stripe: 0 };
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
  const calls = { purpose: "", token: "", order: "" };
  const loadedModule = { exports: {} };
  const notFound = () => { throw new Error("NOT_FOUND"); };
  const metaPixelLink = function MetaPixelEventLink() {};
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
        headers: async () => new Headers({ host: "localhost:4000", cookie: "order=fixture" }),
      };
      if (id === "next/navigation") return { notFound };
      if (id === "@/components/MetaPixelEventLink") return { MetaPixelEventLink: metaPixelLink };
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
        getStripeBankTransferMode: () => "test",
        isLocalStripeBankTransferTestEnabled: () => true,
        isStripeLiveBankTransferEnabled: () => false,
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
  assert.match(text.join(" "), /Confirm order on WhatsApp/);
  const whatsappLink = elements.find((element) => element.type === metaPixelLink);
  assert.ok(whatsappLink);
  assert.equal(whatsappLink.props.target, "_blank");
  assert.equal(whatsappLink.props.rel, "noopener noreferrer");
  assert.equal(whatsappLink.props.recordWhatsappClickForOrder, "CNF-260924-1234");
  assert.equal(new URL(whatsappLink.props.href).searchParams.get("text"), "Hi, I'd like to confirm my order #CNF-260924-1234.");

  await assert.rejects(
    page({ searchParams: Promise.resolve({ order: ["CNF-260924-1234", "CNF-260924-9999"] }) }),
    /NOT_FOUND/,
  );
});
