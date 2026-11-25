import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const loadedModule = { exports: {} };
vm.runInNewContext(ts.transpile(read("lib/blackFriday.ts"), { module: ts.ModuleKind.CommonJS }), {
  module: loadedModule,
  exports: loadedModule.exports,
  Date,
  Number,
});
const { BLACK_FRIDAY, isBlackFridayActiveAt, isBlackFridayOrderEligible, blackFridayDiscount, blackFridayClaimMessage } = loadedModule.exports;

test("Black Friday uses London GMT start and exclusive end boundaries", () => {
  assert.equal(BLACK_FRIDAY.startMs, Date.parse("2026-11-24T00:00:00Z"));
  assert.equal(BLACK_FRIDAY.endMs, Date.parse("2026-12-01T00:00:00Z"));
  assert.equal(isBlackFridayActiveAt(BLACK_FRIDAY.startMs - 1), false);
  assert.equal(isBlackFridayActiveAt(BLACK_FRIDAY.startMs), true);
  assert.equal(isBlackFridayActiveAt(BLACK_FRIDAY.endMs - 1), true);
  assert.equal(isBlackFridayActiveAt(BLACK_FRIDAY.endMs), false);
});

test("offer adds only the highest threshold, excludes USD and caps at merchandise value", () => {
  for (const currency of ["GBP", "EUR"]) {
    assert.equal(blackFridayDiscount(4, currency), 4);
    assert.equal(blackFridayDiscount(50, currency), 5);
    assert.equal(blackFridayDiscount(99.99, currency), 5);
    assert.equal(blackFridayDiscount(100, currency), 10);
    assert.equal(blackFridayDiscount(200, currency), 15);
    assert.equal(blackFridayDiscount(300, currency), 25);
  }
  assert.equal(blackFridayDiscount(500, "USD"), 0);
});

test("order eligibility uses immutable creation time and pending payment state, not viewing time", () => {
  const base = { createdAt: "2026-11-24 00:00:00", currency: "GBP", status: "pending" };
  assert.equal(isBlackFridayOrderEligible(base), true);
  assert.equal(isBlackFridayOrderEligible({ ...base, createdAt: "2026-11-30 23:59:59", paymentStage: "awaiting_payment" }), true);
  assert.equal(isBlackFridayOrderEligible({ ...base, createdAt: "2026-12-01 00:00:00" }), false);
  assert.equal(isBlackFridayOrderEligible({ ...base, createdAt: "2026-11-23 23:59:59" }), false);
  assert.equal(isBlackFridayOrderEligible({ ...base, currency: "USD" }), false);
  assert.equal(isBlackFridayOrderEligible({ ...base, createdAt: null }), false);
  for (const paymentStage of ["payment_submitted", "payment_confirmed", "cancelled"]) {
    assert.equal(isBlackFridayOrderEligible({ ...base, paymentStage }), false);
  }
  for (const status of ["payment_submitted", "paid", "cancelled"]) {
    assert.equal(isBlackFridayOrderEligible({ ...base, status, paymentStage: "created" }), false);
  }
});

test("all campaign surfaces share the same rule and keep the original order totals", () => {
  const home = read("components/BlackFridayCampaign.tsx");
  const cart = read("components/BlackFridayCartNotice.tsx");
  const checkout = read("components/CheckoutFlow.tsx");
  const styles = read("app/globals.css");
  const receipt = read("components/OrderConfirmationDetails.tsx");
  const orderRoute = read("app/api/orders/[orderNumber]/confirmation/route.ts");
  assert.match(home, /useBlackFridayActive\(initialActive\)/);
  assert.match(read("app/page.tsx"), /initialActive=\{isBlackFridayActiveAt\(Date\.now\(\)\)\}/);
  assert.match(home, /prefetch=\{false\}/);
  assert.match(home, /className="bf-campaign-inner wrap"/);
  assert.match(styles, /\.bf-campaign\s*\{[^}]*width:\s*100%[^}]*background:\s*#191917/);
  assert.match(styles, /\.cart-drawer \.bf-cart-notice\s*\{[^}]*width:\s*100%[^}]*margin:\s*0 0 8px[^}]*background:\s*#191917[^}]*box-shadow:\s*16px 0 0 #191917, -16px 0 0 #191917/);
  assert.match(cart, /useBlackFridayActive\(\)/);
  assert.match(cart, /currency === "USD"/);
  assert.match(checkout, /isBlackFridayOrderEligible\(order\)/);
  assert.match(checkout, /blackFridayClaimMessage\(order\.orderNumber\)/);
  assert.match(checkout, /<span>TOTAL<\/span>/);
  assert.match(checkout, /Before Black Friday discount/);
  assert.match(checkout, /blackFridayEligible \? "checkout-received-card checkout-received-card-bf" : "checkout-received-card"/);
  assert.match(checkout, /bf-mobile-fixed-claim/);
  assert.match(checkout, /Claim Discount on WhatsApp/);
  assert.match(styles, /\.checkout-order-received \.bf-mobile-fixed-claim\s*\{\s*position:\s*fixed/);
  assert.match(styles, /@media \(min-width: 601px\)\s*\{\s*\.checkout-order-received \.bf-mobile-fixed-claim\s*\{\s*display:\s*none/);
  assert.match(styles, /@media \(max-width: 600px\)\s*\{[\s\S]*?\.checkout-order-received \.bf-desktop-claim\s*\{\s*display:\s*none/);
  assert.match(styles, /\.checkout-received-card-bf > div\s*\{\s*align-items:\s*center/);
  assert.match(styles, /\.checkout-received-card-bf > div:nth-child\(2\) strong\s*\{[^}]*align-items:\s*flex-start[^}]*text-align:\s*left/);
  assert.match(styles, /\.bf-order-offer-inner\s*\{[^}]*width:\s*min\(100%, 780px\)/);
  assert.match(read("components/BlackFridayOrderOffer.tsx"), /Your order qualifies for our Black Friday offer/);
  assert.match(receipt, /isBlackFridayOrderEligible\(order\)/);
  assert.match(receipt, /blackFridayClaimMessage\(orderNumber\)/);
  assert.match(orderRoute, /createdAt: order\.created_at \|\| null/);
  assert.match(checkout, /const summaryTotal = order \? order\.finalTotal : total/);
  assert.equal(blackFridayClaimMessage("#CNF-TEST-01"), "Hi, I've just placed order #CNF-TEST-01 and would like to claim my Black Friday discount. Could you please confirm my final total before payment? Thank you!");
});
