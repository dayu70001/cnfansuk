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

test("new order creation and Stripe Session endpoints fail closed without backend or Stripe calls", async () => {
  let networkCalls = 0;
  const fetch = async () => { networkCalls += 1; throw new Error("must not call a backend"); };
  const order = loadHandler(orderRouteSource, { fetch });
  const checkout = loadHandler(checkoutRouteSource, { fetch });
  const start = loadHandler(startRouteSource, { fetch });

  for (const response of [
    await order.POST(new Request("https://www.cnfans.co.uk/api/orders", { method: "POST", body: "{}" })),
    await checkout.POST(new Request("https://www.cnfans.co.uk/api/payments/stripe/checkout", { method: "POST", body: "{}" })),
    await start.GET(new Request("https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234")),
  ]) {
    assert.equal(response.status, 503);
    assert.match(response.body.error, /temporarily paused/);
  }
  assert.equal(networkCalls, 0);
  for (const route of [orderRouteSource, checkoutRouteSource, startRouteSource]) {
    assert.doesNotMatch(route, /createStripeBankTransferCheckout|createLocalStripeTestCheckout|stripe\.checkout\.sessions\.create|payment-submitted|fetch\(/);
  }
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
