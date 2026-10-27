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

test("legacy payment-help URL keeps its self-canonical route with current order-support copy", () => {
  assert.match(paymentHelp, /path:\s*"\/bank-transfer-payment-help"/);
  assert.match(paymentHelp, /title:\s*"Order and Payment Help \| CNFans UK"/);
  assert.match(paymentHelp, /<h1>Order and Payment Help<\/h1>/);
  assert.match(paymentHelp, /description:\s*"[^"]+"/);
  assert.doesNotMatch(paymentHelp, /noindex|robots:\s*\{\s*index:\s*false/i);
  assert.match(sitemap, /"\/bank-transfer-payment-help"/);
  assert.equal((sitemap.match(/"\/bank-transfer-payment-help"/g) || []).length, 1);
});

test("payment help reflects the paused online payment flow and safe support guidance", () => {
  const content = paymentHelp.replace(/\s+/g, " ");
  assert.match(content, /Online payment through the website is temporarily unavailable/i);
  assert.match(content, /does not take payment/i);
  assert.match(content, /Do not send another payment/i);
  assert.match(content, /What if I have already made a payment/i);
  assert.match(content, /order number/i);
  assert.match(content, /full card details, bank login information, passwords/i);
  assert.doesNotMatch(content, /Stripe|Stripe Checkout|bank transfer instructions/i);
  assert.doesNotMatch(content, /"@type"\s*:\s*"(?:FAQPage|AggregateRating|Review)"/);
});

test("support cluster links are contextual and preserve each page's primary intent", () => {
  assert.match(howToOrder, /<h2>Confirming your order<\/h2>/);
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
