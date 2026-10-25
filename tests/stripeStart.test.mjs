import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app/api/payments/stripe/start/route.ts"), "utf8");
const processingPageSource = fs.readFileSync(path.join(root, "app/payments/stripe/processing/page.tsx"), "utf8");
const whatsappClickSource = fs.readFileSync(path.join(root, "components/MetaPixelEventLink.tsx"), "utf8");
const whatsappClickRouteSource = fs.readFileSync(path.join(root, "app/api/orders/[orderNumber]/whatsapp-clicked/route.ts"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "workers/catalog-api/src/index.ts"), "utf8");

function loadHandler() {
  const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
  const loadedModule = { exports: {} };
  let networkCalls = 0;
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    fetch: async () => { networkCalls += 1; throw new Error("Unexpected network call"); },
    require(id) {
      if (id === "next/server") return {
        NextResponse: {
          json(body, init = {}) { return { body, status: init.status || 200, headers: new Headers(init.headers || {}) }; },
        },
      };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return { ...loadedModule.exports, getNetworkCalls: () => networkCalls };
}

test("Stripe start route is hard-disabled and never calls Stripe or payment-submitted", async () => {
  const handler = loadHandler();
  const response = await handler.GET(new Request("https://www.cnfans.co.uk/api/payments/stripe/start?order=CNF-260924-1234"));
  assert.equal(response.status, 503);
  assert.match(response.body.error, /Online payments are temporarily paused/);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(handler.getNetworkCalls(), 0);
  assert.doesNotMatch(source, /createStripeBankTransferCheckout|payment-submitted|stripe\.checkout\.sessions\.create|fetch\(/);
});

test("historical Processing page still renders pending status, order confirmation and WhatsApp support", () => {
  assert.match(processingPageSource, /<h1>Payment processing<\/h1>/);
  assert.match(processingPageSource, /Waiting for payment confirmation\./);
  assert.match(processingPageSource, /Order #\{order\}/);
  assert.match(processingPageSource, /Confirm order on WhatsApp/);
  assert.match(processingPageSource, /OrderConfirmationDetails/);
  assert.match(processingPageSource, /loadAuthorizedOrder\(order, accessToken\)/);
  assert.doesNotMatch(processingPageSource, /Payment successful|Payment completed|Order completed|StripePaymentStatus/);
});

test("existing historical WhatsApp click event path is retained", () => {
  assert.match(processingPageSource, /recordWhatsappClickForOrder=\{order\}/);
  assert.match(whatsappClickSource, /fetch\(`\/api\/orders\/\$\{encodeURIComponent\(recordWhatsappClickForOrder\)\}\/whatsapp-clicked`/);
  assert.match(whatsappClickRouteSource, /fetch\(`\$\{baseUrl\}\/orders\/\$\{encodeURIComponent\(orderNumber\)\}\/whatsapp-clicked`/);
  assert.match(workerSource, /UPDATE orders SET whatsapp_clicked_at = COALESCE\(whatsapp_clicked_at, CURRENT_TIMESTAMP\)/);
  assert.doesNotMatch(workerSource, /UPDATE orders SET[^\n]*payment_confirmed_at[^\n]*whatsapp_clicked_at/);
});
