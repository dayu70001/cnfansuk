import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(currentDirectory, "..", "lib", "stripeCheckoutHandoff.ts"), "utf8");
const checkoutSource = fs.readFileSync(path.join(currentDirectory, "..", "app", "checkout", "page.tsx"), "utf8");
const fallbackComponentSource = fs.readFileSync(
  path.join(currentDirectory, "..", "components", "StripeBankTransferFallback.tsx"),
  "utf8",
);
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  URL,
});
const {
  buildLocalStripeSuccessUrl,
  getLocalStripeTestSessionId,
  parseLocalStripeFallback,
  serializeLocalStripeFallback,
} = loadedModule.exports;

test("only accepts a Stripe Test Checkout URL with a test session ID", () => {
  assert.equal(getLocalStripeTestSessionId("https://checkout.stripe.com/c/pay/cs_test_example123#fragment"), "cs_test_example123");
  assert.equal(getLocalStripeTestSessionId("https://checkout.stripe.com/c/pay/cs_live_example123"), null);
  assert.equal(getLocalStripeTestSessionId("https://evil.example/c/pay/cs_test_example123"), null);
  assert.equal(getLocalStripeTestSessionId("https://checkout.stripe.com/redirect?url=https://evil.example"), null);
});

test("builds the local pending return URL from the trusted Stripe test session", () => {
  const result = buildLocalStripeSuccessUrl(
    "https://checkout.stripe.com/c/pay/cs_test_example123#fragment",
    "http://localhost:4000",
    "CNF-260924-1234",
  );
  assert.equal(
    result,
    "http://localhost:4000/order-success?order=CNF-260924-1234&payment=stripe_test&session_id=cs_test_example123",
  );
  assert.equal(buildLocalStripeSuccessUrl("https://checkout.stripe.com/c/pay/cs_test_example123", "https://www.cnfans.co.uk", "CNF-260924-1234"), null);
  assert.equal(buildLocalStripeSuccessUrl("https://checkout.stripe.com/c/pay/cs_test_example123", "http://localhost:4000", "LOCAL-CNF-TEST"), null);
});

test("fallback reuses only the matching existing Checkout URL", () => {
  const value = JSON.stringify({
    sessionId: "cs_test_example123",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_example123",
  });
  assert.equal(parseLocalStripeFallback(value, "cs_test_example123"), "https://checkout.stripe.com/c/pay/cs_test_example123");
  assert.equal(parseLocalStripeFallback(value, "cs_test_other456"), null);
  assert.equal(parseLocalStripeFallback(JSON.stringify({
    sessionId: "cs_test_example123",
    checkoutUrl: "https://evil.example/c/pay/cs_test_example123",
  }), "cs_test_example123"), null);
  assert.equal(parseLocalStripeFallback("not-json", "cs_test_example123"), null);
  assert.equal(serializeLocalStripeFallback("https://checkout.stripe.com/c/pay/cs_test_example123"), value);
  assert.equal(serializeLocalStripeFallback("https://evil.example/c/pay/cs_test_example123"), null);
});

test("Stripe tab is opened synchronously before creating its Checkout Session", () => {
  const start = checkoutSource.indexOf("async function continueToLocalBankPayment()");
  const end = checkoutSource.indexOf("const isLocalStripeOrder", start);
  const handler = checkoutSource.slice(start, end);
  const openTab = handler.indexOf('window.open("about:blank", "_blank")');
  const createSession = handler.indexOf('await fetch("/api/payments/stripe/checkout"');
  assert.ok(openTab >= 0 && createSession > openTab);
  assert.match(handler, /window\.location\.assign\(localSuccessUrl\)/);
  assert.doesNotMatch(handler, /window\.location\.assign\(result\.checkoutUrl\)/);
  assert.match(handler, /serializeLocalStripeFallback\(result\.checkoutUrl\)/);
  assert.equal((handler.match(/await fetch\("\/api\/payments\/stripe\/checkout"/g) || []).length, 1);
});

test("blocked-popup fallback links to the stored same-session URL", () => {
  assert.match(fallbackComponentSource, /target="_blank" rel="noopener noreferrer"/);
  assert.match(fallbackComponentSource, /parseLocalStripeFallback\(serialized, sessionId\)/);
  assert.match(fallbackComponentSource, /href=\{checkoutUrl\}/);
});
