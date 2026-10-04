import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const paymentHelp = read("app/bank-transfer-payment-help/page.tsx");
const howToOrder = read("app/how-to-order/page.tsx");
const delivery = read("app/delivery/page.tsx");
const trackOrder = read("app/track-order/page.tsx");
const returns = read("app/returns/page.tsx");
const sitemap = read("app/sitemap.ts");

test("bank transfer help route has the approved SEO metadata and self-canonical path", () => {
  assert.match(paymentHelp, /path:\s*"\/bank-transfer-payment-help"/);
  assert.match(paymentHelp, /title:\s*"Bank Transfer Payment Help \| CNFans UK"/);
  assert.match(paymentHelp, /<h1>Bank Transfer Payment Help<\/h1>/);
  assert.match(paymentHelp, /description:\s*"[^"]+"/);
  assert.doesNotMatch(paymentHelp, /noindex|robots:\s*\{\s*index:\s*false/i);
  assert.match(sitemap, /"\/bank-transfer-payment-help"/);
  assert.equal((sitemap.match(/"\/bank-transfer-payment-help"/g) || []).length, 1);
});

test("payment help distinguishes submitted from confirmed and gives safe pending-payment guidance", () => {
  const content = paymentHelp.replace(/\s+/g, " ");
  assert.match(content, /Payment submitted.*not confirmation that funds arrived/i);
  assert.match(content, /do not pay again/i);
  assert.match(content, /fixed update time/i);
  assert.match(content, /If you closed the Stripe page/);
  assert.match(content, /order number/i);
  assert.match(content, /full card details, bank login information or passwords/i);
  assert.doesNotMatch(content, /Stripe will return you automatically|automatically returns you to CNFans/i);
  assert.doesNotMatch(content, /within \d+ (minutes|hours|days)/i);
  assert.doesNotMatch(content, /FAQPage|AggregateRating|Review/);
});

test("support cluster links are contextual and preserve each page's primary intent", () => {
  assert.match(howToOrder, /<h2>Payment help after checkout<\/h2>/);
  assert.match(howToOrder, /href="\/bank-transfer-payment-help"/);
  assert.match(delivery, /<h2>Tracking has not updated<\/h2>/);
  assert.match(delivery, /href="\/track-order"/);
  assert.match(trackOrder, /Order status and tracking status/);
  assert.match(trackOrder, /Order created, Awaiting payment, Payment submitted, Payment confirmed or Cancelled/);
  assert.match(trackOrder, /href="\/delivery"/);
  assert.match(trackOrder, /href="\/how-to-order"/);
  assert.match(trackOrder, /href="\/bank-transfer-payment-help"/);
  assert.match(returns, /Before contacting us/);
  assert.match(returns, /href="\/contact"/);
  assert.match(returns, /href="\/delivery"/);
});

test("returns policy text and routes are retained while adding issue-preparation guidance", () => {
  assert.match(returns, /Contact us within 14 days of delivery/);
  assert.match(returns, /return shipping may be the customer's responsibility/);
  assert.match(returns, /Before contacting us/);
  assert.match(returns, /wrong size/i);
  assert.match(returns, /damaged item/i);
  assert.match(returns, /missing from your delivery/i);
});
