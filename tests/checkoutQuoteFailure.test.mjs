import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flow = fs.readFileSync(path.join(root, "components/CheckoutFlow.tsx"), "utf8");
const orderRoute = fs.readFileSync(path.join(root, "app/api/orders/route.ts"), "utf8");
const quoteRoute = fs.readFileSync(path.join(root, "app/api/orders/quote/route.ts"), "utf8");

test("delivery and total amounts remain numeric estimates until the quote is confirmed", () => {
  const delivery = flow.slice(flow.indexOf("function DeliveryStep("), flow.indexOf("function PaymentStep("));
  const summary = flow.slice(flow.indexOf("function OrderSummary("), flow.indexOf("function formatDeliveryPrice("));
  const continueToDelivery = flow.slice(flow.indexOf("function continueToDelivery()"), flow.indexOf("async function confirmOrder()"));
  const quoteEffect = flow.slice(flow.indexOf("useEffect(() => {\n    if (!hydrated || !cartRestored || !currencyReady || step !== \"delivery\""), flow.indexOf("useEffect(() => {\n    if (!hydrated || !checkoutSessionId"));

  assert.match(delivery, /formatDeliveryPrice\(method\.id === selectedMethodId && quoteReady\s*\?\s*shippingPrice\s*:\s*getShippingPrice\(method\.id, eligibilitySubtotal, eligibilityCurrency\)\)/);
  assert.doesNotMatch(delivery, /\?\s*"—"|Checking…|checkout-quote-updating/);
  assert.match(delivery, /getShippingPrice\(method\.id, eligibilitySubtotal, eligibilityCurrency\)/);
  assert.match(delivery, /Amounts are estimates while we verify\./);
  assert.match(delivery, /Amounts are estimates until confirmed\./);
  assert.match(delivery, /Unable to verify; amounts remain estimates\./);
  assert.match(summary, /<strong>\{formatDeliveryPrice\(shippingPrice\)\}<\/strong>/);
  assert.match(summary, /<strong aria-live="polite">\s*\{formatMoney\(total, "GBP"\)\}\s*<\/strong>/);
  assert.doesNotMatch(summary, /Unable to confirm total|quoteFailed[^;]*\?|"—"|Checking…|checkout-quote-updating/);
  assert.match(flow, /<strong aria-live="polite">\s*\{formatMoney\(total, "GBP"\)\}\s*<\/strong>/);
  assert.match(flow, /const \[lastConfirmedPricingQuote, setLastConfirmedPricingQuote\] = useState/);
  assert.match(flow, /const lastQuoteForCurrentCart = lastConfirmedPricingQuote\?\.scopeKey === quoteScopeKey/);
  assert.match(flow, /const activeQuote = quoteStateMatches && quoteState\.status === "ready" \? quoteState\.quote : undefined/);
  assert.match(continueToDelivery, /setQuoteState\(\{ key: quoteKey, retry: quoteRetry, status: "loading" \}\);\s*setStep\("delivery"\)/);
  assert.doesNotMatch(quoteEffect, /let active = true;\s*setQuoteState\(\{ key: quoteKey, retry: quoteRetry, status: "loading" \}\)/);
  assert.match(flow, /setShippingMethodId\(methodId\);\s*setQuoteState\(null\);/);
  assert.match(flow, /quoteFailed=\{quoteRequestFailed\}/);
});

test("rapid delivery changes abort stale requests and cannot submit a stale quote", () => {
  const delivery = flow.slice(flow.indexOf("function DeliveryStep("), flow.indexOf("function PaymentStep("));
  const submitOrder = flow.slice(flow.indexOf("async function confirmOrder()"), flow.indexOf("function goToCompleted("));

  assert.match(flow, /const quoteKey = useMemo\(\(\) => JSON\.stringify\(\{\s*shippingMethodId,/);
  assert.match(flow, /const activeQuote = quoteStateMatches && quoteState\.status === "ready" \? quoteState\.quote : undefined/);
  assert.match(flow, /if \(!active \|\| controller\.signal\.aborted\) return/);
  assert.match(flow, /controller\.abort\(\)/);
  assert.match(delivery, /disabled=\{submitting \|\| !quoteReady\}/);
  assert.match(submitOrder, /if \(!quoteReady \|\| !activeQuote\) return/);
  assert.match(submitOrder, /expectedQuote: activeQuote/);
});

test("quote errors stay distinct and retry remains available", () => {
  const delivery = flow.slice(flow.indexOf("function DeliveryStep("), flow.indexOf("function PaymentStep("));

  assert.match(flow, /code === "ITEM_UNAVAILABLE"/);
  assert.match(flow, /code === "SIZE_UNAVAILABLE"/);
  assert.match(quoteRoute, /process\.env\.NODE_ENV === "development" && isLoopbackBaseUrl\(target\.baseUrl\)/);
  assert.match(quoteRoute, /code: "LOCAL_QA_ITEM_UNAVAILABLE"/);
  assert.match(quoteRoute, /code: "ITEM_UNAVAILABLE"/);
  assert.match(flow, /code === "LOCAL_QA_ITEM_UNAVAILABLE"/);
  assert.match(flow, /We couldn't verify the current order total\. Please try again\./);
  assert.match(delivery, /canRetryQuote \? <button[^>]*onClick=\{onRetryQuote\}>Try again/);
  assert.match(flow, /Your order total has changed\. Please review the updated amount before confirming\./);
  assert.match(orderRoute, /if \(value\.code === "QUOTE_REQUIRED"\)/);
  assert.match(orderRoute, /checkout page is out of date\. Please refresh checkout/);
  assert.match(orderRoute, /if \(value\.code === "QUOTE_CHANGED"/);
});
