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

test("policy pages have their own canonical metadata and required headings", () => {
  assert.match(pages.privacy, /title: \{ absolute: "Privacy Policy \| CNFans UK" \}/);
  assert.match(pages.privacy, /canonical: `\$\{SITE_URL\}\/privacy-policy`/);
  assert.match(pages.privacy, /<h1 id="privacy-policy-title">Privacy Policy<\/h1>/);
  assert.match(pages.privacy, /Google Analytics|Google Tag Manager/);
  assert.match(pages.privacy, /Meta Pixel/);

  assert.match(pages.terms, /title: \{ absolute: "Terms & Conditions \| CNFans UK" \}/);
  assert.match(pages.terms, /canonical: `\$\{SITE_URL\}\/terms`/);
  assert.match(pages.terms, /<h1 id="terms-title">Terms &amp; Conditions<\/h1>/);
  assert.match(pages.terms, /href="\/delivery"/);
  assert.match(pages.terms, /href="\/returns"/);
  assert.match(pages.terms, /href="\/size-guide"/);

  assert.match(pages.payment, /title: \{ absolute: "Payment & Security \| CNFans UK" \}/);
  assert.match(pages.payment, /canonical: `\$\{SITE_URL\}\/payment-security`/);
  assert.match(pages.payment, /<h1 id="payment-security-title">Payment &amp; Security<\/h1>/);
  assert.match(pages.payment, /Stripe Hosted Checkout/);
  assert.match(pages.payment, /order details with you on WhatsApp before processing/);
});

test("Stripe privacy links use the official host and safe new-tab attributes", () => {
  for (const source of [pages.privacy, pages.payment]) {
    assert.match(source, /href="https:\/\/stripe\.com\/privacy" target="_blank" rel="noopener noreferrer"/);
  }
});
