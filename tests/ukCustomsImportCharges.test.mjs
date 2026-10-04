import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const page = read("app/uk-customs-and-import-charges/page.tsx");
const delivery = read("app/delivery/page.tsx");
const howToOrder = read("app/how-to-order/page.tsx");
const sitemap = read("app/sitemap.ts");

test("UK customs support route has the requested metadata, heading and sitemap entry", () => {
  assert.match(page, /path:\s*"\/uk-customs-and-import-charges"/);
  assert.match(page, /title:\s*"UK Customs & Import Charges \| CNFans UK"/);
  assert.match(page, /<h1>UK Customs &amp; Import Charges<\/h1>/);
  assert.match(page, /description:\s*"Learn what to expect about customs and import charges/);
  assert.match(page, /buildGuideMetadata/);
  assert.doesNotMatch(page, /noindex|robots:\s*\{\s*index:\s*false/i);
  assert.equal((sitemap.match(/"\/uk-customs-and-import-charges"/g) || []).length, 1);
});

test("page states only the current UK delivery experience and avoids unsupported tax or customs claims", () => {
  assert.match(page, /current delivery process/);
  assert.match(page, /customers are\s+not asked to pay additional customs or import charges when their order is delivered/i);
  assert.match(page, /not normally requested from customers at delivery/i);
  assert.match(page, /not general tax or customs advice/i);

  const prohibitedClaims = [
    /\btax[ -]?free\b/i,
    /\bVAT[ -]?free\b/i,
    /\bno VAT\b/i,
    /£\s*135/i,
    /\bunder\s+135\b/i,
    /\bcustoms exempt\b/i,
    /\bavoid(?:ing)? customs\b/i,
    /\bdeclare(?:d)? lower\b/i,
    /\blower declaration\b/i,
    /\bguaranteed no tax\b/i,
    /\bduty[ -]?free\b/i,
  ];
  for (const claim of prohibitedClaims) assert.doesNotMatch(page, claim);
});

test("customs page and delivery page link within the existing support cluster", () => {
  assert.match(page, /href="\/delivery"/);
  assert.match(page, /href="\/how-to-order"/);
  assert.match(page, /href="\/contact"/);
  assert.match(delivery, /href="\/uk-customs-and-import-charges"/);
});

test("customs support page remains static and payment/checkout implementation stays out of scope", () => {
  assert.doesNotMatch(page, /"use client"|\bfetch\s*\(|\/api\/|stripe/i);
  assert.doesNotMatch(howToOrder, /uk-customs-and-import-charges/);
});
