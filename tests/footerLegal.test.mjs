import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(projectRoot, file), "utf8");
const footer = read("components/Footer.tsx");
const pages = {
  privacy: read("app/privacy-policy/page.tsx"),
  terms: read("app/terms/page.tsx"),
  payment: read("app/payment-security/page.tsx"),
};

test("footer keeps its navigation and legal links while temporarily hiding payment messaging and marks", () => {
  for (const label of ["Shop", "Support", "Follow", "Company"]) assert.match(footer, new RegExp(`aria-label="${label}"`));
  assert.match(footer, /FooterBrand/);
  const footerBrand = read("components/FooterBrand.tsx");
  assert.match(footerBrand, /"CNFANS UK"/);
  assert.match(footerBrand, /CNFans <span>UK<\/span>/);
  assert.match(footer, /href="\/privacy-policy"/);
  assert.match(footer, /href="\/terms"/);
  assert.match(footer, /href="\/payment-security"/);
  assert.match(footer, /aria-label="Legal"/);
  assert.doesNotMatch(footer, /Payments processed securely by Stripe|foot-payment-logos|payment-methods\//);
});

test("sitemap includes each of the three policy URLs exactly once", () => {
  const sitemap = read("app/sitemap.ts");
  for (const route of ["/privacy-policy", "/terms", "/payment-security"]) {
    assert.equal(sitemap.split(`"${route}"`).length - 1, 1, `${route} should be listed once`);
  }
  assert.match(sitemap, /const publicPages: MetadataRoute\.Sitemap = \[\.\.\.PUBLIC_PATHS, \.\.\.indexableSubcategoryPaths\]/);
});

test("retained payment artwork assets contain no executable or external SVG content", () => {
  for (const name of ["visa", "mastercard", "apple-pay"]) {
    const svg = read(`public/payment-methods/${name}.svg`);
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b|\son[a-z]+\s*=|(?:href|src)\s*=|url\s*\(|@import/i);
  }
});

test("policy pages retain their canonical metadata and describe the current order flow", () => {
  assert.match(pages.privacy, /title: \{ absolute: "Privacy Policy \| CNFans UK" \}/);
  assert.match(pages.privacy, /canonical: `\$\{SITE_URL\}\/privacy-policy`/);
  assert.match(pages.privacy, /<h1 id="privacy-policy-title">Privacy Policy<\/h1>/);
  assert.match(pages.privacy, /Google Analytics|Google Tag Manager/);
  assert.match(pages.privacy, /Meta Pixel/);
  assert.match(pages.privacy, /6\. Newsletter subscriptions/);
  assert.match(pages.privacy, /not\s+pre-ticked/);
  assert.match(pages.privacy, /directly to the CNFans Newsletter list/);
  assert.match(pages.privacy, /not send a confirmation email or require a confirmation link/);
  assert.match(pages.privacy, /OPT_IN contact attribute/);
  assert.match(pages.privacy, /form-submission event logs identify the form and submission time/);
  assert.doesNotMatch(pages.privacy, /double opt-in/i);
  assert.match(pages.privacy, /Brevo provides the newsletter form and email delivery service/);
  assert.match(pages.privacy, /unsubscribe at any time/);
  assert.match(pages.privacy, /Data Processing Agreement/);
  assert.match(pages.privacy, /do not specify a fixed retention period/);
  assert.match(pages.privacy, /restrict or object to certain processing/);
  assert.match(pages.privacy, /CNFANS TRADING LTD/);
  assert.match(pages.privacy, /mailto:support@cnfans\.co\.uk/);
  assert.match(pages.privacy, /298 Stattler Attercliffe Rd/);
  assert.match(pages.privacy, /Sheffield/);
  assert.match(pages.privacy, /S4 7WZ/);
  assert.doesNotMatch(pages.privacy, /dayu70001@gmail\.com|Paris/i);

  assert.match(pages.terms, /title: \{ absolute: "Terms & Conditions \| CNFans UK" \}/);
  assert.match(pages.terms, /canonical: `\$\{SITE_URL\}\/terms`/);
  assert.match(pages.terms, /<h1 id="terms-title">Terms &amp; Conditions<\/h1>/);
  assert.match(pages.terms, /href="\/delivery"/);
  assert.match(pages.terms, /href="\/returns"/);
  assert.match(pages.terms, /href="\/size-guide"/);

  assert.match(pages.payment, /title: \{ absolute: "Payment & Security \| CNFans UK" \}/);
  assert.match(pages.payment, /canonical: `\$\{SITE_URL\}\/payment-security`/);
  assert.match(pages.payment, /<h1 id="payment-security-title">Payment &amp; Security<\/h1>/);
  assert.match(pages.payment, /Online payment through the website is temporarily unavailable/);
  assert.match(pages.payment, /order details with you on WhatsApp before processing/);
  assert.match(pages.privacy, /Online payment through the website is temporarily unavailable/);
  assert.match(pages.terms, /submitting an order does not take payment/);
});

test("public payment information no longer claims that Stripe processes current payments", () => {
  for (const source of [pages.privacy, pages.terms, pages.payment]) assert.doesNotMatch(source, /Stripe|stripe\.com/i);
});
