import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checkout = read("components/CheckoutFlow.tsx");
const cart = read("components/CartDrawer.tsx");
const product = read("components/ProductDetailClient.tsx");

test("refresh restores a completed order, while explicit checkout entry starts a new session", () => {
  assert.match(checkout, /const startNewCheckout = searchParams\.get\("startNew"\) === "1"/);
  assert.match(checkout, /const hasCompletedOrder = hasCompletedOrderSnapshot\(saved\.order\)/);
  assert.match(checkout, /const startFreshSession = startNewCheckout && \(hasCompletedOrder \|\| cartChangedSinceSaved\)/);
  assert.match(checkout, /if \(!startNewCheckout\)\s*\{\s*startIntentHandled\.current = false;\s*if \(checkoutInitialized\.current\) return;/);
  assert.match(checkout, /restoreCheckoutSession\(saved\)/);
  assert.match(checkout, /setOrder\(\{ \.\.\.saved\.order, orderAccessToken \}\)/);
  assert.match(checkout, /setStep\("payment"\)/);
  assert.match(checkout, /router\.replace\("\/checkout", \{ scroll: false \}\)/);
  assert.match(cart, /href="\/checkout\?startNew=1"[\s\S]*?scroll=\{false\}/);
  assert.match(product, /router\.push\("\/checkout\?startNew=1", \{ scroll: false \}\)/);
});

test("a fresh checkout clears only the saved checkout snapshot and retains the cart", () => {
  const freshStart = checkout.slice(checkout.indexOf("if (startFreshSession)"), checkout.indexOf("} else if (!checkoutInitialized.current)", checkout.indexOf("if (startFreshSession)")));
  assert.match(freshStart, /createCheckoutSessionId\(saved\.sessionId\)/);
  assert.match(freshStart, /step: "details"/);
  assert.match(freshStart, /maxStep: 0/);
  assert.match(freshStart, /order: null/);
  assert.match(freshStart, /window\.sessionStorage\.setItem\(CHECKOUT_STORAGE_KEY, JSON\.stringify\(freshSession\)\)/);
  assert.doesNotMatch(freshStart, /localStorage|clearCart|removeItem\(/);
  assert.match(checkout, /cartFingerprint,\s*order: persistedOrder/);
  assert.match(cart, /href="\/checkout\?startNew=1"/);
  assert.match(product, /router\.push\("\/checkout\?startNew=1", \{ scroll: false \}\)/);
});

test("a changed cart starts a new session, while an unchanged unfinished checkout remains resumable", () => {
  assert.match(checkout, /cartChangedSinceSaved = Boolean\(saved\.cartFingerprint && saved\.cartFingerprint !== currentCartFingerprint\)/);
  assert.match(checkout, /cartFingerprint\?: string/);
  assert.match(checkout, /if \(saved\.sessionId\) setCheckoutSessionId\(saved\.sessionId\)/);
  assert.match(checkout, /if \(saved\.contact\?\.email !== undefined\) setContact/);
  assert.match(checkout, /if \(saved\.shipping\) setShipping/);
  assert.match(checkout, /if \(saved\.shippingMethodId && shippingMethods\.some/);
});

test("restarting after a completed order clears old customer fields but retains incomplete checkout data", () => {
  assert.match(checkout, /const nextContact = hasCompletedOrder\s*\? \{ email: "" \}/);
  assert.match(checkout, /const nextShipping = hasCompletedOrder\s*\? createEmptyShippingForm\(\)/);
  assert.match(checkout, /function createEmptyShippingForm\(\): ShippingForm/);
  assert.match(checkout, /: saved\.contact\?\.email !== undefined\s*\? \{ email: saved\.contact\.email \}\s*: contact/);
  assert.match(checkout, /: saved\.shipping \?\? shipping/);
  assert.doesNotMatch(checkout, /removeItem\(getOrderAccessTokenStorageKey/);
});
