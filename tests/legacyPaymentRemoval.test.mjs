import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("obsolete Stripe API routes, SDK helpers, and payment fixtures are removed", () => {
  for (const file of [
    "app/api/payments/stripe/checkout/route.ts",
    "app/api/payments/stripe/config/route.ts",
    "app/api/payments/stripe/session-status/route.ts",
    "app/api/payments/stripe/start/route.ts",
    "app/api/webhooks/stripe/route.ts",
    "app/api/admin/payment-diagnostics/live-session/route.ts",
    "app/api/orders/[orderNumber]/payment-viewed/route.ts",
    "components/StripePaymentStatus.tsx",
    "lib/payments/stripeBankTransfer.ts",
    "lib/payments/stripeLiveDiagnostics.ts",
    "lib/payments/stripeServer.ts",
    "lib/stripeCheckoutHandoff.ts",
    "lib/stripePaymentStatus.ts",
    "app/checkout/stripe-mock/page.tsx",
  ]) assert.equal(exists(file), false, `${file} should be removed`);

  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));
  assert.equal(packageJson.dependencies?.stripe, undefined);
  assert.equal(packageLock.packages?.["node_modules/stripe"], undefined);
});

test("current Checkout still creates a normal order and offers WhatsApp confirmation only", () => {
  const checkout = read("components/CheckoutFlow.tsx");
  const orderRoute = read("app/api/orders/route.ts");
  const orderApiProxy = read("lib/orderApiProxy.ts");
  assert.match(checkout, /fetch\("\/api\/orders"/);
  assert.match(checkout, /Continue on WhatsApp/);
  assert.match(checkout, /Hi CNFans UK, please confirm my order #\$\{order\.orderNumber\}/);
  assert.match(orderApiProxy, /LOCAL_ORDER_API_BASE/);
  assert.match(orderRoute, /orderAccessToken/);
  assert.doesNotMatch(checkout + orderRoute, /stripe\.checkout\.sessions\.create|payment-submitted|STRIPE_BANK_TRANSFER_MODE/);
});

test("public payment copy is truthful while indexed help URLs and order history remain available", () => {
  const publicCopy = [
    read("app/payment-security/page.tsx"),
    read("app/privacy-policy/page.tsx"),
    read("app/terms/page.tsx"),
    read("app/how-to-order/page.tsx"),
    read("app/bank-transfer-payment-help/page.tsx"),
  ].join("\n");
  assert.doesNotMatch(publicCopy, /Stripe Hosted Checkout|Stripe processes payments|Stripe Privacy Policy|Stripe&rsquo;s secure hosted page|bank transfer instructions/i);
  assert.match(publicCopy, /Online payment through the website is temporarily unavailable/);
  assert.match(read("app/sitemap.ts"), /"\/bank-transfer-payment-help"/);
  assert.match(read("components/AdminOrderPanel.tsx"), /payment_confirmed_at/);
  assert.match(read("lib/orderStatus.ts"), /payment_submitted|payment_confirmed/);
  assert.match(read("workers/catalog-api/src/index.ts"), /payment_confirmed_at/);
});

test("legacy Production order access remains available through the scoped confirmation cookie", () => {
  assert.match(read("app/order-success/page.tsx"), /payment === "stripe_live"/);
  assert.match(read("app/order-success/page.tsx"), /useLegacyConfirmationCookie/);
  assert.match(read("app/payments/stripe/processing/page.tsx"), /redirect\(`\/order-success\?order=.*payment=stripe_live`\)/);
  assert.match(read("app/api/orders/[orderNumber]/confirmation/route.ts"), /isCanonicalProductionRequest/);
});
